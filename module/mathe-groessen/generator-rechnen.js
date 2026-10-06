/* module/mathe-groessen/generator-rechnen.js: Aufgabenbestand «Rechnen mit Geld» und «Rechnen mit Längen und Gewichten in einer Einheit»
   (Form rechnung, Typ eingabe) und die Fehlerdiagnose dazu, nur für dieses Modul. Die Aufgaben stehen als feste Listen da, das Ergebnis rechnet pool.
   Lösungswege: Zusammenzählen und Malnehmen werden zerlegt (erst die Zehner, dann die Einer), Abziehen und Rückgeld werden ergänzt
   (vom kleineren Wert bis zum grösseren). Die Hilfe zeigt dazu den Rechenstrich.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const B = L.registry.bausteine.get('_gemeinsam/rechnen');
  if (!B) throw new Error('mathe-groessen: Baustein «_gemeinsam/rechnen» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');

  const MINUS = '−';                       // Minuszeichen wie im Feld op der Form «rechnung»
  const OP = { add: '+', sub: MINUS, rueck: MINUS, mal: '·' };
  const franken = rp => Math.floor(rp / 100), rest = rp => rp % 100;
  const betragText = rp => [franken(rp) ? `${franken(rp)} Fr.` : '', rest(rp) ? `${rest(rp)} Rp.` : ''].filter(Boolean).join(' ');

  /** Ergebnis aus a, b und der Art der Aufgabe. */
  const ergebnisVon = (art, a, b) => (art === 'add' ? a + b : art === 'mal' ? a * b : a - b);

  /** Lösungsweg und Rechenstrich in der Einheit u. Zusammenzählen und Malnehmen zerlegen b in Zehner und Einer, Abziehen und Rückgeld ergänzen. */
  function weg(art, a, b, c, u) {
    const e = x => `${x} ${u}`;
    if (art === 'add') {
      const b2 = b % 10, b1 = b - b2;
      if (b1 === 0 || b2 === 0) return { weg: 'zerlegen', schritte: [`${e(a)} + ${e(b)} = ${e(c)}`], hilfsmittel: { name: 'rechenstrich', daten: { start: a, spruenge: [b], verdecke: 'ende' } } };
      return { weg: 'zerlegen', schritte: [`${e(a)} + ${e(b1)} = ${e(a + b1)}`, `${e(a + b1)} + ${e(b2)} = ${e(c)}`],
               hilfsmittel: { name: 'rechenstrich', daten: { start: a, spruenge: [b1, b2], verdecke: 'ende' } } };
    }
    if (art === 'mal') {
      const b2 = b % 10, b1 = b - b2, teile = b1 === 0 || b2 === 0 ? [`${a} · ${e(b)} = ${e(c)}`]
        : [`${a} · ${e(b1)} = ${e(a * b1)}`, `${a} · ${e(b2)} = ${e(a * b2)}`, `${e(a * b1)} + ${e(a * b2)} = ${e(c)}`];
      return { weg: 'zerlegen', schritte: teile,
               ...(a <= 6 && { hilfsmittel: { name: 'rechenstrich', daten: { start: 0, spruenge: Array(a).fill(b), verdecke: 'ende' } } }) };
    }
    if (b % 10 === 0) return { weg: 'ergaenzen', schritte: [`${e(b)} + ${e(c)} = ${e(a)}`, `Unterschied: ${e(c)}`], hilfsmittel: { name: 'rechenstrich', daten: { start: b, spruenge: [c] } } };
    const s1 = 10 - (b % 10), mitte = b + s1, rest2 = a - mitte, teile = rest2 > 0 ? [s1, rest2] : [s1];
    return { weg: 'ergaenzen',
             schritte: [`${e(b)} + ${e(s1)} = ${e(mitte)}`, ...(rest2 > 0 ? [`${e(mitte)} + ${e(rest2)} = ${e(a)}`] : []),
                        teile.length > 1 ? `Unterschied: ${teile.join(' + ')} = ${e(c)}` : `Unterschied: ${e(c)}`],
             hilfsmittel: { name: 'rechenstrich', daten: { start: b, spruenge: teile } } };
  }

  /** Eine Aufgabe der Form «rechnung». einheit steht nur zur Beschreibung im Inhalt (das Zahlenfeld nimmt die Zahl ohne Einheit). */
  function aufgabe(id, art, a, b, text, u, schwierigkeit) {
    const c = ergebnisVon(art, a, b);
    return { id, form: 'rechnung', inhalt: { a, b, op: OP[art], ergebnis: c, text, einheit: u }, schwierigkeit, hilfe: weg(art, a, b, c, u) };
  }

  /** Rückgeld und Rechnung mit Geld in Franken oder Rappen: [Art, a, b, Schwierigkeit]. */
  const GELD = {
    franken: { praefix: 'fr', einheit: 'Fr.', liste: [
      ['add', 12, 34, 1], ['add', 25, 43, 1], ['add', 30, 45, 1], ['add', 27, 45, 2], ['add', 38, 47, 2], ['add', 56, 38, 2], ['add', 250, 130, 3], ['add', 345, 278, 3],
      ['rueck', 20, 14, 1], ['rueck', 100, 85, 1], ['rueck', 50, 37, 2], ['rueck', 100, 64, 2], ['rueck', 100, 47, 2], ['rueck', 50, 28, 2], ['rueck', 200, 175, 3], ['rueck', 500, 380, 3],
      ['mal', 2, 35, 1], ['mal', 8, 10, 1], ['mal', 5, 20, 1], ['mal', 3, 15, 2], ['mal', 4, 12, 2], ['mal', 6, 25, 3], ['mal', 7, 15, 3], ['mal', 4, 45, 3]
    ] },
    rappen: { praefix: 'rp', einheit: 'Rp.', liste: [
      ['add', 15, 30, 1], ['add', 20, 35, 1], ['add', 35, 45, 1], ['add', 45, 50, 1], ['add', 65, 40, 2], ['add', 75, 55, 2], ['add', 85, 60, 2], ['add', 95, 95, 3],
      ['rueck', 100, 35, 1], ['rueck', 100, 60, 1], ['rueck', 100, 85, 1], ['rueck', 100, 45, 1], ['rueck', 200, 85, 2], ['rueck', 100, 70, 2], ['rueck', 200, 130, 3], ['rueck', 200, 45, 3],
      ['mal', 3, 20, 1], ['mal', 4, 15, 2], ['mal', 5, 25, 2], ['mal', 3, 45, 3]
    ] }
  };

  /** Aufgabentext: «27 Fr. + 45 Fr.», «Rückgeld: 50 Fr. − 37 Fr.», «3 · 15 Fr.». Beträge in Rappen über 100 stehen als «1 Fr. 30 Rp.». */
  function geldText(art, a, b, u) {
    if (art === 'rueck') return u === 'Fr.' ? `Rückgeld: ${a} Fr. ${MINUS} ${b} Fr.` : `Rückgeld in Rp.: ${betragText(a)} ${MINUS} ${betragText(b)}`;
    return art === 'mal' ? `${a} · ${b} ${u}` : `${a} ${u} ${OP[art]} ${b} ${u}`;
  }

  /** Längen und Gewichte in einer Einheit: [Einheit, Art, a, b, Schwierigkeit]. */
  const MASSE = [
    ['cm', 'add', 35, 48, 1], ['cm', 'sub', 100, 35, 1], ['cm', 'add', 67, 28, 2], ['cm', 'sub', 82, 47, 2], ['cm', 'mal', 4, 15, 2],
    ['mm', 'add', 45, 38, 2], ['mm', 'sub', 100, 64, 2],
    ['m', 'add', 125, 250, 2], ['m', 'mal', 6, 25, 2], ['m', 'sub', 500, 175, 3],
    ['km', 'add', 48, 35, 2], ['km', 'mal', 5, 12, 2], ['km', 'sub', 120, 85, 3],
    ['g', 'add', 250, 300, 1], ['g', 'add', 475, 350, 2], ['g', 'sub', 1000, 350, 2], ['g', 'sub', 800, 275, 3], ['g', 'mal', 4, 125, 3],
    ['kg', 'add', 27, 45, 2], ['kg', 'sub', 100, 38, 2], ['kg', 'mal', 6, 15, 2], ['kg', 'add', 350, 275, 3], ['kg', 'sub', 500, 128, 3]
  ];

  /** Fehlerdiagnose für beide Generatoren: antwort ist { zahl }. */
  function diagnose(auf, antwort) {
    const { a, b, op, ergebnis: c } = auf.inhalt, z = antwort && antwort.zahl;
    if (z === c) return null;
    if (!Number.isInteger(z)) return 'sonstige';
    if ((op === '+' && z === a - b) || (op === MINUS && z === a + b) || (op === '·' && z === a + b)) return 'rechenzeichen-vertauscht';
    if (B.ziffernVertauscht(z, c)) return 'ziffern-vertauscht';
    if (B.zehnerDaneben(z, c)) return 'zehner-daneben';
    return 'sonstige';
  }

  L.generator('mathe-groessen/geld-rechnen', {
    pool(params) {
      const name = params && params.art, geld = typeof name === 'string' && Object.hasOwn(GELD, name) ? GELD[name] : null;
      if (!geld) throw new Error(`mathe-groessen/geld-rechnen: params.art muss eine von ${Object.keys(GELD).join(', ')} sein`);
      return geld.liste.map(([art, a, b, schwer]) => aufgabe(`${geld.praefix}-${art}-${a}-${b}`, art, a, b, geldText(art, a, b, geld.einheit), geld.einheit, schwer));
    },
    diagnose
  });

  L.generator('mathe-groessen/masse-rechnen', {
    pool: () => MASSE.map(([u, art, a, b, schwer]) => aufgabe(`${u}-${art}-${a}-${b}`, art, a, b, art === 'mal' ? `${a} · ${b} ${u}` : `${a} ${u} ${OP[art]} ${b} ${u}`, u, schwer)),
    diagnose
  });
})(globalThis);
