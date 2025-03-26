import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
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
                'https://pcnc-app.loca.lt',
                config.THINKIFIC_OAUTH_REDIRECT_URI
            ],
            credentials: true
        }));
        this.app.use(express.json());
        this.app.use(cookieParser()); // Secure cookie parsing

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
            mongoose.set('strictQuery', false); // Optional: Helps with mongoose warnings
            await mongoose.connect(config.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connected successfully');
        } catch (err) {
            console.error('Database connection error:', err);
            process.exit(1); // Exit application if db connection fails
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
        });
    }
}

const server = new AppServer();
server.start();
