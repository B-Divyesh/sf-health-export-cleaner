import type { TimePrecision } from './types';

export interface SavedPreferences { timePrecision: TimePrecision }

export interface ClearPreferencesOptions { onBlocked?: () => void }

export interface PreferenceStorage {
  load: () => Promise<SavedPreferences | null>;
  save: (value: SavedPreferences) => Promise<void>;
  clear: (options?: ClearPreferencesOptions) => Promise<void>;
}

const REAL_DB_NAME = 'health-export-cleaner';
const DEMO_DB_NAME = 'demo:health-export-cleaner';
const STORE = 'preferences';

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Bind one storage namespace to the lifetime of the current document. */
export function createPreferenceStorage(isDemo: boolean): PreferenceStorage {
  const databaseName = isDemo ? DEMO_DB_NAME : REAL_DB_NAME;
  let pendingWrite: Promise<void> = Promise.resolve();

  async function load(): Promise<SavedPreferences | null> {
    try {
      const db = await openDatabase(databaseName);
      const value = await new Promise<SavedPreferences | null>((resolve, reject) => {
        const request = db.transaction(STORE).objectStore(STORE).get('cleaner');
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return value;
    } catch { return null; }
  }

  async function save(value: SavedPreferences): Promise<void> {
    pendingWrite = pendingWrite.then(async () => {
      const db = await openDatabase(databaseName);
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

  async function clear(options: ClearPreferencesOptions = {}): Promise<void> {
    try {
      await pendingWrite;
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(databaseName);
        request.onblocked = () => options.onBlocked?.();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch { /* Private browsing can disable IndexedDB; the cleaner still works. */ }
  }

  return { load, save, clear };
}
