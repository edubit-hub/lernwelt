/* app/ansichten/auftraege-texte.js: die neuen Texte der Ansicht «Aufträge» am Hafen (docs/gestaltung-umbau.md 2.11 und 6.1, Vorbild docs/mockup/richtung-a/a-hafen.js).
   Die bisherigen Texte der Expeditionen bleiben in welt-texte.js (Texte.welt). Der Ton ist sachlich: keine Ausrufezeichen, kein Lob, kein Druck.
   tests/welt-auftraege.test.mjs prüft jeden Text mit Pruefung.pruefeTexte (BEISPIELE_HAFEN). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;

  L.Texte = L.Texte || {};
  L.Texte.hafen = {
    // Tafel am Hafen
    kicker: 'Aufträge am Hafen', titel: 'Expeditionen', weitere: 'Weitere Routen',

    // Fähnchen der Routen auf dem Wasser
    routeAufgaben: n => mz(n, 'Aufgabe', 'Aufgaben'), routeZu: 'noch zu', routeErledigt: 'erledigt',

    // Inhalt einer Route
    fundstueck: 'Fundstück', fundDa: 'schon in deiner Sammlung', fundOffen: 'kommt in deine Sammlung',
    lohn: 'Ertrag', lohnPosten: (name, menge) => `${name} +${menge}`, lohnFest: 'Der Ertrag steht vorher fest.',
    voraussetzung: 'Voraussetzung', bereit: 'Alles bereit für die Expedition.'
  };
})(globalThis);
