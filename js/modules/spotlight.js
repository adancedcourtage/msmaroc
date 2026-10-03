// ===== Spotlight — halo lumineux qui suit la souris dans une carte =====
// Port vanilla de `ibelick/spotlight` (React + framer-motion). Le comportement
// (position du curseur → variables CSS → radial-gradient flouté, visible
// seulement au survol) ne dépend d'aucune lib d'animation : un simple
// `pointermove` + custom properties CSS suffit, avec une transition CSS pour
// le lissage (remplace le spring de framer-motion, coût quasi nul).
//
// Usage : <div class="spline-card" data-spotlight>
//           <div class="spotlight-glow"></div>
//           ...
//         </div>

import { qsa } from './utils.js';

function initOne(card) {
  const glow = card.querySelector('.spotlight-glow');
  if (!glow) return;

  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    glow.style.setProperty('--spot-x', (e.clientX - rect.left) + 'px');
    glow.style.setProperty('--spot-y', (e.clientY - rect.top) + 'px');
  });
  card.addEventListener('pointerenter', () => glow.classList.add('is-active'));
  card.addEventListener('pointerleave', () => glow.classList.remove('is-active'));
}

export function initSpotlight() {
  qsa('[data-spotlight]').forEach(initOne);
}
