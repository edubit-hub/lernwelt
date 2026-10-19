/* app/ansichten/huelle-texte.js: die Texte des Rahmens (Hülle, HUD, Dock, Tafel, Weg) an einer Stelle (Architektur 6.9 und 7.1, docs/gestaltung-umbau.md 2.1).
   Der Ton ist sachlich und auf Augenhöhe: keine Ausrufezeichen, kein Lob, kein Druck. tests/huelle.test.mjs prüft jeden Text mit Pruefung.pruefeTexte.
   Die Statuszeile des Tages (.heute) nutzt weiter die Texte aus texte.js (Texte.lernen.status*), die Welt-Texte stehen in welt-texte.js. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
  const von = (ist, soll) => `${ist} von ${soll}`;

  L.Texte = L.Texte || {};
  L.Texte.huelle = {
    // HUD oben
    hudName: 'Stand der Insel', epoche: nr => `Epoche ${nr}`, torVon: (hat, braucht) => `Tor ${von(hat, braucht)}`,
    // Tor in der Medaille: erst wenn auch das Material reicht, heisst es «bereit»; sonst sagt die Zeile, was fehlt
    torWissen: (hat, braucht) => `Tor: Wissen ${von(hat, braucht)}`, torNoch: text => `Tor: noch ${text}`, torStand: text => `Tor: ${text}`, torBereit: 'Tor bereit zum Erforschen', zurInsel: 'Zur ganzen Insel', inselZurueck: 'Insel',
    // Nächstes Ziel: ein Verb statt eines vollen Zählers
    zielErforschen: name => `${name} erforschen`, zielNoch: (name, text) => `${name}: noch ${text}`, zielStand: (name, text) => `${name}: ${text}`, bereitZumErforschen: 'Bereit zum Erforschen', noch: text => `noch ${text}`,
    medaille: (nr, name, tor) => `Epoche ${nr}, ${name}${tor ? `, ${tor}` : ''}`,
    vorrat: 'Vorrat', pille: (name, zahl, plus) => `${name}: ${zahl}${plus ? `, in dieser Sitzung ${plus} dazu` : ''}`,
    klang: 'Klang', klangBeschriftung: 'Klang ein- oder ausschalten', klangAn: 'Klang ist an', klangAus: 'Klang ist aus',

    // Dock unten
    dockName: 'Orte der Insel', haupt: 'Tagesauftrag', hauptFerien: 'Trotzdem üben', hauptErledigt: 'Für heute erledigt',
    hauptInfo: (n, m) => `${mz(n, 'Aufgabe', 'Aufgaben')} · etwa ${m} Min.`,

    // Tafel
    schliessen: 'Schliessen',

    // Weg statt Sperrtext: höchstens drei Schritte und ein Handlungsknopf
    wegTitel: 'So geht es weiter', wegStand: (ist, soll) => von(ist, soll), erledigt: 'erledigt',
    materialSammeln: text => `Material sammeln: ${text}`, platzFrei: 'Einen Bauplatz frei machen',
    ueben: { mathe: 'Rechnen üben', deutsch: 'Deutsch üben', englisch: 'Englisch üben', nmg: 'NMG üben' }, uebenAllgemein: 'Üben',
    forschungAnsehen: 'Forschung ansehen', torAnsehen: 'Tor ansehen',

    // Bausteine
    duHast: n => `du hast ${n}`, wissenWort: 'Wissen', lampen: (ist, soll) => von(ist, soll)
  };
})(globalThis);
