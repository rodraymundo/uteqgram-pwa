// Datos remotos: API REST de Supabase
import { POSTS_URL, INSERT_URL, SUPABASE_HEADERS } from '../config.js';
import { saveAll } from './db.js';

export async function fetchPosts() {
  const res = await fetch(POSTS_URL, { headers: SUPABASE_HEADERS });
  if (!res.ok) {
    throw new Error(`Error al consultar publicaciones: ${res.status}`);
  }
  const data = await res.json();

  // Se guarda una copia local para usarla sin conexión
  if (Array.isArray(data) && data.length > 0) {
    saveAll('posts', data).catch((err) => console.log('No se pudo guardar en IndexedDB', err));
  }
  return Array.isArray(data) ? data : [];
}

export async function createPost(post) {
  const res = await fetch(INSERT_URL, {
    method: 'POST',
    headers: {
      ...SUPABASE_HEADERS,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(post)
  });

  if (!res.ok) {
    throw new Error(`Error al guardar publicación: ${res.status}`);
  }
}
