/* module/nmg-stoffe/modul.js: Stoffe (NMG, 3. Klasse): Eigenschaften, Aggregatzustände, Mischen und Trennen. Reine Daten, ein einziger Aufruf,
   kein Zugriff auf Registry oder Bausteine. Angelegt mit `tools\lw neu modul` (Vorlage «pruefung»), gefüllt in AP-18e.
   Quelle: Lehrplan 21 Kanton Zug, NMG.3.3 und NMG.3.4, und die Kernbegriffe der Karte (docs/recherche/curriculum-map.json, Thema «nmg-stoffe-aggregatzustaende»).
   Das Lehrmittel der Klasse ist unbekannt (Verlagsplanung: Quartal 2, Schulwochen 8 bis 16). Darum steht hier nur Lehrplanwortlaut und Allgemeinwissen,
   alles selbst formuliert, keine Aufgabe und kein Text aus einem Lehrmittel. Die Übergangsnamen erstarren und verdampfen sind unsicher und kommen nicht
   als Prüfbegriff vor (README, offene Punkte). Was nur Allgemeinwissen ist (Karte: «wahrscheinlich»), trägt in der Aufgabe den Kommentar «wahrscheinlich».
   Stand: Entwurf. Alle Lösungswege sind ungeprüft (geprueft: null), das setzt nur der Vater nach dem Abgleich mit dem Lehrmittel. */
Lernwelt.modul({
  schema: 1,
  id: 'nmg-stoffe',                              // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                             // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Stoffe',
  fach: 'nmg',
  bereich: 'nmg.natur',                          // Architektur 4.7: alle NMG-Module füttern den Bereich nmg.natur
  stufen: [3],
  zyklus: 2,
  lp21: ['NMG.3.3.c', 'NMG.3.3.d', 'NMG.3.4.c'], // aus der Karte, vor Freigabe gegen zg.lehrplan.ch prüfen (auch NMG.3.3.e und NMG.3.4.d kommen vor)
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  assets: { bild: 'assets/bild/' },

  lernziele: [
    { id: 'lz1', text: 'Ich kann Gegenstände und Stoffe nach Material, Form, Farbe, Beschaffenheit und Verwendung ordnen und Eigenschaften wie Glanz und Härte nennen.' },
    { id: 'lz2', text: 'Ich kann mit dem Magneten und mit Wasser forschen und sagen, was angezogen wird und was schwimmt oder sinkt.' },
    { id: 'lz3', text: 'Ich kann fest, flüssig und gasförmig unterscheiden und Beispiele zuordnen.' },
    { id: 'lz4', text: 'Ich kann beschreiben, was beim Schmelzen, Verdunsten und Kondensieren mit dem Wasser geschieht.' },
    { id: 'lz5', text: 'Ich kann erklären, dass ein Stoff beim Mischen und Auflösen nicht verschwindet.' },
    { id: 'lz6', text: 'Ich kann ein Trennverfahren auswählen (sieben, filtrieren, verdunsten, absetzen lassen) und die Schritte eines Versuchs in die richtige Reihenfolge bringen.' },
    { id: 'lz7', text: 'Ich kann sagen, dass Luft ein Stoff ist und Platz braucht.' }
  ],

  wege: {                                        // Lösungswege, «geprueft» setzt der Vater nach dem Abgleich mit dem Lehrmittel, nie ein Agent
    merkmal:  { titel: 'Gegenstände nach einem Merkmal ordnen',     quelle: 'Lehrplan 21, NMG.3.3.c. Seite im Lehrmittel offen', geprueft: null },
    pruefen:  { titel: 'Vermuten, ausprobieren, festhalten',        quelle: 'Lehrplan 21, NMG.3.3.d. Seite im Lehrmittel offen', geprueft: null },
    zustand:  { titel: 'Fest, flüssig und gasförmig unterscheiden', quelle: 'Lehrplan 21, NMG.3.3.e. Seite im Lehrmittel offen', geprueft: null },
    bleibt:   { titel: 'Der Stoff bleibt erhalten',                 quelle: 'Lehrplan 21, NMG.3.4.d. Seite im Lehrmittel offen', geprueft: null },
    trennen:  { titel: 'Ein Trennverfahren wählen',                 quelle: 'Lehrplan 21, NMG.3.4.c. Seite im Lehrmittel offen', geprueft: null },
    bild:     { titel: 'Ein Bild lesen und beschriften',            quelle: 'Eigene Formulierung, kein Weg aus dem Lehrmittel',  geprueft: null },
    luft:     { titel: 'Luft ist ein Stoff',                        quelle: 'Verlagskommentar zur Einheit über Luft. Seite im Lehrmittel offen', geprueft: null }
  },

  standard: { einfuehrung: 'vortest', neuProTag: 4 },

  themen: [
    { id: 'ordnen', titel: 'Ordnen und Eigenschaften', ziele: ['lz1', 'lz2'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      aufgaben: [
        { id: 'ord-holz', form: 'auswahl', inhalt: { frage: 'Ein Kind legt einen hellen Holzlöffel, ein dunkel gebeiztes Brett und eine rot bemalte Holzkiste zusammen. Wonach ordnet es?',
            richtig: 'nach dem Material', falsch: ['nach der Farbe', 'nach der Gestalt (Form)', { text: 'nach dem Verwendungszweck', code: 'merkmal-verwechselt' }] },
          hilfe: { weg: 'merkmal', schritte: ['Schau, was alle drei Gegenstände gemeinsam haben.', 'Sie sind alle aus Holz. Der Stoff, aus dem etwas gemacht ist, heisst Material.', 'Löffel, Brett und Kiste haben verschiedene Farben und Formen und werden für Verschiedenes gebraucht. Darum ordnet das Kind nach dem Material.'] } },
        { id: 'ord-ball', form: 'auswahl', inhalt: { frage: 'Ein Ball, eine Murmel und eine Orange liegen zusammen. Wonach wurden sie geordnet?',
            richtig: 'nach der Gestalt (Form)', falsch: [{ text: 'nach dem Material', code: 'merkmal-verwechselt' }, 'nach der Farbe', 'nach dem Verwendungszweck'] },
          hilfe: { weg: 'merkmal', schritte: ['Alle drei sind rund. Die Gestalt ist die äussere Form eines Gegenstands.', 'Ball, Murmel und Orange sind aus verschiedenem Material und haben verschiedene Farben. Gemeinsam ist nur die runde Gestalt.'] } },
        { id: 'ord-rot', form: 'auswahl', inhalt: { frage: 'Eine Tomate, eine Erdbeere und ein Feuerwehrauto stehen auf dem Tisch. Wonach wurden sie geordnet?',
            richtig: 'nach der Farbe', falsch: ['nach dem Material', 'nach der Gestalt (Form)', { text: 'nach dem Verwendungszweck', code: 'merkmal-verwechselt' }] },
          hilfe: { weg: 'merkmal', schritte: ['Tomate und Erdbeere kann man essen, das Auto nicht. Der Verwendungszweck passt also nicht.', 'Alle drei sind rot. Gemeinsam ist die Farbe.'] } },
        { id: 'ord-putzen', form: 'auswahl', inhalt: { frage: 'Ein Besen, ein Schwamm und ein Putzlappen liegen zusammen. Wonach wurden sie geordnet?',
            richtig: 'nach dem Verwendungszweck', falsch: ['nach der Farbe', 'nach dem Material', { text: 'nach der Gestalt (Form)', code: 'merkmal-verwechselt' }] },
          hilfe: { weg: 'merkmal', schritte: ['Alle drei Gegenstände braucht man zum Putzen. Der Verwendungszweck sagt, wofür man etwas braucht.', 'Sie sind aus verschiedenem Material und sehen verschieden aus.'] } },
        { id: 'ord-weich', form: 'auswahl', inhalt: { frage: 'Ein Kind legt Watte, ein Kuscheltier und eine Wollmütze in die Kiste «weich». Welches Merkmal hat es geprüft?',
            richtig: 'die Beschaffenheit (zum Beispiel weich, hart, rau oder glatt)', falsch: [{ text: 'das Material', code: 'merkmal-verwechselt' }, 'die Farbe', 'die Gestalt (Form)'] },
          hilfe: { weg: 'merkmal', schritte: ['Weich oder hart sagt, wie sich etwas anfühlt.', 'Dieses Merkmal heisst Beschaffenheit. Material, Farbe und Form sind bei den drei Gegenständen verschieden.'] } },
        { id: 'ord-glatt', form: 'auswahl', inhalt: { frage: 'Sandpapier, Baumrinde und ein Stück Kork fühlen sich rau an, ein Spiegel und eine Glasmurmel fühlen sich glatt an. Welches Merkmal wird verglichen?',
            richtig: 'die Beschaffenheit (zum Beispiel weich, hart, rau oder glatt)', falsch: ['die Farbe', { text: 'das Material', code: 'merkmal-verwechselt' }, 'die Gestalt (Form)'] },
          hilfe: { weg: 'merkmal', schritte: ['Rau und glatt sagt, wie sich eine Oberfläche anfühlt.', 'Das Merkmal heisst Beschaffenheit. Rinde, Sandpapier und Kork sind aus verschiedenem Material und trotzdem alle rau.'] } },
        { id: 'ord-metall', form: 'auswahl', inhalt: { frage: 'Ein Eisennagel, ein Stahllöffel und ein Stück Kupferdraht liegen in der Kiste «Metall». Wonach wurden sie geordnet?',
            richtig: 'nach dem Material', falsch: ['nach der Farbe', 'nach der Gestalt (Form)', { text: 'nach dem Verwendungszweck', code: 'merkmal-verwechselt' }] },
          hilfe: { weg: 'merkmal', schritte: ['Eisen, Stahl und Kupfer sind Metalle. Alle drei Gegenstände bestehen aus Metall, auch wenn sie anders aussehen.', 'Der Stoff, aus dem etwas ist, heisst Material. Farbe, Form und Verwendung sind verschieden.'] } },
        { id: 'ord-glanz', form: 'auswahl', inhalt: { frage: 'Ein Kind legt Gegenstände in zwei Kisten: «glänzt» und «glänzt nicht». Welche Eigenschaft prüft es?',
            richtig: 'den Glanz', falsch: ['die Härte', 'die Leitfähigkeit', 'ob der Stoff magnetisch ist'] },
          hilfe: { weg: 'merkmal', schritte: ['Etwas glänzt, wenn die Oberfläche Licht zurückwirft. Blankes Metall glänzt oft, Holz meistens nicht.', 'Die Eigenschaft heisst Glanz.'] } },
        { id: 'ord-haerte', form: 'auswahl', inhalt: { frage: 'Mit dem Fingernagel kann man Kerzenwachs ritzen, Glas nicht. Welche Eigenschaft vergleicht man?',
            richtig: 'die Härte', falsch: ['den Glanz', 'die Farbe', 'die Leitfähigkeit'] },
          hilfe: { weg: 'merkmal', schritte: ['Was sich ritzen oder eindrücken lässt, ist weich. Was sich nicht ritzen lässt, ist hart.', 'Wie leicht sich ein Stoff ritzen lässt, nennt man seine Härte.'] } },
        { id: 'ord-strom', form: 'auswahl', inhalt: { frage: 'Du verbindest einen Gegenstand mit einer Batterie und einem Lämpchen. Das Lämpchen leuchtet. Was hast du herausgefunden?',
            richtig: 'Der Gegenstand leitet den Strom.', falsch: ['Der Gegenstand ist hart.', 'Der Gegenstand ist magnetisch.', 'Der Gegenstand glänzt.'] },    // wahrscheinlich: Allgemeinwissen, Karte NMG.3.3.d
          hilfe: { weg: 'pruefen', schritte: ['Der Strom fliesst von der Batterie durch den Gegenstand zum Lämpchen. Das Lämpchen leuchtet nur, wenn der Gegenstand den Strom leitet.', 'Das nennt man Leitfähigkeit. Metalle leiten den Strom, Holz und Gummi nicht.'] } },
        { id: 'ord-schwimmt', form: 'auswahl', inhalt: { frage: 'Ein grosses Stück Holz schwimmt, eine kleine Münze sinkt. Wovon hängt es vor allem ab, ob etwas schwimmt?',
            richtig: 'vom Stoff, aus dem der Gegenstand ist', falsch: [{ text: 'nur davon, wie gross der Gegenstand ist', code: 'schwimmen-gewicht' }, { text: 'nur davon, wie schwer der Gegenstand ist', code: 'schwimmen-gewicht' }, 'von der Farbe'] },    // wahrscheinlich: Karte, Ergebnisse als Allgemeinwissen
          hilfe: { weg: 'pruefen', schritte: ['Das grosse Holzstück ist grösser und schwerer als die Münze und schwimmt trotzdem.', 'Ein Stoff schwimmt oder sinkt in Wasser, je nachdem, was für ein Stoff er ist. Ein Stück Holz schwimmt, ein Stück Metall oder Stein sinkt.'] } }
      ] },

    { id: 'magnet', titel: 'Magnet', ziele: ['lz2'], einfuehrung: 'erklaerung', frage: 'Zieht ein Magnet das an?',      // Beispiele sind Allgemeinwissen (wahrscheinlich), Prinzip belegt (NMG.3.3.d)
      leiter: [{ box: 0, typ: 'multiple-choice' }, { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      hilfe: { weg: 'pruefen', schritte: ['Vermute zuerst, ob der Magnet den Gegenstand anzieht.', 'Der Magnet zieht nur bestimmte Metalle an, zum Beispiel Eisen und Stahl.', 'Nicht jedes Metall ist magnetisch: Kupfer und Aluminium zieht der Magnet nicht an. Holz, Glas und Gummi auch nicht.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['mag-nagel',     'Nagel aus Eisen',         'Wird angezogen'],
        ['mag-klammer',   'Büroklammer aus Stahl',   'Wird angezogen'],
        ['mag-dose',      'Konservendose aus Blech', 'Wird angezogen'],
        ['mag-schraube',  'Schraube aus Eisen',      'Wird angezogen'],
        ['mag-loeffel',   'Holzlöffel',              'Wird nicht angezogen'],
        ['mag-murmel',    'Glasmurmel',              'Wird nicht angezogen'],
        ['mag-folie',     'Alufolie',                'Wird nicht angezogen'],
        ['mag-draht',     'Kupferdraht',             'Wird nicht angezogen'],
        ['mag-radierer',  'Radiergummi',             'Wird nicht angezogen']
      ] } } },

    { id: 'schwimmen', titel: 'Schwimmen und sinken', ziele: ['lz2'], einfuehrung: 'erklaerung', frage: 'Schwimmt das oder sinkt es?',   // Ergebnisse sind Allgemeinwissen (wahrscheinlich), Prinzip belegt (NMG.3.3.d)
      leiter: [{ box: 0, typ: 'multiple-choice' }, { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      hilfe: { weg: 'pruefen', schritte: ['Vermute zuerst und überlege, warum.', 'Lege den Gegenstand vorsichtig ins Wasser und schau, was passiert.', 'Ob etwas schwimmt, hängt vor allem vom Stoff ab und nicht nur von Grösse oder Gewicht: Ein grosses Stück Holz schwimmt, eine kleine Münze sinkt.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['sch-korken',     'Korken',                       'schwimmt auf dem Wasser'],
        ['sch-loeffel',    'Holzlöffel',                   'schwimmt auf dem Wasser'],
        ['sch-wachs',      'Kerzenwachs',                  'schwimmt auf dem Wasser'],
        ['sch-eis',        'Eiswürfel',                    'schwimmt auf dem Wasser'],
        ['sch-oel',        'Speiseöl in einem Glas Wasser', 'schwimmt auf dem Wasser'],
        ['sch-stein',      'Kieselstein',                  'sinkt im Wasser'],
        ['sch-schluessel', 'Schlüssel aus Metall',         'sinkt im Wasser'],
        ['sch-murmel',     'Glasmurmel',                   'sinkt im Wasser'],
        ['sch-muenze',     'Münze',                        'sinkt im Wasser']
      ] } } },

    { id: 'zustaende', titel: 'Fest, flüssig, gasförmig', ziele: ['lz3'], einfuehrung: 'erklaerung', frage: 'Ist das fest, flüssig oder gasförmig?',    // Begriffe belegt (Kommentar zur Stoffe-Einheit), Beispiele eigene Wahl
      leiter: [{ box: 0, typ: 'multiple-choice' }, { box: 2, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      hilfe: { weg: 'zustand', schritte: ['Fest: Der Stoff behält seine Form, auch wenn du ihn in ein anderes Gefäss legst.', 'Flüssig: Der Stoff nimmt die Form des Gefässes an und lässt sich giessen.', 'Gasförmig: Der Stoff füllt den ganzen Raum aus, den er bekommt, und ist meistens unsichtbar.', 'Wasser kommt in allen drei Zuständen vor: als Eis, als Wasser und als Wasserdampf.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['zus-eis',    'Eiswürfel im Gefrierfach', 'fest'],
        ['zus-stein',  'Kieselstein',              'fest'],
        ['zus-brett',  'Holzbrett',                'fest'],
        ['zus-wasser', 'Wasser im Glas',           'flüssig'],
        ['zus-oel',    'Speiseöl in der Flasche',  'flüssig'],
        ['zus-milch',  'Milch im Krug',            'flüssig'],
        ['zus-dampf',  'Wasserdampf',              'gasförmig'],
        ['zus-ballon', 'Luft im Luftballon',       'gasförmig'],
        ['zus-reifen', 'Luft im Fahrradreifen',    'gasförmig']
      ] } } },

    { id: 'bilder', titel: 'Bilder beschriften', ziele: ['lz3', 'lz4', 'lz6'], voraussetzung: ['zustaende'], einfuehrung: 'erklaerung',
      leiter: [{ box: 0, typ: 'beschriften' }],
      hilfe: { weg: 'bild', schritte: ['Schau zuerst das ganze Bild an und überlege, was gezeigt wird.', 'Tippe einen Punkt an und überlege, was dort zu sehen ist.', 'Bei einem Pfeil schaust du, wo er beginnt und wo er endet: Er zeigt, von welchem Zustand zu welchem das Wasser wechselt.', 'Orange Pfeile bedeuten, dass es wärmer wird. Blaue Pfeile bedeuten, dass es abkühlt.', 'Die Wellenlinien über dem Topf zeigen, dass Wasserdampf aufsteigt. Wasserdampf selbst ist unsichtbar, das Bild zeichnet ihn nur ein.'] },
      aufgaben: [         // x und y in Prozent der Bildfläche (viewBox des SVG), test.js prüft jeden Punkt gegen die Teile im SVG
        { id: 'bild-zustaende-1', form: 'beschriftung', inhalt: { bild: 'wasser-zustaende.svg', punkte: [
          { x: 16.7, y: 50, text: 'fest' }, { x: 50, y: 50, text: 'flüssig' }, { x: 83.3, y: 50, text: 'gasförmig' }] } },
        { id: 'bild-zustaende-2', form: 'beschriftung', inhalt: { bild: 'wasser-zustaende.svg', punkte: [
          { x: 33.3, y: 36.4, text: 'schmelzen' }, { x: 66.7, y: 36.4, text: 'verdunsten' }, { x: 66.7, y: 65.9, text: 'kondensieren' }] } },
        { id: 'bild-zustaende-3', form: 'beschriftung', inhalt: { bild: 'wasser-zustaende.svg', punkte: [
          { x: 16.7, y: 50, text: 'fest' }, { x: 50, y: 50, text: 'flüssig' }, { x: 83.3, y: 50, text: 'gasförmig' },
          { x: 33.3, y: 36.4, text: 'schmelzen' }, { x: 66.7, y: 36.4, text: 'verdunsten' }, { x: 66.7, y: 65.9, text: 'kondensieren' }] } },
        { id: 'bild-zustaende-4', form: 'beschriftung', inhalt: { bild: 'wasser-zustaende.svg', punkte: [
          { x: 16.7, y: 50, text: 'fest' }, { x: 33.3, y: 36.4, text: 'schmelzen' }, { x: 50, y: 50, text: 'flüssig' }, { x: 66.7, y: 36.4, text: 'verdunsten' }] } },
        { id: 'bild-filter-1', form: 'beschriftung', inhalt: { bild: 'filtrieren.svg', punkte: [
          { x: 22.9, y: 26.7, text: 'Becher mit Sandwasser' }, { x: 44.8, y: 42.2, text: 'Filterpapier' }, { x: 51.5, y: 54.4, text: 'Sand im Filter' },
          { x: 62.9, y: 39.4, text: 'Trichter' }, { x: 50, y: 86.1, text: 'Glas mit sauberem Wasser' }] } },
        { id: 'bild-filter-2', form: 'beschriftung', inhalt: { bild: 'filtrieren.svg', punkte: [
          { x: 44.8, y: 42.2, text: 'Filterpapier' }, { x: 62.9, y: 39.4, text: 'Trichter' }, { x: 50, y: 86.1, text: 'Glas mit sauberem Wasser' }] } },
        { id: 'bild-filter-3', form: 'beschriftung', inhalt: { bild: 'filtrieren.svg', punkte: [
          { x: 22.9, y: 26.7, text: 'Becher mit Sandwasser' }, { x: 51.5, y: 54.4, text: 'Sand im Filter' }, { x: 50, y: 86.1, text: 'Glas mit sauberem Wasser' }] } },
        { id: 'bild-sieb-1', form: 'beschriftung', inhalt: { bild: 'sieb.svg', punkte: [
          { x: 29.2, y: 18.4, text: 'Sieb' }, { x: 48.3, y: 34.4, text: 'Kies' }, { x: 50, y: 54.4, text: 'Sand' }, { x: 71.9, y: 82, text: 'Schüssel' }] } },
        { id: 'bild-sieb-2', form: 'beschriftung', inhalt: { bild: 'sieb.svg', punkte: [
          { x: 29.2, y: 18.4, text: 'Sieb' }, { x: 48.3, y: 34.4, text: 'Kies' }, { x: 50, y: 54.4, text: 'Sand' }] } }
      ] },

    { id: 'vorgaenge', titel: 'Was geschieht mit dem Stoff?', ziele: ['lz4', 'lz5'], voraussetzung: ['zustaende'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      aufgaben: [
        { id: 'vor-schmelzen', form: 'auswahl', inhalt: { frage: 'Ein Eiswürfel liegt in der warmen Hand und wird zu Wasser. Wie heisst dieser Vorgang?',
            richtig: 'schmelzen', falsch: ['verdunsten', { text: 'kondensieren', code: 'vorgang-verwechselt' }, 'auflösen'] },
          hilfe: { weg: 'zustand', schritte: ['Schau, von welchem Zustand zu welchem das Wasser wechselt: von fest zu flüssig.', 'Fest zu flüssig heisst schmelzen.'] } },
        { id: 'vor-waesche', form: 'auswahl', inhalt: { frage: 'Nasse Wäsche hängt an der Leine und wird trocken. Was ist mit dem Wasser geschehen?',
            richtig: 'Es ist verdunstet und steckt als Wasserdampf in der Luft.',
            falsch: [{ text: 'Es ist verschwunden und gibt es nicht mehr.', code: 'stoff-verschwindet' }, 'Es ist gefroren.', 'Es ist in den Stoff der Wäsche gewandert und bleibt dort.'] },
          hilfe: { weg: 'zustand', schritte: ['Wasser wird nicht zu nichts. Es wechselt von flüssig zu gasförmig.', 'Dieser Vorgang heisst verdunsten. Der Wasserdampf ist unsichtbar und mischt sich mit der Luft.'] } },
        { id: 'vor-kochen', form: 'auswahl', inhalt: { frage: 'Wasser verdunstet nur, wenn es kocht. Stimmt das?',
            richtig: 'Nein. Wasser verdunstet auch bei kühler Luft, zum Beispiel aus einer Pfütze.',
            falsch: [{ text: 'Ja. Ohne Kochen verdunstet kein Wasser.', code: 'verdunsten-nur-kochen' }, 'Nein, aber nur in der Sonne.', 'Ja, aber nur im Sommer.'] },    // wahrscheinlich: Annahme der Karte (Fehlerbild), die Sache selbst ist gesichert
          hilfe: { weg: 'zustand', schritte: ['Denke an eine Pfütze nach dem Regen. Sie wird kleiner, auch ohne dass jemand das Wasser kocht.', 'Verdunsten geht langsam bei kühler Luft und schneller bei Wärme und Wind.'] } },
        { id: 'vor-glas', form: 'auswahl', inhalt: { frage: 'Ein kaltes Glas steht in der warmen Küche. Aussen bilden sich Wassertropfen. Woher kommt das Wasser?',
            richtig: 'Wasserdampf aus der Luft wird am kalten Glas zu Wasser.',
            falsch: ['Das Wasser sickert durch das Glas.', 'Das Glas gibt Wasser ab, weil es kalt ist.', 'Die Tropfen waren schon vorher da.'] },
          hilfe: { weg: 'zustand', schritte: ['In der Luft steckt unsichtbarer Wasserdampf.', 'Am kalten Glas kühlt er ab und wird wieder flüssig. Von gasförmig zu flüssig heisst kondensieren.'] } },
        { id: 'vor-spiegel', form: 'auswahl', inhalt: { frage: 'Nach dem Duschen ist der Spiegel beschlagen. Was ist dort geschehen?',
            richtig: 'Wasserdampf ist am kühleren Spiegel zu feinen Tropfen geworden.',
            falsch: ['Der Spiegel ist heiss geworden und schwitzt.', { text: 'Das Wasser ist am Spiegel verdunstet.', code: 'vorgang-verwechselt' }, 'Der Dampf ist am Spiegel zu Eis geworden.'] },
          hilfe: { weg: 'zustand', schritte: ['Beim Duschen steigt Wasserdampf in die Luft.', 'Der Dampf trifft den kühleren Spiegel und wird wieder flüssig. Das ist kondensieren, das Gegenteil von verdunsten.'] } },
        { id: 'vor-zucker', form: 'auswahl', inhalt: { frage: 'Zucker wird in Wasser gerührt, bis man keine Körner mehr sieht. Was stimmt?',
            richtig: 'Der Zucker ist noch da, er ist im Wasser aufgelöst.',
            falsch: [{ text: 'Der Zucker ist verschwunden.', code: 'stoff-verschwindet' }, { text: 'Der Zucker hat sich in Wasser verwandelt.', code: 'stoff-verschwindet' }] },
          hilfe: { weg: 'bleibt', schritte: ['Aufgelöst heisst: Der Stoff ist in so kleine Teile verteilt, dass man sie nicht mehr sieht.', 'Der Zucker bleibt trotzdem da. Du schmeckst ihn, und wenn das Wasser verdunstet, bleibt er zurück.'] } },
        { id: 'vor-salz', form: 'auswahl', inhalt: { frage: 'Salz ist in Wasser aufgelöst. Wie bekommst du das Salz zurück?',
            richtig: 'Das Wasser verdunsten lassen. Das Salz bleibt zurück.',
            falsch: [{ text: 'Das Salzwasser sieben.', code: 'trennverfahren-verwechselt' }, { text: 'Es geht nicht, das Salz ist weg.', code: 'stoff-verschwindet' }, 'Das Salzwasser schütteln.'] },
          hilfe: { weg: 'trennen', schritte: ['Das Salz ist noch im Wasser, nur fein verteilt.', 'Wenn das Wasser verdunstet, bleibt das Salz in der Schale zurück. Es bildet Kristalle. Man sagt auch: Es kristallisiert aus.'] } },
        { id: 'vor-filter', form: 'auswahl', inhalt: { frage: 'Salzwasser wird durch einen Kaffeefilter gegossen. Was geschieht mit dem Salz?',
            richtig: 'Es läuft mit dem Wasser durch den Filter.',
            falsch: [{ text: 'Es bleibt im Filter hängen.', code: 'trennverfahren-verwechselt' }, { text: 'Es verschwindet beim Filtern.', code: 'stoff-verschwindet' }] },    // wahrscheinlich: physikalisch gesichert, im Lehrmittel nicht belegt
          hilfe: { weg: 'trennen', schritte: ['Ein Filter hält nur Teile zurück, die grösser sind als seine winzigen Löcher, zum Beispiel Sand.', 'Aufgelöstes Salz ist so fein verteilt, dass es mit dem Wasser durch den Filter läuft.'] } },
        { id: 'vor-sieb', form: 'auswahl', inhalt: { frage: 'Kies und Sand liegen gemischt in einer Schale. Wie trennst du den Kies vom Sand?',
            richtig: 'Mit einem Sieb: Der Sand fällt durch, der Kies bleibt.',
            falsch: [{ text: 'Mit einem Kaffeefilter: Der Sand bleibt hängen.', code: 'trennverfahren-verwechselt' }, { text: 'Das Gemisch verdunsten lassen.', code: 'trennverfahren-verwechselt' }, 'Mit einem Magneten.'] },
          hilfe: { weg: 'trennen', schritte: ['Kies und Sand sind verschieden gross. Das ist der Unterschied zwischen den beiden Stoffen.', 'Ein Sieb lässt die kleinen Teile durch und hält die grossen zurück. Darum trennt man Kies und Sand durch Sieben.'] } },
        { id: 'vor-eis', form: 'auswahl', inhalt: { frage: 'Wasser kommt in die Tiefkühltruhe und wird zu Eis. Ist es danach ein anderer Stoff?',
            richtig: 'Nein, es ist derselbe Stoff in einem anderen Zustand.',
            falsch: [{ text: 'Ja, aus dem Wasser ist ein neuer Stoff entstanden.', code: 'zustand-stoff' }, { text: 'Das Wasser ist verschwunden, nur Eis ist da.', code: 'stoff-verschwindet' }] },
          hilfe: { weg: 'bleibt', schritte: ['Wenn Eis schmilzt, wird wieder Wasser daraus. Das geht, weil es derselbe Stoff geblieben ist.', 'Nur der Zustand hat sich geändert: von flüssig zu fest.'] } },
        { id: 'vor-wachs', form: 'auswahl', inhalt: { frage: 'Kerzenwachs wird flüssig und kühlt danach wieder ab. Was geschieht?',
            richtig: 'Es wird wieder fest und ist noch derselbe Stoff.',
            falsch: [{ text: 'Es verschwindet.', code: 'stoff-verschwindet' }, 'Es verdunstet.', { text: 'Es wird zu einem neuen Stoff.', code: 'zustand-stoff' }] },
          hilfe: { weg: 'bleibt', schritte: ['Flüssiges Wachs wird beim Abkühlen wieder fest. Das Wachs ist dabei nicht weg.', 'Schmelzen und Festwerden sind Wechsel des Zustands. Der Stoff bleibt derselbe.'] } },
        { id: 'vor-wolke', form: 'auswahl', inhalt: { frage: 'Über einem kochenden Topf steigt eine weisse Wolke auf. Woraus besteht sie?',
            richtig: 'Aus winzigen Wassertropfen. Wasserdampf selbst ist unsichtbar.',
            falsch: [{ text: 'Aus Wasserdampf, den man sieht.', code: 'dampf-sichtbar' }, 'Aus Rauch.', 'Aus Luft.'] },    // wahrscheinlich: Karte, Fehlerbild «Wasserdampf gilt als sichtbare Wolke». Ob das Lehrmittel die Wolke «Dampf» nennt, bleibt offen
          hilfe: { weg: 'zustand', schritte: ['Wasserdampf ist gasförmig und unsichtbar. Direkt über dem Wasser siehst du nichts.', 'Weiter oben kühlt der Dampf ab und wird zu winzigen Tropfen. Diese Tropfen siehst du als weisse Wolke.'] } }
      ] },

    { id: 'trennen', titel: 'Versuche in der richtigen Reihenfolge', ziele: ['lz6'], voraussetzung: ['vorgaenge'],
      leiter: [{ box: 0, typ: 'reihenfolge' }],
      hilfe: { weg: 'trennen', schritte: ['Zuerst wird alles bereitgestellt, dann wird getrennt, zuletzt schaust du hin und hältst fest.', 'Die Vermutung steht immer vor dem Versuch, das Ergebnis danach.', 'Frage dich bei jedem Schritt: Was muss vorher geschehen sein?'] },
      aufgaben: [
        { id: 'tre-filtrieren', form: 'abfolge', inhalt: { frage: 'Sandwasser filtrieren: Was kommt zuerst, was zuletzt?',
          schritte: ['Trichter mit Filterpapier auf ein sauberes Glas setzen', 'Das Sandwasser langsam in den Filter giessen', 'Warten, bis das Wasser durchgelaufen ist', 'Sand im Filter und Wasser im Glas ansehen'] } },
        { id: 'tre-sieben', form: 'abfolge', inhalt: { frage: 'Kies und Sand sieben: Was kommt zuerst, was zuletzt?',
          schritte: ['Eine Schüssel bereitstellen', 'Das Sieb über die Schüssel halten', 'Das Gemisch aus Kies und Sand ins Sieb geben', 'Das Sieb vorsichtig schütteln', 'Kies im Sieb und Sand in der Schüssel ansehen'] } },
        { id: 'tre-salz', form: 'abfolge', inhalt: { frage: 'Salz aus Salzwasser gewinnen: Was kommt zuerst, was zuletzt?',
          schritte: ['Salz in Wasser rühren, bis es aufgelöst ist', 'Das Salzwasser in eine flache Schale giessen', 'Die Schale an einen warmen Ort stellen', 'Warten, bis das Wasser verdunstet ist', 'Die Salzkristalle in der Schale ansehen'] } },
        { id: 'tre-absetzen', form: 'abfolge', inhalt: { frage: 'Schlammwasser klären: Was kommt zuerst, was zuletzt?',
          schritte: ['Erde in ein Glas mit Wasser geben', 'Mit einem Löffel kräftig umrühren', 'Das Glas ruhig hinstellen und nicht mehr bewegen', 'Warten, bis sich die Erde am Boden gesetzt hat', 'Das klarere Wasser oben ansehen'] } },
        { id: 'tre-magnet', form: 'abfolge', inhalt: { frage: 'Einen Magnettest durchführen: Was kommt zuerst, was zuletzt?',
          schritte: ['Gegenstände auf den Tisch legen', 'Vermuten, welche der Magnet anzieht', 'Den Magneten an jeden Gegenstand halten', 'Beobachten und das Ergebnis aufschreiben', 'Vermutung und Ergebnis vergleichen'] } },
        { id: 'tre-schwimmen', form: 'abfolge', inhalt: { frage: 'Schwimmen und sinken testen: Was kommt zuerst, was zuletzt?',
          schritte: ['Eine Schüssel mit Wasser füllen', 'Vermuten: Schwimmt der Gegenstand oder sinkt er?', 'Den Gegenstand vorsichtig ins Wasser legen', 'Beobachten, was geschieht', 'Ergebnis aufschreiben und mit der Vermutung vergleichen'] } },
        { id: 'tre-anleitung', form: 'abfolge', inhalt: { frage: 'Eine Versuchsanleitung schreiben: Welcher Teil kommt zuerst, welcher zuletzt?',      // wahrscheinlich: Reihenfolge der Teile ist eine Annahme, Aufgabe belegt als summative Aufgabe der Stoffe-Einheit
          schritte: ['Die Frage oder das Ziel aufschreiben', 'Das Material auflisten', 'Die Schritte der Reihe nach nummerieren', 'Die Beobachtung festhalten', 'Das Ergebnis in einem Satz aufschreiben'] } },
        { id: 'tre-gemisch', form: 'abfolge', inhalt: { frage: 'Ein Gemisch trennen: Wie gehst du vor?',
          schritte: ['Die Stoffe im Gemisch benennen', 'Überlegen, wodurch sich die Stoffe unterscheiden', 'Ein passendes Trennverfahren wählen', 'Das Gemisch trennen', 'Prüfen, ob die Stoffe wirklich getrennt sind'] } },
        { id: 'tre-eis', form: 'abfolge', inhalt: { frage: 'Eis schmelzen und wieder gefrieren lassen: Was kommt zuerst, was zuletzt?',
          schritte: ['Einen Eiswürfel in eine Schale legen', 'Die Schale an einen warmen Ort stellen', 'Beobachten, wie das Eis zu Wasser wird', 'Die Schale mit dem Wasser in die Tiefkühltruhe stellen', 'Nach einigen Stunden das Eis wieder ansehen'] } }
      ] },

    { id: 'luft', titel: 'Luft braucht Platz', ziele: ['lz7'], voraussetzung: ['zustaende'],
      aktiv: false,
      geltung: 'Der Stoff «Luft braucht Platz» steht in einer Einheit eines bestimmten Lehrmittels. Ob die Klasse sie behandelt, weiss die Lehrperson.',
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      hilfe: { weg: 'luft', schritte: ['Luft ist ein Stoff, auch wenn man sie nicht sieht.', 'Wie jeder Stoff braucht Luft Platz: Wo Luft ist, kann nicht gleichzeitig Wasser sein.', 'Einen Ballon aufblasen oder Luft mit einem Fächer spüren zeigt, dass Luft etwas ist.'] },
      aufgaben: [
        { id: 'luf-ballon', form: 'auswahl', inhalt: { frage: 'Ein Ballon wird aufgeblasen. Was ist danach im Ballon?',
            richtig: 'Luft. Sie braucht Platz und dehnt den Ballon.', falsch: [{ text: 'Nichts. Der Ballon ist nur gedehnt.', code: 'luft-nichts' }, 'Wasser.', 'Staub.'] } },
        { id: 'luf-glas', form: 'auswahl', inhalt: { frage: 'Ein leeres Glas wird mit der Öffnung nach unten ins Wasser gedrückt. Warum steigt das Wasser kaum ins Glas?',
            richtig: 'Im Glas ist Luft, und die Luft braucht Platz.', falsch: [{ text: 'Das Glas ist leer, aber das Wasser mag nicht hinein.', code: 'luft-nichts' }, 'Das Wasser ist zu schwer.'] } },
        { id: 'luf-papier', form: 'auswahl', inhalt: { frage: 'Ein zerknülltes Papier steckt am Boden eines Glases. Das Glas wird gerade mit der Öffnung nach unten ins Wasser gedrückt. Wird das Papier nass?',
            richtig: 'Nein, die Luft im Glas hält das Wasser fern.', falsch: ['Ja, das Wasser dringt immer ein.', { text: 'Ja, denn im Glas ist ja nichts.', code: 'luft-nichts' }] } },
        { id: 'luf-stoff', form: 'auswahl', inhalt: { frage: 'Luft ist ...',
            richtig: 'ein Stoff, auch wenn man sie nicht sieht.', falsch: [{ text: 'nichts, weil man sie nicht sieht.', code: 'luft-nichts' }, 'nur ein anderes Wort für Wind.', 'ein Zustand von Wasser.'] } },
        { id: 'luf-wo', form: 'auswahl', inhalt: { frage: 'Wo ist Luft?',
            richtig: 'Überall um uns herum, auch in einem Zimmer, das leer aussieht.', falsch: [{ text: 'Nur draussen.', code: 'luft-nichts' }, 'Nur im Wind.', 'Nur in Ballons und Reifen.'] } },
        { id: 'luf-blasen', form: 'auswahl', inhalt: { frage: 'Ein Kind bläst mit einem Strohhalm in ein Glas Wasser. Es steigen Blasen auf. Was ist in den Blasen?',
            richtig: 'Luft', falsch: [{ text: 'nichts', code: 'luft-nichts' }, 'Wasser', 'Staub'] } },
        { id: 'luf-reifen', form: 'auswahl', inhalt: { frage: 'Ein Fahrradreifen wird aufgepumpt. Was kommt in den Reifen?',
            richtig: 'Luft, die dort Platz einnimmt.', falsch: [{ text: 'Nichts, der Schlauch wird nur gespannt.', code: 'luft-nichts' }, 'Wasser.', 'Gas aus einer Gasflasche.'] } },
        { id: 'luf-heiss', form: 'auswahl', inhalt: { frage: 'Ein Heissluftballon steigt auf. Warum?',
            richtig: 'Warme Luft steigt nach oben, und der Ballon ist mit warmer Luft gefüllt.',
            falsch: ['Der Wind drückt ihn nach oben.', { text: 'Im Ballon ist keine Luft, deshalb ist er leicht.', code: 'luft-nichts' }, 'Er ist mit Wasser gefüllt.'] },
          hilfe: { weg: 'luft', schritte: ['Warme Luft ist leichter als kalte Luft und steigt nach oben.', 'Im Ballon wird die Luft mit einem Brenner erwärmt. Die Luft im Ballon ist wärmer als die Luft draussen.'] } }
      ] }
  ],

  fehlerCodes: {
    'merkmal-verwechselt': {
      kind:   'Schau, was alle Gegenstände gemeinsam haben. Du kannst nach Material, Form, Farbe, Beschaffenheit oder Verwendung ordnen. Nur eines davon passt zu allen.',
      eltern: 'Verwechselt die Merkmale, nach denen man Dinge ordnen kann. Hilft: sechs Gegenstände aus Küche oder Kinderzimmer auf den Tisch legen und mehrmals neu ordnen, einmal nach Material, einmal nach Farbe, einmal nach Verwendung. Das Kind sagt jedes Mal, was gleich ist.',
      folge:  null
    },
    'stoff-verschwindet': {
      kind:   'Der Stoff ist nicht weg. Er ist nur fein verteilt oder in einem anderen Zustand. Prüfe es: Lass das Wasser verdunsten und schau, was zurückbleibt.',
      eltern: 'Die Vorstellung, dass ein aufgelöster oder verdunsteter Stoff verschwindet, ist verbreitet. Hilft: Salz oder Zucker in Wasser lösen, vorher und nachher auf der Küchenwaage wiegen und das Salzwasser in einer flachen Schale verdunsten lassen. Das Salz bleibt zurück.',
      folge:  null
    },
    'vorgang-verwechselt': {
      kind:   'Frage dich: Von welchem Zustand zu welchem wechselt das Wasser? Fest zu flüssig heisst schmelzen, flüssig zu gasförmig heisst verdunsten, gasförmig zu flüssig heisst kondensieren.',
      eltern: 'Verwechselt die Namen der Übergänge. Hilft: Alltagsbeispiele sammeln (Eis in der Hand, nasse Wäsche, beschlagener Spiegel) und das Kind bei jedem sagen lassen, von welchem Zustand zu welchem das Wasser wechselt, bevor es das Wort sucht.',
      folge:  null
    },
    'verdunsten-nur-kochen': {
      kind:   'Wasser verdunstet auch bei kühler Luft. Nasse Wäsche und Pfützen trocknen, ohne dass Wasser kocht.',
      eltern: 'Verdunsten wird mit Kochen gleichgesetzt (Annahme, nicht belegt). Hilft: zwei gleiche Teller mit gleich viel Wasser an einen warmen und an einen kühlen Ort stellen und nach einigen Stunden vergleichen.',
      folge:  null
    },
    'trennverfahren-verwechselt': {
      kind:   'Überlege, wodurch sich die Stoffe unterscheiden. Sieben trennt verschieden grosse Teile. Beim Filtrieren bleiben feste Teile im Filter, Aufgelöstes läuft durch. Verdunsten bringt aufgelöste Stoffe zurück.',
      eltern: 'Wählt das falsche Trennverfahren. Hilft: vor jedem Versuch fragen «Wodurch unterscheiden sich die Stoffe?» und die Antwort aufschreiben lassen, erst danach das Verfahren wählen. Am Küchentisch ausprobieren, was das Sieb und was der Kaffeefilter zurückhält.',
      folge:  null
    },
    'zustand-stoff': {
      kind:   'Wenn Wasser zu Eis wird, bleibt es derselbe Stoff. Er wechselt nur den Zustand. Beim Schmelzen wird wieder Wasser daraus.',
      eltern: 'Zustandsänderung und Stoffänderung werden gleichgesetzt (Annahme aus der Fachdidaktik). Hilft: einen Eiswürfel schmelzen und das Wasser wieder einfrieren, das Kind erklärt, warum es derselbe Stoff geblieben ist.',
      folge:  null
    },
    'dampf-sichtbar': {
      kind:   'Wasserdampf ist unsichtbar. Die weisse Wolke besteht aus winzigen Wassertropfen, die entstehen, wenn der Dampf abkühlt.',
      eltern: 'Die weisse Wolke wird für Wasserdampf gehalten. Hilft: beim Kochen mit dem Kind schauen, was direkt über dem Wasser zu sehen ist (nichts) und wo die weisse Wolke beginnt. Heisse Dämpfe nur mit einem Erwachsenen beobachten. Ob das Lehrmittel die Wolke «Dampf» nennt, bei der Lehrperson erfragen.',
      folge:  null
    },
    'luft-nichts': {
      kind:   'Luft ist etwas, auch wenn man sie nicht sieht. Sie nimmt Platz ein, sonst könnte man keinen Ballon aufblasen.',
      eltern: 'Luft wird als «nichts» gedacht. Hilft: einen Ballon aufblasen, ein umgedrehtes Glas ins Wasser drücken und Luft mit einem Fächer oder einer Pumpe spürbar machen. Danach fragen: Wo ist die Luft jetzt?',
      folge:  null
    },
    'schwimmen-gewicht': {
      kind:   'Ob etwas schwimmt, hängt vor allem vom Stoff ab, nicht nur von Grösse oder Gewicht. Ein grosses Stück Holz schwimmt, eine kleine Münze sinkt.',
      eltern: 'Schwimmen und Sinken wird am Gewicht oder an der Grösse festgemacht. Hilft: einen grossen leichten und einen kleinen schweren Gegenstand wählen, das Kind zuerst vermuten und begründen lassen und dann im Wasser prüfen.',
      folge:  null
    }
  },

  pruefung: {                                    // Aufbau der Lernkontrolle ist eine Annahme: Es wurde keine echte Lernkontrolle der Klasse gefunden (README, offene Punkte)
    datum: null,                                 // setzt der Elternbereich
    themen: ['*'],
    richtzeitMin: 20,                            // Annahme, Format und Zeit vom Blatt der Lehrperson übernehmen (TODO)
    format: [
      { thema: ['magnet', 'schwimmen'],  typ: 'multiple-choice', anzahl: 6, punkte: 6 },
      { thema: ['zustaende'],            typ: 'zuordnen',        anzahl: 6, punkte: 6 },
      { thema: ['ordnen', 'vorgaenge'],  typ: 'multiple-choice', anzahl: 8, punkte: 8 },
      { thema: ['trennen'],              typ: 'reihenfolge',     anzahl: 2, punkte: 4 },
      { thema: ['bilder'],               typ: 'beschriften',     anzahl: 2, punkte: 6 }
    ]
  },

  anpassbar: {                                   // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':     { typ: 'bool' },
    'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 }
  },

  begleitung: [
    'Dieses Modul erst einschalten, wenn die Klasse die Stoffe im Unterricht behandelt. Neuer Stoff kommt zuerst aus dem Unterricht, nicht aus der App.',
    'Die Versuche gehören an den Küchentisch: Magnet, schwimmen und sinken, Salz lösen, sieben und filtrieren. Vorher fragen: Was vermutest du, und warum? Erst danach ausprobieren.',
    'Die Antwort nicht vorsagen. Fragen: Was hast du beobachtet? Woran erkennst du das? Die App zeigt nach einem Fehler einen Lösungsweg, den das Kind in eigenen Worten erzählen kann.',
    'Bei Versuchen mit Wasser, Strom oder Hitze ist ein Erwachsener dabei. Für Stromversuche nur Batterien verwenden, nie die Steckdose, und heisse Flüssigkeiten dem Kind nicht überlassen.',
    'Fachwörter wie schmelzen, verdunsten und kondensieren im Alltag aufgreifen: nasse Wäsche, beschlagener Spiegel, Eis in der Hand.'
  ]
});
