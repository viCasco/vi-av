// X — API v2. Leer publicaciones requiere un plan de pago (Basic o superior).
// Necesita: X_BEARER (token de app) y X_USER_ID (id numérico de @agencia_visual). X_HANDLE opcional.
// Docs: https://docs.x.com/x-api/posts/user-posts-timeline-by-user-id
import { getJSON, headline, body } from '../lib.mjs';

export default {
  id: 'x',
  label: 'X',
  enabled: (env) => !!(env.X_BEARER && env.X_USER_ID),
  async fetch(env) {
    const handle = env.X_HANDLE || 'agencia_visual';
    const q = new URLSearchParams({
      max_results: String(Math.min(Math.max(+(env.X_LIMIT || 10), 5), 100)),
      exclude: 'replies,retweets',
      'tweet.fields': 'created_at,attachments',
      expansions: 'attachments.media_keys',
      'media.fields': 'url,preview_image_url,alt_text',
    });
    const r = await getJSON(`https://api.x.com/2/users/${env.X_USER_ID}/tweets?${q}`, { headers: { Authorization: `Bearer ${env.X_BEARER}` } });
    const media = Object.fromEntries((r.includes?.media || []).map((m) => [m.media_key, m]));
    return (r.data || []).map((t) => {
      const m = media[t.attachments?.media_keys?.[0]];
      const text = t.text.replace(/https:\/\/t\.co\/\w+$/, '').trim(); // quita el enlace corto final
      return {
        id: `x-${t.id}`,
        source: 'x',
        date: new Date(t.created_at).toISOString(),
        title: headline(text) || 'Publicación en X',
        text: body(text),
        url: `https://x.com/${handle}/status/${t.id}`,
        image: m ? (m.url || m.preview_image_url) : null, // pbs.twimg.com es estable: no hace falta descargar
        imageAlt: m?.alt_text || '',
      };
    });
  },
};
