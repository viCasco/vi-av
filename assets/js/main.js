/* Agencia Visual — interacción compartida (sin dependencias) */
(() => {
  const doc = document.documentElement;
  doc.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Muro tipo Pinterest: reparte las tarjetas en orden, de izquierda a derecha, en N columnas
     (N = variable CSS --cols, que cambia por tamaño de pantalla). Sin JS, quedan las columnas CSS. */
  const masonry = (box, fresh = false) => {
    if (fresh || !box._items) box._items = [...box.children];
    const n = Math.max(1, parseInt(getComputedStyle(box).getPropertyValue('--cols'), 10) || 1);
    const shown = box._items.filter((el) => !el.hidden && !el.classList.contains('is-hidden'));
    const cols = Array.from({ length: n }, () => Object.assign(document.createElement('div'), { className: 'mcol' }));
    shown.forEach((el, i) => cols[i % n].append(el));
    box._items.filter((el) => !shown.includes(el)).forEach((el) => cols[0].append(el)); // ocultas (display: none)
    box.replaceChildren(...cols);
    box.classList.add('is-masonry');
    box._n = n;
  };
  let masonryT;
  addEventListener('resize', () => {
    clearTimeout(masonryT);
    masonryT = setTimeout(() => $$('.is-masonry').forEach((box) => {
      if (parseInt(getComputedStyle(box).getPropertyValue('--cols'), 10) !== box._n) masonry(box);
    }), 150);
  });

  /* ---------- Cabecera fija: línea inferior al hacer scroll ---------- */
  const top = $('.top');
  if (top) {
    const onTop = () => top.classList.toggle('is-scrolled', scrollY > 10);
    addEventListener('scroll', onTop, { passive: true });
    onTop();
  }

  /* ---------- Menú móvil ---------- */
  const overlay = $('.overlay');
  const menuBtn = $('.menu-btn');
  if (overlay && menuBtn) {
    const close = $('.overlay__close');
    const set = (open) => {
      overlay.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', open);
      overlay.setAttribute('aria-hidden', !open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) close.focus(); else menuBtn.focus();
    };
    menuBtn.addEventListener('click', () => set(true));
    close.addEventListener('click', () => set(false));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) set(false); });
  }

  /* ---------- Cursor-lente + imagen flotante ---------- */
  if (fine && !reduce) {
    document.body.classList.add('has-cursor');
    const cur = Object.assign(document.createElement('div'), { className: 'cursor', innerHTML: '<span></span>' });
    cur.setAttribute('aria-hidden', 'true');
    document.body.append(cur);
    const label = cur.firstChild;
    // Círculo flotante: misma imagen en dos capas (fuera de la fila 100 %, dentro 20 %)
    const peek = Object.assign(document.createElement('div'), { className: 'peek', innerHTML: '<img class="peek__out" alt=""><img class="peek__in" alt="">' });
    peek.setAttribute('aria-hidden', 'true');
    document.body.append(peek);
    const peekImgs = $$('img', peek);
    let activeRow = null;

    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, px = x, py = y;
    cur.style.opacity = 0; // invisible hasta el primer movimiento
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (cur.style.opacity === '0') { cx = px = x; cy = py = y; cur.style.opacity = 1; }
    }, { passive: true });
    const loop = () => {
      cx += (x - cx) * .22; cy += (y - cy) * .22;
      px += (x - px) * .09; py += (y - py) * .09;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      peek.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
      if (activeRow) {
        // Bordes de la fila en coordenadas del círculo → límites de las dos máscaras
        const r = activeRow.getBoundingClientRect();
        const top = py - peek.offsetHeight / 2;
        peek.style.setProperty('--t', `${r.top - top}px`);
        peek.style.setProperty('--b', `${r.bottom - top}px`);
      }
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      const big = !!t;
      cur.classList.toggle('is-big', big);
      label.textContent = big ? t.dataset.cursor : '';
      const p = e.target.closest('[data-peek]');
      if (p) {
        activeRow = p;
        if (peekImgs[0].getAttribute('src') !== p.dataset.peek) peekImgs.forEach((i) => { i.src = p.dataset.peek; });
        peek.classList.add('is-on');
      } else peek.classList.remove('is-on');
    });
  }

  /* ---------- Titular-cartel: cada línea .fit ocupa todo el ancho ---------- */
  $$('[data-fit]').forEach((block) => {
    const rows = $$('.fit', block);
    if (!rows.length) return;
    const fit = () => {
      // Los ajustes de tamaño son instantáneos; solo el cambio INVISIBLE↔VISIBLE se anima
      block.classList.add('fit-now', 'is-fitted');
      const base = parseFloat(getComputedStyle(block).fontSize);
      rows.forEach((r) => { r.style.fontSize = ''; });
      // Ancho disponible = el del bloque (las filas compensan su relleno con margen negativo)
      const avail = block.clientWidth;
      const sizes = rows.map((r) => base * avail / r.firstElementChild.getBoundingClientRect().width);
      let k = 1;
      if (block.dataset.fitMax) {
        // Tope de altura (fracción de pantalla) para títulos cortos que, a todo el ancho, serían enormes
        const total = sizes.reduce((t, s) => t + s * .9, 0);
        k = Math.min(1, innerHeight * parseFloat(block.dataset.fitMax) / total);
      } else if (block.dataset.fit === 'screen') {
        // Que el titular quepa en la pantalla junto a la cabecera y el pie del hero
        const hero = block.closest('.hero');
        const room = innerHeight - 110 - ($('.hero__foot', hero)?.offsetHeight || 0) - 60;
        const lines = rows.map((r) => ($('.sp', r) && getComputedStyle($('.sp', r)).display === 'block' ? 2 : 1));
        const total = sizes.reduce((t, s, i) => t + s * .9 * lines[i], 0);
        k = Math.min(1, room / total);
      }
      rows.forEach((r, i) => { r.style.fontSize = `${sizes[i] * k}px`; });
      void block.offsetWidth; block.classList.remove('fit-now');
    };
    block.refit = fit;
    fit();
    // Recalcular cuando llega la tipografía real (la de reserva es más ancha) y al terminar de cargar
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener('loadingdone', fit);
    addEventListener('load', fit);
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 100); });
  });

  /* ---------- ¿Eres invisible? → la palabra se pinta hasta hacerse VISIBLE ---------- */
  $$('[data-paint]').forEach((word) => {
    const fill = $('.ghost__fill', word);
    const section = word.closest('section');
    const title = word.closest('[data-fit]');
    const msg = $('[data-paint-msg]', section);
    const W = 240; // lienzo pequeño: la máscara se escala, y el borde suave favorece el efecto pincel
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    let H = 60, dirty = false, strokes = 0, done = false, last = null;
    const size = () => { const r = word.getBoundingClientRect(); H = Math.max(20, Math.round(W * r.height / r.width)); cv.width = W; cv.height = H; };
    size();

    const original = msg?.textContent;
    let busy = false;
    const swapMsg = (text) => {
      if (!msg) return;
      msg.style.opacity = 0;
      setTimeout(() => { msg.textContent = text; msg.style.opacity = 1; }, 400);
    };
    // Cambia de estado animando a la vez el pliegue del "IN" y el reajuste del tamaño:
    // se mide el estado final sin transiciones, se vuelve al inicial y se anima hacia el final.
    const morph = (visible) => {
      const rows = title ? $$('.fit', title) : [];
      const from = rows.map((r) => r.style.fontSize);
      title?.classList.add('no-anim');
      section.classList.toggle('is-visible', visible);
      title?.refit?.();
      const to = rows.map((r) => r.style.fontSize);
      section.classList.toggle('is-visible', !visible);
      rows.forEach((r, i) => { r.style.fontSize = from[i]; });
      void section.offsetWidth; // fija el estado inicial
      title?.classList.remove('no-anim');
      section.classList.toggle('is-visible', visible);
      rows.forEach((r, i) => { r.style.fontSize = to[i]; });
      busy = true;
      setTimeout(() => { busy = false; }, 1200);
    };
    const clearPaint = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const url = `url(${cv.toDataURL()})`;
      fill.style.webkitMaskImage = url; fill.style.maskImage = url;
    };
    const finish = () => {
      if (done) return;
      done = true;
      morph(true);
      word.closest('h2').setAttribute('aria-label', 'Hazte visible');
      swapMsg(msg?.dataset.done);
      // Cuando el relleno ya cubre toda la palabra, se limpia el trazo para la vuelta
      setTimeout(clearPaint, 1300);
    };
    const revert = () => {
      if (!done) return;
      done = false; strokes = 0; last = null;
      morph(false);
      word.closest('h2').setAttribute('aria-label', '¿Eres invisible?');
      swapMsg(original);
    };
    const coverage = () => {
      const d = ctx.getImageData(0, 0, W, H).data;
      let on = 0;
      for (let i = 3; i < d.length; i += 16) if (d[i] > 128) on++;
      return on / (d.length / 16);
    };
    const paint = (fx, fy) => { // fx, fy en 0..1 dentro de la palabra
      const x = fx * W, y = fy * H, rad = H * .55;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      if (!dirty) {
        dirty = true;
        requestAnimationFrame(() => {
          const url = `url(${cv.toDataURL()})`;
          fill.style.webkitMaskImage = url; fill.style.maskImage = url;
          dirty = false;
          if (++strokes % 6 === 0 && coverage() > .55) finish();
        });
      }
    };
    const at = (e) => { const r = word.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };

    if (reduce) { word.addEventListener('click', () => (done ? revert() : finish())); return; }

    // Vuelta a INVISIBLE al salir de la palabra (con una pequeña espera y sin
    // dejarse engañar por el cambio de tamaño de la propia palabra)
    let pos = [0, 0], leaveT;
    addEventListener('pointermove', (e) => { pos = [e.clientX, e.clientY]; }, { passive: true });
    const zone = word.closest('h2'); // la línea entera: no se mueve aunque la palabra cambie de tamaño
    const inside = () => {
      const r = zone.getBoundingClientRect();
      return pos[0] >= r.left && pos[0] <= r.right && pos[1] >= r.top && pos[1] <= r.bottom;
    };
    const tryRevert = () => {
      clearTimeout(leaveT);
      leaveT = setTimeout(() => {
        if (!done) return;
        if (busy || inside()) { if (!inside()) tryRevert(); return; }
        revert();
      }, 500);
    };
    zone.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') tryRevert(); });
    zone.addEventListener('pointerenter', () => clearTimeout(leaveT));
    word.addEventListener('pointerenter', () => { if (!done) size(); last = null; });
    word.addEventListener('pointermove', (e) => {
      if (done || e.pointerType === 'touch') return;
      const [x, y] = at(e);
      // Interpola entre puntos para que el trazo sea continuo aunque el ratón vaya rápido
      if (last) {
        const steps = Math.ceil(Math.hypot((x - last[0]) * W, (y - last[1]) * H) / (H * .25));
        for (let i = 1; i <= steps; i++) paint(last[0] + (x - last[0]) * i / steps, last[1] + (y - last[1]) * i / steps);
      } else paint(x, y);
      last = [x, y];
    });

    // Pantallas táctiles: el pincel recorre la palabra solo al aparecer
    if (!fine) {
      const sweep = () => {
        const t0 = performance.now(), dur = 1800;
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          paint(p, .5 + Math.sin(p * Math.PI * 6) * .3);
          if (p < 1 && !done) requestAnimationFrame(step); else setTimeout(finish, 200);
        };
        requestAnimationFrame(step);
      };
      // Al aparecer se pinta; al salir de pantalla vuelve a INVISIBLE para repetirse
      let sweepT;
      const sio = new IntersectionObserver(([en]) => {
        clearTimeout(sweepT);
        if (en.intersectionRatio >= .6 && !done) sweepT = setTimeout(() => { size(); sweep(); }, 400);
        else if (!en.isIntersecting && done) revert();
      }, { threshold: [0, .6] });
      sio.observe(word);
    }
  });

  /* ---------- Servicios: acordeón animado con amago en hover ---------- */
  $$('.services').forEach((acc) => {
    acc.classList.add('js-acc');
    const TEASE = 52; // px que asoman en el amago
    $$('details', acc).forEach((d) => {
      const sum = $('summary', d);
      const body = $('.services__body', d);
      let open = d.hasAttribute('open');
      d.open = true; // el contenido siempre está en el DOM; la altura la controlamos nosotros
      const setA11y = () => {
        sum.setAttribute('aria-expanded', open);
        body.setAttribute('aria-hidden', !open);
        body.inert = !open;
      };
      // Anima la altura desde la actual hasta el destino (auto = altura natural)
      const to = (target) => {
        const from = body.getBoundingClientRect().height;
        const end = target === 'auto' ? body.scrollHeight : target;
        body.style.height = `${from}px`;
        void body.offsetHeight;
        body.style.height = `${end}px`;
        if (target === 'auto') {
          const done = (e) => {
            if (e.propertyName !== 'height') return;
            if (open) body.style.height = 'auto';
            body.removeEventListener('transitionend', done);
          };
          body.addEventListener('transitionend', done);
        }
      };
      d.classList.toggle('is-open', open);
      body.style.height = open ? 'auto' : '0px';
      setA11y();

      sum.addEventListener('click', (e) => {
        e.preventDefault();
        open = !open;
        d.classList.remove('is-teasing');
        d.classList.toggle('is-open', open);
        setA11y();
        to(open ? 'auto' : 0);
      });
      d.untease = () => { if (d.classList.contains('is-teasing')) { d.classList.remove('is-teasing'); if (!open) to(0); } };
      if (fine) {
        sum.addEventListener('pointerenter', () => {
          $$('details', acc).forEach((o) => o !== d && o.untease()); // un solo amago a la vez
          if (!open) { d.classList.add('is-teasing'); to(TEASE); }
        });
        sum.addEventListener('pointerleave', () => d.untease());
      }
    });
    acc.addEventListener('pointerleave', () => $$('details', acc).forEach((d) => d.untease()));
  });

  /* ---------- Ojo del hero: vídeo real solo en escritorio y tras cargar la página ---------- */
  const eyeVid = $('video[data-eye-src]');
  if (eyeVid) {
    const eye = eyeVid.parentElement;
    const net = navigator.connection;
    const ok = fine && !reduce && innerWidth >= 900 && !(net && (net.saveData || /2g|3g/.test(net.effectiveType || '')));
    if (ok) {
      const start = () => {
        eyeVid.src = eyeVid.dataset.eyeSrc;
        eyeVid.addEventListener('playing', () => eye.classList.add('has-video'), { once: true });
        eyeVid.addEventListener('error', () => eye.classList.remove('has-video'));
        // Solo se reproduce mientras el hero está en pantalla
        new IntersectionObserver(([en]) => {
          if (en.isIntersecting) eyeVid.play().catch(() => {}); else eyeVid.pause();
        }).observe(eye);
      };
      const later = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1500));
      if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
    }
  }

  /* ---------- Actualidad: blog + redes desde data/actualidad.js ---------- */
  // Plantillas compartidas con tools/actualidad/update.mjs (assets/js/feed-render.js)
  const FEED = window.AV_FEED, R = window.AVFeedRender;
  if (FEED && FEED.items && R) {
    const items = R.sort(FEED.items);
    $$('ol[data-feed]').forEach((list) => {
      list.innerHTML = items.slice(0, +list.dataset.limit || Infinity).map(R.row).join('');
    });
    const wall = $('[data-feed-wall]');
    if (wall) {
      // Si el HTML ya trae estas mismas tarjetas (lo habitual), no se vuelven a pintar:
      // repintar cancelaría las imágenes que se están descargando.
      const current = $$('.post', wall).map((p) => p.dataset.id).join('|');
      if (current !== items.map((i) => i.id).join('|')) wall.innerHTML = items.map(R.card).join('');
      masonry(wall, true); // el revelado al hacer scroll (más abajo) ya recoge las tarjetas
      // Filtros por red (cuenta también lo publicado en varias redes), solo si hay más de una
      const bar = $('[data-feed-filters]');
      const counts = {};
      items.forEach((i) => R.sourcesOf(i).forEach((s) => { counts[s] = (counts[s] || 0) + 1; }));
      const order = Object.keys(R.NETS).filter((k) => counts[k]);
      if (bar && order.length > 1) {
        bar.innerHTML = [['*', 'Todo', items.length], ...order.map((k) => [k, R.NETS[k].label, counts[k]])]
          .map(([k, label, n]) => `<button class="chip" data-src="${k}" aria-pressed="${k === '*'}">${R.esc(label)}<sup>${n}</sup></button>`).join('');
        bar.addEventListener('click', (e) => {
          const b = e.target.closest('[data-src]');
          if (!b) return;
          $$('.chip', bar).forEach((c) => c.setAttribute('aria-pressed', c === b));
          // Se vuelven a pintar: en una red concreta, lo compartido en varias se presenta como de esa red
          const sel = b.dataset.src;
          const shown = sel === '*' ? items.map((i) => R.card(i)) : items.filter((i) => R.sourcesOf(i).includes(sel)).map((i) => R.card(i, sel));
          wall.innerHTML = shown.join('');
          $$('[data-reveal]', wall).forEach((el) => el.classList.add('in'));
          masonry(wall, true);
        });
      }
    }
  }

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal], .split-in').forEach((el) => io.observe(el));

  /* ---------- Manifiesto: las palabras se "hacen visibles" ---------- */
  const mani = $('[data-words]');
  if (mani && !reduce) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else frag.append(Object.assign(document.createElement('span'), { className: 'w', textContent: part }));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(mani);
    const words = $$('.w', mani);
    const onScroll = () => {
      const r = mani.getBoundingClientRect();
      const p = (innerHeight * .85 - r.top) / (r.height + innerHeight * .35);
      const n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Parallax suave ---------- */
  const par = $$('[data-parallax]');
  if (par.length && !reduce) {
    const tick = () => {
      par.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translateY(${p * -12}%)`;
      });
    };
    addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ---------- Reel: fachada ligera, YouTube solo al pulsar (sin cookies previas) ---------- */
  $$('[data-yt]').forEach((wrap) => {
    const btn = $('.reel__btn', wrap);
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${wrap.dataset.yt}?autoplay=1&rel=0`;
      f.title = 'Reel de Agencia Visual';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      wrap.append(f);
      btn.remove();
    });
  });

  /* ---------- Vídeos: solo se cargan y reproducen cuando se ven ---------- */
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        if (!reduce) v.play().catch(() => {});
      } else v.pause();
    });
  }, { threshold: .15 });
  const watchVideos = (root = document) => $$('video[data-src], video[data-auto]', root).forEach((v) => vio.observe(v));
  watchVideos();

  /* ---------- Reloj de Badajoz ---------- */
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    const t = () => { clock.textContent = `Badajoz ${fmt.format(new Date())}`; };
    t(); setInterval(t, 30000);
  }
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Formularios ---------- */
  $$('form[data-form]').forEach((form) => {
    const msg = $('.form-msg', form);
    const file = $('input[type="file"]', form);
    if (file) file.addEventListener('change', () => {
      const f = file.files[0];
      file.setCustomValidity(f && f.size > 4 * 1024 * 1024 ? 'El archivo supera los 4 MB.' : '');
      file.reportValidity();
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if ($('.hp input', form)?.value) return; // bot
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        msg.textContent = 'El envío online aún no está conectado en esta versión. Mientras tanto, llámanos al +34 659 250 223.';
        return;
      }
      msg.textContent = 'Enviando…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        msg.textContent = '¡Recibido! Te contestamos en menos de 48 h laborables.';
      } catch {
        msg.textContent = 'No hemos podido enviarlo. Prueba de nuevo o llámanos al +34 659 250 223.';
      }
    });
  });

  /* ---------- Proyectos ---------- */
  const worksEl = $('[data-works]');
  if (worksEl && window.AV_PROJECTS) {
    const P = window.AV_PROJECTS;
    const U = 'https://agenciavisual.es/www/wp-content/uploads/';
    const isVid = (s) => /\.mp4$/i.test(s);
    const media = (src, alt, cls = '') => isVid(src)
      ? `<video class="${cls}" data-src="${U + src}" muted loop playsinline preload="none" aria-label="${alt}"></video>`
      : `<img class="${cls}" src="${U + src}" alt="${alt}" loading="lazy" decoding="async">`;

    // Muro tipo Pinterest: cada pieza de cada proyecto es una tarjeta.
    // Se intercalan los proyectos (primero todas las portadas) para que el muro sea variado.
    const pieces = P.map((p) => [...new Set([p.cover, ...p.gallery])]);
    const order = [];
    for (let k = 0; k < Math.max(...pieces.map((l) => l.length)); k++) {
      P.forEach((p, i) => { if (pieces[i][k]) order.push([i, k]); });
    }
    worksEl.innerHTML = order.map(([i, k]) => {
      const p = P[i];
      return `
      <figure class="pin" data-tags="${p.tags.join(',')}" data-reveal>
        <button type="button" data-open="${i}" data-at="${k}" data-cursor="Abrir" aria-haspopup="dialog" aria-label="${p.name}: ver el caso">
          ${media(pieces[i][k], k ? '' : p.name)}
          <span class="pin__info" aria-hidden="true"><span class="pin__name">${p.name}</span><span class="mono">${p.tags.join(' / ')}</span></span>
        </button>
      </figure>`;
    }).join('');
    $$('[data-reveal]', worksEl).forEach((el) => io.observe(el));
    watchVideos(worksEl);
    masonry(worksEl, true);

    // Filtros con recuento real de piezas
    const chips = $$('.chip');
    chips.forEach((c) => {
      const tag = c.dataset.filter;
      const n = order.filter(([i]) => tag === '*' || P[i].tags.includes(tag)).length;
      c.insertAdjacentHTML('beforeend', `<sup>${n}</sup>`);
      if (!n) { c.hidden = true; return; }
      c.addEventListener('click', () => {
        chips.forEach((o) => o.setAttribute('aria-pressed', o === c));
        $$('.pin', worksEl).forEach((w) => w.classList.toggle('is-hidden', tag !== '*' && !w.dataset.tags.split(',').includes(tag)));
        masonry(worksEl);
      });
    });

    // Caso a pantalla completa
    const dlg = $('#case');
    worksEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (!b) return;
      const p = P[+b.dataset.open];
      // La galería empieza por la pieza pulsada (y sigue con el resto del caso)
      const all = pieces[+b.dataset.open], at = +b.dataset.at || 0;
      const gallery = [...all.slice(at), ...all.slice(0, at)];
      $('#case-title', dlg).textContent = p.name;
      $('#case-tags', dlg).textContent = p.tags.join(' / ');
      $('#case-text', dlg).textContent = p.text;
      $('#case-link', dlg).href = p.url;
      const rail = $('.case__rail', dlg);
      rail.innerHTML = gallery.map((g) => media(g, p.name)).join('');
      dlg.showModal();
      rail.scrollLeft = 0;
      $$('video', rail).forEach((v) => { v.src = v.dataset.src; v.play().catch(() => {}); });
    });
    $('.case__close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => { $('.case__rail', dlg).innerHTML = ''; });
    // Rueda vertical → desplazamiento horizontal en la galería
    $('.case__rail', dlg).addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.currentTarget.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
  }
})();
