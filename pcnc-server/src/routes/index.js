import express from 'express';
import { Router } from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import { adminOnly, authenticate } from '../middleware/auth.js';
import { validateClassCreation } from '../middleware/validation.js';
import { assignTeacher, createClass, validateRegistration } from '../controllers/registrationController.js';
import { syncUserData } from "../controllers/userController.js";
import { thinkificWebhookHandler } from '../webhooks/thinkific.js';

const router = Router();

// Webhook handler
router.post('/webhooks/thinkific',
    express.raw({ type: 'application/json' }),
    thinkificWebhookHandler
);

// Public routes
router.use('/auth',authRouter);
router.use('/users', usersRouter);

// Protected routes
router.use(authenticate);
router.post('/registrations', validateRegistration);
router.post('/classes', adminOnly, validateClassCreation, createClass);
router.put('/classes/:classId/teachers', adminOnly, assignTeacher);

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
