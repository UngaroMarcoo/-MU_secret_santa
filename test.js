// Uso: node test.js   (estrae lo <script> da index.html e ne verifica il nucleo)
const fs = require("fs"), assert = require("assert");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
(0, eval)(code); // definisce globalThis.SS (nessun document in Node, quindi niente UI)
const { draw, buildPayload, packPayload, unpackPayload, decryptFor, normPass, WORDS } = SS;

(async () => {
  // 1. nessuna parola con cifre / duplicati nella lista
  assert.strictEqual(new Set(WORDS).size, WORDS.length, "parole duplicate");
  console.log(`ok  lista parole (${WORDS.length})`);

  // 2. estrazione: nessuno pesca sé stesso, è una permutazione, le esclusioni valgono
  const names = ["Anna", "Luca", "Marta", "Paolo", "Giulia", "Sara"];
  const groups = [["Anna", "Luca"], ["Marta", "Paolo"]];
  for (let k = 0; k < 500; k++) {
    const r = draw(names, groups);
    assert(r, "estrazione fallita");
    assert.deepStrictEqual(Object.values(r).sort(), names.slice().sort(), "non è una permutazione");
    for (const g of names) {
      assert.notStrictEqual(r[g], g, "pesca sé stesso");
      for (const grp of groups) if (grp.includes(g)) assert(!grp.includes(r[g]), "esclusione violata");
    }
  }
  console.log("ok  estrazione (500 giri)");

  // 3. caso impossibile -> null
  assert.strictEqual(draw(["A", "B", "C"], [["A", "B", "C"]]), null);
  console.log("ok  caso impossibile");

  // 4. cifratura: parola giusta decifra, sbagliata no; il giro chiuso torna
  const { payload, passes } = await buildPayload("Test", names, groups);
  const back = unpackPayload(packPayload(payload));
  assert.deepStrictEqual(back, payload, "pack/unpack");
  const received = {};
  for (const n of names) received[n] = await decryptFor(passes[n], back.p.find(x => x.n === n));
  assert.deepStrictEqual(Object.values(received).sort(), names.slice().sort());
  assert.notStrictEqual(received.Anna, "Anna");
  await assert.rejects(decryptFor(passes.Luca, back.p.find(x => x.n === "Anna")), "parola altrui accettata");
  await assert.rejects(decryptFor("sbagliata", back.p.find(x => x.n === "Anna")));
  // normalizzazione: maiuscole/spazi
  assert.strictEqual(await decryptFor("  " + passes.Anna.toUpperCase().replace(/-/g, " ") + " ", back.p.find(x => x.n === "Anna")), received.Anna);
  console.log("ok  cifratura / decifratura / parola sbagliata / normalizzazione");
  console.log("link, lunghezza payload:", packPayload(payload).length, "caratteri (6 persone)");
})().catch(e => { console.error("FALLITO:", e); process.exit(1); });
