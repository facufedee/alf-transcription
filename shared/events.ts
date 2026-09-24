// Contract between frontend and backend. Change it only together with docs/ROADMAP.md.

export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];

export const NAMESPACES = {
  ingest: '/ingest', // operators, requires token
  watch: '/watch', // audience, public and read-only
} as const;

export const EVENTS = {
  // operator → backend (/ingest)
  stageStart: 'stage:start',
  audioChunk: 'audio:chunk', // ArrayBuffer, PCM16 mono 16 kHz, ~100 ms
  stageStop: 'stage:stop',
  // audience → backend (/watch)
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe',
  // backend → audience (/watch)
  caption: 'caption',
  stageStatus: 'stage:status',
} as const;

export const AUDIO = {
  sampleRate: 16000,
  channels: 1,
  maxChunkBytes: 64 * 1024,
} as const;

export interface StageStartPayload {
  stageId: string;
  sourceLang: Lang;
}

export interface StageStopPayload {
  stageId: string;
}

export interface SubscribePayload {
  stageId: string;
  lang: Lang;
}

export interface Caption {
  stageId: string;
  lang: Lang;
  seq: number; // increasing per stage; a final caption replaces partials with the same seq
  text: string;
  isFinal: boolean;
  ts: number; // epoch ms when the audio was received
}

export interface StageStatus {
  stageId: string;
  live: boolean;
}

export const roomFor = (stageId: string, lang: Lang) => `stage:${stageId}:${lang}`;
