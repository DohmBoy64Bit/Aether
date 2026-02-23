import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import prisma from '../utils/prisma.js';

/**
 * Admin middleware — extends authMiddleware.
 * Checks that the authenticated user has isAdmin=true.
 * Must be used AFTER authMiddleware in the middleware chain.
 */
export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { isAdmin: true }
        });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
