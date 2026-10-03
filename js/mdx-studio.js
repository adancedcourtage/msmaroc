// ============================================================
// mdx-studio.js — traduction vanilla JS (sans React) de la logique
// du composant "MDX Studio.dc.html" (claude_design) : loader,
// scène Three.js du hero, Lenis, reveals GSAP/ScrollTrigger,
// cartes tilt, galerie cursor-follow, compteurs, CTA géant.
// Couleurs de marque Marketing Success (cyan/orange) au lieu des
// couleurs par défaut du design.
// ============================================================

(function () {
  var isMobileWidth = window.matchMedia('(max-width: 760px)').matches;
  var CONFIG = {
    accentPrimary: '#22d3ee',
    accentSecondary: '#ff9a1f',
    loaderDuration: isMobileWidth ? 1.3 : 2.2,
  };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Vrai pointeur souris (hover + précis) : sur tactile ces media queries sont
  // fausses, ce qui évite d'attacher des écouteurs mousemove inutiles (tilt,
  // magnétisme, cursor-follow) qui ne se déclenchent jamais au doigt mais
  // coûtent quand même de l'attention/mémoire sur mobile.
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function waitForLibs(names, cb, timeoutMs) {
    var done = false;
    var check = function () {
      if (done) return;
      if (names.every(function (n) { return window[n]; })) {
        done = true;
        cb();
      } else {
        setTimeout(check, 60);
      }
    };
    check();
    setTimeout(function () {
      if (!done) { done = true; cb(); }
    }, timeoutMs || 4000);
  }

  function boot() {
    var root = document.querySelector('.mdx-root');
    if (!root) return;

    var hasGsap = !!window.gsap;
    var hasScrollTrigger = hasGsap && !!window.ScrollTrigger;
    if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    // Lenis n'apporte rien au doigt (le scroll tactile natif est déjà fluide)
    // et lui laisser tourner sur mobile ajoute juste du travail JS par frame.
    if (window.Lenis && hasGsap && !prefersReducedMotion && hasFinePointer) initLenis();

    initNavToggle(root);
    initFaq(root);
    initLoader(root, hasGsap);
    if (window.THREE) initThree(root);
    initScrollReveal(root, hasGsap, hasScrollTrigger);
    initCounters(root, hasGsap, hasScrollTrigger);
    initHeroSideVideos(root);
    initContactForm(root);
    // Effets pilotés par la souris : inutiles (et jamais déclenchés) au doigt,
    // on ne les attache donc que si un vrai pointeur fin est détecté.
    if (hasFinePointer) {
      initMagnetic(root, hasGsap);
      initTilt(root, hasGsap);
      initPortfolio(root, hasGsap, hasScrollTrigger);
      initCtaTilt(root, hasGsap);
    } else {
      initPortfolioScrollOnly(root, hasGsap, hasScrollTrigger);
    }
  }

  // ---------- Menu mobile (nav pill -> panneau déroulant animé) ----------
  function initNavToggle(root) {
    var toggle = root.querySelector('.mdx-nav-toggle');
    var links = root.querySelector('.mdx-nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('is-open', !open);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('is-open');
      });
    });
  }

  // ---------- FAQ (accordéon, une question ouverte à la fois) ----------
  function initFaq(root) {
    var items = root.querySelectorAll('.mdx-faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.mdx-faq-q');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          var otherBtn = other.querySelector('.mdx-faq-q');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ---------- Smooth scroll (Lenis) ----------
  function initLenis() {
    try {
      var lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.documentElement.classList.add('has-lenis');
    } catch (e) { /* CDN capricieux : scroll natif, rien de cassé */ }
  }

  // ---------- Loader ----------
  function initLoader(root, hasGsap) {
    var countEl = root.querySelector('.mdx-loader-count');
    var loaderEl = root.querySelector('.mdx-loader');
    if (!countEl || !loaderEl) return;

    if (prefersReducedMotion || !hasGsap) {
      loaderEl.style.display = 'none';
      revealHero(root, hasGsap);
      return;
    }

    var counter = { val: 0 };
    gsap.to(counter, {
      val: 100,
      duration: CONFIG.loaderDuration,
      ease: 'power2.inOut',
      onUpdate: function () { countEl.textContent = Math.round(counter.val) + '%'; },
      onComplete: function () {
        gsap.to(loaderEl, {
          yPercent: -100,
          duration: 1.1,
          ease: 'power4.inOut',
          onComplete: function () {
            loaderEl.style.display = 'none';
            revealHero(root, hasGsap);
          },
        });
      },
    });
  }

  function revealHero(root, hasGsap) {
    var els = root.querySelectorAll('.mdx-reveal');
    if (hasGsap) {
      gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 });
    } else {
      els.forEach(function (el) { el.style.opacity = 1; });
    }
  }

  // ---------- Vidéos flanquantes hero : lazy-load via IntersectionObserver ----------
  // reduced-motion : rien n'est chargé, le poster (déjà dans le HTML) reste figé.
  function initHeroSideVideos(root) {
    if (prefersReducedMotion) return;
    var wraps = root.querySelectorAll('[data-hero-video]');
    if (!wraps.length) return;

    var load = function (wrap) {
      var video = wrap.querySelector('video');
      if (!video) return;
      var sources = video.querySelectorAll('source[data-src]');
      sources.forEach(function (s) { s.src = s.dataset.src; s.removeAttribute('data-src'); });
      video.load();
      video.play().catch(function () { /* autoplay bloqué (rare, muted+playsinline déjà posés) : poster reste affiché */ });
    };

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { load(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.15 });
      wraps.forEach(function (w) { io.observe(w); });
    } else {
      wraps.forEach(load);
    }
  }

  // ---------- Formulaire de contact (FormSubmit.co ajax, sans backend) ----------
  function initContactForm(root) {
    var form = root.querySelector('#mdx-contact-form');
    var status = root.querySelector('#mdx-form-status');
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Honeypot : un champ rempli = bot, on affiche un succès factice sans envoyer.
      var honey = form.querySelector('.mdx-form-honey');
      if (honey && honey.value) {
        status.textContent = 'Merci, votre demande a bien été envoyée.';
        status.className = 'mdx-form-status is-ok';
        form.reset();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      var originalLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
      status.textContent = '';
      status.className = 'mdx-form-status';

      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('bad status');
          status.textContent = 'Merci, votre demande a bien été envoyée. Nous revenons vers vous rapidement.';
          status.className = 'mdx-form-status is-ok';
          form.reset();
        })
        .catch(function () {
          status.textContent = 'Une erreur est survenue. Contactez-nous directement sur WhatsApp ci-dessous.';
          status.className = 'mdx-form-status is-error';
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
        });
    });
  }

  // ---------- Boutons magnétiques ----------
  function initMagnetic(root, hasGsap) {
    if (!hasGsap) return;
    var els = root.querySelectorAll('[data-magnetic]');
    els.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var relX = e.clientX - (r.left + r.width / 2);
        var relY = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: relX * 0.35, y: relY * 0.35, duration: 0.3, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' });
      });
    });
  }

  // ---------- Reveal des cartes services au scroll ----------
  function initScrollReveal(root, hasGsap, hasScrollTrigger) {
    var cards = root.querySelectorAll('.mdx-card');
    if (hasGsap && hasScrollTrigger) {
      cards.forEach(function (card) {
        // Décalage d'entrée léger si la carte porte --i (ex: cartes témoignages),
        // pour une cascade au lieu d'un pop-in synchronisé.
        var iRaw = card.style.getPropertyValue('--i');
        var stagger = iRaw ? parseFloat(iRaw) * 0.12 : 0;
        gsap.to(card, { opacity: 1, y: 0, duration: 0.9, delay: stagger, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%' } });
      });
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.transition = 'opacity .6s ease, transform .6s ease';
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      cards.forEach(function (card) { io.observe(card); });
    } else {
      cards.forEach(function (card) { card.style.opacity = 1; card.style.transform = 'none'; });
    }
  }

  // ---------- Tilt 3D des cartes ----------
  function initTilt(root, hasGsap) {
    var cards = root.querySelectorAll('.mdx-card');
    cards.forEach(function (card) {
      var glow = card.querySelector('.mdx-card-glow');
      var img = card.querySelector('.mdx-card-img img');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rotateX = (0.5 - py) * 14;
        var rotateY = (px - 0.5) * 14;
        if (hasGsap) {
          gsap.to(card, { rotateX: rotateX, rotateY: rotateY, duration: 0.4, ease: 'power2.out', transformPerspective: 700 });
        } else {
          card.style.transform = 'perspective(700px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        }
        if (glow) glow.style.background = 'radial-gradient(circle at ' + (px * 100) + '% ' + (py * 100) + '%, rgba(255,255,255,0.16), transparent 60%)';
      });
      card.addEventListener('mouseenter', function () {
        if (glow) glow.style.opacity = '1';
        if (img) {
          if (hasGsap) gsap.to(img, { scale: 1.18, duration: 0.7, ease: 'power3.out' });
          else img.style.transform = 'scale(1.18)';
        }
      });
      card.addEventListener('mouseleave', function () {
        if (hasGsap) {
          gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
        } else {
          card.style.transform = 'none';
        }
        if (glow) glow.style.opacity = '0';
        if (img) {
          if (hasGsap) gsap.to(img, { scale: 1.08, duration: 0.7, ease: 'power3.out' });
          else img.style.transform = 'scale(1.08)';
        }
      });
    });
  }

  // ---------- Galerie : cursor-follow + parallaxe scroll ----------
  function initPortfolio(root, hasGsap, hasScrollTrigger) {
    var cursor = root.querySelector('.mdx-cursor-follow');
    var cards = root.querySelectorAll('.mdx-portfolio-card');
    if (!cursor || !cards.length) return;

    if (hasGsap) {
      var quickX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
      var quickY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
      document.addEventListener('mousemove', function (e) { quickX(e.clientX); quickY(e.clientY); });
    }

    cards.forEach(function (card) {
      var img = card.querySelector('.mdx-portfolio-img');
      card.addEventListener('mouseenter', function () {
        if (hasGsap) {
          gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
          if (img) gsap.to(img, { scale: 1.15, duration: 0.6, ease: 'power3.out' });
        } else {
          cursor.style.opacity = 1;
          if (img) img.style.transform = 'scale(1.15)';
        }
      });
      card.addEventListener('mouseleave', function () {
        if (hasGsap) {
          gsap.to(cursor, { opacity: 0, scale: 0.7, duration: 0.25, ease: 'power2.out' });
          if (img) gsap.to(img, { scale: 1.05, duration: 0.6, ease: 'power3.out' });
        } else {
          cursor.style.opacity = 0;
          if (img) img.style.transform = 'scale(1.05)';
        }
      });
      if (img && hasGsap && hasScrollTrigger) {
        gsap.fromTo(img, { y: -20 }, { y: 20, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }
    });
  }

  // ---------- Galerie sur tactile : garde la parallaxe scroll (pas de pointeur requis), saute le cursor-follow ----------
  function initPortfolioScrollOnly(root, hasGsap, hasScrollTrigger) {
    if (!hasGsap || !hasScrollTrigger) return;
    var cards = root.querySelectorAll('.mdx-portfolio-card');
    cards.forEach(function (card) {
      var img = card.querySelector('.mdx-portfolio-img');
      if (!img) return;
      gsap.fromTo(img, { y: -14 }, { y: 14, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
  }

  // ---------- Compteurs animés ----------
  function initCounters(root, hasGsap, hasScrollTrigger) {
    var nums = root.querySelectorAll('.mdx-stat-num, .mdx-proof-num');
    var run = function (el) {
      var target = parseFloat(el.dataset.target || '0');
      var suffix = el.dataset.suffix || '';
      var decimals = parseInt(el.dataset.decimals || '0', 10);
      if (prefersReducedMotion || !hasGsap) {
        el.textContent = (decimals ? target.toFixed(decimals).replace('.', ',') : Math.round(target)) + suffix;
        return;
      }
      var proxy = { val: 0 };
      gsap.to(proxy, {
        val: target, duration: 1.8, ease: 'power2.out',
        onUpdate: function () {
          var v = decimals ? proxy.val.toFixed(decimals).replace('.', ',') : Math.round(proxy.val);
          el.textContent = v + suffix;
        },
      });
    };
    if (hasGsap && hasScrollTrigger) {
      nums.forEach(function (el) {
        // 'top 99%' (pas 88%) : un élément déjà dans le premier écran (ex: le
        // compteur du hero) doit se déclencher sans exiger un micro-scroll.
        ScrollTrigger.create({ trigger: el, start: 'top 99%', once: true, onEnter: function () { run(el); } });
      });
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.2 });
      nums.forEach(function (el) { io.observe(el); });
    } else {
      nums.forEach(run);
    }
  }

  // ---------- Tilt du CTA géant ----------
  function initCtaTilt(root, hasGsap) {
    if (!hasGsap) return;
    var wrap = root.querySelector('.mdx-cta-giant');
    var text = wrap ? wrap.querySelector('.mdx-cta-text') : null;
    if (!wrap || !text) return;
    wrap.addEventListener('mousemove', function (e) {
      var r = wrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      gsap.to(text, { rotateX: (0.5 - py) * 10, rotateY: (px - 0.5) * 10, duration: 0.5, ease: 'power2.out', transformPerspective: 900 });
    });
    wrap.addEventListener('mouseleave', function () {
      gsap.to(text, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' });
    });
  }

  // ---------- Scène 3D Three.js du hero ----------
  function initThree(root) {
    var canvas = root.querySelector('#mdx-hero-canvas');
    if (!canvas || prefersReducedMotion) return;

    // Scène allégée sur mobile : moins de particules, pas d'anti-aliasing,
    // pixel ratio plafonné — coûteux en GPU/batterie sinon sur petit écran.
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !isMobileWidth });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileWidth ? 1.5 : 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 5;

    function resize() {
      var w = canvas.clientWidth || 1;
      var h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var count = isMobileWidth ? 500 : 1800;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var colorA = new THREE.Color(CONFIG.accentPrimary);
    var colorB = new THREE.Color(CONFIG.accentSecondary);
    for (var i = 0; i < count; i++) {
      var r = 1.8 + Math.random() * 0.15;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      var mixed = colorA.clone().lerp(colorB, Math.random());
      colors[i * 3] = mixed.r; colors[i * 3 + 1] = mixed.g; colors[i * 3 + 2] = mixed.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    var points = new THREE.Points(geo, mat);
    scene.add(points);

    var torusGeo = new THREE.TorusGeometry(2.4, 0.015, 16, 100);
    var torusMat = new THREE.MeshBasicMaterial({ color: colorA, transparent: true, opacity: 0.3 });
    var torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 3;
    scene.add(torus);

    var mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    });

    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      points.rotation.y = t * 0.08 + mouseX * 0.6;
      points.rotation.x = mouseY * 0.4;
      torus.rotation.z = t * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    var heroEl = root.querySelector('.mdx-hero');
    if (window.gsap && window.ScrollTrigger) {
      gsap.to(points.rotation, { z: Math.PI * 2, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.to(camera.position, { z: 8, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: 1 } });
    }

    // Repli scroll direct (toujours actif, indépendant de ScrollTrigger)
    window.addEventListener('scroll', function () {
      var s = window.scrollY || window.pageYOffset || 0;
      torus.rotation.y = s * 0.002;
      var scale = 1 + Math.min(s * 0.0006, 0.6);
      points.scale.set(scale, scale, scale);
      camera.position.z = 5 + Math.min(s * 0.003, 3);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      waitForLibs(['THREE', 'gsap'], boot, 4000);
    });
  } else {
    waitForLibs(['THREE', 'gsap'], boot, 4000);
  }
})();
