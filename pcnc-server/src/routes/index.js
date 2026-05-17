import express from 'express';
import { Router } from 'express';

import authRouter from './auth.js';
import usersRouter from './users.js';
import classesRouter from './classes.js';
import coursesRouter from './courses.js';
import adminRouter from './admins.js';
import egliseiccRoutes from './egliseicc.js';
import countriesRouter from './countries.js';
import zoomsRouter from './zooms.js';

import { thinkificWebhookHandler } from '../webhooks/thinkific.js';
import { validateRegistration } from '../controllers/registrationController.js';
import { withElvantoAuth } from '../middleware/elvantoAuth.js';
import ElvantoController from '../controllers/elvantoController.js';

const router = Router();

// ── Webhooks (raw body required for signature verification) ──
router.post(
    '/webhooks/thinkific',
    express.raw({ type: 'application/json' }),
    thinkificWebhookHandler,
);

// ── Sub-routers ──
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/classes', classesRouter);
router.use('/courses', coursesRouter);
router.use('/admin', adminRouter);
router.use('/egliseicc', egliseiccRoutes);
router.use('/countries', countriesRouter);
router.use('/zooms', zoomsRouter);

// ── Elvanto OAuth ──
router.get('/elvanto/init', ElvantoController.initiateAuth);
router.get('/elvanto/callback', ElvantoController.handleCallback);
router.get('/elvanto/check-auth', withElvantoAuth, (_req, res) =>
    res.json({ authenticated: true }),
);
router.get('/elvanto/eglises', withElvantoAuth, ElvantoController.syncEglises);

// ── Public registration ──
router.post('/registrations', validateRegistration);

export default router;
