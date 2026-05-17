import ElvantoController from '../controllers/elvantoController.js';
import config from '../config/env.js';
import { logger } from '../lib/logger.js';

export const withElvantoAuth = async (req, res, next) => {
    try {
        req.elvantoAccessToken = await ElvantoController.getAccessToken(req);
        next();
    } catch (err) {
        logger.warn({ err: err.message }, 'Elvanto auth required');
        const authUrl = new URL(config.ELVANTO.AUTH_URL);
        authUrl.searchParams.append('type', 'web_server');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', config.ELVANTO.CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', config.ELVANTO.REDIRECT_URI);
        authUrl.searchParams.append('scope', config.ELVANTO.SCOPE);

        res.status(401).json({
            success: false,
            error: 'Elvanto authentication required',
            authUrl: authUrl.toString(),
        });
    }
};
