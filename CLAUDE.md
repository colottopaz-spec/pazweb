# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Portfolio estático de Paz Colotto (fotografía, video, dirección). HTML + CSS + JavaScript vanilla, sin bundler, sin npm, sin tests ni linter. Tailwind se carga por CDN desde `index.html` (solo se usa para la fuente y utilidades sueltas; casi todo el estilo está en `css/styles.css`). Se publica en Vercel directo desde el repo: `.vercelignore` deja afuera `tools/`, `serve.py` y `README.md`.

Los comentarios y textos del código están en castellano; mantener ese idioma.

## Comandos

```bash
python serve.py          # servidor local sin caché en http://localhost:5173 (python serve.py 8080 para otro puerto)
python tools/build.py    # regenera assets/ y js/content.js a partir de "PAGINA WEB_/"
```

`tools/build.py` requiere Pillow y ffmpeg, y la carpeta `PAGINA WEB_/` con los originales (varios GB, ignorada por git; normalmente no está en el checkout). Es incremental y borra de `assets/` lo que ya no existe en el origen. Si la carpeta no está, no hay nada que construir: la web se sirve tal cual.

No hay build para el front: abrir `index.html` servido por `serve.py` alcanza.

## Cache busting

`index.html` carga CSS y JS con `?v=N` (hoy `v=18`). Al cambiar `css/styles.css` o cualquier `js/*.js`, subir el número en **todas** las referencias de `index.html` (el `<link>` y los cuatro `<script>`), o el navegador puede seguir usando la versión vieja en producción.

## Arquitectura: pipeline de contenido

Todo el contenido pasa por tres capas que se cargan en orden en `index.html` y se comunican por globales de `window`:

1. **`js/content.js` → `window.SITE_CONTENT`** — generado por `tools/build.py`. Lista de piezas del inicio, proyectos (con sus items), portadas por muro, videos y retrato, con rutas a `assets/` y dimensiones. **No editar a mano**, igual que `assets/`.
2. **`js/data.js` → `window.SITE_DATA`** — lo escrito a mano: títulos, créditos, sinopsis, links de Vimeo/YouTube, bio y contacto, más reordenamientos (`WELCOME_POSITION`, `FEATURED`). Al final del archivo hay un bloque de "armado" que mezcla `SITE_CONTENT` con esos metadatos y produce `{ CONFIG, welcome, projects, covers, videos, writings, about }`.
3. **`js/i18n.js` → `window.UI_STRINGS`** — textos de interfaz ES/EN, incluidos los roles de créditos (`role.director`, etc.).
4. **`js/app.js`** — consume `SITE_DATA` y `UI_STRINGS`. Router por hash, slider del inicio, muros, modales y cambio de idioma.

Claves de unión entre capas: el **slug** (nombre de carpeta/archivo en minúsculas, sin acentos, `-` por espacios, `y` por `&`; ver `slugify` en `build.py`) une `PROJECT_META`, `VIDEO_META` y `LONG_VIDEO_LINKS` con lo generado. `FEATURED` y `WELCOME_POSITION` usan el **nombre de archivo original** tal cual (campo `file` en `content.js`).

### Convenciones de datos

- Cualquier texto de contenido puede ser un string o un objeto `{ es, en }`; `app.js` lo resuelve con `L()` según `state.lang`.
- Créditos: lista de `[rol, valor]`. El rol es una clave de `i18n.js` sin el prefijo `role.` (`'director'`) o un objeto `{ es, en }` para roles sin traducción fija.
- Videos de más de 90 s dentro de proyectos (`LONG_VIDEO` en `build.py`) se marcan `long: true` y solo tienen un loop de 10 s local; el completo se ve embebido desde Vimeo/YouTube vía `LONG_VIDEO_LINKS`. Lo mismo para la sección video con `VIDEO_META[slug].link`.
- Las portadas del muro son copias de una foto del proyecto; `build.py` las empareja por hash del archivo, y si no, por `COVER_ALIASES` o por nombre. Un proyecto sin portada no aparece en el muro (el script lo avisa).
- `CONFIG.SHOW_WRITINGS` en `data.js` oculta la sección "escritos" (hoy `false`).

### Secciones y rutas

Rutas por hash: `#/`, `#/diario/viajes`, `#/diario/personas`, `#/proyectos/sociales`, `#/proyectos/marcas`, `#/calle`, `#/video`, `#/escritos`, `#/sobre-mi`. La estructura de secciones está duplicada en tres lugares que deben coincidir: `SECTIONS` en `tools/build.py` (carpetas de origen), `SECTIONS` en `js/app.js` (rutas válidas) y la navegación en `index.html` (desktop y menú móvil). Agregar o renombrar una sección implica tocar los tres, más las claves `nav.*` de `i18n.js`.

### Vistas y modales en `app.js`

- `VIEWS[section]` devuelve el HTML de cada ruta; `render()` hace el swap con transición. Cambiar de subcategoría dentro de una misma sección solo reemplaza `#grid`.
- Muros (`diario`, `proyectos`, `calle`): `layoutWall` arma un mosaico con un orden pseudoaleatorio pero determinista (`seeded` por clave de sección), con las destacadas arriba.
- Tres modales con una pila común (`openModal` / `closeModal`, con focus trap): `#lightbox` (carrusel de proyecto, `openProject`), `#videobox` (reproductor, `openVideo`) y `#writingbox` (lector, `openWriting`). Los elementos del DOM de los modales viven en `index.html`, no se generan.
- Idioma: `state.lang` persiste en `localStorage` (`pc-lang`); `setLang` re-renderiza todo.
