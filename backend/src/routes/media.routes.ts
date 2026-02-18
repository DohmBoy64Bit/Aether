
import { Router } from 'express';
import { MediaController } from '../controllers/media.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';

// Use memory storage for buffer access if resizing is needed later, 
// or disk storage for simplicity. Using default disk storage by multer (temp)
// and then moving in the Service is also fine, but here we'll just let 
// the service handle the stream/buffer or let multer save to temp.
const upload = multer({ dest: 'uploads/temp/' });

const router = Router();

router.post('/upload', authMiddleware as any, upload.single('file'), MediaController.upload as any);
router.get('/preview', authMiddleware as any, MediaController.previewLink as any);

export default router;
