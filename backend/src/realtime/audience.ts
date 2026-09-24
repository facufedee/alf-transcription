import type { Namespace } from 'socket.io';
import { z } from 'zod';
import { EVENTS, LANGS, roomFor } from '../../../shared/events';

const subscribeSchema = z.object({
  stageId: z.string().min(1).max(64),
  lang: z.enum(LANGS),
});

// Public, read-only: clients can only join/leave rooms, never emit captions.
export function registerAudience(nsp: Namespace) {
  nsp.on('connection', (socket) => {
    socket.on(EVENTS.subscribe, (payload: unknown) => {
      const parsed = subscribeSchema.safeParse(payload);
      if (!parsed.success) return;
      socket.join(roomFor(parsed.data.stageId, parsed.data.lang));
    });

    socket.on(EVENTS.unsubscribe, (payload: unknown) => {
      const parsed = subscribeSchema.safeParse(payload);
      if (!parsed.success) return;
      socket.leave(roomFor(parsed.data.stageId, parsed.data.lang));
    });
  });
}
