/* app/welten/fachinseln/welt.js: die vier Fachinseln (Plan 0.2, E-2010-01 bis E-2010-03). Reine Daten, geprüft von app/pruefung/inhalt-inseln.js.
   Jede Insel hat sechs feste Plätze (zahlen, rechnen, messen, garten, hafen, turm) und einen Platz für neues Land (erweiterung), der hinter dem Nebel liegt.
   Ein Areal nennt in inhalt, welche Themen es trägt: «modul» (alle Themen), «modul/thema» oder «modul/anfang*». Der genaueste Eintrag gewinnt
   (app/welt/areale.js). Ein Platz ohne Themen bleibt leer und unsichtbar. Themen eines Fachs ohne Areal kommen auf das neue Land.
   Die Bauphasen der Areale (Fundament, Rohbau, Ausgebaut) stehen in app/welt/weltregeln.js unter bau. */
Lernwelt.welt({
  id: 'fachinseln',
  titel: 'Fachinseln',
  version: 1,
  art: 'inseln',

  faecher: [
    { fach: 'mathe', insel: 'math', name: 'Mathematik', kultur: 'Zirkelbund', farbe: { kante: '#427b7c', tinte: '#173d43' },
      beschreibung: 'Heller Kalkstein, türkisfarbene Dächer und geometrische Höfe.',
      areale: [
        { platz: 'zahlen', name: 'Zahlen bis 1000', schild: ['Zahlen bis', '1000'], inhalt: ['mathe-zahlraum-1000'],
          text: 'Zahlen bis 1000 lesen, ordnen und vergleichen. Hunderter, Zehner und Einer.' },
        { platz: 'rechnen', name: 'Plus und Minus', schild: ['Plus und', 'Minus'], inhalt: ['mathe-plus-minus-1000'],
          text: 'Plus und Minus bis 1000, im Kopf und schriftlich.' },
        { platz: 'garten', name: 'Einmaleins', schild: ['Einmaleins'], inhalt: ['mathe-einmaleins'],
          text: 'Mal und geteilt mit den Reihen des Einmaleins.' },
        { platz: 'messen', name: 'Längen und Gewichte', schild: ['Längen und', 'Gewichte'],
          inhalt: ['mathe-groessen/laenge-*', 'mathe-groessen/gewicht-*', 'mathe-groessen/masse-*', 'mathe-groessen/einheit-*', 'mathe-groessen/hohlmass-*'],
          text: 'Längen, Gewichte und Liter umwandeln und die passende Einheit wählen.' },
        { platz: 'hafen', name: 'Geld', schild: ['Geld'], inhalt: ['mathe-groessen/geld-*'],
          text: 'Franken und Rappen zählen, umwandeln und damit rechnen.' },
        { platz: 'turm', name: 'Uhrzeit und Zeitdauer', schild: ['Uhrzeit und', 'Zeitdauer'], inhalt: ['mathe-groessen/uhr-*', 'mathe-groessen/zeit*'],
          text: 'Die Uhr lesen und berechnen, wie lange etwas dauert.' }
      ] },
    { fach: 'deutsch', insel: 'de', name: 'Deutsch', kultur: 'Buchhüter', farbe: { kante: '#983e45', tinte: '#52232c' },
      beschreibung: 'Warmer Fachwerkbau, rote Giebeldächer und Höfe zum Lesen und Schreiben.',
      areale: [
        { platz: 'messen', name: 'Rechtschreibung', schild: ['Rechtschreibung'], inhalt: ['deutsch-rechtschreibung'],
          text: 'Untersuchen, wie Wörter geschrieben werden, und schwierige Stellen prüfen.' },
        { platz: 'rechnen', name: 'Sätze und Satzzeichen', schild: ['Sätze und', 'Satzzeichen'],
          inhalt: ['deutsch-satzbau', 'deutsch-wortarten/satzzeichen', 'deutsch-wortarten/satzbau', 'deutsch-wortarten/satzarten'],
          text: 'Sätze bauen, umstellen und mit dem passenden Satzzeichen abschliessen.' },
        { platz: 'garten', name: 'Wortarten und ABC', schild: ['Wortarten', 'und ABC'], inhalt: ['deutsch-wortarten'],
          text: 'Nomen, Verben und Adjektive erkennen und Wörter nach dem ABC ordnen.' }
      ] },
    { fach: 'englisch', insel: 'en', name: 'Englisch', kultur: 'Küstenbund', farbe: { kante: '#3564a4', tinte: '#233b62' },
      beschreibung: 'Helle Küstenhäuser, blaue Schieferdächer und offene Arkaden für Begegnungen.',
      areale: [
        { platz: 'zahlen', name: 'Wörter nach Themen', schild: ['Wörter nach', 'Themen'], inhalt: ['englisch-themen'],
          text: 'Englische Wörter zu Familie, Körper, Essen, Wetter und Haus.' },
        { platz: 'rechnen', name: 'Schule und Zahlen', schild: ['Schule und', 'Zahlen'], inhalt: ['englisch-grundlagen'],
          text: 'Schulsachen, Zahlen, Wochentage und Monate auf Englisch.' },
        { platz: 'garten', name: 'Farben, Formen, Orte', schild: ['Farben, Formen', 'und Orte'], inhalt: ['englisch-farben-formen'],
          text: 'Farben, Formen und Orte auf Englisch benennen und beschreiben.' }
      ] },
    { fach: 'nmg', insel: 'nmg', name: 'NMG', kultur: 'Waldhüter', farbe: { kante: '#427044', tinte: '#24462f' },
      beschreibung: 'Naturstein und Holz, grüne Dächer, Gewächshäuser und offene Forschungspavillons.',
      areale: [
        { platz: 'zahlen', name: 'Vom Korn zur Pasta', schild: ['Vom Korn', 'zur Pasta'], inhalt: ['nmg-korn-pasta'],
          text: 'Wie aus Weizen Mehl und Pasta wird und wer daran arbeitet.' },
        { platz: 'rechnen', name: 'Stoffe und Materialien', schild: ['Stoffe und', 'Materialien'], inhalt: ['nmg-stoffe'],
          text: 'Stoffe ordnen, ihre Eigenschaften vergleichen und Stoffe trennen.' },
        { platz: 'turm', name: 'Früher und heute', schild: ['Früher und', 'heute'], inhalt: ['nmg-zeit'],
          text: 'Den Alltag früher und heute vergleichen und Ereignisse ordnen.' }
      ] }
  ],

  erweiterung: { platz: 'brueche', name: 'Neues Land', schild: ['Neues Land'], text: 'Neue Themen dieses Fachs.' }
});
