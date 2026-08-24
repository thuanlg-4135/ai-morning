import { readFile } from 'node:fs/promises';
import { canonicalUrl } from './canonical-url.mjs';
import { STABLE_IDENTIFIER, hasText, isRecord } from './utils.mjs';

function registryError(field, code, message) {
  return { level: 'error', code, file: 'config/news-sources.json', field, message };
}

export function validateSourceRegistry(registry) {
  const errors = [];
  if (!isRecord(registry) || registry.schema_version !== 1 || !Array.isArray(registry.sources) || registry.sources.length === 0) {
    return [registryError('', 'INVALID_SOURCE_REGISTRY', 'Expected schema_version 1 and a non-empty sources array.')];
  }
  const ids = new Set();
  const urls = new Set();
  registry.sources.forEach((source, index) => {
    const field = 'sources[' + index + ']';
    if (!isRecord(source)) {
      errors.push(registryError(field, 'INVALID_REGISTRY_SOURCE', 'Expected an object.'));
      return;
    }
    if (!hasText(source.id) || !STABLE_IDENTIFIER.test(source.id)) {
      errors.push(registryError(field + '.id', 'INVALID_REGISTRY_ID', 'Expected a kebab-case identifier.'));
    } else if (ids.has(source.id)) {
      errors.push(registryError(field + '.id', 'DUPLICATE_REGISTRY_ID', 'Duplicated source id: ' + source.id + '.'));
    }
    ids.add(source.id);
    if (!hasText(source.name)) errors.push(registryError(field + '.name', 'MISSING_REGISTRY_NAME', 'A source name is required.'));
    if (![1, 2, 3].includes(source.tier)) errors.push(registryError(field + '.tier', 'INVALID_REGISTRY_TIER', 'Expected tier 1, 2, or 3.'));
    if (!hasText(source.kind)) errors.push(registryError(field + '.kind', 'MISSING_REGISTRY_KIND', 'A source kind is required.'));
    if (source.tier === 3 && source.kind !== 'discovery') {
      errors.push(registryError(field + '.kind', 'INVALID_DISCOVERY_TIER', 'Tier 3 sources must use kind "discovery".'));
    }
    if (!Array.isArray(source.topics) || source.topics.length === 0 || source.topics.some((topic) => !hasText(topic))) {
      errors.push(registryError(field + '.topics', 'INVALID_REGISTRY_TOPICS', 'Expected a non-empty string array.'));
    }
    try {
      const url = canonicalUrl(source.url);
      if (urls.has(url)) errors.push(registryError(field + '.url', 'DUPLICATE_REGISTRY_URL', 'Duplicates canonical registry URL: ' + url + '.'));
      urls.add(url);
    } catch {
      errors.push(registryError(field + '.url', 'INVALID_REGISTRY_URL', 'Expected an HTTP(S) URL.'));
    }
  });
  return errors;
}

export function assertSourceRegistry(registry) {
  const errors = validateSourceRegistry(registry);
  if (errors.length > 0) {
    throw new Error(errors.map((error) =>
      'ERROR [' + error.code + '] ' + [error.file, error.field].filter(Boolean).join(' ') + '\n' + error.message
    ).join('\n\n'));
  }
  return registry;
}

export async function loadSourceRegistry(registryPath) {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  return assertSourceRegistry(registry);
}
