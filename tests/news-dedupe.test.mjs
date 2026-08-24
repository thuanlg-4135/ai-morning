import assert from 'node:assert/strict';
import test from 'node:test';
import { findRecentDuplicateCandidates, validateExactIdentities } from '../scripts/news/dedupe.mjs';
import { editionItems } from '../scripts/news/identity.mjs';
import { makeBrief, makeEdition, makeSignature, makeTrend } from './helpers/news-fixtures.mjs';

const codes = (issues) => new Set(issues.map((entry) => entry.code));

test('same event_id is blocked twice in one section and across primary sections', () => {
  const repeated = makeBrief({ event_id: 'one-real-event' });
  const sameSection = editionItems(makeEdition({ brief: [repeated, { ...repeated }] }));
  assert(codes(validateExactIdentities(sameSection)).has('DUPLICATE_EVENT_HOME'));

  const acrossSections = editionItems(makeEdition({
    brief: [repeated],
    trends: [makeTrend({ event_id: 'one-real-event', event_signature: repeated.event_signature })]
  }));
  assert(codes(validateExactIdentities(acrossSections)).has('DUPLICATE_EVENT_HOME'));
});

test('same exact event signature under different IDs is blocked', () => {
  const signature = makeSignature({ product: 'nova', artifact: 'durable-memory' });
  const entries = editionItems(makeEdition({ brief: [
    makeBrief({ event_id: 'nova-memory-a', event_signature: signature }),
    makeBrief({ event_id: 'nova-memory-b', event_signature: signature })
  ] }));
  assert(codes(validateExactIdentities(entries)).has('SIGNATURE_REUSED_BY_DIFFERENT_EVENTS'));
});

test('tracking variants of one canonical source cannot support different IDs', () => {
  const first = makeBrief({
    event_id: 'source-event-a',
    sources: [{ ...makeBrief().sources[0], url: 'https://example.test/post?id=7&utm_source=a' }]
  });
  const second = makeBrief({
    event_id: 'source-event-b',
    sources: [{ ...makeBrief().sources[0], url: 'https://example.test/post?utm_medium=email&id=7' }]
  });
  const errors = validateExactIdentities(editionItems(makeEdition({ brief: [first, second] })));
  assert(codes(errors).has('CANONICAL_SOURCE_REUSED'));
});

test('normalized paraphrases of the same semantic event are blocked', () => {
  const left = makeBrief({
    event_id: 'acme-nova-context-preview-a',
    title: 'Acme Nova presents persistent state retention',
    event_signature: makeSignature({ organization: 'acme', product: 'nova', action: 'launch', artifact: 'long-term-state' })
  });
  const right = makeBrief({
    event_id: 'nova-runtime-state-release-b',
    title: 'Persistent state reaches production coding environments',
    event_signature: makeSignature({ organization: 'acme-inc', product: 'nova-runtime', action: 'release', artifact: 'persistent-state' })
  });
  const result = findRecentDuplicateCandidates(editionItems(makeEdition({ brief: [left, right] })));
  assert(codes(result.errors).has('POSSIBLE_SEMANTIC_DUPLICATE'));
});

test('similar products with genuinely different artifacts remain separate', () => {
  const entries = editionItems(makeEdition({ brief: [
    makeBrief({
      event_id: 'nova-encrypted-backups',
      title: 'Acme Nova adds encrypted backup retention controls',
      event_signature: makeSignature({ organization: 'acme', product: 'nova', artifact: 'encrypted-backups' })
    }),
    makeBrief({
      event_id: 'nova-firewall-rules',
      title: 'Acme Nova adds granular network firewall rules',
      event_signature: makeSignature({ organization: 'acme', product: 'nova', artifact: 'firewall-rules' })
    })
  ] }));
  assert.equal(findRecentDuplicateCandidates(entries).errors.length, 0);
});

test('similar wording for different products does not become a semantic duplicate', () => {
  const entries = editionItems(makeEdition({ brief: [
    makeBrief({
      event_id: 'alpha-cache-control',
      title: 'Alpha compiler adds encrypted cache retention controls',
      event_signature: makeSignature({ organization: 'alpha', product: 'compiler', artifact: 'cache-retention' })
    }),
    makeBrief({
      event_id: 'beta-snapshot-control',
      title: 'Beta database adds encrypted snapshot recovery controls',
      event_signature: makeSignature({ organization: 'beta', product: 'database', artifact: 'snapshot-recovery' })
    })
  ] }));
  assert.equal(findRecentDuplicateCandidates(entries).errors.length, 0);
});

test('a concrete dedupe override permits a deliberate near match', () => {
  const reason = 'This is a separately versioned artifact with an independently scoped release record.';
  const entries = editionItems(makeEdition({ brief: [
    makeBrief({ event_id: 'near-match-a', title: 'Acme Nova introduces secure workload identity controls' }),
    makeBrief({
      event_id: 'near-match-b',
      title: 'Acme Nova introduces secure workload identity controls today',
      dedupe_override_reason: reason,
      event_signature: makeSignature({ organization: 'otherco', product: 'comet', action: 'research', artifact: 'separate-study' })
    })
  ] }));
  assert.equal(findRecentDuplicateCandidates(entries).errors.length, 0);
});

test('recent duplicate comparison is bounded to a 14-day window over multi-year history', () => {
  const count = 1_825;
  const start = Date.UTC(2020, 0, 1);
  const entries = Array.from({ length: count }, (_, index) => {
    const date = new Date(start + index * 86_400_000).toISOString().slice(0, 10);
    return {
      edition: { edition_date: date },
      file: 'content/' + date + '.json',
      field: 'brief[0]',
      title: 'Unique artifact ' + index,
      item: {
        event_id: 'event-' + index,
        published_at: date,
        event_signature: makeSignature({ product: 'product-' + index, artifact: 'artifact-' + index })
      }
    };
  });
  const result = findRecentDuplicateCandidates(entries);
  assert.equal(result.comparisonCount, 14 * count - 105);
  assert(result.comparisonCount < count * count / 50);
});
