/* module/deutsch-rechtschreibung/wortstamm.js: Aufgabenbestand und Fehlerdiagnose für «Wortstamm erkennen und Wortfamilien bilden» (AP-18c).
   Jede Aufgabe ist ein Wort (links) mit seinem Wortstamm (rechts, Form paar). Der Typ zuordnen lässt das Kind Wörter in die Felder der Stämme legen,
   multiple-choice fragt einzeln. Drei Familienpaare haben einen ähnlichen Anfang und verschiedene Stämme (Spiel und Spiegel, fahren und Fahne,
   Zahn und zahlen): Das ist der häufige Fehler «ähnlicher Anfang». Kein Wort enthält zwei Stämme der Liste, die Zuordnung ist also eindeutig.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;

  const FAMILIEN = [                                     // [Stamm, Schwierigkeit, Wörter]
    ['spiel', 1, ['spielen', 'Spieler', 'Spielplatz', 'Spielzeug']],
    ['spiegel', 3, ['Spiegel', 'spiegeln', 'Spiegelbild']],
    ['fahr', 1, ['fahren', 'Fahrer', 'Abfahrt', 'Fahrrad']],
    ['fahne', 3, ['Fahne', 'Fahnenmast']],
    ['zahn', 2, ['Zahnarzt', 'Zahnbürste', 'Zahnpasta']],
    ['zahl', 2, ['zahlen', 'Zahlwort', 'bezahlen']],
    ['mal', 1, ['malen', 'Maler', 'Malkasten']],
    ['koch', 1, ['kochen', 'Kochbuch', 'Kochtopf']],
    ['wohn', 1, ['wohnen', 'Wohnung', 'Bewohner']]
  ];
  const PAAR = { spiel: 'spiegel', spiegel: 'spiel', fahr: 'fahne', fahne: 'fahr', zahn: 'zahl', zahl: 'zahn' };      // ähnlicher Anfang, anderer Stamm
  const HINWEIS = { spiel: 'Spiel und Spiegel', spiegel: 'Spiel und Spiegel', fahr: 'fahren und Fahne', fahne: 'fahren und Fahne', zahn: 'Zahn und zahlen', zahl: 'Zahn und zahlen' };
  const TEXT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };
  const kennung = wort => `stamm-${wort.toLowerCase().replace(/[äöü]/g, z => TEXT[z])}`;

  const aufgabe = (stamm, stufe, wort) => ({
    id: kennung(wort), form: 'paar', schwierigkeit: stufe, inhalt: { links: wort, rechts: stamm },
    hilfe: { weg: 'wortstamm', schritte: ['Streiche Vorsilbe und Endung weg. Was bleibt?', `In «${wort}» bleibt «${stamm}».`,
      ...(PAAR[stamm] ? [`Achtung, ähnlicher Anfang: «${HINWEIS[stamm]}» haben verschiedene Stämme.`] : []),
      `Wörter mit dem Stamm «${stamm}» gehören zu einer Wortfamilie.`] }
  });

  L.generator('deutsch-rechtschreibung/wortstamm', {
    pool: () => FAMILIEN.flatMap(([stamm, stufe, woerter]) => woerter.map(w => aufgabe(stamm, stufe, w))),
    /** Die Antwort ist das gewählte Feld oder die gewählte Kachel (antwort.text): ein Stamm mit ähnlichem Anfang oder ein anderer. → Fehlercode oder null */
    diagnose(auf, antwort) {
      const gewaehlt = antwort && typeof antwort.text === 'string' ? antwort.text : null, soll = auf.inhalt.rechts;
      if (gewaehlt === null || gewaehlt === soll) return null;
      return PAAR[soll] === gewaehlt ? 'aehnlicher-anfang' : 'stamm-verwechselt';
    }
  });
})(globalThis);
