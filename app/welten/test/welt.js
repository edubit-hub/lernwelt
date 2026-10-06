/* app/welten/test/welt.js: kleines zweites Welt-Thema nur für Verträge und Tests (Architektur 7.9). Es hat andere Namen als «archipel»
   und deckt alle Teile des Schemas aus 7.5 ab: zwei Epochen mit Tor, alle vier Wirkungstypen, Rezepte, Tausch, Forschung nach Bereich und
   nach Summe, Expeditionen, Sammlung. Es beweist, dass die Engine kein Thema bevorzugt. Die Zahlen sind für die Tests gewählt und
   gehören nicht zu einem Spiel. Es wird nur geladen, wenn es gewählt ist, nie für das Kind. */
Lernwelt.welt({
  id: 'test',
  titel: 'Testwelt',
  version: 1,
  stil: { ansicht: 'isometrisch', kachel: [128, 64], palette: null },

  epochen: [
    { id: 'e1', name: 'Anfang', tor: null,        plaetze: 5 },
    { id: 'e2', name: 'Weite',  tor: 'f-tor-e2', plaetze: 8 }
  ],

  rohstoffe: {
    erz:      { name: 'Erz',      fach: 'mathe',    symbol: 'erz' },
    moos:     { name: 'Moos',     fach: 'deutsch',  symbol: 'moos' },
    perle:    { name: 'Perle',    fach: 'englisch', symbol: 'perle' },
    kristall: { name: 'Kristall', fach: 'nmg',      symbol: 'kristall' }
  },

  rezepte: {
    barren: { name: 'Barren', in: 'schmiede', aus: { erz: 3, moos: 1 }, ergibt: [2, 3, 4] },
    faser:  { name: 'Faser',  in: 'weberei',  aus: { moos: 3 },          ergibt: [2, 3] }
  },

  bauteile: {
    turm: { name: 'Turm', epoche: 'e1', rolle: 'rathaus', wirkung: 'ansicht', stufen: [
      { kosten: { erz: 10 },            bild: [['quader', { b: 2, t: 2, h: 1.6, farbe: 'stein' }], ['dach', { b: 2, t: 2, h: 0.8, farbe: 'ziegel' }]] },
      { kosten: { erz: 20, faser: 2 },  bild: [['quader', { b: 2, t: 2, h: 2.2, farbe: 'stein' }], ['dach', { b: 2, t: 2, h: 0.8, farbe: 'ziegel' }]] }
    ] },
    markt: { name: 'Markt', epoche: 'e1', rolle: 'handel', wirkung: 'tausch', braucht: 'f-erz-1',
      tausch: [{ gib: { erz: 3 }, erhalte: { moos: 2 } }, { gib: { moos: 3 }, erhalte: { erz: 2 } }, { gib: { perle: 3 }, erhalte: { kristall: 2 } }],
      stufen: [{ kosten: { erz: 12 }, bild: [['quader', { b: 2, t: 1, h: 1.0, farbe: 'holz' }]] }] },
    schmiede: { name: 'Schmiede', epoche: 'e1', rolle: 'produktion', wirkung: 'rezept', braucht: 'f-erz-1', stufen: [
      { kosten: { erz: 15, moos: 4 },    bild: [['quader', { b: 2, t: 2, h: 1.0, farbe: 'stein' }]] },
      { kosten: { erz: 25, faser: 3 },   bild: [['quader', { b: 2, t: 2, h: 1.4, farbe: 'stein' }]] },
      { kosten: { barren: 6, faser: 4 }, bild: [['quader', { b: 2, t: 2, h: 1.8, farbe: 'stein' }]] }
    ] },
    weberei: { name: 'Weberei', epoche: 'e1', rolle: 'produktion', wirkung: 'rezept', braucht: 'f-erz-1', stufen: [
      { kosten: { erz: 10, moos: 3 },    bild: [['quader', { b: 2, t: 2, h: 1.0, farbe: 'sand' }]] },
      { kosten: { erz: 15, barren: 2 },  bild: [['quader', { b: 2, t: 2, h: 1.4, farbe: 'sand' }]] }
    ] },
    garten: { name: 'Garten', epoche: 'e2', rolle: 'landschaft', wirkung: 'frei', stufen: [
      { kosten: { erz: 6 }, bild: [['quader', { b: 2, t: 2, h: 0.2, farbe: 'gras' }]] }
    ] },
    leuchtfeuer: { name: 'Leuchtfeuer', epoche: 'e2', rolle: 'denkmal', wirkung: 'ansicht', stufen: [
      { kosten: { erz: 14 },            bild: [['quader', { b: 1, t: 1, h: 2.0, farbe: 'kalk' }]] },
      { kosten: { erz: 30, barren: 3 }, bild: [['quader', { b: 1, t: 1, h: 2.8, farbe: 'kalk' }]] }
    ] }
  },

  forschung: [
    { id: 'f-erz-1',   name: 'Erzkunde I',          epoche: 'e1', bereich: 'mathe.zahl',          wissen: 2, kosten: { erz: 8 } },
    { id: 'f-moos-1',  name: 'Moosbau I',           epoche: 'e1', bereich: 'deutsch.sprache',     wissen: 2, kosten: { moos: 5 } },
    { id: 'f-tor-e2',  name: 'Tor zur Weite',       epoche: 'e1', summe: 4,                                 kosten: { erz: 15 } },
    { id: 'f-perle-1', name: 'Perlenhandel I',      epoche: 'e2', bereich: 'englisch.wortschatz', wissen: 2, kosten: { perle: 4 } }
  ],

  expeditionen: [
    { id: 'exp-bucht', name: 'Bucht vermessen', epoche: 'e1', braucht: { bereich: 'mathe.zahl', wissen: 2 },
      umfang: 10, ziel: 0.8, belohnung: { sammlung: 'karte', rohstoffe: { erz: 10 } } },
    { id: 'exp-riff',  name: 'Riff erkunden',   epoche: 'e2', braucht: { bereich: 'englisch.wortschatz', wissen: 2 },
      umfang: 10, ziel: 0.7, belohnung: { sammlung: 'muschel', rohstoffe: { perle: 5, erz: 5 } } }
  ],

  sammlung: [
    { id: 'karte',   name: 'Karte der Bucht' },
    { id: 'muschel', name: 'Muschel vom Riff' }
  ]
});
