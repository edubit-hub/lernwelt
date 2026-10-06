/* app/uebungstypen/diktat/typ.js: Übungstyp «diktat» (Architektur 5.6 bis 5.8, AP-17a). Das Kind hört einen Abschnitt nach dem anderen und schreibt ihn auf der eigenen
   Buchstabentastatur (Lernwelt.ui.tastatur): keine native Eingabe, also keine Vorschlagsleiste, die die Lösung vorsagt. In `satz` trennt «|» die Abschnitte,
   die einzeln gesprochen werden, ein Text ohne «|» ist ein einziger Abschnitt. Ein Wort (`wortkarte`) wird aus `fremd` geschrieben. Die Sprachausgabe
   spricht langsam (Option tempo) und der Knopf «Wiederholen» ist immer sichtbar. Nach jedem Abschnitt folgt der nächste, ohne zu zeigen, was richtig war:
   Erst am Ende urteilt der Typ über alle Abschnitte. Gross- und Kleinschreibung zählen, Leerzeichen am Rand und doppelte Leerzeichen nicht. Ist nur die
   Gross- und Kleinschreibung falsch, meldet der Typ den Fehlercode «gross-klein». Fällt der Ton aus, steht der Abschnitt als Text da (Abschreiben)
   und die Aufgabe zählt höchstens als «hilfe». Optionen: tempo (langsam oder normal), sprache (Sprachcode, auto: de-CH für einen Satz, en-GB für ein Fremdwort).
   Ohne Ton lässt sich kein Diktat schreiben: Der Lauf nimmt den Ersatz des Leiter-Eintrags, sonst überspringt er die Aufgabe (ersatz: null). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const TEMPI = { langsam: 0.7, normal: 0.9 };                        // Sprechgeschwindigkeit der Stimme (1 ist normal)
  const SPRACHEN = ['auto', 'en-GB', 'de-CH', 'de-DE'];
  const MAX_ABSCHNITT = 50, MAX_ABSCHNITTE = 8, MAX_SATZZEICHEN = 8;  // so viel passt in die Anzeige und auf die Tastatur
  const ZEICHEN = /[A-Za-zÄÖÜäöü0-9 .,;:!?'«»-]/;                     // was die Tastatur bietet: Buchstaben (ohne Eszett), Ziffern, Leerzeichen und diese Satzzeichen
  const TEXTE = {
    wiederholen: 'Wiederholen', ergebnisRichtig: 'richtig', ergebnisFalsch: 'falsch',
    gesperrt: 'Tippe auf «Wiederholen», um den Ton zu starten.', stumm: 'Der Ton ist nicht verfügbar. Schreibe den Text ab:'
  };

  const text = v => typeof v === 'string' && v.trim() !== '';
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const kennt = form => form === 'satz' || form === 'wortkarte';
  const abschnitte = a => norm(String((a.form === 'satz' ? a.inhalt.text : a.inhalt.fremd) ?? '').replace(/[{}]/g, '')).split('|').map(norm);
  const satzzeichenVon = teile => [...new Set(teile.join('').match(/[.,;:!?'«»-]/g) || [])].join('');
  const sprachcode = (ctx, form) => { const o = ctx.optionen && ctx.optionen.sprache; return SPRACHEN.includes(o) && o !== 'auto' ? o : form === 'satz' ? (ctx.sprachen && ctx.sprachen.mutter) || 'de-CH' : (ctx.sprachen && ctx.sprachen.fremd) || 'en-GB'; };

  /** Eine Äusserung zur Zeit: eine neue löst die laufende ab, stopp() beendet sie, ein Abbruch der Runde ebenfalls. Fehler zählen als «stumm». */
  function wiedergabe(ctx) {
    let lauf = null;
    const stopp = () => { const l = lauf; lauf = null; if (l) l.abort(); };
    return { stopp, spiele(text_, opt) {
      stopp();
      const mein = (lauf = new AbortController()), kette = () => mein.abort();
      ctx.signal.addEventListener('abort', kette, { once: true });
      let p;
      try { p = Promise.resolve(ctx.dienste.sprache.sprich(text_, { ...opt, signal: mein.signal })); } catch (fehler) { p = Promise.resolve('stumm'); }
      return p.then(r => r, () => 'stumm').then(r => { ctx.signal.removeEventListener('abort', kette); return { ergebnis: r, aktuell: lauf === mein }; });
    } };
  }

  L.uebungstyp('diktat', {
    titel: 'Diktat',
    eigenschaften: { akzeptiert: ['satz', 'wortkarte'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: ['sprache'],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 6 },
    optionen: {
      tempo: { art: 'wahl', werte: Object.keys(TEMPI), standard: 'langsam' },
      sprache: { art: 'wahl', werte: SPRACHEN, standard: 'auto' }
    },
    beispiel: {
      aufgaben: [
        { key: 'bsp/hund', id: 'hund', form: 'satz', inhalt: { text: 'Der Hund rennt schnell. | Er bellt laut.' } },
        { key: 'bsp/pencil', id: 'pencil', form: 'wortkarte', inhalt: { fremd: 'pencil', mutter: 'der Bleistift' } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a, optionen) {
      const f = [], w = optionen || {};
      if (!kennt(a && a.form)) f.push(`Form «${a && a.form}» versteht diktat nicht`);
      else if (!text(a.inhalt && (a.form === 'satz' ? a.inhalt.text : a.inhalt.fremd))) f.push(`inhalt.${a.form === 'satz' ? 'text' : 'fremd'} fehlt`);
      else {
        const teile = abschnitte(a);
        if (teile.length > MAX_ABSCHNITTE) f.push(`${teile.length} Abschnitte: höchstens ${MAX_ABSCHNITTE} (kürzere Diktate oder zwei Aufgaben)`);
        teile.forEach((t, n) => {
          const wo = teile.length > 1 ? `Abschnitt ${n + 1}` : 'Der Text';
          const fremd = [...new Set([...t].filter(z => !ZEICHEN.test(z)))];
          if (t === '') f.push(`${wo} ist leer`);
          if (t.length > MAX_ABSCHNITT) f.push(`${wo} ist länger als ${MAX_ABSCHNITT} Zeichen: mit «|» in kürzere Abschnitte teilen`);
          if (fremd.length) f.push(`${wo} enthält «${fremd.join('')}», das die Tastatur nicht bietet (Buchstaben ohne Eszett, Ä Ö Ü, Ziffern und . , ; : ! ? ' - « »)`);
        });
        if (satzzeichenVon(teile).length > MAX_SATZZEICHEN) f.push(`mehr als ${MAX_SATZZEICHEN} verschiedene Satzzeichen: die Tastatur hat nur Platz für ${MAX_SATZZEICHEN}`);
        if (text(a.inhalt.audio) && teile.length > 1) f.push('inhalt.audio gilt nur bei einem Abschnitt: bei mehreren spricht die Sprachausgabe jeden einzeln');
      }
      if (w.tempo !== undefined && !Object.hasOwn(TEMPI, w.tempo)) f.push(`optionen.tempo muss eine von ${Object.keys(TEMPI).join(', ')} sein`);
      if (w.sprache !== undefined && !SPRACHEN.includes(w.sprache)) f.push(`optionen.sprache muss eine von ${SPRACHEN.join(', ')} sein`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: ein Diktat). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [];
      if (signal.aborted) return Promise.resolve([]);
      if (!kennt(a.form)) throw new Error(`diktat: Form «${a.form}» wird nicht unterstützt`);
      const teile = abschnitte(a), code = sprachcode(ctx, a.form), tempo = TEMPI[ctx.optionen && ctx.optionen.tempo] || TEMPI.langsam;
      const markiert = ctx.modus !== 'simulation';                    // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte(), ton = wiedergabe(ctx), eingaben = [];     // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, nr = 0, gesperrt = false, ohneTon = false;
        const tast = L.ui.tastatur({ layout: 'de-ch', zahlen: /\d/.test(teile.join('')), satzzeichen: satzzeichenVon(teile), onOk: bestaetige });
        const ende = erg => {
          if (beendet) return;                                        // ein zweiter Tipp meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          ton.stopp(); tast.schliesse();
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        const stand = H('p.klein.diktat-stand'), hinweis = H('p.hinweis.diktat-hinweis');
        function aktualisiere() {
          stand.textContent = teile.length > 1 ? `Abschnitt ${nr + 1} von ${teile.length}` : '';
          hinweis.replaceChildren(...(ohneTon ? [TEXTE.stumm, ' ', H('b', teile[nr])] : gesperrt ? [TEXTE.gesperrt] : []));
        }
        function spiele() {
          return ton.spiele(teile[nr], { sprache: code, tempo, audio: teile.length === 1 ? a.inhalt.audio : null }).then(({ ergebnis, aktuell }) => {
            if (beendet || !aktuell) return;
            if (ergebnis === 'stumm' && !ohneTon) { ohneTon = true; hilfen.push('text'); }   // kein Ton: der Text steht da, die Aufgabe zählt höchstens als «hilfe»
            gesperrt = ergebnis === 'gesperrt';
            aktualisiere();
          });
        }
        function bestaetige(w) {
          if (beendet) return;
          eingaben.push(norm(w));
          if (eingaben.length < teile.length) { nr += 1; tast.leere(); aktualisiere(); spiele(); return; }
          const ms = stopp(), gut = teile.map((t, k) => eingaben[k] === t), richtig = gut.every(Boolean);
          const nurGrossKlein = !richtig && teile.every((t, k) => eingaben[k].toLowerCase() === t.toLowerCase());
          if (markiert) buehne.replaceChildren(H('div.uebung.uebung-diktat', H('ol.diktat-ergebnis', teile.map((t, k) => H(`li.${gut[k] ? 'richtig' : 'falsch'}`,
            H('span.zeichen', { 'aria-hidden': 'true' }, gut[k] ? '✓' : '✗'), H('span.eingabe-text', eingaben[k]), H('span.nur-vorlesen', gut[k] ? TEXTE.ergebnisRichtig : TEXTE.ergebnisFalsch))))));
          ende([{ aufgabeKey: a.key, urteil: !richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig',
                  antwort: { text: eingaben.join(' '), teile: eingaben.slice(), falsch: gut.flatMap((x, k) => (x ? [] : [k])) },
                  ms, hilfen: hilfen.slice(), code: nurGrossKlein ? 'gross-klein' : null }]);
        }

        aktualisiere();
        buehne.replaceChildren(H('div.uebung.uebung-diktat',
          H('div.diktat-kopf', H('button.knopf.primaer.abspielen', { type: 'button', 'aria-label': 'Abschnitt wiederholen', onclick: spiele },
            H('span.ico.ico-lautsprecher', { 'aria-hidden': 'true' }), TEXTE.wiederholen), stand, hinweis),
          H('div.eingabe', tast.anzeige, tast.el)));
        spiele();                                                     // der erste Abschnitt erklingt von selbst, gesperrt schadet nicht: der Knopf bleibt
      });
    }
  });
})(globalThis);
