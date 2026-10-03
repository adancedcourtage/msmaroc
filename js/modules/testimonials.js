// ===== Carrousel témoignages =====
// Implémentation scroll-snap + pointer (aucune dépendance, budget JS respecté).
// Swipe tactile natif, drag souris, flèches, pastilles, autoplay 6s avec anneau
// de progression, étoiles SVG en cascade, anneau tournant sur l'avatar actif.
// Accessibilité : region/roledescription, inert hors-vue, aria-live.

import { qs, qsa, prefersReducedMotion } from './utils.js';

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 l3 6.5 l7 .6 l-5.3 4.7 l1.6 7 L12 17.5 L5.7 20.8 l1.6 -7 L2 9.1 l7 -.6 Z"/></svg>';

export function initTestimonials() {
  const section = qs('#avis');
  const grid = section ? qs('.testi-grid', section) : null;
  if (!section || !grid) return;

  const cards = qsa('.testi-card', grid);
  if (cards.length < 2) return;

  // --- Restructuration en carrousel ---
  const viewport = document.createElement('div');
  viewport.className = 'testi-viewport';
  grid.classList.add('testi-track');
  grid.parentNode.insertBefore(viewport, grid);
  viewport.appendChild(grid);

  const region = viewport.closest('.wrap') || section;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-roledescription', 'carousel');
  viewport.setAttribute('aria-label', 'Témoignages clients');
  viewport.tabIndex = 0;

  // Remplace les étoiles unicode par des SVG (accessibles).
  cards.forEach((card, i) => {
    const stars = qs('.stars', card);
    if (stars) {
      stars.innerHTML = Array.from({ length: 5 }).map(() => STAR).join('');
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', 'Note : 5 sur 5');
    }
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'diapositive');
    card.setAttribute('aria-label', (i + 1) + ' sur ' + cards.length);
  });

  // --- Contrôles ---
  const controls = document.createElement('div');
  controls.className = 'testi-controls';
  controls.innerHTML =
    '<button class="testi-arrow testi-prev" aria-label="Témoignage précédent">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 l-7 7 l7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<div class="testi-dots" role="tablist" aria-label="Choisir un témoignage"></div>' +
    '<button class="testi-arrow testi-next" aria-label="Témoignage suivant">' +
    '<svg class="testi-progress" viewBox="0 0 44 44" aria-hidden="true"><circle class="track" cx="22" cy="22" r="20"/><circle class="bar" cx="22" cy="22" r="20"/></svg>' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 l7 7 l-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  const head = qs('.section-head', section);
  (head || section.querySelector('.wrap')).appendChild(controls);

  const prev = qs('.testi-prev', controls);
  const next = qs('.testi-next', controls);
  const dotsHost = qs('.testi-dots', controls);
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'testi-dot';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', 'Témoignage ' + (i + 1));
    d.addEventListener('click', () => goTo(i, true));
    dotsHost.appendChild(d);
  });

  // Zone d'annonce lecteur d'écran.
  const live = document.createElement('div');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  section.appendChild(live);

  let current = 0;

  function perView() {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function goTo(i, smooth = true) {
    const max = cards.length - perView();
    current = Math.max(0, Math.min(i, max));
    const card = cards[current];
    grid.scrollTo({ left: card.offsetLeft - grid.offsetLeft, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
    update();
  }

  function update() {
    const pv = perView();
    qsa('.testi-dot', dotsHost).forEach((d, i) => {
      const on = i === current;
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-selected', String(on));
    });
    cards.forEach((card, i) => {
      const visible = i >= current && i < current + pv;
      card.classList.toggle('is-center', i === current);
      card.classList.toggle('is-dim', !visible);
      if (visible) card.removeAttribute('inert');
      else card.setAttribute('inert', '');
    });
    live.textContent = 'Avis ' + (current + 1) + ' sur ' + cards.length;
  }

  prev.addEventListener('click', () => goTo(current - 1, true));
  next.addEventListener('click', () => goTo(current + 1, true));

  // Clavier quand le carrousel a le focus.
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1, true); }
  });

  // Synchronise l'index sur le scroll manuel (swipe natif).
  let scrollT = null;
  grid.addEventListener('scroll', () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      let nearest = 0, best = Infinity;
      cards.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft - grid.offsetLeft - grid.scrollLeft);
        if (d < best) { best = d; nearest = i; }
      });
      current = nearest;
      update();
    }, 90);
  }, { passive: true });

  window.addEventListener('resize', () => update(), { passive: true });

  // --- Étoiles en cascade à l'entrée dans le viewport ---
  if ('IntersectionObserver' in window && !prefersReducedMotion()) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('stars-lit'); so.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    cards.forEach((c) => so.observe(c));
  } else {
    cards.forEach((c) => c.classList.add('stars-lit'));
  }

  // --- Autoplay 6s avec anneau de progression ---
  const AUTOPLAY = 6000;
  let rafId = null, startT = 0, paused = false, inView = true;
  const bar = qs('.testi-progress .bar', controls);
  const circ = bar ? 2 * Math.PI * 20 : 0;
  if (bar) { bar.style.strokeDasharray = circ; bar.style.strokeDashoffset = circ; }

  function tick(now) {
    if (!startT) startT = now;
    if (!paused && inView && !prefersReducedMotion()) {
      const p = (now - startT) / AUTOPLAY;
      if (bar) bar.style.strokeDashoffset = circ * (1 - Math.min(p, 1));
      if (p >= 1) {
        startT = now;
        const max = cards.length - perView();
        goTo(current >= max ? 0 : current + 1, true);
      }
    } else {
      startT = now; // gèle la progression en pause
    }
    rafId = requestAnimationFrame(tick);
  }

  function pause() { paused = true; }
  function resume() { paused = false; startT = 0; }

  ['pointerenter', 'focusin'].forEach((ev) => viewport.addEventListener(ev, pause));
  ['pointerleave', 'focusout'].forEach((ev) => viewport.addEventListener(ev, resume));
  grid.addEventListener('pointerdown', pause);

  if (!prefersReducedMotion()) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
      }, { threshold: 0.2 }).observe(viewport);
    }
    rafId = requestAnimationFrame(tick);
  } else {
    // Pas d'autoplay : on masque l'anneau.
    const svg = qs('.testi-progress', controls);
    if (svg) svg.style.display = 'none';
  }

  update();
}
