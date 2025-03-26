import express from 'express';
import {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    changeUserRole
} from '../controllers/userController.js';
import { adminOnly, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(authenticate, adminOnly, getUsers);

router.route('/:id')
    .get(authenticate, getUser)
    .put(authenticate, adminOnly, updateUser)
    .delete(authenticate, adminOnly, deleteUser);

router.put('/:id/role', authenticate, adminOnly, changeUserRole);

export default router;
