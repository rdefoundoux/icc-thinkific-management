import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { BadRequest, NotFound, Forbidden } from '../lib/errors.js';
import { asyncHandler } from '../middleware/requestContext.js';
import ThinkificService from '../services/ThinkificService.js';

const USER_PUBLIC_SELECT = {
    id: true,
    thinkificId: true,
    email: true,
    firstName: true,
    lastName: true,
    roles: true,
    whatsappNumber: true,
    city: true,
    country: true,
    gender: true,
    iccMember: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
};

export const getUsers = asyncHandler(async (req, res) => {
    const { role } = req.query;
    const where = role ? { roles: { has: role } } : {};

    const users = await prisma.user.findMany({
        where,
        select: USER_PUBLIC_SELECT,
        orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: users.length, data: users });
});

export const getUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
            ...USER_PUBLIC_SELECT,
            enrolledClasses: { include: { class: { select: { id: true, className: true, courseCode: true } } } },
        },
    });
    if (!user) throw NotFound('User not found');

    if (req.user && !req.user.roles?.includes('admin') && req.user.id !== user.id) {
        throw Forbidden('Not authorized');
    }

    res.json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        assignedClass: _ignored,
        password: _ignored2,
        thinkificEnrollments: _ignored3,
        managedStudents: _ignored4,
        managedClasses: _ignored5,
        proxyMappings: _ignored6,
        ...data
    } = req.body;

    const user = await prisma.user.update({
        where: { id },
        data,
        select: USER_PUBLIC_SELECT,
    });

    res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: {} });
});

export const changeUserRole = asyncHandler(async (req, res) => {
    const { role, roles } = req.body;
    const newRoles = Array.isArray(roles) ? roles : (role ? [role] : null);
    if (!newRoles) throw BadRequest('role or roles required');

    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { roles: newRoles },
        select: USER_PUBLIC_SELECT,
    });

    res.json({ success: true, data: user });
});

export const syncUserData = asyncHandler(async (req, res) => {
    const thinkificUser = req.body;
    if (!thinkificUser?.id) throw BadRequest('Thinkific user id required');

    const user = await prisma.user.upsert({
        where: { thinkificId: String(thinkificUser.id) },
        update: {
            email: thinkificUser.email,
            firstName: thinkificUser.first_name,
            lastName: thinkificUser.last_name,
            lastSyncAt: new Date(),
        },
        create: {
            thinkificId: String(thinkificUser.id),
            email: thinkificUser.email,
            firstName: thinkificUser.first_name,
            lastName: thinkificUser.last_name,
            lastSyncAt: new Date(),
        },
    });

    if (Array.isArray(thinkificUser.enrollments)) {
        for (const e of thinkificUser.enrollments) {
            if (!e?.course_id) continue;
            const status = e.activated_at ? 'active' : 'expired';
            await prisma.thinkificEnrollment.upsert({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: String(e.course_id),
                    },
                },
                update: { status },
                create: {
                    userId: user.id,
                    courseId: String(e.course_id),
                    status,
                },
            });
        }
    }

    res.json(user);
});

export const createUser = asyncHandler(async (req, res) => {
    const { email, firstName, lastName, roles = ['student'], password } = req.body;
    if (!email || !firstName || !lastName) throw BadRequest('Missing required fields');

    const plainPassword = password || uuidv4().slice(0, 12);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    let thinkificUser;
    try {
        thinkificUser = await ThinkificService.createUser({
            email,
            first_name: firstName,
            last_name: lastName,
            password: plainPassword,
        });
    } catch (err) {
        const thinkificError = err.response?.data?.errors?.[0];
        if (thinkificError) {
            throw BadRequest(`Thinkific: ${thinkificError.message}`, { code: thinkificError.code });
        }
        throw err;
    }

    const user = await prisma.user.create({
        data: {
            email,
            firstName,
            lastName,
            thinkificId: String(thinkificUser.id),
            password: hashedPassword,
            roles,
        },
        select: USER_PUBLIC_SELECT,
    });

    res.status(201).json(user);
});

export const bulkCreateUsers = asyncHandler(async (req, res) => {
    const users = req.body;
    if (!Array.isArray(users)) throw BadRequest('Body must be an array of users');

    const results = [];
    for (const userData of users) {
        try {
            const { email, firstName, lastName, roles = ['student'], password } = userData;
            const plainPassword = password || uuidv4().slice(0, 12);
            const hashedPassword = await bcrypt.hash(plainPassword, 12);

            const thinkificUser = await ThinkificService.createUser({
                email,
                first_name: firstName,
                last_name: lastName,
                password: plainPassword,
            });

            const user = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    thinkificId: String(thinkificUser.id),
                    password: hashedPassword,
                    roles,
                },
            });

            results.push({ success: true, email, userId: user.id, thinkificId: user.thinkificId });
        } catch (err) {
            results.push({
                success: false,
                error: err.response?.data?.errors?.[0]?.message || err.message,
                email: userData.email,
            });
        }
    }

    res.json({
        total: users.length,
        successCount: results.filter((r) => r.success).length,
        results,
    });
});

/**
 * Assign / unassign students to an SF user.
 * Updates the UserManagedStudent join table.
 */
export const assignStudentsToSf = asyncHandler(async (req, res) => {
    const { classId, studentIds, action } = req.body;
    const sfId = req.params.sfId;
    if (!Array.isArray(studentIds) || !classId) throw BadRequest('classId and studentIds required');

    const classObj = await prisma.class.findFirst({
        where: { id: classId, sf: { some: { userId: sfId } } },
        include: { students: { select: { userId: true } } },
    });
    if (!classObj) throw Forbidden('SF not in class');

    const classStudentIds = new Set(classObj.students.map((s) => s.userId));
    const invalidStudents = studentIds.filter((id) => !classStudentIds.has(id));
    if (invalidStudents.length) {
        throw BadRequest('Some students not in class', { invalidStudents });
    }

    if (action === 'remove') {
        await prisma.userManagedStudent.deleteMany({
            where: { managerId: sfId, studentId: { in: studentIds } },
        });
    } else {
        for (const studentId of studentIds) {
            await prisma.userManagedStudent.upsert({
                where: { managerId_studentId: { managerId: sfId, studentId } },
                update: {},
                create: { managerId: sfId, studentId },
            });
        }
    }

    const sf = await prisma.user.findUnique({
        where: { id: sfId },
        include: { managedStudents: true, managedClasses: true },
    });
    res.json(sf);
});

export const assignStudentsToRsf = asyncHandler(async (req, res) => {
    const { classId, studentIds, action } = req.body;
    const rsfId = req.params.rsfId;
    if (!Array.isArray(studentIds) || !classId) throw BadRequest('classId and studentIds required');

    const classObj = await prisma.class.findFirst({
        where: { id: classId, rsf: { some: { userId: rsfId } } },
        include: { students: { select: { userId: true } } },
    });
    if (!classObj) throw Forbidden('RSF not in class');

    const classStudentIds = new Set(classObj.students.map((s) => s.userId));
    const invalidStudents = studentIds.filter((id) => !classStudentIds.has(id));
    if (invalidStudents.length) {
        throw BadRequest('Some students not in class', { invalidStudents });
    }

    if (action === 'remove') {
        await prisma.userManagedStudent.deleteMany({
            where: { managerId: rsfId, studentId: { in: studentIds } },
        });
    } else {
        for (const studentId of studentIds) {
            await prisma.userManagedStudent.upsert({
                where: { managerId_studentId: { managerId: rsfId, studentId } },
                update: {},
                create: { managerId: rsfId, studentId },
            });
        }
    }

    const rsf = await prisma.user.findUnique({
        where: { id: rsfId },
        include: { managedStudents: true },
    });
    res.json(rsf);
});

export const listCourses = asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({ orderBy: { code: 'asc' } });
    res.json(courses);
});
