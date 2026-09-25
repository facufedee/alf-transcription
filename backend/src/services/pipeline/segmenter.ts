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
const SENTENCE_CUT = /([.!?…])\s+(?=\S)/g;
const CLAUSE_CUT = /([,;:—])\s+(?=\S)/g;

/**
 * Turns the stream of transcription fragments into captions:
 * partials while the sentence grows, one final per sentence (same seq).
 */
export class Segmenter extends EventEmitter<Events> {
  private buffer = '';
  private interimCommittedChars = 0;
  private lastInterimText = '';
  private seq = 0;
  private timer?: NodeJS.Timeout;
  private readonly minChars: number;
  private readonly maxChars: number;
  private readonly silenceMs: number;

  constructor(opts: SegmenterOptions = {}) {
    super();
    this.minChars = opts.minChars ?? 10;
    this.maxChars = opts.maxChars ?? 140;
    this.silenceMs = opts.silenceMs ?? 1200;
  }

  push(fragment: string) {
    let toPush = fragment;
    if (this.interimCommittedChars > 0) {
      toPush = fragment.slice(this.interimCommittedChars);
      this.interimCommittedChars = 0;
    }
    this.lastInterimText = '';

    if (toPush.trim()) {
      if (this.buffer && !this.buffer.endsWith(' ') && !toPush.startsWith(' ')) {
        this.buffer += ' ';
      }
      this.buffer += toPush;
      this.cutSentences();
      if (this.buffer.trim()) this.emit('partial', normalize(this.buffer), this.seq);
    }

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.silenceMs);
  }

  pushInterim(text: string) {
    this.lastInterimText = text;
    while (this.interimCommittedChars < text.length) {
      const uncommitted = text.slice(this.interimCommittedChars).trim();
      if (!uncommitted) break;

      let cutFound = false;

      // 1. Natural sentence end followed by next word (e.g. "...Nerdearla. Hoy...")
      for (const m of uncommitted.matchAll(SENTENCE_CUT)) {
        const cutIdx = m.index! + 1;
        const sentence = normalize(uncommitted.slice(0, cutIdx));
        if (sentence.length >= this.minChars) {
          this.emit('final', sentence, this.seq++);
          this.interimCommittedChars += uncommitted.slice(0, cutIdx + m[0].length - 1).length;
          cutFound = true;
          break;
        }
      }

      // 2. If speaker talks continuously without sentence punctuation for >70 chars, cut at comma/clause
      if (!cutFound && uncommitted.length >= 70) {
        for (const m of uncommitted.matchAll(CLAUSE_CUT)) {
          const cutIdx = m.index! + 1;
          const clause = normalize(uncommitted.slice(0, cutIdx));
          if (clause.length >= 25) {
            this.emit('final', clause, this.seq++);
            this.interimCommittedChars += uncommitted.slice(0, cutIdx + m[0].length - 1).length;
            cutFound = true;
            break;
          }
        }
      }

      // 3. Fallback for run-on speech without any punctuation exceeding maxChars
      if (!cutFound && uncommitted.length >= this.maxChars) {
        const space = uncommitted.lastIndexOf(' ', this.maxChars);
        const cutIdx = space > 0 ? space : this.maxChars;
        const chunk = normalize(uncommitted.slice(0, cutIdx));
        if (chunk.length >= this.minChars) {
          this.emit('final', chunk, this.seq++);
          this.interimCommittedChars += cutIdx;
          cutFound = true;
        }
      }

      if (!cutFound) break;
    }

    const remainder = text.slice(this.interimCommittedChars).trim();
    const combined = this.buffer ? `${this.buffer} ${remainder}` : remainder;
    const clean = normalize(combined);
    if (clean) this.emit('partial', clean, this.seq);

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.silenceMs);
  }

  flush() {
    clearTimeout(this.timer);
    let text = normalize(this.buffer);
    this.buffer = '';

    // If buffer was empty but interim had trailing uncommitted words, finalize them
    if (!text && this.lastInterimText) {
      const uncommitted = this.lastInterimText.slice(this.interimCommittedChars).trim();
      if (uncommitted) text = normalize(uncommitted);
      this.interimCommittedChars = 0;
      this.lastInterimText = '';
    }

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
