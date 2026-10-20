/* module/deutsch-satzbau/gen-fragen.js: Satzglieder den Fragen zuordnen (Form paar) und die Frage zu einem markierten Satzglied wählen (Form auswahl).
   Thema «fragen»: ein Satzglied ohne Satz, dazu die Antwort Wer?, Verb, Wann? oder Wo? (Zuordnen, Ersatz Auswahl, die Frage steht im Thema). Die Karten beginnen alle klein, damit der
   grosse Anfangsbuchstabe von «Der Hund» keine Antwort verrät. Thema «fragen-im-satz»: der ganze Satz, ein Satzglied in «Guillemets», vier Antworten.
   Die Fehlercodes der falschen Antworten stehen im Modul: wer-verb-verwechselt, wann-wo-verwechselt, satzglied-falsch. Die Sätze liefert saetze.js.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall (instanz bekommt den Zufall von aussen), keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, B = L.registry.generatoren.get('deutsch-satzbau/saetze');
  if (!B) throw new Error('deutsch-satzbau: Die Satzbank «saetze.js» fehlt. Sie steht in modul.js unter dateien vor den Generatoren.');
  const JE_ART = 7;                                                      // Karten je Frage im Thema «fragen»: 7 mal 4 = 28 Aufgaben

  /** Die Frage, die zu einer Antwort gehört (Wer?, Verb, Wann?, Wo?), als Art. Unbekanntes ergibt undefined. */
  const artVon = antwort => B.ARTEN.find(a => B.FRAGE[a] === antwort);

  // ---- fragen: Satzglied ohne Satz → Frage -----------------------------------------------------------------------------------------------
  /** Reihum eine Frage je Satz, ohne eine Karte doppelt zu nehmen; zuletzt abwechselnd Wer, Verb, Wann, Wo, damit jede Gruppe von vier alle Fragen zeigt. */
  function fragenPool() {
    const je = Object.fromEntries(B.ARTEN.map(a => [a, []]));
    B.voll.forEach((s, i) => {
      const art = B.ARTEN[i % 4], t = B.klein1(s.glieder[art].text);
      if (je[art].length < JE_ART && !je[art].some(x => x.t === t)) je[art].push({ s, art, t });
    });
    if (B.ARTEN.some(a => je[a].length < JE_ART)) throw new Error('deutsch-satzbau/fragen: Die Satzbank hat nicht genug verschiedene Satzglieder');
    return Array.from({ length: JE_ART }, (_, i) => B.ARTEN.map(a => je[a][i])).flat().map(({ s, art, t }) => ({
      id: `fg-${art}-${s.k}`, form: 'paar', schwierigkeit: art === 'verb' ? 2 : 1, braucht: [],
      inhalt: { links: t, rechts: B.FRAGE[art], gruppe: 'satzglieder' }, hilfe: B.weg(s, art)
    }));
  }

  L.generator('deutsch-satzbau/fragen', {
    pool: fragenPool,
    diagnose(auf, antwort) {                                             // antwort.text ist die gewählte Frage (Feld beim Zuordnen, Kachel bei der Auswahl)
      const t = antwort && antwort.text, soll = artVon(auf.inhalt.rechts), gewaehlt = artVon(t);
      if (t === auf.inhalt.rechts) return null;
      return soll && gewaehlt ? B.verwechselt(soll, gewaehlt) : 'sonstige';
    }
  });

  // ---- fragen-im-satz: Satzglied im Satz → Frage -----------------------------------------------------------------------------------------
  const imSatz = (s, art) => ({
    frage: `${B.markiert(s, art)} Auf welche Frage antwortet «${B.teile(s)[s.folge.indexOf(art)]}»?`,
    richtig: B.FRAGE[art],
    falsch: B.ARTEN.filter(a => a !== art).map(a => ({ text: B.FRAGE[a], code: B.verwechselt(art, a) }))
  });

  function imSatzPool() {                                                // erst vier kurze Sätze zum Einstieg, dann 28 mit vier Gliedern; die Frage wechselt reihum
    const kurz = B.kurz.slice(0, 4).map((s, i) => [s, s.folge[i % 3], 1]), voll = B.voll.slice(0, 28).map((s, i) => [s, B.ARTEN[i % 4], i < 14 ? 1 : 2]);
    return [...kurz, ...voll].map(([s, art, schwer]) => ({ id: `fs-${s.k}`, form: 'auswahl', schwierigkeit: schwer, braucht: [], inhalt: imSatz(s, art), hilfe: B.weg(s, art) }));
  }

  L.generator('deutsch-satzbau/fragen-im-satz', {
    pool: imSatzPool,
    instanz(auf, rng) {                                                  // derselbe Satz, an einem anderen Tag ein anderes Satzglied; die ID und der Lernstand bleiben
      const s = B.finde(auf.id.slice(3)), art = rng.waehle(s.folge);
      return { inhalt: imSatz(s, art), hilfe: B.weg(s, art) };
    },
    diagnose(auf, antwort) {                                             // antwort.text ist die gewählte Antwort (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text;
      if (t === auf.inhalt.richtig) return null;
      const f = auf.inhalt.falsch.find(x => x.text === t);
      return f ? f.code : 'sonstige';
    }
  });
})(globalThis);
