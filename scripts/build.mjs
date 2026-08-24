import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertEditionSchema, EDITION_MODES, IMPORTANCE_VALUES } from './news/schema.mjs';
import { renderVisual } from './visuals.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentDir = path.join(repoRoot, 'content');
const templatesDir = path.join(repoRoot, 'templates');
const assetsDir = path.join(repoRoot, 'assets');
const distDir = path.join(repoRoot, 'dist');

const editionModes = EDITION_MODES;
const importanceValues = IMPORTANCE_VALUES;
const monthNames = [
  'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
  'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
];
const verdictLabels = {
  TRY_NOW: 'TRY NOW',
  WATCH: 'WATCH',
  SKIP_FOR_NOW: 'SKIP FOR NOW'
};
const sourceTypeLabels = {
  official: 'Nguồn gốc',
  reporting: 'Đối chiếu',
  research: 'Nghiên cứu'
};
const modeLabels = {
  BIG: 'Ngày lớn',
  NORMAL: 'Số thường',
  QUIET: 'Ngày yên'
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const pad2 = (value) => String(value).padStart(2, '0');

function formatDate(date) {
  const [year, month, day] = date.split('-');
  return day + '.' + month + '.' + year;
}

function weekdayLabel(date) {
  const labels = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return labels[new Date(date + 'T00:00:00Z').getUTCDay()];
}

function longDate(date) {
  const [year, month, day] = date.split('-');
  return weekdayLabel(date) + ' · ' + Number(day) + ' ' + monthNames[Number(month) - 1] + ' · ' + year;
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
    const published = hasText(source.published_at) && /^\d{4}-\d{2}-\d{2}/.test(source.published_at)
      ? '<time datetime="' + escapeHtml(source.published_at) + '">' + formatDate(source.published_at.slice(0, 10)) + '</time>'
      : '';
    return '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="source-type">' + escapeHtml(sourceTypeLabels[type] ?? type) + '</span>' +
      '<span>' + escapeHtml(source.label) + '</span>' +
      published +
      '</a></li>';
  }).join('');
  return '<footer class="sources" aria-label="Nguồn kiểm chứng">' +
    '<p class="sources__label">Nguồn kiểm chứng · ' + sources.length + '</p><ol class="sources__items">' + links + '</ol></footer>';
}

function pageContext(kind, currentDate, language = 'vi') {
  if (language === 'en') {
    if (kind === 'latest') {
      return {
        kind,
        language,
        currentDate,
        assetPrefix: '../assets/',
        homeHref: './',
        archiveHref: 'archive/',
        languageSwitchHref: '../',
        dateHref: (date) => date + '/'
      };
    }
    if (kind === 'archive') {
      return {
        kind,
        language,
        currentDate: null,
        assetPrefix: '../../assets/',
        homeHref: '../',
        archiveHref: './',
        languageSwitchHref: '../../archive/',
        dateHref: (date) => '../' + date + '/'
      };
    }
    return {
      kind,
      language,
      currentDate,
      assetPrefix: '../../assets/',
      homeHref: '../',
      archiveHref: '../archive/',
      languageSwitchHref: '../../' + currentDate + '/',
      dateHref: (date) => '../' + date + '/'
    };
  }
  if (kind === 'latest') {
    return {
      kind,
      language,
      currentDate,
      assetPrefix: 'assets/',
      homeHref: './',
      archiveHref: 'archive/',
      languageSwitchHref: 'en/',
      dateHref: (date) => date + '/'
    };
  }
  if (kind === 'archive') {
    return {
      kind,
      language,
      currentDate: null,
      assetPrefix: '../assets/',
      homeHref: '../',
      archiveHref: './',
      languageSwitchHref: '../en/archive/',
      dateHref: (date) => '../' + date + '/'
    };
  }
  return {
    kind,
    language,
    currentDate,
    assetPrefix: '../assets/',
    homeHref: '../',
    archiveHref: '../archive/',
    languageSwitchHref: '../en/' + currentDate + '/',
    dateHref: (date) => '../' + date + '/'
  };
}

function editionNumber(edition, editions) {
  if (Number.isFinite(edition.edition_number)) return edition.edition_number;
  const chronological = [...editions].sort((a, b) => a.edition_date.localeCompare(b.edition_date));
  return chronological.findIndex((item) => item.edition_date === edition.edition_date) + 1;
}

function inferEditionMode(edition) {
  if (editionModes.has(edition.edition_mode)) return edition.edition_mode;
  const haystack = (edition.headline + ' ' + edition.dek).toLowerCase();
  if (/không có (một )?frontier|không có.*launch|no major model|không có.*tiêu điểm/.test(haystack)) {
    return 'QUIET';
  }
  const newCount = [...edition.brief, ...edition.trends, ...edition.releases]
    .filter((item) => item.freshness === 'NEW_TODAY').length;
  if (edition.headline.length <= 42 && newCount >= 4) return 'BIG';
  return 'NORMAL';
}

function readingMinutes(edition) {
  const meta = isRecord(edition.meta) ? edition.meta : {};
  return Number.isFinite(meta.reading_minutes) ? meta.reading_minutes : 6;
}

function frontBriefs(edition) {
  return edition.brief.slice(0, 5);
}

function briefTitle(item) {
  if (hasText(item.title)) return item.title.trim();
  const text = item.text.trim();
  if (text.length <= 78) return text;
  const cut = text.slice(0, 74);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 36 ? cut.slice(0, lastSpace) : cut) + '…';
}

function briefBody(item) {
  if (hasText(item.title) && hasText(item.text)) return item.text.trim();
  return '';
}

function trendImportance(trend, index) {
  if (importanceValues.has(trend.importance)) return trend.importance;
  if (index === 0) return 'LEAD';
  if (index === 1) return 'SECONDARY';
  return 'BRIEF';
}

function oneNumber(edition) {
  if (isRecord(edition.one_number) && hasText(edition.one_number.value) && hasText(edition.one_number.label)) {
    return edition.one_number;
  }
  const withStat = edition.trends.find((trend) => isRecord(trend.stat) && hasText(trend.stat.value));
  return withStat ? withStat.stat : null;
}

function watchingItems(edition) {
  if (Array.isArray(edition.watching) && edition.watching.length > 0) {
    return edition.watching.slice(0, 5);
  }
  return edition.radar
    .filter((item) => item.status === 'WATCH' || item.status === 'LIKELY')
    .slice(0, 4)
    .map((item) => item.text);
}

function renderSectionTools(id, label) {
  return [
    '<div class="section-tools">',
    '  <button type="button" class="section-tool" data-copy-link="#' + escapeHtml(id) + '" aria-label="Sao chép liên kết ' + escapeHtml(label) + '">Sao chép link</button>',
    '  <button type="button" class="section-tool" data-bookmark="' + escapeHtml(id) + '" aria-pressed="false" aria-label="Lưu ' + escapeHtml(label) + ' để đọc sau">Lưu</button>',
    '</div>'
  ].join('\n');
}

function renderStat(stat, extraClass = '') {
  const unit = hasText(stat.unit) ? '<span class="stat-break__unit">' + escapeHtml(stat.unit) + '</span>' : '';
  const context = hasText(stat.context) ? '<p class="stat-break__context">' + escapeHtml(stat.context) + '</p>' : '';
  return [
    '<aside class="stat-break' + (extraClass ? ' ' + extraClass : '') + '">',
    '  <p class="stat-break__value">' + escapeHtml(stat.value) + unit + '</p>',
    '  <p class="stat-break__label">' + escapeHtml(stat.label) + '</p>',
    '  ' + context,
    '</aside>'
  ].join('\n');
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

function renderDateline(edition, editions, context) {
  const mode = inferEditionMode(edition);
  const number = editionNumber(edition, editions);
  const state = context.kind === 'latest' ? 'Số mới' : 'Bản lưu';
  return [
    '<div class="dateline">',
    '  <p class="dateline__date"><span class="dateline__date-long">' + longDate(edition.edition_date) + '</span><span class="dateline__date-short">' + formatDate(edition.edition_date) + '</span></p>',
    '  <p class="dateline__meta">',
    '    <span>Số ' + pad2(number) + '</span>',
    '    <span>' + modeLabels[mode] + '</span>',
    '    <span>' + readingMinutes(edition) + ' phút đọc</span>',
    '    <span class="dateline__state">' + state + '</span>',
    '  </p>',
    '</div>'
  ].join('\n');
}

function renderHero(edition, context) {
  const meta = isRecord(edition.meta) ? edition.meta : {};
  const scanHours = Number.isFinite(meta.primary_scan_hours) ? meta.primary_scan_hours : 24;
  const contextHours = Number.isFinite(meta.context_window_hours) ? meta.context_window_hours : 72;
  const policy = meta.source_policy === 'official-first' ? 'Ưu tiên nguồn chính thức' : 'Nguồn đã đối chiếu';
  const mode = inferEditionMode(edition);
  const newToday = hasNewToday(edition) ? renderFreshness('NEW_TODAY') : '';
  const visual = isRecord(edition.hero_visual) ? renderVisual(edition.hero_visual, { hero: true, assetPrefix: context.assetPrefix }) : '';
  const longTitle = edition.headline.length > 72 ? ' hero--long-title' : '';
  const metaRow = [
    '<div class="meta" role="group" aria-label="Thông tin bài viết">',
    '  <span>Quét ' + scanHours + ' giờ · đối chiếu ' + contextHours + ' giờ</span>',
    '  <span>' + readingMinutes(edition) + ' phút đọc</span>',
    '  <span>' + policy + '</span>',
    '</div>'
  ].join('\n');

  if (mode === 'QUIET') {
    const heroBriefs = frontBriefs(edition).slice(0, 3);
    const instead = heroBriefs.map((item, index) =>
      '<li><span class="hero__instead-index">' + pad2(index + 1) + '</span><div><strong>' +
      escapeHtml(briefTitle(item)) + '</strong>' +
      (briefBody(item) ? '<span>' + escapeHtml(briefBody(item)) + '</span>' : '') +
      renderSources(item.sources) +
      '</div></li>'
    ).join('');
    return [
      '<header class="hero hero--quiet' + longTitle + '">',
      '  <div class="freshness-strip"><span class="edition-state">' + modeLabels[mode] + '</span>' + newToday + '<span>Không có launch lớn</span></div>',
      '  <h1 id="edition-title">' + escapeHtml(edition.headline) + '</h1>',
      '  <p class="dek">' + escapeHtml(edition.dek) + '</p>',
      '  ' + metaRow,
      '  <div class="hero__instead-wrap" id="briefing" data-scroll-section>',
      '    <p class="section-label">Việc đáng đọc thay thế</p>',
      '    <ol class="hero__instead hero__instead--count-' + heroBriefs.length + '">' + instead + '</ol>',
      '  </div>',
      '  ' + visual,
      '</header>'
    ].join('\n');
  }

  if (mode === 'BIG') {
    return [
      '<header class="hero hero--big' + longTitle + '">',
      '  <div class="freshness-strip"><span class="edition-state">' + modeLabels[mode] + '</span>' + newToday + '<span>24H NEWS · 72H CONTEXT</span></div>',
      '  <h1 id="edition-title">' + escapeHtml(edition.headline) + '</h1>',
      '  <p class="dek">' + escapeHtml(edition.dek) + '</p>',
      '  ' + metaRow,
      '  ' + visual,
      '</header>'
    ].join('\n');
  }

  return [
    '<header class="hero hero--normal' + longTitle + '">',
    '  <div class="freshness-strip"><span class="edition-state">' + modeLabels[mode] + '</span>' + newToday + '<span>24H NEWS · 72H CONTEXT</span></div>',
    '  <h1 id="edition-title">' + escapeHtml(edition.headline) + '</h1>',
    '  <p class="dek">' + escapeHtml(edition.dek) + '</p>',
    '  ' + visual,
    '  ' + metaRow,
    '</header>'
  ].join('\n');
}

function renderBriefing(edition, { start = 0, max = 5, compact = false, id = 'briefing' } = {}) {
  const selected = edition.brief.slice(start, start + max);
  if (selected.length === 0) return '';
  const items = selected.map((item) => {
    const body = briefBody(item);
    return '<li>' +
      '<span class="briefing__freshness">' + renderFreshness(item.freshness, true) + '</span>' +
      '<div class="briefing__copy"><strong>' + escapeHtml(briefTitle(item)) + '</strong>' +
      (body ? '<span>' + escapeHtml(body) + '</span>' : '') +
      renderSources(item.sources) +
      '</div></li>';
  }).join('');
  return [
    '<section class="briefing' + (compact ? ' briefing--compact' : '') + ' briefing--count-' + selected.length + '" id="' + escapeHtml(id) + '" aria-labelledby="' + escapeHtml(id) + '-title" data-scroll-section>',
    '  <h2 class="section-label" id="' + escapeHtml(id) + '-title">' + (start > 0 ? 'Còn lại trong<br>60 giây' : '60 giây<br>nắm bắt') + '</h2>',
    '  <ol>' + items + '</ol>',
    '</section>'
  ].join('\n');
}

function trendShape(trend, index, { compact = false } = {}) {
  const importance = trendImportance(trend, index);
  if (compact && importance !== 'LEAD') return 'news-brief';
  if (trend.layout_hint === 'visual_explainer') return 'visual-explainer';
  if (importance === 'LEAD') return 'lead-story';
  if (isRecord(trend.stat) && !isRecord(trend.visual)) return 'by-the-numbers';
  if (isRecord(trend.visual)) return 'visual-explainer';
  if (importance === 'BRIEF') return 'news-brief';
  return 'secondary-story';
}

function renderTrendHeader(trend, id, shape, index) {
  const heading = 'h3';
  const published = hasText(trend.published_at) && /^\d{4}-\d{2}-\d{2}/.test(trend.published_at)
    ? '<time datetime="' + escapeHtml(trend.published_at) + '">' + formatDate(trend.published_at.slice(0, 10)) + '</time>'
    : '';
  const evidenceCount = Array.isArray(trend.sources) && trend.sources.length > 0
    ? '<span>' + trend.sources.length + ' nguồn</span>'
    : '';
  return [
    '<header class="story-shape__header">',
    '  <div class="story-shape__topline">',
    '    <div class="trend__meta">' + renderFreshness(trend.freshness) + (hasText(trend.strength) ? '<span>' + escapeHtml(trend.strength) + '</span>' : '') + published + evidenceCount + '</div>',
    '    <span class="story-index">Phân tích ' + pad2(index + 1) + '</span>',
    '  </div>',
    '  <' + heading + ' id="' + escapeHtml(id) + '-title">' + escapeHtml(trend.title) + '</' + heading + '>',
    '</header>',
    renderSectionTools(id, trend.title)
  ].join('\n');
}

function renderParagraphs(paragraphs, { lead = false } = {}) {
  return paragraphs.map((paragraph, index) =>
    '<p' + (lead && index === 0 ? ' class="lead"' : '') + '>' + escapeHtml(paragraph) + '</p>'
  ).join('\n');
}

function renderTrendStory(trend, index, options = {}) {
  const importance = trendImportance(trend, index);
  const shape = trendShape(trend, index, options);
  const compactSupporting = options.compact && importance !== 'LEAD';
  const id = hasText(trend.id) ? trend.id : 'trend-' + (index + 1);
  const statAsVisual = isRecord(trend.visual) && trend.visual.kind === 'stat' && isRecord(trend.stat);
  const visual = compactSupporting
    ? ''
    : statAsVisual
    ? renderStat(trend.stat, 'stat-break--visual')
    : (isRecord(trend.visual) ? renderVisual(trend.visual, { assetPrefix: options.assetPrefix }) : '');
  const quote = !compactSupporting && hasText(trend.pullquote)
    ? '<blockquote class="pullquote">' + escapeHtml(trend.pullquote) + '</blockquote>'
    : '';
  const stat = isRecord(trend.stat) && (!statAsVisual || compactSupporting) ? renderStat(trend.stat) : '';
  const action = !compactSupporting && hasText(trend.action)
    ? '<aside class="action-note"><strong>Việc nên thử</strong><p>' + escapeHtml(trend.action) + '</p></aside>'
    : '';
  const first = trend.paragraphs.slice(0, 1);
  const rest = trend.paragraphs.slice(1);
  let body;

  if (compactSupporting) {
    body = '<div class="story-prose">' + renderParagraphs(first) + stat + '</div>';
  } else if (shape === 'lead-story') {
    const openingClass = visual ? ' lead-story__opening--with-visual' : ' lead-story__opening--prose-only';
    const continuation = rest.length > 0
      ? '<div class="story-prose story-prose--continuation">' + renderParagraphs(rest) + '</div>'
      : '';
    const continuationBlock = continuation && quote
      ? '<div class="lead-story__continuation">' + continuation + quote + '</div>'
      : continuation + quote;
    body = [
      '<div class="lead-story__opening' + openingClass + '">',
      '  <div class="story-prose">' + renderParagraphs(first, { lead: true }) + '</div>',
      '  ' + visual,
      '</div>',
      stat,
      continuationBlock,
      action
    ].join('\n');
  } else if (shape === 'visual-explainer') {
    body = [
      '<div class="visual-explainer__composition">',
      '  ' + visual,
      '  <div class="story-prose">' + renderParagraphs(trend.paragraphs) + action + '</div>',
      '</div>',
      stat,
      quote
    ].join('\n');
  } else if (shape === 'by-the-numbers') {
    body = '<div class="numbers-story__composition">' + stat + '<div class="story-prose">' +
      renderParagraphs(trend.paragraphs) + action + '</div></div>' + quote;
  } else {
    const proseWithStat = stat
      ? renderParagraphs(first) + stat + renderParagraphs(rest)
      : renderParagraphs(trend.paragraphs);
    body = '<div class="story-prose">' + proseWithStat + '</div>' + quote + action + visual;
  }

  return [
    '<article class="story-shape ' + shape + ' trend--' + importance.toLowerCase() + '" id="' + escapeHtml(id) + '" aria-labelledby="' + escapeHtml(id) + '-title" data-scroll-section>',
    renderTrendHeader(trend, id, shape, index),
    body,
    renderSources(trend.sources),
    '</article>'
  ].join('\n');
}

function renderTrendDepartment(trends, allTrends, { compact = false, label = 'Phân tích', assetPrefix = '' } = {}) {
  if (trends.length === 0) return '';
  const stories = trends.map((trend) => renderTrendStory(trend, allTrends.indexOf(trend), { compact, assetPrefix })).join('\n');
  return '<section class="story-department' + (compact ? ' story-department--compact' : '') + '" id="trends" aria-labelledby="trends-title">\n' +
    '<header class="department-heading"><p>' + escapeHtml(label) + '</p><h2 id="trends-title">Những chuyển động đáng đọc kỹ</h2></header>\n' +
    stories + '\n</section>';
}

function renderSecondaryGrid(trends, allTrends, { compact = false, assetPrefix = '' } = {}) {
  if (trends.length === 0) return '';
  return '<section class="secondary-grid" aria-label="Các phân tích tiếp theo">' +
    trends.map((trend) => renderTrendStory(trend, allTrends.indexOf(trend), { compact, assetPrefix })).join('\n') +
    '</section>';
}

function releaseItemsForEdition(edition, { compact = false } = {}) {
  const lead = edition.trends.find((trend, index) => trendImportance(trend, index) === 'LEAD') ?? edition.trends[0];
  const leadSourceUrls = new Set((lead?.sources ?? []).map((source) => source.url));
  return compact
    ? edition.releases.filter((release) => !(release.sources ?? []).some((source) => leadSourceUrls.has(source.url)))
    : edition.releases;
}

function renderReleases(edition, { compact = false, assetPrefix = '' } = {}) {
  const releaseItems = releaseItemsForEdition(edition, { compact });
  if (releaseItems.length === 0) return '';
  const explicitFeaturedIndex = releaseItems.findIndex((release) => release.importance === 'LEAD');
  const featuredIndex = explicitFeaturedIndex >= 0
    ? explicitFeaturedIndex
    : releaseItems.findIndex((release) => release.verdict === 'TRY_NOW' && release.freshness === 'NEW_TODAY');
  const releases = releaseItems.map((release, index) => {
    const featured = index === featuredIndex;
    const whoGetsIt = hasText(release.who_gets_it)
      ? '<p class="release__audience"><strong>Phạm vi:</strong> ' + escapeHtml(release.who_gets_it) + '</p>'
      : '';
    const changed = hasText(release.what_changed) ? release.what_changed : '';
    const why = hasText(release.why_it_matters) ? release.why_it_matters : '';
    const visual = isRecord(release.visual) ? renderVisual(release.visual, { assetPrefix }) : '';
    const sources = renderSources(release.sources);
    const detailBlocks = [
      changed ? '<div class="release__detail"><p class="release__body-label">Thay đổi</p><p>' + escapeHtml(changed) + '</p></div>' : '',
      why ? '<div class="release__detail"><p class="release__body-label">Vì sao đáng chú ý</p><p>' + escapeHtml(why) + '</p></div>' : ''
    ].filter(Boolean);
    const details = detailBlocks.length > 0
      ? '<div class="release__details release__details--count-' + detailBlocks.length + '">' + detailBlocks.join('') + '</div>'
      : '';
    return [
      '<article class="release' + (featured ? ' release--featured' : '') + '" id="release-' + escapeHtml(release.event_id) + '" aria-labelledby="release-' + escapeHtml(release.event_id) + '-title">',
      '  <div class="release__head">',
      '    <div><p class="release__product">' + escapeHtml(release.product) + '</p><h3 id="release-' + escapeHtml(release.event_id) + '-title">' + escapeHtml(release.feature) + '</h3></div>',
      '    <div class="release__flags"><span class="status">' + escapeHtml(release.status) + '</span>' + renderFreshness(release.freshness, true) +
      (hasText(release.published_at) ? '<time datetime="' + escapeHtml(release.published_at) + '">' + formatDate(release.published_at.slice(0, 10)) + '</time>' : '') + '</div>',
      '  </div>',
      '  ' + visual,
      '  <div class="release__body">',
      '    <p class="release__summary">' + escapeHtml(release.summary) + '</p>',
      '    ' + details,
      '    <div class="release__decision"><p class="release__body-label">Khuyến nghị</p>' + whoGetsIt,
      '      <p class="verdict"><strong>' + verdictLabels[release.verdict] + '</strong> ' + escapeHtml(release.verdict_note) + '</p>' + sources + '</div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }).join('\n');

  const gridClass = releaseItems.length > 1 ? ' release-list--grid' : '';
  return '<section class="release-notebook' + (compact ? ' release-notebook--compact' : '') + '" id="releases" aria-labelledby="release-title" data-scroll-section>\n' +
    '<header class="department-heading"><p>Release notebook</p><h2 id="release-title">Những thay đổi đáng biết</h2></header>\n' +
    '<div class="release-list' + gridClass + '">' + releases + '</div>\n' +
    '</section>';
}

function renderMemo(edition) {
  const memo = edition.developer_memo;
  const actions = memo.actions.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  const avoid = memo.avoid.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  return [
    '<section class="memo" id="developer" aria-labelledby="developer-title" data-scroll-section>',
    '  <div class="memo__intro">',
    '    <div><p class="memo__kicker">Developer memo</p><h2 id="developer-title">' + escapeHtml(memo.title) + '</h2></div>',
    '    <p class="direct-answer">' + escapeHtml(memo.direct_answer) + '</p>',
    '  </div>',
    '  <div class="memo__grid">',
    '    <div class="memo-card memo-card--do"><h3>Nên làm</h3><ol>' + actions + '</ol></div>',
    '    <div class="memo-card memo-card--dont"><h3>Tránh</h3><ol>' + avoid + '</ol></div>',
    '  </div>',
    '</section>'
  ].join('\n');
}

function renderRadar(edition) {
  if (edition.radar.length === 0) return '';
  const items = edition.radar.map((item) =>
    '<li><strong>' + escapeHtml(item.status) + '</strong><div class="radar-list__copy"><span>' +
    escapeHtml(item.text) + '</span>' + renderSources(item.sources) + '</div></li>'
  ).join('');
  return '<section id="radar" aria-labelledby="radar-title" data-scroll-section>\n' +
    '<h2 id="radar-title">Những tín hiệu cần tiếp tục nhìn</h2>\n' +
    '<ul class="radar-list">' + items + '</ul>\n' +
    '</section>';
}

function renderWildcard(edition) {
  if (!isRecord(edition.wildcard) || !hasText(edition.wildcard.text)) return '';
  const title = hasText(edition.wildcard.title) ? edition.wildcard.title : 'Một góc lệch';
  return [
    '<section class="wildcard" id="wildcard" aria-labelledby="wildcard-title" data-scroll-section>',
    '  <h2 id="wildcard-title">' + escapeHtml(title) + '</h2>',
    '  <p>' + escapeHtml(edition.wildcard.text) + '</p>',
    '</section>'
  ].join('\n');
}

function renderTakeaway(edition) {
  const text = edition.takeaway.replace(/^(?:Nếu hôm nay chỉ nhớ một điều|If you remember one thing today)\s*:\s*/i, '');
  return '<section class="takeaway" id="takeaway" aria-labelledby="takeaway-title" data-scroll-section>\n' +
    '<h2 id="takeaway-title">Nếu hôm nay chỉ nhớ một điều</h2>\n' +
    '<p>' + escapeHtml(text) + '</p>\n' +
    '</section>';
}

function renderMemoRadarPair(edition) {
  const radar = renderRadar(edition);
  return '<div class="closing-grid' + (radar ? '' : ' closing-grid--memo-only') + '">' + renderMemo(edition) + radar + '</div>';
}

function renderEditionBody(edition, assetPrefix = '') {
  const mode = inferEditionMode(edition);
  const lead = edition.trends.find((trend, index) => trendImportance(trend, index) === 'LEAD') ?? edition.trends[0];
  const supporting = edition.trends.filter((trend) => trend !== lead);
  const rail = renderRightRail(edition);
  let briefing;
  let main;

  if (mode === 'QUIET') {
    briefing = renderBriefing(edition, { start: 3, max: 3, compact: true, id: 'briefing-more' });
    main = [
      renderTrendDepartment([lead], edition.trends, { label: 'Bài đọc chính', assetPrefix }),
      renderReleases(edition, { compact: true, assetPrefix }),
      renderSecondaryGrid(supporting, edition.trends, { compact: true, assetPrefix }),
      renderMemoRadarPair(edition),
      renderWildcard(edition),
      renderTakeaway(edition)
    ].join('\n');
  } else if (mode === 'BIG') {
    briefing = renderBriefing(edition);
    main = [
      renderTrendDepartment([lead], edition.trends, { label: 'Lead story', assetPrefix }),
      renderSecondaryGrid(supporting.slice(0, 2), edition.trends, { assetPrefix }),
      renderReleases(edition, { assetPrefix }),
      renderSecondaryGrid(supporting.slice(2), edition.trends, { assetPrefix }),
      renderMemoRadarPair(edition),
      renderWildcard(edition),
      renderTakeaway(edition)
    ].join('\n');
  } else {
    briefing = renderBriefing(edition);
    main = [
      renderTrendDepartment([lead], edition.trends, { label: 'Phân tích chính', assetPrefix }),
      renderReleases(edition, { assetPrefix }),
      renderSecondaryGrid(supporting, edition.trends, { assetPrefix }),
      renderMemoRadarPair(edition),
      renderWildcard(edition),
      renderTakeaway(edition)
    ].join('\n');
  }

  return [
    briefing,
    '<div class="edition-body edition-body--' + mode.toLowerCase() + '">',
    '  <div class="edition-body__main">' + main + '</div>',
    '  ' + rail,
    '</div>'
  ].join('\n');
}

function sectionIndexItems(edition) {
  const mode = inferEditionMode(edition);
  const lead = edition.trends.find((trend, index) => trendImportance(trend, index) === 'LEAD') ?? edition.trends[0];
  const supporting = edition.trends.filter((trend) => trend !== lead);
  const trendItem = (trend) => {
    const index = edition.trends.indexOf(trend);
    const id = hasText(trend?.id) ? trend.id : 'trend-' + (index + 1);
    return {
      href: '#' + id,
      label: trend?.title ?? 'Phân tích',
      shortLabel: 'Phân tích ' + pad2(index + 1)
    };
  };
  const releaseItem = releaseItemsForEdition(edition, { compact: mode === 'QUIET' }).length > 0
    ? { href: '#releases', label: 'Release notebook', shortLabel: 'Release' }
    : null;
  const trendAndReleaseItems = mode === 'BIG'
    ? [lead ? trendItem(lead) : null, ...supporting.slice(0, 2).map(trendItem), releaseItem, ...supporting.slice(2).map(trendItem)]
    : [lead ? trendItem(lead) : null, releaseItem, ...supporting.map(trendItem)];

  return [
    { href: '#briefing', label: '60 giây nắm bắt', shortLabel: '60 giây' },
    ...trendAndReleaseItems,
    { href: '#developer', label: 'Developer memo', shortLabel: 'Memo' },
    edition.radar.length > 0 ? { href: '#radar', label: 'Radar 72 giờ', shortLabel: 'Radar' } : null,
    isRecord(edition.wildcard) && hasText(edition.wildcard.text)
      ? { href: '#wildcard', label: edition.wildcard.title ?? 'Một góc lệch', shortLabel: 'Góc lệch' }
      : null,
    { href: '#takeaway', label: 'Điều cần nhớ', shortLabel: 'Kết luận' }
  ].filter(Boolean);
}

function renderQuickToc(edition) {
  return sectionIndexItems(edition)
    .map((item) => '<a href="' + item.href + '">' + escapeHtml(item.shortLabel) + '</a>')
    .join('');
}

function renderRightRail(edition) {
  const indexItems = sectionIndexItems(edition).map((item, index) =>
    '<a href="' + item.href + '"><span>' + pad2(index + 1) + '</span>' + escapeHtml(item.label) + '</a>'
  ).join('');

  const number = oneNumber(edition);
  const numberBlock = number
    ? '<section class="rail__block rail__block--number"><h3>One number</h3>' + renderStat(number, 'stat-break--rail') + '</section>'
    : '';

  const watching = watchingItems(edition).map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  const watchingBlock = watching
    ? '<section class="rail__block"><h3>Watching</h3><ul class="rail__watch">' + watching + '</ul></section>'
    : '';

  const items = [...edition.brief, ...edition.trends, ...edition.releases, ...edition.radar];
  const sourceMap = new Map();
  items.flatMap((item) => item.sources ?? []).forEach((source) => sourceMap.set(source.url, source));
  const sources = [...sourceMap.values()];
  const newCount = items.filter((item) => item.freshness === 'NEW_TODAY').length;
  const officialCount = sources.filter((source) => source.type === 'official').length;
  const cutoff = isRecord(edition.meta) && hasText(edition.meta.cutoff_at)
    ? edition.meta.cutoff_at.slice(11, 16)
    : '07:00';
  const evidenceBlock = [
    '<section class="rail__block rail__block--surface rail__coverage">',
    '  <h3>Phạm vi số này</h3>',
    '  <dl>',
    '    <div><dt>Sự kiện mới</dt><dd>' + newCount + '</dd></div>',
    '    <div><dt>Nguồn trực tiếp</dt><dd>' + sources.length + '</dd></div>',
    '    <div><dt>Nguồn gốc</dt><dd>' + officialCount + '</dd></div>',
    '    <div><dt>Chốt bản tin</dt><dd>' + escapeHtml(cutoff) + '</dd></div>',
    '  </dl>',
    '</section>'
  ].join('');

  return [
    '<aside aria-label="Mục lục số hôm nay">',
    '  <div class="rail">',
    '    <section class="rail__block"><h3>Trong số này</h3><nav class="rail__index" aria-label="Mục lục">' + indexItems + '</nav></section>',
    '    ' + evidenceBlock,
    '    ' + numberBlock,
    '    ' + watchingBlock,
    '  </div>',
    '</aside>'
  ].join('\n');
}

function renderFooterNav(edition, editions, context) {
  const index = editions.findIndex((item) => item.edition_date === edition.edition_date);
  const previous = index >= 0 && index < editions.length - 1 ? editions[index + 1] : null;
  const previousLink = previous
    ? '<a href="' + context.dateHref(previous.edition_date) + '">Số trước · ' + formatDate(previous.edition_date) + '</a>'
    : '';
  return previousLink + '<a href="' + context.archiveHref + '">Bài cũ / Editions</a>';
}

function renderArchiveRows(editions, allEditions, context) {
  return editions.map((edition) => {
    const topics = [...new Set(edition.releases.map((release) => release.product))].slice(0, 3);
    const topicMarkup = topics.length > 0
      ? '<span class="edition-row__topics">' + topics.map((topic) => '<span>' + escapeHtml(topic) + '</span>').join('') + '</span>'
      : '';
    const number = editionNumber(edition, allEditions);
    const mode = inferEditionMode(edition);
    return [
      '<a class="edition-row" href="' + context.dateHref(edition.edition_date) + '">',
      '  <span class="edition-row__date">Số ' + pad2(number) + '<small>' + formatDate(edition.edition_date) + ' · ' + weekdayLabel(edition.edition_date) + '</small><small>' + modeLabels[mode] + '</small></span>',
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

function localizeChrome(html, language) {
  if (language !== 'en') return html;
  const pairs = [
    ['Bỏ qua điều hướng', 'Skip navigation'],
    ['AI Morning, trang mới nhất', 'AI Morning, latest edition'],
    ['Bản tin AI buổi sáng cho software engineer', 'The morning AI briefing for software engineers'],
    ['Điều hướng chính', 'Main navigation'],
    ['Chuyên mục', 'Sections'],
    ['Mục lục trong số này', 'Table of contents for this edition'],
    ['Mục lục nhanh', 'Quick table of contents'],
    ['Chế độ đọc', 'Reading mode'],
    ['Theme: auto. Chọn theme tiếp theo', 'Theme: auto. Choose the next theme'],
    ['Đổi cỡ chữ', 'Change font size'],
    ['AI Morning là bản tổng hợp có chọn lọc. Claim quan trọng nên được kiểm tra ở nguồn gốc trước khi dùng cho quyết định production, pháp lý hoặc tài chính.', 'AI Morning is a curated briefing. Verify consequential claims with their primary source before making production, legal, or financial decisions.'],
    ['Phiên bản khác', 'Other editions'],
    ['Mỗi buổi sáng, một lát cắt.', 'One morning, one clear slice.'],
    ['Các bản tin đã xuất bản được giữ nguyên theo ngày để bạn có thể trở lại đúng bối cảnh của từng buổi sáng.', 'Published briefings are preserved by date so you can return to the context of any given morning.'],
    ['Tất cả editions', 'All editions'],
    ['>Số</span>', '>Issue</span>'],
    ['Kho lưu trữ', 'Archive'],
    ['Đọc số mới nhất', 'Read the latest edition'],
    ['Edition theo ngày là snapshot được tái tạo từ JSON của chính ngày đó. Trang chủ luôn hiển thị edition mới nhất.', 'Each dated edition is a snapshot generated from that day’s JSON. The homepage always shows the latest edition.'],
    ['Bản tin mới nhất', 'Latest briefing'],
    ['Tin nhanh', 'Briefing'],
    ['Xem toàn bộ editions →', 'View all editions →'],
    ['Không có launch lớn', 'No major launch'],
    ['Việc đáng đọc thay thế', 'Worth reading instead'],
    ['Còn lại trong<br>60 giây', 'The rest in<br>60 seconds'],
    ['60 giây<br>nắm bắt', 'Catch up in<br>60 seconds'],
    ['60 giây nắm bắt', '60-second catch-up'],
    ['60 giây', '60 seconds'],
    ['Những chuyển động đáng đọc kỹ', 'Developments worth a closer look'],
    ['Phân tích chính', 'Main analysis'],
    ['Bài đọc chính', 'Main story'],
    ['Những thay đổi đáng biết', 'Changes worth knowing'],
    ['Vì sao đáng chú ý', 'Why it matters'],
    ['Thay đổi', 'What changed'],
    ['Khuyến nghị', 'Recommendation'],
    ['Phạm vi:', 'Availability:'],
    ['Những tín hiệu cần tiếp tục nhìn', 'Signals to keep watching'],
    ['Nếu hôm nay chỉ nhớ một điều', 'If you remember one thing today'],
    ['Việc nên thử', 'What to try'],
    ['Nên làm', 'Do'],
    ['Tránh', 'Avoid'],
    ['Trong số này', 'In this edition'],
    ['Điều cần nhớ', 'Takeaway'],
    ['Kết luận', 'Takeaway'],
    ['Phạm vi số này', 'Edition coverage'],
    ['Sự kiện mới', 'New events'],
    ['Nguồn trực tiếp', 'Direct sources'],
    ['Nguồn gốc', 'Primary'],
    ['Đối chiếu', 'Reporting'],
    ['Nghiên cứu', 'Research'],
    ['Nguồn kiểm chứng', 'Verified sources'],
    ['Chốt bản tin', 'Cutoff'],
    ['Sao chép link', 'Copy link'],
    ['Sao chép liên kết', 'Copy link to'],
    ['aria-label="Lưu ', 'aria-label="Save '],
    ['>Lưu</button>', '>Save</button>'],
    [' để đọc sau', ' for later'],
    ['Bài cũ / Editions', 'Past editions'],
    ['Bài cũ', 'Past editions'],
    ['>Đọc</button>', '>Read</button>'],
    ['Bản lưu', 'Archived'],
    ['Số mới', 'Latest'],
    ['Số thường', 'Standard edition'],
    ['Ngày lớn', 'Big news day'],
    ['Ngày yên', 'Quiet day'],
    ['Ưu tiên nguồn chính thức', 'Official sources first'],
    ['Nguồn đã đối chiếu', 'Cross-checked sources'],
    ['Thông tin bài viết', 'Article information'],
    ['Các phân tích tiếp theo', 'Further analysis'],
    ['Mục lục số hôm nay', "Today's table of contents"],
    ['Mục lục', 'Table of contents'],
    ['Phân tích', 'Analysis'],
    ['Tất cả', 'All'],
    ['Thứ hai', 'Monday'],
    ['Thứ ba', 'Tuesday'],
    ['Thứ tư', 'Wednesday'],
    ['Thứ năm', 'Thursday'],
    ['Thứ sáu', 'Friday'],
    ['Thứ bảy', 'Saturday'],
    ['Chủ nhật', 'Sunday'],
    ['BỐI CẢNH BIÊN TẬP', 'EDITORIAL CONTEXT'],
    ['TÍN HIỆU', 'SIGNAL'],
    ['điều vừa đổi', 'what changed'],
    ['HỆ THỐNG', 'SYSTEM'],
    ['nơi bị tác động', 'where it lands'],
    ['HÀNH ĐỘNG', 'ACTION'],
    ['việc cần thử', 'what to try'],
    ['Minh hoạ biên tập · không biểu diễn dữ liệu định lượng.', 'Editorial illustration · not a quantitative chart.'],
    ['Minh hoạ biên tập trung tính cho tín hiệu AI', 'Neutral editorial illustration for an AI signal']
  ];
  let localized = html;
  pairs.forEach(([vi, en]) => { localized = localized.replaceAll(vi, en); });
  return localized
    .replace(/Quét (\d+) giờ · đối chiếu (\d+) giờ/g, 'Scanned $1 hours · cross-checked $2 hours')
    .replace(/(\d+) phút đọc/g, '$1 min read')
    .replace(/(\d+) nguồn/g, '$1 sources')
    .replace(/Số (\d+)/g, 'Issue $1')
    .replace(/tháng (\d+)/g, (match, month) => [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][Number(month)]);
}

function renderArticlePage(template, edition, editions, context) {
  const mode = inferEditionMode(edition);
  const pageKind = context.kind === 'latest' ? 'edition-page edition-page--latest' : 'edition-page edition-page--historical';
  const html = fillTemplate(template, {
    HTML_LANG: context.language,
    LANGUAGE_SWITCH_HREF: context.languageSwitchHref,
    LANGUAGE_SWITCH_LABEL: context.language === 'en' ? 'VI' : 'EN',
    LANGUAGE_SWITCH_ARIA: context.language === 'en' ? 'Chuyển ngôn ngữ sang tiếng Việt' : 'Switch language to English',
    PAGE_TITLE: escapeHtml('AI Morning · ' + formatDate(edition.edition_date)),
    DESCRIPTION: escapeHtml(edition.dek),
    ASSET_PREFIX: context.assetPrefix,
    PAGE_CLASS: pageKind + ' edition-page--' + mode.toLowerCase(),
    HOME_HREF: context.homeHref,
    ARCHIVE_HREF: context.archiveHref,
    TOC_MENU: renderQuickToc(edition),
    EDITIONS_MENU: renderEditionsMenu(editions, context),
    DATELINE: renderDateline(edition, editions, context),
    HERO: renderHero(edition, context),
    EDITION_BODY: renderEditionBody(edition, context.assetPrefix),
    FOOTER_NAV: renderFooterNav(edition, editions, context)
  }, 'article.html');
  return localizeChrome(html, context.language);
}

function translatedEdition(edition, language) {
  if (language === 'vi') return edition;
  const translation = edition.translations?.[language];
  if (!isRecord(translation)) return null;
  const localized = structuredClone(edition);
  const mergeText = (target, overlay, keys) => {
    if (!isRecord(overlay)) return;
    keys.forEach((key) => {
      if (overlay[key] !== undefined) target[key] = overlay[key];
    });
  };
  mergeText(localized, translation, ['headline', 'dek', 'takeaway', 'watching']);
  mergeText(localized.hero_visual, translation.hero_visual, ['caption', 'alt']);
  mergeText(localized.developer_memo, translation.developer_memo, ['title', 'direct_answer', 'actions', 'avoid']);
  mergeText(localized.wildcard, translation.wildcard, ['title', 'text']);
  for (const section of ['brief', 'trends', 'releases', 'radar']) {
    const overlays = translation[section];
    if (!isRecord(overlays)) continue;
    localized[section].forEach((item) => {
      const overlay = overlays[item.event_id];
      mergeText(item, overlay, [
        'title', 'text', 'paragraphs', 'pullquote', 'action', 'product', 'feature', 'summary',
        'what_changed', 'who_gets_it', 'why_it_matters', 'verdict_note'
      ]);
      mergeText(item.visual, overlay?.visual, ['caption', 'alt']);
      if (Array.isArray(overlay?.source_labels)) {
        overlay.source_labels.forEach((label, index) => {
          if (item.sources[index] && hasText(label)) item.sources[index].label = label;
        });
      }
    });
  }
  localized.locale = 'en-US';
  return localized;
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
    assertEditionSchema(parsed, { filename });
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
    const context = pageContext('dated', edition.edition_date);
    if (!isRecord(edition.translations?.en)) context.languageSwitchHref = '../en/';
    const html = renderArticlePage(articleTemplate, edition, editions, context);
    await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  }

  const latest = editions[0];
  await writeFile(
    path.join(distDir, 'index.html'),
    renderArticlePage(articleTemplate, latest, editions, pageContext('latest', latest.edition_date)),
    'utf8'
  );

  const englishEditions = editions
    .map((edition) => translatedEdition(edition, 'en'))
    .filter(Boolean);
  if (englishEditions.length > 0) {
    const englishDir = path.join(distDir, 'en');
    await mkdir(englishDir, { recursive: true });
    for (const edition of englishEditions) {
      const outputDir = path.join(englishDir, edition.edition_date);
      await mkdir(outputDir, { recursive: true });
      await writeFile(
        path.join(outputDir, 'index.html'),
        renderArticlePage(articleTemplate, edition, englishEditions, pageContext('dated', edition.edition_date, 'en')),
        'utf8'
      );
    }
    await writeFile(
      path.join(englishDir, 'index.html'),
      renderArticlePage(articleTemplate, englishEditions[0], englishEditions, pageContext('latest', englishEditions[0].edition_date, 'en')),
      'utf8'
    );
    const englishArchiveContext = pageContext('archive', null, 'en');
    const englishArchiveHtml = localizeChrome(fillTemplate(archiveTemplate, {
      HTML_LANG: 'en',
      ARCHIVE_DESCRIPTION: 'Archive of published AI Morning editions.',
      ARCHIVE_TITLE: 'Past editions · AI Morning',
      ASSET_PREFIX: englishArchiveContext.assetPrefix,
      HOME_HREF: englishArchiveContext.homeHref,
      LANGUAGE_SWITCH_HREF: englishArchiveContext.languageSwitchHref,
      LANGUAGE_SWITCH_LABEL: 'VI',
      LANGUAGE_SWITCH_ARIA: 'Chuyển ngôn ngữ sang tiếng Việt',
      EDITIONS_MENU: renderEditionsMenu(englishEditions, englishArchiveContext),
      EDITION_COUNT: englishEditions.length + (englishEditions.length === 1 ? ' edition' : ' editions'),
      ARCHIVE_ROWS: renderArchiveRows(englishEditions, englishEditions, englishArchiveContext)
    }, 'archive.html'), 'en');
    const englishArchiveDir = path.join(englishDir, 'archive');
    await mkdir(englishArchiveDir, { recursive: true });
    await writeFile(path.join(englishArchiveDir, 'index.html'), englishArchiveHtml, 'utf8');
  }

  const archiveContext = pageContext('archive');
  const archiveHtml = fillTemplate(archiveTemplate, {
    HTML_LANG: 'vi',
    ARCHIVE_DESCRIPTION: 'Kho lưu trữ các edition đã xuất bản của AI Morning.',
    ARCHIVE_TITLE: 'Bài cũ · AI Morning',
    ASSET_PREFIX: archiveContext.assetPrefix,
    HOME_HREF: archiveContext.homeHref,
    LANGUAGE_SWITCH_HREF: archiveContext.languageSwitchHref,
    LANGUAGE_SWITCH_LABEL: 'EN',
    LANGUAGE_SWITCH_ARIA: 'Switch language to English',
    EDITIONS_MENU: renderEditionsMenu(editions, archiveContext),
    EDITION_COUNT: editions.length + (editions.length === 1 ? ' edition' : ' editions'),
    ARCHIVE_ROWS: renderArchiveRows(editions, editions, archiveContext)
  }, 'archive.html');
  const archiveDir = path.join(distDir, 'archive');
  await mkdir(archiveDir, { recursive: true });
  await writeFile(path.join(archiveDir, 'index.html'), archiveHtml, 'utf8');

  const outputStat = await stat(path.join(distDir, 'index.html'));
  if (!outputStat.isFile()) throw new Error('Build did not create dist/index.html');

  console.log('Built ' + editions.length + ' editions.');
  console.log('Latest: ' + latest.edition_date + ' · ' + inferEditionMode(latest));
  console.log('Output: ' + path.relative(repoRoot, distDir).replaceAll(path.sep, '/') + '/');
}

build().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
