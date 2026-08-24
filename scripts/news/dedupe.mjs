import { canonicalUrl } from './canonical-url.mjs';
import { issue } from './diagnostics.mjs';
import {
  actionFamily,
  artifactSimilarity,
  componentsRelated,
  eventSignature,
  meaningfulReason,
  signatureKey,
  titleSimilarity,
  topicalSimilarity
} from './identity.mjs';
import { calendarDate, dateDifference } from './time.mjs';
import { hasText } from './utils.mjs';

function firstSource(entry) {
  const source = entry.item.sources?.[0];
  if (!source?.url) return null;
  try {
    return canonicalUrl(source.url);
  } catch {
    return source.url;
  }
}

export function validateExactIdentities(entries) {
  const errors = [];
  const occurrencesByEvent = new Map();
  const occurrencesByUrl = new Map();
  const occurrencesBySignature = new Map();

  for (const entry of entries) {
    const eventId = entry.item.event_id;
    if (hasText(eventId)) {
      if (!occurrencesByEvent.has(eventId)) occurrencesByEvent.set(eventId, []);
      occurrencesByEvent.get(eventId).push(entry);
    }
    const signature = eventSignature(entry.item);
    if (signature) {
      const key = signatureKey(signature);
      if (!occurrencesBySignature.has(key)) occurrencesBySignature.set(key, []);
      occurrencesBySignature.get(key).push(entry);
    }
    for (const source of entry.item.sources ?? []) {
      try {
        const url = canonicalUrl(source.url);
        if (!occurrencesByUrl.has(url)) occurrencesByUrl.set(url, []);
        occurrencesByUrl.get(url).push(entry);
      } catch {
        // Structural URL errors are reported by the shared schema validator.
      }
    }
  }

  for (const [eventId, occurrences] of occurrencesByEvent) {
    const byEdition = new Map();
    for (const occurrence of occurrences) {
      const date = occurrence.edition.edition_date;
      if (!byEdition.has(date)) byEdition.set(date, []);
      byEdition.get(date).push(occurrence);
    }
    for (const sameDay of byEdition.values()) {
      if (sameDay.length < 2) continue;
      const current = sameDay[1];
      const previous = sameDay[0];
      errors.push(issue(
        'error',
        'DUPLICATE_EVENT_HOME',
        current,
        'event_id "' + eventId + '" appears ' + sameDay.length + ' times in the same edition: ' + sameDay.map((entry) => entry.field).join(', ') + '.',
        {
          details: [
            ...(firstSource(previous) ? ['Previous source: ' + firstSource(previous)] : []),
            ...(firstSource(current) ? ['Current source: ' + firstSource(current)] : [])
          ],
          required: 'Choose one primary section for the event.'
        }
      ));
    }
  }

  for (const [key, occurrences] of occurrencesBySignature) {
    const eventIds = new Set(occurrences.map((entry) => entry.item.event_id).filter(hasText));
    if (eventIds.size < 2) continue;
    const current = occurrences.find((entry) => entry.item.event_id !== occurrences[0].item.event_id) ?? occurrences[1];
    errors.push(issue(
      'error',
      'SIGNATURE_REUSED_BY_DIFFERENT_EVENTS',
      current,
      'event_signature "' + key + '" maps to multiple event IDs: ' + [...eventIds].join(', ') + '.',
      { required: 'Reuse one event_id for one real-world event.' }
    ));
  }

  for (const [url, occurrences] of occurrencesByUrl) {
    const distinct = new Map();
    for (const entry of occurrences) if (!distinct.has(entry.item.event_id)) distinct.set(entry.item.event_id, entry);
    const candidates = [...distinct.values()];
    if (candidates.length < 2 || candidates.slice(1).every((entry) => meaningfulReason(entry.item.dedupe_override_reason))) continue;
    const current = candidates.find((entry, index) => index > 0 && !meaningfulReason(entry.item.dedupe_override_reason)) ?? candidates[1];
    errors.push(issue(
      'error',
      'CANONICAL_SOURCE_REUSED',
      current,
      'One canonical source supports multiple event IDs: ' + candidates.map((entry) => entry.item.event_id).join(', ') + '.',
      {
        details: ['Canonical source: ' + url],
        required: 'Merge the events or add a concrete dedupe_override_reason for a genuinely separate artifact.'
      }
    ));
  }
  return errors;
}

export function findRecentDuplicateCandidates(entries, { maxDays = 14 } = {}) {
  const errors = [];
  let comparisonCount = 0;
  const sorted = [...entries].sort((left, right) =>
    left.edition.edition_date.localeCompare(right.edition.edition_date) || left.field.localeCompare(right.field)
  );

  for (let leftIndex = 0; leftIndex < sorted.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sorted.length; rightIndex += 1) {
      const left = sorted[leftIndex];
      const right = sorted[rightIndex];
      const dayGap = dateDifference(right.edition.edition_date, left.edition.edition_date);
      if (dayGap > maxDays) break;
      comparisonCount += 1;
      if (left.item.event_id === right.item.event_id) continue;

      const match = titleSimilarity(left.title, right.title);
      const leftSignature = eventSignature(left.item);
      const rightSignature = eventSignature(right.item);
      let semanticDuplicate = false;
      if (
        dayGap <= 3 &&
        leftSignature &&
        rightSignature &&
        signatureKey(leftSignature) !== signatureKey(rightSignature)
      ) {
        const leftEventDate = calendarDate(left.item.published_at) ?? left.edition.edition_date;
        const rightEventDate = calendarDate(right.item.published_at) ?? right.edition.edition_date;
        const publicationDayGap = Math.abs(dateDifference(rightEventDate, leftEventDate));
        const sameOrganization = componentsRelated(leftSignature.organization, rightSignature.organization, 'organization');
        const sameProduct = componentsRelated(leftSignature.product, rightSignature.product, 'product');
        const sameAction = actionFamily(leftSignature.action) === actionFamily(rightSignature.action);
        const artifactMatch = artifactSimilarity(leftSignature.artifact, rightSignature.artifact);
        const topicalMatch = topicalSimilarity(left.title, leftSignature, right.title, rightSignature);
        semanticDuplicate = sameOrganization && sameProduct && sameAction && (
          artifactMatch.strong ||
          (publicationDayGap <= 1 && artifactMatch.weak && topicalMatch.score >= 0.25 && topicalMatch.shared >= 2) ||
          (publicationDayGap <= 1 && topicalMatch.score >= 0.55 && topicalMatch.shared >= 3)
        );
        if (semanticDuplicate && !meaningfulReason(right.item.dedupe_override_reason)) {
          errors.push(issue(
            'error',
            'POSSIBLE_SEMANTIC_DUPLICATE',
            right,
            'This event may duplicate "' + left.item.event_id + '" after normalized organization/product/action comparison.',
            {
              details: [
                'Previous: ' + left.file + ' ' + left.field + ' — ' + left.title,
                'Current: ' + right.file + ' ' + right.field + ' — ' + right.title
              ],
              required: 'Merge them or add a concrete dedupe_override_reason.'
            }
          ));
        }
      }

      if (semanticDuplicate) continue;
      if (match.score >= 0.68 && match.shared >= 4 && !meaningfulReason(right.item.dedupe_override_reason)) {
        errors.push(issue(
          'error',
          'POSSIBLE_TITLE_DUPLICATE',
          right,
          'The headline is highly similar to event_id "' + left.item.event_id + '" (score ' + match.score.toFixed(2) + ').',
          {
            details: ['Previous: ' + left.title, 'Current: ' + right.title],
            required: 'Merge them or document the concrete distinction with dedupe_override_reason.'
          }
        ));
      }
    }
  }

  return { errors, comparisonCount };
}

function leadTrend(edition) {
  if (!Array.isArray(edition.trends) || edition.trends.length === 0) return null;
  return edition.trends.find((trend) => trend.importance === 'LEAD') ?? edition.trends[0];
}

export function detectEditorialFatigue(editions) {
  const warnings = [];
  const ordered = [...editions].sort((left, right) => left.edition_date.localeCompare(right.edition_date));
  for (let index = 0; index < ordered.length; index += 1) {
    const edition = ordered[index];
    const lead = leadTrend(edition);
    if (!hasText(lead?.editorial_theme)) continue;
    const recent = ordered.slice(Math.max(0, index - 3), index)
      .map((priorEdition) => ({ edition: priorEdition, lead: leadTrend(priorEdition) }))
      .filter(({ lead: priorLead }) => priorLead);
    const sameTheme = recent.filter(({ lead: priorLead }) => priorLead.editorial_theme === lead.editorial_theme);
    const sameAngle = hasText(lead.editorial_angle)
      ? sameTheme.filter(({ lead: priorLead }) => priorLead.editorial_angle === lead.editorial_angle)
      : [];
    const entry = {
      edition,
      item: lead,
      file: 'content/' + edition.edition_date + '.json',
      field: 'trends[' + edition.trends.indexOf(lead) + ']'
    };
    const repeatDetail = hasText(lead.editorial_repeat_reason)
      ? ['Editorial repeat reason: ' + lead.editorial_repeat_reason]
      : [];

    if (sameAngle.length > 0) {
      warnings.push(issue(
        'warning',
        'EDITORIAL_THEME_ANGLE_FATIGUE',
        entry,
        'STRONG EDITORIAL WARNING: lead theme "' + lead.editorial_theme + '" and angle "' + lead.editorial_angle + '" already appeared as a lead within 3 editions.',
        {
          details: [
            'Recent matching edition(s): ' + sameAngle.map(({ edition: prior }) => prior.edition_date).join(', '),
            ...repeatDetail
          ],
          required: 'Consider a different angle or lead if today\'s evidence allows it.'
        }
      ));
    } else if (recent.length === 3 && sameTheme.length === 3) {
      warnings.push(issue(
        'warning',
        'EDITORIAL_THEME_FATIGUE',
        entry,
        'EDITORIAL WARNING: lead theme "' + lead.editorial_theme + '" appeared in all 3 recent editions.',
        {
          details: repeatDetail,
          required: 'Consider a different angle or a different lead if today\'s evidence allows it.'
        }
      ));
    }
  }
  return warnings;
}
