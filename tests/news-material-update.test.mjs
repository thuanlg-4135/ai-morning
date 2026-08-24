import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMaterialUpdateHistory } from '../scripts/news/material-update.mjs';
import { validateNewsQuality } from '../scripts/news/validate.mjs';
import { issueCodes, makeBrief, makeEdition, makeSignature } from './helpers/news-fixtures.mjs';

const concreteUpdate = 'The newly published evidence changes the documented production state for affected engineering teams.';

function source(url, publishedAt, type = 'official') {
  return { label: 'Synthetic evidence', url, type, published_at: publishedAt };
}

function occurrence(date, item) {
  return {
    edition: { edition_date: date },
    file: 'content/' + date + '.json',
    field: 'brief[0]',
    section: 'brief',
    index: 0,
    item,
    title: item.title,
    body: item.text
  };
}

function history(previous, later) {
  return validateMaterialUpdateHistory([
    occurrence('2026-08-24', previous),
    occurrence('2026-08-25', later)
  ]);
}

function evolvingEvent(overrides = {}) {
  return makeBrief({
    event_id: 'acme-nova-lifecycle',
    title: 'Acme changes the Nova production lifecycle',
    published_at: '2026-08-23T10:00:00+07:00',
    event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'preview', artifact: 'private-preview' }),
    sources: [source('https://acme.test/nova-preview', '2026-08-23T10:00:00+07:00')],
    ...overrides
  });
}

function laterOccurrence(previous, overrides = {}) {
  return {
    ...previous,
    published_at: '2026-08-24T10:00:00+07:00',
    material_update: concreteUpdate,
    update_kind: 'availability-change',
    sources: [source('https://acme.test/nova-ga', '2026-08-24T10:00:00+07:00')],
    ...overrides
  };
}

test('preview to general availability is a valid material update', () => {
  const previous = evolvingEvent();
  const later = laterOccurrence(previous, {
    event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'general-availability', artifact: 'general-availability' })
  });
  assert.deepEqual(history(previous, later), []);
});

test('pricing, region scope, and version deltas require matching signatures', () => {
  const pricing = evolvingEvent({ event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'release', artifact: 'commercial-price-v1' }) });
  assert.deepEqual(history(pricing, laterOccurrence(pricing, {
    update_kind: 'pricing-change',
    event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'pricing', artifact: 'usage-price-v2' })
  })), []);

  const region = evolvingEvent({ event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'release', artifact: 'us-region' }) });
  assert.deepEqual(history(region, laterOccurrence(region, {
    update_kind: 'scope-change',
    event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'release', artifact: 'eu-region' })
  })), []);

  const version = evolvingEvent({ event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'version-update', artifact: 'version-one' }) });
  assert.deepEqual(history(version, laterOccurrence(version, {
    update_kind: 'version-change',
    event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'version-update', artifact: 'version-two' })
  })), []);
});

test('vendor correction can use new structural evidence without identity drift', () => {
  const previous = evolvingEvent();
  const later = laterOccurrence(previous, {
    update_kind: 'correction',
    event_signature: previous.event_signature,
    sources: [source('https://acme.test/nova-correction', '2026-08-24T10:00:00+07:00')]
  });
  assert.deepEqual(history(previous, later), []);
});

test('incident to incident resolution requires a resolution signature', () => {
  const previous = evolvingEvent({
    event_signature: makeSignature({ organization: 'acme', product: 'nova-api', action: 'incident', artifact: 'regional-outage' })
  });
  const later = laterOccurrence(previous, {
    update_kind: 'incident-resolution',
    event_signature: makeSignature({ organization: 'acme', product: 'nova-api', action: 'incident-resolution', artifact: 'regional-recovery' })
  });
  assert.deepEqual(history(previous, later), []);
});

test('same article rewrite, unchanged evidence, and tracking-only variants are rejected', () => {
  const previous = evolvingEvent({ sources: [source('https://acme.test/nova?id=7&utm_source=first', '2026-08-23T10:00:00+07:00')] });
  const unchanged = laterOccurrence(previous, {
    update_kind: 'other-material-change',
    event_signature: previous.event_signature,
    sources: [source('https://acme.test/nova?id=7&utm_medium=email', '2026-08-23T10:00:00+07:00')]
  });
  const errors = history(previous, unchanged);
  assert(new Set(errors.map((entry) => entry.code)).has('MATERIAL_UPDATE_WITHOUT_EVIDENCE'));
});

test('fake material-update prose cannot replace structural evidence', () => {
  const previous = evolvingEvent();
  const later = laterOccurrence(previous, {
    update_kind: 'other-material-change',
    event_signature: previous.event_signature,
    sources: previous.sources.map((item) => ({ ...item }))
  });
  assert(new Set(history(previous, later).map((entry) => entry.code)).has('MATERIAL_UPDATE_WITHOUT_EVIDENCE'));
});

test('independent confirmation rejects same publisher and older publishers', () => {
  const previous = evolvingEvent();
  const samePublisher = laterOccurrence(previous, {
    update_kind: 'independent-confirmation',
    event_signature: previous.event_signature,
    sources: [source('https://acme.test/new-article', '2026-08-24T10:00:00+07:00', 'reporting')]
  });
  assert(new Set(history(previous, samePublisher).map((entry) => entry.code)).has('INVALID_INDEPENDENT_CONFIRMATION'));

  const olderPublisher = laterOccurrence(previous, {
    update_kind: 'independent-confirmation',
    event_signature: previous.event_signature,
    sources: [source('https://independent.test/older-report', '2026-08-22T10:00:00+07:00', 'reporting')]
  });
  assert(new Set(history(previous, olderPublisher).map((entry) => entry.code)).has('INVALID_INDEPENDENT_CONFIRMATION'));
});

test('a newer independent publisher is valid confirmation', () => {
  const previous = evolvingEvent();
  const later = laterOccurrence(previous, {
    update_kind: 'independent-confirmation',
    event_signature: previous.event_signature,
    sources: [source('https://independent.test/newer-report', '2026-08-24T10:00:00+07:00', 'reporting')]
  });
  assert.deepEqual(history(previous, later), []);
});

test('organization or product drift under one event_id remains a hard error', () => {
  const previous = evolvingEvent();
  const later = laterOccurrence(previous, {
    event_signature: makeSignature({ organization: 'different-company', product: 'different-product', action: 'general-availability', artifact: 'general-availability' })
  });
  assert(new Set(history(previous, later).map((entry) => entry.code)).has('EVENT_IDENTITY_DRIFT'));
});

test('material_update classification is enforced before cross-edition history', () => {
  const report = validateNewsQuality([makeEdition({
    brief: [makeBrief({ material_update: concreteUpdate })]
  })], { runAt: '2026-08-25T08:00:00+07:00' });
  assert(issueCodes(report).has('MISSING_UPDATE_KIND'));

  const orphan = validateNewsQuality([makeEdition({
    brief: [makeBrief({ update_kind: 'correction' })]
  })], { runAt: '2026-08-25T08:00:00+07:00' });
  assert(issueCodes(orphan).has('ORPHAN_UPDATE_KIND'));
});
