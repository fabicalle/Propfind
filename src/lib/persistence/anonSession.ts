const ANON_SESSION_KEY = 'propfind_anon_session';

export function getAnonymousSession(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(ANON_SESSION_KEY);
    if (raw) return JSON.parse(raw).sessionId;
  } catch {
    // ignore
  }
  const sessionId = crypto.randomUUID();
  localStorage.setItem(ANON_SESSION_KEY, JSON.stringify({ sessionId, createdAt: Date.now() }));
  return sessionId;
}
