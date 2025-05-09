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
        this.sessionStore = MongoStore.create({
            mongoUrl: config.MONGODB_URI,
            ttl: 24 * 60 * 60,
            autoRemove: 'interval',
            autoRemoveInterval: 60
        });
        this.sessionStore.on('error', (error) => {
            console.error('Session store error:', error);
        });
        this.configureMiddleware();
        this.connectDatabase();
        this.configureRoutes();
    }

    configureMiddleware() {
        this.app.set('trust proxy', 1);
        this.app.use(helmet());
        // --- CORS CONFIGURATION START ---
        const allowedOrigins = [
            'http://localhost:5173',
            'https://pcnc.tail30380e.ts.net',
            config.THINKIFIC_OAUTH_REDIRECT_URI,
            'https://api.elvanto.com'
        ];

        // Matches both preview and production Vercel deployments
        const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+-)?rdefoundouxs-projects\.vercel\.app$/;

        this.app.use(cors({
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps, curl, etc.)
                if (!origin) return callback(null, true);

                if (
                    allowedOrigins.includes(origin) ||
                    vercelRegex.test(origin)
                ) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Set-Cookie']
        }));
        // --- CORS CONFIGURATION END ---
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser(process.env.COOKIE_SECRET));

        // Session configuration
        this.app.use(session({
            secret: process.env.COOKIE_SECRET,
            resave: false,
            saveUninitialized: false,
            store: this.sessionStore,
            cookie: {
                secure: false, // false for HTTP in development
                sameSite: 'lax', // Allows cookies on same-site requests
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                domain: '.erdv.pro' // Explicitly set domain for development
            },
            proxy: true
        }));

        // Session logging middleware
        this.app.use((req, res, next) => {
            //console.log('Session middleware - req.session:', req.session);
            next();
        });

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 500,
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

            // Verify session store
            this.sessionStore.on('error', (error) => {
                console.error('Session store error:', error);
            });

            // Create TTL index
            const sessionCollection = mongoose.connection.db.collection('sessions');
            await sessionCollection.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
            console.log('Session TTL index created');

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
            console.log(`Session cookie settings:
  - Secure: ${config.NODE_ENV === 'production'}
  - SameSite: ${config.NODE_ENV === 'production' ? 'none' : 'lax'}
  - Domain: ${config.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost'}`);
        });
    }
}

const server = new AppServer();
server.start();
