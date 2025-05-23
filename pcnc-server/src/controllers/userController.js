import User from '../models/User.js';
import Class from '../models/Class.js';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';


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
        const { email, firstName, lastName, roles = ['student'], password } = req.body;

        // Validate required fields
        if (!email || !firstName || !lastName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate password if not provided
        const plainPassword = password || uuidv4().slice(0, 12);
        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        // 1. Create Thinkific user (without roles)
        const thinkificUser = await ThinkificService.createUser({
            email,
            first_name: firstName,
            last_name: lastName,
            password: plainPassword
        });

        // 2. Create local user with Thinkific ID
        const user = await User.create({
            email,
            firstName,
            lastName,
            thinkificId: thinkificUser.id,
            password: hashedPassword,
            roles,
            requiresPasswordReset: !password
        });

        res.status(201).json({
            _id: user._id,
            email: user.email,
            roles: user.roles,
            thinkificId: user.thinkificId
        });

    } catch (error) {
        console.error('User creation error:', error);

        // Handle Thinkific errors
        const thinkificError = error.response?.data?.errors?.[0];
        if (thinkificError) {
            return res.status(400).json({
                error: `Thinkific: ${thinkificError.message}`,
                code: thinkificError.code
            });
        }

        res.status(400).json({
            error: error.message || 'User creation failed'
        });
    }
};

export const bulkCreateUsers = async (req, res) => {
    try {
        const users = req.body;
        const results = [];

        for (const userData of users) {
            try {
                const { email, firstName, lastName, roles = ['student'], password } = userData;

                // Generate password if not provided
                const plainPassword = password || uuidv4().slice(0, 12);
                const hashedPassword = await bcrypt.hash(plainPassword, 12);

                // 1. Create Thinkific user
                const thinkificUser = await ThinkificService.createUser({
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    password: plainPassword
                });

                // 2. Create local user
                const user = await User.create({
                    email,
                    firstName,
                    lastName,
                    thinkificId: thinkificUser.id,
                    password: hashedPassword,
                    roles,
                    requiresPasswordReset: !password
                });

                results.push({
                    success: true,
                    email,
                    userId: user._id,
                    thinkificId: user.thinkificId
                });

            } catch (error) {
                results.push({
                    success: false,
                    error: error.response?.data?.errors?.[0]?.message || error.message,
                    email: userData.email
                });
            }
        }

        res.json({
            total: users.length,
            successCount: results.filter(r => r.success).length,
            results
        });

    } catch (error) {
        res.status(500).json({
            error: 'Bulk operation failed: ' + error.message
        });
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
        const { classId, studentIds, action } = req.body;
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

        // Determine update operation based on action
        const updateOperation = action === 'remove'
            ? {
                $pull: {
                    managedStudents: { $in: studentIds },
                    managedClasses: classId
                }
            }
            : {
                $addToSet: {
                    managedStudents: { $each: studentIds },
                    managedClasses: classId
                }
            };

        // Update SF's managed students
        const sf = await User.findByIdAndUpdate(
            sfId,
            updateOperation,
            { new: true }
        );

        res.json(sf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const assignStudentsToRsf = async (req, res) => {
    try {
        const { classId, studentIds, action } = req.body;
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

        // Determine update operation based on action
        const updateOperation = action === 'remove'
            ? {
                $pull: {
                    managedStudents: { $in: studentIds },
                    managedClasses: classId
                }
            }
            : {
                $addToSet: {
                    managedStudents: { $each: studentIds },
                    managedClasses: classId
                }
            };

        // Update RSF's managed students
        const rsf = await User.findByIdAndUpdate(
            rsfId,
            updateOperation,
            { new: true }
        );

        res.json(rsf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

