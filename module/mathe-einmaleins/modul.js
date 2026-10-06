/* module/mathe-einmaleins/modul.js: Einmaleins mit Kernaufgaben-Strategie (Architektur 4.3). Reine Daten: ein einziger Aufruf,
   kein Zugriff auf Registry oder Bausteine, damit die Werkzeuge dieses Skript lesen können, bevor irgendetwas anderes geladen ist.
   Stand: Entwurf. Lehrmittel, Lesart, Sprechweise, Lehrplan-Codes, Prüfungsformat und alle Lösungswege sind ungeprüft (README.md, TODO). */
Lernwelt.modul({
  schema: 1,
  id: 'mathe-einmaleins',                    // stabil, nie ändern: Fortschrittsschlüssel
  version: '1.0.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Einmaleins',
  fach: 'mathe',
  bereich: 'mathe.zahl',                     // Platz im Forschungsbaum der Spielwelt
  stufen: [3, 4],                            // Klassen, in denen das Modul angeboten wird
  zyklus: 2,
  lp21: ['MA.1.A.2'],                        // Beispielwert, vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  lesart: 'anzahl-mal-groesse',              // 7 · 8 = «7 mal die 8». Ungeprüft, vor Freigabe gegen das Lehrmittel abgleichen
  sprechweise: '{a} mal {b} gleich {c}',     // Ungeprüft, vor Freigabe gegen das Lehrmittel abgleichen
  dateien: ['generator.js'],
  braucht: ['_gemeinsam/rechnen'],           // gemeinsamer Baustein (Fehlerarten für Zahlen)

  lernziele: [
    { id: 'lz1', text: 'Ich kenne die Aufgaben der 2er-, 5er- und 10er-Reihe auswendig.' },
    { id: 'lz2', text: 'Ich leite schwierigere Malaufgaben aus Kernaufgaben ab.' },
    { id: 'lz3', text: 'Ich löse Teilaufgaben, indem ich die passende Malaufgabe suche.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt Stefan nach dem Abgleich, nie ein Agent
    kern:         { titel: 'Auswendig wissen',                    quelle: 'Lehrmittel Seite __', geprueft: null },
    kernaufgaben: { titel: 'Mit Kernaufgaben rechnen',            quelle: 'Lehrmittel Seite __', geprueft: null },
    umkehren:     { titel: 'Teilen als Umkehrung des Malnehmens', quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // 'vortest' (zuerst abrufen) | 'erklaerung' (zuerst zeigen)
    leiter: [{ box: 0, typ: 'eingabe' }],
    optionen: {},
    neuProTag: 5,
    maxSchwierigkeit: 3                      // neue Aufgaben nur bis zu dieser Stufe (Eltern können senken)
  },

  themen: [
    { id: 'kern',   titel: 'Kernaufgaben 2er, 5er, 10er', ziele: ['lz1'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [2, 5, 10] } } },
    { id: 'r3-4',   titel: '3er- und 4er-Reihe',          ziele: ['lz2'], voraussetzung: ['kern'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [3, 4] } } },
    { id: 'r6-9',   titel: '6er- und 9er-Reihe',          ziele: ['lz2'], voraussetzung: ['kern'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [6, 9] } } },
    { id: 'r7-8',   titel: '7er- und 8er-Reihe',          ziele: ['lz2'], voraussetzung: ['r3-4', 'r6-9'],
      generator: { name: 'mathe-einmaleins/malaufgaben', params: { reihen: [7, 8] } } },
    { id: 'teilen', titel: 'Teilen als Umkehrung',        ziele: ['lz3'], voraussetzung: ['r3-4'],
      generator: { name: 'mathe-einmaleins/teilaufgaben', params: { reihen: [2, 3, 4, 5, 10] } } }
  ],

  tempo: {                                   // freiwillige Bestzeit-Runde. Zählt nicht für den Lernstand und bringt keinen Ertrag
    typ: 'blitzrechnen', themen: ['kern', 'r3-4', 'r6-9', 'r7-8'], anzahl: 20, nurWennStand: 'sicher'
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
    'zehner-daneben':     { kind: 'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.', eltern: 'Übertrag oder Zehner vergessen.', folge: null }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 30,                        // TODO: Format der Lernkontrolle, die Teile unten sind eine Annahme und kommen vom Blatt
    format: [                                // Aufbau der echten Lernkontrolle
      { thema: ['kern'],                 typ: 'eingabe', anzahl: 10, punkte: 10 },
      { thema: ['r3-4', 'r6-9', 'r7-8'], typ: 'eingabe', anzahl: 20, punkte: 20 },
      { thema: ['teilen'],               typ: 'eingabe', anzahl: 10, punkte: 10 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },     // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 },
    'tempo.themen':              { typ: 'themen' }
  },

  begleitung: [
    'Lieber täglich 10 Minuten als einmal pro Woche eine Stunde.',
    'Nicht vorsagen. Wenn eine Aufgabe nicht klappt: auf die Kernaufgabe zeigen (5 · 8) und fragen, was fehlt.',
    'Sprechweise und Lösungsweg wie im Lehrmittel verwenden, keine eigenen Tricks einführen.'
  ]
});
