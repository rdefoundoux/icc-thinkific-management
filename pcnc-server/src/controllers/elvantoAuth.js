import axios from 'axios';
import config from '../config/env.js';

export default class ElvantoAuth {
    static async initiateAuth(req, res) {
        const authUrl = new URL(config.ELVANTO.AUTH_URL);
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

            const tokenResponse = await axios.post(config.ELVANTO.TOKEN_URL, new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: config.ELVANTO.CLIENT_ID,
                client_secret: config.ELVANTO.CLIENT_SECRET,
                redirect_uri: config.ELVANTO.REDIRECT_URI
            }));

            // Store tokens in session
            req.session.elvantoTokens = {
                accessToken: tokenResponse.data.access_token,
                refreshToken: tokenResponse.data.refresh_token,
                expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000)
            };

            res.redirect('/'); // Redirect to your application
        } catch (error) {
            next(error);
        }
    }

    static async getAccessToken(req) {
        if (!req.session.elvantoTokens) {
            throw new Error('No Elvanto session found');
        }

        const { accessToken, refreshToken, expiresAt } = req.session.elvantoTokens;

        if (Date.now() >= expiresAt - 30000) { // Refresh 30s before expiry
            const newTokens = await this.refreshToken(refreshToken);
            req.session.elvantoTokens = { ...newTokens, refreshToken };
            return newTokens.accessToken;
        }

        return accessToken;
    }

    static async refreshToken(refreshToken) {
        try {
            const response = await axios.post(config.ELVANTO.TOKEN_URL, new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: config.ELVANTO.CLIENT_ID,
                client_secret: config.ELVANTO.CLIENT_SECRET,
                refresh_token: refreshToken
            }));

            return {
                accessToken: response.data.access_token,
                expiresAt: Date.now() + (response.data.expires_in * 1000)
            };
        } catch (error) {
            console.error('Elvanto token refresh failed:', error.response?.data);
            throw new Error('Failed to refresh access token');
        }
    }
}
