
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * §2.3: Allowed file extensions and MIME types.
 * Only image and video files are permitted for social media uploads.
 */
const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp',  // Images
    '.mp4', '.webm', '.mov',                    // Videos
]);

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
]);

/**
 * Maximum file size: 10 MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class UploadService {
    /**
     * Validates and saves an uploaded file to the local filesystem.
     * Returns the relative URL path to access the file.
     * 
     * §2.3: Added validation for file type, MIME type, size, and extension.
     */
    static async saveFile(file: Express.Multer.File): Promise<string> {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            // Clean up temp file
            await fs.promises.unlink(file.path).catch(() => { });
            throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            await fs.promises.unlink(file.path).catch(() => { });
            throw new Error(`File type "${file.mimetype}" is not allowed. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`);
        }

        // Validate extension (from original filename)
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            await fs.promises.unlink(file.path).catch(() => { });
            throw new Error(`File extension "${ext}" is not allowed. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`);
        }

        // Use a sanitized filename — UUID + validated extension only
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        await fs.promises.rename(file.path, filepath);

        return `/uploads/${filename}`;
    }
}
