/* module/deutsch-wortarten/gen-satzteile.js: Wortarten im Satz finden (Form auswahl) und herausschreiben (Form satz, getippt).
   Beide Themen lesen dieselben kurzen Sätze mit je einem Begleiter, einem Nomen, einem Verb und einem Adjektiv, damit die Frage nach einer Wortart
   genau eine Antwort hat. Alle Sätze sind eigene Beispiele. Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const S = L.registry.bausteine.get('_gemeinsam/schreibantwort');
  if (!S) throw new Error('deutsch-wortarten: Baustein «_gemeinsam/schreibantwort» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');
  const UMLAUT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };
  const idVon = w => w.toLowerCase().replace(/[äöü]/g, c => UMLAUT[c]);
  const ER = { der: 'Er', die: 'Sie', das: 'Es' };

  // b Begleiter, art Begleiter klein, adj Adjektiv wie im Satz, grund Grundform, n Nomen, v Verb, nach: Adjektiv steht hinter dem Verb
  const SAETZE = [
    { b: 'Der', adj: 'kleine', grund: 'klein', n: 'Hund', art: 'der', v: 'bellt' }, { b: 'Die', adj: 'rote', grund: 'rot', n: 'Blume', art: 'die', v: 'wächst' },
    { b: 'Das', adj: 'schnelle', grund: 'schnell', n: 'Auto', art: 'das', v: 'fährt' }, { b: 'Der', adj: 'alte', grund: 'alt', n: 'Baum', art: 'der', v: 'steht' },
    { b: 'Die', adj: 'nasse', grund: 'nass', n: 'Katze', art: 'die', v: 'zittert' }, { b: 'Das', adj: 'müde', grund: 'müde', n: 'Kind', art: 'das', v: 'gähnt' },
    { b: 'Der', adj: 'laute', grund: 'laut', n: 'Zug', art: 'der', v: 'pfeift' }, { b: 'Das', adj: 'kalte', grund: 'kalt', n: 'Wasser', art: 'das', v: 'fliesst' },
    { b: 'Der', adj: 'freche', grund: 'frech', n: 'Vogel', art: 'der', v: 'singt' }, { b: 'Die', adj: 'leise', grund: 'leise', n: 'Maus', art: 'die', v: 'schleicht' },
    { b: 'Das', adj: 'helle', grund: 'hell', n: 'Licht', art: 'das', v: 'blendet' },
    { b: 'Das', adj: 'schön', grund: 'schön', n: 'Wetter', art: 'das', v: 'ist', nach: true }, { b: 'Die', adj: 'heiss', grund: 'heiss', n: 'Suppe', art: 'die', v: 'ist', nach: true },
    { b: 'Der', adj: 'weiss', grund: 'weiss', n: 'Schnee', art: 'der', v: 'ist', nach: true }
  ];
  const ARTEN = ['Nomen', 'Verb', 'Adjektiv'];
  const CODE = { Begleiter: 'gewaehlt-begleiter', Nomen: 'gewaehlt-nomen', Verb: 'gewaehlt-verb', Adjektiv: 'gewaehlt-adjektiv' };
  const GESUCHT = { Nomen: 'das Nomen', Verb: 'das Verb', Adjektiv: 'das Adjektiv' };

  const satzVon = s => (s.nach ? `${s.b} ${s.n} ${s.v} ${s.adj}.` : `${s.b} ${s.adj} ${s.n} ${s.v}.`);
  /** Die vier Wörter des Satzes mit ihrer Wortart, in der Reihenfolge des Satzes. */
  const woerter = s => (s.nach ? [[s.b, 'Begleiter'], [s.n, 'Nomen'], [s.v, 'Verb'], [s.adj, 'Adjektiv']] : [[s.b, 'Begleiter'], [s.adj, 'Adjektiv'], [s.n, 'Nomen'], [s.v, 'Verb']]);
  const wortVon = (s, art) => woerter(s).find(([, a]) => a === art)[0];
  /** Die gefragte Wortart des Satzes i: reihum, bei «ist» nie das Verb. Der Versatz gibt dem zweiten Thema andere Fragen als dem ersten. */
  const frageart = (s, i, versatz) => { const a = ARTEN[(i + versatz) % 3]; return s.v === 'ist' && a === 'Verb' ? 'Nomen' : a; };

  function weg(s, art) {                                                  // Lösungsweg mit der Probe zur gesuchten Wortart
    if (art === 'Nomen') return { weg: 'artikelprobe', schritte: [`Artikelprobe: «${s.art} ${s.n}» klingt richtig.`, `«${s.n}» ist ein Nomen. Nomen schreibt man gross.`] };
    if (art === 'Verb') return { weg: 'verbfrage', schritte: [`Frage: Was tut ${s.art} ${s.n}? ${ER[s.art]} ${s.v}.`, `«${s.v}» sagt, was ${s.art} ${s.n} tut. Es ist das Verb.`] };
    return { weg: 'steigerungsprobe', schritte: [`Frage: Wie ist ${s.art} ${s.n}? ${ER[s.art]} ist ${s.grund}.`, `«${s.adj}» sagt, wie ${s.art} ${s.n} ist. Es ist das Adjektiv.`] };
  }
  const schwierigkeit = (s, art) => (s.nach || art === 'Adjektiv' ? 2 : 1);

  function imSatz(s, i) {
    const art = frageart(s, i, 0), richtig = wortVon(s, art);
    return {
      id: `is-${idVon(s.n)}-${art.toLowerCase()}`, form: 'auswahl', schwierigkeit: schwierigkeit(s, art), braucht: [],
      inhalt: { frage: `Welches Wort ist ${GESUCHT[art]}? «${satzVon(s)}»`, richtig,
        falsch: woerter(s).filter(([w]) => w !== richtig).map(([w, a]) => ({ text: w, code: CODE[a] })) },
      hilfe: weg(s, art)
    };
  }

  L.generator('deutsch-wortarten/im-satz', {
    pool: () => SAETZE.map(imSatz),
    diagnose(auf, antwort) {                                              // antwort.text ist das gewählte Wort (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text;
      if (t === auf.inhalt.richtig) return null;
      const f = auf.inhalt.falsch.find(x => x.text === t);
      return f ? f.code : 'sonstige';
    }
  });

  function herausschreiben(s, i) {
    const art = frageart(s, i, 1), richtig = wortVon(s, art);
    return {
      id: `hs-${idVon(s.n)}-${art.toLowerCase()}`, form: 'satz', schwierigkeit: schwierigkeit(s, art), braucht: [],
      inhalt: { text: `${satzVon(s)} ${GESUCHT[art][0].toUpperCase()}${GESUCHT[art].slice(1)} ist {${richtig}}.`,
        luecken: [richtig !== s.grund && art === 'Adjektiv' ? { auch: [s.grund] } : null] },
      hilfe: weg(s, art)
    };
  }

  L.generator('deutsch-wortarten/herausschreiben', {
    pool: () => SAETZE.map(herausschreiben),
    diagnose(auf, antwort) {                                              // antwort: { luecken, arten } des Lückentexts
      const art = S.art(antwort, 0), e = S.eingabe(antwort, 0);
      if (art === null || art === 'richtig') return null;
      if (art === 'gross-klein') return 'gross-klein';
      const satz = auf.inhalt.text.slice(0, auf.inhalt.text.lastIndexOf(' Das ')).toLowerCase().replace(/[.,]/g, '').split(' ');
      return e !== '' && satz.includes(e.toLowerCase()) ? 'andere-wortart' : 'sonstige';
    }
  });
})(globalThis);
