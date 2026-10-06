/* app/uebungstypen/hoeren/typ.js: Übungstyp «hoeren» (Architektur 5.6 und 5.7, AP-17a). Das Kind hört ein Wort oder einen Satz und wählt, was es gehört hat.
   Kette der Wiedergabe: Aufnahme (inhalt.audio), dann Sprachausgabe, dann stumm. Der Knopf «Anhören» ist immer sichtbar: Antwortet die Sprachausgabe mit
   «gesperrt» (iOS spielt Ton nur nach einer Berührung), bleibt der Knopf und die Aufgabe geht weiter. Wird sie «stumm», prüft der Lauf das vor der Runde
   und nimmt den Ersatztyp (multiple-choice: Wort lesen und Bild wählen). Fällt der Ton erst während der Aufgabe aus, steht das Wort als Text da und die
   Aufgabe zählt höchstens als «hilfe» (hilfen: ['text']). Weil man bei der Auswahl raten kann, gilt maxBox 4 wie bei multiple-choice.
   Formen: wortkarte (gesprochen wird das Fremdwort, Antworten sind Bilder, Bedeutungen oder Wörter) und satz (Antworten sind Sätze der Geschwisteraufgaben).
   Die Ablenker stammen aus den Geschwisteraufgaben des Themas (ctx.pool.thema). Eine falsche Wahl bei wortkarte meldet den Fehlercode «verwechselt-wort».
   Optionen: anzahl (Antworten, 2 bis 6), antwort (auto: Bild, wenn es Bilder gibt, sonst Bedeutung; bild, mutter, fremd), sprache (Sprachcode, auto: en-GB
   für das Fremdwort, de-CH für einen Satz). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ANZAHL = { min: 2, max: 6, standard: 4 };
  const ANTWORTEN = ['auto', 'bild', 'mutter', 'fremd'];
  const SPRACHEN = ['auto', 'en-GB', 'de-CH', 'de-DE'];
  const MAX_TEXT = 80, MAX_SATZ = 140;                                // längere Antworten passen nicht auf eine Kachel
  const TEXTE = {
    anhoeren: 'Anhören', weiter: 'Weiter', bild: 'Welches Bild passt?', mutter: 'Was bedeutet das Wort?', fremd: 'Welches Wort hast du gehört?', satz: 'Welcher Satz passt?',
    gesperrt: 'Tippe auf «Anhören», um den Ton zu starten.', stummWort: 'Der Ton ist nicht verfügbar. Das Wort steht hier:', stummSatz: 'Der Ton ist nicht verfügbar. Der Satz steht hier:'
  };
  let durchgang = 0;                                                  // jeder Aufruf mischt anders, die richtige Kachel steht nicht immer am selben Ort

  const text = v => typeof v === 'string' && v.trim() !== '';
  const satzText = i => String(i.text).replace(/[{}]/g, '').replace(/\s*\|\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const schluessel = o => o.bild || o.text;
  const eindeutig = (liste, key) => { const da = new Set(); return liste.filter(x => { const k = key(x); if (da.has(k)) return false; da.add(k); return true; }); };
  const sprachcode = (ctx, form) => { const o = ctx.optionen && ctx.optionen.sprache; return SPRACHEN.includes(o) && o !== 'auto' ? o : form === 'satz' ? (ctx.sprachen && ctx.sprachen.mutter) || 'de-CH' : (ctx.sprachen && ctx.sprachen.fremd) || 'en-GB'; };
  const anzahlVon = o => { const n = o && o.anzahl; return typeof n === 'number' && Number.isFinite(n) ? Math.min(ANZAHL.max, Math.max(ANZAHL.min, Math.round(n))) : ANZAHL.standard; };
  const antwortVon = o => ({ text: o.text, ...(o.aufgabe && { aufgabe: o.aufgabe }) });
  const geschwister = (ctx, a) => {
    const liste = ctx.pool && typeof ctx.pool.thema === 'function' ? ctx.pool.thema(a.thema) : [];
    return (Array.isArray(liste) ? liste : []).filter(s => s && s.inhalt && s.form === a.form && s.key !== a.key);
  };

  /** Je Form: { sprich, audio, hinweis, stumm, richtig, falsche, lang, code }. Eine Antwort ist { text, bild?, aufgabe }. */
  const MODELLE = {
    wortkarte(a, ctx, rng) {
      const i = a.inhalt, sib = geschwister(ctx, a), wunsch = ctx.optionen && ctx.optionen.antwort, mitBild = sib.filter(s => text(s.inhalt.bild));
      const art = wunsch === 'fremd' || wunsch === 'mutter' ? wunsch : text(i.bild) && mitBild.length ? 'bild' : 'mutter';
      const antwort = (s, id) => art === 'bild' ? { text: s.mutter, bild: s.bild, aufgabe: id } : { text: s[art], aufgabe: id };
      return { sprich: i.fremd, audio: i.audio, hinweis: TEXTE[art], stumm: TEXTE.stummWort, text: i.fremd, richtig: antwort(i, a.id), lang: false,
        falsche: rng.mische(art === 'bild' ? mitBild : sib).map(s => antwort(s.inhalt, s.id)), code: 'verwechselt-wort' };
    },
    satz: (a, ctx, rng) => ({ sprich: satzText(a.inhalt), audio: a.inhalt.audio, hinweis: TEXTE.satz, stumm: TEXTE.stummSatz, text: satzText(a.inhalt), lang: true,
      richtig: { text: satzText(a.inhalt), aufgabe: a.id }, falsche: rng.mische(geschwister(ctx, a)).map(s => ({ text: satzText(s.inhalt), aufgabe: s.id })), code: null })
  };
  const kennt = form => Object.hasOwn(MODELLE, form);

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

  L.uebungstyp('hoeren', {
    titel: 'Hören und wählen',
    eigenschaften: { akzeptiert: ['wortkarte', 'satz'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: ['sprache'],
                     ersatz: 'multiple-choice', zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 4 },
    optionen: {
      anzahl: { art: 'zahl', min: ANZAHL.min, max: ANZAHL.max, standard: ANZAHL.standard },
      antwort: { art: 'wahl', werte: ANTWORTEN, standard: 'auto' },
      sprache: { art: 'wahl', werte: SPRACHEN, standard: 'auto' }
    },
    beispiel: {
      aufgaben: [
        { key: 'bsp/pencil', id: 'pencil', form: 'wortkarte', inhalt: { fremd: 'pencil', mutter: 'der Bleistift', bild: 'pencil.svg' } },
        { key: 'bsp/pen', id: 'pen', form: 'wortkarte', inhalt: { fremd: 'pen', mutter: 'der Kugelschreiber', bild: 'pen.svg' } },
        { key: 'bsp/ruler', id: 'ruler', form: 'wortkarte', inhalt: { fremd: 'ruler', mutter: 'das Lineal', bild: 'ruler.svg' } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a, optionen) {
      const i = (a && a.inhalt) || {}, f = [], w = optionen || {}, kurz = (feld, t, max) => { if (text(t) && t.length > max) f.push(`${feld} ist länger als ${max} Zeichen und passt nicht auf eine Kachel`); };
      if (!kennt(a && a.form)) f.push(`Form «${a && a.form}» versteht hoeren nicht`);
      else if (a.form === 'wortkarte') { kurz('fremd', i.fremd, MAX_TEXT); kurz('mutter', i.mutter, MAX_TEXT); }
      else if (text(i.text)) kurz('text', satzText(i), MAX_SATZ);
      if (w.anzahl !== undefined && !(Number.isInteger(w.anzahl) && w.anzahl >= ANZAHL.min && w.anzahl <= ANZAHL.max)) f.push(`optionen.anzahl muss eine ganze Zahl von ${ANZAHL.min} bis ${ANZAHL.max} sein`);
      for (const [name, werte] of [['antwort', ANTWORTEN], ['sprache', SPRACHEN]]) if (w[name] !== undefined && !werte.includes(w[name])) f.push(`optionen.${name} muss eine von ${werte.join(', ')} sein`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [];
      if (signal.aborted) return Promise.resolve([]);
      if (!kennt(a.form)) throw new Error(`hoeren: Form «${a.form}» wird nicht unterstützt`);
      const rng = L.Zufall.aus(`${a.key}|${durchgang++}`), m = MODELLE[a.form](a, ctx, rng), code = sprachcode(ctx, a.form);
      const falsche = eindeutig(m.falsche.filter(f => schluessel(f) !== schluessel(m.richtig)), schluessel).slice(0, anzahlVon(ctx.optionen) - 1);
      const markiert = ctx.modus !== 'simulation';                    // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte(), ton = wiedergabe(ctx);   // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, textDa = false;
        const ende = erg => {
          if (beendet) return;                                        // ein zweiter Tipp meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          ton.stopp();
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        const hinweis = H('p.hinweis', m.hinweis), kopf = H('div.hoer-kopf');
        const spiele = () => ton.spiele(m.sprich, { sprache: code, audio: m.audio }).then(({ ergebnis, aktuell }) => {
          if (beendet || !aktuell) return;
          if (ergebnis === 'gesperrt') hinweis.textContent = TEXTE.gesperrt;
          else if (ergebnis === 'stumm' && !textDa) {                 // der Ton fiel aus: das Wort steht als Text da, die Aufgabe zählt höchstens als «hilfe»
            textDa = true; hilfen.push('text');
            kopf.append(H('p.hoer-text', m.stumm, ' ', H('b', m.text)));
          } else if (ergebnis === 'tts' || ergebnis === 'audio') hinweis.textContent = m.hinweis;   // nach einem Tipp auf den Knopf steht wieder die Frage da
        });
        const abspielen = H('button.knopf.primaer.gross.abspielen', { type: 'button', 'aria-label': TEXTE.anhoeren, onclick: spiele },
          H('span.ico.ico-lautsprecher', { 'aria-hidden': 'true' }), TEXTE.anhoeren);
        kopf.append(abspielen, hinweis);

        if (!falsche.length) {                                        // keine Ablenker gefunden: nichts zu wählen, die Aufgabe wird nur gezeigt
          const weiter = () => { if (!beendet) ende([{ aufgabeKey: a.key, urteil: 'gezeigt', antwort: antwortVon(m.richtig), ms: stopp(), hilfen: [] }]); };
          buehne.replaceChildren(H('div.uebung.uebung-hoeren', kopf, H('p.loesung', m.richtig.text), H('button.knopf.primaer.weiter', { type: 'button', onclick: weiter }, TEXTE.weiter)));
          spiele();
          return;
        }

        const kacheln = rng.mische([{ ...m.richtig, richtig: true }, ...falsche]).map(o => {
          const knopf = H('button.antwort', { type: 'button', onclick: () => waehle(o) },
            o.bild ? H('img', { src: dienste.bild ? dienste.bild.url(o.bild) : o.bild, alt: '', draggable: 'false', onerror: () => knopf.replaceChildren(o.text) }) : o.text);
          return { o, knopf };
        });
        function waehle(o) {
          if (beendet) return;
          const ms = stopp();
          for (const k of kacheln) {
            k.knopf.setAttribute('disabled', '');
            if (markiert && (k.o.richtig || k.o === o)) k.knopf.classList.add(k.o.richtig ? 'richtig' : 'falsch');
          }
          ende([{ aufgabeKey: a.key, urteil: !o.richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig', antwort: antwortVon(o), ms, hilfen: hilfen.slice(), code: o.richtig ? null : m.code }]);
        }
        buehne.replaceChildren(H('div.uebung.uebung-hoeren', kopf,
          H(`div.antworten.${m.lang ? 'lang' : `spalten-${kacheln.length === 3 || kacheln.length >= 5 ? 3 : 2}`}`, { role: 'group', 'aria-label': 'Antworten' }, kacheln.map(k => k.knopf))));
        spiele();                                                     // gesperrt schadet nicht: der Knopf bleibt sichtbar
      });
    }
  });
})(globalThis);
