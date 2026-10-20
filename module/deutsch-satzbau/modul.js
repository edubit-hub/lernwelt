/* module/deutsch-satzbau/modul.js: Satzbau (Deutsch, 3. Klasse): Satzglieder (Wer, Verb, Wann, Wo) den Fragen zuordnen, Sätze zusammensetzen und umstellen, das Verb an
   zweiter Stelle, Satzanfang und Nomen gross, Punkt am Schluss. Angelegt am 19.10.2026 nach dem Lernzielblatt der Prüfung «Satzbau» mit `tools\lw neu modul`.
   Reine Daten: ein einziger Aufruf, kein Zugriff auf Registry oder Bausteine. Die Aufgaben kommen aus den Generatoren in den Dateien gen-*.js, alle Sätze liegen in
   saetze.js. Stand: Entwurf. Lehrmittel, Lehrplan-Codes, Prüfungsformat und alle Lösungswege sind ungeprüft (README.md, TODO). Alles Inhaltliche ist eigene Formulierung. */
Lernwelt.modul({
  schema: 1,
  id: 'deutsch-satzbau',                     // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Satzbau: Satzglieder und Verb an zweiter Stelle',
  fach: 'deutsch',
  bereich: 'deutsch.sprache',                // wie deutsch-wortarten: die Module zählen zusammen, der Forschungsknoten «Sprachkunde» hängt an diesem Namen
  stufen: [3],
  zyklus: 2,
  lp21: ['D.5.C.1', 'D.5.C.2'],              // Beispielwerte (wie deutsch-wortarten, Grammatik), vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: 'Satzbau' },
  dateien: ['saetze.js', 'gen-fragen.js', 'gen-erkennen.js', 'gen-bauen.js', 'gen-schreiben.js'],     // saetze.js zuerst: Alle Generatoren lesen die Satzbank
  braucht: ['_gemeinsam/schreibantwort'],    // gemeinsamer Baustein für die Antworten des Lückentexts

  lernziele: [                               // wörtlich vom Lernzielblatt vom 19.10.2026 (abgetippt)
    { id: 'lz1', text: 'Ich kann Satzglieder den passenden Fragen zuordnen: Wer? Verb? Wann? Wo?' },
    { id: 'lz2', text: 'Ich kann vorgegebene Satzteile zu einem sinnvollen Satz zusammensetzen und das Verb an die zweite Stelle setzen.' },
    { id: 'lz3', text: 'Ich kann Satzglieder umstellen.' },
    { id: 'lz4', text: 'Ich kann die Satzglieder in einem Satz erkennen und einzeln benennen.' },
    { id: 'lz5', text: 'Ich kann Satzanfänge und Nomen grossschreiben und am Satzende einen Punkt setzen.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt der Vater nach dem Abgleich, nie ein Agent
    'fragen-stellen': { titel: 'Fragen stellen: Wer? Was tut? Wann? Wo?',                      quelle: 'Lehrmittel Seite __', geprueft: null },
    verbprobe:        { titel: 'Verbprobe: Das Verb steht an zweiter Stelle',                  quelle: 'Lehrmittel Seite __', geprueft: null },
    umstellprobe:     { titel: 'Umstellprobe: Was zusammen wandert, ist ein Satzglied',        quelle: 'Lehrmittel Seite __', geprueft: null },
    artikelprobe:     { titel: 'Artikelprobe: Nomen erkennen (der, die oder das davor)',       quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // die Aufgabe wird zuerst abgerufen, der Lösungsweg erklärt nach einem Fehler
    leiter: [{ box: 0, typ: 'multiple-choice' }],
    optionen: {},
    neuProTag: 6,                            // die Prüfung ist in dieser Woche: mehr neue Aufgaben je Tag als sonst (Eltern können senken)
    maxSchwierigkeit: 3
  },

  themen: [
    // Lernziel 1: Satzglieder den Fragen zuordnen. Erst Zuordnen (Satzteil ohne Satz), dann die Frage im ganzen Satz.
    { id: 'fragen', titel: 'Welche Frage passt?', ziele: ['lz1'], einfuehrung: 'erklaerung',
      generator: { name: 'deutsch-satzbau/fragen' },
      frage: 'Welche Frage passt zu diesem Satzteil?',
      leiter: [{ box: 0, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      leiterRatenVerzicht: 'Vier Felder und Gruppen von drei bis sechs Karten: Die Chance, alle zu erraten, ist klein. Die Rückmeldung zeigt jede falsche Karte mit der richtigen Frage, die Fragen im Satz im nächsten Thema prüfen dasselbe noch einmal.' },
    { id: 'fragen-im-satz', titel: 'Frage im Satz', ziele: ['lz1', 'lz4'], voraussetzung: ['fragen'],
      generator: { name: 'deutsch-satzbau/fragen-im-satz' },
      leiterRatenVerzicht: 'Nur Auswahlfragen mit vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Das Zuordnen im Thema davor und die Fragen nach den Satzgliedern im Thema danach prüfen dasselbe aus einer anderen Richtung.' },
    { id: 'erkennen', titel: 'Satzglieder finden', ziele: ['lz4'], voraussetzung: ['fragen-im-satz'],
      generator: { name: 'deutsch-satzbau/erkennen' },
      leiterRatenVerzicht: 'Nur Auswahlfragen mit vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Falschantworten sind die anderen Satzglieder des Satzes, das Zählen und Finden wiederholt sich in vielen Sätzen.' },

    // Lernziel 2 und 3: zusammensetzen, umstellen, Umstellung prüfen. Das Zusammensetzen beginnt ohne Voraussetzung.
    { id: 'zusammensetzen', titel: 'Satz bauen', ziele: ['lz2'],
      generator: { name: 'deutsch-satzbau/zusammensetzen' }, leiter: [{ box: 0, typ: 'reihenfolge' }],
      leiterRatenVerzicht: 'Drei bis vier Satzglieder in die richtige Reihenfolge bringen: Die Chance, es zufällig richtig zu legen, liegt bei 1 zu 6 bis 1 zu 24. Grossbuchstabe und Punkt auf den Karten lassen nur eine Reihenfolge zu.' },
    { id: 'umstellen', titel: 'Satz umstellen', ziele: ['lz3'], voraussetzung: ['zusammensetzen'],
      generator: { name: 'deutsch-satzbau/umstellen' }, leiter: [{ box: 0, typ: 'reihenfolge' }],
      leiterRatenVerzicht: 'Drei bis vier Satzglieder in die richtige Reihenfolge bringen: Die Chance, es zufällig richtig zu legen, liegt bei 1 zu 6 bis 1 zu 24. Das erste Glied ist vorgegeben.' },
    { id: 'umstellen-pruefen', titel: 'Richtig umgestellt?', ziele: ['lz3'], voraussetzung: ['umstellen'],
      generator: { name: 'deutsch-satzbau/umstellen-pruefen' },
      leiterRatenVerzicht: 'Nur Auswahlfragen mit vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Das Umstellen im Thema davor prüft dasselbe ohne Rateweg.' },

    // Lernziel 5: Satzanfang, Nomen, Punkt. Erst im Lückentext schreiben (Kacheln), dann unter vier Sätzen den richtigen finden.
    { id: 'gross-punkt', titel: 'Gross oder klein, Punkt am Ende', ziele: ['lz5'],
      generator: { name: 'deutsch-satzbau/gross-punkt' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'richtig-schreiben', titel: 'Richtig geschrieben?', ziele: ['lz5'], voraussetzung: ['gross-punkt'],
      generator: { name: 'deutsch-satzbau/richtig-schreiben' },
      leiterRatenVerzicht: 'Nur Auswahlfragen mit vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Das Thema davor lässt das Kind die Lücken selbst füllen, ohne Rateweg.' }
  ],

  fehlerCodes: {                             // Diagnose oder falsche Antwort → Rückmeldung an das Kind und Hinweis an die Eltern. folge: null, keine Aufgabe braucht eine Voraussetzung
    'wann-wo-verwechselt': {
      kind: 'Wann fragt nach der Zeit, Wo fragt nach dem Ort. Stelle beide Fragen an den Satz: Nur eine Antwort passt.',
      eltern: 'Die Fragen Wann? (Zeit) und Wo? (Ort) wurden vertauscht. Beide Fragen zusammen laut an den Satz stellen: «Wann bellt der Hund?» und «Wo bellt der Hund?». Es passt immer nur eine Antwort.', folge: null },
    'wer-verb-verwechselt': {
      kind: 'Wer sagt, wer etwas tut. Das Verb sagt, was jemand tut. Frage zuerst: Was wird getan? Das ist das Verb.',
      eltern: 'Das Satzglied «Wer?» und das Verb wurden verwechselt. Hilft: zuerst fragen, was getan wird (das ist das Verb), danach, wer es tut. Das Verb ist meistens ein einzelnes Wort.', folge: null },
    'satzglied-falsch': {
      kind: 'Das ist ein anderes Satzglied. Stelle die Frage an den Satz und suche die Antwort: Wer? Verb? Wann? Wo?',
      eltern: 'Das gewählte Satzglied antwortet auf eine andere Frage. Gemeinsam alle vier Fragen an den Satz stellen und bei jeder Antwort mit dem Finger auf das Satzglied zeigen. Jedes Satzglied antwortet auf genau eine Frage.', folge: null },
    'woerter-gezaehlt': {
      kind: 'Du hast die Wörter gezählt. Ein Satzglied kann aus mehreren Wörtern bestehen, zum Beispiel «am Abend». Zähle die Antworten auf Wer? Verb? Wann? Wo?',
      eltern: 'Das Kind zählt Wörter statt Satzglieder. Mit der Umstellprobe zeigen: «am Abend» wandert beim Umstellen immer zusammen, ist also ein einziges Satzglied.', folge: null },
    'verb-nicht-zweite': {
      kind: 'Das Verb steht an zweiter Stelle: zuerst ein ganzes Satzglied, dann das Verb. Suche zuerst das Verb.',
      eltern: 'Das Verb steht nicht an zweiter Stelle. Wichtig: zweite Stelle heisst zweites Satzglied, nicht zweites Wort. Beim Vorlesen mitzählen lassen: erstes Satzglied, dann das Verb.', folge: null },
    'satz-anfang': {
      kind: 'Der Satz beginnt mit einem anderen Satzglied. Das Satzglied mit dem grossen Anfangsbuchstaben steht vorne.',
      eltern: 'Das erste Satzglied stimmt nicht. Auf den grossen Anfangsbuchstaben hinweisen: Das Satzglied, das gross beginnt, steht vorne.', folge: null },
    'satz-ende': {
      kind: 'Das Satzglied mit dem Punkt steht am Schluss. Suche es zuerst.',
      eltern: 'Das Satzglied mit dem Punkt wurde nicht ans Ende gesetzt. Zuerst dieses Satzglied suchen lassen, danach von vorn aufbauen.', folge: null },
    'satzanfang-klein': {
      kind: 'Ein Satz beginnt mit einem grossen Buchstaben.',
      eltern: 'Der Satz beginnt mit einem kleinen Buchstaben. Die Regel einmal zeigen und beim Schreiben zu Hause auf den ersten Buchstaben achten lassen.', folge: null },
    'punkt-fehlt': {
      kind: 'Am Schluss eines Satzes, der etwas sagt, steht ein Punkt.',
      eltern: 'Der Punkt am Satzende fehlt oder ein anderes Satzzeichen wurde gewählt. Den Satz laut lesen lassen: Wer etwas sagt, senkt die Stimme am Schluss, dann steht ein Punkt.', folge: null },
    'satzglied-zerrissen': {
      kind: 'Ein Satzglied gehört zusammen, zum Beispiel «am Abend». Das Verb steht nach dem ganzen ersten Satzglied, nicht mitten darin.',
      eltern: 'Das Verb wurde als zweites Wort eingefügt und hat ein Satzglied zerrissen. Mit der Umstellprobe zeigen: Was beim Umstellen zusammen wandert, ist ein Satzglied.', folge: null },
    'nomen-klein': {
      kind: 'Nomen schreibt man gross. Mache die Artikelprobe: Klingt der, die oder das davor richtig, ist es ein Nomen.',
      eltern: 'Ein Nomen wurde kleingeschrieben. Die Artikelprobe laut sprechen lassen: der Garten, die Pause, das Sofa. Wo der, die oder das davor passt, schreibt man gross.', folge: null },
    'verb-gross': {
      kind: 'Verben schreibt man klein. Gross schreibt man den Satzanfang und die Nomen.',
      eltern: 'Ein Verb wurde grossgeschrieben, vermutlich nach dem Gefühl «wichtige Wörter gross». Klarstellen: Gross sind nur der Satzanfang und die Nomen, ein Verb sagt, was jemand tut, und bleibt klein.', folge: null },
    'klein-gross': {
      kind: 'Dieses Wort ist kein Nomen und steht nicht am Satzanfang. Es wird kleingeschrieben.',
      eltern: 'Ein kleines Wort wie «am», «im» oder «auf» wurde grossgeschrieben. Die Artikelprobe zeigen: «der am» klingt nicht richtig, darum ist es kein Nomen und bleibt klein.', folge: null }
  },

  pruefung: {                                // Aufbau der echten Lernkontrolle. Das Datum im Elternbereich gewinnt gegen dieses
    datum: '2026-10-23',                     // Annahme: Prüfung in der Woche vom 19.10.2026, genaues Datum offen, im Elternbereich überschreibbar
    themen: ['*'],
    richtzeitMin: 30,                        // Annahme, das Blatt nennt keine Zeit
    format: [                                // Annahme: lw check verlangt ein Format, das Blatt nennt keines. Je Lernziel ein bis zwei Teile, ein Punkt je Aufgabe. TODO: Format der Lernkontrolle
      { thema: ['fragen'],            typ: 'zuordnen',        anzahl: 6, punkte: 6 },     // lz1
      { thema: ['fragen-im-satz'],    typ: 'multiple-choice', anzahl: 3, punkte: 3 },     // lz1, lz4
      { thema: ['erkennen'],          typ: 'multiple-choice', anzahl: 4, punkte: 4 },     // lz4
      { thema: ['zusammensetzen'],    typ: 'reihenfolge',     anzahl: 3, punkte: 3 },     // lz2
      { thema: ['umstellen'],         typ: 'reihenfolge',     anzahl: 3, punkte: 3 },     // lz3
      { thema: ['umstellen-pruefen'], typ: 'multiple-choice', anzahl: 2, punkte: 2 },     // lz3
      { thema: ['gross-punkt'],       typ: 'lueckentext',     anzahl: 3, punkte: 3 },     // lz5
      { thema: ['richtig-schreiben'], typ: 'multiple-choice', anzahl: 2, punkte: 2 }      // lz5
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 }
  },

  begleitung: [
    'Lieber täglich 10 Minuten als einmal pro Woche eine Stunde.',
    'Satzstreifen ausschneiden: Einen Satz aufschreiben und in Satzglieder zerschneiden (Wer, Verb, Wann, Wo). Das Kind legt die Streifen zu einem Satz, stellt sie um und liest jeden neuen Satz laut vor.',
    'Beim Abendessen Sätze umstellen: «Der Hund bellt am Abend im Garten.» wird zu «Am Abend bellt der Hund im Garten.» Das Verb bleibt an zweiter Stelle.',
    'Satzglieder mit Fragen suchen: Wer tut etwas? Was wird getan? Wann? Wo? Jede Antwort ist ein Satzglied, auch wenn sie aus mehreren Wörtern besteht.',
    'Nomen mit der Artikelprobe finden: Passt «der», «die» oder «das» davor, ist es ein Nomen und wird grossgeschrieben.',
    'Zweite Stelle heisst zweites Satzglied, nicht zweites Wort. «Am Abend» ist ein einziges Satzglied.',
    'Die Namen so verwenden, wie die Lehrperson sie in der Klasse braucht. Die App sagt Satzglied, Verb und Nomen. Manche Klassen sagen Satzteil, Tunwort und Namenwort.',
    'Nach einem Fehler zuerst den Lösungsweg lesen lassen und die Probe laut mitsprechen. Nicht vorsagen.'
  ]
});
