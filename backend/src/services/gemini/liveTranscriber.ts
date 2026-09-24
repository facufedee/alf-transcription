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
  text: [fragment: string]; // incremental transcription, append to what came before
  status: [status: 'connecting' | 'live' | 'reconnecting' | 'stopped'];
  error: [error: Error];
};

/**
 * One Gemini Live session per stage, used only for its input transcription.
 * Survives session limits: resumes with the latest handle on goAway or unexpected close.
 */
export class LiveTranscriber extends EventEmitter<Events> {
  private session?: Session;
  private generation = 0;
  private resumeHandle?: string;
  private pending: string[] = [];
  private retries = 0;
  private stopped = false;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(private readonly opts: LiveTranscriberOptions) {
    super();
  }

  /** Returns right away; progress is reported through 'status' and 'error' events. */
  start() {
    void this.connect();
  }

  push(pcm: Buffer) {
    if (this.stopped) return;
    const data = pcm.toString('base64');
    if (!this.session) {
      this.pending.push(data);
      if (this.pending.length > MAX_PENDING_CHUNKS) this.pending.shift();
      return;
    }
    this.session.sendRealtimeInput({ audio: { data, mimeType: MIME_TYPE } });
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    this.generation++;
    this.session?.close();
    this.session = undefined;
    this.emit('status', 'stopped');
  }

  private async connect() {
    const gen = ++this.generation;
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
      if (env.GEMINI_LIVE_MANUAL_ACTIVITY) session.sendRealtimeInput({ activityStart: {} });
      for (const data of this.pending.splice(0)) {
        session.sendRealtimeInput({ audio: { data, mimeType: MIME_TYPE } });
      }
      this.emit('status', 'live');
    } catch (err) {
      if (gen !== this.generation) return;
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect();
    }
  }

  private buildConfig() {
    const isNativeAudio = env.GEMINI_LIVE_MODEL.includes('native-audio');
    const glossary = this.opts.glossary?.trim();

    return {
      responseModalities: [isNativeAudio ? Modality.AUDIO : Modality.TEXT],
      inputAudioTranscription: {},
      systemInstruction: [
        `You are a passive listener at a tech conference talk in ${LANG_NAMES[this.opts.sourceLang]}.`,
        'Never reply, never speak, never produce any output.',
        glossary ? `Terms and names that may be mentioned: ${glossary}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      realtimeInputConfig: env.GEMINI_LIVE_MANUAL_ACTIVITY
        ? { automaticActivityDetection: { disabled: true } }
        : undefined,
      contextWindowCompression: { slidingWindow: {} },
      sessionResumption: this.resumeHandle ? { handle: this.resumeHandle } : {},
    };
  }

  private onMessage(msg: LiveServerMessage) {
    if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
      this.resumeHandle = msg.sessionResumptionUpdate.newHandle;
    }

    const fragment = msg.serverContent?.inputTranscription?.text;
    if (fragment) this.emit('text', fragment);

    if (msg.goAway) {
      // Server will close soon: open the next session now so no audio is lost.
      this.swapSession();
    }
  }

  private onClose(code: number, reason: string) {
    if (this.stopped) return;
    this.session = undefined;
    this.emit('error', new Error(`Live session closed (${code}) ${reason}`.trim()));
    this.scheduleReconnect();
  }

  private swapSession() {
    const old = this.session;
    this.session = undefined; // buffer audio until the new session is ready
    void this.connect().finally(() => old?.close());
  }

  private scheduleReconnect() {
    if (this.stopped) return;
    const delay = Math.min(500 * 2 ** this.retries, MAX_BACKOFF_MS);
    this.retries++;
    this.emit('status', 'reconnecting');
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => void this.connect(), delay);
  }
}
