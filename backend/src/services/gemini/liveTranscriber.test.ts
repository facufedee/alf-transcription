import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ai } from './client';
import { LiveTranscriber } from './liveTranscriber';

interface FakeSession {
  close: () => void;
  sendRealtimeInput: () => void;
}

test('drops a stale resume handle after repeated reconnect failures instead of retrying forever', async () => {
  const originalConnect = ai.live.connect;
  let connectCalls = 0;
  const failFromCallOnward = 2; // first call succeeds and hands out a resume handle; the rest fail

  ai.live.connect = (async ({ callbacks }: any) => {
    connectCalls++;
    if (connectCalls >= failFromCallOnward) {
      throw new Error('simulated connect failure');
    }
    // Hand the transcriber a resume handle, then drop the connection shortly
    // after — like a real session would right before its duration limit —
    // so every later attempt is a *resume* attempt with that handle.
    const thisGen = connectCalls;
    queueMicrotask(() => {
      callbacks.onmessage({ sessionResumptionUpdate: { resumable: true, newHandle: 'fake-handle' } });
      setTimeout(() => callbacks.onclose({ code: 1011, reason: `simulated drop ${thisGen}` }), 10);
    });
    const session: FakeSession = { close: () => {}, sendRealtimeInput: () => {} };
    return session;
  }) as typeof ai.live.connect;

  try {
    const transcriber = new LiveTranscriber({ label: 'test', sourceLang: 'en' });
    const configsSeen: Array<{ sessionResumption?: { handle?: string } }> = [];
    const originalBuildConfig = (transcriber as any).buildConfig.bind(transcriber);
    (transcriber as any).buildConfig = () => {
      const cfg = originalBuildConfig();
      configsSeen.push(cfg);
      return cfg;
    };

    transcriber.on('error', () => {}); // Node's EventEmitter throws on unhandled 'error' events
    transcriber.start();

    // Wait past the 500ms + 1000ms + 2000ms backoff chain so the transcriber
    // has made its post-failure connect attempts (see MAX_RESUME_RETRIES = 3).
    await new Promise((resolve) => setTimeout(resolve, 4200));
    transcriber.stop();

    assert.ok(connectCalls >= 4, `expected at least 4 connect attempts, got ${connectCalls}`);
    // The one successful connect used no handle yet (it's the very first attempt).
    assert.equal(configsSeen[0].sessionResumption?.handle, undefined);
    // The failing retries right after should still be trying to resume...
    assert.equal(configsSeen[1].sessionResumption?.handle, 'fake-handle');
    // ...until MAX_RESUME_RETRIES is hit and the handle gets dropped.
    const lastConfig = configsSeen[configsSeen.length - 1];
    assert.equal(lastConfig.sessionResumption?.handle, undefined);
  } finally {
    ai.live.connect = originalConnect;
  }
});
