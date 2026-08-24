export function issue(level, code, entry, message, { details = [], required } = {}) {
  return {
    level,
    code,
    file: entry?.file ?? (entry?.edition?.edition_date ? 'content/' + entry.edition.edition_date + '.json' : undefined),
    field: entry?.field,
    event_id: entry?.item?.event_id,
    message,
    details,
    required
  };
}

export function formatDiagnostic(diagnostic) {
  const location = [diagnostic.file, diagnostic.field].filter(Boolean).join(' ');
  const lines = [diagnostic.level.toUpperCase() + ' [' + diagnostic.code + ']' + (location ? ' ' + location : '')];
  if (diagnostic.event_id) lines.push('event_id: ' + diagnostic.event_id);
  lines.push(diagnostic.message);
  for (const detail of diagnostic.details ?? []) lines.push(detail);
  if (diagnostic.required) lines.push('Required: ' + diagnostic.required);
  return lines.join('\n');
}

export function formatDiagnostics(diagnostics) {
  return diagnostics.map(formatDiagnostic).join('\n\n');
}
