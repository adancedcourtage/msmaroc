// ===== Moteur de scroll-scrubbing =====
// Chaque « scène » enregistre un élément de référence et un callback ; à chaque
// frame (boucle rAF partagée), on calcule une progression 0..1 en fonction de la
// position de l'élément dans le viewport, et on la lisse (inertie) avant d'appeler
// le callback. C'est ce qui rend chaque cran de molette « magique » : le contenu
// se transforme en continu, pas en un seul fondu.
//
// Convention : progress = 0 quand le haut de l'élément est à `start` * vh,
//              progress = 1 quand il atteint `end` * vh (plus haut dans l'écran).

import { subscribe, clamp, lerp } from './raf.js';
import { prefersReducedMotion } from './utils.js';

const scenes = [];
let vh = window.innerHeight;
let started = false;

export function addScene(el, cb, { start = 0.85, end = 0.15, smooth = 0.12, immediate = false, always = false } = {}) {
  if (!el) return;
  scenes.push({ el, cb, start, end, smooth, p: -1, cur: 0, immediate, always });
}

export function initScrub() {
  if (!scenes.length || started) return;
  started = true;

  const reduce = prefersReducedMotion();
  window.addEventListener('resize', () => { vh = window.innerHeight; }, { passive: true });

  if (reduce) {
    // Pas de scrubbing : on place chaque scène à son état final, une fois.
    scenes.forEach((s) => s.cb(1));
    return;
  }

  subscribe(() => {
    for (const s of scenes) {
      // Lecture (rect) puis écriture (cb) — jamais l'inverse.
      const r = s.el.getBoundingClientRect();
      const topFrac = r.top / vh;
      const target = clamp((s.start - topFrac) / (s.start - s.end), 0, 1);
      // Lissage : la progression rattrape la cible avec un peu d'inertie.
      s.cur = s.immediate ? target : lerp(s.cur, target, s.smooth);
      if (s.always || Math.abs(s.cur - s.p) > 0.0005) {
        s.p = s.cur;
        s.cb(s.cur);
      }
    }
  });
}
