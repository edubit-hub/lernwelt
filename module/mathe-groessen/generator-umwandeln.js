/* module/mathe-groessen/generator-umwandeln.js: Aufgabenbestand «Einheiten umwandeln» (Geld, Längen, Gewichte, Hohlmasse, Zeiteinheiten) und
   Fehlerdiagnose, nur für dieses Modul. Form rechnung, Typ eingabe. Umfang der 3. Klasse: nur die Stufen der Tabelle STUFEN, immer mit
   ganzen Zahlen. Je Stufe drei Arten von Aufgaben:
     gross-klein  3 m in cm        a · Faktor
     klein-gross  300 cm in m      nur volle Einheiten, a : Faktor
     gemischt     3 m 20 cm in cm  grosser Teil in der kleinen Einheit plus Rest
   Das Zahlenfeld nimmt nur die Zahl, die Einheit der Antwort steht im Aufgabentext («3 m in cm»). Die Felder faktor, umwandlung und einheit im Inhalt
   sind Zusatzfelder, die nur dieses Modul liest (Diagnose). Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const B = L.registry.bausteine.get('_gemeinsam/rechnen');
  if (!B) throw new Error('mathe-groessen: Baustein «_gemeinsam/rechnen» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');

  /** Einheit mit Einzahl, Mehrzahl und Wemfall (nach «in»). Abkürzungen ändern sich nicht. */
  const abk = n => ({ s: n, p: n, d: n });
  const EINHEIT = {
    'Fr.': abk('Fr.'), 'Rp.': abk('Rp.'), cm: abk('cm'), mm: abk('mm'), m: abk('m'), km: abk('km'), kg: abk('kg'), g: abk('g'), l: abk('l'), dl: abk('dl'), h: abk('h'), min: abk('min'),
    Tag: { s: 'Tag', p: 'Tage', d: 'Tagen' }, Woche: { s: 'Woche', p: 'Wochen', d: 'Wochen' }, Monat: { s: 'Monat', p: 'Monate', d: 'Monaten' }, Jahr: { s: 'Jahr', p: 'Jahre', d: 'Jahren' }
  };

  /** Stufen: gross, klein, Faktor (1 gross = faktor klein) und je Art die Zahlen. Die Reihenfolge der Listen ist die Reihenfolge im Bestand. */
  const STUFEN = {
    'fr-rp':      { gross: 'Fr.',   klein: 'Rp.',   faktor: 100,  gk: [1, 2, 3, 5, 7, 10], kg: [200, 300, 400, 600, 800, 1000], mix: [[1, 30], [2, 50], [3, 20], [4, 75], [5, 5], [7, 95]] },
    'cm-mm':      { gross: 'cm',    klein: 'mm',    faktor: 10,   gk: [1, 2, 3, 5, 8, 12], kg: [10, 20, 30, 50, 80, 120], mix: [[1, 5], [2, 3], [3, 7], [4, 2], [6, 5], [9, 8]] },
    'm-cm':       { gross: 'm',     klein: 'cm',    faktor: 100,  gk: [1, 2, 3, 4, 6, 10], kg: [100, 200, 300, 500, 700, 1000], mix: [[1, 20], [2, 50], [3, 5], [4, 75], [5, 40], [7, 8]] },
    'km-m':       { gross: 'km',    klein: 'm',     faktor: 1000, gk: [1, 2, 3, 5, 8, 10], kg: [1000, 2000, 3000, 5000, 7000, 10000], mix: [[1, 500], [2, 250], [3, 750], [4, 100], [6, 5], [9, 50]] },
    'kg-g':       { gross: 'kg',    klein: 'g',     faktor: 1000, gk: [1, 2, 3, 4, 6, 10], kg: [1000, 2000, 3000, 5000, 7000, 10000], mix: [[1, 500], [2, 250], [1, 750], [3, 100], [4, 5], [5, 50]] },
    'l-dl':       { gross: 'l',     klein: 'dl',    faktor: 10,   gk: [1, 2, 3, 5, 8, 10], kg: [10, 20, 30, 50, 80, 100], mix: [[1, 5], [2, 3], [3, 7], [4, 5], [6, 2], [9, 1]] },
    'h-min':      { gross: 'h',     klein: 'min',   faktor: 60,   gk: [1, 2, 3, 4, 5, 6], kg: [60, 120, 180, 240, 300, 360], mix: [[1, 30], [2, 15], [1, 45], [3, 10], [2, 40], [4, 20]] },
    'tag-h':      { gross: 'Tag',   klein: 'h',     faktor: 24,   gk: [1, 2, 3, 4, 5, 7], kg: [24, 48, 72, 96, 120, 168], mix: [[1, 6], [2, 12], [3, 8], [1, 12], [2, 6], [4, 18]] },
    'woche-tag':  { gross: 'Woche', klein: 'Tag',   faktor: 7,    gk: [1, 2, 3, 4, 6, 8], kg: [7, 14, 21, 28, 42, 56], mix: [[1, 3], [2, 5], [3, 2], [4, 6], [5, 1], [6, 4]] },
    'jahr-monat': { gross: 'Jahr',  klein: 'Monat', faktor: 12,   gk: [1, 2, 3, 4, 5, 10], kg: [12, 24, 36, 48, 60, 120], mix: [[1, 3], [2, 6], [3, 9], [4, 2], [5, 8], [6, 11]] }
  };
  const FALSCHE_FAKTOREN = [10, 100, 1000, 60, 24, 7, 12];            // Umwandlungszahlen, die Kinder miteinander verwechseln
  const zweig = n => (n === 1 ? 's' : 'p');
  const mit = (n, einheit) => `${n} ${EINHEIT[einheit][zweig(n)]}`;       // «1 Tag», «3 Tage»

  function aufgabe(stufe, art, a, b, schwierigkeit) {
    const { gross, klein, faktor } = STUFEN[stufe], G = EINHEIT[gross], K = EINHEIT[klein];
    const eins = `1 ${G.s} = ${faktor} ${K.p}`;
    if (art === 'gk') {                                         // 3 m in cm
      const c = a * faktor;
      return { id: `${stufe}-gk-${a}`, form: 'rechnung', schwierigkeit, inhalt: { a, b: faktor, op: '·', ergebnis: c, text: `${mit(a, gross)} in ${K.d}`, faktor, umwandlung: 'gross-klein', einheit: K.p },
               hilfe: { weg: 'umwandeln', schritte: a === 1 ? [eins] : [eins, `${a} · ${faktor} = ${c}`, `${mit(a, gross)} = ${mit(c, klein)}`] } };
    }
    if (art === 'kg') {                                         // 300 cm in m
      const c = a / faktor;
      return { id: `${stufe}-kg-${a}`, form: 'rechnung', schwierigkeit, inhalt: { a, b: faktor, op: ':', ergebnis: c, text: `${mit(a, klein)} in ${G.d}`, faktor, umwandlung: 'klein-gross', einheit: G.p },
               hilfe: { weg: 'umwandeln', schritte: [eins, `${a} : ${faktor} = ${c}`, `${mit(a, klein)} = ${mit(c, gross)}`] } };
    }
    const grossTeil = a * faktor, c = grossTeil + b;            // 3 m 20 cm in cm: a = 3, b = 20
    return { id: `${stufe}-mix-${a}-${b}`, form: 'rechnung', schwierigkeit,
             inhalt: { a: grossTeil, b, op: '+', ergebnis: c, text: `${mit(a, gross)} ${mit(b, klein)} in ${K.d}`, faktor, umwandlung: 'gemischt', einheit: K.p },
             hilfe: { weg: 'umwandeln', schritte: [eins, ...(a === 1 ? [] : [`${mit(a, gross)} = ${mit(grossTeil, klein)}`]), `${mit(grossTeil, klein)} + ${mit(b, klein)} = ${mit(c, klein)}`] } };
  }

  /** Bestand einer Stufe: erst gross-klein, dann klein-gross, dann gemischt, je sechs Aufgaben. Schwierigkeit: die ersten drei einer Art leichter. */
  function bestand(stufe) {
    const s = STUFEN[stufe];
    return [
      ...s.gk.map((a, i) => aufgabe(stufe, 'gk', a, null, i < 3 ? 1 : 2)),
      ...s.kg.map((a, i) => aufgabe(stufe, 'kg', a, null, i < 3 ? 2 : 3)),
      ...s.mix.map(([a, b], i) => aufgabe(stufe, 'mix', a, b, i < 3 ? 2 : 3))
    ];
  }

  /** Ganze Zahlen, die ein Kind schreibt, wenn es den grossen Teil mit einer falschen Umwandlungszahl umrechnet. */
  const mitFaktor = (teil, f, rest = 0) => teil * f + rest;

  L.generator('mathe-groessen/umwandeln', {
    pool(params) {
      const stufen = params && params.stufen;
      if (!Array.isArray(stufen) || !stufen.length || new Set(stufen).size !== stufen.length || !stufen.every(s => typeof s === 'string' && Object.hasOwn(STUFEN, s))) {
        throw new Error(`mathe-groessen/umwandeln: params.stufen muss eine Liste verschiedener Stufen aus ${Object.keys(STUFEN).join(', ')} sein`);
      }
      return stufen.flatMap(bestand);
    },

    /** antwort: { zahl }. Der Code hängt von der Art der Aufgabe ab (inhalt.umwandlung). */
    diagnose(auf, antwort) {
      const { a, b, ergebnis: c, faktor: f, umwandlung } = auf.inhalt, z = antwort && antwort.zahl;
      if (z === c) return null;
      if (!Number.isInteger(z)) return 'sonstige';
      const andere = FALSCHE_FAKTOREN.filter(x => x !== f);
      if (umwandlung === 'gross-klein') {
        if (andere.some(x => z === mitFaktor(a, x))) return 'umwandlungszahl-falsch';
        if (a % f === 0 && z === a / f) return 'richtung-vertauscht';
      } else if (umwandlung === 'klein-gross') {
        if (z === a * f) return 'richtung-vertauscht';
        if (andere.some(x => a % x === 0 && z === a / x)) return 'umwandlungszahl-falsch';
      } else if (umwandlung === 'gemischt') {
        const teil = a / f, zehnerSystem = /^10+$/.test(String(f)), luecke = String(f).length - 1 - String(b).length;
        if (z === a || z === b) return 'teil-vergessen';
        if (zehnerSystem && luecke > 0 && [Number(`${teil}${b}`), ...Array.from({ length: luecke }, (_, j) => mitFaktor(teil, f, b * 10 ** (j + 1)))].includes(z)) return 'null-vergessen';
        if (andere.some(x => z === mitFaktor(teil, x, b))) return 'umwandlungszahl-falsch';
      }
      if (B.ziffernVertauscht(z, c)) return 'ziffern-vertauscht';
      if (B.zehnerDaneben(z, c)) return 'zehner-daneben';
      return 'sonstige';
    }
  });
})(globalThis);
