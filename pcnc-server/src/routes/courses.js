import express from 'express';
import { syncCourses } from '../controllers/courseController.js';

const router = express.Router();

router.post('/sync', syncCourses);

export default router;
