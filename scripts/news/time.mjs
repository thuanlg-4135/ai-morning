import { hasText, isCalendarDate, isZonedTimestamp } from './utils.mjs';

export const FRESHNESS_HOURS = Object.freeze({ NEW_TODAY: 24, CONTEXT_72H: 72 });
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function calendarDate(value) {
  if (!hasText(value)) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match && isCalendarDate(match[1]) ? match[1] : null;
}

export function exactTimestamp(value) {
  return isZonedTimestamp(value) ? new Date(value) : null;
}

export function scheduledCutoff(editionDate) {
  if (!isCalendarDate(editionDate)) throw new Error('editionDate must be YYYY-MM-DD');
  return new Date(editionDate + 'T07:00:00+07:00');
}

export function dateDifference(later, earlier) {
  return Math.round((new Date(later + 'T00:00:00Z') - new Date(earlier + 'T00:00:00Z')) / DAY_MS);
}

function asRunDate(runAt) {
  const parsed = runAt instanceof Date ? new Date(runAt.valueOf()) : new Date(runAt);
  if (Number.isNaN(parsed.valueOf())) throw new Error('runAt must be a valid date or timestamp');
  return parsed;
}

export function resolveEditionWindow(edition, { runAt = new Date() } = {}) {
  const scheduled = scheduledCutoff(edition.edition_date);
  const observedRun = asRunDate(runAt);
  const explicitGeneration = edition.meta?.generated_at === undefined
    ? null
    : exactTimestamp(edition.meta.generated_at);
  const actualRun = explicitGeneration ?? observedRun;
  const effectiveCutoff = new Date(Math.min(scheduled.valueOf(), actualRun.valueOf()));
  const primaryHours = Number.isFinite(edition.meta?.primary_scan_hours)
    ? edition.meta.primary_scan_hours
    : FRESHNESS_HOURS.NEW_TODAY;
  return {
    scheduledCutoff: scheduled,
    observedRun,
    actualRun,
    effectiveCutoff,
    primaryWindowStart: new Date(effectiveCutoff.valueOf() - primaryHours * HOUR_MS),
    explicitGeneration
  };
}

export function validateEditionWindowMetadata(edition, { runAt = new Date() } = {}) {
  const errors = [];
  const window = resolveEditionWindow(edition, { runAt });
  const file = 'content/' + edition.edition_date + '.json';

  if (edition.meta?.generated_at !== undefined && !window.explicitGeneration) {
    errors.push({
      level: 'error', code: 'INVALID_GENERATED_AT', file, field: 'meta.generated_at',
      message: 'meta.generated_at must be a full ISO 8601 timestamp with a time zone.'
    });
  } else if (window.explicitGeneration && window.explicitGeneration > window.observedRun) {
    errors.push({
      level: 'error', code: 'FUTURE_GENERATED_AT', file, field: 'meta.generated_at',
      message: 'meta.generated_at is later than the actual validation run time.'
    });
  }

  const expectedCutoff = window.effectiveCutoff.valueOf();
  if (edition.meta?.cutoff_at !== undefined) {
    const cutoff = exactTimestamp(edition.meta.cutoff_at);
    if (!cutoff || cutoff.valueOf() !== expectedCutoff) {
      errors.push({
        level: 'error', code: 'STALE_CUTOFF_METADATA', file, field: 'meta.cutoff_at',
        message: 'meta.cutoff_at must equal the effective cutoff ' + window.effectiveCutoff.toISOString() + '.'
      });
    }
  }

  if (edition.meta?.window_started_at !== undefined) {
    const start = exactTimestamp(edition.meta.window_started_at);
    if (!start || start.valueOf() !== window.primaryWindowStart.valueOf()) {
      errors.push({
        level: 'error', code: 'STALE_WINDOW_METADATA', file, field: 'meta.window_started_at',
        message: 'meta.window_started_at must equal the effective NEW_TODAY window start ' + window.primaryWindowStart.toISOString() + '.'
      });
    }
  }
  return { ...window, errors };
}

export function validatePublication(value, freshness, editionDate, effectiveCutoff, field) {
  const errors = [];
  const dateOnly = hasText(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) ? calendarDate(value) : null;
  const timestamp = exactTimestamp(value);
  if (!dateOnly && !timestamp) {
    return [field + ' must be YYYY-MM-DD or a full ISO timestamp with a time zone'];
  }

  if (timestamp) {
    if (timestamp >= effectiveCutoff) {
      errors.push(field + ' is at or after the effective edition cutoff ' + effectiveCutoff.toISOString());
    }
    const hours = FRESHNESS_HOURS[freshness];
    if (hours && timestamp < new Date(effectiveCutoff.valueOf() - hours * HOUR_MS)) {
      errors.push(field + ' is outside the exact ' + hours + '-hour ' + freshness + ' window');
    }
    return errors;
  }

  const age = dateDifference(editionDate, dateOnly);
  if (age < 0) errors.push(field + ' is later than the edition date');
  if (dateOnly === editionDate) {
    errors.push(field + ' is date-only on the edition date and cannot prove publication before the effective cutoff');
  }
  const maxCalendarAge = freshness === 'NEW_TODAY' ? 1 : freshness === 'CONTEXT_72H' ? 3 : null;
  if (maxCalendarAge !== null && age > maxCalendarAge) {
    errors.push(field + ' is outside the ' + freshness + ' calendar fallback window');
  }
  return errors;
}

export function publicationIsNewer(later, earlier) {
  const laterExact = exactTimestamp(later);
  const earlierExact = exactTimestamp(earlier);
  if (laterExact && earlierExact) return laterExact > earlierExact;
  const laterDate = calendarDate(later);
  const earlierDate = calendarDate(earlier);
  return Boolean(laterDate && earlierDate && laterDate > earlierDate);
}
