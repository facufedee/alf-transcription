import { ApiError } from '@google/genai';
import { env } from '../../config/env';
import type { Lang } from '../../../../shared/events';
import { ai } from './client';
import { LANG_NAMES } from './languages';

export interface TranslateRequest {
  text: string;
  from: Lang;
  to: Lang;
  glossary?: string;
  context?: string[]; // previous sentences, for coherence only
}

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translate(req: TranslateRequest) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await translateOnce(req);
    } catch (err) {
      // 429 = rate limit: back off and retry. Any other error propagates as before.
      if (!(err instanceof ApiError) || err.status !== 429 || attempt >= MAX_RETRIES) throw err;
      await sleep(500 * 2 ** attempt);
    }
  }
}

async function translateOnce({ text, from, to, glossary, context = [] }: TranslateRequest) {
  const systemInstruction = [
    `You are a professional simultaneous interpreter at a software conference.`,
    `Translate the user's text from ${LANG_NAMES[from]} to ${LANG_NAMES[to]}.`,
    'Keep technical terms, product names and code identifiers the way practitioners say them',
    '(e.g. Kubernetes, pull request, deploy, cluster). The text is a live transcript: it may be',
    'a sentence fragment and may contain recognition errors; fix obvious ones.',
    'Output only the translation, with no quotes, notes or explanations.',
    glossary?.trim() ? `Glossary / names for this talk: ${glossary.trim()}` : '',
    context.length ? `Previous sentences (context only, do not translate):\n${context.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const res = await ai.models.generateContent({
    model: env.GEMINI_TRANSLATE_MODEL,
    contents: text,
    config: {
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  });

  return (res.text ?? '').trim();
}
