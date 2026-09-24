import { EventEmitter } from 'events';

export interface SegmenterOptions {
  minChars?: number; // don't close a sentence shorter than this (avoids "Hi." alone)
  maxChars?: number; // force a cut on long run-on speech
  silenceMs?: number; // close the segment if no new text arrives
}

type Events = {
  partial: [text: string, seq: number];
  final: [text: string, seq: number];
};

const SENTENCE_END = /[.!?…](?=\s|$)/g;

/**
 * Turns the stream of transcription fragments into captions:
 * partials while the sentence grows, one final per sentence (same seq).
 */
export class Segmenter extends EventEmitter<Events> {
  private buffer = '';
  private seq = 0;
  private timer?: NodeJS.Timeout;
  private readonly minChars: number;
  private readonly maxChars: number;
  private readonly silenceMs: number;

  constructor(opts: SegmenterOptions = {}) {
    super();
    this.minChars = opts.minChars ?? 20;
    this.maxChars = opts.maxChars ?? 180;
    this.silenceMs = opts.silenceMs ?? 1200;
  }

  push(fragment: string) {
    this.buffer += fragment;
    this.cutSentences();
    if (this.buffer.trim()) this.emit('partial', normalize(this.buffer), this.seq);

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.silenceMs);
  }

  flush() {
    clearTimeout(this.timer);
    const text = normalize(this.buffer);
    this.buffer = '';
    if (text) this.emit('final', text, this.seq++);
  }

  dispose() {
    clearTimeout(this.timer);
  }

  private cutSentences() {
    for (;;) {
      const cut = this.findCut();
      if (cut === -1) return;
      const text = normalize(this.buffer.slice(0, cut));
      this.buffer = this.buffer.slice(cut);
      if (text) this.emit('final', text, this.seq++);
    }
  }

  private findCut() {
    let lastEnd = -1;
    for (const m of this.buffer.matchAll(SENTENCE_END)) {
      const end = m.index! + 1;
      if (normalize(this.buffer.slice(0, end)).length >= this.minChars) return end;
      lastEnd = end;
    }
    if (this.buffer.length <= this.maxChars) return -1;
    if (lastEnd !== -1) return lastEnd;
    const space = this.buffer.lastIndexOf(' ', this.maxChars);
    return space > 0 ? space : this.maxChars;
  }
}

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
