import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import User from '../models/User.js';
import { ProxyService } from '../services/ProxyService.js';
import axios from 'axios';
import retryAfter from 'axios-retry-after';
import { isAuthenticated, isAdmin, isCoordinator } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const CACHE_TTL = 3 * 3600 * 1000; // 1 hour in milliseconds

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
        const apiUsers = await fetchPaginatedUsers();
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

async function fetchPaginatedUsers() {
    let allUsers = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        try {
            const response = await client.get('https://api.thinkific.com/api/public/v1/users', {
                params: { page, limit: perPage },
                headers: {
                    'X-Auth-API-Key': process.env.THINKIFIC_API_TOKEN,
                    'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN
                }
            });

            allUsers = [...allUsers, ...response.data.items];

            if (response.data.items.length < perPage) break;
            page++;

            // Rate limit handling
            const remaining = parseInt(response.headers['x-ratelimit-remaining-minute']) || 20;
            if (remaining < 5) await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
            if (err.response?.status === 429) {
                const retryAfter = parseInt(err.response.headers['retry-after']) || 5;
                console.log(`Rate limited. Waiting ${retryAfter}s...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            throw err;
        }
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
    const bulkOps = users.map(user => ({
        updateOne: {
            filter: { thinkificId: user.thinkificId },
            update: { $set: user },
            upsert: true
        }
    }));

    await User.bulkWrite(bulkOps, { ordered: false });
}

// Helper: Map Thinkific user to local User model
function mapThinkificUser(tUser) {
    const customFields = {};
    (tUser.custom_profile_fields || []).forEach(f => {
        customFields[f.label.toLowerCase()] = f.value;
    });
    const roles = tUser.role ? tUser.role.split(',').map(r => r.trim()) : ['student'];
    console.log('thinkific user',tUser);
    return {
        email: tUser.email,
        thinkificId: tUser.id?.toString() || null,
        firstName: tUser.first_name,
        lastName: tUser.last_name,
        roles,
        password: '', // Or generate a random one if needed
        requiresPasswordReset: true
    };
}

// GET /api/v1/users?roles=admin,teacher
// Enhanced GET endpoint with pagination and search
router.get('/', async (req, res) => {
    try {
        const { roles, page = 1, limit = 25, search = '' } = req.query;
        const filter = {};

        // Sync with Thinkific first
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

        // Validate pagination parameters
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

// Optimized bulk upload with transaction support
router.post('/bulk', upload.single('file'), async (req, res) => {
    const results = [];
    const errors = [];
    const proxyService = new ProxyService();
    const session = await User.startSession();

    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    try {
        session.startTransaction();
        const stream = require('fs').createReadStream(req.file.path).pipe(csvParser());

        for await (const row of stream) {
            try {
                const { email, firstName, lastName, roles } = row;
                if (!email || !roles) throw new Error('Email and roles required');

                const roleArr = roles.split(',').map(r => r.trim());
                if (!validateRoles(roleArr)) throw new Error('Invalid roles: ' + roles);

                const user = await User.findOneAndUpdate(
                    { email },
                    { $set: { firstName, lastName, roles: roleArr } },
                    { upsert: true, new: true, session }
                );

                await proxyService.assignProxies(user._id, roleArr);
                results.push({ email, status: 'ok' });
            } catch (err) {
                errors.push({ row, error: err.message });
            }
        }

        await session.commitTransaction();
        res.json({ success: true, inserted: results, errors });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: err.message });
    } finally {
        session.endSession();
        require('fs').unlinkSync(req.file.path); // Cleanup file
    }
});


// POST /api/users (manual add)
router.post('/',  async (req, res) => {
    try {
        const { email, firstName, lastName, roles = [] } = req.body;
        if (!email || !roles.length) throw new Error('Email and roles required');
        if (!validateRoles(roles)) throw new Error('Invalid roles');
        const user = await User.create({ email, firstName, lastName, roles });

        // Assign proxies
        const proxyService = new ProxyService();
        await proxyService.assignProxies(user._id, roles);

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Protected PUT endpoint (Admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { firstName, lastName, roles } = req.body;
        if (!validateRoles(roles)) throw new Error('Invalid roles');

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { firstName, lastName, roles } },
            { new: true }
        );

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});


// Protected POST attendance (Coordinator only)
router.post('/:id/attendance', isAuthenticated, isCoordinator, async (req, res) => {
    try {
        const { date, present } = req.body;
        if (!date) throw new Error('Date is required');

        const attendance = await Attendance.findOneAndUpdate(
            { user: req.params.id, date },
            { $set: { present } },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: attendance });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});



export default router;
