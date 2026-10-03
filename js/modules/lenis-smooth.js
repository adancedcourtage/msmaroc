// ===== Smooth scroll global (Lenis) =====
// Lenis anime la position de scroll NATIVE (window.scrollY reste juste) :
// aucun module existant (scroll.js, scrub.js, reveal.js) n'a besoin d'être
// modifié, ils continuent de lire la vraie position de scroll. On branche
// simplement Lenis sur LA boucle rAF partagée (raf.js) au lieu de lui
// laisser démarrer sa propre boucle, et on notifie ScrollTrigger à chaque
// frame pour que ses scrubs restent synchronisés au pixel près.

import { subscribe } from './raf.js';
import { prefersReducedMotion } from './utils.js';
import { loadMotionLibs } from './motion-libs.js';

export async function initLenis() {
  if (prefersReducedMotion()) return null; // scroll natif conservé tel quel

  let libs;
  try {
    libs = await loadMotionLibs();
  } catch (e) {
    return null; // CDN indisponible : scroll natif, rien de cassé
  }
  const { gsap, ScrollTrigger, Lenis } = libs;

  const lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    syncTouch: false, // le tactile garde son inertie native (plus confortable)
  });

  subscribe((_dt, now) => lenis.raf(now));
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

  document.documentElement.classList.add('has-lenis');
  return lenis;
}
