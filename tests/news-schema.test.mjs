import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEditionSchema } from '../scripts/news/schema.mjs';
import { makeBrief, makeEdition, makeTrend } from './helpers/news-fixtures.mjs';

const codes = (errors) => new Set(errors.map((error) => error.code));

test('shared schema accepts a complete edition and unknown optional fields', () => {
  const edition = makeEdition({ future_optional_field: { enabled: true } });
  assert.deepEqual(validateEditionSchema(edition, { filename: '2026-08-25.json' }), []);
});

test('shared schema reports missing required fields and filename mismatch', () => {
  const edition = makeEdition({ headline: undefined });
  const errors = validateEditionSchema(edition, { filename: '2026-08-24.json' });
  assert(codes(errors).has('MISSING_REQUIRED_FIELD'));
  assert(codes(errors).has('INVALID_HEADLINE'));
  assert(codes(errors).has('EDITION_DATE_MISMATCH'));
});

test('shared schema rejects renderer and editorial enum drift', () => {
  const edition = makeEdition({
    edition_mode: 'LOUD',
    trends: [makeTrend({ strength: 'CONFIRMED_RELEASE', importance: 'PRIMARY' })]
  });
  const errors = validateEditionSchema(edition, { filename: '2026-08-25.json' });
  assert(codes(errors).has('INVALID_EDITION_MODE'));
  assert(codes(errors).has('INVALID_TREND_STRENGTH'));
  assert(codes(errors).has('INVALID_IMPORTANCE'));
});

test('shared schema rejects malformed event signatures and actions', () => {
  const edition = makeEdition({
    brief: [makeBrief({
      event_signature: {
        organization: 'Example Org',
        product: 'valid-product',
        action: 'open-sourced',
        artifact: 'valid-artifact'
      }
    })]
  });
  const errors = validateEditionSchema(edition, { filename: '2026-08-25.json' });
  assert(codes(errors).has('MALFORMED_EVENT_SIGNATURE'));
  assert(codes(errors).has('INVALID_EVENT_ACTION'));
});

test('shared schema requires meaningful brief copy and source structure', () => {
  const edition = makeEdition({
    brief: [makeBrief({ title: '', text: '', sources: [{ label: '', type: 'social', url: 'ftp://example.test', published_at: '' }] })]
  });
  const errors = validateEditionSchema(edition, { filename: '2026-08-25.json' });
  const found = codes(errors);
  assert(found.has('MISSING_BRIEF_TITLE'));
  assert(found.has('MISSING_BRIEF_BODY'));
  assert(found.has('MISSING_SOURCE_LABEL'));
  assert(found.has('INVALID_SOURCE_TYPE'));
  assert(found.has('INVALID_SOURCE_URL'));
  assert(found.has('MISSING_SOURCE_PUBLICATION'));
});

test('optional generation and editorial metadata are zoned and kebab-case', () => {
  const valid = makeEdition({
    trends: [makeTrend({
      editorial_theme: 'agent-governance',
      editorial_angle: 'identity-and-access',
      editorial_repeat_reason: 'A major documented availability change warrants returning to this theme.'
    })]
  });
  assert.equal(validateEditionSchema(valid, { filename: '2026-08-25.json' }).length, 0);

  const invalid = makeEdition({
    meta: { ...valid.meta, generated_at: '2026-08-25T02:30:00' },
    trends: [makeTrend({ editorial_theme: 'Agent Governance' })]
  });
  const errors = validateEditionSchema(invalid, { filename: '2026-08-25.json' });
  assert(codes(errors).has('INVALID_META_TIMESTAMP'));
  assert(codes(errors).has('INVALID_EDITORIAL_METADATA'));
});
