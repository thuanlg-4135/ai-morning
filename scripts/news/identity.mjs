import { canonicalUrl } from './canonical-url.mjs';
import { exactTimestamp, calendarDate } from './time.mjs';
import { STABLE_IDENTIFIER, hasText, isRecord, wordCount } from './utils.mjs';

export const SIGNATURE_FIELDS = Object.freeze(['organization', 'product', 'action', 'artifact']);
const AVAILABILITY_STAGE_ACTIONS = new Set(['preview', 'beta', 'general-availability', 'production', 'deployment']);
const STATUS_STAGE_ACTIONS = new Set([...AVAILABILITY_STAGE_ACTIONS, 'deprecation', 'shutdown', 'incident', 'incident-resolution']);
const SIGNATURE_STOP_WORDS = {
  organization: new Set(['ai', 'the', 'inc', 'incorporated', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited', 'llc', 'labs', 'lab']),
  product: new Set(['ai', 'agent', 'agents', 'platform', 'runtime', 'service', 'services', 'framework', 'sdk', 'api', 'tool', 'tools', 'system', 'engine']),
  artifact: new Set(['ai', 'agent', 'agents', 'release', 'update', 'version', 'announcement', 'availability', 'general'])
};
const ACTION_FAMILIES = new Map([
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
const STOP_WORDS = new Set([
  'ai', 'agent', 'agents', 'cua', 'cho', 'cac', 'nhung', 'mot', 'voi', 'trong', 'tren', 'duoc',
  'dang', 'nay', 'the', 'khi', 'khong', 'tu', 'va', 'la', 'co', 've', 'vao', 'them', 'new',
  'today', 'context', 'release', 'released', 'update', 'updates', 'from', 'with', 'that', 'this',
  'the', 'for', 'and', 'are', 'has', 'have', 'its', 'now'
]);
const TOPICAL_STOP_WORDS = new Set([
  'add', 'adds', 'added', 'announce', 'announces', 'announced', 'become', 'becomes', 'became',
  'introduce', 'introduces', 'introduced', 'launch', 'launches', 'launched', 'present', 'presents',
  'presented', 'publish', 'publishes', 'published', 'release', 'releases', 'released', 'support',
  'supports', 'supported', 'available', 'availability', 'capability', 'feature'
]);

export function normalizeText(value) {
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
  return new Set(normalizeText(value).split(/\s+/).filter((token) => token.length >= 3 && !STOP_WORDS.has(token)));
}

function tokenSimilarity(left, right) {
  if (left.size === 0 || right.size === 0) return { score: 0, shared: 0 };
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return { score: shared / (left.size + right.size - shared), shared };
}

export function titleSimilarity(left, right) {
  return tokenSimilarity(titleTokens(left), titleTokens(right));
}

export function meaningfulReason(value) {
  return hasText(value) && value.trim().length >= 40 && wordCount(value) >= 8;
}

export function componentTokens(value, field) {
  const ignored = SIGNATURE_STOP_WORDS[field] ?? new Set();
  const normalized = normalizeText(value).split(/\s+/).filter(Boolean);
  const tokens = normalized.filter((token) => !ignored.has(token));
  return new Set(tokens.length > 0 ? tokens : normalized);
}

export function componentsRelated(left, right, field) {
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

export function artifactSimilarity(left, right) {
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

export function topicalSimilarity(title, signature, otherTitle, otherSignature) {
  const tokensFor = (value, eventIdentity) => {
    const tokens = titleTokens(value);
    for (const field of ['organization', 'product', 'action']) {
      for (const token of componentTokens(eventIdentity[field], field)) tokens.delete(token);
    }
    for (const token of TOPICAL_STOP_WORDS) tokens.delete(token);
    return tokens;
  };
  return tokenSimilarity(tokensFor(title, signature), tokensFor(otherTitle, otherSignature));
}

export function actionFamily(value) {
  const tokens = componentTokens(value, 'action');
  for (const [family, aliases] of ACTION_FAMILIES) {
    if ([...tokens].some((token) => aliases.has(token))) return family;
  }
  return [...tokens].join('-');
}

export function eventSignature(item) {
  if (!isRecord(item?.event_signature)) return null;
  if (SIGNATURE_FIELDS.some((field) => !hasText(item.event_signature[field]) || !STABLE_IDENTIFIER.test(item.event_signature[field]))) {
    return null;
  }
  return Object.fromEntries(SIGNATURE_FIELDS.map((field) => [field, item.event_signature[field]]));
}

export function signatureKey(signature) {
  return SIGNATURE_FIELDS.map((field) => signature[field]).join('|');
}

export function updateSignatureIsConsistent(kind, previous, later) {
  const actionChanged = previous.action !== later.action;
  const artifactChanged = previous.artifact !== later.artifact;
  if (kind === 'availability-change') {
    return artifactChanged || (
      actionChanged && AVAILABILITY_STAGE_ACTIONS.has(previous.action) && AVAILABILITY_STAGE_ACTIONS.has(later.action)
    );
  }
  if (kind === 'status-change') {
    return artifactChanged || (
      actionChanged && STATUS_STAGE_ACTIONS.has(previous.action) && STATUS_STAGE_ACTIONS.has(later.action)
    );
  }
  if (kind === 'version-change' || kind === 'scope-change') return artifactChanged;
  if (kind === 'pricing-change') return later.action === 'pricing' && artifactChanged;
  if (kind === 'incident-resolution') {
    return later.action === 'incident-resolution' && (actionChanged || artifactChanged);
  }
  return true;
}

export function sourceEvidence(item) {
  const evidence = [];
  for (const source of Array.isArray(item?.sources) ? item.sources : []) {
    if (!hasText(source?.url)) continue;
    try {
      evidence.push({ url: canonicalUrl(source.url), type: source.type, published_at: source.published_at });
    } catch {
      // Structural URL errors are reported by the shared schema validator.
    }
  }
  return evidence;
}

export function sourceUrlSet(item) {
  return new Set(sourceEvidence(item).map((source) => source.url));
}

export function publicationSortValue(value) {
  const exact = exactTimestamp(value);
  if (exact) return exact.valueOf();
  const date = calendarDate(value);
  return date ? new Date(date + 'T00:00:00Z').valueOf() : Number.POSITIVE_INFINITY;
}

export function itemTitle(section, item) {
  if (section === 'brief' || section === 'trends') return item.title;
  if (section === 'releases') return [item.product, item.feature].filter(hasText).join(' — ');
  return item.text;
}

export function itemBody(section, item) {
  if (section === 'brief') return item.text;
  if (section === 'trends') return Array.isArray(item.paragraphs) ? item.paragraphs.join(' ') : '';
  if (section === 'releases') {
    return [item.summary, item.what_changed, item.who_gets_it, item.why_it_matters, item.verdict_note].filter(hasText).join(' ');
  }
  return item.text;
}

export function editionItems(edition) {
  return ['brief', 'trends', 'releases', 'radar'].flatMap((section) => {
    const values = Array.isArray(edition[section]) ? edition[section] : [];
    return values.map((item, index) => ({
      edition,
      section,
      index,
      item,
      file: 'content/' + edition.edition_date + '.json',
      field: section + '[' + index + ']',
      title: itemTitle(section, item),
      body: itemBody(section, item)
    }));
  });
}
