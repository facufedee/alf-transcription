import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SignJWT } from 'jose';
import type { Socket } from 'socket.io';
import { env } from '../config/env';
import { authenticate } from './ingest';

function fakeSocket(token: unknown): Socket {
  return { handshake: { auth: { token } }, data: {} } as unknown as Socket;
}

async function signOperatorToken(secret: string, overrides: Record<string, unknown> = {}) {
  return new SignJWT({ email: 'op@example.com', role: 'operator', ...overrides })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret));
}

test('ingest auth: accepts a valid operator JWT and records the email', async () => {
  const originalSecret = env.AUTH_SECRET;
  env.AUTH_SECRET = 'test-secret';
  try {
    const token = await signOperatorToken('test-secret');
    const socket = fakeSocket(token);
    await assert.doesNotReject(() => authenticate(socket));
    assert.equal((socket.data as any).operatorEmail, 'op@example.com');
  } finally {
    env.AUTH_SECRET = originalSecret;
  }
});

test('ingest auth: rejects a JWT signed with the wrong secret', async () => {
  const originalSecret = env.AUTH_SECRET;
  env.AUTH_SECRET = 'test-secret';
  try {
    const token = await signOperatorToken('some-other-secret');
    await assert.rejects(() => authenticate(fakeSocket(token)));
  } finally {
    env.AUTH_SECRET = originalSecret;
  }
});

test('ingest auth: rejects a token whose role is not "operator"', async () => {
  const originalSecret = env.AUTH_SECRET;
  env.AUTH_SECRET = 'test-secret';
  try {
    const token = await signOperatorToken('test-secret', { role: 'audience' });
    await assert.rejects(() => authenticate(fakeSocket(token)));
  } finally {
    env.AUTH_SECRET = originalSecret;
  }
});

test('ingest auth: rejects a missing token when AUTH_SECRET is set', async () => {
  const originalSecret = env.AUTH_SECRET;
  env.AUTH_SECRET = 'test-secret';
  try {
    await assert.rejects(() => authenticate(fakeSocket(undefined)));
  } finally {
    env.AUTH_SECRET = originalSecret;
  }
});

test('ingest auth: falls back to INGEST_TOKEN when AUTH_SECRET is unset', async () => {
  const originalSecret = env.AUTH_SECRET;
  const originalIngestToken = env.INGEST_TOKEN;
  env.AUTH_SECRET = undefined;
  env.INGEST_TOKEN = 'shared-dev-token';
  try {
    await assert.doesNotReject(() => authenticate(fakeSocket('shared-dev-token')));
    await assert.rejects(() => authenticate(fakeSocket('wrong-token')));
  } finally {
    env.AUTH_SECRET = originalSecret;
    env.INGEST_TOKEN = originalIngestToken;
  }
});
