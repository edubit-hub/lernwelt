/* module/deutsch-wortarten/gen-wortarten.js: Aufgabenbestand für «Nomen, Verb oder Adjektiv?» (Form paar) und «Wie ist es?» (Form auswahl).
   Alle Wörter und Sätze sind eigene Beispiele, keine aus einem Lehrmittel. Jede Aufgabe trägt ihren Lösungsweg mit der passenden Probe:
   Artikelprobe für das Nomen, die Frage «Was tut jemand?» für das Verb, die Wie-Frage und die Steigerungsprobe für das Adjektiv.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const UMLAUT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };
  const idVon = w => w.toLowerCase().replace(/[äöü]/g, c => UMLAUT[c]);
  const ER = { der: 'Er', die: 'Sie', das: 'Es' };                      // Fürwort zum Begleiter

  // Nomen: Wort, Begleiter, Schwierigkeit
  const NOMEN = [['Hund', 'der', 1], ['Schule', 'die', 1], ['Baum', 'der', 1], ['Tisch', 'der', 1], ['Fenster', 'das', 1], ['Freude', 'die', 2], ['Mut', 'der', 2]];
  // Verben in der Grundform: Wort, Schwierigkeit
  const VERBEN = [['rennen', 1], ['singen', 1], ['malen', 1], ['springen', 1], ['schlafen', 2], ['denken', 2], ['lachen', 2]];
  // Adjektive: Wort, Mehrstufe, Höchststufe, Schwierigkeit
  const ADJEKTIVE = [['schnell', 'schneller', 'schnellsten', 1], ['klein', 'kleiner', 'kleinsten', 1], ['hell', 'heller', 'hellsten', 1], ['kalt', 'kälter', 'kältesten', 1],
    ['müde', 'müder', 'müdesten', 2], ['freundlich', 'freundlicher', 'freundlichsten', 2], ['mutig', 'mutiger', 'mutigsten', 2]];

  const NICHT = { Nomen: 'nicht-nomen', Verb: 'nicht-verb', Adjektiv: 'nicht-adjektiv' };   // gewählte Wortart, die nicht stimmt

  const nomenAufgabe = ([w, art, s]) => ({
    id: `wa-${idVon(w)}`, form: 'paar', inhalt: { links: w, rechts: 'Nomen', gruppe: 'wortarten' }, schwierigkeit: s, braucht: [],
    hilfe: { weg: 'artikelprobe', schritte: [`Setze der, die oder das davor: ${art} ${w}.`, `Das klingt richtig. «${w}» ist ein Nomen.`] }
  });
  const verbAufgabe = ([w, s]) => ({
    id: `wa-${idVon(w)}`, form: 'paar', inhalt: { links: w, rechts: 'Verb', gruppe: 'wortarten' }, schwierigkeit: s, braucht: [],
    hilfe: { weg: 'verbfrage', schritte: [`Frage: Was kann jemand tun? Jemand kann ${w}.`, `«${w}» sagt, was jemand tut. Es ist ein Verb.`] }
  });
  const adjektivAufgabe = ([w, komp, sup, s]) => ({
    id: `wa-${idVon(w)}`, form: 'paar', inhalt: { links: w, rechts: 'Adjektiv', gruppe: 'wortarten' }, schwierigkeit: s, braucht: [],
    hilfe: { weg: 'steigerungsprobe', schritte: [`Frage: Wie kann etwas sein? Es kann ${w} sein.`, `Steigerungsprobe: ${w}, ${komp}, am ${sup}. Das geht, darum ist es ein Adjektiv.`] }
  });

  L.generator('deutsch-wortarten/wortarten', {
    pool() {                                                              // abwechselnd Nomen, Verb, Adjektiv: jede Gruppe von drei hat mehrere Felder
      return NOMEN.flatMap((n, i) => [nomenAufgabe(n), verbAufgabe(VERBEN[i]), adjektivAufgabe(ADJEKTIVE[i])]);
    },
    diagnose(auf, antwort) {                                              // antwort.text ist die gewählte Wortart
      const t = antwort && antwort.text;
      if (t === auf.inhalt.rechts) return null;
      return Object.hasOwn(NICHT, t) ? NICHT[t] : 'sonstige';
    }
  });

  // Wie-Fragen: Nomen, Begleiter, Adjektiv, Mehrstufe, Höchststufe, falsches Nomen, falsches Verb
  const WIE = [
    ['Schnee', 'der', 'kalt', 'kälter', 'kältesten', 'Winter', 'fällt'], ['Elefant', 'der', 'gross', 'grösser', 'grössten', 'Zoo', 'trinkt'],
    ['Nacht', 'die', 'dunkel', 'dunkler', 'dunkelsten', 'Mond', 'kommt'], ['Maus', 'die', 'klein', 'kleiner', 'kleinsten', 'Käse', 'nagt'],
    ['Feuer', 'das', 'heiss', 'heisser', 'heissesten', 'Holz', 'brennt'], ['Hase', 'der', 'schnell', 'schneller', 'schnellsten', 'Wiese', 'hüpft'],
    ['Suppe', 'die', 'warm', 'wärmer', 'wärmsten', 'Löffel', 'dampft'], ['Löwe', 'der', 'stark', 'stärker', 'stärksten', 'Mähne', 'brüllt'],
    ['Kissen', 'das', 'weich', 'weicher', 'weichsten', 'Bett', 'liegt'], ['Feder', 'die', 'leicht', 'leichter', 'leichtesten', 'Vogel', 'fliegt'],
    ['Zucker', 'der', 'süss', 'süsser', 'süssesten', 'Kaffee', 'schmilzt'], ['See', 'der', 'tief', 'tiefer', 'tiefsten', 'Fisch', 'glitzert']
  ];

  const wieAufgabe = ([n, art, adj, komp, sup, nomenFalsch, verbFalsch], i) => ({
    id: `aj-${idVon(n)}`, form: 'auswahl', schwierigkeit: i < 6 ? 1 : 2, braucht: [],
    inhalt: { frage: `Wie ist ${art} ${n}? Wähle das Adjektiv.`, richtig: adj,
      falsch: [{ text: nomenFalsch, code: 'gewaehlt-nomen' }, { text: verbFalsch, code: 'gewaehlt-verb' }] },
    hilfe: { weg: 'steigerungsprobe', schritte: [`Frage: Wie ist ${art} ${n}? ${ER[art]} ist ${adj}.`, `Steigerungsprobe: ${adj}, ${komp}, am ${sup}. Das geht nur bei einem Adjektiv.`] }
  });

  L.generator('deutsch-wortarten/adjektiv', {
    pool: () => WIE.map(wieAufgabe),
    diagnose(auf, antwort) {                                              // antwort.text ist das gewählte Wort (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text, w = WIE.find(x => idVon(x[0]) === auf.id.slice(3));
      if (!w || t === auf.inhalt.richtig) return null;
      return t === w[5] ? 'gewaehlt-nomen' : t === w[6] ? 'gewaehlt-verb' : 'sonstige';
    }
  });
})(globalThis);
