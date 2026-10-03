'use strict';
const L = require('./_lib');

module.exports = (req, res) => {
  if (req.method !== 'POST') return L.json(res, 405, { error: 'Méthode non autorisée' });
  L.clearSession(res);
  return L.json(res, 200, { ok: true });
};
