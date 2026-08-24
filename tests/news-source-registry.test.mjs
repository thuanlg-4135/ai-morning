import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateSourceRegistry } from '../scripts/news/source-registry.mjs';

const registry = JSON.parse(await readFile(new URL('../config/news-sources.json', import.meta.url), 'utf8'));

test('current config-only source registry is valid', () => {
  assert.deepEqual(validateSourceRegistry(registry), []);
});

test('source registry rejects duplicate IDs and canonical tracking variants', () => {
  const fixture = structuredClone(registry);
  fixture.sources.push({
    ...fixture.sources[0],
    url: fixture.sources[0].url + '?utm_source=duplicate'
  });
  const codes = new Set(validateSourceRegistry(fixture).map((error) => error.code));
  assert(codes.has('DUPLICATE_REGISTRY_ID'));
  assert(codes.has('DUPLICATE_REGISTRY_URL'));
});

test('source registry enforces tier-three discovery shape', () => {
  const fixture = {
    schema_version: 1,
    sources: [{ id: 'bad-source', name: 'Bad source', tier: 3, kind: 'official', topics: [], url: 'ftp://example.test' }]
  };
  const codes = new Set(validateSourceRegistry(fixture).map((error) => error.code));
  assert(codes.has('INVALID_DISCOVERY_TIER'));
  assert(codes.has('INVALID_REGISTRY_TOPICS'));
  assert(codes.has('INVALID_REGISTRY_URL'));
});
