// ===== Menu mobile =====
// Aucune injection de style inline (contrairement à l'ancien hack) : l'état est
// porté par la classe .nav-open sur <body>, toute la mise en forme est en CSS.
// Panneau plein écran, entrée décalée des liens, verrouillage du scroll,
// fermeture par Échap / clic extérieur / clic sur lien / swipe vers le haut,
// piège de focus, restauration du focus sur le burger à la fermeture.

import { qs, qsa } from './utils.js';

export function initNav() {
  const toggle = qs('.nav-toggle');
  const links = qs('.nav-links');
  const header = qs('header');
  if (!toggle || !links) return;

  const focusables = () => qsa('a, button', links).filter((el) => !el.hasAttribute('disabled'));
  let lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fermer le menu');
    // Focus sur le premier lien pour un parcours clavier immédiat.
    const first = focusables()[0];
    if (first) requestAnimationFrame(() => first.focus());
    document.addEventListener('keydown', onKeydown);
  }

  function close({ restore = true } = {}) {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    document.removeEventListener('keydown', onKeydown);
    if (restore && lastFocused) lastFocused.focus();
  }

  function isOpen() {
    return document.body.classList.contains('nav-open');
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    // Piège de focus : Tab / Shift+Tab bouclent dans le panneau.
    if (e.key === 'Tab') {
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  toggle.addEventListener('click', () => {
    isOpen() ? close() : open();
  });

  // Fermeture au clic sur un lien de navigation.
  focusables().forEach((el) => {
    el.addEventListener('click', () => { if (isOpen()) close({ restore: false }); });
  });

  // Clic extérieur (sur le voile, hors header).
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (header && !header.contains(e.target)) close({ restore: false });
  });

  // Swipe vers le haut pour fermer (tactile).
  let startY = null;
  links.addEventListener('pointerdown', (e) => { startY = e.clientY; });
  links.addEventListener('pointerup', (e) => {
    if (startY !== null && startY - e.clientY > 60) close({ restore: false });
    startY = null;
  });

  // Sécurité : si on repasse en desktop, on nettoie l'état ouvert.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && isOpen()) close({ restore: false });
  });
}
