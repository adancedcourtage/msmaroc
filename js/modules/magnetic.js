// ===== Boutons magnétiques =====
// Activé par data-magnetic. Dans un rayon donné, le bouton suit légèrement le
// pointeur (transform translate, lissé via lerp dans la boucle rAF partagée),
// et son libellé interne (.mag-label) parallaxe un peu plus fort.
// Retour élastique au pointerleave. Désactivé si pointeur grossier ou reduced-motion.

import { subscribe, lerp, clamp } from './raf.js';
import { qsa, isFinePointer, prefersReducedMotion } from './utils.js';

const RADIUS = 80;      // rayon d'activation autour du centre
const PULL = 0.28;      // fraction du déplacement appliquée au bouton
const MAX = 12;         // déplacement max en px
const LABEL_PULL = 0.14; // parallaxe interne du libellé

export function initMagnetic() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  const els = qsa('[data-magnetic]');
  if (!els.length) return;

  els.forEach((el) => {
    const label = el.querySelector('.mag-label');
    const state = { tx: 0, ty: 0, cx: 0, cy: 0, active: false };

    el.addEventListener('pointerenter', () => { el.style.willChange = 'transform'; });

    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        state.cx = clamp(dx * PULL, -MAX, MAX);
        state.cy = clamp(dy * PULL, -MAX, MAX);
        state.active = true;
      } else {
        state.cx = 0; state.cy = 0;
      }
    });

    el.addEventListener('pointerleave', () => {
      state.cx = 0; state.cy = 0; state.active = false;
      // Retour élastique géré par la transition CSS sur .is-returning.
      el.classList.add('is-returning');
      el.style.willChange = 'auto';
      setTimeout(() => el.classList.remove('is-returning'), 520);
    });

    // Un seul abonnement rAF par bouton, mais tous partagent LA boucle globale.
    subscribe((dt) => {
      // Lissage indépendant du framerate approximé (lerp fixe suffit visuellement).
      state.tx = lerp(state.tx, state.cx, 0.15);
      state.ty = lerp(state.ty, state.cy, 0.15);
      if (Math.abs(state.tx) < 0.01 && Math.abs(state.ty) < 0.01 && !state.active) {
        el.style.transform = '';
        if (label) label.style.transform = '';
        return;
      }
      el.style.transform = `translate3d(${state.tx.toFixed(2)}px, ${state.ty.toFixed(2)}px, 0)`;
      if (label) {
        label.style.transform =
          `translate3d(${(state.tx * (LABEL_PULL / PULL)).toFixed(2)}px, ${(state.ty * (LABEL_PULL / PULL)).toFixed(2)}px, 0)`;
      }
    });
  });
}
