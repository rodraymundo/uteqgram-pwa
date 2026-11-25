// Datos locales: IndexedDB sin librerías externas
const DB_NAME = 'uteqgram-react';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(storeName, mode, action) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);

    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
  }));
}

export function writeData(storeName, data) {
  return withStore(storeName, 'readwrite', (store) => store.put(data));
}

export function readAllData(storeName) {
  return withStore(storeName, 'readonly', (store) => store.getAll());
}

export function clearAllData(storeName) {
  return withStore(storeName, 'readwrite', (store) => store.clear());
}

export function deleteItem(storeName, id) {
  return withStore(storeName, 'readwrite', (store) => store.delete(id));
}

// Reemplaza todo lo guardado con la lista nueva
export function saveAll(storeName, items) {
  return withStore(storeName, 'readwrite', (store) => {
    store.clear();
    items.forEach((item) => store.put(item));
    return null;
  });
}
