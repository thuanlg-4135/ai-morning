import assert from 'node:assert/strict';
import test from 'node:test';
import { renderVisual } from '../scripts/visuals.mjs';

const image = {
  kind: 'image',
  src: 'editorial/example.webp',
  alt: 'A modular connection panel.',
  caption: 'An editorial image caption.'
};

test('hero raster visuals load eagerly with high fetch priority', () => {
  const html = renderVisual(image, { hero: true, assetPrefix: 'assets/' });
  assert.match(html, /src="assets\/editorial\/example\.webp"/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /fetchpriority="high"/);
  assert.match(html, /decoding="async"/);
});

test('inline raster visuals remain lazy-loaded', () => {
  const html = renderVisual(image, { assetPrefix: '../assets/' });
  assert.match(html, /src="\.\.\/assets\/editorial\/example\.webp"/);
  assert.match(html, /loading="lazy"/);
  assert.doesNotMatch(html, /fetchpriority="high"/);
});
