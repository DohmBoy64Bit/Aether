import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import prisma from '../utils/prisma.js';

const router = Router();

// All admin routes require auth + admin
router.use(authMiddleware as any);
router.use(adminMiddleware as any);

// ─── Stats ───────────────────────────────────────────────────────────────

router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers,
            aiUsers,
            humanUsers,
            totalPosts,
            flaggedPosts,
            pendingReports,
            totalModerationActions
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isAi: true } }),
            prisma.user.count({ where: { isAi: false } }),
            prisma.post.count(),
            prisma.post.count({ where: { flagged: true } }),
            prisma.report.count({ where: { status: 'PENDING' } }),
            prisma.moderationLog.count(),
        ]);

        res.json({
            totalUsers,
            aiUsers,
            humanUsers,
            totalPosts,
            flaggedPosts,
            pendingReports,
            totalModerationActions,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// ─── Moderation Log ──────────────────────────────────────────────────────

router.get('/moderation-log', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.moderationLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    post: {
                        select: {
                            id: true,
                            content: true,
                            userId: true,
                            flagged: true,
                            user: { select: { username: true, isAi: true, profileImage: true } }
                        }
                    }
                }
            }),
            prisma.moderationLog.count(),
        ]);

        res.json({
            logs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Moderation log error:', error);
        res.status(500).json({ error: 'Failed to fetch moderation log' });
    }
});

// ─── Flagged Posts ────────────────────────────────────────────────────────

router.get('/flagged-posts', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: { flagged: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, username: true, isAi: true, profileImage: true } },
                    _count: { select: { reports: true, interactions: true } },
                }
            }),
            prisma.post.count({ where: { flagged: true } }),
        ]);

        res.json({
            posts,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Flagged posts error:', error);
        res.status(500).json({ error: 'Failed to fetch flagged posts' });
    }
});

// ─── Reports ─────────────────────────────────────────────────────────────

router.get('/reports', async (req: AuthRequest, res: Response) => {
    try {
        const status = (req.query.status as string) || 'PENDING';
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where: { status },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    post: {
                        select: {
                            id: true,
                            content: true,
                            media: true,
                            flagged: true,
                            flagReason: true,
                            user: { select: { username: true, isAi: true, profileImage: true } }
                        }
                    },
                    reporter: { select: { username: true, profileImage: true } }
                }
            }),
            prisma.report.count({ where: { status } }),
        ]);

        res.json({
            reports,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// ─── Users ─────────────────────────────────────────────────────────────

router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const search = req.query.search as string || '';
        const status = req.query.status as string;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.username = { contains: search };
        }
        if (status) {
            where.status = status;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    isAi: true,
                    isAdmin: true,
                    profileImage: true,
                    createdAt: true,
                    status: true,
                    _count: { select: { posts: true, reports: true } }
                }
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/users/:id/action', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.id as string;
        const { action, reason } = req.body; // action: 'WARN', 'SUSPEND', 'BAN', 'RESTORE'

        let newStatus = 'ACTIVE';
        if (action === 'SUSPEND') newStatus = 'SUSPENDED';
        if (action === 'BAN') newStatus = 'BANNED';

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isAdmin) return res.status(403).json({ error: 'Cannot moderate admin users' });

        await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus as any }
        });

        await prisma.moderationLog.create({
            data: {
                action: `${action}_USER`,
                reason: reason || `User ${action.toLowerCase()}ed by admin`,
                adminId: req.user!.userId,
            }
        });

        res.json({ success: true, message: `User action ${action} applied successfully` });
    } catch (error) {
        console.error('User action error:', error);
        res.status(500).json({ error: 'Failed to apply user action' });
    }
});

// ─── Admin Actions ───────────────────────────────────────────────────────

// Approve a flagged post (unflag it)
router.post('/posts/:id/approve', async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;

        await prisma.post.update({
            where: { id: postId },
            data: { flagged: false, flagReason: null }
        });

        await prisma.moderationLog.create({
            data: {
                postId,
                action: 'MANUAL_APPROVE',
                reason: 'Approved by admin',
                adminId: req.user!.userId,
            }
        });

        // Mark any pending reports for this post as reviewed
        await prisma.report.updateMany({
            where: { postId, status: 'PENDING' },
            data: { status: 'REVIEWED' }
        });

        res.json({ success: true, message: 'Post approved' });
    } catch (error) {
        console.error('Approve post error:', error);
        res.status(500).json({ error: 'Failed to approve post' });
    }
});

// Bulk approve flagged posts
router.post('/posts/bulk-approve', async (req: AuthRequest, res: Response) => {
    try {
        const { postIds } = req.body;
        if (!Array.isArray(postIds)) return res.status(400).json({ error: 'Post IDs array is required' });

        await prisma.post.updateMany({
            where: { id: { in: postIds } },
            data: { flagged: false, flagReason: null }
        });

        const logs = postIds.map(postId => ({
            postId,
            action: 'MANUAL_APPROVE',
            reason: 'Bulk approved by admin',
            adminId: req.user!.userId,
        }));
        await prisma.moderationLog.createMany({ data: logs });

        await prisma.report.updateMany({
            where: { postId: { in: postIds }, status: 'PENDING' },
            data: { status: 'REVIEWED' }
        });

        res.json({ success: true, message: `${postIds.length} posts approved` });
    } catch (error) {
        console.error('Bulk approve posts error:', error);
        res.status(500).json({ error: 'Failed to bulk approve posts' });
    }
});

// Bulk flag posts
router.post('/posts/bulk-flag', async (req: AuthRequest, res: Response) => {
    try {
        const { postIds, reason } = req.body;
        if (!Array.isArray(postIds)) return res.status(400).json({ error: 'Post IDs array is required' });

        const flagReason = reason || 'Bulk flagged by admin';

        await prisma.post.updateMany({
            where: { id: { in: postIds } },
            data: { flagged: true, flagReason }
        });

        const logs = postIds.map(postId => ({
            postId,
            action: 'MANUAL_FLAG',
            reason: flagReason,
            adminId: req.user!.userId,
        }));
        await prisma.moderationLog.createMany({ data: logs });

        res.json({ success: true, message: `${postIds.length} posts flagged` });
    } catch (error) {
        console.error('Bulk flag posts error:', error);
        res.status(500).json({ error: 'Failed to bulk flag posts' });
    }
});

// Bulk delete posts permanently
router.post('/posts/bulk-delete', async (req: AuthRequest, res: Response) => {
    try {
        const { postIds } = req.body;
        if (!Array.isArray(postIds)) return res.status(400).json({ error: 'Post IDs array is required' });

        const logs = postIds.map(postId => ({
            postId,
            action: 'MANUAL_DELETE',
            reason: 'Bulk deleted by admin',
            adminId: req.user!.userId,
        }));
        await prisma.moderationLog.createMany({ data: logs });

        await prisma.post.deleteMany({
            where: { id: { in: postIds } },
        });

        res.json({ success: true, message: `${postIds.length} posts permanently deleted` });
    } catch (error) {
        console.error('Bulk delete posts error:', error);
        res.status(500).json({ error: 'Failed to bulk delete posts' });
    }
});

// Manually flag a post
router.post('/posts/:id/flag', async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const reason = req.body.reason || 'Flagged by admin';

        await prisma.post.update({
            where: { id: postId },
            data: { flagged: true, flagReason: reason }
        });

        await prisma.moderationLog.create({
            data: {
                postId,
                action: 'MANUAL_FLAG',
                reason,
                adminId: req.user!.userId,
            }
        });

        res.json({ success: true, message: 'Post flagged' });
    } catch (error) {
        console.error('Flag post error:', error);
        res.status(500).json({ error: 'Failed to flag post' });
    }
});

// Delete a post permanently
router.delete('/posts/:id', async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const reason = req.query.reason as string || 'Deleted by admin';

        // Log the moderation action BEFORE deleting the post.
        // Prisma's SetNull rule means this log will detach and survive the deletion!
        await prisma.moderationLog.create({
            data: {
                postId,
                action: 'MANUAL_DELETE',
                reason,
                adminId: req.user!.userId,
            }
        });

        await prisma.post.delete({
            where: { id: postId },
        });

        res.json({ success: true, message: 'Post permanently deleted' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Dismiss a report
router.post('/reports/:id/dismiss', async (req: AuthRequest, res: Response) => {
    try {
        const reportId = req.params.id as string;

        await prisma.report.update({
            where: { id: reportId },
            data: { status: 'DISMISSED' }
        });

        res.json({ success: true, message: 'Report dismissed' });
    } catch (error) {
        console.error('Dismiss report error:', error);
        res.status(500).json({ error: 'Failed to dismiss report' });
    }
});

// Bulk dismiss reports
router.post('/reports/bulk-dismiss', async (req: AuthRequest, res: Response) => {
    try {
        const { reportIds } = req.body;
        if (!Array.isArray(reportIds)) return res.status(400).json({ error: 'Report IDs array is required' });

        await prisma.report.updateMany({
            where: { id: { in: reportIds } },
            data: { status: 'DISMISSED' }
        });

        res.json({ success: true, message: `${reportIds.length} reports dismissed` });
    } catch (error) {
        console.error('Bulk dismiss reports error:', error);
        res.status(500).json({ error: 'Failed to bulk dismiss reports' });
    }
});

// Action on a report — flag the post and mark report as reviewed
router.post('/reports/:id/action', async (req: AuthRequest, res: Response) => {
    try {
        const reportId = req.params.id as string;

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { post: true }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Flag the post
        await prisma.post.update({
            where: { id: report.postId },
            data: { flagged: true, flagReason: `User report: ${report.reason}` }
        });

        // Log the moderation action
        await prisma.moderationLog.create({
            data: {
                postId: report.postId,
                action: 'REPORT_FLAG',
                reason: report.reason,
                adminId: req.user!.userId,
            }
        });

        // Mark this and all other pending reports for the same post
        await prisma.report.updateMany({
            where: { postId: report.postId, status: 'PENDING' },
            data: { status: 'REVIEWED' }
        });

        res.json({ success: true, message: 'Post flagged from report' });
    } catch (error) {
        console.error('Report action error:', error);
        res.status(500).json({ error: 'Failed to action report' });
    }
});

export default router;
