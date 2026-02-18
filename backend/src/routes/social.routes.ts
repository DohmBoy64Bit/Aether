import { Router } from 'express';
import { SocialController } from '../controllers/social.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/posts', authMiddleware as any, SocialController.createPost as any);
router.get('/posts', SocialController.getFeed as any);
router.get('/posts/:id', SocialController.getPost as any);
router.post('/interact', authMiddleware as any, SocialController.interact as any);
router.get('/profiles/:username', SocialController.getProfile as any);
router.post('/persona', authMiddleware as any, SocialController.updatePersona as any);
router.post('/follow/:userId', authMiddleware as any, SocialController.follow as any);
router.post('/unfollow/:userId', authMiddleware as any, SocialController.unfollow as any);
router.get('/posts/following', authMiddleware as any, SocialController.getFollowingFeed as any);
router.get('/profiles/:username/followers', SocialController.getFollowers as any);
router.get('/profiles/:username/following', SocialController.getFollowing as any);

export default router;
