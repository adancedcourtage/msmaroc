import * as L from '../_lib.js';

export async function onRequestPost({ request, env }) {
  if (!L.secret(env) || !L.clients(env).length) return L.json(503, { error: 'Service momentanément indisponible. Contactez-nous sur WhatsApp.' });
  if (L.tooMany(request)) return L.json(429, { error: 'Trop d’essais. Réessayez dans quelques minutes.' });

  let body = {};
  try { body = await request.json(); } catch (e) { body = {}; }
  const code = body && typeof body.code === 'string' ? body.code.trim().slice(0, 64) : '';
  const client = code ? L.findClient(env, code) : null;

  if (!client) {
    await new Promise((r) => setTimeout(r, 500)); // freine le test de codes en rafale
    return L.json(401, { error: 'Code incorrect. Vérifiez le code reçu avec votre devis.' });
  }
  return L.json(200, { ok: true, name: client.name }, { 'Set-Cookie': L.sessionCookie(env, client) });
}

export const onRequest = L.methodNotAllowed;
