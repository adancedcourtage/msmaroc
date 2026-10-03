'use strict';
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.json(res, 405, { error: 'Méthode non autorisée' });
  if (!L.secret() || !L.clients().length) return L.json(res, 503, { error: 'Service momentanément indisponible. Contactez-nous sur WhatsApp.' });
  if (L.tooMany(req)) return L.json(res, 429, { error: 'Trop d’essais. Réessayez dans quelques minutes.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const code = body && typeof body.code === 'string' ? body.code.trim().slice(0, 64) : '';
  const client = code ? L.findClient(code) : null;

  if (!client) {
    await new Promise((r) => setTimeout(r, 500)); // freine le test de codes en rafale
    return L.json(res, 401, { error: 'Code incorrect. Vérifiez le code reçu avec votre devis.' });
  }
  L.setSession(res, client);
  return L.json(res, 200, { ok: true, name: client.name });
};
