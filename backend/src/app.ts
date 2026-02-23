import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import socialRoutes from './routes/social.routes.js';
import mediaRoutes from './routes/media.routes.js';
import adminRoutes from './routes/admin.routes.js';
import path from 'path';

const app = express();

// §6.2: Global rate limiter (generous for normal API usage)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// §6.2: Strict rate limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Increased for development (was 20)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// §6.3: CORS origin from environment variable
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(globalLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// §6.2: Apply strict auth limiter to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
