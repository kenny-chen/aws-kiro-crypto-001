const windows = new Map<string, number[]>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = windows.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < windowMs);
  if (valid.length >= maxRequests) return false;
  valid.push(now);
  windows.set(key, valid);
  return true;
}

// Presets
export const RATE = {
  CREATE_MARKET: { max: 5, windowMs: 60_000 },
  CREATE_DUEL: { max: 10, windowMs: 60_000 },
  SEND_CHAT: { max: 30, windowMs: 60_000 },
} as const;
