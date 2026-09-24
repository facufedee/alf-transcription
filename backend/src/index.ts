import { env } from './config/env';
import { createApp } from './http/app';
import { createRealtime } from './realtime';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`✨ ALF backend running on http://localhost:${env.PORT}`);
});

const io = createRealtime(server);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  io.close();
  server.close(() => process.exit(0));
});
