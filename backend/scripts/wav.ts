import { readFileSync } from 'fs';
import { AUDIO } from '../../shared/events';

/** Reads a PCM16 mono 16 kHz WAV and returns the raw samples. */
export function readPcmWav(path: string): Buffer {
  const buf = readFileSync(path);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${path} is not a WAV file`);
  }

  let offset = 12;
  let format: { audioFormat: number; channels: number; sampleRate: number; bits: number } | undefined;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = {
        audioFormat: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bits: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      const ok =
        format?.audioFormat === 1 &&
        format.channels === AUDIO.channels &&
        format.sampleRate === AUDIO.sampleRate &&
        format.bits === 16;
      if (!ok) {
        throw new Error(
          `${path} must be PCM16 mono ${AUDIO.sampleRate} Hz. Convert it with:\n` +
            `  ffmpeg -i input.mp3 -ac 1 -ar ${AUDIO.sampleRate} -sample_fmt s16 output.wav`,
        );
      }
      return buf.subarray(body, body + size);
    }
    offset = body + size + (size % 2);
  }
  throw new Error(`${path} has no data chunk`);
}
