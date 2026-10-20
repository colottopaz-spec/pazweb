# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Portfolio estático de Paz Colotto (fotografía, video, dirección). HTML + CSS + JavaScript vanilla, sin bundler, sin npm, sin tests ni linter. Tailwind se carga por CDN desde `index.html` (solo se usa para la fuente y utilidades sueltas; casi todo el estilo está en `css/styles.css`). Se publica en Vercel por la integración con GitHub: un push a `main` despliega producción y cualquier otra rama genera un preview (protegido por login de Vercel). `.vercelignore` deja afuera `tools/`, `serve.py`, `README.md`, `referencias/` y este archivo.

Los comentarios y textos del código están en castellano; mantener ese idioma.

## Comandos

```bash
python serve.py          # servidor local sin caché en http://localhost:5173 (python serve.py 8080 para otro puerto)
```

No hay build para el front: abrir `index.html` servido por `serve.py` alcanza.

## `tools/build.py` no se puede correr

**Nunca correr `python tools/build.py`.** Necesita la carpeta de originales `PAGINA WEB_/`, que no existe en ninguna máquina. Además, al terminar borra de `assets/` todo `.jpg`/`.mp4` que no haya generado él y reescribe `js/content.js` entero: correrlo sin los originales (o con originales incompletos) destruye contenido publicado.

El script queda como referencia de los parámetros. El contenido nuevo se agrega **a mano**, replicando lo que haría el build:

- Fotos del carrusel: lado largo 2000 px, JPEG calidad 80, progresivo, sin EXIF, conservando el perfil ICC. Nombres `001.jpg`, `002.jpg`… en `assets/<sección>/<sub>/<slug>/`, en orden natural del nombre original. No se agrandan las fotos más chicas.
- Portada del muro: copia de una foto del proyecto a 1100 px, calidad 80, en `assets/<sección>/<sub>/<slug>/portadas/NNN.jpg`, donde `NNN` es el siguiente número libre dentro de la lista de portadas de esa sección.
- Se pueden reutilizar las funciones de `build.py` importándolo (`image_job`, `slugify`, `media_files`, constantes `PHOTO_LONG`, `COVER_LONG`): importar no ejecuta `main()`. Requiere Pillow.
- Agregar las entradas en `js/content.js` con el mismo formato que las existentes: el proyecto en `projects` (en orden natural de carpeta dentro de su sección) y la portada al final de `covers['<sección>/<sub>']`. Mantener el formato del archivo (JSON con indentación de 1 espacio); se puede cargar y reescribir con `JSON.stringify(obj, null, 1)` y da un resultado idéntico.
- No subir los originales pesados al repo; solo las versiones livianas. Cuando aparecen fotos nuevas dentro de `assets/` (Paz las deja ahí), después de procesarlas se mueven a `originales/` con la misma ruta: está en `.gitignore` y no se publica.
- Videos: el build genera loops de 10 s sin audio, clips a 720p y pósters con ffmpeg (ver `make_loop`, `make_clip`, `make_poster`). Hacerlo a mano requiere ffmpeg, que no está instalado; consultar antes.

## Cache busting

`index.html` carga CSS y JS con `?v=N`. Al cambiar `css/styles.css`, `js/content.js` o cualquier otro `js/*.js`, subir el número en **todas** las referencias de `index.html` (el `<link>` y los cuatro `<script>`), o el navegador puede seguir usando la versión vieja en producción.

## Arquitectura: pipeline de contenido

Todo el contenido pasa por capas que se cargan en orden en `index.html` y se comunican por globales de `window`:

1. **`js/content.js` → `window.SITE_CONTENT`** — originalmente generado por `build.py`; ahora se edita a mano siguiendo las reglas de arriba. Lista de piezas del inicio, proyectos (con sus items), portadas por muro, videos y retrato, con rutas a `assets/` y dimensiones.
2. **`js/data.js` → `window.SITE_DATA`** — lo escrito a mano: títulos, textos, créditos, sinopsis, links de Vimeo/YouTube, bio y contacto, más reordenamientos (`WELCOME_POSITION`, `FEATURED`, `GRID_ORDER`, `CONFIG.VIDEO_ORDER`, `CONFIG.SECTION_LIMIT`). Al final del archivo hay un bloque de "armado" que mezcla `SITE_CONTENT` con esos metadatos y produce `{ CONFIG, welcome, projects, covers, videos, writings, about }`. Todo lo que `app.js` necesite tiene que salir por ese objeto: `GRID_ORDER` se exporta como `CONFIG.GRID_ORDER`.
3. **`js/i18n.js` → `window.UI_STRINGS`** — textos de interfaz ES/EN, incluidos los roles de créditos (`role.director`, etc.).
4. **`js/app.js`** — consume `SITE_DATA` y `UI_STRINGS`. Router por hash, slider del inicio, muros, modales y cambio de idioma.

Claves de unión entre capas: el **slug** (nombre de carpeta/archivo en minúsculas, sin acentos, `-` por espacios, `y` por `&`; ver `slugify` en `build.py`) une `PROJECT_META`, `VIDEO_META`, `CONFIG.VIDEO_ORDER` y `LONG_VIDEO_LINKS` con `content.js`. Una clave que no coincide con un slug real se ignora sin aviso: verificar contra `content.js`. `FEATURED` y `WELCOME_POSITION` usan el **nombre de archivo original** tal cual (campo `file` en `content.js`). `GRID_ORDER` usa `'slug/archivo original'` (o solo el archivo si no se repite en el muro): en el muro mixto de proyectos hay nombres repetidos (`01.jpg`, `17.jpg`).

### Convenciones de datos

- Cualquier texto de contenido puede ser un string o un objeto `{ es, en }`; `app.js` lo resuelve con `L()` según `state.lang`.
- Créditos: lista de `[rol, valor]`. El rol es una clave de `i18n.js` sin el prefijo `role.` (`'director'`) o un objeto `{ es, en }` para roles sin traducción fija.
- Videos de más de 90 s dentro de proyectos se marcan `long: true` y solo tienen un loop de 10 s local; el completo se ve embebido desde Vimeo/YouTube vía `LONG_VIDEO_LINKS`. Lo mismo para la sección video con `VIDEO_META[slug].link`.
- `EXTRA_VIDEOS` suma tarjetas a la sección video tomando el loop de una pieza del inicio (`fromWelcome`) o de un ítem de proyecto (`fromProject: { slug, itemIndex }`); `itemIndex` tiene que apuntar a un ítem de tipo `video`.
- Un proyecto sin portada en `covers` no aparece en el muro.
- Texto de proyecto (`text`): si es un solo párrafo y el pie completo (nombre, créditos, año y texto) tiene hasta `CONFIG.PIE_MAX_CHARS` caracteres en ES y en EN, va directo en el pie; si no, botón "info" con desplegable (`textPlacement` en `app.js`). Sin texto, no hay "info".
- `CONFIG.SHOW_WRITINGS` en `data.js` oculta la sección "escritos" (hoy `false`).

### Secciones y rutas

Rutas por hash: `#/`, `#/diario/viajes`, `#/diario/personas`, `#/proyectos/sociales`, `#/proyectos/marcas`, `#/calle`, `#/video`, `#/escritos`, `#/sobre-mi`. La estructura de secciones está duplicada en tres lugares que deben coincidir: `SECTIONS` en `tools/build.py` (carpetas de origen y rutas de `assets/`), `SECTIONS` en `js/app.js` (rutas válidas) y la navegación en `index.html` (desktop y menú móvil). Agregar o renombrar una sección implica tocar los tres, más las claves `nav.*` de `i18n.js`.

### Vistas y modales en `app.js`

- `VIEWS[section]` devuelve el HTML de cada ruta; `render()` hace el swap con transición. Cambiar de subcategoría dentro de una misma sección solo reemplaza `#grid`.
- Muros (`diario`, `proyectos`, `calle`): si el muro tiene `CONFIG.GRID_ORDER` (clave `'seccion/sub'`, o `'seccion'` para los muros mixtos de diario y proyectos), `layoutFixed` reparte las portadas fila por fila en ese orden (las no listadas van después); si no, `layoutWall` arma un mosaico pseudoaleatorio pero determinista (`seeded` por clave de sección), con las destacadas arriba. Hoy los seis muros de diario y proyectos tienen orden fijo, tomado de las láminas de Paz en `referencias/` (no se publican). `CONFIG.SECTION_LIMIT` corta cualquier muro a sus primeras N portadas (hoy: proyectos 15, sociales 15, marcas 9). `CONFIG.WALL_BANNER` saca una portada de la grilla y la muestra abajo a todo el ancho (hoy Parlle en marcas), con la imagen horizontal de `banner` en su entrada de `content.js`; no cuenta para el límite.
- Tres modales con una pila común (`openModal` / `closeModal`, con focus trap): `#lightbox` (carrusel de proyecto, `openProject`), `#videobox` (reproductor, `openVideo`) y `#writingbox` (lector, `openWriting`). Los elementos del DOM de los modales viven en `index.html`, no se generan.
- Idioma: `state.lang` persiste en `localStorage` (`pc-lang`); `setLang` re-renderiza todo.
