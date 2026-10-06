/* module/_gemeinsam/fehlercodes-rechenweg.js: Katalog der Fehlercodes, die der Baustein _gemeinsam/rechenweg erkennt, mit den Texten für
   Kind und Eltern (Architektur 2.3, Regel 8). Jeder Eintrag hat die Form eines Eintrags in fehlerCodes: { kind, eltern, folge }.
   Das Kind liest nur «kind» (sachlich, ohne Ausrufezeichen), die Eltern lesen «eltern». Die Begriffe sind die der halbschriftlichen
   Rechenwege (Übergang, Teilsumme, Ausgleich, Entbündeln), nicht die eines schriftlichen Verfahrens.
   Gebrauch wie bei _gemeinsam/fehlercodes-rechnen: modul.js bleibt reine Daten und schreibt die Einträge als Kopie in sein eigenes
   fehlerCodes, sein Test vergleicht sie mit diesem Katalog. holen('einer-daneben', ...) liefert frische, veränderbare Kopien. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;

  const CODES = L.einfrieren({
    'uebergang-vergessen': {
      kind: 'Beim Übergang über den Zehner oder den Hunderter fehlt etwas. Springe zuerst bis zur vollen Zahl und rechne dann den Rest.',
      eltern: 'Der Übergang wurde nicht mitgerechnet (zum Beispiel 358 + 47 = 395 statt 405). Hilft: am Rechenstrich zuerst bis zum nächsten Zehner oder Hunderter springen lassen.',
      folge: 'braucht'
    },
    'stellen-vermischt': {
      kind: 'Zehner und Einer wurden vermischt. Zehner zählen in Zehnerschritten, Einer in Einerschritten.',
      eltern: 'Die Ziffern der zweiten Zahl wurden alle als Einer addiert (zum Beispiel 358 + 47 = 369 statt 405). Hilft: die Zahl in Hunderter, Zehner und Einer zerlegen und die Stellenwerttafel zeigen.',
      folge: 'braucht'
    },
    'teilsumme-vergessen': {
      kind: 'Eine Teilsumme fehlt. Zähle am Schluss alle Teilsummen zusammen.',
      eltern: 'Beim stellenweisen Rechnen wurde eine Teilsumme (Hunderter, Zehner oder Einer) nicht mitgezählt. Hilft: die Teilsummen untereinander aufschreiben und beim Zusammenzählen abhaken.',
      folge: null
    },
    'kleinere-von-groesserer': {
      kind: 'In jeder Stelle wurde die kleinere von der grösseren Ziffer abgezogen. Ziehe die ganze Zahl in Schritten ab oder ergänze.',
      eltern: 'Typischer Fehler: Stelle für Stelle wird die kleinere von der grösseren Ziffer abgezogen (zum Beispiel 724 − 389 = 465 statt 335). Hilft: in Schritten abziehen (zuerst die Hunderter, dann die Zehner, dann die Einer) oder ergänzen.',
      folge: 'braucht'
    },
    'entbuendeln-vergessen': {
      kind: 'Beim Tauschen eines Zehners oder Hunderters fehlt ein Schritt: Die Stelle, von der getauscht wurde, ist danach um 1 kleiner.',
      eltern: 'Das Entbündeln wurde nur halb ausgeführt (zum Beispiel 83 − 46 = 47 statt 37). Hilft: mit der Stellenwerttafel einen Zehner in 10 Einer tauschen und die Plättchen wirklich wegnehmen.',
      folge: 'braucht'
    },
    'rechenzeichen-verwechselt': {
      kind: 'Plus und minus sind verwechselt. Lies das Rechenzeichen noch einmal.',
      eltern: 'Das Rechenzeichen wurde verwechselt, oder die Umkehraufgabe wurde in die falsche Richtung gerechnet. Meist Flüchtigkeit: das Rechenzeichen vor dem Rechnen laut lesen lassen.',
      folge: null
    },
    'sprung-vergessen': {
      kind: 'Beim Ergänzen fehlt ein Sprung in der Summe. Zähle alle Sprünge zusammen, auch den kleinen.',
      eltern: 'Beim Ergänzen wurde ein Sprung nicht mitgezählt. Hilft: die Sprünge untereinander aufschreiben und beim Zusammenzählen abhaken.',
      folge: null
    },
    'ausgleich-vergessen': {
      kind: 'Nach dem Runden muss der Unterschied wieder ausgeglichen werden. Frage dich: Um wie viel habe ich die Zahl verändert?',
      eltern: 'Bei der Hilfsaufgabe wurde der Unterschied nicht ausgeglichen (zum Beispiel 298 + 147 = 447, ohne die 2 abzuziehen). Hilft: laut fragen, um wie viel die Zahl verändert wurde.',
      folge: null
    },
    'ausgleich-falsch': {
      kind: 'Der Ausgleich geht in die andere Richtung. Wurde zu viel dazugezählt, gehört der Unterschied weg, und umgekehrt.',
      eltern: 'Der Unterschied wurde mit dem falschen Rechenzeichen ausgeglichen (zum Beispiel 447 + 2 statt 447 − 2). Hilft: am Rechenstrich zeigen, ob der erste Sprung zu weit oder zu kurz war.',
      folge: null
    },
    'einer-daneben': {
      kind: 'Das Ergebnis ist knapp daneben. Rechne den letzten Schritt noch einmal.',
      eltern: 'Kleiner Rechenfehler, meist bei den Einern. Kein Wissensproblem, solange es nur selten vorkommt.',
      folge: null
    }
  });

  L.baustein('_gemeinsam/fehlercodes-rechenweg', L.einfrieren({
    codes: CODES,

    /** { code: { kind, eltern, folge } } für die genannten Codes, als Kopien. */
    holen(...ids) {
      return Object.fromEntries(ids.map(id => {
        const c = CODES[id];
        if (!c) throw new Error(`Fehlercode «${id}» steht nicht im Katalog «_gemeinsam/fehlercodes-rechenweg»`);
        return [id, { kind: c.kind, eltern: c.eltern, folge: c.folge }];
      }));
    }
  }));
})(globalThis);
