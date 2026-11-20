// Instagram — API de Instagram con inicio de sesión de Instagram (cuenta profesional).
// Necesita: IG_TOKEN (token de larga duración, 60 días; se renueva con `node update.mjs --refresh-ig`).
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
import { getJSON, headline, body, saveImage } from '../lib.mjs';

const API = 'https://graph.instagram.com/v21.0';

export default {
  id: 'instagram',
  label: 'Instagram',
  enabled: (env) => !!env.IG_TOKEN,
  async fetch(env, ctx) {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const { data = [] } = await getJSON(`${API}/me/media?fields=${fields}&limit=${env.IG_LIMIT || 12}&access_token=${env.IG_TOKEN}`);
    const items = [];
    for (const m of data) {
      const caption = m.caption || '';
      // En vídeos y reels, la imagen es su miniatura. Las URLs caducan: se descargan.
      const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
      items.push({
        id: `instagram-${m.id}`,
        source: 'instagram',
        date: new Date(m.timestamp).toISOString(),
        title: headline(caption) || 'Publicación en Instagram',
        text: body(caption),
        url: m.permalink,
        image: await saveImage(ctx, src, `instagram-${m.id}`),
        imageAlt: headline(caption, 120),
      });
    }
    return items;
  },
  /** Renueva el token de larga duración (hacerlo antes de que caduquen los 60 días). */
  async refresh(env) {
    const r = await getJSON(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${env.IG_TOKEN}`);
    return r.access_token;
  },
};
