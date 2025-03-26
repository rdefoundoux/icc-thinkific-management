// services/thinkificService.js (Singleton Pattern)
import axios from 'axios';

class ThinkificService {
    static instance;

    constructor() {
        if (ThinkificService.instance) return ThinkificService.instance;

        this.config = {
            headers: {
                'X-Auth-API-Key': process.env.THINKIFIC_API_KEY,
                'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN
            }
        };

        ThinkificService.instance = this;
    }

    async createClassGroup(className, courseCode) {
        try {
            const response = await axios.post(
                'https://api.thinkific.com/api/public/v1/groups',
                { name: className, meta: { course_code: courseCode } },
                this.config
            );
            return response.data;
        } catch (error) {
            throw this.handleError('Group creation failed', error);
        }
    }

    async assignTeacherToGroup(teacherId, groupId) {
        try {
            await axios.post(
                `https://api.thinkific.com/api/public/v1/group_analysts/${teacherId}/groups`,
                { group_ids: [groupId] },
                this.config
            );
        } catch (error) {
            throw this.handleError('Teacher assignment failed', error);
        }
    }

    handleError(context, error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message;
        return new Error(`${context}: [${status}] ${message}`);
    }
}

export default new ThinkificService();
