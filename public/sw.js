importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v11';
var CACHE_DYNAMIC_NAME = 'dynamic-v8';

var SUPABASE_URL = 'https://oxszjpoaxbuhmpuoclga.supabase.co';
var SUPABASE_KEY = 'sb_publishable_d-Y4P4YYg-VA-tx7M4UgEA_foxknNch';
var DEFAULT_IMAGE = SUPABASE_URL + '/storage/v1/object/public/posts/sf-boat.jfif';

// App Shell: archivos que se guardan al instalar
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/help/',
  '/help/index.html',
  '/manifest.json',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/utility.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/css/help.css',
  '/src/images/favicon.png',
  '/src/images/main-image-lg.png',
  '/src/images/icons/app-icon-96x96.png',
  '/src/images/icons/app-icon-192x192.png',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.min.js'
];

// INSTALL
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...');

  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(STATIC_FILES);
      })
  );
});

// ACTIVATE: borra cachés de versiones anteriores
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ...');

  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(
          keyList.map(function(key) {
            if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

function isInArray(string, array) {
  var cachePath;

  if (string.indexOf(self.location.origin) === 0) {
    cachePath = string.substring(self.location.origin.length);
  } else {
    cachePath = string;
  }

  return array.indexOf(cachePath) > -1;
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// FETCH
self.addEventListener('fetch', function(event) {

  // Solo se manejan peticiones GET http(s); los POST van directo a la red
  if (event.request.method !== 'GET' || event.request.url.indexOf('http') !== 0) {
    return;
  }

  var url = SUPABASE_URL + '/rest/v1/post?select=*';

  if (event.request.url.indexOf(url) > -1) {
    // Datos remotos: primero la red y se guarda copia en IndexedDB
    event.respondWith(
      fetch(event.request)
        .then(function(res) {
          var clonedRes = res.clone();

          event.waitUntil(
            clonedRes.json()
              .then(function(data) {
                return clearAllData('posts')
                  .then(function() {
                    return Promise.all(
                      data.map(function(post) {
                        return writeData('posts', post);
                      })
                    );
                  });
              })
              .catch(function(err) {
                console.log('Error al guardar posts:', err);
              })
          );

          return res;
        })
        .catch(function(err) {
          // Sin conexión: se responde con los datos guardados en IndexedDB
          console.log('Sin conexión a Supabase, se usan datos locales:', err);
          return readAllData('posts')
            .then(function(data) {
              return jsonResponse(data || []);
            })
            .catch(function() {
              return jsonResponse([]);
            });
        })
    );

  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // App Shell: solo caché
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          return response || fetch(event.request);
        })
    );

  } else {
    // Resto: caché con respaldo de red (caché dinámica)
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }

          return fetch(event.request)
            .then(function(res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                  cache.put(event.request.url, res.clone());
                  return res;
                });
            })
            .catch(function() {
              return caches.open(CACHE_STATIC_NAME)
                .then(function(cache) {
                  if (
                    event.request.headers.get('accept') &&
                    event.request.headers.get('accept').includes('text/html')
                  ) {
                    return cache.match('/offline.html');
                  }
                  return new Response('', { status: 503, statusText: 'Sin conexión' });
                });
            });
        })
    );
  }
});

// SINCRONIZACIÓN EN SEGUNDO PLANO
self.addEventListener('sync', function(event) {

  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new posts');

    event.waitUntil(
      readAllData('sync-posts')
        .then(function(data) {
          var failedPosts = [];
          var sentCount = 0;
          var syncPromise = Promise.resolve();

          data.forEach(function(dt) {
            syncPromise = syncPromise.then(function() {
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
                  id: dt.id,
                  title: dt.title,
                  location: dt.location,
                  image: dt.image || DEFAULT_IMAGE
                })
              })
                .then(function(res) {
                  console.log('Resultado de sincronización:', res.status);
                  if (res.ok) {
                    sentCount++;
                  } else {
                    failedPosts.push(dt);
                  }
                })
                .catch(function(err) {
                  console.log('Error al enviar publicación:', err);
                  failedPosts.push(dt);
                });
            });
          });

          return syncPromise
            .then(function() {
              return clearAllData('sync-posts');
            })
            .then(function() {
              return Promise.all(
                failedPosts.map(function(post) {
                  return writeData('sync-posts', post);
                })
              );
            })
            .then(function() {
              // Notificación al usuario con el resultado
              if (sentCount > 0 && Notification.permission === 'granted') {
                return self.registration.showNotification('Publicaciones sincronizadas', {
                  body: sentCount === 1
                    ? 'Tu publicación ya está en UTEQGram.'
                    : sentCount + ' publicaciones ya están en UTEQGram.',
                  icon: '/src/images/icons/app-icon-96x96.png',
                  badge: '/src/images/icons/app-icon-96x96.png',
                  vibrate: [100, 50, 200],
                  tag: 'sync-posts',
                  renotify: true,
                  data: { url: '/' }
                });
              }
            })
            .then(function() {
              return self.clients.matchAll();
            })
            .then(function(clients) {
              clients.forEach(function(client) {
                client.postMessage({ action: 'updateUI' });
              });
              console.log('[Service Worker] Synchronization finished');

              if (failedPosts.length > 0) {
                // Se vuelve a intentar en la próxima sincronización
                throw new Error('Quedaron publicaciones pendientes');
              }
            });
        })
    );
  }
});

// NOTIFICACIONES PUSH (se pueden probar desde DevTools > Application > Service Workers > Push)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push recibido', event);

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
      icon: '/src/images/icons/app-icon-96x96.png',
      badge: '/src/images/icons/app-icon-96x96.png',
      vibrate: [100, 50, 200],
      data: { url: data.openUrl }
    })
  );
});

// CLIC EN LA NOTIFICACIÓN: abre o enfoca la app
self.addEventListener('notificationclick', function(event) {
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clis) {
        var client = clis.find(function(c) {
          return c.visibilityState === 'visible';
        });

        if (client) {
          client.navigate(targetUrl);
          return client.focus();
        }
        return clients.openWindow(targetUrl);
      })
  );
});
