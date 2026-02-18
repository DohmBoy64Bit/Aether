
import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service.js';
import { LinkPreviewService } from '../services/link-preview.service.js';

export class MediaController {
    static async upload(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const url = await UploadService.saveFile(req.file);
            res.json({ url });
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to upload file' });
        }
    }

    static async previewLink(req: Request, res: Response) {
        try {
            const url = req.query.url as string;
            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }

            const preview = await LinkPreviewService.getPreview(url);
            res.json(preview);
        } catch (error: any) {
            console.error('Link preview error:', error);
            res.status(500).json({ error: 'Failed to generate link preview' });
        }
    }
}
