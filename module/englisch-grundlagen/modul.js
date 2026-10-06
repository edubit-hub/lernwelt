/* module/englisch-grundlagen/modul.js: Englisch: Grundlagen (Architektur 4.4, AP-18a1). Wortschatz des Einstiegs: Schulsachen, Klassenzimmer, Farben, Zahlen,
   Anweisungen. Dazu fünf Themen für später (Zahlen bis 100, Wochentage, Monate, Datum), die aus sind, bis die Klasse so weit ist (R21, R44).
   Reine Daten: ein einziger Aufruf, kein Zugriff auf Registry oder Bausteine. Alle Wörter sind eigene Auswahl allgemeinen Grundwortschatzes, keine Wortliste
   eines Lehrmittels (R5). Stand: Entwurf. Lehrmittel, Lehrplan-Codes, Prüfungsformat und alle Lösungswege sind ungeprüft (README.md, TODO). */
Lernwelt.modul({
  schema: 1,
  id: 'englisch-grundlagen',                              // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                                      // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Englisch: Grundlagen',
  fach: 'englisch',
  bereich: 'englisch.wortschatz',
  stufen: [3],
  zyklus: 2,
  lp21: ['FS1E.1.A.1.a', 'FS1E.5.B.1.a', 'FS1E.5.C.1.a', 'FS1E.4.A.1.a'],   // aus der Karte übernommen (wahrscheinlich, nicht belegt), vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: 'Young World 1 (Klett, Ausgabe ab 2018), Annahme aus der Karte, mit der Lehrperson bestätigen', kapitel: "Let's get ready" },
  sprache: { fremd: 'en-GB', mutter: 'de-CH' },
  assets: { bild: 'assets/bild/' },                        // eigene flache Piktogramme, keine Aufnahmen: die Sprachausgabe spricht (R8, TODO)
  optionen: { schreiben: false },                         // Diktat ab Box 4 nur, wenn das Schreiben verlangt wird (Elternbereich)

  lernziele: [
    { id: 'lz1', text: 'Ich kann die Wörter für Dinge im Schulzimmer verstehen, wenn ich sie höre.' },
    { id: 'lz2', text: 'Ich kann ein englisches Wort dem passenden Bild zuordnen.' },
    { id: 'lz3', text: 'Ich kann die Farben auf Englisch benennen.' },
    { id: 'lz4', text: 'Ich kann die Zahlen von 1 bis 20 hören und mit den Ziffern verbinden.' },
    { id: 'lz5', text: 'Ich kann kurze Anweisungen wie «Open your books.» verstehen und danach handeln.' },
    { id: 'lz6', text: 'Ich kann die Zahlen bis 100 verstehen und die Zahlen auf -teen und -ty unterscheiden.' },
    { id: 'lz7', text: 'Ich kann die Wochentage und die Tageszeiten benennen und in die richtige Reihenfolge bringen.' },
    { id: 'lz8', text: 'Ich kann die Monate nennen, ordnen und ein Datum mit Ordinalzahlen verstehen.' }
  ],

  wege: {                                                 // Verfahren aus der Karte (Young World 1), Seiten und Wortlaut noch nicht gegen das Lehrmittel abgeglichen
    wortkarte: { titel: 'Hören, sehen, nachsprechen',            quelle: 'Lehrmittel Seite __', geprueft: null },
    anweisung: { titel: 'Hören und mit einer Handlung antworten', quelle: 'Lehrmittel Seite __', geprueft: null },
    zahl:      { titel: 'Zuerst hören und sprechen, dann die Ziffer', quelle: 'Lehrmittel Seite __', geprueft: null },
    reihe:     { titel: 'Die Reihe von Anfang an aufsagen',    quelle: 'Lehrmittel Seite __', geprueft: null },
    datum:     { titel: 'Datum mit Ordinalzahl sagen',         quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {
    einfuehrung: 'erklaerung',                            // Wörter lassen sich nicht erraten: zuerst zeigen, nach drei anderen Paketen abfragen
    leiter: [                                             // erkennen vor erinnern. Ohne Option «schreiben» steigen die Aufgaben bis Box 4 (sicher), siehe README
      { box: 0, typ: 'karteikarten' },
      { box: 1, typ: 'hoeren',   ersatz: 'multiple-choice' },                  // ohne Ton: Wort lesen und Bild oder Bedeutung wählen
      { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' },                  // Gruppen von 3 bis 6 Wörtern, sonst Ersatz
      { box: 4, typ: 'diktat',   ersatz: 'multiple-choice', wenn: 'schreiben' }
    ],
    neuProTag: 4
  },

  themen: [
    { id: 'schulsachen', titel: 'School things: Dinge im Schulzimmer', ziele: ['lz1', 'lz2'],
      hilfe: { weg: 'wortkarte', schritte: ['Höre das Wort noch einmal an.', 'Sprich es laut nach.', 'Schau das Bild an und sage das Wort dazu.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['pencil',           'pencil',           'der Bleistift',        'pencil.svg'],
        ['pen',              'pen',              'der Kugelschreiber',   'pen.svg'],
        ['rubber',           'rubber',           'der Radiergummi',      'rubber.svg'],
        ['ruler',            'ruler',            'das Lineal',           'ruler.svg'],
        ['scissors',         'scissors',         'die Schere',           'scissors.svg'],
        ['glue-stick',       'glue stick',       'der Leimstift',        'glue-stick.svg'],
        ['pencil-sharpener', 'pencil sharpener', 'der Spitzer',          'pencil-sharpener.svg'],
        ['pencil-case',      'pencil case',      'das Etui',             'pencil-case.svg'],
        ['school-bag',       'school bag',       'die Schultasche',      'school-bag.svg'],
        ['book',             'book',             'das Buch',             'book.svg'],
        ['notebook',         'notebook',         'das Notizheft',             'notebook.svg'],
        ['paper',            'paper',            'das Papier',           'paper.svg']
      ] } } },

    { id: 'klassenzimmer', titel: 'The classroom: Dinge und Möbel im Raum', ziele: ['lz1', 'lz2'],
      hilfe: { weg: 'wortkarte', schritte: ['Höre das Wort noch einmal an.', 'Sprich es laut nach.', 'Zeige im Schulzimmer auf die Sache und sage das Wort dazu.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['chair',  'chair',  'der Stuhl',          'chair.svg'],
        ['table',  'table',  'der Tisch',          'table.svg'],
        ['door',   'door',   'die Tür',            'door.svg'],
        ['window', 'window', 'das Fenster',        'window.svg'],
        ['board',  'board',  'die Wandtafel',      'board.svg'],
        ['clock',  'clock',  'die Uhr',            'clock.svg'],
        ['shelf',  'shelf',  'das Regal',          'shelf.svg'],
        ['bin',    'bin',    'der Abfalleimer',    'bin.svg']
      ] } } },

    { id: 'farben', titel: 'Colours: Farben', ziele: ['lz2', 'lz3'],
      hilfe: { weg: 'wortkarte', schritte: ['Höre das Wort noch einmal an.', 'Sprich es laut nach.', 'Suche im Zimmer etwas in dieser Farbe und sage das Wort dazu.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['red',    'red',    'rot',     'red.svg'],
        ['blue',   'blue',   'blau',    'blue.svg'],
        ['green',  'green',  'grün',    'green.svg'],
        ['yellow', 'yellow', 'gelb',    'yellow.svg'],
        ['orange', 'orange', 'orange',  'orange.svg'],
        ['pink',   'pink',   'rosa',    'pink.svg'],
        ['purple', 'purple', 'violett', 'purple.svg'],
        ['brown',  'brown',  'braun',   'brown.svg'],
        ['black',  'black',  'schwarz', 'black.svg'],
        ['white',  'white',  'weiss',   'white.svg'],
        ['grey',   'grey',   'grau',    'grey.svg']
      ] } } },

    { id: 'zahlen-1-12', titel: 'Numbers 1 to 12: Zahlen von 1 bis 12', ziele: ['lz4'],
      hilfe: { weg: 'zahl', schritte: ['Höre die Zahl an und sprich sie nach.', 'Zähle auf Englisch bis zu dieser Zahl.', 'Wähle erst dann die Ziffer.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['one', 'one', '1'], ['two', 'two', '2'], ['three', 'three', '3'], ['four', 'four', '4'], ['five', 'five', '5'], ['six', 'six', '6'],
        ['seven', 'seven', '7'], ['eight', 'eight', '8'], ['nine', 'nine', '9'], ['ten', 'ten', '10'], ['eleven', 'eleven', '11'], ['twelve', 'twelve', '12']
      ] } } },

    { id: 'zahlen-13-20', titel: 'Numbers 13 to 20: Zahlen von 13 bis 20', ziele: ['lz4'],
      hilfe: { weg: 'zahl', schritte: ['Höre die Zahl an und sprich sie nach.', 'Zähle auf Englisch bis zu dieser Zahl.', 'Wähle erst dann die Ziffer.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['thirteen', 'thirteen', '13'], ['fourteen', 'fourteen', '14'], ['fifteen', 'fifteen', '15'], ['sixteen', 'sixteen', '16'],
        ['seventeen', 'seventeen', '17'], ['eighteen', 'eighteen', '18'], ['nineteen', 'nineteen', '19'], ['twenty', 'twenty', '20']
      ] } } },

    { id: 'anweisungen', titel: 'Classroom language: Anweisungen im Schulzimmer', ziele: ['lz5'],
      hilfe: { weg: 'anweisung', schritte: ['Höre die Anweisung an.', 'Tue, was sie sagt: zeige, stehe auf oder öffne dein Buch.', 'Sprich die Anweisung laut nach.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['open-books',  'Open your books.',        'Öffnet eure Bücher.'],
        ['close-books', 'Close your books.',       'Schliesst eure Bücher.'],
        ['stand-up',    'Stand up.',               'Steht auf.'],
        ['sit-down',    'Sit down.',               'Setzt euch hin.'],
        ['listen',      'Listen, please.',         'Hört bitte zu.'],
        ['look-board',  'Look at the board.',      'Schaut an die Wandtafel.'],
        ['point-door',  'Point to the door.',      'Zeigt auf die Tür.'],
        ['take-pencils', 'Take your pencils.',     'Nehmt eure Bleistifte.'],
        ['raise-hands', 'Raise your hands.',       'Hebt die Hände.'],
        ['be-quiet',    'Be quiet, please.',       'Seid bitte leise.'],
        ['say-again',   'Say it again, please.',   'Sagt es bitte noch einmal.'],
        ['colour-picture', 'Colour the picture.',  'Malt das Bild an.']
      ] } } },

    // Ab hier: für später. Die Themen sind aus, bis die Klasse so weit ist (R21: neue Wörter nie zuerst in der App, R44: Stoff nach Lehrmittelprofil).
    { id: 'zahlen-21-100', titel: 'Numbers up to 100: Zahlen bis 100', ziele: ['lz6'], aktiv: false,
      geltung: 'Gilt, wenn die Klasse Zahlen bis 100 übt (nach Young World 1 in Unit 2, etwa ab Woche 7). Die Lehrperson sagt, ob die Klasse so weit ist.',
      hilfe: { weg: 'zahl', schritte: ['Höre die Zahl an und sprich sie nach.', 'Zehner und Einer einzeln hören: «twenty» und «one».', 'Wähle erst dann die Ziffer.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['thirty', 'thirty', '30'], ['forty', 'forty', '40'], ['fifty', 'fifty', '50'], ['sixty', 'sixty', '60'], ['seventy', 'seventy', '70'],
        ['eighty', 'eighty', '80'], ['ninety', 'ninety', '90'], ['one-hundred', 'one hundred', '100'],
        ['twenty-one', 'twenty-one', '21'], ['thirty-five', 'thirty-five', '35'], ['forty-two', 'forty-two', '42'], ['fifty-six', 'fifty-six', '56'],
        ['sixty-seven', 'sixty-seven', '67'], ['seventy-eight', 'seventy-eight', '78'], ['eighty-nine', 'eighty-nine', '89'], ['ninety-nine', 'ninety-nine', '99']
      ] } } },

    { id: 'zahlen-teen-ty', titel: 'Thirteen or thirty? Zahlen auf -teen und -ty', ziele: ['lz6'], aktiv: false,
      geltung: 'Gilt zusammen mit den Zahlen bis 100 und setzt die Zahlen von 13 bis 20 voraus. Die Lehrperson sagt, wann die Klasse die Zehner übt.',
      einfuehrung: 'vortest', leiter: [{ box: 0, typ: 'multiple-choice' }],
      hilfe: { weg: 'zahl', schritte: ['Sprich das Wort laut: «thirteen» ist hinten betont, «thirty» vorne.', 'Sprich beide Wörter nacheinander und höre den Unterschied.'] },
      aufgaben: { tabelle: { form: 'auswahl', spalten: ['id', 'frage', 'richtig', 'falsch'], zeilen: [
        ['teen-13', 'Welche Zahl ist «thirteen»?', '13', [{ text: '30', code: 'teen-ty-verwechselt' }, '3', '31']],
        ['teen-14', 'Welche Zahl ist «fourteen»?', '14', [{ text: '40', code: 'teen-ty-verwechselt' }, '4', '41']],
        ['teen-15', 'Welche Zahl ist «fifteen»?',  '15', [{ text: '50', code: 'teen-ty-verwechselt' }, '5', '51']],
        ['teen-16', 'Welche Zahl ist «sixteen»?',  '16', [{ text: '60', code: 'teen-ty-verwechselt' }, '6', '61']],
        ['teen-17', 'Welche Zahl ist «seventeen»?', '17', [{ text: '70', code: 'teen-ty-verwechselt' }, '7', '71']],
        ['teen-18', 'Welche Zahl ist «eighteen»?', '18', [{ text: '80', code: 'teen-ty-verwechselt' }, '8', '81']],
        ['teen-19', 'Welche Zahl ist «nineteen»?', '19', [{ text: '90', code: 'teen-ty-verwechselt' }, '9', '91']],
        ['ty-30', 'Welche Zahl ist «thirty»?',  '30', [{ text: '13', code: 'teen-ty-verwechselt' }, '3', '31']],
        ['ty-40', 'Welche Zahl ist «forty»?',   '40', [{ text: '14', code: 'teen-ty-verwechselt' }, '4', '41']],
        ['ty-50', 'Welche Zahl ist «fifty»?',   '50', [{ text: '15', code: 'teen-ty-verwechselt' }, '5', '51']],
        ['ty-60', 'Welche Zahl ist «sixty»?',   '60', [{ text: '16', code: 'teen-ty-verwechselt' }, '6', '61']],
        ['ty-70', 'Welche Zahl ist «seventy»?', '70', [{ text: '17', code: 'teen-ty-verwechselt' }, '7', '71']],
        ['ty-80', 'Welche Zahl ist «eighty»?',  '80', [{ text: '18', code: 'teen-ty-verwechselt' }, '8', '81']],
        ['ty-90', 'Welche Zahl ist «ninety»?',  '90', [{ text: '19', code: 'teen-ty-verwechselt' }, '9', '91']]
      ] } } },

    { id: 'wochentage', titel: 'Days of the week: Wochentage und Tageszeiten', ziele: ['lz7'], aktiv: false,
      geltung: 'Gilt ab dem Thema Tagesablauf (nach Young World 1 in Unit 5, etwa ab Woche 24). Vorher nicht einschalten, sonst sind die Wörter zuerst in der App neu.',
      hilfe: { weg: 'wortkarte', schritte: ['Höre das Wort noch einmal an.', 'Sprich es laut nach.', 'Sage die Wochentage von Montag an auf und finde diesen Tag.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['monday', 'Monday', 'Montag'], ['tuesday', 'Tuesday', 'Dienstag'], ['wednesday', 'Wednesday', 'Mittwoch'], ['thursday', 'Thursday', 'Donnerstag'],
        ['friday', 'Friday', 'Freitag'], ['saturday', 'Saturday', 'Samstag'], ['sunday', 'Sunday', 'Sonntag'], ['weekend', 'weekend', 'das Wochenende'],
        ['morning', 'morning', 'der Morgen'], ['afternoon', 'afternoon', 'der Nachmittag'], ['evening', 'evening', 'der Abend'], ['night', 'night', 'die Nacht']
      ] } } },

    { id: 'wochentage-reihenfolge', titel: 'Days in order: Wochentage ordnen', ziele: ['lz7'], aktiv: false,
      geltung: 'Gilt erst, wenn die Wochentage in der Klasse bekannt sind (siehe Wochentage und Tageszeiten, nach Young World 1 etwa ab Woche 24).',
      einfuehrung: 'vortest', leiter: [{ box: 0, typ: 'reihenfolge' }],
      hilfe: { weg: 'reihe', schritte: ['Sage die Wochentage von Montag an leise vor dich hin.', 'Suche den Tag, der in der Reihe zuerst kommt.', 'Lege die nächste Karte daneben.'] },
      aufgaben: [
        { id: 'wt-mo-mi', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage, wie sie in der Woche aufeinander folgen.', schritte: ['Monday', 'Tuesday', 'Wednesday'] } },
        { id: 'wt-di-do', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage, wie sie in der Woche aufeinander folgen.', schritte: ['Tuesday', 'Wednesday', 'Thursday'] } },
        { id: 'wt-mi-fr', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage, wie sie in der Woche aufeinander folgen.', schritte: ['Wednesday', 'Thursday', 'Friday'] } },
        { id: 'wt-fr-so', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage, wie sie in der Woche aufeinander folgen.', schritte: ['Friday', 'Saturday', 'Sunday'] } },
        { id: 'wt-di-fr', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage, wie sie in der Woche aufeinander folgen.', schritte: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'] } },
        { id: 'wt-fr-mo', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage. Beginne mit Friday.', schritte: ['Friday', 'Saturday', 'Sunday', 'Monday'] } },
        { id: 'wt-schule', form: 'abfolge', inhalt: { frage: 'Ordne die Schultage von Montag bis Freitag.', schritte: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] } },
        { id: 'wt-do-di', form: 'abfolge', inhalt: { frage: 'Ordne die Wochentage. Beginne mit Thursday.', schritte: ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'] } },
        { id: 'wt-woche', form: 'abfolge', inhalt: { frage: 'Ordne die ganze Woche von Montag bis Sonntag.', schritte: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] } }
      ] },

    { id: 'monate', titel: 'Months: Monate', ziele: ['lz8'], aktiv: false,
      geltung: 'Gilt, wenn die Klasse die Monate übt (nach Young World 1 bei Unit 4 und beim Geburtstag, etwa ab Woche 18). Die Lehrperson sagt, ab wann.',
      hilfe: { weg: 'wortkarte', schritte: ['Höre das Wort noch einmal an.', 'Sprich es laut nach.', 'Sage die Monate von Januar an auf und finde diesen Monat.'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['january', 'January', 'Januar'], ['february', 'February', 'Februar'], ['march', 'March', 'März'], ['april', 'April', 'April'],
        ['may', 'May', 'Mai'], ['june', 'June', 'Juni'], ['july', 'July', 'Juli'], ['august', 'August', 'August'],
        ['september', 'September', 'September'], ['october', 'October', 'Oktober'], ['november', 'November', 'November'], ['december', 'December', 'Dezember']
      ] } } },

    { id: 'monate-reihenfolge', titel: 'Months in order: Monate ordnen', ziele: ['lz8'], aktiv: false,
      geltung: 'Gilt erst, wenn die Monate in der Klasse bekannt sind (siehe Monate, nach Young World 1 etwa ab Woche 18).',
      einfuehrung: 'vortest', leiter: [{ box: 0, typ: 'reihenfolge' }],
      hilfe: { weg: 'reihe', schritte: ['Sage die Monate von Januar an leise vor dich hin.', 'Suche den Monat, der in der Reihe zuerst kommt.', 'Lege den nächsten Monat daneben.'] },
      aufgaben: [
        { id: 'mo-jan-mrz', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['January', 'February', 'March'] } },
        { id: 'mo-apr-jun', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['April', 'May', 'June'] } },
        { id: 'mo-jul-sep', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['July', 'August', 'September'] } },
        { id: 'mo-okt-dez', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['October', 'November', 'December'] } },
        { id: 'mo-mrz-mai', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['March', 'April', 'May'] } },
        { id: 'mo-jun-aug', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['June', 'July', 'August'] } },
        { id: 'mo-sep-nov', form: 'abfolge', inhalt: { frage: 'Ordne die Monate, wie sie im Jahr aufeinander folgen.', schritte: ['September', 'October', 'November'] } },
        { id: 'mo-dez-feb', form: 'abfolge', inhalt: { frage: 'Ordne die Monate. Beginne mit December.', schritte: ['December', 'January', 'February'] } },
        { id: 'mo-halbjahr', form: 'abfolge', inhalt: { frage: 'Ordne die ersten sechs Monate des Jahres.', schritte: ['January', 'February', 'March', 'April', 'May', 'June'] } },
        { id: 'mo-halbjahr-2', form: 'abfolge', inhalt: { frage: 'Ordne die letzten sechs Monate des Jahres.', schritte: ['July', 'August', 'September', 'October', 'November', 'December'] } }
      ] },

    { id: 'datum', titel: 'The date: Ordinalzahlen und Geburtstag', ziele: ['lz8'], aktiv: false,
      geltung: 'Gilt beim Thema Geburtstag (nach Young World 1 Woche 23, der Umfang ist nicht belegt). Die Lehrperson sagt, welche Daten die Klasse übt.',
      hilfe: { weg: 'datum', schritte: ['Höre die Ordinalzahl an und sprich sie nach.', 'Sonderfälle: «first», «second» und «third».', 'Ab «fourth» endet die Ordinalzahl meist auf «th».'] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter'], zeilen: [
        ['first', 'first', 'der Erste (1.)'], ['second', 'second', 'der Zweite (2.)'], ['third', 'third', 'der Dritte (3.)'], ['fourth', 'fourth', 'der Vierte (4.)'],
        ['fifth', 'fifth', 'der Fünfte (5.)'], ['sixth', 'sixth', 'der Sechste (6.)'], ['seventh', 'seventh', 'der Siebte (7.)'], ['eighth', 'eighth', 'der Achte (8.)'],
        ['ninth', 'ninth', 'der Neunte (9.)'], ['tenth', 'tenth', 'der Zehnte (10.)'], ['eleventh', 'eleventh', 'der Elfte (11.)'], ['twelfth', 'twelfth', 'der Zwölfte (12.)'],
        ['when-birthday', 'When is your birthday?', 'Wann hast du Geburtstag?'],
        ['birthday-may', 'My birthday is in May.', 'Ich habe im Mai Geburtstag.'],
        ['birthday-june-5', 'My birthday is on the fifth of June.', 'Ich habe am 5. Juni Geburtstag.']
      ] } } }
  ],

  fehlerCodes: {
    'verwechselt-wort': {
      kind:   'Das war ein anderes Wort. Höre noch einmal genau hin.',
      eltern: 'Hörverstehen: Wörter klingen ähnlich (zum Beispiel pen und pencil). Die beiden Wörter gezielt gegenüberstellen und laut vorsprechen.',
      folge:  null
    },
    'gross-klein': {
      kind:   'Die Buchstaben stimmen, nur die Gross- und Kleinschreibung nicht. Der Satzanfang, die Wochentage und die Monate beginnen mit einem grossen Buchstaben.',
      eltern: 'Das Wort ist richtig geschrieben, nur Gross und Klein weichen ab. Im Englischen beginnen Wochentage, Monate und der Satzanfang gross, Dinge und Farben klein, anders als bei den deutschen Nomen.',
      folge:  null
    },
    'teen-ty-verwechselt': {
      kind:   'Zahlen auf -teen und -ty klingen ähnlich. Bei «thirteen» liegt die Betonung hinten, bei «thirty» vorne.',
      eltern: 'Verwechslung von 13 und 30, 14 und 40 und so weiter. Beide Wörter nacheinander laut sprechen und auf die Betonung hören. Die Verwechslung ist bei diesem Stoff häufig, kein Zeichen mangelnden Könnens.',
      folge:  null
    }
  },

  pruefung: {
    datum: null,                                          // setzt der Elternbereich (oder eine Vorgabe von der Lehrperson)
    themen: ['*'],
    richtzeitMin: 20,                                     // TODO: Format der Lernkontrolle erfragen, die Teile unten sind eine Annahme nach den Formaten der Karte (Hören und ankreuzen, verbinden)
    format: [
      { thema: ['schulsachen', 'klassenzimmer'],        typ: 'hoeren',   anzahl: 8, punkte: 8 },
      { thema: ['farben'],                              typ: 'hoeren',   anzahl: 6, punkte: 6 },
      { thema: ['zahlen-1-12', 'zahlen-13-20'],         typ: 'zuordnen', anzahl: 10, punkte: 10 },
      { thema: ['anweisungen'],                         typ: 'hoeren',   anzahl: 6, punkte: 6 }
    ]
  },

  anpassbar: {                                            // Whitelist für den Elternbereich
    'themen.*.aktiv':     { typ: 'bool' },
    'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 },
    'optionen.schreiben': { typ: 'bool' }
  },

  begleitung: [
    'Zuerst hören, dann sagen: Das Wort laut vorsprechen und das Kind nachsprechen lassen, bevor es auf eine Kachel tippt.',
    'Im Alltag benennen: Farben beim Anziehen, Dinge im Etui, Zahlen beim Treppensteigen. Kurze Anweisungen wie «Stand up.» sagen und das Kind danach handeln lassen, dann die Rollen tauschen.',
    'Britisches Englisch: «rubber» heisst Radiergummi. «Colour» wird mit «ou» geschrieben.',
    'Die Wörter sind eine allgemeine Auswahl. Weichen sie von den Wörtern der Klasse ab, die Lehrperson fragen und die Themen im Elternbereich anpassen.',
    'Die späteren Themen (Zahlen bis 100, Wochentage, Monate, Datum) erst einschalten, wenn die Klasse sie übt.'
  ]
});
