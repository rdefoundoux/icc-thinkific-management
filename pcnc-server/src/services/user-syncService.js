// services/user-syncService.js (Enhanced Factory Pattern)
import User from '../models/User.js';

class UserSyncStrategy {
    async sync(thinkificUser) {
        throw new Error('sync() method must be implemented');
    }

    mapBaseFields(thinkificUser) {
        return {
            email: thinkificUser.email,
            thinkificId: thinkificUser.id,
            name: `${thinkificUser.first_name} ${thinkificUser.last_name}`,
            avatarUrl: thinkificUser.avatar_url,
            lastSyncedAt: new Date()
        };
    }
}

class StudentSyncStrategy extends UserSyncStrategy {
    async sync(thinkificUser) {
        const userData = {
            ...this.mapBaseFields(thinkificUser),
            role: 'student',
            enrollments: this.mapEnrollments(thinkificUser.enrollments)
        };

        return this.upsertUser(userData);
    }

    mapEnrollments(enrollments) {
        return enrollments?.map(e => ({
            courseId: e.course_id,
            status: e.activated_at ? 'active' : 'pending',
            progress: e.percentage_completed
        })) || [];
    }

    async upsertUser(data) {
        return User.findOneAndUpdate(
            { thinkificId: data.thinkificId },
            data,
            { new: true, upsert: true, runValidators: true }
        );
    }
}

class InstructorSyncStrategy extends UserSyncStrategy {
    async sync(thinkificUser) {
        const userData = {
            ...this.mapBaseFields(thinkificUser),
            role: 'teacher',
            teachingProfile: {
                bio: thinkificUser.bio,
                expertise: thinkificUser.custom_fields?.expertise || []
            }
        };

        return this.upsertUser(userData);
    }
}

export class UserSyncService {
    constructor() {
        this.strategies = {
            student: new StudentSyncStrategy(),
            instructor: new InstructorSyncStrategy()
        };
    }

    getStrategy(thinkificUser) {
        if (thinkificUser.roles?.includes('instructor')) {
            return this.strategies.instructor;
        }
        return this.strategies.student;
    }

    async syncUser(thinkificUser) {
        const strategy = this.getStrategy(thinkificUser);
        return strategy.sync(thinkificUser);
    }
}

export const userSyncService = new UserSyncService();
