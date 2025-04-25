// controllers/classController.js
import  ThinkificService  from '../services/ThinkificService.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

const formatClassName = ({
                             type,
                             region,
                             version,
                             className,
                             courseCode,
                             month,
                             year,
                             dayName,
                             hour,
                             minutes,
                             lang
                         }) => {
    const time = `${hour}h${minutes}`;
    if (type === 'onsite') {
        // ONSITE - Region - Version - CourseCode - Month Year - DayName - Time - Lang
        return `ONSITE - ${region} - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    } else {
        // Corp - Version - CourseCode - Month Year - DayName - Time - Lang
        return `Corp - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    }
};

export const createClass = async (req, res) => {
    try {
        const {
            type,
            region,
            version,
            className,
            courseCode,
            month,
            year,
            dayName,
            hour,
            minutes,
            lang,
            ...otherFields } = req.body;

        const formattedClassName = formatClassName({
            type,
            region,
            version,
            className,
            courseCode,
            month,
            year,
            dayName,
            hour,
            minutes,
            lang,
        });

        const thinkificResponse = await ThinkificService.createGroup({
            name: formattedClassName,
            description: `Group for ${formattedClassName} class`,
        });

        const thinkificGroupId = thinkificResponse.group.id;

        const newClass = await Class.create({
            ...otherFields,
            type,
            region,
            version,
            className,
            courseCode,
            month,
            year,
            dayName,
            hour,
            minutes,
            lang,
            thinkificGroupId,
        });

        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(400).json({
            error: error.message,
            details: error.response?.data,
        });
    }
};

export const assignRoles = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userId, role } = req.body;

        // Get Thinkific user ID from your database
        const user = await User.findById(userId);
        if (!user?.thinkificId) { // VALIDATE THINKIFIC ID EXISTS
            throw new Error('User not synced with Thinkific');
        }

        const classObj = await Class.findById(classId).populate('teacher');
        if (!classObj) throw new Error('Class not found');

        switch(role) {
            case 'teacher':
                classObj.teacher = userId;
                break;
            case 'traineeTeacher':
                if (!classObj.traineeTeachers.includes(userId)) {
                    classObj.traineeTeachers.push(userId);
                }
                break;
            case 'staff':
                if (!classObj.staff.includes(userId)) {
                    classObj.staff.push(userId);
                }
                break;
            case 'coordinator':
                classObj.coordinator = userId;
                break;
            case 'staffManager':
                classObj.staffManager = userId;
                break;
            default:
                throw new Error('Invalid role');
        }

        await classObj.save();
        // Refresh the class data with populated teacher
        const updatedClass = await Class.findById(classId)
            .populate('teacher', 'firstName lastName');

        await ThinkificService.addUserToGroup(user.thinkificId, classObj.thinkificGroupId);

        res.json({ success: true, class: updatedClass });
    } catch (error) {
        console.error('Error assigning roles:', error);
        res.status(400).json({ error: error.message });
    }
};
