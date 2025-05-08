import express from 'express';
import axios from 'axios';
import { Router } from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import { adminOnly, authenticate } from '../middleware/auth.js';
import { validateClassCreation } from '../middleware/validation.js';
import { assignTeacher, createClass, validateRegistration } from '../controllers/registrationController.js';
import { syncUserData } from "../controllers/userController.js";
import { thinkificWebhookHandler } from '../webhooks/thinkific.js';
import classesRouter from './classes.js';
import { withElvantoAuth } from '../middleware/elvantoAuth.js';
import coursesRouter from './courses.js';
import adminRouter from './admins.js';
import ElvantoController  from '../controllers/elvantoController.js';
import egliseiccRoutes from './egliseicc.js';
import countriesRouter from './countries.js';


const router = Router();

// Webhook handler
router.post('/webhooks/thinkific',
    express.raw({ type: 'application/json' }),
    thinkificWebhookHandler
);

// Public routes
router.use('/auth',authRouter);
router.use('/users', usersRouter);
router.use('/classes', classesRouter);
router.use('/courses', coursesRouter);
router.use('/admin', adminRouter);
router.use('/egliseicc', egliseiccRoutes);
router.use('/countries', countriesRouter);
router.get('/elvanto/init', ElvantoController.initiateAuth);
router.get('/elvanto/callback', ElvantoController.handleCallback);
router.get('/elvanto/check-auth', withElvantoAuth, (req, res) => res.json({ authenticated: true }));

router.get('/elvanto/eglises', withElvantoAuth,ElvantoController.syncEglises);


// Protected routes
// router.use(authenticate);
router.post('/registrations', validateRegistration);

// Error handling
router.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    if (!res.headersSent) {
        const errorResponse = {
            success: false,
            error: err.message || 'Internal Server Error',
            code: err.code || 'SERVER_ERROR'
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = err.stack;
            errorResponse.details = err.details;
        }

        res.status(err.statusCode || 500).json(errorResponse);
    }
});

export default router;
