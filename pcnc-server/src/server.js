import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import config from './config/env.js';
import mainRouter from './routes/index.js';

class AppServer {
    constructor() {
        this.app = express();
        this.configureMiddleware();
        this.connectDatabase();
        this.configureRoutes();
    }

    configureMiddleware() {
        this.app.set('trust proxy', true); // Handles proxy in production
        this.app.use(helmet()); // Security headers
        this.app.use(cors({
            origin: [
                'http://localhost:5173',
                '=https://1082-70-30-206-145.ngrok-free.app',
                config.THINKIFIC_OAUTH_REDIRECT_URI
            ],
            credentials: true
        }));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser(process.env.COOKIE_SECRET)); // Secure cookie parsing

        // Session configuration
        this.app.use(session({
            secret: process.env.COOKIE_SECRET,
            resave: true,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: config.MONGODB_URI,
                ttl: 14 * 24 * 60 * 60 // 14 days
            }),
            cookie: {
                secure: true,
                sameSite: 'none', // Required for cross-domain in production
                httpOnly: true,
                domain: process.env.COOKIE_DOMAIN, // Set to '.ngrok-free.app' for testing
                maxAge: 14 * 24 * 60 * 60 * 1000
            }
        }));

        // Rate limiting to protect against brute force attacks
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 500, // Max 500 requests per 15 mins per IP
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);
    }

    async connectDatabase() {
        try {
            mongoose.set('strictQuery', false);
            await mongoose.connect(config.MONGODB_URI);
            console.log('MongoDB connected successfully');
        } catch (err) {
            console.error('Database connection error:', err);
            process.exit(1);
        }
    }

    configureRoutes() {
        this.app.use('/api/v1', mainRouter);
        this.app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));
    }

    start() {
        const PORT = config.PORT || 3000;
        this.app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${config.NODE_ENV || 'development'}`);
        });
    }
}

const server = new AppServer();
server.start();
