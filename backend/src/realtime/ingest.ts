import type { Namespace, Socket } from 'socket.io';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { env } from '../config/env';
import { AUDIO, EVENTS, LANGS } from '../../../shared/events';
import type { StageManager } from '../services/stages/stageManager';

const startSchema = z.object({
  stageId: z.string().min(1).max(64),
  sourceLang: z.enum(LANGS),
});

type Ack = (res: { ok: true } | { ok: false; error: string }) => void;
const noop: Ack = () => {};

// Operators stream one stage per socket, authenticated by the JWT the frontend
// mints (GET /api/auth/token) for an operator who already passed Google login.
// Falls back to the flat INGEST_TOKEN when AUTH_SECRET isn't set — dev-only,
// same as before Phase 4.
export async function authenticate(socket: Socket) {
  const token = socket.handshake.auth?.token;

  if (!env.AUTH_SECRET) {
    if (!env.INGEST_TOKEN || token === env.INGEST_TOKEN) return;
    throw new Error('unauthorized');
  }

  if (typeof token !== 'string') throw new Error('unauthorized');
  const { payload } = await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));
  if (payload.role !== 'operator' || typeof payload.email !== 'string') throw new Error('unauthorized');
  socket.data.operatorEmail = payload.email;
}

export function registerIngest(nsp: Namespace, stages: StageManager) {
  nsp.use((socket, next) => {
    authenticate(socket).then(
      () => next(),
      () => next(new Error('unauthorized')),
    );
  });

  nsp.on('connection', (socket) => {
    let stageId: string | undefined;

    socket.on(EVENTS.stageStart, (payload: unknown, ack: Ack = noop) => {
      const parsed = startSchema.safeParse(payload);
      if (!parsed.success) return ack({ ok: false, error: 'invalid payload' });
      if (stageId) return ack({ ok: false, error: 'this connection is already streaming a stage' });
      if (!stages.has(parsed.data.stageId)) return ack({ ok: false, error: 'unknown stage' });
      if (stages.isLive(parsed.data.stageId)) return ack({ ok: false, error: 'stage is already live' });

      try {
        stageId = parsed.data.stageId;
        stages.start(stageId, parsed.data.sourceLang);
        ack({ ok: true });
      } catch (err) {
        stageId = undefined;
        ack({ ok: false, error: err instanceof Error ? err.message : 'failed to start' });
      }
    });

    socket.on(EVENTS.audioChunk, (chunk: unknown) => {
      if (!stageId || !Buffer.isBuffer(chunk)) return;
      if (chunk.length === 0 || chunk.length > AUDIO.maxChunkBytes || chunk.length % 2 !== 0) return;
      stages.pushAudio(stageId, chunk);
    });

    const stop = () => {
      if (stageId) stages.stop(stageId);
      stageId = undefined;
    };
    socket.on(EVENTS.stageStop, (_payload: unknown, ack: Ack = noop) => {
      stop();
      ack({ ok: true });
    });
    socket.on('disconnect', stop);
  });
}
