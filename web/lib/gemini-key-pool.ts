const GEMINI_API_KEY_ENV_NAMES = [
  'GEMINI_API_KEY_1',
  'GEMINI_API_KEY_2',
  'GEMINI_API_KEY_3',
  'GEMINI_API_KEY_4',
] as const;

export type GeminiApiKeySlot = {
  index: number;
  name: (typeof GEMINI_API_KEY_ENV_NAMES)[number];
  value: string;
};

let activeKeyIndex = 0;

export function getConfiguredGeminiApiKeys(env: NodeJS.ProcessEnv = process.env): GeminiApiKeySlot[] {
  return GEMINI_API_KEY_ENV_NAMES.flatMap((name, index) => {
    const value = env[name]?.trim();

    return value ? [{ index, name, value }] : [];
  });
}

export function getGeminiApiKeyAttempts(env: NodeJS.ProcessEnv = process.env): GeminiApiKeySlot[] {
  const keys = getConfiguredGeminiApiKeys(env);

  if (keys.length === 0) {
    return [];
  }

  const start = keys.findIndex((key) => key.index >= activeKeyIndex);
  const normalizedStart = start === -1 ? 0 : start;

  return [...keys.slice(normalizedStart), ...keys.slice(0, normalizedStart)];
}

export function markGeminiApiKeyQuotaExhausted(key: Pick<GeminiApiKeySlot, 'index'>) {
  activeKeyIndex = (key.index + 1) % GEMINI_API_KEY_ENV_NAMES.length;
}

export function markGeminiApiKeySucceeded(key: Pick<GeminiApiKeySlot, 'index'>) {
  activeKeyIndex = key.index;
}

export function isGeminiQuotaError(status: number, body: unknown) {
  const error = body && typeof body === 'object' && 'error' in body ? body.error : null;
  const errorStatus = error && typeof error === 'object' && 'status' in error ? String(error.status) : '';
  const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';

  return (
    status === 429 ||
    errorStatus === 'RESOURCE_EXHAUSTED' ||
    /quota|rate limit|resource exhausted|exceeded/i.test(errorMessage)
  );
}

export function resetGeminiApiKeyPoolForTest() {
  activeKeyIndex = 0;
}
