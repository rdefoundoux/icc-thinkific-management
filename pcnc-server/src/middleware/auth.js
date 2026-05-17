import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import config from '../config/env.js';
import { Unauthorized, Forbidden } from '../lib/errors.js';
import { asyncHandler } from './requestContext.js';

/**
 * Load the current user from either an express-session entry or a Bearer JWT.
 * Populates req.user (without password).
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
    let userId = req.session?.user?.id || req.session?.user?._id;

    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.slice(7);
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            userId = decoded.sub || decoded.id;
        } catch {
            throw Unauthorized('Invalid or expired token');
        }
    }

    if (!userId) throw Unauthorized('Not authorized to access this route');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true, email: true, firstName: true, lastName: true,
            roles: true, thinkificId: true, lastLogin: true,
        },
    });
    if (!user) throw Unauthorized('User not found');

    req.user = user;
    next();
});

export const isAuthenticated = (req, _res, next) => {
    if (req.user) return next();
    return next(Unauthorized('Authentication required'));
};

const hasRole = (user, role) => Array.isArray(user?.roles) && user.roles.includes(role);

export const adminOnly = (req, _res, next) => {
    if (hasRole(req.user, 'admin') || hasRole(req.user, 'coordinator')) return next();
    return next(Forbidden('Admin privileges required'));
};

export const teacherOnly = (req, _res, next) => {
    if (hasRole(req.user, 'teacher')) return next();
    return next(Forbidden('Teacher access only'));
};

export const isAdmin = (req, _res, next) => {
    if (hasRole(req.user, 'admin')) return next();
    return next(Forbidden('Admin access required'));
};

export const isCoordinator = (req, _res, next) => {
    if (hasRole(req.user, 'coordinator')) return next();
    return next(Forbidden('Coordinator access required'));
};
