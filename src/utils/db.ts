import { AppState } from '../types/finance';
import { STORAGE_KEY, DEFAULT_STATE } from './storage';

const DB_NAME = 'QuanLyThuChiDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_RECORD_KEY = 'current_state';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Load fast from IndexedDB with localStorage fallback
export async function loadAppStateFromDB(): Promise<AppState> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(STATE_RECORD_KEY);

      request.onsuccess = () => {
        if (request.result && request.result.wallets && Array.isArray(request.result.wallets)) {
          resolve(request.result as AppState);
        } else {
          // Fallback to localStorage
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.wallets && Array.isArray(parsed.wallets)) {
                // Save into IndexedDB for next ultra-fast load
                saveAppStateToDB(parsed);
                resolve(parsed);
                return;
              }
            }
          } catch {
            // Ignore fallback error
          }
          resolve(DEFAULT_STATE);
        }
      };

      request.onerror = () => {
        resolve(DEFAULT_STATE);
      };
    });
  } catch (e) {
    console.warn('IndexedDB unavailable, using localStorage fallback', e);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.wallets && Array.isArray(parsed.wallets)) return parsed;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_STATE;
  }
}

// Save state to IndexedDB asynchronously (non-blocking, fast)
export async function saveAppStateToDB(state: AppState): Promise<void> {
  // Always mirror in localStorage immediately as well
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('localStorage save warning:', err);
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(state, STATE_RECORD_KEY);
  } catch (e) {
    console.warn('Could not save to IndexedDB:', e);
  }
}
