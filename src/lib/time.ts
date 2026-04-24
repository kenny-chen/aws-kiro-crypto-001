export function utcNow(): Date {
  return new Date();
}

export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

export function isPast(date: Date): boolean {
  return date.getTime() <= Date.now();
}

export function formatForDisplay(date: Date, timeZone = "UTC"): string {
  return date.toLocaleString("en-US", { timeZone });
}
