import { issue } from './diagnostics.mjs';
import {
  componentsRelated,
  eventSignature,
  meaningfulReason,
  signatureKey,
  sourceEvidence,
  updateSignatureIsConsistent
} from './identity.mjs';
import { publicationIsNewer } from './time.mjs';
import { hasText } from './utils.mjs';

function previousSourceDetails(entry) {
  const source = sourceEvidence(entry.item)[0];
  return source ? ['Previous source: ' + source.url] : [];
}

export function validateMaterialUpdateHistory(entries) {
  const errors = [];
  const occurrencesByEvent = new Map();
  for (const entry of entries) {
    const eventId = entry.item.event_id;
    if (!hasText(eventId)) continue;
    if (!occurrencesByEvent.has(eventId)) occurrencesByEvent.set(eventId, []);
    occurrencesByEvent.get(eventId).push(entry);
  }

  for (const [eventId, occurrences] of occurrencesByEvent) {
    const ordered = [...occurrences].sort((left, right) =>
      left.edition.edition_date.localeCompare(right.edition.edition_date) || left.field.localeCompare(right.field)
    );
    const history = ordered.filter((entry, index) =>
      index === 0 || entry.edition.edition_date !== ordered[index - 1].edition.edition_date
    );
    if (history.length < 2) continue;

    const accumulatedSourceEvidence = new Map();
    for (const source of sourceEvidence(history[0].item)) {
      accumulatedSourceEvidence.set(source.url, [source.published_at]);
    }

    for (let index = 1; index < history.length; index += 1) {
      const previous = history[index - 1];
      const laterEntry = history[index];
      const later = laterEntry.item;
      const laterSources = sourceEvidence(later);
      const details = [
        ...previousSourceDetails(previous),
        ...(laterSources[0] ? ['Current source: ' + laterSources[0].url] : [])
      ];

      if (!meaningfulReason(later.material_update)) {
        errors.push(issue(
          'error',
          'RETURN_WITHOUT_MATERIAL_UPDATE',
          laterEntry,
          'This event already appeared in ' + previous.file + ' and has no valid material_update.',
          {
            details,
            required: 'Reuse the event only with a concrete material delta and structural evidence.'
          }
        ));
      }

      const hasNewSource = laterSources.some((source) => !accumulatedSourceEvidence.has(source.url));
      const previousSourceHosts = new Set([...accumulatedSourceEvidence.keys()].map((url) => new URL(url).hostname));
      const hasIndependentSource = laterSources.some((source) =>
        !accumulatedSourceEvidence.has(source.url) &&
        ['reporting', 'research'].includes(source.type) &&
        !previousSourceHosts.has(new URL(source.url).hostname) &&
        publicationIsNewer(source.published_at, previous.item.published_at)
      );
      const hasNewerSourcePublication = laterSources.some((source) => {
        const previousPublications = accumulatedSourceEvidence.get(source.url);
        return previousPublications?.length > 0 && previousPublications.every((publishedAt) =>
          publicationIsNewer(source.published_at, publishedAt)
        );
      });
      const hasSourceBackedNewerPublication =
        publicationIsNewer(later.published_at, previous.item.published_at) && hasNewerSourcePublication;

      if (!hasNewSource && !hasSourceBackedNewerPublication) {
        errors.push(issue(
          'error',
          'MATERIAL_UPDATE_WITHOUT_EVIDENCE',
          laterEntry,
          'The claimed material update adds no genuinely new canonical source and no source-backed newer publication.',
          {
            details,
            required: 'Add structural evidence, or remove the repeated event from this edition.'
          }
        ));
      }

      if (later.update_kind === 'independent-confirmation' && !hasIndependentSource) {
        errors.push(issue(
          'error',
          'INVALID_INDEPENDENT_CONFIRMATION',
          laterEntry,
          'independent-confirmation requires a newer reporting/research source from a previously unseen publisher host.',
          { details, required: 'Use genuinely independent and chronologically newer evidence.' }
        ));
      }

      const previousSignature = eventSignature(previous.item);
      const laterSignature = eventSignature(later);
      if (previousSignature && laterSignature && signatureKey(previousSignature) !== signatureKey(laterSignature)) {
        if (
          !componentsRelated(previousSignature.organization, laterSignature.organization, 'organization') ||
          !componentsRelated(previousSignature.product, laterSignature.product, 'product')
        ) {
          errors.push(issue(
            'error',
            'EVENT_IDENTITY_DRIFT',
            laterEntry,
            'The organization or product identity changed across editions for event_id "' + eventId + '".',
            { required: 'Use a new event_id for a different real-world event.' }
          ));
        }
      }
      if (
        previousSignature &&
        laterSignature &&
        !updateSignatureIsConsistent(later.update_kind, previousSignature, laterSignature)
      ) {
        errors.push(issue(
          'error',
          'INCONSISTENT_UPDATE_SIGNATURE',
          laterEntry,
          'update_kind "' + later.update_kind + '" has no matching semantic event_signature delta.',
          { required: 'Describe the changed status, availability, version, price, scope, or incident state in the signature.' }
        ));
      }

      for (const source of laterSources) {
        if (!accumulatedSourceEvidence.has(source.url)) accumulatedSourceEvidence.set(source.url, []);
        accumulatedSourceEvidence.get(source.url).push(source.published_at);
      }
    }
  }
  return errors;
}
