/* app/welten/archipel/welt.js: das Welt-Thema «Archipel» (Architektur 7.5 und 7.6), Epochen 1 und 2. Reine Daten und die Bildlisten der Gebäude (Bausatz
   app/welt/iso.js, Format V-AP14-02). Die Gebäude stammen aus dem Mockup docs/mockup/siedlung.html, aufgeteilt auf vier Arten je Epoche (Budget 7.5).
   Zahlen sind Startwerte, ihre Begründung und die Simulation stehen in docs/balance.md. Ein Bauteil steht einmal, jede Stufe ist ein Ausbau am selben Platz.
   Rohstoffe: stein (Mathe), holz (Deutsch), handelsgut (Englisch), proben (NMG). Güter: ziegel (Werkstatt), balken (Sägewerk).
   Jedes Bauteil und jede Stufe verlangt höchstens einen Forschungsknoten mit Wissen aus einem Bereich (Schutzregel 8). Die Bereiche liefern die Module. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const F = (an, s, z, w = .3, h = .32, kreuz = 'kalk') => ['fenster', { an, s, z, w, h, kreuz }];
  const TUER = (s, w, h, an = 'l', farbe) => ['tuer', { an, s, z: 0, w, h, ...(farbe ? { farbe } : {}) }];

  const rathaus = n => n === 1 ? [
    ['quader', { x: .35, y: .35, b: 1.9, t: 1.9, h: .8, farbe: 'kalk' }], F('l', .3, .38, .3, .38), F('l', 1.3, .38, .3, .38), TUER(.7, .46, .66),
    F('r', .35, .38, .3, .38), F('r', 1.25, .38, .3, .38), ['dach', { x: .25, y: .25, b: 2.1, t: 2.1, z: .8, h: .6, farbe: 'schiefer', art: 'walm' }],
    ['fahne', { x: 1.3, y: 1.3, z: 1.38, h: .42, farbe: 'akzent' }]
  ] : [
    ['quader', { x: .3, y: .3, b: 2.4, t: 2.4, h: n === 3 ? 1.45 : 1.1, farbe: 'kalk' }],
    F('l', .3, .5, .34, .42), F('l', 1.75, .5, .34, .42), TUER(.95, .5, .72), F('r', .45, .5, .34, .42), F('r', 1.6, .5, .34, .42),
    ...(n === 3 ? [F('l', .3, .98, .34, .3), F('l', 1.75, .98, .34, .3), F('r', .45, .98, .34, .3), F('r', 1.6, .98, .34, .3)] : []),
    ['quader', { x: .8, y: 2.7, b: .8, t: .22, h: .1, farbe: 'stein' }],
    ['dach', { x: .2, y: .2, b: 2.6, t: 2.6, z: n === 3 ? 1.45 : 1.1, h: .75, farbe: 'schiefer', art: 'walm' }],
    ['quader', { x: 1.05, y: 1.05, b: .9, t: .9, z: n === 3 ? 1.95 : 1.6, h: .75, farbe: 'kalk' }], ['uhr', { an: 'l', s: .45, z: .42, r: .17 }],
    ['dach', { x: .95, y: .95, b: 1.1, t: 1.1, z: n === 3 ? 2.7 : 2.35, h: .5, farbe: 'ziegel', art: 'walm', ue: .08 }],
    ['fahne', { x: 1.5, y: 1.5, z: n === 3 ? 3.2 : 2.85, h: .42, farbe: 'akzent' }]
  ];

  const wohnhaus = n => [
    ['quader', { x: .25, y: .3, b: 1.5, t: 1.4, h: .78, farbe: 'kalk' }], TUER(.25, .34, .52), F('l', .85, .3, .3, .32), F('r', .25, .3), F('r', .8, .3),
    ...(n > 1 ? [['quader', { x: .25, y: .3, z: .78, b: 1.5, t: 1.4, h: .6, farbe: 'kalk' }], F('l', .3, .16), F('l', 1.0, .16), F('r', .3, .16), F('r', .9, .16)] : []),
    ['dach', { x: .25, y: .3, b: 1.5, t: 1.4, z: n > 1 ? 1.38 : .78, h: .62, farbe: 'ziegel', achse: 'y', giebel: 'kalk' }],
    ['quader', { x: .95, y: .55, b: .24, t: .24, z: (n > 1 ? 1.38 : .78) + .2, h: .55, farbe: 'stein' }],
    ...(n > 2 ? [['quader', { x: 1.8, y: .5, b: .55, t: .9, h: .5, farbe: 'kalk' }], F('r', .2, .15, .26, .26), ['dach', { x: 1.75, y: .45, b: .65, t: 1.0, z: .5, h: .3, farbe: 'ziegel', art: 'pult' }]] : [])
  ];

  const werkstatt = n => { const h = [.85, 1.15, 1.45][n - 1]; return [
    ['quader', { x: .25, y: .3, b: 1.5, t: 1.4, h, farbe: 'stein' }], TUER(.45, .62, .62), ['fenster', { an: 'l', s: 1.2, z: .38, w: .2, h: .3, kreuz: 'stein' }],
    ['fenster', { an: 'r', s: .3, z: .38, w: .3, h: .3, kreuz: 'stein' }], ['fenster', { an: 'r', s: .85, z: .38, w: .3, h: .3, kreuz: 'stein' }],
    ...(n > 1 ? [['fenster', { an: 'r', s: .3, z: h - .4, w: .3, h: .26, kreuz: 'stein' }], ['fenster', { an: 'r', s: .85, z: h - .4, w: .3, h: .26, kreuz: 'stein' }]] : []),
    ['dach', { x: .25, y: .3, b: 1.5, t: 1.4, z: h, h: .5, farbe: 'schiefer', achse: 'x', giebel: 'stein' }],
    ['quader', { x: 1.1, y: .72, b: .28, t: .28, z: h + .13, h: .6, farbe: 'ziegel' }], ['rauch', { x: 1.24, y: .86, z: h + .78 }],
    ['quader', { x: 1.55, y: 1.62, b: .36, t: .3, h: .12, farbe: 'ziegel', rillen: 2 }], ['quader', { x: 1.6, y: 1.65, b: .26, t: .22, z: .12, h: .12, farbe: 'ziegel', rillen: 2 }],
    ...(n > 2 ? [['quader', { x: 1.05, y: 1.62, b: .3, t: .3, h: .12, farbe: 'ziegel', rillen: 2 }], ['quader', { x: 1.1, y: 1.65, b: .2, t: .22, z: .12, h: .12, farbe: 'ziegel', rillen: 2 }]] : [])
  ]; };

  const handelsposten = n => [
    ['quader', { x: .3, y: .3, b: 1.4, t: .35, h: 1.05, farbe: 'holz', rillen: 5 }], ['quader', { x: .3, y: 1.0, b: 1.4, t: .5, h: .42, farbe: 'dachholz', rillen: 2 }],
    ['quader', { x: .28, y: 1.5, b: .08, t: .08, h: .85, farbe: 'holz' }], ['quader', { x: 1.64, y: 1.5, b: .08, t: .08, h: .85, farbe: 'holz' }],
    ['dach', { x: .2, y: .22, b: 1.6, t: 1.36, z: .85, h: .26, farbe: 'kalk', art: 'pult', streifen: ['kalk', 'akzent'], n: 3, giebel: 'kalk', ue: .04 }],
    ['quader', { x: 1.5, y: 1.62, b: .3, t: .3, h: .3, farbe: 'sand' }], ['quader', { x: 1.2, y: 1.68, b: .22, t: .22, h: .2, farbe: 'sand' }], ['zylinder', { cx: .45, cy: 1.72, r: .16, h: .42, farbe: 'holz' }],
    ...(n > 1 ? [['quader', { x: 1.95, y: .4, b: .7, t: .9, h: .5, farbe: 'brett', rillen: 3 }], ['dach', { x: 1.9, y: .35, b: .8, t: 1.0, z: .5, h: .3, farbe: 'akzent', art: 'pult', streifen: ['kalk', 'akzent'], n: 2 }],
      ['quader', { x: 2.05, y: 1.5, b: .3, t: .3, h: .3, farbe: 'sand' }]] : []),
    ...(n > 2 ? [['fahne', { x: .3, y: .3, z: 1.11, h: .45, farbe: 'akzent' }], ['quader', { x: .9, y: 1.7, b: .24, t: .24, h: .28, farbe: 'sand' }]] : [])
  ];

  const saegewerk = n => [
    ['quader', { x: .2, y: .25, b: 2.2, t: 1.5, h: .72, farbe: 'brett', rillen: 7 }], TUER(.35, 1.3, .5, 'l', 'tor'), ['fenster', { an: 'r', s: .5, z: .34, w: .4, h: .24, kreuz: 'brett' }],
    ['dach', { x: .2, y: .25, b: 2.2, t: 1.5, z: .72, h: .5, farbe: 'dachholz', achse: 'x', giebel: 'brett' }],
    ['quader', { x: 2.55, y: .35, b: .4, t: 1.2, h: .26, farbe: 'holz', rillen: 3 }], ['quader', { x: 2.6, y: .5, b: .3, t: .9, z: .26, h: .2, farbe: 'holz', rillen: 2 }],
    ['quader', { x: .35, y: 1.82, b: 1.5, t: .14, h: .1, farbe: 'sand' }],
    ...(n > 1 ? [['quader', { x: 2.5, y: .3, b: .5, t: 1.3, z: .46, h: .18, farbe: 'holz', rillen: 2 }], ['quader', { x: 1.7, y: .7, b: .26, t: .26, z: .92, h: .6, farbe: 'ziegel' }], ['rauch', { x: 1.83, y: .83, z: 1.7 }]] : [])
  ];

  const station = n => [
    ['quader', { x: .2, y: .3, b: 1.5, t: 1.3, h: .8, farbe: 'kalk' }], TUER(.25, .36, .52), F('l', .8, .28, .26, .3), F('l', 1.15, .28, .26, .3), F('r', .25, .28), F('r', .75, .28),
    ['quader', { x: .14, y: .24, b: 1.62, t: 1.42, z: .8, h: .09, farbe: 'schiefer' }],
    ['zylinder', { cx: .95, cy: .85, r: .3, z: .89, h: n > 1 ? .5 : .38, farbe: 'stein' }], ['schale', { x: .95, y: .85, z: n > 1 ? 1.39 : 1.27, r: n > 1 ? 30 : 28, farbe: 'akzent' }],
    ...(n > 1 ? [['quader', { x: .3, y: 1.2, b: .5, t: .5, z: .89, h: .26, farbe: 'kalk' }], ['schale', { x: .55, y: 1.45, z: 1.15, r: 18, farbe: 'akzent' }]] : [])
  ];

  const hafen = n => { const x = n > 1 ? 2.3 : 1.9; return [
    ['quader', { x: 0, y: .2, b: n > 1 ? 2.6 : 2.2, t: 1.4, h: .12, farbe: 'holz', rillen: 6 }], ['quader', { x: .2, y: .3, b: 1.0, t: .8, z: .12, h: .7, farbe: 'brett' }],
    ['dach', { x: .2, y: .3, b: 1.0, t: .8, z: .82, h: .35, farbe: 'ziegel', achse: 'x', giebel: 'brett' }],
    ['zylinder', { cx: x, cy: .4, r: .08, z: .12, h: .3, farbe: 'stein' }], ['zylinder', { cx: x, cy: 1.3, r: .08, z: .12, h: .3, farbe: 'stein' }],
    ['linie', { von: [x, .4, .38], bis: [x, 1.3, .38], farbe: 'dachholz', w: 3 }],
    ...(n > 1 ? [['quader', { x: 1.45, y: .5, b: .2, t: .2, z: .12, h: 1.1, farbe: 'dachholz' }], ['quader', { x: 1.45, y: .5, b: 1.0, t: .14, z: 1.12, h: .1, farbe: 'dachholz' }], ['linie', { von: [2.35, .57, 1.12], bis: [2.35, .57, .6], farbe: 'tinte', w: 2 }], ['quader', { x: 2.22, y: .47, b: .26, t: .2, z: .4, h: .22, farbe: 'sand' }], ['quader', { x: 1.15, y: 1.1, b: .4, t: .3, z: .12, h: .3, farbe: 'sand' }]] : [])
  ]; };

  /** Der Schaft besteht aus Abschnitten (weiss, rot, weiss ...), weil jeder Zylinder den vorigen von unten her überdeckt. */
  const schaft = (grenzen) => grenzen.slice(1).map((z, i) => ['zylinder', { cx: .9, cy: .9, r: .45, z: grenzen[i], h: z - grenzen[i], farbe: i % 2 ? 'ziegel' : 'kalk' }]);
  const leuchtturm = n => [
    ['quader', { x: .3, y: .3, b: 1.2, t: 1.2, h: .3, farbe: 'stein' }], ...schaft(n > 1 ? [.3, .75, 1.0, 1.7, 1.95, 2.5] : [.3, .7, .95, 1.9]),
    ['zylinder', { cx: .9, cy: .9, r: .5, z: n > 1 ? 2.5 : 1.9, h: .12, farbe: 'schiefer' }], ['kuppel', { cx: .9, cy: .9, r: .36, z: n > 1 ? 2.62 : 2.02, h: .4, farbe: 'ziegel' }],
    ['fahne', { x: .9, y: .9, z: n > 1 ? 3.02 : 2.42, h: .4, farbe: 'akzent' }]
  ];

  /** Stufen aus Kosten und Bildfunktion. braucht: Forschungsknoten je Stufe (null: keiner), zusätzlich zu dem des Bauteils. */
  const stufen = (kosten, bild, braucht = []) => kosten.map((k, i) => ({ kosten: k, bild: bild(i + 1), ...(braucht[i] ? { braucht: braucht[i] } : {}) }));

  L.welt({
    id: 'archipel',
    titel: 'Archipel',
    version: 1,
    stil: { ansicht: 'isometrisch', kachel: [128, 64], palette: 'archipel.css' },

    epochen: [
      { id: 'e1', name: 'Landung', tor: null,        plaetze: 5 },
      { id: 'e2', name: 'Handel',  tor: 'f-tor-e2',  plaetze: 9 }
    ],

    rohstoffe: {
      stein:      { name: 'Stein',      fach: 'mathe',    symbol: 'stein' },
      holz:       { name: 'Holz',       fach: 'deutsch',  symbol: 'holz' },
      handelsgut: { name: 'Handelsgut', fach: 'englisch', symbol: 'handelsgut' },
      proben:     { name: 'Proben',     fach: 'nmg',      symbol: 'proben' }
    },

    rezepte: {
      ziegel: { name: 'Ziegel', in: 'werkstatt', aus: { stein: 3, holz: 1 }, ergibt: [2, 3, 4] },
      balken: { name: 'Balken', in: 'saegewerk', aus: { holz: 3 },           ergibt: [2, 3] }
    },

    bauteile: {
      rathaus: { name: 'Rathaus', epoche: 'e1', rolle: 'rathaus', wirkung: 'ansicht', text: 'Mittelpunkt der Siedlung. Ein Ausbau zeigt, wie weit die Insel gekommen ist.',
        stufen: stufen([{ stein: 2 }, { stein: 24 }, { stein: 40, holz: 16, ziegel: 12 }], rathaus) },
      wohnhaus: { name: 'Wohnhaus', epoche: 'e1', rolle: 'wohnen', wirkung: 'ansicht', text: 'Keine Produktion. Ein Ausbau verändert nur das Aussehen der Siedlung.',
        stufen: stufen([{ stein: 10 }, { stein: 16, holz: 8 }, { stein: 28, ziegel: 10, holz: 16 }], wohnhaus, [null, 'f-zahlenkunde-1', 'f-sprachkunde-1']) },
      werkstatt: { name: 'Werkstatt', epoche: 'e1', rolle: 'produktion', wirkung: 'rezept', braucht: 'f-zahlenkunde-1', text: 'Hier werden Stein und Holz zu Ziegeln veredelt. Ein Ausbau erhöht die Ausbeute.',
        stufen: stufen([{ stein: 16, holz: 4 }, { stein: 16, ziegel: 4 }, { stein: 34, ziegel: 14 }], werkstatt) },
      handelsposten: { name: 'Handelsposten', epoche: 'e1', rolle: 'handel', wirkung: 'tausch', braucht: 'f-zahlenkunde-1', text: 'Hier werden Rohstoffe gegeneinander getauscht. Die Kurse stehen unter «Tauschen».',
        tausch: [{ gib: { stein: 3 }, erhalte: { holz: 2 } }, { gib: { holz: 3 }, erhalte: { stein: 2 } }, { gib: { stein: 4 }, erhalte: { handelsgut: 2 } }, { gib: { handelsgut: 3 }, erhalte: { proben: 2 } }],
        stufen: stufen([{ stein: 26 }, { stein: 24, ziegel: 6, handelsgut: 5 }, { stein: 26, ziegel: 14, handelsgut: 10 }], handelsposten) },

      saegewerk: { name: 'Sägewerk', epoche: 'e2', rolle: 'produktion', wirkung: 'rezept', braucht: 'f-zahlenkunde-2', text: 'Hier wird Holz zu Balken veredelt. Ein Ausbau erhöht die Ausbeute.',
        stufen: stufen([{ stein: 48, holz: 24 }, { holz: 30, ziegel: 18 }], saegewerk) },
      forschungsstation: { name: 'Forschungsstation', epoche: 'e2', rolle: 'forschung', wirkung: 'ansicht', braucht: 'f-weltkunde-1', text: 'Sie gehört zur Forschung der Insel. Ein Ausbau verändert nur das Aussehen.',
        stufen: stufen([{ stein: 50, ziegel: 16, proben: 5 }, { ziegel: 24, balken: 12, proben: 9 }], station) },
      hafen: { name: 'Hafen', epoche: 'e2', rolle: 'handel', wirkung: 'ansicht', braucht: 'f-seehandel-1', text: 'Der Hafen verbindet die Insel mit den Nachbarinseln. Ein Ausbau verändert nur das Aussehen.',
        stufen: stufen([{ stein: 46, balken: 12, handelsgut: 8 }, { balken: 20, ziegel: 20, handelsgut: 18 }], hafen) },
      leuchtturm: { name: 'Leuchtturm', epoche: 'e2', rolle: 'denkmal', wirkung: 'ansicht', braucht: 'f-seehandel-1', text: 'Ein Wahrzeichen der Insel. Ein Ausbau macht ihn höher.',
        stufen: stufen([{ stein: 56, ziegel: 18 }, { balken: 18, ziegel: 24, handelsgut: 12, proben: 8 }], leuchtturm) }
    },

    forschung: [
      { id: 'f-zahlenkunde-1', name: 'Zahlenkunde I',         epoche: 'e1', bereich: 'mathe.zahl',          wissen: 2, kosten: { stein: 10 } },
      { id: 'f-sprachkunde-1', name: 'Sprachkunde I',         epoche: 'e1', bereich: 'deutsch.sprache',     wissen: 2, kosten: { holz: 8 } },
      { id: 'f-zahlenkunde-2', name: 'Zahlenkunde II',        epoche: 'e1', bereich: 'mathe.zahl',          wissen: 4, kosten: { stein: 40 } },
      { id: 'f-tor-e2',        name: 'Tor zur Epoche Handel', epoche: 'e1', summe: 6,                                 kosten: { stein: 40, holz: 16 } },
      { id: 'f-seehandel-1',   name: 'Seehandel I',           epoche: 'e2', bereich: 'englisch.wortschatz', wissen: 2, kosten: { handelsgut: 5 } },
      { id: 'f-weltkunde-1',   name: 'Weltkunde I',           epoche: 'e2', bereich: 'nmg.natur',           wissen: 2, kosten: { proben: 5 } }
    ],

    expeditionen: [
      { id: 'exp-rundgang', name: 'Rundgang über die Insel', epoche: 'e1',
        umfang: 12, ziel: 0.75, belohnung: { sammlung: 'kompass', rohstoffe: { stein: 6, holz: 6 } } },
      { id: 'exp-kueste', name: 'Küstenvermessung',      epoche: 'e1', braucht: { bereich: 'mathe.zahl', wissen: 2 },
        umfang: 20, ziel: 0.8, belohnung: { sammlung: 'seekarte', rohstoffe: { stein: 15 } } },
      { id: 'exp-inseln', name: 'Wortschatz-Inselkunde', epoche: 'e2', braucht: { bereich: 'englisch.wortschatz', wissen: 2 },
        umfang: 20, ziel: 0.8, belohnung: { sammlung: 'flaschenpost', rohstoffe: { handelsgut: 10 } } }
    ],

    sammlung: [
      { id: 'kompass',      name: 'Kompass vom Strand' },
      { id: 'seekarte',    name: 'Seekarte der Südküste' },
      { id: 'flaschenpost', name: 'Flaschenpost von der Nachbarinsel' }
    ]
  });
})(globalThis);
