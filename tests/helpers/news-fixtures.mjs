export const DEFAULT_EDITION_DATE = '2026-08-25';
export const DEFAULT_RUN_AT = '2026-08-25T08:00:00+07:00';

export function words(count, prefix = 'evidence') {
  return Array.from({ length: count }, (_, index) => prefix + (index + 1)).join(' ');
}

export function makeSource(overrides = {}) {
  return {
    label: 'Synthetic primary source',
    url: 'https://example.test/news/default-event',
    type: 'official',
    published_at: '2026-08-24T10:00:00+07:00',
    ...overrides
  };
}

export function makeSignature(overrides = {}) {
  return {
    organization: 'example-org',
    product: 'example-product',
    action: 'release',
    artifact: 'default-artifact',
    ...overrides
  };
}

function sourceFor(eventId, sourceOverrides = {}) {
  return makeSource({ url: 'https://example.test/news/' + eventId, ...sourceOverrides });
}

export function makeBrief(overrides = {}) {
  const eventId = overrides.event_id ?? 'default-brief-event';
  return {
    event_id: eventId,
    event_signature: makeSignature({ product: eventId, artifact: 'brief-change' }),
    title: 'Example product ships a concrete workflow improvement',
    text: words(45, 'brief'),
    freshness: 'NEW_TODAY',
    published_at: '2026-08-24T10:00:00+07:00',
    sources: [sourceFor(eventId)],
    ...overrides
  };
}

export function makeTrend(overrides = {}) {
  const eventId = overrides.event_id ?? 'default-trend-event';
  return {
    id: eventId,
    event_id: eventId,
    event_signature: makeSignature({ product: eventId, artifact: 'trend-change' }),
    title: 'Engineering teams adopt a verified production pattern',
    paragraphs: [words(60, 'change'), words(60, 'impact'), words(40, 'practice')],
    action: 'Test the documented path with production-like inputs before broad adoption.',
    freshness: 'NEW_TODAY',
    published_at: '2026-08-24T11:00:00+07:00',
    strength: 'EMERGING',
    importance: 'LEAD',
    sources: [sourceFor(eventId, { published_at: '2026-08-24T11:00:00+07:00' })],
    ...overrides
  };
}

export function makeRelease(overrides = {}) {
  const eventId = overrides.event_id ?? 'default-release-event';
  return {
    event_id: eventId,
    event_signature: makeSignature({ product: eventId, artifact: 'release-change' }),
    product: 'Example SDK',
    feature: 'Production workflow controls',
    status: 'RELEASED',
    summary: words(25, 'summary'),
    what_changed: words(15, 'change'),
    who_gets_it: words(10, 'audience'),
    why_it_matters: words(15, 'impact'),
    verdict: 'TRY_NOW',
    verdict_note: words(20, 'verdict'),
    freshness: 'NEW_TODAY',
    published_at: '2026-08-24T12:00:00+07:00',
    sources: [sourceFor(eventId, { published_at: '2026-08-24T12:00:00+07:00' })],
    ...overrides
  };
}

export function makeRadar(overrides = {}) {
  const eventId = overrides.event_id ?? 'default-radar-event';
  return {
    event_id: eventId,
    event_signature: makeSignature({ product: eventId, action: 'research', artifact: 'radar-signal' }),
    status: 'WATCH',
    text: words(16, 'signal'),
    freshness: 'NEW_TODAY',
    published_at: '2026-08-24T13:00:00+07:00',
    sources: [sourceFor(eventId, { type: 'research', published_at: '2026-08-24T13:00:00+07:00' })],
    ...overrides
  };
}

export function makeEdition(overrides = {}) {
  const editionDate = overrides.edition_date ?? DEFAULT_EDITION_DATE;
  const defaultMeta = editionDate === DEFAULT_EDITION_DATE
    ? {
        primary_scan_hours: 24,
        context_window_hours: 72,
        generated_at: '2026-08-25T07:00:00+07:00',
        cutoff_at: '2026-08-25T07:00:00+07:00',
        window_started_at: '2026-08-24T07:00:00+07:00',
        reading_minutes: 4,
        source_policy: 'official-first'
      }
    : undefined;
  return {
    schema_version: 1,
    edition_date: editionDate,
    locale: 'vi-VN',
    edition_type: 'morning',
    edition_mode: 'NORMAL',
    headline: 'Synthetic AI Morning edition',
    dek: 'Verified developer news for deterministic tests.',
    ...(defaultMeta ? { meta: defaultMeta } : {}),
    brief: [makeBrief()],
    trends: [makeTrend()],
    releases: [],
    developer_memo: {
      title: 'Developer memo',
      direct_answer: 'Validate evidence before production rollout.',
      actions: ['Run the documented validation path.'],
      avoid: ['Do not infer unsupported claims.']
    },
    radar: [],
    takeaway: 'Prefer verified structural evidence over repetition.',
    ...overrides
  };
}

export function issueCodes(report, level = 'errors') {
  return new Set(report[level].map((entry) => entry.code));
}

export function withPublication(item, publishedAt, sources = item.sources) {
  return {
    ...item,
    published_at: publishedAt,
    sources: sources.map((source) => ({ ...source, published_at: publishedAt }))
  };
}
