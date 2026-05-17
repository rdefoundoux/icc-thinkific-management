import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { BadRequest, Unauthorized, NotFound } from '../lib/errors.js';
import { asyncHandler } from '../middleware/requestContext.js';
import { validate } from '../middleware/validate.js';
import config from '../config/env.js';

const router = express.Router();

const THINKIFIC_GRAPHQL_ENDPOINT = 'https://api.thinkific.com/stable/graphql';
const SALT_ROUNDS = 12;
const OTP_SERVICE_URL = process.env.OTP_SERVICE_URL || 'https://localhost:3015';

const ROLE_VALUES = ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'];

function normaliseRoles(rawRoles) {
    if (!rawRoles) return ['student'];
    const list = Array.isArray(rawRoles)
        ? rawRoles
        : String(rawRoles).split(',').map((r) => r.trim());
    const filtered = list.filter((r) => ROLE_VALUES.includes(r));
    return filtered.length ? filtered : ['student'];
}

async function fetchThinkificUserByEmail(email) {
    const response = await axios.post(
        THINKIFIC_GRAPHQL_ENDPOINT,
        {
            query: `query GetUserByEmail($email: EmailAddress!) {
                userByEmail(email: $email) {
                  id
                  email
                  firstName
                  lastName
                  customProfileFields(first: 50) {
                    edges { node { value label } }
                  }
                }
              }`,
            variables: { email },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.THINKIFIC_API2_TOKEN}`,
                'X-Auth-Subdomain': config.THINKIFIC.SUBDOMAIN,
                'Content-Type': 'application/json',
            },
        },
    );

    if (response.data.errors) {
        logger.warn({ errors: response.data.errors }, 'Thinkific GraphQL error');
        throw BadRequest(response.data.errors.map((e) => e.message).join(', '));
    }
    return response.data.data.userByEmail;
}

function customFieldsToObject(thinkificUser) {
    return thinkificUser.customProfileFields.edges.reduce((acc, { node }) => {
        if (node.label) acc[node.label.toLowerCase()] = node.value;
        return acc;
    }, {});
}

async function generateOTP(email) {
    const response = await axios.post(`${OTP_SERVICE_URL}/api/otp/generate`, {
        email,
        type: 'numeric',
        organization: 'PCNC Academy',
        subject: 'Your Verification Code',
    });
    return response.data;
}

async function verifyOTP(email, otp) {
    const response = await axios.post(`${OTP_SERVICE_URL}/api/otp/verify`, {
        email,
        otp,
    });
    return response.status === 200 && response.data.message === 'OTP is verified';
}

function formatUserResponse(user) {
    return {
        _id: user.id,
        id: user.thinkificId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
    };
}

function persistUserSession(req, user) {
    req.session.user = {
        id: user.id,
        _id: user.id,
        email: user.email,
        roles: user.roles,
        thinkificId: user.thinkificId,
    };
}

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().optional(),
    otp: z.union([z.string(), z.number()]).optional(),
});

router.post(
    '/login',
    validate({ body: loginSchema }),
    asyncHandler(async (req, res) => {
        const { email, password, otp } = req.validatedBody;
        const emailNorm = email.trim().toLowerCase();

        const existing = await prisma.user.findUnique({ where: { email: emailNorm } });

        if (existing?.password) {
            if (!password) throw BadRequest('Password required');
            const valid = await bcrypt.compare(password, existing.password);
            if (!valid) throw Unauthorized('Invalid credentials');

            await prisma.user.update({
                where: { id: existing.id },
                data: { lastLogin: new Date() },
            });
            persistUserSession(req, existing);
            return res.json({ success: true, user: formatUserResponse(existing) });
        }

        // OTP verification: either existing user without password, or new user.
        if (otp) {
            const isValidOtp = await verifyOTP(emailNorm, String(otp).trim());
            if (!isValidOtp) throw Unauthorized('Invalid OTP');

            if (!password || password.length < 8) {
                throw BadRequest('Password must be at least 8 characters');
            }

            const thinkificUser = await fetchThinkificUserByEmail(emailNorm);
            if (!thinkificUser) throw NotFound('User not found');

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const customFields = customFieldsToObject(thinkificUser);
            const roles = normaliseRoles(customFields.role);

            const user = await prisma.user.upsert({
                where: { email: emailNorm },
                update: {
                    password: hashedPassword,
                    firstName: thinkificUser.firstName,
                    lastName: thinkificUser.lastName,
                    thinkificId: String(thinkificUser.id),
                    lastLogin: new Date(),
                },
                create: {
                    email: emailNorm,
                    password: hashedPassword,
                    firstName: thinkificUser.firstName,
                    lastName: thinkificUser.lastName,
                    thinkificId: String(thinkificUser.id),
                    roles,
                    lastLogin: new Date(),
                },
            });

            persistUserSession(req, user);
            return res.json({ success: true, user: formatUserResponse(user) });
        }

        await generateOTP(emailNorm);
        return res.status(202).json({
            success: true,
            message: 'OTP sent to email',
            requiresOTP: true,
        });
    }),
);

router.get(
    '/profile',
    asyncHandler(async (req, res) => {
        const sessionUser = req.session?.user;
        if (!sessionUser?.id) throw Unauthorized('Unauthorized - No session found');

        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: {
                id: true,
                thinkificId: true,
                email: true,
                firstName: true,
                lastName: true,
                roles: true,
                lastLogin: true,
            },
        });
        if (!user) throw NotFound('User not found');

        res.json({
            id: user.thinkificId,
            _id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            lastLogin: user.lastLogin,
        });
    }),
);

router.post('/logout', (req, res, next) => {
    if (!req.session) return res.json({ success: true });
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('pcnc.sid');
        res.json({ success: true });
    });
});

export default router;
