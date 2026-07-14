export const BLOCKING_PAUSE_MINUTES = 30;
export const BLOCKING_PAUSE_LIMIT = 3;
export const BLOCKING_PAUSE_UNDO_MINUTES = 5;

export function normalizeBlockedDomain(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (!hostname || hostname.length > 253) return null;
    if (hostname !== 'localhost' && !hostname.includes('.')) return null;
    return hostname;
  } catch {
    return null;
  }
}

export function normalizeBlocklist(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map(normalizeBlockedDomain)
    .filter((entry): entry is string => Boolean(entry));
  return [...new Set(normalized)];
}
