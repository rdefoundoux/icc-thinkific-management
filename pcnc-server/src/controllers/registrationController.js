import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { BadRequest, Conflict } from '../lib/errors.js';
import { asyncHandler } from '../middleware/requestContext.js';
import ThinkificService from '../services/ThinkificService.js';

/**
 * Assign a teacher to a class (local + Thinkific).
 */
export const assignTeacher = asyncHandler(async (req, res) => {
    const { teacherId, classId } = req.body;
    if (!teacherId || !classId) throw BadRequest('teacherId and classId required');

    const updated = await prisma.class.update({
        where: { id: classId },
        data: { teacherId },
    });

    if (typeof ThinkificService.assignTeacherToGroup === 'function') {
        try {
            await ThinkificService.assignTeacherToGroup(teacherId, updated.thinkificGroupId);
        } catch (err) {
            logger.warn({ err: err.message }, 'thinkific assignTeacherToGroup failed');
        }
    }

    res.json({ success: true });
});

/**
 * Create a class via the registration flow.
 * NB: This mirrors the original behaviour and is kept for backwards compatibility.
 */
export const createClass = asyncHandler(async (req, res) => {
    const { courseCode, teacherId } = req.body;
    if (!courseCode) throw BadRequest('courseCode required');

    if (teacherId) {
        const existing = await prisma.class.findFirst({ where: { teacherId } });
        if (existing) {
            throw Conflict('Ce professeur est déjà assigné à une autre classe');
        }
    }

    const thinkificGroup =
        typeof ThinkificService.createClassGroup === 'function'
            ? await ThinkificService.createClassGroup(`${courseCode}-${Date.now()}`, courseCode)
            : await ThinkificService.createGroup({
                  name: `${courseCode}-${Date.now()}`,
                  description: `Group for ${courseCode}`,
              }).then((r) => ({ id: r.group?.id || r.id }));

    const created = await prisma.class.create({
        data: {
            type: 'online',
            courseCode,
            month: '',
            year: new Date().getFullYear(),
            thinkificGroupId: String(thinkificGroup.id || thinkificGroup.group?.id),
            teacherId: teacherId || null,
        },
    });

    if (teacherId && typeof ThinkificService.assignTeacherToGroup === 'function') {
        try {
            await ThinkificService.assignTeacherToGroup(teacherId, created.thinkificGroupId);
        } catch (err) {
            logger.warn({ err: err.message }, 'thinkific assignTeacherToGroup failed');
        }
    }

    res.status(201).json({ success: true, data: created });
});

/**
 * Public student registration endpoint.
 *   POST /api/v1/registrations
 */
export const validateRegistration = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        whatsappNumber,
        address,
        city,
        postalCode,
        department,
        country,
        birthDate,
        gender,
        localChurch,
        nonIccChurch,
        iccMember,
        memberSince,
        iccCampus,
        staffMember,
        convertedDate,
        baptized,
        baptismDate,
        previousCourses,
        preferredSchedule,
        comments,
        gdprConsent,
        parentalAuth,
    } = req.body;

    if (!gdprConsent?.dataProcessing) {
        throw BadRequest('Le consentement RGPD est requis');
    }

    if (!email) throw BadRequest('email required');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw Conflict('Un utilisateur avec cet email existe déjà');
    }

    let age = null;
    if (birthDate) {
        const dob = new Date(birthDate);
        age = new Date().getFullYear() - dob.getFullYear();
    }
    if (age != null && age < 18 && !parentalAuth) {
        throw BadRequest('Parental authorization required for minors');
    }

    const user = await prisma.user.create({
        data: {
            email,
            firstName,
            lastName,
            whatsappNumber,
            address,
            city,
            postalCode,
            department,
            country,
            birthDate: birthDate ? new Date(birthDate) : null,
            gender,
            localChurch,
            nonIccChurch,
            iccMember: !!iccMember,
            memberSince: memberSince ? new Date(memberSince) : null,
            iccCampus,
            staffMember,
            convertedDate: convertedDate ? new Date(convertedDate) : null,
            baptized,
            baptismDate: baptismDate ? new Date(baptismDate) : null,
            previousCourses: Array.isArray(previousCourses) ? previousCourses : [],
            preferredSchedule,
            comments,
            roles: ['student'],
            gdprDataAccepted: !!gdprConsent.dataProcessing,
            gdprAcceptedAt: new Date(),
            ...(parentalAuth && {
                parentalAuth: {
                    create: {
                        signature: parentalAuth.signature || null,
                        signedAt: parentalAuth.signedAt ? new Date(parentalAuth.signedAt) : null,
                        parentName: parentalAuth.parentName || null,
                        parentEmail: parentalAuth.parentEmail || null,
                        parentPhone: parentalAuth.parentPhone || null,
                    },
                },
            }),
        },
        include: { parentalAuth: true },
    });

    logger.info({ userId: user.id, email: user.email }, 'user registered');

    const { password: _omit, ...userData } = user;
    res.status(201).json({ success: true, data: userData });
});
