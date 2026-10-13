"""
Genera la web a partir de la carpeta "PAGINA WEB_".

    python tools/build.py

Lee las carpetas que carga Paz (fotos y videos originales, sin tocarlas) y crea:
  - assets/      versiones livianas para la web (fotos redimensionadas, loops de video)
  - js/content.js  el listado de todo lo que muestra el sitio

Es incremental: solo procesa lo nuevo o lo que cambió. Volver a correrlo cada
vez que se agregan, quitan o reordenan archivos en "PAGINA WEB_".

Estructura que espera (la de "PAGINA WEB_"):
  01_Paz Colotto/            fotos y videos del inicio, en orden (01_, 02_, …)
  02_Diario/diario de viajes/[proyecto]/   + portada/   (portadas del muro)
  02_Diario/personas/[proyecto]/           + portadas/
  03_Projectos/01_sociales/[proyecto]/     + portadas/
  03_Projectos/02_marcas/[proyecto]/       + portadas/
  04_Calle/[proyecto]/                     + portada/
  04_Video/                  un archivo por video
  05_Sobre mi/               retrato (la primera foto de la carpeta)

Cada foto de "portada(s)" es una copia de una foto (o video) de algún proyecto:
así se sabe a qué proyecto pertenece y desde qué foto se abre el carrusel.

Requiere Pillow (fotos) y ffmpeg (videos).
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'PAGINA WEB_'
OUT = ROOT / 'assets'
CONTENT_JS = ROOT / 'js' / 'content.js'

# (sección, subcategoría, carpeta de origen)
SECTIONS = [
    ('diario', 'viajes', '02_Diario/diario de viajes'),
    ('diario', 'personas', '02_Diario/personas'),
    ('proyectos', 'sociales', '03_Projectos/01_sociales'),
    ('proyectos', 'marcas', '03_Projectos/02_marcas'),
    ('calle', None, '04_Calle'),
]
WELCOME_DIR = '01_Paz Colotto'
VIDEO_DIR = '04_Video'
ABOUT_DIR = '05_Sobre mi'
COVER_DIRS = {'portada', 'portadas'}

# Portadas que no son copia exacta de una foto del proyecto (editadas aparte):
# nombre de archivo en minúsculas → carpeta del proyecto.
COVER_ALIASES = {
    'equilibrium.jpg': 'maria t',
    'golden c.jpg': 'maria t',
    'ir al norte_84.jpg': 'ir al norte',
}
# Proyectos sin fotos en portada(s): se usan estas fotos del propio proyecto.
EXTRA_COVERS = {
    'FINVOI': ['FINVOI-22.jpg', 'FINVOI-40.jpg', 'FINVOI-49.jpg'],
}
# Segundo desde el que arranca el loop de un video (por nombre de archivo, en minúsculas).
# Si no figura, se elige solo (0 s en clips cortos, ~15 % del video en los largos).
LOOP_START = {}

IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.webp'}
VIDEO_EXT = {'.mp4', '.mov', '.m4v'}

PHOTO_LONG = 2000      # lado largo de las fotos del carrusel
COVER_LONG = 1100      # lado largo de las portadas del muro
WELCOME_LONG = 2560    # lado largo de las fotos del inicio
LONG_VIDEO = 90        # segundos: más largo que esto = video completo (va por Vimeo/YouTube)


# ---- utilidades -------------------------------------------------------------

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = text.lower().replace('&', ' y ')
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')


def natural(text):
    """Orden natural: "foto 2" antes que "foto 10"."""
    return [(0, int(t)) if t.isdigit() else (1, t.lower()) for t in re.split(r'(\d+)', text) if t]


def natural_key(path):
    return natural(path.name)


def media_files(folder, recursive=True):
    """Fotos y videos de una carpeta (y subcarpetas), en orden natural de ruta."""
    paths = folder.rglob('*') if recursive else folder.iterdir()
    found = [p for p in paths if p.is_file() and p.suffix.lower() in IMAGE_EXT | VIDEO_EXT]
    return sorted(found, key=lambda p: [natural(part) for part in p.relative_to(folder).parts])


def fingerprint(path):
    h = hashlib.md5()
    with open(path, 'rb') as fh:
        h.update(fh.read(1 << 20))
    h.update(str(path.stat().st_size).encode())
    return h.hexdigest()


def is_fresh(dst, src):
    return dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime


def rel(path):
    return path.relative_to(ROOT).as_posix()


def find_ffmpeg():
    for name in ('ffmpeg', 'ffprobe'):
        if not shutil.which(name):
            break
    else:
        return shutil.which('ffmpeg'), shutil.which('ffprobe')
    base = Path(os.environ.get('LOCALAPPDATA', '')) / 'Microsoft' / 'WinGet' / 'Packages'
    for exe in base.glob('Gyan.FFmpeg*/**/bin/ffmpeg.exe'):
        return str(exe), str(exe.with_name('ffprobe.exe'))
    sys.exit('No encuentro ffmpeg. Instalalo con:  winget install Gyan.FFmpeg')


FFMPEG, FFPROBE = None, None


# ---- fotos ------------------------------------------------------------------

def image_job(args):
    src, dst, long_side, quality = args
    src, dst = Path(src), Path(dst)
    if is_fresh(dst, src):
        with Image.open(dst) as im:
            return im.size
    with Image.open(src) as im:
        icc = im.info.get('icc_profile')
        im = ImageOps.exif_transpose(im).convert('RGB')
        im.thumbnail((long_side, long_side), Image.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True, icc_profile=icc)
        return im.size


# ---- videos -----------------------------------------------------------------

def probe(src):
    out = subprocess.run(
        [FFPROBE, '-v', 'error', '-select_streams', 'v:0', '-show_entries',
         'stream=width,height:format=duration', '-of', 'json', str(src)],
        capture_output=True, text=True, check=True).stdout
    data = json.loads(out)
    st = data['streams'][0]
    return float(data['format']['duration']), st['width'], st['height']


def run_ffmpeg(args):
    subprocess.run([FFMPEG, '-y', '-v', 'error', *args], check=True)


def loop_start(src, duration):
    if src.name.lower() in LOOP_START:
        return LOOP_START[src.name.lower()]
    return 0 if duration <= 30 else min(duration * 0.15, 90)


def make_loop(src, dst, duration, seconds=10, height=720, crf=27):
    """Fragmento corto, sin audio, para reproducir en loop."""
    if is_fresh(dst, src):
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    start = loop_start(src, duration)
    run_ffmpeg(['-ss', f'{start:.2f}', '-t', str(seconds), '-i', str(src), '-an',
                '-vf', f'scale=-2:min(ih\\,{height})', '-c:v', 'libx264', '-preset', 'medium',
                '-crf', str(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(dst)])


def make_clip(src, dst, height=720):
    """Clip completo comprimido, con audio (para clips cortos dentro de un proyecto)."""
    if is_fresh(dst, src):
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    run_ffmpeg(['-i', str(src), '-vf', f'scale=-2:min(ih\\,{height})', '-c:v', 'libx264',
                '-preset', 'medium', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
                '-movflags', '+faststart', str(dst)])


def make_poster(src, dst, duration):
    if is_fresh(dst, src):
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    t = loop_start(src, duration)
    run_ffmpeg(['-ss', f'{t:.2f}', '-i', str(src), '-frames:v', '1',
                '-vf', 'scale=-2:min(ih\\,1080)', '-q:v', '4', str(dst)])


def video_entry(src, dst_base, mode, video_info):
    """mode: 'loop' (muro / inicio / preview) o 'item' (dentro del carrusel)."""
    duration, w, h = video_info[src]
    poster = dst_base.with_suffix('.jpg')
    make_poster(src, poster, duration)
    entry = {'type': 'video', 'poster': rel(poster), 'w': w, 'h': h}
    if mode == 'item' and duration <= LONG_VIDEO:
        clip = dst_base.with_suffix('.mp4')
        make_clip(src, clip)
        entry['src'] = rel(clip)
    else:
        loop = dst_base.with_name(dst_base.name + '-loop.mp4')
        make_loop(src, loop, duration, height=1080 if mode == 'welcome' else 720)
        entry['src'] = rel(loop)
        if mode == 'item':
            entry['long'] = True          # video completo: se reproduce desde Vimeo/YouTube
            entry['key'] = slugify(src.stem)
    return entry


# ---- armado -----------------------------------------------------------------

def main():
    global FFMPEG, FFPROBE
    if not SRC.exists():
        sys.exit(f'No encuentro la carpeta {SRC}')
    FFMPEG, FFPROBE = find_ffmpeg()

    image_jobs = {}       # dst → (src, dst, long, quality)
    pending = []          # funciones que completan el content cuando las fotos están listas
    used_outputs = set()

    def add_image(src, dst, long_side, quality=80):
        image_jobs[str(dst)] = (str(src), str(dst), long_side, quality)
        used_outputs.add(dst)
        entry = {'type': 'image', 'src': rel(dst)}
        pending.append((entry, str(dst)))
        return entry

    video_info = {}

    def info(src):
        if src not in video_info:
            video_info[src] = probe(src)
        return video_info[src]

    def add_video(src, dst_base, mode):
        info(src)
        entry = video_entry(src, dst_base, mode, video_info)
        for key in ('src', 'poster'):
            used_outputs.add(ROOT / entry[key])
        return entry

    content = {'generated': datetime.now().isoformat(timespec='seconds'),
               'welcome': [], 'projects': [], 'covers': {}, 'videos': [], 'portrait': None}

    # Inicio
    for i, src in enumerate(media_files(SRC / WELCOME_DIR, recursive=False), 1):
        base = OUT / 'welcome' / f'{i:02d}'
        if src.suffix.lower() in VIDEO_EXT:
            print('  video inicio:', src.name)
            content['welcome'].append({**add_video(src, base, 'welcome'), 'file': src.name})
        else:
            content['welcome'].append({**add_image(src, base.with_suffix('.jpg'), WELCOME_LONG, 82), 'file': src.name})

    # Retrato de "Sobre mí": la primera foto de la carpeta
    about_dir = SRC / ABOUT_DIR
    portraits = [p for p in media_files(about_dir, recursive=False) if p.suffix.lower() in IMAGE_EXT] if about_dir.exists() else []
    if portraits:
        content['portrait'] = add_image(portraits[0], OUT / 'sobre-mi' / 'retrato.jpg', 1400, 85)

    # Proyectos + portadas
    for section, sub, folder in SECTIONS:
        base_dir = SRC / folder
        key = f'{section}/{sub}' if sub else section
        projects = [d for d in sorted(base_dir.iterdir(), key=natural_key)
                    if d.is_dir() and d.name.lower() not in COVER_DIRS]
        by_hash, by_name, by_folder = {}, {}, {}

        for pdir in projects:
            slug = slugify(pdir.name)
            out_dir = OUT / section / (sub or '') / slug
            items = []
            for n, src in enumerate(media_files(pdir), 1):
                if src.suffix.lower() in VIDEO_EXT:
                    print(f'  video {key}/{pdir.name}:', src.name)
                    items.append({**add_video(src, out_dir / f'{n:03d}', 'item'), 'file': src.name})
                else:
                    items.append(add_image(src, out_dir / f'{n:03d}.jpg', PHOTO_LONG))
                    items[-1]['file'] = src.name
                by_hash[fingerprint(src)] = (slug, n - 1, src)
                by_name.setdefault(src.name.lower(), (slug, n - 1, src))
            project = {'slug': slug, 'section': section, 'sub': sub, 'title': pdir.name, 'items': items}
            content['projects'].append(project)
            by_folder[pdir.name.lower()] = (project, pdir)

        cover_dir = next((d for d in base_dir.iterdir() if d.is_dir() and d.name.lower() in COVER_DIRS), None)
        cover_srcs = media_files(cover_dir, recursive=False) if cover_dir else []
        for pname, names in EXTRA_COVERS.items():
            if pname.lower() in by_folder:
                cover_srcs += [by_folder[pname.lower()][1] / n for n in names]

        covers = []
        for c, src in enumerate(cover_srcs, 1):
            match = by_hash.get(fingerprint(src))
            if not match and src.name.lower() in COVER_ALIASES:
                project, _ = by_folder[COVER_ALIASES[src.name.lower()]]
                match = (project['slug'], 0, src)
            if not match:
                match = by_name.get(src.name.lower())
            if not match:
                print(f'  ! portada sin proyecto: {key}/{src.name} (se omite)')
                continue
            slug, index, _ = match
            dst_base = OUT / section / (sub or '') / slug / 'portadas' / f'{c:03d}'
            if src.suffix.lower() in VIDEO_EXT:
                entry = add_video(src, dst_base, 'loop')
            else:
                entry = add_image(src, dst_base.with_suffix('.jpg'), COVER_LONG, 80)
            entry.update({'project': slug, 'index': index, 'file': src.name})
            covers.append(entry)
        content['covers'][key] = covers
        missing = {p['slug'] for p in content['projects'] if p['section'] == section and p['sub'] == sub} - {c['project'] for c in covers}
        for m in sorted(missing):
            print(f'  ! proyecto sin portada (no aparece en el muro): {key}/{m}')

    # Sección video
    for src in media_files(SRC / VIDEO_DIR, recursive=False):
        if src.suffix.lower() not in VIDEO_EXT:
            continue
        slug = slugify(src.stem)
        print('  video:', src.name)
        entry = add_video(src, OUT / 'videos' / slug / 'preview', 'loop')
        entry.update({'slug': slug, 'title': src.stem.strip(), 'duration': round(video_info[src][0])})
        content['videos'].append(entry)

    # Fotos (en paralelo)
    print(f'Procesando {len(image_jobs)} fotos…')
    jobs = list(image_jobs.values())
    with ProcessPoolExecutor() as pool:
        sizes = dict(zip(image_jobs.keys(), pool.map(image_job, jobs, chunksize=4)))
    for entry, dst in pending:
        entry['w'], entry['h'] = sizes[dst]

    # Limpia archivos generados que ya no corresponden a nada
    removed = 0
    for path in OUT.rglob('*'):
        if path.is_file() and path.suffix.lower() in {'.jpg', '.mp4'} and path not in used_outputs:
            path.unlink()
            removed += 1
    for d in sorted((p for p in OUT.rglob('*') if p.is_dir()), key=lambda p: -len(p.parts)):
        if not any(d.iterdir()):
            d.rmdir()

    CONTENT_JS.write_text(
        '/* Generado por tools/build.py a partir de "PAGINA WEB_" — no editar a mano.\n'
        '   Títulos, créditos y links se editan en js/data.js. */\n'
        'window.SITE_CONTENT = ' + json.dumps(content, ensure_ascii=False, indent=1) + ';\n',
        encoding='utf-8')

    n_items = sum(len(p['items']) for p in content['projects'])
    n_covers = sum(len(c) for c in content['covers'].values())
    print(f'Listo: {len(content["welcome"])} piezas de inicio, {len(content["projects"])} proyectos '
          f'({n_items} archivos), {n_covers} portadas, {len(content["videos"])} videos. '
          f'Eliminados {removed} archivos viejos.')


if __name__ == '__main__':
    main()
