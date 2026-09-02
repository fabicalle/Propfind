export interface SessionHashInput {
  sessionId: string;
  userId?: string;
}

export function computeDailySessionHash(input: SessionHashInput): string {
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const payload = `${input.sessionId}|${input.userId || 'anon'}|${dayKey}`;

  return hashWithNodeCrypto(payload);
}

function hashWithNodeCrypto(payload: string): string {
  try {
    const nodeCrypto = require('node:crypto');
    return nodeCrypto.createHash('sha256').update(payload).digest('hex');
  } catch {
    return simpleHash(payload);
  }
}

function simpleHash(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `fallback-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
