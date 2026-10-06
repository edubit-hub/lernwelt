/* module/mathe-groessen/generator-zeit.js: Aufgabenbestand «Uhrzeiten» (Form uhrzeit, Typ uhr) und «Zeitdauer» (Form rechnung, Typ eingabe)
   mit Fehlerdiagnose, nur für dieses Modul. Die Sprechweise («halb vier») erzeugt der Typ «uhr», der Inhalt trägt nur Stunde und Minute.
   Der Lösungsweg der Uhr beschreibt, was das Kind auf dem Zifferblatt sieht: zuerst der Minutenzeiger, dann der Stundenzeiger.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const B = L.registry.bausteine.get('_gemeinsam/rechnen');
  if (!B) throw new Error('mathe-groessen: Baustein «_gemeinsam/rechnen» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');

  const MINUS = '−';
  const zwei = n => String(n).padStart(2, '0');
  const digital = (h, min) => `${h}.${zwei(min)}`;
  const ZAHL = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf'];
  const wort = h => ZAHL[((h % 12) + 12) % 12];
  const uhrWort = h => `${h % 12 === 1 ? 'ein' : wort(h)} Uhr`;               // «ein Uhr», «zwei Uhr»
  /** Die Zahl auf dem Zifferblatt, auf die der Stundenzeiger zeigt: 1 bis 12. */
  const zifferblatt = h => ((h + 11) % 12) + 1;

  /** Sprechweise der Viertelstunden, wie der Typ «uhr» sie erzeugt (nur für den Text des Lösungswegs). */
  function sprechweise(h, min) {
    return { 0: uhrWort(h), 15: `Viertel nach ${wort(h)}`, 30: `halb ${wort(h + 1)}`, 45: `Viertel vor ${wort(h + 1)}` }[min];
  }

  /** Lösungsweg für eine Uhr: Minutenzeiger, Stundenzeiger, Ergebnis. mit24: Nachmittag und Abend zählen weiter. */
  function lesen(h, min, art) {
    const k = Math.floor(min / 5), r = min % 5, h12 = zifferblatt(h), nach = (h12 % 12) + 1, s = [];
    if (min === 0) s.push('Der Minutenzeiger zeigt auf die 12.');
    else if (r === 0) s.push(`Der Minutenzeiger zeigt auf die ${k}. In Fünferschritten gezählt: ${k} · 5 = ${min} Minuten.`);
    else s.push(`Der Minutenzeiger steht ${r} ${r === 1 ? 'Minute' : 'Minuten'} nach der ${k}. In Fünferschritten gezählt: ${k} · 5 = ${k * 5} Minuten, dazu ${r}: ${min} Minuten.`);
    s.push(min === 0 ? `Der Stundenzeiger zeigt auf die ${h12}.` : `Der Stundenzeiger steht zwischen der ${h12} und der ${nach}. Es gilt die Zahl, die er zuletzt erreicht hat: ${h12}.`);
    if (art === 'viertel') {
      s.push(`Man sagt: ${sprechweise(h, min)}.`);
      if (min === 30) s.push(`Halb ${wort(h + 1)} heisst: eine halbe Stunde vor ${uhrWort(h + 1)}.`);
      if (min === 45) s.push(`Viertel vor ${wort(h + 1)} heisst: eine Viertelstunde vor ${uhrWort(h + 1)}.`);
    }
    if (art === 'tag' && h >= 13) s.push(`Am Nachmittag und am Abend zählt man weiter: ${h12} + 12 = ${h}.`);
    if (art === 'tag' && h === 0) s.push('Nach Mitternacht schreibt man die Stunde als 0 und nicht als 12.');
    s.push(`Es ist ${digital(h, min)} Uhr.`);
    return s;
  }

  /**
   * Zeiten je Art. Eintrag [Schwierigkeit, Stunde, Minute]. viertel: ganze, halbe und Viertelstunden (Sprechweise).
   * fuenf: digital auf fünf Minuten genau. tag: 24-Stunden-Anzeige. minuten: auf die Minute genau. sprechweise5: Sprechweise auf fünf Minuten.
   */
  const ZEITEN = {
    viertel: { praefix: 'v', liste: [
      ...[1, 3, 5, 6, 9, 12].map(h => [1, h, 0]), ...[2, 4, 7, 8, 11, 12].map(h => [2, h, 30]), ...[2, 3, 6, 8, 10, 11].map(h => [2, h, 15]), ...[1, 4, 5, 7, 9, 12].map(h => [3, h, 45])
    ] },
    fuenf: { praefix: 'd', liste: [
      [1, 4, 15], [1, 7, 30], [1, 10, 45], [1, 11, 0],
      [2, 1, 5], [2, 2, 10], [2, 3, 50], [2, 4, 55], [2, 5, 5], [2, 6, 10], [2, 7, 55], [2, 8, 50],
      [3, 9, 20], [3, 10, 25], [3, 11, 35], [3, 12, 40], [3, 1, 25], [3, 2, 20], [3, 3, 40], [3, 4, 35], [3, 5, 25], [3, 6, 20], [3, 7, 35], [3, 8, 40]
    ] },
    tag: { praefix: 'z', liste: [
      [1, 13, 0], [1, 14, 30], [1, 15, 15], [1, 16, 45], [1, 17, 0], [1, 18, 30], [1, 7, 15], [1, 9, 45],
      [2, 12, 45], [2, 19, 15], [2, 20, 45], [2, 21, 30], [2, 22, 0], [2, 14, 20], [2, 16, 40], [2, 18, 10], [2, 13, 5], [2, 15, 35], [2, 10, 30], [2, 6, 50],
      [3, 17, 25], [3, 19, 50], [3, 21, 10], [3, 22, 40], [3, 23, 20], [3, 23, 55], [3, 0, 15], [3, 20, 5]
    ] },
    minuten: { praefix: 'mi', liste: [
      [1, 9, 6], [1, 11, 34], [1, 2, 49], [1, 6, 41], [2, 3, 17], [2, 10, 28], [2, 7, 43], [2, 8, 13], [3, 5, 52], [3, 12, 22], [3, 4, 57], [3, 1, 38]
    ] },
    sprechweise5: { praefix: 's5', liste: [
      [1, 1, 5], [1, 2, 10], [1, 3, 50], [1, 4, 55], [2, 9, 5], [2, 10, 10], [2, 11, 50], [2, 12, 55],
      [3, 5, 20], [3, 6, 25], [3, 7, 35], [3, 8, 40], [3, 1, 20], [3, 2, 25], [3, 3, 35], [3, 4, 40]
    ] }
  };

  L.generator('mathe-groessen/uhrzeiten', {
    pool(params) {
      const art = params && params.art, zeiten = typeof art === 'string' && Object.hasOwn(ZEITEN, art) ? ZEITEN[art] : null;
      if (!zeiten) throw new Error(`mathe-groessen/uhrzeiten: params.art muss eine von ${Object.keys(ZEITEN).join(', ')} sein`);
      return zeiten.liste.map(([schwierigkeit, h, min]) => ({
        id: `${zeiten.praefix}-${h}-${zwei(min)}`,
        form: 'uhrzeit',
        inhalt: { h, min },
        schwierigkeit,
        hilfe: { weg: 'uhr-lesen', schritte: lesen(h, min, art === 'viertel' ? 'viertel' : art === 'tag' ? 'tag' : art === 'minuten' ? 'minuten' : 'fuenf') }
      }));
    },

    /** antwort: { h, min } (Ablesen: die geschriebene Zeit, Einstellen: die Stellung der Zeiger, Stunde 0 bis 11). Die vier typischen Zeigerfehler meldet der Typ selbst. */
    diagnose(auf, antwort) {
      const { h, min } = auf.inhalt, zh = antwort && antwort.h, zm = antwort && antwort.min;
      if (zh === h && zm === min) return null;
      if (!Number.isInteger(zh) || !Number.isInteger(zm)) return 'sonstige';
      if (zm === min && h >= 13 && zh === h - 12) return 'stunde-12-statt-24';                // nach 12 Uhr zählt man weiter
      if (zh % 12 === h % 12 && Math.abs(zm - min) === 5) return 'minute-daneben';             // einen Fünferschritt zu weit oder zu kurz
      return 'sonstige';
    }
  });

  /* Zeitdauer: a = Ende, b = Start, beide in Minuten seit Mitternacht, ergebnis = Dauer in Minuten. */
  const DAUER = [
    [1, 8, 10, 8, 45], [1, 9, 5, 9, 50], [1, 14, 20, 14, 55], [1, 10, 15, 10, 40],
    [2, 8, 45, 9, 20], [2, 13, 50, 14, 15], [2, 11, 40, 12, 5], [2, 15, 35, 16, 10], [2, 7, 55, 8, 30],
    [3, 8, 15, 10, 0], [3, 9, 30, 12, 15], [3, 13, 20, 16, 50], [3, 7, 45, 11, 10], [3, 10, 25, 13, 5], [3, 12, 40, 15, 10], [3, 6, 50, 9, 20]
  ];

  /** Lösungsweg: vom Start bis zur nächsten vollen Stunde, ganze Stunden, von der vollen Stunde bis zum Ende, zusammen. */
  function dauerWeg(sh, sm, eh, em) {
    const start = sh * 60 + sm, ende = eh * 60 + em, S = `${digital(sh, sm)} Uhr`, E = `${digital(eh, em)} Uhr`;
    if (Math.floor(start / 60) === Math.floor(ende / 60)) return [`Von ${S} bis ${E}: ${ende - start} min`];
    const nextFull = (Math.floor(start / 60) + 1) * 60, endFull = Math.floor(ende / 60) * 60, s = [], teile = [];
    const uhr = m => `${digital(Math.floor(m / 60), m % 60)} Uhr`;
    if (nextFull > start) { s.push(`Von ${S} bis ${uhr(nextFull)}: ${nextFull - start} min`); teile.push(nextFull - start); }
    if (endFull > nextFull) { s.push(`Von ${uhr(nextFull)} bis ${uhr(endFull)}: ${(endFull - nextFull) / 60} h = ${endFull - nextFull} min`); teile.push(endFull - nextFull); }
    if (ende > endFull) { s.push(`Von ${uhr(endFull)} bis ${E}: ${ende - endFull} min`); teile.push(ende - endFull); }
    s.push(`Zusammen: ${teile.join(' + ')} = ${ende - start} min`);
    return s;
  }

  L.generator('mathe-groessen/zeitdauer', {
    pool: () => DAUER.map(([schwierigkeit, sh, sm, eh, em]) => ({
      id: `zd-${zwei(sh)}${zwei(sm)}-${zwei(eh)}${zwei(em)}`,
      form: 'rechnung',
      inhalt: { a: eh * 60 + em, b: sh * 60 + sm, op: MINUS, ergebnis: (eh * 60 + em) - (sh * 60 + sm), text: `Dauer in min: von ${digital(sh, sm)} Uhr bis ${digital(eh, em)} Uhr`, einheit: 'min' },
      schwierigkeit,
      hilfe: { weg: 'zeitdauer', schritte: dauerWeg(sh, sm, eh, em) }
    })),

    /** antwort: { zahl }. Häufigster Fehler: Zeiten wie Dezimalzahlen abziehen (9.00 − 8.15 = 85). */
    diagnose(auf, antwort) {
      const { a, b, ergebnis: c } = auf.inhalt, z = antwort && antwort.zahl;
      if (z === c) return null;
      if (!Number.isInteger(z)) return 'sonstige';
      const dezimal = (Math.floor(a / 60) * 100 + (a % 60)) - (Math.floor(b / 60) * 100 + (b % 60));
      if (z === dezimal) return 'hundertersystem';
      if (B.ziffernVertauscht(z, c)) return 'ziffern-vertauscht';
      if (B.zehnerDaneben(z, c)) return 'zehner-daneben';
      return 'sonstige';
    }
  });
})(globalThis);
