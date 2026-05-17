import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

/**
 * Light wrapper around the Thinkific OAuth flow. The actual login/logout flow
 * lives in routes/auth.js (session-based); this class is kept for the
 * Thinkific code → token → user exchange used by the OAuth callback.
 */
export class AuthController {
    constructor() {
        this.api = axios.create({
            baseURL: `https://${config.THINKIFIC.SUBDOMAIN}.thinkific.com/api/public/v1`,
        });
    }

    async exchangeCodeForToken(code, tokenUrl, options) {
        try {
            const credentials = Buffer.from(
                `${config.THINKIFIC.CLIENT_ID}:${config.THINKIFIC.CLIENT_SECRET}`,
            ).toString('base64');

            const response = await axios.post(
                tokenUrl,
                new URLSearchParams({ ...options, code }),
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            return response.data;
        } catch (error) {
            logger.error({ err: error }, 'Failed to exchange Thinkific code for token');
            throw new AppError('Failed to exchange authorization code for token', {
                status: 502, code: 'THINKIFIC_TOKEN_EXCHANGE_FAILED',
            });
        }
    }

    async fetchThinkificUser(accessToken) {
        try {
            const [user, enrollments] = await Promise.all([
                this.api.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
                this.api.get('/enrollments', { headers: { Authorization: `Bearer ${accessToken}` } }),
            ]);

            return {
                ...user.data,
                enrollments: enrollments.data.items,
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch Thinkific user details');
            throw new AppError('Failed to fetch Thinkific user details', {
                status: 502, code: 'THINKIFIC_USER_FETCH_FAILED',
            });
        }
    }

    generateLocalJWT(user) {
        return jwt.sign(
            { sub: user.id, email: user.email, roles: user.roles },
            config.JWT_SECRET,
            { expiresIn: '1h' },
        );
    }
}

export default AuthController;
