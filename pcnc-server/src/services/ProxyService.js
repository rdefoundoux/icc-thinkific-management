import ProxyUser from '../models/ProxyUser.js';
import User from '../models/User.js';

const ROLE_MAPPING = {
    admin: 'site_admin',
    coordinator: 'course_admin',
    rsf: 'course_admin',
    sf: 'group_analyst',
    teacher: 'course_admin',
    traineeTeacher: 'student',
    student: 'student'
};

export class ProxyService {
    async getProxy(role) {
        const thinkificRole = ROLE_MAPPING[role];
        if (!thinkificRole) return null;
        const proxy = await ProxyUser.findOne({ role: thinkificRole, isActive: true }).sort({ lastUsed: 1 });
        if (!proxy) throw new Error(`No proxy available for role ${role}`);
        proxy.lastUsed = new Date();
        proxy.usageCount = (proxy.usageCount || 0) + 1;
        await proxy.save();
        return proxy;
    }

    async assignProxies(userId, roles) {
        const mappings = [];
        for (const role of roles) {
            const proxy = await this.getProxy(role);
            if (proxy) mappings.push({ role, proxyId: proxy._id });
        }
        await User.findByIdAndUpdate(userId, { proxyMappings: mappings });
    }
}
