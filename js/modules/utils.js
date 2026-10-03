// ===== Utilitaires partagés =====

// Sélecteurs courts (guillemets simples, style du projet).
export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Media query réactive : l'utilisateur préfère-t-il les animations réduites ?
// Évaluée à l'appel (elle peut changer en cours de session sur certains OS).
const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => rmQuery.matches;

// Le pointeur est-il fin et précis (souris / trackpad) ? Sinon : tactile.
const fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
export const isFinePointer = () => fineQuery.matches;
export const isTouch = () => !fineQuery.matches;

// Les deux media queries les plus utilisées, exposées pour écouter leurs changements.
export const motionQuery = rmQuery;
export const pointerQuery = fineQuery;

// Anti-rebond classique (resize, saisie, etc.).
export function debounce(fn, wait = 150) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Interpolation lissée réutilisable côté logique (raf.js réexporte lerp/clamp).
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Petit easing d'annonce pour les compteurs et barres.
export const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
