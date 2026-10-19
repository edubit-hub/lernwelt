/* module/englisch-farben-formen/modul.js: Englisch: Farben, Formen und Orte im Bild (Young World 2, Unit 3 «A world of colour», Mischklasse 3/4, bestätigt am 19.10.2026).
   Angelegt am 2026-10-19 mit `tools\lw neu modul` (Vorlage «wortschatz»), ausgefüllt am 2026-10-19.
   Eigener allgemeiner Grundwortschatz (Farben, Formen, Ortsangaben im Raster mit 3 x 3 Feldern) mit eigenen SVG-Bildern in assets/bild/.
   Keine Wortliste und keine Bilder aus dem Lehrmittel, die Class vocabulary der Klasse kommt später über die Wortlisten im Elternbereich.
   Sechs Themen: farben, formen, orte (Wortkarten), saetze (Lückentext there is / there are), bild-lesen (Auswahl), raster-beschriften (Beschriften).
   Reine Daten, kein Zugriff auf Registry oder Bausteine. Format: docs/architektur/modul-schema.md. Prüfen: `tools\lw check englisch-farben-formen`.
   Aufgaben-IDs nie ändern. Jede Stelle mit TODO ist offen. */
Lernwelt.modul({
  schema: 1,
  id: 'englisch-farben-formen',                              // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Englisch: Farben, Formen und Orte im Bild',
  fach: 'englisch',
  bereich: 'englisch.wortschatz',                            // Platz im Forschungsbaum der Spielwelt: <fach>.<name>
  stufen: [3],                                               // Mischklasse 3/4 (bestätigt am 19.10.2026): Die Klasse arbeitet mit Young World 2, die Drittklässler erhalten eigene Tests («Test 3rd grade»). Angeboten für die 3. Klasse wie die übrigen Module
  zyklus: 2,
  lp21: ['FS1E.1.A.1.a', 'FS1E.2.A.1.a', 'FS1E.4.A.1.a', 'FS1E.5.B.1.a'],   // Beispielwerte aus docs/recherche/curriculum-map.json (Hören, Lesen, Schreiben, Wortschatz): vor der Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: 'Young World 2 (Klett und Balmer, Ausgabe ab 2018)', kapitel: 'Unit 3 «A world of colour»' },
  sprache: { fremd: 'en-GB', mutter: 'de-CH' },              // britisches Englisch, Schweizer Hochdeutsch
  assets: { bild: 'assets/bild/' },
  optionen: { schreiben: false },                            // Diktat nur auf Wunsch: im Elternbereich einschalten, wenn die Lehrperson Wörter schreiben lässt

  lernziele: [
    { id: 'lz1', text: 'Ich kann Farben auf Englisch benennen und verstehen.' },
    { id: 'lz2', text: 'Ich kann Formen auf Englisch benennen und verstehen.' },
    { id: 'lz3', text: 'Ich verstehe Ortsangaben wie «at the top on the left» und finde das richtige Feld in einem Bild mit neun Feldern.' },
    { id: 'lz4', text: 'Ich kann Sätze mit «there is» und «there are» richtig ergänzen.' },
    { id: 'lz5', text: 'Ich verstehe englische Bildbeschreibungen und weiss danach, welche Farbe, welche Form und wie viele Dinge an welchem Ort sind.' },
    { id: 'lz6', text: 'Ich erkenne die englischen Wörter dieser Themen, wenn ich sie höre.' },
    { id: 'lz7', text: 'Ich kann die englischen Wörter dieser Themen aufschreiben, wenn ich sie höre.' }
  ],

  wege: {                                                    // TODO: alle drei Wege gegen das Lehrmittel abgleichen, Seiten eintragen, danach setzen die Eltern geprueft
    wortkarte: { titel: 'Wort mit Bild und Ton lernen', quelle: 'Young World 2, Unit 3, Seite __', geprueft: null },
    raster: { titel: 'Ort im Raster mit Reihe und Spalte bestimmen', quelle: 'Young World 2, Unit 3, Seite __', geprueft: null },
    satz: { titel: 'Bildbeschreibung lesen: there is und there are', quelle: 'Young World 2, Unit 3, Seite __', geprueft: null }
  },

  standard: {
    einfuehrung: 'erklaerung',                               // Wortschatz lässt sich nicht erraten: zuerst zeigen, nach drei anderen Paketen abfragen
    leiter: [
      { box: 0, typ: 'karteikarten' },
      { box: 1, typ: 'hoeren', ersatz: 'multiple-choice' },
      { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' },
      { box: 4, typ: 'diktat', wenn: 'schreiben', ersatz: 'multiple-choice' }
    ],
    neuProTag: 4
  },

  themen: [
    // ---- Wörter: Farben. Der Farbfleck trägt die echte Farbe (nur in der SVG-Datei).
    { id: 'farben', titel: 'Colours', ziele: ['lz1', 'lz6', 'lz7'],
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Schau den Farbfleck an und sage das englische Wort dazu.',
        'Bei colour schreibt man im britischen Englisch «ou». Bei purple endet das Wort wie apple auf «ple».'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['red',    'red',    'rot',        'red.svg'],
        ['blue',   'blue',   'blau',       'blue.svg'],
        ['green',  'green',  'grün',       'green.svg'],
        ['yellow', 'yellow', 'gelb',       'yellow.svg'],
        ['orange', 'orange', 'orange',     'orange.svg'],
        ['purple', 'purple', 'lila',       'purple.svg'],
        ['pink',   'pink',   'rosa',       'pink.svg'],
        ['brown',  'brown',  'braun',      'brown.svg'],
        ['black',  'black',  'schwarz',    'black.svg'],
        ['white',  'white',  'weiss',      'white.svg'],
        ['grey',   'grey',   'grau',       'grey.svg'],
        ['colour', 'colour', 'die Farbe',  'colour.svg']
      ] } } },

    // ---- Wörter: Formen. Die Bilder haben bewusst keinen Farbbezug (helle Fläche, dunkle Linie).
    { id: 'formen', titel: 'Shapes', ziele: ['lz2', 'lz6', 'lz7'],
      hilfe: { weg: 'wortkarte', schritte: [
        'Höre das Wort und sprich es laut nach.',
        'Schau die Form an und fahre sie mit dem Finger nach.',
        'Ein triangle hat drei Ecken, ein square vier gleich lange Seiten und ein rectangle vier Seiten, zwei lange und zwei kurze.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['square',    'square',    'das Quadrat',  'square.svg'],
        ['circle',    'circle',    'der Kreis',    'circle.svg'],
        ['triangle',  'triangle',  'das Dreieck',  'triangle.svg'],
        ['rectangle', 'rectangle', 'das Rechteck', 'rectangle.svg'],
        ['star',      'star',      'der Stern',    'star.svg'],
        ['heart',     'heart',     'das Herz',     'heart.svg'],
        ['line',      'line',      'die Linie',    'line.svg'],
        ['stripe',    'stripe',    'der Streifen', 'stripe.svg'],
        ['dot',       'dot',       'der Punkt',    'dot.svg'],
        ['shape',     'shape',     'die Form',     'shape.svg']
      ] } } },

    // ---- Wörter: Ortsangaben. Neun Wendungen für die Felder eines Rasters mit 3 x 3 Feldern (Bild: genau ein Feld dunkel) und vier Grundwörter ohne Bild.
    //      Die Grundwörter haben kein Bild: Ein Streifen im Raster würde bei der Bildauswahl auch das Feld zeigen, das gemeint ist (zwei richtige Antworten).
    { id: 'orte', titel: 'Where is it?', ziele: ['lz3', 'lz6', 'lz7'],
      hilfe: { weg: 'raster', schritte: [
        'Höre die Wendung und sprich sie laut nach.',
        'Stell dir das Bild mit neun Feldern vor: drei Reihen und drei Spalten.',
        'Zerlege die Wendung in zwei Teile: oben, in der Mitte oder unten, und links, in der Mitte oder rechts.'
      ] },
      aufgaben: { tabelle: { form: 'wortkarte', spalten: ['id', 'fremd', 'mutter', 'bild'], zeilen: [
        ['top-left',      'at the top on the left',       'oben links',          'top-left.svg'],
        ['top-middle',    'at the top in the middle',     'oben in der Mitte',   'top-middle.svg'],
        ['top-right',     'at the top on the right',      'oben rechts',         'top-right.svg'],
        ['left-middle',   'on the left in the middle',    'links in der Mitte',  'left-middle.svg'],
        ['middle',        'in the middle',                'in der Mitte',        'middle.svg'],
        ['right-middle',  'on the right in the middle',   'rechts in der Mitte', 'right-middle.svg'],
        ['bottom-left',   'at the bottom on the left',    'unten links',         'bottom-left.svg'],
        ['bottom-middle', 'at the bottom in the middle',  'unten in der Mitte',  'bottom-middle.svg'],
        ['bottom-right',  'at the bottom on the right',   'unten rechts',        'bottom-right.svg'],
        ['at-the-top',    'at the top',                   'oben',                null],
        ['at-the-bottom', 'at the bottom',                'unten',               null],
        ['on-the-left',   'on the left',                  'links',               null],
        ['on-the-right',  'on the right',                 'rechts',              null]
      ] } } },

    // ---- Sätze: there is / there are. Lücke mit Auswahl is oder are, zwei Sätze haben zwei Lücken. Vortest: Das Kind kann es aus a, one oder der Zahl herleiten.
    { id: 'saetze', titel: 'There is / there are', ziele: ['lz4', 'lz5'],
      einfuehrung: 'vortest',
      leiter: [{ box: 0, typ: 'lueckentext' }],
      hilfe: { weg: 'satz', schritte: [
        'Schau, was vor dem Gegenstand steht.',
        'Steht dort a, an oder one, passt is.',
        'Steht dort two, three oder eine andere Zahl, passt are. Das Wort für den Gegenstand endet dann meist auf s.'
      ] },
      aufgaben: [
        { id: 'red-circle', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {is} a red circle in the middle.', luecken: [{ ablenker: ['are'] }] } },
        { id: 'blue-stars', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {are} two blue stars at the top on the left.', luecken: [{ ablenker: ['is'] }] } },
        { id: 'green-square', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {is} a green square at the bottom on the right.', luecken: [{ ablenker: ['are'] }] } },
        { id: 'yellow-triangles', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {are} three yellow triangles at the top in the middle.', luecken: [{ ablenker: ['is'] }] } },
        { id: 'orange-heart', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {is} an orange heart on the left in the middle.', luecken: [{ ablenker: ['are'] }] } },
        { id: 'purple-rectangles', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {are} two purple rectangles at the bottom on the left.', luecken: [{ ablenker: ['is'] }] } },
        { id: 'pink-star', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {is} a pink star on the right in the middle.', luecken: [{ ablenker: ['are'] }] } },
        { id: 'brown-dots', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {are} four brown dots at the top on the right.', luecken: [{ ablenker: ['is'] }] } },
        { id: 'grey-line', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {is} a grey line at the bottom in the middle.', luecken: [{ ablenker: ['are'] }] } },
        { id: 'black-hearts', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {are} two black hearts on the right in the middle.', luecken: [{ ablenker: ['is'] }] } },
        { id: 'white-triangle', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {is} one white triangle in the middle.', luecken: [{ ablenker: ['are'] }] } },
        { id: 'green-circles', form: 'satz', schwierigkeit: 1, inhalt: { text: 'There {are} three green circles on the left in the middle.', luecken: [{ ablenker: ['is'] }] } },
        { id: 'square-and-circles', form: 'satz', schwierigkeit: 2, inhalt: { text: 'There {is} a red square at the top on the left and there {are} two blue circles at the bottom on the right.', luecken: [{ ablenker: ['are'] }, { ablenker: ['is'] }] } },
        { id: 'stars-and-heart', form: 'satz', schwierigkeit: 2, inhalt: { text: 'There {are} two yellow stars in the middle and there {is} a purple heart at the bottom on the left.', luecken: [{ ablenker: ['is'] }, { ablenker: ['are'] }] } }
      ] },

    // ---- Lesen: ein englischer Satz beschreibt Farbe, Form, Anzahl und Ort. Gefragt ist der Ort, die Farbe, die Form oder die Anzahl auf Deutsch,
    //      oder zu einer deutschen Beschreibung der passende englische Satz. Falsche Antworten tragen den Fehlercode der Verwechslung.
    { id: 'bild-lesen', titel: 'Read and find', ziele: ['lz1', 'lz2', 'lz3', 'lz4', 'lz5'], voraussetzung: ['orte'],
      einfuehrung: 'vortest',
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      hilfe: { weg: 'satz', schritte: [
        'Lies den Satz langsam. Suche zuerst die Farbe und die Form.',
        'Dann die Zahl: a, an und one stehen für einen Gegenstand, two für zwei, three für drei.',
        'Zuletzt der Ort: left ist links, right ist rechts, top ist oben, bottom ist unten, middle ist die Mitte.'
      ] },
      aufgaben: [
        // Ort auf Deutsch (jedes der neun Felder einmal)
        { id: 'ort-oben-links', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is a blue circle at the top on the left.» Wo liegt der Kreis?', richtig: 'oben links',
          falsch: [{ text: 'oben rechts', code: 'links-rechts' }, { text: 'unten links', code: 'oben-unten' }, 'in der Mitte'] } },
        { id: 'ort-unten-rechts', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There are two red stars at the bottom on the right.» Wo liegen die Sterne?', richtig: 'unten rechts',
          falsch: [{ text: 'unten links', code: 'links-rechts' }, { text: 'oben rechts', code: 'oben-unten' }, 'unten in der Mitte'] } },
        { id: 'ort-oben-mitte', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: '«There is a green triangle at the top in the middle.» Wo liegt das Dreieck?', richtig: 'oben in der Mitte',
          falsch: [{ text: 'unten in der Mitte', code: 'oben-unten' }, 'in der Mitte', 'oben links'] } },
        { id: 'ort-links-mitte', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: '«There are three yellow hearts on the left in the middle.» Wo liegen die Herzen?', richtig: 'links in der Mitte',
          falsch: [{ text: 'rechts in der Mitte', code: 'links-rechts' }, 'in der Mitte', 'oben links'] } },
        { id: 'ort-mitte', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is an orange rectangle in the middle.» Wo liegt das Rechteck?', richtig: 'in der Mitte',
          falsch: ['oben in der Mitte', 'links in der Mitte', 'unten in der Mitte'] } },
        { id: 'ort-unten-links', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is a purple square at the bottom on the left.» Wo liegt das Quadrat?', richtig: 'unten links',
          falsch: [{ text: 'unten rechts', code: 'links-rechts' }, { text: 'oben links', code: 'oben-unten' }, 'unten in der Mitte'] } },
        { id: 'ort-rechts-mitte', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: '«There are two pink dots on the right in the middle.» Wo liegen die Punkte?', richtig: 'rechts in der Mitte',
          falsch: [{ text: 'links in der Mitte', code: 'links-rechts' }, 'oben rechts', 'in der Mitte'] } },
        { id: 'ort-oben-rechts', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is a brown star at the top on the right.» Wo liegt der Stern?', richtig: 'oben rechts',
          falsch: [{ text: 'oben links', code: 'links-rechts' }, { text: 'unten rechts', code: 'oben-unten' }, 'in der Mitte'] } },
        { id: 'ort-unten-mitte', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: '«There are four black circles at the bottom in the middle.» Wo liegen die Kreise?', richtig: 'unten in der Mitte',
          falsch: [{ text: 'oben in der Mitte', code: 'oben-unten' }, 'unten links', 'in der Mitte'] } },

        // Farbe, Form und Anzahl auf Deutsch
        { id: 'farbe-herz', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is a purple heart at the top on the right.» Welche Farbe hat das Herz?', richtig: 'lila',
          falsch: [{ text: 'rosa', code: 'farbe-verwechselt' }, { text: 'rot', code: 'farbe-verwechselt' }, { text: 'blau', code: 'farbe-verwechselt' }] } },
        { id: 'farbe-rechtecke', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There are two brown rectangles at the bottom on the right.» Welche Farbe haben die Rechtecke?', richtig: 'braun',
          falsch: [{ text: 'schwarz', code: 'farbe-verwechselt' }, { text: 'rot', code: 'farbe-verwechselt' }, { text: 'orange', code: 'farbe-verwechselt' }] } },
        { id: 'farbe-punkte', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There are two orange dots on the left in the middle.» Welche Farbe haben die Punkte?', richtig: 'orange',
          falsch: [{ text: 'gelb', code: 'farbe-verwechselt' }, { text: 'braun', code: 'farbe-verwechselt' }, { text: 'rot', code: 'farbe-verwechselt' }] } },
        { id: 'farbe-linie', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is a grey line at the top on the left.» Welche Farbe hat die Linie?', richtig: 'grau',
          falsch: [{ text: 'schwarz', code: 'farbe-verwechselt' }, { text: 'weiss', code: 'farbe-verwechselt' }, { text: 'braun', code: 'farbe-verwechselt' }] } },
        { id: 'form-dreiecke', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There are two green triangles in the middle.» Welche Form liegt in der Mitte?', richtig: 'Dreiecke',
          falsch: [{ text: 'Rechtecke', code: 'form-verwechselt' }, { text: 'Quadrate', code: 'form-verwechselt' }, { text: 'Kreise', code: 'form-verwechselt' }] } },
        { id: 'form-quadrat', form: 'auswahl', schwierigkeit: 1, inhalt: { frage: '«There is a yellow square on the left in the middle.» Welche Form ist gelb?', richtig: 'das Quadrat',
          falsch: [{ text: 'das Rechteck', code: 'form-verwechselt' }, { text: 'das Dreieck', code: 'form-verwechselt' }, { text: 'der Kreis', code: 'form-verwechselt' }] } },
        { id: 'anzahl-sterne', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: '«There are three blue stars at the bottom on the left.» Wie viele Sterne liegen dort?', richtig: 'drei Sterne',
          falsch: [{ text: 'ein Stern', code: 'einzahl-mehrzahl' }, 'zwei Sterne', 'vier Sterne'] } },
        { id: 'anzahl-kreis', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: '«There is one red circle at the top in the middle.» Wie viele Kreise liegen dort?', richtig: 'ein Kreis',
          falsch: [{ text: 'zwei Kreise', code: 'einzahl-mehrzahl' }, 'drei Kreise', 'vier Kreise'] } },

        // Zu einer deutschen Beschreibung den passenden englischen Satz finden
        { id: 'satz-roter-kreis', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: 'Im Bild liegt ein roter Kreis in der Mitte. Welcher Satz passt?', richtig: 'There is a red circle in the middle.',
          falsch: [{ text: 'There are two red circles in the middle.', code: 'einzahl-mehrzahl' }, { text: 'There is a blue circle in the middle.', code: 'farbe-verwechselt' }, { text: 'There is a red square in the middle.', code: 'form-verwechselt' }] } },
        { id: 'satz-blaue-sterne', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: 'Im Bild liegen zwei blaue Sterne oben links. Welcher Satz passt?', richtig: 'There are two blue stars at the top on the left.',
          falsch: [{ text: 'There are two blue stars at the top on the right.', code: 'links-rechts' }, { text: 'There are two blue stars at the bottom on the left.', code: 'oben-unten' }, { text: 'There is a blue star at the top on the left.', code: 'einzahl-mehrzahl' }] } },
        { id: 'satz-gruenes-quadrat', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: 'Im Bild liegt ein grünes Quadrat unten rechts. Welcher Satz passt?', richtig: 'There is a green square at the bottom on the right.',
          falsch: [{ text: 'There is a green square at the bottom on the left.', code: 'links-rechts' }, { text: 'There is a green square at the top on the right.', code: 'oben-unten' }, { text: 'There is a yellow square at the bottom on the right.', code: 'farbe-verwechselt' }] } },
        { id: 'satz-gelbe-dreiecke', form: 'auswahl', schwierigkeit: 3, inhalt: { frage: 'Im Bild liegen drei gelbe Dreiecke links in der Mitte. Welcher Satz passt?', richtig: 'There are three yellow triangles on the left in the middle.',
          falsch: [{ text: 'There are three yellow triangles on the right in the middle.', code: 'links-rechts' }, { text: 'There are three yellow circles on the left in the middle.', code: 'form-verwechselt' }, { text: 'There is a yellow triangle on the left in the middle.', code: 'einzahl-mehrzahl' }] } },
        { id: 'satz-oranges-herz', form: 'auswahl', schwierigkeit: 3, inhalt: { frage: 'Im Bild liegt ein orangefarbenes Herz oben in der Mitte. Welcher Satz passt?', richtig: 'There is an orange heart at the top in the middle.',
          falsch: [{ text: 'There is an orange heart at the bottom in the middle.', code: 'oben-unten' }, { text: 'There is a pink heart at the top in the middle.', code: 'farbe-verwechselt' }, { text: 'There are two orange hearts at the top in the middle.', code: 'einzahl-mehrzahl' }] } },
        { id: 'satz-lila-rechtecke', form: 'auswahl', schwierigkeit: 3, inhalt: { frage: 'Im Bild liegen zwei lila Rechtecke rechts in der Mitte. Welcher Satz passt?', richtig: 'There are two purple rectangles on the right in the middle.',
          falsch: [{ text: 'There are two purple rectangles on the left in the middle.', code: 'links-rechts' }, { text: 'There are two purple stars on the right in the middle.', code: 'form-verwechselt' }, { text: 'There is a purple rectangle on the right in the middle.', code: 'einzahl-mehrzahl' }] } },
        { id: 'satz-schwarzer-punkt', form: 'auswahl', schwierigkeit: 2, inhalt: { frage: 'Im Bild liegt ein schwarzer Punkt unten in der Mitte. Welcher Satz passt?', richtig: 'There is a black dot at the bottom in the middle.',
          falsch: [{ text: 'There is a black dot at the top in the middle.', code: 'oben-unten' }, { text: 'There is a grey dot at the bottom in the middle.', code: 'farbe-verwechselt' }, { text: 'There are two black dots at the bottom in the middle.', code: 'einzahl-mehrzahl' }] } }
      ] },

    // ---- Beschriften: die Felder eines leeren Rasters (assets/bild/raster.svg) mit den englischen Ortsangaben beschriften.
    //      Die Punkte liegen in der Mitte der Felder: x und y sind 20, 50 oder 80 Prozent (Spalte links, Mitte, rechts und Reihe oben, Mitte, unten).
    { id: 'raster-beschriften', titel: 'Label the grid', ziele: ['lz3'], voraussetzung: ['orte'],
      leiter: [{ box: 0, typ: 'beschriften' }],
      hilfe: { weg: 'raster', schritte: [
        'Suche zuerst die Reihe des Punktes: oben, in der Mitte oder unten.',
        'Dann die Spalte: links, in der Mitte oder rechts.',
        'Wähle die Wendung, die zu Reihe und Spalte passt.'
      ] },
      aufgaben: [
        { id: 'rb-ecken', form: 'beschriftung', schwierigkeit: 1, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 20, text: 'at the top on the left' }, { x: 80, y: 20, text: 'at the top on the right' },
          { x: 20, y: 80, text: 'at the bottom on the left' }, { x: 80, y: 80, text: 'at the bottom on the right' }] } },
        { id: 'rb-mitten', form: 'beschriftung', schwierigkeit: 2, inhalt: { bild: 'raster.svg', punkte: [
          { x: 50, y: 20, text: 'at the top in the middle' }, { x: 20, y: 50, text: 'on the left in the middle' },
          { x: 80, y: 50, text: 'on the right in the middle' }, { x: 50, y: 80, text: 'at the bottom in the middle' }] } },
        { id: 'rb-oben', form: 'beschriftung', schwierigkeit: 1, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 20, text: 'at the top on the left' }, { x: 50, y: 20, text: 'at the top in the middle' }, { x: 80, y: 20, text: 'at the top on the right' }] } },
        { id: 'rb-mitte-reihe', form: 'beschriftung', schwierigkeit: 2, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 50, text: 'on the left in the middle' }, { x: 50, y: 50, text: 'in the middle' }, { x: 80, y: 50, text: 'on the right in the middle' }] } },
        { id: 'rb-unten', form: 'beschriftung', schwierigkeit: 1, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 80, text: 'at the bottom on the left' }, { x: 50, y: 80, text: 'at the bottom in the middle' }, { x: 80, y: 80, text: 'at the bottom on the right' }] } },
        { id: 'rb-links', form: 'beschriftung', schwierigkeit: 1, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 20, text: 'at the top on the left' }, { x: 20, y: 50, text: 'on the left in the middle' }, { x: 20, y: 80, text: 'at the bottom on the left' }] } },
        { id: 'rb-mitte-spalte', form: 'beschriftung', schwierigkeit: 2, inhalt: { bild: 'raster.svg', punkte: [
          { x: 50, y: 20, text: 'at the top in the middle' }, { x: 50, y: 50, text: 'in the middle' }, { x: 50, y: 80, text: 'at the bottom in the middle' }] } },
        { id: 'rb-rechts', form: 'beschriftung', schwierigkeit: 1, inhalt: { bild: 'raster.svg', punkte: [
          { x: 80, y: 20, text: 'at the top on the right' }, { x: 80, y: 50, text: 'on the right in the middle' }, { x: 80, y: 80, text: 'at the bottom on the right' }] } },
        { id: 'rb-diagonale', form: 'beschriftung', schwierigkeit: 1, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 20, text: 'at the top on the left' }, { x: 50, y: 50, text: 'in the middle' }, { x: 80, y: 80, text: 'at the bottom on the right' }] } },
        { id: 'rb-kreuz', form: 'beschriftung', schwierigkeit: 2, inhalt: { bild: 'raster.svg', punkte: [
          { x: 50, y: 20, text: 'at the top in the middle' }, { x: 20, y: 50, text: 'on the left in the middle' }, { x: 50, y: 50, text: 'in the middle' },
          { x: 80, y: 50, text: 'on the right in the middle' }, { x: 50, y: 80, text: 'at the bottom in the middle' }] } },
        { id: 'rb-streuung', form: 'beschriftung', schwierigkeit: 3, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 20, text: 'at the top on the left' }, { x: 80, y: 50, text: 'on the right in the middle' }, { x: 50, y: 80, text: 'at the bottom in the middle' },
          { x: 50, y: 50, text: 'in the middle' }, { x: 80, y: 20, text: 'at the top on the right' }, { x: 20, y: 80, text: 'at the bottom on the left' }] } },
        { id: 'rb-rahmen', form: 'beschriftung', schwierigkeit: 3, inhalt: { bild: 'raster.svg', punkte: [
          { x: 20, y: 20, text: 'at the top on the left' }, { x: 50, y: 20, text: 'at the top in the middle' }, { x: 80, y: 20, text: 'at the top on the right' },
          { x: 20, y: 50, text: 'on the left in the middle' }, { x: 80, y: 50, text: 'on the right in the middle' },
          { x: 20, y: 80, text: 'at the bottom on the left' }, { x: 50, y: 80, text: 'at the bottom in the middle' }, { x: 80, y: 80, text: 'at the bottom on the right' }] } }
      ] }
  ],

  fehlerCodes: {                                             // nur Codes, die eine falsche Antwort der Form auswahl (Thema bild-lesen) trägt
    'links-rechts': {
      kind: 'Links und rechts sind vertauscht. Prüfe das Wort: left ist links, right ist rechts.',
      eltern: 'Das Kind hat links und rechts vertauscht. Das passiert oft, wenn eine Ortsangabe nur als Ganzes gemerkt wird. Auf einem gezeichneten Raster mit dem Finger zeigen lassen und left und right einzeln sprechen.',
      folge: null
    },
    'oben-unten': {
      kind: 'Oben und unten sind vertauscht. Prüfe das Wort: top ist oben, bottom ist unten.',
      eltern: 'Das Kind hat oben und unten vertauscht. Ein Raster mit neun Feldern zeichnen und top und bottom an den Rand schreiben lassen. Danach Felder nennen und zeigen lassen.',
      folge: null
    },
    'einzahl-mehrzahl': {
      kind: 'Einzahl und Mehrzahl sind verwechselt. A, an und one stehen für einen Gegenstand, two und three für mehrere. Dazu passt is oder are.',
      eltern: 'Das Kind hat die Anzahl falsch gelesen oder is und are verwechselt. Auf das Wort vor dem Gegenstand achten: a, an oder one für einen, eine Zahl ab two für mehrere.',
      folge: null
    },
    'farbe-verwechselt': {
      kind: 'Die Farbe stimmt nicht. Lies den Satz noch einmal und suche das Farbwort.',
      eltern: 'Das Kind hat eine Farbe verwechselt. Die Farbwörter einzeln am Farbfleck üben, besonders purple, pink, orange, brown und grey.',
      folge: null
    },
    'form-verwechselt': {
      kind: 'Die Form stimmt nicht. Lies den Satz noch einmal und suche das Formwort.',
      eltern: 'Das Kind hat eine Form verwechselt. Die Formwörter an den Bildern üben und die Form mit dem Finger nachfahren lassen, besonders square, rectangle und triangle.',
      folge: null
    }
  },

  pruefung: {                                                // Aufbau der echten Lernkontrolle, Teil für Teil (Test Unit 3, 40 Punkte). Das Datum im Elternbereich gewinnt gegen dieses
    datum: null,                                             // die Unit-3-Prüfung ist vorbei, das Datum der nächsten Lernkontrolle steht im Elternbereich
    themen: ['*'],
    richtzeitMin: 40,                                        // TODO: Annahme, Richtzeit der Lernkontrolle nachfragen
    format: [
      { thema: ['farben', 'formen', 'orte'], typ: 'hoeren', anzahl: 5, punkte: 10 },
      { thema: ['bild-lesen'], typ: 'multiple-choice', anzahl: 8, punkte: 16 },
      { thema: ['farben', 'formen', 'orte'], typ: 'zuordnen', anzahl: 14, punkte: 14 }
    ]
  },

  anpassbar: {                                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':     { typ: 'bool' },
    'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 },
    'optionen.schreiben': { typ: 'bool' }
  },

  begleitung: [
    'Bilder zusammen beschreiben: Ein Bild aus einem Buch oder ein Foto nehmen und abwechselnd einen englischen Satz dazu sagen, zum Beispiel «There is a cat at the top on the left.» Zuerst Farbe und Form nennen, dann den Ort.',
    'Ortsangaben mit dem Finger zeigen: Ein Blatt in neun Felder falten oder zeichnen, eine Wendung wie «at the bottom on the right» sagen und das Kind auf das Feld zeigen lassen. Danach die Rollen tauschen. Links und rechts dabei laut dazusagen.',
    'Die Wörter der Klasse (Class vocabulary) im Elternbereich unter «Listen» eintragen. Dieses Modul ersetzt die Wortliste der Klasse nicht. Es übt den allgemeinen Grundwortschatz zu Farben, Formen und Orten.',
    'Die Reihenfolge beim Üben: zuerst die Wörter (Colours, Shapes, Where is it?), danach die Sätze und die Bildbeschreibungen. Die Themen «Read and find» und «Label the grid» öffnen, sobald die Ortsangaben sitzen. Zehn Minuten am Tag genügen.',
    'Das Schreiben ist ausgeschaltet. Lässt die Lehrperson Wörter schreiben, im Elternbereich einschalten. Dann hört das Kind ein Wort oder eine Wendung und tippt es ein. Das Diktat wertet nur die genaue Schreibung. Im Lehrplan genügt auf dieser Stufe lautgetreues Schreiben, deshalb gelassen bleiben, wenn ein Wort nicht ganz stimmt.',
    'Aussprache: Bei purple, colour und rectangle das Wort langsam vorsprechen und laut nachsprechen lassen. «colour» schreibt man im britischen Englisch mit «ou».'
  ]
});
