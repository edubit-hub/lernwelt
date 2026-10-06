/* module/mathe-zahlraum-1000/modul.js: Zahlen bis 1000 (Stellenwerte, Zahlwörter, Nachbarzahlen, Zählen in Schritten, Zahlenstrahl, Ordnen,
   Vergleichen, Ergänzen, Verdoppeln und Halbieren). Reine Daten: ein einziger Aufruf, kein Zugriff auf Registry oder Bausteine.
   Alle Themen kommen aus Generatoren mit Aufgabenfamilien: Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen.
   Stand: Entwurf. Lehrmittel, Schreibweise (H, Z, E), Lehrplan-Codes, Prüfungsformat und alle Lösungswege sind ungeprüft (README.md, TODO). */
Lernwelt.modul({
  schema: 1,
  id: 'mathe-zahlraum-1000',                 // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Zahlen bis 1000',
  fach: 'mathe',
  bereich: 'mathe.zahl',                     // Platz im Forschungsbaum der Spielwelt
  stufen: [3],
  zyklus: 2,
  lp21: ['MA.1.A.1.e', 'MA.1.A.2.e', 'MA.1.A.3.c', 'MA.1.A.4.f', 'MA.1.B.3.c', 'MA.1.C.1.c', 'MA.1.C.2.e'],   // aus der Karte, vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  dateien: ['fam-stellenwert.js', 'fam-zahlwoerter.js', 'fam-lage.js', 'fam-ordnen.js', 'fam-folgen.js', 'fam-rechnen.js', 'fam-erweitert.js'],
  braucht: ['_gemeinsam/zahlen', '_gemeinsam/familien'],   // gemeinsame Bausteine: Zahlen zerlegen und benennen, Gerüst für Aufgabenfamilien

  lernziele: [
    { id: 'lz1',  text: 'Ich lese und schreibe Zahlen bis 1000, auch wenn sie als Zahlwort dastehen.' },
    { id: 'lz2',  text: 'Ich weiss, was Einer, Zehner und Hunderter bedeuten, und setze Zahlen aus H, Z und E zusammen.' },
    { id: 'lz3',  text: 'Ich bündle und entbündle: 10 Einer sind 1 Zehner, 10 Zehner sind 1 Hunderter.' },
    { id: 'lz4',  text: 'Ich zähle in Schritten vorwärts und rückwärts, auch über die Hunderter hinweg.' },
    { id: 'lz5',  text: 'Ich nenne Vorgänger, Nachfolger, Nachbarzehner und Nachbarhunderter einer Zahl.' },
    { id: 'lz6',  text: 'Ich finde Zahlen am Zahlenstrahl und setze sie dorthin.' },
    { id: 'lz7',  text: 'Ich ordne Zahlen der Grösse nach und setze die Zeichen <, > und =.' },
    { id: 'lz8',  text: 'Ich ergänze Zahlen auf 100 und auf 1000.' },
    { id: 'lz9',  text: 'Ich verdopple und halbiere Zahlen im Hunderter- und im Tausenderraum.' },
    { id: 'lz10', text: 'Ich lese und schreibe Zahlen über 1000 mit Tausendern.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt der Vater nach dem Abgleich, nie ein Agent
    stellen:           { titel: 'Zahl aus Hundertern, Zehnern und Einern zusammensetzen', quelle: 'Lehrmittel Seite __', geprueft: null },
    buendeln:          { titel: 'Bündeln und Entbündeln',                                  quelle: 'Lehrmittel Seite __', geprueft: null },
    zahlwort:          { titel: 'Zahlwort Stück für Stück in Ziffern übersetzen',          quelle: 'Lehrmittel Seite __', geprueft: null },
    nachbarn:          { titel: 'Nachbarzahlen, Nachbarzehner und Nachbarhunderter',        quelle: 'Lehrmittel Seite __', geprueft: null },
    strahl:            { titel: 'Zahlenstrahl: den Skalenwert lesen, Striche nicht zählen', quelle: 'Lehrmittel Seite __', geprueft: null },
    ordnen:            { titel: 'Zahlen ordnen und vergleichen, Stelle für Stelle',         quelle: 'Lehrmittel Seite __', geprueft: null },
    folgen:            { titel: 'Zahlenfolgen: die Schrittweite erkennen',                  quelle: 'Lehrmittel Seite __', geprueft: null },
    ergaenzen:         { titel: 'Ergänzen über volle Zehner und Hunderter',                 quelle: 'Lehrmittel Seite __', geprueft: null },
    verdoppeln:        { titel: 'Verdoppeln und Halbieren nach Stellenwerten',              quelle: 'Lehrmittel Seite __', geprueft: null },
    'stellen-tausend': { titel: 'Zahlen mit Tausendern zusammensetzen',                     quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // Rechnen und Ordnen kann das Kind herleiten: zuerst abrufen, bei einem Fehler den Weg zeigen
    leiter: [{ box: 0, typ: 'eingabe' }],
    optionen: {},
    neuProTag: 5,
    maxSchwierigkeit: 3
  },

  themen: [
    { id: 'stellenwert', titel: 'Hunderter, Zehner, Einer', ziele: ['lz2', 'lz3'],
      generator: { name: 'mathe-zahlraum-1000/stellenwert', params: {} } },
    { id: 'zahlwoerter', titel: 'Zahlwörter und Ziffern', ziele: ['lz1'], voraussetzung: ['stellenwert'],
      generator: { name: 'mathe-zahlraum-1000/zahlwoerter', params: {} } },
    { id: 'nachbarn', titel: 'Nachbarzahlen, Nachbarzehner, Nachbarhunderter', ziele: ['lz5'],
      generator: { name: 'mathe-zahlraum-1000/nachbarn', params: {} } },
    { id: 'zahlenfolgen', titel: 'Zählen in Schritten', ziele: ['lz4'], leiter: [{ box: 0, typ: 'lueckentext' }],
      generator: { name: 'mathe-zahlraum-1000/zahlenfolgen', params: {} } },
    { id: 'zahlenstrahl', titel: 'Zahlen am Zahlenstrahl', ziele: ['lz6'], leiter: [{ box: 0, typ: 'zahlenstrahl' }],
      generator: { name: 'mathe-zahlraum-1000/zahlenstrahl', params: {} } },
    { id: 'ordnen', titel: 'Zahlen ordnen', ziele: ['lz7'], leiter: [{ box: 0, typ: 'reihenfolge' }],
      generator: { name: 'mathe-zahlraum-1000/ordnen', params: {} } },
    { id: 'vergleichen', titel: 'Zahlen vergleichen', ziele: ['lz7'], voraussetzung: ['ordnen'], leiter: [{ box: 0, typ: 'multiple-choice' }], optionen: { anzahl: 3 },
      generator: { name: 'mathe-zahlraum-1000/vergleichen', params: {} } },
    { id: 'ergaenzen', titel: 'Ergänzen auf 100 und 1000', ziele: ['lz8'],
      generator: { name: 'mathe-zahlraum-1000/ergaenzen', params: {} } },
    { id: 'verdoppeln-halbieren', titel: 'Verdoppeln und Halbieren', ziele: ['lz9'],
      generator: { name: 'mathe-zahlraum-1000/verdoppeln-halbieren', params: {} } },
    { id: 'erweitert-1000', titel: 'Zahlen über 1000', ziele: ['lz10'], voraussetzung: ['stellenwert', 'nachbarn'], aktiv: false,
      geltung: 'Zahlen über 1000 gehören zu den erweiterten Anforderungen und kommen nur in manchen Klassen und Lehrmitteln schon in diesem Block vor. Ob das Kind sie braucht, sagt die Lehrperson.',
      generator: { name: 'mathe-zahlraum-1000/erweitert-1000', params: {} } }
  ],

  tempo: {                                   // freiwillige Bestzeit-Runde. Zählt nicht für den Lernstand und bringt keinen Ertrag
    typ: 'blitzrechnen', themen: ['nachbarn', 'ergaenzen', 'verdoppeln-halbieren'], anzahl: 15, nurWennStand: 'sicher'
  },

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern
    'zehner-einer-vertauscht': { kind: 'Zehner und Einer sind vertauscht. Schreibe zuerst den Zehner, dann den Einer.', eltern: 'Die gesprochene Reihenfolge (Einer vor Zehner, zum Beispiel «vierundfünfzig») führt zum Dreher. Das Kind sagt laut «Hunderter, Zehner, Einer» und schreibt in dieser Reihenfolge.', folge: null },
    'null-vergessen': { kind: 'Eine Stelle ist leer. Dort steht eine 0, damit die anderen Ziffern am richtigen Platz bleiben.', eltern: 'Die Null als Platzhalter fehlt (zum Beispiel 57 statt 507). In der Stellenwerttafel zeigen: Die leere Spalte bekommt eine 0.', folge: null },
    'buendeln-vergessen': { kind: 'In einer Stelle sind mehr als 9. 10 Zehner sind 1 Hunderter, 10 Einer sind 1 Zehner. Rechne zuerst den Wert jeder Stelle aus.', eltern: 'Das Kind schreibt die Anzahlen nebeneinander (2 H, 13 Z, 4 E als 2134), statt die Werte zu addieren. Hilft: den Wert jeder Stelle einzeln ausrechnen und dann zusammenzählen.', folge: null },
    'stelle-verwechselt': { kind: 'Das gehört zu einer anderen Stelle. Lies noch einmal, nach welcher Stelle gefragt ist.', eltern: 'Hunderter, Zehner und Einer werden verwechselt. In der Stellenwerttafel die Spalte H, Z oder E mit dem Finger zeigen.', folge: null },
    'ziffer-statt-wert': { kind: 'Du hast eine einzelne Ziffer genannt. Gefragt ist der Wert oder die Anzahl.', eltern: 'Ziffer und Wert werden gleichgesetzt: Die 7 in 372 steht für 70. Mit Zehnerstangen legen: 7 Stangen sind 70.', folge: null },
    'wert-statt-anzahl': { kind: 'Du hast den Wert der Zahl genannt. Gefragt ist, wie viele Zehner oder Hunderter es sind.', eltern: 'Wert und Anzahl werden verwechselt: 6 Hunderter sind 600, aber auch 60 Zehner. Mit Material bündeln und entbündeln lassen.', folge: null },
    'hunderter-weg': { kind: 'Die Hunderter fehlen. Das Zahlwort beginnt mit den Hundertern.', eltern: 'Das Kind schreibt nur den Rest hin (54 statt 354). Das Zahlwort in Teile schneiden: zuerst die Hunderter, dann der Rest.', folge: null },
    'nachbar-andere-seite': { kind: 'Das ist der Nachbar auf der anderen Seite. Lies noch einmal, ob unter oder über gefragt ist.', eltern: 'Unten und oben werden verwechselt. Am Zahlenstrahl zeigen: Der Nachbar unter der Zahl liegt links, der Nachbar darüber rechts.', folge: null },
    'hunderter-uebergang': { kind: 'Beim Wechsel zum nächsten Hunderter ändert sich auch die Hunderterziffer. Achte darauf, wenn du über 100, 200, 300 und so weiter zählst.', eltern: 'Fehler am Hunderterübergang (nach 399 folgt 400, nicht 300). Mit dem Zahlenstrahl über die Marke zählen und laut sprechen.', folge: null },
    'strahl-gespiegelt': { kind: 'Die Marke steht auf der anderen Seite. Links liegen die kleineren Zahlen, rechts die grösseren.', eltern: 'Links und rechts werden verwechselt. Die beschrifteten Striche an den Enden zeigen die Richtung.', folge: null },
    'strahl-ein-strich': { kind: 'Die Marke ist einen Strich daneben. Lies die Zahl unter den langen Strichen und zähle die Striche nicht einzeln.', eltern: 'Knapp daneben, oft durch Striche zählen statt den Skalenwert zu lesen. Von der nächsten beschrifteten Marke aus Schritt für Schritt rechnen.', folge: null },
    'richtung-verdreht': { kind: 'Die Reihenfolge ist umgekehrt. Prüfe, ob die kleinste oder die grösste Zahl zuerst kommt.', eltern: 'Auf- und absteigend werden verwechselt. Die Aufgabe laut vorlesen lassen: «von der kleinsten zur grössten».', folge: null },
    'zeichen-verdreht': { kind: 'Die Öffnung des Zeichens zeigt zur grösseren Zahl, die Spitze zur kleineren.', eltern: 'Kleiner und grösser werden verwechselt. Beide Zahlen zuerst bei den Hundertern vergleichen und erst dann das Zeichen wählen.', folge: null },
    'gleich-gesetzt': { kind: 'Die beiden Zahlen sind nicht gleich. Vergleiche zuerst die Hunderter.', eltern: 'Das Kind setzt «gleich», obwohl sich die Zahlen unterscheiden, oft bei gleichen Ziffern in anderer Reihenfolge. Stelle für Stelle von links vergleichen.', folge: null },
    'ungleich-gesetzt': { kind: 'Beide Seiten sind gleich gross. Schreibe jede Seite als Zahl und vergleiche dann.', eltern: 'Das Kind erkennt die Gleichheit nicht, wenn eine Seite zerlegt oder in Zehnern angegeben ist. Beide Seiten als Zahl schreiben lassen.', folge: null },
    'schritt-falsch': { kind: 'Die Schrittweite stimmt nicht. Schau, um wie viel die ersten beiden Zahlen auseinanderliegen.', eltern: 'Das Kind zählt in anderen Schritten weiter (zum Beispiel 1 statt 10). Die Schrittweite aus den ersten beiden Zahlen bestimmen lassen.', folge: null },
    'hunderter-daneben': { kind: 'Es ist genau ein Hunderter zu viel oder zu wenig. Rechne die Hunderter und den Rest noch einmal getrennt.', eltern: 'Die Hunderter sind um eins verrechnet, zum Beispiel beim Ergänzen (650 auf 1000 mit 450 statt 350) oder beim Verdoppeln und Halbieren. Über den nächsten vollen Hunderter rechnen lassen, die Hunderter und den Rest getrennt.', folge: null },
    // Kopie aus _gemeinsam/fehlercodes-rechnen, test.js vergleicht sie mit dem Katalog
    'zehner-daneben': { kind: 'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.', eltern: 'Übertrag oder Zehner vergessen.', folge: null },
    'ziel-statt-ergaenzung': { kind: 'Du hast eine Zahl aus der Aufgabe genannt. Gefragt ist, wie viel fehlt.', eltern: 'Das Kind nennt Start oder Ziel statt der Ergänzung. Fragen: «Wie viel fehlt noch bis zum Ziel?»', folge: null },
    'doppelt-halb-verwechselt': { kind: 'Du hast das Gegenteil gerechnet. Doppeltes heisst mal 2, Hälfte heisst durch 2.', eltern: 'Verdoppeln und Halbieren werden verwechselt. Mit Material zeigen: doppelt sind zwei gleiche Haufen, die Hälfte ist ein Haufen von zwei gleichen.', folge: null },
    'stellenwert-fehler': { kind: 'Die Zahl hat die falsche Grösse, zum Beispiel 15 statt 150. Überlege, wie viele Hunderter und Zehner es sind.', eltern: 'Stellenwertfehler beim Halbieren oder Verdoppeln (300 halbiert ergibt 15). Mit Hundertern rechnen: Die Hälfte von 3 Hundertern ist 150.', folge: null },
    'tausender-fehlt': { kind: 'Die Tausender fehlen. Schreibe zuerst die Tausender, dann den Rest.', eltern: 'Beim Übergang über 1000 fehlt die Tausenderstelle (50 statt 1050). Die Zahl in T, H, Z und E zerlegen.', folge: null }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 30,                        // TODO: Format der Lernkontrolle, die Teile unten sind abgeleitet (curriculum-map, lzk3_probeprofil) und kommen vom Blatt
    format: [                                // Aufbau der echten Lernkontrolle, in der Reihenfolge des abgeleiteten Probeprofils
      { thema: ['zahlenstrahl'],          typ: 'zahlenstrahl',    anzahl: 4, punkte: 4 },
      { thema: ['nachbarn'],              typ: 'eingabe',         anzahl: 6, punkte: 6 },
      { thema: ['stellenwert'],           typ: 'eingabe',         anzahl: 6, punkte: 6 },
      { thema: ['zahlwoerter'],           typ: 'eingabe',         anzahl: 3, punkte: 3 },
      { thema: ['zahlenfolgen'],          typ: 'lueckentext',     anzahl: 3, punkte: 3 },
      { thema: ['ergaenzen'],             typ: 'eingabe',         anzahl: 5, punkte: 5 },
      { thema: ['verdoppeln-halbieren'],  typ: 'eingabe',         anzahl: 5, punkte: 5 },
      { thema: ['ordnen'],                typ: 'reihenfolge',     anzahl: 3, punkte: 3 },
      { thema: ['vergleichen'],           typ: 'multiple-choice', anzahl: 4, punkte: 4 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },     // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 },
    'tempo.themen':              { typ: 'themen' }
  },

  begleitung: [
    'Neue Zahlen zuerst mit echtem Material legen: Zehnerstangen, Hunderterplatten oder gebündelte Stäbchen. Die App übt, sie führt nichts neu ein.',
    'Am Zahlenstrahl die Striche nicht zählen lassen. Das Kind liest die Zahlen unter den langen Strichen vor und sagt, zwischen welchen beiden Zahlen seine Zahl liegt.',
    'Bei Zahlwörtern laut sprechen und die Zahl in Hunderter, Zehner und Einer zerlegen. Bei «vierundfünfzig» hört man den Einer zuerst, geschrieben steht der Zehner vorn.',
    'Fragen statt vorsagen: «Wie viele Hunderter sind es? Und wie viele Zehner?»',
    'Wörter und Schreibweise wie in der Schule verwenden. Wenn das Lehrmittel andere Bezeichnungen nutzt als H, Z, E oder Nachbarzehner, gilt die Sprechweise der Lehrperson.',
    'Der Raum über 1000 ist ausgeschaltet. Ob er in der Klasse schon dran ist, sagt die Lehrperson.'
  ]
});
