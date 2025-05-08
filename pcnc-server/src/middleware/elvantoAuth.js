import ElvantoController from '../controllers/elvantoController.js';
import config from '../config/env.js';

export const withElvantoAuth = async (req, res, next) => {
    try {

        // Get or refresh access token
        req.elvantoAccessToken = await ElvantoController.getAccessToken(req);
        next();
    } catch (error) {
        // Return auth initiation URL instead of redirecting immediately
        const authUrl = new URL(config.ELVANTO.AUTH_URL);
        authUrl.searchParams.append('type', 'web_server');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', config.ELVANTO.CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', config.ELVANTO.REDIRECT_URI);
        authUrl.searchParams.append('scope', config.ELVANTO.SCOPE);

        res.status(401).json({
            error: 'Elvanto authentication required',
            authUrl: authUrl.toString()
        });
    }
};
