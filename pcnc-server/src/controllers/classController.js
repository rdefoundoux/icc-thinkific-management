import moment from 'moment';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { BadRequest, NotFound } from '../lib/errors.js';
import { asyncHandler } from '../middleware/requestContext.js';

import ThinkificService from '../services/ThinkificService.js';
import CourseService from '../services/CourseService.js';
import AttendanceService from '../services/AttendanceService.js';

const attendanceService = new AttendanceService();

// ── Course code enum mapping (Prisma enum vs persisted string "001"/"101"/"201") ──
const COURSE_CODE_TO_ENUM = { '001': 'C001', '101': 'C101', '201': 'C201' };
const COURSE_ENUM_VALUES = ['C001', 'C101', 'C201'];

function courseCodeToEnum(code) {
    return COURSE_CODE_TO_ENUM[String(code)] || code;
}

// ── Includes used to populate class records consistently ──
const USER_BRIEF = {
    select: {
        id: true, firstName: true, lastName: true, email: true,
        roles: true, thinkificId: true,
    },
};

const STUDENT_BRIEF = {
    select: {
        id: true, firstName: true, lastName: true, email: true,
        whatsappNumber: true, city: true, country: true, gender: true,
        iccMember: true, thinkificId: true,
        thinkificEnrollments: {
            select: { courseId: true, status: true, completedAt: true },
        },
        attendanceSummaries: {
            select: { name: true, presentDays: true, totalDays: true },
        },
        testScores: { select: { name: true, score: true, date: true } },
        testsAverage: true,
    },
};

const CLASS_INCLUDE = {
    teacher: USER_BRIEF,
    coordinator: USER_BRIEF,
    rsf: { include: { user: USER_BRIEF } },
    sf: { include: { user: USER_BRIEF } },
    students: { include: { user: STUDENT_BRIEF } },
    courses: true,
};

/**
 * Reshape the Prisma row so consumers see flat arrays for rsf/sf/students
 * (the original Mongoose-shaped API).
 */
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

function reshapeStudentWithProgression(student, courseCode, allCourses) {
    const enrolledCourses = allCourses
        .filter((course) =>
            student.thinkificEnrollments?.some(
                (e) => e.courseId === course.thinkificId && e.status === 'active',
            ),
        )
        .map((course) => course.code);

    return {
        ...student,
        enrolledCourses,
        canProgress: checkProgression(student, courseCode),
    };
}

const formatClassName = ({
    type, region, version, className, courseCode,
    month, year, dayName, hour, minutes, lang,
}) => {
    const time = `${hour}h${minutes}`;
    if (type === 'onsite') {
        return `ONSITE - ${region} - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    }
    return `Corp - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
};

export const getClasses = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [classes, total] = await Promise.all([
        prisma.class.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: CLASS_INCLUDE,
        }),
        prisma.class.count(),
    ]);

    const classesWithStudentCounts = await Promise.all(
        classes.map(async (cls) => {
            const reshaped = reshapeClass(cls);
            let studentCount = reshaped.students?.length || 0;

            if (studentCount === 0 && cls.thinkificGroupId) {
                try {
                    const count = await ThinkificService.getGroupUsersCount(cls.thinkificGroupId);
                    studentCount = count
                        - (cls.teacherId ? 1 : 0)
                        - (cls.coordinatorId ? 1 : 0)
                        - (cls.sf?.length || 0)
                        - (cls.rsf?.length || 0);
                } catch (err) {
                    logger.warn({ err: err.message, classId: cls.id }, 'thinkific student count failed');
                }
            }

            return { ...reshaped, studentCount };
        }),
    );

    res.json({ data: classesWithStudentCounts, total });
});

export const getClassesForRegistration = asyncHandler(async (_req, res) => {
    const classes = await prisma.class.findMany({
        where: { registrable: true },
        select: {
            id: true,
            courseCode: true,
            thinkificGroupName: true,
            registrable: true,
        },
    });

    res.json({
        success: true,
        data: classes.map((c) => ({ ...c, _id: c.id })),
    });
});

export const getClassesByTeacher = asyncHandler(async (req, res) => {
    const classes = await prisma.class.findMany({
        where: { teacherId: req.params.teacherId },
        include: CLASS_INCLUDE,
    });

    res.json({ data: classes.map(reshapeClass) });
});

export const createClass = asyncHandler(async (req, res) => {
    const {
        type, region, version, className, courseCode,
        month, year, dayName, hour, minutes, lang,
        ...otherFields
    } = req.body;

    const formattedClassName = formatClassName({
        type, region, version, className, courseCode,
        month, year, dayName, hour, minutes, lang,
    });

    const thinkificResponse = await ThinkificService.createGroup({
        name: formattedClassName,
        description: `Group for ${formattedClassName} class`,
    });

    const thinkificGroupId = String(thinkificResponse.group.id);
    const thinkificGroupName = thinkificResponse.group.name;

    const newClass = await prisma.class.create({
        data: {
            type,
            region,
            version,
            className,
            courseCode,
            month,
            year: typeof year === 'string' ? parseInt(year, 10) : year,
            dayName,
            hour: hour != null ? String(hour) : null,
            minutes: minutes != null ? String(minutes) : null,
            lang,
            thinkificGroupId,
            thinkificGroupName,
            registrable: otherFields.registrable ?? true,
        },
    });

    res.status(201).json({ ...newClass, _id: newClass.id });
});

export const updateClass = asyncHandler(async (req, res) => {
    const classId = req.params.id;
    const {
        type, region, version, className, courseCode,
        month, year, dayName, hour, minutes, lang,
        ...otherFields
    } = req.body;

    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) throw NotFound('Class not found');

    const formattedClassName = formatClassName({
        type, region, version, className, courseCode,
        month, year, dayName, hour, minutes, lang,
    });

    const data = {
        type, region, version, className, courseCode,
        month, dayName, lang,
        thinkificGroupName: formattedClassName,
    };
    if (year != null) data.year = typeof year === 'string' ? parseInt(year, 10) : year;
    if (hour != null) data.hour = String(hour);
    if (minutes != null) data.minutes = String(minutes);
    if (otherFields.registrable != null) data.registrable = otherFields.registrable;

    const updated = await prisma.class.update({
        where: { id: classId },
        data,
    });

    res.json({ success: true, data: { ...updated, _id: updated.id } });
});

export const getClassDetails = asyncHandler(async (req, res) => {
    const classDetails = await prisma.class.findUnique({
        where: { id: req.params.id },
        include: CLASS_INCLUDE,
    });
    if (!classDetails) throw NotFound('Class not found');

    const reshaped = reshapeClass(classDetails);

    let thinkificGroup = { name: 'N/A' };
    let students = reshaped.students;

    if (classDetails.thinkificGroupId) {
        try {
            const groupResponse = await ThinkificService.getGroup(classDetails.thinkificGroupId);
            thinkificGroup.name = groupResponse?.name || groupResponse?.group?.name || 'N/A';

            const usersResponse = await ThinkificService.getGroupUsers(classDetails.thinkificGroupId);
            students = usersResponse.map((user) => ({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatarUrl: user.avatar_url,
            }));
        } catch (err) {
            logger.warn({ err: err.message }, 'Thinkific API error in getClassDetails');
        }
    }

    res.json({ ...reshaped, thinkificGroup, students });
});

export const getClassStudents = asyncHandler(async (req, res) => {
    const classObj = await prisma.class.findUnique({
        where: { id: req.params.classId },
        include: { students: { include: { user: USER_BRIEF } } },
    });
    if (!classObj) throw NotFound('Class not found');

    res.json({
        success: true,
        students: classObj.students.map((s) => s.user),
    });
});

/**
 * Assigns a role (teacher, coordinator, RSF, SF) to a user (or users).
 */
export const assignRoles = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { userId, userIds, role } = req.body;

    const classObj = await prisma.class.findUnique({ where: { id: classId } });
    if (!classObj) throw NotFound('Class not found');

    switch (role) {
        case 'teacher':
        case 'coordinator': {
            if (!userId) throw BadRequest('User ID required');
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.thinkificId) throw BadRequest('User not synced with Thinkific');

            await ThinkificService.addUserToGroup(user.thinkificId, classObj.thinkificGroupId);
            await prisma.class.update({
                where: { id: classId },
                data: role === 'teacher' ? { teacherId: userId } : { coordinatorId: userId },
            });
            break;
        }
        case 'rsf': {
            if (!userId) throw BadRequest('User ID required');
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.thinkificId) throw BadRequest('User not synced with Thinkific');

            await ThinkificService.addUserToGroup(user.thinkificId, classObj.thinkificGroupId);
            await prisma.classRSF.deleteMany({ where: { classId } });
            await prisma.classRSF.create({ data: { classId, userId } });
            break;
        }
        case 'sf': {
            if (!Array.isArray(userIds) || userIds.length === 0) {
                throw BadRequest('User IDs required');
            }
            const sfUsers = await prisma.user.findMany({ where: { id: { in: userIds } } });
            const invalidUsers = sfUsers.filter((u) => !u.thinkificId);
            if (invalidUsers.length > 0) {
                throw BadRequest(`${invalidUsers.length} users not synced with Thinkific`);
            }

            await Promise.all(
                sfUsers.map((u) =>
                    ThinkificService.addUserToGroup(u.thinkificId, classObj.thinkificGroupId),
                ),
            );

            for (const uid of userIds) {
                await prisma.classSF.upsert({
                    where: { classId_userId: { classId, userId: uid } },
                    update: {},
                    create: { classId, userId: uid },
                });
            }
            break;
        }
        default:
            throw BadRequest('Invalid role');
    }

    const updatedClass = await prisma.class.findUnique({
        where: { id: classId },
        include: CLASS_INCLUDE,
    });
    res.json({ success: true, class: reshapeClass(updatedClass) });
});

export const assignStudents = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw BadRequest('Invalid student IDs format');
    }

    const students = await prisma.user.findMany({
        where: {
            id: { in: userIds },
            roles: { has: 'student' },
        },
        select: { id: true, thinkificId: true },
    });

    if (students.length !== userIds.length) {
        throw BadRequest('Some users are not students or do not exist', {
            invalidIds: userIds.filter((id) => !students.some((s) => s.id === id)),
        });
    }

    const classObj = await prisma.class.findUnique({
        where: { id: classId },
        select: { thinkificGroupId: true },
    });
    if (!classObj) throw NotFound('Class not found');

    await Promise.all(
        students.map(async (student) => {
            if (student.thinkificId && classObj.thinkificGroupId) {
                await ThinkificService.addUserToGroup(
                    student.thinkificId,
                    classObj.thinkificGroupId,
                );
            }
        }),
    );

    for (const uid of userIds) {
        await prisma.classStudent.upsert({
            where: { classId_userId: { classId, userId: uid } },
            update: {},
            create: { classId, userId: uid },
        });
    }

    const updated = await prisma.class.findUnique({
        where: { id: classId },
        include: { students: { include: { user: USER_BRIEF } } },
    });

    res.json({
        success: true,
        students: updated.students.map((s) => s.user),
        enrolledCount: userIds.length,
    });
});

export const getCourses = asyncHandler(async (_req, res) => {
    const courses = await ThinkificService.getCourses();
    res.json(courses);
});

export const assignCourse = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { courseId } = req.body;

    const classObj = await prisma.class.findUnique({
        where: { id: classId },
        include: { courses: true },
    });
    if (!classObj) throw NotFound('Class not found');

    if (classObj.courses?.some((c) => c.thinkificCourseId === String(courseId))) {
        throw BadRequest('Course already assigned');
    }

    const groupUsers = await ThinkificService.getGroupUsers(classObj.thinkificGroupId);
    const usersToEnroll = groupUsers.filter((user) => {
        const enrolledCourseIds = user.courses?.edges?.map((e) => e.node.id) || [];
        return !enrolledCourseIds.includes(courseId);
    });

    await ThinkificService.bulkEnrollUsers(courseId, usersToEnroll.map((u) => u.id));

    const course = await ThinkificService.getCourse(courseId);
    await prisma.classCourse.create({
        data: {
            classId,
            thinkificCourseId: String(courseId),
            name: course?.name || null,
        },
    });

    res.json({ success: true, enrolledCount: usersToEnroll.length });
});

export const getGroups = asyncHandler(async (_req, res) => {
    const groups = await ThinkificService.getGroups();
    res.json(groups);
});

export const getGroupUsers = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const users = await ThinkificService.getGroupUsers(groupId);
    res.json(users);
});

export const getClassesBySF = asyncHandler(async (req, res) => {
    const allCourses = await prisma.course.findMany({
        where: { code: { in: COURSE_ENUM_VALUES } },
    });

    const sfUser = await prisma.user.findUnique({
        where: { id: req.params.sfId },
        include: {
            managedStudents: {
                include: { student: STUDENT_BRIEF },
            },
        },
    });
    if (!sfUser) throw NotFound('SF user not found');

    const managedIds = new Set(sfUser.managedStudents.map((m) => m.studentId));

    const classes = await prisma.class.findMany({
        where: { sf: { some: { userId: req.params.sfId } } },
        include: CLASS_INCLUDE,
    });

    const classesWithProgression = classes.map((cls) => {
        const reshaped = reshapeClass(cls);
        return {
            ...reshaped,
            students: reshaped.students
                .filter((s) => managedIds.has(s.id))
                .map((student) =>
                    reshapeStudentWithProgression(student, cls.courseCode, allCourses),
                ),
        };
    });

    res.json({ data: classesWithProgression });
});

const checkProgression = (student, currentCourseCode) => {
    const requiredAverage = String(currentCourseCode) === '201' ? 80 : 70;
    const average = student.testsAverage ?? 0;
    return average >= requiredAverage;
};

export const updateStudentResults = asyncHandler(async (req, res) => {
    const { attendance = [], results = {}, enrolledCourses = [] } = req.body;
    const studentId = req.params.studentId;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw NotFound('Student not found');

    const allCourses = await prisma.course.findMany({
        where: { code: { in: COURSE_ENUM_VALUES } },
    });

    // Reset & rewrite attendance summaries
    await prisma.attendanceSummary.deleteMany({ where: { userId: studentId } });
    if (Array.isArray(attendance) && attendance.length) {
        await prisma.attendanceSummary.createMany({
            data: attendance.map((a) => ({
                userId: studentId,
                name: a.name,
                presentDays: a.presentDays || 0,
                totalDays: a.totalDays || 0,
            })),
        });
    }

    // Reset & rewrite test scores
    await prisma.testScore.deleteMany({ where: { userId: studentId } });
    if (Array.isArray(results.tests) && results.tests.length) {
        await prisma.testScore.createMany({
            data: results.tests.map((t) => ({
                userId: studentId,
                name: t.name,
                score: t.score,
                date: t.date ? new Date(t.date) : new Date(),
            })),
        });
    }

    await prisma.user.update({
        where: { id: studentId },
        data: { testsAverage: results.average ?? null },
    });

    // Update Thinkific enrollment statuses based on enrolledCourses
    for (const course of allCourses) {
        const codeStr = course.code.replace(/^C/, ''); // C001 -> "001"
        const isActive = enrolledCourses.includes(codeStr);
        await prisma.thinkificEnrollment.upsert({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId: course.thinkificId,
                },
            },
            update: { status: isActive ? 'active' : 'expired' },
            create: {
                userId: studentId,
                courseId: course.thinkificId,
                status: isActive ? 'active' : 'expired',
            },
        });
    }

    const updated = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            attendanceSummaries: true,
            testScores: true,
            thinkificEnrollments: true,
        },
    });

    res.json({
        attendance: updated.attendanceSummaries,
        results: { average: updated.testsAverage, tests: updated.testScores },
        thinkificEnrollments: updated.thinkificEnrollments,
    });
});

export const syncEnrollment = asyncHandler(async (req, res) => {
    const { studentId, enrollmentChanges, language, classId } = req.body;
    const { added = [], removed = [] } = enrollmentChanges || {};

    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { thinkificId: true },
    });
    if (!student?.thinkificId) throw BadRequest('Student not synced with Thinkific');

    const resolveCourse = async (courseCode) => {
        const enumCode = courseCodeToEnum(courseCode);
        let course = await prisma.course.findUnique({
            where: { code_language: { code: enumCode, language: language || 'english' } },
        });
        if (!course) {
            await CourseService.syncCourses();
            course = await prisma.course.findUnique({
                where: { code_language: { code: enumCode, language: language || 'english' } },
            });
        }
        return course;
    };

    const coursesToEnroll = (
        await Promise.all(added.map((c) => resolveCourse(c)))
    ).filter(Boolean);
    const unenrolledCourses = (
        await Promise.all(removed.map((c) => resolveCourse(c)))
    ).filter(Boolean);

    const enrolledIds = coursesToEnroll.map((c) => c.thinkificId);
    const unenrolledIds = unenrolledCourses.map((c) => c.thinkificId);

    await Promise.all([
        ...coursesToEnroll.map(async (course) => {
            await ThinkificService.enrollUserInCourse(student.thinkificId, course.thinkificId);
            if (classId) {
                const classObj = await prisma.class.findUnique({
                    where: { id: classId },
                    select: { thinkificGroupId: true },
                });
                if (classObj?.thinkificGroupId) {
                    await ThinkificService.addUserToGroup(
                        student.thinkificId,
                        classObj.thinkificGroupId,
                    );
                }
            }
        }),
        ...unenrolledIds.map((id) =>
            ThinkificService.unenrollUserFromCourse(student.thinkificId, id),
        ),
    ]);

    // Update local enrollment records
    for (const courseId of enrolledIds) {
        await prisma.thinkificEnrollment.upsert({
            where: { userId_courseId: { userId: studentId, courseId } },
            update: { status: 'active' },
            create: { userId: studentId, courseId, status: 'active' },
        });
    }
    if (unenrolledIds.length) {
        await prisma.thinkificEnrollment.deleteMany({
            where: { userId: studentId, courseId: { in: unenrolledIds } },
        });
    }

    res.json({ success: true });
});

export const getClassesByCoordinator = asyncHandler(async (req, res) => {
    const allCourses = await prisma.course.findMany({
        where: { code: { in: COURSE_ENUM_VALUES } },
    });

    const classes = await prisma.class.findMany({
        where: { coordinatorId: req.params.coordinatorId },
        include: CLASS_INCLUDE,
    });

    const classesWithProgression = classes.map((cls) => {
        const reshaped = reshapeClass(cls);
        return {
            ...reshaped,
            students: reshaped.students.map((student) => ({
                ...reshapeStudentWithProgression(student, cls.courseCode, allCourses),
                classId: cls.id,
            })),
        };
    });

    res.json({ data: classesWithProgression });
});

function getMonthNumber(monthName) {
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    return months.indexOf(monthName) + 1;
}

export const createZoomMeeting = asyncHandler(async (req, res) => {
    const classId = req.params.id;
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) throw NotFound('Class not found');

    const monthNum = getMonthNumber(classData.month);
    const classStartTime = moment(
        `${classData.year}-${monthNum}-01 ${classData.hour}:${classData.minutes}`,
        'YYYY-M-D H:m',
    );
    const meetingStartTime = classStartTime.clone().subtract(15, 'minutes');

    const meetingParams = {
        topic: classData.thinkificGroupName || `Class ${classData.id}`,
        type: 2,
        start_time: meetingStartTime.toISOString(),
        duration: 150,
        timezone: 'UTC',
        settings: {
            join_before_host: true,
            waiting_room: false,
            mute_upon_entry: true,
        },
    };

    const zoomUserIds = process.env.ZOOM_USER_IDS?.split(',') || ['me'];
    const result = await attendanceService.createAutoAssignedMeeting(
        meetingParams,
        zoomUserIds,
        2,
    );

    if (!result.success) {
        throw BadRequest(result.error || 'Failed to create Zoom meeting');
    }

    const updated = await prisma.class.update({
        where: { id: classId },
        data: {
            zoomMeetingId: result.meetingId ? String(result.meetingId) : null,
            zoomJoinUrl: result.joinUrl,
            zoomStartUrl: result.startUrl,
            zoomPassword: result.password,
            zoomHostUserId: result.userId,
            zoomHostEmail: result.hostEmail,
            zoomCreatedAt: new Date(),
            zoomScheduledFor: meetingStartTime.toDate(),
        },
    });

    res.json({
        success: true,
        meeting: {
            meetingId: updated.zoomMeetingId,
            joinUrl: updated.zoomJoinUrl,
            startUrl: updated.zoomStartUrl,
            password: updated.zoomPassword,
            hostUserId: updated.zoomHostUserId,
            hostEmail: updated.zoomHostEmail,
            createdAt: updated.zoomCreatedAt,
            scheduledFor: updated.zoomScheduledFor,
        },
    });
});
