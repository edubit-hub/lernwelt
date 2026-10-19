/* module/mathe-zahlraum-1000/modul.js: Zahlen bis 1000 (Stellenwerte, Zahlwörter, Nachbarzahlen, Zählen in Schritten, Zahlenstrahl, Ordnen,
   Vergleichen, Ergänzen, Verdoppeln und Halbieren, ab 0.2.0 auch Plättchen in der Stellentafel und das Tausenderbuch).
   Reine Daten: ein einziger Aufruf, kein Zugriff auf Registry oder Bausteine.
   Alle Themen kommen aus Generatoren mit Aufgabenfamilien: Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen.
   Stand: Entwurf. Schreibweise (H, Z, E), Zeichenweise, Lehrplan-Codes, Richtzeit und alle Lösungswege sind ungeprüft (README.md, TODO). */
Lernwelt.modul({
  schema: 1,
  id: 'mathe-zahlraum-1000',                 // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.2.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Zahlen bis 1000',
  fach: 'mathe',
  bereich: 'mathe.zahl',                     // Platz im Forschungsbaum der Spielwelt
  stufen: [3],
  zyklus: 2,
  lp21: ['MA.1.A.1.e', 'MA.1.A.2.e', 'MA.1.A.3.c', 'MA.1.A.4.f', 'MA.1.B.3.c', 'MA.1.C.1.c', 'MA.1.C.2.e'],   // aus der Karte, vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: 'Schweizer Zahlenbuch 3, Weiterentwicklung (Klett und Balmer, 2022)', kapitel: 'Die Zahlen bis 1000, Lernzielkontrolle 3' },
  dateien: ['fam-stellenwert.js', 'fam-zahlwoerter.js', 'fam-lage.js', 'fam-ordnen.js', 'fam-folgen.js', 'fam-rechnen.js', 'fam-erweitert.js',
    'fam-plaettchen.js', 'fam-plaettchen-moeglich.js', 'fam-tausenderbuch.js'],
  braucht: ['_gemeinsam/zahlen', '_gemeinsam/familien'],   // gemeinsame Bausteine: Zahlen zerlegen und benennen, Gerüst für Aufgabenfamilien

  lernziele: [
    { id: 'lz1',  text: 'Ich lese und schreibe Zahlen bis 1000, auch wenn sie als Zahlwort dastehen.' },
    { id: 'lz2',  text: 'Ich weiss, was Einer, Zehner und Hunderter bedeuten, und setze Zahlen aus H, Z und E zusammen.' },
    { id: 'lz3',  text: 'Ich bündle und entbündle: 10 Einer sind 1 Zehner, 10 Zehner sind 1 Hunderter.' },
    { id: 'lz4',  text: 'Ich zähle in Schritten vorwärts und rückwärts, auch über die Hunderter hinweg.' },
    { id: 'lz5',  text: 'Ich nenne Vorgänger, Nachfolger, Nachbarzehner und Nachbarhunderter einer Zahl.' },
    { id: 'lz6',  text: 'Ich finde Zahlen am Zahlenstrahl und setze sie dorthin.' },
    { id: 'lz7',  text: 'Ich ordne Zahlen der Grösse nach und setze die Zeichen <, > und =.' },
    { id: 'lz8',  text: 'Ich ergänze Zahlen auf 100 und auf 1000.' },
    { id: 'lz9',  text: 'Ich verdopple und halbiere Zahlen im Hunderter- und im Tausenderraum.' },
    { id: 'lz10', text: 'Ich lese und schreibe Zahlen über 1000 mit Tausendern.' },
    { id: 'lz11', text: 'Ich lege Zahlen mit Plättchen in die Stellentafel. In jeder Spalte liegen höchstens 9 Plättchen.' },
    { id: 'lz12', text: 'Ich sage, wie sich eine Zahl ändert, wenn ein Plättchen dazukommt oder wegfällt.' },
    { id: 'lz13', text: 'Ich finde die grösste und die kleinste dreistellige Zahl, die ich mit einer bestimmten Anzahl Plättchen legen kann.' },
    { id: 'lz14', text: 'Ich finde mich im Tausenderbuch zurecht: Ich sage, wo eine Zahl steht, und nenne die Zahlen rundherum.' },
    { id: 'lz15', text: 'Ich lese Zahlen aus Ziffernkarten und aus Zeichnungen mit Quadraten, Strichen und Punkten, auch mit Nullen.' },
    { id: 'lz16', text: 'Ich entscheide, welche Zahlen nach einem Plättchen möglich sind und welche nicht.' }
  ],

  wege: {                                    // Lösungswege des Lehrmittels, «geprueft» setzt der Vater nach dem Abgleich, nie ein Agent
    stellen:           { titel: 'Zahl aus Hundertern, Zehnern und Einern zusammensetzen', quelle: 'Lehrmittel Seite __', geprueft: null },
    buendeln:          { titel: 'Bündeln und Entbündeln',                                  quelle: 'Lehrmittel Seite __', geprueft: null },
    zahlwort:          { titel: 'Zahlwort Stück für Stück in Ziffern übersetzen',          quelle: 'Lehrmittel Seite __', geprueft: null },
    nachbarn:          { titel: 'Nachbarzahlen, Nachbarzehner und Nachbarhunderter',        quelle: 'Lehrmittel Seite __', geprueft: null },
    strahl:            { titel: 'Zahlenstrahl: den Skalenwert lesen, Striche nicht zählen', quelle: 'Lehrmittel Seite __', geprueft: null },
    ordnen:            { titel: 'Zahlen ordnen und vergleichen, Stelle für Stelle',         quelle: 'Lehrmittel Seite __', geprueft: null },
    folgen:            { titel: 'Zahlenfolgen: die Schrittweite erkennen',                  quelle: 'Lehrmittel Seite __', geprueft: null },
    ergaenzen:         { titel: 'Ergänzen über volle Zehner und Hunderter',                 quelle: 'Lehrmittel Seite __', geprueft: null },
    verdoppeln:        { titel: 'Verdoppeln und Halbieren nach Stellenwerten',              quelle: 'Lehrmittel Seite __', geprueft: null },
    'stellen-tausend': { titel: 'Zahlen mit Tausendern zusammensetzen',                     quelle: 'Lehrmittel Seite __', geprueft: null },
    plaettchen:        { titel: 'Plättchen in der Stellentafel: eine Spalte ändert sich um 1', quelle: 'Lehrmittel Seite __', geprueft: null },
    tausenderbuch:     { titel: 'Tausenderbuch: Zeile, Spalte und Nachbarfelder',            quelle: 'Lehrmittel Seite __', geprueft: null },
    'karten-zeichnung': { titel: 'Ziffernkarten und Zeichnung in eine Zahl übersetzen',      quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'vortest',                  // Rechnen und Ordnen kann das Kind herleiten: zuerst abrufen, bei einem Fehler den Weg zeigen
    leiter: [{ box: 0, typ: 'eingabe' }],
    optionen: {},
    neuProTag: 5,
    maxSchwierigkeit: 3
  },

  themen: [
    { id: 'stellenwert', titel: 'Hunderter, Zehner, Einer', ziele: ['lz2', 'lz3', 'lz15'],
      generator: { name: 'mathe-zahlraum-1000/stellenwert', params: {} } },
    { id: 'zahlwoerter', titel: 'Zahlwörter und Ziffern', ziele: ['lz1'], voraussetzung: ['stellenwert'],
      generator: { name: 'mathe-zahlraum-1000/zahlwoerter', params: {} } },
    { id: 'nachbarn', titel: 'Nachbarzahlen, Nachbarzehner, Nachbarhunderter', ziele: ['lz5'],
      generator: { name: 'mathe-zahlraum-1000/nachbarn', params: {} } },
    { id: 'zahlenfolgen', titel: 'Zählen in Schritten', ziele: ['lz4', 'lz9'], leiter: [{ box: 0, typ: 'lueckentext' }],
      generator: { name: 'mathe-zahlraum-1000/zahlenfolgen', params: {} } },
    { id: 'zahlenstrahl', titel: 'Zahlen am Zahlenstrahl', ziele: ['lz6'], leiter: [{ box: 0, typ: 'zahlenstrahl' }],
      generator: { name: 'mathe-zahlraum-1000/zahlenstrahl', params: {} } },
    { id: 'ordnen', titel: 'Zahlen ordnen', ziele: ['lz7'], leiter: [{ box: 0, typ: 'reihenfolge' }],
      generator: { name: 'mathe-zahlraum-1000/ordnen', params: {} } },
    { id: 'vergleichen', titel: 'Zahlen vergleichen', ziele: ['lz7'], voraussetzung: ['ordnen'], leiter: [{ box: 0, typ: 'multiple-choice' }], optionen: { anzahl: 3 },
      generator: { name: 'mathe-zahlraum-1000/vergleichen', params: {} } },
    { id: 'ergaenzen', titel: 'Ergänzen auf 100 und 1000', ziele: ['lz8'],
      generator: { name: 'mathe-zahlraum-1000/ergaenzen', params: {} } },
    { id: 'verdoppeln-halbieren', titel: 'Verdoppeln und Halbieren', ziele: ['lz9'],
      generator: { name: 'mathe-zahlraum-1000/verdoppeln-halbieren', params: {} } },
    /* ab 0.2.0 */
    { id: 'plaettchen', titel: 'Plättchen in der Stellentafel', ziele: ['lz11', 'lz12', 'lz13'], voraussetzung: ['stellenwert'],
      generator: { name: 'mathe-zahlraum-1000/plaettchen', params: {} } },
    { id: 'plaettchen-moeglich', titel: 'Plättchen: welche Zahl ist möglich?', ziele: ['lz12', 'lz16'], voraussetzung: ['plaettchen'], leiter: [{ box: 0, typ: 'multiple-choice' }], optionen: { anzahl: 4 },
      generator: { name: 'mathe-zahlraum-1000/plaettchen-moeglich', params: {} } },
    { id: 'tausenderbuch', titel: 'Tausenderbuch', ziele: ['lz14'], voraussetzung: ['stellenwert'],
      generator: { name: 'mathe-zahlraum-1000/tausenderbuch', params: {} } },
    { id: 'erweitert-1000', titel: 'Zahlen über 1000', ziele: ['lz10'], voraussetzung: ['stellenwert', 'nachbarn'], aktiv: false,
      geltung: 'Zahlen über 1000 gehören zu den erweiterten Anforderungen und kommen nur in manchen Klassen und Lehrmitteln schon in diesem Block vor. Ob das Kind sie braucht, sagt die Lehrperson.',
      generator: { name: 'mathe-zahlraum-1000/erweitert-1000', params: {} } }
  ],

  tempo: {                                   // freiwillige Bestzeit-Runde. Zählt nicht für den Lernstand und bringt keinen Ertrag
    typ: 'blitzrechnen', themen: ['nachbarn', 'ergaenzen', 'verdoppeln-halbieren'], anzahl: 15, nurWennStand: 'sicher'
  },

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern
    'zehner-einer-vertauscht': { kind: 'Zehner und Einer sind vertauscht. Schreibe zuerst den Zehner, dann den Einer.', eltern: 'Die gesprochene Reihenfolge (Einer vor Zehner, zum Beispiel «vierundfünfzig») führt zum Dreher. Das Kind sagt laut «Hunderter, Zehner, Einer» und schreibt in dieser Reihenfolge.', folge: null },
    'null-vergessen': { kind: 'Eine Stelle ist leer. Dort steht eine 0, damit die anderen Ziffern am richtigen Platz bleiben.', eltern: 'Die Null als Platzhalter fehlt (zum Beispiel 57 statt 507). In der Stellenwerttafel zeigen: Die leere Spalte bekommt eine 0.', folge: null },
    'buendeln-vergessen': { kind: 'In einer Stelle sind mehr als 9. 10 Zehner sind 1 Hunderter, 10 Einer sind 1 Zehner. Rechne zuerst den Wert jeder Stelle aus.', eltern: 'Das Kind schreibt die Anzahlen nebeneinander (2 H, 13 Z, 4 E als 2134), statt die Werte zu addieren. Hilft: den Wert jeder Stelle einzeln ausrechnen und dann zusammenzählen.', folge: null },
    'stelle-verwechselt': { kind: 'Das gehört zu einer anderen Stelle. Lies noch einmal, nach welcher Stelle gefragt ist.', eltern: 'Hunderter, Zehner und Einer werden verwechselt. In der Stellenwerttafel die Spalte H, Z oder E mit dem Finger zeigen.', folge: null },
    'ziffer-statt-wert': { kind: 'Du hast eine einzelne Ziffer genannt. Gefragt ist der Wert oder die Anzahl.', eltern: 'Ziffer und Wert werden gleichgesetzt: Die 7 in 372 steht für 70. Mit Zehnerstangen legen: 7 Stangen sind 70.', folge: null },
    'wert-statt-anzahl': { kind: 'Du hast den Wert der Zahl genannt. Gefragt ist, wie viele Zehner oder Hunderter es sind.', eltern: 'Wert und Anzahl werden verwechselt: 6 Hunderter sind 600, aber auch 60 Zehner. Mit Material bündeln und entbündeln lassen.', folge: null },
    'hunderter-weg': { kind: 'Die Hunderter fehlen. Das Zahlwort beginnt mit den Hundertern.', eltern: 'Das Kind schreibt nur den Rest hin (54 statt 354). Das Zahlwort in Teile schneiden: zuerst die Hunderter, dann der Rest.', folge: null },
    'nachbar-andere-seite': { kind: 'Das ist der Nachbar auf der anderen Seite. Lies noch einmal, ob unter oder über gefragt ist.', eltern: 'Unten und oben werden verwechselt. Am Zahlenstrahl zeigen: Der Nachbar unter der Zahl liegt links, der Nachbar darüber rechts.', folge: null },
    'hunderter-uebergang': { kind: 'Beim Wechsel zum nächsten Hunderter ändert sich auch die Hunderterziffer. Achte darauf, wenn du über 100, 200, 300 und so weiter zählst.', eltern: 'Fehler am Hunderterübergang (nach 399 folgt 400, nicht 300). Mit dem Zahlenstrahl über die Marke zählen und laut sprechen.', folge: null },
    'strahl-gespiegelt': { kind: 'Die Marke steht auf der anderen Seite. Links liegen die kleineren Zahlen, rechts die grösseren.', eltern: 'Links und rechts werden verwechselt. Die beschrifteten Striche an den Enden zeigen die Richtung.', folge: null },
    'strahl-ein-strich': { kind: 'Die Marke ist einen Strich daneben. Lies die Zahl unter den langen Strichen und zähle die Striche nicht einzeln.', eltern: 'Knapp daneben, oft durch Striche zählen statt den Skalenwert zu lesen. Von der nächsten beschrifteten Marke aus Schritt für Schritt rechnen.', folge: null },
    'richtung-verdreht': { kind: 'Die Reihenfolge ist umgekehrt. Prüfe, ob die kleinste oder die grösste Zahl zuerst kommt.', eltern: 'Auf- und absteigend werden verwechselt. Die Aufgabe laut vorlesen lassen: «von der kleinsten zur grössten».', folge: null },
    'zeichen-verdreht': { kind: 'Die Öffnung des Zeichens zeigt zur grösseren Zahl, die Spitze zur kleineren.', eltern: 'Kleiner und grösser werden verwechselt. Beide Zahlen zuerst bei den Hundertern vergleichen und erst dann das Zeichen wählen.', folge: null },
    'gleich-gesetzt': { kind: 'Die beiden Zahlen sind nicht gleich. Vergleiche zuerst die Hunderter.', eltern: 'Das Kind setzt «gleich», obwohl sich die Zahlen unterscheiden, oft bei gleichen Ziffern in anderer Reihenfolge. Stelle für Stelle von links vergleichen.', folge: null },
    'ungleich-gesetzt': { kind: 'Beide Seiten sind gleich gross. Schreibe jede Seite als Zahl und vergleiche dann.', eltern: 'Das Kind erkennt die Gleichheit nicht, wenn eine Seite zerlegt oder in Zehnern angegeben ist. Beide Seiten als Zahl schreiben lassen.', folge: null },
    'schritt-falsch': { kind: 'Die Schrittweite stimmt nicht. Schau, um wie viel die ersten beiden Zahlen auseinanderliegen.', eltern: 'Das Kind zählt in anderen Schritten weiter (zum Beispiel 1 statt 10). Die Schrittweite aus den ersten beiden Zahlen bestimmen lassen.', folge: null },
    'hunderter-daneben': { kind: 'Es ist genau ein Hunderter zu viel oder zu wenig. Rechne die Hunderter und den Rest noch einmal getrennt.', eltern: 'Die Hunderter sind um eins verrechnet, zum Beispiel beim Ergänzen (650 auf 1000 mit 450 statt 350) oder beim Verdoppeln und Halbieren. Über den nächsten vollen Hunderter rechnen lassen, die Hunderter und den Rest getrennt.', folge: null },
    // Kopie aus _gemeinsam/fehlercodes-rechnen, test.js vergleicht sie mit dem Katalog
    'zehner-daneben': { kind: 'Der Zehner stimmt nicht. Rechne die Zehner und die Einer getrennt.', eltern: 'Übertrag oder Zehner vergessen.', folge: null },
    'ziel-statt-ergaenzung': { kind: 'Du hast eine Zahl aus der Aufgabe genannt. Gefragt ist, wie viel fehlt.', eltern: 'Das Kind nennt Start oder Ziel statt der Ergänzung. Fragen: «Wie viel fehlt noch bis zum Ziel?»', folge: null },
    'doppelt-halb-verwechselt': { kind: 'Du hast das Gegenteil gerechnet. Doppeltes heisst mal 2, Hälfte heisst durch 2.', eltern: 'Verdoppeln und Halbieren werden verwechselt. Mit Material zeigen: doppelt sind zwei gleiche Haufen, die Hälfte ist ein Haufen von zwei gleichen.', folge: null },
    'stellenwert-fehler': { kind: 'Die Zahl hat die falsche Grösse, zum Beispiel 15 statt 150. Überlege, wie viele Hunderter und Zehner es sind.', eltern: 'Stellenwertfehler beim Halbieren oder Verdoppeln (300 halbiert ergibt 15). Mit Hundertern rechnen: Die Hälfte von 3 Hundertern ist 150.', folge: null },
    'tausender-fehlt': { kind: 'Die Tausender fehlen. Schreibe zuerst die Tausender, dann den Rest.', eltern: 'Beim Übergang über 1000 fehlt die Tausenderstelle (50 statt 1050). Die Zahl in T, H, Z und E zerlegen.', folge: null },

    /* ab 0.2.0: Nachbarzahlen, Zählen in Schritten, Verdoppelungsfolgen */
    'hunderterziffer-falsch': { kind: 'Die Hunderterziffer stimmt nicht. Die Hunderter ändern sich nur an einer vollen Hunderterzahl. Schreibe sie von der Zahl in der Aufgabe ab.', eltern: 'Die Hunderterziffer wird falsch geschrieben (zum Beispiel 427 statt 127). Die Hunderter ändern sich nur, wenn die Rechnung über eine volle Hunderterzahl führt. Das Ergebnis mit der Ausgangszahl vergleichen.', folge: null },
    'auf-hunderter-gerundet': { kind: 'Du bist auf die volle Hunderterzahl gesprungen. Der Sprung geht ganz zu Ende, auch über den Hunderter hinaus.', eltern: 'Beim Zählen über einen Hunderter wird die volle Hunderterzahl geschrieben statt der Zahl dahinter (zum Beispiel 400 statt 402). Am Rechenstrich zeigen: zuerst bis zum Hunderter, dann den Rest des Sprungs.', folge: null },
    'null-statt-rest': { kind: 'Es bleibt etwas übrig. Wenn die Hunderter aufgebraucht sind, bleiben Zehner und Einer stehen.', eltern: 'Beim Zurückzählen in Hunderterschritten unter 100 wird 0 geschrieben (zum Beispiel 0 statt 41). Zehner und Einer der Startzahl bleiben bei jedem Schritt gleich, nur die Hunderterziffer wird kleiner.', folge: null },
    'abstand-statt-doppelt': { kind: 'Du hast immer denselben Abstand weitergezählt. In dieser Folge entsteht jede Zahl aus der Zahl davor: Sie wird verdoppelt oder halbiert.', eltern: 'Die Folge wird mit gleichem Abstand fortgesetzt (12, 24, 36 statt 12, 24, 48). Fragen: «Wie ist die zweite Zahl aus der ersten entstanden?» und dieselbe Rechnung auf die nächste Zahl anwenden.', folge: null },

    /* ab 0.2.0: Tausenderbuch */
    'tausenderbuch-nachbar-verwechselt': { kind: 'Du hast ein anderes Nachbarfeld genannt. Über und unter ändert sich die Zahl um 10, links und rechts um 1.', eltern: 'Die Richtungen im Tausenderbuch werden verwechselt. Eine Zeile höher oder tiefer sind 10 weniger oder mehr, ein Feld nach links oder rechts 1 weniger oder mehr. Mit dem Finger auf der Seite zeigen und laut mitsprechen.', folge: null },
    'zeilenrand-um-eins': { kind: 'Am Rand der Zeile ist die Zahl um 1 verschoben. Die erste Zahl einer Zeile endet auf 1, die letzte auf 0.', eltern: 'Anfang oder Ende der Zeile sind um eins verschoben (zum Beispiel 640 statt 641 am Anfang). Die Zeile im Tausenderbuch mit dem Finger abfahren und die Randfelder laut lesen.', folge: null },
    'zeile-spalte-verwechselt': { kind: 'Zeile und Spalte sind vertauscht. Die Zeile zählst du von oben nach unten, die Spalte von links nach rechts.', eltern: 'Zeile (waagrecht) und Spalte (senkrecht) werden verwechselt. Am Tausenderbuch beides mit dem Finger zeigen, bevor das Kind antwortet.', folge: null },

    /* ab 0.2.0: Plättchen in der Stellentafel */
    'plaettchen-richtung': { kind: 'Das Plättchen geht in die andere Richtung. Kommt eines dazu, wird die Zahl grösser. Fällt eines weg, wird sie kleiner.', eltern: 'Dazukommen und Wegfallen werden verwechselt. Mit echten Plättchen auf der Stellentafel ein Plättchen bewusst dazulegen oder wegnehmen und die neue Zahl lesen.', folge: null },
    'plaettchen-zahl-statt-anzahl': { kind: 'Du hast die Zahl genannt. Gefragt ist, wie viele Plättchen es sind.', eltern: 'Die Zahl wird mit der Plättchenzahl verwechselt (432 braucht 9 Plättchen, nicht 432). Die Plättchen jeder Spalte zählen und zusammenzählen: Die Ziffern der Zahl ergeben die Plättchenzahl.', folge: null },
    'plaettchen-gross-klein-verwechselt': { kind: 'Du hast die kleinste statt der grössten Zahl genannt, oder umgekehrt. Lies noch einmal, was gesucht ist.', eltern: 'Grösste und kleinste Zahl werden verwechselt. Für die grösste Zahl kommen möglichst viele Plättchen zu den Hundertern, für die kleinste zuerst eines zu den Hundertern und der Rest zu den Einern.', folge: null },
    'plaettchen-summe-falsch': { kind: 'Diese Zahl braucht eine andere Anzahl Plättchen. Zähle die Plättchen nach: Hunderter, Zehner und Einer zusammen.', eltern: 'Die genannte Zahl hat eine andere Plättchenzahl als verlangt (zum Beispiel 555 bei 6 Plättchen). Immer nachzählen: die Ziffern zusammenzählen und mit der verlangten Anzahl vergleichen.', folge: null },
    'plaettchen-nicht-dreistellig': { kind: 'Die Zahl hat nicht drei Stellen. Bei den Hundertern muss mindestens ein Plättchen liegen.', eltern: 'Das Kind nennt eine ein- oder zweistellige Zahl (zum Beispiel 78 bei 15 Plättchen). Eine dreistellige Zahl hat bei den Hundertern immer mindestens ein Plättchen.', folge: null },
    'plaettchen-nicht-extrem': { kind: 'Die Anzahl Plättchen stimmt, aber es geht noch grösser oder kleiner. Schiebe Plättchen in eine andere Spalte und vergleiche.', eltern: 'Die Zahl passt zur Plättchenzahl, ist aber nicht die grösste oder kleinste. Für die grösste Zahl zuerst die Hunderter füllen (bis 9), dann die Zehner. Für die kleinste Zahl zuerst die Einer füllen (bis 9), dann die Zehner.', folge: null },
    'frage-nicht-verwechselt': { kind: 'Du hast eine Zahl gewählt, die möglich ist. Gefragt ist die Zahl, die nicht möglich ist.', eltern: 'Das Wort «nicht» in der Frage wird überlesen. Die Frage laut lesen, «nicht» unterstreichen und alle Möglichkeiten mit einem Plättchen nacheinander durchspielen.', folge: null },
    'plaettchen-zwei-aenderungen': { kind: 'Für diese Zahl braucht es mehr als ein Plättchen. Ein Plättchen ändert nur eine Stelle um 1.', eltern: 'Das Kind wählt eine Zahl, die sich in zwei Stellen oder um mehr als 1 in einer Stelle ändert (zum Beispiel 474 aus 472). Ein Plättchen verändert genau eine Spalte um 1.', folge: null }
  },

  pruefung: {
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 45,                        // TODO: Annahme, die Dauer der Lernzielkontrolle 3 ist nicht bekannt. Die Prüfung vom 02.10.2026 ist vorbei, das Datum bleibt leer
    format: [                                // Aufbau der Lernzielkontrolle 3 (41,5 Punkte), in der Reihenfolge ihrer sieben Aufgaben. Das Format kennt keine Familienfilter,
                                             // die Aufgaben stammen aus dem ganzen Thema. Aufgabe 2 hat zwei Teile (Tausenderbuch, Tausenderstrahl), Aufgabe 7 auch.
      { thema: ['stellenwert'],           typ: 'eingabe',         anzahl: 4, punkte: 8 },       // 1: Zahlen schreiben und zeichnen
      { thema: ['tausenderbuch'],         typ: 'eingabe',         anzahl: 4, punkte: 4 },       // 2: Tausenderbuch
      { thema: ['zahlenstrahl'],          typ: 'zahlenstrahl',    anzahl: 4, punkte: 4 },       // 2: Tausenderstrahl
      { thema: ['ordnen'],                typ: 'reihenfolge',     anzahl: 2, punkte: 5 },       // 3: Zahlen ordnen
      { thema: ['zahlenfolgen'],          typ: 'lueckentext',     anzahl: 2, punkte: 6 },       // 4: drei Sprünge
      { thema: ['nachbarn'],              typ: 'eingabe',         anzahl: 6, punkte: 6 },       // 5: Nachbarzehner und Nachbarzahlen
      { thema: ['verdoppeln-halbieren'],  typ: 'eingabe',         anzahl: 1, punkte: 2.5 },     // 6: immer weiter verdoppeln
      { thema: ['plaettchen-moeglich'],   typ: 'multiple-choice', anzahl: 2, punkte: 4 },       // 7: Plättchen, welche Zahlen können es sein
      { thema: ['plaettchen'],            typ: 'eingabe',         anzahl: 2, punkte: 2 }        // 7: Plättchen, grösste und kleinste Zahl
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },     // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 },
    'tempo.themen':              { typ: 'themen' }
  },

  begleitung: [
    'Neue Zahlen zuerst mit echtem Material legen: Zehnerstangen, Hunderterplatten oder gebündelte Stäbchen. Die App übt, sie führt nichts neu ein.',
    'Am Zahlenstrahl die Striche nicht zählen lassen. Das Kind liest die Zahlen unter den langen Strichen vor und sagt, zwischen welchen beiden Zahlen seine Zahl liegt.',
    'Bei Zahlwörtern laut sprechen und die Zahl in Hunderter, Zehner und Einer zerlegen. Bei «vierundfünfzig» hört man den Einer zuerst, geschrieben steht der Zehner vorn.',
    'Fragen statt vorsagen: «Wie viele Hunderter sind es? Und wie viele Zehner?»',
    'Wörter und Schreibweise wie in der Schule verwenden. Wenn das Lehrmittel andere Bezeichnungen nutzt als H, Z, E oder Nachbarzehner, gilt die Sprechweise der Lehrperson.',
    'Der Raum über 1000 ist ausgeschaltet. Ob er in der Klasse schon dran ist, sagt die Lehrperson.',
    'Plättchen und Stellentafel zuerst mit echtem Material legen, zum Beispiel mit Wendeplättchen und einer gezeichneten Tafel. Die App zeigt die Plättchen nur als Bild. In jeder Spalte liegen höchstens 9.',
    'Beim Tausenderbuch eine Seite mit zehn mal zehn Feldern aufzeichnen oder die echte Seite danebenlegen. Zeile und Spalte mit dem Finger zeigen. Ein Hilfsbild dafür gibt es in der App noch nicht.'
  ]
});
