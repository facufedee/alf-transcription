import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const bool = z
  .enum(['true', 'false'])
  .default('true')
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required (see backend/.env.example)'),
  GEMINI_LIVE_MODEL: z.string().default('gemini-live-2.5-flash-preview'),
  GEMINI_TRANSLATE_MODEL: z.string().default('gemini-2.5-flash-lite'),
  // Keep the Live session in a single never-ending turn so the model transcribes but never answers.
  GEMINI_LIVE_MANUAL_ACTIVITY: bool,
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  // Shared secret operators must send to stream audio. Empty = open (local dev only).
  INGEST_TOKEN: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment:');
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  allowedOrigins: parsed.data.FRONTEND_URL.split(',').map((o) => o.trim()),
};
