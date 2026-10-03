// ===== Parallaxe GSAP sur les images marquées [data-gsap-parallax] =====
// Complète img-parallax.js (moteur maison scrub.js, réservé aux images des
// cartes services) pour les images hors cartes : utilise directement GSAP
// ScrollTrigger en scrub, piloté par le même scroll lissé par Lenis que le
// reste du site (lenis-smooth.js anime window.scrollY, ScrollTrigger le lit
// tel quel — donc "Lenis + GSAP" par construction, pas deux moteurs séparés).

import { qsa, prefersReducedMotion } from './utils.js';
import { loadMotionLibs } from './motion-libs.js';

export async function initGsapParallax() {
  if (prefersReducedMotion()) return;
  const els = qsa('[data-gsap-parallax]');
  if (!els.length) return;

  let libs;
  try {
    libs = await loadMotionLibs();
  } catch (e) {
    return; // CDN indisponible : l'image reste statique, rien de cassé
  }
  const { gsap, ScrollTrigger } = libs;

  els.forEach((el) => {
    const amp = parseFloat(el.dataset.gsapParallax) || 40;
    gsap.set(el, { scale: 1.14 }); // léger sur-cadrage pour ne jamais découvrir les bords pendant le drift
    gsap.fromTo(
      el,
      { y: -amp },
      {
        y: amp,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
      }
    );
  });
}
