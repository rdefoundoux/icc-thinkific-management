import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
        return res.status(403).json({
            success: false,
            error: 'Admin privileges required'
        });
    }
    next();
};

export const teacherOnly = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            success: false,
            error: 'Teacher access only'
        });
    }
    next();
};
export const isAuthenticated = (req, res, next) => {
    if (req.user) return next();
    res.status(401).json({ error: 'Authentication required' });
};
export const isAdmin = (req, res, next) => {
    if (req.user?.roles.includes('admin')) return next();
    res.status(403).json({ error: 'Admin access required' });
};
export const isCoordinator = (req, res, next) => {
    if (req.user?.roles.includes('coordinator')) return next();
    res.status(403).json({ error: 'Coordinator access required' });
};

export default class authMiddleware {
}
