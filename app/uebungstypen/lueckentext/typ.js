/* app/uebungstypen/lueckentext/typ.js: Übungstyp «lueckentext» (Architektur 5.6). Das Kind füllt die Lücken eines Satzes (Form satz).
   Jede Lücke wird mit der eigenen Buchstabentastatur getippt oder, wenn die Aufgabe Ablenker nennt, aus einer Auswahl gewählt.
   Gross- und Kleinschreibung zählt. Ein Paket ist eine Aufgabe, also ein Satz mit einer bis fünf Lücken.
   Aufgabe: inhalt.text mit Lücken {wort}, das eingeklammerte Wort ist die Lösung. Optional inhalt.luecken: eine Liste in der Reihenfolge der
   Lücken, je Eintrag null oder { ablenker: [Texte], auch: [Texte] }. Mit ablenker wird die Lücke zur Auswahl (Lösung und Ablenker gemischt),
   auch nennt weitere richtige Schreibweisen (colour, color). Das Zeichen | des Diktats gilt hier als Leerzeichen.
   inhalt.hinweis (Text, höchstens 80 Zeichen) ersetzt den Hinweis über dem Satz, zum Beispiel «Wähle das passende Satzzeichen.» (V-AP18d-01). Kacheln mit nur
   einem Zeichen (Punkt, Fragezeichen) erscheinen grösser.
   Stehen in einem Satz nur Zahlen in den Lücken (V-AP18b-03), heisst der Hinweis «Zahl», und getippte Lücken bekommen nur die Ziffernreihe.
   Urteil: richtig, wenn jede Lücke stimmt (mit Hilfe: hilfe), sonst falsch. antwort: { luecken: [Eingaben], arten: ['richtig' | 'gross-klein' | 'falsch'] }.
   Der Typ meldet keinen Fehlercode: Module lesen arten, wenn sie «gross-klein» eigens behandeln wollen. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const MAX = { luecken: 5, wort: 40, ablenker: 5, text: 240, hinweis: 80 };         // Wort: Länge der Tastatureingabe, Ablenker: Kacheln neben der Lösung
  const BUCHSTABEN = 'qwertzuiopüasdfghjklöäyxcvbnm';                   // was die Tastatur de-ch ohne Zusatz kennt
  const ESZETT = new RegExp('[' + String.fromCharCode(0xdf, 0x1e9e) + ']');  // die Tastatur hat keines, Schweizer Schreibweise ist ss (kein Literal: die App enthält keines)
  const LEER = String.fromCharCode(0xa0);                               // geschütztes Leerzeichen: eine leere Lücke behält ihre Höhe
  let durchgang = 0;                                                    // jeder Aufruf mischt anders, die Lösung steht nicht immer am selben Ort

  const text = v => typeof v === 'string' && v.trim() !== '';
  const norm = s => String(s).normalize('NFC').trim().replace(/\s+/g, ' ');
  const istLuecke = t => typeof t !== 'string';

  /** Zerlegt den Satz in Textstücke (Zeichenketten) und Lücken { loesung }. */
  function zerlege(satz) {
    const s = String(satz).replace(/\s*\|\s*/g, ' '), teile = [], re = /\{([^{}]*)\}/g;
    let pos = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > pos) teile.push(s.slice(pos, m.index));
      teile.push({ loesung: norm(m[1]) });
      pos = re.lastIndex;
    }
    return pos < s.length ? [...teile, s.slice(pos)] : teile;
  }

  /** Die Teile des Satzes, jede Lücke mit ihren Varianten (auch) und Ablenkern. */
  function teileVon(inhalt) {
    const roh = Array.isArray(inhalt.luecken) ? inhalt.luecken : [], liste = v => (Array.isArray(v) ? v.filter(text).map(norm) : []);
    let n = 0;
    return zerlege(inhalt.text).map(t => {
      if (!istLuecke(t)) return t;
      const z = roh[n++] || {};
      return { loesung: t.loesung, auch: liste(z.auch), ablenker: liste(z.ablenker) };
    });
  }

  /** 'richtig', 'gross-klein' (nur die Schreibung der Buchstaben weicht ab) oder 'falsch'. */
  function artVon(eingabe, luecke) {
    const e = norm(eingabe), ok = [luecke.loesung, ...luecke.auch];
    return ok.includes(e) ? 'richtig' : ok.some(w => w.toLowerCase() === e.toLowerCase()) ? 'gross-klein' : 'falsch';
  }

  L.uebungstyp('lueckentext', {
    titel: 'Lücken füllen',
    eigenschaften: { akzeptiert: ['satz'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 6 },
    optionen: {},
    beispiel: {
      aufgaben: [
        { key: 'bsp/katze', id: 'katze', form: 'satz', inhalt: { text: 'Die {Katze} {schläft} auf dem Sofa.' } },
        { key: 'bsp/baum', id: 'baum', form: 'satz', inhalt: { text: 'Im Garten steht ein {Baum}.', luecken: [{ ablenker: ['baum'] }] } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (!text(i.text)) return ['inhalt.text fehlt'];
      if (i.text.length > MAX.text) f.push(`inhalt.text ist länger als ${MAX.text} Zeichen`);
      const luecken = zerlege(i.text).filter(istLuecke);
      if (!luecken.length) f.push('inhalt.text enthält keine Lücke {wort}');
      if (i.hinweis !== undefined && (!text(i.hinweis) || i.hinweis.length > MAX.hinweis || i.hinweis.includes('!'))) f.push(`inhalt.hinweis muss ein Text bis ${MAX.hinweis} Zeichen ohne Ausrufezeichen sein`);
      if (luecken.length > MAX.luecken) f.push(`inhalt.text hat ${luecken.length} Lücken, erlaubt sind höchstens ${MAX.luecken}`);
      const wort = (wo, w) => {
        if (w === '') f.push(`${wo} ist leer`);
        else if (w.length > MAX.wort) f.push(`${wo} ist länger als ${MAX.wort} Zeichen und passt nicht ins Tastaturfeld`);
        else if (ESZETT.test(w)) f.push(`${wo} enthält ein Eszett: Schweizer Schreibweise ist ss, die Tastatur hat keine Taste dafür`);
      };
      luecken.forEach((l, n) => wort(`Lücke ${n + 1}`, l.loesung));
      if (i.luecken === undefined) return f;
      if (!Array.isArray(i.luecken)) return [...f, 'inhalt.luecken muss eine Liste sein, ein Eintrag je Lücke'];
      if (i.luecken.length > luecken.length) f.push(`inhalt.luecken hat ${i.luecken.length} Einträge für ${luecken.length} Lücken`);
      i.luecken.forEach((z, n) => {
        const wo = `inhalt.luecken[${n}]`;
        if (z === null) return;
        if (typeof z !== 'object' || Array.isArray(z)) return f.push(`${wo} muss null oder ein Objekt mit ablenker und auch sein`);
        Object.keys(z).filter(k => !['ablenker', 'auch'].includes(k)).forEach(k => f.push(`${wo}.${k} gibt es nicht (erlaubt: ablenker, auch)`));
        const listen = ['ablenker', 'auch'].filter(k => z[k] !== undefined);
        const kaputt = listen.filter(k => !(Array.isArray(z[k]) && z[k].every(text)));
        kaputt.forEach(k => f.push(`${wo}.${k} muss eine Liste von Texten sein`));
        if (kaputt.length || !luecken[n]) return;
        const richtig = [luecken[n].loesung, ...(z.auch || []).map(norm)], ablenker = (z.ablenker || []).map(norm);
        (z.auch || []).forEach((w, k) => wort(`${wo}.auch[${k}]`, norm(w)));
        ablenker.forEach((w, k) => {
          wort(`${wo}.ablenker[${k}]`, w);
          if (richtig.includes(w)) f.push(`${wo}.ablenker[${k}] «${w}» ist selbst richtig`);
        });
        if (new Set(ablenker).size !== ablenker.length) f.push(`${wo}.ablenker nennt einen Ablenker doppelt`);
        if (ablenker.length > MAX.ablenker) f.push(`${wo}.ablenker hat mehr als ${MAX.ablenker} Einträge`);
        if (new Set(richtig).size !== richtig.length) f.push(`${wo}.auch wiederholt die Lösung oder eine andere Schreibweise`);
      });
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [];
      if (signal.aborted) return Promise.resolve([]);
      const teile = teileVon(a.inhalt), gaps = teile.filter(istLuecke), n = gaps.length;
      if (!n) throw new Error('lueckentext: die Aufgabe hat keine Lücke {wort}');
      const rng = L.Zufall.aus(`${a.key}|${durchgang++}`);
      gaps.forEach(l => { l.wahl = l.ablenker.length ? rng.mische([...new Set([l.loesung, ...l.ablenker])]) : null; });
      const getippt = gaps.filter(l => !l.wahl), zeichen = [...new Set(getippt.flatMap(l => [...[l.loesung, ...l.auch].join('')]))];
      const ziffern = l => [l.loesung, ...l.auch].every(w => /^[0-9]+$/.test(w)), alleZahlen = gaps.every(ziffern), nurZiffern = getippt.length > 0 && getippt.every(ziffern);
      const werte = gaps.map(() => ''), marke = gaps.map(() => '');
      const leer = i => werte[i].trim() === '', alleVoll = () => werte.every((w, i) => !leer(i));
      let aktiv = 0, beendet = false, tast = null;

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        const ende = erg => {
          if (beendet) return;                                        // ein zweiter Tipp meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          if (tast) tast.schliesse();
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        if (getippt.length) {
          const extra = [...new Set(zeichen.filter(z => z !== ' ' && !/[0-9]/.test(z) && !BUCHSTABEN.includes(z.toLowerCase())).map(z => z.toLowerCase()))].join('');
          tast = L.ui.tastatur({ layout: 'de-ch', buchstaben: !nurZiffern, zahlen: zeichen.some(z => /[0-9]/.test(z)), satzzeichen: extra, leerzeichen: zeichen.includes(' '), maxLaenge: MAX.wort,
            onAenderung: w => { if (!gaps[aktiv].wahl && !beendet) { werte[aktiv] = w; zeichneLuecken(); } },
            onOk: () => { if (!gaps[aktiv].wahl) weiter(); } });
        }

        const hm = ctx.modus !== 'simulation' && ctx.hilfe && ctx.hilfe.verfuegbar && a.hilfe && a.hilfe.hilfsmittel;
        const hilfeOrt = H('div.hilfe-ort');
        const hilfsknopf = hm ? H('button.knopf.hilfe', { type: 'button', onclick: () => {
          ctx.hilfe.zeige(hm, hilfeOrt);                              // wirft das Hilfsmittel, zählt die Hilfe nicht
          if (!hilfen.includes(hm.name)) hilfen.push(hm.name);
          hilfsknopf.setAttribute('disabled', '');
        } }, 'Hilfe') : null;

        const knoepfe = [];
        const satz = H('p.aufgabe.satz', teile.map(t => {
          if (!istLuecke(t)) return t;
          const i = knoepfe.length, k = H('button.luecke', { type: 'button', onclick: () => { if (!beendet) waehleLuecke(i); } });
          knoepfe.push(k);
          return k;
        }));
        const tastaturOrt = tast ? H('div.eingabe', tast.el) : null, wahlOrt = H('div.wahl-ort');
        const was = alleZahlen ? (n === 1 ? 'Ergänze die fehlende Zahl.' : 'Ergänze die fehlenden Zahlen.') : (n === 1 ? 'Ergänze das fehlende Wort.' : 'Ergänze die fehlenden Wörter.');
        const hinweis = text(a.inhalt.hinweis) ? a.inhalt.hinweis : `${was}${getippt.length && !nurZiffern ? ' Gross- und Kleinschreibung zählt.' : ''}`;

        function zeichneLuecken() {
          knoepfe.forEach((k, i) => {
            const voll = !leer(i);
            k.textContent = voll ? werte[i] : LEER;
            k.setAttribute('class', `luecke${i === aktiv && !beendet ? ' aktiv' : ''}${voll ? ' voll' : ''}${marke[i] ? ` ${marke[i]}` : ''}`);
            k.setAttribute('aria-label', `Lücke ${i + 1} von ${n}${voll ? `: ${werte[i]}` : ', leer'}`);
          });
        }
        function zeigeEingabe() {
          const l = gaps[aktiv];
          if (tastaturOrt) tastaturOrt.hidden = !!l.wahl;             // bleibt im Dokument, sonst meldet sich die Hardware-Tastatur ab
          if (!l.wahl) return wahlOrt.replaceChildren();
          wahlOrt.replaceChildren(n > 1 ? H('p.klein.wahl-titel', `Für die markierte Lücke (${aktiv + 1} von ${n})`) : '', H('div.waehlen', { role: 'group', 'aria-label': 'Auswahl' }, l.wahl.map(w =>
            H(`button.antwort${w.length === 1 ? '.zeichen' : ''}${werte[aktiv] === w ? '.gewaehlt' : ''}`, { type: 'button', 'aria-pressed': werte[aktiv] === w ? 'true' : 'false', onclick: () => waehle(w) }, w))));
          if (n > 1 && alleVoll()) wahlOrt.append(H('button.knopf.primaer.gross.fertig', { type: 'button', onclick: abgeben }, 'Fertig'));
        }
        function waehleLuecke(i) {
          aktiv = i;
          if (tast && !gaps[i].wahl) tast.setze(werte[i]);
          zeichneLuecken();
          zeigeEingabe();
        }
        function waehle(w) {
          if (beendet) return;
          werte[aktiv] = w;
          if (n === 1) return abgeben();                              // eine einzige Lücke: die Wahl ist die Antwort
          const naechste = leerNach();
          if (naechste >= 0) waehleLuecke(naechste); else { zeichneLuecken(); zeigeEingabe(); }
        }
        function leerNach() {
          for (let k = 1; k <= n; k++) if (leer((aktiv + k) % n)) return (aktiv + k) % n;
          return -1;
        }
        function weiter() {
          if (beendet) return;
          const naechste = leerNach();
          if (naechste >= 0) waehleLuecke(naechste); else abgeben();
        }
        function abgeben() {
          if (beendet || !alleVoll()) return;
          const ms = stopp(), arten = gaps.map((l, i) => artVon(werte[i], l)), richtig = arten.every(x => x === 'richtig');
          if (ctx.modus !== 'simulation') arten.forEach((x, i) => { marke[i] = x === 'richtig' ? 'richtig' : 'falsch'; });   // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt
          knoepfe.forEach(k => k.setAttribute('disabled', ''));
          ende([{ aufgabeKey: a.key, urteil: !richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig', antwort: { luecken: werte.map(norm), arten }, ms, hilfen }]);
          zeichneLuecken();
          if (tastaturOrt) tastaturOrt.hidden = true;
          wahlOrt.replaceChildren();
        }

        buehne.replaceChildren(H('div.uebung.uebung-lueckentext',
          H('p.hinweis', hinweis), satz, tastaturOrt, wahlOrt,
          hm ? H('div.hilfe-bereich', hilfsknopf, hilfeOrt) : null));
        waehleLuecke(0);
      });
    }
  });
})(globalThis);
