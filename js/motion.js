/* Polish de mouvement. Dépendance : aucune. Les états masqués ne s'appliquent que sous html.mo. */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(d.querySelectorAll(s)); };

  /* Barre de progression + en-tête */
  var header = $('.site-header'), bar = null;
  if (header && !reduce) {
    bar = d.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
    header.appendChild(bar);
  }
  var tl = $('.timeline'), hist = $('#histoire'), pic = $('.story figure img');
  var tick = false;
  function frame() {
    tick = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (reduce) return;
    if (bar) {
      var max = root.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
    if (tl) {
      var r = tl.getBoundingClientRect();
      tl.style.setProperty('--p', Math.max(0, Math.min(1, (vh * 0.65 - r.top) / r.height)).toFixed(3));
    }
    if (hist && pic) {
      var h = hist.getBoundingClientRect();
      if (h.bottom > 0 && h.top < vh) {
        var p = Math.max(0, Math.min(1, (vh - h.top) / (vh + h.height)));
        pic.style.setProperty('--py', ((0.5 - p) * 16).toFixed(1) + 'px');
      }
    }
  }
  function req() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req, { passive: true });
  frame();

  /* Lien actif dans la navigation */
  if ('IntersectionObserver' in window) {
    var map = {};
    $$('.nav-links a[href^="#"]').forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var cur = null;
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || !map[e.target.id]) return;
        if (cur) cur.classList.remove('active');
        cur = map[e.target.id]; cur.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { var s = d.getElementById(id); if (s) nio.observe(s); });
  }

  if (reduce || !('IntersectionObserver' in window)) return;
  root.classList.add('mo');

  /* Titres : mot par mot, texte préservé pour les lecteurs d'écran */
  $$('.sec-head h2, .final h2').forEach(function (h) {
    if (h.children.length) return;
    var t = h.textContent.trim();
    h.setAttribute('aria-label', t);
    h.innerHTML = t.split(/\s+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true" style="--i:' + Math.min(i, 12) + '">' + w + '</span>';
    }).join(' ');
  });

  /* Déclencheurs de section */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.3 });
  $$('.facts, .steps').forEach(function (el) { io.observe(el); });

  /* Bouton principal magnétique (souris uniquement) */
  if (matchMedia('(pointer: fine)').matches) {
    var b = $('.final .btn.primary');
    if (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.2).toFixed(1) + 'px');
      }, { passive: true });
      b.addEventListener('pointerleave', function () { b.style.removeProperty('--mx'); b.style.removeProperty('--my'); });
    }
  }
})();
