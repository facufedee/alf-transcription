import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind Cloud Run's proxy
  app.use(helmet());
  app.use(cors({ origin: env.allowedOrigins }));
  app.use(express.json({ limit: '100kb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  app.use('/health', healthRouter);

  return app;
}
