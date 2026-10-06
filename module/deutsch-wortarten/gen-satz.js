/* module/deutsch-wortarten/gen-satz.js: Satzzeichen und Satzarten. Satzzeichen am Schluss wählen (Form satz, Kacheln), Wörter zu einem Satz ordnen
   (Form abfolge) und die Satzart nennen (Form auswahl). Die Kacheln zeigen immer alle drei Satzzeichen, damit die Tastatur die Lösung nicht verrät.
   Die Wörter der Sätze tragen Grossschreibung und Satzzeichen, darum gibt es für jeden Satz genau eine Reihenfolge. Alle Sätze sind eigene Beispiele.
   In Lösungswegen steht das Ausrufezeichen nur als Wort, nie als Zeichen (Ton, Architektur 6.9). Reine Berechnung: kein Zustand, kein Zufall, keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const S = L.registry.bausteine.get('_gemeinsam/schreibantwort');
  if (!S) throw new Error('deutsch-wortarten: Baustein «_gemeinsam/schreibantwort» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');
  const ZEICHEN = ['.', '?', '!'];
  const NAME = { '.': 'Punkt', '?': 'Fragezeichen', '!': 'Ausrufezeichen' };
  const luecken = auf => [...auf.inhalt.text.matchAll(/\{([^{}]*)\}/g)].map(m => m[1]);
  const ohneZeichen = w => w.replace(/[.?!]$/, '');

  // Schlüssel, Satz mit Lücken (Satzzeichen oder Satzanfang), Schwierigkeit
  const ZEICHENSAETZE = [
    ['wo-wohnt', 'Wo wohnt die Katze{?}', 1], ['hunger', 'Hast du Hunger{?}', 1], ['schule', 'Wann beginnt die Schule{?}', 1],
    ['katze', 'Die Katze schläft auf dem Sofa{.}', 1], ['mia', 'Mia spielt im Garten{.}', 1], ['hund', 'Ich habe einen Hund{.}', 1],
    ['pass-auf', 'Pass auf{!}', 1], ['hol-ball', 'Hol den Ball{!}', 1], ['stopp', 'Stopp{!}', 1], ['komm', 'Komm sofort her{!}', 1],
    ['heft', 'Wo ist mein Heft{?} Es liegt auf dem Tisch{.}', 2], ['name', 'Wie heisst du{?} Ich heisse Mia{.}', 2],
    ['anfang-heute', '{Heute} scheint die Sonne{.}', 2], ['anfang-morgen', '{Morgen} gehen wir ins Kino{.}', 2], ['anfang-dort', '{Dort} wohnt die Katze{.}', 2]
  ];
  /** Die Kacheln einer Lücke: bei einem Satzzeichen die beiden anderen, beim Satzanfang das Wort in Kleinschreibung. */
  const kacheln = z => (ZEICHEN.includes(z) ? ZEICHEN.filter(x => x !== z) : [z.toLowerCase()]);
  const schritt = (z, nr, n) => {
    const vor = n > 1 ? `Satz ${nr}: ` : '';
    if (z === '?') return `${vor}Lies den Satz mit der Stimme. Er fragt, am Schluss steht ein Fragezeichen.`;
    if (z === '.') return `${vor}Der Satz sagt etwas. Am Schluss steht ein Punkt.`;
    if (z === '!') return `${vor}Der Satz ruft oder fordert auf. Am Schluss steht ein Ausrufezeichen.`;
    return `Ein Satz beginnt mit einem grossen Buchstaben: «${z}».`;
  };

  /** Der Hinweis über dem Satz: «Wort» passt nicht zu einem Satzzeichen (V-AP18d-01). */
  const hinweisVon = (loesungen, zeichen) => (zeichen.length < loesungen.length ? 'Wähle das Satzzeichen und das Wort am Anfang.' : zeichen.length > 1 ? 'Wähle die passenden Satzzeichen.' : 'Wähle das passende Satzzeichen.');

  const zeichenAufgabe = ([k, satz, s]) => {
    const loesungen = [...satz.matchAll(/\{([^{}]*)\}/g)].map(m => m[1]), zeichen = loesungen.filter(z => ZEICHEN.includes(z));
    let nr = 0;
    return {
      id: `sz-${k}`, form: 'satz', schwierigkeit: s, braucht: [], inhalt: { text: satz, luecken: loesungen.map(z => ({ ablenker: kacheln(z) })), hinweis: hinweisVon(loesungen, zeichen) },
      hilfe: { weg: 'satzzeichenregel', schritte: ['Lies den Satz laut und achte darauf, wie die Stimme am Schluss klingt.', ...loesungen.map(z => schritt(z, ZEICHEN.includes(z) ? ++nr : 0, zeichen.length))] }
    };
  };
  const CODES = { '?.': 'punkt-statt-frage', '.?': 'frage-statt-punkt', '!.': 'punkt-statt-ausruf', '.!': 'ausruf-statt-punkt' };   // Lösung, Eingabe

  L.generator('deutsch-wortarten/satzzeichen', {
    pool: () => ZEICHENSAETZE.map(zeichenAufgabe),
    diagnose(auf, antwort) {                                              // antwort: { luecken, arten } des Lückentexts
      const arten = antwort && Array.isArray(antwort.arten) ? antwort.arten : [], i = arten.findIndex(a => a !== 'richtig');
      if (!arten.length || i < 0) return null;
      const soll = luecken(auf)[i], e = S.eingabe(antwort, i);
      if (arten[i] === 'gross-klein') return 'satzanfang-klein';
      return Object.hasOwn(CODES, soll + e) ? CODES[soll + e] : 'sonstige';
    }
  });

  // Schlüssel, Satz, Schwierigkeit. Das Wort mit dem Satzzeichen steht am Schluss, Satzanfang und Nomen sind gross geschrieben.
  const SAETZE = [
    ['hund-bellt', 'Der Hund bellt laut.', 1], ['katze-sofa', 'Die Katze schläft auf dem Sofa.', 2], ['mia-buch', 'Mia liest ein Buch.', 1], ['wo-wohnt', 'Wo wohnt die Katze?', 2],
    ['garten', 'Wir spielen im Garten.', 1], ['wie-heisst', 'Wie heisst du?', 1], ['zug', 'Der Zug fährt schnell.', 1], ['was-isst', 'Was isst du heute?', 2],
    ['hol-ball', 'Hol den Ball!', 1], ['licht-aus', 'Mach das Licht aus!', 2], ['kinder', 'Die Kinder lachen laut.', 1], ['sonne-morgen', 'Am Morgen scheint die Sonne.', 2],
    ['ich-habe', 'Ich habe einen Hund.', 1]
  ];

  const bauAufgabe = ([k, satz, s]) => {
    const w = satz.split(' '), zeichen = satz.slice(-1);
    return {
      id: `sb-${k}`, form: 'abfolge', schwierigkeit: s, braucht: [], inhalt: { frage: 'Setze die Wörter zu einem Satz zusammen.', schritte: w },
      hilfe: { weg: 'satzbau', schritte: [`Das Satzzeichen (${NAME[zeichen]}) steht am Schluss, beim Wort «${ohneZeichen(w[w.length - 1])}».`, `Der Satz beginnt mit «${w[0]}».`,
        `Der Satz lautet: ${w.map(ohneZeichen).join(' ')}, am Schluss ein ${NAME[zeichen]}.`] }
    };
  };

  L.generator('deutsch-wortarten/satzbau', {
    pool: () => SAETZE.map(bauAufgabe),
    diagnose(auf, antwort) {                                              // antwort.folge: getippte Schritte als Indizes in schritte
      const f = antwort && antwort.folge, n = auf.inhalt.schritte.length;
      if (!Array.isArray(f) || f.length !== n) return 'sonstige';
      if (f.every((s, p) => s === p)) return null;
      if (f[n - 1] !== n - 1) return 'satz-ende';
      return f[0] !== 0 ? 'satz-anfang' : 'sonstige';
    }
  });

  // Schlüssel, Satz, Satzart, Schwierigkeit
  const ARTSAETZE = [
    ['wo-wohnt', 'Wo wohnt die Katze?', 'Fragesatz', 1], ['hunger', 'Hast du Hunger?', 'Fragesatz', 1], ['schule', 'Wann beginnt die Schule?', 'Fragesatz', 1],
    ['heft', 'Wo ist mein Heft?', 'Fragesatz', 1], ['katze', 'Die Katze schläft auf dem Sofa.', 'Aussagesatz', 1], ['sonne', 'Heute scheint die Sonne.', 'Aussagesatz', 1],
    ['mia', 'Mia spielt im Garten.', 'Aussagesatz', 1], ['hund', 'Ich habe einen Hund.', 'Aussagesatz', 1], ['ball', 'Hol bitte den Ball!', 'Ausrufesatz', 2],
    ['licht', 'Mach das Licht aus!', 'Ausrufesatz', 2], ['pass', 'Pass auf!', 'Ausrufesatz', 2], ['komm', 'Komm sofort her!', 'Ausrufesatz', 2]
  ];
  const ART_CODE = { Aussagesatz: 'satzart-aussage', Fragesatz: 'satzart-frage', Ausrufesatz: 'satzart-aufforderung' };
  const ART_WEG = {
    Aussagesatz: ['Der Satz erzählt etwas oder stellt etwas fest.', 'Am Schluss steht ein Punkt. Es ist ein Aussagesatz.'],
    Fragesatz: ['Der Satz stellt eine Frage. Man antwortet mit ja, nein oder mit einer Auskunft.', 'Am Schluss steht ein Fragezeichen. Es ist ein Fragesatz.'],
    Ausrufesatz: ['Der Satz ruft etwas oder sagt, was jemand tun soll.', 'Am Schluss steht ein Ausrufezeichen. Es ist ein Ausrufesatz.']
  };

  const artAufgabe = ([k, satz, art, s]) => ({
    id: `sa-${k}`, form: 'auswahl', schwierigkeit: s, braucht: [],
    inhalt: { frage: `Welche Art von Satz ist das? «${satz}»`, richtig: art,
      falsch: Object.keys(ART_CODE).filter(a => a !== art).map(a => ({ text: a, code: ART_CODE[a] })) },
    hilfe: { weg: 'satzart', schritte: ART_WEG[art] }
  });

  L.generator('deutsch-wortarten/satzarten', {
    pool: () => ARTSAETZE.map(artAufgabe),
    diagnose(auf, antwort) {                                              // antwort.text ist die gewählte Satzart (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text;
      return t === auf.inhalt.richtig ? null : Object.hasOwn(ART_CODE, t) ? ART_CODE[t] : 'sonstige';
    }
  });
})(globalThis);
