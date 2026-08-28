import type { Dataset, HealthRecord, SourceKind } from './types';

export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_RECORDS = 500_000;
// Apple Health records are shallow (HealthData > Record > optional metadata).
// A cap prevents malformed nested markup from retaining an unbounded stack.
const MAX_XML_DEPTH = 256;

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
  let afterClosingQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') { quoted = false; afterClosingQuote = true; }
      else cell += char;
    } else if (afterClosingQuote) {
      if (char === ',') { row.push(cell); cell = ''; afterClosingQuote = false; }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[index + 1] === '\n') index += 1;
        row.push(cell); rows.push(row); row = []; cell = ''; afterClosingQuote = false;
      } else {
        throw new Error('The CSV has text after a closing quote. A quoted field must end at a comma or row ending.');
      }
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === '"') throw new Error('The CSV has a quote inside an unquoted field. Quote the whole field and export it again.');
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
  const records: HealthRecord[] = [];
  const headerSet = new Set<string>();
  const stack: string[] = [];
  let rootSeen = false;
  let rootClosed = false;
  let sawWorkout = false;
  let position = 0;

  const addRecord = (fields: Record<string, string>) => {
    if (!fields.type) return;
    if (records.length >= MAX_RECORDS) {
      throw new Error('This export has more than 500,000 records. Export a smaller date range from the source first.');
    }
    Object.keys(fields).forEach((key) => headerSet.add(key));
    records.push({ type: shortAppleType(fields.type), fields });
  };

  while (position < text.length) {
    const nextTag = text.indexOf('<', position);
    const textEnd = nextTag === -1 ? text.length : nextTag;
    validateXmlText(text.slice(position, textEnd));
    if (!stack.length && text.slice(position, textEnd).trim()) {
      throw malformedXml('text outside the HealthData element');
    }
    if (nextTag === -1) break;

    if (text.startsWith('<!--', nextTag)) {
      const end = text.indexOf('-->', nextTag + 4);
      if (end === -1 || text.slice(nextTag + 4, end).includes('--')) throw malformedXml('an unclosed or invalid comment');
      position = end + 3;
      continue;
    }
    if (text.startsWith('<![CDATA[', nextTag)) {
      const end = text.indexOf(']]>', nextTag + 9);
      if (end === -1) throw malformedXml('an unclosed CDATA section');
      if (!stack.length && text.slice(nextTag + 9, end).trim()) throw malformedXml('text outside the HealthData element');
      position = end + 3;
      continue;
    }
    if (text.startsWith('<?', nextTag)) {
      const end = text.indexOf('?>', nextTag + 2);
      if (end === -1) throw malformedXml('an unclosed processing instruction');
      position = end + 2;
      continue;
    }
    if (/^<!DOCTYPE\b/i.test(text.slice(nextTag, nextTag + 10))) {
      throw new Error('This XML is not a supported Apple Health export: document type declarations are not supported. Export the file again from Apple Health.');
    }
    if (text.startsWith('<!', nextTag)) throw malformedXml('unsupported declaration');

    const end = findXmlTagEnd(text, nextTag + 1);
    const token = text.slice(nextTag + 1, end);
    position = end + 1;
    if (token.startsWith('/')) {
      const name = parseClosingTag(token);
      const expected = stack.pop();
      if (expected !== name) throw malformedXml(`expected </${expected ?? 'HealthData'}> but found </${name}>`);
      if (!stack.length) rootClosed = true;
      continue;
    }

    const { name, attributes, selfClosing } = parseOpeningTag(token);
    if (!rootSeen) {
      if (name !== 'HealthData') throw new Error('This XML is not a supported Apple Health export: the HealthData element is missing.');
      rootSeen = true;
    } else if (rootClosed) {
      throw malformedXml('more than one root element');
    }

    const isDirectRecord = name === 'Record' && stack.length === 1 && stack[0] === 'HealthData';
    if (name === 'Workout') sawWorkout = true;
    if (isDirectRecord) addRecord(attributes);

    if (!selfClosing) {
      stack.push(name);
      if (stack.length > MAX_XML_DEPTH) throw new Error(`This XML is too deeply nested (more than ${MAX_XML_DEPTH} elements). Export a fresh Apple Health file and try again.`);
    } else if (!stack.length) {
      rootClosed = true;
    }
  }
  if (!rootSeen) throw new Error('This XML is not a supported Apple Health export: the HealthData element is missing.');
  if (stack.length) throw malformedXml(`an unclosed <${stack[stack.length - 1]}> element`);
  if (!rootClosed) throw malformedXml('an unclosed HealthData element');
  if (!records.length) throw new Error('No Apple Health Record elements were found. Workouts, routes, and clinical records are not supported in v1.');
  return {
    headers: [...headerSet],
    records,
    warnings: sawWorkout ? ['Workout elements are not included; only Apple Health Record elements are supported.'] : []
  };
}

export function parseXmlAttributes(source: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let position = 0;
  while (position < source.length) {
    position = skipWhitespace(source, position);
    if (position >= source.length) break;
    const nameStart = position;
    position = readXmlName(source, position);
    if (position === nameStart) throw malformedXml('an invalid attribute name');
    const name = source.slice(nameStart, position);
    position = skipWhitespace(source, position);
    if (source[position] !== '=') throw malformedXml(`attribute ${name} is missing =`);
    position = skipWhitespace(source, position + 1);
    const quote = source[position];
    if (quote !== '"' && quote !== "'") throw malformedXml(`attribute ${name} is not quoted`);
    const valueStart = ++position;
    while (position < source.length && source[position] !== quote) {
      if (source[position] === '<') throw malformedXml(`attribute ${name} contains <`);
      position += 1;
    }
    if (position >= source.length) throw malformedXml(`attribute ${name} has an unclosed value`);
    if (Object.hasOwn(fields, name)) throw malformedXml(`attribute ${name} is duplicated`);
    fields[name] = decodeXml(source.slice(valueStart, position));
    position += 1;
  }
  return fields;
}

function decodeXml(value: string): string {
  let decoded = '';
  let position = 0;
  while (position < value.length) {
    const ampersand = value.indexOf('&', position);
    if (ampersand === -1) return decoded + value.slice(position);
    decoded += value.slice(position, ampersand);
    const semicolon = value.indexOf(';', ampersand + 1);
    if (semicolon === -1) throw malformedXml('an unclosed entity reference');
    const entity = value.slice(ampersand, semicolon + 1);
    const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
    if (Object.hasOwn(named, entity)) decoded += named[entity];
    else if (/^&#(?:\d+|x[\da-f]+);$/i.test(entity)) {
      const radix = entity[2].toLowerCase() === 'x' ? 16 : 10;
      const raw = entity.slice(radix === 16 ? 3 : 2, -1);
      const code = Number.parseInt(raw, radix);
      if (!Number.isInteger(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        throw malformedXml('an invalid numeric entity reference');
      }
      decoded += String.fromCodePoint(code);
    } else throw malformedXml(`an unknown entity reference ${entity}`);
    position = semicolon + 1;
  }
  return decoded;
}

function findXmlTagEnd(text: string, position: number): number {
  let quote = '';
  for (let index = position; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '>') return index;
    else if (char === '<') throw malformedXml('a < character inside a tag');
  }
  throw malformedXml('an unclosed tag');
}

function parseOpeningTag(token: string): { name: string; attributes: Record<string, string>; selfClosing: boolean } {
  let end = token.length;
  while (end > 0 && /\s/.test(token[end - 1])) end -= 1;
  const selfClosing = token[end - 1] === '/';
  if (selfClosing) end -= 1;
  const content = token.slice(0, end);
  const nameEnd = readXmlName(content, 0);
  if (!nameEnd) throw malformedXml('an invalid element name');
  const name = content.slice(0, nameEnd);
  return { name, attributes: parseXmlAttributes(content.slice(nameEnd)), selfClosing };
}

function parseClosingTag(token: string): string {
  const content = token.slice(1).trim();
  const nameEnd = readXmlName(content, 0);
  if (!nameEnd || nameEnd !== content.length) throw malformedXml('an invalid closing tag');
  return content;
}

function readXmlName(value: string, position: number): number {
  if (!/[A-Za-z_:]/.test(value[position] ?? '')) return position;
  let end = position + 1;
  while (/[A-Za-z0-9_:.-]/.test(value[end] ?? '')) end += 1;
  return end;
}

function skipWhitespace(value: string, position: number): number {
  while (/\s/.test(value[position] ?? '')) position += 1;
  return position;
}

function validateXmlText(value: string): void {
  if (value.includes(']]>')) throw malformedXml(']]> outside a CDATA section');
  if (value.includes('&')) decodeXml(value);
}

function malformedXml(detail: string): Error {
  return new Error(`This Apple Health XML is malformed: ${detail}. Export the file again from Apple Health.`);
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
