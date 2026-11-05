// Uso: node test.js — verifica il nucleo (core.js): estrazione e cifratura
const fs = require("fs"), assert = require("assert");
(0, eval)(fs.readFileSync(__dirname + "/core.js", "utf8"));
const { draw, encryptFor, decryptFor, generatePassphrase, normName, docId, WORDS } = SS;

(async () => {
  assert.strictEqual(new Set(WORDS).size, WORDS.length, "parole duplicate");
  console.log(`ok  lista parole (${WORDS.length})`);

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
  assert.strictEqual(draw(["A", "B", "C"], [["A", "B", "C"]]), null);
  console.log("ok  caso impossibile");

  const pass = generatePassphrase();
  assert(/^[a-z]+-[a-z]+-\d\d$/.test(pass), "formato password: " + pass);
  const e = await encryptFor(pass, "Marta");
  assert.strictEqual(await decryptFor(pass, e), "Marta");
  assert.strictEqual(await decryptFor("  " + pass.toUpperCase().replace(/-/g, " ") + " ", e), "Marta");
  await assert.rejects(decryptFor("sbagliata", e));
  await assert.rejects(decryptFor(generatePassphrase(), e));
  console.log("ok  cifratura / parola giusta / sbagliata / normalizzazione");

  assert.strictEqual(docId("  MÀRCO  Rossi "), docId("marco rossi"));
  assert.notStrictEqual(docId("Anna"), docId("Luca"));
  assert(!/[\/+=]/.test(docId("Zoë / Ünï")), "id non sicuro per Firestore");
  console.log("ok  normalizzazione nomi / id documento");
})().catch(e => { console.error("FALLITO:", e); process.exit(1); });
