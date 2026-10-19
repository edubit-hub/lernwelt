/* module/mathe-zahlraum-1000/fam-ordnen.js: Aufgabenfamilien der Themen «ordnen» (Zahlen der Grösse nach ordnen, Form abfolge)
   und «vergleichen» (Zeichen <, > oder = setzen, Form auswahl). Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen.
   Ordnen: die Schritte stehen in der richtigen Reihenfolge, der Typ mischt sie. Vergleichen: die falschen Zeichen tragen einen Fehlercode,
   den der Typ im Ergebnis meldet. Zufall nur über den rng; Schleifen mit «do … while» suchen deterministisch weiter. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const zw = Z.zwischen, ZIFFERN = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const verschiedene = (rng, n, erzeuge, ok = () => true) => {         // n verschiedene Zahlen, die ok erfüllen
    let liste;
    do { liste = []; while (liste.length < n) { const x = erzeuge(rng); if (!liste.includes(x)) liste.push(x); } } while (!ok(liste));
    return liste;
  };
  const stellenZahl = (h, z, e) => h * 100 + z * 10 + e;
  const verschiedeneH = liste => new Set(liste.map(n => Math.floor(n / 100))).size;
  /** Alle Zahlen aus den Ziffern a, b und c in jeder Reihenfolge (eine führende Null lässt eine zweistellige Zahl übrig), ohne Doppelte. */
  const perm = (a, b, c) => [...new Set([[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]].map(([x, y, z]) => stellenZahl(x, y, z)))];
  const drei = rng => rng.mische(ZIFFERN).slice(0, 3);

  /* ---------- Ordnen ---------- */
  function ordnen(id, s, aufsteigend, zahlen) {
    return { id, s, form: 'abfolge', mach(rng) {
      const liste = zahlen(rng).sort((a, b) => (aufsteigend ? a - b : b - a)), zeichen = aufsteigend ? '<' : '>';
      return { inhalt: { frage: aufsteigend ? 'Ordne von der kleinsten zur grössten Zahl.' : 'Ordne von der grössten zur kleinsten Zahl.', schritte: liste.map(String), art: 'ordnen', aufsteigend },
        hilfe: { weg: 'ordnen', schritte: ['Vergleiche zuerst die Hunderter, dann die Zehner, dann die Einer.', liste.join(` ${zeichen} `)] } };
    } };
  }
  const hunderterWahl = n => rng => verschiedene(rng, n, r => r.int(900) + 100, l => verschiedeneH(l) === n);
  const vier = rng => verschiedene(rng, 4, r => r.int(900) + 100, l => verschiedeneH(l) >= 3);
  const ziffernVier = rng => { const [a, b, c] = drei(rng); return rng.mische(perm(a, b, c)).slice(0, 4); };
  const mitNull = rng => { const [a, b] = drei(rng); return rng.mische(perm(a, b, 0)).slice(0, 4); };

  const geordnet = [
    ordnen('or-auf-3', 1, true, hunderterWahl(3)), ordnen('or-ab-3', 1, false, hunderterWahl(3)),
    ordnen('or-auf-4', 2, true, vier), ordnen('or-ab-4', 2, false, vier),
    ordnen('or-h-gleich', 2, true, rng => { const h = zw(rng, 1, 9); return verschiedene(rng, 4, r => stellenZahl(h, r.int(10), r.int(10)), l => new Set(l.map(n => Math.floor(n / 10))).size === 4); }),
    ordnen('or-hz-gleich', 3, true, rng => { const h = zw(rng, 1, 9), z = zw(rng, 0, 9); return verschiedene(rng, 4, r => stellenZahl(h, z, r.int(10))); }),
    ordnen('or-ziffern-auf', 3, true, ziffernVier), ordnen('or-ziffern-ab', 3, false, ziffernVier),
    ordnen('or-null', 3, true, mitNull),
    /* ab 0.2.0: fünf und sechs Zahlen, auch nahe beieinander um einen vollen Hunderter (der Typ reihenfolge trägt bis acht Karten) */
    ordnen('or-auf-5', 2, true, rng => verschiedene(rng, 5, r => r.int(900) + 100, l => verschiedeneH(l) >= 3)),
    ordnen('or-auf-6', 3, true, rng => verschiedene(rng, 6, r => r.int(900) + 100, l => verschiedeneH(l) >= 3)),
    ordnen('or-ab-6', 3, false, rng => verschiedene(rng, 6, r => r.int(900) + 100, l => verschiedeneH(l) >= 3)),
    ordnen('or-nah-6', 3, true, rng => {
      const m = zw(rng, 2, 9) * 100;                                     // sechs Zahlen höchstens 69 neben der Marke, mindestens zwei darunter und zwei darüber
      return verschiedene(rng, 6, r => m - 69 + r.int(139), l => l.filter(x => x < m).length >= 2 && l.filter(x => x > m).length >= 2);
    })
  ];

  const zuerstO = { 'or-ab-3': ['or-auf-3'], 'or-auf-4': ['or-auf-3'], 'or-ab-4': ['or-ab-3', 'or-auf-4'], 'or-h-gleich': ['or-auf-4'], 'or-hz-gleich': ['or-h-gleich'],
    'or-ziffern-auf': ['or-h-gleich'], 'or-ziffern-ab': ['or-ziffern-auf'], 'or-null': ['or-ziffern-auf'],
    'or-auf-5': ['or-auf-4'], 'or-auf-6': ['or-auf-5'], 'or-ab-6': ['or-auf-6', 'or-ab-4'], 'or-nah-6': ['or-auf-6', 'or-h-gleich'] };
  L.generator('mathe-zahlraum-1000/ordnen', F.bauen('mathe-zahlraum-1000/ordnen', geordnet, (auf, antwort) => {
    const folge = antwort && antwort.folge, n = auf.inhalt.schritte.length;
    if (!Array.isArray(folge) || folge.length !== n) return 'sonstige';
    if (folge.every((v, k) => v === k)) return null;
    return folge.every((v, k) => v === n - 1 - k) ? 'richtung-verdreht' : 'sonstige';
  }, zuerstO));

  /* ---------- Vergleichen ---------- */
  const code = (richtig, x) => (richtig === '=' ? 'ungleich-gesetzt' : x === '=' ? 'gleich-gesetzt' : 'zeichen-verdreht');

  /** paar(rng) → { links, rechts, a, b }: links und rechts stehen im Text, a und b sind die Werte. */
  function vergleich(id, s, paar) {
    return { id, s, form: 'auswahl', mach(rng) {
      const p = paar(rng), richtig = p.a < p.b ? '<' : p.a > p.b ? '>' : '=';
      const falsch = ['<', '>', '='].filter(x => x !== richtig).map(x => ({ text: x, code: code(richtig, x) }));
      const links = String(p.links) === String(p.a) ? [] : [`${p.links} = ${p.a}`];
      return { inhalt: { frage: `Welches Zeichen passt: ${p.links} ? ${p.rechts}`, richtig, falsch, art: 'vergleich', a: p.a, b: p.b },
        hilfe: { weg: 'ordnen', schritte: ['Vergleiche zuerst die Hunderter, dann die Zehner, dann die Einer.', ...links, `${p.a} ${richtig} ${p.b}`] } };
    } };
  }
  const gleich = (a, b) => ({ links: a, rechts: b, a, b });
  const zwei = (rng, erzeuge, ok) => { const [a, b] = verschiedene(rng, 2, erzeuge, ok); return gleich(a, b); };
  const zerlegt = n => { const { h, z, e } = Z.stellen(n); return `${h * 100} + ${z * 10} + ${e}`; };

  const vergleiche = [
    vergleich('vg-h', 1, rng => { const [a, b] = verschiedene(rng, 2, r => r.int(900) + 100, l => verschiedeneH(l) === 2); return gleich(a, b); }),
    vergleich('vg-z', 1, rng => { const h = zw(rng, 1, 9); return zwei(rng, r => stellenZahl(h, r.int(10), r.int(10)), l => Math.floor(l[0] / 10) !== Math.floor(l[1] / 10)); }),
    vergleich('vg-e', 2, rng => { const h = zw(rng, 1, 9), z = zw(rng, 0, 9); return zwei(rng, r => stellenZahl(h, z, r.int(10))); }),
    vergleich('vg-ziffern', 2, rng => { const [a, b, c] = drei(rng), [x, y] = rng.mische(perm(a, b, c)); return gleich(x, y); }),
    vergleich('vg-null', 3, rng => { const [a, b] = drei(rng), [x, y] = rng.mische(perm(a, b, 0)); return gleich(x, y); }),
    vergleich('vg-nachbar', 2, rng => { const n = Z.vielfaches(rng, 10, 110, 990), [x, y] = rng.int(2) ? [n - 1, n] : [n, n + 1]; return gleich(x, y); }),
    vergleich('vg-zerlegung', 3, rng => {
      const [h, z, e] = drei(rng), a = stellenZahl(h, z, e), b = rng.waehle([a, a, stellenZahl(h, e, z), stellenZahl(e, z, h)]);
      return { links: zerlegt(a), rechts: b, a, b };
    }),
    vergleich('vg-zehner', 3, rng => { const k = zw(rng, 11, 98), b = rng.waehle([k * 10, k * 10, k * 10 + 10, Math.floor(k / 10) * 100 + k % 10]); return { links: `${k} Zehner`, rechts: b, a: k * 10, b }; })
  ];

  const zuerstV = { 'vg-z': ['vg-h'], 'vg-e': ['vg-z'], 'vg-ziffern': ['vg-z'], 'vg-nachbar': ['vg-z'], 'vg-null': ['vg-ziffern'], 'vg-zerlegung': ['vg-e'], 'vg-zehner': ['vg-zerlegung'] };
  L.generator('mathe-zahlraum-1000/vergleichen', F.bauen('mathe-zahlraum-1000/vergleichen', vergleiche, undefined, zuerstV));
})(globalThis);
