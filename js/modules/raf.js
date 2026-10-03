// ===== Boucle requestAnimationFrame partagée =====
// Un SEUL rAF global pour tout le site. Les modules s'abonnent via subscribe()
// et reçoivent un callback à chaque frame. Pattern read -> write recommandé :
// chaque abonné lit d'abord l'état (positions, scroll), puis écrit le DOM,
// afin d'éviter les reflows en cascade (layout thrashing).

const subscribers = new Set();
let rafId = null;
let last = 0;

// Boucle interne : appelle chaque abonné avec (dt, now).
function loop(now) {
  const dt = last ? now - last : 16;
  last = now;
  // Copie défensive : un abonné peut se désabonner pendant l'itération.
  for (const fn of Array.from(subscribers)) {
    try { fn(dt, now); } catch (e) { /* un module ne doit jamais tuer la boucle */ }
  }
  if (subscribers.size > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
    last = 0;
  }
}

// Abonne une fonction à la boucle. Retourne une fonction de désabonnement.
export function subscribe(fn) {
  subscribers.add(fn);
  if (rafId === null) {
    rafId = requestAnimationFrame(loop);
  }
  return () => unsubscribe(fn);
}

// Désabonne une fonction ; la boucle s'arrête d'elle-même quand plus personne n'écoute.
export function unsubscribe(fn) {
  subscribers.delete(fn);
}

// Helpers mathématiques partagés — utilisés par tilt, magnetic, marquee, hero-canvas.
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
