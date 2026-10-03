// ===== Fond WebGL vivant (fluide réactif au pointeur) =====
// Shader plein écran : bruit fractal (fbm) en domaine déformé -> nappes de
// couleur qui ondulent lentement dans la palette de la marque. Le pointeur crée
// une distorsion + un halo qui suit la souris (inertie). WebGL brut, aucune
// dépendance, ~quelques Ko. Rendu en basse résolution puis étiré (un fond flou
// tolère très bien la basse def) -> 60fps même sur mobile.
// Branché sur la boucle rAF partagée ; pause hors-onglet. Repli CSS si pas de WebGL
// ou reduced-motion.

import { subscribe, unsubscribe, lerp, clamp } from './raf.js';
import { qs, prefersReducedMotion, isFinePointer } from './utils.js';

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;    // 0..1
uniform float u_mouseOn;  // 0 / 1 intensité pointeur
uniform float u_intensity;// pilotée par le scroll

// --- bruit de valeur + fbm ---
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0));
  float d = hash(i+vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v = 0.0; float amp = 0.5;
  for(int i=0;i<5;i++){ v += amp*noise(p); p *= 2.0; amp *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y; // correction ratio

  float t = u_time * 0.06;

  // Distorsion autour du pointeur (ondulation qui pousse le champ)
  vec2 m = u_mouse; m.x *= u_res.x/u_res.y;
  float md = distance(p, m);
  float ripple = u_mouseOn * exp(-md*3.0) * 0.35;
  p += (p - m) * ripple;

  // Domain warping : deux niveaux de fbm imbriqués -> nappes fluides
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(3.2,1.7) - t));
  vec2 r = vec2(fbm(p + 1.5*q + vec2(1.7,9.2) + t*0.7),
                fbm(p + 1.5*q + vec2(8.3,2.8) - t*0.6));
  float f = fbm(p + 2.0*r);

  // Palette marque
  vec3 navy  = vec3(0.019,0.027,0.059); // #05070f-ish
  vec3 deep  = vec3(0.055,0.086,0.20);  // navy profond
  vec3 blue  = vec3(0.184,0.419,1.0);   // #2f6bff
  vec3 cyan  = vec3(0.133,0.827,0.933); // #22d3ee
  vec3 orange= vec3(1.0,0.603,0.121);   // #ff9a1f

  vec3 col = navy;
  col = mix(col, deep, clamp(f*1.2,0.0,1.0));
  col = mix(col, blue*0.42, clamp(pow(length(q),2.0)*0.8,0.0,1.0));
  col = mix(col, cyan*0.34, clamp(r.x*r.y*1.1,0.0,1.0));
  // Éclats orange sur les crêtes du bruit (plus discrets)
  float glint = smoothstep(0.66,0.96, f + 0.25*r.y);
  col += orange * glint * 0.34;

  // Halo qui suit le pointeur
  float glow = u_mouseOn * exp(-md*2.2);
  col += (orange*0.30 + cyan*0.12) * glow;

  // Assombrit fortement pour garder le texte lisible (fond = ambiance, pas sujet)
  float vig = smoothstep(1.15, 0.20, distance(uv, vec2(0.5)));
  col *= mix(0.30, 0.72, vig);

  col *= u_intensity;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function initWebglBg() {
  const canvas = qs('#webgl-bg');
  if (!canvas) return;

  if (prefersReducedMotion()) { fallback(canvas); return; }

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' })
          || canvas.getContext('experimental-webgl');
  if (!gl) { fallback(canvas); return; }

  // Compilation
  const prog = buildProgram(gl, VERT, FRAG);
  if (!prog) { fallback(canvas); return; }
  gl.useProgram(prog);

  // Quad plein écran
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uMouseOn = gl.getUniformLocation(prog, 'u_mouseOn');
  const uIntensity = gl.getUniformLocation(prog, 'u_intensity');

  // Basse résolution : un fond flou n'a pas besoin de pixels. Cap agressif mobile.
  const fine = isFinePointer();
  const scale = fine ? 0.55 : 0.4;

  const state = {
    mx: 0.5, my: 0.5, tmx: 0.5, tmy: 0.5,
    on: 0, ton: 0, intensity: 1, tIntensity: 1,
  };

  function resize() {
    const w = Math.max(1, Math.floor(window.innerWidth * scale));
    const h = Math.max(1, Math.floor(window.innerHeight * scale));
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Pointeur (fin uniquement ; sur tactile le fluide dérive tout seul).
  if (fine) {
    document.body.classList.add('fine-cursor');
    const root = document.documentElement.style;
    window.addEventListener('pointermove', (e) => {
      state.tmx = e.clientX / window.innerWidth;
      state.tmy = 1.0 - e.clientY / window.innerHeight;
      state.ton = 1;
      // Halo CSS global qui suit le curseur (mélange screen).
      root.setProperty('--cursor-x', e.clientX + 'px');
      root.setProperty('--cursor-y', e.clientY + 'px');
    }, { passive: true });
    window.addEventListener('pointerdown', () => { state.ton = 1.6; });
  } else {
    state.ton = 0.7; // halo doux mobile
  }

  // Intensité pilotée par le scroll : plus on descend, plus le fond respire.
  window.addEventListener('scroll', () => {
    const p = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.tIntensity = 1.0 + Math.sin(p * Math.PI) * 0.25; // pulse doux au milieu
  }, { passive: true });

  const start = performance.now();
  let running = false;

  function frame(dt, now) {
    // Sur tactile : cible qui dérive lentement (Lissajous).
    if (!fine) {
      const s = (now - start) / 1000;
      state.tmx = 0.5 + 0.32 * Math.sin(s * 0.21);
      state.tmy = 0.5 + 0.32 * Math.sin(s * 0.17 + 1.1);
    }
    state.mx = lerp(state.mx, state.tmx, 0.06);
    state.my = lerp(state.my, state.tmy, 0.06);
    state.on = lerp(state.on, state.ton, 0.05);
    state.ton = lerp(state.ton, fine ? (state.ton > 0.05 ? 1 : 0) : 0.7, 0.02);
    state.intensity = lerp(state.intensity, state.tIntensity, 0.04);

    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, state.mx, state.my);
    gl.uniform1f(uMouseOn, clamp(state.on, 0, 1.6));
    gl.uniform1f(uIntensity, state.intensity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function play() { if (!running) { running = true; subscribe(frame); } }
  function pause() { if (running) { running = false; unsubscribe(frame); } }

  document.addEventListener('visibilitychange', () => { document.hidden ? pause() : play(); });
  play();
  document.body.classList.add('has-webgl');
}

// --- Utilitaires WebGL ---
function buildProgram(gl, vsrc, fsrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  return prog;
}
function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src); gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
  return sh;
}

// Repli : dégradé animé CSS (classe posée sur le body).
function fallback(canvas) {
  canvas.style.display = 'none';
  document.body.classList.add('webgl-fallback');
}
