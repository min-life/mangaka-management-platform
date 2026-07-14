import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getGeminiApiKeyAttempts,
  isGeminiQuotaError,
  markGeminiApiKeyQuotaExhausted,
  markGeminiApiKeySucceeded,
  resetGeminiApiKeyPoolForTest,
} from './gemini-key-pool.ts';

const env = {
  GEMINI_API_KEY_1: 'key-1',
  GEMINI_API_KEY_2: 'key-2',
  GEMINI_API_KEY_3: 'key-3',
  GEMINI_API_KEY_4: 'key-4',
};

test('starts with GEMINI_API_KEY_1 by default', () => {
  resetGeminiApiKeyPoolForTest();

  assert.deepEqual(
    getGeminiApiKeyAttempts(env).map((key) => key.name),
    ['GEMINI_API_KEY_1', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4'],
  );
});

test('switches to the next key when the active key is out of quota', () => {
  resetGeminiApiKeyPoolForTest();
  const [firstKey] = getGeminiApiKeyAttempts(env);

  markGeminiApiKeyQuotaExhausted(firstKey);

  assert.deepEqual(
    getGeminiApiKeyAttempts(env).map((key) => key.name),
    ['GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_1'],
  );
});

test('wraps from GEMINI_API_KEY_4 back to GEMINI_API_KEY_1', () => {
  resetGeminiApiKeyPoolForTest();
  markGeminiApiKeySucceeded({ index: 3 });
  const [fourthKey] = getGeminiApiKeyAttempts(env);

  markGeminiApiKeyQuotaExhausted(fourthKey);

  assert.deepEqual(
    getGeminiApiKeyAttempts(env).map((key) => key.name),
    ['GEMINI_API_KEY_1', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4'],
  );
});

test('detects Gemini quota and rate-limit errors', () => {
  assert.equal(isGeminiQuotaError(429, null), true);
  assert.equal(isGeminiQuotaError(403, { error: { status: 'RESOURCE_EXHAUSTED' } }), true);
  assert.equal(isGeminiQuotaError(403, { error: { message: 'Quota exceeded for this API key.' } }), true);
  assert.equal(isGeminiQuotaError(400, { error: { status: 'INVALID_ARGUMENT' } }), false);
});
