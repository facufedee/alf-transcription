import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required (see backend/.env.example)'),
  GEMINI_LIVE_MODEL: z.string().default('gemini-3.8-live'),
  GEMINI_TRANSLATE_MODEL: z.string().default('gemini-3.5-flash-lite'),
  // false (default): let Gemini's server-side VAD detect speech turns, so inputTranscription
  // actually flushes as the talk goes on. Manual mode (true) only flushes transcription on
  // activityEnd, which this app never sends — kept as an option, not the default.
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
