/* module/mathe-einmaleins/generator-verstehen.js: Aufgaben des Themas «verstehen» (Malaufgaben als Feld, Tauschaufgaben, Faktoren, Verdoppeln und Halbieren).
   Alle Aufgaben sind Sätze mit Zahlen in den Lücken (Form satz, Übungstyp lueckentext mit Auswahl, Baustein _gemeinsam/luecken). Die Aufgaben nennen
   nie, welche der beiden Zahlen «Gruppen» und welche «Grösse» ist: Lesart und Sprechweise des Lehrmittels der Klasse sind nicht belegt (README, TODO).
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, S = L.registry.bausteine.get('_gemeinsam/luecken');
  if (!S) throw new Error('Einmaleins: Baustein «_gemeinsam/luecken» fehlt. Er steht in modul.js unter braucht und wird vor generator-verstehen.js geladen.');

  const mal = (a, b) => `${a}x${b}`;
  const feld = (zeilen, spalten, trenne) => ({ name: 'punktefeld', daten: { zeilen, spalten, ...(trenne ? { trenne } : {}) } });

  const FELDER = [[2, 6], [3, 4], [3, 8], [4, 6], [5, 7], [6, 3], [7, 4], [8, 5]];                // Zeilen, Spalten
  const TAUSCH = [[7, 5], [8, 5], [9, 5], [6, 5], [7, 2], [8, 2], [9, 2], [6, 10]];               // a · b, getauscht ist b · a eine Kernaufgabe
  const FAKTOREN = [[12, 2, 3], [16, 2, 4], [18, 2, 3], [20, 2, 4], [24, 3, 4], [30, 3, 5], [36, 4, 6], [40, 4, 5]];   // Produkt, zwei erste Faktoren
  const DOPPELT = [[2, 7], [3, 3], [3, 4], [3, 6], [4, 3], [4, 6], [5, 3], [5, 4]];
  const HALB = [[4, 7], [6, 4], [8, 3], [10, 6]];

  function pool() {
    const aus = [];
    for (const [z, s] of FELDER) {
      const c = z * s;
      aus.push(S.aufgabe({ id: `feld-${z}x${s}`, art: 'feld', a: z, b: s,
        text: `Ein Punktefeld hat ${z} Zeilen mit je ${s} Punkten. Es hat insgesamt {${c}} Punkte.`, luecken: [[c, [z + s, c + s, c - s]]],
        hilfe: { weg: 'punktefeld', schritte: [`${Array(z).fill(s).join(' + ')} = ${c}`, `${z} · ${s} = ${c}`, `${s} · ${z} = ${c}`], hilfsmittel: feld(z, s) } }));
    }
    for (const [a, b] of TAUSCH) {
      const c = a * b;
      aus.push(S.aufgabe({ id: `tausch-${a}x${b}`, art: 'tausch', a, b, braucht: [mal(a, b)],       // die Aufgabe im Satz kommt aus der b-Reihe (Kern), ihre Tauschaufgabe aus der a-Reihe wird daraus gefolgert
        text: `${a} · ${b} hat dasselbe Ergebnis wie {${b}} · ${a}. Das Ergebnis ist {${c}}.`, luecken: [[b, [a, b + 1, b - 1]], [c, [a + b, c + a, c - a]]],
        hilfe: { weg: 'punktefeld', schritte: [`${a} · ${b} = ${c}`, `${b} · ${a} = ${c}`], hilfsmittel: feld(a, b) } }));
    }
    for (const [c, a1, a2] of FAKTOREN) {
      const b1 = c / a1, b2 = c / a2;
      aus.push(S.aufgabe({ id: `faktoren-${c}`, art: 'faktoren', schwierigkeit: 2,
        text: `${c} = ${a1} · {${b1}} = ${a2} · {${b2}}`, luecken: [[b1, [a1, b1 + 1, b1 - 1]], [b2, [a2, b2 + 1, b2 - 1]]],
        hilfe: { weg: 'faktoren', schritte: [`${a1} · ${b1} = ${c}`, `${a2} · ${b2} = ${c}`], hilfsmittel: feld(a1, b1) } }));
    }
    for (const [a, b] of DOPPELT) {
      const c = a * b;
      aus.push(S.aufgabe({ id: `doppelt-${a}x${b}`, art: 'doppelt', schwierigkeit: 2, braucht: [mal(a, b)],
        text: `${a} · ${b} = ${c}. Wird die erste Zahl verdoppelt, ist ${2 * a} · ${b} = {${2 * c}}.`, luecken: [[2 * c, [c + b, c + a, c + 10]]],
        hilfe: { weg: 'verdoppeln', schritte: [`${a} · ${b} = ${c}`, `${c} + ${c} = ${2 * c}`, `${2 * a} · ${b} = ${2 * c}`], hilfsmittel: feld(2 * a, b, a) } }));
    }
    for (const [a, b] of HALB) {
      const c = a * b;
      aus.push(S.aufgabe({ id: `halb-${a}x${b}`, art: 'halb', schwierigkeit: 2, braucht: [mal(a, b)],
        text: `${a} · ${b} = ${c}. Wird die erste Zahl halbiert, ist ${a / 2} · ${b} = {${c / 2}}.`, luecken: [[c / 2, [c - b, c / 2 + b, c / 2 + 10]]],
        hilfe: { weg: 'verdoppeln', schritte: [`${a} · ${b} = ${c}`, `${c} : 2 = ${c / 2}`, `${a / 2} · ${b} = ${c / 2}`], hilfsmittel: feld(a, b, a / 2) } }));
    }
    return aus;
  }

  L.generator('mathe-einmaleins/verstehen', {
    pool,
    diagnose(auf, antwort) {                                  // → Fehlercode oder null
      const i = auf.inhalt, r = S.antwort(i, antwort);
      if (r.richtig) return null;
      const plus = r.ist && (i.art === 'feld' || i.art === 'tausch') && r.ist[r.ist.length - 1] === String(i.a + i.b);
      return plus ? 'mal-plus-verwechselt' : 'sonstige';      // 3 · 4 als 7: addiert statt malgenommen
    }
  });
})(globalThis);
