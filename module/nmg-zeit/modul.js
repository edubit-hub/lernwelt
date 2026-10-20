/* module/nmg-zeit/modul.js: Zeit und früher (NMG, 3. Klasse): Dauer, Zeitstrahl, Generationen, Altsteinzeit, Fundstücke, Geschichten. Reine Daten, ein einziger Aufruf,
   kein Zugriff auf Registry oder Bausteine. Angelegt mit `tools\lw neu modul` (Vorlage «pruefung»), gefüllt in AP-18e.
   Quelle: Lehrplan 21 Kanton Zug, NMG.9.1 bis 9.4, und die Kernbegriffe der Karte (docs/recherche/curriculum-map.json, Thema «nmg-zeit-frueher-heute»).
   Das Lehrmittel der Klasse ist unbekannt (Verlagsplanung: Quartal 2, Schulwochen 8 bis 16). Darum steht hier nur Lehrplanwortlaut und Allgemeinwissen,
   alles selbst formuliert, keine Aufgabe und kein Text aus einem Lehrmittel. Nicht Stoff der 3. Klasse und darum nicht enthalten: die Jungsteinzeit (NMG.9.2.f).
   Die Epochen Steinzeit bis Neuzeit (NMG.9.1.g) liegen hinter dem Orientierungspunkt und stehen als Vorschau im Thema «epochen» mit aktiv: false.
   Was nur Allgemeinwissen ist (Karte: «wahrscheinlich»), trägt in der Aufgabe den Kommentar «wahrscheinlich».
   Stand: Entwurf. Alle Lösungswege sind ungeprüft (geprueft: null), das setzt nur der Vater nach dem Abgleich mit dem Lehrmittel. */
Lernwelt.modul({
  schema: 1,
  id: 'nmg-zeit',                                // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                             // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Zeit und früher',
  fach: 'nmg',
  bereich: 'nmg.natur',                          // Architektur 4.7: alle NMG-Module füttern den Bereich nmg.natur (ein eigener Bereich bräuchte einen Knoten in der Welt)
  stufen: [3],
  zyklus: 2,
  lp21: ['NMG.9.1.e', 'NMG.9.1.f', 'NMG.9.1.g', 'NMG.9.2.e', 'NMG.9.3.e', 'NMG.9.4.c'],    // aus der Karte, vor Freigabe gegen zg.lehrplan.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  assets: { bild: 'assets/bild/' },

  lernziele: [
    { id: 'lz1', text: 'Ich kann die Dauer von Handlungen schätzen und der Länge nach ordnen.' },
    { id: 'lz2', text: 'Ich kann einen Zeitstrahl lesen und drei Generationen einer Familie darauf einordnen.' },
    { id: 'lz3', text: 'Ich kann sagen, wie Menschen in der Altsteinzeit lebten, und mit heute vergleichen: Was ist gleich geblieben, was hat sich geändert?' },
    { id: 'lz4', text: 'Ich kann erklären, was eine Archäologin macht und wie man aus Fundstücken etwas über früher herausfindet.' },
    { id: 'lz5', text: 'Ich kann erklären, woran sich fiktive von realen Geschichten unterscheiden.' },
    { id: 'lz6', text: 'Ich kann Steinzeit, Antike, Mittelalter und Neuzeit der Reihe nach einordnen.' }
  ],

  wege: {                                        // Lösungswege, «geprueft» setzt der Vater nach dem Abgleich mit dem Lehrmittel, nie ein Agent
    dauer:      { titel: 'Die Dauer schätzen und vergleichen',                 quelle: 'Lehrplan 21, NMG.9.1.e. Seite im Lehrmittel offen', geprueft: null },
    zeitstrahl: { titel: 'Einen Zeitstrahl lesen',                             quelle: 'Lehrplan 21, NMG.9.1.f. Seite im Lehrmittel offen', geprueft: null },
    frueher:    { titel: 'Früher und heute vergleichen',                       quelle: 'Lehrplan 21, NMG.9.2.e. Seite im Lehrmittel offen', geprueft: null },
    fund:       { titel: 'Aus Fundstücken und Quellen Schlüsse ziehen',        quelle: 'Lehrplan 21, NMG.9.3.e. Seite im Lehrmittel offen', geprueft: null },
    geschichte: { titel: 'Erfundene und wirkliche Geschichten unterscheiden',  quelle: 'Lehrplan 21, NMG.9.4.c. Seite im Lehrmittel offen', geprueft: null },
    epochen:    { titel: 'Epochen der Reihe nach einordnen',                   quelle: 'Lehrplan 21, NMG.9.1.g. Seite im Lehrmittel offen', geprueft: null },
    bild:       { titel: 'Ein Bild lesen und beschriften',                     quelle: 'Eigene Formulierung, kein Weg aus dem Lehrmittel',  geprueft: null }
  },

  standard: { einfuehrung: 'vortest', neuProTag: 4 },

  themen: [
    { id: 'dauer', titel: 'Wie lange dauert das?', ziele: ['lz1'],
      leiter: [{ box: 0, typ: 'reihenfolge' }],
      hilfe: { weg: 'dauer', schritte: ['Schätze zuerst, wie lange jede Sache etwa dauert: Sekunden, Minuten, Stunden, Tage oder länger.', 'Ordne von kurz nach lang. Die Einheiten helfen: Sekunde, Minute, Stunde, Tag, Woche, Monat, Jahr.', 'Vergleiche mit etwas, das du kennst: Eine Schullektion dauert etwa 45 Minuten.'] },
      aufgaben: [
        { id: 'dau-einheiten', form: 'abfolge', inhalt: { frage: 'Ordne nach der Dauer: Was dauert am kürzesten, was am längsten?', schritte: ['Eine Minute', 'Eine Stunde', 'Ein Tag', 'Eine Woche'] } },
        { id: 'dau-kalender', form: 'abfolge', inhalt: { frage: 'Ordne nach der Dauer: Was dauert am kürzesten, was am längsten?', schritte: ['Ein Tag', 'Eine Woche', 'Ein Monat', 'Ein Jahr'] } },
        { id: 'dau-putzen', form: 'abfolge', inhalt: { frage: 'Ordne die Tätigkeiten nach der Dauer, die kürzeste zuerst.', schritte: ['Hände waschen', 'Zähne putzen', 'Mittagessen', 'Ein Schultag'] } },
        { id: 'dau-lied', form: 'abfolge', inhalt: { frage: 'Ordne die Tätigkeiten nach der Dauer, die kürzeste zuerst.', schritte: ['Einmal blinzeln', 'Einen Satz lesen', 'Ein Lied hören', 'Einen Spaziergang machen'] } },
        { id: 'dau-schule', form: 'abfolge', inhalt: { frage: 'Ordne die Tätigkeiten nach der Dauer, die kürzeste zuerst.', schritte: ['Einen Schuh binden', 'Das Pausenbrot essen', 'Eine Schullektion', 'Eine Nacht schlafen'] } },
        { id: 'dau-ferien', form: 'abfolge', inhalt: { frage: 'Ordne nach der Dauer, die kürzeste zuerst.', schritte: ['Ein Wochenende', 'Die Herbstferien', 'Ein Schuljahr', 'Die Zeit seit deiner Geburt'] } },
        { id: 'dau-sport', form: 'abfolge', inhalt: { frage: 'Ordne nach der Dauer, die kürzeste zuerst.', schritte: ['Ein Hundert-Meter-Lauf', 'Eine Pause auf dem Pausenplatz', 'Ein Fussballspiel', 'Ein Tag im Schwimmbad'] } },
        { id: 'dau-natur', form: 'abfolge', inhalt: { frage: 'Ordne nach der Dauer, die kürzeste zuerst.', schritte: ['Ein Blitz', 'Ein Gewitter', 'Ein Regentag', 'Ein Winter'] } }
      ] },

    { id: 'zeitstrahl', titel: 'Zeitstrahl und Generationen', ziele: ['lz2'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      aufgaben: [
        { id: 'zei-richtung', form: 'auswahl', inhalt: { frage: 'Ein Zeitstrahl wird wie ein Satz von links nach rechts gelesen. Wo liegt das Frühere?',
            richtig: 'links', falsch: ['rechts', 'in der Mitte', 'ganz unten'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Ein Zeitstrahl läuft von früher nach später, wie ein Satz von links nach rechts.', 'Das Frühere liegt links, das Spätere rechts.'] } },
        { id: 'zei-vergleich', form: 'auswahl', inhalt: { frage: 'Was liegt auf einem Zeitstrahl weiter links: das Jahr 1850 oder das Jahr 1950?',
            richtig: 'das Jahr 1850', falsch: ['das Jahr 1950', 'beide gleich weit links'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Die kleinere Jahreszahl ist früher. 1850 ist früher als 1950.', 'Das Frühere liegt auf dem Zeitstrahl weiter links.'] } },
        { id: 'zei-lage', form: 'auswahl', inhalt: { frage: 'Ein Zeitstrahl beginnt links bei 1900 und endet rechts bei 2000. Wo liegt das Jahr 1990?',
            richtig: 'weit rechts, kurz vor 2000', falsch: ['in der Mitte', 'weit links, kurz nach 1900', 'ganz am rechten Rand, bei 2000'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Von 1900 bis 2000 sind es 100 Jahre. 1990 ist 10 Jahre vor dem Ende.', 'Es liegt also weit rechts, aber nicht ganz am Rand.'] } },
        { id: 'zei-abstand', form: 'auswahl', inhalt: { frage: 'Auf einem Zeitstrahl mit gleichmässiger Einteilung liegen zwei Ereignisse weit auseinander. Was bedeutet das?',
            richtig: 'Zwischen den Ereignissen ist viel Zeit vergangen.',
            falsch: [{ text: 'Man kann nur sagen, welches Ereignis zuerst kam.', code: 'zeitstrahl-abstand' }, 'Das rechte Ereignis war wichtiger.', 'Die Ereignisse geschahen gleichzeitig.'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Der Abstand auf dem Zeitstrahl zeigt, wie viel Zeit dazwischen liegt.', 'Je weiter auseinander, desto mehr Zeit liegt zwischen den Ereignissen.'] } },
        { id: 'zei-zweck', form: 'auswahl', inhalt: { frage: 'Wozu dient ein Zeitstrahl?',
            richtig: 'Man sieht, was früher und was später war und wie viel Zeit dazwischen liegt.',
            falsch: ['Man kann damit die genaue Uhrzeit ablesen.', 'Man sieht, wer die Geschichte erzählt hat.', 'Man rechnet damit Malaufgaben.'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Ein Zeitstrahl ordnet Ereignisse nach der Zeit.', 'Man sieht die Reihenfolge und den Abstand.'] } },
        { id: 'zei-generation', form: 'auswahl', inhalt: { frage: 'Was ist eine Generation?',
            richtig: 'Alle Menschen, die ungefähr zur gleichen Zeit geboren sind.',
            falsch: [{ text: 'Das Alter eines einzelnen Menschen in Jahren.', code: 'generation-jahr' }, { text: 'Ein Jahr auf dem Kalender.', code: 'generation-jahr' }, 'Eine Familie mit Kindern.'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Zu einer Generation gehören Menschen mit ungefähr gleichem Geburtsjahr.', 'In einer Familie sind es zum Beispiel die Kinder, die Eltern und die Grosseltern.'] } },
        { id: 'zei-drei', form: 'auswahl', inhalt: { frage: 'Auf einem Foto sind ein Kind, seine Mutter und seine Grossmutter. Wie viele Generationen sind zu sehen?',
            richtig: 'drei', falsch: ['zwei', 'eine', 'vier'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Das Kind, die Mutter und die Grossmutter sind verschieden alt.', 'Jede gehört zu einer anderen Generation. Das sind drei.'] } },
        { id: 'zei-aelteste', form: 'auswahl', inhalt: { frage: 'Welche Generation ist am ältesten: die Kinder, die Eltern oder die Grosseltern?',
            richtig: 'die Grosseltern', falsch: ['die Eltern', 'die Kinder'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Die Eltern sind älter als die Kinder, und die Grosseltern sind älter als die Eltern.'] } },
        { id: 'zei-jahrgang', form: 'auswahl', inhalt: { frage: 'Eine Grossmutter wurde 1955 geboren, ihre Tochter 1985 und die Enkelin 2016. Wer wurde zuletzt geboren?',
            richtig: 'die Enkelin', falsch: ['die Grossmutter', 'die Tochter'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Vergleiche die Jahreszahlen: 1955, 1985 und 2016.', 'Die grösste Zahl ist das späteste Jahr. 2016 gehört zur Enkelin.'] } },
        { id: 'zei-kind', form: 'auswahl', inhalt: { frage: 'Auf einem Zeitstrahl sind Grosseltern, Eltern und Kind eingetragen. Wo steht das Kind?',
            richtig: 'ganz rechts, weil es zuletzt geboren wurde', falsch: ['ganz links, weil es am kleinsten ist', 'in der Mitte, weil es dazwischen liegt'] },
          hilfe: { weg: 'zeitstrahl', schritte: ['Auf dem Zeitstrahl zählt das Geburtsjahr, nicht die Grösse.', 'Das Kind wurde zuletzt geboren und steht deshalb ganz rechts.'] } }
      ] },

    { id: 'bilder', titel: 'Bilder beschriften', ziele: ['lz2', 'lz3'], einfuehrung: 'erklaerung',
      leiter: [{ box: 0, typ: 'beschriften' }],
      hilfe: { weg: 'bild', schritte: ['Schau zuerst das ganze Bild an und überlege, was gezeigt wird.', 'Tippe einen Punkt an und überlege, was dort zu sehen ist.', 'Auf dem Zeitstrahl liegt das Frühere links und das Spätere rechts. Die älteste Generation steht deshalb links.'] },
      aufgaben: [         // x und y in Prozent der Bildfläche (viewBox des SVG), test.js prüft jeden Punkt gegen die Teile im SVG
        { id: 'bild-familie-1', form: 'beschriftung', inhalt: { bild: 'familie-zeitstrahl.svg', punkte: [
          { x: 20.8, y: 37.5, text: 'Grosseltern' }, { x: 50, y: 37.5, text: 'Eltern' }, { x: 79.2, y: 51, text: 'Ich' }] } },
        { id: 'bild-familie-2', form: 'beschriftung', inhalt: { bild: 'familie-zeitstrahl.svg', punkte: [
          { x: 50, y: 37.5, text: 'Eltern' }, { x: 79.2, y: 51, text: 'Ich' }] } },
        { id: 'bild-familie-3', form: 'beschriftung', inhalt: { bild: 'familie-zeitstrahl.svg', punkte: [
          { x: 20.8, y: 37.5, text: 'Grosseltern' }, { x: 50, y: 37.5, text: 'Eltern' }] } },
        { id: 'bild-stein-1', form: 'beschriftung', inhalt: { bild: 'altsteinzeit.svg', punkte: [
          { x: 25, y: 50.8, text: 'Zelt' }, { x: 48.5, y: 64.6, text: 'Feuerstelle' }, { x: 63.8, y: 38.5, text: 'Speer' },
          { x: 79.2, y: 53.1, text: 'Rentier' }, { x: 25.4, y: 87.7, text: 'Feuerstein (Silex)' }] } },
        { id: 'bild-stein-2', form: 'beschriftung', inhalt: { bild: 'altsteinzeit.svg', punkte: [
          { x: 25, y: 50.8, text: 'Zelt' }, { x: 48.5, y: 64.6, text: 'Feuerstelle' }, { x: 79.2, y: 53.1, text: 'Rentier' }] } },
        { id: 'bild-stein-3', form: 'beschriftung', inhalt: { bild: 'altsteinzeit.svg', punkte: [
          { x: 48.5, y: 64.6, text: 'Feuerstelle' }, { x: 63.8, y: 38.5, text: 'Speer' }, { x: 25.4, y: 87.7, text: 'Feuerstein (Silex)' }] } },
        { id: 'bild-stein-4', form: 'beschriftung', inhalt: { bild: 'altsteinzeit.svg', punkte: [
          { x: 25, y: 50.8, text: 'Zelt' }, { x: 63.8, y: 38.5, text: 'Speer' }, { x: 79.2, y: 53.1, text: 'Rentier' }, { x: 25.4, y: 87.7, text: 'Feuerstein (Silex)' }] } },
        { id: 'bild-stein-5', form: 'beschriftung', inhalt: { bild: 'altsteinzeit.svg', punkte: [
          { x: 25, y: 50.8, text: 'Zelt' }, { x: 48.5, y: 64.6, text: 'Feuerstelle' }, { x: 63.8, y: 38.5, text: 'Speer' }, { x: 79.2, y: 53.1, text: 'Rentier' }] } }
      ] },

    { id: 'altsteinzeit', titel: 'Leben in der Altsteinzeit', ziele: ['lz3'], voraussetzung: ['zeitstrahl'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      aufgaben: [
        { id: 'alt-leben', form: 'auswahl', inhalt: { frage: 'Wie lebten die Menschen in der Altsteinzeit?',
            richtig: 'Sie zogen als Nomaden umher und jagten Tiere.',
            falsch: [{ text: 'Sie wohnten in festen Dörfern und bauten Felder an.', code: 'altsteinzeit-verwechselt' }, 'Sie wohnten in Burgen.', 'Sie lebten in grossen Städten mit Strassen.'] },
          hilfe: { weg: 'frueher', schritte: ['In der Altsteinzeit gab es noch keine Bauern und keine festen Dörfer.', 'Die Menschen waren Nomaden. Sie zogen den Tieren nach, jagten und sammelten Pflanzen.'] } },
        { id: 'alt-nomaden', form: 'auswahl', inhalt: { frage: 'Was sind Nomaden?',
            richtig: 'Menschen, die nicht dauernd am gleichen Ort wohnen, sondern weiterziehen.',
            falsch: ['Menschen, die in Höhlen malen.', 'Menschen, die Häuser aus Stein bauen.', 'Menschen, die Tiere im Stall halten.'] },
          hilfe: { weg: 'frueher', schritte: ['Nomaden bleiben nicht an einem Ort.', 'Sie ziehen weiter, wenn es dort weniger Tiere oder Pflanzen gibt.'] } },
        { id: 'alt-feuer', form: 'auswahl', inhalt: { frage: 'Wozu brauchten die Menschen in der Altsteinzeit das Feuer?',
            richtig: 'Zum Wärmen, zum Kochen und um Raubtiere fernzuhalten.',
            falsch: ['Nur zum Spass am Abend.', 'Zum Schmieden von Eisenwerkzeugen.', 'Zum Heizen eines Hauses mit Zentralheizung.'] },
          hilfe: { weg: 'frueher', schritte: ['Das Feuer gab Wärme und Licht und hielt Raubtiere fern.', 'Auf dem Feuer wurde das Essen gekocht.'] } },
        { id: 'alt-silex', form: 'auswahl', inhalt: { frage: 'Wofür verwendeten die Menschen Silex (Feuerstein)?',
            richtig: 'Für Werkzeuge und Waffen und um Feuer zu machen.',
            falsch: ['Als Schmuck für Häuser.', 'Zum Bauen von Strassen.', 'Als Geld zum Einkaufen.'] },
          hilfe: { weg: 'frueher', schritte: ['Silex lässt sich so behauen, dass er scharfe Kanten hat.', 'Man machte daraus Messer und Speerspitzen. Mit Funken aus Silex konnte man auch Feuer machen.'] } },
        { id: 'alt-speer', form: 'auswahl', inhalt: { frage: 'Wozu diente eine Speerschleuder?',
            richtig: 'Man konnte den Speer damit weiter und kräftiger werfen.',
            falsch: ['Man konnte damit Feuer machen.', 'Man konnte damit Beeren pflücken.', 'Man konnte damit Wasser holen.'] },
          hilfe: { weg: 'frueher', schritte: ['Die Speerschleuder verlängert den Arm beim Werfen.', 'Mit ihr fliegt der Speer weiter und trifft kräftiger.'] } },
        { id: 'alt-rentier', form: 'auswahl', inhalt: { frage: 'Warum war das Rentier für die Menschen der Altsteinzeit wichtig?',
            richtig: 'Sie nutzten Fleisch, Felle und Knochen.',
            falsch: ['Sie ritten darauf.', 'Sie brauchten es als Zugtier für Wagen.', 'Sie hielten es als Haustier im Haus.'] },
          hilfe: { weg: 'frueher', schritte: ['Die Menschen jagten Rentiere.', 'Vom Rentier nutzten sie fast alles: das Fleisch zum Essen, die Felle für Kleider und Zelte, die Knochen für Werkzeuge.'] } },
        { id: 'alt-wohnen', form: 'auswahl', inhalt: { frage: 'Wo wohnten die Menschen der Altsteinzeit oft?',
            richtig: 'In Zelten oder am Eingang von Höhlen.',
            falsch: ['In Häusern mit Ziegeldach.', 'In Burgen auf einem Hügel.', { text: 'In Dörfern mit Feldern daneben.', code: 'altsteinzeit-verwechselt' }] },
          hilfe: { weg: 'frueher', schritte: ['Nomaden brauchen Unterkünfte, die sie leicht wieder verlassen können.', 'Darum wohnten sie in Zelten aus Fellen oder am Eingang von Höhlen.'] } },
        { id: 'alt-kleider', form: 'auswahl', inhalt: { frage: 'Woraus machten die Menschen der Altsteinzeit ihre Kleider?',
            richtig: 'aus Fellen und Leder', falsch: ['aus Baumwolle', 'aus Kunststoff', 'aus gewebter Wolle'] },    // wahrscheinlich: Allgemeinwissen, in der Karte nicht ausdrücklich belegt
          hilfe: { weg: 'frueher', schritte: ['Es gab keine Webstühle und keine Fabriken.', 'Die Menschen nutzten die Felle der gejagten Tiere und nähten sie zusammen.'] } },
        { id: 'alt-dino', form: 'auswahl', inhalt: { frage: 'Gab es in der Altsteinzeit schon Dinosaurier?',
            richtig: 'Nein. Die Dinosaurier waren schon lange ausgestorben.',
            falsch: [{ text: 'Ja, die Menschen jagten Dinosaurier.', code: 'steinzeit-dino' }, { text: 'Ja, aber nur kleine.', code: 'steinzeit-dino' }] },    // wahrscheinlich: Fehlerbild der Karte (Annahme), die Sache selbst ist gesichert
          hilfe: { weg: 'frueher', schritte: ['Die Dinosaurier starben vor mehr als 60 Millionen Jahren aus.', 'Die Menschen der Altsteinzeit lebten viel später. Sie jagten Tiere wie Rentiere und Mammuts.'] } },
        { id: 'alt-gleich', form: 'auswahl', inhalt: { frage: 'Was ist seit der Altsteinzeit gleich geblieben?',
            richtig: 'Menschen brauchen Nahrung, Wärme und Schutz.',
            falsch: ['Menschen kaufen ihr Essen im Laden.', 'Menschen heizen mit Strom.', 'Menschen wohnen in festen Häusern.'] },
          hilfe: { weg: 'frueher', schritte: ['Was Menschen zum Leben brauchen, hat sich nicht geändert: Nahrung, Wärme und Schutz.', 'Geändert hat sich, wie sie das bekommen: früher durch Jagen und Sammeln, heute oft durch Einkaufen und Heizen.'] } }
      ] },

    { id: 'frueher-heute', titel: 'Früher und heute', ziele: ['lz3'], einfuehrung: 'erklaerung', frage: 'Wann gab es das: in der Altsteinzeit, heute oder früher und heute?',
      leiter: [{ box: 0, typ: 'multiple-choice' }, { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      hilfe: { weg: 'frueher', schritte: ['Frage dich: Gab es das in der Altsteinzeit? Gibt es das heute? Oder beides?', 'Was Menschen zum Leben brauchen, ist früher und heute gleich: Nahrung, Wasser, Wärme und Schutz. Wie sie es bekommen, hat sich verändert.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['fh-speer',     'Jagen mit Speer und Speerschleuder', 'In der Altsteinzeit'],
        ['fh-feuerstein', 'Feuer nur mit Feuerstein machen',  'In der Altsteinzeit'],
        ['fh-stein',     'Mit Werkzeugen aus Stein arbeiten',  'In der Altsteinzeit'],
        ['fh-laden',     'Einkaufen im Supermarkt',            'Heute'],
        ['fh-handy',     'Mit dem Handy telefonieren',         'Heute'],
        ['fh-schalter',  'Licht mit einem Schalter anmachen',  'Heute'],
        ['fh-nahrung',   'Nahrung und Wasser brauchen',        'Früher und heute'],
        ['fh-geschichten', 'Sich Geschichten erzählen',        'Früher und heute'],
        ['fh-kaelte',    'Sich vor Kälte schützen',            'Früher und heute']
      ] } } },

    { id: 'fundstuecke', titel: 'Fundstücke und Quellen', ziele: ['lz4'], voraussetzung: ['altsteinzeit'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      aufgaben: [
        { id: 'fun-archaeologie', form: 'auswahl', inhalt: { frage: 'Was macht eine Archäologin?',
            richtig: 'Sie gräbt alte Dinge aus und findet heraus, wie Menschen früher lebten.',
            falsch: ['Sie sammelt Pflanzen für ein Herbarium.', 'Sie sagt das Wetter der Zukunft voraus.', 'Sie baut neue Häuser nach alten Plänen.'] },
          hilfe: { weg: 'fund', schritte: ['Archäologie erforscht die Vergangenheit anhand von Dingen, die im Boden liegen.', 'Aus den Funden schliesst man, wie die Menschen früher lebten.'] } },
        { id: 'fun-fundstueck', form: 'auswahl', inhalt: { frage: 'Was ist ein Fundstück?',
            richtig: 'Ein Gegenstand, der bei einer Ausgrabung gefunden wird.',
            falsch: ['Ein Stück Brot, das übrig geblieben ist.', 'Ein Werkzeug, das die Archäologin benutzt.', 'Ein Foto von einer Ausgrabung.'] },
          hilfe: { weg: 'fund', schritte: ['Fund heisst: etwas wurde gefunden.', 'Ein Fundstück ist ein alter Gegenstand, den man bei einer Ausgrabung entdeckt, zum Beispiel ein Stein mit scharfer Kante.'] } },
        { id: 'fun-ausgrabung', form: 'auswahl', inhalt: { frage: 'Wie gräbt man bei einer Ausgrabung?',
            richtig: 'Vorsichtig, Schicht für Schicht, damit nichts kaputtgeht.',
            falsch: ['Mit einem grossen Bagger so schnell wie möglich.', 'Überall gleich tief, und die Erde wird weggeworfen.', 'Man sucht mit Magneten nach Fundstücken.'] },
          hilfe: { weg: 'fund', schritte: ['Fundstücke sind oft zerbrechlich, und ihre Lage im Boden verrät viel.', 'Deshalb wird vorsichtig und Schicht für Schicht gegraben. Jede Schicht wird untersucht.'] } },
        { id: 'fun-kleider', form: 'auswahl', inhalt: { frage: 'Warum findet man kaum Kleider oder Körbe aus der Altsteinzeit?',
            richtig: 'Sie bestehen aus Stoffen, die im Boden verrotten.',
            falsch: ['Die Menschen hatten damals keine Kleider.', 'Alle Kleider wurden absichtlich verbrannt.', 'Sie sind zu klein, um sie zu finden.'] },
          hilfe: { weg: 'fund', schritte: ['Fell, Leder und Pflanzenfasern verrotten im Boden mit der Zeit.', 'Stein hält viel länger. Darum findet man vor allem Werkzeuge aus Stein.'] } },
        { id: 'fun-sieht', form: 'auswahl', inhalt: { frage: 'Man findet einen Stein mit einer scharfen Kante. Welcher Satz beschreibt, was man sieht?',
            richtig: 'Der Stein hat eine scharfe Kante.',
            falsch: [{ text: 'Damit hat jemand Fleisch geschnitten.', code: 'sehen-vermuten' }, { text: 'Der Stein gehörte einem Jäger.', code: 'sehen-vermuten' }, { text: 'Der Stein wurde im Winter benutzt.', code: 'sehen-vermuten' }] },
          hilfe: { weg: 'fund', schritte: ['Was man sieht, kann man am Fundstück prüfen: Form, Farbe, Kanten.', 'Wofür der Stein gebraucht wurde, sieht man nicht. Das ist eine Vermutung.'] } },
        { id: 'fun-vermutet', form: 'auswahl', inhalt: { frage: 'Man findet einen Stein mit einer scharfen Kante. Welcher Satz ist eine Vermutung?',
            richtig: 'Damit hat jemand Fleisch geschnitten.',
            falsch: [{ text: 'Der Stein hat eine scharfe Kante.', code: 'sehen-vermuten' }, 'Der Stein ist grau.', 'Der Stein lag in einer Schicht Erde.'] },
          hilfe: { weg: 'fund', schritte: ['Eine Vermutung sagt etwas, das man nicht direkt sieht.', 'Dass jemand damit Fleisch geschnitten hat, überlegt man sich aus der scharfen Kante.'] } },
        { id: 'fun-quelle', form: 'auswahl', inhalt: { frage: 'Was ist eine Quelle in der Geschichte?',
            richtig: 'Ein Gegenstand, ein Bild oder ein Text, aus dem man etwas über früher erfährt.',
            falsch: ['Ein Bach, aus dem Wasser kommt.', 'Ein Name für eine Zeit, zum Beispiel «Steinzeit».', 'Der Ort, an dem eine Geschichte erfunden wurde.'] },
          hilfe: { weg: 'fund', schritte: ['Eine Quelle ist etwas, aus dem man etwas über früher erfahren kann.', 'Das kann ein Fundstück, ein altes Bild oder ein alter Text sein.'] } },
        { id: 'fun-neu', form: 'auswahl', inhalt: { frage: 'Ein neuer Fund wird gemacht. Was kann geschehen?',
            richtig: 'Man muss die Geschichte von früher manchmal anders erzählen.',
            falsch: ['Nichts, die Geschichte ist für immer fertig.', 'Der Fund wird nicht beachtet, weil er neu ist.', 'Man muss alle alten Funde wegwerfen.'] },
          hilfe: { weg: 'fund', schritte: ['Man weiss über früher nur so viel, wie die Funde zeigen.', 'Ein neuer Fund kann etwas zeigen, was man nicht wusste. Dann ändert sich die Geschichte.'] } },
        { id: 'fun-ruine', form: 'auswahl', inhalt: { frage: 'Was ist eine Ruine?',
            richtig: 'Ein altes Gebäude, das teilweise zerfallen ist.',
            falsch: ['Ein Haus, das neu gebaut wird.', 'Ein Grab unter der Erde.', 'Ein Museum für alte Dinge.'] },
          hilfe: { weg: 'fund', schritte: ['Eine Ruine ist ein altes Bauwerk, das nicht mehr ganz steht.', 'Von einer Burgruine stehen oft nur noch Mauern.'] } }
      ] },

    { id: 'geschichten', titel: 'Erfunden oder wirklich?', ziele: ['lz5'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      aufgaben: [
        { id: 'ges-fiktiv', form: 'auswahl', inhalt: { frage: 'Was bedeutet «fiktiv»?',
            richtig: 'erfunden, nicht wirklich geschehen', falsch: [{ text: 'wirklich geschehen', code: 'fiktiv-real' }, 'sehr alt', 'sehr spannend'] },
          hilfe: { weg: 'geschichte', schritte: ['Eine fiktive Geschichte hat sich jemand ausgedacht.', 'Sie muss nicht wirklich so geschehen sein.'] } },
        { id: 'ges-real', form: 'auswahl', inhalt: { frage: 'Was bedeutet «real»?',
            richtig: 'wirklich, so ist es geschehen', falsch: [{ text: 'erfunden', code: 'fiktiv-real' }, 'in der Zukunft', 'unmöglich'] },
          hilfe: { weg: 'geschichte', schritte: ['Real heisst wirklich.', 'Eine reale Geschichte ist wirklich geschehen. Dafür gibt es Belege.'] } },
        { id: 'ges-maerchen', form: 'auswahl', inhalt: { frage: 'Ein Märchen erzählt von einem sprechenden Wolf. Ist die Geschichte fiktiv oder real?',
            richtig: 'fiktiv', falsch: [{ text: 'real', code: 'fiktiv-real' }] },
          hilfe: { weg: 'geschichte', schritte: ['Wölfe können nicht sprechen. Diese Geschichte hat sich jemand ausgedacht.', 'Sie ist fiktiv.'] } },
        { id: 'ges-zeitung', form: 'auswahl', inhalt: { frage: 'Eine Zeitung berichtet über ein Fussballspiel von gestern. Ist der Bericht fiktiv oder real?',
            richtig: 'real', falsch: [{ text: 'fiktiv', code: 'fiktiv-real' }] },
          hilfe: { weg: 'geschichte', schritte: ['Das Spiel hat wirklich stattgefunden. Viele Menschen haben es gesehen.', 'Der Bericht beschreibt etwas Wirkliches. Er ist real.'] } },
        { id: 'ges-erlebt', form: 'auswahl', inhalt: { frage: 'Ein Kind erzählt, was es gestern auf dem Schulweg wirklich erlebt hat. Ist das eine reale oder eine fiktive Geschichte?',
            richtig: 'real', falsch: [{ text: 'fiktiv', code: 'fiktiv-real' }] },
          hilfe: { weg: 'geschichte', schritte: ['Das Kind erzählt, was ihm wirklich passiert ist.', 'Die Geschichte ist real.'] } },
        { id: 'ges-drache', form: 'auswahl', inhalt: { frage: 'Ein Film erzählt von einem Drachen, der eine Stadt beschützt. Wie nennt man eine solche Geschichte?',
            richtig: 'eine erfundene (fiktive) Geschichte', falsch: [{ text: 'eine wirkliche (reale) Geschichte', code: 'fiktiv-real' }, 'einen Bericht', 'eine Quelle'] },
          hilfe: { weg: 'geschichte', schritte: ['Drachen gibt es nicht wirklich. Die Geschichte ist ausgedacht.', 'Eine ausgedachte Geschichte nennt man fiktiv.'] } },
        { id: 'ges-sage', form: 'auswahl', inhalt: { frage: 'Eine Sage erzählt von einem Drachen, der in einer Höhle gehaust haben soll. Was stimmt?',
            richtig: 'Sagen werden weitererzählt. Nicht alles daran muss wirklich geschehen sein.',
            falsch: ['Alles in einer Sage ist genau so geschehen.', 'Eine Sage ist immer ein Bericht von Forscherinnen.', 'Sagen erzählen nur von heute.'] },
          hilfe: { weg: 'geschichte', schritte: ['Sagen wurden lange mündlich weitererzählt und dabei oft verändert.', 'Manches kann auf Wirkliches zurückgehen, vieles ist ausgeschmückt.'] } },
        { id: 'ges-pruefen', form: 'auswahl', inhalt: { frage: 'Wie kann man prüfen, ob eine Geschichte wirklich geschehen ist?',
            richtig: 'Man sucht Belege wie Fotos, Dokumente oder Fundstücke.',
            falsch: ['Man fragt, ob die Geschichte spannend ist.', 'Man zählt die Wörter der Geschichte.', 'Man glaubt der Person, die am lautesten erzählt.'] },
          hilfe: { weg: 'geschichte', schritte: ['Wenn etwas wirklich geschehen ist, gibt es Spuren davon.', 'Das sind zum Beispiel Fotos, Berichte, alte Dokumente oder Fundstücke.'] } },
        { id: 'ges-merkmal', form: 'auswahl', inhalt: { frage: 'Welcher Satz passt zu einer fiktiven Geschichte?',
            richtig: 'Die Personen und Ereignisse dürfen erfunden sein.',
            falsch: ['Alles muss mit Belegen bewiesen werden.', 'Sie darf nur von Tatsachen erzählen.', 'Sie muss in der Zeitung stehen.'] },
          hilfe: { weg: 'geschichte', schritte: ['Bei einer fiktiven Geschichte darf sich jemand alles ausdenken.', 'Bei einer realen Geschichte muss es stimmen und man muss es belegen können.'] } }
      ] },

    { id: 'epochen', titel: 'Vorschau: Steinzeit, Antike, Mittelalter, Neuzeit', ziele: ['lz6'], einfuehrung: 'erklaerung', frage: 'Zu welcher Epoche gehört das?',
      aktiv: false,
      geltung: 'Die Epochen Steinzeit, Antike, Mittelalter und Neuzeit gehören im Lehrplan zur Stufe am Ende der 6. Klasse. Ob die Klasse sie schon behandelt, weiss die Lehrperson.',
      leiter: [{ box: 0, typ: 'multiple-choice' }, { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      hilfe: { weg: 'epochen', schritte: ['Die Epochen folgen so aufeinander: Steinzeit, Antike, Mittelalter, Neuzeit. Die Steinzeit ist die früheste.', 'Überlege, was zu der Zeit gehört: Speere und Feuerstein (Steinzeit), Römer und Griechen (Antike), Ritter und Burgen (Mittelalter), Eisenbahn und Computer (Neuzeit).'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [     // Beispiele eigene Wahl (wahrscheinlich), nur die Namen der Epochen sind Lehrplanwortlaut
        ['epo-jagd',     'Jagd mit Speer und Feuerstein',            'Steinzeit'],
        ['epo-zelt',     'Leben in Zelten und Höhlen',               'Steinzeit'],
        ['epo-roemer',   'Römer bauen Strassen und Bäder',           'Antike'],
        ['epo-olympia',  'Olympische Spiele im alten Griechenland',  'Antike'],
        ['epo-ritter',   'Ritter leben auf Burgen',                  'Mittelalter'],
        ['epo-moenche',  'Mönche schreiben Bücher von Hand',         'Mittelalter'],
        ['epo-bahn',     'Die Eisenbahn fährt durch die Schweiz',    'Neuzeit'],
        ['epo-computer', 'Menschen benutzen Computer',               'Neuzeit']
      ] } } }
  ],

  fehlerCodes: {
    'zeitstrahl-abstand': {
      kind:   'Auf einem Zeitstrahl zeigt der Abstand, wie viel Zeit zwischen zwei Ereignissen liegt. Je weiter auseinander, desto mehr Zeit.',
      eltern: 'Der Zeitstrahl wird nur nach der Reihenfolge gelesen, der Abstand wird übersehen (Annahme, nicht belegt). Hilft: gemeinsam die Familie auf einen langen Papierstreifen zeichnen, mit gleichem Abstand für je zehn Jahre.',
      folge:  null
    },
    'generation-jahr': {
      kind:   'Zu einer Generation gehören Menschen, die ungefähr gleich alt sind: die Kinder, die Eltern oder die Grosseltern. Es geht nicht um ein einzelnes Jahr und nicht um das Alter einer einzelnen Person.',
      eltern: 'Generation wird mit Alter oder Jahr gleichgesetzt (Annahme, nicht belegt). Hilft: die eigene Familie aufzeichnen und gemeinsam sagen, wer zu welcher Generation gehört. Das Kind zeigt auf einem Foto Kinder, Eltern und Grosseltern.',
      folge:  null
    },
    'altsteinzeit-verwechselt': {
      kind:   'In der Altsteinzeit gab es noch keine Bauern und keine festen Dörfer. Die Menschen zogen den Tieren nach und sammelten Pflanzen.',
      eltern: 'Verwechselt die Altsteinzeit mit späteren Zeiten (Bauern, Dörfer, Burgen). Hilft: Bilder und Arbeitsblätter ansehen, die zeigen, wie Jäger und Sammler lebten, zum Beispiel vom Museum für Urgeschichte(n) in Zug, und das Kind erzählen lassen.',
      folge:  null
    },
    'steinzeit-dino': {
      kind:   'Die Dinosaurier starben viele Millionen Jahre, bevor es Menschen gab. In der Altsteinzeit lebten Rentiere und Mammuts, keine Dinosaurier.',
      eltern: 'Steinzeit und Dinosaurier werden gleichzeitig gedacht (Annahme, nicht belegt). Hilft: an einem langen Papierstreifen zeigen, wie weit die Dinosaurier von den Menschen entfernt sind, und gemeinsam nachschauen, welche Tiere die Menschen jagten.',
      folge:  null
    },
    'sehen-vermuten': {
      kind:   'Unterscheide: Was siehst du am Fundstück selbst? Was denkst du dir dazu? Das Sichtbare ist sicher, das Gedachte ist eine Vermutung.',
      eltern: 'Beobachtung und Deutung werden vermischt. Hilft: einen Alltagsgegenstand ansehen und zuerst nur sagen, was zu sehen ist, und erst danach vermuten, wofür er gebraucht wurde.',
      folge:  null
    },
    'fiktiv-real': {
      kind:   'Fiktiv heisst erfunden, real heisst wirklich geschehen. Frage dich: Gibt es dafür Belege, zum Beispiel Fotos, Berichte oder Fundstücke?',
      eltern: 'Verwechselt erfundene und wirkliche Geschichten. Hilft: zu einer Geschichte gemeinsam fragen «Wer sagt das?» und «Woher weiss man das?» und ein Märchen, einen Zeitungsbericht und ein eigenes Erlebnis nebeneinanderlegen.',
      folge:  null
    }
  },

  pruefung: {                                    // Aufbau der Lernkontrolle ist eine Annahme: Es wurde keine echte Lernkontrolle der Klasse gefunden (README, offene Punkte)
    datum: null,                                 // setzt der Elternbereich
    themen: ['*'],
    richtzeitMin: 20,                            // Annahme, Format und Zeit vom Blatt der Lehrperson übernehmen (TODO)
    format: [
      { thema: ['zeitstrahl', 'geschichten'],    typ: 'multiple-choice', anzahl: 8, punkte: 8 },
      { thema: ['dauer'],                        typ: 'reihenfolge',     anzahl: 2, punkte: 4 },
      { thema: ['altsteinzeit', 'fundstuecke'],  typ: 'multiple-choice', anzahl: 8, punkte: 8 },
      { thema: ['frueher-heute'],                typ: 'zuordnen',        anzahl: 6, punkte: 6 },
      { thema: ['bilder'],                       typ: 'beschriften',     anzahl: 2, punkte: 6 }
    ]
  },

  anpassbar: {                                   // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':     { typ: 'bool' },
    'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 }
  },

  begleitung: [
    'Dieses Modul erst einschalten, wenn die Klasse das Thema im Unterricht behandelt. Neuer Stoff kommt zuerst aus dem Unterricht, nicht aus der App.',
    'Die eigene Familie ist der beste Zugang: mit Grosseltern oder Eltern über früher sprechen und gemeinsam einen Zeitstrahl mit drei Generationen zeichnen. Das Kind trägt selbst ein, was es herausgefunden hat.',
    'Fragen, woher man etwas weiss: Was siehst du? Was vermutest du? Woran erkennst du, dass es früher so war?',
    'Ein Museumsbesuch ersetzt viele Übungen. Das Museum für Urgeschichte(n) in Zug hat Arbeitsblätter und Suchkarten für die 3. und 4. Klasse, das Angebot vorher auf der Website des Museums prüfen.',
    'Erzählen und Schreiben bleiben ausserhalb der App: Das Kind erzählt in eigenen Worten eine Geschichte aus der Altsteinzeit und sagt dazu, was erfunden und was belegt ist.'
  ]
});
