import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatDiagnostics } from './news/diagnostics.mjs';
import { buildNewsIndex, checkNewsIndex, serializeNewsIndex } from './news/ledger.mjs';
import { loadSourceRegistry } from './news/source-registry.mjs';
import { validateNewsQuality } from './news/validate.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentDir = path.join(repoRoot, 'content');
const indexPath = path.join(repoRoot, 'data', 'news-index.json');
const sourceRegistryPath = path.join(repoRoot, 'config', 'news-sources.json');

async function loadEditions() {
  const filenames = (await readdir(contentDir)).filter((filename) => filename.endsWith('.json')).sort();
  if (filenames.length === 0) throw new Error('No content/*.json editions found.');
  const editions = await Promise.all(filenames.map(async (filename) => {
    try {
      return JSON.parse(await readFile(path.join(contentDir, filename), 'utf8'));
    } catch (error) {
      throw new Error('ERROR content/' + filename + '\nInvalid JSON: ' + error.message);
    }
  }));
  return { editions, filenames };
}

function printSummary(stats) {
  console.log([
    'News quality:',
    '  editions checked: ' + stats.editionsChecked,
    '  events indexed: ' + stats.eventsIndexed,
    '  hard errors: ' + stats.hardErrors,
    '  editorial warnings: ' + stats.editorialWarnings,
    '  duplicate candidates blocked: ' + stats.duplicateCandidatesBlocked
  ].join('\n'));
}

async function run() {
  const mode = process.argv[2] ?? '--check';
  if (!['--check', '--write'].includes(mode)) {
    throw new Error('Usage: node scripts/news-quality.mjs [--check|--write]');
  }

  const runAt = new Date();
  const [loaded, sourceRegistry] = await Promise.all([
    loadEditions(),
    loadSourceRegistry(sourceRegistryPath)
  ]);
  const { editions, filenames } = loaded;
  const report = validateNewsQuality(editions, { runAt, filenames });

  if (report.errors.length > 0) console.error(formatDiagnostics(report.errors));
  if (report.warnings.length > 0) console.warn(formatDiagnostics(report.warnings));
  if (!report.ok) {
    printSummary(report.stats);
    process.exitCode = 1;
    return;
  }

  const expected = serializeNewsIndex(buildNewsIndex(editions, report.entries, sourceRegistry.sources.length));
  if (mode === '--write') {
    await mkdir(path.dirname(indexPath), { recursive: true });
    await writeFile(indexPath, expected, 'utf8');
    console.log('Wrote data/news-index.json with ' + report.stats.occurrences + ' event occurrences.');
    printSummary(report.stats);
    return;
  }

  let actual;
  try {
    actual = await readFile(indexPath, 'utf8');
  } catch {
    console.error('ERROR [MISSING_NEWS_INDEX] data/news-index.json\nThe generated event ledger is missing.\nRequired: Run npm run news:index and commit the result.');
    report.stats.hardErrors += 1;
    printSummary(report.stats);
    process.exitCode = 1;
    return;
  }
  const ledger = checkNewsIndex(actual, expected);
  if (!ledger.current) {
    console.error('ERROR [STALE_NEWS_INDEX] data/news-index.json\n' + ledger.message);
    report.stats.hardErrors += 1;
    printSummary(report.stats);
    process.exitCode = 1;
    return;
  }
  printSummary(report.stats);
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
