/* Moteur de formulaire partagé (devis + cahier des charges).
   Lit window.CONFIG ; logique d'origine conservée à l'identique : étapes conditionnelles,
   validation, sauvegarde localStorage, code de référence, message WhatsApp. */
/* ===== Moteur de formulaire (partagé) ===== */
(function(){
const C = window.CONFIG;
const WA = C.whatsapp;
let S = {};
try { S = JSON.parse(localStorage.getItem(C.storeKey) || "{}") || {}; } catch(e) { S = {}; }
const save = () => {
  try {
    localStorage.setItem(C.storeKey, JSON.stringify(S));
    const el = document.getElementById("saved");
    if (el) { const d = new Date(); el.textContent = `Enregistré à ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
  } catch(e) {}
};
C.steps.forEach(st => (st.fields||[]).forEach(f => {
  if (f.default !== undefined && S[f.id] === undefined) S[f.id] = JSON.parse(JSON.stringify(f.default));
}));
window.S = S;

const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const optV = o => typeof o === "string" ? o : o.v;
const isOn = f => !f.when || f.when(S);
const vis = () => C.steps.filter(st => !st.when || st.when(S));
let cur = 0, maxReached = 0, started = false;
const track = (n, p) => { try { if (window.MSTrack) window.MSTrack(n, Object.assign({ form: C.docTitle }, p || {})); } catch (e) {} };
try { const p = JSON.parse(localStorage.getItem(C.storeKey + ":pos") || "{}"); cur = p.cur||0; maxReached = p.max||0; } catch(e) {}
const savePos = () => { try { localStorage.setItem(C.storeKey + ":pos", JSON.stringify({cur, max:maxReached})); } catch(e) {} };

function filled(f){
  const v = S[f.id];
  if (f.type === "repeater") return Array.isArray(v) && v.some(r => r && String(r[f.cols[0].k]||"").trim());
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function fmt(f){
  const v = S[f.id];
  if (!filled(f)) return "";
  if (f.type === "repeater") {
    return v.filter(r => r && String(r[f.cols[0].k]||"").trim()).map(r =>
      "   – " + f.cols.map((c,i) => {
        const x = String(r[c.k]||"").trim(); if (!x) return "";
        return i === 0 ? x : `${c.short||c.l} : ${x}${c.unit?" "+c.unit:""}`;
      }).filter(Boolean).join(" · ")
    ).join("\n");
  }
  if (Array.isArray(v)) return v.join(", ");
  if (f.type === "date") { const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString("fr-FR"); }
  return String(v).trim();
}

/* ---------- rendu des champs ---------- */
function field(f){
  const w = document.createElement("div");
  w.dataset.id = f.id;
  if (f.type === "section") {
    w.className = "subhead";
    w.innerHTML = `<h3>${esc(f.label)}</h3>${f.hint?`<p>${esc(f.hint)}</p>`:""}`;
    w._f = f; return w;
  }
  const wide = f.wide || ["textarea","checks","radio","repeater"].includes(f.type);
  w.className = "field" + (wide ? " wide" : "");
  w._f = f;
  const grouped = ["checks","radio","repeater"].includes(f.type);
  const tag = grouped ? "p" : "label";
  const lab = `<${tag} class="lbl" ${grouped?`id="l_${f.id}"`:`for="f_${f.id}"`}>${esc(f.label)}${f.req?' <span class="req" title="Obligatoire">*</span>':""}</${tag}>`;
  w.insertAdjacentHTML("beforeend", lab);
  if (f.hint) w.insertAdjacentHTML("beforeend", `<p class="hint">${esc(f.hint)}</p>`);

  if (["text","email","tel","url","number","date"].includes(f.type)) {
    const i = document.createElement("input");
    i.type = f.type; i.id = "f_"+f.id; i.value = S[f.id] ?? "";
    if (f.ph) i.placeholder = f.ph;
    if (f.type === "tel") i.autocomplete = "tel";
    if (f.type === "email") i.autocomplete = "email";
    i.addEventListener("input", () => { S[f.id] = i.value; changed(f, w); });
    w.appendChild(i);
  } else if (f.type === "textarea") {
    const t = document.createElement("textarea");
    t.id = "f_"+f.id; t.rows = f.rows || 3; t.value = S[f.id] ?? "";
    if (f.ph) t.placeholder = f.ph;
    t.addEventListener("input", () => { S[f.id] = t.value; changed(f, w); });
    w.appendChild(t);
  } else if (f.type === "select") {
    const s = document.createElement("select");
    s.id = "f_"+f.id;
    s.innerHTML = `<option value="">Choisir…</option>` + f.options.map(o => `<option${S[f.id]===o?" selected":""}>${esc(o)}</option>`).join("");
    s.addEventListener("change", () => { S[f.id] = s.value; changed(f, w); });
    w.appendChild(s);
  } else if (f.type === "checks" || f.type === "radio") {
    const box = document.createElement("div");
    box.className = (f.cards ? "cards" : "chips");
    box.setAttribute("role", f.type === "radio" ? "radiogroup" : "group");
    box.setAttribute("aria-labelledby", "l_"+f.id);
    f.options.forEach((o, n) => {
      const v = optV(o), d = typeof o === "string" ? "" : (o.d || "");
      const l = document.createElement("label");
      l.className = f.cards ? "card-opt" : "chip";
      const i = document.createElement("input");
      i.type = f.type === "radio" ? "radio" : "checkbox";
      i.name = "f_"+f.id; i.id = `f_${f.id}_${n}`; i.value = v;
      i.checked = f.type === "radio" ? S[f.id] === v : (S[f.id]||[]).includes(v);
      i.addEventListener("change", () => {
        if (f.type === "radio") S[f.id] = v;
        else {
          const set = new Set(S[f.id]||[]);
          i.checked ? set.add(v) : set.delete(v);
          S[f.id] = f.options.map(optV).filter(x => set.has(x));
        }
        changed(f, w);
      });
      l.appendChild(i);
      l.insertAdjacentHTML("beforeend", `<span class="tick" aria-hidden="true"></span><span class="txt"><span class="v">${esc(v)}</span>${d?`<span class="d">${esc(d)}</span>`:""}</span>`);
      box.appendChild(l);
    });
    w.appendChild(box);
  } else if (f.type === "repeater") {
    if (!Array.isArray(S[f.id]) || !S[f.id].length) S[f.id] = [{}];
    const wrap = document.createElement("div"); wrap.className = "rep";
    const draw = () => {
      wrap.innerHTML = "";
      const sc = document.createElement("div"); sc.className = "rep-scroll";
      const tb = document.createElement("table");
      tb.innerHTML = `<thead><tr><th class="n">#</th>${f.cols.map(c=>`<th>${esc(c.l)}</th>`).join("")}<th class="x"><span class="sr">Retirer</span></th></tr></thead>`;
      const body = document.createElement("tbody");
      S[f.id].forEach((row, ri) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="n">${ri+1}</td>`;
        f.cols.forEach(c => {
          const td = document.createElement("td");
          const i = document.createElement("input");
          i.type = c.t || "text"; i.value = row[c.k] ?? ""; i.id = `f_${f.id}_${ri}_${c.k}`;
          i.setAttribute("aria-label", `${c.l}, ligne ${ri+1}`);
          if (c.ph) i.placeholder = c.ph;
          if (c.t === "number") { i.min = "0"; i.inputMode = "decimal"; }
          i.addEventListener("input", () => { S[f.id][ri][c.k] = i.value; changed(f, w, true); });
          td.appendChild(i); tr.appendChild(td);
        });
        const td = document.createElement("td"); td.className = "x";
        const b = document.createElement("button");
        b.type = "button"; b.className = "icon-btn"; b.innerHTML = "×";
        b.setAttribute("aria-label", `Retirer la ligne ${ri+1}`);
        b.disabled = S[f.id].length === 1;
        b.addEventListener("click", () => { S[f.id].splice(ri,1); save(); draw(); });
        td.appendChild(b); tr.appendChild(td);
        body.appendChild(tr);
      });
      tb.appendChild(body); sc.appendChild(tb); wrap.appendChild(sc);
      const add = document.createElement("button");
      add.type = "button"; add.className = "btn ghost small"; add.textContent = "+ Ajouter un produit";
      add.addEventListener("click", () => { S[f.id].push({}); save(); draw(); const last = wrap.querySelector("tbody tr:last-child input"); if (last) last.focus(); });
      wrap.appendChild(add);
    };
    draw();
    w.appendChild(wrap);
  }
  w.insertAdjacentHTML("beforeend", `<p class="err" role="alert" hidden></p>`);
  return w;
}

function changed(f, w, quiet){
  if (!started) { started = true; track(C.startEvent || "form_start"); }
  save();
  const e = w.querySelector(".err"); if (e && !e.hidden && filled(f)) { e.hidden = true; w.classList.remove("bad"); }
  if (!quiet) { refreshWhen(); nav(); }
}

function refreshWhen(){
  document.querySelectorAll("#fields > [data-id]").forEach(w => { w.hidden = !isOn(w._f); });
}

/* ---------- navigation ---------- */
function nav(){
  const vs = vis();
  const ol = $("#steps-nav");
  let html = "", lastGroup = null;
  vs.forEach((st, n) => {
    if (st.group !== lastGroup) { html += `<li class="grp">${esc(st.group||"")}</li>`; lastGroup = st.group; }
    const state = n === cur ? "now" : (n < cur || n <= maxReached ? "done" : "todo");
    const can = n <= maxReached && n !== cur;
    html += `<li class="st ${state}"><button type="button" data-n="${n}" ${can?"":"disabled"} ${n===cur?'aria-current="step"':""}><span class="dot" aria-hidden="true"></span><span>${esc(st.nav||st.title)}</span></button></li>`;
  });
  ol.innerHTML = html;
  ol.querySelectorAll("button[data-n]").forEach(b => b.addEventListener("click", () => go(+b.dataset.n)));
  const pct = vs.length > 1 ? Math.round(cur / (vs.length-1) * 100) : 100;
  $("#bar").style.width = pct + "%";
  $("#bar-lbl").textContent = `Étape ${cur+1} / ${vs.length}`;
}

function render(){
  const vs = vis();
  if (cur >= vs.length) cur = vs.length - 1;
  const st = vs[cur];
  const m = $("#step");
  m.innerHTML = `<header class="step-head"><p class="eyebrow">${esc(st.group||"")}<span>Étape ${cur+1} sur ${vs.length}</span></p><h2 id="step-title" tabindex="-1">${esc(st.title)}</h2>${st.intro?`<p class="intro">${esc(st.intro)}</p>`:""}</header>`;
  if (st.type === "recap") m.appendChild(recap(vs));
  else {
    const box = document.createElement("div"); box.id = "fields"; box.className = "fields";
    st.fields.forEach(f => box.appendChild(field(f)));
    m.appendChild(box);
    refreshWhen();
  }
  $("#prev").hidden = cur === 0;
  $("#next").hidden = st.type === "recap";
  $("#next").textContent = cur === vs.length - 2 ? "Voir le récapitulatif →" : "Continuer →";
  nav(); savePos();
}

function validate(st){
  if (!st.fields) return true;
  let first = null;
  st.fields.forEach(f => {
    if (f.type === "section" || !isOn(f)) return;
    const w = document.querySelector(`#fields > [data-id="${f.id}"]`); if (!w) return;
    const e = w.querySelector(".err");
    let msg = "";
    if (f.req && !filled(f)) msg = f.type === "checks" ? "Cochez au moins une option." : f.type === "radio" ? "Choisissez une option." : f.type === "repeater" ? "Ajoutez au moins un produit." : "Ce champ est obligatoire.";
    else if (f.type === "email" && filled(f) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S[f.id])) msg = "Adresse e-mail incomplète, ex. nom@domaine.ma";
    else if (f.type === "tel" && filled(f) && String(S[f.id]).replace(/\D/g,"").length < 9) msg = "Numéro incomplet, ex. 06 12 34 56 78";
    if (msg) { e.textContent = msg; e.hidden = false; w.classList.add("bad"); first = first || w; }
    else { e.hidden = true; w.classList.remove("bad"); }
  });
  if (first) { first.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"center"}); const i = first.querySelector("input,textarea,select"); if (i) i.focus({preventScroll:true}); return false; }
  return true;
}

function go(n){
  cur = n; maxReached = Math.max(maxReached, cur);
  render();
  const t = $("#step-title"); if (t) t.focus({preventScroll:true});
  $("#top").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
}

$("#next").addEventListener("click", () => { const vs = vis(); if (validate(vs[cur])) go(Math.min(cur+1, vs.length-1)); });
$("#prev").addEventListener("click", () => go(Math.max(cur-1, 0)));

/* ---------- récapitulatif ---------- */
function ref(){
  const d = new Date(), p = n => String(n).padStart(2,"0");
  const base = `MS-${String(d.getFullYear()).slice(2)}${p(d.getMonth()+1)}${p(d.getDate())}`;
  return C.ref ? base + "-" + C.ref(S) : base;
}
function text(vs){
  let t = `*${C.docTitle}* — Marketing Succès\nRéf. ${ref()}\n`;
  vs.forEach(st => {
    if (st.type === "recap") return;
    const lines = [];
    st.fields.forEach(f => {
      if (f.type === "section" || !isOn(f)) return;
      const v = fmt(f); if (!v) return;
      lines.push(f.type === "repeater" ? `• ${f.short||f.label} :\n${v}` : `• ${f.short||f.label} : ${v}`);
    });
    if (lines.length) t += `\n*${st.title}*\n${lines.join("\n")}\n`;
  });
  return t.trim();
}
function recap(vs){
  const box = document.createElement("div"); box.className = "recap";
  const missing = [];
  vs.forEach((st, n) => {
    if (st.type === "recap") return;
    (st.fields||[]).forEach(f => { if (f.req && isOn(f) && !filled(f)) missing.push({n, st}); });
  });
  const firstMissing = missing[0];

  const act = document.createElement("section"); act.className = "send";
  const msg = text(vs);
  const url = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  act.innerHTML = `
    <div class="send-copy">
      <p class="eyebrow">Dernière étape<span>Réf. ${esc(ref())}</span></p>
      <h3>${esc(C.sendTitle)}</h3>
      <p>${esc(C.sendText)}</p>
      ${firstMissing ? `<p class="warn">Il manque des réponses obligatoires dans « ${esc(firstMissing.st.title)} ». <button type="button" class="link" data-go="${firstMissing.n}">Compléter</button></p>` : ""}
    </div>
    <div class="send-actions">
      <a class="btn wa ${firstMissing?"off":""}" href="${firstMissing?"#":url}" target="_blank" rel="noopener" ${firstMissing?'aria-disabled="true"':""}>Envoyer sur WhatsApp</a>
      <button type="button" class="btn ghost" id="copy">Copier le récapitulatif</button>
      <p class="fine">Si WhatsApp ne s'ouvre pas, copiez le récapitulatif et envoyez-le au <strong class="num">${esc(C.whatsappDisplay)}</strong>.</p>
    </div>`;
  if (C.nextSteps) {
    act.insertAdjacentHTML("beforeend", `<ol class="next">${C.nextSteps.map(s=>`<li><strong>${esc(s[0])}</strong><span>${esc(s[1])}</span></li>`).join("")}</ol>`);
  }
  box.appendChild(act);
  const ta = document.createElement("textarea"); ta.className = "copy-src"; ta.readOnly = true; ta.value = msg; ta.setAttribute("aria-label","Récapitulatif à copier"); ta.hidden = true;
  box.appendChild(ta);

  vs.forEach((st, n) => {
    if (st.type === "recap") return;
    const rows = (st.fields||[]).filter(f => f.type !== "section" && isOn(f) && filled(f));
    const sec = document.createElement("section"); sec.className = "rc";
    sec.innerHTML = `<header><h4>${esc(st.title)}</h4><button type="button" class="link" data-go="${n}">Modifier</button></header>` +
      (rows.length ? `<dl>${rows.map(f => `<div><dt>${esc(f.short||f.label)}</dt><dd>${esc(fmt(f)).replace(/\n/g,"<br>")}</dd></div>`).join("")}</dl>` : `<p class="empty">Aucune réponse pour cette étape.</p>`);
    box.appendChild(sec);
  });

  box.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
  box.querySelector(".btn.wa").addEventListener("click", e => { if (firstMissing) { e.preventDefault(); go(firstMissing.n); } else { track(C.sentEvent || "form_sent", { ref: ref() }); } });
  box.querySelector("#copy").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(msg); b.textContent = "Récapitulatif copié"; }
    catch(err) { ta.hidden = false; ta.focus(); ta.select(); b.textContent = "Sélectionné : copiez avec Ctrl+C"; }
    setTimeout(() => { b.textContent = "Copier le récapitulatif"; }, 3000);
  });
  return box;
}

/* ---------- remise à zéro ---------- */
const reset = $("#reset");
let armed = false;
reset.addEventListener("click", () => {
  if (!armed) { armed = true; reset.textContent = "Confirmer : tout effacer"; reset.classList.add("armed"); setTimeout(() => { armed = false; reset.textContent = "Recommencer"; reset.classList.remove("armed"); }, 4000); return; }
  try { localStorage.removeItem(C.storeKey); localStorage.removeItem(C.storeKey+":pos"); } catch(e) {}
  Object.keys(S).forEach(k => delete S[k]);
  C.steps.forEach(st => (st.fields||[]).forEach(f => { if (f.default !== undefined) S[f.id] = JSON.parse(JSON.stringify(f.default)); }));
  armed = false; reset.textContent = "Recommencer"; reset.classList.remove("armed");
  cur = 0; maxReached = 0; render();
});

render();
})();
