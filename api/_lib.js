'use strict';
/* Helpers partagés de l'espace client (préfixe "_" = pas une route Vercel).
   Variables d'environnement (Vercel > Settings > Environment Variables) :
     SESSION_SECRET : longue chaîne aléatoire (signe le cookie de session)
     CLIENT_CODES   : un client par entrée "CODE:Nom du client", entrées séparées par une virgule,
                      un point-virgule ou un saut de ligne. Ex. : "K7P2-ARGAN:Boutique Argan,M4X9-RIAD:Riad Atlas" */
const crypto = require('crypto');

const COOKIE = 'ms_client';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

function secret() {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function clients() {
  return String(process.env.CLIENT_CODES || '')
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const i = e.indexOf(':');
      return i > 0 ? { code: e.slice(0, i).trim(), name: e.slice(i + 1).trim() || 'cher client' } : null;
    })
    .filter(Boolean);
}

/* Compare à TOUS les codes (pas de sortie anticipée) pour ne rien révéler par le temps de réponse. */
function findClient(input) {
  let found = null;
  for (const c of clients()) {
    if (safeEq(input, c.code) && !found) found = c;
  }
  return found;
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(token) {
  if (!token || !secret()) return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p && p.exp > Date.now() ? p : null;
  } catch (e) {
    return null;
  }
}

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

const secure = () => (process.env.MS_DEV ? '' : '; Secure');

function setSession(res, name) {
  const token = sign({ name, exp: Date.now() + MAX_AGE * 1000 });
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}${secure()}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure()}`);
}

function session(req) {
  return verify(cookies(req)[COOKIE]);
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Limiteur best-effort en mémoire (une instance serverless à la fois) : 8 essais / 10 min / IP. */
const hits = new Map();
function tooMany(req) {
  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || 'x').trim();
  const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 600000);
  h.push(now);
  hits.set(ip, h);
  if (hits.size > 500) hits.clear();
  return h.length > 8;
}

module.exports = { findClient, setSession, clearSession, session, json, escapeHtml, secret, clients, tooMany };
