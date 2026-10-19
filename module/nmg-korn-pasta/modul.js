/* module/nmg-korn-pasta/modul.js: Vom Korn zur Pasta (NMG, 3. Klasse): Arbeitsschritte, Weizenpflanze, Menschen und Preis, Weissmehl und Vollkornmehl,
   nachhaltig einkaufen, Lebensmittelpyramide. Reine Daten, ein einziger Aufruf, kein Zugriff auf Registry oder Bausteine.
   Angelegt am 2026-10-19 mit `tools\lw neu modul` (Vorlage «pruefung»), gefüllt nach dem Lernzielblatt (Checkliste eines NMG-Tests der Klasse, lokal in quelle/).
   Lehrmittel: Dossier WeitBlick NMG «Vom Korn zur Pasta» (Schulverlag plus, Zyklus 1). Alle Texte sind eigene Formulierungen, kein Text aus dem Dossier.
   Aufbau: Ein Thema hat nur Aufgaben einer Form, weil jeder Typ der Leiter jede Form des Themas akzeptieren muss (inhalt-leiter.js). Darum gibt es
   zu jedem Stoff ein Thema mit Zuordnen oder Reihenfolge, ein Thema mit Wissensfragen und, wo das Blatt Erklären verlangt, ein Thema mit freiem Text.
   Annahmen, alle offen (README): die dreizehn Arbeitsschritte, die Namen der Pyramidenstufen, Hülsenfrüchte und Fruchtsaft kommen bewusst nicht vor.
   Stand: Entwurf. Alle Lösungswege sind ungeprüft (geprueft: null), das setzt nur der Vater nach dem Abgleich mit dem Dossier. */
Lernwelt.modul({
  schema: 1,
  id: 'nmg-korn-pasta',                              // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                                 // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Vom Korn zur Pasta',
  fach: 'nmg',
  bereich: 'nmg.natur',                              // Architektur 4.7: alle NMG-Module füttern den Bereich nmg.natur
  stufen: [3],
  zyklus: 2,
  lp21: ['NMG.1.3', 'NMG.6.3', 'NMG.6.5', 'NMG.7.2', 'NMG.7.3', 'NMG.7.4', 'NMG.9.1', 'NMG.9.2'],   // laut Jahresplanung einer Schule, vor Freigabe gegen lehrplan21.ch prüfen (Stufenbuchstaben fehlen)
  lehrmittel: { name: 'Dossier WeitBlick NMG «Vom Korn zur Pasta» (Schulverlag plus, Zyklus 1)', kapitel: 'Vom Korn zur Pasta' },

  lernziele: [                                       // Checkliste des Tests, Satz für Satz in die Ich-Form gesetzt
    { id: 'lz1', text: 'Ich zeige und erkläre die verschiedenen Arbeitsschritte vom Korn zur Pasta.' },
    { id: 'lz2', text: 'Ich zeige, wie eine Weizenpflanze wächst und sich verändert.' },
    { id: 'lz3', text: 'Ich zeige, wer an der Wertschöpfungskette beteiligt ist, welche Arbeit diese Menschen leisten und warum die Pasta einen bestimmten Preis hat.' },
    { id: 'lz4', text: 'Ich zeige die Unterschiede zwischen Weissmehl und Vollkornmehl und erkläre sie in ganzen Sätzen.' },
    { id: 'lz5', text: 'Ich möchte nachhaltige Pasta kaufen und sage, worauf ich dabei schaue.' },
    { id: 'lz6', text: 'Ich trage zwei Lebensmittel auf jeder Stufe der Ernährungspyramide an der richtigen Stelle ein.' },
    { id: 'lz7', text: 'Ich erkläre den Aufbau der Ernährungspyramide.' }
  ],

  wege: {                                            // Lösungswege, «geprueft» setzt der Vater nach dem Abgleich mit dem Dossier, nie ein Agent
    kette:      { titel: 'Die Arbeitsschritte vom Korn zur Pasta',        quelle: 'WeitBlick, Dossier «Vom Korn zur Pasta», Seite __', geprueft: null },
    pflanze:    { titel: 'Wie eine Weizenpflanze wächst',                 quelle: 'WeitBlick, Dossier «Vom Korn zur Pasta», Seite __', geprueft: null },
    menschen:   { titel: 'Die Menschen hinter der Pasta',                 quelle: 'WeitBlick, Dossier «Vom Korn zur Pasta», Seite __', geprueft: null },
    preis:      { titel: 'Warum die Pasta ihren Preis hat',               quelle: 'WeitBlick, Dossier «Vom Korn zur Pasta», Seite __', geprueft: null },
    mehl:       { titel: 'Weissmehl und Vollkornmehl unterscheiden',      quelle: 'WeitBlick, Dossier «Vom Korn zur Pasta», Seite __', geprueft: null },
    nachhaltig: { titel: 'Nachhaltige Pasta einkaufen',                   quelle: 'WeitBlick, Dossier «Vom Korn zur Pasta», Seite __', geprueft: null },
    pyramide:   { titel: 'Die Lebensmittelpyramide lesen',                quelle: 'Lebensmittelpyramide SGE 2024', geprueft: null }
  },

  standard: { einfuehrung: 'vortest', neuProTag: 4 },

  themen: [
    // ---- Lernziel 1: Arbeitsschritte ---------------------------------------------------------------------------------------------------
    { id: 'arbeitsschritte', titel: 'Vom Feld in die Pfanne', ziele: ['lz1'],
      leiter: [{ box: 0, typ: 'reihenfolge' }],
      leiterRatenVerzicht: 'Vier bis acht Karten in die richtige Reihenfolge bringen: Die Chance, es zufällig richtig zu legen, liegt zwischen 1 zu 24 und 1 zu 40320.',
      hilfe: { weg: 'kette', schritte: [
        'Der Weg beginnt auf dem Feld: Das Korn wird gesät, das Getreide wächst und wird mit dem Mähdrescher geerntet.',
        'Dann fährt das Getreide zum Lager oder Silo und wird gereinigt. In der Mühle wird es zu Griess gemahlen.',
        'In der Fabrik wird aus Griess und Wasser ein Teig geknetet. Der Teig wird geformt, getrocknet und verpackt.',
        'Die Packungen kommen in den Laden und werden verkauft. Zu Hause wird die Pasta gekocht.'] },
      aufgaben: [
        { id: 'ar-feld', form: 'abfolge', inhalt: { frage: 'Vom Feld ins Lager: Was kommt zuerst, was zuletzt?', schritte: [
          'Hartweizen auf dem Feld säen', 'Das Getreide wächst, bis es reif ist', 'Das reife Getreide mit dem Mähdrescher ernten', 'Das Getreide zum Lager oder Silo fahren'] } },
        { id: 'ar-lager', form: 'abfolge', inhalt: { frage: 'Von der Ernte zum Griess: Was kommt zuerst, was zuletzt?', schritte: [
          'Das reife Getreide mit dem Mähdrescher ernten', 'Das Getreide zum Lager oder Silo fahren', 'Das Getreide von Staub und Steinchen reinigen', 'In der Mühle das Getreide zu Griess mahlen'] } },
        { id: 'ar-muehle', form: 'abfolge', inhalt: { frage: 'Von der Mühle zur Form: Was kommt zuerst, was zuletzt?', schritte: [
          'Das Getreide von Staub und Steinchen reinigen', 'In der Mühle das Getreide zu Griess mahlen', 'Griess und Wasser zu Teig kneten', 'Die Teigwaren formen (pressen oder schneiden)'] } },
        { id: 'ar-fabrik', form: 'abfolge', inhalt: { frage: 'In der Fabrik: Was kommt zuerst, was zuletzt?', schritte: [
          'Griess und Wasser zu Teig kneten', 'Die Teigwaren formen (pressen oder schneiden)', 'Die Teigwaren trocknen', 'Die Teigwaren verpacken'] } },
        { id: 'ar-laden', form: 'abfolge', inhalt: { frage: 'Von der Packung auf den Teller: Was kommt zuerst, was zuletzt?', schritte: [
          'Die Teigwaren verpacken', 'Die Packungen in den Laden liefern', 'Die Pasta im Laden verkaufen', 'Die Pasta zu Hause kochen'] } },
        { id: 'ar-anfang', form: 'abfolge', inhalt: { frage: 'Vom Säen bis zum Reinigen: Was kommt zuerst, was zuletzt?', schritte: [
          'Hartweizen auf dem Feld säen', 'Das Getreide wächst, bis es reif ist', 'Das reife Getreide mit dem Mähdrescher ernten', 'Das Getreide zum Lager oder Silo fahren', 'Das Getreide von Staub und Steinchen reinigen'] } },
        { id: 'ar-mitte', form: 'abfolge', inhalt: { frage: 'Vom Silo bis zum Trocknen: Was kommt zuerst, was zuletzt?', schritte: [
          'Das Getreide zum Lager oder Silo fahren', 'Das Getreide von Staub und Steinchen reinigen', 'In der Mühle das Getreide zu Griess mahlen',
          'Griess und Wasser zu Teig kneten', 'Die Teigwaren formen (pressen oder schneiden)', 'Die Teigwaren trocknen'] } },
        { id: 'ar-ende', form: 'abfolge', inhalt: { frage: 'Von der Form bis zum Kochen: Was kommt zuerst, was zuletzt?', schritte: [
          'Die Teigwaren formen (pressen oder schneiden)', 'Die Teigwaren trocknen', 'Die Teigwaren verpacken', 'Die Packungen in den Laden liefern',
          'Die Pasta im Laden verkaufen', 'Die Pasta zu Hause kochen'] } },
        { id: 'ar-auswahl', form: 'abfolge', inhalt: { frage: 'Acht wichtige Schritte vom Korn zur Pasta: Was kommt zuerst, was zuletzt?', schritte: [
          'Hartweizen auf dem Feld säen', 'Das reife Getreide mit dem Mähdrescher ernten', 'In der Mühle das Getreide zu Griess mahlen', 'Griess und Wasser zu Teig kneten',
          'Die Teigwaren trocknen', 'Die Teigwaren verpacken', 'Die Pasta im Laden verkaufen', 'Die Pasta zu Hause kochen'] } }
      ] },

    { id: 'schritte-fragen', titel: 'Fragen zu den Arbeitsschritten', ziele: ['lz1'], voraussetzung: ['arbeitsschritte'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur Auswahlfragen mit drei bis vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Reihenfolge-Aufgaben und die Sätze in den anderen Themen prüfen dasselbe Wissen ohne Rateweg.',
      aufgaben: [
        { id: 'sf-maehdrescher', form: 'auswahl', inhalt: { frage: 'Womit wird reifes Getreide auf dem Feld geerntet?',
            richtig: 'mit dem Mähdrescher', falsch: ['mit dem Pflug', 'mit dem Backofen', 'mit der Mühle'] },
          hilfe: { weg: 'kette', schritte: ['Der Mähdrescher schneidet die reifen Ähren ab und löst die Körner heraus.', 'Der Pflug bereitet den Boden vor der Saat vor. Er erntet nichts.'] } },
        { id: 'sf-silo', form: 'auswahl', inhalt: { frage: 'Wozu dient ein Silo?',
            richtig: 'Im Silo wird das Getreide gelagert.', falsch: ['Im Silo wird das Getreide gesät.', 'Im Silo wird der Teig geknetet.', 'Im Silo wird die Pasta verkauft.'] },
          hilfe: { weg: 'kette', schritte: ['Ein Silo ist ein grosser Behälter. Darin bleibt das geerntete Getreide, bis es in die Mühle kommt.'] } },
        { id: 'sf-reinigen', form: 'auswahl', inhalt: { frage: 'Warum wird das Getreide vor dem Mahlen gereinigt?',
            richtig: 'Staub und Steinchen sollen nicht in den Griess kommen.', falsch: ['Damit es schneller wächst.', 'Damit der Teig süss wird.', 'Damit es dunkler wird.'] },
          hilfe: { weg: 'kette', schritte: ['Nach der Ernte steckt noch Staub im Getreide, und manchmal liegen Steinchen dazwischen.', 'Vor dem Mahlen wird alles entfernt, was nicht ins Essen gehört.'] } },
        { id: 'sf-griess', form: 'auswahl', inhalt: { frage: 'Was entsteht, wenn Hartweizen in der Mühle gemahlen wird?',
            richtig: 'Griess', falsch: ['Teig', 'Spaghetti', 'Wasser'] },
          hilfe: { weg: 'kette', schritte: ['In der Mühle werden die Körner zermahlen. Aus Hartweizen entsteht Griess.', 'Griess sind feine, gelbliche Körnchen. Aus Griess und Wasser wird später der Teig.'] } },
        { id: 'sf-teig', form: 'auswahl', inhalt: { frage: 'Woraus wird der Teig für Pasta geknetet?',
            richtig: 'aus Griess und Wasser', falsch: ['aus Zucker und Milch', 'aus Kartoffeln und Öl', 'aus Reis und Salz'] },
          hilfe: { weg: 'kette', schritte: ['Teigwaren werden aus Hartweizengriess gemacht.', 'In der Fabrik wird der Griess mit Wasser zu einem Teig geknetet.'] } },
        { id: 'sf-formen', form: 'auswahl', inhalt: { frage: 'Wie bekommen Teigwaren ihre Form?',
            richtig: 'Der Teig wird in Formen gepresst oder geschnitten.', falsch: ['Der Teig wird in der Mühle geformt.', 'Der Teig wird erst im Laden geformt.', 'Die Körner haben schon diese Form.'] },
          hilfe: { weg: 'kette', schritte: ['Der Teig wird durch Öffnungen gepresst, zum Beispiel für Spaghetti, oder in Stücke geschnitten.', 'Das geschieht in der Fabrik, bevor die Teigwaren trocknen.'] } },
        { id: 'sf-trocknen', form: 'auswahl', inhalt: { frage: 'Warum werden Teigwaren getrocknet?',
            richtig: 'Trockene Pasta hält sich lange.', falsch: ['Damit sie weich werden.', 'Damit sie nach Tomaten schmecken.', 'Damit sie schwerer werden.'] },
          hilfe: { weg: 'kette', schritte: ['Frisch geformter Teig ist feucht und verdirbt schnell.', 'Trockene Pasta kann man lange aufbewahren.'] } },
        { id: 'sf-kochen', form: 'auswahl', inhalt: { frage: 'Was geschieht beim Kochen mit der trockenen Pasta?',
            richtig: 'Sie nimmt Wasser auf und wird weich.', falsch: ['Sie wird noch härter.', 'Sie verwandelt sich in Mehl.', 'Sie wächst zu Getreide.'] },
          hilfe: { weg: 'kette', schritte: ['Trockene Pasta ist hart. Im kochenden Wasser saugt sie Wasser auf.', 'Dadurch wird sie weich und kann gegessen werden.'] } },
        { id: 'sf-nach-mahlen', form: 'auswahl', inhalt: { frage: 'Was folgt auf das Mahlen in der Mühle?',
            richtig: 'Aus dem Griess wird in der Fabrik Teig geknetet.', falsch: ['Das Getreide wird gesät.', 'Die Pasta wird gekocht.', 'Das Getreide wird geerntet.'] },
          hilfe: { weg: 'kette', schritte: ['Zuerst wird gemahlen, dann folgt die Fabrik.', 'Dort wird aus dem Griess mit Wasser ein Teig geknetet.'] } }
      ] },

    // ---- Lernziel 2: Weizenpflanze -----------------------------------------------------------------------------------------------------
    { id: 'weizenpflanze', titel: 'Die Weizenpflanze', ziele: ['lz2'],
      leiter: [{ box: 0, typ: 'reihenfolge' }],
      leiterRatenVerzicht: 'Vier bis acht Karten in die richtige Reihenfolge bringen: Die Chance, es zufällig richtig zu legen, liegt zwischen 1 zu 24 und 1 zu 40320.',
      hilfe: { weg: 'pflanze', schritte: [
        'Zuerst keimt das Korn in der Erde. Es bildet einen Keimling, danach wachsen Wurzeln und Blätter.',
        'Der Halm streckt sich in die Höhe. Oben erscheint die Ähre, und die Pflanze blüht.',
        'Danach reifen die Körner, bis sie goldgelb sind. Dann wird geerntet.'] },
      aufgaben: [
        { id: 'wp-ganz', form: 'abfolge', inhalt: { frage: 'Wie wächst eine Weizenpflanze? Was kommt zuerst, was zuletzt?', schritte: [
          'Ein Korn liegt in der Erde', 'Aus dem Korn wächst ein Keimling', 'Wurzeln und Blätter bilden sich', 'Der Halm wächst in die Höhe',
          'Die Ähre erscheint', 'Die Pflanze blüht', 'Die Körner reifen und werden goldgelb', 'Das Getreide wird geerntet'] } },
        { id: 'wp-anfang', form: 'abfolge', inhalt: { frage: 'Vom Korn zum Halm: Was kommt zuerst, was zuletzt?', schritte: [
          'Ein Korn liegt in der Erde', 'Aus dem Korn wächst ein Keimling', 'Wurzeln und Blätter bilden sich', 'Der Halm wächst in die Höhe'] } },
        { id: 'wp-mitte', form: 'abfolge', inhalt: { frage: 'Von den Blättern bis zur Blüte: Was kommt zuerst, was zuletzt?', schritte: [
          'Wurzeln und Blätter bilden sich', 'Der Halm wächst in die Höhe', 'Die Ähre erscheint', 'Die Pflanze blüht'] } },
        { id: 'wp-ende', form: 'abfolge', inhalt: { frage: 'Von der Ähre bis zur Ernte: Was kommt zuerst, was zuletzt?', schritte: [
          'Die Ähre erscheint', 'Die Pflanze blüht', 'Die Körner reifen und werden goldgelb', 'Das Getreide wird geerntet'] } },
        { id: 'wp-aehre', form: 'abfolge', inhalt: { frage: 'Vom Korn zur Ähre: Was kommt zuerst, was zuletzt?', schritte: [
          'Ein Korn liegt in der Erde', 'Aus dem Korn wächst ein Keimling', 'Wurzeln und Blätter bilden sich', 'Der Halm wächst in die Höhe', 'Die Ähre erscheint'] } },
        { id: 'wp-reife', form: 'abfolge', inhalt: { frage: 'Vom Halm bis zur Ernte: Was kommt zuerst, was zuletzt?', schritte: [
          'Der Halm wächst in die Höhe', 'Die Ähre erscheint', 'Die Pflanze blüht', 'Die Körner reifen und werden goldgelb', 'Das Getreide wird geerntet'] } },
        { id: 'wp-stationen', form: 'abfolge', inhalt: { frage: 'Vier Stationen im Leben der Pflanze: Was kommt zuerst, was zuletzt?', schritte: [
          'Ein Korn liegt in der Erde', 'Wurzeln und Blätter bilden sich', 'Die Ähre erscheint', 'Die Körner reifen und werden goldgelb'] } },
        { id: 'wp-sechs', form: 'abfolge', inhalt: { frage: 'Sechs Stufen der Weizenpflanze: Was kommt zuerst, was zuletzt?', schritte: [
          'Aus dem Korn wächst ein Keimling', 'Wurzeln und Blätter bilden sich', 'Der Halm wächst in die Höhe', 'Die Pflanze blüht',
          'Die Körner reifen und werden goldgelb', 'Das Getreide wird geerntet'] } }
      ] },

    { id: 'weizenpflanze-fragen', titel: 'Fragen zur Weizenpflanze', ziele: ['lz2'], voraussetzung: ['weizenpflanze'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur Auswahlfragen mit drei bis vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Reihenfolge-Aufgaben zur Pflanze prüfen dasselbe Wissen ohne Rateweg.',
      aufgaben: [
        { id: 'wf-aehre', form: 'auswahl', inhalt: { frage: 'Welcher Teil der Weizenpflanze trägt die Körner?',
            richtig: 'die Ähre', falsch: ['die Wurzel', 'das Blatt', 'der Keimling'] },
          hilfe: { weg: 'pflanze', schritte: ['Oben am Halm sitzt die Ähre. In ihr wachsen die Körner.'] } },
        { id: 'wf-wurzel', form: 'auswahl', inhalt: { frage: 'Wozu hat die Weizenpflanze Wurzeln?',
            richtig: 'Sie halten die Pflanze fest und nehmen Wasser auf.', falsch: ['Sie tragen die Körner.', 'Sie fangen Sonnenlicht ein.', 'Sie färben die Ähre goldgelb.'] },
          hilfe: { weg: 'pflanze', schritte: ['Die Wurzeln stecken in der Erde. Sie halten die Pflanze fest und holen Wasser aus dem Boden.', 'Das Sonnenlicht fangen die Blätter ein.'] } },
        { id: 'wf-halm', form: 'auswahl', inhalt: { frage: 'Was trägt die Ähre in die Höhe?',
            richtig: 'der Halm', falsch: ['die Wurzel', 'das Korn', 'der Keimling'] },
          hilfe: { weg: 'pflanze', schritte: ['Der Halm wächst in die Höhe. Oben an ihm erscheint die Ähre.'] } },
        { id: 'wf-ernte', form: 'auswahl', inhalt: { frage: 'Wann wird Weizen geerntet?',
            richtig: 'Wenn die Ähren goldgelb und die Körner reif sind.',
            falsch: [{ text: 'Wenn die Ähren noch grün sind.', code: 'ernte-zu-frueh' }, { text: 'Sobald die Pflanze blüht.', code: 'ernte-zu-frueh' }, 'Wenn der erste Schnee fällt.'] },
          hilfe: { weg: 'pflanze', schritte: ['Zuerst blüht die Pflanze, danach reifen die Körner. Beim Reifen werden sie hart und goldgelb.', 'Erst wenn die Körner reif sind, kommt der Mähdrescher.'] } },
        { id: 'wf-korn', form: 'auswahl', inhalt: { frage: 'Was steckt in einem Weizenkorn?',
            richtig: 'Ein Keimling mit einem Vorrat für die neue Pflanze.', falsch: ['Eine fertige kleine Ähre.', 'Nur Wasser.', 'Nur Luft.'] },
          hilfe: { weg: 'pflanze', schritte: ['Im Korn liegt der Keimling. Aus ihm kann eine neue Pflanze wachsen.', 'Um den Keimling liegt ein Vorrat, der ihn am Anfang ernährt.'] } },
        { id: 'wf-keimen', form: 'auswahl', inhalt: { frage: 'Was braucht ein Korn, damit es keimt?',
            richtig: 'Wasser und Wärme', falsch: ['nur Licht', 'Salz und Zucker', 'Frost und Trockenheit'] },
          hilfe: { weg: 'pflanze', schritte: ['Das Korn liegt in feuchter, warmer Erde. Es nimmt Wasser auf und beginnt zu keimen.'] } },
        { id: 'wf-bluete', form: 'auswahl', inhalt: { frage: 'Was entwickelt sich in der Ähre, nachdem die Pflanze geblüht hat?',
            richtig: 'die Körner', falsch: ['die Wurzeln', 'der Halm', 'die Blätter'] },
          hilfe: { weg: 'pflanze', schritte: ['Nach der Blüte reifen in der Ähre die Körner. Danach kann geerntet werden.'] } },
        { id: 'wf-farbe', form: 'auswahl', inhalt: { frage: 'Wie verändern sich die Körner beim Reifen?',
            richtig: 'Sie werden von grün zu goldgelb.', falsch: ['Sie werden von goldgelb zu grün.', 'Sie werden von weiss zu rot.', 'Sie bleiben immer grün.'] },
          hilfe: { weg: 'pflanze', schritte: ['Die Körner sind zuerst grün und weich. Beim Reifen werden sie hart und goldgelb.'] } }
      ] },

    // ---- Lernziel 3: Menschen und Preis ------------------------------------------------------------------------------------------------
    { id: 'menschen', titel: 'Die Menschen hinter der Pasta', ziele: ['lz3'], einfuehrung: 'erklaerung',
      leiter: [{ box: 0, typ: 'karteikarten' }, { box: 1, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      leiterRatenVerzicht: 'Acht Berufe mit je einer eigenen Arbeit: Beim Zuordnen von drei bis sechs Karten ist die Chance, alle zu erraten, klein. Die Karteikarten zeigen die Lösung zuerst.',
      hilfe: { weg: 'menschen', schritte: [
        'An der Pasta arbeiten viele Menschen: auf dem Feld, beim Transport, im Lager, in der Mühle, in der Fabrik und im Laden.',
        'Jeder Beruf hat eine eigene Arbeit. Frage dich, in welchem Schritt vom Korn zur Pasta die Person arbeitet.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['me-landwirt',   'Landwirtin oder Landwirt',             'sät, pflegt und erntet das Getreide'],
        ['me-chauffeur',  'Chauffeuse oder Chauffeur',            'transportiert Getreide und Pasta'],
        ['me-lagerist',   'Lageristin oder Lagerist',             'lagert und überwacht das Getreide'],
        ['me-muellerin',  'Müllerin oder Müller',                 'reinigt das Getreide und mahlt Griess'],
        ['me-fabrik',     'Fabrikarbeiterin oder Fabrikarbeiter', 'knetet, formt und trocknet die Pasta'],
        ['me-mechaniker', 'Mechanikerin oder Mechaniker',         'wartet und repariert die Maschinen'],
        ['me-verkauf',    'Verkäuferin oder Verkäufer',           'verkauft die Pasta im Laden'],
        ['me-kunde',      'Kundin oder Kunde',                    'kauft die Pasta und kocht sie']
      ] } } },

    { id: 'preis', titel: 'Warum die Pasta ihren Preis hat', ziele: ['lz3'], voraussetzung: ['menschen'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur Auswahlfragen mit drei bis vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Zuordnung der Berufe im Thema davor prüft verwandtes Wissen ohne Rateweg.',
      aufgaben: [
        { id: 'pr-kette', form: 'auswahl', inhalt: { frage: 'Was zeigt die Wertschöpfungskette der Pasta?',
            richtig: 'die Schritte und Menschen vom Korn bis zur Pasta im Laden',
            falsch: ['nur die Maschinen in der Fabrik', 'nur den Preis der Pasta', 'nur die Menschen im Laden'] },
          hilfe: { weg: 'preis', schritte: ['Die Wertschöpfungskette besteht aus allen Schritten und allen Menschen vom Korn bis zur Pasta im Laden.', 'Bei jedem Schritt kommt Arbeit dazu, und das macht die Pasta wertvoller.'] } },
        { id: 'pr-warum', form: 'auswahl', inhalt: { frage: 'Warum kostet eine Packung Pasta Geld?',
            richtig: 'Alle Arbeiten, Maschinen und Transporte müssen bezahlt werden.',
            falsch: [{ text: 'Nur das Getreide kostet etwas.', code: 'preis-nur-zutat' }, 'Der Laden denkt sich einfach einen Preis aus.', 'Die Pasta kostet nur, weil sie gut aussieht.'] },
          hilfe: { weg: 'preis', schritte: ['Viele Menschen arbeiten an der Pasta, und Maschinen, Energie und Lastwagen werden gebraucht.', 'Alles zusammen steckt im Preis, den man im Laden bezahlt.'] } },
        { id: 'pr-kosten', form: 'auswahl', inhalt: { frage: 'Was gehört alles zum Preis der Pasta?',
            richtig: 'Arbeit, Maschinen, Energie, Transport, Verpackung und Laden',
            falsch: [{ text: 'nur das Korn vom Feld', code: 'preis-nur-zutat' }, 'nur die Packung', 'nur der Laden'] },
          hilfe: { weg: 'preis', schritte: ['Vom Feld bis zum Regal fällt viel an: Arbeit, Maschinen, Energie, Transport, Verpackung und der Laden.', 'Das Korn allein macht nur einen Teil des Preises aus.'] } },
        { id: 'pr-wer', form: 'auswahl', inhalt: { frage: 'Wer wird vom Preis der Pasta mitbezahlt?',
            richtig: 'alle Menschen, die an der Pasta gearbeitet haben',
            falsch: ['nur die Verkäuferin im Laden', 'nur der Landwirt', 'nur der Chauffeur'] },
          hilfe: { weg: 'preis', schritte: ['Vom Preis bekommen alle etwas, die an der Pasta gearbeitet haben: auf dem Feld, im Lager, in der Mühle, in der Fabrik und im Laden.'] } },
        { id: 'pr-laden', form: 'auswahl', inhalt: { frage: 'Warum bezahlt man im Laden mehr, als der Landwirt für sein Getreide bekommt?',
            richtig: 'Auf dem Weg zur Pasta kommen viel Arbeit und Kosten dazu.',
            falsch: ['Der Landwirt verschenkt sein Getreide.', 'Im Laden ist alles ohne Grund teurer.', 'Beim Kochen entsteht mehr Pasta.'] },
          hilfe: { weg: 'preis', schritte: ['Aus dem Getreide wird erst durch viele Schritte Pasta im Regal: mahlen, kneten, formen, trocknen, verpacken, liefern.', 'Jeder Schritt kostet Arbeit und Geld.'] } },
        { id: 'pr-verpackung', form: 'auswahl', inhalt: { frage: 'Warum steckt die Verpackung im Preis der Pasta?',
            richtig: 'Sie muss hergestellt und bedruckt werden, das kostet Geld.',
            falsch: [{ text: 'Sie kostet nichts, weil sie im Abfall landet.', code: 'preis-nur-zutat' }, 'Sie wird vom Laden verschenkt.', 'Sie macht die Pasta schwerer.'] },
          hilfe: { weg: 'preis', schritte: ['Auch die Packung wird in einer Fabrik gemacht und bedruckt.', 'Das kostet Material, Energie und Arbeit und ist deshalb ein Teil des Preises.'] } },
        { id: 'pr-transport', form: 'auswahl', inhalt: { frage: 'Warum kostet der Transport der Pasta Geld?',
            richtig: 'Lastwagen, Treibstoff und Chauffeure müssen bezahlt werden.',
            falsch: ['Der Transport ist gratis, die Strasse gehört allen.', 'Nur der Treibstoff kostet, die Menschen arbeiten gratis.', 'Die Pasta fährt von selbst in den Laden.'] },
          hilfe: { weg: 'preis', schritte: ['Das Getreide und die Pasta werden mehrmals gefahren: vom Feld zum Silo, in die Fabrik und in den Laden.', 'Dafür braucht es Lastwagen, Treibstoff und Menschen, die fahren.'] } },
        { id: 'pr-fabrik', form: 'auswahl', inhalt: { frage: 'Was kostet in der Teigwarenfabrik Geld?',
            richtig: 'Maschinen, Energie und die Arbeit der Mitarbeitenden',
            falsch: ['nur das Wasser für den Teig', 'nichts, die Maschinen arbeiten gratis', 'nur die Packung'] },
          hilfe: { weg: 'preis', schritte: ['In der Fabrik laufen Maschinen, die Strom brauchen. Menschen bedienen und warten sie.', 'Beides kostet Geld und steckt im Preis der Pasta.'] } }
      ] },

    // ---- Lernziel 4: Weissmehl und Vollkornmehl -----------------------------------------------------------------------------------------
    { id: 'mehl', titel: 'Weissmehl und Vollkornmehl', ziele: ['lz4'], einfuehrung: 'erklaerung',
      leiter: [{ box: 0, typ: 'karteikarten' }, { box: 1, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      leiterRatenVerzicht: 'Drei Felder und Gruppen von drei bis sechs Karten: Die Chance, alle zu erraten, ist klein. Die Karteikarten zeigen die Lösung zuerst, die Sätze im Thema «Mehl in ganzen Sätzen» prüfen ohne Rateweg.',
      hilfe: { weg: 'mehl', schritte: [
        'Ein Weizenkorn hat drei Teile: die Schale (Kleie), den Mehlkörper und den Keimling.',
        'Weissmehl besteht nur aus dem Mehlkörper. Schale und Keimling sind entfernt, darum ist es hell.',
        'Vollkornmehl enthält das ganze Korn mit Schale und Keimling. Es ist dunkler, hat mehr Ballaststoffe und macht länger satt.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['mh-schale',       'Schale (Kleie)',                         'Vollkornmehl'],
        ['mh-keimling',     'Keimling',                               'Vollkornmehl'],
        ['mh-mehlkoerper',  'Mehlkörper',                             'Beide Mehle'],
        ['mh-getreide',     'Wird aus Getreide gemahlen',             'Beide Mehle'],
        ['mh-hell',         'Sehr helle Farbe',                       'Weissmehl'],
        ['mh-wenig',        'Wenig Ballaststoffe',                    'Weissmehl'],
        ['mh-nur-kern',     'Besteht nur aus dem Mehlkörper',         'Weissmehl'],
        ['mh-entfernt',     'Schale und Keimling sind entfernt',      'Weissmehl'],
        ['mh-braun',        'Bräunlich mit dunklen Flöckchen',        'Vollkornmehl'],
        ['mh-viel',         'Viele Ballaststoffe',                    'Vollkornmehl'],
        ['mh-satt',         'Macht länger satt',                      'Vollkornmehl'],
        ['mh-ganzes-korn',  'Das ganze Korn wird gemahlen',           'Vollkornmehl']
      ] } } },

    { id: 'mehl-fragen', titel: 'Fragen zum Mehl', ziele: ['lz4'], voraussetzung: ['mehl'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur Auswahlfragen mit drei bis vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Zuordnung im Thema davor und die Sätze im Thema danach prüfen dasselbe ohne Rateweg.',
      aufgaben: [
        { id: 'mf-teile', form: 'auswahl', inhalt: { frage: 'Aus welchen drei Teilen besteht ein Weizenkorn?',
            richtig: 'Schale, Mehlkörper und Keimling',
            falsch: [{ text: 'Halm, Ähre und Wurzel', code: 'korn-teile-verwechselt' }, 'Schale, Hefe und Wasser', 'Griess, Mehl und Teig'] },
          hilfe: { weg: 'mehl', schritte: ['Das Korn hat aussen die Schale (Kleie), innen den grossen Mehlkörper und den kleinen Keimling.', 'Halm, Ähre und Wurzel sind Teile der ganzen Pflanze, nicht des Korns.'] } },
        { id: 'mf-kleie', form: 'auswahl', inhalt: { frage: 'Wie nennt man die Schale des Weizenkorns auch?',
            richtig: 'Kleie', falsch: [{ text: 'Keimling', code: 'korn-teile-verwechselt' }, 'Griess', 'Hefe'] },
          hilfe: { weg: 'mehl', schritte: ['Die äussere Schale des Korns heisst auch Kleie.', 'Der Keimling ist ein anderer Teil: Aus ihm kann eine neue Pflanze wachsen.'] } },
        { id: 'mf-weiss', form: 'auswahl', inhalt: { frage: 'Was steckt im Weissmehl?',
            richtig: 'nur der Mehlkörper',
            falsch: [{ text: 'das ganze Korn mit Schale und Keimling', code: 'schale-weissmehl' }, { text: 'vor allem die Schale', code: 'schale-weissmehl' }, { text: 'nur der Keimling', code: 'korn-teile-verwechselt' }] },
          hilfe: { weg: 'mehl', schritte: ['Für Weissmehl werden Schale und Keimling entfernt. Übrig bleibt der Mehlkörper.', 'Darum ist Weissmehl hell.'] } },
        { id: 'mf-voll', form: 'auswahl', inhalt: { frage: 'Was steckt im Vollkornmehl?',
            richtig: 'das ganze Korn mit Schale und Keimling',
            falsch: [{ text: 'nur der Mehlkörper', code: 'schale-weissmehl' }, { text: 'nur die Schale', code: 'korn-teile-verwechselt' }, { text: 'nur der Keimling', code: 'korn-teile-verwechselt' }] },
          hilfe: { weg: 'mehl', schritte: ['Für Vollkornmehl wird das ganze Korn gemahlen: Schale, Keimling und Mehlkörper.', 'Darum heisst es Vollkorn.'] } },
        { id: 'mf-farbe', form: 'auswahl', inhalt: { frage: 'Warum ist Vollkornmehl dunkler als Weissmehl?',
            richtig: 'Schale und Keimling werden mitgemahlen.', falsch: ['Es wird nachträglich eingefärbt.', 'Es ist feuchter.', 'Es wird länger gebacken.'] },
          hilfe: { weg: 'mehl', schritte: ['Die Schale ist braun. Weil sie im Vollkornmehl mitgemahlen wird, sieht das Mehl dunkler aus.'] } },
        { id: 'mf-satt', form: 'auswahl', inhalt: { frage: 'Warum macht Vollkornbrot oft länger satt als Weissbrot?',
            richtig: 'Es enthält mehr Ballaststoffe.', falsch: ['Es enthält mehr Zucker.', 'Es ist einfach grösser.', 'Es ist immer frisch gebacken.'] },
          hilfe: { weg: 'mehl', schritte: ['Ballaststoffe stecken vor allem in der Schale. Sie füllen und wirken lange.', 'Vollkornmehl hat die Schale dabei, Weissmehl nicht.'] } },
        { id: 'mf-ballast', form: 'auswahl', inhalt: { frage: 'Was sind Ballaststoffe?',
            richtig: 'Teile aus Pflanzen, die der Körper kaum verdaut',
            falsch: ['Zusätze, die das Mehl weisser machen', 'Steine, die in der Mühle ins Mehl fallen', 'Süssstoffe im Mehl'] },
          hilfe: { weg: 'mehl', schritte: ['Ballaststoffe sind Teile von Pflanzen, die der Körper nicht abbaut.', 'Sie sind trotzdem nützlich, denn sie helfen der Verdauung und machen satt.'] } },
        { id: 'mf-pasta', form: 'auswahl', inhalt: { frage: 'Woraus wird Pasta hauptsächlich gemacht?',
            richtig: 'aus Hartweizengriess', falsch: ['aus Kartoffelstärke', 'aus Reismehl', 'aus Haferflocken'] },
          hilfe: { weg: 'mehl', schritte: ['Teigwaren werden aus Hartweizengriess gemacht.', 'Hartweizen ist eine Weizenart mit besonders harten Körnern.'] } },
        { id: 'mf-griess', form: 'auswahl', inhalt: { frage: 'Was ist Griess?',
            richtig: 'grob gemahlener Hartweizen',
            falsch: ['fein gesiebter Zucker', 'ein fertiger Teig aus Wasser und Mehl', 'die Schale des Korns'] },
          hilfe: { weg: 'mehl', schritte: ['Griess entsteht in der Mühle. Die Körner werden nicht ganz fein, sondern körnig gemahlen.'] } }
      ] },

    { id: 'mehl-erklaeren', titel: 'Mehl in ganzen Sätzen', ziele: ['lz4'], voraussetzung: ['mehl-fragen'],
      leiter: [{ box: 0, typ: 'freitext' }],
      leiterRatenVerzicht: 'Freitext: Das Kind schreibt selbst und prüft sich mit den Kriterien, Raten ist nicht möglich. Die Obergrenze Box 3 gehört zur Selbstkontrolle.',
      aufgaben: [
        { id: 'mx-unterschied', form: 'frei',
          inhalt: { frage: 'Erkläre in ganzen Sätzen den Unterschied zwischen Weissmehl und Vollkornmehl.',
            kriterien: ['Ich sage, dass Weissmehl nur aus dem Mehlkörper besteht und Schale und Keimling entfernt sind.',
              'Ich sage, dass für Vollkornmehl das ganze Korn mit Schale und Keimling gemahlen wird.',
              'Ich nenne einen Unterschied, den man sieht: Vollkornmehl ist dunkler, Weissmehl ist heller.',
              'Ich nenne einen Unterschied beim Essen: Vollkornmehl hat mehr Ballaststoffe und macht länger satt.',
              'Ich habe in ganzen Sätzen geschrieben.'],
            muster: 'Im Weissmehl ist nur der Mehlkörper des Korns. Die Schale und der Keimling sind entfernt, darum ist es hell. Im Vollkornmehl wird das ganze Korn gemahlen, mit Schale und Keimling. Es ist dunkler, hat mehr Ballaststoffe und macht länger satt.' },
          hilfe: { weg: 'mehl', schritte: ['Schreibe zuerst, was im Weissmehl steckt, und dann, was im Vollkornmehl steckt.', 'Nenne danach einen Unterschied, den man sieht oder beim Essen merkt.'] } }
      ] },

    // ---- Lernziel 5: nachhaltig einkaufen ---------------------------------------------------------------------------------------------
    { id: 'nachhaltig', titel: 'Nachhaltig einkaufen', ziele: ['lz5'], einfuehrung: 'erklaerung',
      leiter: [{ box: 0, typ: 'karteikarten' }, { box: 1, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur zwei Felder, bei einer einzelnen Karte liegt die Chance bei 1 zu 2. Gruppen von drei bis sechs Karten und die Fragen im Thema danach mildern das. Die Karteikarten zeigen die Lösung zuerst.',
      hilfe: { weg: 'nachhaltig', schritte: [
        'Nachhaltig einkaufen heisst: Natur und Menschen schonen, damit auch später genug da ist.',
        'Hilfreich sind kurze Transportwege (Getreide aus der Schweiz oder der Region), Labels wie die Bio-Knospe und wenig, wiederverwertbare Verpackung.',
        'Auch gut ist es, nur so viel zu kaufen, wie man braucht, damit nichts im Abfall landet.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['nh-schweiz',    'Getreide aus der Schweiz',              'Nachhaltiger'],
        ['nh-region',     'Getreide aus der Region',               'Nachhaltiger'],
        ['nh-bio',        'Pasta mit der Bio-Knospe',              'Nachhaltiger'],
        ['nh-wenig',      'Wenig Verpackung',                      'Nachhaltiger'],
        ['nh-recycling',  'Wiederverwertbare Verpackung',          'Nachhaltiger'],
        ['nh-menge',      'Nur so viel kaufen, wie man braucht',   'Nachhaltiger'],
        ['nh-gross',      'Grosse Packung statt Portionenbeutel',  'Nachhaltiger'],
        ['nh-weit',       'Getreide von weit her',                 'Weniger nachhaltig'],
        ['nh-plastik',    'Viel Plastik in der Verpackung',        'Weniger nachhaltig'],
        ['nh-einzeln',    'Jede Portion einzeln verpackt',         'Weniger nachhaltig'],
        ['nh-zuviel',     'Mehr kaufen, als man essen kann',       'Weniger nachhaltig'],
        ['nh-wegwerfen',  'Gute Pasta wegwerfen',                  'Weniger nachhaltig']
      ] } } },

    { id: 'nachhaltig-fragen', titel: 'Fragen zum nachhaltigen Einkauf', ziele: ['lz5'], voraussetzung: ['nachhaltig'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur Auswahlfragen mit drei bis vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Zuordnung im Thema davor und die Sätze im Thema danach prüfen dasselbe ohne Rateweg.',
      aufgaben: [
        { id: 'nf-nachhaltig', form: 'auswahl', inhalt: { frage: 'Was heisst nachhaltig?',
            richtig: 'So handeln, dass Natur und Menschen auch später genug haben.',
            falsch: ['So kaufen, dass es möglichst billig ist.', 'So einkaufen, dass die Packung lange hält.', 'Möglichst viel einkaufen.'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Nachhaltig heisst, mit Natur und Menschen so umzugehen, dass auch später noch genug da ist.'] } },
        { id: 'nf-herkunft', form: 'auswahl', inhalt: { frage: 'Warum ist Getreide aus der Region oft nachhaltiger?',
            richtig: 'Der Transportweg ist kürzer.', falsch: ['Es braucht kein Wasser zum Wachsen.', 'Es braucht keine Verpackung.', 'Es schmeckt immer besser.'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Je kürzer der Weg, desto weniger Treibstoff verbrauchen Lastwagen und Schiffe.', 'Das schont die Umwelt.'] } },
        { id: 'nf-knospe', form: 'auswahl', inhalt: { frage: 'Was zeigt die Bio-Knospe auf einer Packung?',
            richtig: 'Das Getreide stammt aus biologischem Anbau.',
            falsch: ['Die Pasta ist besonders schnell gekocht.', 'Die Pasta ist besonders billig.', 'Die Pasta hat kein Datum.'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Die Bio-Knospe ist ein Label. Es zeigt, dass die Landwirte nach den Regeln des Biolandbaus arbeiten.'] } },
        { id: 'nf-verpackung', form: 'auswahl', inhalt: { frage: 'Welche Verpackung ist nachhaltiger?',
            richtig: 'wenig Verpackung, die man wiederverwerten kann',
            falsch: ['mehrere Schichten Plastik', 'jede Portion einzeln verpackt', 'eine möglichst grosse, bunte Schachtel'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Jede Verpackung braucht Material und Energie und wird später zu Abfall.', 'Wenig Verpackung und Verpackung, die man wiederverwerten kann, schonen die Umwelt am meisten.'] } },
        { id: 'nf-menge', form: 'auswahl', inhalt: { frage: 'Warum kauft man nur so viel Pasta, wie man braucht?',
            richtig: 'Damit nichts im Abfall landet.', falsch: ['Damit die Packung leichter ist.', 'Damit die Pasta schneller kocht.', 'Damit die Pasta teurer wird.'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Was man nicht isst, wird weggeworfen. Dann waren Anbau, Transport und Verpackung umsonst.'] } },
        { id: 'nf-datum', form: 'auswahl', inhalt: { frage: 'Auf der Packung steht «mindestens haltbar bis». Was heisst das?',
            richtig: 'Bis dahin bleibt die Qualität sicher. Danach ist trockene Pasta oft noch gut.',
            falsch: [{ text: 'Danach muss man die Pasta sofort wegwerfen.', code: 'datum-wegwerfen' }, 'Davor darf man die Pasta nicht essen.', 'Das Datum zeigt, woher die Pasta kommt.'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Das Datum sagt, bis wann der Hersteller die gute Qualität verspricht.', 'Trockene Pasta ist danach oft noch gut. Man schaut und riecht, bevor man sie kocht.'] } },
        { id: 'nf-worauf', form: 'auswahl', inhalt: { frage: 'Du möchtest nachhaltige Pasta kaufen. Worauf schaust du?',
            richtig: 'auf Herkunft, Label und Verpackung',
            falsch: [{ text: 'auf das Haltbarkeitsdatum', code: 'haltbarkeit-statt-nachhaltig' }, 'auf die Farbe der Packung', 'auf den Namen der Pasta'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Nachhaltig ist, was Natur und Menschen schont. Das sieht man an der Herkunft, an Labels wie der Bio-Knospe und an der Verpackung.', 'Das Haltbarkeitsdatum sagt nichts darüber.'] } },
        { id: 'nf-aufbrauchen', form: 'auswahl', inhalt: { frage: 'Was ist besser für die Umwelt?',
            richtig: 'Pasta aufbrauchen, bevor man neue kauft',
            falsch: [{ text: 'Pasta wegwerfen, wenn die Packung alt aussieht', code: 'datum-wegwerfen' }, 'immer eine neue Packung öffnen', 'Pasta kaufen und im Schrank vergessen'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Wer zuerst aufbraucht, was zu Hause liegt, wirft weniger weg.'] } },
        { id: 'nf-transport', form: 'auswahl', inhalt: { frage: 'Was belastet die Umwelt besonders?',
            richtig: 'ein langer Transport über weite Strecken',
            falsch: ['ein kurzer Weg zum Laden', 'eine Verpackung aus Papier', 'Pasta aus der Region'] },
          hilfe: { weg: 'nachhaltig', schritte: ['Lange Transporte brauchen viel Energie. Kurze Wege und regionale Produkte brauchen weniger.'] } }
      ] },

    { id: 'nachhaltig-erklaeren', titel: 'Nachhaltige Pasta in ganzen Sätzen', ziele: ['lz5'], voraussetzung: ['nachhaltig-fragen'],
      leiter: [{ box: 0, typ: 'freitext' }],
      leiterRatenVerzicht: 'Freitext: Das Kind schreibt selbst und prüft sich mit den Kriterien, Raten ist nicht möglich. Die Obergrenze Box 3 gehört zur Selbstkontrolle.',
      aufgaben: [
        { id: 'nx-pasta-kaufen', form: 'frei',
          inhalt: { frage: 'Du möchtest nachhaltige Pasta kaufen. Worauf schaust du?',
            kriterien: ['Ich schaue auf die Herkunft: Getreide aus der Schweiz oder der Region hat einen kurzen Weg.',
              'Ich schaue auf ein Label, zum Beispiel die Bio-Knospe.',
              'Ich schaue auf die Verpackung: wenig und wiederverwertbar.',
              'Ich kaufe nur so viel, wie ich brauche, damit nichts im Abfall landet.'],
            muster: 'Ich schaue zuerst, woher das Getreide kommt. Getreide aus der Schweiz oder aus der Region hat einen kurzen Weg. Ich suche ein Label wie die Bio-Knospe. Die Verpackung soll möglichst klein sein und sich wiederverwerten lassen. Und ich kaufe nur so viel, wie ich brauche.' },
          hilfe: { weg: 'nachhaltig', schritte: ['Denke an den Weg der Pasta, an die Labels auf der Packung und an die Verpackung.', 'Schreibe zu jedem Punkt einen Satz.'] } }
      ] },

    // ---- Lernziele 6 und 7: Lebensmittelpyramide ---------------------------------------------------------------------------------------
    { id: 'pyramide', titel: 'Die Lebensmittelpyramide', ziele: ['lz6'], einfuehrung: 'erklaerung',
      leiter: [{ box: 0, typ: 'karteikarten' }, { box: 1, typ: 'zuordnen', ersatz: 'multiple-choice' }],
      leiterRatenVerzicht: 'Sechs Stufen und Gruppen von drei bis sechs Karten: Die Chance, alle zu erraten, ist klein. Die Karteikarten zeigen die Lösung zuerst, die Sätze im Thema danach prüfen ohne Rateweg.',
      hilfe: { weg: 'pyramide', schritte: [
        'Die Pyramide hat sechs Stufen. Ganz unten stehen die Getränke ohne Zucker, zum Beispiel Wasser und ungesüsster Tee.',
        'Darüber folgen Gemüse und Früchte, dann Getreide und Kartoffeln, zum Beispiel Brot, Pasta, Reis und Kartoffeln.',
        'Die vierte Stufe sind Milchprodukte, Eier, Fleisch und Fisch. Die fünfte Stufe sind Nüsse, Samen, Öle und Fette.',
        'Ganz oben stehen Süsses, Salziges und Alkoholisches. Davon isst und trinkt man nur wenig.'] },
      aufgaben: { tabelle: { form: 'paar', spalten: ['id', 'links', 'rechts'], zeilen: [
        ['py-leitungswasser', 'Leitungswasser',                   'Getränke (ungesüsst)'],
        ['py-mineralwasser',  'Mineralwasser',                    'Getränke (ungesüsst)'],
        ['py-tee',            'Tee ohne Zucker',                  'Getränke (ungesüsst)'],
        ['py-karotte',        'Karotte',                          'Gemüse und Früchte'],
        ['py-apfel',          'Apfel',                            'Gemüse und Früchte'],
        ['py-broccoli',       'Broccoli',                         'Gemüse und Früchte'],
        ['py-brot',           'Brot',                             'Getreide und Kartoffeln'],
        ['py-spaghetti',      'Spaghetti',                        'Getreide und Kartoffeln'],
        ['py-reis',           'Reis',                             'Getreide und Kartoffeln'],
        ['py-kartoffeln',     'Kartoffeln',                       'Getreide und Kartoffeln'],
        ['py-milch',          'Milch',                            'Milchprodukte, Eier, Fleisch, Fisch'],
        ['py-joghurt',        'Joghurt',                          'Milchprodukte, Eier, Fleisch, Fisch'],
        ['py-kaese',          'Käse',                             'Milchprodukte, Eier, Fleisch, Fisch'],
        ['py-ei',             'Ei',                               'Milchprodukte, Eier, Fleisch, Fisch'],
        ['py-baumnuesse',     'Baumnüsse',                        'Nüsse, Samen, Öle und Fette'],
        ['py-rapsoel',        'Rapsöl',                           'Nüsse, Samen, Öle und Fette'],
        ['py-sonnenblumen',   'Sonnenblumenkerne',                'Nüsse, Samen, Öle und Fette'],
        ['py-schokolade',     'Schokolade',                       'Süsses, Salziges und Alkoholisches'],
        ['py-chips',          'Chips',                            'Süsses, Salziges und Alkoholisches'],
        ['py-gummibaerchen',  'Gummibärchen',                     'Süsses, Salziges und Alkoholisches'],
        ['py-limonade',       'Süssgetränk (Limonade)',           'Süsses, Salziges und Alkoholisches']
      ] } } },

    { id: 'pyramide-aufbau', titel: 'Der Aufbau der Pyramide', ziele: ['lz6', 'lz7'], voraussetzung: ['pyramide'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],
      leiterRatenVerzicht: 'Nur Auswahlfragen mit drei bis vier Antworten, Raten gelingt mit einer Chance von 1 zu 4. Die Zuordnung im Thema davor und die Sätze im Thema danach prüfen dasselbe ohne Rateweg.',
      aufgaben: [
        { id: 'pa-stufen', form: 'auswahl', inhalt: { frage: 'Wie viele Stufen hat die Lebensmittelpyramide (die Ernährungspyramide)?',
            richtig: 'sechs', falsch: ['drei', 'vier', 'acht'] },
          hilfe: { weg: 'pyramide', schritte: ['Die Pyramide hat sechs Stufen, von den Getränken ganz unten bis zu Süssem, Salzigem und Alkoholischem ganz oben.'] } },
        { id: 'pa-unten', form: 'auswahl', inhalt: { frage: 'Welche Stufe steht in der Pyramide ganz unten?',
            richtig: 'Getränke ohne Zucker', falsch: ['Süsses und Salziges', 'Nüsse und Öle', 'Fleisch und Fisch'] },
          hilfe: { weg: 'pyramide', schritte: ['Die unterste und breiteste Stufe sind die Getränke ohne Zucker, zum Beispiel Wasser und ungesüsster Tee.'] } },
        { id: 'pa-oben', form: 'auswahl', inhalt: { frage: 'Was steht in der Pyramide ganz oben?',
            richtig: 'Süsses, Salziges und Alkoholisches', falsch: ['Gemüse und Früchte', 'Getreide und Kartoffeln', 'Getränke ohne Zucker'] },
          hilfe: { weg: 'pyramide', schritte: ['Ganz oben ist die schmalste Stufe. Dort stehen Süsses, Salziges und Alkoholisches.'] } },
        { id: 'pa-breit', form: 'auswahl', inhalt: { frage: 'Was zeigt die Breite einer Stufe?',
            richtig: 'Wie viel man davon täglich essen oder trinken soll.',
            falsch: [{ text: 'Wie gesund die Lebensmittel sind.', code: 'breite-gesund' }, 'Wie gut die Lebensmittel schmecken.', 'Wie teuer die Lebensmittel sind.'] },
          hilfe: { weg: 'pyramide', schritte: ['Eine breite Stufe heisst: Davon darf man viel essen oder trinken. Eine schmale Stufe heisst: Davon nur wenig.', 'Die Breite zeigt also die Menge.'] } },
        { id: 'pa-viel', form: 'auswahl', inhalt: { frage: 'Von welcher Stufe sollte man am meisten zu sich nehmen?',
            richtig: 'von der untersten, breitesten Stufe',
            falsch: ['von der obersten, schmalsten Stufe', 'von der Stufe mit Süssem', 'von allen Stufen gleich viel'] },
          hilfe: { weg: 'pyramide', schritte: ['Die breiteste Stufe liegt unten. Davon braucht man am meisten.'] } },
        { id: 'pa-wenig', form: 'auswahl', inhalt: { frage: 'Wie viel sollte man von der obersten Stufe essen?',
            richtig: 'nur wenig', falsch: ['am meisten', 'jeden Tag eine grosse Portion', 'nie, es ist verboten'] },
          hilfe: { weg: 'pyramide', schritte: ['Die oberste Stufe ist schmal. Davon isst man nur wenig, aber ganz verboten ist es nicht.'] } },
        { id: 'pa-milch', form: 'auswahl', inhalt: { frage: 'Welches Lebensmittel gehört zu den Milchprodukten?',
            richtig: 'Joghurt', falsch: [{ text: 'Orangensaft', code: 'saft-milch' }, 'Brot', 'Apfel'] },
          hilfe: { weg: 'pyramide', schritte: ['Milchprodukte werden aus Milch gemacht, zum Beispiel Joghurt, Käse und Quark.', 'Saft wird aus Früchten gepresst und gehört nicht dazu.'] } },
        { id: 'pa-getraenke', form: 'auswahl', inhalt: { frage: 'Welche Getränke stehen auf der untersten Stufe?',
            richtig: 'Wasser und ungesüsster Tee', falsch: ['Limonade und Sirup', 'Fruchtsaft und Limonade', 'Milch und Fruchtsaft'] },
          hilfe: { weg: 'pyramide', schritte: ['Auf der untersten Stufe stehen Getränke ohne Zucker, zum Beispiel Wasser und ungesüsster Tee.'] } }
      ] },

    { id: 'pyramide-erklaeren', titel: 'Die Pyramide in ganzen Sätzen', ziele: ['lz7'], voraussetzung: ['pyramide-aufbau'],
      leiter: [{ box: 0, typ: 'freitext' }],
      leiterRatenVerzicht: 'Freitext: Das Kind schreibt selbst und prüft sich mit den Kriterien, Raten ist nicht möglich. Die Obergrenze Box 3 gehört zur Selbstkontrolle.',
      aufgaben: [
        { id: 'px-aufbau', form: 'frei',
          inhalt: { frage: 'Erkläre den Aufbau der Lebensmittelpyramide.',
            kriterien: ['Ich sage, dass die Pyramide sechs Stufen hat.',
              'Ich sage, dass unten die Getränke ohne Zucker stehen und oben Süsses, Salziges und Alkoholisches.',
              'Ich sage, dass die Breite einer Stufe zeigt, wie viel man davon essen oder trinken soll.',
              'Ich sage: Von breiten Stufen viel, von schmalen Stufen wenig.'],
            muster: 'Die Pyramide hat sechs Stufen. Unten stehen die Getränke ohne Zucker, darüber Gemüse und Früchte, dann Getreide und Kartoffeln, Milchprodukte, Eier, Fleisch und Fisch und dann Nüsse, Samen, Öle und Fette. Ganz oben stehen Süsses, Salziges und Alkoholisches. Je breiter eine Stufe ist, desto mehr soll man davon essen oder trinken. Von den schmalen Stufen oben isst man nur wenig.' },
          hilfe: { weg: 'pyramide', schritte: ['Schreibe, wie viele Stufen es sind und was ganz unten und ganz oben steht.', 'Schreibe danach, was die Breite einer Stufe bedeutet.'] } }
      ] }
  ],

  fehlerCodes: {
    'saft-milch': {
      kind:   'Saft ist ein Getränk aus Früchten. Milchprodukte werden aus Milch gemacht, zum Beispiel Joghurt, Käse und Quark.',
      eltern: 'Getränke und Milchprodukte werden vermischt, vermutlich weil beides flüssig sein kann. Hilft: im Kühlschrank gemeinsam sortieren, was aus Milch gemacht ist und was nicht, und dabei die Stufe der Pyramide nennen.',
      folge:  null
    },
    'schale-weissmehl': {
      kind:   'Im Weissmehl sind Schale und Keimling entfernt, es besteht nur aus dem Mehlkörper. Im Vollkornmehl ist das ganze Korn dabei, auch die Schale.',
      eltern: 'Die Zusammensetzung der beiden Mehle wird vertauscht. Hilft: zwei Mehle nebeneinander ansehen und fragen, welches dunkler ist und warum. Danach das Korn mit seinen drei Teilen aufzeichnen lassen.',
      folge:  null
    },
    'korn-teile-verwechselt': {
      kind:   'Das Weizenkorn hat drei Teile: die Schale (Kleie), den Mehlkörper und den Keimling. Halm, Ähre und Wurzel gehören zur ganzen Pflanze.',
      eltern: 'Teile des Korns oder der Pflanze werden verwechselt. Hilft: ein Weizenkorn oder eine Abbildung mit dem Kind betrachten und die drei Teile des Korns einzeln benennen lassen.',
      folge:  null
    },
    'haltbarkeit-statt-nachhaltig': {
      kind:   'Das Haltbarkeitsdatum sagt, wie lange die Pasta mindestens gut bleibt. Nachhaltig ist sie, wenn Natur und Menschen geschont werden. Das siehst du an der Herkunft, am Label und an der Verpackung.',
      eltern: 'Das Haltbarkeitsdatum wird als Merkmal für nachhaltigen Einkauf genannt. Hilft: beim Einkauf eine Packung gemeinsam lesen und die Angaben ordnen: Was sagt etwas über die Herkunft, was über die Verpackung, was nur über die Haltbarkeit?',
      folge:  null
    },
    'datum-wegwerfen': {
      kind:   'Das Datum «mindestens haltbar bis» ist kein Verfallsdatum. Trockene Pasta ist danach oft noch gut. Schau und rieche, bevor du sie kochst.',
      eltern: 'Das Mindesthaltbarkeitsdatum wird als Zeitpunkt zum Wegwerfen gelesen. Hilft: zu Hause eine Packung mit abgelaufenem Datum gemeinsam prüfen (Aussehen, Geruch) und über Lebensmittelabfälle sprechen.',
      folge:  null
    },
    'preis-nur-zutat': {
      kind:   'Im Preis steckt mehr als das Korn. Auch die Arbeit der Menschen, die Maschinen, die Energie, der Transport, die Verpackung und der Laden kosten Geld.',
      eltern: 'Der Preis wird nur auf die Zutat zurückgeführt. Hilft: einen Preis auf der Packung nehmen und gemeinsam sammeln, wer an der Pasta gearbeitet hat und was dabei Geld kostet. Jede Station bekommt eine Zeile.',
      folge:  null
    },
    'breite-gesund': {
      kind:   'Die Breite einer Stufe zeigt die Menge: Von breiten Stufen isst oder trinkt man viel, von schmalen Stufen wenig. Auch schmale Stufen haben ihren Platz, nur in kleiner Menge.',
      eltern: 'Die Breite der Stufe wird als Mass für gesund oder ungesund gelesen. Sie zeigt aber die empfohlene Menge. Hilft: am Znüni oder Mittagessen fragen, auf welcher Stufe das Essen liegt und wie viel davon an einem Tag gedacht ist.',
      folge:  null
    },
    'ernte-zu-frueh': {
      kind:   'Weizen wird geerntet, wenn die Körner reif sind. Dann sind die Ähren goldgelb und die Körner hart. Grüne Ähren sind noch nicht so weit.',
      eltern: 'Der Zeitpunkt der Ernte wird zu früh angesetzt. Hilft: eine Abbildung mit grünen und goldgelben Ähren betrachten und erzählen lassen, was zwischen Blüte und Ernte mit den Körnern geschieht.',
      folge:  null
    }
  },

  pruefung: {                                        // Aufbau der Lernkontrolle, Teil für Teil. Der Test vom 30.09.2026 ist vorbei: kein Datum, der Elternbereich darf eines setzen
    datum: null,
    themen: ['*'],
    richtzeitMin: 45,                                // Annahme, Richtzeit steht nicht auf dem Blatt (TODO)
    format: [                                        // Ein Eintrag hat nur einen Typ und der Typ muss jede Form der Themen akzeptieren, darum haben Teil 1, 2 und 4 zwei Einträge
      // Teil 1: Vom Korn zur Pasta (Arbeitsschritte, Weizenpflanze, Menschen, Preis). Punkte geschätzt (TODO: Punkte des Tests eintragen)
      { thema: ['arbeitsschritte', 'weizenpflanze'], typ: 'reihenfolge',     anzahl: 4, punkte: 8 },
      { thema: ['menschen', 'preis'],                typ: 'multiple-choice', anzahl: 4, punkte: 4 },
      // Teil 2: Weissmehl und Vollkornmehl, 5 Punkte (zeigen: zuordnen, erklären in ganzen Sätzen: freitext)
      { thema: ['mehl'],                             typ: 'zuordnen',        anzahl: 6, punkte: 2 },
      { thema: ['mehl-erklaeren'],                   typ: 'freitext',        anzahl: 1, punkte: 3 },
      // Teil 3: Nachhaltigkeit. Punkte geschätzt (TODO: Punkte des Tests eintragen)
      { thema: ['nachhaltig-erklaeren'],             typ: 'freitext',        anzahl: 1, punkte: 3 },
      // Teil 4: Ernährungspyramide, 4 Punkte (Lebensmittel eintragen: zuordnen, Aufbau erklären: freitext)
      { thema: ['pyramide'],                         typ: 'zuordnen',        anzahl: 12, punkte: 2 },
      { thema: ['pyramide-erklaeren'],               typ: 'freitext',        anzahl: 1, punkte: 2 }
    ]
  },

  anpassbar: {                                       // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':     { typ: 'bool' },
    'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 }
  },

  begleitung: [
    'Beim Einkaufen eine Packung Pasta gemeinsam lesen: Woher kommt das Getreide, welches Label ist aufgedruckt, steht «Hartweizengriess» in der Zutatenliste? Das Kind liest vor, die Eltern fragen nach.',
    'Zu Hause die Lebensmittelpyramide mit dem Znüni oder dem Mittagessen besprechen: Auf welcher Stufe liegt das? Welche Stufe kam heute noch nicht vor?',
    'Nachfragen statt vorsagen: «Woran erkennst du das?» oder «Wie erklärst du es jemandem, der es nicht kennt?» Die App zeigt nach einem Fehler einen Lösungsweg, den das Kind in eigenen Worten erzählen kann.',
    'Für die freien Sätze genügt ein Gespräch am Tisch: Das Kind erklärt in zwei oder drei ganzen Sätzen den Unterschied zwischen Weissmehl und Vollkornmehl.',
    'Die Begriffe wie im Dossier der Klasse verwenden. Was die Klasse im Unterricht anders nennt, hat Vorrang vor der App.'
  ]
});
