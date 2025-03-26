import express from 'express';
import { Router } from 'express';
import authRouter from './auth.js';
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
router.post('/api/users/sync', syncUserData);

// Protected routes
router.use(authenticate);
router.post('/registrations', validateRegistration);
router.post('/classes', adminOnly, validateClassCreation, createClass);
router.put('/classes/:classId/teachers', adminOnly, assignTeacher);

// Error handling
router.use((err, req, res, next) => {
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: err.message
        });
    }
});

export default router;
