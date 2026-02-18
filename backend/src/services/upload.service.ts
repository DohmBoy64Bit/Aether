
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class UploadService {
    /**
     * Saves an uploaded file to the local filesystem.
     * Returns the relative URL path to access the file.
     */
    static async saveFile(file: Express.Multer.File): Promise<string> {
        const ext = path.extname(file.originalname);
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        await fs.promises.rename(file.path, filepath);

        // Return the public URL path
        // Assuming Express serves 'uploads' at '/uploads'
        return `/uploads/${filename}`;
    }
}
