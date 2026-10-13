# Paz Colotto — portfolio

Sitio estático (HTML, Tailwind por CDN y JavaScript sin dependencias): fotografía, video y dirección.

## Ver la web en la computadora

```
python serve.py
```

y abrir http://localhost:5173

## Actualizar fotos y videos

1. Cargar / ordenar archivos en la carpeta `PAGINA WEB_/` (los originales; no se suben al repo).
2. Generar las versiones para la web:

   ```
   python tools/build.py
   ```

   Requiere Python con Pillow y ffmpeg (`winget install Gyan.FFmpeg`). Crea `assets/` y `js/content.js`.
3. Subir los cambios al repo.

## Dónde se edita cada cosa

| Qué | Dónde |
|---|---|
| Títulos, créditos, sinopsis y links de Vimeo/YouTube | `js/data.js` |
| Orden del inicio, fotos destacadas en los muros | `js/data.js` (`WELCOME_POSITION`, `FEATURED`) |
| Bio, email, Instagram | `js/data.js` (`about`) |
| Textos de la interfaz (ES / EN) | `js/i18n.js` |
| Estilos | `css/styles.css` |

`assets/` y `js/content.js` se generan solos: no editarlos a mano.
