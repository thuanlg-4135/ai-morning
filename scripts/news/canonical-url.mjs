import { hasText } from './utils.mjs';

const TRACKING_PARAMETERS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'mc_cid',
  'mc_eid'
]);

function sortedParameters(entries) {
  return [...entries].sort(([leftKey, leftValue], [rightKey, rightValue]) =>
    (leftKey === rightKey ? 0 : leftKey < rightKey ? -1 : 1) ||
    (leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1)
  );
}

function hostIdentityParameters(url) {
  const preserve = (keys) => keys.flatMap((key) => {
    const values = url.searchParams.getAll(key).filter(hasText);
    return values.map((value) => [key, value]);
  });

  if (['youtube.com', 'youtube-nocookie.com'].includes(url.hostname) && url.pathname === '/watch') {
    return preserve(['v']);
  }
  if (url.hostname === 'news.ycombinator.com' && url.pathname === '/item') return preserve(['id']);
  if (url.hostname === 'openreview.net' && url.pathname === '/forum') return preserve(['id']);
  if (url.hostname === 'papers.ssrn.com' && url.pathname.toLowerCase() === '/sol3/papers.cfm') {
    return preserve(['abstract_id']);
  }
  return null;
}

export function canonicalUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Source URL must use HTTP(S)');

  url.protocol = 'https:';
  url.hash = '';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (url.hostname === 'm.youtube.com') url.hostname = 'youtube.com';
  if (url.port === '80' || url.port === '443') url.port = '';

  const hostIdentity = hostIdentityParameters(url);
  const retained = hostIdentity ?? [...url.searchParams.entries()].filter(([key]) =>
    !TRACKING_PARAMETERS.has(key.toLowerCase())
  );
  const normalizedSearch = new URLSearchParams();
  for (const [key, parameterValue] of sortedParameters(retained)) normalizedSearch.append(key, parameterValue);
  url.search = normalizedSearch.toString();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString();
}

export { TRACKING_PARAMETERS };
