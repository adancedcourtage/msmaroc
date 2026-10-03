// ===== Strip secteurs : marquee infinie draggable =====
// Bandeau de secteurs converti en carrousel : autoplay lent (boucle rAF
// partagée), drag souris + swipe tactile avec inertie, aimantation de la puce
// centrale, et — surtout — clic = filtre des services (window.MS.filterServices).
// En reduced-motion : pas d'autoplay, simple scroll horizontal snap.

import { subscribe, clamp } from './raf.js';
import { qs, prefersReducedMotion } from './utils.js';

// Secteur -> catégorie de service pertinente (transforme le bandeau en navigation).
const SECTORS = [
  { label: 'Restaurants', cat: 'web' },
  { label: 'Hôtels', cat: 'web' },
  { label: 'Cliniques', cat: 'ia' },
  { label: "Cabinets d'avocats", cat: 'ia' },
  { label: 'PME & grands groupes', cat: 'conseil' },
  { label: 'Artisans', cat: 'com' },
  { label: 'Immobilier', cat: 'web' },
  { label: 'BTP', cat: 'infra' },
  { label: 'Associations', cat: 'conseil' },
  { label: 'Santé', cat: 'ia' },
  { label: 'Écoles', cat: 'conseil' },
  { label: 'E-commerce', cat: 'web' },
];

export function initMarquee() {
  const strip = qs('.strip');
  const tagsHost = strip ? qs('.tags', strip) : null;
  if (!strip || !tagsHost) return;

  const reduce = prefersReducedMotion();

  // Construit la piste (dupliquée ×2 pour la boucle infinie).
  tagsHost.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'marquee-track';
  const makeChips = () => SECTORS.map((s) => {
    const b = document.createElement('button');
    b.className = 'sector-chip';
    b.dataset.sector = s.label;
    b.dataset.cat = s.cat;
    b.dataset.ripple = '';
    b.textContent = s.label;
    b.addEventListener('click', () => {
      if (window.MS && window.MS.filterServices) window.MS.filterServices(s.cat, { scroll: true });
    });
    return b;
  });
  makeChips().forEach((c) => track.appendChild(c));
  const copy = document.createElement('div');
  copy.className = 'marquee-track';
  copy.setAttribute('aria-hidden', 'true');
  makeChips().forEach((c) => copy.appendChild(c));

  if (reduce) {
    // Repli accessible : scroll natif, snap, pas d'animation.
    tagsHost.classList.add('marquee-static');
    makeChips().forEach((c) => tagsHost.appendChild(c));
    return;
  }

  const viewport = document.createElement('div');
  viewport.className = 'marquee-viewport';
  viewport.appendChild(track);
  viewport.appendChild(copy);
  tagsHost.appendChild(viewport);

  // --- État de défilement ---
  let x = 0;              // translation courante
  let speed = 0.04;       // px/ms de croisière (~40px/s)
  let targetSpeedMul = 1; // multiplicateur (hover -> 0.25)
  let curSpeedMul = 1;
  let dragging = false;
  let velocity = 0;       // px/frame pour l'inertie
  let lastX = 0;
  let trackWidth = 0;

  const measure = () => { trackWidth = track.scrollWidth; };
  measure();
  window.addEventListener('resize', measure, { passive: true });

  viewport.addEventListener('pointerenter', () => { targetSpeedMul = 0.25; });
  viewport.addEventListener('pointerleave', () => { if (!dragging) targetSpeedMul = 1; });

  viewport.addEventListener('pointerdown', (e) => {
    dragging = true;
    velocity = 0;
    lastX = e.clientX;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('is-grabbing');
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    x += dx;
    velocity = dx;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-grabbing');
    targetSpeedMul = 1;
    snapNearest();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // Aimantation de la puce la plus proche du centre.
  function snapNearest() {
    const center = viewport.getBoundingClientRect().left + viewport.offsetWidth / 2;
    let best = null, bestDist = Infinity;
    qsAll(viewport, '.sector-chip').forEach((chip) => {
      const r = chip.getBoundingClientRect();
      const c = r.left + r.width / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; best = chip; }
    });
    qsAll(viewport, '.sector-chip').forEach((c) => c.classList.remove('is-active'));
    if (best) best.classList.add('is-active');
  }

  subscribe((dt) => {
    curSpeedMul += (targetSpeedMul - curSpeedMul) * 0.08;
    if (dragging) {
      // rien : x piloté par le pointeur
    } else if (Math.abs(velocity) > 0.1) {
      // inertie après relâchement
      x += velocity;
      velocity *= 0.95;
    } else {
      x -= speed * dt * curSpeedMul;
    }
    // Boucle infinie : recale sans saut visible.
    if (trackWidth > 0) {
      if (x <= -trackWidth) x += trackWidth;
      if (x > 0) x -= trackWidth;
    }
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    copy.style.transform = 'translate3d(' + (x + trackWidth).toFixed(2) + 'px,0,0)';
  });
}

function qsAll(ctx, sel) { return Array.from(ctx.querySelectorAll(sel)); }
