/* app/ansichten/siedlung-texte.js: neue Texte der Siedlung auf der Bühne (docs/gestaltung-umbau.md 2.9 und 6.1). Die bisherigen Texte der Siedlung stehen
   unverändert in welt-texte.js (Texte.welt), die des Rahmens in huelle-texte.js (Texte.huelle). Ton sachlich, Du-Form, keine Ausrufezeichen, kein Lob.
   tests/welt-siedlung.test.mjs prüft jeden Text mit Pruefung.pruefeTexte (BEISPIELE für jede Funktion). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.Texte = L.Texte || {};
  L.Texte.siedlungsseite = {
    // Kicker der Tafel je Zustand
    kickerBauplatz: 'Bauplatz', kickerGebaeude: 'Gebäude',

    // Wahl der Gebäude auf einem freien Platz
    zurWahl: 'Zur Wahl', baubar: 'baubar', spaeter: 'später',

    // Weg statt Sperrtext
    wegBauen: name => `So lässt sich ${name} bauen`, wegAusbau: (name, stufe) => `So kommt ${name} auf Stufe ${stufe}`,wegEpoche: name => `So öffnet sich die Epoche «${name}»`,
    torErforschen: name => `Forschung «${name}» erforschen`, platzOffen: 'Der Bauplatz ist offen',
    wissenSammeln: 'Wissen sammeln', torMaterial: text => `Material: ${text}`,
    platzOffenUnter: beispiele => (beispiele ? `Dann stehen ${beispiele} zur Wahl.` : 'Dann lässt sich hier bauen.'),
    zumTagesauftrag: 'Zum Tagesauftrag', gutVeredeln: name => `${name} veredeln`,

    // Effekte und Bühne
    minus: n => `−${n}`, plus: n => `+${n}`, schildNeu: 'Neu möglich',
    pfeilAusbau: name => `${name}: Ausbau möglich`, pfeilBauen: name => `Freier Bauplatz: ${name} lässt sich bauen`,

    // Legende auf der Bühne
    legendeFrei: 'Freier Bauplatz', legendeSiegel: 'Epoche noch zu', legendeStufe: 'Die Stufe zeigt sich beim Antippen'
  };
})(globalThis);
