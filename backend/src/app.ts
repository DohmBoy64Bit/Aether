import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import socialRoutes from './routes/social.routes.js';
import mediaRoutes from './routes/media.routes.js';
import path from 'path';

// ... (existing imports)

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Increased limit for development/testing
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow accessing uploaded files
}));
app.use(cors({
  origin: 'http://localhost:3000', // Allow Next.js frontend
  credentials: true
}));
app.use(express.json());
app.use(limiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/media', mediaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
