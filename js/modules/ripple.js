// ===== Effet ripple (onde au clic) =====
// Générique, activé par l'attribut data-ripple. Au pointerdown, une onde part
// du point de contact (scale + opacity, transform/opacity uniquement).
// Le conteneur reçoit position:relative + overflow:hidden via .has-ripple.

import { qsa, prefersReducedMotion } from './utils.js';

export function initRipple() {
  if (prefersReducedMotion()) return; // décoratif : coupé en reduced-motion
  const targets = qsa('[data-ripple]');
  targets.forEach((el) => {
    el.classList.add('has-ripple');
    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - rect.left - size / 2) + 'px';
      span.style.top = (e.clientY - rect.top - size / 2) + 'px';
      el.appendChild(span);
      span.addEventListener('animationend', () => span.remove(), { once: true });
    });
  });
}
