// Facebook — Graph API de la página.
// Necesita: FB_PAGE_ID y FB_TOKEN (token de página con permiso pages_read_engagement).
// Docs: https://developers.facebook.com/docs/graph-api/reference/page/posts/
import { getJSON, headline, body, saveImage } from '../lib.mjs';

const API = 'https://graph.facebook.com/v21.0';

export default {
  id: 'facebook',
  label: 'Facebook',
  enabled: (env) => !!(env.FB_PAGE_ID && env.FB_TOKEN),
  async fetch(env, ctx) {
    const fields = 'id,message,created_time,permalink_url,full_picture';
    const { data = [] } = await getJSON(`${API}/${env.FB_PAGE_ID}/posts?fields=${fields}&limit=${env.FB_LIMIT || 12}&access_token=${env.FB_TOKEN}`);
    const items = [];
    for (const p of data) {
      if (!p.message && !p.full_picture) continue; // cambios de portada, etc.
      items.push({
        id: `facebook-${p.id}`,
        source: 'facebook',
        date: new Date(p.created_time).toISOString(),
        title: headline(p.message) || 'Publicación en Facebook',
        text: body(p.message),
        url: p.permalink_url,
        image: await saveImage(ctx, p.full_picture, `facebook-${p.id}`), // URL firmada que caduca
        imageAlt: headline(p.message, 120),
      });
    }
    return items;
  },
};
