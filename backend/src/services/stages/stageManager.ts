import { EventEmitter } from 'events';
import { LANGS, type Caption, type Lang, type StageStatus } from '../../../../shared/events';
import type { StageConfig } from '../../config/stages';
import { LiveTranscriber } from '../gemini/liveTranscriber';
import { translate } from '../gemini/translator';
import { Segmenter } from '../pipeline/segmenter';

const HISTORY_LIMIT = 1000; // final captions kept per stage and language
const CONTEXT_SENTENCES = 2;

export interface StageStats {
  startedAt?: number;
  finals: number;
  translateMs?: number; // last translation round-trip
  reconnects: number;
  lastError?: string;
}

interface Stage {
  config: StageConfig;
  live: boolean;
  transcriber?: LiveTranscriber;
  segmenter?: Segmenter;
  history: Record<Lang, Caption[]>;
  translation: Promise<void>; // chain that keeps translations in order
  stats: StageStats;
}

type Events = {
  caption: [caption: Caption];
  status: [status: StageStatus];
};

export class StageManager extends EventEmitter<Events> {
  private stages = new Map<string, Stage>();

  constructor(configs: StageConfig[]) {
    super();
    for (const config of configs) this.add(config);
  }

  add(config: StageConfig) {
    if (this.stages.has(config.id)) throw new Error(`Stage ${config.id} already exists`);
    this.stages.set(config.id, {
      config,
      live: false,
      history: emptyHistory(),
      translation: Promise.resolve(),
      stats: { finals: 0, reconnects: 0 },
    });
  }

  has(id: string) {
    return this.stages.has(id);
  }

  list() {
    return [...this.stages.values()].map((s) => ({ ...s.config, live: s.live, stats: s.stats }));
  }

  history(id: string, lang: Lang, last = 20) {
    return this.stages.get(id)?.history[lang].slice(-last) ?? [];
  }

  isLive(id: string) {
    return this.stages.get(id)?.live ?? false;
  }

  start(id: string, sourceLang?: Lang) {
    const stage = this.require(id);
    if (stage.live) throw new Error(`Stage ${id} is already live`);
    if (sourceLang) stage.config.sourceLang = sourceLang;

    const { config } = stage;
    const segmenter = new Segmenter();
    const transcriber = new LiveTranscriber({
      label: id,
      sourceLang: config.sourceLang,
      glossary: config.glossary,
    });

    transcriber.on('text', (fragment) => segmenter.push(fragment));
    transcriber.on('status', (s) => s === 'reconnecting' && stage.stats.reconnects++);
    transcriber.on('error', (err) => {
      stage.stats.lastError = err.message;
      console.error(`[${id}] ${err.message}`);
    });

    segmenter.on('partial', (text, seq) => this.emitCaption(stage, config.sourceLang, seq, text, false));
    segmenter.on('final', (text, seq) => {
      this.emitCaption(stage, config.sourceLang, seq, text, true);
      stage.stats.finals++;
      this.enqueueTranslations(stage, text, seq);
    });

    stage.transcriber = transcriber;
    stage.segmenter = segmenter;
    stage.live = true;
    stage.stats = { startedAt: Date.now(), finals: 0, reconnects: 0 };
    stage.history = emptyHistory();
    this.emit('status', { stageId: id, live: true });

    transcriber.start();
  }

  pushAudio(id: string, pcm: Buffer) {
    this.stages.get(id)?.transcriber?.push(pcm);
  }

  stop(id: string) {
    const stage = this.stages.get(id);
    if (!stage?.live) return;
    stage.transcriber?.stop();
    stage.segmenter?.flush(); // last words still get translated
    stage.segmenter?.dispose();
    stage.transcriber = undefined;
    stage.segmenter = undefined;
    stage.live = false;
    this.emit('status', { stageId: id, live: false });
  }

  stopAll() {
    for (const id of this.stages.keys()) this.stop(id);
  }

  private enqueueTranslations(stage: Stage, text: string, seq: number) {
    const from = stage.config.sourceLang;
    const context = stage.history[from].slice(-CONTEXT_SENTENCES - 1, -1).map((c) => c.text);

    for (const to of LANGS) {
      if (to === from) continue;
      stage.translation = stage.translation.then(async () => {
        const t0 = Date.now();
        try {
          const translated = await translate({ text, from, to, glossary: stage.config.glossary, context });
          stage.stats.translateMs = Date.now() - t0;
          if (translated) this.emitCaption(stage, to, seq, translated, true);
        } catch (err) {
          stage.stats.lastError = err instanceof Error ? err.message : String(err);
          console.error(`[${stage.config.id}] translation failed: ${stage.stats.lastError}`);
        }
      });
    }
  }

  private emitCaption(stage: Stage, lang: Lang, seq: number, text: string, isFinal: boolean) {
    const caption: Caption = { stageId: stage.config.id, lang, seq, text, isFinal, ts: Date.now() };
    if (isFinal) {
      const list = stage.history[lang];
      list.push(caption);
      if (list.length > HISTORY_LIMIT) list.shift();
    }
    this.emit('caption', caption);
  }

  private require(id: string) {
    const stage = this.stages.get(id);
    if (!stage) throw new Error(`Unknown stage ${id}`);
    return stage;
  }
}

function emptyHistory(): Record<Lang, Caption[]> {
  return Object.fromEntries(LANGS.map((l) => [l, []])) as unknown as Record<Lang, Caption[]>;
}
