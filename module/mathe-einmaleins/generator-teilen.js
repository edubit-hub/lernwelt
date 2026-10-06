/* module/mathe-einmaleins/generator-teilen.js: Aufgaben der Themen «familie» (Zahlenfamilie und Probe), «verteilen» (Verteilen, Aufteilen, «durch» und der
   Doppelpunkt) und «rest» (Teilen mit Rest erkennen). Sätze mit Zahlen in den Lücken (Form satz, Übungstyp lueckentext, Baustein _gemeinsam/luecken).
   «rest» zeigt keine Schreibweise wie «17 : 5 = 3 Rest 2» und keine Sprechweise: Beides ist für das Lehrmittel der Klasse nicht belegt (R44, README, TODO).
   Das Thema steht auf aktiv: false, die Eltern schalten es ein.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, S = L.registry.bausteine.get('_gemeinsam/luecken');
  if (!S) throw new Error('Einmaleins: Baustein «_gemeinsam/luecken» fehlt. Er steht in modul.js unter braucht und wird vor generator-teilen.js geladen.');

  const MINUS = '−';
  const mal = (a, b) => `${a}x${b}`;
  const feld = (zeilen, spalten) => ({ name: 'punktefeld', daten: { zeilen, spalten } });
  const umkehren = (q, b, a) => ({ weg: 'umkehren', schritte: [`${q} · ${b} = ${a}`, `Darum: ${a} : ${b} = ${q}`] });

  const FAMILIE = [[3, 4], [3, 6], [4, 6], [4, 7], [6, 7], [6, 8], [7, 8], [7, 9], [8, 9], [6, 9], [4, 8], [3, 9]];
  const PROBE = [[28, 7, 4], [35, 5, 8], [36, 9, 4], [42, 6, 8], [48, 8, 6], [56, 7, 9], [63, 9, 7], [72, 8, 8]];      // Dividend, Teiler, behauptetes Ergebnis
  const VERTEILEN = [[24, 6], [18, 3], [20, 4], [35, 5], [42, 7], [56, 8], [27, 9], [30, 10], [16, 2], [45, 9]];       // Dividend, Zahl der Kinder
  const AUFTEILEN = [[24, 4], [18, 6], [40, 8], [21, 3], [32, 4], [36, 9], [50, 5], [70, 10], [14, 2], [63, 7]];       // Dividend, Grösse der Gruppen
  const DURCH = [[24, 6], [35, 5], [48, 8], [54, 6], [63, 7], [81, 9]];
  const REST = [[2, 5, 1], [3, 4, 2], [4, 3, 1], [4, 5, 3], [5, 3, 2], [5, 6, 4], [6, 4, 5], [6, 5, 1], [7, 3, 4], [8, 4, 3], [9, 3, 5], [10, 4, 7]];   // Teiler, Ergebnis, Rest
  const ERKENNE = [[24, 6, true], [25, 6, false], [35, 7, true], [36, 7, false], [40, 8, true], [42, 8, false], [27, 9, true], [28, 9, false]];
  const DING = ['Murmeln', 'Karten', 'Stifte', 'Guetzli', 'Sticker'];      // Plural im Nominativ und Akkusativ («Jedes Kind bekommt 4 Stifte»)
  const DATIV = ['Murmeln', 'Karten', 'Stiften', 'Guetzli', 'Stickern'];   // Dativ Plural nach «zu» («Gruppen zu je 4 Stiften»), gleiche Reihenfolge
  const ding = n => DING[n % DING.length];
  const dativ = n => DATIV[n % DATIV.length];

  function familie() {
    const aus = [];
    for (const [a, b] of FAMILIE) {
      const c = a * b;
      aus.push(S.aufgabe({ id: `fam-${a}x${b}`, art: 'fam', braucht: [mal(a, b)],
        text: `Zur Malaufgabe ${a} · ${b} = ${c} gehören zwei Divisionen: ${c} : ${a} = {${b}} und ${c} : ${b} = {${a}}.`,
        luecken: [[b, [a, b + 1, b - 1]], [a, [b, a + 1, a - 1]]],
        hilfe: { weg: 'zahlenfamilie', schritte: [`${a} · ${b} = ${c}`, `${b} · ${a} = ${c}`, `${c} : ${a} = ${b}`, `${c} : ${b} = ${a}`], hilfsmittel: feld(a, b) } }));
    }
    for (const [a, b, w] of PROBE) {
      const p = w * b, stimmt = p === a;
      aus.push(S.aufgabe({ id: `probe-${a}d${b}`, art: 'probe', schwierigkeit: 2, braucht: [mal(a / b, b)],
        text: `Stimmt ${a} : ${b} = ${w}? Die Probe ergibt ${w} · ${b} = {${p}}. Die Aufgabe {${stimmt ? 'stimmt' : 'stimmt nicht'}}.`,
        luecken: [[p, stimmt ? [a + b, a - b, a + 10] : [a, p + b, p - b]], { ablenker: [stimmt ? 'stimmt nicht' : 'stimmt'] }],
        hilfe: { weg: 'probe', schritte: [`${w} · ${b} = ${p}`, stimmt ? `${p} ist ${a}: die Aufgabe stimmt` : `${p} ist nicht ${a}: die Aufgabe stimmt nicht`,
          ...(stimmt ? [] : [`Richtig ist ${a} : ${b} = ${a / b}`])] } }));
    }
    return aus;
  }

  function verteilen() {
    const aus = [];
    VERTEILEN.forEach(([a, b], n) => {
      const q = a / b;
      aus.push(S.aufgabe({ id: `vert-${a}d${b}`, art: 'vert', a, b, schwierigkeit: 2, braucht: [mal(q, b)],
        text: `${a} ${ding(n)} werden gleichmässig an ${b} Kinder verteilt. Jedes Kind bekommt {${q}} ${ding(n)}. Das ist die Aufgabe ${a} : ${b}.`,
        luecken: [[q, [b, a - b, q + 1]]], hilfe: umkehren(q, b, a) }));
    });
    AUFTEILEN.forEach(([a, b], n) => {
      const q = a / b;
      aus.push(S.aufgabe({ id: `auf-${a}d${b}`, art: 'auf', a, b, schwierigkeit: 2, braucht: [mal(q, b)],
        text: `${a} ${ding(n + 2)} werden in Gruppen zu je ${b} ${dativ(n + 2)} aufgeteilt. Es entstehen {${q}} Gruppen. Das ist die Aufgabe ${a} : ${b}.`,
        luecken: [[q, [b, a - b, q + 1]]], hilfe: umkehren(q, b, a) }));
    });
    for (const [a, b] of DURCH) {
      const q = a / b;
      aus.push(S.aufgabe({ id: `durch-${a}d${b}`, art: 'durch', a, b, schwierigkeit: 2, braucht: [mal(q, b)],
        text: `${a} durch ${b} schreibt man als ${a} {:} ${b}. Das Ergebnis ist {${q}}.`,
        luecken: [{ ablenker: ['·', '+', MINUS] }, [q, [b, a - b, q + 1]]], hilfe: umkehren(q, b, a) }));
    }
    return aus;
  }

  function rest() {
    const aus = [];
    REST.forEach(([b, q, r], n) => {
      const a = q * b + r;
      aus.push(S.aufgabe({ id: `rest-${a}d${b}`, art: 'rest', a, b, schwierigkeit: 2, braucht: [mal(q, b)],
        text: `${a} ${ding(n + 1)} werden an ${b} Kinder verteilt. Alle Kinder bekommen gleich viele, so viele wie möglich. Jedes Kind bekommt {${q}} ${ding(n + 1)}. Anzahl der übrigen ${ding(n + 1)}: {${r}}.`,
        luecken: [[q, [q + 1, q - 1, b]], [r, [r + 1, r - 1, b]]],
        hilfe: { weg: 'rest', schritte: [`${q} · ${b} = ${q * b}`, `${a} ${MINUS} ${q * b} = ${r}`, `${r} ist kleiner als ${b}`] } }));
    });
    for (const [a, b, drin] of ERKENNE) {
      const q = Math.floor(a / b);
      aus.push(S.aufgabe({ id: `erkenne-${a}d${b}`, art: 'erkenne', a, b, braucht: [mal(q, b)],
        text: `Steht ${a} in der ${b}er-Reihe? Antwort: {${drin ? 'ja' : 'nein'}}. Darum geht ${a} : ${b} {${drin ? 'auf' : 'nicht auf'}}.`,
        luecken: [null, null],
        hilfe: { weg: 'rest', schritte: drin ? [`${q} · ${b} = ${a}`, `${a} steht in der ${b}er-Reihe`]
          : [`${q} · ${b} = ${q * b}`, `${q + 1} · ${b} = ${(q + 1) * b}`, `${a} liegt dazwischen und steht nicht in der ${b}er-Reihe`] } }));
    }
    return aus;
  }

  L.generator('mathe-einmaleins/zahlenfamilie', { pool: familie, diagnose: (auf, antwort) => (S.antwort(auf.inhalt, antwort).richtig ? null : 'sonstige') });

  L.generator('mathe-einmaleins/verteilen', {
    pool: verteilen,
    diagnose(auf, antwort) {                                  // → Fehlercode oder null
      const i = auf.inhalt, r = S.antwort(i, antwort);
      if (r.richtig) return null;
      const z = r.ist && r.ist[r.ist.length - 1];
      if (z === String(i.b)) return 'teiler-genannt';                        // den Teiler hingeschrieben
      if (z === String(i.a - i.b)) return 'teilen-minus-verwechselt';        // abgezogen statt geteilt
      return 'sonstige';
    }
  });

  L.generator('mathe-einmaleins/rest', {
    pool: rest,
    diagnose(auf, antwort) {
      const i = auf.inhalt, r = S.antwort(i, antwort);
      if (r.richtig) return null;
      return i.art === 'rest' && r.ist && Number(r.ist[1]) >= i.b ? 'uebrig-zu-gross' : 'sonstige';   // mindestens so viele übrig, wie Kinder da sind
    }
  });
})(globalThis);
