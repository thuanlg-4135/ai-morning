import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEditionWindow, validatePublication } from '../scripts/news/time.mjs';
import { validateNewsQuality } from '../scripts/news/validate.mjs';
import { issueCodes, makeBrief, makeEdition, makeTrend } from './helpers/news-fixtures.mjs';

function manualEdition(overrides = {}) {
  return makeEdition({
    meta: {
      primary_scan_hours: 24,
      context_window_hours: 72,
      generated_at: '2026-08-25T02:30:00+07:00',
      cutoff_at: '2026-08-25T02:30:00+07:00',
      window_started_at: '2026-08-24T02:30:00+07:00',
      reading_minutes: 4,
      source_policy: 'official-first'
    },
    ...overrides
  });
}

test('manual run before 07:00 uses actual generation time as effective cutoff', () => {
  const window = resolveEditionWindow(manualEdition(), { runAt: '2026-08-25T03:00:00+07:00' });
  assert.equal(window.scheduledCutoff.toISOString(), '2026-08-25T00:00:00.000Z');
  assert.equal(window.effectiveCutoff.toISOString(), '2026-08-24T19:30:00.000Z');
});

test('run after 07:00 uses the scheduled cutoff', () => {
  const edition = makeEdition({ meta: undefined });
  const window = resolveEditionWindow(edition, { runAt: '2026-08-25T09:00:00+07:00' });
  assert.equal(window.effectiveCutoff.toISOString(), '2026-08-25T00:00:00.000Z');
});

test('freshness window is half-open at cutoff and inclusive at its lower edge', () => {
  const cutoff = new Date('2026-08-25T02:30:00+07:00');
  assert.equal(validatePublication('2026-08-25T02:30:00+07:00', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at').length, 1);
  assert.deepEqual(validatePublication('2026-08-25T02:29:59+07:00', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at'), []);
  assert.deepEqual(validatePublication('2026-08-24T02:30:00+07:00', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at'), []);
  assert.equal(validatePublication('2026-08-24T02:29:59.999+07:00', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at').length, 1);
});

test('CONTEXT_72H and timezone-equivalent timestamps use the same instant', () => {
  const cutoff = new Date('2026-08-25T02:30:00+07:00');
  assert.deepEqual(validatePublication('2026-08-21T19:30:00Z', 'CONTEXT_72H', '2026-08-25', cutoff, 'published_at'), []);
  assert.deepEqual(validatePublication('2026-08-24T19:29:59Z', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at'), []);
  assert.equal(validatePublication('2026-08-21T19:29:59.999Z', 'CONTEXT_72H', '2026-08-25', cutoff, 'published_at').length, 1);
});

test('manual validation rejects content published after the actual run time', () => {
  const edition = manualEdition({
    brief: [makeBrief({ published_at: '2026-08-25T05:00:00+07:00' })]
  });
  const report = validateNewsQuality([edition], { runAt: '2026-08-25T03:00:00+07:00' });
  assert(issueCodes(report).has('PUBLICATION_AT_OR_AFTER_CUTOFF'));
});

test('source evidence cannot be in the future when the item timestamp is valid', () => {
  const source = {
    label: 'Future source',
    type: 'official',
    url: 'https://example.test/future-source',
    published_at: '2026-08-25T05:00:00+07:00'
  };
  const edition = manualEdition({ brief: [makeBrief({ sources: [source] })] });
  const report = validateNewsQuality([edition], { runAt: '2026-08-25T03:00:00+07:00' });
  assert(issueCodes(report).has('PUBLICATION_AT_OR_AFTER_CUTOFF'));
});

test('date-only fallback accepts prior day and rejects edition day', () => {
  const cutoff = new Date('2026-08-25T07:00:00+07:00');
  assert.deepEqual(validatePublication('2026-08-24', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at'), []);
  assert(validatePublication('2026-08-25', 'NEW_TODAY', '2026-08-25', cutoff, 'published_at')[0].includes('cannot prove'));
});

test('generated_at and retained window metadata are checked against real run time', () => {
  const future = manualEdition({
    meta: {
      ...manualEdition().meta,
      generated_at: '2026-08-25T04:00:00+07:00',
      cutoff_at: '2026-08-25T04:00:00+07:00',
      window_started_at: '2026-08-24T04:00:00+07:00'
    }
  });
  const futureReport = validateNewsQuality([future], { runAt: '2026-08-25T03:00:00+07:00' });
  assert(issueCodes(futureReport).has('FUTURE_GENERATED_AT'));

  const stale = manualEdition({ meta: { ...manualEdition().meta, cutoff_at: '2026-08-25T07:00:00+07:00' } });
  const staleReport = validateNewsQuality([stale], { runAt: '2026-08-25T03:00:00+07:00' });
  assert(issueCodes(staleReport).has('STALE_CUTOFF_METADATA'));
});
