// ===== Gradient Shimmer — dégradé multi-stops qui balaie un texte =====
// Porté FIDÈLEMENT depuis un composant React (galerie 21st.dev). Les APIs
// utilisées — Web Animations API (el.animate), IntersectionObserver,
// matchMedia — sont natives du navigateur, pas propres à React : le portage
// reproduit donc le même comportement à l'identique, pas une réinvention
// approximative. Zéro dépendance, zéro build.
//
// Usage :  <span data-shimmer>texte</span>
// Attributs optionnels (équivalent vanilla des props du composant source) :
//   data-shimmer="brand|sunrise|bubble|peach|tonic|mint|spring|twilight|bay"
//   data-shimmer-easing="smooth|gentle|snappy"   (défaut: smooth)
//   data-shimmer-duration="1.45"                  (secondes, défaut: 1.45)
//   data-shimmer-spread="3"                       (px/caractère, défaut: 3)
//   data-shimmer-angle="105"                      (degrés, défaut: 105)
//   data-shimmer-pause="1000"                     (ms entre deux balayages)
//   data-shimmer-base="currentColor"              (couleur de base du texte)
//
// IMPORTANT (hérité du composant source) : l'élément ne doit contenir QUE du
// texte brut — pas de balises enfants — car le module lit el.textContent et
// applique le clip de dégradé directement sur l'élément lui-même.

import { qsa, prefersReducedMotion } from './utils.js';

/* ---------- Préréglages de dégradé ---------- */
// Les 8 préréglages d'origine sont conservés VERBATIM (fidélité au composant
// source, réutilisables ailleurs si besoin un jour). "brand" est ajouté en
// plus, spécifiquement pour ce site : nos deux seuls accents (cyan/orange)
// plutôt que d'imposer une des palettes arbitraires de la référence sur une
// identité de marque déjà établie — même logique que pour l'aurora du hero.
export const gradientPresets = {
  brand: [
    { color: '#bfe9ff', position: 0 },
    { color: '#7dd3fc', position: 0.28 },
    { color: '#22d3ee', position: 0.5 },
    { color: '#ff9a1f', position: 0.76 },
    { color: '#ff7a00', position: 1 },
  ],
  sunrise: [
    { color: '#B6D3EF', position: 0 },
    { color: '#CAD1D7', position: 0.153 },
    { color: '#D7CFC8', position: 0.252 },
    { color: '#E1CDB9', position: 0.341 },
    { color: '#EAC6A5', position: 0.424 },
    { color: '#EDB185', position: 0.505 },
    { color: '#EF9B62', position: 0.586 },
    { color: '#F18F60', position: 0.669 },
    { color: '#F48D7A', position: 0.758 },
    { color: '#F78A94', position: 0.857 },
    { color: '#F888A0', position: 1 },
  ],
  bubble: [
    { color: '#F5EBD9', position: 0 },
    { color: '#F2D4DB', position: 0.31 },
    { color: '#EBBDDE', position: 0.5 },
    { color: '#CCBAE3', position: 0.65 },
    { color: '#8CBFF0', position: 0.82 },
    { color: '#78B0FF', position: 1 },
  ],
  peach: [
    { color: '#D9F5FA', position: 0 },
    { color: '#FCD9D6', position: 0.31 },
    { color: '#FCBAC9', position: 0.61 },
    { color: '#F0B3F5', position: 1 },
  ],
  tonic: [
    { color: '#E3EDF0', position: 0 },
    { color: '#E8EBB8', position: 0.27 },
    { color: '#F0DEA3', position: 0.43 },
    { color: '#E8B078', position: 0.75 },
    { color: '#F29682', position: 1 },
  ],
  mint: [
    { color: '#DECEE8', position: 0 },
    { color: '#CBBAEE', position: 0.21 },
    { color: '#7DC0FB', position: 0.46 },
    { color: '#00C7A6', position: 1 },
  ],
  spring: [
    { color: '#F7D5C5', position: 0.07 },
    { color: '#46A8C0', position: 0.58 },
    { color: '#43AE7D', position: 1 },
  ],
  twilight: [
    { color: '#E3CCE6', position: 0 },
    { color: '#4E8CD5', position: 0.35 },
    { color: '#6068C2', position: 0.64 },
    { color: '#38364E', position: 1 },
  ],
  bay: [
    { color: '#DBE3D0', position: 0 },
    { color: '#8DB8A7', position: 0.23 },
    { color: '#2D8E9A', position: 0.42 },
    { color: '#076492', position: 0.59 },
    { color: '#154288', position: 0.79 },
    { color: '#262C81', position: 1 },
  ],
};

/* Easing nommés → cubic-bezier réels (identiques au composant source). */
const easingPresets = {
  smooth: 'cubic-bezier(0.45, 0, 0.55, 1)',
  gentle: 'cubic-bezier(0.76, 0, 0.24, 1)',
  snappy: 'cubic-bezier(0.3, 0, 0.2, 1)',
};

const BAND_CORE_RATIO = 0.44;
const MAX_SPREAD_PX = 48;
const SPREAD_MID_RATIO = 0.72;
const BASE_FONT_PX = 14;
const FALLBACK_TEXT_WIDTH_PX = 96;
const VIEWPORT_ROOT_MARGIN = '160px';
const SCROLL_IDLE_MS = 120;

/* Construit le background-image du bandeau (dégradé multi-stops + fondus). */
function buildBandGradient(stops, angle) {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const first = sorted[0]?.color ?? '#fff';
  const last = sorted[sorted.length - 1]?.color ?? '#fff';
  const core = sorted
    .map((s) => {
      const factor = (s.position - 0.5) * 2 * BAND_CORE_RATIO;
      return s.color + ' calc(50% + var(--gs-spread-mid) * ' + factor.toFixed(4) + ')';
    })
    .join(', ');
  return [
    'linear-gradient(' + angle + 'deg',
    'var(--gs-base) calc(50% - var(--gs-spread))',
    'color-mix(in oklab, var(--gs-base) 42%, ' + first + ') calc(50% - var(--gs-spread-mid))',
    core,
    'color-mix(in oklab, var(--gs-base) 42%, ' + last + ') calc(50% + var(--gs-spread-mid))',
    'var(--gs-base) calc(50% + var(--gs-spread)))',
  ].join(', ');
}

function supportsBackgroundClipText() {
  if (typeof window.CSS?.supports !== 'function') return false;
  return window.CSS.supports('background-clip', 'text') || window.CSS.supports('-webkit-background-clip', 'text');
}

/* Fils de garde : actif seulement si visible à l'écran, page visible, et
   scroll au repos. Mêmes trois signaux que le composant source. */
function observeShimmerActive(el, onChange) {
  let inViewport = typeof IntersectionObserver === 'undefined';
  let pageVisible = !document.hidden;
  let notScrolling = true;
  const compute = () => onChange(inViewport && pageVisible && notScrolling);

  let io;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      inViewport = entry.isIntersecting;
      compute();
    }, { rootMargin: VIEWPORT_ROOT_MARGIN });
    io.observe(el);
  }

  const onVisibility = () => { pageVisible = !document.hidden; compute(); };
  document.addEventListener('visibilitychange', onVisibility);

  let scrollTimer;
  const onScroll = () => {
    notScrolling = false;
    compute();
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { notScrolling = true; compute(); }, SCROLL_IDLE_MS);
  };
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });

  compute();
}

function initOne(el) {
  const text = el.textContent;
  if (!text || !text.trim()) return;

  const presetName = el.dataset.shimmer || 'brand';
  const stops = gradientPresets[presetName] || gradientPresets.brand;
  const easing = easingPresets[el.dataset.shimmerEasing] || easingPresets.smooth;
  const duration = Math.max(0.001, parseFloat(el.dataset.shimmerDuration) || 1.45);
  const spread = Math.max(0, parseFloat(el.dataset.shimmerSpread) || 3);
  const angle = parseFloat(el.dataset.shimmerAngle) || 105;
  const pauseBetween = Math.max(0, parseFloat(el.dataset.shimmerPause) || 1000);
  const baseColor = el.dataset.shimmerBase || 'currentColor';

  const backgroundImage = buildBandGradient(stops, angle);
  const initialSpread = Math.min(text.length * spread, MAX_SPREAD_PX);

  el.style.position = 'relative';
  el.style.display = 'inline-block';
  el.style.backgroundImage = backgroundImage;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundSize = '100% 100%';
  el.style.backgroundColor = 'var(--gs-base)';
  el.style.webkitBackgroundClip = 'text';
  el.style.backgroundClip = 'text';
  el.style.webkitTextFillColor = 'transparent';
  el.style.setProperty('--gs-base', baseColor);
  el.style.setProperty('--gs-spread', initialSpread.toFixed(2) + 'px');
  el.style.setProperty('--gs-spread-mid', (initialSpread * SPREAD_MID_RATIO).toFixed(2) + 'px');

  // Pas de background-clip:text disponible → le texte serait invisible
  // (fill transparent sans rien à cliper). On l'affiche en couleur normale.
  if (!supportsBackgroundClipText()) {
    el.style.removeProperty('background-image');
    el.style.removeProperty('-webkit-text-fill-color');
    return;
  }

  function measure() {
    const textWidth = el.getBoundingClientRect().width || FALLBACK_TEXT_WIDTH_PX;
    const fontSize = parseFloat(getComputedStyle(el).fontSize) || BASE_FONT_PX;
    const fontScale = fontSize / BASE_FONT_PX;
    const spreadPx = Math.min(text.length * spread * fontScale, MAX_SPREAD_PX * fontScale);
    const layerWidth = Math.max(1, textWidth + spreadPx * 2);
    const start = -spreadPx - layerWidth / 2;
    const end = textWidth + spreadPx - layerWidth / 2;
    el.style.setProperty('--gs-spread', spreadPx.toFixed(2) + 'px');
    el.style.setProperty('--gs-spread-mid', (spreadPx * SPREAD_MID_RATIO).toFixed(2) + 'px');
    el.style.backgroundSize = layerWidth.toFixed(1) + 'px 100%';
    return { start, end, durationMs: duration * 1000 };
  }

  measure();

  // Reduced-motion : dégradé statique (texte coloré, sans balayage) — comme
  // le composant source, on ne prive pas l'utilisateur du rendu, juste du mouvement.
  if (prefersReducedMotion() || typeof el.animate !== 'function') return;

  let anim = null;
  let pauseTimer;
  let active = true;

  function runSweep() {
    const { start, end, durationMs } = measure();
    const next = el.animate(
      [
        { backgroundPosition: start.toFixed(1) + 'px center' },
        { backgroundPosition: end.toFixed(1) + 'px center' },
      ],
      { duration: durationMs, easing, fill: 'forwards' }
    );
    if (!active) next.pause();
    // On n'annule l'animation précédente qu'une fois la suivante lancée,
    // pour ne jamais laisser un frame sans anim "fill:forwards" active.
    if (anim) anim.cancel();
    anim = next;
    next.onfinish = () => { pauseTimer = setTimeout(runSweep, pauseBetween); };
  }

  observeShimmerActive(el, (next) => {
    active = next;
    if (anim) { if (active) anim.play(); else anim.pause(); }
  });

  runSweep();
}

export function initGradientShimmer() {
  qsa('[data-shimmer]').forEach(initOne);
}
