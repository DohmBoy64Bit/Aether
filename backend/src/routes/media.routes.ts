
import { Router } from 'express';
import { MediaController } from '../controllers/media.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';

// §2.3: Multer with file size limit (10MB) — defense in depth
const upload = multer({
    dest: 'uploads/temp/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

const router = Router();

router.post('/upload', authMiddleware as any, upload.single('file'), MediaController.upload as any);
router.get('/preview', authMiddleware as any, MediaController.previewLink as any);

export default router;
