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
const editionModes = new Set(['BIG', 'NORMAL', 'QUIET']);
const importanceValues = new Set(['LEAD', 'SECONDARY', 'BRIEF']);
const visualKinds = new Set(['editorial', 'image', 'screenshot', 'chart', 'diagram', 'stat']);
const monthNames = [
  'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
  'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
];
const verdictLabels = {
  TRY_NOW: 'TRY NOW',
  WATCH: 'WATCH',
  SKIP_FOR_NOW: 'SKIP FOR NOW'
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

function validateOptionalString(value, field, errors) {
  if (value !== undefined && !hasText(value)) {
    errors.push('invalid field "' + field + '": expected non-empty string');
  }
}

function validateVisual(visual, field, errors) {
  if (visual === undefined) return;
  if (!isRecord(visual)) {
    errors.push('invalid field "' + field + '": expected object');
    return;
  }
  const kind = visual.kind ?? 'editorial';
  if (!visualKinds.has(kind)) {
    errors.push('invalid field "' + field + '.kind": expected editorial, image, screenshot, chart, diagram, or stat');
  }
  if ((kind === 'image' || kind === 'screenshot') && !hasText(visual.src)) {
    errors.push('missing required field "' + field + '.src"');
  }
  for (const key of ['src', 'alt', 'caption', 'credit', 'key']) {
    validateOptionalString(visual[key], field + '.' + key, errors);
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
  validateVisual(edition.hero_visual, 'hero_visual', errors);

  if (edition.edition_mode !== undefined && !editionModes.has(edition.edition_mode)) {
    errors.push('invalid field "edition_mode": expected BIG, NORMAL, or QUIET');
  }

  if (edition.one_number !== undefined) {
    if (!isRecord(edition.one_number) || !hasText(edition.one_number.value) || !hasText(edition.one_number.label)) {
      errors.push('invalid field "one_number": expected object with value and label');
    }
  }

  if (edition.wildcard !== undefined) {
    if (!isRecord(edition.wildcard) || !hasText(edition.wildcard.text)) {
      errors.push('invalid field "wildcard": expected object with text');
    }
  }

  if (edition.watching !== undefined) {
    if (!Array.isArray(edition.watching) || edition.watching.some((item) => !hasText(item))) {
      errors.push('invalid field "watching": expected string array');
    }
  }

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
      if (!hasText(item.text) && !hasText(item.title)) {
        errors.push('missing required field "' + field + '.text"');
      }
      validateOptionalString(item.title, field + '.title', errors);
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
      if (trend.importance !== undefined && !importanceValues.has(trend.importance)) {
        errors.push('invalid field "' + field + '.importance": expected LEAD, SECONDARY, or BRIEF');
      }
      if (trend.stat !== undefined) {
        if (!isRecord(trend.stat) || !hasText(trend.stat.value) || !hasText(trend.stat.label)) {
          errors.push('invalid field "' + field + '.stat": expected object with value and label');
        }
      }
      validateVisual(trend.visual, field + '.visual', errors);
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
      validateVisual(release.visual, field + '.visual', errors);
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
    '  <p class="dateline__date">' + longDate(edition.edition_date) + '</p>',
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
  const visual = isRecord(edition.hero_visual) ? renderVisual(edition.hero_visual, { hero: true }) : '';
  const longTitle = edition.headline.length > 72 ? ' hero--long-title' : '';
  const metaRow = [
    '<div class="meta" role="group" aria-label="Thông tin bài viết">',
    '  <span>Quét ' + scanHours + ' giờ · đối chiếu ' + contextHours + ' giờ</span>',
    '  <span>' + readingMinutes(edition) + ' phút đọc</span>',
    '  <span>' + policy + '</span>',
    '</div>'
  ].join('\n');

  if (mode === 'QUIET') {
    const instead = frontBriefs(edition).slice(0, 3).map((item, index) =>
      '<li><span class="hero__instead-index">' + pad2(index + 1) + '</span><div><strong>' +
      escapeHtml(briefTitle(item)) + '</strong>' +
      (briefBody(item) ? '<span>' + escapeHtml(briefBody(item)) + '</span>' : '') +
      '</div></li>'
    ).join('');
    return [
      '<header class="hero hero--quiet' + longTitle + '">',
      '  <div class="freshness-strip"><span class="edition-state">' + modeLabels[mode] + '</span>' + newToday + '<span>Không có launch lớn</span></div>',
      '  <h1>' + escapeHtml(edition.headline) + '</h1>',
      '  <p class="dek">' + escapeHtml(edition.dek) + '</p>',
      '  ' + metaRow,
      '  <div class="hero__instead-wrap">',
      '    <p class="section-label">Việc đáng đọc thay thế</p>',
      '    <ol class="hero__instead">' + instead + '</ol>',
      '  </div>',
      '  ' + visual,
      '</header>'
    ].join('\n');
  }

  if (mode === 'BIG') {
    return [
      '<header class="hero hero--big' + longTitle + '">',
      '  <div class="freshness-strip"><span class="edition-state">' + modeLabels[mode] + '</span>' + newToday + '<span>24H NEWS · 72H CONTEXT</span></div>',
      '  <h1>' + escapeHtml(edition.headline) + '</h1>',
      '  <p class="dek">' + escapeHtml(edition.dek) + '</p>',
      '  ' + metaRow,
      '  ' + visual,
      '</header>'
    ].join('\n');
  }

  return [
    '<header class="hero hero--normal' + longTitle + '">',
    '  <div class="hero__grid">',
    '    <div>',
    '      <div class="freshness-strip"><span class="edition-state">' + modeLabels[mode] + '</span>' + newToday + '<span>24H NEWS · 72H CONTEXT</span></div>',
    '      <h1>' + escapeHtml(edition.headline) + '</h1>',
    '      <p class="dek">' + escapeHtml(edition.dek) + '</p>',
    '      ' + metaRow,
    '    </div>',
    '    ' + visual,
    '  </div>',
    '</header>'
  ].join('\n');
}

function renderBriefing(edition, { start = 0, max = 5, compact = false } = {}) {
  const selected = edition.brief.slice(start, start + max);
  const items = selected.map((item) => {
    const body = briefBody(item);
    return '<li>' +
      '<span class="briefing__freshness">' + renderFreshness(item.freshness, true) + '</span>' +
      '<div class="briefing__copy"><strong>' + escapeHtml(briefTitle(item)) + '</strong>' +
      (body ? '<span>' + escapeHtml(body) + '</span>' : '') +
      '</div></li>';
  }).join('');
  return [
    '<section class="briefing' + (compact ? ' briefing--compact' : '') + '" id="briefing" aria-labelledby="briefing-title">',
    '  <h2 class="section-label" id="briefing-title">' + (start > 0 ? 'Còn lại trong<br>60 giây' : '60 giây<br>nắm bắt') + '</h2>',
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

function renderTrendHeader(trend, id, shape) {
  const heading = shape === 'news-brief' ? 'h3' : 'h2';
  return [
    '<header class="story-shape__header">',
    '  <div class="trend__meta">' + renderFreshness(trend.freshness) + (hasText(trend.strength) ? '<span>' + escapeHtml(trend.strength) + '</span>' : '') + '</div>',
    '  <' + heading + '>' + escapeHtml(trend.title) + '</' + heading + '>',
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
  const id = hasText(trend.id) ? trend.id : 'trend-' + (index + 1);
  const statAsVisual = isRecord(trend.visual) && trend.visual.kind === 'stat' && isRecord(trend.stat);
  const visual = statAsVisual
    ? renderStat(trend.stat, 'stat-break--visual')
    : (isRecord(trend.visual) ? renderVisual(trend.visual) : '');
  const quote = hasText(trend.pullquote)
    ? '<blockquote class="pullquote">' + escapeHtml(trend.pullquote) + '</blockquote>'
    : '';
  const stat = isRecord(trend.stat) && !statAsVisual ? renderStat(trend.stat) : '';
  const action = hasText(trend.action)
    ? '<aside class="action-note"><strong>Việc nên thử</strong><p>' + escapeHtml(trend.action) + '</p></aside>'
    : '';
  const first = trend.paragraphs.slice(0, 1);
  const rest = trend.paragraphs.slice(1);
  let body;

  if (shape === 'lead-story') {
    body = [
      '<div class="lead-story__opening">',
      '  <div class="story-prose">' + renderParagraphs(first, { lead: true }) + '</div>',
      '  ' + visual,
      '</div>',
      stat,
      quote,
      '<div class="story-prose story-prose--continuation">' + renderParagraphs(rest) + '</div>',
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
    '<section class="story-shape ' + shape + ' trend--' + importance.toLowerCase() + '" id="' + escapeHtml(id) + '">',
    renderTrendHeader(trend, id, shape),
    body,
    renderSources(trend.sources),
    '</section>'
  ].join('\n');
}

function renderTrendDepartment(trends, allTrends, { compact = false, label = 'Phân tích' } = {}) {
  if (trends.length === 0) return '';
  const stories = trends.map((trend) => renderTrendStory(trend, allTrends.indexOf(trend), { compact })).join('\n');
  return '<section class="story-department' + (compact ? ' story-department--compact' : '') + '" id="trends" aria-labelledby="trends-title">\n' +
    '<header class="department-heading"><p>' + escapeHtml(label) + '</p><h2 id="trends-title">Những chuyển động đáng đọc kỹ</h2></header>\n' +
    stories + '\n</section>';
}

function renderSecondaryGrid(trends, allTrends, { compact = false } = {}) {
  if (trends.length === 0) return '';
  return '<section class="secondary-grid" aria-label="Các phân tích tiếp theo">' +
    trends.map((trend) => renderTrendStory(trend, allTrends.indexOf(trend), { compact })).join('\n') +
    '</section>';
}

function renderReleases(edition, { compact = false } = {}) {
  const lead = edition.trends.find((trend, index) => trendImportance(trend, index) === 'LEAD') ?? edition.trends[0];
  const leadSourceUrls = new Set((lead?.sources ?? []).map((source) => source.url));
  const releaseItems = compact
    ? edition.releases.filter((release) => !(release.sources ?? []).some((source) => leadSourceUrls.has(source.url)))
    : edition.releases;
  const orderedReleaseItems = [...releaseItems].sort((a, b) => Number(isRecord(b.visual)) - Number(isRecord(a.visual)));
  const releases = orderedReleaseItems.map((release, index) => {
    const featured = isRecord(release.visual) || (index === 0 && release.verdict === 'TRY_NOW' && release.freshness === 'NEW_TODAY');
    const whoGetsIt = hasText(release.who_gets_it)
      ? '<p class="release__audience"><strong>Phạm vi:</strong> ' + escapeHtml(release.who_gets_it) + '</p>'
      : '';
    const changed = hasText(release.what_changed) ? release.what_changed : release.summary;
    const why = hasText(release.why_it_matters) ? release.why_it_matters : release.verdict_note;
    const visual = isRecord(release.visual) ? renderVisual(release.visual) : '';
    return [
      '<article class="release' + (featured ? ' release--featured' : '') + '">',
      '  <div class="release__head">',
      '    <div><p class="release__product">' + escapeHtml(release.product) + '</p><h3>' + escapeHtml(release.feature) + '</h3></div>',
      '    <div class="release__flags"><span class="status">' + escapeHtml(release.status) + '</span>' + renderFreshness(release.freshness, true) + '</div>',
      '  </div>',
      '  ' + visual,
      '  <p class="release__changed"><strong>What changed</strong> ' + escapeHtml(changed) + '</p>',
      '  ' + whoGetsIt,
      '  <p class="verdict"><strong>' + verdictLabels[release.verdict] + '</strong> ' + escapeHtml(why) + '</p>',
      '  ' + renderSources(release.sources),
      '</article>'
    ].join('\n');
  }).join('\n');

  const gridClass = orderedReleaseItems.length > 1 ? ' release-list--grid' : '';
  return '<section class="release-notebook' + (compact ? ' release-notebook--compact' : '') + '" id="releases" aria-labelledby="release-title">\n' +
    '<header class="department-heading"><p>Release notebook</p><h2 id="release-title">Những thay đổi đáng biết</h2></header>\n' +
    '<div class="release-list' + gridClass + '">' + releases + '</div>\n' +
    '</section>';
}

function renderMemo(edition) {
  const memo = edition.developer_memo;
  const actions = memo.actions.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  const avoid = memo.avoid.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  return [
    '<section class="memo" id="developer" aria-labelledby="developer-title">',
    '  <h2 id="developer-title">' + escapeHtml(memo.title) + '</h2>',
    '  <p class="direct-answer">' + escapeHtml(memo.direct_answer) + '</p>',
    '  <div class="memo__grid">',
    '    <div class="memo-card memo-card--do"><h3>Nên làm</h3><ol>' + actions + '</ol></div>',
    '    <div class="memo-card memo-card--dont"><h3>Tránh</h3><ol>' + avoid + '</ol></div>',
    '  </div>',
    '</section>'
  ].join('\n');
}

function renderRadar(edition) {
  const items = edition.radar.map((item) =>
    '<li><strong>' + escapeHtml(item.status) + '</strong><span>' + escapeHtml(item.text) + '</span></li>'
  ).join('');
  return '<section id="radar" aria-labelledby="radar-title">\n' +
    '<h2 id="radar-title">Những tín hiệu cần tiếp tục nhìn</h2>\n' +
    '<ul class="radar-list">' + items + '</ul>\n' +
    '</section>';
}

function renderWildcard(edition) {
  if (!isRecord(edition.wildcard) || !hasText(edition.wildcard.text)) return '';
  const title = hasText(edition.wildcard.title) ? edition.wildcard.title : 'Một góc lệch';
  return [
    '<section class="wildcard" id="wildcard" aria-labelledby="wildcard-title">',
    '  <h2 id="wildcard-title">' + escapeHtml(title) + '</h2>',
    '  <p>' + escapeHtml(edition.wildcard.text) + '</p>',
    '</section>'
  ].join('\n');
}

function renderTakeaway(edition) {
  const text = edition.takeaway.replace(/^Nếu hôm nay chỉ nhớ một điều\s*:\s*/i, '');
  return '<section class="takeaway" id="takeaway" aria-labelledby="takeaway-title">\n' +
    '<h2 id="takeaway-title">Nếu hôm nay chỉ nhớ một điều</h2>\n' +
    '<p>' + escapeHtml(text) + '</p>\n' +
    '</section>';
}

function renderMemoRadarPair(edition) {
  return '<div class="closing-grid">' + renderMemo(edition) + renderRadar(edition) + '</div>';
}

function renderEditionBody(edition) {
  const mode = inferEditionMode(edition);
  const lead = edition.trends.find((trend, index) => trendImportance(trend, index) === 'LEAD') ?? edition.trends[0];
  const supporting = edition.trends.filter((trend) => trend !== lead);
  const rail = renderRightRail(edition);
  let briefing;
  let main;

  if (mode === 'QUIET') {
    briefing = renderBriefing(edition, { start: 3, max: 3, compact: true });
    main = [
      renderReleases(edition, { compact: true }),
      renderTrendDepartment([lead], edition.trends, { label: 'Bài đọc chính' }),
      renderSecondaryGrid(supporting, edition.trends, { compact: true }),
      renderMemoRadarPair(edition),
      renderWildcard(edition),
      renderTakeaway(edition)
    ].join('\n');
  } else if (mode === 'BIG') {
    briefing = renderBriefing(edition);
    main = [
      renderTrendDepartment([lead], edition.trends, { label: 'Lead story' }),
      renderSecondaryGrid(supporting.slice(0, 2), edition.trends),
      renderReleases(edition),
      renderSecondaryGrid(supporting.slice(2), edition.trends),
      renderMemoRadarPair(edition),
      renderWildcard(edition),
      renderTakeaway(edition)
    ].join('\n');
  } else {
    briefing = renderBriefing(edition);
    main = [
      renderTrendDepartment([lead], edition.trends, { label: 'Phân tích chính' }),
      renderReleases(edition),
      renderSecondaryGrid(supporting, edition.trends),
      renderMemoRadarPair(edition),
      renderWildcard(edition),
      renderTakeaway(edition)
    ].join('\n');
  }

  return [
    briefing,
    '<div class="edition-body edition-body--' + mode.toLowerCase() + '">',
    '  <article class="edition-body__main">' + main + '</article>',
    '  ' + rail,
    '</div>'
  ].join('\n');
}

function renderRightRail(edition) {
  const indexItems = [
    { href: '#briefing', label: '60 giây nắm bắt' },
    { href: '#trends', label: edition.trends[0] ? edition.trends[0].title : 'Phân tích' },
    { href: '#releases', label: 'Release notebook' },
    { href: '#developer', label: 'Developer memo' },
    { href: '#radar', label: 'Radar 72 giờ' }
  ].map((item, index) =>
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

  return [
    '<aside aria-label="Mục lục số hôm nay">',
    '  <div class="rail">',
    '    <section class="rail__block"><h3>Trong số này</h3><nav class="rail__index" aria-label="Mục lục">' + indexItems + '</nav></section>',
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

function renderArticlePage(template, edition, editions, context) {
  const mode = inferEditionMode(edition);
  const pageKind = context.kind === 'latest' ? 'edition-page edition-page--latest' : 'edition-page edition-page--historical';
  return fillTemplate(template, {
    PAGE_TITLE: escapeHtml('AI Morning · ' + formatDate(edition.edition_date)),
    DESCRIPTION: escapeHtml(edition.dek),
    ASSET_PREFIX: context.assetPrefix,
    PAGE_CLASS: pageKind + ' edition-page--' + mode.toLowerCase(),
    HOME_HREF: context.homeHref,
    EDITIONS_MENU: renderEditionsMenu(editions, context),
    DATELINE: renderDateline(edition, editions, context),
    HERO: renderHero(edition, context),
    EDITION_BODY: renderEditionBody(edition),
    FOOTER_NAV: renderFooterNav(edition, editions, context)
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
