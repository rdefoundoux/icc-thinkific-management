import { Router } from 'express';
import {
    authenticate,
    adminOnly
} from '../middleware/auth.js';
import {
    validateClassCreation
} from '../middleware/validation.js';
import { createClass } from '../controllers/classController.js';

const router = Router();

router.post(
    '/',
    authenticate,
    adminOnly,
    validateClassCreation,
    createClass
);

export default router;
