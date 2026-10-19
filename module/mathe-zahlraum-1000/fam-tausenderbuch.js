/* module/mathe-zahlraum-1000/fam-tausenderbuch.js: Aufgabenfamilien des Themas «tausenderbuch» (ab 0.2.0).
   Eine Seite im Tausenderbuch hat 10 mal 10 Felder und beginnt mit 1, 101, 201 bis 901 (zum Beispiel «Seite 601 bis 700»). Die Zeilen laufen von
   oben nach unten, die Zahlen in einer Zeile von links nach rechts: ein Feld weiter rechts ist 1 mehr, eine Zeile tiefer sind 10 mehr.
   Nachbarfelder gibt es nur innerhalb der Seite: «Feld über 645» kommt nur vor, wenn 645 nicht in der obersten Zeile steht.
   Form «rechnung»: a, b, op und ergebnis rechnen auf. Bei Fragen nach Zeile oder Spalte ist a die Zahl im Text, b eine 0 und das Ergebnis die Antwort.
   Das Hilfsmittel für das Tausenderbuch gibt es noch nicht, die Hilfe besteht aus dem Lösungsweg in Schritten. Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const R = Z.rechnung, zw = Z.zwischen, MINUS = '−';
  const seite = rng => zw(rng, 0, 9) * 100 + 1;                                  // erste Zahl der Seite
  const kopf = s => `Seite ${s} bis ${s + 99}`;
  const zeile = (s, n) => Math.floor((n - s) / 10) + 1, spalte = (s, n) => (n - s) % 10 + 1;      // ab 1 gezählt, die Zeile von oben, die Spalte von links
  const erste = (s, n) => s + (zeile(s, n) - 1) * 10;
  const hilfe = schritte => ({ weg: 'tausenderbuch', schritte });
  /** Eine Zahl auf der Seite s, deren Zeile und Spalte ok(zeile, spalte) erfüllen. */
  const auf = (rng, s, ok) => { let n; do { n = s + rng.int(100); } while (!ok(zeile(s, n), spalte(s, n))); return n; };

  /** Nachbarfeld: schritt führt von n zum Nachbarn (−10 darüber, +10 darunter, −1 links, +1 rechts). gibt(zeile, spalte) sagt, wo es diesen Nachbarn auf der Seite gibt. */
  function nachbar(id, s0, wort, schritt, satz, gibt) {
    return { id, s: s0, form: 'rechnung', mach(rng) {
      const s = seite(rng), n = auf(rng, s, gibt), d = Math.abs(schritt), op = schritt > 0 ? '+' : MINUS;
      return { inhalt: R(n, op, d, `${kopf(s)}: ${wort} ${n}`, { art: 'nachbar', seite: s }), hilfe: hilfe([satz, `${n} ${op} ${d} = ${n + schritt}`]) };
    } };
  }

  const familien = [
    nachbar('tb-darueber', 1, 'Feld über', -10, 'Eine Zeile höher heisst 10 weniger.', r => r >= 2),
    nachbar('tb-links', 1, 'Feld links von', -1, 'Ein Feld nach links heisst 1 weniger.', (r, f) => f >= 2),
    nachbar('tb-darunter', 1, 'Feld unter', 10, 'Eine Zeile tiefer heisst 10 mehr.', r => r <= 9),
    nachbar('tb-rechts', 1, 'Feld rechts von', 1, 'Ein Feld nach rechts heisst 1 mehr.', (r, f) => f <= 9),
    { id: 'tb-ecken', s: 1, form: 'rechnung', mach(rng) {                   // die beiden Ecken, die nicht schon im Seitenkopf stehen
      const s = seite(rng), rechts = rng.int(2) === 0, b = rechts ? 9 : 90;
      return { inhalt: R(s, '+', b, `${kopf(s)}: Feld ${rechts ? 'rechts oben' : 'links unten'}`, { art: 'ecke', seite: s }),
        hilfe: hilfe([rechts ? 'Die oberste Zeile hat 10 Felder. Rechts oben steht ihre letzte Zahl.' : 'Die unterste Zeile ist die zehnte Zeile, 9 Zeilen unter der ersten. Links unten steht ihre erste Zahl.', `${s} + ${b} = ${s + b}`]) };
    } },
    { id: 'tb-anfang', s: 2, form: 'rechnung', mach(rng) {                  // erste Zahl der Zeile, in der n steht
      const s = seite(rng), n = auf(rng, s, (r, f) => f >= 2), b = spalte(s, n) - 1;
      return { inhalt: R(n, MINUS, b, `${kopf(s)}: erste Zahl der Zeile mit ${n}`, { art: 'anfang', seite: s }), hilfe: hilfe(['Die erste Zahl einer Zeile endet auf 1.', `${n} − ${b} = ${n - b}`]) };
    } },
    { id: 'tb-ende', s: 2, form: 'rechnung', mach(rng) {                    // letzte Zahl der Zeile, in der n steht
      const s = seite(rng), n = auf(rng, s, (r, f) => f <= 9), b = 10 - spalte(s, n);
      return { inhalt: R(n, '+', b, `${kopf(s)}: letzte Zahl der Zeile mit ${n}`, { art: 'ende', seite: s }), hilfe: hilfe(['Die letzte Zahl einer Zeile endet auf 0.', `${n} + ${b} = ${n + b}`]) };
    } },
    { id: 'tb-zeile-von', s: 2, form: 'rechnung', mach(rng) {                // in welcher Zeile steht n
      const s = seite(rng), n = s + rng.int(100), r = zeile(s, n), e = erste(s, n);
      return { inhalt: R(n, '+', 0, `${kopf(s)}: Zeile, in der ${n} steht`, { ergebnis: r, art: 'zeile-von', seite: s }),
        hilfe: hilfe([`${n} steht in der Zeile, die mit ${e} beginnt.`, `${e} − ${s} = ${e - s}`, `${e - s} : 10 = ${r - 1}`, `${r - 1} + 1 = ${r}`]) };
    } },
    { id: 'tb-spalte-von', s: 2, form: 'rechnung', mach(rng) {               // in welcher Spalte steht n
      const s = seite(rng), n = s + rng.int(100), f = spalte(s, n), e = erste(s, n);
      return { inhalt: R(n, '+', 0, `${kopf(s)}: Spalte, in der ${n} steht`, { ergebnis: f, art: 'spalte-von', seite: s }),
        hilfe: hilfe([`Die Zeile von ${n} beginnt mit ${e}.`, `${n} − ${e} = ${n - e}`, `${n - e} + 1 = ${f}`]) };
    } },
    { id: 'tb-seitenanfang', s: 2, form: 'rechnung', mach(rng) {            // erste Zahl der Seite, auf der n steht: ein voller Hunderter gehört noch zur Seite davor
      const n = rng.int(3) === 0 ? zw(rng, 1, 9) * 100 + rng.int(2) : zw(rng, 2, 999), s = Math.floor((n - 1) / 100) * 100 + 1;
      return { inhalt: R(n, MINUS, n - s, `Tausenderbuch: erste Zahl der Seite mit ${n}`, { art: 'seitenanfang' }),
        hilfe: hilfe([`${n} steht auf der Seite ${s} bis ${s + 99}.`, `${s - 1} + 1 = ${s}`]) };
    } },
    { id: 'tb-zeile-spalte', s: 2, form: 'rechnung', mach(rng) {            // Zahl in Zeile r und Spalte f
      const s = seite(rng), r = zw(rng, 2, 10), f = zw(rng, 2, 10), b = (r - 1) * 10 + (f - 1), e = s + (r - 1) * 10;
      return { inhalt: R(s, '+', b, `${kopf(s)}: Zeile ${r}, Spalte ${f}`, { art: 'zeile-spalte', seite: s, zeile: r, spalte: f }),
        hilfe: hilfe([`Zeile ${r} beginnt mit ${e}.`, `${s} + ${(r - 1) * 10} = ${e}`, `${e} + ${f - 1} = ${s + b}`]) };
    } },
    { id: 'tb-zwei-zeilen', s: 3, form: 'rechnung', mach(rng) {              // zwei Zeilen höher oder tiefer
      const s = seite(rng), hoch = rng.int(2) === 0, n = auf(rng, s, r => (hoch ? r >= 3 : r <= 8)), op = hoch ? MINUS : '+';
      return { inhalt: R(n, op, 20, `${kopf(s)}: Feld zwei Zeilen ${hoch ? 'höher' : 'tiefer'} als ${n}`, { art: 'zwei-zeilen', seite: s }),
        hilfe: hilfe(['Eine Zeile sind 10 Felder.', '2 · 10 = 20', `${n} ${op} 20 = ${hoch ? n - 20 : n + 20}`]) };
    } },
    { id: 'tb-schraeg', s: 3, form: 'rechnung', mach(rng) {                  // schräg: eine Zeile und ein Feld
      const s = seite(rng), art = rng.int(4), oben = art < 2, links = art % 2 === 0, schritt = (oben ? -10 : 10) + (links ? -1 : 1);
      const n = auf(rng, s, (r, f) => (oben ? r >= 2 : r <= 9) && (links ? f >= 2 : f <= 9)), wo = `${links ? 'links' : 'rechts'} ${oben ? 'oben' : 'unten'}`, d = Math.abs(schritt), op = schritt > 0 ? '+' : MINUS;
      return { inhalt: R(n, op, d, `${kopf(s)}: Feld schräg ${wo} von ${n}`, { art: 'schraeg', seite: s }),
        hilfe: hilfe([`Schräg ${wo} heisst: eine Zeile ${oben ? 'höher' : 'tiefer'} und ein Feld nach ${links ? 'links' : 'rechts'}.`, d === 11 ? '10 + 1 = 11' : '10 − 1 = 9', `${n} ${op} ${d} = ${n + schritt}`]) };
    } }
  ];

  const nachbarn4 = i => [i.a - 10, i.a + 10, i.a - 1, i.a + 1];
  const voraus = { 'tb-darunter': ['tb-darueber'], 'tb-rechts': ['tb-links'], 'tb-ecken': ['tb-darunter', 'tb-rechts'], 'tb-anfang': ['tb-links'], 'tb-ende': ['tb-rechts', 'tb-anfang'],
    'tb-zeile-von': ['tb-anfang'], 'tb-spalte-von': ['tb-zeile-von'], 'tb-seitenanfang': ['tb-anfang'], 'tb-zeile-spalte': ['tb-ecken', 'tb-zeile-von'],
    'tb-zwei-zeilen': ['tb-darunter'], 'tb-schraeg': ['tb-zwei-zeilen', 'tb-rechts'] };
  L.generator('mathe-zahlraum-1000/tausenderbuch', F.bauen('mathe-zahlraum-1000/tausenderbuch', familien, F.zahlDiag(
    (z, c, i) => ['nachbar', 'zwei-zeilen', 'schraeg'].includes(i.art) && nachbarn4(i).includes(z) && 'tausenderbuch-nachbar-verwechselt',
    (z, c, i) => ['anfang', 'ende', 'ecke'].includes(i.art) && Math.abs(z - c) === 1 && 'zeilenrand-um-eins',
    (z, c, i) => i.art === 'zeile-von' && z === spalte(i.seite, i.a) && 'zeile-spalte-verwechselt',
    (z, c, i) => i.art === 'spalte-von' && z === zeile(i.seite, i.a) && 'zeile-spalte-verwechselt',
    (z, c) => c >= 100 && z >= 100 && z <= 1000 && z % 100 === c % 100 && Math.floor(z / 100) !== Math.floor(c / 100) && 'hunderterziffer-falsch'), voraus));
})(globalThis);
