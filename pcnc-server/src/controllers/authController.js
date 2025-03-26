import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export class AuthController {
    constructor() {
        // Axios instance for Thinkific API
        this.api = axios.create({
            baseURL: `https://${config.THINKIFIC.SUBDOMAIN}.thinkific.com/api/public/v1`,
        });
    }

    // Exchange code for access token
    async exchangeCodeForToken(code, tokenUrl, options, authParams) {
        try {
            const credentials = Buffer.from(
                `${process.env.THINKIFIC_CLIENT_ID}:${process.env.THINKIFIC_CLIENT_SECRET}`
            ).toString('base64');

            const response = await axios.post(
                tokenUrl,
                new URLSearchParams({
                    ...options,
                }),
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error exchanging code for token:', error.message);
            throw new Error('Failed to exchange authorization code for token');
        }
    }

    // Fetch Thinkific user details
    async fetchThinkificUser(accessToken) {
        try {
            const [user, enrollments] = await Promise.all([
                this.api.get(`/users/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                this.api.get(`/enrollments`, { headers: { Authorization: `Bearer ${accessToken}` } }),
            ]);

            return {
                ...user.data,
                enrollments: enrollments.data.items,
            };
        } catch (error) {
            console.error('Error fetching Thinkific user details:', error.message);
            throw new Error('Failed to fetch Thinkific user details');
        }
    }

    // Generate local JWT for application authentication
    generateLocalJWT(user) {
        return jwt.sign(
            { id: user._id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRE }
        );
    }
}
