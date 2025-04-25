import ElvantoAuth from '../controllers/elvantoAuth.js';
import config from '../config/env.js';

export const withElvantoAuth = async (req, res, next) => {
    try {
        req.elvantoAccessToken = await ElvantoAuth.getAccessToken(req);
        next();
    } catch (error) {
        res.status(401).json({
            error: 'Elvanto authentication required',
            authUrl: `${config.ELVANTO.AUTH_URL}?client_id=${config.ELVANTO.CLIENT_ID}&redirect_uri=${config.ELVANTO.REDIRECT_URI}`
        });
    }
};
