/* module/mathe-einmaleins/generator-zehner.js: Aufgaben des Themas «zehner» (Zehner-Einmaleins: mal und durch, mal 10 und durch 10 an der Stellenwerttafel,
   100 und 1000 teilen). Rechenaufgaben der Form rechnung, geübt über karteikarten, multiple-choice und eingabe. Die Brücke zum kleinen Einmaleins läuft über den
   Stellenwert (3 · 4 Zehner sind 12 Zehner), nicht über die Regel «Nullen anhängen». Das Thema steht auf aktiv: false (nur in einem Lehrmittelprofil Kern, R44),
   die Eltern schalten es ein. Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const B = L.registry.bausteine.get('_gemeinsam/rechnen');
  if (!B) throw new Error('Einmaleins: Baustein «_gemeinsam/rechnen» fehlt. Er steht in modul.js unter braucht und wird vor generator-zehner.js geladen.');

  const mal = (a, b) => `${a}x${b}`;
  const PAARE = [[2, 3], [3, 4], [4, 5], [5, 6], [6, 4], [6, 7], [7, 4], [8, 3], [8, 5], [9, 4], [9, 6], [7, 8]];   // a · r, daraus a · r0 und r0 · a, D = a · r0
  const ZAHLEN = [4, 7, 12, 25, 38, 46, 59, 63, 78, 91];                                                           // mal 10 und durch 10
  const TEILER = [2, 4, 5, 10];                                                                                    // 100 und 1000 teilen

  /** Stellenwerttafel mit den Plättchen der Zahl n (bis 999). zeige: 'plaettchen' verdeckt die Zahl unten. */
  const tafel = (n, zeige = 'beides') => ({ name: 'stellenwerttafel', daten: { h: Math.floor(n / 100), z: Math.floor(n / 10) % 10, e: n % 10, zeige } });
  const aufgabe = (id, schwierigkeit, a, b, op, ergebnis, braucht, hilfe) =>
    ({ id, form: 'rechnung', schwierigkeit, braucht, hilfe, inhalt: { a, b, op, ergebnis, text: `${a} ${op} ${b}` } });

  function pool() {
    const aus = [];
    for (const [a, r] of PAARE) {
      const p = a * r, t = r * 10;
      aus.push(aufgabe(`zm-${a}x${t}`, 2, a, t, '·', p * 10, [mal(a, r)],
        { weg: 'zehner', schritte: [`${a} · ${r} = ${p}`, `${a} · ${r} Zehner = ${p} Zehner`, `${p} Zehner sind ${p * 10}`], hilfsmittel: tafel(p * 10, 'plaettchen') }));
    }
    for (const [a, r] of PAARE) {
      const p = a * r, t = r * 10;
      aus.push(aufgabe(`zm-${t}x${a}`, 3, t, a, '·', p * 10, [mal(r, a)],
        { weg: 'zehner', schritte: [`${r} · ${a} = ${p}`, `${r} Zehner · ${a} = ${p} Zehner`, `${p} Zehner sind ${p * 10}`], hilfsmittel: tafel(p * 10, 'plaettchen') }));
    }
    for (const [a, r] of PAARE) {
      const p = a * r, t = r * 10, d = p * 10;
      aus.push(aufgabe(`zd-${d}d${a}`, 3, d, a, ':', t, [mal(a, r)],
        { weg: 'zehner', schritte: [`${d} sind ${p} Zehner`, `${p} Zehner : ${a} = ${r} Zehner`, `${r} Zehner sind ${t}`] }));
    }
    for (const [a, r] of PAARE) {
      const p = a * r, t = r * 10, d = p * 10;
      aus.push(aufgabe(`zd-${d}d${t}`, 3, d, t, ':', a, [mal(a, r)],
        { weg: 'zehner', schritte: [`${d} sind ${p} Zehner`, `${p} Zehner : ${r} Zehner = ${a}`] }));
    }
    for (const n of ZAHLEN) {
      aus.push(aufgabe(`s-${n}x10`, n < 20 ? 1 : 2, n, 10, '·', n * 10, [],
        { weg: 'stellen', schritte: [`${n} · 10 = ${n * 10}`, 'Jedes Plättchen rutscht eine Stelle nach links.'], hilfsmittel: tafel(n) }));
    }
    for (const n of ZAHLEN) {
      aus.push(aufgabe(`s-${n * 10}d10`, 2, n * 10, 10, ':', n, [],
        { weg: 'stellen', schritte: [`${n * 10} : 10 = ${n}`, 'Jedes Plättchen rutscht eine Stelle nach rechts.'], hilfsmittel: tafel(n * 10) }));
    }
    for (const d of [100, 1000]) {
      for (const b of TEILER) {
        const q = d / b;
        aus.push(aufgabe(`h-${d}d${b}`, b === 4 ? 3 : 2, d, b, ':', q, [],
          { weg: 'umkehren', schritte: [`${q} · ${b} = ${d}`, `Darum: ${d} : ${b} = ${q}`] }));
      }
    }
    return aus;
  }

  L.generator('mathe-einmaleins/zehner', {
    pool,
    diagnose(auf, antwort) {                                  // → Fehlercode oder null
      const { a, b, op, ergebnis: c } = auf.inhalt, z = antwort && antwort.zahl;
      if (z === c) return null;
      if (!Number.isInteger(z)) return 'sonstige';
      if (z === c * 10 || (c % 10 === 0 && z === c / 10)) return 'stellenwert-verschoben';   // 3 · 40 als 12 oder 1200
      if (op === ':' && z === b) return 'teiler-genannt';
      if (op === '·' && z === a + b) return 'mal-plus-verwechselt';
      if (B.ziffernVertauscht(z, c)) return 'ziffern-vertauscht';
      if (B.zehnerDaneben(z, c)) return 'zehner-daneben';
      return 'sonstige';
    }
  });
})(globalThis);
