/* Assistant virtuel de Marketing Succès : guide scripté (pas un chatbot libre). Additif, aucune dépendance. */
(function () {
  'use strict';
  if (window.__msGuide) return;
  var d = document, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = matchMedia('(max-width:479px)');
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var WA = 'https://wa.me/212607284660?text=Bonjour%20Marketing%20Succ%C3%A8s%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20vos%20services.';
  var S = {};
  try { S = JSON.parse(sessionStorage.getItem('msg') || '{}'); } catch (e) {}
  S.s = S.s || {}; S.h = S.h || [];
  function save() { try { sessionStorage.setItem('msg', JSON.stringify(S)); } catch (e) {} }

  var SECTIONS = {
    offres: ['Vous vendez en ligne ? Regardez l’offre 01 : commande en 30 secondes et paiement à la livraison.', '🛍️'],
    maroc: ['Paiement à la livraison, WhatsApp, livreurs locaux : tout est pensé pour votre marché.', '🚚'],
    methode: ['4 étapes simples, et la première prend 3 minutes.', '⏱️'],
    realisations: ['Quelques réalisations à parcourir : dites-nous ce qui vous parle.', '⭐'],
    histoire: ['Fondée en 2012, Marketing Succès accompagne des clients au Maroc et en France.', '🤝'],
    faq: ['Une question ? Écrivez-nous sur WhatsApp, en darija ou en français.', '💬'],
    final: ['Prêt ? Votre proposition arrive sous 24 h.', '✨']
  };
  var STEPS = [
    ['Faisons connaissance', 'Commençons simplement : 3 minutes, gratuit et sans engagement.', '👋'],
    ['De quoi avez-vous besoin', 'Cochez ce qui vous correspond, même sans certitude.', '✅'],
    ['Votre site web', 'Dites-nous simplement où vous en êtes avec votre site.', '🖥️'],
    ['Votre visibilité sur Google', 'Pas besoin de jargon : racontez-nous votre situation sur Google.', '🔍'],
    ['Vos automatisations', 'Quelles tâches répétitives aimeriez-vous alléger ?', '⚙️'],
    ['Délai, budget et rappel', 'Presque fini ! Indiquez votre délai et quand vous rappeler.', '⏳'],
    ['Votre demande est prête', 'Bravo, c’est fait ! Votre proposition arrive sous 24 h.', '🎉', 1]
  ];
  var CHIPS = [
    ['Demander mon devis', 'devis.html'],
    ['Écrire sur WhatsApp', WA, 1],
    ['Découvrir les offres', 'index.html#offres'],
    ['Comment ça marche', 'index.html#methode']
  ];
  var ALL = [];

  function av() {
    return '<svg class="msg-av" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<path d="M32 16V9" stroke="#ff9a1f" stroke-width="2.4" stroke-linecap="round"/><circle class="ant" cx="32" cy="7" r="3.6" fill="#ff9a1f"/>' +
      '<rect x="4" y="29" width="5" height="13" rx="2.5" fill="#ff9a1f"/><rect x="55" y="29" width="5" height="13" rx="2.5" fill="#ff9a1f"/>' +
      '<rect x="8" y="16" width="48" height="42" rx="17" fill="#1b212c" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.5"/>' +
      '<rect x="14" y="23" width="36" height="25" rx="12" fill="#07080a"/>' +
      '<g class="eyes"><g class="blink"><ellipse cx="25" cy="34" rx="6" ry="6.5" fill="#22d3ee" opacity=".22"/><ellipse cx="39" cy="34" rx="6" ry="6.5" fill="#22d3ee" opacity=".22"/>' +
      '<ellipse cx="25" cy="34" rx="3.4" ry="4.4" fill="#22d3ee"/><ellipse cx="39" cy="34" rx="3.4" ry="4.4" fill="#22d3ee"/></g></g>' +
      '<path class="smile" d="M27 43q5 3.6 10 0" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<g class="bars" fill="#22d3ee"><rect x="24" y="41" width="3" height="5" rx="1.5"/><rect x="29" y="41" width="3" height="5" rx="1.5"/><rect x="34" y="41" width="3" height="5" rx="1.5"/><rect x="39" y="41" width="3" height="5" rx="1.5"/></g></svg>';
  }

  function init() {
    var root = d.createElement('div');
    root.className = 'msg';
    root.id = 'ms-guide';
    root.innerHTML =
      '<div class="msg-sr" aria-live="polite" role="status"></div>' +
      '<div class="msg-burst" aria-hidden="true"></div>' +
      '<div class="msg-bubble"><span class="msg-e" aria-hidden="true"></span><p class="msg-t" aria-hidden="true"></p><button type="button" class="msg-x" aria-label="Fermer la bulle">×</button></div>' +
      '<section class="msg-panel" role="dialog" aria-modal="false" aria-labelledby="ms-g-t" tabindex="-1">' +
      '<div class="msg-hd">' + av() + '<div><b id="ms-g-t">Assistant virtuel</b><small>Guide de Marketing Succès</small></div>' +
      '<button type="button" class="msg-x msg-min" aria-label="Réduire l’assistant">×</button></div>' +
      '<div class="msg-log"></div><div class="msg-chips"></div>' +
      '<p class="msg-note">Assistant scripté : il vous guide sur le site. Pour une réponse personnalisée, écrivez-nous sur WhatsApp.</p></section>' +
      '<button type="button" class="msg-btn" aria-label="Ouvrir l’assistant virtuel" aria-expanded="false">' + av() + '<i class="msg-ring"></i><i class="msg-dot"></i></button>';
    d.body.appendChild(root);

    var $ = function (s) { return root.querySelector(s); };
    var live = $('.msg-sr'), bub = $('.msg-bubble'), bt = $('.msg-t'), be = $('.msg-e'), btn = $('.msg-btn'),
      panel = $('.msg-panel'), log = $('.msg-log'), burstEl = $('.msg-burst');
    var chips = $('.msg-chips');
    CHIPS.forEach(function (c) {
      var a = d.createElement('a');
      a.className = 'msg-chip' + (c[2] ? ' wa' : '');
      a.href = c[1]; a.textContent = c[0];
      if (c[2]) { a.target = '_blank'; a.rel = 'noopener'; }
      chips.appendChild(a);
    });

    var isOpen = false, typeI = 0, hideW = null, lastTip = 0, pend = null, pendW = null, hist = S.h;
    if (!S.c) root.classList.add('ring');

    function wait(ms, fn) {
      var el = 0, h = { i: setInterval(function () { if (!d.hidden) { el += 250; if (el >= ms) { clearInterval(h.i); fn(); } } }, 250) };
      return h;
    }
    function stop(h) { if (h) clearInterval(h.i); }

    function line(m) {
      var r = d.createElement('div'), e = d.createElement('span'), p = d.createElement('p');
      r.className = 'msg-m'; e.setAttribute('aria-hidden', 'true'); e.textContent = m[1]; p.textContent = m[0];
      r.appendChild(e); r.appendChild(p); return r;
    }
    function render() {
      log.textContent = '';
      log.appendChild(line(['Bonjour, je suis l’assistant virtuel de Marketing Succès (pas un humain). Je vous guide sur le site.', '👋']));
      hist.forEach(function (m) { log.appendChild(line(m)); });
      log.scrollTop = log.scrollHeight;
    }
    function rec(txt, e) {
      hist.push([txt, e]); if (hist.length > 4) hist.shift();
      S.h = hist; save();
      if (isOpen) render();
    }
    function announce(txt) { live.textContent = ''; setTimeout(function () { live.textContent = txt; }, 60); }

    function hideBubble() { bub.classList.remove('on'); root.classList.remove('speak'); clearInterval(typeI); stop(hideW); }

    function say(txt, e) {
      rec(txt, e);
      if (isOpen || S.d) { if (!isOpen) root.classList.add('new'); announce(txt); return; }
      hideBubble();
      announce(txt);
      if (narrow.matches) { root.classList.add('new'); return; }
      be.textContent = e; bt.textContent = '';
      be.style.animation = 'none'; void be.offsetWidth; be.style.animation = '';
      bub.classList.add('on');
      var done = function () {
        root.classList.remove('speak');
        hideW = wait(6500 + txt.length * 40, hideBubble);
      };
      if (rm || d.hidden) { bt.textContent = txt; return done(); }
      var i = 0;
      root.classList.add('speak');
      typeI = setInterval(function () {
        bt.textContent = txt.slice(0, ++i);
        if (i >= txt.length) { clearInterval(typeI); done(); }
      }, 24);
    }

    function burst() {
      if (rm) return;
      var em = ['🎉', '✨', '⭐', '✅', '🎊', '💫', '🚀', '🤩'];
      em.forEach(function (c, i) {
        var s = d.createElement('span'), a = (i / em.length) * Math.PI - Math.PI;
        s.textContent = c;
        s.style.cssText = '--dx:' + Math.round(Math.cos(a) * -70 + 20) + 'px;--dy:' + Math.round(Math.sin(a) * 90 - 20) + 'px;--r:' + (i % 2 ? 40 : -40) + 'deg;animation-delay:' + i * 60 + 'ms';
        burstEl.appendChild(s);
      });
      setTimeout(function () { burstEl.textContent = ''; }, 2200);
    }

    /* tip(clé, texte, emoji, [vérif encore pertinent], [célébration]) : une fois par clé, espacé d'un délai minimal */
    function tip(k, txt, e, chk, cel, gap) {
      if (S.s[k]) return;
      var now = Date.now(), g = gap || 7000;
      if (!isOpen && !S.d && now - lastTip < g) {
        pend = [k, txt, e, chk, cel, gap]; stop(pendW);
        pendW = wait(g - (now - lastTip) + 100, function () { var p = pend; pend = null; if (p && (!p[3] || p[3]())) tip.apply(null, p); });
        return;
      }
      S.s[k] = 1; lastTip = now; save();
      say(txt, e);
      if (cel && !narrow.matches) burst();
    }
    window.__msGuide = { tip: tip, say: say, open: function () { openP(); }, state: S };

    function openP(focus) {
      if (isOpen) return;
      isOpen = true; S.o = 1; S.c = 1; save();
      hideBubble(); stop(pendW); render();
      root.classList.add('open'); root.classList.remove('new', 'ring');
      btn.setAttribute('aria-expanded', 'true');
      if (focus !== false) panel.focus({ preventScroll: true });
    }
    function closeP(back) {
      if (!isOpen) return;
      isOpen = false; S.o = 0; S.d = 1; save();
      root.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      if (back) btn.focus();
    }
    btn.addEventListener('click', function () { isOpen ? closeP(true) : openP(); });
    $('.msg-min').addEventListener('click', function () { closeP(true); });
    $('.msg-bubble .msg-x').addEventListener('click', function (ev) { ev.stopPropagation(); hideBubble(); S.d = 1; save(); });
    bub.addEventListener('click', function () { openP(); });
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && isOpen) closeP(true); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) root.classList.remove('speak'); });

    /* regard qui suit le pointeur */
    if (!rm && matchMedia('(pointer:fine)').matches) {
      var px = 0, py = 0, raf = 0;
      var clamp = function (v) { return Math.max(-1, Math.min(1, v)) * 2.4; };
      d.addEventListener('pointermove', function (ev) {
        px = ev.clientX; py = ev.clientY;
        if (raf || d.hidden) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = btn.getBoundingClientRect();
          root.style.setProperty('--ex', clamp((px - r.left - r.width / 2) / 400).toFixed(2));
          root.style.setProperty('--ey', clamp((py - r.top - r.height / 2) / 400).toFixed(2));
        });
      }, { passive: true });
    }

    if (S.o && !narrow.matches) openP(false);

    /* accueil + contexte */
    var first = !S.g;
    if (page === 'index.html' || page === '') {
      if (first) {
        wait(2500, function () {
          if (S.g) return;
          S.g = 1; lastTip = Date.now(); save();
          root.classList.add('wave');
          say('Bonjour ! Je suis l’assistant virtuel de Marketing Succès : je vous guide sur le site.', '👋');
        });
      }
      if ('IntersectionObserver' in window) {
        var vis = {};
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            var id = en.target.id || 'final';
            vis[id] = en.isIntersecting;
            if (en.isIntersecting && SECTIONS[id]) tip('s-' + id, SECTIONS[id][0], SECTIONS[id][1], function () { return vis[id]; });
          });
        }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });
        d.querySelectorAll('#offres,#maroc,#methode,#realisations,#histoire,#faq,.final').forEach(function (s) { io.observe(s); });
      }
    } else {
      S.g = 1;
      var lastTitle = '';
      var check = function () {
        var t = d.getElementById('step-title');
        if (!t || t.textContent === lastTitle) return;
        lastTitle = t.textContent;
        for (var i = 0; i < STEPS.length; i++) {
          if (lastTitle.indexOf(STEPS[i][0]) > -1) {
            tip('p-' + STEPS[i][0], STEPS[i][1], STEPS[i][2], null, STEPS[i][3], 2500);
            return;
          }
        }
      };
      var mo, obsStep = null;
      var attach = function () {
        var st = d.getElementById('step');
        if (!st || st === obsStep) return;
        obsStep = st;
        new MutationObserver(check).observe(st, { childList: true, subtree: true, characterData: true });
        wait(2500, check);
      };
      attach();
      if (!obsStep) {
        mo = new MutationObserver(function () { attach(); if (obsStep) mo.disconnect(); });
        mo.observe(d.body, { childList: true, subtree: true });
      }
      var dash = d.getElementById('dash');
      if (dash) {
        var welcome = function () {
          if (!dash.hidden) { tip('p-dash', 'Bienvenue ! Prenez votre temps, le questionnaire se remplit à votre rythme.', '👋', null, 0, 2500); return true; }
        };
        if (!welcome()) {
          var mo2 = new MutationObserver(function () { if (welcome()) mo2.disconnect(); });
          mo2.observe(dash, { attributes: true, attributeFilter: ['hidden'] });
        }
      }
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
