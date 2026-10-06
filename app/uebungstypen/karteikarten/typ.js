/* app/uebungstypen/karteikarten/typ.js: Übungstyp «karteikarten» (Architektur 5.6, AP-17a). Einführung neuer Wörter und Aufgaben: Das Kind sieht die
   Vorderseite, dreht die Karte um und sieht die Rückseite. Bei einer Wortkarte spricht die Sprachausgabe das Fremdwort (Aufnahme, sonst Stimme, sonst
   bleibt es still: die Fähigkeit «sprache» ist hier freiwillig, darum braucht der Typ keinen Ersatz). Danach schätzt sich das Kind ein.
   Das Urteil ist immer «gezeigt» und die Einschätzung steht nur in `selbst`: Sie ist kein Beweis und verändert die Box nicht (5.3).
   Formen: wortkarte, rechnung, paar. Optionen: richtung (auto und fremd-mutter: Fremdwort vorne, mutter-fremd: Muttersprache vorne),
   selbsteinschaetzung (ja: drei Knöpfe, nein: nur «Weiter»), sprache (Sprachcode der Aussprache, auto: en-GB für das Fremdwort). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const RICHTUNGEN = ['auto', 'fremd-mutter', 'mutter-fremd'];
  const SPRACHEN = ['auto', 'en-GB', 'de-CH', 'de-DE'];
  const JA_NEIN = ['ja', 'nein'];
  const MAX_TEXT = 80;                                                // längere Texte passen nicht gross auf die Karte
  const SELBST = [['sicher', 'Kann ich'], ['unsicher', 'Unsicher'], ['nicht', 'Noch nicht']];
  const TEXTE = { umdrehen: 'Umdrehen', anhoeren: 'Anhören', weiter: 'Weiter', frage: 'Wie sicher bist du?', paar: 'Was passt dazu?' };

  const text = v => typeof v === 'string' && v.trim() !== '';
  const sprachcode = ctx => { const o = ctx.optionen && ctx.optionen.sprache; return SPRACHEN.includes(o) && o !== 'auto' ? o : (ctx.sprachen && ctx.sprachen.fremd) || 'en-GB'; };

  /** Vorder- und Rückseite je Form: { vorne, hinten } mit text, hinweis, bild und sprich (die Seite zeigt das Fremdwort und hat den Lautsprecher). */
  const SEITEN = {
    wortkarte(a, o) {
      const i = a.inhalt;
      return o.richtung === 'mutter-fremd'
        ? { vorne: { text: i.mutter, bild: i.bild }, hinten: { text: i.fremd, sprich: true } }
        : { vorne: { text: i.fremd, bild: i.bild, sprich: true }, hinten: { text: i.mutter } };
    },
    rechnung: a => ({ vorne: { text: `${a.inhalt.text} = ?` }, hinten: { text: String(a.inhalt.ergebnis) } }),
    paar: a => ({ vorne: { text: a.inhalt.links, hinweis: TEXTE.paar }, hinten: { text: a.inhalt.rechts } })
  };
  const kennt = form => Object.hasOwn(SEITEN, form);

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
      return p.then(r => r, () => 'stumm').then(r => { ctx.signal.removeEventListener('abort', kette); return r; });
    } };
  }

  L.uebungstyp('karteikarten', {
    titel: 'Karteikarten',
    eigenschaften: { akzeptiert: ['wortkarte', 'rechnung', 'paar'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 1 },
    optionen: {
      richtung: { art: 'wahl', werte: RICHTUNGEN, standard: 'auto' },
      selbsteinschaetzung: { art: 'wahl', werte: JA_NEIN, standard: 'ja' },
      sprache: { art: 'wahl', werte: SPRACHEN, standard: 'auto' }
    },
    beispiel: {
      aufgaben: [
        { key: 'bsp/pencil', id: 'pencil', form: 'wortkarte', inhalt: { fremd: 'pencil', mutter: 'der Bleistift', bild: 'pencil.svg' } },
        { key: 'bsp/7x8', id: '7x8', form: 'rechnung', inhalt: { a: 7, b: 8, op: '·', ergebnis: 56, text: '7 · 8' } },
        { key: 'bsp/hund', id: 'hund', form: 'paar', inhalt: { links: 'Hund', rechts: 'Nomen' } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a, optionen) {
      const i = (a && a.inhalt) || {}, f = [], w = optionen || {}, kurz = (feld, t) => { if (text(t) && t.length > MAX_TEXT) f.push(`${feld} ist länger als ${MAX_TEXT} Zeichen und passt nicht auf die Karte`); };
      if (!kennt(a && a.form)) f.push(`Form «${a && a.form}» versteht karteikarten nicht`);
      else if (a.form === 'rechnung' && ![i.a, i.b, i.ergebnis].every(Number.isInteger)) f.push('a, b und ergebnis müssen ganze Zahlen sein');
      else if (a.form === 'wortkarte') { kurz('fremd', i.fremd); kurz('mutter', i.mutter); }
      else if (a.form === 'paar') { kurz('links', i.links); kurz('rechts', i.rechts); }
      for (const [name, werte] of [['richtung', RICHTUNGEN], ['selbsteinschaetzung', JA_NEIN], ['sprache', SPRACHEN]]) {
        if (w[name] !== undefined && !werte.includes(w[name])) f.push(`optionen.${name} muss eine von ${werte.join(', ')} sein`);
      }
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Karte). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, o = ctx.optionen || {};
      if (signal.aborted) return Promise.resolve([]);
      if (!kennt(a.form)) throw new Error(`karteikarten: Form «${a.form}» wird nicht unterstützt`);
      const seiten = SEITEN[a.form](a, o), mitSelbst = o.selbsteinschaetzung !== 'nein', code = sprachcode(ctx);
      const hatTon = a.form === 'wortkarte' && (text(a.inhalt.audio) || !!(dienste.sprache && dienste.sprache.verfuegbar(code)));

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte(), ton = wiedergabe(ctx);      // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, gedreht = false;
        const ende = erg => {
          if (beendet) return;                                          // ein zweiter Tipp meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          ton.stopp();
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const melde = selbst => { if (!beendet) ende([{ aufgabeKey: a.key, urteil: 'gezeigt', antwort: { gedreht, selbst }, ms: stopp(), hilfen: [], selbst }]); };   // ein zweiter Tipp stoppt die Zeit nicht noch einmal

        const spiele = () => { ton.spiele(a.inhalt.fremd, { sprache: code, audio: a.inhalt.audio }); };
        const seite = (s, art) => H(`div.karte-seite.${art}`,
          s.bild ? H('img', { src: dienste.bild ? dienste.bild.url(s.bild) : s.bild, alt: '', draggable: 'false', onerror: e => { if (e && e.target && e.target.remove) e.target.remove(); } }) : null,
          H('p.karte-text', s.text), s.hinweis ? H('p.hinweis', s.hinweis) : null,
          s.sprich && hatTon ? H('button.knopf.abspielen', { type: 'button', 'aria-label': TEXTE.anhoeren, onclick: spiele }, H('span.ico.ico-lautsprecher', { 'aria-hidden': 'true' }), TEXTE.anhoeren) : null);
        const bewertung = mitSelbst
          ? H('div.selbst', { role: 'group', 'aria-label': TEXTE.frage }, H('p.klein', TEXTE.frage),
              H('div.selbst-knoepfe', SELBST.map(([schluessel, name]) => H(`button.knopf.selbst-${schluessel}`, { type: 'button', onclick: () => melde(schluessel) }, name))))
          : H('button.knopf.primaer.gross.weiter', { type: 'button', onclick: () => melde(null) }, TEXTE.weiter);

        function zeichne() {
          buehne.replaceChildren(H('div.uebung.uebung-karte',
            H('div.karte', seite(seiten.vorne, 'vorne'), gedreht ? seite(seiten.hinten, 'hinten') : null),
            gedreht ? bewertung : H('button.knopf.primaer.gross.umdrehen', { type: 'button', onclick: drehe }, TEXTE.umdrehen)));
        }
        function drehe() {
          if (beendet || gedreht) return;
          gedreht = true; zeichne();
          if (seiten.hinten.sprich && hatTon) spiele();                 // das Fremdwort steht hinten: es erklingt beim Umdrehen (Berührung)
        }
        zeichne();
        if (seiten.vorne.sprich && hatTon) spiele();                    // gesperrt oder stumm schadet nicht: der Lautsprecher bleibt sichtbar
      });
    }
  });
})(globalThis);
