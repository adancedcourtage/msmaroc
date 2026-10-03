// ===== Scène 3D Three.js PRINCIPALE du hero (remplace la vidéo) =====
// Nuage de particules + torus-knot filaire, rotation idle continue.
// Réactif à la molette : chaque cran de scroll donne une impulsion de zoom
// (avant/arrière) amortie en douceur — en plus du zoom/rotation liés à la
// POSITION de scroll (GSAP ScrollTrigger, pour rester cohérent au trackpad/
// tactile). Desktop uniquement (poids GPU) et coupé en reduced-motion : dans
// ces cas la vidéo d'origine (data-hero-fallback) reste affichée, jamais
// retirée du DOM — voir .hero-three-main / video.hero-video dans mdx-layer.css.

import { subscribe } from './raf.js';
import { qs, prefersReducedMotion } from './utils.js';
import { loadMotionLibs } from './motion-libs.js';

const MOBILE_MAX_WIDTH = 980;

export async function initHeroThree() {
  const canvas = qs('#hero-three-main');
  if (!canvas) return;
  if (prefersReducedMotion() || window.matchMedia(`(max-width:${MOBILE_MAX_WIDTH}px)`).matches) return;

  let THREE;
  try {
    THREE = await import('https://esm.sh/three@0.160.0');
  } catch (e) {
    return; // Réseau capricieux : la vidéo d'origine reste affichée, rien de cassé
  }

  const mount = canvas.parentElement; // wrapper [data-tilt], mêmes dimensions que la vidéo remplacée
  const width = mount.clientWidth || 480;
  const height = mount.clientHeight || 270;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  const baseZ = 6;
  camera.position.z = baseZ;

  const knotGeo = new THREE.TorusKnotGeometry(1.3, 0.38, 190, 22);
  const wireGeo = new THREE.WireframeGeometry(knotGeo);
  const knot = new THREE.LineSegments(
    wireGeo,
    new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.65 })
  );
  scene.add(knot);

  const COUNT = 420;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.6 + Math.random() * 0.9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: 0xff9a1f, size: 0.045, transparent: true, opacity: 0.85 })
  );
  scene.add(points);

  function resize() {
    const w = mount.clientWidth || width;
    const h = mount.clientHeight || height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // ---- Zoom réactif à la molette : chaque cran donne une impulsion, amortie
  // en douceur sur LA boucle rAF partagée (pas de second rAF ici). ----
  let zoomVelocity = 0;
  let zoomOffset = 0;
  window.addEventListener('wheel', (e) => {
    zoomVelocity += Math.max(-1, Math.min(1, e.deltaY)) * 0.0035;
  }, { passive: true });

  subscribe((dt) => {
    // Rotation idle continue, jamais interrompue.
    knot.rotation.x += dt * 0.00012;
    knot.rotation.y += dt * 0.00018;
    points.rotation.y -= dt * 0.00009;

    // Impulsion de zoom molette : ça pousse, puis ça revient (ressort doux).
    zoomOffset += zoomVelocity;
    zoomOffset *= 0.94;
    zoomVelocity *= 0.86;
    zoomOffset = Math.max(-2.2, Math.min(2.4, zoomOffset));
    camera.position.z = baseZ + zoomOffset;

    renderer.render(scene, camera);
  });

  // Zoom + rotation additionnels liés à la POSITION de scroll (cohérent aussi
  // au trackpad/tactile/barre de défilement, pas seulement la molette).
  try {
    const { ScrollTrigger } = await loadMotionLibs();
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
      onUpdate(self) {
        const p = self.progress;
        knot.rotation.z = p * Math.PI * 1.2;
        knot.scale.setScalar(1 + p * 0.35);
      },
    });
  } catch (e) {
    /* la réactivité molette suffit si GSAP/ScrollTrigger indisponible */
  }

  canvas.classList.add('is-active');
}
