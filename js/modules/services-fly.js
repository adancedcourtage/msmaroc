// ===== Services : arrivée en vol 3D =====
// Les cartes fusent depuis la profondeur (axe Z) et se rangent en grille au fil
// du scroll (scrubbing), avec un décalage par carte (stagger) et une légère
// rotation. Une fois posées, on relâche le transform pour laisser la main au
// tilt/hover. Neutralisé en reduced-motion (cartes simplement visibles).

import { addScene } from './scrub.js';
import { qsa, prefersReducedMotion } from './utils.js';

export function initServicesFly() {
  flyGrid('.services-grid', '.service-card', { z: 620, ty: 90, rx: 14, stagger: 0.05 });
  flyGrid('.mini-grid', '.mini-card', { z: 420, ty: 60, rx: 10, stagger: 0.07 });
}

function flyGrid(gridSel, cardSel, opt) {
  const grid = document.querySelector(gridSel);
  if (!grid) return;
  const cards = qsa(cardSel, grid);
  if (!cards.length) return;

  // La révélation « fade » d'origine est remplacée par le vol 3D.
  cards.forEach((c) => c.classList.remove('reveal', 'visible'));

  const reduce = prefersReducedMotion();
  if (reduce) {
    cards.forEach((c) => { c.style.opacity = ''; c.style.transform = ''; });
    return;
  }

  // État initial : cartes au loin, invisibles (évite tout flash).
  cards.forEach((c) => { c.style.opacity = '0'; c.style.willChange = 'transform, opacity'; });

  addScene(grid, (p) => {
    const span = 1 + opt.stagger * (cards.length - 1); // pour que la dernière atteigne 1
    cards.forEach((card, i) => {
      let local = (p * span - i * opt.stagger);
      local = local < 0 ? 0 : local > 1 ? 1 : local;
      if (local >= 0.999) {
        // Posée : on rend la main au tilt/idle.
        if (card.style.transform !== '') { card.style.transform = ''; card.style.opacity = ''; card.style.willChange = 'auto'; }
        return;
      }
      const e = 1 - Math.pow(1 - local, 3); // easeOutCubic
      const z = (1 - e) * -opt.z;
      const ty = (1 - e) * opt.ty;
      const rx = (1 - e) * opt.rx;
      card.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateX(' + rx.toFixed(2) + 'deg)';
      card.style.opacity = e.toFixed(3);
    });
  }, { start: 0.95, end: 0.35, smooth: 0.14 });
}
