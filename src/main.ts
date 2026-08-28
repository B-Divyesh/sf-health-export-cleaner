import './styles.css';
import { createZip } from './archive';
import { binTimestamp, cleanDataset, getDateBounds, isSensitiveField, isTimestampField, provenanceText, toCsv } from './cleaner';
import { formatBytes, parseHealthFile } from './parser';
import { loadPreferences, savePreferences } from './storage';
import type { CleanerSettings, CleanResult, Dataset, TimePrecision } from './types';

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fileInput = byId<HTMLInputElement>('file-input');
const uploadPanel = byId<HTMLElement>('upload-panel');
const configurePanel = byId<HTMLElement>('configure-panel');
const form = byId<HTMLFormElement>('cleaner-form');
const dropZone = byId<HTMLLabelElement>('drop-zone');
const errorBox = byId<HTMLElement>('error-box');
const progress = byId<HTMLElement>('parse-progress');
const startDate = byId<HTMLInputElement>('start-date');
const endDate = byId<HTMLInputElement>('end-date');
const dateError = byId<HTMLElement>('date-error');

let dataset: Dataset | null = null;
let result: CleanResult | null = null;
let updateWorker: ServiceWorker | null = null;
let refreshingForUpdate = false;

function setBusy(busy: boolean): void {
  progress.hidden = !busy;
  fileInput.disabled = busy;
  dropZone.classList.toggle('is-busy', busy);
}

async function inspectFile(file: File): Promise<void> {
  errorBox.hidden = true;
  setBusy(true);
  await new Promise((resolve) => window.setTimeout(resolve, 40));
  try {
    dataset = await parseHealthFile(file);
    renderDataset(dataset);
  } catch (error) {
    dataset = null;
    configurePanel.hidden = true;
    errorBox.textContent = error instanceof Error ? error.message : 'The file could not be read. Try exporting it again.';
    errorBox.hidden = false;
  } finally { setBusy(false); }
}

function renderDataset(source: Dataset): void {
  const bounds = getDateBounds(source);
  byId('source-name').textContent = source.filename;
  byId('source-format').textContent = source.kind.toUpperCase();
  byId('source-count').textContent = source.records.length.toLocaleString();
  byId('source-size').textContent = formatBytes(source.size);
  byId('source-span').textContent = bounds.min ? `${bounds.min} — ${bounds.max}` : 'Not detected';
  startDate.value = bounds.min;
  endDate.value = bounds.max;
  startDate.min = bounds.min; startDate.max = bounds.max;
  endDate.min = bounds.min; endDate.max = bounds.max;

  const warnings = byId('source-warnings');
  warnings.replaceChildren();
  if (source.warnings.length) {
    const strong = document.createElement('strong'); strong.textContent = 'Source note: ';
    warnings.append(strong, document.createTextNode(source.warnings.join(' ')));
    warnings.hidden = false;
  } else warnings.hidden = true;

  renderTypes(source);
  renderFields(source);
  configurePanel.hidden = false;
  document.querySelectorAll('.step-rail li').forEach((item, index) => item.classList.toggle('is-active', index <= 1));
  updatePreview();
  configurePanel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function renderTypes(source: Dataset): void {
  const counts = new Map<string, number>();
  source.records.forEach((record) => counts.set(record.type, (counts.get(record.type) ?? 0) + 1));
  const container = byId('type-options'); container.replaceChildren();
  [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([type, count], index) => {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.name = 'recordType'; input.value = type; input.checked = true; input.id = `type-${index}`;
    const copy = document.createElement('span');
    const strong = document.createElement('strong'); strong.textContent = type;
    const small = document.createElement('small'); small.textContent = `${count.toLocaleString()} record${count === 1 ? '' : 's'}`;
    copy.append(strong, small); label.append(input, copy); container.append(label);
  });
}

function renderFields(source: Dataset): void {
  const container = byId('field-options'); container.replaceChildren();
  source.headers.forEach((field, index) => {
    const blocked = isSensitiveField(field);
    const label = document.createElement('label'); label.className = blocked ? 'is-blocked' : '';
    const input = document.createElement('input'); input.type = 'checkbox'; input.name = 'field'; input.value = field; input.id = `field-${index}`; input.checked = !blocked; input.disabled = blocked;
    const name = document.createElement('span'); name.textContent = field;
    const state = document.createElement('small'); state.className = 'field-state';
    label.append(input, name, state); container.append(label);
  });
}

function updateFieldStates(settings: CleanerSettings): void {
  form.querySelectorAll<HTMLInputElement>('input[name="field"]').forEach((input) => {
    const label = input.closest('label');
    const state = label?.querySelector<HTMLElement>('.field-state');
    if (!label || !state) return;
    const blocked = input.disabled;
    label.classList.toggle('is-user-removed', !blocked && !input.checked);
    if (blocked) state.textContent = 'Always removed';
    else if (!input.checked) state.textContent = 'Removed by you';
    else if (isTimestampField(input.value) && settings.timePrecision === 'day') state.textContent = 'Kept · reduced to day';
    else if (isTimestampField(input.value) && settings.timePrecision === 'hour') state.textContent = 'Kept · reduced to hour';
    else if (isTimestampField(input.value)) state.textContent = 'Kept · exact timestamp';
    else state.textContent = 'Kept';
  });
}

function getSettings(): CleanerSettings {
  return {
    startDate: startDate.value,
    endDate: endDate.value,
    selectedTypes: [...form.querySelectorAll<HTMLInputElement>('input[name="recordType"]:checked')].map((input) => input.value),
    includedFields: [...form.querySelectorAll<HTMLInputElement>('input[name="field"]:checked')].map((input) => input.value),
    timePrecision: form.querySelector<HTMLInputElement>('input[name="precision"]:checked')?.value as TimePrecision ?? 'day'
  };
}

function updatePreview(): void {
  if (!dataset) return;
  const settings = getSettings();
  updateFieldStates(settings);
  const invalidDate = Boolean(settings.startDate && settings.endDate && settings.startDate > settings.endDate);
  dateError.hidden = !invalidDate;
  startDate.setAttribute('aria-invalid', String(invalidDate));
  endDate.setAttribute('aria-invalid', String(invalidDate));
  result = invalidDate ? { rows: [], headers: [], omittedByDate: 0, omittedByType: 0, removedFields: [] } : cleanDataset(dataset, settings);
  const leftOut = result.omittedByDate + result.omittedByType;
  byId('output-count').textContent = `${result.rows.length.toLocaleString()} row${result.rows.length === 1 ? '' : 's'}`;
  byId('kept-summary').textContent = `${result.rows.length.toLocaleString()} row${result.rows.length === 1 ? '' : 's'} kept`;
  byId('removed-summary').textContent = `${leftOut.toLocaleString()} row${leftOut === 1 ? '' : 's'} left out`;
  byId('removed-detail').textContent = `${result.omittedByDate.toLocaleString()} by date · ${result.omittedByType.toLocaleString()} by type`;
  byId('fields-summary').textContent = `${result.removedFields.length.toLocaleString()} field${result.removedFields.length === 1 ? '' : 's'} removed`;
  byId('removed-fields-detail').textContent = result.removedFields.length ? result.removedFields.join(', ') : 'None';
  renderPreviewTable(result);
  const noOutput = byId('no-output');
  if (invalidDate) noOutput.hidden = true;
  else if (!result.headers.length) {
    noOutput.textContent = 'No fields are selected. Select at least one available field to create a cleaned copy.';
    noOutput.hidden = false;
  } else if (!settings.selectedTypes.length) {
    noOutput.textContent = 'No record types are selected. Select at least one record type to include rows.';
    noOutput.hidden = false;
  } else if (!result.rows.length) {
    noOutput.textContent = 'No records match this date boundary. Widen the dates to include rows.';
    noOutput.hidden = false;
  } else noOutput.hidden = true;
  const download = byId<HTMLButtonElement>('download-button');
  download.disabled = invalidDate || !result.rows.length || !result.headers.length;
  document.querySelector('[data-step="3"]')?.classList.toggle('is-active', Boolean(result.rows.length && result.headers.length));
  void savePreferences({ timePrecision: settings.timePrecision });
}

function renderPreviewTable(output: CleanResult): void {
  const head = byId('preview-head'); const body = byId('preview-body');
  head.replaceChildren(); body.replaceChildren();
  const headerRow = document.createElement('tr');
  output.headers.forEach((header) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = header; headerRow.append(th); });
  head.append(headerRow);
  output.rows.slice(0, 5).forEach((row) => {
    const tr = document.createElement('tr');
    output.headers.forEach((header) => { const td = document.createElement('td'); td.textContent = row[header]; tr.append(td); });
    body.append(tr);
  });
}

function downloadText(name: string, content: string, type: string): void {
  downloadBlob(name, new Blob([content], { type }));
}

function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'health-export';
}

fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) void inspectFile(file); });
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', (event) => { const file = event.dataTransfer?.files[0]; if (file) void inspectFile(file); });

byId('sample-button').addEventListener('click', () => {
  const sample = 'type,startDate,endDate,value,unit,sourceName,device,latitude,notes\nHeartRate,2026-08-20 08:12:41 +0000,2026-08-20 08:12:41 +0000,72,count/min,Watch,Model X,51.5072,morning reading\nStepCount,2026-08-21 14:45:09 +0000,2026-08-21 15:00:00 +0000,1240,count,Phone,Phone X,51.5080,lunch walk\nHeartRate,2026-08-25 21:03:12 +0000,2026-08-25 21:03:12 +0000,66,count/min,Watch,Model X,51.5090,resting';
  void inspectFile(new File([sample], 'sample-health-export.csv', { type: 'text/csv' }));
});

form.addEventListener('input', updatePreview);
byId('types-all').addEventListener('click', () => { form.querySelectorAll<HTMLInputElement>('input[name="recordType"]').forEach((input) => { input.checked = true; }); updatePreview(); });
byId('types-none').addEventListener('click', () => { form.querySelectorAll<HTMLInputElement>('input[name="recordType"]').forEach((input) => { input.checked = false; }); updatePreview(); });
byId('fields-safe').addEventListener('click', () => { form.querySelectorAll<HTMLInputElement>('input[name="field"]:not(:disabled)').forEach((input) => { input.checked = true; }); updatePreview(); });
byId('fields-minimum').addEventListener('click', () => { form.querySelectorAll<HTMLInputElement>('input[name="field"]:not(:disabled)').forEach((input) => { input.checked = isTimestampField(input.value) || ['type', 'value', 'unit'].includes(input.value.toLowerCase()); }); updatePreview(); });

byId('clear-button').addEventListener('click', () => {
  if (!dataset || !window.confirm(`Remove “${dataset.filename}” from this tab? Your original file will not be changed.`)) return;
  dataset = null; result = null; configurePanel.hidden = true; fileInput.value = ''; errorBox.hidden = true;
  document.querySelectorAll('.step-rail li').forEach((item, index) => item.classList.toggle('is-active', index === 0));
  uploadPanel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});

byId('download-button').addEventListener('click', () => {
  if (!dataset || !result) return;
  const settings = getSettings(); const base = `${baseName(dataset.filename)}-cleaned`;
  const archive = createZip([
    { name: `${base}.csv`, content: toCsv(result.headers, result.rows) },
    { name: `${base}-provenance.txt`, content: provenanceText(dataset, settings, result) }
  ]);
  downloadBlob(`${base}-package.zip`, archive);
});

byId('export-settings').addEventListener('click', () => downloadText('health-export-cleaner-preferences.json', JSON.stringify({ version: 1, timePrecision: getSettings().timePrecision }, null, 2), 'application/json'));
byId<HTMLInputElement>('import-settings').addEventListener('change', async (event) => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return;
  try {
    const value = JSON.parse(await file.text()) as { timePrecision?: string };
    if (!['day', 'hour', 'exact'].includes(value.timePrecision ?? '')) throw new Error();
    const radio = form.querySelector<HTMLInputElement>(`input[name="precision"][value="${value.timePrecision}"]`); if (radio) radio.checked = true;
    updatePreview();
  } catch { window.alert('Those preferences could not be imported. Choose a preferences JSON file exported by this tool.'); }
});

function updateNetworkStatus(): void {
  const status = byId('network-status'); const offline = !navigator.onLine;
  status.textContent = offline ? 'Offline · cleaner ready' : 'Online · works offline';
  status.classList.toggle('is-offline', offline);
}
window.addEventListener('online', updateNetworkStatus); window.addEventListener('offline', updateNetworkStatus); updateNetworkStatus();

void loadPreferences().then((preferences) => {
  if (!preferences) return;
  const radio = form.querySelector<HTMLInputElement>(`input[name="precision"][value="${preferences.timePrecision}"]`); if (radio) radio.checked = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (registration.waiting) showUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker); });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshingForUpdate) window.location.reload(); });
  });
}

function showUpdate(worker: ServiceWorker): void { updateWorker = worker; byId('update-toast').hidden = false; }
byId('update-button').addEventListener('click', () => { refreshingForUpdate = true; updateWorker?.postMessage({ type: 'SKIP_WAITING' }); });

// Keep this exported behavior covered by the module graph and prevent accidental timezone conversion.
void binTimestamp;
