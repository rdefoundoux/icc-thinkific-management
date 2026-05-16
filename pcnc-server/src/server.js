import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

import config from './config/env.js';
import logger from './lib/logger.js';
import prisma, { disconnectPrisma } from './lib/prisma.js';
import { requestContext } from './middleware/requestContext.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import mainRouter from './routes/index.js';

const app = express();

// ─── Behind a reverse proxy (Vercel, nginx) ────────────────────────
app.set('trust proxy', 1);

// ─── Security headers ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // SPA serves its own CSP
  }),
);
app.use(compression());

// ─── CORS ──────────────────────────────────────────────────────────
const staticOrigins = [
  config.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  config.THINKIFIC.OAUTH_REDIRECT,
  'https://api.elvanto.com',
  'https://formations.egliseicc.com',
  ...config.ALLOWED_ORIGINS,
].filter(Boolean);

const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+-)?rdefoundouxs-projects\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (staticOrigins.includes(origin) || vercelRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie', 'x-request-id'],
  }),
);

// ─── Body parsers ──────────────────────────────────────────────────
// NB: raw body is set on the webhook route directly (see routes/index.js)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(config.COOKIE_SECRET));

// ─── Session (Postgres-backed via Prisma) ──────────────────────────
app.use(
  session({
    name: 'pcnc.sid',
    secret: config.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: config.NODE_ENV === 'production',
      domain: config.COOKIE_DOMAIN || undefined,
      maxAge: 24 * 60 * 60 * 1000,
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 10 * 60 * 1000, // prune expired every 10 min
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

// ─── Observability ─────────────────────────────────────────────────
app.use(requestContext);

// ─── Rate limit (skip health endpoints) ────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/ready',
  }),
);

// ─── Health endpoints ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (err) {
    logger.error({ err }, 'readiness probe failed');
    res.status(503).json({ status: 'unavailable' });
  }
});

// ─── API routes ────────────────────────────────────────────────────
app.use('/api/v1', mainRouter);

// ─── 404 + error handling (must be last) ───────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Boot ──────────────────────────────────────────────────────────
const server = app.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      cookieDomain: config.COOKIE_DOMAIN || '(none)',
    },
    'pcnc-server started',
  );
});

// ─── Graceful shutdown ─────────────────────────────────────────────
async function shutdown(signal) {
  logger.info({ signal }, 'shutdown initiated');
  server.close(async () => {
    await disconnectPrisma();
    logger.info('shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('forced shutdown after 10s');
    process.exit(1);
  }, 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandledRejection'));
process.on('uncaughtException',  (err)    => logger.fatal({ err },    'uncaughtException'));

export default app;
