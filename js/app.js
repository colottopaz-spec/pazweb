/* ==========================================================================
   Paz Colotto — app
   Router por hash, slider a pantalla completa, muros de portadas, vista de
   proyecto (fotos y videos), reproductor de video, escritos e idioma ES / EN.
   JavaScript vanilla, sin dependencias.
   ========================================================================== */
(function () {
  'use strict';

  const { CONFIG, welcome, projects, covers, videos, writings, about } = window.SITE_DATA;
  const UI = window.UI_STRINGS;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Secciones y sus subcategorías
  const SECTIONS = {
    inicio: [],
    diario: ['viajes', 'personas'],
    proyectos: ['sociales', 'marcas'],
    calle: [],
    video: [],
    escritos: [],
    'sobre-mi': [],
  };

  const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

  const state = {
    lang: readLang(),
    route: null,
    slide: 0,
    cols: 0,
    lb: { project: null, items: [], index: 0 },
    video: null,
    writing: null,
  };

  /* ---- Utilidades ---------------------------------------------------------- */

  function readLang() {
    try {
      const saved = localStorage.getItem('pc-lang');
      if (saved === 'es' || saved === 'en') return saved;
    } catch (e) { /* sin almacenamiento */ }
    return 'es';
  }
  function saveLang(lang) {
    try { localStorage.setItem('pc-lang', lang); } catch (e) { /* sin almacenamiento */ }
  }

  const t = (key) => (UI[state.lang] && UI[state.lang][key]) || UI.es[key] || key;
  const L = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? (value[state.lang] ?? value.es) : value ?? '');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  function markLoaded(root) {
    $$('.card-media img', root).forEach((img) => {
      const done = () => img.classList.add('is-loaded');
      if (img.complete && img.naturalWidth) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
    // Los videos muestran su póster desde el principio
    $$('.card-media video', root).forEach((v) => v.classList.add('is-loaded'));
  }

  function play(video, { muted = true } = {}) {
    video.muted = muted;
    const p = video.play();
    if (p) p.catch(() => { if (!video.muted) { video.muted = true; video.play().catch(() => {}); } });
  }

  // Rol de un crédito: clave de i18n ('director') o texto propio ({ es, en })
  const roleLabel = (role) => (typeof role === 'string' ? t('role.' + role) : L(role));

  // Créditos en una sola línea: Nombre • Cliente X • Dirección Y • Año
  function creditLine(name, entries, year, titleId) {
    const parts = [`<span class="cr-name"${titleId ? ` id="${titleId}"` : ''}>${esc(name)}</span>`];
    entries.forEach(([role, value]) => {
      parts.push(role
        ? `<span class="cr"><span class="cr-k">${esc(roleLabel(role))}</span> ${esc(L(value))}</span>`
        : `<span class="cr">${esc(L(value))}</span>`);
    });
    if (year) parts.push(`<span class="cr">${esc(year)}</span>`);
    return parts.join('<span class="cr-sep" aria-hidden="true">•</span>');
  }

  // Reproductor de Vimeo / YouTube
  function embedHTML(link, title) {
    const id = encodeURIComponent(link.id);
    if (link.type === 'youtube') {
      return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${esc(title)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }
    return `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1" title="${esc(title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  /* ---- Router -------------------------------------------------------------- */

  function parseHash() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    let [section, sub] = parts;
    if (!section || !(section in SECTIONS)) section = 'inicio';
    if (!sub || !SECTIONS[section].includes(sub)) sub = null;
    return { section, sub };
  }

  const isWall = (section) => section === 'diario' || section === 'proyectos' || section === 'calle';

  function render({ instant = false, keepScroll = false } = {}) {
    const route = parseHash();
    const prev = state.route;
    state.route = route;

    document.body.classList.toggle('is-home', route.section === 'inicio');
    updateNav(route);
    updateTitle(route);

    const view = $('#view');

    // Mismo apartado, otra subcategoría (elegida en la barra) → solo se actualiza el muro
    if (!instant && prev && prev.section === route.section && SECTIONS[route.section].length) {
      swap($('#grid', view), wallHTML(route), () => {
        markLoaded(view);
        setupPreviews(view);
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      return;
    }

    if (prev && prev.section === 'inicio') stopWelcome();

    const html = VIEWS[route.section](route);
    swap(view, html, () => {
      markLoaded(view);
      setupPreviews(view);
      if (route.section === 'inicio') startWelcome(view);
      if (!keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });
    }, instant || !prev);
  }

  // Fundido entre vistas
  function swap(el, html, after, instant) {
    if (!el) return;
    if (instant || reduceMotion.matches) {
      el.innerHTML = html;
      after && after();
      return;
    }
    el.classList.add('is-out');
    setTimeout(() => {
      el.innerHTML = html;
      after && after();
      requestAnimationFrame(() => el.classList.remove('is-out'));
    }, 220);
  }

  function updateNav({ section, sub }) {
    $$('[data-nav]').forEach((a) => {
      const active = a.dataset.nav === section && section !== 'inicio';
      active ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    $$('[data-nav-sub]').forEach((a) => {
      const active = a.dataset.navSub === `${section}/${sub}`;
      active ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    $$('.nav-group').forEach((g) => g.classList.toggle('is-active', g.dataset.group === section));
  }

  function updateTitle({ section, sub }) {
    document.title = section === 'inicio'
      ? `Paz Colotto — ${t('tagline')}`
      : `${t('nav.' + section)}${sub ? ' / ' + t('nav.' + sub) : ''} — Paz Colotto`;
  }

  /* ---- Vistas -------------------------------------------------------------- */

  const VIEWS = {
    inicio: viewWelcome,
    diario: viewWall,
    proyectos: viewWall,
    calle: viewWall,
    video: viewVideo,
    escritos: viewWritings,
    'sobre-mi': viewAbout,
  };

  // Título solo para lectores de pantalla: la navegación ya nombra la sección
  const srTitle = (text) => `<h1 class="sr-only">${esc(text)}</h1>`;

  /* Welcome: slider a pantalla completa (orden de "01_Paz Colotto") ---------- */

  function viewWelcome() {
    return `
      <section class="welcome" aria-roledescription="carousel" aria-label="${esc(t('welcome.label'))}">
        ${srTitle(`Paz Colotto — ${t('tagline')}`)}
        ${welcome.map((item, i) => `
          <div class="w-slide" data-slide="${i}" aria-hidden="true">
            ${item.type === 'video'
              ? `<video muted loop playsinline preload="none" poster="${esc(item.poster)}" data-src="${esc(item.src)}"></video>`
              : `<img data-src="${esc(item.src)}" alt="" decoding="async">`}
          </div>`).join('')}
        <button type="button" class="w-hit" data-welcome-next aria-label="${esc(t('welcome.hint'))}"></button>
        <p class="sr-only" id="w-status" aria-live="polite"></p>
      </section>`;
  }

  function loadSlide(el, eager) {
    const m = el.firstElementChild;
    if (m.dataset.src && !m.getAttribute('src')) {
      if (m.tagName === 'VIDEO') {
        m.muted = true;
        m.preload = eager ? 'auto' : 'metadata';
      }
      m.src = m.dataset.src;
    }
    return m;
  }

  function showWelcome(i) {
    const slides = $$('.w-slide');
    if (!slides.length) return;
    const n = slides.length;
    state.slide = (i + n) % n;
    slides.forEach((el, k) => {
      const active = k === state.slide;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-hidden', String(!active));
      const m = el.firstElementChild;
      if (active) {
        loadSlide(el, true);
        if (m.tagName === 'VIDEO') { m.currentTime = 0; play(m); }
      } else if (m.tagName === 'VIDEO') {
        m.pause();
      }
    });
    // Precarga la pieza siguiente
    loadSlide(slides[(state.slide + 1) % n], false);
    $('#w-status').textContent = `${t('piece')} ${state.slide + 1} / ${n}`;
  }

  function startWelcome(root) {
    const el = $('.welcome', root);
    if (!el) return;
    showWelcome(state.slide);
    // Swipe táctil
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 45) { e.preventDefault(); showWelcome(state.slide + (dx < 0 ? 1 : -1)); }
    });
  }

  function stopWelcome() {
    $$('.w-slide video').forEach((v) => v.pause());
  }

  /* Muros de portadas (diario, proyectos, calle) ----------------------------- */

  // El filtrado se controla solo desde la barra de navegación (#/proyectos/marcas, …)
  function viewWall(route) {
    return `
      <section>
        ${srTitle(t('nav.' + route.section) + (route.sub ? ' / ' + t('nav.' + route.sub) : ''))}
        <div id="grid">${wallHTML(route)}</div>
      </section>`;
  }

  // Portadas de la ruta: una subcategoría, o todas las de la sección mezcladas
  function coversFor({ section, sub }) {
    if (sub) return covers[`${section}/${sub}`] || [];
    const subs = SECTIONS[section];
    if (!subs.length) return covers[section] || [];
    return subs.flatMap((s) => covers[`${section}/${s}`] || []);
  }

  function columnsFor(width) {
    return width < 480 ? 1 : width < 900 ? 2 : width < 1500 ? 3 : 4;
  }

  // Muro con orden fijo posicional (fila por fila, izquierda a derecha).
  // Cada elemento de la lista se coloca en la columna que le corresponde
  // según su posición: pos 0 → col 0, pos 1 → col 1, ... pos N-1 → col N-1,
  // pos N → col 0 (siguiente fila), etc.
  function layoutFixed(list, cols) {
    const GAP = 0.06;
    const columns = Array.from({ length: cols }, () => []);
    const heights = Array(cols).fill(0);
    list.forEach((c, i) => {
      const k = i % cols;
      const top = heights[k];
      const h = c.h / c.w;
      columns[k].push({ c, top, bottom: top + h });
      heights[k] = top + h + GAP;
    });
    return columns;
  }

  // Generador pseudoaleatorio con semilla: el orden es variado pero estable
  function seeded(text) {
    let h = 2166136261;
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  // Muro variado tipo masonry: cada portada va a la columna más corta, y para
  // ese lugar se elige el proyecto con menor "costo":
  //   - tocarse con una portada del mismo proyecto (arriba o en la columna
  //     de al lado): casi prohibido
  //   - repetirse en la misma franja horizontal (otra columna): leve
  //   - tener muchas portadas pendientes: resta, para que no se amontonen al final
  // Dentro de cada proyecto se respeta el orden de la carpeta "portada(s)".
  function layoutWall(list, seedKey, cols) {
    const groups = new Map();
    list.forEach((c) => {
      if (!groups.has(c.project)) groups.set(c.project, []);
      groups.get(c.project).push({ ...c });
    });
    const rnd = seeded(seedKey);
    const GAP = 0.06;                                   // separación, en anchos de columna
    const NEAR = 0.35;                                  // margen alrededor para considerar "cerca"
    const columns = Array.from({ length: cols }, () => []);
    const heights = Array(cols).fill(0);

    const place = (c, k) => {
      const top = heights[k];
      const h = c.h / c.w;
      columns[k].push({ c, top, bottom: top + h });
      heights[k] = top + h + GAP;
    };

    // Destacadas (FEATURED en js/data.js): primeras, de izquierda a derecha
    const featured = list.filter((c) => c.featured).sort((a, b) => a.featured - b.featured);
    featured.forEach((f) => {
      const g = groups.get(f.project);
      g.splice(g.findIndex((c) => c.src === f.src), 1);
      place(f, heights.indexOf(Math.min(...heights)));
    });

    for (let placed = featured.length; placed < list.length; placed++) {
      const k = heights.indexOf(Math.min(...heights));
      const top = heights[k];
      const open = [...groups].filter(([, g]) => g.length);
      const maxLeft = Math.max(...open.map(([, g]) => g.length));
      const cost = (project, g) => {
        const h = g[0].h / g[0].w;
        let touch = 0;
        let row = 0;
        const above = columns[k][columns[k].length - 1];
        if (above && above.c.project === project) touch++;
        columns.forEach((col, j) => {
          if (j === k) return;
          col.forEach((e) => {
            if (e.c.project !== project || e.top >= top + h + NEAR || e.bottom + NEAR <= top) return;
            if (Math.abs(j - k) === 1) touch++;
            else row++;
          });
        });
        return touch * 10 + row * 0.4 - 0.9 * (g.length / maxLeft) + rnd() * 0.15;
      };
      let best = null;
      open.forEach(([project, g]) => {
        const score = cost(project, g);
        if (!best || score < best.score) best = { g, score };
      });
      place(best.g.shift(), k);
    }
    return columns;
  }

  function wallHTML(route) {
    const sectionKey = route.section + '/' + (route.sub || '');
    let list = coversFor(route);
    if (!list.length) return `<p class="muted">${esc(t('empty'))}</p>`;
    const cols = columnsFor(window.innerWidth);
    state.cols = cols;

    // Si hay GRID_ORDER para esta sección, ordenar la lista según ese orden
    const gridOrder = (CONFIG.GRID_ORDER || {})[sectionKey];
    let columns;
    if (gridOrder && gridOrder.length) {
      // Reordenar la lista según gridOrder (array de nombres de archivo en orden deseado)
      const orderMap = new Map(gridOrder.map((file, i) => [file, i]));
      list = list.slice().sort((a, b) => {
        const ai = orderMap.has(a.file) ? orderMap.get(a.file) : gridOrder.length + 1000;
        const bi = orderMap.has(b.file) ? orderMap.get(b.file) : gridOrder.length + 1000;
        return ai - bi;
      });
      columns = layoutFixed(list, cols);
    } else {
      columns = layoutWall(list, sectionKey, cols);
    }

    // e.top está en anchos de columna: lo que queda arriba carga primero y aparece antes
    return `<div class="wall-grid">${columns.map((col) =>
      `<div class="wall-col">${col.map((e) => coverCard(e.c, e.top)).join('')}</div>`).join('')}</div>`;
  }


  function coverCard(c, top) {
    const p = projectBySlug[c.project];
    const title = L(p.title);
    const media = c.type === 'video'
      ? `<video class="vprev" muted loop playsinline preload="none" poster="${esc(c.poster)}" data-src="${esc(c.src)}" aria-hidden="true" tabindex="-1"></video>`
      : `<img src="${esc(c.src)}" alt="" width="${c.w}" height="${c.h}" loading="${top < 2 ? 'eager' : 'lazy'}" decoding="async">`;
    return `
      <div class="fade-up" style="--d:${Math.round(Math.min(top, 3) * 150)}ms">
        <button type="button" class="card-btn" data-project="${esc(p.slug)}" data-index="${c.index}" aria-label="${esc(t('open.gallery'))}: ${esc(title)}">
          <span class="card-media" style="aspect-ratio:${c.w}/${c.h}">
            ${media}
            ${p.section === 'proyectos' ? `<span class="card-name" aria-hidden="true">${esc(title)}</span>` : ''}
          </span>
        </button>
      </div>`;
  }

  /* Video -------------------------------------------------------------------- */

  function viewVideo() {
    return `
      <section>
        ${srTitle(t('nav.video'))}
        <ul class="vgrid" role="list">
          ${videos.map((v, i) => `
            <li class="vcard fade-up" style="--d:${Math.min(i, 8) * 60}ms">
              <button type="button" class="card-btn" data-video="${esc(v.slug)}" aria-label="${esc(t('open.video'))}: ${esc(L(v.title))}">
                <span class="card-media">
                  <video class="vprev" muted loop playsinline preload="none" poster="${esc(v.poster)}" data-src="${esc(v.src)}" aria-hidden="true" tabindex="-1"></video>
                  <span class="card-name" aria-hidden="true">${esc(L(v.title))}</span>
                </span>
              </button>
            </li>`).join('')}
        </ul>
      </section>`;
  }

  /* Escritos: muro disperso -------------------------------------------------- */

  function viewWritings() {
    return `
      <section>
        ${srTitle(t('nav.escritos'))}
        <ul class="wall" role="list">
          ${writings.map((w, i) => `
            <li class="wall-item fade-up" style="--d:${i * 70}ms">
              <button type="button" class="wall-card" data-writing="${esc(w.slug)}" aria-label="${esc(t('open.writing'))}: ${esc(w.title)}, ${esc(w.date)}">
                <span class="wall-title">${esc(w.title)}</span>
              </button>
            </li>`).join('')}
        </ul>
      </section>`;
  }

  /* Sobre mi ----------------------------------------------------------------- */

  function viewAbout() {
    const c = about.contact;
    return `
      <section>
        ${srTitle(t('nav.sobre-mi'))}
        <div class="about-grid">
          <div class="about-bio fade-up">
            ${L(about.bio).map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>

          <div class="about-side fade-up" style="--d:120ms">
            ${about.portrait ? `
            <span class="card-media about-portrait" style="aspect-ratio:${about.portrait.w}/${about.portrait.h}">
              <img src="${esc(about.portrait.src)}" alt="${esc(t('about.portrait'))}" width="${about.portrait.w}" height="${about.portrait.h}" decoding="async">
            </span>` : ''}
            <div class="about-block about-contact">
              <a class="u-link" href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>
              ${c.instagram ? `<a class="u-link" href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">@${esc(c.instagram)}</a><br>` : ''}
              <span class="muted">${esc(L(c.location))}</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---- Loops de video en grillas ------------------------------------------- */

  let previewObserver = null;

  function setupPreviews(root) {
    if (previewObserver) previewObserver.disconnect();
    const vids = $$('video.vprev', root);
    if (!vids.length) return;

    const start = (v) => {
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      play(v);
    };

    // Con movimiento reducido: solo se reproducen al pasar el mouse / enfocar
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      vids.forEach((v) => {
        const btn = v.closest('.card-btn');
        ['mouseenter', 'focus'].forEach((e) => btn.addEventListener(e, () => start(v)));
        ['mouseleave', 'blur'].forEach((e) => btn.addEventListener(e, () => v.pause()));
      });
      return;
    }

    previewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start(entry.target) : entry.target.pause()));
    }, { threshold: 0.2 });
    vids.forEach((v) => previewObserver.observe(v));
  }

  /* ---- Modales (genérico) -------------------------------------------------- */

  const stack = [];

  function openModal(el, trigger) {
    el._trigger = trigger || document.activeElement;
    el.hidden = false;
    stack.push(el);
    $('#site').inert = true;
    document.documentElement.classList.add('no-scroll');
    $$('video.vprev, .w-slide video').forEach((v) => v.pause());
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    const focusTarget = el.querySelector('[data-close]');
    focusTarget && focusTarget.focus({ preventScroll: true });
  }

  function closeModal(el = stack[stack.length - 1]) {
    const i = stack.indexOf(el);
    if (i < 0) return;
    stack.splice(i, 1);
    el.classList.remove('is-open');
    el.dispatchEvent(new CustomEvent('modal:close'));
    setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, reduceMotion.matches ? 0 : 350);
    if (!stack.length) {
      $('#site').inert = false;
      document.documentElement.classList.remove('no-scroll');
      setupPreviews($('#view'));
    }
    const trigger = el._trigger;
    if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
  }

  function trapFocus(e) {
    const el = stack[stack.length - 1];
    const items = $$('button, [href], iframe, video[controls], [tabindex]:not([tabindex="-1"])', el)
      .filter((n) => !n.closest('[hidden]') && n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---- Vista de proyecto (carrusel de fotos y videos) ---------------------- */

  const lbEl = $('#lightbox');

  function openProject(slug, index, trigger) {
    const p = projectBySlug[slug];
    if (!p || !p.items.length) return;
    state.lb = { project: p, items: p.items, index: 0 };
    $('#lb-text').hidden = true;
    renderLbInfo();
    showSlide(index || 0);
    openModal(lbEl, trigger);
  }

  // Nombre • créditos (si hay) • año (si hay)
  function renderLbInfo() {
    const p = state.lb.project;
    if (!p) return;
    const text = p.text ? L(p.text) : null;
    $('#lb-info').innerHTML = creditLine(L(p.title), p.credits || [], p.year, 'lb-title') +
      (text ? `<span class="cr-sep" aria-hidden="true">•</span><button type="button" class="lb-btn" data-lb-info aria-controls="lb-text" aria-expanded="${!$('#lb-text').hidden}">${esc(t('info'))}</button>` : '');
    $('#lb-text').innerHTML = text ? text.map((par) => `<p>${esc(par)}</p>`).join('') : '';
    if (!text) $('#lb-text').hidden = true;
    updateCounter();
  }

  function toggleLbText(btn) {
    const panel = $('#lb-text');
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', String(!panel.hidden));
  }

  function updateCounter() {
    const { index, items } = state.lb;
    $('#lb-counter').textContent = `${pad(index + 1)} / ${pad(items.length)}`;
  }

  function stopLbMedia() {
    const vid = $('#lb-video');
    vid.pause();
    vid.removeAttribute('src');
    vid.load();
    $('#lb-embed').innerHTML = '';
  }

  function showSlide(i) {
    const lb = state.lb;
    const n = lb.items.length;
    if (!n) return;
    lb.index = (i + n) % n;
    const item = lb.items[lb.index];
    const title = L(lb.project.title);
    const stage = $('#lb-stage');
    const img = $('#lb-img');
    const vid = $('#lb-video');
    const embed = $('#lb-embed');

    stopLbMedia();
    stage.classList.toggle('is-video', item.type === 'video');
    img.hidden = item.type !== 'image';
    vid.hidden = item.type !== 'video' || !!item.link;
    embed.hidden = !(item.type === 'video' && item.link);

    if (item.type === 'image') {
      img.classList.remove('is-loaded');
      img.alt = `${title} — ${t('photo')} ${lb.index + 1} / ${n}`;
      const reveal = () => img.classList.add('is-loaded');
      img.onload = reveal;
      img.onerror = reveal;
      img.src = item.src;
      if (img.complete && img.naturalWidth) reveal();
    } else if (item.link) {
      embed.innerHTML = embedHTML(item.link, title);
    } else {
      // Clip corto: completo, con sonido. Video largo sin link todavía: su loop.
      vid.poster = item.poster;
      vid.loop = !!item.long;
      vid.src = item.src;
      play(vid, { muted: !!item.long });
    }
    updateCounter();
    // Precarga de fotos vecinas
    [lb.index + 1, lb.index - 1].forEach((k) => {
      const next = lb.items[(k + n) % n];
      if (next.type === 'image') new Image().src = next.src;
    });
  }

  lbEl.addEventListener('modal:close', stopLbMedia);

  // Swipe táctil en el carrusel
  (function enableSwipe() {
    const stage = $('#lb-stage');
    let x0 = null;
    let y0 = null;
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        showSlide(state.lb.index + (dx < 0 ? 1 : -1));
      }
      x0 = y0 = null;
    });
  })();

  /* ---- Video modal --------------------------------------------------------- */

  const vbEl = $('#videobox');

  function openVideo(slug, trigger) {
    const v = videos.find((x) => x.slug === slug);
    if (!v) return;
    state.video = v;
    $('#vb-player').innerHTML = v.link
      ? embedHTML(v.link, L(v.title))
      : `<video src="${esc(v.src)}" poster="${esc(v.poster)}" controls autoplay loop muted playsinline></video>`;
    renderVideoInfo();
    openModal(vbEl, trigger);
    $('.vb-scroll', vbEl).scrollTop = 0;
  }

  function renderVideoInfo() {
    const v = state.video;
    if (!v) return;
    // Título • año / sinopsis / créditos corridos en un bloque de texto (sin ficha)
    const crew = (v.credits || []).map(([role, value]) =>
      `<span class="cr"><span class="cr-k">${esc(roleLabel(role))}</span> ${esc(L(value))}</span>`
    ).join('<span class="cr-sep" aria-hidden="true">•</span>');
    $('#vb-info').innerHTML = `
      <p class="credit-line">${creditLine(L(v.title), [], v.year, 'vb-title')}</p>
      ${v.synopsis ? `<p class="vb-synopsis">${esc(L(v.synopsis))}</p>` : ''}
      ${v.awards ? `<p class="vb-awards">${esc(L(v.awards))}</p>` : ''}
      ${crew ? `<p class="credit-line vb-crew">${crew}</p>` : ''}`;
  }

  // Al cerrar se quita el reproductor para cortar el audio
  vbEl.addEventListener('modal:close', () => { $('#vb-player').innerHTML = ''; state.video = null; });

  /* ---- Lector de escritos -------------------------------------------------- */

  const wbEl = $('#writingbox');

  function openWriting(slug, trigger) {
    const w = writings.find((x) => x.slug === slug);
    if (!w) return;
    state.writing = w;
    renderWriting();
    openModal(wbEl, trigger);
    $('#wb-scroll').scrollTop = 0;
  }

  function renderWriting() {
    const w = state.writing;
    if (!w) return;
    $('#wb-content').innerHTML = `
      <h2 id="wb-title" class="wb-title">${esc(w.title)}</h2>
      <p class="muted">${esc(w.date)}</p>
      <div class="wb-body">${L(w.body).map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
  }

  wbEl.addEventListener('modal:close', () => { state.writing = null; });

  /* ---- Idioma -------------------------------------------------------------- */

  function renderLangSwitch() {
    $('#lang-switch').innerHTML = ['es', 'en'].map((l) => {
      const active = l === state.lang;
      return `<button type="button" data-lang="${l}" lang="${l}" aria-pressed="${active}" aria-label="${esc(t('lang.' + l))}">${l.toUpperCase()}</button>`;
    }).join('<span class="lang-sep" aria-hidden="true">/</span>');
  }

  function applyStaticText() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    renderLangSwitch();
    renderFooter();
  }

  function setLang(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    saveLang(lang);
    applyStaticText();
    render({ instant: true, keepScroll: true });
    if (state.lb.project && !lbEl.hidden) renderLbInfo();
    if (state.video) renderVideoInfo();
    if (state.writing) renderWriting();
    const sw = $(`#lang-switch [data-lang="${lang}"]`);
    sw && sw.focus({ preventScroll: true });
  }

  function renderFooter() {
    const c = about.contact;
    $('#year').textContent = new Date().getFullYear();
    $('#footer-links').innerHTML =
      (c.instagram ? `<a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">Instagram</a>` : '') +
      `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`;
  }

  /* ---- Menú móvil ---------------------------------------------------------- */

  const menuBtn = $('#menu-btn');
  const menuEl = $('#mobile-menu');

  function toggleMenu(open = menuEl.hidden) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.dataset.i18n = open ? 'menu.close' : 'menu';
    menuBtn.textContent = t(menuBtn.dataset.i18n);
    document.body.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('no-scroll', open);
    if (open) {
      menuEl.hidden = false;
      requestAnimationFrame(() => menuEl.classList.add('is-open'));
    } else {
      menuEl.classList.remove('is-open');
      setTimeout(() => { if (!menuEl.classList.contains('is-open')) menuEl.hidden = true; }, 300);
    }
  }

  /* ---- Eventos ------------------------------------------------------------- */

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-project], [data-video], [data-writing], [data-close], [data-lang], [data-lb], [data-lb-info], [data-welcome-next], #menu-btn, .skip-link');
    if (!target) return;

    if (target.matches('.skip-link')) { e.preventDefault(); $('#view').focus(); return; }
    if (target.matches('#menu-btn')) { toggleMenu(); return; }
    if (target.hasAttribute('data-lb-info')) { toggleLbText(target); return; }
    if (target.hasAttribute('data-welcome-next')) showWelcome(state.slide + 1);
    else if (target.dataset.project) openProject(target.dataset.project, Number(target.dataset.index) || 0, target);
    else if (target.dataset.video) openVideo(target.dataset.video, target);
    else if (target.dataset.writing) openWriting(target.dataset.writing, target);
    else if (target.hasAttribute('data-close')) closeModal(target.closest('.modal'));
    else if (target.dataset.lang) setLang(target.dataset.lang);
    else if (target.dataset.lb) showSlide(state.lb.index + (target.dataset.lb === 'next' ? 1 : -1));
  });

  document.addEventListener('keydown', (e) => {
    if (stack.length) {
      const top = stack[stack.length - 1];
      if (e.key === 'Escape') { e.preventDefault(); closeModal(top); }
      else if (e.key === 'Tab') trapFocus(e);
      else if (top === lbEl) {
        if (e.key === 'ArrowRight') { e.preventDefault(); showSlide(state.lb.index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); showSlide(state.lb.index - 1); }
      }
      return;
    }
    if (e.key === 'Escape' && !menuEl.hidden) { toggleMenu(false); menuBtn.focus(); return; }
    if (state.route && state.route.section === 'inicio' && menuEl.hidden) {
      if (e.key === 'ArrowRight') { e.preventDefault(); showWelcome(state.slide + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showWelcome(state.slide - 1); }
    }
  });

  window.addEventListener('hashchange', () => {
    if (!menuEl.hidden) toggleMenu(false);
    if (stack.length) stack.slice().forEach((m) => closeModal(m));
    render();
  });

  // Si cambia la cantidad de columnas, se rearma el muro
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.route || !isWall(state.route.section)) return;
      if (columnsFor(window.innerWidth) === state.cols) return;
      const grid = $('#grid');
      grid.innerHTML = wallHTML(state.route);
      markLoaded(grid);
      setupPreviews(grid);
    }, 150);
  });

  const header = $('#site-header');
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 8), { passive: true });

  /* ---- Inicio -------------------------------------------------------------- */

  // Sección "escritos" oculta por ahora (CONFIG.SHOW_WRITINGS en js/data.js):
  // se quitan sus links y la ruta #/escritos lleva al inicio.
  if (!CONFIG.SHOW_WRITINGS) {
    delete SECTIONS.escritos;
    $$('[data-nav="escritos"]').forEach((a) => a.closest('li').remove());
  }

  applyStaticText();
  render({ instant: true });
})();
