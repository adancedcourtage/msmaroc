// ===== Apparition au scroll + navigation active =====
// Deux IntersectionObserver légers, sans boucle rAF (l'observer suffit).

import { qsa } from './utils.js';

export function initReveal() {
  // Apparition progressive des blocs .reveal
  const revealEls = qsa('.reveal');
  // Index de stagger : chaque .reveal reçoit son rang dans son parent.
  const seen = new Map();
  revealEls.forEach((el) => {
    const p = el.parentElement;
    const n = seen.get(p) || 0;
    el.style.setProperty('--i', n);
    seen.set(p, n + 1);
  });
  if (revealEls.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => obs.observe(el));
  } else {
    // Repli : tout est visible.
    revealEls.forEach((el) => el.classList.add('visible'));
  }
}

export function initNavActive() {
  const sections = qsa('section[id]');
  const navMap = {};
  qsa('.nav-links a').forEach((a) => {
    const id = (a.getAttribute('href') || '').replace('#', '');
    if (id) navMap[id] = a;
  });
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        Object.values(navMap).forEach((a) => {
          a.classList.remove('active');
          a.removeAttribute('aria-current');
        });
        const link = navMap[e.target.id];
        if (link) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'true');
        }
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => obs.observe(s));
}
