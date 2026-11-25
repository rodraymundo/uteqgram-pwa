# UTEQGram (React)

Versión en React + Vite de UTEQGram. Mantiene las características de PWA de la versión original: instalación, funcionamiento sin conexión, datos locales (IndexedDB), datos remotos (Supabase), sincronización en segundo plano, notificaciones y uso de la cámara y el GPS.

## Ejecutar

```bash
npm install
npm run dev        # desarrollo (sin Service Worker) -> http://localhost:5173
npm run build      # genera la carpeta dist
npm run preview    # prueba la PWA completa -> http://localhost:4173
```

## Publicar en Firebase Hosting

```bash
firebase hosting:sites:create uteqgram-react-2023371030   # solo la primera vez
npm run build
firebase deploy --only hosting
```

## Estructura

```
src/
  main.jsx               registro del Service Worker y router
  App.jsx                rutas (Feed y Help), barra superior y mensajes
  components/            Header, CreatePost (cámara + GPS), PostCard, Toast
  pages/                 Feed (home) y Help
  lib/db.js              IndexedDB (datos locales y cola offline)
  lib/api.js             Supabase (datos remotos)
  lib/notifications.js   permisos y notificaciones
public/
  sw.js                  Service Worker (caché, offline, sync, push)
  manifest.json          manifiesto de la PWA
```
