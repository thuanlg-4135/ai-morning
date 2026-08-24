import { canonicalUrl } from './canonical-url.mjs';
import { eventSignature, normalizeText, signatureKey } from './identity.mjs';

function entryOrder(left, right) {
  return left.edition.edition_date.localeCompare(right.edition.edition_date) || left.field.localeCompare(right.field);
}

export function buildNewsIndex(editions, entries, sourceRegistryCount) {
  const eventMap = new Map();
  const orderedEntries = [...entries].sort(entryOrder);

  for (const entry of orderedEntries) {
    const { edition, section, item, title } = entry;
    const sourceUrls = (item.sources ?? []).map((source) => canonicalUrl(source.url)).sort();
    const signature = eventSignature(item);
    const currentSignatureKey = signatureKey(signature);
    if (!eventMap.has(item.event_id)) {
      eventMap.set(item.event_id, {
        event_id: item.event_id,
        event_signature: signature,
        signature_key: currentSignatureKey,
        current_event_signature: signature,
        current_signature_key: currentSignatureKey,
        first_published_at: item.published_at,
        first_edition: edition.edition_date,
        title,
        fingerprint: normalizeText(title),
        canonical_sources: sourceUrls,
        occurrences: []
      });
    }
    const event = eventMap.get(item.event_id);
    event.current_event_signature = signature;
    event.current_signature_key = currentSignatureKey;
    event.canonical_sources = [...new Set([...event.canonical_sources, ...sourceUrls])].sort();
    event.occurrences.push({
      edition_date: edition.edition_date,
      section,
      published_at: item.published_at,
      event_signature: signature,
      signature_key: currentSignatureKey,
      material_update: item.material_update ?? null,
      update_kind: item.update_kind ?? null,
      dedupe_override_reason: item.dedupe_override_reason ?? null
    });
  }

  const dates = editions.map((edition) => edition.edition_date).sort();
  return {
    schema_version: 3,
    generated_from: {
      first_edition: dates[0],
      last_edition: dates.at(-1),
      edition_count: editions.length,
      source_registry_count: sourceRegistryCount
    },
    events: [...eventMap.values()].sort((left, right) =>
      left.first_edition.localeCompare(right.first_edition) || left.event_id.localeCompare(right.event_id)
    )
  };
}

export function serializeNewsIndex(index) {
  return JSON.stringify(index, null, 2) + '\n';
}

export function checkNewsIndex(actual, expected) {
  const normalizeLines = (value) => String(value).replace(/\r\n?/g, '\n');
  return {
    current: normalizeLines(actual) === normalizeLines(expected),
    message: normalizeLines(actual) === normalizeLines(expected)
      ? 'data/news-index.json is current.'
      : 'data/news-index.json is stale. Run npm run news:index and commit the result.'
  };
}
