// ===== Timeline « Notre méthode » interactive =====
// Un seul état (data-active-step), trois façons de le changer :
//   1) clic sur un numéro d'étape ;
//   2) scroll-trigger (IntersectionObserver par étape) — coupé dès une action manuelle ;
//   3) swipe / clavier fléché.
// Rail de progression animé (scaleX desktop, scaleY mobile). États active/passée/future.

import { qs, qsa, prefersReducedMotion } from './utils.js';

export function initTimeline() {
  const section = qs('#process');
  const grid = section ? qs('.process-grid', section) : null;
  if (!section || !grid) return;

  const steps = qsa('.process-step', grid);
  if (!steps.length) return;

  // Rail de progression rempli.
  const railFill = document.createElement('div');
  railFill.className = 'rail-fill';
  grid.appendChild(railFill);

  // Convertit chaque numéro en bouton accessible.
  steps.forEach((step, i) => {
    const num = qs('.step-num', step);
    if (!num) return;
    const btn = document.createElement('button');
    btn.className = 'step-num';
    btn.setAttribute('aria-current', 'false');
    btn.setAttribute('aria-label', 'Étape ' + (i + 1));
    btn.dataset.step = String(i);
    btn.innerHTML = '<span class="step-digit">' + (i + 1) + '</span>' +
      '<svg class="step-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 L9 17 l-5 -5" ' +
      'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    num.replaceWith(btn);
    btn.addEventListener('click', () => { manual = true; setActive(i); });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); manual = true; setActive(Math.min(active + 1, steps.length - 1)); focusStep(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); manual = true; setActive(Math.max(active - 1, 0)); focusStep(); }
    });
  });

  // Pagination (mobile).
  const dots = document.createElement('div');
  dots.className = 'timeline-dots';
  steps.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'timeline-dot';
    d.setAttribute('aria-label', 'Aller à l\'étape ' + (i + 1));
    d.addEventListener('click', () => { manual = true; setActive(i); });
    dots.appendChild(d);
  });
  grid.after(dots);

  let active = 0;
  let manual = false;

  function setActive(i) {
    active = i;
    section.dataset.activeStep = String(i);
    steps.forEach((step, idx) => {
      const btn = qs('.step-num', step);
      step.classList.toggle('is-active', idx === i);
      step.classList.toggle('is-past', idx < i);
      step.classList.toggle('is-future', idx > i);
      if (btn) btn.setAttribute('aria-current', idx === i ? 'step' : 'false');
    });
    qsa('.timeline-dot', dots).forEach((d, idx) => d.classList.toggle('is-active', idx === i));
    // Rail : proportion remplie.
    const ratio = steps.length > 1 ? i / (steps.length - 1) : 0;
    railFill.style.setProperty('--fill', ratio.toFixed(3));
  }

  function focusStep() {
    const btn = qs('.step-num', steps[active]);
    if (btn) btn.focus();
  }

  setActive(0);

  // Mode 3 — scroll-trigger : chaque étape s'active au passage (tant qu'aucune action manuelle).
  if ('IntersectionObserver' in window && !prefersReducedMotion()) {
    const obs = new IntersectionObserver((entries) => {
      if (manual) return;
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = steps.indexOf(e.target);
          if (idx >= 0) setActive(idx);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => obs.observe(s));
  }

  // Mode 2 — swipe horizontal (tactile) sur la grille.
  let sx = null;
  grid.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  grid.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 50) { manual = true; setActive(clampIdx(active + (dx < 0 ? 1 : -1))); }
    sx = null;
  });

  function clampIdx(i) { return Math.min(Math.max(i, 0), steps.length - 1); }
}
