/* app/uebungstypen/multiple-choice/typ.js: Übungstyp «multiple-choice» (Architektur 5.6). Das Kind wählt die richtige von 2 bis 6 Kacheln.
   Es ist die Ersatzform für Typen, die eine Fähigkeit brauchen (zum Beispiel hoeren ohne Ton: Wort lesen und Bild wählen). Weil man raten kann,
   erreicht eine Aufgabe allein mit diesem Typ höchstens Box 4 (maxBox). Falsche Antworten der Form auswahl tragen optional einen Fehlercode,
   der im Ergebnis als code steht. Bei wortkarte und paar stammen die Ablenker aus den Geschwisteraufgaben des Themas (ctx.pool.thema),
   bei rechnung sind es Zahlen, die nach typischen Fehlern aussehen (oder die Liste inhalt.ablenker der Aufgabe). Optionen: anzahl (Kacheln, 2 bis 6, Standard 4) und für wortkarte
   richtung: auto (Bild wählen, wenn es Bilder gibt, sonst fremd-mutter), fremd-mutter oder mutter-fremd. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ANZAHL = { min: 2, max: 6, standard: 4 };
  const RICHTUNGEN = ['auto', 'fremd-mutter', 'mutter-fremd'];
  const MAX_TEXT = 80;                                                // längere Antworten passen nicht auf eine Kachel
  let durchgang = 0;                                                  // jeder Aufruf mischt anders, die richtige Kachel steht nicht immer am selben Ort

  const text = v => typeof v === 'string' && v.trim() !== '';
  const schluessel = o => o.bild || o.text;
  const eindeutig = (liste, key) => { const da = new Set(); return liste.filter(x => { const k = key(x); if (da.has(k)) return false; da.add(k); return true; }); };
  const kennt = form => Object.hasOwn(MODELLE, form);                 // MODELLE steht weiter unten, kennt() läuft erst nach dem Laden

  /** Falsche Zahlen, geordnet nach Plausibilität: eine Gruppe daneben, Ziffern vertauscht, Zehner daneben, Nachbarzahlen. */
  function falscheZahlen({ a, b, ergebnis: c, op }, n, rng) {
    const umgekehrt = Math.sign(c) * Number([...String(Math.abs(c))].reverse().join(''));
    const stufen = [op === '·' ? [c - a, c + a, c - b, c + b] : [c - 1, c + 1], [umgekehrt], [c - 10, c + 10], [c - 1, c + 1, c - 2, c + 2]];
    const ok = new Set(), gut = z => z !== c && (z >= 0 || c < 0);
    for (const stufe of stufen) for (const z of rng.mische(stufe)) if (ok.size < n && gut(z)) ok.add(z);
    for (let k = 3; ok.size < n; k++) for (const z of [c + k, c - k]) if (ok.size < n && gut(z)) ok.add(z);
    return [...ok];
  }

  /** Aufgaben desselben Themas und derselben Form, ohne die Aufgabe selbst. */
  function geschwister(ctx, a) {
    const liste = ctx.pool && typeof ctx.pool.thema === 'function' ? ctx.pool.thema(a.thema) : [];
    return (Array.isArray(liste) ? liste : []).filter(s => s && s.inhalt && s.form === a.form && s.key !== a.key);
  }

  /** Je Form: { kopf, hinweis, richtig, falsche }. Eine Antwort ist { text, bild?, zahl?, code?, aufgabe? }. */
  const MODELLE = {
    rechnung: (a, ctx, rng, n) => {                       // inhalt.ablenker (Liste ganzer Zahlen) geht vor den Zahlen, die nach typischen Fehlern aussehen (V-AP07b-03)
      const eigene = [...new Set((Array.isArray(a.inhalt.ablenker) ? a.inhalt.ablenker : []).filter(z => Number.isInteger(z) && z !== a.inhalt.ergebnis))].slice(0, n);
      const rest = falscheZahlen(a.inhalt, n, rng).filter(z => !eigene.includes(z)).slice(0, n - eigene.length);
      return { kopf: `${a.inhalt.text} = ?`, hinweis: null, richtig: { text: String(a.inhalt.ergebnis), zahl: a.inhalt.ergebnis }, falsche: [...eigene, ...rest].map(z => ({ text: String(z), zahl: z })) };
    },

    auswahl: (a, ctx, rng) => ({ kopf: a.inhalt.frage, hinweis: null, richtig: { text: a.inhalt.richtig },
      falsche: rng.mische(a.inhalt.falsch.map(w => w !== null && typeof w === 'object' ? { text: w.text, code: w.code || null } : { text: w, code: null })) }),

    wortkarte(a, ctx, rng) {
      const i = a.inhalt, sib = geschwister(ctx, a), wunsch = ctx.optionen && ctx.optionen.richtung;
      const richtung = RICHTUNGEN.includes(wunsch) ? wunsch : 'auto', mitBild = sib.filter(s => text(s.inhalt.bild));
      if (richtung === 'auto' && text(i.bild) && mitBild.length) {
        return { kopf: i.fremd, hinweis: 'Welches Bild passt?', richtig: { text: i.mutter, bild: i.bild, aufgabe: a.id },
          falsche: rng.mische(mitBild).map(s => ({ text: s.inhalt.mutter, bild: s.inhalt.bild, aufgabe: s.id })) };
      }
      const zurueck = richtung === 'mutter-fremd', [frage, antwort] = zurueck ? ['mutter', 'fremd'] : ['fremd', 'mutter'];
      return { kopf: i[frage], hinweis: zurueck ? 'Wie heisst das Wort in der Fremdsprache?' : 'Was bedeutet das Wort?',
        richtig: { text: i[antwort], aufgabe: a.id }, falsche: rng.mische(sib).map(s => ({ text: s.inhalt[antwort], aufgabe: s.id })) };
    },

    paar: (a, ctx, rng) => ({ kopf: a.inhalt.links, hinweis: text(a.inhalt.frage) ? a.inhalt.frage : 'Was passt dazu?', richtig: { text: a.inhalt.rechts },   // frage: Frage des Themas (modul-schema 3.5)
      falsche: rng.mische(geschwister(ctx, a)).map(s => ({ text: s.inhalt.rechts })) })
  };

  const anzahlVon = o => { const n = o && o.anzahl; return typeof n === 'number' && Number.isFinite(n) ? Math.min(ANZAHL.max, Math.max(ANZAHL.min, Math.round(n))) : ANZAHL.standard; };
  const antwortVon = o => ({ text: o.text, ...(o.zahl !== undefined && { zahl: o.zahl }), ...(o.aufgabe && { aufgabe: o.aufgabe }) });

  L.uebungstyp('multiple-choice', {
    titel: 'Antwort wählen',
    eigenschaften: { akzeptiert: ['auswahl', 'wortkarte', 'rechnung', 'paar'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 4 },
    optionen: {
      anzahl: { art: 'zahl', min: ANZAHL.min, max: ANZAHL.max, standard: ANZAHL.standard },
      richtung: { art: 'wahl', werte: RICHTUNGEN, standard: 'auto' }
    },
    beispiel: {
      aufgaben: [
        { key: 'bsp/hauptstadt', id: 'hauptstadt', form: 'auswahl',
          inhalt: { frage: 'Welche Stadt ist die Hauptstadt der Schweiz?', richtig: 'Bern',
                    falsch: [{ text: 'Zürich', code: 'verwechselt-stadt' }, { text: 'Genf', code: 'verwechselt-stadt' }, 'Zug'] } },
        { key: 'bsp/7x8', id: '7x8', form: 'rechnung', inhalt: { a: 7, b: 8, op: '·', ergebnis: 56, text: '7 · 8' } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a, optionen) {
      const i = (a && a.inhalt) || {}, f = [], kurz = (feld, t) => { if (text(t) && t.length > MAX_TEXT) f.push(`${feld} ist länger als ${MAX_TEXT} Zeichen und passt nicht auf eine Kachel`); };
      const w = optionen || {};
      if (!kennt(a && a.form)) f.push(`Form «${a && a.form}» versteht multiple-choice nicht`);
      else if (a.form === 'rechnung' && ![i.a, i.b, i.ergebnis].every(Number.isInteger)) f.push('a, b und ergebnis müssen ganze Zahlen sein');
      else if (a.form === 'rechnung' && i.ablenker !== undefined && !(Array.isArray(i.ablenker) && i.ablenker.length <= 5 && i.ablenker.every(z => Number.isInteger(z) && z !== i.ergebnis))) f.push('ablenker muss eine Liste von höchstens fünf ganzen Zahlen sein, die nicht das Ergebnis sind');
      else if (a.form === 'auswahl') {
        if (!Array.isArray(i.falsch) || !i.falsch.length) f.push('falsch braucht mindestens eine Antwort');
        else i.falsch.forEach((x, n) => kurz(`falsch[${n}]`, x !== null && typeof x === 'object' ? x.text : x));
        kurz('richtig', i.richtig);
      } else if (a.form === 'wortkarte') { kurz('fremd', i.fremd); kurz('mutter', i.mutter); }
      else if (a.form === 'paar') kurz('rechts', i.rechts);
      if (w.anzahl !== undefined && !(Number.isInteger(w.anzahl) && w.anzahl >= ANZAHL.min && w.anzahl <= ANZAHL.max)) f.push(`optionen.anzahl muss eine ganze Zahl von ${ANZAHL.min} bis ${ANZAHL.max} sein`);
      if (w.richtung !== undefined && !RICHTUNGEN.includes(w.richtung)) f.push(`optionen.richtung muss eine von ${RICHTUNGEN.join(', ')} sein`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [];
      if (signal.aborted) return Promise.resolve([]);
      if (!kennt(a.form)) throw new Error(`multiple-choice: Form «${a.form}» wird nicht unterstützt`);
      const rng = L.Zufall.aus(`${a.key}|${durchgang++}`), n = anzahlVon(ctx.optionen) - 1;
      const m = MODELLE[a.form](a, ctx, rng, n);
      const falsche = eindeutig(m.falsche.filter(f => schluessel(f) !== schluessel(m.richtig)), schluessel).slice(0, n);
      const markiert = ctx.modus !== 'simulation';                    // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false;
        const ende = erg => {
          if (beendet) return;                                        // ein zweiter Tipp meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const frage = H('div.frage', H('p.aufgabe', m.kopf), m.hinweis ? H('p.hinweis', m.hinweis) : null);

        if (!falsche.length) {                                        // keine Ablenker gefunden: nichts zu wählen, die Aufgabe wird nur gezeigt
          const weiter = () => ende([{ aufgabeKey: a.key, urteil: 'gezeigt', antwort: antwortVon(m.richtig), ms: stopp(), hilfen: [] }]);
          buehne.replaceChildren(H('div.uebung.uebung-mc', frage, H('p.loesung', m.richtig.text), H('button.knopf.primaer.weiter', { type: 'button', onclick: weiter }, 'Weiter')));
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
          ende([{ aufgabeKey: a.key, urteil: !o.richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig', antwort: antwortVon(o), ms, hilfen, code: o.richtig ? null : o.code || null }]);
        }

        const hm = ctx.modus !== 'simulation' && ctx.hilfe && ctx.hilfe.verfuegbar && a.hilfe && a.hilfe.hilfsmittel;
        const hilfeOrt = H('div.hilfe-ort');
        const hilfsknopf = hm ? H('button.knopf.hilfe', { type: 'button', onclick: () => {
          ctx.hilfe.zeige(hm, hilfeOrt);                              // wirft das Hilfsmittel, zählt die Hilfe nicht
          if (!hilfen.includes(hm.name)) hilfen.push(hm.name);
          hilfsknopf.setAttribute('disabled', '');
        } }, 'Hilfe') : null;

        buehne.replaceChildren(H('div.uebung.uebung-mc', frage,
          H(`div.antworten.spalten-${kacheln.length === 3 || kacheln.length >= 5 ? 3 : 2}`, { role: 'group', 'aria-label': 'Antworten' }, kacheln.map(k => k.knopf)),
          hm ? H('div.hilfe-bereich', hilfsknopf, hilfeOrt) : null));
      });
    }
  });
})(globalThis);
