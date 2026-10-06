/* module/_gemeinsam/zahlen.js: gemeinsamer Baustein für Module im Zahlenraum bis 1000 und etwas darüber (Architektur 4.1 und 4.3).
   Reine Funktionen auf ganzen Zahlen: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Drei Gruppen:
   1. Zerlegen und Benennen: stellen(n), zahlwort(n), rechnung(a, op, b, text, plus).
   2. Zufall aus einem übergebenen rng (Lernwelt.Zufall.aus): zwischen(rng, min, max), vielfaches(rng, schritt, min, max).
   3. Fehlerarten bei Zahlen im Stellenwertsystem: einerZehnerVertauscht, nullVergessen, hunderterWeg, abstand. Wer sie nutzt,
      schreibt die Texte für Kind und Eltern selbst in sein fehlerCodes (Modul mathe-zahlraum-1000: modul.js).
   Gebrauch: das Modul nennt den Baustein in modul.js unter braucht: ['_gemeinsam/zahlen'], sein Generator liest ihn mit
   Lernwelt.registry.bausteine.get('_gemeinsam/zahlen'). Nicht-Zahlen (NaN, Texte, fehlende Antwort) ergeben bei den Fehlerarten false. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ganz = Number.isInteger;
  const MINUS = '−';                                                    // Minuszeichen wie im Feld op der Form «rechnung»
  const EINER = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  const ZEHN = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const ZEHNER = ['', '', 'zwanzig', 'dreissig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

  /** Stellen einer Zahl von 0 bis 99999: { t, h, z, e } sind die Ziffern (t kann über 9 sein). */
  function stellen(n) {
    if (!ganz(n) || n < 0 || n > 99999) throw new RangeError(`stellen: «${n}» ist keine ganze Zahl von 0 bis 99999`);
    return { t: Math.floor(n / 1000), h: Math.floor(n / 100) % 10, z: Math.floor(n / 10) % 10, e: n % 10 };
  }

  /** Zahlwort von 1 bis 999 in Schweizer Schreibweise ohne Eszett: 54 = vierundfünfzig, 301 = dreihunderteins, 143 = hundertdreiundvierzig. */
  function zahlwort(n) {
    if (!ganz(n) || n < 1 || n > 999) throw new RangeError(`zahlwort: «${n}» ist keine ganze Zahl von 1 bis 999`);
    const { h, z, e } = stellen(n), r = n % 100;
    const rest = r === 0 ? '' : r < 10 ? (e === 1 ? 'eins' : EINER[e]) : r < 20 ? ZEHN[r - 10] : (e ? `${EINER[e]}und` : '') + ZEHNER[z];
    return (h ? `${h === 1 ? '' : EINER[h]}hundert` : '') + rest;
  }

  /** Inhalt der Form «rechnung» mit berechnetem Ergebnis. plus: weitere Felder (Zusatzfelder sind erlaubt), zum Beispiel { h, z, e }. */
  function rechnung(a, op, b, text, plus = {}) {
    const ergebnis = op === '+' ? a + b : op === MINUS ? a - b : op === '·' ? a * b : a / b;
    if (!ganz(ergebnis)) throw new RangeError(`rechnung: ${a} ${op} ${b} geht nicht auf`);
    return { a, b, op, ergebnis, text, ...plus };
  }

  /** Ganze Zahl von min bis max (beide eingeschlossen). */
  const zwischen = (rng, min, max) => min + rng.int(max - min + 1);

  /** Vielfaches von schritt zwischen min und max (beide eingeschlossen, min und max selbst nicht unbedingt ein Vielfaches). */
  function vielfaches(rng, schritt, min, max) {
    const von = Math.ceil(min / schritt), bis = Math.floor(max / schritt);
    if (bis < von) throw new RangeError(`vielfaches: kein Vielfaches von ${schritt} zwischen ${min} und ${max}`);
    return zwischen(rng, von, bis) * schritt;
  }

  /** Einer und Zehner vertauscht, die Hunderter stehen richtig (345 statt 354). Die inverse Sprechweise «vierundfünfzig» führt dazu. */
  const einerZehnerVertauscht = (z, c) => ganz(z) && ganz(c) && c >= 10 && c <= 999 && z !== c && Math.floor(c / 100) * 100 + (c % 10) * 10 + Math.floor(c / 10) % 10 === z;

  /** Die Null als Platzhalter fehlt (57 statt 507, 35 statt 350). */
  const nullVergessen = (z, c) => ganz(z) && ganz(c) && c >= 10 && z > 0 && z !== c && String(c).includes('0') && Number(String(c).replace(/0/g, '')) === z;

  /** Der Hunderter fehlt, nur der Rest steht da (54 statt 354). */
  const hunderterWeg = (z, c) => ganz(z) && ganz(c) && c > 100 && c % 100 !== 0 && z === c % 100;

  /** Abstand zwischen Antwort und Ergebnis, sonst null. */
  const abstand = (z, c) => (ganz(z) && ganz(c) ? Math.abs(z - c) : null);

  L.baustein('_gemeinsam/zahlen', L.einfrieren({ stellen, zahlwort, rechnung, zwischen, vielfaches, einerZehnerVertauscht, nullVergessen, hunderterWeg, abstand }));
})(globalThis);
