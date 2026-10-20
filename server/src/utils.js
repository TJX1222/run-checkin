import crypto from 'node:crypto';

export function createId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function paceSecondsPerKilo(distanceMeters, durationSeconds) {
  if (!distanceMeters || distanceMeters <= 0) return 0;
  return durationSeconds / (distanceMeters / 1000);
}

export function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function addDays(dateKey, delta) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function computeStreak(runs) {
  const days = new Set(runs.map((run) => toDateKey(run.startedAt)).filter(Boolean));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = addDays(today, -1);

  let cursor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  if (!cursor) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
