import type { TimePrecision } from './types';

export interface SavedPreferences { timePrecision: TimePrecision }

const REAL_DB_NAME = 'health-export-cleaner';
const DEMO_DB_NAME = 'demo:health-export-cleaner';
const STORE = 'preferences';
let databaseName = REAL_DB_NAME;
let pendingWrite: Promise<void> = Promise.resolve();

/** Keep the try-out's tiny preference record out of a visitor's real namespace. */
export function useDemoStorage(isDemo: boolean): void {
  databaseName = isDemo ? DEMO_DB_NAME : REAL_DB_NAME;
}

function openDatabase(name = databaseName): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadPreferences(): Promise<SavedPreferences | null> {
  try {
    const db = await openDatabase();
    const value = await new Promise<SavedPreferences | null>((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get('cleaner');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  } catch { return null; }
}

export async function savePreferences(value: SavedPreferences): Promise<void> {
  const targetName = databaseName;
  pendingWrite = pendingWrite.then(async () => {
    const db = await openDatabase(targetName);
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(value, 'cleaner');
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally { db.close(); }
  }).catch(() => { /* Private browsing can disable IndexedDB; the cleaner still works. */ });
  await pendingWrite;
}

/** Demo preferences are disposable when someone returns to the real cleaner. */
export async function clearDemoPreferences(): Promise<void> {
  try {
    await pendingWrite;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DEMO_DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch { /* A blocked private-browsing database is safe to ignore. */ }
}
