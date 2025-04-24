// routes/classes.js
import express from 'express';
import {
    createClass,
    assignRoles
} from '../controllers/classController.js';
import { isAdmin } from '../middleware/auth.js';
import Class from '../models/Class.js';
import  ThinkificService  from '../services/ThinkificService.js';

const router = express.Router();

router.post('/',  createClass);
router.post('/:classId/roles',  assignRoles);
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Class.find().skip(skip).limit(limit),
            Class.countDocuments()
        ]);
        res.json({ data, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/groups',  async (req, res) => {
    try {
        const groups = await ThinkificService.getGroups();
        res.json(groups);
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
