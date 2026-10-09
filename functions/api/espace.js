import * as L from '../_lib.js';
import espaceHtml from '../_private/espace.html.txt';
import cahierConfig from '../_private/cahier-config.txt';

/* Contenu de l'espace client : n'est renvoyé qu'avec un cookie de session valide. */
export function onRequestGet({ request, env }) {
  const s = L.session(env, request);
  if (!s) return L.json(401, { error: 'Non connecté' });
  const html = espaceHtml.replace(/\{\{NAME\}\}/g, () => L.escapeHtml(s.name));
  return L.json(200, { name: s.name, html, script: cahierConfig });
}

export const onRequest = L.methodNotAllowed;
