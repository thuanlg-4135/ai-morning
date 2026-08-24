import assert from 'node:assert/strict';
import test from 'node:test';
import { detectEditorialFatigue } from '../scripts/news/dedupe.mjs';
import { validateNewsQuality } from '../scripts/news/validate.mjs';
import { makeBrief, makeEdition, makeSignature, makeTrend } from './helpers/news-fixtures.mjs';

const titles = [
  'Compiler allocation changes reduce production memory churn',
  'Database recovery controls protect encrypted snapshots',
  'Network policy checks isolate untrusted plugin traffic',
  'Build provenance records expose dependency replacement risk'
];
const briefTitles = [
  'Runtime scheduler patch prevents recursive worker deadlocks',
  'Object storage checksum catches corrupted archive segments',
  'Package signing rule rejects unsigned transitive dependencies',
  'Observability exporter records missing trace parent context'
];
const briefOrganizations = ['northstar', 'blueharbor', 'ironwood', 'silverline'];
const briefProducts = ['scheduler', 'object-store', 'package-signer', 'trace-exporter'];
const trendOrganizations = ['compilerworks', 'datavault', 'netshield', 'buildledger'];
const trendProducts = ['allocator', 'snapshotter', 'policy-engine', 'provenance-log'];

function previousDate(date) {
  return new Date(new Date(date + 'T00:00:00Z').valueOf() - 86_400_000).toISOString().slice(0, 10);
}

function dailyEdition(index, theme, angle, extraTrend = {}) {
  const date = '2026-08-' + String(22 + index).padStart(2, '0');
  const prior = previousDate(date);
  const briefId = 'daily-brief-' + index;
  const trendId = 'daily-trend-' + index;
  const brief = makeBrief({
    event_id: briefId,
    title: briefTitles[index],
    published_at: prior + 'T10:00:00+07:00',
    event_signature: makeSignature({ organization: briefOrganizations[index], product: briefProducts[index], artifact: 'brief-change-' + index }),
    sources: [{ label: 'Daily brief source', type: 'official', url: 'https://brief-' + index + '.example.test/change', published_at: prior + 'T10:00:00+07:00' }]
  });
  const trend = makeTrend({
    event_id: trendId,
    id: trendId,
    title: titles[index],
    published_at: prior + 'T11:00:00+07:00',
    event_signature: makeSignature({ organization: trendOrganizations[index], product: trendProducts[index], artifact: 'trend-change-' + index }),
    sources: [{ label: 'Daily trend source', type: 'official', url: 'https://trend-' + index + '.example.test/change', published_at: prior + 'T11:00:00+07:00' }],
    editorial_theme: theme,
    editorial_angle: angle,
    ...extraTrend
  });
  return makeEdition({
    edition_date: date,
    meta: {
      primary_scan_hours: 24,
      context_window_hours: 72,
      generated_at: date + 'T07:00:00+07:00',
      cutoff_at: date + 'T07:00:00+07:00',
      window_started_at: prior + 'T07:00:00+07:00',
      reading_minutes: 4,
      source_policy: 'official-first'
    },
    brief: [brief],
    trends: [trend]
  });
}

test('same lead theme in the previous three editions produces a warning', () => {
  const editions = [
    dailyEdition(0, 'agent-governance', 'approval-boundaries'),
    dailyEdition(1, 'agent-governance', 'audit-records'),
    dailyEdition(2, 'agent-governance', 'runtime-policy'),
    dailyEdition(3, 'agent-governance', 'identity-controls')
  ];
  const warnings = detectEditorialFatigue(editions);
  assert(warnings.some((warning) => warning.code === 'EDITORIAL_THEME_FATIGUE'));
});

test('same lead theme and angle within three editions produces a stronger warning', () => {
  const editions = [
    dailyEdition(0, 'agent-governance', 'identity-and-access'),
    dailyEdition(1, 'model-economics', 'cost-per-task'),
    dailyEdition(2, 'ai-infrastructure', 'cache-routing'),
    dailyEdition(3, 'agent-governance', 'identity-and-access')
  ];
  const warnings = detectEditorialFatigue(editions);
  assert(warnings.some((warning) => warning.code === 'EDITORIAL_THEME_ANGLE_FATIGUE'));
});

test('different lead themes and non-lead repetitions do not warn', () => {
  const editions = [
    dailyEdition(0, 'model-economics', 'cost-per-task'),
    dailyEdition(1, 'agent-protocols', 'production-readiness'),
    dailyEdition(2, 'ai-infrastructure', 'cache-routing'),
    dailyEdition(3, 'domain-models', 'data-control')
  ];
  assert.deepEqual(detectEditorialFatigue(editions), []);
});

test('fatigue warning and editorial_repeat_reason remain non-blocking', () => {
  const editions = [
    dailyEdition(0, 'agent-governance', 'approval-boundaries'),
    dailyEdition(1, 'agent-governance', 'audit-records'),
    dailyEdition(2, 'agent-governance', 'runtime-policy'),
    dailyEdition(3, 'agent-governance', 'identity-controls', {
      editorial_repeat_reason: 'A major documented access-control change makes the repeated theme editorially necessary.'
    })
  ];
  const report = validateNewsQuality(editions, { runAt: '2026-08-26T08:00:00+07:00' });
  assert.equal(report.ok, true);
  assert.equal(report.errors.length, 0);
  assert(report.warnings.some((warning) => warning.code === 'EDITORIAL_THEME_FATIGUE'));
});

test('hard duplicate still fails while fatigue warnings remain visible', () => {
  const editions = [
    dailyEdition(0, 'agent-governance', 'approval-boundaries'),
    dailyEdition(1, 'agent-governance', 'audit-records'),
    dailyEdition(2, 'agent-governance', 'runtime-policy'),
    dailyEdition(3, 'agent-governance', 'identity-controls')
  ];
  editions[3].brief.push({ ...editions[3].brief[0] });
  const report = validateNewsQuality(editions, { runAt: '2026-08-26T08:00:00+07:00' });
  assert.equal(report.ok, false);
  assert(report.errors.some((error) => error.code === 'DUPLICATE_EVENT_HOME'));
  assert(report.warnings.some((warning) => warning.code === 'EDITORIAL_THEME_FATIGUE'));
});
