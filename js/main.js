// ===== Année dynamique =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== FAQ accordion =====
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// ===== Menu mobile =====
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
toggle.addEventListener('click', () => {
  const shown = links.style.display === 'flex';
  links.style.display = shown ? 'none' : 'flex';
  toggle.setAttribute('aria-expanded', String(!shown));
  if (!shown) {
    links.style.cssText += 'position:absolute;top:64px;left:0;right:0;background:rgba(5,7,15,0.97);flex-direction:column;padding:24px 32px;border-bottom:1px solid rgba(148,163,209,0.14);';
  }
});
// Fermer le menu mobile au clic sur un lien
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth <= 980) { links.style.display = 'none'; toggle.setAttribute('aria-expanded', 'false'); }
}));

// ===== Header au scroll =====
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

// ===== Scroll reveal =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== Nav active selon la section =====
const sections = document.querySelectorAll('section[id]');
const navMap = {};
document.querySelectorAll('.nav-links a').forEach(a => {
  const id = a.getAttribute('href').replace('#', '');
  if (id) navMap[id] = a;
});
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      Object.values(navMap).forEach(a => a.classList.remove('active'));
      const link = navMap[e.target.id];
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => navObserver.observe(s));

// ===== Validation & envoi du formulaire =====
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = form.querySelector('.form-note');
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const ok = field.checkValidity();
      field.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      note.textContent = 'Merci de remplir les champs obligatoires.';
      note.classList.remove('success');
      return;
    }
    // Envoi via client mail (remplaçable par un backend / Formspree)
    const data = new FormData(form);
    const subject = encodeURIComponent('Demande de devis — ' + (data.get('service') || 'Projet'));
    const body = encodeURIComponent(
      `Nom : ${data.get('name')}\nEntreprise : ${data.get('company') || '-'}\nEmail : ${data.get('email')}\nTéléphone : ${data.get('phone') || '-'}\nService : ${data.get('service')}\n\nProjet :\n${data.get('message') || '-'}`
    );
    window.location.href = `mailto:contact@marketingsuccess.fr?subject=${subject}&body=${body}`;
    note.textContent = 'Merci, votre client mail va s\'ouvrir pour finaliser l\'envoi.';
    note.classList.add('success');
    form.reset();
  });
}

// ===== Réseau animé du hero =====
const canvas = document.getElementById('network-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, points = [];
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  function initPoints() {
    points = [];
    const count = Math.min(60, Math.floor((w * h) / 22000));
    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    points.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    });
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
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,154,31,0.75)';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { resize(); initPoints(); });
  resize(); initPoints();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(); }
}
