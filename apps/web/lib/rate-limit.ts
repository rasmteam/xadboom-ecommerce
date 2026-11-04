// Small in-memory limiter for login attempts. Per-instance only; fine for a single container,
// replace with a DB/Redis counter if the app is ever scaled horizontally.
const hits = new Map<string, number[]>();

export function tooManyAttempts(key: string, max = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, recent);
  return recent.length >= max;
}

export function recordAttempt(key: string) {
  hits.set(key, [...(hits.get(key) ?? []), Date.now()]);
}

export function clearAttempts(key: string) {
  hits.delete(key);
}
