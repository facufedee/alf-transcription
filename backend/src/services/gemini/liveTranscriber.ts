import { EventEmitter } from 'events';
import { Modality, type LiveServerMessage, type Session } from '@google/genai';
import { env } from '../../config/env';
import { AUDIO, type Lang } from '../../../../shared/events';
import { ai } from './client';
import { LANG_NAMES } from './languages';

const MIME_TYPE = `audio/pcm;rate=${AUDIO.sampleRate}`;
const MAX_PENDING_CHUNKS = 100; // ~10 s of audio buffered while reconnecting
const MAX_BACKOFF_MS = 10_000;
const CONNECT_TIMEOUT_MS = 10_000;
// In manual-activity mode, Gemini only flushes inputTranscription when we send
// activityEnd — and with automatic detection, we've seen it flush once after
// the first utterance and then never open a new turn again for continuous
// real speech. So in manual mode we force a flush on a fixed cadence: close
// and immediately reopen the "activity" every CYCLE_MS. The segmenter already
// reassembles arbitrary fragments into sentences, so mid-word cuts are fine.
// Tried 2s: made latency *worse* (11s, 12s, 28s — growing), not better — cycling
// faster than Gemini can actually transcribe just queues up backlog. 5s measured
// as the stable point against a real talk; don't lower this without re-measuring
// with DEBUG_LIVE=1 and elapsed-time logging (see onMessage/cycleActivity).
const CYCLE_MS = 5_000;
// If resuming keeps failing, the handle itself is probably stale/rejected by
// the server: drop it and fall back to a fresh session rather than retrying
// forever with a handle that will never be accepted.
const MAX_RESUME_RETRIES = 3;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`Live connect timed out after ${ms} ms`));
    }, ms);
    promise.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e) => (clearTimeout(timer), reject(e)),
    );
  });
}

export interface LiveTranscriberOptions {
  label: string;
  sourceLang: Lang;
  glossary?: string;
}

type Events = {
  interim: [text: string]; // real-time in-flight partial transcription
  text: [fragment: string]; // confirmed / completed transcription, append to what came before
  status: [status: 'connecting' | 'live' | 'reconnecting' | 'stopped'];
  error: [error: Error];
};

/**
 * One Gemini Live session per stage, used only for its input transcription.
 * Survives session limits: resumes with the latest handle on goAway or unexpected close.
 */
export class LiveTranscriber extends EventEmitter<Events> {
  private session?: Session;
  private setupSeen = false; // true once setupComplete arrived for the current session
  private setupDone = false; // true once we've reacted to it (session assigned + setupSeen)
  private generation = 0;
  private resumeHandle?: string;
  private pending: string[] = [];
  private retries = 0;
  private stopped = false;
  private reconnectTimer?: NodeJS.Timeout;
  private cycleTimer?: NodeJS.Timeout;
  private chunksIn = 0;
  private startedAt = 0;

  constructor(private readonly opts: LiveTranscriberOptions) {
    super();
  }

  /** Returns right away; progress is reported through 'status' and 'error' events. */
  start() {
    this.startedAt = Date.now();
    void this.connect();
  }

  private elapsed() {
    return `+${Date.now() - this.startedAt}ms`;
  }

  push(pcm: Buffer) {
    if (this.stopped) return;
    if (process.env.DEBUG_LIVE && ++this.chunksIn % 20 === 0) {
      console.log(`[debug ${this.opts.label}] push #${this.chunksIn}, session=${!!this.session}, setupDone=${this.setupDone}, pending=${this.pending.length}`);
    }
    const data = pcm.toString('base64');
    if (!this.session || !this.setupDone) {
      this.pending.push(data);
      if (this.pending.length > MAX_PENDING_CHUNKS) this.pending.shift();
      return;
    }
    this.session.sendRealtimeInput({ audio: { data, mimeType: MIME_TYPE } });
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.cycleTimer);
    this.generation++;
    this.session?.close();
    this.session = undefined;
    this.emit('status', 'stopped');
  }

  private async connect() {
    const gen = ++this.generation;
    this.setupSeen = false;
    this.setupDone = false;
    if (this.retries === 0 && !this.resumeHandle) this.emit('status', 'connecting');

    try {
      const connecting = ai.live.connect({
        model: env.GEMINI_LIVE_MODEL,
        config: this.buildConfig(),
        callbacks: {
          onmessage: (msg) => gen === this.generation && this.onMessage(msg),
          onerror: (e) => gen === this.generation && this.emit('error', new Error(e.message || 'Live API error')),
          onclose: (e) => gen === this.generation && this.onClose(e.code, e.reason),
        },
      });
      // The SDK promise never settles if the server closes during the handshake.
      const session = await withTimeout(connecting, CONNECT_TIMEOUT_MS, () => {
        void connecting.then((late) => late.close()).catch(() => {});
      });

      if (gen !== this.generation) {
        session.close();
        return;
      }

      this.session = session;
      this.retries = 0;
      // onmessage can fire (and setupComplete can arrive) before this awaited
      // connect() call returns — so setupSeen may already be true here. Either
      // order works: whichever of "session assigned" / "setupSeen" happens
      // second is the one that actually triggers activate().
      this.activate();
      this.emit('status', 'live');
    } catch (err) {
      if (gen !== this.generation) return;
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect();
    }
  }

  private buildConfig() {
    const glossary = this.opts.glossary?.trim();
    const isTranscribeModel = env.GEMINI_LIVE_MODEL.includes('transcribe');

    return {
      // Conversational models (gemini-3.8-live) require AUDIO response modality.
      // Dedicated transcription models (gemini-3.5-transcribe-live) do not.
      ...(isTranscribeModel ? {} : { responseModalities: [Modality.AUDIO] }),
      inputAudioTranscription: {},
      systemInstruction: [
        `You are a passive listener at a tech conference talk in ${LANG_NAMES[this.opts.sourceLang]}.`,
        isTranscribeModel ? '' : 'Never reply, never speak, never produce any output.',
        glossary ? `Terms and names that may be mentioned: ${glossary}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      realtimeInputConfig:
        !isTranscribeModel && env.GEMINI_LIVE_MANUAL_ACTIVITY
          ? { automaticActivityDetection: { disabled: true } }
          : undefined,
      contextWindowCompression: { slidingWindow: {} },
      sessionResumption: this.resumeHandle ? { handle: this.resumeHandle } : {},
    };
  }

  /** Runs once per session, whenever both a session and its setupComplete are
   * in hand — regardless of which arrived first. Sends the initial
   * activityStart, starts the flush cycle (if manual mode), and flushes buffered audio. */
  private activate() {
    if (!this.session || !this.setupSeen || this.setupDone) return;
    this.setupDone = true;
    const isTranscribeModel = env.GEMINI_LIVE_MODEL.includes('transcribe');
    if (!isTranscribeModel && env.GEMINI_LIVE_MANUAL_ACTIVITY) {
      this.session.sendRealtimeInput({ activityStart: {} });
      clearInterval(this.cycleTimer);
      this.cycleTimer = setInterval(() => this.cycleActivity(), CYCLE_MS);
    }
    for (const data of this.pending.splice(0)) {
      this.session.sendRealtimeInput({ audio: { data, mimeType: MIME_TYPE } });
    }
  }

  private onMessage(msg: LiveServerMessage) {
    if (process.env.DEBUG_LIVE) console.log(`[debug ${this.opts.label} ${this.elapsed()}]`, JSON.stringify(msg).slice(0, 200));

    if (msg.setupComplete) {
      this.setupSeen = true;
      this.activate();
    }

    if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
      this.resumeHandle = msg.sessionResumptionUpdate.newHandle;
    }

    const interim = msg.serverContent?.interimInputTranscription?.text;
    if (interim) this.emit('interim', interim);

    const fragment = msg.serverContent?.inputTranscription?.text;
    if (fragment) this.emit('text', fragment);

    if (msg.goAway) {
      // Server will close soon: open the next session now so no audio is lost.
      this.swapSession();
    }
  }

  private onClose(code: number, reason: string) {
    if (this.stopped) return;
    clearInterval(this.cycleTimer);
    this.session = undefined;
    this.emit('error', new Error(`Live session closed (${code}) ${reason}`.trim()));
    this.scheduleReconnect();
  }

  private swapSession() {
    clearInterval(this.cycleTimer);
    const old = this.session;
    this.session = undefined; // buffer audio until the new session is ready
    void this.connect().finally(() => old?.close());
  }

  /** Manual-activity mode only: close and immediately reopen the "activity" so
   * Gemini flushes whatever input transcription it's accumulated so far,
   * instead of waiting on a turn boundary that may never come. */
  private cycleActivity() {
    if (process.env.DEBUG_LIVE) console.log(`[debug ${this.opts.label} ${this.elapsed()}] cycleActivity tick, session=${!!this.session}`);
    if (!this.session) return;
    this.session.sendRealtimeInput({ activityEnd: {} });
    const session = this.session;
    // A short gap between activityEnd and activityStart — sending them back to
    // back with zero delay intermittently gets the session killed with a 1007.
    setTimeout(() => {
      if (this.session === session) session.sendRealtimeInput({ activityStart: {} });
    }, 100);
  }

  private scheduleReconnect() {
    if (this.stopped) return;
    const delay = Math.min(500 * 2 ** this.retries, MAX_BACKOFF_MS);
    this.retries++;
    if (this.resumeHandle && this.retries >= MAX_RESUME_RETRIES) {
      // Repeated failures with the same handle mean the server isn't going to
      // accept it — start clean next time instead of looping on a dead handle.
      this.resumeHandle = undefined;
    }
    this.emit('status', 'reconnecting');
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => void this.connect(), delay);
  }
}
