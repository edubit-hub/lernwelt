/* app/ansichten/lernen-texte.js: Texte der neuen Tagesauftrag-Auswahl und des Aufgabenrahmens (docs/gestaltung-umbau.md 2.5 bis 2.7, 6.1).
   Die bisherigen Texte der Ansicht «Lernen» bleiben in texte.js (L.Texte.lernen), die Texte des Laufs in Rueckmeldung.texte.
   Ton wie überall: sachlich, Du-Form, keine Ausrufezeichen, kein Lob. tests/lernansichten.test.mjs prüft jeden Text. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
  const min = m => `etwa ${mz(m, 'Minute', 'Minuten')}`;

  L.Texte = L.Texte || {};
  L.Texte.lernrahmen = {
    // Auswahl (Tafel «Tagesauftrag»)
    umfang: (n, m) =>`${mz(n, 'Aufgabe', 'Aufgaben')}, ${min(m)}`,
    reihenfolge: 'Du wählst die Reihenfolge.',
    rundeInfo: (n, m) => `${mz(n, 'Aufgabe', 'Aufgaben')} · ${min(m)}`,
    neu: n => `${n} neu`,
    ertragVon: name => `Ertrag: ${name}`,
    rundeStarten: titel => `Runde ${titel} starten`,
    schliessen: 'Zum Start',
    // Aufgabenrahmen: Route, Schiff und Ertrag der Runde
    ertragKicker: 'Ertrag der Runde',
    ertragZahl: (n, name) => (name ? (n ? `${n} ${name}` : name) : String(n)),          // ohne Ertrag keine «0»: nur der Name des Rohstoffs
    ertragBeschriftung: (n, name) => `Ertrag der Runde: ${name ? `${n} ${name}` : n}`,
    route: (fertig, n) => `Weg der Runde: ${fertig} von ${mz(n, 'Aufgabe', 'Aufgaben')} erledigt`,
    etappe: (k, n) => `Etappe ${k} von ${n}`,
    // Etikett und Arbeitsauftrag über der Arbeitsfläche (Nachbesserung 1): «Rechnen · Einmaleins», ein Satz zur ganzen Handlung je Übungstyp
    etikett: (fach, thema) => (fach && thema ? `${fach} · ${thema}` : fach || thema || ''),
    auftrag: typ => AUFTRAG[typ] || ''
  };
  // Grundsatz je Typ. Bringt der Typ eine eigene Zeile mit (p.hinweis, etwa Zuordnen, Reihenfolge, Lückentext), rückt der Rahmen deren Text an
  // dieselbe Stelle (aufgabe-rahmen.js, hebeHinweis); so steht der Arbeitsauftrag bei jedem Typ an einem Ort.
  const AUFTRAG = {
    eingabe: 'Tippe die Antwort ins Feld.',
    'multiple-choice': 'Tippe die passende Antwort an.',
    karteikarten: 'Überlege die Antwort. Dann tippe, wie sicher du bist.',
    hoeren: 'Hör zu und tippe die passende Antwort an.',
    diktat: 'Hör zu und schreibe, was du hörst.',
    zahlenstrahl: 'Tippe auf den Zahlenstrahl oder schiebe die Marke.',
    blitzrechnen: 'Tippe die Antwort ins Feld.'
  };
})(globalThis);
