/* Helpers partagés de l'espace client (Cloudflare Pages Functions ; préfixe "_" = pas une route).
   Variables d'environnement (Cloudflare > Pages > Settings > Variables and Secrets) :
     SESSION_SECRET : longue chaîne aléatoire (signe le cookie de session)
     CLIENT_CODES   : un client par entrée "CODE:Nom du client", entrées séparées par une virgule,
                      un point-virgule ou un saut de ligne. Codes ALÉATOIRES d'au moins 10 caractères
                      (les plus courts sont ignorés). Ex. : "q8Fm3ZkT7xWc:Boutique Argan,Rb4NsE9yLp2H:Riad Atlas"
     MS_DEV         : (local uniquement) retire l'attribut Secure du cookie */
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const COOKIE = 'ms_client';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

export function secret(env) {
  const s = env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function clients(env) {
  return String(env.CLIENT_CODES || '')
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const i = e.indexOf(':');
      const code = i > 0 ? e.slice(0, i).trim() : '';
      return code.length >= 10 ? { code, name: e.slice(i + 1).trim() || 'cher client' } : null;
    })
    .filter(Boolean);
}

/* Compare à TOUS les codes (pas de sortie anticipée) pour ne rien révéler par le temps de réponse. */
export function findClient(env, input) {
  let found = null;
  for (const c of clients(env)) {
    if (safeEq(input, c.code) && !found) found = c;
  }
  return found;
}

const fingerprint = (code) => crypto.createHash('sha256').update('ms:' + code).digest('hex').slice(0, 16);

function sign(env, payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret(env)).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(env, token) {
  if (!token || !secret(env)) return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac('sha256', secret(env)).update(body).digest('base64url');
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

function cookies(request) {
  const out = {};
  String(request.headers.get('cookie') || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) {
      try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* cookie mal formé : ignoré */ }
    }
  });
  return out;
}

const secure = (env) => (env.MS_DEV ? '' : '; Secure');

export function sessionCookie(env, client) {
  const token = sign(env, { name: client.name, f: fingerprint(client.code), exp: Date.now() + MAX_AGE * 1000 });
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}${secure(env)}`;
}

export function clearCookie(env) {
  return `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure(env)}`;
}

/* Une session n'est valable que tant que le code qui l'a créée figure encore dans CLIENT_CODES (révocation). */
export function session(env, request) {
  const p = verify(env, cookies(request)[COOKIE]);
  if (!p || !p.f) return null;
  return clients(env).some((c) => fingerprint(c.code) === p.f) ? p : null;
}

export function json(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...extraHeaders }
  });
}

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Limiteur best-effort en mémoire (par isolate) : 8 essais / 10 min / IP.
   Protection durable : règle de rate limiting Cloudflare (WAF) sur /api/login. */
const hits = new Map();
export function tooMany(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 600000);
  h.push(now);
  hits.set(ip, h);
  if (hits.size > 500) hits.clear();
  return h.length > 8;
}

export const methodNotAllowed = () => json(405, { error: 'Méthode non autorisée' });
