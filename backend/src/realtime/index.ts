import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { AUDIO, NAMESPACES } from '../../../shared/events';
import { registerAudience } from './audience';

export function createRealtime(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.allowedOrigins, methods: ['GET', 'POST'] },
    maxHttpBufferSize: AUDIO.maxChunkBytes,
  });

  registerAudience(io.of(NAMESPACES.watch));

  return io;
}
