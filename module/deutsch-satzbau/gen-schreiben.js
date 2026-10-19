/* module/deutsch-satzbau/gen-schreiben.js: Satzanfang und Nomen gross, Verben klein, Punkt am Schluss. «gross-punkt» (Form satz, Lückentext mit Kacheln): der ganze Satz,
   Lücken am Satzanfang, bei zwei Nomen (Ablenker klein geschrieben), bei einem Verb oder einem kleinen Wort wie «am» (Ablenker gross geschrieben, damit «alles gross»
   nicht hilft) und am Schluss beim Punkt (Ablenker Fragezeichen und Ausrufezeichen, als Kacheln, nie als Text an das Kind). «richtig-schreiben» (Form auswahl):
   vier Fehlervarianten des Satzes, der Typ zeigt drei davon. Fehlercodes: satzanfang-klein, nomen-klein, verb-gross, klein-gross, punkt-fehlt. Die Sätze liefert saetze.js.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, B = L.registry.generatoren.get('deutsch-satzbau/saetze'), S = L.registry.bausteine.get('_gemeinsam/schreibantwort');
  if (!B) throw new Error('deutsch-satzbau: Die Satzbank «saetze.js» fehlt. Sie steht in modul.js unter dateien vor den Generatoren.');
  if (!S) throw new Error('deutsch-satzbau: Baustein «_gemeinsam/schreibantwort» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');
  const CODE = { anfang: 'satzanfang-klein', nomen: 'nomen-klein', verb: 'verb-gross', klein: 'klein-gross', punkt: 'punkt-fehlt' };   // Rolle der Lücke → Fehlercode
  const PUNKT_ABLENKER = ['?', '!'];

  // ---- gross-punkt ---------------------------------------------------------------------------------------------------------------------------
  /** Aufgabe zu Satz s. i wählt reihum, welches Nomen im Text bleibt und welches kleine Wort in die Lücke kommt (Verb, erstes Wort von Wann, Verb, erstes Wort von Wo). */
  function grossPunkt(s, i) {
    const w = B.woerter(s), start = {};
    let pos = 0;
    for (const a of s.folge) { start[a] = pos; pos += s.glieder[a].text.split(' ').length; }
    const nomen = w.flatMap((x, k) => (x.rolle === 'nomen' ? [k] : [])), mit = nomen.length > 2 ? nomen.filter((_, j) => j !== i % nomen.length) : nomen;
    let klein = [start.verb, start.wann, start.verb, start.wo][i % 4];
    if (klein === undefined || w[klein].rolle === 'nomen') klein = start.verb;
    const lueck = new Set([0, ...mit, klein]);
    const art = k => (k === 0 ? 'anfang' : w[k].rolle === 'nomen' ? 'nomen' : 'klein');
    const text = `${w.map((x, k) => (lueck.has(k) ? `{${x.w}}` : x.w)).join(' ')}{.}`;
    const luecken = [...lueck].sort((a, b) => a - b).map(k => ({ ablenker: [art(k) === 'klein' ? B.gross1(w[k].w) : B.klein1(w[k].w)] }));
    return {
      id: `gp-${s.k}`, form: 'satz', schwierigkeit: s.voll ? 2 : 1, braucht: [],
      inhalt: { text, luecken: [...luecken, { ablenker: PUNKT_ABLENKER }], hinweis: 'Wähle jeweils die richtige Schreibung und am Schluss das Satzzeichen.' },
      hilfe: { weg: 'artikelprobe', schritte: [`Ein Satz beginnt mit einem grossen Buchstaben: «${w[0].w}».`,
        `Nomen findest du mit der Artikelprobe: ${B.nomenProbe(s).join(', ')}. Nomen schreibt man gross.`,
        `Verben und kleine Wörter wie «${w[klein].w}» schreibt man klein.`, 'Am Schluss des Satzes steht ein Punkt.'] }
    };
  }

  /** Die Rolle jeder Lücke im Text einer Aufgabe: anfang (die erste), punkt, nomen (gross), verb oder klein. */
  const rollen = auf => {
    const verb = B.finde(auf.id.slice(3)).glieder.verb.text;
    return [...auf.inhalt.text.matchAll(/\{([^{}]*)\}/g)].map((m, j) => (j === 0 ? 'anfang' : m[1] === '.' ? 'punkt' : /^[A-ZÄÖÜ]/.test(m[1]) ? 'nomen' : m[1] === verb ? 'verb' : 'klein'));
  };

  L.generator('deutsch-satzbau/gross-punkt', {
    pool: () => [...B.kurz.slice(0, 4), ...B.voll.slice(2, 30)].map(grossPunkt),
    diagnose(auf, antwort) {                                             // antwort: { luecken, arten } des Lückentexts; der erste Fehler bestimmt den Code
      const r = rollen(auf), i = r.findIndex((_, k) => { const a = S.art(antwort, k); return a !== null && a !== 'richtig'; });
      return i < 0 ? null : CODE[r[i]];
    }
  });

  // ---- richtig-schreiben ---------------------------------------------------------------------------------------------------------------------
  function richtigSchreiben(s, i) {
    const w = B.woerter(s), richtig = B.text(s), nomen = w.flatMap((x, k) => (x.rolle === 'nomen' ? [k] : [])), verb = w.findIndex(x => x.rolle === 'verb');
    const aendere = (k, f) => `${w.map((x, j) => (j === k ? f(x.w) : x.w)).join(' ')}.`;
    return {
      id: `rs-${s.k}`, form: 'auswahl', schwierigkeit: s.voll ? 2 : 1, braucht: [],
      inhalt: { frage: 'Welcher Satz ist richtig geschrieben?', richtig, falsch: [
        { text: aendere(nomen[i % nomen.length], B.klein1), code: 'nomen-klein' }, { text: aendere(0, B.klein1), code: 'satzanfang-klein' },
        { text: richtig.slice(0, -1), code: 'punkt-fehlt' }, { text: aendere(verb, B.gross1), code: 'verb-gross' }] },
      hilfe: { weg: 'artikelprobe', schritte: ['Prüfe der Reihe nach: Satzanfang gross, Nomen gross, Verb klein, am Schluss ein Punkt.',
        `Nomen findest du mit der Artikelprobe: ${B.nomenProbe(s).join(', ')}.`, `Richtig ist: ${richtig}`] }
    };
  }

  L.generator('deutsch-satzbau/richtig-schreiben', {
    pool: () => [...B.kurz.slice(4, 8), ...B.voll.slice(6, 34)].map(richtigSchreiben),
    diagnose(auf, antwort) {                                             // antwort.text ist der gewählte Satz (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text;
      if (t === auf.inhalt.richtig) return null;
      const f = auf.inhalt.falsch.find(x => x.text === t);
      return f ? f.code : 'sonstige';
    }
  });
})(globalThis);
