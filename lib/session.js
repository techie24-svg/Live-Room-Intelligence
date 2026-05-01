export function getOrCreateSessionId(scope = 'default') {
  if (typeof window === 'undefined') return '';

  const safeScope = String(scope || 'default').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 80);
  const key = `feelpulse-session:${safeScope}`;
  let sessionId = window.localStorage.getItem(key);

  if (!sessionId) {
    const randomId =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

    sessionId = `session-${randomId}`;
    window.localStorage.setItem(key, sessionId);
  }

  return sessionId;
}
