import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const VALID_ROLES = ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'];

class UserSyncStrategy {
    async sync(_thinkificUser) {
        throw new Error('sync() method must be implemented');
    }

    mapBaseFields(thinkificUser) {
        return {
            email: thinkificUser.email,
            thinkificId: thinkificUser.id ? String(thinkificUser.id) : null,
            firstName: thinkificUser.first_name,
            lastName: thinkificUser.last_name,
            lastSyncAt: new Date(),
        };
    }

    async upsertUser(data, extraRoles = []) {
        if (!data.thinkificId) {
            logger.warn('upsertUser called without thinkificId, skipping');
            return null;
        }
        const safeRoles = (Array.isArray(extraRoles) ? extraRoles : [extraRoles])
            .filter((r) => VALID_ROLES.includes(r));

        return prisma.user.upsert({
            where: { thinkificId: data.thinkificId },
            update: {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                lastSyncAt: data.lastSyncAt,
            },
            create: {
                ...data,
                roles: safeRoles.length ? safeRoles : ['student'],
            },
        });
    }

    async upsertEnrollments(userId, enrollments) {
        if (!Array.isArray(enrollments)) return;
        for (const e of enrollments) {
            if (!e?.course_id) continue;
            await prisma.thinkificEnrollment.upsert({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: String(e.course_id),
                    },
                },
                update: {
                    status: e.activated_at ? 'active' : 'expired',
                    completedAt: e.completed_at ? new Date(e.completed_at) : null,
                },
                create: {
                    userId,
                    courseId: String(e.course_id),
                    status: e.activated_at ? 'active' : 'expired',
                    completedAt: e.completed_at ? new Date(e.completed_at) : null,
                },
            });
        }
    }
}

class StudentSyncStrategy extends UserSyncStrategy {
    async sync(thinkificUser) {
        const data = this.mapBaseFields(thinkificUser);
        const user = await this.upsertUser(data, ['student']);
        if (user) {
            await this.upsertEnrollments(user.id, thinkificUser.enrollments);
        }
        return user;
    }
}

class InstructorSyncStrategy extends UserSyncStrategy {
    async sync(thinkificUser) {
        const data = this.mapBaseFields(thinkificUser);
        return this.upsertUser(data, ['teacher']);
    }
}

export class UserSyncService {
    constructor() {
        this.strategies = {
            student: new StudentSyncStrategy(),
            instructor: new InstructorSyncStrategy(),
        };
    }

    getStrategy(thinkificUser) {
        if (thinkificUser.roles?.includes('instructor')) return this.strategies.instructor;
        return this.strategies.student;
    }

    async syncUser(thinkificUser) {
        const strategy = this.getStrategy(thinkificUser);
        return strategy.sync(thinkificUser);
    }
}

export const userSyncService = new UserSyncService();
