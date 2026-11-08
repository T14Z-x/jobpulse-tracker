/**
 * IndexedDB helper for screenshot caching & Supabase Cloud Sync
 */

import { getSupabaseClient } from './supabase';

const DB_NAME = 'jt-images-db';
const STORE_NAME = 'screenshots';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available in SSR'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

export async function saveScreenshot(id: string, base64Data: string): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(base64Data, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Also sync to Supabase cloud screenshots table if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;
      const payload: Record<string, unknown> = { id, data: base64Data };
      if (userId) payload.user_id = userId;
      await supabase.from('screenshots').upsert(payload);
    } catch {
      // ignore if cloud screenshots table isn't created yet
    }
  }
}

export async function getScreenshot(id: string): Promise<string | null> {
  try {
    const db = await getDb();
    const localResult = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (localResult) return localResult;
  } catch {
    // fallback to Supabase
  }

  // Pull from Supabase cloud if missing in local IndexedDB (e.g. viewing on phone)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.from('screenshots').select('data').eq('id', id).maybeSingle();
      if (data?.data) {
        const db = await getDb();
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(data.data, id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
        return data.data;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function deleteScreenshot(id: string): Promise<void> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('screenshots').delete().eq('id', id);
    } catch {
      // ignore
    }
  }
}

export async function getAllScreenshots(): Promise<Record<string, string>> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const result: Record<string, string> = {};

    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        result[String(cursor.key)] = cursor.value;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return reject(new Error('Canvas context could not be created'));
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
