// ===== Spline Scene — scène 3D interactive, chargée en vanilla =====
// Porté depuis un composant React (`@splinetool/react-spline` + Suspense/lazy).
// Le runtime officiel `@splinetool/runtime` est un simple package JS, sans lien
// avec React : on le charge via un CDN ESM (aucun build ni npm requis sur ce
// site statique), exactement comme le fait le composant source en interne.
//
// Usage :  <div class="spline-visual" data-spline="https://prod.spline.design/xxx/scene.splinecode">
//            <canvas></canvas>
//          </div>
//
// Perf & bon sens : le runtime 3D pèse plusieurs Mo et sollicite le GPU. On ne
// le charge donc que si l'utilisateur fait défiler jusqu'à la section (lazy,
// même intention que le `lazy()` + `Suspense` React d'origine), jamais sur
// mobile (contrôles orbite peu pertinents sur petit écran tactile + coût
// batterie), et jamais en `prefers-reduced-motion` (la scène est interactive
// mais tourne par défaut en boucle si non pilotée par la souris).

import { qsa, prefersReducedMotion } from './utils.js';

const RUNTIME_CDN = 'https://esm.sh/@splinetool/runtime@1.12.98';
const MOBILE_MAX_WIDTH = 760;

function shouldSkipHeavy3D() {
  return prefersReducedMotion() || window.matchMedia(`(max-width:${MOBILE_MAX_WIDTH}px)`).matches;
}

async function mountScene(container) {
  const sceneUrl = container.dataset.spline;
  if (!sceneUrl) return;

  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }

  try {
    const { Application } = await import(/* @vite-ignore */ RUNTIME_CDN);
    const app = new Application(canvas);
    await app.load(sceneUrl);
    container.classList.add('is-loaded');
  } catch (err) {
    // Réseau capricieux, CDN bloqué, scène invalide… le fallback CSS (poster)
    // reste affiché : on ne casse jamais la mise en page pour un effet bonus.
    container.classList.add('is-fallback');
  }
}

function initOne(container) {
  if (shouldSkipHeavy3D()) {
    container.classList.add('is-fallback');
    return;
  }

  if (typeof IntersectionObserver === 'undefined') {
    mountScene(container);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        mountScene(container);
      }
    }
  }, { rootMargin: '200px' });
  io.observe(container);
}

export function initSplineScene() {
  qsa('[data-spline]').forEach(initOne);
}
