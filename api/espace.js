'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./_lib');

const read = (f) => fs.readFileSync(path.join(__dirname, '_private', f), 'utf8');

/* Contenu de l'espace client : n'est renvoyé qu'avec un cookie de session valide. */
module.exports = (req, res) => {
  if (req.method !== 'GET') return L.json(res, 405, { error: 'Méthode non autorisée' });
  const s = L.session(req);
  if (!s) return L.json(res, 401, { error: 'Non connecté' });
  const html = read('espace.html.txt').replace(/\{\{NAME\}\}/g, () => L.escapeHtml(s.name));
  return L.json(res, 200, { name: s.name, html, script: read('cahier-config.txt') });
};
