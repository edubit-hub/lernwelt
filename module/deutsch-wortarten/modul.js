/* module/deutsch-wortarten/modul.js: Wortarten, Satzzeichen und ABC (Deutsch, Sprache im Fokus, 3. Klasse). Reine Daten: ein einziger Aufruf,
   kein Zugriff auf Registry oder Bausteine. Die Aufgaben kommen aus den Generatoren in den Dateien gen-*.js, alles Inhaltliche ist eigene Formulierung.
   Stand: Entwurf. Lehrmittel, Lernziele (eigene Sätze, nicht vom Blatt), Lehrplan-Codes, Prüfungsformat und alle Lösungswege sind ungeprüft (README.md, TODO).
   Das Lehrmittel der Klasse ist unbekannt. Aktiv ist, was der Lehrplan für alle Lehrmittel verlangt. Was nur in einem Lehrmittelprofil Kern ist,
   steht als eigenes Thema mit aktiv: false und einem Hinweis zur Geltung (Rechenregel R44). */
Lernwelt.modul({
  schema: 1,
  id: 'deutsch-wortarten',                   // stabil, nie ändern: Fortschrittsschlüssel
  version: '1.0.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Wortarten, Satzzeichen und ABC',
  fach: 'deutsch',
  bereich: 'deutsch.sprache',                // Platz im Forschungsbaum der Spielwelt
  stufen: [3],
  zyklus: 2,
  lp21: ['D.5.C.1', 'D.5.C.2'],              // Beispielwerte, vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  dateien: ['gen-wortarten.js', 'gen-satzteile.js', 'gen-nomen.js', 'gen-verben.js', 'gen-satz.js', 'gen-abc.js'],
  braucht: ['_gemeinsam/schreibantwort'],    // gemeinsamer Baustein für getippte Antworten (Gross-/Kleinschreibung, Umlaut)

  lernziele: [                               // eigene Sätze, bis das Lernzielblatt der Lehrperson vorliegt (dann wörtlich übernehmen)
    { id: 'lz1', text: 'Ich kann Nomen, Verben und Adjektive erkennen und mit einer Probe prüfen.' },
    { id: 'lz2', text: 'Ich kann zu einem Nomen den passenden Artikel wählen: der, die oder das.' },
    { id: 'lz3', text: 'Ich kann die Mehrzahl von Nomen bilden.' },
    { id: 'lz4', text: 'Ich kann zu einem Verb die Grundform nennen und die Form zur Person bilden.' },
    { id: 'lz5', text: 'Ich kann Adjektive steigern.' },
    { id: 'lz6', text: 'Ich kann Wörter zu einem Satz zusammensetzen und das Satzzeichen am Schluss wählen.' },
    { id: 'lz7', text: 'Ich kann Aussagesätze, Fragesätze und Ausrufesätze unterscheiden.' },
    { id: 'lz8', text: 'Ich kann Wörter nach dem ABC ordnen und im Wörterbuch finden.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt der Vater nach dem Abgleich, nie ein Agent
    artikelprobe:        { titel: 'Artikelprobe: Nomen erkennen',                       quelle: 'Lehrmittel Seite __', geprueft: null },
    verbfrage:           { titel: 'Verb erkennen: Was tut jemand?',                     quelle: 'Lehrmittel Seite __', geprueft: null },
    steigerungsprobe:    { titel: 'Wie-Frage und Steigerungsprobe: Adjektiv erkennen',  quelle: 'Lehrmittel Seite __', geprueft: null },
    'begleiter-sprechen': { titel: 'Artikel sprechen und hören',                        quelle: 'Lehrmittel Seite __', geprueft: null },
    mehrzahlprobe:       { titel: 'Mehrzahl bilden und sprechen',                       quelle: 'Lehrmittel Seite __', geprueft: null },
    personalformprobe:   { titel: 'Personalformprobe: Grundform und Personalform',      quelle: 'Lehrmittel Seite __', geprueft: null },
    satzzeichenregel:    { titel: 'Satzzeichen nach der Satzart wählen',                quelle: 'Lehrmittel Seite __', geprueft: null },
    satzbau:             { titel: 'Sätze zusammensetzen',                               quelle: 'Lehrmittel Seite __', geprueft: null },
    satzart:             { titel: 'Satzarten unterscheiden',                            quelle: 'Lehrmittel Seite __', geprueft: null },
    'abc-ordnen':        { titel: 'Nach dem ABC ordnen',                                quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // die Aufgabe wird zuerst abgerufen, der Lösungsweg erklärt nach einem Fehler
    leiter: [{ box: 0, typ: 'multiple-choice' }],
    optionen: {},
    neuProTag: 4,
    maxSchwierigkeit: 3
  },

  themen: [
    { id: 'wortarten', titel: 'Nomen, Verb oder Adjektiv', ziele: ['lz1'], frage: 'Welche Wortart ist dieses Wort?',
      generator: { name: 'deutsch-wortarten/wortarten' },
      leiter: [{ box: 0, typ: 'multiple-choice' }, { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' }] },
    { id: 'im-satz', titel: 'Wortarten im Satz finden', ziele: ['lz1'], voraussetzung: ['wortarten'],
      generator: { name: 'deutsch-wortarten/im-satz' } },
    { id: 'herausschreiben', titel: 'Wörter aus dem Satz schreiben', ziele: ['lz1'], voraussetzung: ['im-satz'],
      generator: { name: 'deutsch-wortarten/herausschreiben' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'begleiter', titel: 'Der, die oder das', ziele: ['lz2'],
      generator: { name: 'deutsch-wortarten/begleiter' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'adjektiv', titel: 'Wie ist es? Adjektive erkennen', ziele: ['lz1'], voraussetzung: ['wortarten'],
      generator: { name: 'deutsch-wortarten/adjektiv' } },
    { id: 'steigerung', titel: 'Adjektive steigern', ziele: ['lz5'], voraussetzung: ['adjektiv'],
      generator: { name: 'deutsch-wortarten/steigerung' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'satzzeichen', titel: 'Satzzeichen am Schluss', ziele: ['lz6'],
      generator: { name: 'deutsch-wortarten/satzzeichen' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'satzbau', titel: 'Sätze zusammensetzen', ziele: ['lz6'], voraussetzung: ['satzzeichen'],
      generator: { name: 'deutsch-wortarten/satzbau' }, leiter: [{ box: 0, typ: 'reihenfolge' }] },
    { id: 'abc', titel: 'Nach dem ABC ordnen', ziele: ['lz8'],
      generator: { name: 'deutsch-wortarten/abc' }, leiter: [{ box: 0, typ: 'reihenfolge' }] },

    // Stoff, der nur in einem Lehrmittelprofil Kern ist: aus, bis die Eltern ihn einschalten (R44)
    { id: 'mehrzahl', titel: 'Einzahl und Mehrzahl', ziele: ['lz3'], voraussetzung: ['begleiter'], aktiv: false,
      geltung: 'Gilt, wenn die Klasse Einzahl und Mehrzahl im Unterricht übt. Die Lehrperson weiss, ob das schon dran war.',
      generator: { name: 'deutsch-wortarten/mehrzahl' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'personalform', titel: 'Verben: Grundform und Personalform', ziele: ['lz4'], voraussetzung: ['wortarten'], aktiv: false,
      geltung: 'Gilt, wenn die Klasse die Grundform des Verbs und die Personalformen im Präsens behandelt. Die Lehrperson weiss, ob das schon dran war.',
      generator: { name: 'deutsch-wortarten/personalform' }, leiter: [{ box: 0, typ: 'lueckentext' }] },
    { id: 'satzarten', titel: 'Aussage, Frage, Ausruf', ziele: ['lz7'], voraussetzung: ['satzzeichen'], aktiv: false,
      geltung: 'Gilt, wenn die Klasse die Satzarten mit ihren Namen kennt (Aussagesatz, Fragesatz, Ausrufesatz). Die Lehrperson weiss, welche Begriffe die Klasse braucht.',
      generator: { name: 'deutsch-wortarten/satzarten' } },
    { id: 'nachschlagen', titel: 'Im Wörterbuch finden', ziele: ['lz8'], voraussetzung: ['abc'], aktiv: false,
      geltung: 'Gilt, wenn die Klasse mit einem Wörterbuch arbeitet. Die Lehrperson weiss, wie weit das Nachschlagen geübt wird.',
      generator: { name: 'deutsch-wortarten/nachschlagen' } }
  ],

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern
    'nicht-nomen': { kind: 'Das Wort ist kein Nomen. Mache die Artikelprobe: Setze der, die oder das davor. Klingt es nicht richtig, ist es kein Nomen.',
      eltern: 'Ein Wort wurde als Nomen eingeordnet, das keines ist. Die Artikelprobe laut sprechen lassen: Nur bei einem Nomen klingt der, die oder das davor richtig.', folge: null },
    'nicht-verb': { kind: 'Das Wort ist kein Verb. Ein Verb sagt, was jemand tut. Frage dich: Was kann jemand tun?',
      eltern: 'Ein Wort wurde als Verb eingeordnet, das keines ist. Die Frage «Was tut jemand?» stellen und das Wort in einen kurzen Satz setzen.', folge: null },
    'nicht-adjektiv': { kind: 'Das Wort ist kein Adjektiv. Ein Adjektiv sagt, wie etwas ist, und lässt sich meistens steigern: schnell, schneller, am schnellsten.',
      eltern: 'Ein Wort wurde als Adjektiv eingeordnet, das keines ist. Die Wie-Frage und die Steigerungsprobe gemeinsam sprechen. Nicht jedes Adjektiv lässt sich steigern, die meisten schon.', folge: null },
    'gewaehlt-nomen': { kind: 'Das gewählte Wort ist ein Nomen. Gesucht war eine andere Wortart. Lies die Frage noch einmal.',
      eltern: 'Das Kind hat ein Nomen gewählt, obwohl nach einer anderen Wortart gefragt war. Oft liegt es am Lesen der Frage: gemeinsam laut lesen, welche Wortart gesucht ist.', folge: null },
    'gewaehlt-verb': { kind: 'Das gewählte Wort ist ein Verb. Gesucht war eine andere Wortart. Lies die Frage noch einmal.',
      eltern: 'Das Kind hat ein Verb gewählt, obwohl nach einer anderen Wortart gefragt war. Gemeinsam laut lesen, welche Wortart gesucht ist, und die Probe dazu sprechen.', folge: null },
    'gewaehlt-adjektiv': { kind: 'Das gewählte Wort ist ein Adjektiv. Gesucht war eine andere Wortart. Lies die Frage noch einmal.',
      eltern: 'Das Kind hat ein Adjektiv gewählt, obwohl nach einer anderen Wortart gefragt war. Gemeinsam laut lesen, welche Wortart gesucht ist, und die Probe dazu sprechen.', folge: null },
    'gewaehlt-begleiter': { kind: 'Das gewählte Wort ist ein Artikel: der, die oder das. Er steht vor dem Nomen, ist aber nicht das Nomen selbst.',
      eltern: 'Der Artikel (der, die, das) wurde mit dem Nomen verwechselt. Zeigen: Der Artikel steht vor dem Nomen, das Nomen kommt danach.', folge: null },
    'andere-wortart': { kind: 'Du hast ein anderes Wort aus dem Satz geschrieben. Prüfe es mit der Probe: Nomen mit der, die oder das davor, Verb mit «Was tut er?», Adjektiv mit «Wie ist es?».',
      eltern: 'Das Kind hat ein Wort einer anderen Wortart herausgeschrieben. Gemeinsam die Probe der gesuchten Wortart sprechen und am Satz zeigen.', folge: null },
    'gross-klein': { kind: 'Das Wort stimmt, nur die Gross- und Kleinschreibung nicht. Nomen schreibt man gross, Verben und Adjektive klein.',
      eltern: 'Inhaltlich richtig, die Schreibung weicht ab. Das ist kein Wissensproblem bei den Wortarten. Regel: Nomen und Satzanfang gross, Verben und Adjektive klein.', folge: null },
    'begleiter-falsch': { kind: 'Dieser Artikel passt nicht. Sprich alle drei Formen laut: der, die, das mit dem Nomen. Nur eine klingt richtig.',
      eltern: 'Der Artikel beruht oft auf Gewohnheit. Das Nomen immer mit Artikel lernen und laut sprechen. Wörter, die im Dialekt anders klingen, einzeln besprechen.', folge: null },
    'einzahl-getippt': { kind: 'Du hast die Einzahl geschrieben. Gesucht ist die Mehrzahl: Es sind zwei.',
      eltern: 'Das Kind hat die Einzahl wiederholt. Den Satz laut mit «zwei» sprechen lassen und fragen, wie das Wort dann klingt.', folge: null },
    'umlaut-fehlt': { kind: 'Im Wort fehlt ein Umlaut. Aus a, o oder u wird hier ein ä, ö oder ü. Sprich das Wort laut.',
      eltern: 'Der Vokal im Wortstamm ändert sich, das Kind schreibt ohne Umlaut (alter statt älter). Das Wort laut sprechen lassen und auf den Klang des Vokals achten.', folge: null },
    'endung-falsch': { kind: 'Der Wortanfang stimmt, die Endung noch nicht. Sprich «zwei ...» laut und höre auf das Wortende.',
      eltern: 'Die Mehrzahlendungen (-e, -n, -en, -er, -s) folgen keiner einfachen Regel. Nomen mit ihrer Mehrzahl zusammen lernen, zum Beispiel der Hund, die Hunde.', folge: null },
    'grundform-getippt': { kind: 'Du hast die Grundform geschrieben. Gesucht ist die Form, die zur Person passt. Sieh dir die Reihe ich, du, er an.',
      eltern: 'Das Kind schreibt die Grundform statt der Personalform. Die Reihe ich, du, er laut mit dem Verb sprechen und am Satz die Person bestimmen.', folge: null },
    'person-verwechselt': { kind: 'Diese Form gehört zu einer anderen Person. Frage: Wer tut etwas? ich, du, er, wir, ihr oder sie?',
      eltern: 'Das Kind kennt die Formen, wählt aber die falsche Person. Gemeinsam am Satz bestimmen, wer etwas tut, und die Reihe ich, du, er, wir, ihr, sie aufsagen.', folge: null },
    'personalform-getippt': { kind: 'Du hast eine Form mit Person geschrieben. Gesucht ist die Grundform. Sie endet auf -en.',
      eltern: 'Das Kind schreibt die Form aus dem Satz ab statt der Grundform. Zeigen: Die Grundform ist die Form ohne Person, sie endet auf -en.', folge: null },
    'nicht-gesteigert': { kind: 'Du hast das Wort nicht gesteigert. Schreibe die Stufe, die im Satz fehlt. Die Reihe heisst zum Beispiel klein, kleiner, am kleinsten.',
      eltern: 'Das Kind schreibt die Grundstufe statt der gefragten Stufe. Die Reihe laut sprechen lassen und am Satz zeigen, ob verglichen wird.', folge: null },
    'stufe-verwechselt': { kind: 'Du hast eine andere Stufe geschrieben. Die Reihe heisst zum Beispiel klein, kleiner, am kleinsten. Welche Stufe fehlt im Satz?',
      eltern: 'Die zweite und die dritte Stufe wurden vertauscht. Hilft: Bei zwei Dingen heisst es -er, bei dreien kommt am ...-sten dazu.', folge: null },
    'punkt-statt-frage': { kind: 'Dieser Satz fragt. Am Schluss steht ein Fragezeichen.',
      eltern: 'Das Kind setzt einen Punkt nach einer Frage. Den Satz mit Frageton lesen lassen: Die Stimme geht am Schluss nach oben.', folge: null },
    'frage-statt-punkt': { kind: 'Dieser Satz fragt nicht, er sagt etwas. Am Schluss steht ein Punkt.',
      eltern: 'Das Kind setzt ein Fragezeichen nach einer Aussage. Den Satz laut lesen lassen und prüfen, ob eine Antwort gesucht wird.', folge: null },
    'punkt-statt-ausruf': { kind: 'Dieser Satz ruft oder fordert auf. Am Schluss steht ein Ausrufezeichen.',
      eltern: 'Das Kind setzt einen Punkt nach einem Ausruf oder einer Aufforderung. Den Satz so laut lesen lassen, wie man ihn zu jemandem sagt, der etwas tun soll.', folge: null },
    'ausruf-statt-punkt': { kind: 'Dieser Satz sagt ruhig etwas. Am Schluss steht ein Punkt.',
      eltern: 'Das Kind setzt ein Ausrufezeichen nach einer Aussage. Fragen: Ruft jemand, oder wird etwas gesagt?', folge: null },
    'satzanfang-klein': { kind: 'Ein Satz beginnt mit einem grossen Buchstaben.',
      eltern: 'Das Kind beginnt den Satz klein. Die Regel einmal zeigen und beim Schreiben zu Hause auf den ersten Buchstaben achten lassen.', folge: null },
    'satzart-aussage': { kind: 'Das ist kein Aussagesatz. Ein Aussagesatz sagt etwas und endet mit einem Punkt. Achte auf das Zeichen am Schluss.',
      eltern: 'Die Satzart wurde falsch benannt. Das Zeichen am Schluss zeigen und den Satz mit der passenden Stimme lesen lassen.', folge: null },
    'satzart-frage': { kind: 'Das ist kein Fragesatz. Ein Fragesatz fragt und endet mit einem Fragezeichen. Achte auf das Zeichen am Schluss.',
      eltern: 'Die Satzart wurde falsch benannt. Das Zeichen am Schluss zeigen und den Satz mit der passenden Stimme lesen lassen.', folge: null },
    'satzart-aufforderung': { kind: 'Das ist kein Ausrufesatz. Ein Ausrufesatz ruft etwas oder sagt, was jemand tun soll. Achte auf das Zeichen am Schluss.',
      eltern: 'Die Satzart wurde falsch benannt. Das Zeichen am Schluss zeigen und fragen, ob jemand etwas tun soll.', folge: null },
    'satz-ende': { kind: 'Das Wort mit dem Satzzeichen steht am Schluss. Suche es zuerst.',
      eltern: 'Das Kind hat das Wort mit dem Satzzeichen nicht ans Ende gesetzt. Zuerst dieses Wort suchen lassen, dann von vorn aufbauen.', folge: null },
    'satz-anfang': { kind: 'Der Satz beginnt mit einem grossen Buchstaben. Oft nennt der Anfang, wer etwas tut, oder er ist das Fragewort.',
      eltern: 'Der Satzanfang stimmt nicht. Fragen: Wer oder was tut etwas? Bei Fragen steht das Fragewort vorn.', folge: null },
    'abc-erster-buchstabe': { kind: 'Vergleiche zuerst die Anfangsbuchstaben. Welcher steht im ABC am weitesten vorn?',
      eltern: 'Schon die Anfangsbuchstaben sind durcheinander. Das ABC gemeinsam aufsagen und die Anfangsbuchstaben der Wörter einzeln einordnen.', folge: null },
    'abc-weiterer-buchstabe': { kind: 'Die Anfangsbuchstaben stimmen. Wo sie gleich sind, entscheidet der nächste Buchstabe.',
      eltern: 'Das Kind kann nach dem ersten Buchstaben ordnen, nicht nach dem zweiten oder dritten. Bei Wörtern mit gleichem Anfang Buchstabe für Buchstabe vergleichen.', folge: null }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 30,                        // TODO: Format der Lernkontrolle, die Teile unten sind eine Annahme und kommen vom Blatt
    format: [
      { thema: ['wortarten'],        typ: 'zuordnen',        anzahl: 6, punkte: 6 },
      { thema: ['im-satz'],          typ: 'multiple-choice', anzahl: 4, punkte: 4 },
      { thema: ['begleiter'],        typ: 'lueckentext',     anzahl: 6, punkte: 6 },
      { thema: ['adjektiv'],         typ: 'multiple-choice', anzahl: 3, punkte: 3 },
      { thema: ['steigerung'],       typ: 'lueckentext',     anzahl: 4, punkte: 4 },
      { thema: ['satzzeichen'],      typ: 'lueckentext',     anzahl: 4, punkte: 4 },
      { thema: ['satzbau', 'abc'],   typ: 'reihenfolge',     anzahl: 4, punkte: 4 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 }
  },

  begleitung: [
    'Lieber täglich 10 Minuten als einmal pro Woche eine Stunde.',
    'Nicht vorsagen. Nach einem Fehler zuerst den Lösungsweg lesen lassen und die Probe laut mitsprechen: Artikelprobe für das Nomen, «Was tut jemand?» für das Verb, «Wie ist es?» und Steigern für das Adjektiv.',
    'Die Namen der Wortarten so verwenden, wie die Lehrperson sie in der Klasse braucht. Die App sagt Nomen, Verb, Adjektiv und Artikel. Manche Klassen sagen Namenwort, Tunwort, Wiewort und Begleiter.',
    'Wortarten, Satzzeichen und ABC folgen dem Lehrplan. Je nach Lehrmittel kommen sie erst in der 4. Klasse. Steht ein Thema nicht im Plan der Klasse, im Elternbereich ausschalten.',
    'Beim Artikel sind nur Nomen enthalten, bei denen Standardsprache und Dialekt gleich klingen. Weicht der Dialekt ab, das Wort mit Artikel aufschreiben: der Tisch, die Lampe, das Buch.',
    'Bei den Satzzeichen den Satz mit der passenden Stimme lesen lassen: Wer fragt, hebt die Stimme am Schluss.',
    'Die Themen Mehrzahl, Personalform, Satzarten und Nachschlagen sind ausgeschaltet. Erst einschalten, wenn die Lehrperson sie in der Klasse behandelt hat. Beim jeweiligen Thema im Elternbereich steht, wen man fragt.',
    'Das ABC in einer ruhigen Minute aufsagen lassen. Wer die Reihe sicher kann, ordnet Wörter schneller.'
  ]
});
