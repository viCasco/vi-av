// Blog de la web (WordPress REST API). Público: funciona sin claves.
import { getJSON, stripHtml, truncate, decodeEntities } from '../lib.mjs';

export default {
  id: 'blog',
  label: 'Blog',
  enabled: (env) => env.BLOG_ENABLED !== 'false',
  async fetch(env) {
    const base = (env.WP_URL || 'https://agenciavisual.es').replace(/\/$/, '');
    const posts = await getJSON(`${base}/wp-json/wp/v2/posts?per_page=${env.BLOG_LIMIT || 10}&_embed=wp:featuredmedia`);
    return posts.map((p) => {
      const media = p._embedded?.['wp:featuredmedia']?.[0];
      const sizes = media?.media_details?.sizes || {};
      // "portfolio" es un recorte cuadrado de 650 px: ideal para el círculo flotante
      const image = (sizes.portfolio || sizes.medium_large || sizes.large || media)?.source_url || null;
      return {
        id: `blog-${p.id}`,
        source: 'blog',
        date: new Date(p.date_gmt ? `${p.date_gmt}Z` : p.date).toISOString(),
        title: decodeEntities(p.title?.rendered || '').trim(),
        text: truncate(stripHtml(p.excerpt?.rendered || '')),
        url: p.link,
        image,
        imageAlt: media?.alt_text || '',
      };
    });
  },
};
