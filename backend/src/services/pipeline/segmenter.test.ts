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
