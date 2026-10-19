/* module/deutsch-satzbau/gen-bauen.js: Sätze aus Satzgliedern bauen und umstellen. «zusammensetzen» und «umstellen» haben die Form abfolge, die Schritte sind ganze
   Satzglieder (nicht einzelne Wörter). «umstellen-pruefen» hat die Form auswahl.
   Eindeutigkeit der Reihenfolge: Das erste Satzglied trägt als einziges einen grossen Anfangsbuchstaben, das letzte als einziges den Punkt, das Verb steht an zweiter Stelle.
   Dann bleibt genau ein Glied für die Mitte übrig. Grundstellung: Wer, Verb, Wann, Wo. Umgestellt: Wann oder Wo vorn, dann das Verb, dann Wer, dann das übrige Glied.
   Fehlercodes: verb-nicht-zweite, satz-anfang, satz-ende (Reihenfolge), satzanfang-klein, punkt-fehlt, satzglied-zerrissen (Auswahl). Die Sätze liefert saetze.js.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall (instanz bekommt ihn von aussen), keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, B = L.registry.generatoren.get('deutsch-satzbau/saetze');
  if (!B) throw new Error('deutsch-satzbau: Die Satzbank «saetze.js» fehlt. Sie steht in modul.js unter dateien vor den Generatoren.');

  /** Diagnose einer Reihenfolge: antwort.folge sind die getippten Karten als Indizes in schritte. Das Verb ist in der richtigen Reihenfolge immer Karte 1. */
  function diagnoseFolge(auf, antwort) {
    const f = antwort && antwort.folge, n = auf.inhalt.schritte.length;
    if (!Array.isArray(f) || f.length !== n || !f.every(Number.isInteger)) return 'sonstige';
    if (f.every((s, p) => s === p)) return null;
    if (f[1] !== 1) return 'verb-nicht-zweite';                          // das Verb steht nicht an zweiter Stelle
    if (f[0] !== 0) return 'satz-anfang';                                // ein anderes Satzglied (ohne grossen Anfangsbuchstaben) steht vorn
    return f[n - 1] !== n - 1 ? 'satz-ende' : 'sonstige';                // das Satzglied mit dem Punkt steht nicht zuletzt
  }

  // ---- zusammensetzen: Satzglieder in der Grundstellung ------------------------------------------------------------------------------------
  const zusammen = s => {
    const k = B.karten(s), v = s.glieder.verb.text;
    return { id: `zs-${s.k}`, form: 'abfolge', schwierigkeit: s.voll ? 2 : 1, braucht: [],
      inhalt: { frage: 'Setze die Satzglieder zu einem Satz zusammen.', schritte: k },
      hilfe: { weg: 'verbprobe', schritte: [`Suche zuerst das Verb: Es sagt, was jemand tut. Hier ist es «${v}».`,
        `Das Verb steht an zweiter Stelle, nach dem ersten Satzglied «${B.teile(s)[0]}».`, `Das Satzglied mit dem Punkt steht am Schluss. Der Satz lautet: ${B.text(s)}`] } };
  };

  L.generator('deutsch-satzbau/zusammensetzen', {
    pool: () => [...B.kurz, ...B.voll.slice(0, 28)].map(zusammen),
    diagnose: diagnoseFolge
  });

  // ---- umstellen: Wann oder Wo vorn --------------------------------------------------------------------------------------------------------
  const umInhalt = (s, erstes) => {
    const f = B.umfolge(s, erstes), k = B.karten(s, f), t = B.teile(s, f);
    return {
      inhalt: { frage: `Stelle den Satz «${B.text(s)}» um. Beginne mit «${t[0]}».`, schritte: k },
      hilfe: { weg: 'umstellprobe', schritte: [`Umstellprobe: Das Satzglied «${t[0]}» wandert nach vorn und wird grossgeschrieben. Die Wörter darin bleiben beisammen.`,
        `Das Verb bleibt an zweiter Stelle: «${s.glieder.verb.text}». Danach folgt «${t[2]}».`, `Das letzte Satzglied trägt den Punkt. Der Satz lautet: ${B.text(s, f)}`] }
    };
  };

  function umPool() {                                                    // vier kurze Sätze, danach 28 mit vier Gliedern; Wann und Wo wechseln sich als erstes Glied ab
    const kurz = B.kurz.slice(0, 4).map(s => [s, B.vorn(s)[0], 2]), voll = B.voll.slice(8, 36).map((s, i) => [s, i % 2 === 0 ? 'wann' : 'wo', 3]);
    return [...kurz, ...voll].map(([s, erstes, schwer]) => ({ id: `um-${s.k}`, form: 'abfolge', schwierigkeit: schwer, braucht: [], ...umInhalt(s, erstes) }));
  }

  L.generator('deutsch-satzbau/umstellen', {
    pool: umPool,
    instanz(auf, rng) {                                                  // derselbe Satz, an einem anderen Tag mit dem anderen Glied vorn; ID und Lernstand bleiben
      const s = B.finde(auf.id.slice(3));
      return umInhalt(s, rng.waehle(B.vorn(s)));
    },
    diagnose: diagnoseFolge
  });

  // ---- umstellen-pruefen: welcher Satz ist richtig umgestellt? -----------------------------------------------------------------------------
  /** Die richtige Umstellung und vier typische Fehler. Der Typ zeigt davon drei zufällig gewählte, über die Tage kommen alle vor. */
  function pruefInhalt(s, erstes) {
    const f = B.umfolge(s, erstes), t = B.teile(s, f), richtig = B.text(s, f), w = t[0].split(' ');
    const verbDritte = B.text(s, [erstes, 'wer', 'verb', ...s.folge.filter(a => !['wer', 'verb', erstes].includes(a))]);
    const zerrissen = `${[w[0], t[1], ...w.slice(1), ...t.slice(2)].join(' ')}.`;                // das Verb steht als zweites Wort mitten im ersten Satzglied
    return {
      inhalt: { frage: `Ausgangssatz: «${B.text(s)}» Welcher Satz ist richtig umgestellt?`, richtig,
        falsch: [{ text: verbDritte, code: 'verb-nicht-zweite' }, { text: B.klein1(richtig), code: 'satzanfang-klein' },
          { text: richtig.slice(0, -1), code: 'punkt-fehlt' }, { text: zerrissen, code: 'satzglied-zerrissen' }] },
      hilfe: { weg: 'umstellprobe', schritte: [`Das Verb bleibt an zweiter Stelle. Das erste Satzglied «${t[0]}» bleibt zusammen.`,
        'Der Satzanfang wird grossgeschrieben, am Schluss steht ein Punkt.', `Richtig ist: ${richtig}`] }
    };
  }

  function pruefPool() {                                                 // das erste Glied hat mindestens zwei Wörter, sonst liesse sich kein Satzglied zerreissen
    const kurz = B.kurz.slice(0, 4).map(s => [s, B.vorn(s, true)[0]]), voll = B.voll.slice(4, 32).map((s, i) => {
      const ok = B.vorn(s, true), wunsch = i % 2 === 0 ? 'wo' : 'wann';
      return [s, ok.includes(wunsch) ? wunsch : ok[0]];
    });
    return [...kurz, ...voll].map(([s, erstes]) => ({ id: `up-${s.k}`, form: 'auswahl', schwierigkeit: 2, braucht: [], ...pruefInhalt(s, erstes) }));
  }

  L.generator('deutsch-satzbau/umstellen-pruefen', {
    pool: pruefPool,
    instanz(auf, rng) {
      const s = B.finde(auf.id.slice(3));
      return pruefInhalt(s, rng.waehle(B.vorn(s, true)));
    },
    diagnose(auf, antwort) {                                             // antwort.text ist der gewählte Satz (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text;
      if (t === auf.inhalt.richtig) return null;
      const f = auf.inhalt.falsch.find(x => x.text === t);
      return f ? f.code : 'sonstige';
    }
  });
})(globalThis);
