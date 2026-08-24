import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNewsIndex, checkNewsIndex, serializeNewsIndex } from '../scripts/news/ledger.mjs';
import { editionItems } from '../scripts/news/identity.mjs';
import { makeBrief, makeEdition, makeSignature } from './helpers/news-fixtures.mjs';

test('ledger serialization is deterministic across edition, entry, and source order', () => {
  const first = makeEdition({
    brief: [makeBrief({
      event_id: 'deterministic-event-a',
      sources: [
        { label: 'B', type: 'official', url: 'https://example.test/b?utm_source=x', published_at: '2026-08-24T10:00:00+07:00' },
        { label: 'A', type: 'reporting', url: 'https://example.test/a?id=1', published_at: '2026-08-24T10:00:00+07:00' }
      ]
    })]
  });
  const second = makeEdition({
    edition_date: '2026-08-26',
    meta: undefined,
    brief: [makeBrief({
      event_id: 'deterministic-event-b',
      published_at: '2026-08-25T10:00:00+07:00',
      sources: [{ label: 'C', type: 'official', url: 'https://example.test/c', published_at: '2026-08-25T10:00:00+07:00' }]
    })]
  });
  const entries = [...editionItems(first), ...editionItems(second)];
  const forward = serializeNewsIndex(buildNewsIndex([first, second], entries, 3));
  const reverse = serializeNewsIndex(buildNewsIndex([second, first], [...entries].reverse(), 3));
  assert.equal(forward, reverse);
  assert(!forward.includes('generated_at'));
});

test('ledger preserves initial/current signatures and material occurrence history', () => {
  const initialSignature = makeSignature({ organization: 'acme', product: 'nova', action: 'preview', artifact: 'private-preview' });
  const currentSignature = makeSignature({ organization: 'acme', product: 'nova', action: 'general-availability', artifact: 'general-availability' });
  const firstItem = makeBrief({
    event_id: 'nova-lifecycle',
    event_signature: initialSignature,
    published_at: '2026-08-23T10:00:00+07:00',
    sources: [{ label: 'Preview', type: 'official', url: 'https://acme.test/nova?utm_source=preview', published_at: '2026-08-23T10:00:00+07:00' }]
  });
  const laterItem = {
    ...firstItem,
    event_signature: currentSignature,
    published_at: '2026-08-24T10:00:00+07:00',
    material_update: 'The product moved from private preview to documented general availability for production users.',
    update_kind: 'availability-change',
    dedupe_override_reason: 'The occurrence preserves an explicit editorial distinction for regression coverage.',
    sources: [{ label: 'GA', type: 'official', url: 'https://acme.test/nova-ga', published_at: '2026-08-24T10:00:00+07:00' }]
  };
  const entries = [
    { edition: { edition_date: '2026-08-25' }, file: 'content/2026-08-25.json', field: 'brief[0]', section: 'brief', item: laterItem, title: laterItem.title },
    { edition: { edition_date: '2026-08-24' }, file: 'content/2026-08-24.json', field: 'brief[0]', section: 'brief', item: firstItem, title: firstItem.title }
  ];
  const index = buildNewsIndex(entries.map((entry) => entry.edition), entries, 2);
  const event = index.events[0];
  assert.deepEqual(event.event_signature, initialSignature);
  assert.deepEqual(event.current_event_signature, currentSignature);
  assert.deepEqual(event.occurrences.map((entry) => entry.edition_date), ['2026-08-24', '2026-08-25']);
  assert.equal(event.occurrences[1].update_kind, 'availability-change');
  assert.equal(event.occurrences[1].dedupe_override_reason, laterItem.dedupe_override_reason);
  assert.deepEqual(event.canonical_sources, ['https://acme.test/nova', 'https://acme.test/nova-ga']);
});

test('ledger stale check is byte-stable and explicit', () => {
  const expected = '{\n  "schema_version": 3\n}\n';
  assert.equal(checkNewsIndex(expected.replaceAll('\n', '\r\n'), expected).current, true);
  const stale = checkNewsIndex('{"schema_version":2}\n', expected);
  assert.equal(stale.current, false);
  assert.match(stale.message, /npm run news:index/);
});
