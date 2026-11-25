// Service Worker de UTEQGram (versión React)
var CACHE_STATIC_NAME = 'react-static-v1';
var CACHE_DYNAMIC_NAME = 'react-dynamic-v1';

var SUPABASE_URL = 'https://oxszjpoaxbuhmpuoclga.supabase.co';
var SUPABASE_KEY = 'sb_publishable_d-Y4P4YYg-VA-tx7M4UgEA_foxknNch';
var DEFAULT_IMAGE = SUPABASE_URL + '/storage/v1/object/public/posts/sf-boat.jfif';
var POSTS_URL = SUPABASE_URL + '/rest/v1/post?select=*';

var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/main-image.jpg',
  '/icons/app-icon-96x96.png',
  '/icons/app-icon-192x192.png',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// ---------- IndexedDB (misma base que usa la app) ----------
function openDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open('uteqgram-react', 1);
    request.onupgradeneeded = function() {
      var db = request.result;
      if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', { keyPath: 'id' });
      }
    };
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

function withStore(storeName, mode, action) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, mode);
      var request = action(tx.objectStore(storeName));
      tx.oncomplete = function() { resolve(request ? request.result : undefined); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

function readAllData(st) {
  return withStore(st, 'readonly', function(store) { return store.getAll(); });
}

function replaceAll(st, items) {
  return withStore(st, 'readwrite', function(store) {
    store.clear();
    items.forEach(function(item) { store.put(item); });
    return null;
  });
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ---------- Ciclo de vida ----------
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing ...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function(cache) {
      console.log('[Service Worker] Precaching App Shell');
      return cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating ...');
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            return caches.delete(key);
          }
        }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

// ---------- Estrategias de caché ----------
self.addEventListener('fetch', function(event) {
  var request = event.request;

  if (request.method !== 'GET' || request.url.indexOf('http') !== 0) {
    return;
  }

  // 1) Datos remotos: red primero, si falla se responde con IndexedDB
  if (request.url.indexOf(POSTS_URL) > -1) {
    event.respondWith(
      fetch(request).catch(function() {
        return readAllData('posts')
          .then(function(data) { return jsonResponse(data || []); })
          .catch(function() { return jsonResponse([]); });
      })
    );
    return;
  }

  // 2) Navegación (rutas de React): red primero y respaldo con index.html guardado
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(res) {
          var copy = res.clone();
          caches.open(CACHE_STATIC_NAME).then(function(cache) { cache.put('/index.html', copy); });
          return res;
        })
        .catch(function() {
          return caches.match('/index.html').then(function(res) {
            return res || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // 3) Archivos (JS/CSS generados por Vite, imágenes, fuentes): caché primero
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then(function(res) {
          if (res.ok || res.type === 'opaque') {
            var copy = res.clone();
            caches.open(CACHE_DYNAMIC_NAME).then(function(cache) { cache.put(request, copy); });
          }
          return res;
        })
        .catch(function() {
          return new Response('', { status: 503, statusText: 'Sin conexión' });
        });
    })
  );
});

// ---------- Sincronización en segundo plano ----------
self.addEventListener('sync', function(event) {
  if (event.tag !== 'sync-new-posts') {
    return;
  }
  console.log('[Service Worker] Syncing new posts');

  event.waitUntil(
    readAllData('sync-posts').then(function(data) {
      var failed = [];
      var sent = 0;

      var chain = data.reduce(function(promise, post) {
        return promise.then(function() {
          return fetch(SUPABASE_URL + '/rest/v1/post', {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': 'Bearer ' + SUPABASE_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              id: post.id,
              title: post.title,
              location: post.location,
              image: post.image || DEFAULT_IMAGE
            })
          })
            .then(function(res) {
              if (res.ok) { sent++; } else { failed.push(post); }
            })
            .catch(function() { failed.push(post); });
        });
      }, Promise.resolve());

      return chain
        .then(function() { return replaceAll('sync-posts', failed); })
        .then(function() {
          if (sent > 0 && Notification.permission === 'granted') {
            return self.registration.showNotification('Publicaciones sincronizadas', {
              body: sent === 1 ? 'Tu publicación ya está en UTEQGram.' : sent + ' publicaciones ya están en UTEQGram.',
              icon: '/icons/app-icon-96x96.png',
              badge: '/icons/app-icon-96x96.png',
              vibrate: [100, 50, 200],
              tag: 'sync-posts',
              renotify: true,
              data: { url: '/' }
            });
          }
        })
        .then(function() { return self.clients.matchAll(); })
        .then(function(clients) {
          clients.forEach(function(client) { client.postMessage({ action: 'updateUI' }); });
          console.log('[Service Worker] Synchronization finished');
          if (failed.length > 0) {
            throw new Error('Quedaron publicaciones pendientes');
          }
        });
    })
  );
});

// ---------- Notificaciones push ----------
self.addEventListener('push', function(event) {
  var data = { title: 'UTEQGram', content: '¡Hay publicaciones nuevas!', openUrl: '/' };
  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.content = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.content,
      icon: '/icons/app-icon-96x96.png',
      badge: '/icons/app-icon-96x96.png',
      vibrate: [100, 50, 200],
      data: { url: data.openUrl }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      var client = list.find(function(c) { return c.visibilityState === 'visible'; });
      if (client) {
        client.navigate(targetUrl);
        return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
