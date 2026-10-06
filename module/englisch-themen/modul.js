/* module/englisch-themen/modul.js: Englisch, Wortschatz nach Themen (Wortfelder der Units 1 bis 6 von Young World 1, Annahme).
   Eigener Grundwortschatz je Wortfeld mit eigenen Piktogrammen (assets/bild/), keine Wortliste und keine Bilder aus dem Lehrmittel.
   Die Class vocabulary der Klasse (genaue Testwörter) kommt später über die Wortlisten im Elternbereich (AP-22) und ersetzt diese Auswahl nicht.
   Form wortkarte als Tabelle, Einführung durch Zeigen (erklaerung). Reine Daten, kein Zugriff auf Registry oder Bausteine.
   Format: docs/architektur/modul-schema.md. Prüfen: `tools\lw check englisch-themen`. Aufgaben-IDs nie ändern. */
Lernwelt.modul({
  schema: 1,
  id: 'englisch-themen',                              // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                                  // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Englisch: Wortschatz nach Themen',
  fach: 'englisch',
  bereich: 'englisch.wortschatz',                     // Platz im Forschungsbaum der Spielwelt: <fach>.<name>
  stufen: [3],
  zyklus: 2,
  lp21: ['FS1E.1.A.1.a', 'FS1E.1.A.1.b', 'FS1E.4.A.1.a', 'FS1E.5.B.1.a'],   // aus docs/recherche/curriculum-map.json (Hören, Schreiben, Wortschatz). Vor der Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: 'Young World 1 (Annahme, bei der Lehrperson bestätigen)', kapitel: 'Units 1 bis 6' },
  sprache: { fremd: 'en-GB', mutter: 'de-CH' },       // britisches Englisch, Schweizer Hochdeutsch
  assets: { bild: 'assets/bild/', audio: 'assets/audio/' },
  optionen: { schreiben: false },                     // Diktat nur auf Wunsch: Die Lehrperson verlangt das Schreiben der Wörter noch nicht

  lernziele: [
    { id: 'lz1', text: 'Ich kann Familienmitglieder und Haustiere auf Englisch benennen.' },
    { id: 'lz2', text: 'Ich kann Körperteile auf Englisch benennen und auf einem Bild zeigen.' },
    { id: 'lz3', text: 'Ich kann Obst, Gemüse, Brot, Milchprodukte und Getränke auf Englisch benennen.' },
    { id: 'lz4', text: 'Ich kann Wetter, Kleidungsstücke und Jahreszeiten auf Englisch benennen.' },
    { id: 'lz5', text: 'Ich kann Tageszeiten, Wochentage und einfache Uhrzeiten (volle Stunde, fünf nach, zehn nach) auf Englisch verstehen und benennen.' },
    { id: 'lz6', text: 'Ich kann Zimmer und Möbel benennen und sagen, wo etwas ist (in, on, under, next to).' },
    { id: 'lz7', text: 'Ich verstehe die englischen Wörter dieser Themen, wenn ich sie höre, und finde das passende Bild.' },
    { id: 'lz8', text: 'Ich kann die englischen Wörter dieser Themen aufschreiben, wenn ich sie höre.' }
  ],

  wege: {
    wortkarte: { titel: 'Wort mit Bild und Ton lernen', quelle: 'Young World 1, Wortschatzseiten der Unit (Seite offen)', geprueft: null }     // TODO: gegen das Lehrmittel abgleichen
  },

  standard: {
    einfuehrung: 'erklaerung',                        // Wortschatz lässt sich nicht erraten: zuerst zeigen, nach drei anderen Paketen abfragen
    leiter: [
      { box: 0, typ: 'karteikarten' },
      { box: 1, typ: 'hoeren', ersatz: 'multiple-choice' },
      { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' },
      { box: 4, typ: 'diktat', wenn: 'schreiben', ersatz: 'multiple-choice' }
    ],
    neuProTag: 4
  },

  themen: [
    // ---- Unit 1 (Annahme): Familie und Haustiere. Gilt für das Kind seit Schuljahresbeginn, daher als einziges Thema an.
    { id: 'familie-haustiere', titel: 'Family and pets', ziele: ['lz1', 'lz7', 'lz8'],
      geltung: 'Wortfeld der wahrscheinlichen Unit 1 «You and me» von Young World 1 (Ausgabe ab 2018). Ist von Anfang an eingeschaltet, weil die Unit nach dem Jahresplan im August und September lag.',
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Bei mother, father, brother, grandmother und grandfather liegt die Zungenspitze beim th zwischen den Zähnen.',
        'Stell dir die Person oder das Tier vor und sage das englische Wort dazu.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['mother',      'mother',      'die Mutter',      null],
        ['father',      'father',      'der Vater',       null],
        ['brother',     'brother',     'der Bruder',      null],
        ['sister',      'sister',      'die Schwester',   null],
        ['grandmother', 'grandmother', 'die Grossmutter', null],
        ['grandfather', 'grandfather', 'der Grossvater',  null],
        ['baby',        'baby',        'das Baby',        null],
        ['family',      'family',      'die Familie',     null],
        ['dog',         'dog',         'der Hund',        'dog.svg'],
        ['cat',         'cat',         'die Katze',       'cat.svg'],
        ['rabbit',      'rabbit',      'das Kaninchen',   'rabbit.svg'],
        ['hamster',     'hamster',     'der Hamster',     'hamster.svg'],
        ['fish',        'fish',        'der Fisch',       'fish.svg'],
        ['bird',        'bird',        'der Vogel',       'bird.svg']
      ] } } },

    // ---- Unit 2 (Annahme): Körperteile. Noch nicht im Unterricht: aus, bis die Eltern es einschalten (R21, R44).
    { id: 'koerper', titel: 'Body parts', ziele: ['lz2', 'lz7', 'lz8'], aktiv: false,
      geltung: 'Wortfeld der wahrscheinlichen Unit 2 «My body» von Young World 1 (Ausgabe ab 2018). Einschalten, sobald die Klasse die Unit im Unterricht hatte. Die Lehrperson kann sagen, wo die Klasse steht.',
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Zeige beim Sprechen auf den eigenen Körper: auf den Kopf, die Hand, das Knie.',
        'Sage das Wort noch einmal, ohne zu zeigen.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['body',   'body',   'der Körper',  null],
        ['head',   'head',   'der Kopf',    'head.svg'],
        ['face',   'face',   'das Gesicht', null],
        ['hair',   'hair',   'die Haare',   'hair.svg'],
        ['eye',    'eye',    'das Auge',    'eye.svg'],
        ['ear',    'ear',    'das Ohr',     'ear.svg'],
        ['nose',   'nose',   'die Nase',    'nose.svg'],
        ['mouth',  'mouth',  'der Mund',    'mouth.svg'],
        ['neck',   'neck',   'der Hals',    null],
        ['arm',    'arm',    'der Arm',     'arm.svg'],
        ['hand',   'hand',   'die Hand',    'hand.svg'],
        ['finger', 'finger', 'der Finger',  'finger.svg'],
        ['leg',    'leg',    'das Bein',    'leg.svg'],
        ['knee',   'knee',   'das Knie',    'knee.svg'],
        ['foot',   'foot',   'der Fuss',    'foot.svg']
      ] } } },

    // ---- Unit 3 (Annahme): Essen und Trinken.
    { id: 'essen-trinken', titel: 'Food and drink', ziele: ['lz3', 'lz7', 'lz8'], aktiv: false,
      geltung: 'Wortfeld der wahrscheinlichen Unit 3 «Apples and crisps» von Young World 1 (Ausgabe ab 2018). Einschalten, sobald die Klasse die Unit im Unterricht hatte. Die Lehrperson kann sagen, wo die Klasse steht.',
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Denke an das Essen oder Getränk und sage das englische Wort dazu.',
        'Bei crisps: Gemeint sind Kartoffelchips.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['apple',     'apple',     'der Apfel',     'apple.svg'],
        ['banana',    'banana',    'die Banane',    'banana.svg'],
        ['orange',    'orange',    'die Orange',    'orange.svg'],
        ['carrot',    'carrot',    'die Karotte',   'carrot.svg'],
        ['tomato',    'tomato',    'die Tomate',    'tomato.svg'],
        ['potato',    'potato',    'die Kartoffel', 'potato.svg'],
        ['bread',     'bread',     'das Brot',      'bread.svg'],
        ['cheese',    'cheese',    'der Käse',      'cheese.svg'],
        ['egg',       'egg',       'das Ei',        'egg.svg'],
        ['meat',      'meat',      'das Fleisch',   null],
        ['milk',      'milk',      'die Milch',     'milk.svg'],
        ['water',     'water',     'das Wasser',    'water.svg'],
        ['juice',     'juice',     'der Saft',      null],
        ['pizza',     'pizza',     'die Pizza',     'pizza.svg'],
        ['cake',      'cake',      'der Kuchen',    'cake.svg'],
        ['crisps',    'crisps',    'die Chips',     'crisps.svg'],
        ['chocolate', 'chocolate', 'die Schokolade', null]
      ] } } },

    // ---- Unit 4 (Annahme): Wetter, Kleidung und Jahreszeiten. Monate bleiben aus, sie sind nur «falls im Unterricht eingeführt» belegt.
    { id: 'wetter-kleidung', titel: 'Weather and clothes', ziele: ['lz4', 'lz7', 'lz8'], aktiv: false,
      geltung: 'Wortfeld der wahrscheinlichen Unit 4 «Through the year» von Young World 1 (Ausgabe ab 2018). Einschalten, sobald die Klasse die Unit im Unterricht hatte. Die Lehrperson kann sagen, wo die Klasse steht.',
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Denke an das Wetter draussen oder an die Kleidung im Schrank und sage das englische Wort dazu.',
        'Sage das Wort noch einmal, ohne auf das Bild zu schauen.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['sunny',    'sunny',    'sonnig',         'sunny.svg'],
        ['rainy',    'rainy',    'regnerisch',     'rainy.svg'],
        ['cloudy',   'cloudy',   'bewölkt',        'cloudy.svg'],
        ['windy',    'windy',    'windig',         'windy.svg'],
        ['snowy',    'snowy',    'verschneit',     'snowy.svg'],
        ['spring',   'spring',   'der Frühling',   null],
        ['summer',   'summer',   'der Sommer',     null],
        ['autumn',   'autumn',   'der Herbst',     null],
        ['winter',   'winter',   'der Winter',     null],
        ['tshirt',   'T-shirt',  'das T-Shirt',    'tshirt.svg'],
        ['jumper',   'jumper',   'der Pullover',   'jumper.svg'],
        ['trousers', 'trousers', 'die Hose',       'trousers.svg'],
        ['jacket',   'jacket',   'die Jacke',      'jacket.svg'],
        ['hat',      'hat',      'die Mütze',      'hat.svg'],
        ['scarf',    'scarf',    'der Schal',      'scarf.svg'],
        ['shoes',    'shoes',    'die Schuhe',     'shoes.svg']
      ] } } },

    // ---- Unit 5 (Annahme): Tageszeiten, Wochentage und Uhrzeiten (volle Stunde, fünf nach, zehn nach). Viertel und halb bleiben aus (nicht belegt).
    { id: 'tageszeit-uhr', titel: 'Time and the day', ziele: ['lz5', 'lz7', 'lz8'], aktiv: false,
      geltung: 'Wortfeld der wahrscheinlichen Unit 5 «Around the clock» von Young World 1 (Ausgabe ab 2018). Einschalten, sobald die Klasse die Unit im Unterricht hatte. Die Lehrperson kann sagen, wo die Klasse steht.',
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Bei den Uhrzeiten: Der kurze Zeiger zeigt die Stunde, der lange Zeiger die Minuten.',
        'Wochentage schreibt man im Englischen mit grossem Anfangsbuchstaben.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['morning',        'morning',           'der Morgen',        'morning.svg'],
        ['afternoon',      'afternoon',         'der Nachmittag',    'afternoon.svg'],
        ['evening',        'evening',           'der Abend',         'evening.svg'],
        ['night',          'night',             'die Nacht',         'night.svg'],
        ['monday',         'Monday',            'der Montag',        null],
        ['tuesday',        'Tuesday',           'der Dienstag',      null],
        ['wednesday',      'Wednesday',         'der Mittwoch',      null],
        ['thursday',       'Thursday',          'der Donnerstag',    null],
        ['friday',         'Friday',            'der Freitag',       null],
        ['saturday',       'Saturday',          'der Samstag',       null],
        ['sunday',         'Sunday',            'der Sonntag',       null],
        ['three-oclock',   "three o'clock",     'drei Uhr',          'three-oclock.svg'],
        ['seven-oclock',   "seven o'clock",     'sieben Uhr',        'seven-oclock.svg'],
        ['ten-oclock',     "ten o'clock",       'zehn Uhr',          'ten-oclock.svg'],
        ['five-past-two',  'five past two',     'fünf nach zwei',    'five-past-two.svg'],
        ['ten-past-eight', 'ten past eight',    'zehn nach acht',    'ten-past-eight.svg']
      ] } } },

    // ---- Unit 6 (Annahme): Haus, Zimmer, Möbel und Präpositionen des Ortes.
    { id: 'haus-moebel', titel: 'House and furniture', ziele: ['lz6', 'lz7', 'lz8'], aktiv: false,
      geltung: 'Wortfeld der wahrscheinlichen Unit 6 «The house» von Young World 1 (Ausgabe ab 2018). Einschalten, sobald die Klasse die Unit im Unterricht hatte. Die Lehrperson kann sagen, wo die Klasse steht.',
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Bei in, on, under und next to: Schau, wo der Ball im Bild liegt, und sage das Wort dazu.',
        'Gehe in Gedanken durch dein Zuhause und nenne die Dinge auf Englisch.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['house',       'house',       'das Haus',          'house.svg'],
        ['kitchen',     'kitchen',     'die Küche',         null],
        ['bathroom',    'bathroom',    'das Badezimmer',    null],
        ['bedroom',     'bedroom',     'das Schlafzimmer',  null],
        ['living-room', 'living room', 'das Wohnzimmer',    null],
        ['garden',      'garden',      'der Garten',        null],
        ['door',        'door',        'die Tür',           'door.svg'],
        ['window',      'window',      'das Fenster',       'window.svg'],
        ['bed',         'bed',         'das Bett',          'bed.svg'],
        ['table',       'table',       'der Tisch',         'table.svg'],
        ['chair',       'chair',       'der Stuhl',         'chair.svg'],
        ['sofa',        'sofa',        'das Sofa',          'sofa.svg'],
        ['lamp',        'lamp',        'die Lampe',         'lamp.svg'],
        ['in',          'in',          'in',                'in.svg'],
        ['on',          'on',          'auf',               'on.svg'],
        ['under',       'under',       'unter',             'under.svg'],
        ['next-to',     'next to',     'neben',             'next-to.svg']
      ] } } }
  ],

  fehlerCodes: {
    'verwechselt-wort': {
      kind: 'Deine Antwort gehört zu einem anderen Wort. Höre das Wort noch einmal und achte auf den Anfang und das Ende.',
      eltern: 'Das Kind hat zwei Wörter des Wortfelds verwechselt, zum Beispiel weil sie ähnlich klingen. Das Wort langsam vorsprechen, das Bild oder die deutsche Bedeutung dazu zeigen und die beiden Wörter nebeneinander sagen lassen.',
      folge: null
    },
    'gross-klein': {
      kind: 'Die Buchstaben stimmen. Prüfe Gross- und Kleinschreibung: Im Englischen schreibt man Wochentage gross, die meisten anderen Wörter klein.',
      eltern: 'Die Buchstaben sind richtig, nur Gross- und Kleinschreibung weicht ab. Im Deutschen werden alle Nomen gross geschrieben, im Englischen nur Namen, Wochentage und Monate. Das ist ein Übertragungsfehler, kein Wissensproblem.',
      folge: null
    }
  },

  pruefung: {                                          // Aufbau der echten Lernkontrolle, Teil für Teil. Das Datum im Elternbereich gewinnt gegen dieses
    datum: null,                                       // TODO: Datum vom Blatt (JJJJ-MM-TT), falls bekannt
    themen: ['*'],
    richtzeitMin: 20,                                  // TODO: Richtzeit vom Blatt, die Teile unten sind eine Annahme
    format: [
      { thema: ['familie-haustiere', 'koerper', 'essen-trinken', 'wetter-kleidung', 'tageszeit-uhr', 'haus-moebel'], typ: 'multiple-choice', anzahl: 10, punkte: 10 },
      { thema: ['familie-haustiere', 'koerper', 'essen-trinken', 'wetter-kleidung', 'tageszeit-uhr', 'haus-moebel'], typ: 'hoeren', anzahl: 6, punkte: 6 }
    ]
  },

  anpassbar: {                                         // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':     { typ: 'bool' },
    'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 },
    'optionen.schreiben': { typ: 'bool' }
  },

  begleitung: [
    'Das Kind spricht jedes neue Wort laut nach, bevor es weitergeht. Bei mother, father und brother liegt die Zungenspitze beim th zwischen den Zähnen, ein Blick in den Spiegel zeigt es.',
    'Beim Start ist nur «Family and pets» eingeschaltet. Die übrigen Themen im Elternbereich einzeln einschalten, sobald die Klasse die Unit im Unterricht hatte. Neue Wörter vor dem Unterricht verwirren eher, als dass sie helfen.',
    'Zehn Minuten am Tag genügen. Im Alltag Dinge zeigen und auf Englisch benennen (Frühstückstisch, Kleiderschrank, Haustier), ohne abzufragen.',
    'Das Schreiben ist ausgeschaltet. Es lässt sich im Elternbereich einschalten, sobald die Lehrperson Wörter schreiben lässt. Ohne Schreiben bleibt der Stand «gefestigt» bewusst unerreichbar, weil man bei einer Auswahl raten kann. Das Diktat wertet nur die genaue Schreibung. Im Lehrplan genügt auf dieser Stufe lautgetreues Schreiben, deshalb gelassen bleiben, wenn ein Wort nicht ganz stimmt.',
    'Die genauen Testwörter der Klasse kommen später über die Wortlisten im Elternbereich dazu. Dieses Modul ersetzt die Wortliste der Klasse nicht, es übt den Grundwortschatz der Wortfelder.'
  ]
});
