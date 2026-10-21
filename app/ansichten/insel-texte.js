/* app/ansichten/insel-texte.js: die Texte der Fachinseln (Plan 0.2, S3): Archipel, Tafel des Areals, Themenliste und Medaille im HUD.
   Der Ton ist sachlich und auf Augenhöhe: keine Ausrufezeichen, kein Lob, kein Druck. tests/inseln-ansichten.test.mjs prüft jeden Text mit Pruefung.pruefeTexte. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;

  L.Texte = L.Texte || {};
  L.Texte.inseln = {
    // Dock und Archipel
    fachinseln: 'Fachinseln', themen: 'Themen',
    archipelKicker: 'Deine Inseln', archipelTitel: 'Welche Insel?', archipelHinweis: 'Tippe auf eine Insel oder wähle sie hier.',
    inselKnopf: (name, stand) => `Insel ${name}, ${stand}`,
    ausgebaut: (n, von) => `${n} von ${mz(von, 'Areal', 'Arealen')} ausgebaut`,

    // Medaille im HUD
    medailleKick: 'Insel', medaille: (name, stand) => `Insel ${name}, ${stand}. Andere Insel wählen`, medailleZurInsel: (name, stand) => `Insel ${name}, ${stand}. Zur ganzen Insel`,

    // Tafel des Areals
    phasen: ['Bauplatz', 'Fundament', 'Rohbau', 'Ausgebaut'],
    phaseVon: (nr, name) => `Phase ${nr} von 3: ${name}`,
    naechste: (phase, hat, soll) => [
      '',
      `Für das Fundament: ${mz(soll, 'Aufgabe', 'verschiedene Aufgaben')} in diesem Areal richtig lösen. Bisher ${hat}.`,
      `Für den Rohbau: in ${mz(soll, 'Thema', 'Themen')} die Stufe «Basis» erreichen. Bisher ${hat}.`,
      `Zum Ausbauen: in ${mz(soll, 'Thema', 'Themen')} die Stufe «Sicher» erreichen. Bisher ${hat}.`
    ][phase],
    fertig: 'Dieses Areal ist ausgebaut. Was du hier übst, bleibt frisch.',
    themenKopf: 'Themen in diesem Areal',
    stufe: { neu: 'Neu', begonnen: 'Begonnen', basis: 'Basis', sicher: 'Sicher', gefestigt: 'Gefestigt' },
    ueben: 'Üben', uebenThema: titel => `${titel} üben`,
    zurInsel: 'Zur Insel', allesListe: 'Alle Themen als Liste',

    // Themenliste
    themenKicker: 'Alle Inseln', themenTitel: 'Themen',
    neuesLand: 'Neues Land'
  };
})(globalThis);
