import type { TimePrecision } from './types';

export interface SavedPreferences { timePrecision: TimePrecision }

const DB_NAME = 'health-export-cleaner';
const STORE = 'preferences';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadPreferences(): Promise<SavedPreferences | null> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get('cleaner');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch { return null; }
}

export async function savePreferences(value: SavedPreferences): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(value, 'cleaner');
  } catch { /* Private browsing can disable IndexedDB; the cleaner still works. */ }
}
