// ===== Services : filtres FLIP + modales =====
// Charge data/services.json, câble un tablist de filtres au-dessus de la grille,
// anime les cartes en FLIP (elles glissent, ne sautent pas), et ouvre chaque
// carte dans un <dialog> natif réutilisé. Expose window.MS.filterServices(cat)
// et window.MS.openService(id) pour les lots 4 et 6.

import { qs, qsa, prefersReducedMotion } from './utils.js';

const CATS = [
  { key: 'all', label: 'Tout' },
  { key: 'web', label: 'Web & Apps' },
  { key: 'ia', label: 'IA & Automatisation' },
  { key: 'com', label: 'Communication' },
  { key: 'infra', label: 'Infrastructure & Sécurité' },
  { key: 'conseil', label: 'Conseil & Formation' },
];

export async function initServices() {
  const grid = qs('.services-grid');
  if (!grid) return;

  let data = [];
  try {
    const res = await fetch('data/services.json');
    data = await res.json();
  } catch (e) {
    // Sans les données, on laisse la grille statique intacte : rien ne casse.
    return;
  }
  const byId = Object.fromEntries(data.map((s) => [s.id, s]));

  // Toutes les cartes filtrables (grille principale + mini-cartes).
  const cards = qsa('[data-service-id]');
  cards.forEach((card) => {
    const svc = byId[card.dataset.serviceId];
    if (!svc) return;
    card.dataset.cat = svc.categorie.join(' ');
    // Rend la carte entière activable.
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', svc.titre + ' — voir le détail');
  });

  buildFilters(grid, cards);
  buildDialog(data, byId);

  // Ouverture au clic / clavier.
  cards.forEach((card) => {
    const open = (e) => {
      // On ignore le clic direct sur le lien interne « En savoir plus » (il ouvre aussi).
      openService(card.dataset.serviceId, card);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
    });
    // Le lien interne ne pointe plus vers #contact : il ouvre la modale.
    const link = qs('.link', card);
    if (link) {
      link.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openService(card.dataset.serviceId, card); });
      link.setAttribute('tabindex', '-1'); // la carte porte déjà le focus
    }
  });

  // État initial depuis l'URL (?filtre=ia).
  const params = new URLSearchParams(location.search);
  const initial = params.get('filtre');
  if (initial && CATS.some((c) => c.key === initial)) applyFilter(initial);
}

// ---------- FILTRES ----------
let filterState = 'all';
let cardsRef = [];
let counterEl = null;

function buildFilters(grid, cards) {
  cardsRef = cards;
  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', 'Filtrer les services');
  CATS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'filter-tab';
    b.setAttribute('role', 'tab');
    b.setAttribute('data-cat-key', c.key);
    b.setAttribute('aria-selected', c.key === 'all' ? 'true' : 'false');
    b.dataset.ripple = '';
    b.textContent = c.label;
    b.addEventListener('click', () => applyFilter(c.key));
    bar.appendChild(b);
  });
  counterEl = document.createElement('p');
  counterEl.className = 'filter-count';
  counterEl.setAttribute('aria-live', 'polite');
  grid.parentElement.insertBefore(bar, grid);
  grid.parentElement.insertBefore(counterEl, grid);
  updateCount();
}

function applyFilter(key) {
  if (key === filterState) return;
  const reduce = prefersReducedMotion();

  // FLIP : 1) positions avant
  const first = new Map();
  cardsRef.forEach((c) => first.set(c, c.getBoundingClientRect()));

  filterState = key;
  qsa('.filter-tab').forEach((t) =>
    t.setAttribute('aria-selected', String(t.dataset.catKey === key)));

  // 2) applique l'état (hidden)
  let shown = 0;
  cardsRef.forEach((c) => {
    const cats = (c.dataset.cat || '').split(' ');
    const match = key === 'all' || cats.includes(key);
    c.classList.toggle('is-hidden', !match);
    if (match) shown++;
  });
  updateCount(shown);

  // URL
  const url = new URL(location.href);
  if (key === 'all') url.searchParams.delete('filtre');
  else url.searchParams.set('filtre', key);
  history.replaceState(null, '', url);

  if (reduce) return;

  // 3) FLIP play sur les cartes visibles + stagger d'entrée
  let i = 0;
  cardsRef.forEach((c) => {
    if (c.classList.contains('is-hidden')) return;
    const last = c.getBoundingClientRect();
    const prev = first.get(c);
    const dx = prev.left - last.left;
    const dy = prev.top - last.top;
    c.style.transition = 'none';
    c.style.transform = `translate(${dx}px, ${dy}px)`;
    // force reflow puis relâche
    requestAnimationFrame(() => {
      c.style.transition = 'transform var(--dur-base) var(--ease-out)';
      c.style.transitionDelay = (i * 0.04) + 's';
      c.style.transform = '';
    });
    c.addEventListener('transitionend', function te() {
      c.style.transition = ''; c.style.transitionDelay = '';
      c.removeEventListener('transitionend', te);
    });
    i++;
  });
}

function updateCount(n) {
  if (!counterEl) return;
  const shown = typeof n === 'number'
    ? n
    : cardsRef.filter((c) => !c.classList.contains('is-hidden')).length;
  counterEl.textContent = shown + (shown > 1 ? ' services affichés' : ' service affiché');
}

// ---------- MODALE ----------
let dialog = null;
let dialogData = [];
let currentIndex = 0;
let originCard = null;

function buildDialog(data, byId) {
  dialogData = data;
  dialog = document.createElement('dialog');
  dialog.className = 'service-dialog';
  dialog.setAttribute('aria-label', 'Détail du service');
  dialog.innerHTML =
    '<button class="dialog-close" aria-label="Fermer">&times;</button>' +
    '<div class="dialog-body"></div>' +
    '<div class="dialog-nav">' +
    '<button class="dialog-prev" aria-label="Service précédent">&larr;</button>' +
    '<button class="dialog-next">Voir le service suivant &rarr;</button>' +
    '</div>';
  document.body.appendChild(dialog);

  qs('.dialog-close', dialog).addEventListener('click', closeDialog);
  qs('.dialog-prev', dialog).addEventListener('click', () => navigate(-1));
  qs('.dialog-next', dialog).addEventListener('click', () => navigate(1));

  // Clavier flèches + Échap (Échap est natif sur <dialog>, on gère le reste).
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') navigate(1);
    else if (e.key === 'ArrowLeft') navigate(-1);
  });

  // Fermeture au clic sur le backdrop.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });

  // Restauration du focus + déverrouillage du scroll à la fermeture.
  dialog.addEventListener('close', () => {
    unlockScroll();
    if (originCard) originCard.focus();
  });

  // Swipe horizontal (tactile) sur le corps.
  let sx = null;
  dialog.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  dialog.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
    sx = null;
  });
}

function renderDialog(svc) {
  const body = qs('.dialog-body', dialog);
  body.innerHTML =
    '<div class="dialog-media"><img src="' + svc.image + '" alt="' + svc.titre + '" loading="lazy"></div>' +
    '<div class="dialog-content">' +
    '<div class="num">' + svc.num + ' — ' + svc.titre + '</div>' +
    '<h3 id="dialog-title">' + svc.titre + '</h3>' +
    '<p class="dialog-accroche">' + svc.accroche + '</p>' +
    '<ul class="dialog-prestations">' +
    svc.prestations.map((p) => '<li>' + p + '</li>').join('') +
    '</ul>' +
    '<div class="dialog-meta">' +
    '<div class="dialog-cas"><b>Exemple concret</b><p>' + svc.casUsage + '</p></div>' +
    '<div class="dialog-delai"><b>Délai indicatif</b><p>' + svc.delai + '</p></div>' +
    '</div>' +
    '<div class="dialog-tags">' + svc.tags.map((t) => '<span>' + t + '</span>').join('') + '</div>' +
    '<div class="dialog-actions">' +
    '<button class="btn btn-primary" data-devis>Demander un devis pour ce service</button>' +
    '</div>' +
    '</div>';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  qs('[data-devis]', body).addEventListener('click', () => {
    closeDialog();
    if (window.MS && window.MS.prefillService) window.MS.prefillService(svc.valeurSelect);
    const contact = qs('#contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth' });
  });
}

function openService(id, card) {
  if (!dialog) return;
  const idx = dialogData.findIndex((s) => s.id === id);
  if (idx < 0) return;
  currentIndex = idx;
  originCard = card || null;
  renderDialog(dialogData[idx]);
  lockScroll();
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', ''); // repli minimal
}

function navigate(dir) {
  currentIndex = (currentIndex + dir + dialogData.length) % dialogData.length;
  const content = qs('.dialog-content', dialog);
  if (content && !prefersReducedMotion()) {
    content.classList.remove('slide-in');
    void content.offsetWidth;
    content.classList.add('slide-in');
  }
  renderDialog(dialogData[currentIndex]);
}

function closeDialog() {
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else { dialog.removeAttribute('open'); unlockScroll(); if (originCard) originCard.focus(); }
}

// Verrou de scroll avec compensation de la scrollbar (pas de saut de layout).
function lockScroll() {
  const sw = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  if (sw > 0) document.body.style.paddingRight = sw + 'px';
}
function unlockScroll() {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

// ---------- API publique ----------
export function exposeServicesApi() {
  window.MS = window.MS || {};
  // Filtre pilotable de l'extérieur (strip, secteurs) + scroll optionnel.
  window.MS.filterServices = (key, { scroll = false } = {}) => {
    if (!CATS.some((c) => c.key === key)) key = 'all';
    applyFilter(key);
    if (scroll) {
      const s = qs('#services');
      if (s) s.scrollIntoView({ behavior: 'smooth' });
    }
  };
  window.MS.openService = (id) => openService(id, null);
}
