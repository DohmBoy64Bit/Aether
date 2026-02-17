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

export default router;
