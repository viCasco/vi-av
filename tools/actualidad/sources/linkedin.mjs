// LinkedIn — Posts API de la página de empresa.
// Necesita: LI_ORG_ID (número de la organización) y LI_TOKEN con permiso r_organization_social
// (producto "Community Management API", que LinkedIn debe aprobar para la app).
// Docs: https://learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api
import { getJSON, headline, body, saveImage } from '../lib.mjs';

const API = 'https://api.linkedin.com/rest';

export default {
  id: 'linkedin',
  label: 'LinkedIn',
  enabled: (env) => !!(env.LI_ORG_ID && env.LI_TOKEN),
  async fetch(env, ctx) {
    const headers = {
      Authorization: `Bearer ${env.LI_TOKEN}`,
      'LinkedIn-Version': env.LI_VERSION || '202410', // versión mensual AAAAMM; LinkedIn retira las antiguas
      'X-Restli-Protocol-Version': '2.0.0',
    };
    const author = encodeURIComponent(`urn:li:organization:${env.LI_ORG_ID}`);
    const { elements = [] } = await getJSON(`${API}/posts?author=${author}&q=author&count=${env.LI_LIMIT || 12}&sortBy=LAST_MODIFIED`, { headers });
    const items = [];
    for (const p of elements) {
      if (p.lifecycleState && p.lifecycleState !== 'PUBLISHED') continue;
      const text = (p.commentary || '').replace(/\{hashtag\|\\#\|([^}]+)\}/g, '#$1'); // formato "little text" de LinkedIn
      // Imagen: el post trae un URN; se resuelve a una URL de descarga temporal
      let image = null;
      const media = p.content?.media?.id || p.content?.multiImage?.images?.[0]?.id;
      if (media && media.startsWith('urn:li:image:')) {
        try {
          const img = await getJSON(`${API}/images/${encodeURIComponent(media)}`, { headers });
          image = await saveImage(ctx, img.downloadUrl, `linkedin-${p.id.split(':').pop()}`);
        } catch { /* sin imagen */ }
      }
      items.push({
        id: `linkedin-${p.id.split(':').pop()}`,
        source: 'linkedin',
        date: new Date(p.publishedAt || p.createdAt).toISOString(),
        title: headline(text) || 'Publicación en LinkedIn',
        text: body(text),
        url: `https://www.linkedin.com/feed/update/${p.id}/`,
        image,
        imageAlt: headline(text, 120),
      });
    }
    return items;
  },
};
