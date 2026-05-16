import express from 'express';
import axios from 'axios';
import retryAfter from 'axios-retry-after';
import PQueue from 'p-queue';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { asyncHandler } from '../middleware/requestContext.js';
import {
    createUser,
    updateUser,
    assignStudentsToSf,
    assignStudentsToRsf,
} from '../controllers/userController.js';
import config from '../config/env.js';

const router = express.Router();
const CACHE_TTL = 3 * 3600 * 1000;
const VALID_ROLES = ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'];

const client = axios.create();
client.interceptors.response.use(
    null,
    retryAfter(client, {
        isRetryable: (error) =>
            error.response?.status === 429 &&
            error.config?.method?.toLowerCase() === 'get',
    }),
);

const API_URL = 'https://api.thinkific.com/api/public/v1';

const thinkificCache = {
    timestamp: 0,
    users: [],
    isRefreshing: false,
    queue: [],
};

function mapThinkificUser(tUser) {
    const roles = tUser.role
        ? tUser.role.split(',').map((r) => r.trim()).filter((r) => VALID_ROLES.includes(r))
        : ['student'];
    return {
        email: tUser.email,
        thinkificId: tUser.id ? String(tUser.id) : null,
        firstName: tUser.first_name,
        lastName: tUser.last_name,
        roles: roles.length ? roles : ['student'],
    };
}

async function fetchPaginatedUsersParallel() {
    const perPage = 200;
    const firstPageResp = await client.get(`${API_URL}/users`, {
        params: { page: 1, limit: perPage },
        headers: {
            'X-Auth-API-Key': process.env.THINKIFIC_API_TOKEN,
            'X-Auth-Subdomain': config.THINKIFIC.SUBDOMAIN,
        },
    });
    const total = firstPageResp.data.meta?.total || firstPageResp.data.items.length;
    const totalPages = Math.ceil(total / perPage);
    const allUsers = [...firstPageResp.data.items];
    if (totalPages <= 1) return allUsers;

    const queue = new PQueue({ concurrency: 5 });
    const promises = [];
    for (let page = 2; page <= totalPages; page++) {
        promises.push(
            queue.add(async () => {
                try {
                    const resp = await client.get(`${API_URL}/users`, {
                        params: { page, limit: perPage },
                        headers: {
                            'X-Auth-API-Key': process.env.THINKIFIC_API_TOKEN,
                            'X-Auth-Subdomain': config.THINKIFIC.SUBDOMAIN,
                        },
                    });
                    return resp.data.items;
                } catch (err) {
                    if (err.response?.status === 429) {
                        const retryDelay = parseInt(err.response.headers['retry-after']) || 5;
                        logger.warn({ retryDelay }, 'Thinkific rate limited');
                        await new Promise((resolve) => setTimeout(resolve, retryDelay * 1000));
                        return [];
                    }
                    throw err;
                }
            }),
        );
    }
    const results = await Promise.all(promises);
    for (const items of results) {
        allUsers.push(...items);
    }
    return allUsers;
}

async function bulkUpsertUsers(apiUsers) {
    for (const apiUser of apiUsers) {
        if (!apiUser.id || !apiUser.email) continue;
        const mapped = mapThinkificUser(apiUser);
        try {
            await prisma.user.upsert({
                where: { thinkificId: mapped.thinkificId },
                update: {
                    email: mapped.email,
                    firstName: mapped.firstName,
                    lastName: mapped.lastName,
                    lastSyncAt: new Date(),
                },
                create: {
                    thinkificId: mapped.thinkificId,
                    email: mapped.email,
                    firstName: mapped.firstName,
                    lastName: mapped.lastName,
                    roles: mapped.roles,
                    lastSyncAt: new Date(),
                },
            });
        } catch (err) {
            logger.warn({ err: err.message, email: mapped.email }, 'bulk upsert user failed');
        }
    }
}

async function getThinkificUsers() {
    const now = Date.now();
    if (now - thinkificCache.timestamp < CACHE_TTL) return thinkificCache.users;

    if (thinkificCache.isRefreshing) {
        return new Promise((resolve) => thinkificCache.queue.push(resolve));
    }

    try {
        thinkificCache.isRefreshing = true;
        const apiUsers = await fetchPaginatedUsersParallel();

        thinkificCache.users = apiUsers;
        thinkificCache.timestamp = Date.now();
        await bulkUpsertUsers(apiUsers);

        thinkificCache.queue.forEach((resolve) => resolve(apiUsers));
        thinkificCache.queue = [];

        return apiUsers;
    } finally {
        thinkificCache.isRefreshing = false;
    }
}

setInterval(async () => {
    if (
        !thinkificCache.isRefreshing &&
        Date.now() - thinkificCache.timestamp > CACHE_TTL * 0.9
    ) {
        try {
            await getThinkificUsers();
        } catch (err) {
            logger.error({ err }, 'background Thinkific sync failed');
        }
    }
}, 5 * 60 * 1000);

router.post('/', createUser);
router.put('/:id', updateUser);

router.get(
    '/',
    asyncHandler(async (req, res) => {
        const { roles, page = 1, limit = 25, search = '' } = req.query;
        try {
            await getThinkificUsers();
        } catch (err) {
            logger.warn({ err: err.message }, 'thinkific pre-sync failed, continuing with DB only');
        }

        const where = {};
        if (roles) {
            const list = roles.split(',').map((r) => r.trim()).filter((r) => VALID_ROLES.includes(r));
            if (list.length) where.roles = { hasSome: list };
        }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    thinkificId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roles: true,
                    whatsappNumber: true,
                    city: true,
                    country: true,
                    iccMember: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: users,
            total,
            page: pageNum,
            pageSize: limitNum,
        });
    }),
);

router.patch('/:sfId/students', assignStudentsToSf);
router.patch('/:rsfId/studentsRsf', assignStudentsToRsf);

export default router;
