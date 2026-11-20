/* Plantillas de "Actualidad", compartidas por la web (navegador) y por tools/actualidad/update.mjs (Node).
   Así el HTML estático y el que pinta JavaScript son siempre idénticos. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AVFeedRender = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const NETS = {
    blog: { label: 'Blog', handle: 'agenciavisual.es', badge: 'AV', url: 'https://agenciavisual.es/blog/' },
    instagram: { label: 'Instagram', handle: '@agenciavisual', badge: 'IG', url: 'https://www.instagram.com/agenciavisual/' },
    linkedin: { label: 'LinkedIn', handle: 'Agencia Visual', badge: 'in', url: 'https://www.linkedin.com/company/agencia-visual/' },
    facebook: { label: 'Facebook', handle: '/agenciavisual', badge: 'f', url: 'https://www.facebook.com/agenciavisual/' },
    x: { label: 'X', handle: '@agencia_visual', badge: 'X', url: 'https://x.com/agencia_visual' },
  };
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const day = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' });
  const month = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' });

  /** Fecha visible: exacta, solo mes si es aproximada, o nada si no se conoce. */
  function dateText(i) {
    if (!i.date) return '';
    const d = new Date(i.date);
    return (i.approxDate ? month : day).format(d).replace('.', '');
  }
  /** Clave de orden: la fecha o, si no se conoce, la posición aproximada (no se muestra). */
  const sortKey = (i) => i.date || i.sortDate || '';
  const sort = (items) => [...items].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  const sourcesOf = (i) => [i.source, ...(i.also || [])];
  const net = (s) => NETS[s] || { label: s, handle: '', badge: s.slice(0, 2) };
  const img = (src = '') => esc(src);

  /** Fila compacta (Home): misma estructura que el índice de proyectos. */
  function row(i) {
    return `
  <li data-source="${esc(i.source)}"><a href="${esc(i.url)}" target="_blank" rel="noopener" data-cursor="Ver"${i.image ? ` data-peek="${img(i.image)}"` : ''}>
    <time class="mono"${i.date ? ` datetime="${esc(i.date)}"` : ''}>${esc(dateText(i)) || '—'}</time>
    <div><h3>${esc(i.title)}</h3>${i.text ? `<p>${esc(i.text)}</p>` : ''}</div>
    <span class="mono notes__cat"><span class="src src--${esc(i.source)}">${esc(net(i.source).label)}</span></span><span aria-hidden="true">↗</span>
  </a></li>`;
  }

  /**
   * Tarjeta del muro (página Actualidad): cabecera con la red de origen, imagen y texto.
   * `as`: red con la que se presenta. Una publicación compartida en varias redes sale una vez
   * (con su red principal) en "Todo"; al filtrar por otra de sus redes, se presenta como de esa red.
   */
  function card(i, as = i.source) {
    const src = sourcesOf(i).includes(as) ? as : i.source;
    const n = net(src);
    const also = sourcesOf(i).filter((s) => s !== src).map((s) => net(s).label);
    const url = src === i.source ? i.url : (i.urls?.[src] || n.url || i.url);
    const date = dateText(i);
    return `
  <article class="post post--${esc(src)}" data-id="${esc(i.id)}" data-sources="${esc(sourcesOf(i).join(' '))}" data-reveal>
    <a href="${esc(url)}" target="_blank" rel="noopener" data-cursor="Ver">
      <header class="post__head">
        <span class="badge badge--${esc(src)}" aria-hidden="true">${esc(n.badge)}</span>
        <span class="post__who"><b>${esc(n.label)}</b><span class="mono">${esc(n.handle)}</span></span>
        ${date ? `<time class="mono"${i.approxDate ? ' title="Fecha aproximada"' : ''} datetime="${esc(i.date)}">${i.approxDate ? '≈ ' : ''}${esc(date)}</time>` : ''}
      </header>
      ${i.image ? `<img class="post__img" src="${img(i.image)}" alt="${esc(i.imageAlt || '')}" loading="lazy" decoding="async">` : ''}
      <div class="post__body">
        <h3>${esc(i.title)}</h3>
        ${i.text ? `<p>${esc(i.text)}</p>` : ''}
        ${also.length ? `<p class="post__also mono">También en ${esc(also.join(' · '))}</p>` : ''}
      </div>
    </a>
  </article>`;
  }

  return { NETS, esc, dateText, sort, sourcesOf, row, card };
});
