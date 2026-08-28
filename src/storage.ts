import type { TimePrecision } from './types';

export interface SavedPreferences { timePrecision: TimePrecision }

const REAL_DB_NAME = 'health-export-cleaner';
const DEMO_DB_NAME = 'demo:health-export-cleaner';
const STORE = 'preferences';
let databaseName = REAL_DB_NAME;

/** Keep the try-out's tiny preference record out of a visitor's real namespace. */
export function useDemoStorage(isDemo: boolean): void {
  databaseName = isDemo ? DEMO_DB_NAME : REAL_DB_NAME;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
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

/** Demo preferences are disposable when someone returns to the real cleaner. */
export async function clearDemoPreferences(): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DEMO_DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => {
        const transaction = request.result.transaction(STORE, 'readwrite');
        const clear = transaction.objectStore(STORE).clear();
        clear.onsuccess = () => { request.result.close(); resolve(); };
        clear.onerror = () => reject(clear.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch { /* A blocked private-browsing database is safe to ignore. */ }
}
