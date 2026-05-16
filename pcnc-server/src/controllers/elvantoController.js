import axios from 'axios';

import config from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { BadRequest, Unauthorized, AppError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/requestContext.js';

export default class ElvantoController {
    static initiateAuth = asyncHandler(async (_req, res) => {
        const authUrl = new URL(config.ELVANTO.AUTH_URL);
        authUrl.searchParams.append('type', 'web_server');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', config.ELVANTO.CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', config.ELVANTO.REDIRECT_URI);
        authUrl.searchParams.append('scope', config.ELVANTO.SCOPE);
        res.redirect(authUrl.toString());
    });

    static handleCallback = asyncHandler(async (req, res) => {
        const { code } = req.query;
        if (!code) throw BadRequest('Authorization code missing');

        const tokenResponse = await axios.post(
            config.ELVANTO.TOKEN_URL,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: config.ELVANTO.CLIENT_ID,
                client_secret: config.ELVANTO.CLIENT_SECRET,
                redirect_uri: config.ELVANTO.REDIRECT_URI,
            }),
        );

        req.session.elvantoTokens = {
            accessToken: tokenResponse.data.access_token,
            refreshToken: tokenResponse.data.refresh_token,
            expiresAt: Date.now() + tokenResponse.data.expires_in * 1000,
        };

        res.redirect('/api/v1/elvanto/eglises');
    });

    static async getAccessToken(req) {
        if (!req.session?.elvantoTokens) {
            throw Unauthorized('No Elvanto session found');
        }

        const { accessToken, refreshToken, expiresAt } = req.session.elvantoTokens;

        if (Date.now() >= expiresAt - 30_000) {
            const newTokens = await this.refreshToken(refreshToken);
            req.session.elvantoTokens = { ...newTokens, refreshToken };
            return newTokens.accessToken;
        }

        return accessToken;
    }

    static async refreshToken(refreshToken) {
        try {
            const response = await axios.post(
                config.ELVANTO.TOKEN_URL,
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: config.ELVANTO.CLIENT_ID,
                    client_secret: config.ELVANTO.CLIENT_SECRET,
                    refresh_token: refreshToken,
                }),
            );
            return {
                accessToken: response.data.access_token,
                expiresAt: Date.now() + response.data.expires_in * 1000,
            };
        } catch (err) {
            logger.error({ err: err.response?.data || err.message }, 'Elvanto token refresh failed');
            throw new AppError('Failed to refresh access token', {
                status: 502, code: 'ELVANTO_REFRESH_FAILED',
            });
        }
    }

    static syncEglises = asyncHandler(async (req, res) => {
        const response = await axios.post(
            'https://api.elvanto.com/v1/people/customFields/getAll.json',
            {},
            {
                headers: {
                    Authorization: `Bearer ${req.elvantoAccessToken}`,
                    Accept: 'application/json',
                },
            },
        );

        const corpFields =
            response.data?.custom_fields?.custom_field?.filter(
                (field) =>
                    field.name?.startsWith('CORP_emplacements') && field.type === 'select',
            ) || [];

        const syncResults = [];
        let changesDetected = false;

        for (const field of corpFields) {
            const values = field.values?.value || [];
            for (const v of values) {
                const { name } = v;
                if (!name) continue;

                const existing = await prisma.egliseICC.findUnique({ where: { name } });
                if (existing) {
                    syncResults.push({ name, status: 'unchanged' });
                    continue;
                }
                const created = await prisma.egliseICC.create({ data: { name } });
                syncResults.push({ name, status: 'created', data: created });
                changesDetected = true;
            }
        }

        res.json({
            success: true,
            message: changesDetected
                ? 'Data synchronized successfully'
                : 'All data is already up-to-date',
            data: syncResults,
            changesDetected,
        });
    });
}
