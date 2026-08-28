import { normalizeKey } from './parser';
import type { CleanerSettings, CleanResult, Dataset, TimePrecision } from './types';

const DATE_KEYS = new Set([
  'date', 'datetime', 'timestamp', 'time',
  'startdate', 'start_date', 'starttime', 'start_time',
  'enddate', 'end_date', 'endtime', 'end_time',
  'creationdate', 'creation_date', 'recorded_date', 'recorded_at',
  'observed_at', 'measured_at', 'logged_at'
]);
const SENSITIVE_TOKENS = new Set([
  'id', 'uuid', 'guid', 'identifier', 'email', 'name', 'device', 'serial', 'imei', 'source', 'metadata',
  'ssn', 'mrn', 'phone', 'telephone', 'mobile', 'cell',
  'lat', 'latitude', 'lon', 'lng', 'longitude', 'altitude', 'elevation', 'gps', 'route', 'location', 'address',
  'coordinate', 'coordinates'
]);

// Some exports remove every word boundary (for example `patientid`). Keep
// this list deliberately conservative and tied to common identity/device/
// location compounds; tokenized vendor measurement names remain available.
const SENSITIVE_COMPACT_PATTERNS = [
  /^(?:patient|participant|person|subject|user|member|account|record|study|sample)(?:id|identifier|uuid|guid|name|email|emailaddress|address)$/,
  /^(?:emailaddress|mailaddress)$/,
  /^(?:socialsecuritynumber|medicalrecordnumber|phonenumber|telephonenumber|mobilenumber|cellnumber|contactnumber)$/,
  /^(?:device(?:id|identifier|uuid|guid|name|serial|serialnumber|model|details)?|serialnumber|sourcename|sourceversion|sourceid)$/,
  /^(?:gps(?:coordinate|coordinates|location|route)?|location(?:id|name|coordinate|coordinates)?|geocoordinates?|coordinates?|latitude|longitude|altitude|elevation|route|streetaddress|postaladdress)$/
];

export function isSensitiveField(field: string): boolean {
  const normalized = normalizeKey(field);
  const tokens = normalized.split('_');
  if (tokens.some((token) => SENSITIVE_TOKENS.has(token))) return true;
  const compact = tokens.join('');
  return SENSITIVE_COMPACT_PATTERNS.some((pattern) => pattern.test(compact));
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
  let omittedWithoutUsableDate = 0;
  let omittedByType = 0;
  const hasDateBoundary = Boolean(settings.startDate || settings.endDate);

  for (const record of dataset.records) {
    if (!allowedTypes.has(record.type)) { omittedByType += 1; continue; }
    const date = recordDate(record.fields);
    if (hasDateBoundary && !date) {
      omittedWithoutUsableDate += 1; continue;
    }
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
  return { rows, headers, omittedByDate, omittedWithoutUsableDate, omittedByType, removedFields };
}

export function recordDate(fields: Record<string, string>): string {
  const preferred = ['startDate', 'start_date', 'date', 'timestamp', 'time', 'creationDate', 'creation_date'];
  for (const key of preferred) if (fields[key]) return extractCalendarDate(fields[key]);
  for (const [key, value] of Object.entries(fields)) if (isTimestampField(key)) return extractCalendarDate(value);
  return '';
}

export function extractCalendarDate(value: string): string {
  // ISO timestamps continue with `T`, a word character, so word boundaries
  // would miss the most common timestamp form. Only adjacent digits make a
  // calendar-date match invalid here.
  const date = value.match(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/);
  if (!date) return '';
  const year = Number(date[1]);
  const month = Number(date[2]);
  const day = Number(date[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? `${date[1]}-${date[2]}-${date[3]}`
    : '';
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
    'Source filename: omitted to avoid sharing an identifier from the original file.',
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
    `Rows without usable date under active boundary: ${result.omittedWithoutUsableDate}`,
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
