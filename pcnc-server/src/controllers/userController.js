import User from '../models/User.js';
import Class from '../models/Class.js';
import asyncHandler from 'express-async-handler';


export const getUsers = asyncHandler(async (req, res) => {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter)
        .select('-password')
        .populate('assignedClass', 'name courseCode');

    res.json({ success: true, count: users.length, data: users });
});


export const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password')
        .populate('assignedClass', 'name courseCode');

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
        console.log('Not authorized: ', req.user.role, ' vs. ', user.role, ' vs. ', req.user.id, ' vs. ', user.id, ' vs.')
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: user });
});


export const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    }).select('-password');

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Handle class assignment
    if (req.body.assignedClass) {
        await Class.findByIdAndUpdate(req.body.assignedClass, {
            $addToSet: { teachers: user._id }
        });
    }

    res.json({ success: true, data: user });
});


export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Remove user from assigned class
    if (user.assignedClass) {
        await Class.findByIdAndUpdate(user.assignedClass, {
            $pull: { teachers: user._id }
        });
    }

    await user.remove();
    res.json({ success: true, data: {} });
});


export const changeUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, data: user.toProfile() });
});

export const syncUserData = async (req, res) => {
    try {
        const thinkificUser = req.body;

        // Map Thinkific data to custom schema
        const userData = {
            email: thinkificUser.email,
            thinkificId: thinkificUser.id,
            profile: {
                firstName: thinkificUser.first_name,
                lastName: thinkificUser.last_name,
                customFields: thinkificUser.custom_profile_fields
            },
            courses: thinkificUser.enrollments.map(e => ({
                courseId: e.course_id,
                status: e.activated_at ? 'active' : 'pending'
            }))
        };

        // Upsert user in database
        const user = await User.findOneAndUpdate(
            { thinkificId: thinkificUser.id },
            userData,
            { new: true, upsert: true }
        );

        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Data sync failed' });
    }
};

export const createUser = async (req, res) => {
    try {
        const { roles, ...userData } = req.body;

        // Create local user
        const user = await User.create({
            ...userData,
            roles,
            isProxyUser: false
        });

        // Assign proxies for limited roles
        const proxyService = new ProxyService();
        await Promise.all(roles.map(async role => {
            if (ROLE_MAP[role] && LICENSE_LIMITS[ROLE_MAP[role]]) {
                await proxyService.assignProxy(user.id, ROLE_MAP[role]);
            }
        }));

        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const listCourses = async (req, res) => {
    try {
        const response = await axios.get(
            `${THINKIFIC_API}/courses`,
            { headers: req.thinkificHeaders }
        );

        // Audit logging
        await AuditLog.create({
            userId: req.user.id,
            proxyId: req.proxy._id,
            action: 'LIST_COURSES'
        });

        res.json(response.data);
    } catch (error) {
        res.status(502).json({ error: 'Upstream error' });
    }
};
export const assignStudentsToSf = async (req, res) => {
    try {
        const { classId, studentIds } = req.body;
        const sfId = req.params.sfId;

        // Verify SF exists and belongs to class
        const classObj = await Class.findOne({
            _id: classId,
            sf: sfId
        });

        if (!classObj) return res.status(403).json({ error: 'SF not in class' });

        // Verify all students belong to the class
        const invalidStudents = studentIds.filter(id =>
            !classObj.students.includes(id)
        );

        if (invalidStudents.length > 0) {
            return res.status(400).json({
                error: 'Some students not in class',
                invalidStudents
            });
        }

        // Update SF's managed students
        const sf = await User.findByIdAndUpdate(
            sfId,
            {
                $addToSet: {
                    managedStudents: { $each: studentIds },
                    managedClasses: classId
                }
            },
            { new: true }
        );

        res.json(sf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const assignStudentsToRsf = async (req, res) => {
    try {
        const { classId, studentIds } = req.body;
        const rsfId = req.params.rsfId;

        // Verify RSF exists and belongs to class
        const classObj = await Class.findOne({
            _id: classId,
            rsf: rsfId
        });

        if (!classObj) return res.status(403).json({ error: 'RSF not in class' });

        // Verify all students belong to the class
        const invalidStudents = studentIds.filter(id =>
            !classObj.students.includes(id)
        );

        if (invalidStudents.length > 0) {
            return res.status(400).json({
                error: 'Some students not in class',
                invalidStudents
            });
        }

        // Update RSF's managed students
        const rsf = await User.findByIdAndUpdate(
            rsfId,
            {
                $addToSet: {
                    managedStudents: { $each: studentIds },
                    managedClasses: classId
                }
            },
            { new: true }
        );

        res.json(rsf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

