// config/env.js
import 'dotenv/config';

export default {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT ,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    THINKIFIC: {
        CLIENT_ID: process.env.THINKIFIC_CLIENT_ID,
        CLIENT_SECRET: process.env.THINKIFIC_CLIENT_SECRET,
        SUBDOMAIN: process.env.THINKIFIC_SUBDOMAIN,
        OAUTH_REDIRECT: process.env.THINKIFIC_OAUTH_REDIRECT_URI
    }
};
