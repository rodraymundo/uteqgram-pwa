// Datos de conexión a Supabase (llave pública "publishable", segura para el navegador)
export const SUPABASE_URL = 'https://oxszjpoaxbuhmpuoclga.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_d-Y4P4YYg-VA-tx7M4UgEA_foxknNch';

export const POSTS_URL = `${SUPABASE_URL}/rest/v1/post?select=*`;
export const INSERT_URL = `${SUPABASE_URL}/rest/v1/post`;
export const DEFAULT_IMAGE = `${SUPABASE_URL}/storage/v1/object/public/posts/sf-boat.jfif`;

export const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`
};
