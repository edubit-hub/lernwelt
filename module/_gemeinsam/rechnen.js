/* module/_gemeinsam/rechnen.js: gemeinsamer Baustein für Rechenmodule (Architektur 4.1 und 4.3).
   Erkennt typische Zahlenfehler aus der Antwort z und dem Ergebnis c. Reine Funktionen auf ganzen Zahlen: kein Zustand,
   keine Oberfläche, kein Zufall. Auch Nicht-Zahlen (NaN, Texte, fehlende Antwort) sind erlaubt und ergeben false.
   Gebrauch: das Modul nennt den Baustein in modul.js unter braucht: ['_gemeinsam/rechnen'], sein Generator liest ihn
   in diagnose() mit Lernwelt.registry.bausteine.get('_gemeinsam/rechnen'). Die zugehörigen Texte für Kind und Eltern
   stehen im Katalog _gemeinsam/fehlercodes-rechnen. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ganz = Number.isInteger;

  L.baustein('_gemeinsam/rechnen', L.einfrieren({
    /** Die Ziffern der Antwort stehen in umgekehrter Reihenfolge wie beim Ergebnis (65 statt 56). Dieselbe Zahl zählt nicht (66 bei 66). */
    ziffernVertauscht: (z, c) => ganz(z) && ganz(c) && z !== c && [...String(z)].reverse().join('') === String(c),

    /** Die Antwort liegt genau einen Zehner neben dem Ergebnis (46 oder 66 statt 56). */
    zehnerDaneben: (z, c) => ganz(z) && ganz(c) && Math.abs(z - c) === 10
  }));
})(globalThis);
