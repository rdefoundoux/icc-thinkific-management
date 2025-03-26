import User from '../models/User.js';
import Class from '../models/Class.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
export const getUsers = asyncHandler(async (req, res) => {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter)
        .select('-password')
        .populate('assignedClass', 'name courseCode');

    res.json({ success: true, count: users.length, data: users });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password')
        .populate('assignedClass', 'name courseCode');

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
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

// @desc    Change user role
// @route   PUT /api/users/:id/role
// @access  Admin
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
