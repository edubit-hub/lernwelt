/* module/deutsch-wortarten/gen-nomen.js: Nomen mit Begleiter (Form satz, die Kacheln der, die, das) und Einzahl und Mehrzahl (Form satz, getippt).
   Gewählt sind nur Nomen, deren Begleiter in der Standardsprache und im Dialekt gleich ist. Beim Begleiter steht die Lücke nie am Satzanfang,
   damit die Grossschreibung hier nicht mitspielt (sie gehört zur Rechtschreibung). Die Mehrzahlen sind mit ihrer Regel eingetragen,
   der Modultest rechnet sie aus Einzahl und Regel unabhängig nach. Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const S = L.registry.bausteine.get('_gemeinsam/schreibantwort');
  if (!S) throw new Error('deutsch-wortarten: Baustein «_gemeinsam/schreibantwort» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');
  const UMLAUT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };
  const idVon = w => w.toLowerCase().replace(/[äöü]/g, c => UMLAUT[c]);
  const BEGLEITER = ['der', 'die', 'das'];
  const loesungVon = auf => /\{([^{}]*)\}/.exec(auf.inhalt.text)[1];

  // Nomen, Begleiter, Satz mit der Lücke beim Begleiter, Schwierigkeit
  const NOMEN = [
    ['Tisch', 'der', 'Hier steht {der} Tisch.', 1], ['Lampe', 'die', 'Dort hängt {die} Lampe.', 1], ['Buch', 'das', 'Auf dem Regal liegt {das} Buch.', 1],
    ['Baum', 'der', 'Im Garten wächst {der} Baum.', 1], ['Blume', 'die', 'Am Fenster blüht {die} Blume.', 1], ['Auto', 'das', 'Vor der Tür parkt {das} Auto.', 1],
    ['Stuhl', 'der', 'Dort steht {der} Stuhl.', 1], ['Tasche', 'die', 'Hier hängt {die} Tasche.', 1], ['Fenster', 'das', 'Dort ist {das} Fenster offen.', 1],
    ['Apfel', 'der', 'Auf dem Teller liegt {der} Apfel.', 2], ['Schule', 'die', 'Hier ist {die} Schule.', 1], ['Haus', 'das', 'Dort steht {das} Haus.', 1],
    ['Löffel', 'der', 'In der Suppe steckt {der} Löffel.', 2], ['Gabel', 'die', 'Neben dem Teller liegt {die} Gabel.', 2], ['Messer', 'das', 'Neben dem Teller liegt {das} Messer.', 2]
  ];

  const begleiterAufgabe = ([n, art, satz, s]) => ({
    id: `be-${idVon(n)}`, form: 'satz', schwierigkeit: s, braucht: [],
    inhalt: { text: satz, luecken: [{ ablenker: BEGLEITER.filter(b => b !== art) }] },
    hilfe: { weg: 'begleiter-sprechen', schritte: [`Sprich alle drei Formen: der ${n}, die ${n}, das ${n}.`, `Nur «${art} ${n}» klingt richtig.`, `Merke dir das Nomen immer mit seinem Artikel: ${art} ${n}.`] }
  });

  L.generator('deutsch-wortarten/begleiter', {
    pool: () => NOMEN.map(begleiterAufgabe),
    diagnose(auf, antwort) {                                              // antwort: { luecken, arten } des Lückentexts
      const art = S.art(antwort, 0);
      return art === null || art === 'richtig' ? null : 'begleiter-falsch';
    }
  });

  // Einzahl, Begleiter, Regel, Mehrzahl, Schwierigkeit. Regeln: e, n, en, er, s, gleich, umlaut (nur Umlaut), umlaut-e, umlaut-er
  const MEHRZAHL = [
    ['Hund', 'der', 'e', 'Hunde', 1], ['Tisch', 'der', 'e', 'Tische', 1], ['Blume', 'die', 'n', 'Blumen', 1], ['Schule', 'die', 'n', 'Schulen', 1],
    ['Katze', 'die', 'n', 'Katzen', 1], ['Auto', 'das', 's', 'Autos', 1], ['Kind', 'das', 'er', 'Kinder', 1], ['Frau', 'die', 'en', 'Frauen', 1],
    ['Fenster', 'das', 'gleich', 'Fenster', 2], ['Teller', 'der', 'gleich', 'Teller', 2], ['Baum', 'der', 'umlaut-e', 'Bäume', 2], ['Stuhl', 'der', 'umlaut-e', 'Stühle', 2],
    ['Hand', 'die', 'umlaut-e', 'Hände', 2], ['Apfel', 'der', 'umlaut', 'Äpfel', 2], ['Vogel', 'der', 'umlaut', 'Vögel', 2], ['Haus', 'das', 'umlaut-er', 'Häuser', 3],
    ['Buch', 'das', 'umlaut-er', 'Bücher', 3], ['Uhr', 'die', 'en', 'Uhren', 2]
  ];
  const ENDUNG = { e: '-e', n: '-n', en: '-en', er: '-er', s: '-s', 'umlaut-e': '-e', 'umlaut-er': '-er' };

  /** Der Hinweis zur Regel; bei einem Umlaut wird der Buchstabe genannt, der sich ändert (a wird ä). */
  function hinweis(n, regel, pl) {
    if (regel === 'gleich') return 'Das Wort bleibt in der Mehrzahl gleich.';
    const i = [...n].findIndex((z, k) => z !== pl[k]), au = n.slice(i, i + 2) === 'au', umlaut = regel.startsWith('umlaut') ? (au ? 'Aus «au» wird «äu»' : `Aus «${n[i]}» wird «${pl[i]}»`) : '';
    if (!ENDUNG[regel]) return `${umlaut}.`;
    return umlaut ? `${umlaut}, und es kommt ${ENDUNG[regel]} dazu.` : `Es kommt ${ENDUNG[regel]} dazu.`;
  }

  const mehrzahlAufgabe = ([n, art, regel, pl, s]) => ({
    id: `mz-${idVon(n)}`, form: 'satz', schwierigkeit: s, braucht: [],
    inhalt: { text: `${art === 'die' ? 'Eine' : 'Ein'} ${n}, zwei {${pl}}.` },
    hilfe: { weg: 'mehrzahlprobe', schritte: [`Einzahl: ${art} ${n}. Mehrzahl: die ${pl}.`, hinweis(n, regel, pl), `Probe: Sprich «zwei ${pl}». Das klingt richtig.`] }
  });

  L.generator('deutsch-wortarten/mehrzahl', {
    pool: () => MEHRZAHL.map(mehrzahlAufgabe),
    diagnose(auf, antwort) {                                              // antwort: { luecken, arten } des Lückentexts
      const art = S.art(antwort, 0), e = S.eingabe(antwort, 0), soll = loesungVon(auf), einzahl = /^Eine? (\S+),/.exec(auf.inhalt.text)[1];
      if (art === null || art === 'richtig') return null;
      if (art === 'gross-klein') return 'gross-klein';
      if (e === einzahl) return 'einzahl-getippt';
      if (S.umlautFehlt(e, soll)) return 'umlaut-fehlt';
      const anfang = w => S.ohneUmlaut(w).slice(0, 2).toLowerCase();       // das Wort stimmt am Anfang, nur die Endung weicht ab
      return e !== '' && anfang(e) === anfang(soll) ? 'endung-falsch' : 'sonstige';
    }
  });
})(globalThis);
