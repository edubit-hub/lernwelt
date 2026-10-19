/* app/ansichten/forschung-texte.js: die neuen Texte der Forschungskarte (docs/gestaltung-umbau.md 2.10 und 6.1) unter Lernwelt.Texte.forschungskarte.
   Die bisherigen Welt-Texte (Zustände, Wissen, Ziel, Horizont) stehen weiter in welt-texte.js und bleiben unverändert. Der Ton ist sachlich:
   keine Ausrufezeichen, kein Lob, keine technischen Kennungen. tests/welt-forschung.test.mjs prüft jeden Text mit Pruefung.pruefeTexte. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const von = (ist, soll) => `${ist} von ${soll}`;

  L.Texte = L.Texte || {};
  L.Texte.forschungskarte = {
    // Kopf der Tafel
    kicker: 'Forschungsturm', titel: (nr, name) => `Forschung · Epoche ${nr}${name ? ` ${name}` : ''}`, titelOhneEpoche: 'Forschung', karteName: 'Forschungskarte',
    // Karte: Spalten je Epoche, Zeilen je Fach, Schild an gesperrten Epochen
    epoche: nr => `Epoche ${nr}`, horizont: 'Später', zweige: 'Zweige der Forschung', zweig: fach => `Zweig ${fach}`,
    knoten: (name, zustand, wissen, ziel) => `${name}, ${zustand}${wissen ? `, Wissen ${wissen}` : ''}${ziel ? ', dein Ziel' : ''}`,
    lampen: (ist, soll) => von(ist, soll), torKosten: (hat, menge) => von(hat, menge),
    // Tafel unten: der gewählte Knoten
    kickerKnoten: bereich => `Forschung · ${bereich}`, kickerTor: 'Tor zur nächsten Epoche', kickerHorizont: 'Forschung · später',
    wissen: 'Wissen', kosten: 'Kosten', bezahlt: 'Bezahlt', schaltetFrei: 'Schaltet frei', uebenMit: liste => `Geübt wird mit ${liste}`,
    zielMarke: 'Ziel', alleBereiche: 'Alle Bereiche'
  };
})(globalThis);
