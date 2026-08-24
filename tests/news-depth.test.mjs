import assert from 'node:assert/strict';
import test from 'node:test';
import { validateNewsQuality } from '../scripts/news/validate.mjs';
import { makeBrief, makeEdition, makeRadar, makeRelease, makeTrend, words } from './helpers/news-fixtures.mjs';

const runAt = '2026-08-25T08:00:00+07:00';

test('obviously tiny brief and radar copy remain hard errors', () => {
  const report = validateNewsQuality([makeEdition({
    brief: [makeBrief({ text: 'Tiny unsupported fragment.' })],
    radar: [makeRadar({ text: 'Tiny signal.' })]
  })], { runAt });
  const codes = new Set(report.errors.map((entry) => entry.code));
  assert(codes.has('TINY_BRIEF'));
  assert(codes.has('TINY_RADAR'));
});

test('meaningful sub-40-word brief is warning-only, not a brittle hard failure', () => {
  const report = validateNewsQuality([makeEdition({
    brief: [makeBrief({ text: words(22, 'concise') })]
  })], { runAt });
  assert.equal(report.ok, true);
  assert(!report.errors.some((entry) => entry.code === 'TINY_BRIEF'));
  assert(report.warnings.some((entry) => entry.code === 'SHORT_BRIEF'));
});

test('a structurally complete 199-word trend passes without word-count padding', () => {
  const report = validateNewsQuality([makeEdition({
    trends: [makeTrend({ paragraphs: [words(100, 'verified'), words(99, 'impact')] })]
  })], { runAt });
  assert.equal(report.ok, true);
  assert(!report.errors.some((entry) => entry.code.includes('TREND')));
});

test('a padded single-paragraph trend fails its structural requirement', () => {
  const report = validateNewsQuality([makeEdition({
    trends: [makeTrend({ paragraphs: [words(201, 'padding')] })]
  })], { runAt });
  assert(report.errors.some((entry) => entry.code === 'TREND_MISSING_STRUCTURE'));
});

test('unusual trend and release lengths are non-blocking warnings', () => {
  const shortTrend = makeTrend({ paragraphs: [words(35, 'change'), words(35, 'impact')] });
  const shortRelease = makeRelease({
    summary: words(8, 'summary'),
    what_changed: words(5, 'change'),
    who_gets_it: words(3, 'audience'),
    why_it_matters: words(5, 'impact'),
    verdict_note: words(6, 'verdict')
  });
  const report = validateNewsQuality([makeEdition({ trends: [shortTrend], releases: [shortRelease] })], { runAt });
  assert.equal(report.ok, true);
  const warnings = new Set(report.warnings.map((entry) => entry.code));
  assert(warnings.has('SHORT_TREND'));
  assert(warnings.has('SHORT_RELEASE'));
});

test('missing sources remains a shared-schema hard error', () => {
  const report = validateNewsQuality([makeEdition({ brief: [makeBrief({ sources: [] })] })], { runAt });
  assert.equal(report.ok, false);
  assert(report.errors.some((entry) => entry.code === 'MISSING_SOURCES'));
});
