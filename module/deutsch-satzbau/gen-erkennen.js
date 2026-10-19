/* module/deutsch-satzbau/gen-erkennen.js: Satzglieder in einem Satz erkennen und benennen (Form auswahl). Die Frage nennt eine Frage (Wer?, Wann?, Wo?) oder das Verb,
   die Antworten sind die vier Satzglieder des Satzes. Dazu kommen Aufgaben «Wie viele Satzglieder hat der Satz?»: Hier ist die Zahl der Wörter die typische falsche
   Antwort (Code woerter-gezaehlt), denn ein Satzglied besteht oft aus zwei oder drei Wörtern. Fehlercodes der Satzglieder: wer-verb-verwechselt, wann-wo-verwechselt,
   satzglied-falsch. Die Sätze liefert saetze.js. Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall (instanz bekommt ihn von aussen), keine Uhr. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, B = L.registry.generatoren.get('deutsch-satzbau/saetze');
  if (!B) throw new Error('deutsch-satzbau: Die Satzbank «saetze.js» fehlt. Sie steht in modul.js unter dateien vor den Generatoren.');

  /** Frage nach einem Satzglied; die Antworten sind die Glieder des Satzes, so geschrieben, wie sie im Satz stehen. */
  function gliedInhalt(s, art) {
    const t = B.teile(s), satz = B.text(s);
    return {
      frage: `«${satz}» ${art === 'verb' ? 'Welches Wort ist das Verb?' : `Welches Satzglied antwortet auf ${B.FRAGE[art]}`}`,
      richtig: t[s.folge.indexOf(art)],
      falsch: s.folge.filter(a => a !== art).map(a => ({ text: t[s.folge.indexOf(a)], code: B.verwechselt(art, a) }))
    };
  }

  /** Frage nach der Zahl der Satzglieder. Falsch sind die Zahl der Wörter und zwei weitere Zahlen, jede nur einmal. */
  function anzahlAufgabe(s, schwer) {
    const n = s.folge.length, w = B.text(s).replace('.', '').split(' ').length;
    const sonst = [n - 1, n + 1, n + 2, n - 2].filter(x => x >= 2 && x !== n && x !== w).slice(0, 2).map(String);
    return {
      id: `ea-${s.k}`, form: 'auswahl', schwierigkeit: schwer, braucht: [],
      inhalt: { frage: `«${B.text(s)}» Wie viele Satzglieder hat der Satz?`, richtig: String(n), falsch: [{ text: String(w), code: 'woerter-gezaehlt' }, ...sonst] },
      hilfe: { weg: 'umstellprobe', schritte: ['Mit der Umstellprobe findest du die Satzglieder: Was beim Umstellen zusammen wandert, ist ein Satzglied.',
        `Die Satzglieder sind ${B.teile(s).map(t => `«${t}»`).join(', ')}. Das sind ${n}.`] }
    };
  }

  function pool() {                                                      // vier kurze Zähl-Aufgaben, 24 Fragen nach einem Satzglied, vier Zähl-Aufgaben mit vier Gliedern
    const glied = B.voll.slice(16, 40).map((s, i) => { const art = B.ARTEN[(i + 1) % 4]; return { id: `er-${s.k}`, form: 'auswahl', schwierigkeit: 2, braucht: [], inhalt: gliedInhalt(s, art), hilfe: B.weg(s, art) }; });
    return [...B.kurz.slice(4, 8).map(s => anzahlAufgabe(s, 2)), ...glied, ...B.voll.slice(40, 44).map(s => anzahlAufgabe(s, 3))];
  }

  L.generator('deutsch-satzbau/erkennen', {
    pool,
    instanz(auf, rng) {                                                  // Fragen nach einem Satzglied: an einem anderen Tag ein anderes Glied desselben Satzes
      if (auf.id.startsWith('ea-')) return auf;
      const s = B.finde(auf.id.slice(3)), art = rng.waehle(s.folge);
      return { inhalt: gliedInhalt(s, art), hilfe: B.weg(s, art) };
    },
    diagnose(auf, antwort) {                                             // antwort.text ist die gewählte Antwort (der Typ liefert meist schon den Code)
      const t = antwort && antwort.text;
      if (t === auf.inhalt.richtig) return null;
      const f = auf.inhalt.falsch.find(x => (typeof x === 'string' ? x : x.text) === t);
      return f && typeof f === 'object' ? f.code : 'sonstige';
    }
  });
})(globalThis);
