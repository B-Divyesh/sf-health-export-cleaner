import { describe, expect, it } from 'vitest';
import { parseCsvRows, parseHealthCsv, parseHealthXml } from '../src/parser';
import { binTimestamp, cleanDataset, isSensitiveField, provenanceText, toCsv } from '../src/cleaner';
import { createZip } from '../src/archive';
import type { CleanerSettings, Dataset } from '../src/types';

async function readStoredZip(blob: Blob): Promise<Map<string, string>> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = new Map<string, string>();
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    expect(view.getUint16(offset + 8, true)).toBe(0);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const contentOffset = offset + 30 + nameLength + extraLength;
    const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength));
    entries.set(name, new TextDecoder().decode(bytes.slice(contentOffset, contentOffset + size)));
    offset = contentOffset + size;
  }
  return entries;
}

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

  it.each([
    ['camelCase', ['patientId', 'patientName', 'emailAddress', 'deviceId', 'gpsCoordinates']],
    ['PascalCase', ['PatientId', 'PatientName', 'EmailAddress', 'DeviceId', 'GpsCoordinates']],
    ['spaced', ['patient id', 'patient name', 'email address', 'device id', 'gps coordinates']],
    ['dashed', ['patient-id', 'patient-name', 'email-address', 'device-id', 'gps-coordinates']],
    ['underscored', ['patient_id', 'patient_name', 'email_address', 'device_id', 'gps_coordinates']],
    ['compact', ['patientid', 'patientname', 'emailaddress', 'deviceid', 'gpscoordinates']]
  ])('recognizes %s identifier, name, email, device, and location variants', (_style, fields) => {
    expect(fields.every(isSensitiveField)).toBe(true);
  });

  it('recognizes the verifier fixture fields and legacy sensitive aliases', () => {
    expect([
      'patientId', 'participantID', 'recordId', 'patientName', 'emailAddress', 'gpsCoordinates',
      'sourceName', 'sourceVersion', 'device', 'GPSRoute', 'longitude', 'user_id'
    ].every(isSensitiveField)).toBe(true);
  });

  it('removes direct identifiers from the actual ZIP CSV payload', async () => {
    const sensitiveDataset: Dataset = {
      kind: 'csv', filename: 'verifier.csv', size: 240, warnings: [],
      headers: ['type', 'date', 'value', 'patientId', 'participantID', 'recordId', 'patientName', 'emailAddress', 'gpsCoordinates'],
      records: [{
        type: 'HeartRate',
        fields: {
          type: 'HeartRate', date: '2026-08-28', value: '72', patientId: 'P-123', participantID: 'S-456',
          recordId: 'R-789', patientName: 'Jane Doe', emailAddress: 'jane@example.test', gpsCoordinates: '51.5,-0.1'
        }
      }]
    };
    const sensitiveSettings: CleanerSettings = {
      startDate: '2026-08-28', endDate: '2026-08-28', selectedTypes: ['HeartRate'],
      includedFields: sensitiveDataset.headers, timePrecision: 'day'
    };
    const cleaned = cleanDataset(sensitiveDataset, sensitiveSettings);
    const entries = await readStoredZip(createZip([
      { name: 'verifier-cleaned.csv', content: toCsv(cleaned.headers, cleaned.rows) },
      { name: 'verifier-cleaned-provenance.txt', content: provenanceText(sensitiveDataset, sensitiveSettings, cleaned) }
    ]));
    const csv = entries.get('verifier-cleaned.csv') ?? '';
    expect(csv).toBe('type,date,value\r\nHeartRate,2026-08-28,72\r\n');
    expect(csv).not.toMatch(/P-123|S-456|R-789|Jane Doe|jane@example\.test|51\.5,-0\.1/);
    expect(entries.get('verifier-cleaned-provenance.txt')).toContain('patientId, participantID, recordId, patientName, emailAddress, gpsCoordinates');
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
