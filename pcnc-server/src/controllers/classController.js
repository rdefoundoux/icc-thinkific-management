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

// Get all classes with pagination
export const getClasses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [classes, total] = await Promise.all([
            Class.find()
                .populate('teacher coordinator rsf sf students', 'firstName lastName')
                .skip(skip)
                .limit(limit),
            Class.countDocuments()
        ]);

        // Get fresh student counts from Thinkific
        const classesWithStudentCounts = await Promise.all(
            classes.map(async cls => {
                let studentCount = cls.students?.length || 0;

                // Fetch from Thinkific if no local data
                if (studentCount === 0) {
                    try {
                        const count = await ThinkificService.getGroupUsersCount(cls.thinkificGroupId);
                        studentCount = count;

                        // Update local database
                        await Class.findByIdAndUpdate(cls._id, {
                            $set: { students: Array(count).fill(null) } // Placeholder array
                        });
                    } catch (error) {
                        console.error('Error updating student count:', error);
                    }
                }

                return { ...cls.toObject(), studentCount };
            })
        );

        res.json({ data: classesWithStudentCounts, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Update existing class
export const updateClass = async (req, res) => {
    try {
        const updatedClass = await Class.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('teacher coordinator rsf sf students', 'firstName lastName');

        if (!updatedClass) return res.status(404).json({ error: 'Class not found' });
        res.json(updatedClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get detailed class information
export const getClassDetails = async (req, res) => {
    try {
        const classDetails = await Class.findById(req.params.id)
            .populate('teacher coordinator rsf sf students', 'firstName lastName avatarUrl email');

        if (!classDetails) return res.status(404).json({ error: 'Class not found' });

        // Fetch Thinkific group details
        let thinkificGroup = { name: 'N/A' };
        let students = [];

        try {
            // Get group name
            const groupResponse = await ThinkificService.getGroup(classDetails.thinkificGroupId);
            thinkificGroup.name = groupResponse?.name || 'N/A';

            // Get students
            const usersResponse = await ThinkificService.getGroupUsers(classDetails.thinkificGroupId);
            students = usersResponse.map(user => ({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatarUrl: user.avatar_url // Adjust based on actual API response
            }));
        } catch (thinkificError) {
            console.error('Thinkific API Error:', thinkificError);
            // Fallback to local data
            students = classDetails.students;
        }

        res.json({
            ...classDetails.toObject(),
            thinkificGroup,
            students
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const assignRoles = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userId, userIds, role } = req.body;

        const classObj = await Class.findById(classId);
        if (!classObj) throw new Error('Class not found');

        // Handle role-specific logic
        switch(role) {
            case 'teacher':
            case 'coordinator':
            case 'rsf':
                // Single user roles
                if (!userId) throw new Error('User ID required');
                const user = await User.findById(userId);
                if (!user?.thinkificId) throw new Error('User not synced with Thinkific');

                // Add to Thinkific group
                await ThinkificService.addUserToGroup(user.thinkificId, classObj.thinkificGroupId);

                // Update class
                if (role === 'teacher') classObj.teacher = userId;
                if (role === 'coordinator') classObj.coordinator = userId;
                if (role === 'rsf') classObj.rsf = [userId];
                break;

            case 'sf':
                // Multiple users
                if (!userIds?.length) throw new Error('User IDs required');

                // Validate all users have Thinkific IDs
                const sfUsers = await User.find({ _id: { $in: userIds } });
                const invalidUsers = sfUsers.filter(u => !u.thinkificId);
                if (invalidUsers.length > 0) {
                    throw new Error(`${invalidUsers.length} users not synced with Thinkific`);
                }

                // Add all to Thinkific group
                await Promise.all(
                    sfUsers.map(u =>
                        ThinkificService.addUserToGroup(u.thinkificId, classObj.thinkificGroupId)
                    )
                );

                // Update class (avoid duplicates)
                classObj.sf = [...new Set([...classObj.sf, ...userIds])];
                break;

            default:
                throw new Error('Invalid role');
        }

        await classObj.save();
        res.json({ success: true, class: await Class.findById(classId).populate('teacher coordinator rsf sf') });
    } catch (error) {
        console.error('Error assigning roles:', error);
        res.status(400).json({ error: error.message });
    }
};
export const getCourses = async (req, res) => {
    try {
        const courses = await ThinkificService.getCourses();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const assignCourse = async (req, res) => {
    try {
        const { classId } = req.params;
        const { courseId } = req.body;

        const classObj = await Class.findById(classId);
        if (!classObj) return res.status(404).json({ error: 'Class not found' });

        // Prevent duplicate assignment
        if (classObj.courses?.some(c => c.thinkificCourseId === courseId)) {
            return res.status(400).json({ error: 'Course already assigned' });
        }

        // Fetch group users using GraphQL
        const groupUsers = await ThinkificService.getGroupUsers(classObj.thinkificGroupId);

        // Filter users not already enrolled in the course
        const usersToEnroll = groupUsers.filter(user => {
            const enrolledCourseIds = user.courses.edges.map(e => e.node.id);
            return !enrolledCourseIds.includes(courseId);
        });

        // Enroll users
        await ThinkificService.bulkEnrollUsers(courseId, usersToEnroll.map(u => u.id));

        // Save course assignment
        classObj.courses = classObj.courses || [];
        // Get course details from Thinkific
        const course = await ThinkificService.getCourse(courseId);

        // Add to class courses with name
        classObj.courses.push({
            thinkificCourseId: courseId,
            name: course.name // Add course name
        });

        await classObj.save();
        res.json({ success: true, enrolledCount: usersToEnroll.length });

    } catch (error) {
        console.error('assignCourse error:', error);
        res.status(500).json({ error: error.message });
    }
};
export const getGroups = async (req, res) => {
    try {
        console.log('Fetching Thinkific groups...');
        const groups = await ThinkificService.getGroups();
        res.json(groups);
    } catch (error) {
        console.error('Groups endpoint error:', error);
        res.status(500).json({
            error: 'Failed to fetch Thinkific groups',
            details: error.message
        });
    }
};
export const getGroupUsers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const users = await ThinkificService.getGroupUsers(groupId);
        res.json(users);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
};
