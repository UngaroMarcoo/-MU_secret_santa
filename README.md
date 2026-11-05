# Secret Santa 🎅

Sito per estrarre il Secret Santa con gli amici: un link nel gruppo, ognuno entra con nome e password e scopre a chi fare il regalo. Pagina statica su GitHub Pages + database gratuito Firebase (nessun server proprio).

- **Sito:** https://ungaromarcoo.github.io/-MU_secret_santa/
- **Repository:** https://github.com/UngaroMarcoo/-MU_secret_santa
- **Progetto Firebase:** `musecretsanta` (console.firebase.google.com)

## Come si usa

**Organizzatore (account `MU_root`)**
1. Apri il sito, entra con nome `MU_root` e la password di root.
2. Aggiungi i partecipanti (anche te stesso). Ad ognuno viene generata una password tipo `mela-tigre-42`.
3. Facoltativo: scrivi le esclusioni (una riga per gruppo, nomi separati da virgola, es. le coppie).
4. Manda in privato a ciascuno nome e password con il tasto **Copia** (copia solo `Nome: X` / `Password: Y`). Si può fare anche prima dell'estrazione.
5. Premi **Fai partire l'estrazione**. Root non vede il risultato.
6. Nella sezione Credenziali l'icona accanto al nome mostra se la persona ha aperto il regalo (chiuso/aperto). Il tasto **↻ Aggiorna** ricontrolla.
7. **Rifai l'estrazione** / **Annulla l'estrazione** se serve. Le password restano le stesse.
8. **Mostra gli abbinamenti…** solo in caso di necessità, dopo un avviso di conferma.

**Partecipante**: apre il link, scrive nome e password, tocca il regalo → coriandoli e nome che si compone. Se l'estrazione non è stata fatta vede l'avviso "non ancora fatta".

**Riuso negli anni**: basta togliere i vecchi nomi, aggiungere i nuovi e rifare l'estrazione.

## Struttura dei file

| File | Cosa contiene |
|---|---|
| `index.html` | Struttura della pagina: login, regalo (partecipante), pannello root, dialog di conferma |
| `style.css` | Tutta la grafica natalizia e le animazioni |
| `app.js` | Logica dell'interfaccia: login, Firebase, pannello root, effetti (neve, ghirlanda, coriandoli) |
| `core.js` | Nucleo senza interfaccia: estrazione, cifratura, generazione password. Gira anche in Node |
| `firebase-config.js` | Configurazione del progetto Firebase (non è segreta) |
| `firestore.rules` | Regole di sicurezza di Firestore da incollare nella console |
| `test.js` | Test del nucleo: `node test.js` |

## Come funziona (architettura)

- **Estrazione** (`draw` in `core.js`): permutazione casuale con backtracking, nessuno pesca sé stesso, rispetta le esclusioni di gruppo. Se impossibile restituisce `null`.
- **Cifratura**: per ogni persona l'abbinamento è cifrato nel browser di root con la password della persona (PBKDF2-SHA256 300.000 iterazioni → AES-GCM). Nel database c'è solo il testo cifrato.
- **Login unico**: se il nome è `mu_root` (case-insensitive) → Firebase Authentication con email `mu_root@example.com`. Altrimenti si legge `people/{id}` e si prova a decifrare con la password: se riesce, è la password giusta.
- **Password** (`generatePassphrase`): 2 parole italiane (lista di 127) + 2 cifre, es. `mela-tigre-42`. Normalizzate: maiuscole e spazi ignorati.
- **ID documento** (`docId`): nome normalizzato (minuscolo, senza accenti) in base64url.

### Dati su Firestore

| Percorso | Contenuto | Chi può leggere / scrivere |
|---|---|---|
| `config/main` | `assigned` (estrazione fatta sì/no), `title`, `groups` (righe di esclusioni), `assignedAt` | lettura: tutti, scrittura: root |
| `people/{id}` | `name`, e dopo l'estrazione `s`,`i`,`c` (abbinamento cifrato), `opened`, `openedAt` | `get`: tutti; elenco: solo root; scrittura: root; update dei soli campi `opened`/`openedAt`: tutti |
| `private/master` | `{pairs, passes}` cifrato con la **password di root** | solo root |

Attenzione: la password di root cifra `private/master`. Se la si cambia in Firebase, l'elenco credenziali e "Mostra abbinamenti" non sono più leggibili: serve rifare l'estrazione (che rigenera le password) oppure non toccare nulla (gli amici continuano a vedere il loro abbinamento).

## Setup Firebase (da rifare solo se si crea un nuovo progetto)

1. Crea il progetto su console.firebase.google.com (Analytics disattivato).
2. **Authentication** → metodo **Email/password** attivo → aggiungi utente `mu_root@example.com` con la password di root.
3. **Firestore Database** → crea database (`eur3`, modalità produzione).
4. Scheda **Regole**: incolla `firestore.rules` e pubblica. **Ogni modifica a `firestore.rules` va ripubblicata a mano nella console.**
5. Impostazioni progetto → Le tue app → Web `</>` → copia `firebaseConfig` in `firebase-config.js`.
6. Se cambia l'email di root, aggiorna `ROOT_EMAIL` in `app.js` e `isRoot()` in `firestore.rules`.

## Grafica ed effetti

Cielo notturno con stelle che brillano e aurora animata; neve su canvas che reagisce al movimento del dito/mouse; ghirlanda di luci colorate lampeggianti; alberelli che ondeggiano; slitta di Babbo Natale che attraversa lo schermo; titolo con riflesso dorato; card in vetro sfocato; pulsante con riflesso; regalo che salta, trema e si apre con coriandoli; nome che si compone con effetto "decodifica"; icone SVG regalo aperto/chiuso nel pannello root. Pensato prima per il telefono; rispetta `prefers-reduced-motion`.

## Sviluppo e test

- `node test.js` verifica estrazione, cifratura, password sbagliate, normalizzazione dei nomi.
- In locale: `python3 -m http.server 8765` nella cartella, poi http://localhost:8765 (i moduli JS non funzionano aprendo il file con doppio clic in alcuni browser).
- Pubblicazione: `git push origin main` → GitHub Pages si aggiorna da solo in 1-2 minuti.

## Limiti noti

- Le password corte (≈21 bit) sono adatte a un gioco tra amici: chi conoscesse i nomi e avesse molta potenza di calcolo potrebbe provarle tutte offline. Per più sicurezza: aggiungere una terza parola in `generatePassphrase`.
- Il segnale "regalo aperto" non è verificabile lato server: chi conosce un nome potrebbe marcarlo come aperto.
- Il layout da telefono è stato controllato solo in modo indiretto (browser headless); da verificare su dispositivi reali.
- Le password non si possono recuperare lato server: root le rivede nella sezione Credenziali.
