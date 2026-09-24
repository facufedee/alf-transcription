import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { AUDIO, NAMESPACES } from '../../../shared/events';
import type { StageManager } from '../services/stages/stageManager';
import { registerAudience } from './audience';
import { registerIngest } from './ingest';

export function createRealtime(httpServer: HttpServer, stages: StageManager) {
  const io = new Server(httpServer, {
    cors: { origin: env.allowedOrigins, methods: ['GET', 'POST'] },
    maxHttpBufferSize: AUDIO.maxChunkBytes,
  });

  registerAudience(io.of(NAMESPACES.watch), stages);
  registerIngest(io.of(NAMESPACES.ingest), stages);

  return io;
}
