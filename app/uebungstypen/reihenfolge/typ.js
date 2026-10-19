/* app/uebungstypen/reihenfolge/typ.js: Übungstyp «reihenfolge» (Architektur 5.6). Die Schritte einer Aufgabe der Form abfolge stehen gemischt als Karten da.
   Das Kind tippt sie in der richtigen Reihenfolge an, jede getippte Karte trägt ihre Nummer, ein zweiter Tipp nimmt sie zurück. Die Karten bleiben
   an ihrem Platz, damit nichts unter dem Finger wegrutscht. Erst «Prüfen» beurteilt, als Ganzes: richtig ist nur die vollständige Reihenfolge.
   Eigene Markierungen nach «Prüfen»: Karte an der richtigen Stelle richtig, sonst falsch. inhalt.frage ist freiwillig und steht als Aufgabentext oben
   (V-AP17b-01). Weil man raten kann (bei zwei Schritten jedes zweite Mal), erreicht eine Aufgabe allein mit diesem Typ höchstens Box 4. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const MAX_SCHRITTE = 8, MAX_TEXT = 70, MAX_FRAGE = 120;            // darüber passt es nicht übersichtlich auf einen Bildschirm
  let durchgang = 0;                                                  // jeder Aufruf mischt anders

  const text = v => typeof v === 'string' && v.trim() !== '';

  /** Anzeigereihenfolge als Liste von Indizes in schritte, nie die richtige (bei zwei Schritten also vertauscht). */
  function mische(n, rng) {
    const eins = Array.from({ length: n }, (_, i) => i);
    for (let versuch = 0; versuch < 20; versuch++) { const p = rng.mische(eins); if (p.some((s, k) => s !== k)) return p; }
    return eins.reverse();
  }

  L.uebungstyp('reihenfolge', {
    titel: 'Reihenfolge',
    eigenschaften: { akzeptiert: ['abfolge'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 4 },
    optionen: {},
    beispiel: {
      aufgaben: [
        { key: 'bsp/tee', id: 'tee', form: 'abfolge', inhalt: { frage: 'Tee zubereiten: Was kommt zuerst, was zuletzt?',
          schritte: ['Wasser erhitzen', 'Beutel in die Tasse legen', 'Heisses Wasser eingiessen', 'Fünf Minuten ziehen lassen'] } },
        { key: 'bsp/tag', id: 'tag', form: 'abfolge', inhalt: { schritte: ['Morgen', 'Mittag', 'Abend', 'Nacht'] } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (!a || a.form !== 'abfolge') return [`Form «${a && a.form}» versteht reihenfolge nicht`];
      if (Array.isArray(i.schritte)) {
        if (i.schritte.length > MAX_SCHRITTE) f.push(`schritte hat ${i.schritte.length} Elemente, mehr als ${MAX_SCHRITTE} lassen sich nicht übersichtlich antippen`);
        i.schritte.forEach((t, n) => { if (text(t) && t.length > MAX_TEXT) f.push(`schritte[${n}] ist länger als ${MAX_TEXT} Zeichen und passt nicht auf eine Karte`); });
      }
      if (i.frage !== undefined && !(text(i.frage) && i.frage.length <= MAX_FRAGE)) f.push(`frage ist leer oder länger als ${MAX_FRAGE} Zeichen`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h;
      if (signal.aborted) return Promise.resolve([]);
      const schritte = a.inhalt.schritte, reihe = mische(schritte.length, L.Zufall.aus(`${a.key}|${durchgang++}`));
      const markiert = ctx.modus !== 'simulation';                    // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, bewertet = false;
        const folge = [];                                             // getippte Schritte als Indizes in schritte, in der Reihenfolge des Tippens
        const ende = erg => { if (beendet) return; beendet = true; signal.removeEventListener('abort', abbruch); fertig(erg); };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        const karte = s => {
          const pos = folge.indexOf(s), urteil = markiert && bewertet ? (pos === s ? 'richtig' : 'falsch') : null;
          return H('button.schritt', { type: 'button', 'aria-pressed': String(pos >= 0), disabled: bewertet, class: urteil || (pos >= 0 ? 'gewaehlt' : null), onclick: () => tippe(s) },
            H('span.nr', pos >= 0 ? pos + 1 : ''), H('span.text', schritte[s]));
        };
        const liste = H('div.schritte', { role: 'group', 'aria-label': 'Schritte' });
        const leiste = H('div.satzleiste', { 'aria-live': 'polite' });              // die getippten Karten der Reihe nach, wie sie zusammen gelesen werden
        const neu = H('button.knopf.leise.neu', { type: 'button', onclick: () => { if (!bewertet && !beendet) { folge.length = 0; zeichne(); } } }, 'Von vorn');
        const pruefen = H('button.knopf.primaer.gross.pruefen', { type: 'button', onclick: pruefe }, 'Prüfen');

        function zeichne() {
          liste.replaceChildren(...reihe.map(karte));
          leiste.replaceChildren(...schritte.map((_, p) => (p < folge.length ? H('span.satz-teil', schritte[folge[p]]) : H('span.satz-platz', { 'aria-hidden': 'true' }, String(p + 1)))));
          pruefen.disabled = bewertet || folge.length < schritte.length;
          neu.disabled = bewertet || !folge.length;
        }
        function tippe(s) {
          if (beendet || bewertet) return;
          if (folge.includes(s)) folge.splice(folge.indexOf(s), 1); else folge.push(s);
          zeichne();
        }
        function pruefe() {
          if (beendet || bewertet || folge.length < schritte.length) return;
          const ms = stopp(), richtig = folge.every((s, p) => s === p);
          bewertet = true; zeichne();
          ende([{ aufgabeKey: a.key, urteil: richtig ? 'richtig' : 'falsch', antwort: { folge: folge.slice() }, ms, hilfen: [] }]);
        }

        buehne.replaceChildren(H('div.uebung.uebung-reihenfolge',
          H('div.frage', text(a.inhalt.frage) ? H('p.aufgabe', a.inhalt.frage) : null,
            H('p.hinweis', 'Tippe die Karten in der richtigen Reihenfolge an. Mit einem zweiten Tipp nimmst du eine Karte zurück.')),
          leiste, liste, H('div.leiste', neu, pruefen)));
        zeichne();
      });
    }
  });
})(globalThis);
