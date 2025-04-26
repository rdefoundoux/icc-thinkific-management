import express from 'express';
import {
    getClasses,
    getClassDetails,
    getGroups,
    getCourses,
    createClass,
    assignRoles,
    assignCourse,
    updateClass,
    getGroupUsers
} from '../controllers/classController.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET routes
router.get('/', getClasses);
router.get('/groups', getGroups);
router.get('/courses', getCourses);
router.get('/groups/:groupId/users', getGroupUsers);
router.get('/:id', getClassDetails);

// POST routes
router.post('/', createClass);
router.post('/:classId/roles', assignRoles);
router.post('/:classId/courses', assignCourse);

// PUT routes
router.put('/:id', updateClass);

export default router;
