import type { Namespace } from 'socket.io';
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

// Operators stream one stage per socket. Phase 4 replaces the shared token with a JWT.
export function registerIngest(nsp: Namespace, stages: StageManager) {
  nsp.use((socket, next) => {
    if (!env.INGEST_TOKEN || socket.handshake.auth?.token === env.INGEST_TOKEN) return next();
    next(new Error('unauthorized'));
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
