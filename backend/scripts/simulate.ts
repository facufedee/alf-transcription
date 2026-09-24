/**
 * Streams WAV files to the backend as if they were live stages, and prints the captions coming back.
 *
 *   npm run simulate -- sala-1:en:../samples/en-kubernetes-tts.wav sala-3:es:../samples/es-postgres-tts.wav
 *
 * Each argument is stageId:sourceLang:file. Run several at once to test parallel stages.
 */
import { io, type Socket } from 'socket.io-client';
import { AUDIO, EVENTS, LANGS, NAMESPACES, type Caption, type Lang } from '../../shared/events';
import { readPcmWav } from './wav';

const BACKEND = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const TOKEN = process.env.INGEST_TOKEN;
const CHUNK_MS = 100;
const CHUNK_BYTES = (AUDIO.sampleRate * 2 * CHUNK_MS) / 1000;
const TAIL_MS = 6000; // keep sending silence so the last words get transcribed
const COLORS = ['\x1b[36m', '\x1b[33m', '\x1b[35m', '\x1b[32m', '\x1b[34m'];
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

interface Job {
  stageId: string;
  lang: Lang;
  file: string;
  color: string;
}

const jobs: Job[] = process.argv.slice(2).map((arg, i) => {
  const [stageId, lang, ...file] = arg.split(':');
  if (!stageId || !LANGS.includes(lang as Lang) || !file.length) {
    console.error(`Invalid argument "${arg}". Expected stageId:en|es:path/to/file.wav`);
    process.exit(1);
  }
  return { stageId, lang: lang as Lang, file: file.join(':'), color: COLORS[i % COLORS.length] };
});

if (!jobs.length) {
  console.error('Usage: npm run simulate -- stageId:lang:file.wav [more...]');
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(job: Job) {
  const pcm = readPcmWav(job.file);
  const seconds = pcm.length / (AUDIO.sampleRate * 2);
  const tag = `${job.color}[${job.stageId}]${RESET}`;
  console.log(`${tag} streaming ${job.file} (${seconds.toFixed(1)} s, ${job.lang})`);

  // Audience side: also measures how long after the original each translation arrives.
  const watch = io(`${BACKEND}${NAMESPACES.watch}`);
  const finalsAt = new Map<number, number>();
  const translationDelays: number[] = [];
  let firstCaptionAt: number | undefined;
  watch.on(EVENTS.caption, (c: Caption) => {
    firstCaptionAt ??= Date.now();
    if (!c.isFinal) return;
    if (c.lang === job.lang) {
      finalsAt.set(c.seq, Date.now());
      console.log(`${tag} ${c.lang.toUpperCase()} #${c.seq}  ${c.text}`);
    } else {
      const t = finalsAt.get(c.seq);
      if (t) translationDelays.push(Date.now() - t);
      console.log(`${tag} ${c.lang.toUpperCase()} #${c.seq}  ${DIM}${c.text}${RESET}`);
    }
  });
  for (const lang of LANGS) watch.emit(EVENTS.subscribe, { stageId: job.stageId, lang });

  // Operator side.
  const ingest: Socket = io(`${BACKEND}${NAMESPACES.ingest}`, { auth: { token: TOKEN } });
  await new Promise<void>((resolve, reject) => {
    ingest.once('connect', resolve);
    ingest.once('connect_error', reject);
  });
  const res = await ingest.emitWithAck(EVENTS.stageStart, { stageId: job.stageId, sourceLang: job.lang });
  if (!res.ok) throw new Error(`${job.stageId}: ${res.error}`);

  // Real-time pacing, like a microphone would.
  const started = Date.now();
  for (let i = 0, n = 0; i < pcm.length; i += CHUNK_BYTES, n++) {
    ingest.emit(EVENTS.audioChunk, pcm.subarray(i, i + CHUNK_BYTES));
    const wait = started + (n + 1) * CHUNK_MS - Date.now();
    if (wait > 0) await sleep(wait);
  }
  const silence = Buffer.alloc(CHUNK_BYTES);
  for (let t = 0; t < TAIL_MS; t += CHUNK_MS) {
    ingest.emit(EVENTS.audioChunk, silence);
    await sleep(CHUNK_MS);
  }

  await ingest.emitWithAck(EVENTS.stageStop, {});
  await sleep(3000); // last translations
  ingest.close();
  watch.close();

  const avg = translationDelays.length
    ? Math.round(translationDelays.reduce((a, b) => a + b, 0) / translationDelays.length)
    : NaN;
  return {
    stageId: job.stageId,
    seconds,
    firstCaptionMs: firstCaptionAt ? firstCaptionAt - started : NaN,
    finals: finalsAt.size,
    translations: translationDelays.length,
    avg,
  };
}

Promise.all(jobs.map(run))
  .then((results) => {
    console.log('\n── Summary ──');
    for (const r of results) {
      console.log(
        `${r.stageId}: ${r.seconds.toFixed(0)} s audio · first caption after ${r.firstCaptionMs} ms · ` +
          `${r.finals} sentences · ${r.translations} translations · translation lag ${r.avg} ms`,
      );
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
