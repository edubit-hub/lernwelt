/* app/uebungstypen/beschriften/typ.js: Übungstyp «beschriften» (Architektur 5.6). Zur Form beschriftung (Bild mit Punkten, x und y in Prozent) zeigt der Typ
   das Bild mit nummerierten Punkten und darunter die Beschriftungen, gemischt. Erst das Ziel, dann die Beschriftung: Das Kind tippt einen Punkt im Bild an,
   danach die passende Beschriftung. Sie trägt dann die Nummer des Punktes. Eine verwendete Beschriftung nimmt ein Tipp ohne gewählten Punkt zurück.
   Die Nummer eines Punktes ist seine Stelle in inhalt.punkte plus 1 (V-AP17b-01). Erst «Prüfen» beurteilt, als Ganzes: richtig ist nur, wenn jeder Punkt
   seine Beschriftung trägt. Danach stehen die Markierungen am Bild und, bei Fehlern, die richtige Zuordnung als Text. Fehlt das Bild, meldet der Typ nichts
   und die Aufgabe bleibt fällig. Weil man raten kann, erreicht eine Aufgabe allein mit diesem Typ höchstens Box 4. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const MIN_PUNKTE = 2, MAX_PUNKTE = 8, MAX_TEXT = 40;
  const ABSTAND = 9;                                                  // so viele Prozent müssen zwei Punkte auseinanderliegen, sonst trifft der Finger beide
  let durchgang = 0;                                                  // jeder Aufruf mischt anders

  const text = v => typeof v === 'string' && v.trim() !== '';
  const prozent = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
  const stelle = v => Math.min(100, Math.max(0, Number(v) || 0));      // Lage eines Punktes im Bild, immer eine Zahl zwischen 0 und 100

  L.uebungstyp('beschriften', {
    titel: 'Bild beschriften',
    eigenschaften: { akzeptiert: ['beschriftung'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: ['bild'],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 4 },
    optionen: {},
    beispiel: {
      aufgaben: [{ key: 'bsp/haus', id: 'haus', form: 'beschriftung',
        inhalt: { bild: 'beispiel-haus.svg', punkte: [{ x: 50, y: 12, text: 'Dach' }, { x: 50, y: 45, text: 'Fenster' }, { x: 50, y: 85, text: 'Tür' }] } }],
      optionen: {}
    },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (!a || a.form !== 'beschriftung') return [`Form «${a && a.form}» versteht beschriften nicht`];
      if (!Array.isArray(i.punkte)) return f;
      const p = i.punkte;
      if (p.length < MIN_PUNKTE) f.push(`punkte braucht mindestens ${MIN_PUNKTE} Punkte: bei einem Punkt gibt es nichts zu wählen`);
      if (p.length > MAX_PUNKTE) f.push(`punkte hat ${p.length} Punkte, mehr als ${MAX_PUNKTE} lassen sich nicht einzeln antippen`);
      p.forEach((x, n) => { if (x && text(x.text) && x.text.length > MAX_TEXT) f.push(`punkte[${n}].text ist länger als ${MAX_TEXT} Zeichen und passt nicht auf eine Karte`); });
      const lage = x => x && prozent(x.x) && prozent(x.y);
      for (let n = 0; n < p.length; n++) for (let m = n + 1; m < p.length; m++) {
        if (lage(p[n]) && lage(p[m]) && Math.hypot(p[n].x - p[m].x, p[n].y - p[m].y) < ABSTAND) f.push(`punkte[${n}] und punkte[${m}] liegen weniger als ${ABSTAND} Prozent auseinander, der Finger trifft sie nicht einzeln`);
      }
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, punkte = a.inhalt.punkte;
      if (signal.aborted) return Promise.resolve([]);
      const reihe = L.Zufall.aus(`${a.key}|${durchgang++}`).mische(punkte.map((_, i) => i));   // Anzeigereihenfolge der Beschriftungen
      const markiert = ctx.modus !== 'simulation';                    // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, bewertet = null, gewaehlt = null;        // bewertet: Urteil je Punkt nach «Prüfen», gewaehlt: Nummer des gewählten Punktes
        const belegung = punkte.map(() => null);                      // belegung[i]: Index in punkte der Beschriftung, die am Punkt i liegt
        const ende = erg => { if (beendet) return; beendet = true; signal.removeEventListener('abort', abbruch); fertig(erg); };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        const punkt = i => {
          const urteil = markiert && bewertet ? (bewertet[i] ? 'richtig' : 'falsch') : null;
          return H('button.punkt', { type: 'button', 'aria-pressed': String(gewaehlt === i), 'aria-label': `Punkt ${i + 1}`, disabled: !!bewertet,
            style: `left:${stelle(punkte[i].x)}%;top:${stelle(punkte[i].y)}%`, class: urteil || (gewaehlt === i ? 'gewaehlt' : belegung[i] !== null ? 'belegt' : null), onclick: () => tippePunkt(i) },
            H('span.nr', i + 1));
        };
        const label = j => {
          const am = belegung.indexOf(j), urteil = markiert && bewertet && am >= 0 ? (bewertet[am] ? 'richtig' : 'falsch') : null;
          return H('button.label', { type: 'button', disabled: !!bewertet, 'aria-disabled': gewaehlt === null && am < 0 ? 'true' : null, class: urteil || (am >= 0 ? 'belegt' : null), onclick: () => tippeLabel(j) },
            am >= 0 ? H('span.nr', am + 1) : null, H('span.text', punkte[j].text));
        };

        const url = dienste.bild ? dienste.bild.url(a.inhalt.bild, a) : a.inhalt.bild;
        const bild = H('img', { src: url, alt: '', draggable: 'false', onerror: ausfall });
        const ueberlagerung = H('div.punkte'), labels = H('div.labels', { role: 'group', 'aria-label': 'Beschriftungen' });
        const hinweis = H('p.hinweis', { 'aria-live': 'polite' }), loesung = H('p.loesung');
        const pruefen = H('button.knopf.primaer.gross.pruefen', { type: 'button', disabled: true, onclick: pruefe }, 'Prüfen');

        function zeichne() {
          ueberlagerung.replaceChildren(...punkte.map((_, i) => punkt(i)));
          labels.replaceChildren(...reihe.map(label));
          const alle = !belegung.includes(null);
          hinweis.textContent = bewertet ? '' : gewaehlt !== null ? 'Tippe jetzt die passende Beschriftung an.' : alle ? 'Alle Punkte sind beschriftet. Tippe auf «Prüfen» oder ändere eine Beschriftung.' : 'Tippe einen Punkt im Bild an.';
          loesung.textContent = bewertet && markiert && !bewertet.every(Boolean) ? `Richtig wäre: ${punkte.map((p, i) => `${i + 1} ${p.text}`).join(', ')}.` : '';
          pruefen.disabled = !!bewertet || !alle;
        }
        function tippePunkt(i) {
          if (beendet || bewertet) return;
          gewaehlt = gewaehlt === i ? null : i; zeichne();
        }
        function tippeLabel(j) {
          if (beendet || bewertet) return;
          const am = belegung.indexOf(j);
          if (gewaehlt === null) { if (am >= 0) { belegung[am] = null; zeichne(); } return; }   // ohne gewählten Punkt: nur eine verwendete Beschriftung zurücknehmen
          if (am >= 0) belegung[am] = null;
          belegung[gewaehlt] = j; gewaehlt = null; zeichne();
        }
        function pruefe() {
          if (beendet || bewertet || belegung.includes(null)) return;
          const ms = stopp();
          bewertet = punkte.map((p, i) => punkte[belegung[i]].text === p.text);
          gewaehlt = null; zeichne();
          ende([{ aufgabeKey: a.key, urteil: bewertet.every(Boolean) ? 'richtig' : 'falsch', antwort: { belegung: belegung.slice() }, ms, hilfen: [] }]);
        }
        function ausfall() {                                          // ohne Bild gibt es nichts zu beschriften: nichts melden, die Aufgabe bleibt fällig
          if (beendet) return;
          buehne.replaceChildren(H('div.uebung.uebung-beschriften', H('p.hinweis', 'Das Bild lässt sich nicht laden. Die Aufgabe bleibt fällig.'),
            H('button.knopf.primaer.weiter', { type: 'button', onclick: () => ende([]) }, 'Weiter')));
        }

        buehne.replaceChildren(H('div.uebung.uebung-beschriften', hinweis, H('div.bildflaeche', { role: 'group', 'aria-label': 'Bild mit nummerierten Punkten' }, bild, ueberlagerung),
          labels, loesung, H('div.leiste', pruefen)));
        zeichne();
      });
    }
  });
})(globalThis);
