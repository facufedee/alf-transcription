import { Router } from 'express';
import type { StageManager } from '../../services/stages/stageManager';

// Public list for the audience; glossary and stats stay internal until the admin panel (Phase 3).
export function stagesRouter(stages: StageManager) {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(stages.list().map(({ id, name, sourceLang, live }) => ({ id, name, sourceLang, live })));
  });

  return router;
}
