/* module/mathe-einmaleins/generator-ableiten.js: Aufgaben des Themas «ableiten» (Ableitungswege ergänzen, Verdoppeln, Fehler im fremden Weg finden,
   einmal mehr und einmal weniger, Quadratzahlen der Einmaleins-Tafel). Sätze mit Zahlen in den Lücken (Form satz, Übungstyp lueckentext mit Auswahl,
   Baustein _gemeinsam/luecken). Die Zerlegungen sind dieselben wie in generator.js (ABLEITUNG): test.js vergleicht sie mit den Lösungswegen der Malaufgaben.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, S = L.registry.bausteine.get('_gemeinsam/luecken');
  if (!S) throw new Error('Einmaleins: Baustein «_gemeinsam/luecken» fehlt. Er steht in modul.js unter braucht und wird vor generator-ableiten.js geladen.');

  const MINUS = '−';
  const ZERLEGUNG = { 3: [2, 1, '+'], 4: [2, 2, '+'], 6: [5, 1, '+'], 7: [5, 2, '+'], 8: [10, 2, '-'], 9: [10, 1, '-'] };   // a: erster Teil, zweiter Teil, Rechenzeichen
  const mal = (a, b) => `${a}x${b}`;
  const feld = (zeilen, spalten, extra = {}) => ({ name: 'punktefeld', daten: { zeilen, spalten, ...extra } });
  const eindeutig = liste => [...new Set(liste)];

  const WEG = [[6, 7], [7, 8], [8, 7], [9, 6], [3, 8], [4, 9], [6, 9], [7, 6], [8, 9], [9, 8], [4, 7], [3, 7]];       // a · b über die Zerlegung von a
  const DOPPEL = [[4, 6], [4, 7], [4, 8], [4, 9], [6, 4], [6, 7], [8, 4], [8, 6]];                                   // a gerade: a · b ist das Doppelte von (a / 2) · b
  const FEHLER = [[6, 8], [7, 6], [9, 7], [8, 6], [3, 7], [4, 8]];
  const NACHBAR = [[2, 7, 1], [5, 8, 1], [5, 6, 1], [10, 7, 1], [5, 7, -1], [5, 9, -1], [10, 8, -1], [10, 6, -1]];  // a, b, einmal mehr (1) oder weniger (-1)
  const QUADRAT = [4, 5, 6, 7, 8, 9];

  /** Teile, Rechenzeichen und Lösungsweg einer Aufgabe a · b aus der Zerlegung, wie in generator.js. */
  function zerlege(a, b) {
    const [t1, t2, op] = ZERLEGUNG[a], plus = op === '+', c = a * b, zeichen = plus ? '+' : MINUS;
    return { t1, t2, plus, zeichen, c, braucht: eindeutig([mal(t1, b), mal(t2, b)]),
      hilfe: { weg: 'kernaufgaben', schritte: [`${t1} · ${b} = ${t1 * b}`, `${t2} · ${b} = ${t2 * b}`, `${t1 * b} ${zeichen} ${t2 * b} = ${c}`],
        hilfsmittel: feld(plus ? a : 10, b, { trenne: t1, wegnehmen: plus ? 0 : t2 }) } };
  }

  function pool() {
    const aus = [];
    for (const [a, b] of WEG) {
      const z = zerlege(a, b), anders = z.plus ? (z.t1 - z.t2) * b : (z.t1 + z.t2) * b;     // mit dem falschen Rechenzeichen gerechnet
      aus.push(S.aufgabe({ id: `weg-${a}x${b}`, art: 'weg', schwierigkeit: 2, braucht: z.braucht, hilfe: z.hilfe, vorzeichen: z.plus ? null : anders,
        text: `${a} · ${b} = ${z.t1} · ${b} ${z.zeichen} {${z.t2}} · ${b} = {${z.c}}`,
        luecken: [[z.t2, [1, 2, 3, 5]], [z.c, [anders, z.c + b, z.c - b]]] }));
    }
    for (const [a, b] of DOPPEL) {
      const c = a * b, h = c / 2;
      aus.push(S.aufgabe({ id: `doppel-${a}x${b}`, art: 'doppel', schwierigkeit: 2, braucht: [mal(a / 2, b)],
        text: `${a} · ${b} ist das Doppelte von ${a / 2} · ${b}. Es gilt ${a / 2} · ${b} = {${h}}, also ${a} · ${b} = {${c}}.`,
        luecken: [[h, [c, h + b, h - b]], [c, [c + b, c - b, c + 10]]],
        hilfe: { weg: 'verdoppeln', schritte: [`${a / 2} · ${b} = ${h}`, `${h} + ${h} = ${c}`, `${a} · ${b} = ${c}`], hilfsmittel: feld(a, b, { trenne: a / 2 }) } }));
    }
    for (const [a, b] of FEHLER) {
      const z = zerlege(a, b), w = z.t2 === 1 ? z.t1 : z.t2, falsch = z.plus ? z.t1 * b + w : z.t1 * b - w;   // statt + b wird + 5 gerechnet
      aus.push(S.aufgabe({ id: `fehler-${a}x${b}`, art: 'fehler', schwierigkeit: 3, braucht: z.braucht, hilfe: z.hilfe, falsch: w, teil: z.t2,
        text: `Jemand rechnet ${a} · ${b} so: ${z.t1} · ${b} ${z.zeichen} ${w} = ${falsch}. Das stimmt nicht. Richtig ist ${z.t1} · ${b} ${z.zeichen} {${z.t2 * b}} = {${z.c}}.`,
        luecken: [[z.t2 * b, [w, z.t2, b + 1]], [z.c, [falsch, z.c + b, z.c - b]]] }));
    }
    for (const [a, b, r] of NACHBAR) {
      const c = a * b, n = a + r, k = c + r * b, zeichen = r > 0 ? '+' : MINUS;
      aus.push(S.aufgabe({ id: `nachbar-${a}x${b}`, art: 'nachbar', schwierigkeit: 2, braucht: [mal(a, b)],
        text: `Du weisst ${a} · ${b} = ${c}. Dann ist ${n} · ${b} = ${c} ${zeichen} {${b}} = {${k}}.`,
        luecken: [[b, [a, a + 1, b + 1]], [k, [c, c + r * a, c + r * 10]]],
        hilfe: { weg: 'nachbar', schritte: [`${a} · ${b} = ${c}`, `${c} ${zeichen} ${b} = ${k}`, `${n} · ${b} = ${k}`],
          hilfsmittel: r > 0 ? feld(n, b, { trenne: a }) : feld(a, b, { wegnehmen: 1 }) } }));
    }
    for (const n of QUADRAT) {
      aus.push(S.aufgabe({ id: `quadrat-${n}`, art: 'quadrat', braucht: [mal(n, n)],
        text: `In der Einmaleins-Tafel stehen die Aufgaben mit zwei gleichen Zahlen in einer schrägen Linie. Ihre Ergebnisse heissen Quadratzahlen. ${n} · ${n} = {${n * n}}.`, luecken: [[n * n, [n * (n + 1), n * (n - 1), 2 * n]]],
        hilfe: { weg: 'punktefeld', schritte: [`${n} · ${n} = ${n * n}`], hilfsmittel: feld(n, n) } }));
    }
    return aus;
  }

  L.generator('mathe-einmaleins/ableitwege', {
    pool,
    diagnose(auf, antwort) {                                  // → Fehlercode oder null
      const i = auf.inhalt, r = S.antwort(i, antwort);
      if (r.richtig) return null;
      if (!r.ist) return 'sonstige';
      if (i.art === 'fehler' && r.ist[0] !== r.soll[0] && [String(i.falsch), String(i.teil)].includes(r.ist[0])) return 'ableiten-falsche-zahl';   // die falsche Zahl übernommen
      if (i.art === 'weg' && i.vorzeichen !== null && r.ist[1] === String(i.vorzeichen)) return 'ableiten-vorzeichen';                             // bei 8 und 9 addiert statt abgezogen
      return 'sonstige';
    }
  });
})(globalThis);
