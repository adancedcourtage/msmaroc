// ===== Effets liés au scroll =====
// UN SEUL listener scroll (passive) sur toute la page. Il ne fait que noter la
// position ; toute écriture DOM passe par la boucle rAF partagée (read -> write),
// et n'est déclenchée que si la position a changé (drapeau `dirty`).

import { subscribe, clamp } from './raf.js';
import { qs, qsa, prefersReducedMotion } from './utils.js';

export function initScroll() {
  const header = qs('header');
  const progress = qs('.scroll-progress');
  // Éléments à micro-parallaxe (LOT 6) : data-parallax = amplitude max en px.
  const parallaxEls = qsa('[data-parallax]');
  const reduce = prefersReducedMotion();

  let scrollY = window.scrollY;
  let dirty = true;

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    dirty = true;
  }, { passive: true });

  window.addEventListener('resize', () => { dirty = true; }, { passive: true });

  subscribe(() => {
    if (!dirty) return;
    dirty = false;

    // 1) Header condensé
    if (header) header.classList.toggle('scrolled', scrollY > 30);

    // 2) Barre de progression de lecture
    if (progress) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? clamp((scrollY / docH) * 100, 0, 100) : 0;
      progress.style.transform = 'scaleX(' + (pct / 100) + ')';
    }

    // 3) Micro-parallaxe (désactivée en reduced-motion)
    if (!reduce && parallaxEls.length) {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const amp = parseFloat(el.dataset.parallax) || 20;
        // Position normalisée de l'élément dans le viewport : -1 (bas) -> 1 (haut).
        const center = rect.top + rect.height / 2;
        const t = clamp((vh / 2 - center) / vh, -1, 1);
        el.style.setProperty('--parallax', (t * amp).toFixed(2) + 'px');
      });
    }
  });
}
