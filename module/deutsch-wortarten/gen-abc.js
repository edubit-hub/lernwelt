/* module/deutsch-wortarten/gen-abc.js: Wörter nach dem ABC ordnen (Form abfolge) und im Wörterbuch finden (Form auswahl).
   Alle Wörter sind ohne Umlaut und ohne ss geschrieben, damit nur die Reihenfolge der Buchstaben zählt. Die Wörter der Ordnungsaufgaben stehen
   in der richtigen Reihenfolge, der Modultest sortiert sie mit einem eigenen Vergleich noch einmal. Alle Wörter sind eigene Beispiele.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idVon = w => w.toLowerCase();
  const gemeinsamerAnfang = w => w.reduce((p, x) => { let i = 0; while (i < p.length && i < x.length && p[i] === x[i]) i++; return p.slice(0, i); });
  const WEG_ABC = `Das ABC: ${[...ABC].join(' ')}.`;

  // Schlüssel, Wörter in der Reihenfolge des ABC, Schwierigkeit
  const REIHEN = [
    ['obst', ['Apfel', 'Birne', 'Kirsche', 'Zitrone'], 1], ['tiere', ['Hund', 'Katze', 'Maus', 'Vogel'], 1], ['fahrzeuge', ['Auto', 'Bus', 'Velo', 'Zug'], 1],
    ['haus', ['Dach', 'Fenster', 'Garten', 'Tisch'], 1], ['frucht', ['Banane', 'Erdbeere', 'Melone', 'Pflaume'], 1], ['wald', ['Esel', 'Fuchs', 'Igel', 'Reh'], 1],
    ['ha', ['Hand', 'Hase', 'Haus', 'Hut'], 2], ['s', ['Sand', 'Sonne', 'Stern', 'Suppe'], 2], ['b', ['Blume', 'Brot', 'Buch', 'Bus'], 2],
    ['m', ['Maus', 'Mond', 'Mund', 'Musik'], 2], ['t', ['Tag', 'Tal', 'Tanne', 'Tasche', 'Tee'], 3], ['l', ['Lampe', 'Lehrer', 'Licht', 'Lied', 'Lupe'], 3]
  ];

  const reiheAufgabe = ([k, w, s]) => {
    const anfang = gemeinsamerAnfang(w);
    return {
      id: `abc-${k}`, form: 'abfolge', schwierigkeit: s, braucht: [],
      inhalt: { frage: 'Ordne die Wörter nach dem ABC. Das erste Wort steht oben.', schritte: w },
      hilfe: { weg: 'abc-ordnen', schritte: [WEG_ABC,
        anfang === '' ? `Vergleiche die Anfangsbuchstaben: ${w.map(x => x[0]).join(' vor ')}.` : `Alle Wörter beginnen mit «${anfang}». Vergleiche danach den nächsten Buchstaben, bis die Wörter verschieden sind.`,
        `Die Reihenfolge: ${w.join(', ')}.`] }
    };
  };

  L.generator('deutsch-wortarten/abc', {
    pool: () => REIHEN.map(reiheAufgabe),
    diagnose(auf, antwort) {                                              // antwort.folge: getippte Schritte als Indizes in schritte (richtig ist 0, 1, 2 …)
      const f = antwort && antwort.folge, w = auf.inhalt.schritte;
      if (!Array.isArray(f) || f.length !== w.length || !f.every(i => Number.isInteger(i) && w[i] !== undefined)) return 'sonstige';
      if (f.every((s, p) => s === p)) return null;
      const anfaenge = f.map(i => w[i][0]);                               // stimmt die Reihenfolge der Anfangsbuchstaben, liegt der Fehler weiter hinten im Wort
      return anfaenge.every((b, p) => p === 0 || anfaenge[p - 1] <= b) ? 'abc-weiterer-buchstabe' : 'abc-erster-buchstabe';
    }
  });

  // Welches Wort steht zuerst? Schlüssel, die drei Wörter, das erste im ABC
  const ZUERST = [['hund', ['Maus', 'Hund', 'Zebra'], 'Hund'], ['apfel', ['Kirsche', 'Apfel', 'Birne'], 'Apfel'], ['hase', ['Hose', 'Hase', 'Hut'], 'Hase'], ['sand', ['Stern', 'Sonne', 'Sand'], 'Sand']];
  // Welches Wort passt in die Lücke? Wort davor, Wort danach, das passende Wort, zwei Wörter, die nicht passen
  const LUECKE = [
    ['Hase', 'Hut', 'Haus', ['Fisch', 'Tisch']], ['Tal', 'Tasche', 'Tanne', ['Tee', 'Tisch']], ['Auto', 'Bus', 'Ball', ['Affe', 'Esel']],
    ['Mond', 'Musik', 'Mund', ['Mama', 'Nase']], ['Fenster', 'Haus', 'Garten', ['Auto', 'Igel']], ['Sonne', 'Suppe', 'Stern', ['Salat', 'Wolke']]
  ];
  // Welcher Buchstabe steht direkt nach oder vor dem genannten? Richtung, Buchstabe
  const NACHBAR = [['nach', 'P'], ['nach', 'T'], ['vor', 'H'], ['vor', 'N']];

  const zuerstAufgabe = ([k, w, richtig]) => {
    const p = [...w[0]].findIndex((_, i) => new Set(w.map(x => x[i])).size > 1), buchstaben = w.map(x => x[p]);
    return {
      id: `ns-z-${k}`, form: 'auswahl', schwierigkeit: p === 0 ? 1 : 2, braucht: [],
      inhalt: { frage: 'Welches Wort steht im Wörterbuch zuerst?', richtig, falsch: w.filter(x => x !== richtig) },
      hilfe: { weg: 'abc-ordnen', schritte: [WEG_ABC, `Die Wörter unterscheiden sich an der Stelle ${p + 1}: ${buchstaben.join(', ')}.`, `Im ABC kommt ${richtig[p]} zuerst, also steht «${richtig}» am weitesten vorn.`] }
    };
  };
  const lueckeAufgabe = ([vor, nach, richtig, falsch]) => ({
    id: `ns-l-${idVon(richtig)}`, form: 'auswahl', schwierigkeit: 2, braucht: [],
    inhalt: { frage: `Im Wörterbuch stehen nacheinander: ${vor}, ___, ${nach}. Welches Wort passt in die Lücke?`, richtig, falsch },
    hilfe: { weg: 'abc-ordnen', schritte: [`Das gesuchte Wort muss nach «${vor}» und vor «${nach}» stehen.`, `«${richtig}» passt: ${vor}, ${richtig}, ${nach}.`] }
  });
  const nachbarAufgabe = ([richtung, b]) => {
    const i = ABC.indexOf(b), r = richtung === 'nach' ? ABC[i + 1] : ABC[i - 1], falsch = richtung === 'nach' ? [ABC[i - 1], ABC[i + 2]] : [ABC[i + 1], ABC[i - 2]];
    return {
      id: `ns-b-${richtung}-${b.toLowerCase()}`, form: 'auswahl', schwierigkeit: 1, braucht: [],
      inhalt: { frage: `Welcher Buchstabe steht im ABC direkt ${richtung} ${b}?`, richtig: r, falsch },
      hilfe: { weg: 'abc-ordnen', schritte: [WEG_ABC, `Direkt ${richtung} ${b} steht ${r}.`] }
    };
  };

  L.generator('deutsch-wortarten/nachschlagen', {
    pool: () => [...ZUERST.map(zuerstAufgabe), ...LUECKE.map(lueckeAufgabe), ...NACHBAR.map(nachbarAufgabe)],
    diagnose: (auf, antwort) => (antwort && antwort.text === auf.inhalt.richtig ? null : 'sonstige')
  });
})(globalThis);
