import { Router } from 'express';
import type { StageManager } from '../../services/stages/stageManager';

// Public list for the audience; glossary and stats stay internal until the admin panel (Phase 3).
export function stagesRouter(stages: StageManager) {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(stages.list().map(({ id, name, sourceLang, live }) => ({ id, name, sourceLang, live })));
  });

  // Not linked from any frontend page — if you found this by reading the
  // code instead of clicking around the UI, hi. These are the real numbers
  // behind the resilience work: reconnects is exactly how many times a Live
  // session silently died and got itself back up without dropping a stage,
  // and translateMs is the last live round-trip, not a marketing figure.
  router.get('/:id/pipeline', (req, res) => {
    const stage = stages.list().find((s) => s.id === req.params.id);
    if (!stage) return res.status(404).json({ error: 'unknown stage' });
    const uptimeMs = stage.stats.startedAt ? Date.now() - stage.stats.startedAt : null;
    res.json({
      id: stage.id,
      name: stage.name,
      live: stage.live,
      uptimeMs,
      finalsEmitted: stage.stats.finals,
      lastTranslateRoundTripMs: stage.stats.translateMs ?? null,
      geminiReconnects: stage.stats.reconnects,
      lastError: stage.stats.lastError ?? null,
    });
  });

  return router;
}
