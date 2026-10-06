/* module/mathe-einmaleins/generator.js: Aufgabenbestand und Fehlerdiagnose, nur für dieses Modul (Architektur 4.3).
   Kernaufgaben-Strategie: a · b gehört zur Reihe b und wird über die Kernaufgaben 1·, 2·, 5· und 10· derselben Reihe abgeleitet
   (Zahlenbuch: Merkaufgaben, Mathwelt: Kernaufgaben, die Zerlegungen unten sind gegen das Lehrmittel der Klasse abzugleichen).
   Die Generatoren der übrigen Themen stehen in generator-verstehen.js, generator-ableiten.js, generator-teilen.js und generator-zehner.js.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand.
   Die IDs `<a>x<b>` und `<a>d<b>` gehören zu bestehenden Aufgaben und ändern sich nie (ids.lock.json). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const B = L.registry.bausteine.get('_gemeinsam/rechnen');
  if (!B) throw new Error('Einmaleins: Baustein «_gemeinsam/rechnen» fehlt. Er steht in modul.js unter braucht und wird vor generator.js geladen.');

  const MINUS = '−';                     // Minuszeichen wie im Feld op der Form «rechnung»
  const ABLEITUNG = {                         // a: Teile und Rechenzeichen (Abgleich mit dem Lehrmittel: modul.wege.kernaufgaben)
    3: { teile: [2, 1], op: '+' },            // 3 · b = 2 · b + 1 · b
    4: { teile: [2, 2], op: '+' },            // 4 · b = 2 · b + 2 · b
    6: { teile: [5, 1], op: '+' },
    7: { teile: [5, 2], op: '+' },
    8: { teile: [10, 2], op: '-' },           // 8 · b = 10 · b − 2 · b
    9: { teile: [10, 1], op: '-' }
  };
  const SCHWER = { 7: 3, 8: 3, 3: 2, 4: 2, 6: 2, 9: 2 };      // alles andere: Stufe 1
  const mal = (a, b) => `${a}x${b}`;

  function malaufgabe(a, b) {
    const c = a * b, ab = ABLEITUNG[a];
    const [t1, t2] = ab ? ab.teile : [];
    return {
      id: mal(a, b),
      form: 'rechnung',
      inhalt: { a, b, op: '·', ergebnis: c, text: `${a} · ${b}` },
      schwierigkeit: SCHWER[a] ?? 1,
      braucht: ab ? [...new Set(ab.teile.map(t => mal(t, b)))] : [],
      hilfe: ab ? {
        weg: 'kernaufgaben',
        schritte: [`${t1} · ${b} = ${t1 * b}`, `${t2} · ${b} = ${t2 * b}`,
                   `${t1 * b} ${ab.op === '+' ? '+' : MINUS} ${t2 * b} = ${c}`],
        hilfsmittel: { name: 'punktefeld', daten: { zeilen: ab.op === '+' ? a : 10, spalten: b, trenne: t1, wegnehmen: ab.op === '-' ? t2 : 0 } }
      } : { weg: 'kern', schritte: [`${a} · ${b} = ${c}`] }
    };
  }

  function teilaufgabe(q, b) {                // q = Ergebnis, b = Teiler: (q · b) : b = q
    const a = q * b;
    return {
      id: `${a}d${b}`,
      form: 'rechnung',
      inhalt: { a, b, op: ':', ergebnis: q, text: `${a} : ${b}` },
      schwierigkeit: 2,
      braucht: [mal(q, b)],
      hilfe: { weg: 'umkehren', schritte: [`${q} · ${b} = ${a}`, `Darum: ${a} : ${b} = ${q}`] }
    };
  }

  /** Die Reihen aus den Parametern des Themas: nicht leer, ganze Zahlen ab 1, keine doppelt (sonst gäbe es doppelte IDs). */
  function reihenVon(name, params) {
    const r = params && params.reihen;
    if (!Array.isArray(r) || !r.length || !r.every(b => Number.isInteger(b) && b >= 1) || new Set(r).size !== r.length) {
      throw new Error(`${name}: params.reihen muss eine Liste verschiedener ganzer Zahlen ab 1 sein`);
    }
    return r;
  }

  const alle = (name, params, f) => reihenVon(name, params).flatMap(b => Array.from({ length: 10 }, (_, i) => f(i + 1, b)));

  L.generator('mathe-einmaleins/malaufgaben', {
    pool: params => alle('mathe-einmaleins/malaufgaben', params, malaufgabe),
    diagnose(auf, antwort) {                  // → Fehlercode oder null
      const { a, b, ergebnis: c } = auf.inhalt, z = antwort && antwort.zahl, ab = ABLEITUNG[a];
      if (z === c) return null;
      if (!Number.isInteger(z)) return 'sonstige';
      if (z === (a - 1) * b || z === (a + 1) * b) return 'eine-gruppe-daneben';
      if (ab && ab.op === '-' && z === (ab.teile[0] + ab.teile[1]) * b) return 'ableiten-vorzeichen';
      if (z === a + b) return 'mal-plus-verwechselt';         // 3 · 4 als 7: addiert statt malgenommen
      if (B.ziffernVertauscht(z, c)) return 'ziffern-vertauscht';
      if (B.zehnerDaneben(z, c)) return 'zehner-daneben';
      return 'sonstige';
    }
  });

  L.generator('mathe-einmaleins/teilaufgaben', {
    pool: params => alle('mathe-einmaleins/teilaufgaben', params, teilaufgabe),
    diagnose(auf, antwort) {
      const z = antwort && antwort.zahl, { a, b, ergebnis: q } = auf.inhalt;
      if (z === q) return null;
      if (!Number.isInteger(z)) return 'sonstige';
      if (Math.abs(z - q) === 1) return 'eine-gruppe-daneben';
      if (z === a - b) return 'teilen-minus-verwechselt';     // 28 : 7 als 21: abgezogen statt geteilt
      if (z === a * b) return 'teilen-mal-verwechselt';       // 28 : 7 als 196: malgenommen statt geteilt
      if (z === b) return 'teiler-genannt';                   // 28 : 7 als 7: den Teiler hingeschrieben
      return 'sonstige';
    }
  });
})(globalThis);
