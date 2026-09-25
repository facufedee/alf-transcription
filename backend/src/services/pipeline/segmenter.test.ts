import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Segmenter } from './segmenter';

function collect(s: Segmenter) {
  const finals: [string, number][] = [];
  const partials: [string, number][] = [];
  s.on('final', (t, seq) => finals.push([t, seq]));
  s.on('partial', (t, seq) => partials.push([t, seq]));
  return { finals, partials };
}

test('closes a sentence at punctuation and keeps the rest as the next partial', () => {
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals, partials } = collect(s);
  for (const f of [' Hello everyone and', ' welcome to Nerdearla.', ' Today we', ' talk']) s.push(f);
  assert.deepEqual(finals, [['Hello everyone and welcome to Nerdearla.', 0]]);
  assert.deepEqual(partials.at(-1), ['Today we talk', 1]);
  s.dispose();
});

test('does not cut very short sentences', () => {
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals } = collect(s);
  s.push(' Hi. Welcome to the conference, everyone.');
  assert.deepEqual(finals, [['Hi. Welcome to the conference, everyone.', 0]]);
  s.dispose();
});

test('does not cut on decimals', () => {
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals } = collect(s);
  s.push(' We upgraded to version 3.5 of the operator');
  assert.equal(finals.length, 0);
  s.dispose();
});

test('forces a cut on long run-on speech at a word boundary', () => {
  const s = new Segmenter({ maxChars: 40, silenceMs: 10_000 });
  const { finals } = collect(s);
  s.push(' and then we deployed it and then we rolled it back and then');
  assert.equal(finals.length, 1);
  assert.ok(finals[0][0].length <= 40);
  s.dispose();
});

test('flushes on silence', async () => {
  const s = new Segmenter({ silenceMs: 20 });
  const { finals } = collect(s);
  s.push(' so that is all');
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(finals, [['so that is all', 0]]);
});

test('emits partials from pushInterim without corrupting seq or finals', () => {
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals, partials } = collect(s);
  s.pushInterim('Hello');
  s.pushInterim('Hello everyone');
  assert.deepEqual(partials, [
    ['Hello', 0],
    ['Hello everyone', 0],
  ]);
  assert.equal(finals.length, 0);

  s.push('Hello everyone and welcome to the stage.');
  assert.deepEqual(finals, [['Hello everyone and welcome to the stage.', 0]]);
  s.dispose();
});

test('a silence-timeout flush mid-stream does not cause the next pushInterim to re-emit already-committed text', async () => {
  // Reproduces a real bug: Gemini's transcribe-model interim buffer for one
  // utterance can keep growing across gaps longer than silenceMs (confirmed
  // against a real recording, gaps up to ~2s were common) — it is NOT a sign
  // the segment actually ended. flush() used to reset committed-chars
  // tracking to 0 on that timeout, so the next pushInterim() re-discovered
  // and re-emitted the whole thing already committed as a duplicate final.
  const s = new Segmenter({ silenceMs: 20 });
  const { finals } = collect(s);

  s.pushInterim('Hi everyone and welcome to Nerdearla.');
  s.pushInterim('Hi everyone and welcome to Nerdearla. Today I want to talk');
  assert.deepEqual(finals, [['Hi everyone and welcome to Nerdearla.', 0]]);

  await new Promise((r) => setTimeout(r, 50)); // silence timer fires flush()
  assert.deepEqual(finals, [
    ['Hi everyone and welcome to Nerdearla.', 0],
    ['Today I want to talk', 1],
  ]);

  // Gemini's buffer never reset — the next message extends the same text.
  s.pushInterim('Hi everyone and welcome to Nerdearla. Today I want to talk about Kubernetes in production.');
  assert.deepEqual(finals, [
    ['Hi everyone and welcome to Nerdearla.', 0],
    ['Today I want to talk', 1],
  ]);
  s.dispose();
});

test('a retroactive word revision in already-committed text does not re-emit the whole prefix', () => {
  // Reproduces a real bug: Gemini revised an already-delivered word
  // ("OpenClaw" -> "OpenClo") as more audio arrived. Comparing the new text
  // byte-for-byte against what we'd committed treated that one-character
  // diff as "the buffer restarted" and re-committed the entire prefix as a
  // duplicate final — and it kept happening on every later revision,
  // snowballing into the whole transcript repeating from the start
  // (confirmed against a real 2min+ recording).
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals } = collect(s);

  s.pushInterim('Un mes con OpenClaw.');
  s.pushInterim('Un mes con OpenClaw. Obviamente pasan cosas');
  assert.deepEqual(finals, [['Un mes con OpenClaw.', 0]]);

  // Same prefix, but Gemini revised "OpenClaw" to "OpenClo" retroactively.
  s.pushInterim('Un mes con OpenClo. Obviamente pasan cosas y meses.');
  assert.deepEqual(finals, [['Un mes con OpenClaw.', 0]]); // not re-committed
  s.dispose();
});

test('cuts a sentence even when Gemini glues the next one on with no space', () => {
  // Confirmed against a real recording: Gemini's transcription sometimes
  // omits the space after sentence-ending punctuation ("eso.Fíjate que...").
  // A cut still has to happen or the caption just keeps growing forever.
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals } = collect(s);
  s.pushInterim('Le manda eso.Fíjate que arriba dice el usuario');
  assert.deepEqual(finals, [['Le manda eso.', 0]]);
  s.dispose();
});

test('cuts completed sentences in pushInterim when next sentence starts', () => {
  const s = new Segmenter({ silenceMs: 10_000 });
  const { finals, partials } = collect(s);
  s.pushInterim('Hi everyone and welcome to Nerdearla.');
  assert.equal(finals.length, 0); // No next sentence yet

  s.pushInterim('Hi everyone and welcome to Nerdearla. Today I want to talk');
  assert.deepEqual(finals, [['Hi everyone and welcome to Nerdearla.', 0]]);
  assert.deepEqual(partials.at(-1), ['Today I want to talk', 1]);

  s.pushInterim('Hi everyone and welcome to Nerdearla. Today I want to talk about Kubernetes in production.');
  assert.equal(finals.length, 1);

  s.push('Hi everyone and welcome to Nerdearla. Today I want to talk about Kubernetes in production.');
  assert.deepEqual(finals, [
    ['Hi everyone and welcome to Nerdearla.', 0],
    ['Today I want to talk about Kubernetes in production.', 1],
  ]);
  s.dispose();
});
