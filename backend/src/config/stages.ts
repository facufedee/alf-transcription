import type { Lang } from '../../../shared/events';

export interface StageConfig {
  id: string;
  name: string;
  sourceLang: Lang;
  glossary: string; // free text: speaker names, products, jargon
}

// Seed stages until the admin panel can create them (Phase 3).
export const defaultStages: StageConfig[] = [
  { id: 'sala-1', name: 'Sala 1', sourceLang: 'en', glossary: '' },
  { id: 'sala-2', name: 'Sala 2', sourceLang: 'en', glossary: '' },
  { id: 'sala-3', name: 'Sala 3', sourceLang: 'es', glossary: '' },
];
