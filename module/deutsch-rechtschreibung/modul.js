/* module/deutsch-rechtschreibung/modul.js: Rechtschreibung für die 3. Klasse (AP-18c). Sechs Themen nach der Curriculum-Karte: Nomen und Grossschreibung,
   Silben, Wortstamm, ie-Regel, e-/ä-Schreibung und (beim Start ausgeschaltet) Doppelkonsonant, ck und tz. Die Aufgaben stehen als Daten in den Dateien
   des Moduls (Generatoren mit Diagnose), die Strategien Mitsprechen, Verlängern, Ableiten und Merken sind die Lösungswege.
   Reine Daten: ein einziger Aufruf, kein Zugriff auf Registry oder Bausteine. Stand: Entwurf. Lehrmittel, Lehrplan-Codes, Prüfungsformat und alle
   Lösungswege sind ungeprüft (README.md, TODO). Alle Texte sind eigene Formulierungen. */
Lernwelt.modul({
  schema: 1,
  id: 'deutsch-rechtschreibung',             // stabil, nie ändern: Fortschrittsschlüssel
  version: '0.1.0',
  status: 'entwurf',                         // 'entwurf' | 'freigegeben', setzt nur «lw freigeben»
  titel: 'Rechtschreibung',
  fach: 'deutsch',
  bereich: 'deutsch.sprache',                // wie deutsch-wortarten: so heisst der Bereich im Forschungsbaum der Welt Archipel, die Module zählen zusammen
  stufen: [3],
  zyklus: 2,
  lp21: ['D.4.F.1.a', 'D.4.F.1.b', 'D.4.F.1.c', 'D.4.F.1.d', 'D.5.A.1.b', 'D.5.C.1.a', 'D.5.C.1.b', 'D.5.C.1.d', 'D.5.D.1.a', 'D.5.D.1.b', 'D.5.D.1.c',
         'D.5.E.1.b', 'D.5.E.1.c', 'D.5.E.1.d'],       // aus der Curriculum-Karte übernommen, vor Freigabe gegen lehrplan21.ch prüfen
  lehrmittel: { name: '(Lehrmittel der Klasse eintragen)', kapitel: '' },
  dateien: ['nomen.js', 'silben.js', 'wortstamm.js', 'ie-regel.js', 'umlaut.js', 'doppelkonsonant.js'],
  braucht: ['_gemeinsam/rechtschreibung'],   // gemeinsamer Baustein (Antwort und Satz vergleichen, Fehlerarten für Wörter)

  lernziele: [
    { id: 'lz1', text: 'Ich kann Nomen mit der Artikelprobe erkennen und gross schreiben.' },
    { id: 'lz2', text: 'Ich kann Wörter in Silben gliedern und am Zeilenende richtig trennen.' },
    { id: 'lz3', text: 'Ich kann bei einem Wort den Wortstamm erkennen und Wörter derselben Wortfamilie finden.' },
    { id: 'lz4', text: 'Ich kann einen langen i-Laut richtig schreiben und kenne die wichtigsten Ausnahmen.' },
    { id: 'lz5', text: 'Ich kann bei e und ä oder eu und äu mit einem verwandten Wort entscheiden.' },
    { id: 'lz6', text: 'Ich kann nach einem kurzen Vokal doppelte Konsonanten, ck und tz richtig schreiben.' },
    { id: 'lz7', text: 'Ich kann beim Schreiben eine Strategie wählen: Mitsprechen, Verlängern, Ableiten oder Merken.' }
  ],

  wege: {                                    // Rechtschreibstrategien, «geprueft» setzt der Vater nach dem Abgleich mit dem Lehrmittel, nie ein Agent
    mitsprechen:  { titel: 'Mitsprechen',      quelle: 'Lehrmittel Seite __', geprueft: null },
    verlaengern:  { titel: 'Verlängern',       quelle: 'Lehrmittel Seite __', geprueft: null },
    ableiten:     { titel: 'Ableiten',         quelle: 'Lehrmittel Seite __', geprueft: null },
    merken:       { titel: 'Merken',           quelle: 'Lehrmittel Seite __', geprueft: null },
    artikelprobe: { titel: 'Artikelprobe',     quelle: 'Lehrmittel Seite __', geprueft: null },
    wortstamm:    { titel: 'Wortstamm finden', quelle: 'Lehrmittel Seite __', geprueft: null }
  },

  standard: {                                // nur Inhaltswissen. Mastery und Freischaltung kommen aus lernregeln.js
    einfuehrung: 'erklaerung',               // Regeln werden zuerst gezeigt, nur Nomen kennt das Kind schon: dort 'vortest'
    leiter: [{ box: 0, typ: 'lueckentext' }, { box: 3, typ: 'diktat', ersatz: 'lueckentext' }],     // zuerst Kacheln, ab Box 3 schreibt das Kind selbst
    optionen: {},
    neuProTag: 4,
    maxSchwierigkeit: 3                      // neue Aufgaben nur bis zu dieser Stufe (Eltern können senken)
  },

  themen: [
    { id: 'nomen-grossschreibung', titel: 'Nomen und Grossschreibung', ziele: ['lz1', 'lz7'], einfuehrung: 'vortest',
      generator: { name: 'deutsch-rechtschreibung/nomen' } },
    { id: 'silben-trennen', titel: 'Silben gliedern und trennen', ziele: ['lz2', 'lz7'],
      leiter: [{ box: 0, typ: 'multiple-choice' }],                  // Erkennen: bleibt unter Box 5, V-AP18c-01
      generator: { name: 'deutsch-rechtschreibung/silben' } },
    { id: 'wortstamm-wortfamilie', titel: 'Wortstamm und Wortfamilie', ziele: ['lz3'],
      leiter: [{ box: 0, typ: 'zuordnen', ersatz: 'multiple-choice' }],     // Sortieren: bleibt unter Box 5, V-AP18c-01
      generator: { name: 'deutsch-rechtschreibung/wortstamm' } },
    { id: 'ie-regel', titel: 'ie-Regel und sp-/st-Schreibung', ziele: ['lz4', 'lz7'], voraussetzung: ['silben-trennen'],
      generator: { name: 'deutsch-rechtschreibung/ie-regel' } },
    { id: 'umlaut-e-ae', titel: 'e-/ä-Schreibung und Umlautregel', ziele: ['lz5', 'lz7'], voraussetzung: ['wortstamm-wortfamilie'],
      generator: { name: 'deutsch-rechtschreibung/umlaut' } },
    { id: 'doppelkonsonant-ck-tz', titel: 'Kurzvokal, Doppelkonsonant, ck und tz', ziele: ['lz6', 'lz7'], voraussetzung: ['silben-trennen'],
      aktiv: false,
      geltung: 'Gilt nur, wenn die Klasse Doppelkonsonanten, «ck» und «tz» schon behandelt hat. Das steht nicht in allen Lehrmitteln der 3. Klasse, die Lehrperson weiss es.',
      generator: { name: 'deutsch-rechtschreibung/doppelkonsonant' } }
  ],

  fehlerCodes: {                             // Diagnose → Rückmeldung an das Kind und Hinweis an die Eltern, geordnet nach Strategie
    'gross-klein': {
      kind:   'Die Buchstaben stimmen, nur die Gross- und Kleinschreibung nicht. Nomen und den ersten Buchstaben im Satz schreibt man gross.',
      eltern: 'Nur die Gross- und Kleinschreibung weicht ab, meist ein Nomen mit kleinem Anfangsbuchstaben. Hilft: Artikelprobe («der», «die» oder «das» davor setzen) und Nomen im Text farbig markieren.',
      folge:  null },
    'nomen-klein': {                         // Artikelprobe
      kind:   'Dieses Wort ist ein Nomen. Mit der Artikelprobe geht es: «der», «die» oder «das» passt davor. Nomen schreibt man gross.',
      eltern: 'Ein Nomen wurde klein geschrieben, auch abstrakte Nomen wie «Hunger» oder «Spass» fallen darunter. Strategie Artikelprobe: Artikel davor setzen und die Begründung laut sagen lassen («die Katze», also gross).',
      folge:  null },
    'kleinwort-gross': {
      kind:   'Vor dieses Wort kann man «der», «die» oder «das» nicht setzen. Dann ist es kein Nomen, und man schreibt es klein.',
      eltern: 'Ein Verb oder Adjektiv wurde gross geschrieben, oft weil das Wort wichtig klingt. Strategie Artikelprobe: Nur was einen Artikel verträgt, ist ein Nomen.',
      folge:  null },
    'buchstabe-fehlt': {                     // Mitsprechen
      kind:   'Im Wort fehlt ein Buchstabe. Sprich das Wort langsam und schreibe jede Silbe einzeln auf.',
      eltern: 'Beim Aufschreiben wurde ein Laut ausgelassen, oft in Konsonantengruppen. Strategie Mitsprechen: das Wort in Silben sprechen, klatschen und Silbe für Silbe schreiben.',
      folge:  null },
    'buchstabe-zuviel': {
      kind:   'Im Wort steht ein Buchstabe zu viel. Sprich das Wort langsam und höre bei jeder Silbe genau hin.',
      eltern: 'Ein Buchstabe wurde eingefügt. Strategie Mitsprechen: das Wort langsam sprechen und Buchstabe für Buchstabe mit dem Geschriebenen vergleichen.',
      folge:  null },
    'buchstaben-vertauscht': {
      kind:   'Zwei Buchstaben stehen in der falschen Reihenfolge. Lies dein Wort Buchstabe für Buchstabe noch einmal.',
      eltern: 'Flüchtigkeit beim Schreiben, kein Wissensproblem. Hilft: das geschriebene Wort noch einmal langsam lesen lassen.',
      folge:  null },
    'ie-nur-i': {
      kind:   'Der i-Laut in diesem Wort ist lang. Einen langen i-Laut schreibt man meist «ie». Sprich das Wort langsam und höre auf die Länge.',
      eltern: 'Ein langer i-Laut wurde nur mit «i» geschrieben. Strategie Mitsprechen: die Länge des Vokals hören. Hilft: Wörter nach langem und kurzem i-Laut sortieren und laut sprechen.',
      folge:  null },
    'ie-zuviel': {                           // Merken
      kind:   'Hier schreibt man nur «i». Bei einem kurzen i-Laut steht «i», zum Beispiel in «Wind». Bei Merkwörtern wie «Tiger» steht «i», obwohl der Laut lang ist.',
      eltern: 'Es wurde «ie» geschrieben, wo «i» steht: bei kurzem i-Laut oder bei einem Merkwort (Tiger, Biber, Kino). Strategie Merken: die Ausnahmen auf Karten sammeln und regelmässig wiederholen.',
      folge:  null },
    'ih-vergessen': {
      kind:   'Die Wörter «ihm», «ihn», «ihr» und «ihnen» schreibt man mit «ih». Das muss man sich merken.',
      eltern: 'Die Ausnahme «ih» war nicht bekannt. Strategie Merken: die vier Wörter mit «ih» auswendig lernen (ihm, ihn, ihr, ihnen).',
      folge:  null },
    'ih-zuviel': {
      kind:   '«ih» schreibt man nur in «ihm», «ihn», «ihr» und «ihnen». In diesem Wort steht «ie» oder «i».',
      eltern: 'Die Ausnahme «ih» wurde auf andere Wörter übertragen. Hilft: die vier Wörter mit «ih» von den übrigen Wörtern klar trennen.',
      folge:  null },
    'schp-scht-geschrieben': {
      kind:   'Am Anfang des Wortes oder der Silbe schreibt man «sp» und «st», auch wenn man «schp» und «scht» spricht.',
      eltern: 'Der Sprechlaut wurde geschrieben (Schtern statt Stern). Strategie Merken: Am Wort- und Silbenanfang steht «sp» und «st». Die Wörter in Standardsprache sprechen lassen.',
      folge:  null },
    'e-statt-ae': {                          // Ableiten
      kind:   'Zu diesem Wort gibt es ein verwandtes Wort mit a oder au. Dann schreibt man ä oder äu. Suche das verwandte Wort.',
      eltern: 'e oder eu nach Gehör geschrieben (Beume statt Bäume). Strategie Ableiten: ein verwandtes Wort mit a oder au suchen (Baum, Bäume). Hilft: Wortstammbaum zeichnen.',
      folge:  null },
    'ae-ohne-ableitung': {
      kind:   'Hier schreibt man «e» oder «eu». Meist gibt es kein verwandtes Wort mit a oder au. Ausnahmen wie «Eltern» muss man sich merken.',
      eltern: 'ä oder äu geschrieben, obwohl kein Wort mit a oder au verwandt ist (Bärg statt Berg). Strategie Ableiten: zuerst prüfen, ob es wirklich ein verwandtes Wort mit a oder au gibt, sonst e oder eu.',
      folge:  null },
    'ae-merkwort': {
      kind:   'Dieses Wort schreibt man mit ä, auch wenn es kein verwandtes Wort mit a gibt. Es ist ein Merkwort.',
      eltern: 'Ein Merkwort mit ä (Bär, Käse) wurde mit e geschrieben. Strategie Merken: die wenigen Merkwörter auf Karten sammeln.',
      folge:  null },
    'umlaut-vergessen': {
      kind:   'Zu diesem Wort gibt es ein verwandtes Wort mit a oder au. Aus a wird ä, aus au wird äu. Hier fehlt der Umlaut.',
      eltern: 'Der Umlaut wurde vergessen (Hande statt Hände). Strategie Ableiten: das verwandte Wort mit a suchen und prüfen, ob die Punkte dazugehören.',
      folge:  null },
    'stamm-verwechselt': {
      kind:   'Dieses Wort gehört zu einer anderen Wortfamilie. Streiche Vorsilbe und Endung weg und sieh nach, welcher Teil gleich bleibt.',
      eltern: 'Das Wort wurde dem falschen Wortstamm zugeordnet. Hilft: Vorsilben und Endungen durchstreichen und den gemeinsamen Teil markieren.',
      folge:  null },
    'aehnlicher-anfang': {
      kind:   'Das Wort sieht ähnlich aus, hat aber einen anderen Stamm. Achte auf das ganze Wort, nicht nur auf den Anfang.',
      eltern: 'Wort mit ähnlichem Anfang, aber anderem Stamm (Spiegel und Spiel). Hilft: nach der Bedeutung fragen und prüfen, ob das Wort wirklich etwas mit dem Stamm zu tun hat.',
      folge:  null },
    'silbengrenze-falsch': {                 // Mitsprechen
      kind:   'Die Silbengrenze liegt an einer anderen Stelle. Klatsche das Wort. Von mehreren Konsonanten geht der letzte zur nächsten Silbe, «ck» und «sch» bleiben zusammen.',
      eltern: 'Silbengrenze falsch gesetzt, oft nach dem Klang statt nach der Schreibung. Strategie Mitsprechen: das Wort klatschen und die Regel für mehrere Konsonanten anwenden.',
      folge:  null },
    'einzelner-buchstabe': {
      kind:   'Ein einzelner Buchstabe bleibt beim Trennen nicht allein stehen. Klatsche das Wort und prüfe jede Silbe.',
      eltern: 'Ein einzelner Buchstabe wurde abgetrennt (Kerz-e). Hilft: das Wort klatschen und prüfen, dass jede Silbe einen Vokal und mehr als einen Buchstaben hat.',
      folge:  null },
    'silbenzahl-falsch': {
      kind:   'Die Zahl der Silben stimmt nicht. Klatsche das Wort in die Hände: Jeder Klatscher ist eine Silbe.',
      eltern: 'Silben falsch gezählt oder zu viele Trennstriche gesetzt. Strategie Mitsprechen: das Wort klatschen oder schwingen, jede Silbe hat einen Vokal oder einen Zwielaut (au, ei, eu).',
      folge:  null },
    'doppel-fehlt': {
      kind:   'Nach einem kurzen Vokal steht meist ein doppelter Konsonant. Sprich das Wort langsam: Der Vokal ist kurz, also schreibt man den Konsonanten doppelt.',
      eltern: 'Einfacher Konsonant nach kurzem Vokal (Sone statt Sonne). Strategie Mitsprechen: die Vokallänge hören und die Silbenmitte sprechen (Son-ne).',
      folge:  null },
    'doppel-zuviel': {
      kind:   'Der Vokal ist hier lang. Nach einem langen Vokal steht nur ein Konsonant.',
      eltern: 'Doppelkonsonant nach langem Vokal (Hosse statt Hose). Hilft: die Vokallänge bewusst sprechen und Wörter nach langem und kurzem Vokal sortieren.',
      folge:  null },
    'ck-tz-fehlt': {                         // Merken
      kind:   'Nach einem kurzen Vokal schreibt man «ck» und «tz», nicht nur «k» und «z».',
      eltern: 'ck oder tz fehlt nach kurzem Vokal (Jake statt Jacke, Kaze statt Katze). Strategie Merken: «ck» und «tz» sind die Verdopplung von k und z.',
      folge:  null },
    'kk-zz-statt-ck-tz': {
      kind:   'Statt «kk» schreibt man «ck» und statt «zz» schreibt man «tz».',
      eltern: 'kk oder zz geschrieben statt ck und tz. Strategie Merken: die Regel «statt kk ck, statt zz tz» auswendig lernen.',
      folge:  null },
    'nicht-verlaengert': {                   // Verlängern
      kind:   'Verlängere das Wort, dann hörst du es: Bilde die Grundform (rennt, rennen) oder die Mehrzahl (Blitz, Blitze).',
      eltern: 'Die Schreibung wurde nicht über ein verlängertes Wort geklärt. Strategie Verlängern: Grundform oder Mehrzahl bilden und dort hinhören.',
      folge:  null }
  },

  pruefung: {                                // Aufbau der echten Lernkontrolle, Teil für Teil. Das Datum im Elternbereich gewinnt gegen dieses
    datum: null,                             // setzt der Elternbereich (oder eine Vorgabe vom Lernzielblatt)
    themen: ['*'],
    richtzeitMin: 25,                        // TODO: Format der Lernkontrolle, die Teile unten sind eine Annahme nach den Prüfungsaufgaben der Karte und kommen vom Blatt
    format: [
      { thema: ['nomen-grossschreibung'],                              typ: 'lueckentext',     anzahl: 6, punkte: 6 },
      { thema: ['ie-regel'],                                           typ: 'lueckentext',     anzahl: 6, punkte: 6 },
      { thema: ['umlaut-e-ae'],                                        typ: 'lueckentext',     anzahl: 6, punkte: 6 },
      { thema: ['silben-trennen'],                                     typ: 'multiple-choice', anzahl: 4, punkte: 4 },
      { thema: ['wortstamm-wortfamilie'],                              typ: 'zuordnen',        anzahl: 4, punkte: 4 },
      { thema: ['nomen-grossschreibung', 'ie-regel', 'umlaut-e-ae'],   typ: 'diktat',          anzahl: 3, punkte: 6 }
    ]
  },

  anpassbar: {                               // Whitelist: nur diese Felder zeigt der Elternbereich als Einstellung
    'themen.*.aktiv':            { typ: 'bool' },
    'standard.neuProTag':        { typ: 'zahl', min: 2, max: 8 },     // 8 = lernregeln.sitzung.neuProTagMax, mehr hätte keine Wirkung
    'standard.maxSchwierigkeit': { typ: 'zahl', min: 1, max: 3 }
  },

  begleitung: [
    'Lieber täglich zehn Minuten als einmal pro Woche eine Stunde. Das Kind schreibt selbst, die Eltern lesen mit.',
    'Bei einem Fehler nicht das richtige Wort vorsagen, sondern fragen, welche Strategie hilft: Mitsprechen, Verlängern, Ableiten oder Merken.',
    'Sprechweise und Lösungsweg wie im Lehrmittel verwenden, keine eigenen Merksprüche einführen. Wörter in Standardsprache sprechen, auch wenn zu Hause Mundart gesprochen wird.',
    'Diktate laufen mit Ton. Ohne Ton steht der Satz da und wird abgeschrieben, die Aufgabe zählt dann höchstens als Hilfe.'
  ]
});
