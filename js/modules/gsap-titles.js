// ===== Titres de section : reveal mot-par-mot au scroll (GSAP ScrollTrigger) =====
// Cible les éléments [data-gsap-title]. Le texte original reste dans un
// aria-label sur le conteneur (les mots injectés sont aria-hidden) pour ne
// rien casser côté lecteurs d'écran. Si GSAP/ScrollTrigger ne chargent pas
// (réseau), le DOM n'est jamais touché : le titre reste du texte normal,
// déjà révélé par le fade-up .reveal existant sur son bloc parent.

import { qsa, prefersReducedMotion } from './utils.js';
import { loadMotionLibs } from './motion-libs.js';

export async function initGsapTitles() {
  if (prefersReducedMotion()) return;
  const targets = qsa('[data-gsap-title]');
  if (!targets.length) return;

  let libs;
  try {
    libs = await loadMotionLibs();
  } catch (e) {
    return;
  }
  const { gsap, ScrollTrigger } = libs;

  targets.forEach((el) => {
    const text = el.textContent.trim();
    if (!text) return;
    el.setAttribute('aria-label', text);
    el.textContent = '';

    const frag = document.createDocumentFragment();
    text.split(' ').forEach((word, i, arr) => {
      const mask = document.createElement('span');
      mask.className = 'gsap-word-mask';
      mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'gsap-word';
      inner.textContent = word + (i < arr.length - 1 ? ' ' : '');
      mask.appendChild(inner);
      frag.appendChild(mask);
    });
    el.appendChild(frag);

    const words = el.querySelectorAll('.gsap-word');
    gsap.set(words, { yPercent: 115, opacity: 0 });
    gsap.to(words, {
      yPercent: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}
