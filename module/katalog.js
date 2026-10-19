/* module/katalog.js: Verzeichnis aller Module ohne ihren Inhalt. ERZEUGT von `lw manifest` (tools/lw/manifest.mjs), nicht von Hand ändern.
   Eintrag je Modul: { id, titel, fach, stufen, status, version, aufgaben } und, wenn das Modul ein Ablaufdatum hat, gueltigBis.
   Der Elternbereich und der Start wählen daraus die Module, deren Dateien danach geladen werden (app/manifest.js). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.katalog = [
    { id: 'deutsch-rechtschreibung', titel: 'Rechtschreibung', fach: 'deutsch', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 130 },
    { id: 'deutsch-satzbau', titel: 'Satzbau: Satzglieder und Verb an zweiter Stelle', fach: 'deutsch', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 256 },
    { id: 'deutsch-wortarten', titel: 'Wortarten, Satzzeichen und ABC', fach: 'deutsch', stufen: [3], status: 'entwurf', version: '1.0.0', aufgaben: 197 },
    { id: 'englisch-farben-formen', titel: 'Englisch: Farben, Formen und Orte im Bild', fach: 'englisch', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 85 },
    { id: 'englisch-grundlagen', titel: 'Englisch: Grundlagen', fach: 'englisch', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 151 },
    { id: 'englisch-themen', titel: 'Englisch: Wortschatz nach Themen', fach: 'englisch', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 95 },
    { id: 'mathe-einmaleins', titel: 'Einmaleins', fach: 'mathe', stufen: [3, 4], status: 'entwurf', version: '1.1.0', aufgaben: 358 },
    { id: 'mathe-groessen', titel: 'Grössen', fach: 'mathe', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 441 },
    { id: 'mathe-plus-minus-1000', titel: 'Plus und minus bis 1000', fach: 'mathe', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 106 },
    { id: 'mathe-zahlraum-1000', titel: 'Zahlen bis 1000', fach: 'mathe', stufen: [3], status: 'entwurf', version: '0.2.0', aufgaben: 158 },
    { id: 'nmg-korn-pasta', titel: 'Vom Korn zur Pasta', fach: 'nmg', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 124 },
    { id: 'nmg-stoffe', titel: 'Stoffe', fach: 'nmg', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 76 },
    { id: 'nmg-zeit', titel: 'Zeit und früher', fach: 'nmg', stufen: [3], status: 'entwurf', version: '0.1.0', aufgaben: 71 }
  ];
})(globalThis);
