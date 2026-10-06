/* module/katalog.js: Verzeichnis aller Module ohne ihren Inhalt. ERZEUGT von `lw manifest` (tools/lw/manifest.mjs), nicht von Hand ändern.
   Eintrag je Modul: { id, titel, fach, stufen, status, version, aufgaben } und, wenn das Modul ein Ablaufdatum hat, gueltigBis.
   Der Elternbereich und der Start wählen daraus die Module, deren Dateien danach geladen werden (app/manifest.js). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.katalog = [
    { id: 'mathe-einmaleins', titel: 'Einmaleins', fach: 'mathe', stufen: [3, 4], status: 'entwurf', version: '1.0.0', aufgaben: 140 }
  ];
})(globalThis);
