/* app/welt/weltregeln.js: alle Stellschrauben der Spielwelt an einem Ort (Architektur 7.3, 7.4 und 7.5).
   Startwerte, die nach drei Wochen echter Nutzung mit tests/simulation.mjs kalibriert werden (R8). Das Verdienstbuch und die Engine
   lesen diese Zahlen bei jedem Aufruf. Ein Welt-Thema (Daten) darf sie nicht wiederholen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.weltregeln = L.einfrieren({
    version: 1,
    ertrag: {                                        // Ertrag je Aufgabe, idempotent (7.3)
      wissen: { 2: 1, 3: 1, 4: 2, 5: 1, 6: 1 },      // Rohstoff des Fachs, wenn eine Aufgabe erstmals diese Box erreicht
      pflege: { je: 5, menge: 1, tagesDeckel: 3 },   // je 5 richtig gelöste fällige Abrufe
      korrektur: { menge: 1, tagesDeckel: 3 }        // ein ernsthaft gemachter Fehler wird selbständig richtig gelöst
    },
    wissenspunkte: { basis: 0.5, sicher: 1, gefestigt: 0.5, aufgabenJePunkt: 10 },   // je Themenstufe, mal Grundwert des Themas
    weltzeit: { hinweisAnteil: 0.2 },                // Schutzregel 7: über 20 % der Zeit in der Welt zeigt der Elternbereich einen Hinweis
    budget: {                                        // Obergrenzen für ein Welt-Thema (7.5), das Prüfskript meldet Überschreitungen
      epochen: 4, gebaeudeArtenJeEpoche: 4, gebaeudeArtenGesamt: 16, stufenJeGebaeude: 3,
      wirkungstypen: ['rezept', 'tausch', 'frei', 'ansicht'],
      rezepte: 8, forschungsknoten: 24, expeditionen: 12, sammlung: 24
    }
  });
})(globalThis);
