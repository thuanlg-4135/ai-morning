import { canonicalUrl } from './canonical-url.mjs';
import { detectEditorialFatigue, findRecentDuplicateCandidates, validateExactIdentities } from './dedupe.mjs';
import { issue } from './diagnostics.mjs';
import { editionItems, meaningfulReason } from './identity.mjs';
import { validateMaterialUpdateHistory } from './material-update.mjs';
import { UPDATE_KIND_VALUES, validateEditionSchema } from './schema.mjs';
import { resolveEditionWindow, validateEditionWindowMetadata, validatePublication } from './time.mjs';
import { hasText, wordCount } from './utils.mjs';

function publicationCode(message) {
  if (message.includes('at or after')) return 'PUBLICATION_AT_OR_AFTER_CUTOFF';
  if (message.includes('outside')) return 'PUBLICATION_OUTSIDE_FRESHNESS_WINDOW';
  if (message.includes('later than')) return 'FUTURE_PUBLICATION_DATE';
  if (message.includes('date-only on the edition date')) return 'AMBIGUOUS_EDITION_DAY_PUBLICATION';
  return 'INVALID_PUBLICATION_TIMESTAMP';
}

function depthDiagnostics(entry) {
  const errors = [];
  const warnings = [];
  const words = wordCount(entry.body);
  const addError = (code, message, required) => errors.push(issue('error', code, entry, message, { required }));
  const addWarning = (code, message) => warnings.push(issue('warning', code, entry, message));

  if (wordCount(entry.title) < 2 || String(entry.title).trim().length < 8) {
    addError('TINY_TITLE', 'The item title is too small to identify a concrete change.', 'Write a meaningful, specific title.');
  }

  if (entry.section === 'brief') {
    if (words < 12) {
      addError('TINY_BRIEF', 'The brief has only ' + words + ' words and is an unexplained fragment.', 'Add a concise explanation of the verified change and why it matters.');
    } else if (words < 25) {
      addWarning('SHORT_BRIEF', 'The brief is unusually short at ' + words + ' words; verify that the impact is clear.');
    } else if (words > 140) {
      addWarning('LONG_BRIEF', 'The brief is unusually long at ' + words + ' words; consider promoting or tightening it.');
    }
  }

  if (entry.section === 'trends') {
    if (!Array.isArray(entry.item.paragraphs) || entry.item.paragraphs.length < 2) {
      addError('TREND_MISSING_STRUCTURE', 'A developed trend needs at least two distinct paragraphs.', 'Separate the verified change from its impact and practical implication.');
    }
    if (!hasText(entry.item.action)) {
      addError('TREND_MISSING_ACTION', 'A developed trend has no practical developer implication.', 'Add a concise action field grounded in the evidence.');
    }
    if (words < 40) {
      addError('TINY_TREND', 'The developed trend is an obvious fragment at ' + words + ' words.', 'Explain the verified change, why it matters, and the developer implication.');
    } else if (words < 140) {
      addWarning('SHORT_TREND', 'The developed trend is unusually short at ' + words + ' words; check its evidence and practical depth.');
    } else if (words > 700) {
      addWarning('LONG_TREND', 'The developed trend is unusually long at ' + words + ' words; consider tighter editing.');
    }
  }

  if (entry.section === 'releases') {
    if (words < 20) {
      addError('TINY_RELEASE', 'The release note is an obvious fragment at ' + words + ' words.', 'Explain the change, affected users, and practical verdict.');
    } else if (words < 60) {
      addWarning('SHORT_RELEASE', 'The release note is unusually short at ' + words + ' words; verify that the impact and verdict are useful.');
    } else if (words > 350) {
      addWarning('LONG_RELEASE', 'The release note is unusually long at ' + words + ' words; consider tighter editing.');
    }
  }

  if (entry.section === 'radar' && words < 8) {
    addError('TINY_RADAR', 'The radar item is not a meaningful sentence (' + words + ' words).', 'State the signal and why it is worth watching.');
  }
  return { errors, warnings };
}

function validateEntry(entry, effectiveCutoff) {
  const errors = [];
  const warnings = [];

  for (const field of ['material_update', 'dedupe_override_reason']) {
    if (entry.item[field] !== undefined && !meaningfulReason(entry.item[field])) {
      errors.push(issue(
        'error',
        'UNMEANINGFUL_' + field.toUpperCase(),
        entry,
        field + ' must explain the concrete distinction in at least 8 words and 40 characters.'
      ));
    }
  }
  if (entry.item.material_update !== undefined && !UPDATE_KIND_VALUES.has(entry.item.update_kind)) {
    errors.push(issue(
      'error',
      'MISSING_UPDATE_KIND',
      entry,
      'material_update requires a valid update_kind.',
      { required: 'Classify the concrete change with one documented update kind.' }
    ));
  }
  if (entry.item.update_kind !== undefined && entry.item.material_update === undefined) {
    errors.push(issue('error', 'ORPHAN_UPDATE_KIND', entry, 'update_kind is only valid when material_update is present.'));
  }

  for (const message of validatePublication(
    entry.item.published_at,
    entry.item.freshness,
    entry.edition.edition_date,
    effectiveCutoff,
    entry.field + '.published_at'
  )) {
    errors.push(issue('error', publicationCode(message), entry, message));
  }

  const seenSources = new Set();
  entry.item.sources.forEach((source, sourceIndex) => {
    const sourceField = entry.field + '.sources[' + sourceIndex + ']';
    try {
      const canonical = canonicalUrl(source.url);
      if (seenSources.has(canonical)) {
        errors.push(issue('error', 'DUPLICATE_EVENT_SOURCE', { ...entry, field: sourceField }, 'This event repeats the same canonical source URL.'));
      }
      seenSources.add(canonical);
    } catch {
      // The shared schema reports malformed URLs.
    }
    for (const message of validatePublication(
      source.published_at,
      entry.item.freshness,
      entry.edition.edition_date,
      effectiveCutoff,
      sourceField + '.published_at'
    )) {
      errors.push(issue('error', publicationCode(message), { ...entry, field: sourceField }, message));
    }
  });

  const depth = depthDiagnostics(entry);
  errors.push(...depth.errors);
  warnings.push(...depth.warnings);
  return { errors, warnings };
}

export function validateNewsQuality(editions, { runAt = new Date(), filenames = [] } = {}) {
  const schemaErrors = editions.flatMap((edition, index) => validateEditionSchema(edition, {
    filename: filenames[index] ?? (hasText(edition?.edition_date) ? edition.edition_date + '.json' : 'unknown.json')
  }));
  const initialStats = {
    editionsChecked: editions.length,
    eventsIndexed: 0,
    occurrences: 0,
    hardErrors: schemaErrors.length,
    editorialWarnings: 0,
    duplicateCandidatesBlocked: 0,
    recentPairComparisons: 0
  };
  if (schemaErrors.length > 0) {
    return { ok: false, entries: [], errors: schemaErrors, warnings: [], stats: initialStats };
  }

  const entries = editions.flatMap(editionItems);
  const errors = [];
  const warnings = [];
  const windows = new Map();
  for (const edition of editions) {
    const metadata = validateEditionWindowMetadata(edition, { runAt });
    windows.set(edition.edition_date, resolveEditionWindow(edition, { runAt }));
    errors.push(...metadata.errors);
  }
  for (const entry of entries) {
    const effectiveCutoff = windows.get(entry.edition.edition_date).effectiveCutoff;
    const result = validateEntry(entry, effectiveCutoff);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  const exactIdentityErrors = validateExactIdentities(entries);
  const materialErrors = validateMaterialUpdateHistory(entries);
  const recentDuplicates = findRecentDuplicateCandidates(entries);
  errors.push(...exactIdentityErrors, ...materialErrors, ...recentDuplicates.errors);
  warnings.push(...detectEditorialFatigue(editions));

  const duplicateCodes = new Set([
    'DUPLICATE_EVENT_HOME',
    'SIGNATURE_REUSED_BY_DIFFERENT_EVENTS',
    'CANONICAL_SOURCE_REUSED',
    'POSSIBLE_SEMANTIC_DUPLICATE',
    'POSSIBLE_TITLE_DUPLICATE'
  ]);
  const stats = {
    editionsChecked: editions.length,
    eventsIndexed: new Set(entries.map((entry) => entry.item.event_id)).size,
    occurrences: entries.length,
    hardErrors: errors.length,
    editorialWarnings: warnings.length,
    duplicateCandidatesBlocked: errors.filter((error) => duplicateCodes.has(error.code)).length,
    recentPairComparisons: recentDuplicates.comparisonCount
  };
  return { ok: errors.length === 0, entries, errors, warnings, stats };
}
