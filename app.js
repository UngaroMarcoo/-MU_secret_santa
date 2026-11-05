import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const SS = window.SS;
const ROOT_USER = "mu_root", ROOT_EMAIL = "mu_root@example.com";
const $ = id => document.getElementById(id);
const show = (id, on = true) => $(id).classList.toggle("hidden", !on);
class UserError extends Error {}

/* ================= EFFETTI ================= */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// stelle
(function () {
  const box = $("stars"); const n = Math.min(110, Math.floor(innerWidth * innerHeight / 9000));
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${2 + Math.random() * 4}s;--l:${Math.random() * 4}s;` + (Math.random() < .15 ? "width:3px;height:3px;" : "");
    box.appendChild(s);
  }
})();

// alberelli
(function () {
  const t = $("trees"), n = Math.max(5, Math.floor(innerWidth / 90));
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.textContent = Math.random() < .8 ? "🌲" : "🎄";
    s.style.fontSize = (26 + Math.random() * 26) + "px"; s.style.setProperty("--dl", (-Math.random() * 5) + "s");
    t.appendChild(s);
  }
})();

// ghirlanda di luci
function drawGarland() {
  const g = $("garland"); g.innerHTML = "";
  const w = innerWidth, seg = Math.max(90, Math.min(150, w / 4)), n = Math.ceil(w / seg);
  const colors = ["#ff5468", "#ffd166", "#2fbf71", "#5ab0ff", "#ff8fd8"];
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"), path = document.createElementNS(ns, "path");
  let d = "", k = 0;
  for (let i = 0; i < n; i++) {
    const x0 = i * seg, x1 = x0 + seg, xm = x0 + seg / 2, sag = 34;
    d += `M${x0},4 Q${xm},${4 + sag * 2} ${x1},4 `;
    for (const t of [.2, .5, .8]) {
      const u = 1 - t, x = u * u * x0 + 2 * u * t * xm + t * t * x1, y = u * u * 4 + 2 * u * t * (4 + sag * 2) + t * t * 4;
      const b = document.createElement("b"); const c = colors[k++ % colors.length];
      b.style.cssText = `left:${x}px;top:${y}px;--c:${c};--dl:${(k * 0.37) % 1.8}s`; g.appendChild(b);
    }
  }
  path.setAttribute("d", d); svg.appendChild(path); g.prepend(svg);
}
drawGarland(); addEventListener("resize", drawGarland);

// neve (con "vento" che segue il dito/mouse)
(function () {
  if (reduceMotion) return;
  const cv = $("snow"), cx = cv.getContext("2d"); let W, H, flakes = [], wind = 0, windT = 0, last = 0;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(170, Math.floor(innerWidth * innerHeight / 7500)); flakes = Array.from({ length: n }, () => mk(true));
  }
  function mk(any) { return { x: Math.random() * innerWidth, y: any ? Math.random() * innerHeight : -10, r: .8 + Math.random() * 2.8, v: 25 + Math.random() * 55, ph: Math.random() * 6.28, a: .4 + Math.random() * .6 }; }
  addEventListener("resize", size); size();
  let px = null;
  addEventListener("pointermove", e => { if (px !== null) windT = Math.max(-140, Math.min(140, (e.clientX - px) * 6)); px = e.clientX; }, { passive: true });
  function frame(t) {
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    wind += (windT - wind) * .05; windT *= .96;
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (const f of flakes) {
      f.y += f.v * dt; f.ph += dt; f.x += (Math.sin(f.ph) * 18 + wind * (f.r / 3)) * dt;
      if (f.y > innerHeight + 10 || f.x < -20 || f.x > innerWidth + 20) Object.assign(f, mk(false), { x: Math.random() * innerWidth });
      cx.globalAlpha = f.a; cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.283); cx.fillStyle = "#fff"; cx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// coriandoli
const confetti = (function () {
  const cv = $("confetti"), cx = cv.getContext("2d"); let parts = [], running = false;
  function size() { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  addEventListener("resize", size); size();
  const cols = ["#ff5468", "#ffd166", "#2fbf71", "#5ab0ff", "#ffffff", "#ff8fd8"];
  function loop() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.y < innerHeight + 30 && p.life > 0);
    for (const p of parts) {
      p.vy += 520 * .016; p.vx *= .992; p.x += p.vx * .016; p.y += p.vy * .016; p.rot += p.vr * .016; p.life -= .016;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.min(1, p.life);
      cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); cx.restore();
    }
    if (parts.length) requestAnimationFrame(loop); else running = false;
  }
  return function burst(x, y, count = 160) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = 250 + Math.random() * 600;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: 6 + Math.random() * 8, c: cols[Math.random() * cols.length | 0], rot: Math.random() * 6, vr: (Math.random() - .5) * 18, life: 3 + Math.random() * 1.5 });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  };
})();

function scramble(el, text, dur = 1900) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ*#@%&", start = performance.now();
  return new Promise(res => (function tick(now) {
    const p = Math.min(1, (now - start) / dur), fixed = Math.floor(p * text.length);
    el.textContent = text.slice(0, fixed) + [...text.slice(fixed)].map(c => c === " " ? " " : chars[Math.random() * chars.length | 0]).join("");
    if (p < 1) requestAnimationFrame(tick); else { el.textContent = text; res(); }
  })(start));
}

/* ================= UTILITA' ================= */
let toastT;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
async function copy(text, label = "Copiato ✓") {
  try { await navigator.clipboard.writeText(text); } catch (e) { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
  toast(label);
}
function ask(title, text, ok = "Conferma") {
  return new Promise(res => {
    const d = $("dlg"); $("dlg-title").textContent = title; $("dlg-text").textContent = text; $("dlg-ok").textContent = ok;
    let settled = false; const done = v => { if (!settled) { settled = true; d.close(); res(v); } };
    $("dlg-ok").onclick = () => done(true); $("dlg-cancel").onclick = () => done(false); d.onclose = () => done(false);
    d.showModal();
  });
}
function banner(text, err = false) { const b = $("banner"); b.textContent = text; b.classList.toggle("err", err); show("banner", !!text); }
const link = () => location.href.split("#")[0].split("?")[0];

/* ================= FIREBASE ================= */
const configured = !String(firebaseConfig.apiKey).startsWith("INSERISCI");
let db, auth;
if (configured) {
  const app = initializeApp(firebaseConfig); db = getFirestore(app); auth = getAuth(app);
  setPersistence(auth, inMemoryPersistence);
} else banner("⚙️ Database non ancora collegato: completa firebase-config.js", true);

async function getCfg() { const s = await getDoc(doc(db, "config", "main")); return s.exists() ? s.data() : { assigned: false }; }

async function init() {
  if (!configured) return;
  try {
    const cfg = await getCfg();
    if (cfg.title) { $("title").textContent = cfg.title; document.title = cfg.title + " 🎅"; }
    if (!cfg.assigned) banner("🎄 L'estrazione non è ancora stata fatta: torna a controllare più tardi!");
  } catch (e) { banner("Non riesco a contattare il database. Riprova tra poco.", true); }
}
init();

/* ================= LOGIN ================= */
$("eye").onclick = () => { const p = $("f-pass"); p.type = p.type === "password" ? "text" : "password"; };
$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("f-name").value.trim(), pass = $("f-pass").value, msg = $("f-msg"); msg.textContent = "";
  if (!configured) { msg.textContent = "Database non collegato."; return; }
  const btn = $("f-go"), old = btn.textContent; btn.disabled = true; btn.textContent = "Apro… ✨";
  try {
    if (SS.normName(name) === ROOT_USER) await rootLogin(pass); else await guestLogin(name, pass);
    $("f-pass").value = "";
  } catch (err) {
    msg.textContent = err instanceof UserError ? err.message : "Qualcosa è andato storto. Riprova.";
    if (!(err instanceof UserError)) console.error(err);
  }
  btn.disabled = false; btn.textContent = old;
});

/* ================= PARTECIPANTE ================= */
async function guestLogin(name, pass) {
  const cfg = await getCfg();
  if (!cfg.assigned) { banner("🎄 L'estrazione non è ancora stata fatta: torna a controllare più tardi!"); throw new UserError("L'estrazione non è ancora stata fatta 🎄"); }
  const snap = await getDoc(doc(db, "people", SS.docId(name)));
  if (!snap.exists()) throw new UserError("Nome o password non corretti.");
  const d = snap.data();
  if (!d.c) throw new UserError("Per te non c'è ancora un abbinamento: scrivi all'organizzatore.");
  let target; try { target = await SS.decryptFor(pass, d); } catch (e) { throw new UserError("Nome o password non corretti."); }
  showGift(d.name, target);
}

function showGift(name, target) {
  show("s-login", false); banner(""); $("sub").textContent = "";
  $("greet").textContent = `Ciao ${name}! 🎅`;
  const gift = $("gift"); gift.className = "gift"; show("reveal", false); show("tap"); show("gift-hint"); $("who").textContent = "";
  show("s-gift"); let opened = false;
  const open = async () => {
    if (opened) return; opened = true; show("tap", false); show("gift-hint", false);
    gift.classList.add("shake");
    await new Promise(r => setTimeout(r, 560));
    gift.classList.remove("shake"); gift.classList.add("open");
    const r = gift.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 30, 190);
    await new Promise(r => setTimeout(r, 450));
    show("reveal"); await scramble($("who"), target);
    confetti(innerWidth * .2, innerHeight * .85, 70); confetti(innerWidth * .8, innerHeight * .85, 70);
  };
  gift.onclick = open; gift.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  $("g-out").onclick = backToLogin;
}

function backToLogin() {
  show("s-gift", false); show("s-admin", false); show("s-login");
  $("sub").textContent = "Chi ti è toccato quest'anno? 🎁"; $("f-pass").value = ""; $("f-msg").textContent = "";
  if (auth) signOut(auth).catch(() => {}); rootPass = null; state = null; init();
}

/* ================= ROOT ================= */
let rootPass = null, state = null;

async function rootLogin(pass) {
  try { await signInWithEmailAndPassword(auth, ROOT_EMAIL, pass); }
  catch (e) { if (String(e.code).startsWith("auth/")) throw new UserError("Nome o password non corretti."); throw e; }
  rootPass = pass; await loadAdmin();
  show("s-login", false); banner(""); $("sub").textContent = "Pannello organizzatore 🎅"; show("s-admin"); renderAdmin();
}

async function loadAdmin() {
  const cfg = await getCfg();
  const snap = await getDocs(collection(db, "people"));
  const people = snap.docs.map(d => ({ name: d.data().name, has: !!d.data().c })).sort((a, b) => a.name.localeCompare(b.name, "it"));
  let master = null, masterErr = false;
  const ms = await getDoc(doc(db, "private", "master"));
  if (ms.exists()) { try { master = JSON.parse(await SS.decryptFor(rootPass, ms.data())); } catch (e) { masterErr = true; } }
  state = { cfg, people, master, masterErr };
}

async function saveMaster() {
  const m = await SS.encryptFor(rootPass, JSON.stringify(state.master));
  await setDoc(doc(db, "private", "master"), m);
}

function parseGroups(text, names) {
  const lines = text.split("\n").map(l => l.split(",").map(s => s.trim()).filter(Boolean)).filter(g => g.length > 1);
  const lower = new Map(names.map(n => [SS.normName(n), n]));
  return lines.map(g => g.map(n => { const f = lower.get(SS.normName(n)); if (!f) throw new UserError(`Nei gruppi c'è "${n}", che non è tra i partecipanti.`); return f; }));
}

function renderAdmin() {
  const { cfg, people, master, masterErr } = state, assigned = !!cfg.assigned;
  const st = $("a-status"); st.textContent = assigned ? "fatta ✓" : "non fatta"; st.className = "pill " + (assigned ? "ok" : "no");
  const missing = people.filter(p => !p.has).length;
  $("a-status-hint").textContent = !assigned ? "Gli amici vedono l'avviso \"non ancora fatta\"." : (missing ? `⚠️ ${missing} persona/e senza abbinamento: rifai l'estrazione.` : "Ogni persona può già vedere il proprio abbinamento.");
  if (document.activeElement !== $("a-groups")) $("a-groups").value = (cfg.groups || []).join("\n");

  const chips = $("a-people"); chips.innerHTML = "";
  if (!people.length) chips.innerHTML = '<span class="hint">Nessun partecipante ancora.</span>';
  for (const p of people) {
    const c = document.createElement("span"); c.className = "chip"; c.append(p.name + (assigned && !p.has ? " ⚠️" : ""));
    const x = document.createElement("button"); x.textContent = "✕"; x.setAttribute("aria-label", "Rimuovi " + p.name); x.onclick = () => removePerson(p.name);
    c.append(x); chips.append(c);
  }
  show("a-reset", assigned); $("a-draw").textContent = assigned ? "Rifai l'estrazione 🔄" : "Fai partire l'estrazione 🎲";

  const box = $("a-creds"); box.innerHTML = "";
  if (masterErr) box.innerHTML = '<p class="hint">Non riesco a leggere le password salvate (password root cambiata?). Rifai l\'estrazione per rigenerarle.</p>';
  for (const p of people) {
    const pw = master && master.passes && master.passes[p.name];
    const row = document.createElement("div"); row.className = "cred";
    const l = document.createElement("div"); const b = document.createElement("strong"); b.textContent = p.name; const br = document.createElement("div"); const code = document.createElement("code"); code.textContent = pw || "—"; br.append(code); l.append(b, br);
    const btn = document.createElement("button"); btn.className = "small"; btn.textContent = "Copia"; btn.disabled = !pw;
    btn.onclick = () => copy(`Ciao ${p.name}! 🎅 Secret Santa: ${link()}\nNome: ${p.name}\nPassword: ${pw}`);
    row.append(l, btn); box.append(row);
  }
  $("a-copyall").onclick = () => copy(people.map(p => `${p.name}: ${(master && master.passes && master.passes[p.name]) || "—"}`).join("\n"));
}

async function refresh() { await loadAdmin(); renderAdmin(); }
async function guard(fn) { try { await fn(); } catch (e) { toast(e instanceof UserError ? e.message : "Errore: " + (e.message || e)); if (!(e instanceof UserError)) console.error(e); } }

$("a-add").onclick = () => guard(async () => {
  const name = $("a-newname").value.trim().replace(/\s+/g, " "); if (!name) return;
  if (state.people.some(p => SS.normName(p.name) === SS.normName(name))) throw new UserError("Questo nome c'è già.");
  if (SS.normName(name) === ROOT_USER) throw new UserError("Nome non disponibile.");
  state.master = state.master || { pairs: {}, passes: {} }; state.master.passes = state.master.passes || {};
  state.master.passes[name] = SS.generatePassphrase();
  await setDoc(doc(db, "people", SS.docId(name)), { name }); await saveMaster();
  $("a-newname").value = ""; await refresh();
  toast(state.cfg.assigned ? "Aggiunto: rifai l'estrazione ⚠️" : "Aggiunto ✓");
});
$("a-newname").addEventListener("keydown", e => { if (e.key === "Enter") $("a-add").click(); });

async function removePerson(name) {
  if (!await ask("Rimuovere " + name + "?", state.cfg.assigned ? "L'estrazione attuale non sarà più valida: dovrai rifarla." : "Verrà tolto dall'elenco.", "Rimuovi")) return;
  guard(async () => {
    await deleteDoc(doc(db, "people", SS.docId(name)));
    if (state.master) { delete state.master.passes[name]; await saveMaster(); }
    await refresh(); if (state.cfg.assigned) toast("Rimosso: rifai l'estrazione ⚠️");
  });
}

$("a-draw").onclick = async () => {
  const again = !!state.cfg.assigned;
  if (again && !await ask("Rifare l'estrazione?", "Gli abbinamenti attuali verranno sostituiti. Chi li ha già visti vedrà un nome diverso. Le password restano uguali.", "Rifai")) return;
  guard(async () => {
    const names = state.people.map(p => p.name); if (names.length < 3) throw new UserError("Servono almeno 3 partecipanti.");
    const lines = $("a-groups").value.split("\n").map(s => s.trim()).filter(Boolean);
    const groups = parseGroups($("a-groups").value, names);
    const pairs = SS.draw(names, groups); if (!pairs) throw new UserError("Impossibile con queste esclusioni: provane meno.");
    const old = (state.master && state.master.passes) || {}, passes = {}, batch = writeBatch(db);
    for (const n of names) { passes[n] = old[n] || SS.generatePassphrase(); batch.set(doc(db, "people", SS.docId(n)), { name: n, ...(await SS.encryptFor(passes[n], pairs[n])) }); }
    batch.set(doc(db, "private", "master"), await SS.encryptFor(rootPass, JSON.stringify({ pairs, passes })));
    batch.set(doc(db, "config", "main"), { ...state.cfg, assigned: true, groups: lines, assignedAt: Date.now() });
    await batch.commit(); await refresh(); toast(again ? "Estrazione rifatta 🎲" : "Estrazione fatta! 🎉");
    confetti(innerWidth / 2, innerHeight * .4, 160);
  });
};

$("a-reset").onclick = async () => {
  if (!await ask("Annullare l'estrazione?", "Gli amici torneranno a vedere \"non ancora fatta\". Potrai rifarla quando vuoi.", "Annulla estrazione")) return;
  guard(async () => {
    const batch = writeBatch(db);
    for (const p of state.people) batch.set(doc(db, "people", SS.docId(p.name)), { name: p.name });
    batch.set(doc(db, "config", "main"), { ...state.cfg, assigned: false });
    if (state.master) { state.master.pairs = {}; batch.set(doc(db, "private", "master"), await SS.encryptFor(rootPass, JSON.stringify(state.master))); }
    await batch.commit(); await refresh(); toast("Estrazione annullata");
  });
};

$("a-reveal").onclick = async () => {
  if (!state.cfg.assigned || !state.master || !Object.keys(state.master.pairs || {}).length) return toast("Nessun abbinamento da mostrare.");
  if (!await ask("Vuoi davvero vedere tutto?", "Stai per vedere chi regala a chi, rovinando la sorpresa anche a te. Procedi solo se è davvero necessario.", "Sì, mostra")) return;
  const ul = $("a-pairs"); ul.innerHTML = "";
  for (const [a, b] of Object.entries(state.master.pairs).sort((x, y) => x[0].localeCompare(y[0], "it"))) { const li = document.createElement("li"); const bb = document.createElement("b"); bb.textContent = b; li.append(a + " → ", bb); ul.append(li); }
  show("a-pairs"); show("a-hide"); show("a-reveal", false);
};
$("a-hide").onclick = () => { show("a-pairs", false); show("a-hide", false); show("a-reveal"); $("a-pairs").innerHTML = ""; };
$("a-out").onclick = backToLogin;
