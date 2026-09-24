import type { Namespace } from 'socket.io';
import { z } from 'zod';
import { EVENTS, LANGS, roomFor } from '../../../shared/events';
import type { StageManager } from '../services/stages/stageManager';

const subscribeSchema = z.object({
  stageId: z.string().min(1).max(64),
  lang: z.enum(LANGS),
});

// Public, read-only: clients can only join/leave rooms, never emit captions.
export function registerAudience(nsp: Namespace, stages: StageManager) {
  stages.on('caption', (caption) => nsp.to(roomFor(caption.stageId, caption.lang)).emit(EVENTS.caption, caption));
  stages.on('status', (status) => nsp.emit(EVENTS.stageStatus, status));

  nsp.on('connection', (socket) => {
    socket.on(EVENTS.subscribe, (payload: unknown) => {
      const parsed = subscribeSchema.safeParse(payload);
      if (!parsed.success || !stages.has(parsed.data.stageId)) return;
      const { stageId, lang } = parsed.data;
      socket.join(roomFor(stageId, lang));
      // Late joiners get the recent context instead of an empty screen.
      for (const caption of stages.history(stageId, lang)) socket.emit(EVENTS.caption, caption);
      socket.emit(EVENTS.stageStatus, { stageId, live: stages.isLive(stageId) });
    });

    socket.on(EVENTS.unsubscribe, (payload: unknown) => {
      const parsed = subscribeSchema.safeParse(payload);
      if (!parsed.success) return;
      socket.leave(roomFor(parsed.data.stageId, parsed.data.lang));
    });
  });
}
