import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('single visual explainer uses the wide content tracks', async () => {
  const css = await readFile(new URL('assets/site.css', root), 'utf8');

  assert.match(
    css,
    /\.secondary-grid > \.story-shape:only-child > :is\(\.visual-explainer__composition, \.numbers-story__composition\)/
  );
});

test('scroll UI avoids the fixed grain layer and caches article measurements', async () => {
  const [articleTemplate, archiveTemplate, script] = await Promise.all([
    readFile(new URL('templates/article.html', root), 'utf8'),
    readFile(new URL('templates/archive.html', root), 'utf8'),
    readFile(new URL('assets/site.js', root), 'utf8')
  ]);

  assert.doesNotMatch(articleTemplate, /page-grain/);
  assert.doesNotMatch(archiveTemplate, /page-grain/);
  assert.match(script, /const measureProgress = \(\) =>/);
  assert.match(script, /new ResizeObserver\(measureLayout\)\.observe\(article\)/);
  assert.match(script, /requestAnimationFrame\(\(\) => \{/);
});
