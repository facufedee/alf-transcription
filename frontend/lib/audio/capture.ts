/**
 * Captures microphone audio in the browser, resamples to 16kHz mono PCM16,
 * and emits ~100ms chunks (1600 samples = 3200 bytes) along with real-time VU level.
 */

export interface AudioCaptureCallbacks {
  onChunk: (chunk: ArrayBuffer) => void;
  onVolume: (level: number) => void; // 0 to 100
  onError: (err: Error) => void;
}

export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Buffer for 16kHz mono samples (1600 samples = 100ms)
  private readonly targetSampleRate = 16000;
  private readonly chunkSize = 1600; // 100ms at 16kHz
  private buffer: Float32Array = new Float32Array(0);

  constructor(private callbacks: AudioCaptureCallbacks) {}

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // ScriptProcessor with buffer size 4096 (widely compatible)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // 1. Calculate VU meter volume (RMS)
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        const volume = Math.min(100, Math.round(rms * 100 * 3));
        this.callbacks.onVolume(volume);

        // 2. Resample to 16kHz mono Float32
        const resampled = this.resample(inputData, this.audioContext!.sampleRate, this.targetSampleRate);

        // 3. Accumulate in buffer
        const newBuffer = new Float32Array(this.buffer.length + resampled.length);
        newBuffer.set(this.buffer);
        newBuffer.set(resampled, this.buffer.length);
        this.buffer = newBuffer;

        // 4. Emit 1600-sample chunks as PCM16 ArrayBuffers (~100ms each)
        while (this.buffer.length >= this.chunkSize) {
          const chunkFloat = this.buffer.subarray(0, this.chunkSize);
          const pcm16Chunk = this.floatTo16BitPCM(chunkFloat);
          this.callbacks.onChunk(pcm16Chunk.buffer as ArrayBuffer);
          this.buffer = this.buffer.subarray(this.chunkSize);
        }
      };

      this.sourceNode.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      this.stop();
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  stop(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.buffer = new Float32Array(0);
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
