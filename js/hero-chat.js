/* Hero : conversation WhatsApp animee. Amelioration progressive : sans JS ou avec
   prefers-reduced-motion, la conversation finale statique reste affichee. */
(function () {
  'use strict';
  var root = document.getElementById('hero-visual');
  if (!root || !window.requestAnimationFrame) return;
  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq && mq.matches) return;

  var chat = root.querySelector('.chat');
  var msgs = [].slice.call(root.querySelectorAll('.msg'));
  var status = root.querySelector('[data-status]');
  var typed = root.querySelector('[data-typed]');
  var send = root.querySelector('.send');
  var chips = {};
  [].forEach.call(root.querySelectorAll('[data-chip]'), function (c) { chips[c.getAttribute('data-chip')] = c; });

  /* Decoupe chaque texte en mots/caracteres (le texte complet reste dans le DOM) */
  function split(el) {
    var out = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            for (var i = 0; i < part.length; i++) {
              var c = document.createElement('span'); c.className = 'ch'; c.textContent = part[i];
              w.appendChild(c); out.push(c);
            }
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }
  var chars = msgs.map(function (m) { return split(m.querySelector('.t')); });
  var PAY = (msgs[0].querySelector('.t').textContent).indexOf('Vous payez');
  var REPLY = 'Oui, je confirme ✓';

  root.classList.add('hc');

  var gen = 0, running = false, visible = true, inView = true;
  function sync() { running = visible && inView; }
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(root);
  }
  visible = !document.hidden; sync();

  /* Attente basee sur rAF, figee quand l'onglet est cache ou le hero hors ecran */
  function tween(ms, step, g) {
    return new Promise(function (res, rej) {
      var acc = 0, last = null;
      function f(t) {
        if (g !== gen) return rej('stop');
        if (last !== null && running) acc += Math.min(t - last, 100);
        last = t;
        if (step) step(Math.min(acc / ms, 1));
        if (acc >= ms) res(); else requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    });
  }
  function wait(ms, g) { return tween(ms, null, g); }
  function typeChars(list, per, g, onIdx) {
    var shown = 0;
    return tween(list.length * per, function (p) {
      var n = Math.round(p * list.length);
      while (shown < n) { list[shown].classList.add('on'); if (onIdx) onIdx(shown); shown++; }
    }, g);
  }
  function setStatus(typing) {
    status.textContent = typing ? 'en train d’écrire…' : 'en ligne';
    status.classList.toggle('typing', typing);
  }
  function light(k) {
    var c = chips[k]; if (!c) return;
    c.classList.add('lit'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
  }
  function reset() {
    msgs.forEach(function (m, i) {
      m.className = m.className.replace(/\b(show|typing|done|delivered|read)\b/g, '').replace(/\s+/g, ' ').trim();
      chars[i].forEach(function (c) { c.classList.remove('on'); });
    });
    Object.keys(chips).forEach(function (k) { chips[k].classList.remove('lit', 'pulse'); });
    typed.textContent = ''; typed.classList.remove('on'); setStatus(false);
  }
  function incoming(i, g, cb) {
    var m = msgs[i];
    setStatus(true); m.classList.add('show', 'typing');
    return wait(1300, g).then(function () {
      m.classList.remove('typing'); setStatus(false);
      return typeChars(chars[i], 30, g, cb);
    }).then(function () { m.classList.add('done'); });
  }

  function cycle(g) {
    reset();
    chat.classList.remove('fade');
    return wait(700, g)
      .then(function () { return incoming(0, g, function (idx) { if (idx === PAY) light('a'); }); })
      .then(function () { return wait(900, g); })
      .then(function () {
        typed.classList.add('on'); var n = 0;
        return tween(REPLY.length * 45, function (p) {
          var k = Math.round(p * REPLY.length);
          if (k !== n) { n = k; typed.textContent = REPLY.slice(0, k); }
        }, g);
      })
      .then(function () { return wait(350, g); })
      .then(function () {
        send.classList.add('tap'); typed.textContent = ''; typed.classList.remove('on');
        var m = msgs[1]; m.classList.add('show');
        chars[1].forEach(function (c) { c.classList.add('on'); });
        m.classList.add('done'); light('b');
        return wait(150, g).then(function () { send.classList.remove('tap'); return wait(450, g); })
          .then(function () { m.classList.add('delivered'); return wait(650, g); })
          .then(function () { m.classList.add('read'); return wait(700, g); });
      })
      .then(function () { return incoming(2, g, function (idx) { if (idx === 0) light('c'); }); })
      .then(function () { return wait(3000, g); })
      .then(function () { chat.classList.add('fade'); return wait(600, g); });
  }
  function loop() {
    var g = ++gen;
    cycle(g).then(function () { if (g === gen) loop(); }, function () {});
  }
  loop();

  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) {
    if (e.matches) { gen++; root.classList.remove('hc'); chat.classList.remove('fade'); }
  });
})();
