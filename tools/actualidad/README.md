# Actualidad: blog y redes sociales en una sola lista

La sección **Actualidad** (`actualidad.html` y el bloque de la Home) muestra en orden cronológico las entradas del blog y las publicaciones de Instagram, LinkedIn, Facebook y X.

```
tools/actualidad/update.mjs  →  data/actualidad.js    (lo que lee la web)
                              →  data/actualidad.json  (copia en JSON)
                              →  index.html y actualidad.html  (lista en HTML, para buscadores y sin JS)
```

Necesita Node 20 o superior y no tiene dependencias.

```bash
node tools/actualidad/update.mjs            # actualizar
node tools/actualidad/update.mjs --dry      # ver el resultado sin escribir nada
node tools/actualidad/update.mjs --refresh-ig  # renovar el token de Instagram
```

## Estado de cada fuente

| Fuente | Estado | Qué hace falta |
|---|---|---|
| **Blog** (WordPress) | ✅ Funciona | Nada: usa la API pública `/wp-json/wp/v2/posts` |
| **Instagram** | Preparado | Cuenta profesional y una app de Meta con *Instagram API with Instagram Login*. Genera un token de larga duración (`IG_TOKEN`). Caduca a los 60 días: renuévalo con `--refresh-ig` |
| **Facebook** | Preparado | `FB_PAGE_ID` y un token de página (`FB_TOKEN`) con `pages_read_engagement` |
| **LinkedIn** | Preparado | App con el producto *Community Management API* aprobado por LinkedIn, permiso `r_organization_social`, `LI_ORG_ID` (id numérico de la página) y `LI_TOKEN` |
| **X** | Preparado | Plan de pago de la API (Basic o superior): `X_BEARER` y `X_USER_ID` |

### Mientras no haya claves: `data/actualidad.propuesta.json`

Cada red sin claves usa las publicaciones de este archivo, transcritas de capturas de los perfiles del 20/11/2026: 7 de Instagram, 1 de LinkedIn, 16 de Facebook y 11 de X. En cuanto una red tiene claves, su API sustituye esas publicaciones automáticamente. Para no usar la propuesta: `USE_PROPOSAL=false`.

- Las imágenes son recortes de las capturas (`assets/feed/propuesta/`), con menos resolución que las originales. Se pueden borrar cuando todas las redes estén conectadas.
- Fechas: `date` es exacta; con `approxDate` solo se conoce el mes (se muestra «≈ oct 2026»). En Instagram la captura no muestra fechas: `sortDate` solo sirve para ordenar y no se muestra.
- `also` indica otras redes donde se publicó lo mismo; así sale una sola tarjeta con «También en…».
- `url` apunta al perfil cuando no se conoce el enlace de la publicación concreta.

Las claves van en `tools/actualidad/.env` (copia de `.env.example`; nunca se sube al repositorio) o en las variables de entorno del servidor. Una red sin claves se omite sin errores.

## Comportamiento

- **Si una red falla** (token caducado, límite de uso…), se conservan sus últimas publicaciones y el resto se actualiza igual. El resumen de la consola indica qué pasó con cada fuente.
- **Imágenes:** las de Instagram, Facebook y LinkedIn se sirven con URLs firmadas que caducan, así que se descargan en `assets/feed/`. Las del blog (de vuestra web) y las de X (`pbs.twimg.com`) son estables y se enlazan directamente. Para desactivar las descargas: `DOWNLOAD_IMAGES=false`.
- **Se guardan las 30 más recientes** (`FEED_MAX`).

## Ajustes manuales: `data/actualidad.manual.json`

- `items`: publicaciones añadidas a mano, con el mismo formato que `actualidad.json`. Por ejemplo, una noticia en prensa:
  ```json
  { "id": "manual-prensa-1", "source": "blog", "date": "2026-11-20", "title": "…", "text": "…", "url": "https://…", "image": "https://…" }
  ```
- `overrides`: cambia campos de una publicación existente por su `id` (por ejemplo, un titular más corto que el original).
- `hide`: lista de `id` que no se muestran.

## Programarlo

Lo ideal es ejecutarlo a diario en el servidor o en CI. Por ejemplo, con cron:

```
0 7 * * *  cd /ruta/al/sitio && node tools/actualidad/update.mjs >> /var/log/actualidad.log 2>&1
```

O con GitHub Actions (`.github/workflows/actualidad.yml`), guardando las claves como *secrets*:

```yaml
on: { schedule: [{ cron: '0 7 * * *' }], workflow_dispatch: {} }
jobs:
  update:
    runs-on: ubuntu-latest
    permissions: { contents: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node tools/actualidad/update.mjs
        env:
          IG_TOKEN: ${{ secrets.IG_TOKEN }}
          FB_PAGE_ID: ${{ secrets.FB_PAGE_ID }}
          FB_TOKEN: ${{ secrets.FB_TOKEN }}
          LI_ORG_ID: ${{ secrets.LI_ORG_ID }}
          LI_TOKEN: ${{ secrets.LI_TOKEN }}
          X_USER_ID: ${{ secrets.X_USER_ID }}
          X_BEARER: ${{ secrets.X_BEARER }}
      - run: |
          git config user.name "actualidad-bot"
          git config user.email "actions@users.noreply.github.com"
          git add data assets/feed index.html actualidad.html
          git diff --cached --quiet || git commit -m "Actualidad: actualización diaria" && git push
```

## Añadir otra red

Crea `sources/<red>.mjs` exportando `{ id, label, enabled(env), fetch(env, ctx) }`. `fetch` debe devolver objetos `{ id, source, date, title, text, url, image, imageAlt }`. Añádela después a `SOURCES` en `update.mjs` y, si quieres un color propio, crea `.src--<red>` en `assets/css/style.css`.
