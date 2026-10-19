/* module/deutsch-satzbau/saetze.js: die Satzbank des Moduls und ihre Werkzeuge. Alle Generatoren des Moduls lesen die Sätze von hier.
   Die Bank wird als Eintrag «deutsch-satzbau/saetze» angemeldet (die Registry kennt nur Generatoren, Bausteine dürfen nur unter _gemeinsam liegen).
   Kein Thema nutzt diesen Eintrag als Aufgabenbestand, sein pool liefert eine leere Liste. Die Sätze sind eigene Beispiele.
   Jeder Satz besteht aus den Satzgliedern Wer, Verb, Wann, Wo (die kurzen Einstiegssätze nur aus Wer, Verb und Wo oder Wann). Die Glieder stehen getrennt,
   die Nomen tragen ein «~» (Artikelprobe, Grossschreibung). Regeln: Wer ist Artikel oder Possessiv plus Nomen, nie ein Name. Das Verb ist ein einziges Wort
   in der Personalform des Präsens, nicht trennbar, ohne Objekt. Wann ist zeitlich, Wo ist örtlich. Wann und Wo beginnen klein, damit beim Umstellen
   nur der Satzanfang gross ist. Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ARTEN = ['wer', 'verb', 'wann', 'wo'];
  const FRAGE = { wer: 'Wer?', verb: 'Verb', wann: 'Wann?', wo: 'Wo?' };         // so heissen die Antworten im Modul

  // Schlüssel, Wer, Verb, Wann, Wo. Nomen tragen ein «~». Der Schlüssel ist Teil der Aufgaben-IDs und ändert sich nie.
  const VOLL = [
    ['hund-garten', 'Der ~Hund', 'bellt', 'am ~Abend', 'im ~Garten'], ['kinder-schulhof', 'Die ~Kinder', 'spielen', 'in der ~Pause', 'auf dem ~Schulhof'],
    ['schwester-sofa', 'Meine ~Schwester', 'liest', 'nach der ~Schule', 'auf dem ~Sofa'], ['bauer-stall', 'Der ~Bauer', 'arbeitet', 'am ~Morgen', 'im ~Stall'],
    ['katze-treppe', 'Die ~Katze', 'miaut', 'am ~Abend', 'auf der ~Treppe'], ['baby-bett', 'Das ~Baby', 'lacht', 'am ~Morgen', 'im ~Bett'],
    ['nachbar-fluss', 'Unser ~Nachbar', 'joggt', 'am ~Samstag', 'am ~Fluss'], ['lehrerin-lehrerzimmer', 'Die ~Lehrerin', 'sitzt', 'in der ~Pause', 'im ~Lehrerzimmer'],
    ['vogel-dach', 'Der ~Vogel', 'singt', 'am ~Morgen', 'auf dem ~Dach'], ['kuh-wiese', 'Die ~Kuh', 'grast', 'im ~Sommer', 'auf der ~Wiese'],
    ['enten-see', 'Die ~Enten', 'schwimmen', 'am ~Mittag', 'auf dem ~See'], ['bruder-turnhalle', 'Mein ~Bruder', 'turnt', 'am ~Mittwoch', 'in der ~Turnhalle'],
    ['schueler-klassenzimmer', 'Die ~Schüler', 'lernen', 'am ~Montag', 'im ~Klassenzimmer'], ['fischer-see', 'Der ~Fischer', 'angelt', 'am ~Morgen', 'am ~See'],
    ['opa-balkon', 'Mein ~Opa', 'schläft', 'nach dem ~Mittagessen', 'auf dem ~Balkon'], ['oma-wohnzimmer', 'Meine ~Oma', 'strickt', 'am ~Nachmittag', 'im ~Wohnzimmer'],
    ['familie-kueche', 'Die ~Familie', 'frühstückt', 'am ~Sonntag', 'in der ~Küche'], ['schwimmer-hallenbad', 'Die ~Schwimmer', 'trainieren', 'jeden ~Abend', 'im ~Hallenbad'],
    ['pferd-weide', 'Das ~Pferd', 'trabt', 'am ~Nachmittag', 'auf der ~Weide'], ['hase-feld', 'Der ~Hase', 'hüpft', 'im ~Herbst', 'auf dem ~Feld'],
    ['maus-keller', 'Die ~Maus', 'raschelt', 'in der ~Nacht', 'im ~Keller'], ['vater-buero', 'Mein ~Vater', 'arbeitet', 'jeden ~Tag', 'im ~Büro'],
    ['mutter-schwimmbad', 'Meine ~Mutter', 'schwimmt', 'am ~Dienstag', 'im ~Schwimmbad'], ['loewe-zoo', 'Der ~Löwe', 'brüllt', 'am ~Mittag', 'im ~Zoo'],
    ['blumen-wegrand', 'Die ~Blumen', 'blühen', 'im ~Frühling', 'am ~Wegrand'], ['familie-zelt', 'Unsere ~Familie', 'übernachtet', 'am ~Wochenende', 'im ~Zelt'],
    ['maedchen-aula', 'Das ~Mädchen', 'tanzt', 'am ~Freitag', 'in der ~Aula'], ['junge-park', 'Der ~Junge', 'rennt', 'nach der ~Schule', 'im ~Park'],
    ['freundin-musikzimmer', 'Meine ~Freundin', 'übt', 'am ~Donnerstag', 'im ~Musikzimmer'], ['freund-spielplatz', 'Mein ~Freund', 'klettert', 'in den ~Ferien', 'auf dem ~Spielplatz'],
    ['sonne-himmel', 'Die ~Sonne', 'scheint', 'heute', 'am ~Himmel'], ['mond-dorf', 'Der ~Mond', 'leuchtet', 'in der ~Nacht', 'über dem ~Dorf'],
    ['schneemann-haus', 'Der ~Schneemann', 'steht', 'im ~Winter', 'vor dem ~Haus'], ['schnee-berg', 'Der ~Schnee', 'liegt', 'im ~Winter', 'auf dem ~Berg'],
    ['saengerin-kirche', 'Die ~Sängerin', 'singt', 'am ~Sonntag', 'in der ~Kirche'], ['wanderer-waldrand', 'Die ~Wanderer', 'rasten', 'am ~Mittag', 'am ~Waldrand'],
    ['eltern-schulhaus', 'Die ~Eltern', 'warten', 'am ~Freitag', 'vor dem ~Schulhaus'], ['reiterin-reitplatz', 'Die ~Reiterin', 'reitet', 'am ~Samstag', 'auf dem ~Reitplatz'],
    ['geschwister-huegel', 'Die ~Geschwister', 'rodeln', 'im ~Winter', 'auf dem ~Hügel'], ['grosseltern-wald', 'Meine ~Grosseltern', 'wandern', 'am ~Sonntag', 'im ~Wald'],
    ['hahn-hof', 'Der ~Hahn', 'kräht', 'am ~Morgen', 'auf dem ~Hof'], ['kaninchen-stall', 'Das ~Kaninchen', 'schläft', 'in der ~Nacht', 'im ~Stall'],
    ['senn-alp', 'Der ~Senn', 'lebt', 'im ~Sommer', 'auf der ~Alp'], ['bienen-obstgarten', 'Die ~Bienen', 'summen', 'im ~Frühling', 'im ~Obstgarten']
  ];
  // Kurze Einstiegssätze: Wer, Verb und entweder Wo oder Wann (abwechselnd)
  const KURZ = [
    ['katze-sofa', 'Die ~Katze', 'schläft', null, 'auf dem ~Sofa'], ['baby-morgen', 'Das ~Baby', 'lacht', 'am ~Morgen', null],
    ['kinder-spielplatz', 'Die ~Kinder', 'spielen', null, 'auf dem ~Spielplatz'], ['schueler-mittwoch', 'Die ~Schüler', 'turnen', 'am ~Mittwoch', null],
    ['fisch-teich', 'Der ~Fisch', 'schwimmt', null, 'im ~Teich'], ['bruder-samstag', 'Mein ~Bruder', 'schwimmt', 'am ~Samstag', null],
    ['kuh-stall', 'Die ~Kuh', 'steht', null, 'im ~Stall'], ['lehrerin-heute', 'Die ~Lehrerin', 'wartet', 'heute', null]
  ];
  // Der Artikel jedes Nomens für die Artikelprobe (Mehrzahlwörter mit «die»)
  const ARTIKEL = Object.fromEntries(Object.entries({
    der: 'Hund Abend Garten Schulhof Bauer Morgen Stall Nachbar Samstag Fluss Vogel Mittag See Bruder Mittwoch Montag Fischer Opa Balkon Nachmittag Sonntag Tag Hase Herbst '
      + 'Keller Vater Dienstag Löwe Zoo Frühling Wegrand Freitag Junge Park Donnerstag Freund Spielplatz Himmel Mond Schneemann Winter Schnee Berg Waldrand Reitplatz Hügel '
      + 'Wald Hahn Hof Senn Obstgarten Fisch Teich Sommer',
    die: 'Kinder Pause Schwester Schule Katze Treppe Lehrerin Kuh Wiese Enten Turnhalle Schüler Oma Familie Küche Schwimmer Weide Maus Nacht Mutter Blumen Aula Freundin '
      + 'Ferien Sonne Sängerin Kirche Wanderer Eltern Reiterin Geschwister Grosseltern Alp Bienen',
    das: 'Sofa Baby Bett Lehrerzimmer Dach Klassenzimmer Mittagessen Wohnzimmer Hallenbad Pferd Feld Büro Schwimmbad Wochenende Zelt Mädchen Musikzimmer Dorf Haus Schulhaus Kaninchen'
  }).flatMap(([art, nomen]) => nomen.split(' ').map(n => [n, art])));

  const gross1 = t => t.charAt(0).toUpperCase() + t.slice(1);
  const klein1 = t => t.charAt(0).toLowerCase() + t.slice(1);
  const glied = roh => (roh === null ? null : { text: roh.replace(/~/g, ''), nomen: roh.split(' ').filter(w => w.startsWith('~')).map(w => w.slice(1)) });
  const satzVon = voll => ([k, wer, verb, wann, wo]) => {
    const glieder = { wer: glied(wer), verb: glied(verb), wann: glied(wann), wo: glied(wo) };
    return { k, voll, glieder, folge: ARTEN.filter(a => glieder[a] !== null) };
  };
  const voll = VOLL.map(satzVon(true)), kurz = KURZ.map(satzVon(false)), alle = [...kurz, ...voll];
  const keys = alle.map(s => s.k);
  if (new Set(keys).size !== keys.length) throw new Error('deutsch-satzbau: ein Satzschlüssel kommt doppelt vor');
  for (const s of alle) for (const a of s.folge) for (const n of s.glieder[a].nomen) {
    if (!Object.hasOwn(ARTIKEL, n)) throw new Error(`deutsch-satzbau: Artikel für das Nomen «${n}» fehlt (Satz ${s.k})`);
  }

  const finde = k => {
    const s = alle.find(x => x.k === k);
    if (!s) throw new Error(`deutsch-satzbau: Satz «${k}» gehört nicht zur Satzbank`);
    return s;
  };

  /** Die Satzglieder in der Reihenfolge folge, so geschrieben, wie sie im Satz stehen: das erste gross, Wer sonst klein, Wann und Wo klein. */
  const teile = (s, folge = s.folge) => folge.map((a, i) => (i === 0 ? gross1(s.glieder[a].text) : a === 'wer' ? klein1(s.glieder[a].text) : s.glieder[a].text));
  /** Wie teile, das letzte Satzglied trägt den Punkt. Das sind die Karten der Aufgaben mit der Form abfolge. */
  const karten = (s, folge) => teile(s, folge).map((t, i, l) => (i === l.length - 1 ? `${t}.` : t));
  const text = (s, folge) => karten(s, folge).join(' ');
  /** Reihenfolge nach dem Umstellen: das Glied erstes (Wann oder Wo) vorn, das Verb an zweiter Stelle, dann Wer, dann das übrige Glied. */
  const umfolge = (s, erstes) => [erstes, 'verb', 'wer', ...s.folge.filter(a => !['wer', 'verb', erstes].includes(a))];
  /** Welche Glieder dürfen beim Umstellen vorn stehen? Wann und Wo, soweit der Satz sie hat. Mit mehrWoerter nur solche aus mindestens zwei Wörtern
      (nur dort lässt sich ein Satzglied zerreissen). */
  const vorn = (s, mehrWoerter = false) => ['wann', 'wo'].filter(a => s.folge.includes(a) && (!mehrWoerter || s.glieder[a].text.includes(' ')));
  /** Die Wörter des Satzes in der Grundstellung mit ihrer Rolle: anfang, nomen, verb oder klein (Artikel, Präposition, Zeitwort). */
  const woerter = s => s.folge.flatMap(a => s.glieder[a].text.split(' ').map(w => ({ w, rolle: s.glieder[a].nomen.includes(w) ? 'nomen' : a === 'verb' ? 'verb' : 'klein' })))
    .map((x, i) => (i === 0 ? { ...x, rolle: 'anfang' } : x));
  /** Der Satz mit dem Satzglied der Art art in «Guillemets». */
  const markiert = (s, art) => `${teile(s).map((t, i) => (s.folge[i] === art ? `«${t}»` : t)).join(' ')}.`;
  /** Die Artikelprobe zu allen Nomen des Satzes: «der Hund», «der Abend». */
  const nomenProbe = s => s.folge.flatMap(a => s.glieder[a].nomen).map(n => `«${ARTIKEL[n]} ${n}»`);

  /** Fehlercode, wenn das Kind statt der gesuchten Art (soll) die Art gewaehlt wählt: Wer und Verb, Wann und Wo, sonst ein anderes Satzglied. */
  const verwechselt = (soll, gewaehlt) => {
    const paar = [soll, gewaehlt].sort().join('-');
    return paar === 'verb-wer' ? 'wer-verb-verwechselt' : paar === 'wann-wo' ? 'wann-wo-verwechselt' : 'satzglied-falsch';
  };

  const FRAGEN = { wer: 'Wer tut etwas?', verb: 'Was tut jemand?', wann: 'Wann geschieht es?', wo: 'Wo geschieht es?' };
  const SAGT = { wer: 'wer etwas tut', wann: 'wann etwas geschieht', wo: 'wo etwas geschieht' };
  /** Lösungsweg zur Frage nach einem Satzglied: die Frage stellen, die Antwort im Satz zeigen. */
  const weg = (s, art) => {
    const t = s.glieder[art].text;
    return { weg: 'fragen-stellen', schritte: [`Frage: ${FRAGEN[art]} Im Satz «${text(s)}» antwortet «${t}» darauf.`,
      art === 'verb' ? `«${t}» sagt, was jemand tut. Es ist das Verb.` : `«${t}» sagt, ${SAGT[art]}. Es antwortet auf die Frage «${FRAGE[art]}».`] };
  };

  L.generator('deutsch-satzbau/saetze', L.einfrieren({
    pool: () => [],
    ARTEN, FRAGE, ARTIKEL, voll, kurz, alle, finde, gross1, klein1, teile, karten, text, umfolge, vorn, woerter, markiert, nomenProbe, verwechselt, weg
  }));
})(globalThis);
