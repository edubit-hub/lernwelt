/* app/ansichten/logbuch-texte.js: die neuen Texte des Logbuchs als Buch (docs/gestaltung-umbau.md 2.12 und 6.1, Vorbild docs/mockup/richtung-a/a-logbuch.js).
   Die Texte der Kacheln (Wochenwerte, Wissensstand, Bestwerte, Sammlung) bleiben in welt-texte.js (Texte.welt). Verglichen wird nur mit sich selbst:
   keine Rangliste, keine Serie. tests/welt-auftraege.test.mjs prüft jeden Text mit Pruefung.pruefeTexte (BEISPIELE_LOGBUCH). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.Texte = L.Texte || {};
  L.Texte.logbuchseite = {
    kicker: 'Logbuch', titel: 'Die letzten sieben Tage', schliessen: 'Logbuch schliessen',
    reiterName: 'Seiten des Logbuchs', reiter: { woche: 'Woche', wissen: 'Wissen', sammlung: 'Sammlung' },
    woche: 'Deine Woche', wocheUnter: 'Die letzten sieben Tage, gestrichelt die Woche davor.',
    fundstuecke: 'Fundstücke', plaketten: 'Plaketten', vitrine: 'Vitrine mit den Fundstücken'
  };
})(globalThis);
