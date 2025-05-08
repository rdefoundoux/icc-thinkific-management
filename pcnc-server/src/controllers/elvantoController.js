import axios from 'axios';
import config from '../config/env.js';
import EgliseICC from '../models/EgliseICC.js';

export default class ElvantoController {
    static async initiateAuth(req, res) {
        const authUrl = new URL(config.ELVANTO.AUTH_URL);
        authUrl.searchParams.append('type', 'web_server');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', config.ELVANTO.CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', config.ELVANTO.REDIRECT_URI);
        authUrl.searchParams.append('scope', config.ELVANTO.SCOPE);

        res.redirect(authUrl.toString());
    }

    static async handleCallback(req, res, next) {
        try {
            const { code } = req.query;

            if (!code) throw new Error('Authorization code missing');

            const tokenResponse = await axios.post(
                config.ELVANTO.TOKEN_URL,
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: config.ELVANTO.CLIENT_ID,
                    client_secret: config.ELVANTO.CLIENT_SECRET,
                    redirect_uri: config.ELVANTO.REDIRECT_URI
                })
            );

            // Store tokens in session
            req.session.elvantoTokens = {
                accessToken: tokenResponse.data.access_token,
                refreshToken: tokenResponse.data.refresh_token,
                expiresAt: Date.now() + tokenResponse.data.expires_in * 1000
            };

            console.log('Got access token', req.session);

            res.redirect('/api/v1/elvanto/people'); // Redirect to your application
        } catch (error) {
            console.error('Elvanto callback error:', {
                query: req.query,
                headers: req.headers,
                error: error.response?.data || error.message
            });

            next(error);
        }
    }

    static async getAccessToken(req) {
        console.log('Getting access token', req.session);

        if (!req.session.elvantoTokens) {
            console.error('No Elvanto session found');
            throw new Error('No Elvanto session found');
        }

        const { accessToken, refreshToken, expiresAt } = req.session.elvantoTokens;

        if (Date.now() >= expiresAt - 30000) {
            // Refresh 30s before expiry
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
                    refresh_token: refreshToken
                })
            );

            return {
                accessToken: response.data.access_token,
                expiresAt: Date.now() + response.data.expires_in * 1000
            };
        } catch (error) {
            console.error('Elvanto token refresh failed:', error.response?.data);
            throw new Error('Failed to refresh access token');
        }
    }

    static async syncEglises(req, res) {
        try {
            const response = await axios.post(
                'https://api.elvanto.com/v1/people/customFields/getAll.json',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${req.elvantoAccessToken}`,
                        Accept: 'application/json'
                    }
                }
            );

            const corpFields =
                response.data?.custom_fields?.custom_field?.filter(
                    (field) =>
                        field.name?.startsWith('CORP_emplacements') &&
                        field.type === 'select'
                ) || [];

            const syncResults = [];
            let changesDetected = false;

            for (const field of corpFields) {
                const values = field.values.value || [];
                for (const v of values) {
                    // Only use the fields you want in your schema
                    const { id, name } = v;

                    // Check if an entry with this value.name exists
                    const existing = await EgliseICC.findOne({ name });

                    if (existing && existing.id === id) {
                        syncResults.push({ name, status: 'unchanged' });
                        continue;
                    }

                    // Upsert (update or create) EgliseICC entry for this value
                    const result = await EgliseICC.findOneAndUpdate(
                        { name },
                        { id, fieldName: field.name }, // Optionally store fieldName
                        { new: true, upsert: true }
                    );

                    syncResults.push({
                        name,
                        status: existing ? 'updated' : 'created',
                        data: result
                    });

                    changesDetected = true;
                }
            }

            const syncResult = {
                changesDetected,
                results: syncResults,
                message: changesDetected
                    ? 'Data synchronized successfully'
                    : 'All data is already up-to-date'
            };

            res.json({
                success: true,
                message: syncResult.message,
                data: syncResult.results,
                changesDetected: syncResult.changesDetected
            });
        } catch (error) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.error || error.message;

            console.error('Eglise synchronization failed:', error);

            res.status(status).json({
                success: false,
                error: message
            });
        }
    }


}
