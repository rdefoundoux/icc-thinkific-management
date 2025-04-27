import ThinkificService from '../services/ThinkificService.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

/**
 * Constructs a formatted class name based on various parameters.
 * @param {Object} params
 * @param {string} params.type - Class type (onsite or corp).
 * @param {string} params.region - Geographical region (if applicable).
 * @param {string} params.version - Class version (e.g., v1, v2).
 * @param {string} params.className - Actual class name.
 * @param {string} params.courseCode - Course code identifier.
 * @param {string} params.month - Month string (e.g., January).
 * @param {string} params.year - Year string (e.g., 2025).
 * @param {string} params.dayName - Day of the week (e.g., Monday).
 * @param {number} params.hour - Hour of the day in 24-hour format.
 * @param {number} params.minutes - Minute of the day.
 * @param {string} params.lang - Language code (e.g., en, fr).
 * @returns {string} - The formatted class name.
 */
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
        // ONSITE - Region - Version - ClassName - CourseCode - Month Year - DayName - Time - Lang
        return `ONSITE - ${region} - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    } else {
        // Corp - Version - ClassName - CourseCode - Month Year - DayName - Time - Lang
        return `Corp - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    }
};

/**
 * Fetches paginated list of classes, along with fresh student counts when needed.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const getClasses = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const [classes, total] = await Promise.all([
            Class.find()
                .populate('teacher coordinator rsf sf students', 'firstName lastName')
                .skip(skip)
                .limit(limit),
            Class.countDocuments()
        ]);

        // Retrieve updated student counts from Thinkific (if needed).
        const classesWithStudentCounts = await Promise.all(
            classes.map(async (cls) => {
                let studentCount = cls.students?.length || 0;

                if (studentCount === 0) {
                    try {
                        const count = await ThinkificService.getGroupUsersCount(cls.thinkificGroupId);
                        studentCount = count;

                        // Update local database with placeholder students.
                        await Class.findByIdAndUpdate(cls._id, {
                            $set: { students: Array(count).fill(null) }
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

/**
 * Creates a new class, alongside a corresponding Thinkific group.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
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
            ...otherFields
        } = req.body;

        // Format the class name
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
            lang
        });

        // Create the Thinkific group
        const thinkificResponse = await ThinkificService.createGroup({
            name: formattedClassName,
            description: `Group for ${formattedClassName} class`
        });

        // Retrieve the group ID from Thinkific
        const thinkificGroupId = thinkificResponse.group.id;

        // Create the new class in our local database
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

/**
 * Updates an existing class by ID.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const updateClass = async (req, res) => {
    try {
        const updatedClass = await Class.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('teacher coordinator rsf sf students', 'firstName lastName');

        if (!updatedClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json(updatedClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Retrieves detailed information about a single class, including Thinkific data.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const getClassDetails = async (req, res) => {
    try {
        const classDetails = await Class.findById(req.params.id)
            .populate('teacher coordinator rsf sf students', 'firstName lastName avatarUrl email');

        if (!classDetails) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Prepare Thinkific-related data
        let thinkificGroup = { name: 'N/A' };
        let students = [];

        try {
            // Get group name from Thinkific
            const groupResponse = await ThinkificService.getGroup(classDetails.thinkificGroupId);
            thinkificGroup.name = groupResponse?.name || 'N/A';

            // Get group users from Thinkific
            const usersResponse = await ThinkificService.getGroupUsers(classDetails.thinkificGroupId);
            students = usersResponse.map((user) => ({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatarUrl: user.avatar_url
            }));
        } catch (thinkificError) {
            console.error('Thinkific API Error:', thinkificError);
            // Fallback to local data if Thinkific call fails
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

/**
 * Assigns roles (teacher, coordinator, RSF, SF) to a user or users on both Thinkific and the local database.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const assignRoles = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userId, userIds, role } = req.body;

        const classObj = await Class.findById(classId);
        if (!classObj) {
            throw new Error('Class not found');
        }

        switch (role) {
            case 'teacher':
            case 'coordinator':
            case 'rsf': {
                // These roles are assigned to a single user
                if (!userId) {
                    throw new Error('User ID required');
                }
                const user = await User.findById(userId);
                if (!user?.thinkificId) {
                    throw new Error('User not synced with Thinkific');
                }

                // Add user to Thinkific group
                await ThinkificService.addUserToGroup(user.thinkificId, classObj.thinkificGroupId);

                // Update class in local database
                if (role === 'teacher') classObj.teacher = userId;
                if (role === 'coordinator') classObj.coordinator = userId;
                if (role === 'rsf') classObj.rsf = [userId];
                break;
            }

            case 'sf': {
                // This role can be assigned to multiple users
                if (!userIds?.length) {
                    throw new Error('User IDs required');
                }

                const sfUsers = await User.find({ _id: { $in: userIds } });
                const invalidUsers = sfUsers.filter((u) => !u.thinkificId);
                if (invalidUsers.length > 0) {
                    throw new Error(`${invalidUsers.length} users not synced with Thinkific`);
                }

                // Add all SF users to Thinkific group
                await Promise.all(
                    sfUsers.map((u) => ThinkificService.addUserToGroup(u.thinkificId, classObj.thinkificGroupId))
                );

                // Update class in local database (avoid duplicates)
                classObj.sf = [...new Set([...classObj.sf, ...userIds])];
                break;
            }

            default:
                throw new Error('Invalid role');
        }

        await classObj.save();

        // Populate the updated class before sending response
        const updatedClass = await Class.findById(classId).populate('teacher coordinator rsf sf');
        res.json({ success: true, class: updatedClass });
    } catch (error) {
        console.error('Error assigning roles:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Assigns students to a class, ensuring they belong to the student role.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const assignStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userIds } = req.body;

        // Validate input
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'Invalid student IDs format' });
        }

        // Verify all users are students
        const students = await User.find({
            _id: { $in: userIds },
            roles: { $in: ['student'] }
        }).select('_id');

        if (students.length !== userIds.length) {
            return res.status(400).json({
                error: 'Some users are not students or do not exist',
                invalidIds: userIds.filter(id =>
                    !students.some(s => s._id.toString() === id)
                )
            });
        }

        // Update class
        const classObj = await Class.findByIdAndUpdate(
            classId,
            { $addToSet: { students: { $each: userIds } } }, // Prevent duplicates
            { new: true, runValidators: true }
        ).populate('students', 'firstName lastName email roles');

        if (!classObj) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Update users' classes (optional)
        await User.updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { classes: classId } }
        );

        res.json({
            success: true,
            students: classObj.students,
            enrolledCount: userIds.length
        });

    } catch (error) {
        console.error('Student assignment error:', error);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
};

/**
 * Retrieves courses from Thinkific.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const getCourses = async (req, res) => {
    try {
        const courses = await ThinkificService.getCourses();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Assigns a Thinkific course to the specified class, enrolling existing group users in that course.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
export const assignCourse = async (req, res) => {
    try {
        const { classId } = req.params;
        const { courseId } = req.body;

        const classObj = await Class.findById(classId);
        if (!classObj) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Prevent duplicate course assignment
        if (classObj.courses?.some((c) => c.thinkificCourseId === courseId)) {
            return res.status(400).json({ error: 'Course already assigned' });
        }

        // Fetch all users from the Thinkific group
        const groupUsers = await ThinkificService.getGroupUsers(classObj.thinkificGroupId);

        // Filter out users already enrolled in the course
        const usersToEnroll = groupUsers.filter((user) => {
            const enrolledCourseIds = user.courses.edges.map((e) => e.node.id);
            return !enrolledCourseIds.includes(courseId);
        });

        // Bulk enroll the filtered users
        await ThinkificService.bulkEnrollUsers(courseId, usersToEnroll.map((u) => u.id));

        // Retrieve full course details for storage
        const course = await ThinkificService.getCourse(courseId);

        // Add the course to the class's list of courses
        classObj.courses = classObj.courses || [];
        classObj.courses.push({
            thinkificCourseId: courseId,
            name: course.name
        });
        await classObj.save();

        res.json({ success: true, enrolledCount: usersToEnroll.length });
    } catch (error) {
        console.error('assignCourse error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetches all Thinkific groups.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
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

/**
 * Fetches users within a specific Thinkific group.
 * @param {Object} req - Express.js request object.
 * @param {Object} res - Express.js response object.
 */
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
