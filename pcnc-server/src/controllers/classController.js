import Class from '../models/Class.js';
import thinkificService from '../services/thinkificService.js';

export const getClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate('teacher', 'name email')
            .populate('students', 'name email');
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createClass = async (req, res) => {
    try {
        const newClass = new Class(req.body);
        await newClass.save();
        await thinkificService.syncCourseEnrollment(newClass._id);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
