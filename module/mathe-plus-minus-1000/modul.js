/* module/mathe-plus-minus-1000/modul.js: Plus und minus bis 1000 mit halbschriftlichen Rechenwegen. Reine Daten: ein einziger Aufruf, kein Zugriff
   auf Registry oder Bausteine, damit die Werkzeuge dieses Skript lesen können, bevor irgendetwas anderes geladen ist.
   Aufbau: Grundlage bis 100 (plus-100, minus-100, luecken-100), Addition bis 1000 (plus-1000 und drei Themen zu den Rechenwegen), Subtraktion bis 1000
   (ebenso) und das Thema «schriftlich-add», das standardmässig aus ist. Jedes Thema hat genau eine Aufgabenform, weil jeder Typ der Leiter jede Form des
   Themas annehmen muss: rechnung (eingabe), satz (lueckentext), abfolge (reihenfolge), auswahl (multiple-choice).
   Stand: Entwurf. Lehrmittel, Wortwahl der Rechenwege, Lehrplan-Codes, Prüfungsformat und alle Lösungswege sind ungeprüft (README.md, TODO).
   TODO: schriftliche Subtraktion. Ob die Klasse abzieht (mit Entbündeln) oder ergänzt, hängt vom Lehrmittel ab, darum gibt es dafür kein Thema. */
Lernwelt.modul({
  schema: 1,
  id: 'mathe-plus-minus-1000',               // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Plus und minus bis 1000',
  fach: 'mathe',
  bereich: 'mathe.zahl',                     // Platz im Forschungsbaum der Spielwelt
  stufen: [3],
  zyklus: 2,
  lp21: ['MA.1.A.3.c', 'MA.1.A.3.d', 'MA.1.A.3.e', 'MA.1.A.4.c', 'MA.1.A.4.f', 'MA.1.B.2.c', 'MA.1.B.2.f', 'MA.1.C.1.c', 'MA.1.C.1.e'],   // aus der Recherche, vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  dateien: ['fam-hundert.js', 'fam-addition.js', 'fam-subtraktion.js', 'fam-schriftlich.js'],
  braucht: ['_gemeinsam/rechnen', '_gemeinsam/familien', '_gemeinsam/rechenweg'],

  lernziele: [
    { id: 'lz1', text: 'Ich kann bis 100 addieren und subtrahieren, ohne zu zählen, auch über den Zehner.' },
    { id: 'lz2', text: 'Ich kann auf den nächsten Zehner und auf 100 ergänzen und mit der Umkehraufgabe kontrollieren.' },
    { id: 'lz3', text: 'Ich kann Zahlen bis 1000 addieren, auch mit dem Übergang über den Zehner und den Hunderter.' },
    { id: 'lz4', text: 'Ich kann eine Addition mit einem Rechenweg lösen (schrittweise, stellenweise oder durch Vereinfachen) und ihn aufschreiben.' },
    { id: 'lz5', text: 'Ich kann Zahlen bis 1000 subtrahieren, durch Abziehen oder durch Ergänzen.' },
    { id: 'lz6', text: 'Ich kann eine Subtraktion mit einem Rechenweg lösen und jeden Schritt nachvollziehen.' },
    { id: 'lz7', text: 'Ich kann Fehler in einem Rechenweg finden und mein Ergebnis mit einem Überschlag oder der Umkehraufgabe kontrollieren.' },
    { id: 'lz8', text: 'Ich kann bei einer Subtraktion den passenden Rechenweg wählen und die Wahl begründen.' },
    { id: 'lz9', text: 'Ich kann Zahlen untereinander addieren, Stelle für Stelle.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt der Vater nach dem Abgleich, nie ein Agent
    'ueber-zehner':    { titel: 'Über den Zehner oder Hunderter rechnen',        quelle: 'Lehrmittel Seite __', geprueft: null },
    schrittweise:      { titel: 'Schrittweise addieren',                         quelle: 'Lehrmittel Seite __', geprueft: null },
    stellenweise:      { titel: 'Stellenweise addieren',                         quelle: 'Lehrmittel Seite __', geprueft: null },
    hilfsaufgabe:      { titel: 'Vereinfachen und ausgleichen',                    quelle: 'Lehrmittel Seite __', geprueft: null },
    doppelt:           { titel: 'Vom Doppelten ausgehen',                        quelle: 'Lehrmittel Seite __', geprueft: null },
    abziehen:          { titel: 'Schrittweise abziehen',                         quelle: 'Lehrmittel Seite __', geprueft: null },
    ergaenzen:         { titel: 'Durch Ergänzen',                                quelle: 'Lehrmittel Seite __', geprueft: null },
    umkehren:          { titel: 'Mit der Umkehraufgabe kontrollieren',           quelle: 'Lehrmittel Seite __', geprueft: null },
    ueberschlag:       { titel: 'Mit einem Überschlag kontrollieren',            quelle: 'Lehrmittel Seite __', geprueft: null },
    'schriftlich-add': { titel: 'Zahlen untereinander addieren',                 quelle: 'Lehrmittel Seite __ (nur Mathwelt 2 und Zahlenbuch Ausgabe 2017)', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // Rechnen kann das Kind herleiten: zuerst abrufen, bei einem Fehler den Weg zeigen
    leiter: [{ box: 0, typ: 'eingabe' }],
    neuProTag: 5,
    maxSchwierigkeit: 3
  },

  themen: [
    { id: 'plus-100', titel: 'Plus bis 100', ziele: ['lz1'],
      generator: { name: 'mathe-plus-minus-1000/plus-100', params: {} } },
    { id: 'minus-100', titel: 'Minus bis 100', ziele: ['lz1'],
      generator: { name: 'mathe-plus-minus-1000/minus-100', params: {} } },
    { id: 'luecken-100', titel: 'Ergänzen und Umkehren bis 100', ziele: ['lz2'], voraussetzung: ['plus-100', 'minus-100'],
      leiter: [{ box: 0, typ: 'lueckentext' }],
      generator: { name: 'mathe-plus-minus-1000/luecken-100', params: {} } },

    { id: 'plus-1000', titel: 'Plus bis 1000', ziele: ['lz3'], voraussetzung: ['plus-100'],
      generator: { name: 'mathe-plus-minus-1000/plus-1000', params: {} } },
    { id: 'add-wege', titel: 'Rechenwege Plus: Lücken füllen', ziele: ['lz4'], voraussetzung: ['plus-100'],
      leiter: [{ box: 0, typ: 'lueckentext' }],
      generator: { name: 'mathe-plus-minus-1000/add-wege', params: {} } },
    { id: 'add-reihenfolge', titel: 'Rechenwege Plus: Reihenfolge', ziele: ['lz4'], voraussetzung: ['add-wege'],
      leiter: [{ box: 0, typ: 'reihenfolge' }],
      generator: { name: 'mathe-plus-minus-1000/add-reihenfolge', params: {} } },
    { id: 'add-fehler', titel: 'Rechenwege Plus: Fehler finden', ziele: ['lz7'], voraussetzung: ['add-wege'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      generator: { name: 'mathe-plus-minus-1000/add-fehler', params: {} } },

    { id: 'minus-1000', titel: 'Minus bis 1000', ziele: ['lz5'], voraussetzung: ['minus-100'],
      generator: { name: 'mathe-plus-minus-1000/minus-1000', params: {} } },
    { id: 'sub-wege', titel: 'Rechenwege Minus: Lücken füllen', ziele: ['lz6'], voraussetzung: ['minus-100'],
      leiter: [{ box: 0, typ: 'lueckentext' }],
      generator: { name: 'mathe-plus-minus-1000/sub-wege', params: {} } },
    { id: 'sub-reihenfolge', titel: 'Rechenwege Minus: Reihenfolge', ziele: ['lz6'], voraussetzung: ['sub-wege'],
      leiter: [{ box: 0, typ: 'reihenfolge' }],
      generator: { name: 'mathe-plus-minus-1000/sub-reihenfolge', params: {} } },
    { id: 'sub-fehler', titel: 'Rechenwege Minus: Fehler und Wahl', ziele: ['lz7', 'lz8'], voraussetzung: ['sub-wege'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      generator: { name: 'mathe-plus-minus-1000/sub-fehler', params: {} } },

    { id: 'schriftlich-add', titel: 'Untereinander addieren', ziele: ['lz9'], voraussetzung: ['plus-1000'],
      aktiv: false,
      geltung: 'Gilt nur für Klassen, die die schriftliche Addition schon in der 3. Klasse üben (Mathwelt 2, Zahlenbuch Ausgabe 2017). Die Lehrperson weiss, ob das bei euch so ist.',
      generator: { name: 'mathe-plus-minus-1000/schriftlich-add', params: {} } }
  ],

  tempo: {                                   // freiwillige Bestzeit-Runde. Zählt nicht für den Lernstand und bringt keinen Ertrag
    typ: 'blitzrechnen', themen: ['plus-100', 'minus-100', 'plus-1000', 'minus-1000'], anzahl: 20, nurWennStand: 'sicher'
  },

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern
    // Die Einträge bis «einer-daneben» sind Kopien aus den Katalogen _gemeinsam/fehlercodes-rechnen und _gemeinsam/fehlercodes-rechenweg, test.js vergleicht sie
    'ziffern-vertauscht': {
      kind:   'Die Ziffern sind vertauscht. Lies die Zahl noch einmal.',
      eltern: 'Flüchtigkeit, kein Wissensproblem.',
      folge:  null
    },
    'zehner-daneben': {
      kind:   'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.',
      eltern: 'Übertrag oder Zehner vergessen.',
      folge:  null
    },
    'uebergang-vergessen': {
      kind:   'Beim Übergang über den Zehner oder den Hunderter fehlt etwas. Springe zuerst bis zur vollen Zahl und rechne dann den Rest.',
      eltern: 'Der Übergang wurde nicht mitgerechnet (zum Beispiel 358 + 47 = 395 statt 405). Hilft: am Rechenstrich zuerst bis zum nächsten Zehner oder Hunderter springen lassen.',
      folge:  'braucht'
    },
    'stellen-vermischt': {
      kind:   'Zehner und Einer wurden vermischt. Zehner zählen in Zehnerschritten, Einer in Einerschritten.',
      eltern: 'Die Ziffern der zweiten Zahl wurden alle als Einer addiert (zum Beispiel 358 + 47 = 369 statt 405). Hilft: die Zahl in Hunderter, Zehner und Einer zerlegen und die Stellenwerttafel zeigen.',
      folge:  'braucht'
    },
    'teilsumme-vergessen': {
      kind:   'Eine Teilsumme fehlt. Zähle am Schluss alle Teilsummen zusammen.',
      eltern: 'Beim stellenweisen Rechnen wurde eine Teilsumme (Hunderter, Zehner oder Einer) nicht mitgezählt. Hilft: die Teilsummen untereinander aufschreiben und beim Zusammenzählen abhaken.',
      folge:  null
    },
    'kleinere-von-groesserer': {
      kind:   'In jeder Stelle wurde die kleinere von der grösseren Ziffer abgezogen. Ziehe die ganze Zahl in Schritten ab oder ergänze.',
      eltern: 'Typischer Fehler: Stelle für Stelle wird die kleinere von der grösseren Ziffer abgezogen (zum Beispiel 724 − 389 = 465 statt 335). Hilft: in Schritten abziehen (zuerst die Hunderter, dann die Zehner, dann die Einer) oder ergänzen.',
      folge:  'braucht'
    },
    'entbuendeln-vergessen': {
      kind:   'Beim Tauschen eines Zehners oder Hunderters fehlt ein Schritt: Die Stelle, von der getauscht wurde, ist danach um 1 kleiner.',
      eltern: 'Das Entbündeln wurde nur halb ausgeführt (zum Beispiel 83 − 46 = 47 statt 37). Hilft: mit der Stellenwerttafel einen Zehner in 10 Einer tauschen und die Plättchen wirklich wegnehmen.',
      folge:  'braucht'
    },
    'rechenzeichen-verwechselt': {
      kind:   'Plus und minus sind verwechselt. Lies das Rechenzeichen noch einmal.',
      eltern: 'Das Rechenzeichen wurde verwechselt, oder die Umkehraufgabe wurde in die falsche Richtung gerechnet. Meist Flüchtigkeit: das Rechenzeichen vor dem Rechnen laut lesen lassen.',
      folge:  null
    },
    'sprung-vergessen': {
      kind:   'Beim Ergänzen fehlt ein Sprung in der Summe. Zähle alle Sprünge zusammen, auch den kleinen.',
      eltern: 'Beim Ergänzen wurde ein Sprung nicht mitgezählt. Hilft: die Sprünge untereinander aufschreiben und beim Zusammenzählen abhaken.',
      folge:  null
    },
    'ausgleich-vergessen': {
      kind:   'Nach dem Runden muss der Unterschied wieder ausgeglichen werden. Frage dich: Um wie viel habe ich die Zahl verändert?',
      eltern: 'Bei der Hilfsaufgabe wurde der Unterschied nicht ausgeglichen (zum Beispiel 298 + 147 = 447, ohne die 2 abzuziehen). Hilft: laut fragen, um wie viel die Zahl verändert wurde.',
      folge:  null
    },
    'ausgleich-falsch': {
      kind:   'Der Ausgleich geht in die andere Richtung. Wurde zu viel dazugezählt, gehört der Unterschied weg, und umgekehrt.',
      eltern: 'Der Unterschied wurde mit dem falschen Rechenzeichen ausgeglichen (zum Beispiel 447 + 2 statt 447 − 2). Hilft: am Rechenstrich zeigen, ob der erste Sprung zu weit oder zu kurz war.',
      folge:  null
    },
    'einer-daneben': {
      kind:   'Das Ergebnis ist knapp daneben. Rechne den letzten Schritt noch einmal.',
      eltern: 'Kleiner Rechenfehler, meist bei den Einern. Kein Wissensproblem, solange es nur selten vorkommt.',
      folge:  null
    },
    // Die folgenden Einträge gehören nur zu diesem Modul
    'zielzahl-eingesetzt': {
      kind:   'Gesucht ist, wie viel noch fehlt, nicht die Zielzahl. Schau, wie weit der Sprung bis zur Zielzahl reicht.',
      eltern: 'Die Zielzahl wurde in die Lücke geschrieben statt des fehlenden Teils (zum Beispiel 47 + _ = 50 mit 50). Hilft: am Rechenstrich zeigen, wie weit der Sprung bis zur Zielzahl ist.',
      folge:  null
    },
    'rechenweg-nicht-nachvollzogen': {
      kind:   'Rechne jeden Schritt des Rechenwegs selbst nach und vergleiche mit der Zeile.',
      eltern: 'Ein fremder Rechenweg wurde nicht Schritt für Schritt nachgerechnet. Hilft: jede Zeile laut nachrechnen lassen und erst dann entscheiden.',
      folge:  null
    },
    'ueberschlag-falsch': {
      kind:   'Runde jede Zahl auf den nächsten ganzen Hunderter. Schau, ob sie näher beim unteren oder beim oberen Hunderter liegt.',
      eltern: 'Beim Überschlag wurde in die falsche Richtung gerundet. Hilft: eine Linie zwischen zwei Hundertern zeichnen, die Mitte markieren und die Zahl einordnen lassen.',
      folge:  null
    },
    'probe-falsch': {
      kind:   'Die Probe rechnet rückwärts: Aus plus wird minus und aus minus wird plus. Am Ende muss die erste Zahl herauskommen.',
      eltern: 'Die Umkehraufgabe wurde nicht erkannt. Hilft: fragen, was man rechnen muss, damit man wieder bei der ersten Zahl ist.',
      folge:  null
    }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['plus-100', 'minus-100', 'luecken-100', 'plus-1000', 'add-wege', 'add-reihenfolge', 'add-fehler', 'minus-1000', 'sub-wege', 'sub-reihenfolge', 'sub-fehler'],
    richtzeitMin: 30,                        // TODO: Format der Lernkontrolle, die Teile unten sind eine Annahme und kommen vom Blatt
    format: [                                // Aufbau der echten Lernkontrolle
      { thema: ['plus-100', 'minus-100'],         typ: 'eingabe',         anzahl: 6, punkte: 6 },
      { thema: ['luecken-100'],                   typ: 'lueckentext',     anzahl: 4, punkte: 4 },
      { thema: ['plus-1000'],                     typ: 'eingabe',         anzahl: 6, punkte: 6 },
      { thema: ['minus-1000'],                    typ: 'eingabe',         anzahl: 6, punkte: 6 },
      { thema: ['add-wege', 'sub-wege'],          typ: 'lueckentext',     anzahl: 4, punkte: 4 },
      { thema: ['add-reihenfolge', 'sub-reihenfolge'], typ: 'reihenfolge', anzahl: 2, punkte: 2 },
      { thema: ['add-fehler', 'sub-fehler'],      typ: 'multiple-choice', anzahl: 4, punkte: 4 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },                          // auch für «schriftlich-add» und, bis die Klasse so weit ist, für die Themen zur Subtraktion
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },          // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 },
    'tempo.themen':              { typ: 'themen' }
  },

  begleitung: [
    'Lass dein Kind den Rechenweg laut erklären: «Was rechnest du zuerst, was danach?» Nicht vorsagen, sondern nach dem nächsten Schritt fragen.',
    'Zählen mit den Fingern nicht verbieten, aber auf den Zehner zeigen: «Wie viel fehlt bis 50?» Am Rechenstrich auf Papier (ein leerer Strich, jeder Sprung beschriftet) wird der Weg sichtbar.',
    'Bei einem Fehler zuerst fragen, welcher Schritt zu den eigenen Zahlen nicht passt, und jeden Schritt einzeln nachrechnen lassen.',
    'Das Ergebnis immer kontrollieren: mit einem Überschlag (auf Hunderter runden) oder mit der Umkehraufgabe.',
    'Bei der Subtraktion beide Wege besprechen, Abziehen und Ergänzen, und fragen, bei welchen Zahlen welcher Weg bequemer ist. Frage die Lehrperson, welchen Weg die Klasse übt und ob das schriftliche Rechnen schon dran ist.'
  ]
});
