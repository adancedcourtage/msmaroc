/* Espace client : connexion par code (vérifié côté serveur, api/login.js) puis affichage du contenu protégé (api/espace.js). */
(function () {
  var loginBox = document.getElementById('login');
  var dash = document.getElementById('dash');
  var form = document.getElementById('login-form');
  var input = document.getElementById('code');
  var err = document.getElementById('login-err');
  var btn = form && form.querySelector('button[type="submit"]');
  var logout = document.getElementById('logout');

  function loadScript(src) {
    return new Promise(function (ok, ko) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = ko;
      document.body.appendChild(s);
    });
  }

  function show(data) {
    dash.innerHTML = data.html;
    var cfg = document.createElement('script');
    cfg.textContent = data.script;
    document.body.appendChild(cfg);
    loginBox.hidden = true;
    dash.hidden = false;
    if (logout) logout.hidden = false;
    loadScript('js/form-engine.js').catch(function () {
      dash.insertAdjacentHTML('afterbegin', '<p class="warn">Le questionnaire n’a pas pu se charger. Rechargez la page.</p>');
    });
    window.scrollTo(0, 0);
  }

  function fetchEspace() {
    return fetch('/api/espace', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw r;
      return r.json();
    });
  }

  fetchEspace().then(show).catch(function () { /* pas de session : le formulaire de connexion reste affiché */ });

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    var code = input.value.trim();
    if (!code) { err.textContent = 'Saisissez votre code d’accès.'; input.focus(); return; }
    btn.disabled = true; btn.textContent = 'Vérification…';
    fetch('/api/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code: code })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || 'Service momentanément indisponible. Contactez-nous sur WhatsApp.');
        return fetchEspace();
      });
    }).then(function (d) { input.value = ''; show(d); })
      .catch(function (ex) { err.textContent = ex.message || 'Service momentanément indisponible. Contactez-nous sur WhatsApp.'; })
      .then(function () { btn.disabled = false; btn.textContent = 'Accéder à mon espace'; });
  });

  if (logout) logout.addEventListener('click', function () {
    fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).then(function () { location.reload(); });
  });
})();
