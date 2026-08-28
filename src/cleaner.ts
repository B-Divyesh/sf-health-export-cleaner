import { normalizeKey } from './parser';
import type { CleanerSettings, CleanResult, Dataset, TimePrecision } from './types';

const DATE_KEYS = new Set(['date', 'datetime', 'timestamp', 'time', 'startdate', 'start_date', 'starttime', 'start_time', 'enddate', 'end_date', 'endtime', 'end_time', 'creationdate', 'creation_date']);
const SENSITIVE_PATTERNS = [
  /(^|_)(id|uuid|guid|identifier|userid|user_id|email|name|device|serial|imei|source|source_name|source_version|metadata)(_|$)/i,
  /(^|_)(lat|latitude|lon|lng|longitude|altitude|elevation|gps|route|location|address|coordinate)(_|$)/i,
  /(sourcename|sourceversion|devicename|deviceid|useridentifier|gps|route|location|latitude|longitude|coordinate)/i
];

export function isSensitiveField(field: string): boolean {
  const normalized = normalizeKey(field);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isTimestampField(field: string): boolean {
  return DATE_KEYS.has(normalizeKey(field));
}

export function getDateBounds(dataset: Dataset): { min: string; max: string } {
  const dates = dataset.records.flatMap((record) => Object.entries(record.fields)
    .filter(([key]) => isTimestampField(key))
    .map(([, value]) => extractCalendarDate(value))
    .filter(Boolean)) as string[];
  dates.sort();
  return { min: dates[0] ?? '', max: dates[dates.length - 1] ?? '' };
}

export function cleanDataset(dataset: Dataset, settings: CleanerSettings): CleanResult {
  const allowedTypes = new Set(settings.selectedTypes);
  const included = new Set(settings.includedFields);
  const headers = dataset.headers.filter((header) => included.has(header) && !isSensitiveField(header));
  const removedFields = dataset.headers.filter((header) => !headers.includes(header));
  const rows: Record<string, string>[] = [];
  let omittedByDate = 0;
  let omittedByType = 0;

  for (const record of dataset.records) {
    if (!allowedTypes.has(record.type)) { omittedByType += 1; continue; }
    const date = recordDate(record.fields);
    if (date && ((settings.startDate && date < settings.startDate) || (settings.endDate && date > settings.endDate))) {
      omittedByDate += 1; continue;
    }
    const output: Record<string, string> = {};
    for (const header of headers) {
      const value = record.fields[header] ?? '';
      output[header] = isTimestampField(header) ? binTimestamp(value, settings.timePrecision) : value;
    }
    rows.push(output);
  }
  return { rows, headers, omittedByDate, omittedByType, removedFields };
}

export function recordDate(fields: Record<string, string>): string {
  const preferred = ['startDate', 'start_date', 'date', 'timestamp', 'time', 'creationDate', 'creation_date'];
  for (const key of preferred) if (fields[key]) return extractCalendarDate(fields[key]);
  for (const [key, value] of Object.entries(fields)) if (isTimestampField(key)) return extractCalendarDate(value);
  return '';
}

export function extractCalendarDate(value: string): string {
  return value.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1] ?? '';
}

export function binTimestamp(value: string, precision: TimePrecision): string {
  if (precision === 'exact' || !value) return value;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}))?/);
  if (!match) return value;
  if (precision === 'day') return match[1];
  return match[2] ? `${match[1]} ${match[2]}:00` : match[1];
}

export function toCsv(headers: string[], rows: Record<string, string>[]): string {
  const encode = (value: string) => /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return `${[headers.map(encode).join(','), ...rows.map((row) => headers.map((header) => encode(row[header] ?? '')).join(','))].join('\r\n')}\r\n`;
}

export function provenanceText(dataset: Dataset, settings: CleanerSettings, result: CleanResult): string {
  const removedTypes = [...new Set(dataset.records.map((record) => record.type))].filter((type) => !settings.selectedTypes.includes(type));
  return [
    'HEALTH EXPORT CLEANER — PROVENANCE NOTE',
    '',
    `Created: ${new Date().toISOString()}`,
    `Source file: ${dataset.filename}`,
    `Source format: ${dataset.kind.toUpperCase()}`,
    `Input records: ${dataset.records.length}`,
    `Output records: ${result.rows.length}`,
    `Date boundary: ${settings.startDate || 'not set'} through ${settings.endDate || 'not set'}`,
    `Timestamp precision: ${settings.timePrecision}`,
    `Included record types: ${settings.selectedTypes.join(', ') || 'none'}`,
    `Excluded record types: ${removedTypes.join(', ') || 'none'}`,
    `Included fields: ${result.headers.join(', ') || 'none'}`,
    `Removed fields: ${result.removedFields.join(', ') || 'none'}`,
    `Rows outside date boundary: ${result.omittedByDate}`,
    `Rows with excluded type: ${result.omittedByType}`,
    '',
    'Privacy note',
    'This file was minimized locally in your browser. It was not uploaded by Health Export Cleaner.',
    'Minimization is not anonymization. Values, dates, rare conditions, and combinations of records may still identify a person.',
    'Review the cleaned CSV before sharing it. The tool does not evaluate the sensitivity of free-text values.',
    '',
    'Source-format limits',
    dataset.kind === 'xml'
      ? 'Apple Health XML support covers <Record> elements only. Workouts, routes, clinical records, ActivitySummary, and nested metadata are omitted.'
      : 'CSV columns are inferred from the header. Unfamiliar identifier or location column names may not be detected automatically.',
    '',
    'Generated by Health Export Cleaner — https://health-export-cleaner.sociobot.in'
  ].join('\n');
}
