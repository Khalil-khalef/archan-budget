import "server-only";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type Entry = { failures: number; lockedUntil: number | null };

const attempts = new Map<string, Entry>();

export function checkLoginRateLimit(phone: string): {
  locked: boolean;
  minutesLeft: number;
} {
  const entry = attempts.get(phone);
  if (!entry?.lockedUntil) return { locked: false, minutesLeft: 0 };

  if (Date.now() < entry.lockedUntil) {
    return {
      locked: true,
      minutesLeft: Math.ceil((entry.lockedUntil - Date.now()) / 60000),
    };
  }

  attempts.delete(phone);
  return { locked: false, minutesLeft: 0 };
}

export function recordLoginFailure(phone: string): void {
  const entry = attempts.get(phone) ?? { failures: 0, lockedUntil: null };
  entry.failures += 1;
  if (entry.failures >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS;
  }
  attempts.set(phone, entry);
}

export function resetLoginRateLimit(phone: string): void {
  attempts.delete(phone);
}
