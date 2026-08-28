import { describe, expect, it } from 'vitest';
import { parseCsvRows, parseHealthCsv, parseHealthXml } from '../src/parser';
import { binTimestamp, cleanDataset, isSensitiveField, provenanceText, toCsv } from '../src/cleaner';
import { createZip } from '../src/archive';
import type { CleanerSettings, Dataset } from '../src/types';

describe('CSV parsing', () => {
  it('supports quoted commas, escaped quotes, and line breaks', () => {
    expect(parseCsvRows('type,note\r\nHeartRate,"resting, \"\"calm\"\""\r\nSteps,"two\nlines"')).toEqual([
      ['type', 'note'],
      ['HeartRate', 'resting, "calm"'],
      ['Steps', 'two\nlines']
    ]);
  });

  it('rejects unclosed quoted values', () => {
    expect(() => parseHealthCsv('type,value\nHeartRate,"72')).toThrow(/unclosed quoted field/i);
  });

  it('groups a generic CSV without a type column and reports it', () => {
    const parsed = parseHealthCsv('date,value\n2026-08-28,120');
    expect(parsed.records[0].type).toBe('CSV record');
    expect(parsed.warnings[0]).toMatch(/No record-type column/);
  });
});

describe('download package', () => {
  it('creates a ZIP containing both named artifacts', async () => {
    const zip = createZip([{ name: 'cleaned.csv', content: 'value\r\n72' }, { name: 'provenance.txt', content: 'local only' }]);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    const text = new TextDecoder().decode(bytes);
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(text).toContain('cleaned.csv');
    expect(text).toContain('provenance.txt');
  });
});

describe('Apple Health XML parsing', () => {
  it('extracts Record attributes, decodes entities, and ignores workouts', () => {
    const parsed = parseHealthXml(`<?xml version="1.0"?><HealthData><Record type="HKQuantityTypeIdentifierHeartRate" sourceName="A &amp; B" startDate="2026-08-20 08:12:41 +0000" value="72"/><Workout workoutActivityType="Run"/></HealthData>`);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].type).toBe('HeartRate');
    expect(parsed.records[0].fields.sourceName).toBe('A & B');
    expect(parsed.warnings[0]).toMatch(/Workout elements/);
  });

  it('rejects unrelated XML', () => {
    expect(() => parseHealthXml('<records><Record type="x"/></records>')).toThrow(/HealthData element is missing/);
  });
});

describe('minimization', () => {
  const dataset: Dataset = {
    kind: 'csv', filename: 'health.csv', size: 300,
    headers: ['type', 'startDate', 'value', 'sourceName', 'latitude', 'notes'], warnings: [],
    records: [
      { type: 'HeartRate', fields: { type: 'HeartRate', startDate: '2026-08-20 08:12:41 +0000', value: '72', sourceName: 'Watch', latitude: '51.5', notes: 'resting' } },
      { type: 'Steps', fields: { type: 'Steps', startDate: '2026-08-21 12:05:00 +0000', value: '1200', sourceName: 'Phone', latitude: '51.6', notes: 'walk' } }
    ]
  };
  const settings: CleanerSettings = { startDate: '2026-08-20', endDate: '2026-08-20', selectedTypes: ['HeartRate'], includedFields: dataset.headers, timePrecision: 'day' };

  it('always drops identifiers and location while filtering rows', () => {
    const output = cleanDataset(dataset, settings);
    expect(output.rows).toEqual([{ type: 'HeartRate', startDate: '2026-08-20', value: '72', notes: 'resting' }]);
    expect(output.removedFields).toEqual(['sourceName', 'latitude']);
    expect(output.omittedByType).toBe(1);
  });

  it('recognizes common compact sensitive names', () => {
    expect(['sourceName', 'sourceVersion', 'device', 'GPSRoute', 'longitude', 'user_id'].every(isSensitiveField)).toBe(true);
  });

  it('bins timestamps without shifting calendar dates across time zones', () => {
    expect(binTimestamp('2026-01-01 00:15:00 +1300', 'day')).toBe('2026-01-01');
    expect(binTimestamp('2026-01-01T22:15:00-1000', 'hour')).toBe('2026-01-01 22:00');
  });

  it('quotes output and produces an explicit risk note', () => {
    expect(toCsv(['note'], [{ note: 'a, "quote"' }])).toContain('"a, ""quote"""');
    const output = cleanDataset(dataset, settings);
    expect(provenanceText(dataset, settings, output)).toMatch(/Minimization is not anonymization/);
  });
});
