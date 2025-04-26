import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import User from '../models/User.js';
import { ProxyService } from '../services/ProxyService.js';
import axios from 'axios';
import retryAfter from 'axios-retry-after';
import PQueue from 'p-queue';
import { isAuthenticated, isAdmin, isCoordinator } from '../middleware/auth.js';
import {
    createUser,
    updateUser
} from '../controllers/userController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const CACHE_TTL = 3 * 3600 * 1000; // 3 hours

const VALID_ROLES = ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'traineeTeacher', 'student'];

function validateRoles(roles) {
    return roles.every(r => VALID_ROLES.includes(r));
}

// Configure axios-retry-after
const client = axios.create();
client.interceptors.response.use(null, retryAfter(client, {
    isRetryable: error =>
        error.response?.status === 429 &&
        error.config?.method?.toLowerCase() === 'get'
}));

const API_URL = 'https://api.thinkific.com/api/public/v1';

// Enhanced cache with TTL and database fallback
const thinkificCache = {
    timestamp: 0,
    users: [],
    isRefreshing: false,
    queue: []
};

async function getThinkificUsers() {
    const now = Date.now();

    // Return cached users if still valid
    if (now - thinkificCache.timestamp < CACHE_TTL) {
        return thinkificCache.users;
    }

    // Handle concurrent requests
    if (thinkificCache.isRefreshing) {
        return new Promise(resolve => thinkificCache.queue.push(resolve));
    }

    try {
        thinkificCache.isRefreshing = true;
        const apiUsers = await fetchPaginatedUsersParallel();
        const dbUsers = await User.find({ thinkificId: { $exists: true } });

        // Merge API users with database entries
        const mergedUsers = mergeUsers(apiUsers, dbUsers);

        // Update cache and database
        thinkificCache.users = mergedUsers;
        thinkificCache.timestamp = Date.now();
        await bulkUpsertUsers(mergedUsers);

        // Resolve queued requests
        thinkificCache.queue.forEach(resolve => resolve(mergedUsers));
        thinkificCache.queue = [];

        return mergedUsers;
    } finally {
        thinkificCache.isRefreshing = false;
    }
}

// Parallel paginated fetching using p-queue
async function fetchPaginatedUsersParallel() {
    const perPage = 200; // Max allowed by Thinkific API
    // First, get the first page to determine how many pages
    const firstPageResp = await client.get(`${API_URL}/users`, {
        params: { page: 1, limit: perPage },
        headers: {
            'X-Auth-API-Key': process.env.THINKIFIC_API_TOKEN,
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN
        }
    });
    const total = firstPageResp.data.meta?.total || (firstPageResp.data.items.length);
    const totalPages = Math.ceil(total / perPage);

    const allUsers = [...firstPageResp.data.items];

    if (totalPages <= 1) return allUsers;

    // Use PQueue to limit concurrency (avoid rate limits)
    const queue = new PQueue({ concurrency: 5 });
    const promises = [];
    for (let page = 2; page <= totalPages; page++) {
        promises.push(queue.add(async () => {
            try {
                const resp = await client.get(`${API_URL}/users`, {
                    params: { page, limit: perPage },
                    headers: {
                        'X-Auth-API-Key': process.env.THINKIFIC_API_TOKEN,
                        'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN
                    }
                });
                return resp.data.items;
            } catch (err) {
                if (err.response?.status === 429) {
                    const retryAfter = parseInt(err.response.headers['retry-after']) || 5;
                    console.log(`Rate limited. Waiting ${retryAfter}s...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    return [];
                }
                throw err;
            }
        }));
    }
    const results = await Promise.all(promises);
    for (const items of results) {
        allUsers.push(...items);
    }
    return allUsers;
}

function mergeUsers(apiUsers, dbUsers) {
    const dbMap = new Map(dbUsers.map(u => [u.thinkificId, u]));
    return apiUsers.map(apiUser => {
        const dbUser = dbMap.get(apiUser.id?.toString());
        return dbUser ? dbUser.toObject() : mapThinkificUser(apiUser);
    });
}

async function bulkUpsertUsers(users) {
    const bulkOps = [];
    for (const user of users) {
        bulkOps.push({
            updateOne: {
                filter: { thinkificId: user.thinkificId },
                update: { $set: user },
                upsert: true
            }
        });
        if (bulkOps.length % 500 === 0) {
            await User.bulkWrite(bulkOps, { ordered: false });
            bulkOps.length = 0;
        }
    }
    if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps, { ordered: false });
    }
}

function mapThinkificUser(tUser) {
    const roles = tUser.role ? tUser.role.split(',').map(r => r.trim()) : ['student'];
    return {
        email: tUser.email,
        thinkificId: tUser.id?.toString() || null,
        firstName: tUser.first_name,
        lastName: tUser.last_name,
        roles,
        password: '',
        requiresPasswordReset: true
    };
}

// Background cache refresh (proactive)
setInterval(async () => {
    if (!thinkificCache.isRefreshing && Date.now() - thinkificCache.timestamp > CACHE_TTL * 0.9) {
        try {
            await getThinkificUsers();
        } catch (e) {
            console.error('Background Thinkific sync failed:', e);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

// --- PUBLIC ROUTES ---

// Create a new user (PUBLIC)
router.post('/', createUser);

// Update an existing user (PUBLIC)
router.put('/:id', updateUser);

// GET /api/v1/users?roles=admin,teacher
router.get('/', async (req, res) => {
    try {
        const { roles, page = 1, limit = 25, search = '' } = req.query;
        const filter = {};
        // Sync with Thinkific first (now fast!)
        await getThinkificUsers();

        // Build filter
        if (roles) filter.roles = { $in: roles.split(',') };
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page)) || 1;
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 25;
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: users,
            total,
            page: pageNum,
            pageSize: limitNum
        });
    } catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
