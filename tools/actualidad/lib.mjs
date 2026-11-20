// Utilidades compartidas por los conectores de "Actualidad". Sin dependencias (Node 20+).
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', laquo: '«', raquo: '»', ndash: '–', mdash: '—', iexcl: '¡', iquest: '¿' };

export function decodeEntities(s = '') {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function stripHtml(html = '') {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function truncate(s = '', max = 170) {
  s = s.replace(/\s*\[…\]\s*$|\s*\[\.\.\.\]\s*$/, '').trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(' ', max)).replace(/[,.;:\s]+$/, '') + '…';
}

/** Primer renglón de un texto de red social, para usarlo como titular. */
export function headline(text = '', max = 90) {
  const first = text.split(/\n+/).map((l) => l.trim()).find(Boolean) || '';
  // \p{L}: hashtags con ñ y tildes (#diseño) se quitan enteros
  return truncate(first.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim() || first, max);
}

/** El resto del texto (sin el primer renglón), como entradilla. */
export function body(text = '', max = 170) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return truncate(lines.slice(1).join(' '), max);
}

/** Carga variables de un archivo .env sencillo (CLAVE=valor), sin pisar las del entorno. */
export async function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

/** fetch que lanza un error legible si la respuesta no es 2xx. */
export async function getJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url.split('?')[0]}`);
  return res.json();
}

/**
 * Descarga una imagen a assets/feed/ y devuelve su ruta relativa.
 * Necesario para Instagram, Facebook y LinkedIn: sus URLs de imagen caducan en horas o días.
 */
export async function saveImage(ctx, url, name) {
  if (!url) return null;
  if (!ctx.downloadImages) return url;
  const dir = path.join(ctx.root, 'assets', 'feed');
  await mkdir(dir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) return null;
  const type = res.headers.get('content-type') || '';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const file = `${name.replace(/[^a-z0-9_-]/gi, '_')}.${ext}`;
  const target = path.join(dir, file);
  if (!existsSync(target)) await writeFile(target, Buffer.from(await res.arrayBuffer()));
  return `assets/feed/${file}`;
}
