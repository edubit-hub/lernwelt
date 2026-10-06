/* module/mathe-groessen/modul.js: Grössen: Geld, Längen, Gewichte, Zeit und Hohlmasse. Reine Daten: ein einziger Aufruf, kein Zugriff auf
   Registry oder Bausteine, damit die Werkzeuge dieses Skript lesen können, bevor irgendetwas anderes geladen ist.
   Stand: Entwurf. Lehrmittel, Lehrplan-Codes, Lösungswege, Sprechweise der Uhr und Prüfungsformat sind ungeprüft (README.md, Offene Punkte).
   Die Aufgaben stehen in generator-geld.js, generator-rechnen.js, generator-umwandeln.js und generator-zeit.js, nur der Einheiten-Stoff (paar) steht hier. */
Lernwelt.modul({
  schema: 1,
  id: 'mathe-groessen',                      // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Grössen',
  fach: 'mathe',
  bereich: 'mathe.groessen',                 // Platz im Forschungsbaum der Spielwelt
  stufen: [3],
  zyklus: 2,
  lp21: ['MA.3.A.1.c', 'MA.3.A.1.d', 'MA.3.A.1.e', 'MA.3.A.2.b', 'MA.3.A.2.c', 'MA.3.A.2.d', 'MA.3.A.2.e', 'MA.3.A.2.f', 'MA.3.B.1.e', 'MA.2.A.3.b'],   // aus der Karte (docs/recherche), vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  dateien: ['generator-geld.js', 'generator-rechnen.js', 'generator-umwandeln.js', 'generator-zeit.js'],
  braucht: ['_gemeinsam/rechnen'],           // gemeinsamer Baustein (Fehlerarten für Zahlen)

  lernziele: [
    { id: 'lz1',  text: 'Ich kann Münzen und Noten zu einem Betrag zusammenzählen und den Betrag mit Fr. und Rp. schreiben.' },
    { id: 'lz2',  text: 'Ich kann einen Betrag mit Münzen und Noten legen.' },
    { id: 'lz3',  text: 'Ich kann Franken in Rappen und Rappen in Franken umwandeln.' },
    { id: 'lz4',  text: 'Ich kann mit Geldbeträgen rechnen und das Rückgeld bestimmen.' },
    { id: 'lz5',  text: 'Ich kann Längen umwandeln: Zentimeter und Millimeter, Meter und Zentimeter, Kilometer und Meter.' },
    { id: 'lz6',  text: 'Ich kann Gewichte umwandeln: Kilogramm und Gramm.' },
    { id: 'lz7',  text: 'Ich kann mit Längen und Gewichten in einer Einheit rechnen.' },
    { id: 'lz8',  text: 'Ich kann für eine Länge oder ein Gewicht die passende Einheit wählen.' },
    { id: 'lz9',  text: 'Ich kann die Uhr auf ganze, halbe und Viertelstunden lesen und einstellen.' },
    { id: 'lz10', text: 'Ich kann die Uhr auf fünf Minuten genau lesen und die Zeit digital schreiben.' },
    { id: 'lz11', text: 'Ich kann Uhrzeiten mit 24 Stunden schreiben.' },
    { id: 'lz12', text: 'Ich kann Zeiteinheiten umwandeln: Stunden und Minuten, Tage und Stunden, Wochen und Tage, Jahre und Monate.' },
    { id: 'lz13', text: 'Ich kann berechnen, wie lange etwas dauert.' },
    { id: 'lz14', text: 'Ich kann Liter und Deziliter umwandeln und für eine Flüssigkeit die passende Einheit wählen.' }
  ],

  wege: {                                    // Lösungswege, «geprueft» setzt der Vater nach dem Abgleich mit dem Lehrmittel, nie ein Agent
    'geld-zaehlen':        { titel: 'Geld zählen: erst die Franken, dann die Rappen', quelle: 'Lehrmittel Seite __', geprueft: null },
    'umwandeln':           { titel: 'Einheiten umwandeln mit der Umwandlungszahl',    quelle: 'Lehrmittel Seite __', geprueft: null },
    'zerlegen':            { titel: 'Schrittweise rechnen: erst die Zehner, dann die Einer', quelle: 'Lehrmittel Seite __', geprueft: null },
    'ergaenzen':           { titel: 'Ergänzen: vom kleineren zum grösseren Wert',    quelle: 'Lehrmittel Seite __', geprueft: null },
    'einheit-vorstellung': { titel: 'Eine Einheit mit einem bekannten Mass vergleichen', quelle: 'Lehrmittel Seite __', geprueft: null },
    'uhr-lesen':           { titel: 'Uhr lesen: erst der Minutenzeiger, dann der Stundenzeiger', quelle: 'Lehrmittel Seite __', geprueft: null },
    'zeitdauer':           { titel: 'Zeitdauer: bis zur vollen Stunde ergänzen',     quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // 'vortest' (zuerst abrufen): bei einem Fehler zeigt der Lösungsweg die Beziehung (1 m = 100 cm)
    leiter: [{ box: 0, typ: 'eingabe' }],    // Rechnen und Umwandeln: immer eigene Eingabe, kein Raten
    optionen: {},
    neuProTag: 5,
    maxSchwierigkeit: 3
  },

  themen: [
    // Geld (Karte «mathe-geld»)
    { id: 'geld-muenzen', titel: 'Münzen zählen und legen', ziele: ['lz1', 'lz2'],
      generator: { name: 'mathe-groessen/geld-betraege', params: { bestand: 'muenzen' } },
      leiter: [{ box: 0, typ: 'geld' }], optionen: { richtung: 'gemischt', summe: 'verdeckt' } },
    { id: 'geld-noten', titel: 'Noten und Münzen zählen und legen', ziele: ['lz1', 'lz2'], voraussetzung: ['geld-muenzen'],
      generator: { name: 'mathe-groessen/geld-betraege', params: { bestand: 'noten' } },
      leiter: [{ box: 0, typ: 'geld' }], optionen: { richtung: 'gemischt', summe: 'verdeckt' } },
    { id: 'geld-umwandeln', titel: 'Franken und Rappen umwandeln', ziele: ['lz3'], voraussetzung: ['geld-muenzen'],
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['fr-rp'] } } },
    { id: 'geld-rechnen-rappen', titel: 'Mit Rappen rechnen', ziele: ['lz4'], voraussetzung: ['geld-muenzen'],
      generator: { name: 'mathe-groessen/geld-rechnen', params: { art: 'rappen' } } },
    { id: 'geld-rechnen-franken', titel: 'Mit Franken rechnen', ziele: ['lz4'],
      generator: { name: 'mathe-groessen/geld-rechnen', params: { art: 'franken' } } },

    // Längen und Gewichte (Karte «mathe-laengen-gewichte»)
    { id: 'laenge-cm-mm', titel: 'Zentimeter und Millimeter', ziele: ['lz5'],
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['cm-mm'] } } },
    { id: 'laenge-m-cm', titel: 'Meter und Zentimeter', ziele: ['lz5'],
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['m-cm'] } } },
    { id: 'laenge-km-m', titel: 'Kilometer und Meter', ziele: ['lz5'],
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['km-m'] } } },
    { id: 'gewicht-kg-g', titel: 'Kilogramm und Gramm', ziele: ['lz6'],
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['kg-g'] } } },
    { id: 'masse-rechnen', titel: 'Rechnen mit Längen und Gewichten', ziele: ['lz7'], voraussetzung: ['laenge-m-cm'],
      generator: { name: 'mathe-groessen/masse-rechnen', params: {} } },
    { id: 'einheit-waehlen', titel: 'Die passende Längeneinheit wählen', ziele: ['lz8'],
      // Auswahl und Zuordnen lassen Raten zu: Aufgaben dieses Themas erreichen höchstens Box 4 (Warnung leiter-raten, siehe README).
      // Längen und Gewichte sind getrennte Themen, damit die Ablenker (die Einheiten der Geschwisteraufgaben) zur Grössenart passen.
      leiter: [{ box: 0, typ: 'zuordnen', ersatz: 'multiple-choice' }, { box: 2, typ: 'multiple-choice' }],
      hilfe: { weg: 'einheit-vorstellung', schritte: [
        'Überlege, wie lang die Sache ungefähr ist.',
        'Ein Fingernagel ist etwa 1 cm breit. Zwei Schritte sind etwa 1 m lang. Ein Spaziergang von etwa 15 Minuten ist ungefähr 1 km lang.',
        'Wähle die Einheit, bei der die Zahl weder sehr gross noch sehr klein wird.'
      ] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts', 'gruppe'], zeilen: [
        ['ew-bleistift',      'Länge eines Bleistifts',            'cm', 'laenge'],
        ['ew-ameise',         'Länge einer Ameise',                'mm', 'laenge'],
        ['ew-muenzdicke',     'Dicke einer Münze',                 'mm', 'laenge'],
        ['ew-bleistift-dicke','Dicke eines Bleistifts',            'mm', 'laenge'],
        ['ew-tisch',          'Höhe eines Schultisches',           'cm', 'laenge'],
        ['ew-lineal',         'Länge eines Lineals',               'cm', 'laenge'],
        ['ew-klassenzimmer',  'Länge des Klassenzimmers',          'm',  'laenge'],
        ['ew-haus',           'Höhe eines Hauses',                 'm',  'laenge'],
        ['ew-zug',            'Länge eines Zuges',                 'm',  'laenge'],
        ['ew-fussballfeld',   'Länge eines Fussballfelds',         'm',  'laenge'],
        ['ew-zug-luzern',     'Entfernung von Zug nach Luzern',    'km', 'laenge'],
        ['ew-zug-bern',       'Entfernung von Zug nach Bern',      'km', 'laenge'],
        ['ew-zuerich-bern',   'Länge der Strecke Zürich–Bern',     'km', 'laenge']
      ] } } },
    { id: 'einheit-gewicht', titel: 'Die passende Gewichtseinheit wählen', ziele: ['lz8'],
      leiter: [{ box: 0, typ: 'zuordnen', ersatz: 'multiple-choice' }, { box: 2, typ: 'multiple-choice' }],
      hilfe: { weg: 'einheit-vorstellung', schritte: [
        'Überlege, wie schwer die Sache ungefähr ist.',
        'Eine Büroklammer wiegt etwa 1 g. Eine Tafel Schokolade wiegt etwa 100 g. Eine Packung Mehl wiegt 1 kg.',
        'Wähle die Einheit, bei der die Zahl weder sehr gross noch sehr klein wird.'
      ] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts', 'gruppe'], zeilen: [
        ['ew-apfel',          'Gewicht eines Apfels',              'g',  'gewicht'],
        ['ew-klammer',        'Gewicht einer Büroklammer',         'g',  'gewicht'],
        ['ew-schoggi',        'Gewicht einer Schokoladentafel',    'g',  'gewicht'],
        ['ew-radiergummi',    'Gewicht eines Radiergummis',        'g',  'gewicht'],
        ['ew-kind-gewicht',   'Gewicht eines Kindes',              'kg', 'gewicht'],
        ['ew-zucker',         'Gewicht eines Zuckerpakets',        'kg', 'gewicht'],
        ['ew-rucksack',       'Gewicht eines vollen Schulrucksacks', 'kg', 'gewicht'],
        ['ew-auto',           'Gewicht eines Autos',               'kg', 'gewicht']
      ] } } },

    // Zeit (Karte «mathe-zeit»): Uhr lesen und einstellen
    { id: 'uhr-viertelstunden', titel: 'Uhr: ganze, halbe und Viertelstunden', ziele: ['lz9'],
      generator: { name: 'mathe-groessen/uhrzeiten', params: { art: 'viertel' } },
      leiter: [{ box: 0, typ: 'uhr' }], optionen: { richtung: 'gemischt', genauigkeit: '5-min', anzeige: 'sprechweise', stunden: 'zwoelf' } },
    { id: 'uhr-digital', titel: 'Uhr auf fünf Minuten genau', ziele: ['lz10'], voraussetzung: ['uhr-viertelstunden'],
      generator: { name: 'mathe-groessen/uhrzeiten', params: { art: 'fuenf' } },
      leiter: [{ box: 0, typ: 'uhr' }], optionen: { richtung: 'gemischt', genauigkeit: '5-min', anzeige: 'digital', stunden: 'zwoelf' } },
    { id: 'uhr-24h', titel: 'Uhrzeiten mit 24 Stunden', ziele: ['lz11'], voraussetzung: ['uhr-digital'],
      generator: { name: 'mathe-groessen/uhrzeiten', params: { art: 'tag' } },
      leiter: [{ box: 0, typ: 'uhr' }], optionen: { richtung: 'gemischt', genauigkeit: '5-min', anzeige: 'digital', stunden: 'vierundzwanzig' } },

    // Zeit, Hohlmasse und Stoff, der vom Lehrmittel oder vom Zeitpunkt im Schuljahr abhängt: aus, bis die Eltern ihn einschalten (R44)
    { id: 'uhr-sprechweise-5', titel: 'Uhr auf fünf Minuten genau, mit Sprechweise', ziele: ['lz10'], voraussetzung: ['uhr-viertelstunden'], aktiv: false,
      geltung: 'Die Sprechweise bei 20 und 40 Minuten («zwanzig nach» oder «zehn vor halb») ist je nach Lehrmittel verschieden. Die Lehrperson weiss, was in der Klasse gilt.',
      generator: { name: 'mathe-groessen/uhrzeiten', params: { art: 'sprechweise5' } },
      leiter: [{ box: 0, typ: 'uhr' }], optionen: { richtung: 'gemischt', genauigkeit: '5-min', anzeige: 'sprechweise', stunden: 'zwoelf' } },
    { id: 'uhr-minuten', titel: 'Uhr auf die Minute genau', ziele: ['lz10'], voraussetzung: ['uhr-digital'], aktiv: false,
      geltung: 'Die Uhr auf die Minute genau kommt je nach Lehrmittel erst später im Schuljahr dran. Die Lehrperson weiss, wann.',
      generator: { name: 'mathe-groessen/uhrzeiten', params: { art: 'minuten' } },
      leiter: [{ box: 0, typ: 'uhr' }], optionen: { richtung: 'gemischt', genauigkeit: '1-min', anzeige: 'digital', stunden: 'zwoelf' } },
    { id: 'zeit-einheiten', titel: 'Zeiteinheiten umwandeln', ziele: ['lz12'], aktiv: false,
      geltung: 'Die Zeiteinheiten gehören nach der Jahresplanung in den späteren Teil des Schuljahres. Die Lehrperson weiss, wann das Thema in der Klasse dran ist.',
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['h-min', 'tag-h', 'woche-tag', 'jahr-monat'] } } },
    { id: 'zeitdauer', titel: 'Wie lange dauert es?', ziele: ['lz13'], voraussetzung: ['uhr-digital'], aktiv: false,
      geltung: 'Die Zeitdauer gehört nach der Jahresplanung in den späteren Teil des Schuljahres. Die Lehrperson weiss, wann das Thema in der Klasse dran ist.',
      generator: { name: 'mathe-groessen/zeitdauer', params: {} } },
    { id: 'hohlmass-l-dl', titel: 'Liter und Deziliter umwandeln', ziele: ['lz14'], aktiv: false,
      geltung: 'Die Hohlmasse gehören nach der Jahresplanung in den späteren Teil des Schuljahres. Die Lehrperson weiss, wann das Thema in der Klasse dran ist.',
      generator: { name: 'mathe-groessen/umwandeln', params: { stufen: ['l-dl'] } } },
    { id: 'hohlmass-einheit', titel: 'Liter oder Deziliter', ziele: ['lz14'], aktiv: false,
      geltung: 'Die Hohlmasse gehören nach der Jahresplanung in den späteren Teil des Schuljahres. Die Lehrperson weiss, wann das Thema in der Klasse dran ist.',
      leiter: [{ box: 0, typ: 'zuordnen', ersatz: 'multiple-choice' }, { box: 2, typ: 'multiple-choice' }],
      hilfe: { weg: 'einheit-vorstellung', schritte: [
        'Ein Trinkglas fasst etwa 2 Deziliter (2 dl). Eine Milchpackung fasst 1 Liter (1 l), das sind 10 Deziliter.',
        'Wähle die Einheit, bei der die Zahl weder sehr gross noch sehr klein wird.'
      ] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts', 'gruppe'], zeilen: [
        ['hm-wasserglas',  'Wasser in einem Trinkglas',          'Deziliter', 'hohlmass'],
        ['hm-tasse',       'Tee in einer Tasse',                 'Deziliter', 'hohlmass'],
        ['hm-suppe',       'Suppe in einem Suppenteller',        'Deziliter', 'hohlmass'],
        ['hm-becher',      'Saft in einem kleinen Becher',       'Deziliter', 'hohlmass'],
        ['hm-milch',       'Milch in einer Milchpackung',        'Liter', 'hohlmass'],
        ['hm-badewanne',   'Wasser in einer Badewanne',          'Liter', 'hohlmass'],
        ['hm-eimer',       'Wasser in einem Putzeimer',          'Liter', 'hohlmass'],
        ['hm-aquarium',    'Wasser in einem Aquarium',           'Liter', 'hohlmass'],
        ['hm-saftflasche', 'Saft in einer grossen Flasche',      'Liter', 'hohlmass']
      ] } } }
  ],

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern
    // Die beiden folgenden Einträge sind Kopien aus _gemeinsam/fehlercodes-rechnen, test.js vergleicht sie mit dem Katalog
    'ziffern-vertauscht': { kind: 'Die Ziffern sind vertauscht. Lies die Zahl noch einmal.', eltern: 'Flüchtigkeit, kein Wissensproblem.', folge: null },
    'zehner-daneben':     { kind: 'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.', eltern: 'Übertrag oder Zehner vergessen.', folge: null },

    // Geld
    'stueck-vergessen': {
      kind: 'Der Betrag ist um ein Stück daneben. Zähle noch einmal und lege gezählte Stücke zur Seite.',
      eltern: 'Zählfehler um genau ein Stück: eines vergessen oder doppelt gezählt. Hilft: die Stücke zuerst nach Wert ordnen und beim Zählen zur Seite legen.',
      folge: null },
    'rappen-als-franken': {
      kind: 'Du hast alles in das Feld für Franken geschrieben. Franken und Rappen haben je ein eigenes Feld.',
      eltern: 'Schreibt den ganzen Betrag in Rappen als Franken (350 Fr. statt 3 Fr. 50 Rp.). Echte Münzen nach Franken und Rappen sortieren lassen und beide Teile getrennt nennen.',
      folge: null },
    'rappen-ohne-null': {
      kind: 'Bei 40 Rp. gehört die Null dazu. 4 Rp. ist ein anderer Betrag.',
      eltern: 'Lässt die Null bei den Rappen weg (5 Fr. 4 Rp. statt 5 Fr. 40 Rp.). Rappen haben zwei Stellen, das mit 10-Rappen-Münzen zeigen.',
      folge: null },
    'franken-rappen-vertauscht': {
      kind: 'Franken und Rappen sind vertauscht. Die Franken stehen links, die Rappen rechts.',
      eltern: 'Trägt die Franken bei den Rappen ein und umgekehrt. Beim Vorlesen die Felder benennen: zuerst die Franken, dann die Rappen.',
      folge: null },
    'rechenzeichen-vertauscht': {
      kind: 'Du hast mit dem falschen Rechenzeichen gerechnet. Lies das Zeichen noch einmal.',
      eltern: 'Rechnet das Gegenteil: Minus statt Plus, Plus statt Minus oder Plus statt Mal. Das Rechenzeichen vor dem Rechnen mit dem Finger markieren lassen.',
      folge: null },

    // Umwandeln
    'umwandlungszahl-falsch': {
      kind: 'Die Umwandlungszahl stimmt nicht. Schau nach, wie viele kleine Einheiten in einer grossen stecken.',
      eltern: 'Verwechselt den Faktor (10, 100, 1000 oder 60). Die Beziehungen (1 m = 100 cm, 1 kg = 1000 g, 1 h = 60 min) lernen und an Beispielen erleben, zum Beispiel mit Massband und Küchenwaage.',
      folge: null },
    'richtung-vertauscht': {
      kind: 'Du hast in die falsche Richtung umgewandelt. Eine kleinere Einheit gibt eine grössere Zahl.',
      eltern: 'Multipliziert statt zu dividieren oder umgekehrt. Merksatz: kleinere Einheit, grössere Zahl. Vor dem Rechnen schätzen lassen, ob die Zahl grösser oder kleiner wird.',
      folge: null },
    'teil-vergessen': {
      kind: 'Es fehlt ein Teil. Wandle beide Teile um und zähle sie zusammen.',
      eltern: 'Wandelt nur den grossen oder nur den kleinen Teil um (3 m 20 cm: nur 300 oder nur 20). Beide Teile untereinander schreiben lassen.',
      folge: null },
    'null-vergessen': {
      kind: 'Bei 3 m 5 cm sind es 305 cm. Zwischen den beiden Teilen gehört eine Null.',
      eltern: 'Schreibt die Teile einfach hintereinander (3 m 5 cm als 35 oder 350). Die Stellenwerttafel hilft: Zehner und Einer der kleinen Einheit haben je einen Platz.',
      folge: null },

    // Zeit
    'hundertersystem': {
      kind: 'Eine Stunde hat 60 Minuten, nicht 100. Rechne zuerst bis zur vollen Stunde und dann weiter.',
      eltern: 'Zieht Uhrzeiten wie gewöhnliche Zahlen ab (9.00 − 8.15 = 85). Mit dem Rechenstrich bis zur vollen Stunde ergänzen lassen.',
      folge: null },
    'zeiger-vertauscht': {
      kind: 'Die Zeiger sind vertauscht. Der kurze Zeiger zeigt die Stunde, der lange die Minuten.',
      eltern: 'Verwechselt Stunden- und Minutenzeiger. An einer echten Uhr üben und beim Ablesen zuerst den langen Zeiger benennen.',
      folge: null },
    'stunde-ab-halb': {
      kind: 'Der kurze Zeiger hat die nächste Zahl noch nicht erreicht. Halb vier ist 3.30 Uhr, die Stunde ist also 3.',
      eltern: 'Bei «halb vier» wird die 4 genannt, gemeint ist aber 3.30 Uhr. Merkhilfe: halb vier ist eine halbe Stunde vor vier Uhr.',
      folge: null },
    'stunde-daneben': {
      kind: 'Die Stunde ist um eins daneben. Der kurze Zeiger wandert mit den Minuten mit.',
      eltern: 'Stundenzeiger um eine Stunde falsch. Der Stundenzeiger steht zwischen zwei Zahlen, es gilt die Zahl, die er zuletzt erreicht hat.',
      folge: null },
    'vor-nach-vertauscht': {
      kind: 'Der lange Zeiger steht auf der falschen Seite. Bei «nach» zeigt er nach rechts (zum Beispiel auf die 3), bei «vor» nach links (zum Beispiel auf die 9).',
      eltern: 'Verwechselt «nach» und «vor» (zum Beispiel Viertel nach und Viertel vor, zehn nach und zehn vor). Bei «nach» ist die Stunde gerade vorbei, bei «vor» kommt die nächste bald.',
      folge: null },
    'stunde-12-statt-24': {
      kind: 'Nach 12 Uhr zählt man weiter: 3 Uhr am Nachmittag heisst 15 Uhr.',
      eltern: 'Schreibt die Stunde der 12er-Uhr, wo die 24-Stunden-Anzeige verlangt ist. Das Dazuzählen von 12 üben: 3 + 12 = 15.',
      folge: null },
    'minute-daneben': {
      kind: 'Die Minuten sind um fünf daneben. Zähle von der 12 aus in Fünferschritten.',
      eltern: 'Der Minutenzeiger ist einen Fünferschritt zu weit oder zu kurz gezählt. Auf dem Zifferblatt von der 12 aus mit 5, 10, 15 mitzählen.',
      folge: null }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 30,                        // TODO: Format der Lernkontrollen (Geld, Längen, Gewichte; später Zeit und Hohlmasse) vom Blatt übernehmen, die Teile unten sind eine Annahme
    format: [                                // Aufbau der echten Lernkontrolle
      { thema: ['geld-muenzen', 'geld-noten'],                                                              typ: 'geld',            anzahl: 4, punkte: 4 },
      { thema: ['geld-umwandeln', 'geld-rechnen-rappen', 'geld-rechnen-franken'],                           typ: 'eingabe',         anzahl: 8, punkte: 8 },
      { thema: ['laenge-cm-mm', 'laenge-m-cm', 'laenge-km-m', 'gewicht-kg-g', 'masse-rechnen'],             typ: 'eingabe',         anzahl: 8, punkte: 8 },
      { thema: ['einheit-waehlen', 'einheit-gewicht', 'hohlmass-einheit'],                                      typ: 'multiple-choice', anzahl: 4, punkte: 4 },
      { thema: ['uhr-viertelstunden', 'uhr-digital', 'uhr-24h'],                                            typ: 'uhr',             anzahl: 6, punkte: 6 },
      { thema: ['zeit-einheiten', 'zeitdauer', 'hohlmass-l-dl'],                                            typ: 'eingabe',         anzahl: 6, punkte: 6 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },     // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 }
  },

  begleitung: [
    'Geld: Münzen und Noten aus dem Portemonnaie sortieren und zählen lassen. Das Kind nennt den Betrag laut, zuerst die Franken, dann die Rappen.',
    'Beim Einkaufen den Preis und das Rückgeld vom Kind ausrechnen lassen. Es ergänzt vom Preis bis zum bezahlten Betrag.',
    'Längen und Gewichte: Das Kind schätzt zuerst und misst oder wägt dann nach (Lineal, Massband, Küchenwaage). Die Einheit gehört immer zur Zahl.',
    'Umwandeln: Die Beziehungen 1 m = 100 cm, 1 km = 1000 m, 1 kg = 1000 g und 1 h = 60 min gehören zum Wissen und kommen immer wieder dran. Bei einem Fehler zuerst die Beziehung nennen lassen.',
    'Uhr: Im Alltag die Uhrzeit laut ablesen lassen («Viertel nach vier», «16.15 Uhr»). Eine Uhr mit Zeigern bevorzugen, nicht nur digitale Anzeigen.',
    'Sprechweise und Schreibweise wie im Lehrmittel der Klasse verwenden. Bei Unsicherheit (zum Beispiel «zwanzig nach» oder «zehn vor halb») die Lehrperson fragen.',
    'Nicht vorsagen. Fragen, womit das Kind anfängt (grosse Stücke zuerst, Minutenzeiger zuerst), und die Hilfe in der App erst nach einem eigenen Versuch öffnen lassen.'
  ]
});
