/* ==========================================================================
   CONTENIDO DEL SITIO — Paz Colotto
   --------------------------------------------------------------------------
   Las fotos y videos salen de la carpeta "PAGINA WEB_":
     1. Cargá / ordená archivos en "PAGINA WEB_" (ver tools/build.py).
     2. Corré:  python tools/build.py
        → genera assets/ (versiones livianas) y js/content.js (el listado).

   En ESTE archivo se edita lo que no sale de las carpetas:
   títulos, créditos, links de Vimeo/YouTube, bio y contacto.

   Las claves (slug) son el nombre de la carpeta o archivo en minúsculas,
   sin acentos, con "-" en lugar de espacios y "y" en lugar de "&".
     "jua & gusi"            → 'jua-y-gusi'
     "Se dice vulva .mp4"    → 'se-dice-vulva'
   ========================================================================== */

(function () {
  'use strict';

  const CONTENT = window.SITE_CONTENT || { welcome: [], projects: [], covers: {}, videos: [] };

  const CONFIG = {
    SHOW_WRITINGS: false, // ← true para volver a mostrar la sección "escritos" (textos en `writings`)
  };

  /* ==========================================================================
     PROYECTOS — título y créditos (opcional)
     Si un proyecto no figura acá se muestra con el nombre de su carpeta.
     credits: [rol, valor] → una línea: Nombre • Cliente X • Dirección Y • Año
     Roles disponibles: client, director, writerDirector, dop, camera,
     production, agency, art, styling, makeup, assistant, music, sound…
     text: { es: ['párrafo', …], en: [...] } → se despliega con el botón "info"
     ========================================================================== */
  const PROJECT_META = {
    // 'astrea': { title: 'Astrea', year: 2025, credits: [['client', 'Astrea'], ['director', 'Paz Colotto']] },
    'nunca-llegamos-al-congreso': {
      year: 2026,
      text: {
        es: [
          'Registro audiovisual y fotográfico independiente.',
          'Video: punto de vista de escapatoria de la represión policial. Fotografías: registro de los rostros irritados por los gases de la policía.',
          'El 6 de agosto de 2026 se realizó una masiva marcha frente al Congreso Nacional en Buenos Aires y otras ciudades en rechazo a la reforma de la Ley de Tierras. Sindicatos, organizaciones sociales y políticas se autoconvocaron bajo la consigna «A la patria no se vende».',
        ],
        en: [
          'Independent audiovisual and photographic record.',
          'Video: the point of view of escaping police repression. Photographs: a record of faces irritated by police tear gas.',
          'On 6 August 2026 a massive march took place in front of the National Congress in Buenos Aires and other cities, rejecting the reform of the Land Law. Unions and social and political organisations gathered under the slogan “The homeland is not for sale”.',
        ],
      },
    },
  };

  /* ==========================================================================
     INICIO — el orden sale de los números de "01_Paz Colotto" (01_, 02_, …).
     Para mover una pieza sin renombrar archivos: nombre del archivo → posición.
     ========================================================================== */
  const WELCOME_POSITION = {
    '06_uyuni.mp4': 1,   // uyuni primero; después sigue el resto en orden (01 orgullo bostero, 02…)
  };

  /* ==========================================================================
     FOTOS DESTACADAS — van arriba de todo en el muro (en este orden) y son la
     primera foto del carrusel de su proyecto. Tienen que estar en la carpeta
     portada(s) de esa sección. Se escribe el nombre del archivo tal cual.
     ========================================================================== */
  const FEATURED = {
    'proyectos/sociales': [
      '16jua&gusi_imprimir01-142.jpg',   // jua & gusi — el señor fumando
      '02_Prensa_Web.jpg',               // lisandro alonso — retrato
      'BAFWEEK_PAZ COLOTTO-1.jpg',       // bafweek — la señora con la copa
    ],
  };

  /* ==========================================================================
     VIDEOS (sección video) — título, año, créditos y link al video completo
     link: { type: 'vimeo', id: '123456789' } o { type: 'youtube', id: 'xxxxxxxxxxx' }
           (el id es el número del link de Vimeo: vimeo.com/manage/videos/123456789)
     Mientras no haya link, el reproductor muestra el loop de la grilla.
     synopsis: { es: '…', en: '…' } (opcional) — va debajo del título.
     awards:   { es: '…', en: '…' } (opcional) — premios y selecciones, debajo de la sinopsis.
     credits:  el rol puede ser una clave de js/i18n.js ('director') o escribirse
               directamente: [{ es: 'Foquista', en: 'Focus puller' }, 'Nombre']
     ========================================================================== */
  const VIDEO_META = {
    'bruta-cruz-teaser-2026-ficic': {
      title: 'Cruz — teaser', year: 2026,
      synopsis: {
        es: 'Cruz, cansada de su soledad, tiene una cita con un desconocido que conoció en una aplicación de citas.',
        en: 'Cruz, tired of being alone, goes on a date with a stranger she met on a dating app.',
      },
      awards: {
        es: 'Premio RAFMA a Mejor Cortometraje 2026, FICIC (Festival Internacional de Cine de Cosquín). Mejor Interpretación: Berenice Zapiola en Maratón Audiovisual de SAGAI.',
        en: 'RAFMA Award for Best Short Film 2026, FICIC (Cosquín International Film Festival). Best Performance: Berenice Zapiola at the SAGAI Audiovisual Marathon.',
      },
      credits: [
        ['writer', 'Paz Colotto & Berenice Zapiola'],
        ['director', 'Paz Colotto'],
        ['assistantDirector', 'Camila Ochoa'],
        [{ es: 'Continuista', en: 'Script supervisor' }, 'Candelaria Cosso Taranto'],
        ['dop', 'Julia Celoria'],
        ['camera', 'Camila Mariasch'],
        [{ es: 'Foquista', en: 'Focus puller' }, 'Julian Barraza'],
        [{ es: 'Asistencia de cámara', en: 'Camera assistants' }, 'Sofia Mariasch & Guadalupe Sosa'],
        [{ es: 'Gaffer', en: 'Gaffers' }, 'Nina Marchi & Santiago Medina'],
        [{ es: 'Eléctrica', en: 'Electricians' }, 'Maria Martinez & Laura Gimenez Noble'],
        ['art', 'Clara Rozas'],
        [{ es: 'Asistencia de arte', en: 'Art assistant' }, 'Sofia Canepa'],
        [{ es: 'Posproducción de sonido y diseño sonoro', en: 'Sound post-production and sound design' }, 'Gonzalo Peralta'],
        [{ es: 'Sonido directo', en: 'Production sound' }, 'Francis Castelvania & Clementina Mourier'],
        ['editing', 'Candelaria Cosso Taranto'],
        [{ es: 'Animaciones y diseño gráfico', en: 'Animation and graphic design' }, 'Isabella Mazzoni'],
        ['color', 'Candelaria Cosso Taranto & Julia Celoria'],
        [{ es: 'VFX', en: 'VFX' }, 'Mariano Asseff & Lucas Sfintzi'],
        [{ es: 'Foto fija', en: 'Stills' }, 'Elena Aguirre Mijal Pokorski & Ana Villalba'],
        ['music', 'l0g0s & tshine'],
        ['producer', 'Loana Melul, Berenice Zapiola & Paz Colotto'],
        [{ es: 'Asistencia de producción', en: 'Production assistant' }, 'Ana Villalba'],
        [{ es: 'Ayudante de producción', en: 'Production runner' }, 'Layla Ferrari'],
        [{ es: 'Elenco', en: 'Cast' }, 'Berenice Zapiola, Rodrigo Tarazona, Maria "pipi" Latzina & Melany Kolmann'],
        [{ es: 'Distribución', en: 'Distribution' }, 'Luciana Abad'],
      ],
      link: { type: 'vimeo', id: '1235172080' },
    },
    'se-dice-vulva': {
      title: 'Se dice vulva', year: 2022,
      synopsis: {
        es: 'Ante siglos de odio y tabú dirigidos al máximo exponente de la feminidad — la vulva — un grupo de mujeres intenta reivindicar su lugar de poder por medio de intervenciones en la vía pública.',
        en: 'In the face of centuries of hatred and taboo aimed at the ultimate emblem of femininity — the vulva — a group of women set out to reclaim its place of power through interventions in public space.',
      },
      credits: [
        ['fullProduction', 'bruta'],
        ['director', 'Paz Colotto, Berenice Zapiola'],
        ['writer', 'Paz Colotto, Berenice Zapiola'],
        ['producer', 'Camila Mariasch'],
        ['assistantDirector', 'Berenice Zapiola'],
        ['dop', 'Clara Rozas'],
        ['camera', 'Sofia Corso, Clara Rozas, Paz Colotto'],
        ['art', 'Sofía Corso'],
        ['soundDirection', 'Candelaria Cosso Taranto'],
        ['editing', 'Candelaria Cosso Taranto'],
        ['soundEditing', 'Candelaria Cosso Taranto'],
        ['colorGrading', 'Candelaria Cosso Taranto'],
      ],
      link: { type: 'vimeo', id: '1064069106' },
    },
    'noche-de-pizzas-en-el-mistica': {
      title: 'Noche de pizzas en el mística',
      synopsis: {
        es: 'Registro en el norte argentino, noche de pizzas.',
        en: 'A record from northern Argentina, pizza night.',
      },
      link: { type: 'vimeo', id: '1235174541' },
    },
    'atardecer-en-cachi-ya-no-quiero-jugar': {
      title: 'are we dating the same guy?',
      synopsis: { es: 'Cachi, pueblo de ovnis.', en: 'Cachi, a UFO town.' },
      link: { type: 'vimeo', id: '1235177560' },
    },
    'soy-paz-paz-colotto': {
      title: 'Soy Paz',
      synopsis: {
        es: 'Soy Paz es un autorretrato en forma de pregunta. Un minuto para explorar la contradicción de llamarse Paz sin sentirla del todo. La cámara se vuelve excusa, espejo y refugio para buscar entre recuerdos, fragmentos y dudas. Todavía no sé quién soy, por eso busco en las imágenes que creo.',
        en: 'Soy Paz is a self-portrait in the form of a question. One minute to explore the contradiction of being named Paz (peace) without fully feeling it. The camera becomes an excuse, a mirror and a refuge to search among memories, fragments and doubts. I still don’t know who I am, so I search in the images I create.',
      },
      credits: [['fullProduction', 'Paz Colotto']],
      link: { type: 'vimeo', id: '1064066737' },
    },
  };

  /* Videos que no están en "04_Video" pero se suman a la sección video.
     fromWelcome: archivo de "01_Paz Colotto" del que se toma el loop de la grilla. */
  const EXTRA_VIDEOS = [
    {
      slug: 'uyuni-ya-nos-vamos',
      title: 'uyuni — ya nos vamos?',
      fromWelcome: '06_uyuni.mp4',
      link: { type: 'vimeo', id: '1235230921' },
    },
  ];

  /* Videos largos (más de 90 s) dentro de proyectos de calle: link al completo.
     Clave = nombre del archivo como slug. Sin link se ve un loop de 10 s. */
  const LONG_VIDEO_LINKS = {
    'pcine-colotto-paz-presentes-2025': { type: 'vimeo', id: '1235180055' },   // calle / lara, breda & morena — presentes (2025)
    'ley-de-glaciares': { type: 'vimeo', id: '1235180479' },                  // calle / ley de glaciares
    'nunca-llegamos-al-congreso-01': { type: 'youtube', id: 'qjmaJtuulK8' },   // calle / nunca llegamos al congreso
  };

  /* ==========================================================================
     ESCRITOS (sección oculta por ahora, ver CONFIG.SHOW_WRITINGS)
     { slug: 'una-urna-1', title: 'Una urna', date: '2025',
       body: { es: ['párrafo 1', 'párrafo 2'], en: ['paragraph 1', 'paragraph 2'] } }
     ========================================================================== */
  const writings = [];

  /* ==========================================================================
     SOBRE MÍ — texto de "PAGINA WEB_/05_Sobre mi/About.pdf"
     ========================================================================== */
  const about = {
    bio: {
      es: [
        'Paz Colotto, 1999, Azul, Argentina. Diseñadora de Imagen y Sonido (UBA), fotógrafa y directora.',
        'Reside en CABA. Se desempeña como fotógrafa y directora independiente.',
        'Dirigió y escribió el cortometraje Cruz (2026), ganador del Premio a Mejor Cortometraje RAFMA en el Festival Internacional de Cine de Cosquín (FICIC) y del Premio a Mejor Interpretación en la Maratón Audiovisual de Fundación SAGAI; actualmente en proceso de distribución.',
        'Realizó Se dice vulva (2022), ganador del Festival Internacional MuMA Patagonia, seleccionado en el Festival La Mujer y El Cine (2023) y en la sección de Videoactivismo de Hecho por Mujeres (Perú, 2023).',
        'Forma parte del programa Creadores de imágenes CABA, coordinado por Julia Sbriller. Realizó el taller Desafíos y posibilidades del Cine Documental coordinado por Néstor Frenkel (2025) y el curso Comedias XX’s coordinado por Agustina Gatto en el Laboratorio de Guion (2023).',
        'Actualmente trabaja como productora audiovisual para la Secretaría de Políticas de Diseño e Innovación Tecnológica de la Universidad de Buenos Aires, forma parte del equipo de producción de FIC.UBA y ha colaborado en el Área de Invitados de BAFICI durante cuatro ediciones.',
      ],
      en: [
        'Paz Colotto, 1999, Azul, Argentina. Image and Sound Designer (UBA), photographer and director.',
        'Based in Buenos Aires. She works as an independent photographer and director.',
        'She wrote and directed the short film Cruz (2026), winner of the RAFMA Award for Best Short Film at the Cosquín International Film Festival (FICIC) and of the Best Performance Award at the SAGAI Foundation Audiovisual Marathon; currently in distribution.',
        'She made Se dice vulva (2022), winner of the MuMA Patagonia International Festival, selected at the La Mujer y El Cine Festival (2023) and in the Video Activism section of Hecho por Mujeres (Peru, 2023).',
        'She is part of the Creadores de imágenes CABA programme, led by Julia Sbriller. She took the workshop Challenges and Possibilities of Documentary Film led by Néstor Frenkel (2025) and the course Comedias XX’s led by Agustina Gatto at the Laboratorio de Guion (2023).',
        'She currently works as an audiovisual producer for the Secretariat of Design Policy and Technological Innovation at the University of Buenos Aires, is part of the FIC.UBA production team and has worked in the BAFICI Guest Department for four editions.',
      ],
    },
    contact: {
      email: 'colottopaz@gmail.com',
      instagram: 'pazcolotto', // ← usuario de Instagram sin @ (vacío = no se muestra)
      location: { es: 'Buenos Aires, Argentina', en: 'Buenos Aires, Argentina' },
    },
  };

  /* ---- Armado (no hace falta tocar) --------------------------------------- */

  const projects = CONTENT.projects.map((p) => {
    const meta = PROJECT_META[p.slug] || {};
    const items = p.items.map((it) => (it.long ? { ...it, link: LONG_VIDEO_LINKS[it.key] || null } : it));
    return { ...p, ...meta, items, title: meta.title || p.title, credits: meta.credits || [], year: meta.year || null };
  });
  const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

  // Destacadas: se marcan en el muro y pasan a ser la primera foto de su carrusel
  const covers = Object.fromEntries(Object.entries(CONTENT.covers).map(([key, list]) => [key, list.map((c) => ({ ...c }))]));
  Object.entries(FEATURED).forEach(([key, files]) => {
    files.forEach((file, order) => {
      const cover = (covers[key] || []).find((c) => c.file === file);
      if (!cover) { console.warn(`Destacada no encontrada en portadas de ${key}: ${file}`); return; }
      cover.featured = order + 1;
      const p = projectBySlug[cover.project];
      const from = cover.index;
      if (!p || from === 0) return;
      // Mueve la foto al principio del carrusel y corrige el índice de las portadas de ese proyecto
      const [item] = p.items.splice(from, 1);
      p.items.unshift(item);
      Object.values(covers).flat().forEach((c) => {
        if (c.project !== p.slug) return;
        if (c.index === from) c.index = 0;
        else if (c.index < from) c.index += 1;
      });
    });
  });

  const videos = CONTENT.videos.map((v) => {
    const meta = VIDEO_META[v.slug] || {};
    return { ...v, ...meta, title: meta.title || v.title, credits: meta.credits || [], year: meta.year || null, link: meta.link || null };
  });
  EXTRA_VIDEOS.forEach((extra) => {
    const source = CONTENT.welcome.find((w) => w.file === extra.fromWelcome && w.type === 'video');
    if (!source) { console.warn(`Video extra: no encuentro ${extra.fromWelcome} en el inicio`); return; }
    videos.push({ src: source.src, poster: source.poster, w: source.w, h: source.h, credits: [], year: null, ...extra });
  });

  // Retrato: primera foto de "PAGINA WEB_/05_Sobre mi" (lo arma tools/build.py)
  about.portrait = CONTENT.portrait || null;

  const welcome = CONTENT.welcome.slice();
  Object.entries(WELCOME_POSITION).forEach(([file, position]) => {
    const from = welcome.findIndex((w) => w.file === file);
    if (from < 0) { console.warn(`Inicio: no encuentro ${file}`); return; }
    const [item] = welcome.splice(from, 1);
    welcome.splice(Math.max(0, position - 1), 0, item);
  });

  window.SITE_DATA = { CONFIG, welcome, projects, covers, videos, writings, about };
})();
