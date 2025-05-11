import Class from '../models/Class.js';
import User from '../models/User.js';
import ThinkificService from '../services/ThinkificService.js';

export const getAdminClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate('teacher coordinator rsf sf students', 'firstName lastName email avatarUrl roles thinkificId');
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPendingStudents = async (req, res) => {
    try {
        const students = await User.find({
            thinkificId: { $exists: false },
            roles: 'student'
        }).populate('parentalAuth');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const validateStudents = async (req, res) => {
    try {
        const { studentIds } = req.body;
        await User.updateMany(
            { _id: { $in: studentIds } },
            { $set: { temporary: false } }
        );
        res.json({ message: `${studentIds.length} students validated` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const syncThinkificUsers = async (req, res) => {
    try {
        const { studentIds } = req.body;
        const students = await User.find({ _id: { $in: studentIds } });

        const results = await Promise.all(
            students.map(async student => {
                const thinkificUser = await ThinkificService.createUser({
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email
                });
                return User.findByIdAndUpdate(
                    student._id,
                    { thinkificId: thinkificUser.id },
                    { new: true }
                );
            })
        );

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCoordinators = async (req, res) => {
    try {
        const coordinators = await User.find({ roles: 'coordinator' })
            .populate({
                path: 'managedClasses',
                select: 'thinkificGroupName students teacher',
                populate: {
                    path: 'teacher',
                    select: 'firstName lastName'
                }
            });
        res.json(coordinators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSFs = async (req, res) => {
    try {
        const sfs = await User.find({ roles: 'sf' })
            .populate({
                path: 'managedClasses',
                select: 'thinkificGroupName students teacher',
                populate: [
                    { path: 'teacher', select: 'firstName lastName' },
                    { path: 'students', select: 'firstName lastName' }
                ]
            });
        res.json(sfs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const assignStudentsToClasses = async (req, res) => {
    try {
        const { assignments } = req.body; // Array of {classId, studentId} objects

        const results = await Promise.all(
            assignments.map(async ({ classId, studentId }) => {
                const classDoc = await Class.findById(classId);
                if (!classDoc) {
                    return { classId, studentId, success: false, message: 'Class not found' };
                }

                if (!classDoc.students.includes(studentId)) {
                    classDoc.students.push(studentId);
                    await classDoc.save();
                    return { classId, studentId, success: true };
                }

                return { classId, studentId, success: true, message: 'Student already in class' };
            })
        );

        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

