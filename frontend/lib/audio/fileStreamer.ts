/**
 * Streams an audio file (WAV, MP3, etc.) at 1x real-time pace in 100ms chunks of 16kHz PCM16.
 */

export interface FileStreamerCallbacks {
  onChunk: (chunk: ArrayBuffer) => void;
  onVolume: (level: number) => void;
  onProgress: (currentSeconds: number, totalSeconds: number) => void;
  onFinished: () => void;
  onError: (err: Error) => void;
}

export class FileStreamer {
  private active = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly targetRate = 16000;
  private readonly chunkSize = 1600; // 100ms at 16kHz

  constructor(private callbacks: FileStreamerCallbacks) {}

  async start(file: File): Promise<void> {
    this.active = true;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const audioCtx = new AudioContextClass();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      // Convert to mono
      const channels = decoded.numberOfChannels;
      const length = decoded.length;
      const mono = new Float32Array(length);

      if (channels === 1) {
        mono.set(decoded.getChannelData(0));
      } else {
        const left = decoded.getChannelData(0);
        const right = decoded.getChannelData(1);
        for (let i = 0; i < length; i++) {
          mono[i] = (left[i] + right[i]) / 2;
        }
      }

      // Resample to 16kHz
      const resampled = this.resample(mono, decoded.sampleRate, this.targetRate);
      const totalSeconds = resampled.length / this.targetRate;

      let offset = 0;
      const started = performance.now();

      const pump = () => {
        if (!this.active) return;

        if (offset >= resampled.length) {
          this.callbacks.onVolume(0);
          this.callbacks.onProgress(totalSeconds, totalSeconds);
          this.callbacks.onFinished();
          this.stop();
          return;
        }

        const chunkFloat = resampled.subarray(offset, Math.min(offset + this.chunkSize, resampled.length));
        offset += this.chunkSize;

        // Calculate VU volume
        let sumSquares = 0;
        for (let i = 0; i < chunkFloat.length; i++) {
          sumSquares += chunkFloat[i] * chunkFloat[i];
        }
        const rms = Math.sqrt(sumSquares / chunkFloat.length);
        this.callbacks.onVolume(Math.min(100, Math.round(rms * 100 * 3)));

        // Convert to PCM16
        const pcm16 = this.floatTo16BitPCM(chunkFloat);
        this.callbacks.onChunk(pcm16.buffer as ArrayBuffer);

        const currentSeconds = Math.min(totalSeconds, offset / this.targetRate);
        this.callbacks.onProgress(currentSeconds, totalSeconds);

        // Schedule next chunk at 100ms real-time intervals
        const chunksSent = Math.floor(offset / this.chunkSize);
        const targetTime = started + chunksSent * 100;
        const delay = Math.max(0, targetTime - performance.now());

        this.timer = setTimeout(pump, delay);
      };

      pump();
    } catch (err) {
      this.stop();
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  stop(): void {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.callbacks.onVolume(0);
  }

  private resample(source: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return source;

    const ratio = fromRate / toRate;
    const newLength = Math.round(source.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const lower = Math.floor(srcIndex);
      const upper = Math.min(lower + 1, source.length - 1);
      const fraction = srcIndex - lower;
      result[i] = source[lower] * (1 - fraction) + source[upper] * fraction;
    }

    return result;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }
}
