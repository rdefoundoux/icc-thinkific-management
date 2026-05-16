import { prisma } from '../lib/prisma.js';
import { AppError, NotFound } from '../lib/errors.js';

const ROLE_TO_PROXY_ROLE = {
    admin: 'site_admin',
    coordinator: 'course_admin',
    rsf: 'course_admin',
    sf: 'group_analyst',
    teacher: 'course_admin',
    student: 'group_analyst',
};

export class ProxyService {
    /**
     * Pick the least-recently-used active proxy for the given local role.
     * Updates lastUsed / usageCount atomically.
     */
    async getProxy(role) {
        const proxyRole = ROLE_TO_PROXY_ROLE[role];
        if (!proxyRole) return null;

        const proxy = await prisma.proxyUser.findFirst({
            where: { role: proxyRole, isActive: true },
            orderBy: { lastUsed: { sort: 'asc', nulls: 'first' } },
        });
        if (!proxy) {
            throw new AppError(`No proxy available for role ${role}`, {
                status: 503, code: 'PROXY_UNAVAILABLE',
            });
        }

        return prisma.proxyUser.update({
            where: { id: proxy.id },
            data: {
                lastUsed: new Date(),
                usageCount: { increment: 1 },
            },
        });
    }

    /**
     * Assign proxies to a user for each role they hold.
     * Writes into the ProxyMapping join table.
     */
    async assignProxies(userId, roles) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw NotFound('User not found');

        for (const role of roles) {
            const proxy = await this.getProxy(role);
            if (!proxy) continue;
            await prisma.proxyMapping.upsert({
                where: { userId_role: { userId, role } },
                update: { proxyUserId: proxy.id },
                create: { userId, role, proxyUserId: proxy.id },
            });
        }
    }

    async assignProxy(userId, role) {
        const proxy = await this.getProxy(role);
        if (!proxy) return null;
        await prisma.proxyMapping.upsert({
            where: { userId_role: { userId, role } },
            update: { proxyUserId: proxy.id },
            create: { userId, role, proxyUserId: proxy.id },
        });
        return proxy;
    }
}

export default ProxyService;
