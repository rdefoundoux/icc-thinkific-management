import { prisma } from '../lib/prisma.js';
import { ProxyService } from '../services/ProxyService.js';
import { Forbidden, Unauthorized } from '../lib/errors.js';
import { asyncHandler } from './requestContext.js';
import config from '../config/env.js';

/**
 * Attach Thinkific API headers for the current user based on the role
 * they are operating as. Picks the user's existing proxy mapping or
 * assigns a fresh proxy on the fly.
 */
export const withProxy = (role) =>
    asyncHandler(async (req, _res, next) => {
        if (!req.user?.id) throw Unauthorized('Authentication required');

        const mapping = await prisma.proxyMapping.findUnique({
            where: { userId_role: { userId: req.user.id, role } },
            include: { proxyUser: true },
        });

        let proxy = mapping?.proxyUser;
        if (!proxy) {
            const service = new ProxyService();
            proxy = await service.assignProxy(req.user.id, role);
            if (!proxy) throw Forbidden('Proxy assignment failed');
        }

        req.thinkificHeaders = {
            'X-Auth-Subdomain': config.THINKIFIC.SUBDOMAIN,
            Authorization: `Bearer ${proxy.apiToken}`,
        };
        req.proxy = proxy;
        next();
    });
