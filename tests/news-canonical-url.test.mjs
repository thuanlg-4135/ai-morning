import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalUrl } from '../scripts/news/canonical-url.mjs';

test('canonical URL removes tracking, fragments, www, default ports, and trailing slash', () => {
  assert.equal(
    canonicalUrl('http://WWW.Example.com:80/article/?utm_source=newsletter&FBCLID=abc#section'),
    'https://example.com/article'
  );
});

test('unknown identity parameters are preserved and sorted', () => {
  assert.equal(
    canonicalUrl('https://example.com/article?lang=vi&id=123&utm_campaign=morning'),
    'https://example.com/article?id=123&lang=vi'
  );
  assert.notEqual(
    canonicalUrl('https://example.com/article?id=123'),
    canonicalUrl('https://example.com/article?id=456')
  );
});

test('reordered and repeated parameters canonicalize deterministically', () => {
  assert.equal(
    canonicalUrl('https://example.com/a?tag=z&id=2&tag=a&id=1'),
    canonicalUrl('https://example.com/a?id=1&tag=a&id=2&tag=z')
  );
});

test('tracking-only variants merge without following redirects', () => {
  const base = canonicalUrl('https://example.com/release?id=7');
  assert.equal(canonicalUrl('https://example.com/release?id=7&utm_medium=email&gclid=abc'), base);
  assert.equal(canonicalUrl('https://example.com/release?id=7&mc_cid=x&mc_eid=y'), base);
});

test('host-specific identity parameters remain authoritative', () => {
  assert.equal(
    canonicalUrl('https://m.youtube.com/watch?t=12&v=video-b&utm_source=x'),
    'https://youtube.com/watch?v=video-b'
  );
  assert.equal(
    canonicalUrl('https://news.ycombinator.com/item?id=123&utm_source=x&foo=bar'),
    'https://news.ycombinator.com/item?id=123'
  );
  assert.equal(
    canonicalUrl('https://openreview.net/forum?noteId=ignored&id=paper-1'),
    'https://openreview.net/forum?id=paper-1'
  );
  assert.equal(
    canonicalUrl('https://papers.ssrn.com/sol3/papers.cfm?abstract_id=456&utm_term=ai'),
    'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=456'
  );
});

test('invalid protocols are rejected', () => {
  assert.throws(() => canonicalUrl('ftp://example.com/article'), /HTTP\(S\)/);
});
