import { env } from './config/env';
import { defaultStages } from './config/stages';
import { createApp } from './http/app';
import { createRealtime } from './realtime';
import { StageManager } from './services/stages/stageManager';

const stages = new StageManager(defaultStages);
const app = createApp(stages);

const server = app.listen(env.PORT, () => {
  console.log(`✨ ALF backend running on http://localhost:${env.PORT}`);
  console.log(`   Live model: ${env.GEMINI_LIVE_MODEL} · Translate model: ${env.GEMINI_TRANSLATE_MODEL}`);
});

const io = createRealtime(server, stages);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  stages.stopAll();
  io.close();
  server.close(() => process.exit(0));
});
