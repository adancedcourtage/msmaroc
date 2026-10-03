// ===== Tilt 3D générique =====
// Activé par data-tilt. Le parent reçoit une perspective ; l'élément pivote
// selon la position du pointeur (rotateX/rotateY lissés dans la boucle rAF
// PARTAGÉE — jamais une boucle par carte). Glare radial piloté par --mx/--my.
// data-tilt-max = amplitude en degrés (défaut 4). Neutralisé si pointeur
// grossier ou reduced-motion.

import { subscribe, lerp, clamp } from './raf.js';
import { qsa, isFinePointer, prefersReducedMotion } from './utils.js';

export function initTilt() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  const els = qsa('[data-tilt]');
  if (!els.length) return;

  els.forEach((el) => {
    const max = parseFloat(el.dataset.tiltMax) || 4;
    const scale = parseFloat(el.dataset.tiltScale) || 1;
    const st = { rx: 0, ry: 0, trx: 0, try: 0, mx: 50, my: 50, tmx: 50, tmy: 50, active: false };
    el.classList.add('has-tilt');

    el.addEventListener('pointerenter', () => {
      st.active = true;
      el.style.willChange = 'transform';
      el.classList.add('is-tilting');
    });

    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;    // 0..1
      st.try = clamp((px - 0.5) * 2 * max, -max, max);    // rotateY suit X
      st.trx = clamp((0.5 - py) * 2 * max, -max, max);    // rotateX suit Y
      st.tmx = px * 100;
      st.tmy = py * 100;
    });

    el.addEventListener('pointerleave', () => {
      st.active = false;
      st.trx = 0; st.try = 0;
      el.style.willChange = 'auto';
      el.classList.remove('is-tilting');
      // Retour à l'identité géré par la transition CSS.
    });

    subscribe(() => {
      st.rx = lerp(st.rx, st.trx, 0.12);
      st.ry = lerp(st.ry, st.try, 0.12);
      st.mx = lerp(st.mx, st.tmx, 0.12);
      st.my = lerp(st.my, st.tmy, 0.12);
      if (!st.active && Math.abs(st.rx) < 0.02 && Math.abs(st.ry) < 0.02) {
        el.style.transform = '';
        return;
      }
      const s = st.active ? scale : 1;
      el.style.transform =
        `rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg) scale(${s})`;
      el.style.setProperty('--mx', st.mx.toFixed(1) + '%');
      el.style.setProperty('--my', st.my.toFixed(1) + '%');
    });
  });
}
