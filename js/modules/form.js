// ===== Formulaire de contact interactif =====
// Conserve intégralement la logique d'envoi FormSubmit + WhatsApp existante.
// Ajoute : validation en temps réel (blur puis input si déjà touché), messages
// d'erreur explicites, coche de validité, compteur de caractères, barre de
// complétion, états de soumission sans saut de layout, panneaux succès / échec.

import { qs, qsa } from './utils.js';

// Destination des leads. UNIQUE réglage à changer le jour où l'adresse est connue.
const CONTACT_EMAIL = 'contact@marketingsuccess.fr';
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + encodeURIComponent(CONTACT_EMAIL);
const WA_NUMBER = '212600000000'; // format international sans +
const MSG_MAX = 500;

const SPINNER_SVG =
  '<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-dasharray="44" stroke-dashoffset="14"/></svg>';

const CHECK_SVG =
  '<svg class="field-check" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
  '<path d="M20 6 L9 17 l-5 -5" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';

const MESSAGES = {
  name: 'Merci d\'indiquer votre nom.',
  email: 'Format d\'email invalide — ex. nom@entreprise.com',
  default: 'Ce champ est requis.',
};

function fieldMessage(field) {
  if (field.name === 'email') return MESSAGES.email;
  if (field.name === 'name') return MESSAGES.name;
  return MESSAGES.default;
}

export function initForm() {
  const form = qs('#contact-form');
  if (!form) return;

  const note = qs('.form-note', form);
  const submitBtn = form.querySelector('button[type="submit"]');
  const waBtn = qs('#send-wa', form);
  const fields = qsa('input, textarea, select', form);
  const message = qs('#f-message', form);

  // --- Injection des équipements par champ (erreur + coche) ---
  fields.forEach((field) => {
    if (field.tagName === 'SELECT') return;
    const wrapper = field.parentElement;
    wrapper.classList.add('field');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    err.id = field.id + '-error';
    wrapper.appendChild(err);
    if (field.hasAttribute('required')) {
      field.insertAdjacentHTML('afterend', CHECK_SVG);
      field.setAttribute('aria-describedby', err.id);
    }
  });

  // --- Compteur de caractères sur le message ---
  let counter = null;
  if (message) {
    message.setAttribute('maxlength', String(MSG_MAX));
    counter = document.createElement('span');
    counter.className = 'char-counter';
    counter.textContent = '0/' + MSG_MAX;
    message.parentElement.classList.add('field');
    message.parentElement.appendChild(counter);
    message.addEventListener('input', updateCounter);
  }
  function updateCounter() {
    const len = message.value.length;
    counter.textContent = len + '/' + MSG_MAX;
    counter.classList.toggle('warn', len >= MSG_MAX * 0.9);
  }

  // --- Barre de complétion, injectée au-dessus des actions ---
  const actions = qs('.form-actions', form);
  const progressWrap = document.createElement('div');
  progressWrap.className = 'form-progress';
  progressWrap.innerHTML = '<div class="form-progress-bar"></div>';
  progressWrap.setAttribute('aria-hidden', 'true');
  if (actions) form.insertBefore(progressWrap, actions);
  const progressBar = qs('.form-progress-bar', progressWrap);

  function updateProgress() {
    const relevant = fields.filter((f) => f.type !== 'hidden');
    const filled = relevant.filter((f) => f.value.trim() !== '').length;
    const pct = relevant.length ? Math.round((filled / relevant.length) * 100) : 0;
    progressBar.style.transform = 'scaleX(' + pct / 100 + ')';
    // Le glow du bouton submit croît avec la complétion.
    if (submitBtn) submitBtn.style.setProperty('--fill', String(pct / 100));
  }

  // --- Validation d'un champ ---
  function validateField(field) {
    if (field.tagName === 'SELECT') return true;
    const ok = field.checkValidity();
    field.classList.toggle('invalid', !ok && field.dataset.touched === '1');
    field.classList.toggle('valid', ok && field.value.trim() !== '' && field.hasAttribute('required'));
    const err = qs('#' + field.id + '-error');
    if (err) {
      if (!ok && field.dataset.touched === '1') {
        err.textContent = fieldMessage(field);
        err.classList.add('show');
      } else {
        err.classList.remove('show');
      }
    }
    return ok;
  }

  fields.forEach((field) => {
    field.addEventListener('blur', () => {
      field.dataset.touched = '1';
      validateField(field);
    });
    field.addEventListener('input', () => {
      if (field.dataset.touched === '1') validateField(field);
      updateProgress();
    });
    field.addEventListener('change', updateProgress);
  });
  updateProgress();

  // --- Validation globale au submit ---
  function validateAll() {
    let valid = true;
    fields.forEach((field) => {
      if (!field.hasAttribute('required')) return;
      field.dataset.touched = '1';
      if (!validateField(field)) {
        valid = false;
        field.classList.remove('shake');
        // Reflow pour rejouer l'animation shake.
        void field.offsetWidth;
        field.classList.add('shake');
      }
    });
    if (!valid) {
      note.textContent = 'Merci de corriger les champs signalés.';
      note.classList.remove('success');
    }
    return valid;
  }

  // --- Panneaux succès / échec ---
  const contactGrid = form.parentElement;
  let panel = null;
  function showPanel(kind, data) {
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'form-panel reveal visible';
      contactGrid.appendChild(panel);
    }
    if (kind === 'success') {
      const prenom = (data.get('name') || '').trim().split(' ')[0] || 'à vous';
      panel.className = 'form-panel form-panel--ok';
      panel.innerHTML =
        '<svg class="panel-mark" viewBox="0 0 52 52" aria-hidden="true">' +
        '<circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" ' +
        'stroke-linejoin="round" d="M14 27 l8 8 l16 -18"/></svg>' +
        '<h3>Merci ' + escapeHtml(prenom) + ', nous revenons vers vous sous 24h.</h3>' +
        '<p>Votre demande a bien été transmise à notre équipe.</p>' +
        '<button type="button" class="btn btn-ghost" data-restore>Envoyer une autre demande</button>';
    } else {
      panel.className = 'form-panel form-panel--err';
      const waHref = 'https://wa.me/' + WA_NUMBER + '?text=' +
        encodeURIComponent('Bonjour, mon envoi de formulaire a échoué. Voici ma demande : ' + waSummary(data));
      panel.innerHTML =
        '<h3>L\'envoi n\'a pas abouti.</h3>' +
        '<p>Aucun souci : joignez-nous directement, votre demande ne sera pas perdue.</p>' +
        '<div class="panel-actions">' +
        '<a class="btn btn-wa" href="' + waHref + '" target="_blank" rel="noopener">Envoyer sur WhatsApp</a>' +
        '<a class="btn btn-ghost" href="mailto:' + CONTACT_EMAIL + '">Écrire un email</a>' +
        '<button type="button" class="btn btn-ghost" data-restore>Réessayer</button>' +
        '</div>';
    }
    form.classList.add('is-folded');
    panel.querySelector('[data-restore]').addEventListener('click', restore);
    panel.querySelector('[data-restore]').focus();
  }

  function restore() {
    form.classList.remove('is-folded');
    if (panel) { panel.remove(); panel = null; }
    form.reset();
    fields.forEach((f) => { f.classList.remove('valid', 'invalid'); delete f.dataset.touched; });
    qsa('.field-error', form).forEach((e) => e.classList.remove('show'));
    if (counter) updateCounter();
    updateProgress();
    note.textContent = 'Réponse sous 24h ouvrées.';
    note.classList.remove('success');
    fields[0] && fields[0].focus();
  }

  // --- Soumission serveur (logique FormSubmit conservée) ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    const data = new FormData(form);

    if (FORM_ENDPOINT) {
      const original = submitBtn ? submitBtn.innerHTML : '';
      const width = submitBtn ? submitBtn.offsetWidth : 0;
      if (submitBtn) {
        submitBtn.style.width = width + 'px'; // fige la largeur : aucun saut (CLS 0)
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
        submitBtn.innerHTML = SPINNER_SVG;
      }
      data.append('_subject', 'Nouvelle demande de devis — Marketing Success');
      data.append('_template', 'table');
      data.append('_captcha', 'false');
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST', body: data, headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        note.textContent = 'Demande envoyée avec succès.';
        note.classList.add('success');
        showPanel('success', data);
      } catch (err) {
        note.textContent = 'Envoi impossible pour le moment.';
        note.classList.remove('success');
        showPanel('error', data);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.innerHTML = original;
          submitBtn.style.width = '';
        }
      }
      return;
    }

    // Repli sans backend : client mail pré-rempli.
    const subject = encodeURIComponent('Demande de devis — ' + (data.get('service') || 'Projet'));
    const body = encodeURIComponent(mailSummary(data));
    window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
    showPanel('success', data);
  });

  // --- WhatsApp (2e canal, logique conservée) ---
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      if (!validateAll()) return;
      const data = new FormData(form);
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waSummary(data)),
        '_blank', 'noopener');
      note.textContent = 'WhatsApp s\'ouvre avec votre demande pré-remplie.';
      note.classList.add('success');
    });
  }

  // API interne : permet au LOT 3 de pré-remplir #f-service puis flasher le champ.
  window.MS = window.MS || {};
  window.MS.prefillService = (value) => {
    const select = qs('#f-service', form);
    if (!select) return;
    const match = Array.from(select.options).find((o) => o.value === value || o.textContent.trim() === value);
    if (match) select.value = match.value;
    updateProgress();
    select.classList.remove('flash');
    void select.offsetWidth;
    select.classList.add('flash');
    setTimeout(() => select.classList.remove('flash'), 900);
  };
}

// --- Helpers ---
function waSummary(data) {
  return 'Bonjour, je souhaite un devis.\n\n' +
    'Nom : ' + (data.get('name') || '-') + '\n' +
    'Entreprise : ' + (data.get('company') || '-') + '\n' +
    'Email : ' + (data.get('email') || '-') + '\n' +
    'Téléphone : ' + (data.get('phone') || '-') + '\n' +
    'Service : ' + (data.get('service') || '-') + '\n\n' +
    'Projet : ' + (data.get('message') || '-');
}
function mailSummary(data) {
  return 'Nom : ' + (data.get('name') || '-') + '\nEntreprise : ' + (data.get('company') || '-') +
    '\nEmail : ' + (data.get('email') || '-') + '\nTéléphone : ' + (data.get('phone') || '-') +
    '\nService : ' + (data.get('service') || '-') + '\n\nProjet :\n' + (data.get('message') || '-');
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
