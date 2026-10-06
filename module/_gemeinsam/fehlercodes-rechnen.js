/* module/_gemeinsam/fehlercodes-rechnen.js: Katalog der Fehlercodes, die der Baustein _gemeinsam/rechnen erkennt, mit den
   Texten für Kind und Eltern (Architektur 2.3, Regel 8). Jeder Eintrag hat die Form eines Eintrags in fehlerCodes:
   { kind, eltern, folge }. Das Kind liest nur «kind» (sachlich, ohne Ausrufezeichen), die Eltern lesen «eltern».
   Gebrauch: modul.js bleibt reine Daten und kann keinen Baustein lesen. Das Modul schreibt die Einträge deshalb in sein
   eigenes fehlerCodes (Kopie), und sein Test vergleicht sie mit diesem Katalog. holen('ziffern-vertauscht', ...) liefert
   frische, veränderbare Kopien für Generator, Test oder Werkzeug. Ein unbekannter Code wirft einen Fehler. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;

  const CODES = L.einfrieren({
    'ziffern-vertauscht': {
      kind: 'Die Ziffern sind vertauscht. Lies die Zahl noch einmal.',
      eltern: 'Flüchtigkeit, kein Wissensproblem.',
      folge: null
    },
    'zehner-daneben': {
      kind: 'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.',
      eltern: 'Übertrag oder Zehner vergessen.',
      folge: null
    }
  });

  L.baustein('_gemeinsam/fehlercodes-rechnen', L.einfrieren({
    codes: CODES,

    /** { code: { kind, eltern, folge } } für die genannten Codes, als Kopien. */
    holen(...ids) {
      return Object.fromEntries(ids.map(id => {
        const c = CODES[id];
        if (!c) throw new Error(`Fehlercode «${id}» steht nicht im Katalog «_gemeinsam/fehlercodes-rechnen»`);
        return [id, { kind: c.kind, eltern: c.eltern, folge: c.folge }];
      }));
    }
  }));
})(globalThis);
