// controllers/classController.js
import  ThinkificService  from '../services/ThinkificService.js';
import Class from '../models/Class.js';

const formatClassName = (type, region, r35Version, rubiEdition, courseCode, month, year) => {
    const prefix = type === 'onsite' ? `ONSITE - ${region}` : 'Corp';
    return `${prefix} - ${r35Version} - ${rubiEdition} - ${courseCode} - ${month} ${year}`;
};

export const createClass = async (req, res) => {
    try {
        const { type, region, r35Version, rubiEdition, courseCode, month, year, ...otherFields } = req.body;

        const className = formatClassName(type, region, r35Version, rubiEdition, courseCode, month, year);

        const thinkificResponse = await ThinkificService.createGroup({
            name: className,
            description: `Group for ${className} class`
        });

        const thinkificGroupId = thinkificResponse.group.id;

        const newClass = await Class.create({
            ...otherFields,
            type,
            region,
            r35Version,
            rubiEdition,
            courseCode,
            month,
            year,
            thinkificGroupId
        });

        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(400).json({
            error: error.message,
            details: error.response?.data
        });
    }
};

export const assignRoles = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userId, role } = req.body;

        const classObj = await Class.findById(classId);
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
        await ThinkificService.addUserToGroup(userId, classObj.thinkificGroupId);

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
