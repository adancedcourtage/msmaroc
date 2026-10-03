// ===== FAQ accordéon accessible =====
// Chaque question est un <button> natif (clavier gratuit : Entrée / Espace).
// Ouverture animée par grid-template-rows 0fr -> 1fr sur un wrapper interne.
// Mode accordéon exclusif : une seule réponse ouverte à la fois.
// Deep-link : ?#faq-q-N ouvre la bonne question et défile jusqu'à elle.

import { qs, qsa } from './utils.js';

export function initFaq() {
  const items = qsa('.faq-item');
  if (!items.length) return;

  // Ferme toutes les questions, puis ouvre éventuellement `except`.
  function closeAll(except = null) {
    items.forEach((item) => {
      if (item === except) return;
      const btn = qs('.faq-q', item);
      item.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function open(item, { push = true, scroll = false } = {}) {
    const btn = qs('.faq-q', item);
    closeAll(item);
    item.classList.add('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      if (push && btn.id) {
        // Met à jour le hash sans empiler d'entrée d'historique.
        history.replaceState(null, '', '#' + btn.id);
      }
      if (scroll) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function close(item) {
    const btn = qs('.faq-q', item);
    item.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  items.forEach((item) => {
    const btn = qs('.faq-q', item);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (item.classList.contains('open')) {
        close(item);
      } else {
        open(item);
      }
    });
  });

  // Deep-link au chargement : #faq-q-N (ou l'id d'une réponse) ouvre l'item.
  const hash = location.hash.replace('#', '');
  if (hash) {
    const target = items.find((item) => {
      const btn = qs('.faq-q', item);
      const ans = qs('.faq-a', item);
      return (btn && btn.id === hash) || (ans && ans.id === hash);
    });
    if (target) {
      // Laisse le layout se stabiliser avant de défiler.
      requestAnimationFrame(() => open(target, { push: false, scroll: true }));
    }
  }
}
