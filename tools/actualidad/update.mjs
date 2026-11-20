#!/usr/bin/env node
// Actualiza la sección "Actualidad": blog + redes sociales en una sola lista cronológica.
//
//   node tools/actualidad/update.mjs              → descarga, une y escribe datos + HTML
//   node tools/actualidad/update.mjs --dry        → muestra el resultado sin escribir nada
//   node tools/actualidad/update.mjs --refresh-ig → renueva el token de Instagram y lo muestra
//
// Las claves se leen del entorno o de tools/actualidad/.env (ver .env.example).
// Red con claves → su API. Red sin claves → data/actualidad.propuesta.json (provisional).
// Si una API falla, se conservan las últimas publicaciones de esa red.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './lib.mjs';
import blog from './sources/blog.mjs';
import instagram from './sources/instagram.mjs';
import linkedin from './sources/linkedin.mjs';
import facebook from './sources/facebook.mjs';
import x from './sources/x.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DATA = path.join(ROOT, 'data');
const render = createRequire(import.meta.url)(path.join(ROOT, 'assets/js/feed-render.js')); // mismas plantillas que la web
const PAGES = ['index.html', 'actualidad.html'];
const SOURCES = [blog, instagram, linkedin, facebook, x];
const PROFILES = {
  instagram: 'https://www.instagram.com/agenciavisual/',
  linkedin: 'https://www.linkedin.com/company/agencia-visual/',
  facebook: 'https://www.facebook.com/agenciavisual/',
  x: 'https://x.com/agencia_visual',
};

const args = new Set(process.argv.slice(2));
await loadEnv(path.join(HERE, '.env'));
const env = process.env;

if (args.has('--refresh-ig')) {
  if (!env.IG_TOKEN) throw new Error('Falta IG_TOKEN');
  console.log('Nuevo IG_TOKEN (guárdalo en .env o en los secretos del servidor):\n' + await instagram.refresh(env));
  process.exit(0);
}

const readJSON = async (file, fallback) => (existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : fallback);
const previous = await readJSON(path.join(DATA, 'actualidad.json'), { items: [] });
const manual = await readJSON(path.join(DATA, 'actualidad.manual.json'), {});
const proposal = env.USE_PROPOSAL === 'false' ? { items: [] } : await readJSON(path.join(DATA, 'actualidad.propuesta.json'), { items: [] });
const ctx = { root: ROOT, downloadImages: env.DOWNLOAD_IMAGES !== 'false' };

// 1. Cada fuente, por separado: un fallo no tumba a las demás
let items = [];
const status = {};
for (const src of SOURCES) {
  if (!src.enabled(env)) {
    const prop = proposal.items.filter((i) => i.source === src.id).map((i) => ({ ...i, provisional: true }));
    items.push(...prop);
    status[src.id] = prop.length ? `sin claves → ${prop.length} de la propuesta` : 'sin claves (omitida)';
    continue;
  }
  try {
    const got = await src.fetch(env, ctx);
    items.push(...got);
    status[src.id] = `API: ${got.length} publicaciones`;
  } catch (e) {
    const kept = previous.items.filter((i) => i.source === src.id && !i.manual);
    items.push(...kept);
    status[src.id] = `ERROR (${e.message}); se conservan ${kept.length} anteriores`;
  }
}

// 2. Publicaciones manuales, ajustes y ocultas
items.push(...(manual.items || []).map((i) => ({ ...i, manual: true, date: i.date ? new Date(i.date).toISOString() : null })));
const byId = new Map();
for (const i of items) byId.set(i.id, { ...i, ...(manual.overrides?.[i.id] || {}) });
const hidden = new Set(manual.hide || []);
items = render.sort([...byId.values()].filter((i) => !hidden.has(i.id))).slice(0, +(env.FEED_MAX || 40));

const labels = Object.fromEntries(SOURCES.map((s) => [s.id, s.label]));
const feed = { updated: new Date().toISOString(), labels, profiles: PROFILES, items };

console.table(status);
console.log(`${items.length} elementos en Actualidad`);
if (args.has('--dry')) { console.log(JSON.stringify(items.slice(0, 5), null, 2)); process.exit(0); }

// 3. Datos: JSON (para otros usos) y JS (lo que lee la web; funciona también abriendo en local)
await mkdir(DATA, { recursive: true });
await writeFile(path.join(DATA, 'actualidad.json'), JSON.stringify(feed, null, 2) + '\n');
await writeFile(path.join(DATA, 'actualidad.js'), `/* Generado por tools/actualidad/update.mjs — no editar a mano (usa actualidad.manual.json) */\nwindow.AV_FEED = ${JSON.stringify(feed, null, 2)};\n`);

// 4. HTML estático (sin JS y para buscadores): filas en la Home, muro de tarjetas en Actualidad
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  if (!existsSync(file)) continue;
  const html = await readFile(file, 'utf8');
  const out = html
    .replace(/(<ol class="notes" data-feed(?: data-limit="(\d+)")?[^>]*>)[\s\S]*?(<\/ol>)/g,
      (_, open, limit, close) => `${open}${items.slice(0, limit ? +limit : undefined).map(render.row).join('')}\n${close}`)
    .replace(/(<div class="feed-wall" data-feed-wall[^>]*>)[\s\S]*?(<\/div><!-- \/feed-wall -->)/g,
      (_, open, close) => `${open}${items.map(render.card).join('')}\n${close}`);
  if (out !== html) { await writeFile(file, out); console.log(`HTML actualizado: ${page}`); }
}
