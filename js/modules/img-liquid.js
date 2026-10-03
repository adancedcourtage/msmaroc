// ===== Distorsion liquide au survol (WebGL) =====
// Un seul canvas WebGL réutilisé, positionné au survol par-dessus l'image de la
// carte (.img-wrap[data-liquid]). L'image devient une texture ; un shader la
// déforme en ondulation autour du curseur (ripple qui décroît + houle douce +
// légère aberration chromatique). Rendu uniquement pendant le survol, sur la
// boucle rAF partagée. Désactivé sur pointeur grossier / reduced-motion / no-WebGL
// (on garde alors le zoom CSS d'origine).

import { subscribe, unsubscribe, lerp } from './raf.js';
import { qsa, isFinePointer, prefersReducedMotion } from './utils.js';

const VERT = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}';
const FRAG = `
precision highp float;
varying vec2 v;
uniform sampler2D u_tex;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_amp;
void main(){
  vec2 uv = vec2(v.x, 1.0 - v.y);
  vec2 to = uv - u_mouse;
  float d = length(to);
  float ring = sin(d*20.0 - u_time*4.5) * exp(-d*6.5);
  float houle = sin(uv.y*9.0 + u_time*1.4)*0.5 + sin(uv.x*7.0 - u_time*1.1)*0.5;
  vec2 disp = normalize(to + 1e-4) * ring * 0.035 * u_amp
            + vec2(houle) * 0.006 * u_amp;
  float ca = 0.006 * u_amp * abs(ring);
  vec3 col;
  col.r = texture2D(u_tex, uv + disp + vec2(ca, 0.0)).r;
  col.g = texture2D(u_tex, uv + disp).g;
  col.b = texture2D(u_tex, uv + disp - vec2(ca, 0.0)).b;
  // léger éclat sur la crête de l'onde
  col += vec3(0.10, 0.06, 0.02) * max(ring, 0.0) * u_amp;
  gl_FragColor = vec4(col, 1.0);
}`;

export function initImgLiquid() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  const wraps = qsa('.img-wrap[data-liquid]');
  if (!wraps.length) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'liquid-canvas';
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
          || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.remove(); return; }

  const prog = buildProgram(gl, VERT, FRAG);
  if (!prog) { canvas.remove(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pLoc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(pLoc);
  gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
  const uTex = gl.getUniformLocation(prog, 'u_tex');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uAmp = gl.getUniformLocation(prog, 'u_amp');

  const texCache = new WeakMap();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let active = null;      // wrap courant
  let running = false;
  const st = { mx: 0.5, my: 0.5, tmx: 0.5, tmy: 0.5, amp: 0, tamp: 0 };
  const t0 = performance.now();

  function texFor(img) {
    if (texCache.has(img)) return texCache.get(img);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch (e) { return null; }
    texCache.set(img, tex);
    return tex;
  }

  function place(wrap) {
    const r = wrap.getBoundingClientRect();
    canvas.style.left = r.left + 'px';
    canvas.style.top = r.top + 'px';
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function frame() {
    if (!active) return;
    const img = active.querySelector('img');
    const tex = img && img.complete ? texFor(img) : null;
    if (!tex) return;
    place(active);
    st.mx = lerp(st.mx, st.tmx, 0.15);
    st.my = lerp(st.my, st.tmy, 0.15);
    st.amp = lerp(st.amp, st.tamp, 0.08);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(uTex, 0);
    gl.uniform2f(uMouse, st.mx, st.my);
    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.uniform1f(uAmp, st.amp);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // Arrêt propre une fois l'onde retombée après la sortie.
    if (st.tamp === 0 && st.amp < 0.01) { stop(); }
  }

  function start(wrap) {
    active = wrap;
    st.tamp = 1;
    wrap.classList.add('liquid-on');
    canvas.style.opacity = '1';
    if (!running) { running = true; subscribe(frame); }
  }
  function fadeOut() { st.tamp = 0; }
  function stop() {
    if (running) { unsubscribe(frame); running = false; }
    if (active) active.classList.remove('liquid-on');
    active = null;
    canvas.style.opacity = '0';
  }

  wraps.forEach((wrap) => {
    wrap.addEventListener('pointerenter', () => start(wrap));
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      st.tmx = (e.clientX - r.left) / r.width;
      st.tmy = (e.clientY - r.top) / r.height;
    });
    wrap.addEventListener('pointerleave', fadeOut);
  });
  // Si la page défile pendant un survol, on coupe (évite le canvas mal placé).
  window.addEventListener('scroll', () => { if (active) fadeOut(); }, { passive: true });
}

function buildProgram(gl, vs, fs) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}
function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}
