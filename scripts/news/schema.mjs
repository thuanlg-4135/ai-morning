import path from 'node:path';
import { FRESHNESS_HOURS } from './time.mjs';
import { STABLE_IDENTIFIER, hasText, isCalendarDate, isHttpUrl, isRecord, isZonedTimestamp } from './utils.mjs';

export const SECTION_NAMES = Object.freeze(['brief', 'trends', 'releases', 'radar']);
export const FRESHNESS_VALUES = new Set(Object.keys(FRESHNESS_HOURS));
export const VERDICT_VALUES = new Set(['TRY_NOW', 'WATCH', 'SKIP_FOR_NOW']);
export const SOURCE_TYPES = new Set(['official', 'research', 'reporting']);
export const RADAR_STATUSES = new Set(['CONFIRMED', 'WATCH', 'LIKELY', 'SPECULATION']);
export const EDITION_MODES = new Set(['BIG', 'NORMAL', 'QUIET']);
export const IMPORTANCE_VALUES = new Set(['LEAD', 'SECONDARY', 'BRIEF']);
export const TREND_STRENGTH_VALUES = new Set(['EARLY_SIGNAL', 'EMERGING', 'ACCELERATING', 'ESTABLISHED']);
export const VISUAL_KINDS = new Set(['editorial', 'image', 'screenshot', 'chart', 'diagram', 'stat']);
export const EVENT_ACTION_VALUES = new Set([
  'release', 'launch', 'general-availability', 'preview', 'beta', 'production', 'deployment', 'open-source',
  'pricing', 'roadmap', 'deprecation', 'shutdown', 'acquisition', 'partnership', 'funding', 'integration',
  'research', 'research-publication', 'benchmark', 'benchmark-result', 'security-advisory', 'incident',
  'incident-resolution', 'regulation', 'policy-change', 'feature-update', 'model-update', 'version-update',
  'migration', 'correction'
]);
export const UPDATE_KIND_VALUES = new Set([
  'status-change',
  'availability-change',
  'version-change',
  'pricing-change',
  'scope-change',
  'independent-confirmation',
  'correction',
  'incident-resolution',
  'other-material-change'
]);

const REQUIRED_TOP_LEVEL_FIELDS = [
  'schema_version',
  'edition_date',
  'headline',
  'dek',
  'brief',
  'trends',
  'releases',
  'developer_memo',
  'radar',
  'takeaway'
];

function schemaIssue(filename, field, code, message) {
  return {
    level: 'error',
    code,
    file: 'content/' + filename,
    field,
    message
  };
}

function enumList(values) {
  return [...values].join(', ');
}

function validateOptionalString(value, field, filename, errors) {
  if (value !== undefined && !hasText(value)) {
    errors.push(schemaIssue(filename, field, 'INVALID_STRING', 'Expected a non-empty string when the field is present.'));
  }
}

function validateVisual(visual, field, filename, errors) {
  if (visual === undefined) return;
  if (!isRecord(visual)) {
    errors.push(schemaIssue(filename, field, 'INVALID_VISUAL', 'Expected an object.'));
    return;
  }
  const kind = visual.kind ?? 'editorial';
  if (!VISUAL_KINDS.has(kind)) {
    errors.push(schemaIssue(filename, field + '.kind', 'INVALID_VISUAL_KIND', 'Expected one of: ' + enumList(VISUAL_KINDS) + '.'));
  }
  if ((kind === 'image' || kind === 'screenshot') && !hasText(visual.src)) {
    errors.push(schemaIssue(filename, field + '.src', 'MISSING_VISUAL_SOURCE', 'Image and screenshot visuals require src.'));
  }
  for (const key of ['src', 'alt', 'caption', 'credit', 'key']) {
    validateOptionalString(visual[key], field + '.' + key, filename, errors);
  }
}

function validateSource(source, field, filename, errors) {
  if (!isRecord(source)) {
    errors.push(schemaIssue(filename, field, 'INVALID_SOURCE', 'Expected an object.'));
    return;
  }
  if (!hasText(source.label)) errors.push(schemaIssue(filename, field + '.label', 'MISSING_SOURCE_LABEL', 'A source label is required.'));
  if (!SOURCE_TYPES.has(source.type)) {
    errors.push(schemaIssue(filename, field + '.type', 'INVALID_SOURCE_TYPE', 'Expected one of: ' + enumList(SOURCE_TYPES) + '.'));
  }
  if (!isHttpUrl(source.url)) {
    errors.push(schemaIssue(filename, field + '.url', 'INVALID_SOURCE_URL', 'Expected an HTTP(S) URL.'));
  }
  if (!hasText(source.published_at)) {
    errors.push(schemaIssue(filename, field + '.published_at', 'MISSING_SOURCE_PUBLICATION', 'A publication date or zoned timestamp is required.'));
  }
}

function validateCommonNewsFields(item, field, filename, errors) {
  if (!hasText(item.event_id) || !STABLE_IDENTIFIER.test(item.event_id)) {
    errors.push(schemaIssue(filename, field + '.event_id', 'INVALID_EVENT_ID', 'Expected a stable kebab-case identifier.'));
  }

  if (!isRecord(item.event_signature)) {
    errors.push(schemaIssue(filename, field + '.event_signature', 'MALFORMED_EVENT_SIGNATURE', 'Expected organization, product, action, and artifact.'));
  } else {
    for (const key of ['organization', 'product', 'action', 'artifact']) {
      if (!hasText(item.event_signature[key]) || !STABLE_IDENTIFIER.test(item.event_signature[key])) {
        errors.push(schemaIssue(filename, field + '.event_signature.' + key, 'MALFORMED_EVENT_SIGNATURE', 'Expected a kebab-case identifier.'));
      }
    }
    if (hasText(item.event_signature.action) && !EVENT_ACTION_VALUES.has(item.event_signature.action)) {
      errors.push(schemaIssue(
        filename,
        field + '.event_signature.action',
        'INVALID_EVENT_ACTION',
        'Expected one of: ' + enumList(EVENT_ACTION_VALUES) + '.'
      ));
    }
  }

  if (!FRESHNESS_VALUES.has(item.freshness)) {
    errors.push(schemaIssue(filename, field + '.freshness', 'INVALID_FRESHNESS', 'Expected NEW_TODAY or CONTEXT_72H.'));
  }
  if (!hasText(item.published_at)) {
    errors.push(schemaIssue(filename, field + '.published_at', 'MISSING_PUBLICATION', 'A publication date or zoned timestamp is required.'));
  }
  if (!Array.isArray(item.sources) || item.sources.length === 0) {
    errors.push(schemaIssue(filename, field + '.sources', 'MISSING_SOURCES', 'At least one supporting source is required.'));
  } else {
    item.sources.forEach((source, index) => validateSource(source, field + '.sources[' + index + ']', filename, errors));
  }

  for (const key of ['material_update', 'dedupe_override_reason', 'editorial_repeat_reason']) {
    validateOptionalString(item[key], field + '.' + key, filename, errors);
  }
  for (const key of ['editorial_theme', 'editorial_angle']) {
    if (item[key] !== undefined && (!hasText(item[key]) || !STABLE_IDENTIFIER.test(item[key]))) {
      errors.push(schemaIssue(filename, field + '.' + key, 'INVALID_EDITORIAL_METADATA', 'Expected a kebab-case editorial label.'));
    }
  }
  if (item.update_kind !== undefined && !UPDATE_KIND_VALUES.has(item.update_kind)) {
    errors.push(schemaIssue(filename, field + '.update_kind', 'INVALID_UPDATE_KIND', 'Expected one of: ' + enumList(UPDATE_KIND_VALUES) + '.'));
  }
}

function validateMeta(meta, filename, errors) {
  if (meta === undefined) return;
  if (!isRecord(meta)) {
    errors.push(schemaIssue(filename, 'meta', 'INVALID_META', 'Expected an object.'));
    return;
  }
  for (const key of ['primary_scan_hours', 'context_window_hours', 'reading_minutes']) {
    if (meta[key] !== undefined && (!Number.isFinite(meta[key]) || meta[key] <= 0)) {
      errors.push(schemaIssue(filename, 'meta.' + key, 'INVALID_META_NUMBER', 'Expected a positive number.'));
    }
  }
  for (const key of ['generated_at', 'cutoff_at', 'window_started_at']) {
    if (meta[key] !== undefined && !isZonedTimestamp(meta[key])) {
      errors.push(schemaIssue(filename, 'meta.' + key, 'INVALID_META_TIMESTAMP', 'Expected a full ISO 8601 timestamp with a time zone.'));
    }
  }
  validateOptionalString(meta.source_policy, 'meta.source_policy', filename, errors);
}

function validateTranslationText(value, field, filename, errors) {
  if (!hasText(value)) {
    errors.push(schemaIssue(filename, field, 'INCOMPLETE_TRANSLATION', 'A complete, non-empty English translation is required.'));
  }
}

function validateEnglishTranslation(edition, translation, filename, errors) {
  const root = 'translations.en';
  if (!isRecord(translation)) {
    errors.push(schemaIssue(filename, root, 'INVALID_TRANSLATION', 'Expected an English translation object.'));
    return;
  }
  for (const key of ['headline', 'dek', 'takeaway']) {
    validateTranslationText(translation[key], root + '.' + key, filename, errors);
  }
  if (!isRecord(translation.developer_memo)) {
    errors.push(schemaIssue(filename, root + '.developer_memo', 'INCOMPLETE_TRANSLATION', 'The developer memo must be translated.'));
  } else {
    for (const key of ['title', 'direct_answer']) {
      validateTranslationText(translation.developer_memo[key], root + '.developer_memo.' + key, filename, errors);
    }
    for (const key of ['actions', 'avoid']) {
      const translated = translation.developer_memo[key];
      const original = edition.developer_memo?.[key];
      if (!Array.isArray(translated) || translated.length !== original?.length || translated.some((item) => !hasText(item))) {
        errors.push(schemaIssue(filename, root + '.developer_memo.' + key, 'INCOMPLETE_TRANSLATION', 'Expected one translated entry for every original entry.'));
      }
    }
  }

  const requiredFields = {
    brief: ['title', 'text'],
    trends: ['title', 'paragraphs', 'action'],
    releases: ['product', 'feature', 'summary', 'verdict_note'],
    radar: ['text']
  };
  for (const [section, fields] of Object.entries(requiredFields)) {
    const overlays = translation[section];
    if (!isRecord(overlays)) {
      errors.push(schemaIssue(filename, root + '.' + section, 'INCOMPLETE_TRANSLATION', 'Expected translations keyed by event_id.'));
      continue;
    }
    if (!Array.isArray(edition[section])) continue;
    edition[section].forEach((item) => {
      const itemField = root + '.' + section + '.' + item.event_id;
      const overlay = overlays[item.event_id];
      if (!isRecord(overlay)) {
        errors.push(schemaIssue(filename, itemField, 'INCOMPLETE_TRANSLATION', 'Missing translation for event_id ' + item.event_id + '.'));
        return;
      }
      fields.forEach((key) => {
        if (key === 'paragraphs') {
          if (!Array.isArray(overlay.paragraphs) || overlay.paragraphs.length !== item.paragraphs.length || overlay.paragraphs.some((paragraph) => !hasText(paragraph))) {
            errors.push(schemaIssue(filename, itemField + '.paragraphs', 'INCOMPLETE_TRANSLATION', 'Expected one translated paragraph for every original paragraph.'));
          }
        } else {
          validateTranslationText(overlay[key], itemField + '.' + key, filename, errors);
        }
      });
      for (const optionalKey of ['pullquote', 'what_changed', 'who_gets_it', 'why_it_matters']) {
        if (hasText(item[optionalKey])) validateTranslationText(overlay[optionalKey], itemField + '.' + optionalKey, filename, errors);
      }
    });
  }
}

export function validateEditionSchema(edition, { filename } = {}) {
  const resolvedFilename = filename ?? (hasText(edition?.edition_date) ? edition.edition_date + '.json' : 'unknown.json');
  const errors = [];
  if (!isRecord(edition)) {
    return [schemaIssue(resolvedFilename, '', 'INVALID_EDITION', 'Expected a JSON object.')];
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!Object.hasOwn(edition, field) || edition[field] === undefined || edition[field] === null || edition[field] === '') {
      errors.push(schemaIssue(resolvedFilename, field, 'MISSING_REQUIRED_FIELD', 'Missing required field.'));
    }
  }
  if (edition.schema_version !== 1) {
    errors.push(schemaIssue(resolvedFilename, 'schema_version', 'INVALID_SCHEMA_VERSION', 'Expected schema_version 1.'));
  }
  if (!isCalendarDate(edition.edition_date)) {
    errors.push(schemaIssue(resolvedFilename, 'edition_date', 'INVALID_EDITION_DATE', 'Expected YYYY-MM-DD.'));
  } else if (path.basename(resolvedFilename, '.json') !== edition.edition_date) {
    errors.push(schemaIssue(resolvedFilename, 'edition_date', 'EDITION_DATE_MISMATCH', 'edition_date must match the filename.'));
  }
  if (!hasText(edition.headline)) errors.push(schemaIssue(resolvedFilename, 'headline', 'INVALID_HEADLINE', 'Expected a non-empty string.'));
  if (!hasText(edition.dek)) errors.push(schemaIssue(resolvedFilename, 'dek', 'INVALID_DEK', 'Expected a non-empty string.'));
  if (!hasText(edition.takeaway)) errors.push(schemaIssue(resolvedFilename, 'takeaway', 'INVALID_TAKEAWAY', 'Expected a non-empty string.'));
  if (edition.edition_mode !== undefined && !EDITION_MODES.has(edition.edition_mode)) {
    errors.push(schemaIssue(resolvedFilename, 'edition_mode', 'INVALID_EDITION_MODE', 'Expected one of: ' + enumList(EDITION_MODES) + '.'));
  }
  validateMeta(edition.meta, resolvedFilename, errors);
  validateVisual(edition.hero_visual, 'hero_visual', resolvedFilename, errors);
  if (edition.translations !== undefined) {
    if (!isRecord(edition.translations)) {
      errors.push(schemaIssue(resolvedFilename, 'translations', 'INVALID_TRANSLATION', 'Expected a translations object.'));
    } else if (edition.translations.en !== undefined) {
      validateEnglishTranslation(edition, edition.translations.en, resolvedFilename, errors);
    }
  }

  if (edition.one_number !== undefined && (
    !isRecord(edition.one_number) || !hasText(edition.one_number.value) || !hasText(edition.one_number.label)
  )) {
    errors.push(schemaIssue(resolvedFilename, 'one_number', 'INVALID_ONE_NUMBER', 'Expected an object with value and label.'));
  }
  if (edition.wildcard !== undefined && (!isRecord(edition.wildcard) || !hasText(edition.wildcard.text))) {
    errors.push(schemaIssue(resolvedFilename, 'wildcard', 'INVALID_WILDCARD', 'Expected an object with text.'));
  }
  if (edition.watching !== undefined && (
    !Array.isArray(edition.watching) || edition.watching.some((item) => !hasText(item))
  )) {
    errors.push(schemaIssue(resolvedFilename, 'watching', 'INVALID_WATCHING', 'Expected an array of non-empty strings.'));
  }

  if (!Array.isArray(edition.brief) || edition.brief.length === 0) {
    errors.push(schemaIssue(resolvedFilename, 'brief', 'INVALID_BRIEF_COLLECTION', 'Expected a non-empty array.'));
  } else {
    edition.brief.forEach((item, index) => {
      const field = 'brief[' + index + ']';
      if (!isRecord(item)) {
        errors.push(schemaIssue(resolvedFilename, field, 'INVALID_BRIEF', 'Expected an object.'));
        return;
      }
      validateCommonNewsFields(item, field, resolvedFilename, errors);
      if (!hasText(item.title)) errors.push(schemaIssue(resolvedFilename, field + '.title', 'MISSING_BRIEF_TITLE', 'A meaningful title is required.'));
      if (!hasText(item.text)) errors.push(schemaIssue(resolvedFilename, field + '.text', 'MISSING_BRIEF_BODY', 'An explanatory body is required.'));
    });
  }

  if (!Array.isArray(edition.trends) || edition.trends.length === 0) {
    errors.push(schemaIssue(resolvedFilename, 'trends', 'INVALID_TRENDS_COLLECTION', 'Expected a non-empty array.'));
  } else {
    edition.trends.forEach((trend, index) => {
      const field = 'trends[' + index + ']';
      if (!isRecord(trend)) {
        errors.push(schemaIssue(resolvedFilename, field, 'INVALID_TREND', 'Expected an object.'));
        return;
      }
      validateCommonNewsFields(trend, field, resolvedFilename, errors);
      if (!hasText(trend.title)) errors.push(schemaIssue(resolvedFilename, field + '.title', 'MISSING_TREND_TITLE', 'A title is required.'));
      if (!Array.isArray(trend.paragraphs) || trend.paragraphs.length === 0 || trend.paragraphs.some((item) => !hasText(item))) {
        errors.push(schemaIssue(resolvedFilename, field + '.paragraphs', 'INVALID_TREND_PARAGRAPHS', 'Expected a non-empty array of paragraphs.'));
      }
      if (!TREND_STRENGTH_VALUES.has(trend.strength)) {
        errors.push(schemaIssue(resolvedFilename, field + '.strength', 'INVALID_TREND_STRENGTH', 'Expected one of: ' + enumList(TREND_STRENGTH_VALUES) + '.'));
      }
      if (trend.importance !== undefined && !IMPORTANCE_VALUES.has(trend.importance)) {
        errors.push(schemaIssue(resolvedFilename, field + '.importance', 'INVALID_IMPORTANCE', 'Expected one of: ' + enumList(IMPORTANCE_VALUES) + '.'));
      }
      validateOptionalString(trend.action, field + '.action', resolvedFilename, errors);
      if (trend.stat !== undefined && (
        !isRecord(trend.stat) || !hasText(trend.stat.value) || !hasText(trend.stat.label)
      )) {
        errors.push(schemaIssue(resolvedFilename, field + '.stat', 'INVALID_TREND_STAT', 'Expected an object with value and label.'));
      }
      validateVisual(trend.visual, field + '.visual', resolvedFilename, errors);
    });
  }

  if (!Array.isArray(edition.releases)) {
    errors.push(schemaIssue(resolvedFilename, 'releases', 'INVALID_RELEASES_COLLECTION', 'Expected an array.'));
  } else {
    edition.releases.forEach((release, index) => {
      const field = 'releases[' + index + ']';
      if (!isRecord(release)) {
        errors.push(schemaIssue(resolvedFilename, field, 'INVALID_RELEASE', 'Expected an object.'));
        return;
      }
      validateCommonNewsFields(release, field, resolvedFilename, errors);
      for (const key of ['product', 'feature', 'status', 'summary', 'verdict', 'verdict_note']) {
        if (!hasText(release[key])) errors.push(schemaIssue(resolvedFilename, field + '.' + key, 'MISSING_RELEASE_FIELD', 'A non-empty string is required.'));
      }
      if (!VERDICT_VALUES.has(release.verdict)) {
        errors.push(schemaIssue(resolvedFilename, field + '.verdict', 'INVALID_VERDICT', 'Expected one of: ' + enumList(VERDICT_VALUES) + '.'));
      }
      for (const key of ['what_changed', 'who_gets_it', 'why_it_matters']) {
        validateOptionalString(release[key], field + '.' + key, resolvedFilename, errors);
      }
      validateVisual(release.visual, field + '.visual', resolvedFilename, errors);
    });
  }

  if (!isRecord(edition.developer_memo)) {
    errors.push(schemaIssue(resolvedFilename, 'developer_memo', 'INVALID_DEVELOPER_MEMO', 'Expected an object.'));
  } else {
    for (const key of ['title', 'direct_answer']) {
      if (!hasText(edition.developer_memo[key])) {
        errors.push(schemaIssue(resolvedFilename, 'developer_memo.' + key, 'MISSING_MEMO_FIELD', 'A non-empty string is required.'));
      }
    }
    for (const key of ['actions', 'avoid']) {
      if (!Array.isArray(edition.developer_memo[key]) || edition.developer_memo[key].some((item) => !hasText(item))) {
        errors.push(schemaIssue(resolvedFilename, 'developer_memo.' + key, 'INVALID_MEMO_LIST', 'Expected an array of non-empty strings.'));
      }
    }
  }

  if (!Array.isArray(edition.radar)) {
    errors.push(schemaIssue(resolvedFilename, 'radar', 'INVALID_RADAR_COLLECTION', 'Expected an array.'));
  } else {
    edition.radar.forEach((item, index) => {
      const field = 'radar[' + index + ']';
      if (!isRecord(item)) {
        errors.push(schemaIssue(resolvedFilename, field, 'INVALID_RADAR_ITEM', 'Expected an object.'));
        return;
      }
      validateCommonNewsFields(item, field, resolvedFilename, errors);
      if (!RADAR_STATUSES.has(item.status)) {
        errors.push(schemaIssue(resolvedFilename, field + '.status', 'INVALID_RADAR_STATUS', 'Expected one of: ' + enumList(RADAR_STATUSES) + '.'));
      }
      if (!hasText(item.text)) errors.push(schemaIssue(resolvedFilename, field + '.text', 'MISSING_RADAR_BODY', 'A meaningful sentence is required.'));
    });
  }

  return errors;
}

export function formatSchemaErrors(errors) {
  return errors.map((error) => {
    const location = [error.file, error.field].filter(Boolean).join(' ');
    return 'ERROR [' + error.code + '] ' + location + '\n' + error.message;
  }).join('\n\n');
}

export function assertEditionSchema(edition, options = {}) {
  const errors = validateEditionSchema(edition, options);
  if (errors.length > 0) throw new Error(formatSchemaErrors(errors));
  return edition;
}
