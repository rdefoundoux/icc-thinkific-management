import express from 'express';
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

// Add this to your router
router.get('/elvanto/people',
    withElvantoAuth,
    async (req, res) => {
        try {
            const response = await axios.get('https://api.elvanto.com/v1/people/getAll.json', {
                headers: { Authorization: `Bearer ${req.elvantoAccessToken}` }
            });
            res.json(response.data);
        } catch (error) {
            res.status(error.response?.status || 500).json({
                error: error.response?.data || error.message
            });
        }
    }
);

// Protected routes
router.use(authenticate);
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
