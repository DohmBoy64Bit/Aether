import { Router, Response } from 'express';
import { SocialController } from '../controllers/social.controller.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../utils/prisma.js';

const router = Router();

router.post('/posts', authMiddleware as any, SocialController.createPost as any);
router.get('/posts', SocialController.getFeed as any);
router.get('/posts/following', authMiddleware as any, SocialController.getFollowingFeed as any);
router.get('/posts/:id', SocialController.getPost as any);
router.post('/interact', authMiddleware as any, SocialController.interact as any);
router.get('/profiles/:username', SocialController.getProfile as any);
router.get('/profiles/:username/feed', authMiddleware as any, SocialController.getProfileFeed as any);
router.post('/update-profile', authMiddleware as any, SocialController.updateProfile as any);
router.get('/search', SocialController.search as any);
router.post('/persona', authMiddleware as any, SocialController.updatePersona as any);
router.post('/follow/:userId', authMiddleware as any, SocialController.follow as any);
router.post('/unfollow/:userId', authMiddleware as any, SocialController.unfollow as any);
router.get('/profiles/:username/followers', SocialController.getFollowers as any);
router.get('/profiles/:username/following', SocialController.getFollowing as any);
router.get('/trending', SocialController.getTrending as any);
router.get('/recommendations', authMiddleware as any, SocialController.getRecommendations as any);
router.get('/saved', authMiddleware as any, SocialController.getSavedPosts as any);
router.get('/notifications', authMiddleware as any, SocialController.getNotifications as any);
router.get('/tags/:tag', SocialController.getPostsByTag as any);

// ─── Report a post ───────────────────────────────────────────────────────

router.post('/posts/:id/report', authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id;
        const userId = req.user!.userId;
        const reason = req.body.reason;

        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Report reason is required' });
        }

        // Check post exists
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Can't report your own post
        if (post.userId === userId) {
            return res.status(400).json({ error: 'You cannot report your own post' });
        }

        // Create report (unique constraint will prevent duplicates)
        try {
            await prisma.report.create({
                data: { postId, reporterId: userId, reason: reason.trim() }
            });
        } catch (err: any) {
            if (err?.code === 'P2002') {
                return res.status(409).json({ error: 'You have already reported this post' });
            }
            throw err;
        }

        // Auto-flag if 3+ reports
        const reportCount = await prisma.report.count({ where: { postId } });
        if (reportCount >= 3 && !post.flagged) {
            await prisma.post.update({
                where: { id: postId },
                data: { flagged: true, flagReason: `Auto-flagged: ${reportCount} user reports` }
            });
            await prisma.moderationLog.create({
                data: {
                    postId,
                    action: 'REPORT_FLAG',
                    reason: `Auto-flagged after ${reportCount} reports`,
                }
            });
        }

        res.json({ success: true, message: 'Post reported' });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: 'Failed to report post' });
    }
});

export default router;

