import * as L from '../_lib.js';

export const onRequestPost = ({ env }) => L.json(200, { ok: true }, { 'Set-Cookie': L.clearCookie(env) });

export const onRequest = L.methodNotAllowed;
