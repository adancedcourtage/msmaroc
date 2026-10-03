// ===== Parallaxe multi-couches sur les images de cartes =====
// L'image de chaque carte dérive verticalement au scroll, à une vitesse
// différente du texte au-dessus (qui, lui, est projeté vers l'avant en translateZ
// sous l'effet du tilt). Résultat : une vraie sensation de profondeur.
// L'image est pilotée par la variable CSS --imgY (composée avec un scale dans le CSS).

import { addScene } from './scrub.js';
import { qsa, prefersReducedMotion } from './utils.js';

const DRIFT = 26; // amplitude en px

export function initImgParallax() {
  if (prefersReducedMotion()) return;
  const wraps = qsa('.service-card .img-wrap');
  wraps.forEach((wrap) => {
    const img = wrap.querySelector('img');
    if (!img) return;
    const card = wrap.closest('.service-card');
    addScene(card || wrap, (p) => {
      // p: 0 quand la carte entre par le bas -> 1 quand elle sort par le haut.
      const y = (0.5 - p) * 2 * DRIFT; // +DRIFT en bas, -DRIFT en haut
      img.style.setProperty('--imgY', y.toFixed(1) + 'px');
    }, { start: 1.1, end: -0.1, smooth: 0.16 });
  });
}
