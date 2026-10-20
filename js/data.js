/* ==========================================================================
   CONTENIDO DEL SITIO — Paz Colotto
   --------------------------------------------------------------------------
   Las fotos y videos salen de la carpeta "PAGINA WEB_":
     1. Cargá / ordená archivos en "PAGINA WEB_" (ver tools/build.py).
     2. Corré:  python tools/build.py
        → genera assets/ (versiones livianas) y js/content.js (el listado).

   En ESTE archivo se edita lo que no sale de las carpetas:
   títulos, créditos, links de Vimeo/YouTube, bio y contacto.
   ========================================================================== */

(function () {
  'use strict';

  const CONTENT = window.SITE_CONTENT || { welcome: [], projects: [], covers: {}, videos: [] };

  const CONFIG = {
    SHOW_WRITINGS: false, // ← true para volver a mostrar la sección "escritos"

    /* Orden fijo de la sección Video (slugs) */
    VIDEO_ORDER: [
      'atardecer-en-cachi-ya-no-quiero-jugar', // 1. Are we dating the same guy?
      'uyuni-ya-nos-vamos',                    // 2. Uyuni
      'nunca-llegamos-al-congreso-video',       // 3. Nunca llegamos al congreso
      'ley-de-glaciares-video',                // 4. Ley de glaciares
      'noche-de-pizzas-en-el-mistica',         // 5. Noche de pizzas en el mística
      'bruta-cruz-teaser-2026-ficic',          // 6. Cruz (teaser)
      'soy-paz-paz-colotto',                   // 7. Soy Paz
      'se-dice-vulva',                         // 8. Se dice vulva
    ],

    /* Límite opcional de fotos (portadas) visibles en los muros. Por defecto, sin límite.
       - Por sección: { 'proyectos/marcas': 8, 'calle': 6, 'diario': 4 }
         ('diario' y 'proyectos' solos son las vistas que mezclan sus dos subcategorías)
       - Para todos los muros: un número, por ejemplo 6
       Se muestran las primeras N en el orden de la grilla (destacadas y GRID_ORDER
       incluidos) y la grilla se arma solo con esas. */
    SECTION_LIMIT: {},
  };

  /* ==========================================================================
     PROYECTOS Y CRÉDITOS COMPLETOS
     ========================================================================== */
  const PROJECT_META = {
    // PROYECTOS / SOCIALES
    'ficuba-lab': {
      title: 'fic.uba lab', year: 2026,
      text: { es: ['Retratos a tutores y participantes.'], en: ['Portraits of tutors and participants.'] }
    },
    'charly': {
      title: 'Doctor Charly García', year: 2025,
      text: {
        es: ['Fotografía institucional para la Universidad de Buenos Aires. Entrega del Doctor Honoris Causa a Charly García por su trayectoria y su aporte a la cultura. Facultad de Filosofía y Letras, Buenos Aires.'],
        en: ['Institutional photography for the University of Buenos Aires. Honorary Doctorate awarded to Charly García for his career and contribution to culture. Faculty of Philosophy and Letters, Buenos Aires.']
      }
    },
    'irrefrenable': {
      title: 'irrefrenable', year: 2025,
      text: {
        es: ['Cobertura fotográfica, obra de teatro Irrefrenable de Gonzalo Quintana. Buenos Aires. IRREFRENABLE es una obra documental en donde cuatro artistas croatas indagan sobre la identidad y las fuerzas naturales imposibles de detener que los constituyen. A partir de un cruce con la ciudad de Zagreb, los performers comparten sus historias y universos personales para rastrear y amplificar aquellos aspectos que los hacen únicos. Se trata de una prueba que busca superar los propios límites y generar un archivo escénico que ponga historias de la comunidad LGTBIQ+.'],
        en: ['Photographic coverage of the play Irrefrenable by Gonzalo Quintana. Buenos Aires. IRREFRENABLE is a documentary play in which four Croatian artists explore identity and unstoppable natural forces. Through an encounter with Zagreb, performers share their stories to amplify what makes them unique and construct an LGBTIQ+ scenic archive.']
      }
    },
    'lisandro-alonso': {
      title: 'lisandro alonso', year: 2026,
      text: { es: ['Retrato a Lisandro Alonso en la FADU, registro para el FIC.UBA.'], en: ['Portrait of Lisandro Alonso at FADU, recorded for FIC.UBA.'] }
    },
    'kabuki-y-benitez-emilse': {
      title: 'kabuki & benítez emilse',
      text: {
        es: ['Key Artist: Jazmin Calcarami - Team make up: Sol Lemonni, Sofia Torres Busquets, Nicole Nielsen, Valentina Recalde, Llankaray Angulo M y Sol Ábrete.\nPelo: Eugenia Grigorevskaia.'],
        en: ['Key Artist: Jazmin Calcarami - Team make up: Sol Lemonni, Sofia Torres Busquets, Nicole Nielsen, Valentina Recalde, Llankaray Angulo M and Sol Ábrete.\nHair: Eugenia Grigorevskaia.']
      }
    },
    'kabuki-y-ramirez-de-negro-y-designers': {
      title: 'kabuki & ramírez',
      text: {
        es: ['Key Artist: Jazmin Calcarami - Team make up: Sol Lemonni, Sofia Torres Busquets, Nicole Nielsen, Valentina Recalde y Llankaray Angulo M.'],
        en: ['Key Artist: Jazmin Calcarami - Team make up: Sol Lemonni, Sofia Torres Busquets, Nicole Nielsen, Valentina Recalde and Llankaray Angulo M.']
      }
    },
    'indio-solari': {
      title: 'doctor indio solari', year: 2026,
      text: {
        es: ['Fotografía institucional para la Universidad de Buenos Aires. Entrega del Doctor Honoris Causa al Indio Solari por su aporte a la cultura. Facultad de Medicina, Buenos Aires. Concierto sinfónico íntimo con la participación de Gaspar Benegas.'],
        en: ['Institutional photography for the University of Buenos Aires. Honorary Doctorate awarded to Indio Solari for his contribution to culture. Faculty of Medicine, Buenos Aires. Intimate symphonic concert featuring Gaspar Benegas.']
      }
    },
    'mile-quince-anos': {
      title: 'mile', year: 2022,
      text: { es: ['Fotografía de quince años. Azul, Provincia de Buenos Aires.'], en: ['Fifteenth birthday photography. Azul, Buenos Aires Province.'] }
    },
    'jua-y-gusi': {
      title: 'jua & gusi', year: 2025,
      text: { es: ['Fotografía y edición. Casamiento de Juana & Agustín en Diciembre de 2025. Registro fotográfico de los preparativos y la fiesta.'], en: ['Photography and editing. Wedding of Juana & Agustín in December 2025. Photographic record of preparation and celebration.'] }
    },
    'bafweek': {
      title: 'bafweek', year: 2026,
      text: { es: ['Backstage del desfile de Las Pepas en BAFWeek.'], en: ['Backstage at Las Pepas fashion show at BAFWeek.'] }
    },

    // MARCAS
    'clabakery': {
      title: 'clabakery', year: 2024,
      text: { es: ['Dirección creativa, edición y fotografía. Clabakery, emprendimiento de pastelería artesanal creado por Clara Zubiri. Buenos Aires, Azul.'], en: ['Creative direction, editing, and photography. Clabakery, artisan bakery venture created by Clara Zubiri. Buenos Aires, Azul.'] }
    },
    'parlle': {
      title: 'parlle', year: 2024,
      text: { es: ['Fotografía y edición. Parlle, marca de indumentaria argentina diseñada por Pilar Arroquy y Pilar Campagnolle.'], en: ['Photography and editing. Parlle, Argentine clothing brand designed by Pilar Arroquy and Pilar Campagnolle.'] }
    },
    'maria-t': {
      title: 'maria t', year: 2023,
      text: { es: ['Dirección creativa, edición y fotografía. Editorial y fotoproducto.'], en: ['Creative direction, editing, and photography. Editorial and product photography.'] }
    },
    'finvoi': {
      title: 'finvoi', year: 2025,
      text: { es: ['Cobertura fotográfica del evento de presentación de la app de financiamiento para empresas Finvoi.'], en: ['Photographic coverage of the launch event for the business financing app Finvoi.'] }
    },
    'astrea': {
      title: 'astrea', year: 2025,
      text: { es: ['Fotografía y edición para Astrea, artista de tango venezolana radicada en Buenos Aires. Proyecto musical inspirado en el tango porteño.'], en: ['Photography and editing for Astrea, Venezuelan tango artist based in Buenos Aires. Musical project inspired by tango.'] }
    },
    'ozone': {
      title: 'ozone',
      text: { es: ['Dirección creativa, edición y fotografía. Fotoproducto para e-commerce. Ozone es una marca de cosmética especializada en la realización de protectores solares físicos ecológicos y orgánicos hechos en Argentina.'], en: ['Creative direction, editing, and photography. E-commerce product photography. Ozone is an eco-friendly organic sunscreen brand made in Argentina.'] }
    },
    'penoucos': {
      title: 'penoucos', year: 2024,
      text: { es: ['Fotografía para el artista Gonzalo Penoucos.'], en: ['Photography for the artist Gonzalo Penoucos.'] }
    },

    // DIARIOS DE VIAJES
    'brasil': { title: 'boipeba, brasil', year: 2020 },
    'chile': { title: 'chile', year: 2025 },
    'el-faro': { title: 'el faro, mar azul', year: 2024 },
    'ir-al-norte': {
      title: 'ir al norte', year: 2026,
      text: { es: ['Registro fotográfico del Norte Argentino y Bolivia.'], en: ['Photographic record of Northern Argentina and Bolivia.'] }
    },
    'las-vegas': {
      title: 'las vegas', year: 2022,
      text: { es: ['Las Vegas, Febrero de 2022.'], en: ['Las Vegas, February 2022.'] }
    },
    'mar-azul': { title: 'los dueños de la orilla', year: 2024 },
    'mar-del-plata-25': {
      title: 'mar del plata \'25', year: 2025,
      text: { es: ['Parque San Martín en primavera. Mar del Plata.'], en: ['Parque San Martín in spring. Mar del Plata.'] }
    },
    'nyc': { title: 'nueva york (bn)', year: 2022 },
    'nyc-en-color': { title: 'nueva york', year: 2022 },

    // PERSONAS
    'brujerias': {
      title: 'brujerías', year: 2024,
      text: { es: ['Fotografía y dirección creativa. Ella: Sofía Saiti.'], en: ['Photography and creative direction. Model: Sofía Saiti.'] }
    },
    'delfo': {
      title: 'delfo', year: 2022,
      text: { es: ['Ella: Delfina Ferro. Azul.'], en: ['Model: Delfina Ferro. Azul.'] }
    },
    'dolor-de-utero': {
      title: 'dolor de útero', year: 2020,
      text: { es: ['Proyecto fotográfico universitario realizado en la pandemia. Azul.'], en: ['University photography project created during the pandemic. Azul.'] }
    },
    'rica-x-rica': {
      title: 'rica x rica',
      text: { es: ['Fotografía y video. Trabajo práctico universitario de Iluminación y Cámara II. Rica es una artista, performer no binarie suiza que reside en Argentina y forma parte de la escena Ballroom.'], en: ['Photography and video. University assignment. Rica is a Swiss non-binary performer living in Argentina and active in the Ballroom scene.'] }
    },
    'vera-en-la-playa': {
      title: 'vera y el mar', year: 2019,
      text: { es: ['Febrero de 2019.'], en: ['February 2019.'] }
    },
    'las-cosas-que-perdimos-en-el-fuego': {
      title: 'las cosas que perdimos en el fuego', year: 2021,
      text: { es: ['Proyecto universitario de Iluminación y Cámara I. Ella: Inés Carús. Azul.'], en: ['University assignment for Lighting & Camera I. Model: Inés Carús. Azul.'] }
    },

    // CALLE
    'nunca-llegamos-al-congreso': {
      title: 'nunca llegamos al congreso', year: 2026,
      text: {
        es: [
          'Registro audiovisual y fotográfico independiente.',
          'Video: punto de vista de escapatoria de la represión policial. Fotografías: registro de los rostros irritados por los gases de la policía.',
          'El 6 de agosto de 2026 se realizó una masiva marcha frente al Congreso Nacional en Buenos Aires y otras ciudades en rechazo a la reforma de la Ley de Tierras. Sindicatos, organizaciones sociales y políticas se autoconvocaron bajo la consigna «A la patria no se vende».',
        ],
        en: [
          'Independent audiovisual and photographic record.',
          'Video: point of view of escaping police repression. Photographs: faces irritated by tear gas.',
          'On August 6, 2026, a massive march took place in front of the National Congress in Buenos Aires rejecting the Land Law reform.',
        ],
      },
    },
    'ley-de-glaciares': {
      title: 'ley de glaciares',
      text: {
        es: ['Cobertura audiovisual independiente de la Marcha en defensa de los glaciares. Las marchas por la Ley de Glaciares en Argentina se realizan en rechazo a los proyectos de reforma impulsados por el Gobierno nacional para flexibilizar la protección de los ambientes glaciales y periglaciales. Diversas organizaciones ambientalistas, sociales y políticas se manifiestan bajo la consigna «La Ley de Glaciares no se toca» para defender las reservas estratégicas de agua del país.'],
        en: ['Independent audiovisual coverage of the Glacier Protection March in Argentina.']
      }
    },
    'lara-breda-y-morena': {
      title: 'lara & brenda & morena', year: 2025,
      text: { es: ['Cobertura audiovisual independiente de la Marcha en pedido de justicia por el triple femicidio de Florencio Varela. El colectivo Ni Una Menos y los familiares de las víctimas organizaron la marcha federal el sábado 27 de septiembre de 2025.'], en: ['Independent audiovisual coverage of the March demanding justice for the Florencio Varela femicides.'] }
    },
    'orgullo-25': {
      title: 'marcha del orgullo \'25', year: 2025,
      text: { es: ['Cobertura audiovisual independiente para archivo personal de la Marcha del Orgullo en Buenos Aires.'], en: ['Independent audiovisual coverage of the Pride March in Buenos Aires.'] }
    },
    'hokori': {
      title: 'hokori', year: 2024,
      text: { es: ['Cobertura fotográfica y audiovisual para la revista digital Hokori. Buenos Aires.'], en: ['Photographic and audiovisual coverage for digital magazine Hokori. Buenos Aires.'] }
    },
    '8m': {
      title: '8m', year: 2026,
      text: { es: ['Cobertura fotográfica del 8 de Marzo, Día Internacional de la Mujer. Buenos Aires.'], en: ['Photographic coverage of March 8, International Women\'s Day. Buenos Aires.'] }
    },
  };

  /* ==========================================================================
     INICIO — slider a pantalla completa
     ========================================================================== */
  const WELCOME_POSITION = {
    '06_uyuni.mp4': 1,
  };

  /* ==========================================================================
     FOTOS DESTACADAS
     ========================================================================== */
  const FEATURED = {
    'proyectos/sociales': [
      '16jua&gusi_imprimir01-142.jpg',
      '02_Prensa_Web.jpg',
      'BAFWEEK_PAZ COLOTTO-1.jpg',
    ],
  };

  /* ==========================================================================
     ORDEN FIJO DE GRILLAS (GRID_ORDER)
     ========================================================================== */
  const GRID_ORDER = {  // se exporta en CONFIG.GRID_ORDER (lo lee app.js)
    'proyectos/sociales': [
      'BAFWEEK_PAZ COLOTTO-1.jpg',              // Fila 1 – bafweek
      '16jua&gusi_imprimir01-142.jpg',          // Fila 1 – jua&gusi
      '02_Prensa_Web.jpg',                      // Fila 1 – lisandro alonso
      'BAFWEEK_PAZ COLOTTO34.jpg',              // Fila 2 – bafweek
      'KABUKI&BENITEZ_BS x Paz Colotto15.jpg',  // Fila 2 – kabuki benitez
      '7.jpg',                                  // Fila 2 – indio solari
      'KABUKI&BENITEZ_BS x Paz Colotto43.jpg',  // Fila 3 – kabuki benitez
      'FICUBA LAB-13.jpg',                      // Fila 3 – ficuba lab
      '1.jpg',                                  // Fila 3 – indio solari
    ],
    'proyectos/marcas': [
      'astrea_1.jpg',        // Fila 1 – astrea
      'GOLDEN C.jpg',        // Fila 1 – maria-t
      'LUXTAN 2.jpg',        // Fila 1 – maria-t
      'EQUILIBRIUM.jpg',     // Fila 2 – maria-t
      'clabakery5.jpg',      // Fila 2 – clabakery
      'clabakery6.jpg',      // Fila 2 – clabakery
      '01.jpg',              // Fila 3 – parlle
      'penoucos2.jpg',       // Fila 3 – penoucos
      'FINVOI-22.jpg',       // Fila 3 – finvoi
    ],
  };
  CONFIG.GRID_ORDER = GRID_ORDER;

  /* ==========================================================================
     VIDEOS Y CRÉDITOS
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
      synopsis: { es: 'Registro en el norte argentino, noche de pizzas.', en: 'A record from northern Argentina, pizza night.' },
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
        en: 'Soy Paz is a self-portrait in the form of a question. One minute to explore the contradiction of being named Paz without fully feeling it.',
      },
      credits: [['fullProduction', 'Paz Colotto']],
      link: { type: 'vimeo', id: '1064066737' },
    },
  };

  const EXTRA_VIDEOS = [
    {
      slug: 'uyuni-ya-nos-vamos',
      title: 'uyuni — ya nos vamos?',
      fromWelcome: '06_uyuni.mp4',
      link: { type: 'vimeo', id: '1235230921' },
    },
    {
      slug: 'nunca-llegamos-al-congreso-video',
      title: 'Nunca llegamos al congreso',
      fromProject: { slug: 'nunca-llegamos-al-congreso', itemIndex: 12 },  // ítem 13 (013-loop.mp4): el video; los anteriores son fotos
      link: { type: 'youtube', id: 'qjmaJtuulK8' },
    },
    {
      slug: 'ley-de-glaciares-video',
      title: 'Ley de glaciares',
      fromProject: { slug: 'ley-de-glaciares', itemIndex: 0 },
      link: { type: 'vimeo', id: '1235180479' },
    },
  ];

  const LONG_VIDEO_LINKS = {
    'pcine-colotto-paz-presentes-2025': { type: 'vimeo', id: '1235180055' },
    'ley-de-glaciares': { type: 'vimeo', id: '1235180479' },
    'nunca-llegamos-al-congreso-01': { type: 'youtube', id: 'qjmaJtuulK8' },
  };

  const writings = [];

  /* ==========================================================================
     SOBRE MÍ
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
      instagram: 'pazcolotto',
      location: { es: 'Buenos Aires, Argentina', en: 'Buenos Aires, Argentina' },
    },
  };

  /* ---- Armado final -------------------------------------------------------- */

  const projects = CONTENT.projects.map((p) => {
    const meta = PROJECT_META[p.slug] || {};
    const items = p.items.map((it) => (it.long ? { ...it, link: LONG_VIDEO_LINKS[it.key] || null } : it));
    return { ...p, ...meta, items, title: meta.title || p.title, credits: meta.credits || [], year: meta.year || null };
  });

  const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const covers = Object.fromEntries(Object.entries(CONTENT.covers).map(([key, list]) => [key, list.map((c) => ({ ...c }))]));

  Object.entries(FEATURED).forEach(([key, files]) => {
    files.forEach((file, order) => {
      const cover = (covers[key] || []).find((c) => c.file === file);
      if (!cover) return;
      cover.featured = order + 1;
      const p = projectBySlug[cover.project];
      const from = cover.index;
      if (!p || from === 0) return;
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
    if (extra.fromWelcome) {
      const source = CONTENT.welcome.find((w) => w.file === extra.fromWelcome && w.type === 'video');
      if (source) videos.push({ src: source.src, poster: source.poster, w: source.w, h: source.h, credits: [], year: null, ...extra });
    } else if (extra.fromProject) {
      const proj = projects.find((p) => p.slug === extra.fromProject.slug);
      if (proj) {
        const item = proj.items[extra.fromProject.itemIndex] || proj.items[0];
        if (item) videos.push({ src: item.src, poster: item.poster || item.src, w: item.w || 1920, h: item.h || 1080, credits: [], year: null, ...extra });
      }
    }
  });

  const orderMap = new Map(CONFIG.VIDEO_ORDER.map((slug, i) => [slug, i]));
  videos.sort((a, b) => {
    const ai = orderMap.has(a.slug) ? orderMap.get(a.slug) : CONFIG.VIDEO_ORDER.length + 1000;
    const bi = orderMap.has(b.slug) ? orderMap.get(b.slug) : CONFIG.VIDEO_ORDER.length + 1000;
    return ai - bi;
  });

  about.portrait = CONTENT.portrait || null;

  const welcome = CONTENT.welcome.slice();
  Object.entries(WELCOME_POSITION).forEach(([file, position]) => {
    const from = welcome.findIndex((w) => w.file === file);
    if (from >= 0) {
      const [item] = welcome.splice(from, 1);
      welcome.splice(Math.max(0, position - 1), 0, item);
    }
  });

  window.SITE_DATA = { CONFIG, welcome, projects, covers, videos, writings, about };
})();
