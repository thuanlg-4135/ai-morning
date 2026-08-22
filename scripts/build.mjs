import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderVisual } from './visuals.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentDir = path.join(repoRoot, 'content');
const templatesDir = path.join(repoRoot, 'templates');
const assetsDir = path.join(repoRoot, 'assets');
const distDir = path.join(repoRoot, 'dist');

const requiredFields = [
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

const freshnessValues = new Set(['NEW_TODAY', 'CONTEXT_72H']);
const verdictValues = new Set(['TRY_NOW', 'WATCH', 'SKIP_FOR_NOW']);
const sourceTypes = new Set(['official', 'research', 'reporting']);
const radarStatuses = new Set(['CONFIRMED', 'WATCH', 'LIKELY', 'SPECULATION']);
const verdictLabels = {
  TRY_NOW: 'TRY NOW',
  WATCH: 'WATCH',
  SKIP_FOR_NOW: 'SKIP FOR NOW'
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateSource(source, field, errors) {
  if (!isRecord(source)) {
    errors.push('invalid field "' + field + '": expected object');
    return;
  }
  if (!hasText(source.label)) errors.push('missing required field "' + field + '.label"');
  if (!hasText(source.url)) {
    errors.push('missing required field "' + field + '.url"');
  } else {
    try {
      const parsed = new URL(source.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
    } catch {
      errors.push('invalid field "' + field + '.url": expected http(s) URL');
    }
  }
  if (source.type !== undefined && !sourceTypes.has(source.type)) {
    errors.push('invalid field "' + field + '.type": expected official, research, or reporting');
  }
}

function validateFreshness(value, field, errors) {
  if (!freshnessValues.has(value)) {
    errors.push('invalid field "' + field + '": expected NEW_TODAY or CONTEXT_72H');
  }
}

function validateEdition(edition, filename) {
  const errors = [];
  if (!isRecord(edition)) {
    throw new Error('ERROR content/' + filename + ':\nexpected a JSON object');
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(edition, field) || edition[field] === null || edition[field] === '') {
      errors.push('missing required field "' + field + '"');
    }
  }

  if (edition.schema_version !== 1) {
    errors.push('invalid field "schema_version": expected 1');
  }

  if (!hasText(edition.edition_date) || !isValidDate(edition.edition_date)) {
    errors.push('invalid field "edition_date": expected YYYY-MM-DD');
  } else if (path.basename(filename, '.json') !== edition.edition_date) {
    errors.push('invalid field "edition_date": must match filename');
  }

  if (!hasText(edition.headline)) errors.push('invalid field "headline": expected non-empty string');
  if (!hasText(edition.dek)) errors.push('invalid field "dek": expected non-empty string');

  if (!Array.isArray(edition.brief) || edition.brief.length === 0) {
    errors.push('invalid field "brief": expected non-empty array');
  } else {
    edition.brief.forEach((item, index) => {
      const field = 'brief[' + index + ']';
      if (!isRecord(item)) {
        errors.push('invalid field "' + field + '": expected object');
        return;
      }
      validateFreshness(item.freshness, field + '.freshness', errors);
      if (!hasText(item.text)) errors.push('missing required field "' + field + '.text"');
    });
  }

  if (!Array.isArray(edition.trends) || edition.trends.length === 0) {
    errors.push('invalid field "trends": expected non-empty array');
  } else {
    edition.trends.forEach((trend, index) => {
      const field = 'trends[' + index + ']';
      if (!isRecord(trend)) {
        errors.push('invalid field "' + field + '": expected object');
        return;
      }
      validateFreshness(trend.freshness, field + '.freshness', errors);
      if (!hasText(trend.title)) errors.push('missing required field "' + field + '.title"');
      if (!Array.isArray(trend.paragraphs) || trend.paragraphs.length === 0 || trend.paragraphs.some((item) => !hasText(item))) {
        errors.push('invalid field "' + field + '.paragraphs": expected non-empty string array');
      }
      if (trend.sources !== undefined) {
        if (!Array.isArray(trend.sources)) {
          errors.push('invalid field "' + field + '.sources": expected array');
        } else {
          trend.sources.forEach((source, sourceIndex) => validateSource(source, field + '.sources[' + sourceIndex + ']', errors));
        }
      }
    });
  }

  if (!Array.isArray(edition.releases)) {
    errors.push('invalid field "releases": expected array');
  } else {
    edition.releases.forEach((release, index) => {
      const field = 'releases[' + index + ']';
      if (!isRecord(release)) {
        errors.push('invalid field "' + field + '": expected object');
        return;
      }
      for (const key of ['product', 'feature', 'status', 'summary', 'verdict', 'verdict_note']) {
        if (!hasText(release[key])) errors.push('missing required field "' + field + '.' + key + '"');
      }
      validateFreshness(release.freshness, field + '.freshness', errors);
      if (!verdictValues.has(release.verdict)) {
        errors.push('invalid field "' + field + '.verdict": expected TRY_NOW, WATCH, or SKIP_FOR_NOW');
      }
      if (release.sources !== undefined) {
        if (!Array.isArray(release.sources)) {
          errors.push('invalid field "' + field + '.sources": expected array');
        } else {
          release.sources.forEach((source, sourceIndex) => validateSource(source, field + '.sources[' + sourceIndex + ']', errors));
        }
      }
    });
  }

  if (!isRecord(edition.developer_memo)) {
    errors.push('invalid field "developer_memo": expected object');
  } else {
    for (const key of ['title', 'direct_answer']) {
      if (!hasText(edition.developer_memo[key])) errors.push('missing required field "developer_memo.' + key + '"');
    }
    for (const key of ['actions', 'avoid']) {
      if (!Array.isArray(edition.developer_memo[key]) || edition.developer_memo[key].some((item) => !hasText(item))) {
        errors.push('invalid field "developer_memo.' + key + '": expected string array');
      }
    }
  }

  if (!Array.isArray(edition.radar)) {
    errors.push('invalid field "radar": expected array');
  } else {
    edition.radar.forEach((item, index) => {
      const field = 'radar[' + index + ']';
      if (!isRecord(item)) {
        errors.push('invalid field "' + field + '": expected object');
        return;
      }
      if (!radarStatuses.has(item.status)) {
        errors.push('invalid field "' + field + '.status": expected CONFIRMED, WATCH, LIKELY, or SPECULATION');
      }
      if (!hasText(item.text)) errors.push('missing required field "' + field + '.text"');
    });
  }

  if (!hasText(edition.takeaway)) errors.push('invalid field "takeaway": expected non-empty string');

  if (errors.length > 0) {
    throw new Error('ERROR content/' + filename + ':\n' + errors.join('\n'));
  }
}

function formatDate(date) {
  const [year, month, day] = date.split('-');
  return day + '.' + month + '.' + year;
}

function weekdayLabel(date) {
  const labels = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return labels[new Date(date + 'T00:00:00Z').getUTCDay()];
}

function freshnessLabel(value) {
  return value === 'NEW_TODAY' ? 'NEW TODAY' : '72H CONTEXT';
}

function freshnessClass(value) {
  return value === 'NEW_TODAY' ? 'freshness--new' : 'freshness--context';
}

function renderFreshness(value, compact = false) {
  const label = compact && value === 'CONTEXT_72H' ? 'CONTEXT' : freshnessLabel(value);
  return '<span class="freshness ' + freshnessClass(value) + '">' + label + '</span>';
}

function renderSources(sources = []) {
  if (!Array.isArray(sources) || sources.length === 0) return '';
  const links = sources.map((source) => {
    const type = source.type ?? 'reporting';
    return '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="source-type">' + escapeHtml(type) + '</span>' +
      escapeHtml(source.label) +
      '</a>';
  }).join('');
  return '<div class="sources" role="group" aria-label="Nguồn">' + links + '</div>';
}

function pageContext(kind, currentDate) {
  if (kind === 'latest') {
    return {
      kind,
      currentDate,
      assetPrefix: 'assets/',
      homeHref: './',
      archiveHref: 'archive/',
      dateHref: (date) => date + '/'
    };
  }
  if (kind === 'archive') {
    return {
      kind,
      currentDate: null,
      assetPrefix: '../assets/',
      homeHref: '../',
      archiveHref: './',
      dateHref: (date) => '../' + date + '/'
    };
  }
  return {
    kind,
    currentDate,
    assetPrefix: '../assets/',
    homeHref: '../',
    archiveHref: '../archive/',
    dateHref: (date) => '../' + date + '/'
  };
}

function renderEditionsMenu(editions, context) {
  const latestCurrent = context.kind === 'latest' ? ' aria-current="page"' : '';
  const latest = '<a href="' + context.homeHref + '"' + latestCurrent + '><span class="editions__date">Latest</span><span>Bản tin mới nhất</span></a>';
  const dated = editions.slice(0, 5).map((edition) => {
    const current = context.kind === 'dated' && context.currentDate === edition.edition_date
      ? ' aria-current="page"'
      : '';
    return '<a href="' + context.dateHref(edition.edition_date) + '"' + current + '>' +
      '<span class="editions__date">' + formatDate(edition.edition_date) + '</span>' +
      '<span>' + escapeHtml(edition.headline) + '</span></a>';
  }).join('');
  const archiveCurrent = context.kind === 'archive' ? ' aria-current="page"' : '';
  const archive = '<a href="' + context.archiveHref + '"' + archiveCurrent + '><span class="editions__date">Tất cả</span><span>Xem toàn bộ editions →</span></a>';
  return latest + dated + archive;
}

function hasNewToday(edition) {
  return [...edition.brief, ...edition.trends, ...edition.releases]
    .some((item) => item.freshness === 'NEW_TODAY');
}

function renderHero(edition, context) {
  const meta = isRecord(edition.meta) ? edition.meta : {};
  const scanHours = Number.isFinite(meta.primary_scan_hours) ? meta.primary_scan_hours : 24;
  const contextHours = Number.isFinite(meta.context_window_hours) ? meta.context_window_hours : 72;
  const readingMinutes = Number.isFinite(meta.reading_minutes) ? meta.reading_minutes : 6;
  const policy = meta.source_policy === 'official-first' ? 'Ưu tiên nguồn chính thức' : 'Nguồn đã đối chiếu';
  const editionState = context.kind === 'latest' ? 'LATEST EDITION' : 'HISTORICAL SNAPSHOT';
  const newToday = hasNewToday(edition) ? renderFreshness('NEW_TODAY') : '';
  const visual = renderVisual(edition.hero_visual, { hero: true });
  const heroClass = edition.headline.length > 72 ? 'hero hero--long-title' : 'hero';

  return [
    '<header class="' + heroClass + '">',
    '  <div class="hero__grid">',
    '    <div>',
    '      <div class="freshness-strip"><span class="edition-state">' + editionState + '</span>' + newToday + '<span>24H NEWS · 72H CONTEXT</span></div>',
    '      <p class="eyebrow">Daily AI catch-up · ' + formatDate(edition.edition_date) + '</p>',
    '      <h1>' + escapeHtml(edition.headline) + '</h1>',
    '      <p class="dek">' + escapeHtml(edition.dek) + '</p>',
    '      <div class="meta" role="group" aria-label="Thông tin bài viết">',
    '        <span>Quét ' + scanHours + ' giờ · đối chiếu ' + contextHours + ' giờ</span>',
    '        <span>' + readingMinutes + ' phút đọc</span>',
    '        <span>' + policy + '</span>',
    '      </div>',
    '    </div>',
    '    ' + visual,
    '  </div>',
    '</header>'
  ].join('\n');
}

function renderBriefing(edition) {
  const items = edition.brief.map((item) =>
    '<li><span class="briefing__freshness">' + renderFreshness(item.freshness, true) + '</span><span>' + escapeHtml(item.text) + '</span></li>'
  ).join('');
  return [
    '<section class="briefing" aria-labelledby="briefing-title">',
    '  <h2 class="section-label" id="briefing-title">60 giây<br>nắm bắt</h2>',
    '  <ol>' + items + '</ol>',
    '</section>'
  ].join('\n');
}

function renderTrends(edition) {
  const trends = edition.trends.map((trend, trendIndex) => {
    const paragraphs = trend.paragraphs.map((paragraph, paragraphIndex) => {
      const leadClass = trendIndex === 0 && paragraphIndex === 0 ? ' class="lead"' : '';
      return '<p' + leadClass + '>' + escapeHtml(paragraph) + '</p>';
    }).join('');
    const pullquote = hasText(trend.pullquote)
      ? '<blockquote class="pullquote">' + escapeHtml(trend.pullquote) + '</blockquote>'
      : '';
    const action = hasText(trend.action)
      ? '<div class="action-note"><strong>What to do</strong><p>' + escapeHtml(trend.action) + '</p></div>'
      : '';
    const visual = isRecord(trend.visual) ? renderVisual(trend.visual) : '';
    const divider = trendIndex < edition.trends.length - 1 ? '<hr class="story-divider">' : '';
    const id = hasText(trend.id) ? ' id="trend-' + escapeHtml(trend.id) + '"' : '';

    return [
      '<section class="trend"' + id + '>',
      '  <div class="trend__meta">' + renderFreshness(trend.freshness) + (hasText(trend.strength) ? '<span>' + escapeHtml(trend.strength) + '</span>' : '') + '</div>',
      '  <h2>' + escapeHtml(trend.title) + '</h2>',
      '  ' + paragraphs,
      '  ' + pullquote,
      '  ' + visual,
      '  ' + action,
      '  ' + renderSources(trend.sources),
      '</section>',
      divider
    ].join('\n');
  }).join('\n');

  return '<section id="trends" aria-labelledby="trends-title">\n' +
    '<p class="eyebrow">AI trend &amp; industry shift</p>\n' +
    '<h2 class="section-intro" id="trends-title">Những chuyển động đáng đọc kỹ</h2>\n' +
    trends + '\n</section>';
}

function renderReleases(edition) {
  const releases = edition.releases.map((release) => {
    const whoGetsIt = hasText(release.who_gets_it)
      ? '<p class="release__audience"><strong>Phạm vi:</strong> ' + escapeHtml(release.who_gets_it) + '</p>'
      : '';
    return [
      '<section class="release">',
      '  <div class="release__head">',
      '    <div><p class="release__product">' + escapeHtml(release.product) + '</p><h3>' + escapeHtml(release.feature) + '</h3></div>',
      '    <div class="release__flags"><span class="status">' + escapeHtml(release.status) + '</span>' + renderFreshness(release.freshness, true) + '</div>',
      '  </div>',
      '  <p>' + escapeHtml(release.summary) + '</p>',
      '  ' + whoGetsIt,
      '  <p class="verdict"><strong>' + verdictLabels[release.verdict] + '</strong> · ' + escapeHtml(release.verdict_note) + '</p>',
      '  ' + renderSources(release.sources),
      '</section>'
    ].join('\n');
  }).join('\n');

  return '<section id="releases" aria-labelledby="release-title">\n' +
    '<p class="eyebrow">Release notebook</p>\n' +
    '<h2 id="release-title">Những feature mới đáng catch up</h2>\n' +
    '<div class="release-list">' + releases + '</div>\n' +
    '</section>';
}

function renderMemo(edition) {
  const memo = edition.developer_memo;
  const actions = memo.actions.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  const avoid = memo.avoid.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  return [
    '<section class="memo" id="developer" aria-labelledby="developer-title">',
    '  <p class="eyebrow">Developer memo</p>',
    '  <h2 id="developer-title">' + escapeHtml(memo.title) + '</h2>',
    '  <p class="direct-answer">' + escapeHtml(memo.direct_answer) + '</p>',
    '  <div class="memo__grid">',
    '    <div><h3>Nên làm</h3><ul>' + actions + '</ul></div>',
    '    <div><h3>Tránh</h3><ul>' + avoid + '</ul></div>',
    '  </div>',
    '</section>'
  ].join('\n');
}

function renderRadar(edition) {
  const items = edition.radar.map((item) =>
    '<li><strong>' + escapeHtml(item.status) + '</strong><span>' + escapeHtml(item.text) + '</span></li>'
  ).join('');
  return '<section id="radar" aria-labelledby="radar-title">\n' +
    '<p class="eyebrow">72-hour radar</p>\n' +
    '<h2 id="radar-title">Những tín hiệu cần tiếp tục nhìn</h2>\n' +
    '<ul class="radar-list">' + items + '</ul>\n' +
    '</section>';
}

function renderTakeaway(edition) {
  const text = edition.takeaway.replace(/^Nếu hôm nay chỉ nhớ một điều\s*:\s*/i, '');
  return '<section class="takeaway" aria-labelledby="takeaway-title">\n' +
    '<p class="eyebrow">One big takeaway</p>\n' +
    '<h2 id="takeaway-title">Nếu hôm nay chỉ nhớ một điều</h2>\n' +
    '<p>' + escapeHtml(text) + '</p>\n' +
    '</section>';
}

function renderRightRail(edition, editions, context) {
  const strengths = edition.trends.slice(0, 3).map((trend) =>
    '<p><strong>' + escapeHtml(trend.strength ?? 'WATCH') + '</strong><br>' + escapeHtml(trend.title) + '</p>'
  ).join('');
  const actions = edition.developer_memo.actions.slice(0, 2).map((item, index) =>
    '<p><strong>0' + (index + 1) + '</strong> ' + escapeHtml(item) + '</p>'
  ).join('');
  const recent = editions.slice(0, 3).map((item) =>
    '<a href="' + context.dateHref(item.edition_date) + '"><span>' + formatDate(item.edition_date) + '</span>' + escapeHtml(item.headline) + '</a>'
  ).join('');
  return [
    '<aside aria-label="Ghi chú nhanh">',
    '  <div class="rail">',
    '    <section class="rail__block"><h3>Trend strength</h3>' + strengths + '</section>',
    '    <section class="rail__block rail__block--surface"><h3>Try today</h3>' + actions + '</section>',
    '    <section class="rail__block"><h3>Recent editions</h3>' + recent + '<a href="' + context.archiveHref + '"><span>ARCHIVE</span>Xem tất cả editions →</a></section>',
    '  </div>',
    '</aside>'
  ].join('\n');
}

function renderArchiveRows(editions, context) {
  return editions.map((edition) => {
    const topics = [...new Set(edition.releases.map((release) => release.product))].slice(0, 3);
    const topicMarkup = topics.length > 0
      ? '<span class="edition-row__topics">' + topics.map((topic) => '<span>' + escapeHtml(topic) + '</span>').join('') + '</span>'
      : '';
    return [
      '<a class="edition-row" href="' + context.dateHref(edition.edition_date) + '">',
      '  <span class="edition-row__date">' + formatDate(edition.edition_date) + '<small>' + weekdayLabel(edition.edition_date) + '</small></span>',
      '  <div class="edition-row__copy">',
      '    <h2>' + escapeHtml(edition.headline) + '</h2>',
      '    <p>' + escapeHtml(edition.dek) + '</p>',
      '    ' + topicMarkup,
      '  </div>',
      '  <span class="edition-row__arrow" aria-hidden="true">→</span>',
      '</a>'
    ].join('\n');
  }).join('\n');
}

function fillTemplate(template, values, filename) {
  const rendered = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (!Object.hasOwn(values, key)) {
      throw new Error('Missing template value "' + key + '" for ' + filename);
    }
    return values[key];
  });
  if (/\{\{[A-Z0-9_]+\}\}/.test(rendered)) {
    throw new Error('Unresolved template token in ' + filename);
  }
  const clean = rendered.replace(/[ \t]+$/gm, '');
  return clean.endsWith('\n') ? clean : clean + '\n';
}

function renderArticlePage(template, edition, editions, context) {
  return fillTemplate(template, {
    PAGE_TITLE: escapeHtml('AI Morning · ' + formatDate(edition.edition_date)),
    DESCRIPTION: escapeHtml(edition.dek),
    ASSET_PREFIX: context.assetPrefix,
    PAGE_CLASS: context.kind === 'latest' ? 'edition-page edition-page--latest' : 'edition-page edition-page--historical',
    HOME_HREF: context.homeHref,
    EDITIONS_MENU: renderEditionsMenu(editions, context),
    HERO: renderHero(edition, context),
    BRIEFING: renderBriefing(edition),
    TRENDS: renderTrends(edition),
    RELEASES: renderReleases(edition),
    DEVELOPER_MEMO: renderMemo(edition),
    RADAR: renderRadar(edition),
    TAKEAWAY: renderTakeaway(edition),
    RIGHT_RAIL: renderRightRail(edition, editions, context),
    ARCHIVE_HREF: context.archiveHref
  }, 'article.html');
}

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  const entries = (await readdir(source, { withFileTypes: true }))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

async function loadEditions() {
  const filenames = (await readdir(contentDir))
    .filter((filename) => filename.endsWith('.json'))
    .sort();
  if (filenames.length === 0) throw new Error('No content/*.json editions found');

  const editions = [];
  for (const filename of filenames) {
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path.join(contentDir, filename), 'utf8'));
    } catch (error) {
      throw new Error('ERROR content/' + filename + ':\ninvalid JSON: ' + error.message);
    }
    validateEdition(parsed, filename);
    editions.push(parsed);
  }

  editions.sort((a, b) => b.edition_date.localeCompare(a.edition_date));
  return editions;
}

async function build() {
  const expectedDist = path.join(repoRoot, 'dist');
  if (distDir !== expectedDist || path.basename(distDir) !== 'dist') {
    throw new Error('Refusing to rebuild unexpected output path: ' + distDir);
  }

  const [editions, articleTemplate, archiveTemplate] = await Promise.all([
    loadEditions(),
    readFile(path.join(templatesDir, 'article.html'), 'utf8'),
    readFile(path.join(templatesDir, 'archive.html'), 'utf8')
  ]);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await copyDirectory(assetsDir, path.join(distDir, 'assets'));

  for (const edition of editions) {
    const outputDir = path.join(distDir, edition.edition_date);
    await mkdir(outputDir, { recursive: true });
    const html = renderArticlePage(articleTemplate, edition, editions, pageContext('dated', edition.edition_date));
    await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  }

  const latest = editions[0];
  await writeFile(
    path.join(distDir, 'index.html'),
    renderArticlePage(articleTemplate, latest, editions, pageContext('latest', latest.edition_date)),
    'utf8'
  );

  const archiveContext = pageContext('archive');
  const archiveHtml = fillTemplate(archiveTemplate, {
    EDITIONS_MENU: renderEditionsMenu(editions, archiveContext),
    EDITION_COUNT: editions.length + (editions.length === 1 ? ' edition' : ' editions'),
    ARCHIVE_ROWS: renderArchiveRows(editions, archiveContext)
  }, 'archive.html');
  const archiveDir = path.join(distDir, 'archive');
  await mkdir(archiveDir, { recursive: true });
  await writeFile(path.join(archiveDir, 'index.html'), archiveHtml, 'utf8');

  const outputStat = await stat(path.join(distDir, 'index.html'));
  if (!outputStat.isFile()) throw new Error('Build did not create dist/index.html');

  console.log('Built ' + editions.length + ' editions.');
  console.log('Latest: ' + latest.edition_date);
  console.log('Output: ' + path.relative(repoRoot, distDir).replaceAll(path.sep, '/') + '/');
}

build().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
