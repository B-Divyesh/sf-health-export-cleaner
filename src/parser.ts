import type { Dataset, HealthRecord, SourceKind } from './types';

export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_RECORDS = 500_000;

const TYPE_KEYS = ['type', 'recordtype', 'record_type', 'activitytype', 'activity_type'];

export function detectKind(filename: string, contentStart = ''): SourceKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xml')) return 'xml';
  if (contentStart.trimStart().startsWith('<')) return 'xml';
  return 'csv';
}

export async function parseHealthFile(file: File): Promise<Dataset> {
  if (file.size === 0) throw new Error('This file is empty. Choose a CSV or Apple Health export.xml file.');
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`This file is larger than the 100 MB safety limit (${formatBytes(file.size)}). Split it at the source, then try a smaller part.`);
  }
  const text = await file.text();
  const kind = detectKind(file.name, text.slice(0, 200));
  const parsed = kind === 'xml' ? parseHealthXml(text) : parseHealthCsv(text);
  return { ...parsed, kind, filename: file.name, size: file.size };
}

export function parseHealthCsv(text: string): Omit<Dataset, 'kind' | 'filename' | 'size'> {
  const rows = parseCsvRows(text);
  if (!rows.length || rows.every((row) => row.every((cell) => !cell.trim()))) {
    throw new Error('No CSV rows were found. Check that the file has a header row.');
  }
  const rawHeaders = rows[0].map((header, index) => header.replace(/^\uFEFF/, '').trim() || `column_${index + 1}`);
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((header) => {
    const count = seen.get(header) ?? 0;
    seen.set(header, count + 1);
    return count ? `${header}_${count + 1}` : header;
  });
  const typeHeader = headers.find((header) => TYPE_KEYS.includes(normalizeKey(header)));
  const records: HealthRecord[] = [];
  let uneven = 0;
  for (const sourceRow of rows.slice(1)) {
    if (sourceRow.every((cell) => !cell.trim())) continue;
    if (records.length >= MAX_RECORDS) throw new Error('This file has more than 500,000 records. Split it into smaller date ranges first.');
    if (sourceRow.length !== headers.length) uneven += 1;
    const fields: Record<string, string> = {};
    headers.forEach((header, index) => { fields[header] = sourceRow[index] ?? ''; });
    records.push({ type: typeHeader ? fields[typeHeader] || 'Unspecified' : 'CSV record', fields });
  }
  if (!records.length) throw new Error('The CSV has headers but no data rows.');
  const warnings = [
    ...(!typeHeader ? ['No record-type column was detected; all rows are grouped as “CSV record”.'] : []),
    ...(uneven ? [`${uneven.toLocaleString()} row${uneven === 1 ? '' : 's'} had a different number of columns and were padded or trimmed.`] : [])
  ];
  return { headers, records, warnings };
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('The CSV has an unclosed quoted field. Export it again or repair that row.');
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function parseHealthXml(text: string): Omit<Dataset, 'kind' | 'filename' | 'size'> {
  if (!/<HealthData\b/i.test(text)) throw new Error('This XML is not a supported Apple Health export: the HealthData element is missing.');
  const records: HealthRecord[] = [];
  const headerSet = new Set<string>();
  const recordPattern = /<Record\b([^>]*?)(?:\/\s*>|>[\s\S]*?<\/Record\s*>)/gi;
  let match: RegExpExecArray | null;
  while ((match = recordPattern.exec(text))) {
    if (records.length >= MAX_RECORDS) throw new Error('This export has more than 500,000 records. Export a smaller date range from the source first.');
    const fields = parseXmlAttributes(match[1]);
    if (!fields.type) continue;
    Object.keys(fields).forEach((key) => headerSet.add(key));
    records.push({ type: shortAppleType(fields.type), fields });
  }
  if (!records.length) throw new Error('No Apple Health Record elements were found. Workouts, routes, and clinical records are not supported in v1.');
  return {
    headers: [...headerSet],
    records,
    warnings: /<Workout\b/i.test(text) ? ['Workout elements are not included; only Apple Health Record elements are supported.'] : []
  };
}

export function parseXmlAttributes(source: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const attributePattern = /([A-Za-z_:][\w:.-]*)\s*=\s*(["'])([\s\S]*?)\2/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(source))) fields[match[1]] = decodeXml(match[3]);
  return fields;
}

function decodeXml(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
    if (named[entity]) return named[entity];
    const radix = entity.toLowerCase().startsWith('&#x') ? 16 : 10;
    const raw = entity.slice(radix === 16 ? 3 : 2, -1);
    const code = Number.parseInt(raw, radix);
    return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
  });
}

function shortAppleType(value: string): string {
  return value.replace(/^HK(?:Quantity|Category|Correlation)TypeIdentifier/, '').replace(/^HK/, '') || value;
}

export function normalizeKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
