// ===== Compteurs animés + panneaux de détail (hero stats) =====
// Les chiffres s'animent à l'entrée dans le viewport. Chaque stat devient un
// bouton qui déploie un panneau (grid-template-rows 0fr -> 1fr) :
//   9    -> les 9 pôles, chacun ouvre la modale Services correspondante ;
//   200+ -> répartition indicative par secteur (barres scaleX) ;
//   24/7 -> canaux de contact cliquables.

import { qs, qsa, prefersReducedMotion, easeOutCubic } from './utils.js';

const POLES = [
  ['web', 'Développement web'], ['ia', 'Automatisation & IA'], ['app', 'Applications métier'],
  ['com', 'Communication'], ['info', 'Informatique'], ['video', 'Vidéosurveillance'],
  ['electricite', 'Électricité'], ['consulting', 'Consulting'], ['formation', 'Formation'],
];
const SECTORS_DIST = [
  ['Commerces & restauration', 32], ['Santé & professions libérales', 24],
  ['Immobilier & BTP', 20], ['Industrie & PME', 14], ['Associations & autres', 10],
];

export function initStats() {
  const wrap = qs('.hero-stats');
  if (!wrap) return;
  const reduce = prefersReducedMotion();
  const stats = qsa(':scope > div', wrap);

  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * easeOutCubic(p)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stats.forEach((stat, i) => {
    const b = qs('[data-count]', stat);
    if (!b) return;

    // Bouton déclencheur (le <b> reste dans le bouton pour préserver le style).
    const btn = document.createElement('button');
    btn.className = 'stat-trigger';
    btn.setAttribute('aria-expanded', 'false');
    btn.id = 'stat-trigger-' + i;
    const panelId = 'stat-panel-' + i;
    btn.setAttribute('aria-controls', panelId);
    const span = qs('span', stat);
    btn.appendChild(b);
    if (span) btn.appendChild(span);
    stat.innerHTML = '';
    stat.appendChild(btn);

    // Panneau de détail.
    const panel = document.createElement('div');
    panel.className = 'stat-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', btn.id);
    // Un SEUL enfant : indispensable pour que grid-template-rows:minmax(0,0fr)
    // collapse réellement le panneau fermé (sinon les enfants suivants créent
    // des lignes implicites auto qui gardent de la hauteur).
    panel.innerHTML = '<div class="stat-panel-inner">' + buildPanel(i) + '</div>';
    stat.appendChild(panel);
    wirePanel(i, panel);

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      // Ferme les autres.
      qsa('.stat-trigger', wrap).forEach((t) => {
        if (t !== btn) { t.setAttribute('aria-expanded', 'false'); t.parentElement.classList.remove('stat-open'); }
      });
      btn.setAttribute('aria-expanded', String(!open));
      stat.classList.toggle('stat-open', !open);
      if (!open) {
        animateCount(b);               // rejoue le chiffre à chaque ouverture
        if (i === 1) animateBars(panel); // répartition
      }
    });
  });

  // Animation initiale au scroll (sans unobserve définitif → réanimable).
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const b = qs('[data-count]', e.target);
          if (b) animateCount(b);
        }
      });
    }, { threshold: 0.6 });
    stats.forEach((s) => obs.observe(s));
  } else {
    stats.forEach((s) => { const b = qs('[data-count]', s); if (b) animateCount(b); });
  }
}

function buildPanel(i) {
  if (i === 0) {
    return '<ul class="stat-poles">' +
      POLES.map(([id, label]) =>
        '<li><button type="button" data-open-service="' + id + '">' + label + '</button></li>').join('') +
      '</ul>';
  }
  if (i === 1) {
    return '<ul class="stat-bars">' +
      SECTORS_DIST.map(([label, pct]) =>
        '<li><span class="bar-label">' + label + '</span>' +
        '<span class="bar-track"><span class="bar-fill" data-pct="' + pct + '"></span></span>' +
        '<span class="bar-val">' + pct + '%</span></li>').join('') +
      '</ul><p class="stat-hint">Répartition indicative de nos accompagnements.</p>';
  }
  return '<ul class="stat-channels">' +
    '<li><a href="tel:+212600000000">Téléphone — +212 6 00 00 00 00</a></li>' +
    '<li><a href="https://wa.me/212600000000" target="_blank" rel="noopener">WhatsApp</a></li>' +
    '<li><a href="mailto:contact@marketingsuccess.fr">Email — contact@marketingsuccess.fr</a></li>' +
    '</ul>';
}

function wirePanel(i, panel) {
  if (i === 0) {
    qsa('[data-open-service]', panel).forEach((b) => {
      b.addEventListener('click', () => {
        if (window.MS && window.MS.openService) window.MS.openService(b.dataset.openService);
      });
    });
  }
}

function animateBars(panel) {
  if (prefersReducedMotion()) {
    qsa('.bar-fill', panel).forEach((f) => f.style.transform = 'scaleX(' + (f.dataset.pct / 100) + ')');
    return;
  }
  qsa('.bar-fill', panel).forEach((f, idx) => {
    f.style.transform = 'scaleX(0)';
    setTimeout(() => {
      f.style.transform = 'scaleX(' + (f.dataset.pct / 100) + ')';
    }, 60 + idx * 80);
  });
}
