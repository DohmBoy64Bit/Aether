import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import socialRoutes from './routes/social.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
