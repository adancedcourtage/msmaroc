// ===== Orchestration =====
// Ce fichier ne fait que câbler les modules. Toute la logique vit dans js/modules/*.
// Chargé en <script type="module"> : les imports sont natifs, aucune build step.

import { qs } from './modules/utils.js';
import { initNav } from './modules/nav.js';
import { initFaq } from './modules/faq.js';
import { initScroll } from './modules/scroll.js';
import { initReveal, initNavActive } from './modules/reveal.js';
import { initForm } from './modules/form.js';
import { initRipple } from './modules/ripple.js';
import { initMagnetic } from './modules/magnetic.js';
import { initTilt } from './modules/tilt.js';
import { initServices, exposeServicesApi } from './modules/services.js';
import { initMarquee } from './modules/marquee.js';
import { initTimeline } from './modules/timeline.js';
import { initTestimonials } from './modules/testimonials.js';
import { initHeroCanvas } from './modules/hero-canvas.js';
import { initWebglBg } from './modules/webgl-bg.js';
import { initStats } from './modules/stats.js';
import { initScrub } from './modules/scrub.js';
import { initServicesFly } from './modules/services-fly.js';
import { initImgParallax } from './modules/img-parallax.js';
import { initImgLiquid } from './modules/img-liquid.js';
import { initGradientShimmer } from './modules/gradient-shimmer.js';
import { initSplineScene } from './modules/spline-scene.js';
import { initSpotlight } from './modules/spotlight.js';
import { initLenis } from './modules/lenis-smooth.js';
import { initGsapTitles } from './modules/gsap-titles.js';
import { initHeroThree } from './modules/hero-three.js';
import { initGsapParallax } from './modules/gsap-parallax.js';

// Année dynamique (gardée : absente sur certaines pages).
const yearEl = qs('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Espace de noms public.
window.MS = window.MS || {};

function boot() {
  // Reduced-motion : la vidéo hero reste figée sur son poster.
  const heroVid = qs('.hero-video');
  if (heroVid && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVid.removeAttribute('autoplay');
    heroVid.addEventListener('loadeddata', () => heroVid.pause());
    try { heroVid.pause(); } catch (e) { /* pas encore prêt */ }
  }

  // --- Communs à toutes les pages ---
  initLenis();      // smooth scroll global (Lenis + GSAP ticker, chargé en lazy ESM)
  initWebglBg();   // fond vivant global (derrière tout le contenu)
  initScroll();
  initReveal();
  initNav();

  // --- Spécifiques à la page d'accueil ---
  if (qs('#services')) {
    initNavActive();
    initFaq();
    initForm();          // expose window.MS.prefillService
    initHeroCanvas();
    initGradientShimmer(); // dégradé animé sur le titre du hero (.grad-text[data-shimmer])
    initSpotlight();       // halo souris sur la carte 3D ([data-spotlight])
    initSplineScene();     // scènes 3D chargées en lazy ([data-spline])
    initHeroThree();       // scène Three.js PRINCIPALE du hero (remplace la vidéo), réactive à la molette
    initGsapTitles();      // reveal mot-par-mot des titres de section au scroll ([data-gsap-title])
    initGsapParallax();    // parallaxe GSAP+Lenis sur les images hors cartes ([data-gsap-parallax])
    initStats();
    initTimeline();
    initTestimonials();
    // L'entrée du hero est désormais 100% CSS (voir .hero-in dans immersive.css) :
    // aucun module JS requis, donc aucun risque de rester bloqué avant un tick rAF.

    // Services : on charge les données puis on expose l'API avant strip/stats.
    initServices().then(() => {
      exposeServicesApi();
      initMarquee();     // le strip dépend de window.MS.filterServices
      // Effets d'entrée génériques posés après l'injection des éléments dynamiques.
      initRipple();
      initMagnetic();
      initTilt();
      initServicesFly(); // enregistre les scènes scrub des cartes
      initImgParallax(); // parallaxe des images (scènes scrub)
      initImgLiquid();   // distorsion liquide WebGL au survol des images
      initScrub();       // démarre le moteur une fois toutes les scènes enregistrées
    });
  } else {
    // Pages légales / 404 : uniquement les effets génériques utiles.
    initRipple();
    initMagnetic();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
