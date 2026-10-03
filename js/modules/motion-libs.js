// ===== Chargement paresseux de GSAP + ScrollTrigger + Lenis =====
// Toutes les briques « mdx.so » (smooth scroll, scroll-scrubbing GSAP,
// scène 3D) partagent ce chargeur unique : un seul import réseau, mis en
// cache, jamais bloquant pour le premier rendu (import ESM dynamique via
// esm.sh, même convention que js/modules/spline-scene.js).

let cache = null;

export function loadMotionLibs() {
  if (!cache) {
    cache = Promise.all([
      import('https://esm.sh/gsap@3.12.5'),
      import('https://esm.sh/gsap@3.12.5/ScrollTrigger'),
      import('https://esm.sh/lenis@1.1.14'),
    ]).then(([gsapMod, stMod, lenisMod]) => {
      const gsap = gsapMod.gsap;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger, Lenis: lenisMod.default };
    });
  }
  return cache;
}
