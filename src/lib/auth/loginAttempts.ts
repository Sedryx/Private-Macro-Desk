const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

type AttemptRecord = { count: number; firstAttempt: number; lockedUntil?: number };

// Stored on globalThis so counts survive Next.js dev-mode HMR reloads, same pattern as the data
// schedulers. In-memory only (no DB) is fine here: a server restart resetting attempt counts is an
// acceptable tradeoff for a two-user private app, and avoids adding write load for every login try.
const globalForLoginAttempts = globalThis as typeof globalThis & {
  loginAttempts?: Map<string, AttemptRecord>;
};

function getStore() {
  return globalForLoginAttempts.loginAttempts ?? (globalForLoginAttempts.loginAttempts = new Map());
}

export function getLockoutRemainingSeconds(email: string): number {
  const record = getStore().get(email.toLowerCase());
  if (!record?.lockedUntil) return 0;
  const remainingMs = record.lockedUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function recordFailedLogin(email: string) {
  const key = email.toLowerCase();
  const store = getStore();
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    store.set(key, { count: 1, firstAttempt: now });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
}

export function clearLoginAttempts(email: string) {
  getStore().delete(email.toLowerCase());
}
