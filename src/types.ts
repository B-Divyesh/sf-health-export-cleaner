export type SourceKind = 'csv' | 'xml';
export type TimePrecision = 'exact' | 'hour' | 'day';

export interface HealthRecord {
  type: string;
  fields: Record<string, string>;
}

export interface Dataset {
  kind: SourceKind;
  filename: string;
  size: number;
  headers: string[];
  records: HealthRecord[];
  warnings: string[];
}

export interface CleanerSettings {
  startDate: string;
  endDate: string;
  selectedTypes: string[];
  includedFields: string[];
  timePrecision: TimePrecision;
}

export interface CleanResult {
  rows: Record<string, string>[];
  headers: string[];
  omittedByDate: number;
  omittedByType: number;
  removedFields: string[];
}
