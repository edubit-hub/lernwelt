/* module/mathe-einmaleins/modul.js: Einmaleins mit Kernaufgaben-Strategie (Architektur 4.3). Reine Daten: ein einziger Aufruf,
   kein Zugriff auf Registry oder Bausteine, damit die Werkzeuge dieses Skript lesen können, bevor irgendetwas anderes geladen ist.
   Stand: Entwurf 1.1.0 nach der Recherche (docs/recherche/curriculum-map.json: mathe-einmaleins-verstehen, -ableiten, -blitz, mathe-division,
   mathe-zehner-einmaleins). Das Lehrmittel der Klasse (Zahlenbuch 3 Neuausgabe, Ausgabe 2017 oder Mathwelt 2) ist nicht belegt: Merkaufgaben (Zahlenbuch)
   und Kernaufgaben (Mathwelt) sind dieselben Aufgaben, Lesart und Sprechweise bleiben neutral. Was nur in einem Profil Kern ist (Zehner-Einmaleins,
   Teilen mit Rest), steht als eigenes Thema mit aktiv: false (R44). Lösungswege, Sprechweise und Lehrmittel sind ungeprüft (README.md, TODO). */
Lernwelt.modul({
  schema: 1,
  id: 'mathe-einmaleins',                    // stabil, nie ändern: Fortschrittsschlüssel
  version: '1.1.0',                          // 1.1.0: neue Themen und Aufgaben, die IDs der 140 Aufgaben aus 1.0.0 sind unverändert
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Einmaleins',
  fach: 'mathe',
  bereich: 'mathe.zahl',                     // Platz im Forschungsbaum der Spielwelt
  stufen: [3, 4],                            // Klassen, in denen das Modul angeboten wird
  zyklus: 2,
  lp21: ['MA.1.A.1.d', 'MA.1.A.1.e', 'MA.1.A.3.c', 'MA.1.A.3.d', 'MA.1.A.3.e', 'MA.1.A.4.d', 'MA.1.A.4.e', 'MA.1.A.4.f',
         'MA.1.B.1.d', 'MA.1.B.2.d', 'MA.1.C.1.d', 'MA.1.C.2.d'],      // Vereinigung der Codes der fünf Themen der Karte, Zuordnung je Thema in README.md
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  // lesart fehlt mit Absicht: Welche der beiden Zahlen einer Malaufgabe «Gruppen» und welche «Grösse» ist, steht in keiner Quelle der Klasse. Die Aufgaben nennen es nicht.
  sprechweise: '{a} mal {b} gleich {c}',     // Das Wort «mal» gilt in beiden Lehrmitteln, «gleich» ist ungeprüft
  dateien: ['generator.js', 'generator-verstehen.js', 'generator-ableiten.js', 'generator-teilen.js', 'generator-zehner.js'],
  braucht: ['_gemeinsam/rechnen', '_gemeinsam/luecken'],   // gemeinsame Bausteine: Fehlerarten für Zahlen, Sätze mit Zahlen in den Lücken

  lernziele: [
    { id: 'lz1',  text: 'Ich kann die Aufgaben der 2er-, 5er- und 10er-Reihe sicher abrufen.' },
    { id: 'lz2',  text: 'Ich leite schwierigere Malaufgaben aus bekannten Aufgaben ab.' },
    { id: 'lz3',  text: 'Ich löse Divisionen, indem ich die passende Malaufgabe suche.' },
    { id: 'lz4',  text: 'Ich kann eine Malaufgabe als Punktefeld und als wiederholte Addition darstellen und lesen.' },
    { id: 'lz5',  text: 'Ich nutze Tauschaufgaben, zerlege Produkte in Faktoren und beschreibe, was beim Verdoppeln und Halbieren passiert.' },
    { id: 'lz6',  text: 'Ich kann zu einer Aufgabe einen Ableitungsweg aufschreiben und den Fehler in einem fremden Weg finden.' },
    { id: 'lz7',  text: 'Ich finde zu einer Malaufgabe die beiden passenden Divisionen (Zahlenfamilie).' },
    { id: 'lz8',  text: 'Ich kann eine Division als Verteilen und als Aufteilen erzählen und mit dem Doppelpunkt schreiben.' },
    { id: 'lz9',  text: 'Ich prüfe das Ergebnis einer Division mit der Malaufgabe (Probe).' },
    { id: 'lz10', text: 'Ich nutze das kleine Einmaleins für das Zehner-Einmaleins (aus 3 · 4 folgt 3 · 40).' },
    { id: 'lz11', text: 'Ich verändere Zahlen an der Stellenwerttafel mit 10 und teile 100 und 1000 in gleich grosse Teile.' },
    { id: 'lz12', text: 'Ich erkenne, ob eine Division aufgeht oder ob etwas übrig bleibt.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt der Vater nach dem Abgleich, nie ein Agent
    kern:          { titel: 'Auswendig wissen',                          quelle: 'Lehrmittel Seite __', geprueft: null },
    kernaufgaben:  { titel: 'Mit Kernaufgaben rechnen',                  quelle: 'Lehrmittel Seite __', geprueft: null },   // Zahlenbuch: Merkaufgaben, Mathwelt: Kernaufgaben
    umkehren:      { titel: 'Teilen als Umkehrung des Malnehmens',       quelle: 'Lehrmittel Seite __', geprueft: null },
    punktefeld:    { titel: 'Punktefeld lesen und drehen',               quelle: 'Lehrmittel Seite __', geprueft: null },
    faktoren:      { titel: 'Faktoren eines Produkts finden',            quelle: 'Lehrmittel Seite __', geprueft: null },
    verdoppeln:    { titel: 'Verdoppeln und Halbieren',                  quelle: 'Lehrmittel Seite __', geprueft: null },
    nachbar:       { titel: 'Einmal mehr, einmal weniger',               quelle: 'Lehrmittel Seite __', geprueft: null },
    zahlenfamilie: { titel: 'Zahlenfamilie',                             quelle: 'Lehrmittel Seite __', geprueft: null },
    probe:         { titel: 'Probe mit der Malaufgabe',                  quelle: 'Lehrmittel Seite __', geprueft: null },
    zehner:        { titel: 'Vom kleinen zum Zehner-Einmaleins',         quelle: 'Lehrmittel Seite __', geprueft: null },
    stellen:       { titel: 'Zahlen an der Stellenwerttafel verschieben', quelle: 'Lehrmittel Seite __', geprueft: null },
    rest:          { titel: 'Verteilen mit Übrigem',                     quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // 'vortest' (zuerst abrufen) | 'erklaerung' (zuerst zeigen)
    leiter: [{ box: 0, typ: 'eingabe' }],
    optionen: {},
    neuProTag: 5,
    maxSchwierigkeit: 3                      // neue Aufgaben nur bis zu dieser Stufe (Eltern können senken)
  },

  themen: [
    // Die fünf Themen der Version 1.0.0: Reihen auswendig, ableiten, teilen. Aufgaben, IDs und Reihenfolge bleiben.
    { id: 'kern',   titel: 'Kernaufgaben 2er, 5er, 10er', ziele: ['lz1'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [2, 5, 10] } } },
    { id: 'r3-4',   titel: '3er- und 4er-Reihe',          ziele: ['lz2'], voraussetzung: ['kern'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [3, 4] } } },
    { id: 'r6-9',   titel: '6er- und 9er-Reihe',          ziele: ['lz2'], voraussetzung: ['kern'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [6, 9] } } },
    { id: 'r7-8',   titel: '7er- und 8er-Reihe',          ziele: ['lz2'], voraussetzung: ['r3-4', 'r6-9'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [7, 8] } } },
    { id: 'teilen', titel: 'Teilen als Umkehrung',        ziele: ['lz3'], voraussetzung: ['r3-4'],
      generator: { name: 'mathe-einmaleins/teilaufgaben', params: { reihen: [2, 3, 4, 5, 10] } } },

    // Neu in 1.1.0. Alle Aufgaben sind Sätze mit Zahlen in den Lücken (lueckentext mit Auswahl) oder Rechnungen. Die Themen warten auf kern, r3-4 oder teilen,
    // damit der erste Tag unverändert mit den Kernaufgaben beginnt. einfuehrung ist 'erklaerung', damit die Einstufung (AP-23) bei den fünf Rechenthemen bleibt.
    { id: 'verstehen', titel: 'Malaufgaben verstehen', ziele: ['lz4', 'lz5'], voraussetzung: ['kern'], einfuehrung: 'erklaerung',   // Karte: mathe-einmaleins-verstehen
      leiter: [{ box: 0, typ: 'lueckentext' }], generator: { name: 'mathe-einmaleins/verstehen', params: {} } },
    { id: 'ableiten',  titel: 'Aufgaben ableiten',     ziele: ['lz6'],        voraussetzung: ['r3-4'], einfuehrung: 'erklaerung',   // Karte: mathe-einmaleins-ableiten
      leiter: [{ box: 0, typ: 'lueckentext' }], generator: { name: 'mathe-einmaleins/ableitwege', params: {} } },
    { id: 'familie',   titel: 'Zahlenfamilien und Probe', ziele: ['lz7', 'lz9'], voraussetzung: ['teilen'], einfuehrung: 'erklaerung',   // Karte: mathe-einmaleins-blitz (auch umgekehrt), mathe-division (Probe)
      leiter: [{ box: 0, typ: 'lueckentext' }], generator: { name: 'mathe-einmaleins/zahlenfamilie', params: {} } },
    { id: 'verteilen', titel: 'Verteilen und Aufteilen', ziele: ['lz8'],      voraussetzung: ['kern'], einfuehrung: 'erklaerung',   // Karte: mathe-division
      leiter: [{ box: 0, typ: 'lueckentext' }], generator: { name: 'mathe-einmaleins/verteilen', params: {} } },

    // Nur in einem Lehrmittelprofil Kern (R44): standardmässig aus, die Eltern schalten die Themen ein (anpassbar: themen.*.aktiv).
    { id: 'zehner',    titel: 'Zehner-Einmaleins',     ziele: ['lz10', 'lz11'], voraussetzung: ['r7-8'], einfuehrung: 'erklaerung', aktiv: false,   // Karte: mathe-zehner-einmaleins
      geltung: 'Im Zahlenbuch 3 (Neuausgabe) kommt das Zehner-Einmaleins im Block Multiplikation und Division, etwa ab März 2027. Andere Lehrmittel ordnen es anders: Die Lehrperson sagt, wann es dran ist.',
      leiter: [{ box: 0, typ: 'karteikarten' }, { box: 1, typ: 'multiple-choice' }, { box: 2, typ: 'eingabe' }],
      generator: { name: 'mathe-einmaleins/zehner', params: {} } },
    // TODO: Teilen mit Rest. Schreib- und Sprechweise («17 : 5 = 3 Rest 2») sind für kein Lehrmittel belegt (R44). Das Thema zeigt keine Schreibweise,
    // es lässt nur erkennen, ob eine Teilaufgabe aufgeht. Es bleibt aus, bis die Lehrperson sagt, wie die Klasse es führt.
    { id: 'rest',      titel: 'Teilen mit Rest erkennen', ziele: ['lz12'],    voraussetzung: ['teilen'], einfuehrung: 'erklaerung', aktiv: false,   // Karte: mathe-division (Rest erkennen)
      geltung: 'Schreib- und Sprechweise der Division mit Rest sind für das Lehrmittel der Klasse nicht belegt. Das Thema zeigt keine Schreibweise und bleibt aus, bis die Lehrperson sagt, wie die Klasse es führt.',
      leiter: [{ box: 0, typ: 'lueckentext' }], generator: { name: 'mathe-einmaleins/rest', params: {} } }
  ],

  tempo: {                                   // freiwillige Bestzeit-Runde. Zählt nicht für den Lernstand und bringt keinen Ertrag
    typ: 'blitzrechnen', themen: ['kern', 'r3-4', 'r6-9', 'r7-8', 'teilen'], anzahl: 20, nurWennStand: 'sicher'
  },

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern
    'eine-gruppe-daneben': {
      kind:   'Eine Gruppe zu viel oder zu wenig. Zähle die Zeilen im Punktefeld.',
      eltern: 'Verwechselt Nachbaraufgaben (zum Beispiel 6 · 8 und 7 · 8). Hilft: von der Kernaufgabe 5 · 8 aus um eine Gruppe weiterzählen.',
      folge:  'braucht'                      // Kernaufgaben dieser Aufgabe heute noch einmal prüfen
    },
    'ableiten-vorzeichen': {
      kind:   'Bei der 8er- und 9er-Aufgabe wird von der 10er-Aufgabe abgezogen, nicht addiert.',
      eltern: 'Addiert statt zu subtrahieren. Das Punktefeld mit durchgestrichenen Zeilen zeigen.',
      folge:  'braucht'
    },
    // Die beiden folgenden Einträge sind Kopien aus _gemeinsam/fehlercodes-rechnen, test.js vergleicht sie mit dem Katalog
    'ziffern-vertauscht': { kind: 'Die Ziffern sind vertauscht. Lies die Zahl noch einmal.', eltern: 'Flüchtigkeit, kein Wissensproblem.', folge: null },
    'zehner-daneben':     { kind: 'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.', eltern: 'Übertrag oder Zehner vergessen.', folge: null },
    'mal-plus-verwechselt': {
      kind:   'Hier wird malgenommen, nicht zusammengezählt. Schau dir die gleich langen Zeilen im Punktefeld an.',
      eltern: 'Plus und Mal verwechselt (3 · 4 als 7). Das Punktefeld zeichnen lassen und die Zeilen zählen. Hilft: erst als wiederholte Addition aufschreiben (4 + 4 + 4), dann als Malaufgabe.',
      folge:  null
    },
    'ableiten-falsche-zahl': {
      kind:   'Beim Ableiten kommt die ganze Teilaufgabe dazu oder fällt weg, nicht nur eine Zahl. Rechne die Teilaufgabe zuerst aus.',
      eltern: 'Beim Ableiten wird die falsche Zahl gerechnet (statt + 8 wird + 5 gerechnet). Am Punktefeld zeigen, dass eine ganze Zeile mit je 8 Punkten dazukommt.',
      folge:  null
    },
    'teilen-minus-verwechselt': {
      kind:   'Hier wurde abgezogen. Beim Teilen fragst du, wie oft eine Zahl in die andere passt. Suche die passende Malaufgabe.',
      eltern: 'Teilen und Minus verwechselt (28 : 7 als 21). Fragen: Welche Zahl mal 7 ergibt 28? Die Umkehraufgabe 4 · 7 = 28 zeigen.',
      folge:  'braucht'
    },
    'teilen-mal-verwechselt': {
      kind:   'Hier wurde malgenommen. Beim Teilen suchst du die Zahl, die mit der zweiten Zahl malgenommen die erste ergibt.',
      eltern: 'Mal und Teilen verwechselt (28 : 7 als 196). Das Zeichen vorlesen lassen («28 durch 7») und die passende Malaufgabe suchen.',
      folge:  null
    },
    'teiler-genannt': {
      kind:   'Das ist schon eine Zahl der Aufgabe. Gesucht ist, wie oft sie in die andere passt. Suche die passende Malaufgabe.',
      eltern: 'Nennt eine der beiden Zahlen der Aufgabe (28 : 7 als 7). Fragen: Welche Malaufgabe gehört dazu? Auf die Zahlenfamilie zurückführen.',
      folge:  'braucht'
    },
    'stellenwert-verschoben': {
      kind:   'Die Zahl ist zehnmal zu gross oder zehnmal zu klein. Überlege, wie viele Zehner es sind.',
      eltern: 'Stellenwert verschoben (3 · 40 als 12 oder 1200). An der Stellenwerttafel zeigen, dass aus 12 Zehnern ein Hunderter und zwei Zehner werden. Nicht mit «Nullen anhängen» erklären, solange die Lehrperson das nicht so eingeführt hat.',
      folge:  null
    },
    'uebrig-zu-gross': {
      kind:   'So viele können nicht übrig bleiben: Sonst bekäme jedes Kind noch einen mehr. Es bleibt weniger übrig, als Kinder da sind.',
      eltern: 'Es bleiben so viele übrig wie Teiler oder mehr. Noch einmal verteilen lassen: Reicht es für eine weitere Runde? Solange das so ist, ist noch nicht fertig verteilt.',
      folge:  null
    }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 30,                        // TODO: Format der Lernkontrolle, die Teile unten sind eine Annahme und kommen vom Blatt
    format: [                                // Aufbau der echten Lernkontrolle, abgeleitet aus den Prüfungsaufgaben der Karte (nicht belegt)
      { thema: ['kern'],                 typ: 'eingabe', anzahl: 10, punkte: 10 },
      { thema: ['r3-4', 'r6-9', 'r7-8'], typ: 'eingabe', anzahl: 20, punkte: 20 },
      { thema: ['teilen'],               typ: 'eingabe', anzahl: 10, punkte: 10 },
      { thema: ['verstehen'],            typ: 'lueckentext', anzahl: 4, punkte: 4 },
      { thema: ['ableiten'],             typ: 'lueckentext', anzahl: 4, punkte: 4 },
      { thema: ['familie', 'verteilen'], typ: 'lueckentext', anzahl: 4, punkte: 4 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },                      // auch für «zehner» und «rest», die standardmässig aus sind
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },     // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 },
    'tempo.themen':              { typ: 'themen' }
  },

  begleitung: [
    'Lieber täglich 10 Minuten als einmal pro Woche eine Stunde.',
    'Nicht vorsagen. Wenn eine Aufgabe nicht klappt: auf die Kernaufgabe zeigen (5 · 8) und fragen, was fehlt.',
    'Sprechweise und Lösungsweg wie im Lehrmittel verwenden, keine eigenen Tricks einführen.',
    'Beim Ableiten fragen: Welche Aufgabe kennst du schon? Das Kind sagt den Weg in einem ganzen Satz, zum Beispiel: Ich rechne 5 mal 8 und noch 2 mal 8.',
    'Das Punktefeld hilft bei fast jedem Fehler. Zeichnen lassen, nicht fertig hinlegen.',
    'Beim Teilen zuerst die Malaufgabe suchen: Welche Zahl mal 7 ergibt 28? Dann die Probe mit der Malaufgabe machen.',
    'Tischspiele mit Würfeln, Karten oder Eierkartons ergänzen die App. Sie ersetzen sie nicht.',
    'Das Zehner-Einmaleins und das Teilen mit Rest sind ausgeschaltet. Einschalten erst, wenn die Klasse das Thema hat. Das Zehner-Einmaleins über Zehner erklären (4 Zehner mal 3 sind 12 Zehner), nicht über Nullen.'
  ]
});
