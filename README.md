# UTEQGram – Proyecto del curso (Evaluación 2)

Aplicación web progresiva parecida a Instagram para compartir momentos en la UTEQ.

| Carpeta | Contenido | URL publicada |
|---|---|---|
| `public/` | PWA con HTML, CSS y JavaScript (SA + DE) | https://miapp-integral-2b105.web.app |
| `uteqgram-react/` | Misma app migrada a React + Vite (AU) | https://uteqgram-react-2023371030.web.app |

## Funcionalidades

- Pantallas: Home (feed), formulario de nueva publicación, Help y página offline.
- Vistas generadas del lado del cliente (tarjetas creadas con JavaScript / React).
- Datos remotos en Supabase (API REST), datos locales en IndexedDB y caché del Service Worker.
- Funciona sin conexión y sincroniza las publicaciones pendientes con Background Sync.
- Notificaciones (permiso, notificación de confirmación, aviso al sincronizar y evento push).
- Cámara (getUserMedia) con respaldo de selector de imágenes, y GPS para la ubicación.
- Instalable (manifest.json + Service Worker).

## Ejecutar la versión HTML/JS

```bash
npm install
npm start          # http://localhost:8080
firebase deploy --only hosting
```

La versión React tiene su propio README dentro de `uteqgram-react/`.

Alumno: Raymundo Rodríguez Naranjo · Grupo IDGS14 · Aplicaciones Móviles
