import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { BadRequest } from '../lib/errors.js';
import { asyncHandler } from '../middleware/requestContext.js';
import ThinkificService from '../services/ThinkificService.js';

const USER_BRIEF = {
    select: {
        id: true, firstName: true, lastName: true, email: true,
        roles: true, thinkificId: true,
    },
};

const CLASS_INCLUDE = {
    teacher: USER_BRIEF,
    coordinator: USER_BRIEF,
    rsf: { include: { user: USER_BRIEF } },
    sf: { include: { user: USER_BRIEF } },
    students: { include: { user: USER_BRIEF } },
};

function reshapeClass(cls) {
    if (!cls) return cls;
    return {
        ...cls,
        _id: cls.id,
        rsf: (cls.rsf || []).map((r) => r.user),
        sf: (cls.sf || []).map((s) => s.user),
        students: (cls.students || []).map((s) => s.user),
    };
}

export const getAdminClasses = asyncHandler(async (_req, res) => {
    const classes = await prisma.class.findMany({ include: CLASS_INCLUDE });
    res.json(classes.map(reshapeClass));
});

export const getPendingStudents = asyncHandler(async (_req, res) => {
    const students = await prisma.user.findMany({
        where: {
            thinkificId: null,
            roles: { has: 'student' },
        },
        include: { parentalAuth: true },
    });
    res.json(students);
});

export const validateStudents = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) throw BadRequest('studentIds must be an array');

    // Original "temporary" flag was a placeholder; here we simply confirm the records exist.
    const count = await prisma.user.count({ where: { id: { in: studentIds } } });
    res.json({ message: `${count} students validated` });
});

export const syncThinkificUsers = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) throw BadRequest('studentIds must be an array');

    const students = await prisma.user.findMany({ where: { id: { in: studentIds } } });

    const results = [];
    for (const student of students) {
        try {
            const thinkificUser = await ThinkificService.createUser({
                first_name: student.firstName,
                last_name: student.lastName,
                email: student.email,
            });
            const updated = await prisma.user.update({
                where: { id: student.id },
                data: { thinkificId: String(thinkificUser.id) },
            });
            results.push(updated);
        } catch (err) {
            logger.warn({ err: err.message, studentId: student.id }, 'thinkific sync failed');
            results.push({ id: student.id, error: err.message });
        }
    }

    res.json(results);
});

export const getCoordinators = asyncHandler(async (_req, res) => {
    const coordinators = await prisma.user.findMany({
        where: { roles: { has: 'coordinator' } },
        include: {
            coordinatedClasses: {
                select: {
                    id: true,
                    thinkificGroupName: true,
                    teacher: { select: { firstName: true, lastName: true } },
                    students: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
                },
            },
        },
    });

    const reshaped = coordinators.map((c) => ({
        ...c,
        managedClasses: c.coordinatedClasses.map((cls) => ({
            ...cls,
            students: cls.students.map((s) => s.user),
        })),
    }));

    res.json(reshaped);
});

export const getSFs = asyncHandler(async (_req, res) => {
    const sfs = await prisma.user.findMany({
        where: { roles: { has: 'sf' } },
        include: {
            managedClasses: {
                include: {
                    class: {
                        select: {
                            id: true,
                            thinkificGroupName: true,
                            teacher: { select: { firstName: true, lastName: true } },
                            students: {
                                include: { user: { select: { id: true, firstName: true, lastName: true } } },
                            },
                        },
                    },
                },
            },
        },
    });

    const reshaped = sfs.map((sf) => ({
        ...sf,
        managedClasses: sf.managedClasses.map((mc) => ({
            ...mc.class,
            students: mc.class.students.map((s) => s.user),
        })),
    }));

    res.json(reshaped);
});

export const assignStudentsToClasses = asyncHandler(async (req, res) => {
    const { assignments } = req.body;
    if (!Array.isArray(assignments)) throw BadRequest('assignments must be an array');

    const results = [];
    for (const { classId, studentId } of assignments) {
        const classDoc = await prisma.class.findUnique({ where: { id: classId } });
        if (!classDoc) {
            results.push({ classId, studentId, success: false, message: 'Class not found' });
            continue;
        }
        try {
            await prisma.classStudent.upsert({
                where: { classId_userId: { classId, userId: studentId } },
                update: {},
                create: { classId, userId: studentId },
            });
            results.push({ classId, studentId, success: true });
        } catch (err) {
            results.push({ classId, studentId, success: false, message: err.message });
        }
    }

    res.json({ results });
});
