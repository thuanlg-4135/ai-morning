import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentDir = path.join(repoRoot, 'content');
const indexPath = path.join(repoRoot, 'data', 'news-index.json');
const sourceRegistryPath = path.join(repoRoot, 'config', 'news-sources.json');

const sections = ['brief', 'trends', 'releases', 'radar'];
const sourceTypes = new Set(['official', 'research', 'reporting']);
const freshnessHours = { NEW_TODAY: 24, CONTEXT_72H: 72 };
const minimumWords = { brief: 40, trends: 200, releases: 75, radar: 12 };
const signatureFields = ['organization', 'product', 'action', 'artifact'];
const stableIdentifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const canonicalActions = new Set([
  'release', 'launch', 'general-availability', 'preview', 'beta', 'production', 'deployment', 'open-source',
  'pricing', 'roadmap', 'deprecation', 'shutdown', 'acquisition', 'partnership', 'funding', 'integration',
  'research', 'research-publication', 'benchmark', 'benchmark-result', 'security-advisory', 'incident',
  'incident-resolution', 'regulation', 'policy-change', 'feature-update', 'model-update', 'version-update',
  'migration', 'correction'
]);
const updateKinds = new Set([
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
const availabilityStageActions = new Set(['preview', 'beta', 'general-availability', 'production', 'deployment']);
const statusStageActions = new Set([...availabilityStageActions, 'deprecation', 'shutdown', 'incident', 'incident-resolution']);
const signatureStopWords = {
  organization: new Set(['ai', 'the', 'inc', 'incorporated', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited', 'llc', 'labs', 'lab']),
  product: new Set(['ai', 'agent', 'agents', 'platform', 'runtime', 'service', 'services', 'framework', 'sdk', 'api', 'tool', 'tools', 'system', 'engine']),
  artifact: new Set(['ai', 'agent', 'agents', 'release', 'update', 'version', 'announcement', 'availability', 'general'])
};
const actionFamilies = new Map([
  ['availability', new Set(['availability', 'beta', 'deployment', 'general', 'launch', 'open', 'preview', 'production', 'release'])],
  ['pricing', new Set(['price', 'priced', 'pricing', 'discount'])],
  ['security', new Set(['advisory', 'cve', 'patch', 'patched', 'security', 'vulnerability'])],
  ['incident', new Set(['degradation', 'incident', 'outage', 'recovery', 'resolution', 'resolved'])],
  ['corporate', new Set(['acquire', 'acquired', 'acquisition', 'funding', 'merge', 'merger'])],
  ['integration', new Set(['integrate', 'integrated', 'integration', 'partner', 'partnership'])],
  ['update', new Set(['feature', 'model', 'version', 'update', 'migration'])],
  ['sunset', new Set(['deprecation', 'shutdown'])],
  ['research', new Set(['benchmark', 'research', 'publication'])],
  ['policy', new Set(['policy', 'regulation'])],
  ['correction', new Set(['correction'])]
]);
const stopWords = new Set([
  'ai', 'agent', 'agents', 'cua', 'cho', 'cac', 'nhung', 'mot', 'voi', 'trong', 'tren', 'duoc',
  'dang', 'nay', 'the', 'khi', 'khong', 'tu', 'va', 'la', 'co', 've', 'vao', 'them', 'new',
  'today', 'context', 'release', 'released', 'update', 'updates', 'from', 'with', 'that', 'this',
  'the', 'for', 'and', 'are', 'has', 'have', 'its', 'now'
]);
const topicalStopWords = new Set([
  'add', 'adds', 'added', 'announce', 'announces', 'announced', 'become', 'becomes', 'became',
  'introduce', 'introduces', 'introduced', 'launch', 'launches', 'launched', 'present', 'presents',
  'presented', 'publish', 'publishes', 'published', 'release', 'releases', 'released', 'support',
  'supports', 'supported', 'available', 'availability', 'capability', 'feature'
]);

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const wordCount = (value) => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length;

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleTokens(value) {
  return new Set(normalizeText(value).split(/\s+/).filter((token) => token.length >= 3 && !stopWords.has(token)));
}

function tokenSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return { score: 0, shared: 0 };
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return { score: shared / (a.size + b.size - shared), shared };
}

function similarity(left, right) {
  return tokenSimilarity(titleTokens(left), titleTokens(right));
}

function canonicalUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Source URL must use HTTP(S)');
  url.protocol = 'https:';
  url.hash = '';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (url.hostname === 'm.youtube.com') url.hostname = 'youtube.com';
  const identityParams = new URLSearchParams();
  const preserveParam = (key) => {
    const parameterValue = url.searchParams.get(key);
    if (hasText(parameterValue)) identityParams.set(key, parameterValue);
  };
  if (['youtube.com', 'youtube-nocookie.com'].includes(url.hostname) && url.pathname === '/watch') preserveParam('v');
  if (url.hostname === 'news.ycombinator.com' && url.pathname === '/item') preserveParam('id');
  if (url.hostname === 'openreview.net' && url.pathname === '/forum') preserveParam('id');
  if (url.hostname === 'papers.ssrn.com' && url.pathname.toLowerCase() === '/sol3/papers.cfm') preserveParam('abstract_id');
  url.search = identityParams.toString();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString();
}

function calendarDate(value) {
  if (!hasText(value)) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const parsed = new Date(match[1] + 'T00:00:00Z');
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== match[1] ? null : match[1];
}

function exactTimestamp(value) {
  if (!hasText(value) || !calendarDate(value) || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function editionCutoff(editionDate) {
  return new Date(editionDate + 'T07:00:00+07:00');
}

function dateDifference(later, earlier) {
  return Math.round((new Date(later + 'T00:00:00Z') - new Date(earlier + 'T00:00:00Z')) / 86_400_000);
}

function meaningfulReason(value) {
  return hasText(value) && value.trim().length >= 40 && wordCount(value) >= 8;
}

function componentTokens(value, field) {
  const ignored = signatureStopWords[field] ?? new Set();
  const tokens = normalizeText(value).split(/\s+/).filter((token) => token && !ignored.has(token));
  return new Set(tokens.length > 0 ? tokens : normalizeText(value).split(/\s+/).filter(Boolean));
}

function componentsRelated(left, right, field) {
  const leftTokens = componentTokens(left, field);
  const rightTokens = componentTokens(right, field);
  if (leftTokens.size === 0 || rightTokens.size === 0) return false;
  const leftCompact = [...leftTokens].join('');
  const rightCompact = [...rightTokens].join('');
  if (leftCompact === rightCompact) return true;
  let shared = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) shared += 1;
  return shared >= 2 && shared / Math.max(leftTokens.size, rightTokens.size) >= 0.66;
}

function artifactSimilarity(left, right) {
  const leftTokens = componentTokens(left, 'artifact');
  const rightTokens = componentTokens(right, 'artifact');
  if (leftTokens.size === 0 || rightTokens.size === 0) return { strong: false, weak: false };
  const leftCompact = [...leftTokens].join('');
  const rightCompact = [...rightTokens].join('');
  let shared = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) shared += 1;
  return {
    strong: leftCompact === rightCompact || (shared >= 2 && shared / Math.max(leftTokens.size, rightTokens.size) >= 0.66),
    weak: shared >= 1 && shared / Math.min(leftTokens.size, rightTokens.size) >= 0.5
  };
}

function topicalSimilarity(title, signature, otherTitle, otherSignature) {
  const tokensFor = (value, eventIdentity) => {
    const tokens = titleTokens(value);
    for (const field of ['organization', 'product', 'action']) {
      for (const token of componentTokens(eventIdentity[field], field)) tokens.delete(token);
    }
    for (const token of topicalStopWords) tokens.delete(token);
    return tokens;
  };
  return tokenSimilarity(tokensFor(title, signature), tokensFor(otherTitle, otherSignature));
}

function actionFamily(value) {
  const tokens = componentTokens(value, 'action');
  for (const [family, aliases] of actionFamilies) {
    if ([...tokens].some((token) => aliases.has(token))) return family;
  }
  return [...tokens].join('-');
}

function publicationIsNewer(later, earlier) {
  const laterExact = exactTimestamp(later);
  const earlierExact = exactTimestamp(earlier);
  if (laterExact && earlierExact) return laterExact > earlierExact;
  const laterDate = calendarDate(later);
  const earlierDate = calendarDate(earlier);
  return Boolean(laterDate && earlierDate && laterDate > earlierDate);
}

function sourceEvidence(item) {
  const evidence = [];
  for (const source of Array.isArray(item.sources) ? item.sources : []) {
    if (!hasText(source?.url)) continue;
    try {
      evidence.push({ url: canonicalUrl(source.url), type: source.type, published_at: source.published_at });
    } catch {
      // URL format is reported by validateItem.
    }
  }
  return evidence;
}

function sourceUrlSet(item) {
  return new Set(sourceEvidence(item).map((source) => source.url));
}

function eventSignature(item) {
  if (!isRecord(item.event_signature)) return null;
  if (signatureFields.some((field) => !hasText(item.event_signature[field]) || !stableIdentifier.test(item.event_signature[field]))) {
    return null;
  }
  return Object.fromEntries(signatureFields.map((field) => [field, item.event_signature[field]]));
}

function signatureKey(signature) {
  return signatureFields.map((field) => signature[field]).join('|');
}

function updateSignatureIsConsistent(kind, previous, later) {
  const actionChanged = previous.action !== later.action;
  const artifactChanged = previous.artifact !== later.artifact;
  if (kind === 'availability-change') {
    return artifactChanged || (
      actionChanged && availabilityStageActions.has(previous.action) && availabilityStageActions.has(later.action)
    );
  }
  if (kind === 'status-change') {
    return artifactChanged || (
      actionChanged && statusStageActions.has(previous.action) && statusStageActions.has(later.action)
    );
  }
  if (kind === 'version-change' || kind === 'scope-change') return artifactChanged;
  if (kind === 'pricing-change') return later.action === 'pricing' && artifactChanged;
  if (kind === 'incident-resolution') {
    return later.action === 'incident-resolution' && (actionChanged || artifactChanged);
  }
  return true;
}

function validatePublication(value, freshness, editionDate, field, errors) {
  const dateOnly = hasText(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) ? calendarDate(value) : null;
  const timestamp = exactTimestamp(value);
  if (!dateOnly && !timestamp) {
    errors.push(field + ' must be YYYY-MM-DD or a full ISO timestamp with a time zone');
    return;
  }

  const cutoff = editionCutoff(editionDate);
  if (timestamp) {
    if (timestamp >= cutoff) {
      errors.push(field + ' is at or after the 07:00 Asia/Ho_Chi_Minh edition cutoff');
    }
    const hours = freshnessHours[freshness];
    if (hours && timestamp < new Date(cutoff.valueOf() - hours * 3_600_000)) {
      errors.push(field + ' is outside the exact ' + hours + '-hour ' + freshness + ' window');
    }
    return;
  }

  const age = dateDifference(editionDate, dateOnly);
  if (age < 0) {
    errors.push(field + ' is later than the edition date');
  }
  if (dateOnly === editionDate) {
    errors.push(field + ' is date-only on the edition date and cannot prove publication before the 07:00 cutoff');
  }
  const maxCalendarAge = freshness === 'NEW_TODAY' ? 1 : freshness === 'CONTEXT_72H' ? 3 : null;
  if (maxCalendarAge !== null && age > maxCalendarAge) {
    errors.push(field + ' is outside the ' + freshness + ' calendar fallback window');
  }
}

function itemTitle(section, item) {
  if (section === 'brief') return item.title;
  if (section === 'trends') return item.title;
  if (section === 'releases') return [item.product, item.feature].filter(hasText).join(' — ');
  return item.text;
}

function itemBody(section, item) {
  if (section === 'brief') return item.text;
  if (section === 'trends') return Array.isArray(item.paragraphs) ? item.paragraphs.join(' ') : '';
  if (section === 'releases') {
    return [item.summary, item.what_changed, item.why_it_matters, item.verdict_note].filter(hasText).join(' ');
  }
  return item.text;
}

function editionItems(edition) {
  return sections.flatMap((section) => {
    const values = Array.isArray(edition[section]) ? edition[section] : [];
    return values.map((item, index) => ({
      edition,
      section,
      index,
      item,
      field: section + '[' + index + ']',
      title: itemTitle(section, item),
      body: itemBody(section, item)
    }));
  });
}

function validateItem(entry, errors) {
  const { edition, section, item, field, title, body } = entry;
  const prefix = 'content/' + edition.edition_date + '.json ' + field;

  if (!hasText(item.event_id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.event_id)) {
    errors.push(prefix + '.event_id must be a stable kebab-case identifier');
  }
  if (!hasText(title)) errors.push(prefix + ' must have a readable title');

  if (!Object.hasOwn(freshnessHours, item.freshness)) {
    errors.push(prefix + '.freshness must be NEW_TODAY or CONTEXT_72H');
  }
  validatePublication(item.published_at, item.freshness, edition.edition_date, prefix + '.published_at', errors);

  const signature = eventSignature(item);
  if (!signature) {
    errors.push(prefix + '.event_signature must contain kebab-case organization, product, action, and artifact fields');
  } else if (!canonicalActions.has(signature.action)) {
    errors.push(prefix + '.event_signature.action must use a canonical action: ' + [...canonicalActions].join(', '));
  }
  for (const field of ['material_update', 'dedupe_override_reason']) {
    if (item[field] !== undefined && !meaningfulReason(item[field])) {
      errors.push(prefix + '.' + field + ' must explain the concrete distinction in at least 8 words and 40 characters');
    }
  }
  if (item.material_update !== undefined && !updateKinds.has(item.update_kind)) {
    errors.push(prefix + '.update_kind must classify material_update as one of: ' + [...updateKinds].join(', '));
  }
  if (item.update_kind !== undefined && item.material_update === undefined) {
    errors.push(prefix + '.update_kind is only valid when material_update is present');
  }

  if (wordCount(body) < minimumWords[section]) {
    errors.push(prefix + ' has ' + wordCount(body) + ' words; expected at least ' + minimumWords[section]);
  }

  if (!Array.isArray(item.sources) || item.sources.length === 0) {
    errors.push(prefix + '.sources must contain at least one supporting source');
    return;
  }

  const seenSources = new Set();
  item.sources.forEach((source, sourceIndex) => {
    const sourceField = prefix + '.sources[' + sourceIndex + ']';
    if (!isRecord(source)) {
      errors.push(sourceField + ' must be an object');
      return;
    }
    if (!hasText(source.label)) errors.push(sourceField + '.label is required');
    if (!sourceTypes.has(source.type)) {
      errors.push(sourceField + '.type must be official, research, or reporting');
    }
    if (!hasText(source.url)) {
      errors.push(sourceField + '.url is required');
    } else {
      try {
        const canonical = canonicalUrl(source.url);
        if (seenSources.has(canonical)) errors.push(sourceField + ' repeats a canonical URL in the same event');
        seenSources.add(canonical);
      } catch {
        errors.push(sourceField + '.url must be a valid HTTP(S) URL');
      }
    }
    validatePublication(source.published_at, item.freshness, edition.edition_date, sourceField + '.published_at', errors);
  });
}

function validateNewsQuality(editions) {
  const errors = [];
  const allEntries = editions.flatMap(editionItems);
  allEntries.forEach((entry) => validateItem(entry, errors));

  const occurrencesByEvent = new Map();
  const occurrencesByUrl = new Map();
  const occurrencesBySignature = new Map();

  for (const entry of allEntries) {
    const eventId = entry.item.event_id;
    if (hasText(eventId)) {
      if (!occurrencesByEvent.has(eventId)) occurrencesByEvent.set(eventId, []);
      occurrencesByEvent.get(eventId).push(entry);
    }
    const signature = eventSignature(entry.item);
    if (signature) {
      const exactKey = signatureKey(signature);
      if (!occurrencesBySignature.has(exactKey)) occurrencesBySignature.set(exactKey, []);
      occurrencesBySignature.get(exactKey).push(entry);
    }
    for (const source of Array.isArray(entry.item.sources) ? entry.item.sources : []) {
      if (!hasText(source?.url)) continue;
      try {
        const url = canonicalUrl(source.url);
        if (!occurrencesByUrl.has(url)) occurrencesByUrl.set(url, []);
        occurrencesByUrl.get(url).push(entry);
      } catch {
        // URL format is reported by validateItem.
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
    for (const [date, sameDay] of byEdition) {
      if (sameDay.length > 1) {
        errors.push('event_id "' + eventId + '" appears ' + sameDay.length + ' times in ' + date + ': ' + sameDay.map((entry) => entry.field).join(', '));
      }
    }
    const ordered = [...occurrences].sort((left, right) =>
      left.edition.edition_date.localeCompare(right.edition.edition_date) || left.field.localeCompare(right.field)
    );
    const previousSourceEvidence = new Map();
    for (const source of sourceEvidence(ordered[0].item)) {
      previousSourceEvidence.set(source.url, [source.published_at]);
    }
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const laterEntry = ordered[index];
      const later = laterEntry.item;
      const date = laterEntry.edition.edition_date;
      if (!meaningfulReason(later.material_update)) {
        errors.push('event_id "' + eventId + '" returns on ' + date + ' without material_update');
      }

      const laterSourceEvidence = sourceEvidence(later);
      const hasNewSource = laterSourceEvidence.some((source) => !previousSourceEvidence.has(source.url));
      const previousSourceHosts = new Set([...previousSourceEvidence.keys()].map((url) => new URL(url).hostname));
      const hasIndependentSource = laterSourceEvidence.some((source) =>
        !previousSourceEvidence.has(source.url) &&
        ['reporting', 'research'].includes(source.type) &&
        !previousSourceHosts.has(new URL(source.url).hostname) &&
        publicationIsNewer(source.published_at, previous.item.published_at)
      );
      const hasNewerSourcePublication = laterSourceEvidence.some((source) => {
        const previousPublications = previousSourceEvidence.get(source.url);
        return previousPublications?.length > 0 && previousPublications.every((publishedAt) =>
          publicationIsNewer(source.published_at, publishedAt)
        );
      });
      const hasSourceBackedNewerPublication =
        publicationIsNewer(later.published_at, previous.item.published_at) && hasNewerSourcePublication;
      if (!hasNewSource && !hasSourceBackedNewerPublication) {
        errors.push(
          'event_id "' + eventId + '" returns on ' + date +
          ' without structural evidence; material updates require a genuinely new canonical source or a newer item timestamp backed by a newer source timestamp'
        );
      }
      if (later.update_kind === 'independent-confirmation' && !hasIndependentSource) {
        errors.push(
          'event_id "' + eventId + '" uses independent-confirmation on ' + date +
          ' without a new reporting/research source from a previously unseen publisher host'
        );
      }

      const previousSignature = eventSignature(previous.item);
      const laterSignature = eventSignature(later);
      if (previousSignature && laterSignature && signatureKey(previousSignature) !== signatureKey(laterSignature)) {
        if (
          !componentsRelated(previousSignature.organization, laterSignature.organization, 'organization') ||
          !componentsRelated(previousSignature.product, laterSignature.product, 'product')
        ) {
          errors.push(
            'event_id "' + eventId + '" changes organization or product identity across editions; use a new event_id for a different event'
          );
        }
      }
      if (
        previousSignature &&
        laterSignature &&
        !updateSignatureIsConsistent(later.update_kind, previousSignature, laterSignature)
      ) {
        errors.push(
          'event_id "' + eventId + '" uses ' + later.update_kind + ' on ' + date +
          ' without the kind-specific semantic event_signature delta'
        );
      }
      for (const source of laterSourceEvidence) {
        if (!previousSourceEvidence.has(source.url)) previousSourceEvidence.set(source.url, []);
        previousSourceEvidence.get(source.url).push(source.published_at);
      }
    }
  }

  for (const [key, occurrences] of occurrencesBySignature) {
    const eventIds = new Set(occurrences.map((entry) => entry.item.event_id).filter(hasText));
    if (eventIds.size > 1) {
      errors.push('event_signature "' + key + '" maps to multiple event IDs: ' + [...eventIds].join(', '));
    }
  }

  for (const [url, occurrences] of occurrencesByUrl) {
    const distinct = new Map();
    for (const entry of occurrences) if (!distinct.has(entry.item.event_id)) distinct.set(entry.item.event_id, entry);
    const candidates = [...distinct.values()];
    if (candidates.length > 1 && candidates.slice(1).some((entry) => !meaningfulReason(entry.item.dedupe_override_reason))) {
      errors.push('canonical source URL supports multiple event IDs (' + candidates.map((entry) => entry.item.event_id).join(', ') + '): ' + url);
    }
  }

  const sorted = [...allEntries].sort((a, b) => a.edition.edition_date.localeCompare(b.edition.edition_date));
  for (let leftIndex = 0; leftIndex < sorted.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sorted.length; rightIndex += 1) {
      const left = sorted[leftIndex];
      const right = sorted[rightIndex];
      if (left.item.event_id === right.item.event_id) continue;
      const dayGap = dateDifference(right.edition.edition_date, left.edition.edition_date);
      if (dayGap > 14) continue;
      const match = similarity(left.title, right.title);

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
          errors.push(
            'possible semantic duplicate events "' + left.item.event_id + '" and "' + right.item.event_id +
            '" (normalized organization/product/action match across ' + publicationDayGap + ' publication day(s)); ' +
            'merge them or add a concrete dedupe_override_reason'
          );
        }
      }

      if (semanticDuplicate) continue;
      if (match.score >= 0.68 && match.shared >= 4 && !meaningfulReason(right.item.dedupe_override_reason)) {
        errors.push(
          'possible duplicate events "' + left.item.event_id + '" and "' + right.item.event_id +
          '" (title similarity ' + match.score.toFixed(2) + '): "' + left.title + '" / "' + right.title + '"'
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error('News quality validation failed:\n' + errors.map((error) => '- ' + error).join('\n'));
  }

  return allEntries;
}

function buildIndex(editions, entries, sourceRegistryCount) {
  const eventMap = new Map();
  for (const entry of entries) {
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
    events: [...eventMap.values()].sort((a, b) =>
      a.first_edition.localeCompare(b.first_edition) || a.event_id.localeCompare(b.event_id)
    )
  };
}

async function loadEditions() {
  const filenames = (await readdir(contentDir)).filter((filename) => filename.endsWith('.json')).sort();
  if (filenames.length === 0) throw new Error('No content/*.json editions found');
  return Promise.all(filenames.map(async (filename) => {
    const edition = JSON.parse(await readFile(path.join(contentDir, filename), 'utf8'));
    if (edition.edition_date !== path.basename(filename, '.json')) {
      throw new Error('content/' + filename + ' edition_date must match its filename');
    }
    return edition;
  }));
}

async function loadSourceRegistry() {
  const registry = JSON.parse(await readFile(sourceRegistryPath, 'utf8'));
  const errors = [];
  if (!isRecord(registry) || registry.schema_version !== 1 || !Array.isArray(registry.sources) || registry.sources.length === 0) {
    throw new Error('config/news-sources.json must contain schema_version 1 and a non-empty sources array');
  }
  const ids = new Set();
  const urls = new Set();
  registry.sources.forEach((source, index) => {
    const field = 'config/news-sources.json sources[' + index + ']';
    if (!isRecord(source)) {
      errors.push(field + ' must be an object');
      return;
    }
    if (!hasText(source.id) || !stableIdentifier.test(source.id)) errors.push(field + '.id must be kebab-case');
    if (ids.has(source.id)) errors.push(field + '.id is duplicated: ' + source.id);
    ids.add(source.id);
    if (!hasText(source.name)) errors.push(field + '.name is required');
    if (![1, 2, 3].includes(source.tier)) errors.push(field + '.tier must be 1, 2, or 3');
    if (!hasText(source.kind)) errors.push(field + '.kind is required');
    if (source.tier === 3 && source.kind !== 'discovery') errors.push(field + ' tier 3 sources must use kind "discovery"');
    if (!Array.isArray(source.topics) || source.topics.length === 0 || source.topics.some((topic) => !hasText(topic))) {
      errors.push(field + '.topics must be a non-empty string array');
    }
    try {
      const url = canonicalUrl(source.url);
      if (urls.has(url)) errors.push(field + '.url duplicates another registry URL: ' + url);
      urls.add(url);
    } catch {
      errors.push(field + '.url must be a valid HTTP(S) URL');
    }
  });
  if (errors.length > 0) throw new Error('Source registry validation failed:\n' + errors.map((error) => '- ' + error).join('\n'));
  return registry;
}

function runSelfTest() {
  const body = 'This verified synthetic story explains a concrete product change, its operational impact, the affected engineering workflow, the supporting evidence, and the exact follow-up action a production team should take before adopting the update in a live environment. It also states the validation boundary and expected production outcome clearly.';
  const makeBrief = ({ eventId, title, url, publishedAt = '2026-08-23T10:00:00+07:00', signature, ...extra }) => ({
    event_id: eventId,
    event_signature: signature ?? {
      organization: eventId,
      product: eventId,
      action: 'release',
      artifact: 'primary-change'
    },
    title,
    text: body,
    published_at: publishedAt,
    freshness: 'NEW_TODAY',
    sources: [{ label: 'Synthetic primary source', url, type: 'official', published_at: publishedAt }],
    ...extra
  });
  const makeEdition = (editionDate, brief) => ({ edition_date: editionDate, brief, trends: [], releases: [], radar: [] });
  const expectFailure = (name, editions, expectedText) => {
    let message = '';
    try {
      validateNewsQuality(editions);
    } catch (error) {
      message = error.message;
    }
    if (!message.includes(expectedText)) {
      throw new Error('Self-test "' + name + '" did not fail with: ' + expectedText + '\nActual: ' + (message || 'no error'));
    }
  };

  const alpha = makeBrief({
    eventId: 'alpha-compiler-memory-fix',
    title: 'Alpha compiler corrects a production memory leak',
    url: 'https://example.test/alpha'
  });
  const beta = makeBrief({
    eventId: 'beta-database-encrypted-snapshots',
    title: 'Beta database adds encrypted snapshots',
    url: 'https://example.test/beta'
  });
  validateNewsQuality([makeEdition('2026-08-24', [alpha, beta])]);

  expectFailure(
    'same-edition event identity',
    [makeEdition('2026-08-24', [alpha, { ...alpha, title: 'A second card for the Alpha compiler fix' }])],
    'appears 2 times'
  );
  expectFailure(
    'canonical URL reuse',
    [makeEdition('2026-08-24', [
      alpha,
      makeBrief({
        eventId: 'different-event-on-same-page',
        title: 'Gamma runtime changes its task scheduler',
        url: 'https://example.test/alpha?edition=alternate'
      })
    ])],
    'supports multiple event IDs'
  );
  expectFailure(
    'HTTP and HTTPS source identity',
    [makeEdition('2026-08-24', [
      alpha,
      makeBrief({
        eventId: 'same-page-over-http',
        title: 'Delta runtime publishes a separate scheduler note',
        url: 'http://example.test/alpha'
      })
    ])],
    'supports multiple event IDs'
  );
  validateNewsQuality([makeEdition('2026-08-24', [
    makeBrief({
      eventId: 'video-demo-alpha',
      title: 'A video demonstrates compiler cache behavior',
      url: 'https://www.youtube.com/watch?v=alpha',
      signature: { organization: 'channel-one', product: 'compiler-cache', action: 'benchmark', artifact: 'demo-alpha' }
    }),
    makeBrief({
      eventId: 'video-demo-beta',
      title: 'Another video demonstrates database recovery behavior',
      url: 'https://youtube.com/watch?v=beta',
      signature: { organization: 'channel-two', product: 'database-recovery', action: 'research', artifact: 'demo-beta' }
    })
  ])]);
  expectFailure(
    'cross-edition repeat without material update',
    [
      makeEdition('2026-08-24', [alpha]),
      makeEdition('2026-08-25', [{ ...alpha, published_at: '2026-08-24T10:00:00+07:00', sources: [{ ...alpha.sources[0], published_at: '2026-08-24T10:00:00+07:00' }] }])
    ],
    'without material_update'
  );
  validateNewsQuality([
    makeEdition('2026-08-24', [alpha]),
    makeEdition('2026-08-25', [{
      ...alpha,
      published_at: '2026-08-24T10:00:00+07:00',
      material_update: 'The vendor published a corrected artifact with a new availability status.',
      update_kind: 'correction',
      sources: [{ ...alpha.sources[0], published_at: '2026-08-24T10:00:00+07:00' }]
    }])
  ]);
  const evolvingEvent = makeBrief({
    eventId: 'acme-nova-availability',
    title: 'Acme opens a Nova preview for production evaluation',
    url: 'https://example.test/nova-preview',
    signature: { organization: 'acme', product: 'nova', action: 'preview', artifact: 'private-beta' }
  });
  validateNewsQuality([
    makeEdition('2026-08-24', [evolvingEvent]),
    makeEdition('2026-08-25', [{
      ...evolvingEvent,
      event_signature: { organization: 'acme-inc', product: 'nova-runtime', action: 'release', artifact: 'general-availability' },
      published_at: '2026-08-24T10:00:00+07:00',
      material_update: 'The same product moved from private preview to documented general availability.',
      update_kind: 'availability-change',
      sources: [{ ...evolvingEvent.sources[0], published_at: '2026-08-24T10:00:00+07:00' }]
    }])
  ]);
  expectFailure(
    'fuzzy title match',
    [makeEdition('2026-08-24', [
      makeBrief({
        eventId: 'acme-nova-workload-identity-a',
        title: 'Acme Nova introduces secure workload identity controls',
        url: 'https://example.test/nova-a',
        signature: { organization: 'acme', product: 'nova', action: 'release', artifact: 'identity-controls' }
      }),
      makeBrief({
        eventId: 'acme-nova-workload-identity-b',
        title: 'Acme Nova introduces secure workload identity controls today',
        url: 'https://example.test/nova-b',
        signature: { organization: 'otherco', product: 'comet', action: 'research', artifact: 'separate-study' }
      })
    ])],
    'possible duplicate events'
  );
  expectFailure(
    'structured semantic identity',
    [makeEdition('2026-08-24', [
      makeBrief({
        eventId: 'acme-nova-memory-launch-a',
        title: 'Acme Nova launches durable memory for agents',
        url: 'https://example.test/memory-a',
        signature: { organization: 'acme', product: 'nova', action: 'launch', artifact: 'durable-memory' }
      }),
      makeBrief({
        eventId: 'coding-runtime-state-launch-b',
        title: 'Persistent conversation state arrives in the coding runtime',
        url: 'https://example.test/memory-b',
        signature: { organization: 'acme', product: 'nova', action: 'launch', artifact: 'durable-memory' }
      })
    ])],
    'maps to multiple event IDs'
  );
  expectFailure(
    'normalized semantic identity across adjacent reporting dates',
    [
      makeEdition('2026-08-24', [makeBrief({
        eventId: 'acme-nova-context-preview-a',
        title: 'Acme Nova presents persistent state retention',
        url: 'https://example.test/nova-context-a',
        signature: { organization: 'acme', product: 'nova', action: 'launch', artifact: 'long-term-state' }
      })]),
      makeEdition('2026-08-25', [makeBrief({
        eventId: 'nova-runtime-state-release-b',
        title: 'Persistent state reaches production coding environments',
        url: 'https://example.test/nova-context-b',
        publishedAt: '2026-08-24T10:00:00+07:00',
        signature: { organization: 'acme-inc', product: 'nova-runtime', action: 'release', artifact: 'persistent-state' }
      })])
    ],
    'possible semantic duplicate events'
  );
  validateNewsQuality([makeEdition('2026-08-24', [
    makeBrief({
      eventId: 'acme-nova-encrypted-backups',
      title: 'Acme Nova adds encrypted backup retention controls',
      url: 'https://example.test/nova-backups',
      signature: { organization: 'acme', product: 'nova', action: 'release', artifact: 'encrypted-backups' }
    }),
    makeBrief({
      eventId: 'acme-nova-firewall-rules',
      title: 'Acme Nova adds granular network firewall rules',
      url: 'https://example.test/nova-firewall',
      signature: { organization: 'acme', product: 'nova', action: 'release', artifact: 'firewall-rules' }
    })
  ])]);
  validateNewsQuality([makeEdition('2026-08-24', [
    makeBrief({
      eventId: 'acme-nova-memory-optimization',
      title: 'Nova reduces allocator churn under long contexts',
      url: 'https://example.test/nova-memory-performance',
      signature: { organization: 'acme', product: 'nova', action: 'release', artifact: 'memory-optimization' }
    }),
    makeBrief({
      eventId: 'acme-nova-memory-safety',
      title: 'Nova blocks unsafe pointer access in plugins',
      url: 'https://example.test/nova-memory-safety',
      signature: { organization: 'acme', product: 'nova', action: 'release', artifact: 'memory-safety' }
    })
  ])]);
  expectFailure(
    'canonical signature action',
    [makeEdition('2026-08-24', [makeBrief({
      eventId: 'acme-nova-open-source-alias',
      title: 'Acme publishes the Nova runtime source code',
      url: 'https://example.test/nova-source',
      signature: { organization: 'acme', product: 'nova', action: 'open-sourced', artifact: 'runtime-code' }
    })])],
    '.event_signature.action must use a canonical action'
  );
  expectFailure(
    'end-exclusive cutoff',
    [makeEdition('2026-08-24', [makeBrief({
      eventId: 'cutoff-boundary-event',
      title: 'Boundary event lands exactly at the edition cutoff',
      url: 'https://example.test/cutoff',
      publishedAt: '2026-08-24T07:00:00+07:00'
    })])],
    'at or after the 07:00'
  );
  expectFailure(
    'HTTP source protocol',
    [makeEdition('2026-08-24', [makeBrief({
      eventId: 'invalid-source-protocol',
      title: 'Invalid source protocol is rejected by validation',
      url: 'ftp://example.test/source'
    })])],
    'valid HTTP(S) URL'
  );
  expectFailure(
    'required source metadata',
    [makeEdition('2026-08-24', [{
      ...alpha,
      sources: [{ url: 'https://example.test/metadata', published_at: alpha.published_at }]
    }])],
    '.label is required'
  );
  expectFailure(
    'exact NEW_TODAY lower bound',
    [makeEdition('2026-08-24', [makeBrief({
      eventId: 'stale-exact-new-item',
      title: 'An exact timestamp outside the daily window is rejected',
      url: 'https://example.test/stale-new',
      publishedAt: '2026-08-23T00:01:00+07:00'
    })])],
    'outside the exact 24-hour'
  );
  expectFailure(
    'exact CONTEXT_72H lower bound',
    [makeEdition('2026-08-24', [makeBrief({
      eventId: 'stale-exact-context-item',
      title: 'An exact timestamp outside the context window is rejected',
      url: 'https://example.test/stale-context',
      publishedAt: '2026-08-21T00:01:00+07:00',
      freshness: 'CONTEXT_72H'
    })])],
    'outside the exact 72-hour'
  );
  expectFailure(
    'malformed timestamp',
    [makeEdition('2026-08-24', [makeBrief({
      eventId: 'malformed-publication-time',
      title: 'A malformed timestamp cannot pass as a calendar date',
      url: 'https://example.test/malformed-time',
      publishedAt: '2026-08-24Tgarbage'
    })])],
    'full ISO timestamp with a time zone'
  );
  expectFailure(
    'future date-only source',
    [makeEdition('2026-08-24', [{
      ...alpha,
      sources: [{ ...alpha.sources[0], published_at: '2099-01-01' }]
    }])],
    'is later than the edition date'
  );
  expectFailure(
    'source freshness evidence',
    [makeEdition('2026-08-24', [{
      ...alpha,
      sources: [{ ...alpha.sources[0], published_at: '2026-08-22T01:00:00+07:00' }]
    }])],
    'outside the exact 24-hour'
  );
  expectFailure(
    'required radar freshness',
    [{
      edition_date: '2026-08-24',
      brief: [],
      trends: [],
      releases: [],
      radar: [{ ...alpha, title: undefined, text: body, status: 'WATCH', freshness: undefined }]
    }],
    '.freshness must be NEW_TODAY or CONTEXT_72H'
  );
  expectFailure(
    'meaningful material update',
    [
      makeEdition('2026-08-24', [alpha]),
      makeEdition('2026-08-25', [{
        ...alpha,
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'x',
        sources: [{ ...alpha.sources[0], published_at: '2026-08-24T10:00:00+07:00' }]
      }])
    ],
    'material_update must explain the concrete distinction'
  );
  const contextAlpha = {
    ...alpha,
    freshness: 'CONTEXT_72H',
    sources: alpha.sources.map((source) => ({ ...source }))
  };
  expectFailure(
    'material update structural evidence',
    [
      makeEdition('2026-08-24', [contextAlpha]),
      makeEdition('2026-08-25', [{
        ...contextAlpha,
        material_update: 'The vendor restated the same claim without publishing any new evidence.',
        update_kind: 'other-material-change',
        sources: contextAlpha.sources.map((source) => ({ ...source }))
      }])
    ],
    'material updates require a genuinely new canonical source or a newer item timestamp backed by a newer source timestamp'
  );
  expectFailure(
    'self-asserted newer item timestamp',
    [
      makeEdition('2026-08-24', [contextAlpha]),
      makeEdition('2026-08-25', [{
        ...contextAlpha,
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'The item claims a later update while its supporting source remains unchanged.',
        update_kind: 'other-material-change',
        sources: contextAlpha.sources.map((source) => ({ ...source }))
      }])
    ],
    'newer item timestamp backed by a newer source timestamp'
  );
  expectFailure(
    'independent confirmation requires a new source',
    [
      makeEdition('2026-08-24', [alpha]),
      makeEdition('2026-08-25', [{
        ...alpha,
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'A later publication independently confirmed the original vendor announcement.',
        update_kind: 'independent-confirmation',
        sources: [{
          ...alpha.sources[0],
          url: 'https://example.test/alpha-second-vendor-page',
          published_at: '2026-08-24T10:00:00+07:00'
        }]
      }])
    ],
    'without a new reporting/research source from a previously unseen publisher host'
  );
  expectFailure(
    'independent confirmation chronology',
    [
      makeEdition('2026-08-24', [contextAlpha]),
      makeEdition('2026-08-25', [{
        ...contextAlpha,
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'An older article was newly attached but cannot confirm the event later.',
        update_kind: 'independent-confirmation',
        sources: [{
          ...contextAlpha.sources[0],
          label: 'Older synthetic reporting',
          url: 'https://older-report.example.test/alpha',
          type: 'reporting',
          published_at: '2026-08-23T09:00:00+07:00'
        }]
      }])
    ],
    'without a new reporting/research source from a previously unseen publisher host'
  );
  validateNewsQuality([
    makeEdition('2026-08-24', [alpha]),
    makeEdition('2026-08-25', [{
      ...alpha,
      published_at: '2026-08-24T10:00:00+07:00',
      material_update: 'A second publisher independently confirmed the original vendor announcement.',
      update_kind: 'independent-confirmation',
      sources: [{
        ...alpha.sources[0],
        label: 'Synthetic independent source',
        url: 'https://independent.example.test/alpha-confirmation',
        type: 'reporting',
        published_at: '2026-08-24T10:00:00+07:00'
      }]
    }])
  ]);
  expectFailure(
    'update kind signature consistency',
    [
      makeEdition('2026-08-24', [alpha]),
      makeEdition('2026-08-25', [{
        ...alpha,
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'The vendor says availability changed but the structured identity stayed identical.',
        update_kind: 'availability-change',
        sources: [{ ...alpha.sources[0], published_at: '2026-08-24T10:00:00+07:00' }]
      }])
    ],
    'without the kind-specific semantic event_signature delta'
  );
  const pricingEvent = makeBrief({
    eventId: 'acme-nova-price-event',
    title: 'Acme publishes the Nova commercial terms',
    url: 'https://example.test/nova-pricing',
    signature: { organization: 'acme', product: 'nova', action: 'release', artifact: 'commercial-price' }
  });
  expectFailure(
    'pricing update semantic consistency',
    [
      makeEdition('2026-08-24', [pricingEvent]),
      makeEdition('2026-08-25', [{
        ...pricingEvent,
        event_signature: { ...pricingEvent.event_signature, action: 'launch' },
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'The item changes an action label but provides no actual pricing delta.',
        update_kind: 'pricing-change',
        sources: [{ ...pricingEvent.sources[0], published_at: '2026-08-24T10:00:00+07:00' }]
      }])
    ],
    'without the kind-specific semantic event_signature delta'
  );
  expectFailure(
    'material update classification',
    [
      makeEdition('2026-08-24', [alpha]),
      makeEdition('2026-08-25', [{
        ...alpha,
        published_at: '2026-08-24T10:00:00+07:00',
        material_update: 'The vendor published a corrected artifact with a new availability status.',
        sources: [{ ...alpha.sources[0], published_at: '2026-08-24T10:00:00+07:00' }]
      }])
    ],
    '.update_kind must classify material_update'
  );
  expectFailure(
    'meaningful dedupe override',
    [makeEdition('2026-08-24', [{ ...alpha, dedupe_override_reason: 'x' }])],
    'dedupe_override_reason must explain the concrete distinction'
  );
  const overrideReason = 'This is a separate artifact with an independently scoped release record.';
  const overrideEditions = [makeEdition('2026-08-24', [{ ...alpha, dedupe_override_reason: overrideReason }])];
  const overrideIndex = buildIndex(overrideEditions, validateNewsQuality(overrideEditions), 1);
  if (overrideIndex.events[0].occurrences[0].dedupe_override_reason !== overrideReason) {
    throw new Error('Self-test "dedupe override index memory" did not preserve the override rationale');
  }
}

async function run() {
  const mode = process.argv[2] ?? '--check';
  if (!['--check', '--write', '--self-test'].includes(mode)) {
    throw new Error('Usage: node scripts/news-quality.mjs [--check|--write|--self-test]');
  }
  if (mode === '--self-test') {
    runSelfTest();
    console.log('News quality self-test passed.');
    return;
  }

  const [editions, sourceRegistry] = await Promise.all([loadEditions(), loadSourceRegistry()]);
  const entries = validateNewsQuality(editions);
  const expected = JSON.stringify(buildIndex(editions, entries, sourceRegistry.sources.length), null, 2) + '\n';

  if (mode === '--write') {
    await mkdir(path.dirname(indexPath), { recursive: true });
    await writeFile(indexPath, expected, 'utf8');
    console.log('Wrote data/news-index.json with ' + entries.length + ' event occurrences and ' + sourceRegistry.sources.length + ' research sources.');
    return;
  }

  let actual;
  try {
    actual = await readFile(indexPath, 'utf8');
  } catch {
    throw new Error('data/news-index.json is missing. Run npm run news:index after editing content.');
  }
  if (actual.replace(/\r\n?/g, '\n') !== expected) {
    throw new Error('data/news-index.json is stale. Run npm run news:index and commit the result.');
  }
  console.log('News quality passed for ' + editions.length + ' editions, ' + entries.length + ' event occurrences, and ' + sourceRegistry.sources.length + ' research sources.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
