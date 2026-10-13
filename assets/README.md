# assets/ — generada automáticamente

**No editar a mano.** Esta carpeta la crea `tools/build.py` a partir de `PAGINA WEB_/`
(los originales, que no se tocan). Contiene versiones livianas para la web:

- fotos del carrusel: 2000 px de lado largo
- portadas del muro: 1100 px
- fotos del inicio: 2560 px
- videos: loops de 10 s sin audio (inicio, portadas, sección video) y clips cortos de calle comprimidos a 720p

## Para actualizar la web

1. Agregá, quitá o reordená archivos en `PAGINA WEB_/`.
2. Corré:

   ```
   python tools/build.py
   ```

   Solo procesa lo nuevo o lo modificado, y borra de acá lo que ya no está en el origen.

## Cómo se arma cada parte

| En `PAGINA WEB_/` | En la web |
|---|---|
| `01_Paz Colotto/` (01_, 02_, …) | Slider del inicio, en ese orden. Los videos se recortan a un loop de 10 s. |
| `[sección]/[proyecto]/` | Carrusel del proyecto (fotos y videos, en orden de nombre). |
| `[sección]/portada(s)/` | Muro de la sección. Cada portada es una copia de un archivo del proyecto: así se sabe qué proyecto abre y desde qué foto. |
| `04_Video/` | Sección video (loop en la grilla; el video completo, por link de Vimeo/YouTube en `js/data.js`). |

Al publicar la web, subir todo **menos** `PAGINA WEB_/` (son los originales, varios GB) y `tools/`.
