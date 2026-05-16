// ─────────────────────────────────────────────────────────────
//  Environment validation — fail fast on missing / invalid vars
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // ── Database (PostgreSQL) ──
  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string',
    }),

  // ── Auth ──
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 chars'),
  COOKIE_DOMAIN: z.string().optional(),

  // ── CORS / public URLs ──
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().optional(), // comma-separated extra origins

  // ── Thinkific ──
  THINKIFIC_CLIENT_ID: z.string().min(1),
  THINKIFIC_CLIENT_SECRET: z.string().min(1),
  THINKIFIC_SUBDOMAIN: z.string().min(1),
  THINKIFIC_OAUTH_REDIRECT_URI: z.string().url(),

  // ── Elvanto ──
  ELVANTO_CLIENT_ID: z.string().min(1),
  ELVANTO_CLIENT_SECRET: z.string().min(1),
  ELVANTO_REDIRECT_URI: z.string().url(),

  // ── Zoom (optional in dev) ──
  ZOOM_ACCOUNT_ID: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),

  // ── Email / SMTP (optional in dev) ──
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // ── Logging ──
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌  Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

export default {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET: env.JWT_SECRET,
  COOKIE_SECRET: env.COOKIE_SECRET,
  COOKIE_DOMAIN: env.COOKIE_DOMAIN,
  FRONTEND_URL: env.FRONTEND_URL,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [],
  LOG_LEVEL: env.LOG_LEVEL,

  THINKIFIC: {
    CLIENT_ID: env.THINKIFIC_CLIENT_ID,
    CLIENT_SECRET: env.THINKIFIC_CLIENT_SECRET,
    SUBDOMAIN: env.THINKIFIC_SUBDOMAIN,
    OAUTH_REDIRECT: env.THINKIFIC_OAUTH_REDIRECT_URI,
  },
  ELVANTO: {
    CLIENT_ID: env.ELVANTO_CLIENT_ID,
    CLIENT_SECRET: env.ELVANTO_CLIENT_SECRET,
    REDIRECT_URI: env.ELVANTO_REDIRECT_URI,
    SCOPE: 'ManagePeople,ManageGroups',
    AUTH_URL: 'https://api.elvanto.com/oauth',
    TOKEN_URL: 'https://api.elvanto.com/oauth/token',
  },
  ZOOM: {
    ACCOUNT_ID: env.ZOOM_ACCOUNT_ID,
    CLIENT_ID: env.ZOOM_CLIENT_ID,
    CLIENT_SECRET: env.ZOOM_CLIENT_SECRET,
  },
  SMTP: {
    HOST: env.SMTP_HOST,
    PORT: env.SMTP_PORT,
    USER: env.SMTP_USER,
    PASSWORD: env.SMTP_PASSWORD,
    FROM: env.SMTP_FROM,
  },
};
