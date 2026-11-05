/* Nucleo: estrazione e cifratura. Funziona nel browser e in Node (vedi test.js). */
(function () {
  const WORDS = ("albero amico arancia aurora bacio balena bosco brezza caffe camino candela castagna cielo cometa cuore " +
    "dolce drago estate falco farfalla fiocco fiume foglia fragola gatto gelato giglio girasole gufo inverno isola " +
    "lampo lanterna lepre limone luna luce magia mandorla mare mela miele montagna nebbia neve nuvola oceano orso " +
    "panda pane parco pepe pesca pigna pino pioggia ponte prato quercia razzo regalo riccio rosa sabbia sale " +
    "scoiattolo sentiero sole sorriso stella strada tavolo tigre torta tramonto treno tulipano uccello uva vento " +
    "viola volpe zucchero zucca abete arco baita bandiera biscotto bolla bussola cacao campana canto carota " +
    "corallo cristallo delfino dado fata fuoco giardino gioco lago lupo marmo mirtillo nido noce onda palla " +
    "pavone penna perla piuma polvere rana ruota scala scatola seme tamburo tenda tesoro vela vulcano zaino").split(" ");

  const PBKDF2_ITER = 300000;
  const enc = new TextEncoder(), dec = new TextDecoder();

  const b64u = bytes => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = str => { str = str.replace(/-/g, "+").replace(/_/g, "/"); while (str.length % 4) str += "="; const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };

  function randInt(n) { // uniforme in [0,n) senza bias
    const lim = Math.floor(0x100000000 / n) * n, a = new Uint32Array(1);
    do { crypto.getRandomValues(a); } while (a[0] >= lim);
    return a[0] % n;
  }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  const generatePassphrase = () => { const w = []; for (let i = 0; i < 2; i++) w.push(WORDS[randInt(WORDS.length)]); return w.join("-") + "-" + String(randInt(100)).padStart(2, "0"); };
  const normPass = p => p.trim().toLowerCase().replace(/\s+/g, "-");
  const normName = n => n.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  const docId = n => b64u(enc.encode(normName(n)));

  /* {chi: a chi} oppure null se impossibile. groups: array di array di nomi che non si pescano fra loro. */
  function draw(names, groups) {
    const forbidden = new Map(names.map(n => [n, new Set([n])]));
    for (const g of groups) for (const a of g) for (const b of g) if (forbidden.has(a) && forbidden.has(b)) forbidden.get(a).add(b);
    const givers = shuffle(names), taken = new Set(), result = {};
    function go(i) {
      if (i === givers.length) return true;
      const g = givers[i];
      for (const r of shuffle(names)) {
        if (taken.has(r) || forbidden.get(g).has(r)) continue;
        taken.add(r); result[g] = r;
        if (go(i + 1)) return true;
        taken.delete(r); delete result[g];
      }
      return false;
    }
    return go(0) ? result : null;
  }

  async function deriveKey(pass, salt) {
    const base = await crypto.subtle.importKey("raw", enc.encode(normPass(pass)), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encryptFor(pass, text) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await deriveKey(pass, salt), enc.encode(text)));
    return { s: b64u(salt), i: b64u(iv), c: b64u(ct) };
  }
  async function decryptFor(pass, e) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(e.i) }, await deriveKey(pass, unb64u(e.s)), unb64u(e.c));
    return dec.decode(pt);
  }

  globalThis.SS = { draw, encryptFor, decryptFor, generatePassphrase, normPass, normName, docId, WORDS };
})();
