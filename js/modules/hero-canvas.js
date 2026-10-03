// ===== Réseau animé du hero, réactif au pointeur =====
// Extrait de l'ancien main.js. Conserve l'optimisation d'origine : pause hors
// viewport (IntersectionObserver) + visibilitychange. Branché sur la boucle rAF
// PARTAGÉE (subscribe/unsubscribe) — pas de second requestAnimationFrame.
// Réactivité : nœud fantôme suivant le pointeur (liaisons + répulsion douce),
// onde de choc au clic. Sur pointeur grossier : point d'attraction Lissajous.

import { subscribe, unsubscribe, lerp } from './raf.js';
import { qs, isFinePointer, prefersReducedMotion } from './utils.js';

export function initHeroCanvas() {
  const canvas = qs('#network-canvas');
  if (!canvas) return;
  if (prefersReducedMotion()) return; // canvas décoratif : coupé

  const ctx = canvas.getContext('2d');
  let w, h, points = [], inView = true, running = false;
  const fine = isFinePointer();

  // Pointeur (cible + position lissée). Hors écran par défaut.
  const ptr = { tx: -9999, ty: -9999, mx: -9999, my: -9999, active: false };
  let shock = null; // { x, y, r, life }
  let t0 = performance.now();

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  function initPoints() {
    points = [];
    const base = window.innerWidth < 768 ? 35 : 60;
    const count = Math.min(base, Math.floor((w * h) / 22000));
    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      });
    }
  }

  function step(dt, now) {
    // Position pointeur interpolée (inertie).
    ptr.mx = lerp(ptr.mx, ptr.tx, 0.12);
    ptr.my = lerp(ptr.my, ptr.ty, 0.12);

    // Sur pointeur grossier : cible qui dérive en Lissajous.
    if (!fine) {
      const s = (now - t0) / 1000;
      ptr.tx = w * (0.5 + 0.35 * Math.sin(s * 0.31));
      ptr.ty = h * (0.5 + 0.35 * Math.sin(s * 0.23 + 1.3));
      ptr.active = true;
    }

    ctx.clearRect(0, 0, w, h);

    // Déplacement + répulsion douce autour du pointeur.
    points.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      if (ptr.active) {
        const dx = p.x - ptr.mx, dy = p.y - ptr.my;
        const d = Math.hypot(dx, dy);
        if (d < 90 && d > 0.01) {
          const f = (1 - d / 90) * 0.6;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      // Onde de choc au clic.
      if (shock) {
        const dx = p.x - shock.x, dy = p.y - shock.y;
        const d = Math.hypot(dx, dy);
        if (d < shock.r && d > 0.01) {
          const f = (1 - d / shock.r) * shock.life * 2.2;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      // Amortissement pour un retour naturel à la vitesse de croisière.
      p.vx *= 0.94; p.vy *= 0.94;
      // Vitesse plancher pour ne pas figer le réseau.
      if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.02;
      if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.02;
    });

    // Liaisons entre points.
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x, dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.strokeStyle = 'rgba(79,139,255,' + (0.18 * (1 - dist / 130)) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    // Liaisons vers le nœud fantôme (pointeur), teinte orange.
    if (ptr.active && ptr.mx > -9000) {
      points.forEach((p) => {
        const dx = p.x - ptr.mx, dy = p.y - ptr.my;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          ctx.strokeStyle = 'rgba(255,154,31,' + (1 - dist / 180) * 0.5 + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(ptr.mx, ptr.my);
          ctx.stroke();
        }
      });
    }

    // Points.
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,154,31,0.75)';
      ctx.fill();
    });

    // Décroissance de l'onde de choc.
    if (shock) { shock.r += 6; shock.life -= dt / 400; if (shock.life <= 0) shock = null; }
  }

  function play() { if (!running && inView) { running = true; subscribe(step); } }
  function pause() { if (running) { running = false; unsubscribe(step); } }

  // Pointeur fin : suit la souris dans le hero.
  const hero = qs('.hero');
  if (fine && hero) {
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top; ptr.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { ptr.active = false; ptr.tx = -9999; ptr.ty = -9999; });
    hero.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      shock = { x: e.clientX - r.left, y: e.clientY - r.top, r: 40, life: 1 };
    });
  }

  window.addEventListener('resize', () => { resize(); initPoints(); });
  resize(); initPoints();

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      inView ? play() : pause();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { document.hidden ? pause() : play(); });
  play();
}
