export const STABLE_IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export const wordCount = (value) => String(value ?? '')
  .trim()
  .split(/\s+/u)
  .filter(Boolean)
  .length;

export function isHttpUrl(value) {
  if (!hasText(value)) return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function isZonedTimestamp(value) {
  if (!hasText(value) || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return false;
  return !Number.isNaN(new Date(value).valueOf());
}
