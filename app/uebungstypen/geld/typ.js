/* app/uebungstypen/geld/typ.js: Übungstyp «geld» (Architektur 5.6, Form «betrag»). Schweizer Münzen (5, 10, 20, 50 Rp., 1, 2, 5 Fr.) und Noten (10 bis 1000 Fr.)
   als eigene, schlichte SVG-Grafik, ohne Vorlage einer Bank oder der Nationalbank. Zwei Richtungen:
   zaehlen: Die Stücke liegen da, das Kind schreibt den Betrag in zwei Feldern (Franken und Rappen). Der Betrag steht in Rappen im Inhalt, optional
            mit stuecke (Liste der gezeigten Werte in Rappen, Summe gleich rappen), sonst mit den wenigsten Stücken.
   legen:   Der Betrag steht da, das Kind tippt Münzen und Noten an, bis er stimmt. Ein Tipp auf ein gelegtes Stück nimmt es zurück.
   Der Typ zeigt genau ein Paket (eine Aufgabe). Rückmeldung und Speichern gehören dem Lauf. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const MAX_STUECKE = 14, MAX_RAPPEN = 200000, MAX_GELEGT = 24, PX_PRO_MM = 2.6, NOTE_H = 56;
  const RICHTUNG = ['gemischt', 'zaehlen', 'legen'], SUMME = ['verdeckt', 'sichtbar'];
  const MUENZEN = { 5: 17.15, 10: 19.15, 20: 21.05, 50: 18.2, 100: 23.2, 200: 27.4, 500: 31.45 };         // Durchmesser in mm: so verschieden gross wie die echten
  const NOTEN = { 1000: 126, 2000: 137, 5000: 148, 10000: 159, 20000: 170, 100000: 181 };                    // Breite in mm
  const WERTE = [...Object.keys(MUENZEN), ...Object.keys(NOTEN)].map(Number).sort((a, b) => b - a);
  const ganz = Number.isInteger;

  const franken = rp => Math.floor(rp / 100), rest = rp => rp % 100;
  const text = rp => (rp === 0 ? '0 Fr.' : [franken(rp) ? `${franken(rp)} Fr.` : '', rest(rp) ? `${rest(rp)} Rp.` : ''].filter(Boolean).join(' '));
  const name = rp => (rp < 100 ? `${rp} Rappen` : `${rp / 100} Franken${rp in NOTEN ? ' (Note)' : ''}`);
  /** Die wenigsten Stücke für den Betrag in Rappen, grösste zuerst. Mit den Schweizer Werten ist das Greedy-Verfahren dafür richtig. */
  function zerlege(rp) {
    const aus = [];
    for (const w of WERTE) while (rp >= w) { aus.push(w); rp -= w; }
    return rp === 0 ? aus : null;
  }

  function svgEl(tag, attribute, inhalt) {
    const e = document.createElementNS ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    if (inhalt !== undefined) e.textContent = String(inhalt);
    return e;
  }
  /** Eine Münze (Kreis) oder Note (Rechteck) mit dem Wert in Franken oder Rappen. */
  function stueck(rp) {
    const note = rp in NOTEN, b = Math.round((note ? NOTEN[rp] * 0.8 : MUENZEN[rp] * PX_PRO_MM)), h = note ? NOTE_H : b;
    const svg = svgEl('svg', { viewBox: `0 0 ${b} ${h}`, width: b, height: h, class: `stueck ${note ? 'note' : 'muenze'} w${rp}`, 'aria-hidden': 'true', focusable: 'false' });
    svg.append(note ? svgEl('rect', { x: 2, y: 2, width: b - 4, height: h - 4, rx: 5, class: 'koerper' }) : svgEl('circle', { cx: b / 2, cy: h / 2, r: b / 2 - 2, class: 'koerper' }));
    svg.append(svgEl('text', { x: b / 2, y: h / 2 + (note ? 3 : 2), class: 'zahl', 'font-size': note ? 28 : Math.round(b * 0.38) }, rp < 100 ? rp : rp / 100),
      svgEl('text', { x: b / 2, y: h / 2 + (note ? 22 : b * 0.3), class: 'einheit', 'font-size': note ? 14 : Math.round(b * 0.2) }, rp < 100 ? 'Rp.' : 'Fr.'));
    return svg;
  }

  /** Fehlercode für einen typischen Fehler im Feldpaar (fr, rp) beim Zählen, sonst undefiniert. */
  function code(soll, fr, rp) {
    if (fr * 100 + rp === soll) return undefined;
    if (fr === soll && rp === 0) return 'rappen-als-franken';                       // 350 Fr. statt 3 Fr. 50 Rp.
    if (fr === franken(soll) && rp * 10 === rest(soll)) return 'rappen-ohne-null';  // 5 Fr. 4 Rp. statt 5 Fr. 40 Rp.
    if (fr === rest(soll) && rp === franken(soll)) return 'franken-rappen-vertauscht';
    return undefined;
  }

  L.uebungstyp('geld', {
    titel: 'Mit Geld rechnen',
    eigenschaften: { akzeptiert: ['betrag'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 6 },
    optionen: { richtung: { art: 'wahl', werte: RICHTUNG, standard: 'gemischt' }, summe: { art: 'wahl', werte: SUMME, standard: 'verdeckt' } },
    beispiel: { aufgaben: [
      { key: 'bsp/g540', id: 'g540', form: 'betrag', inhalt: { rappen: 540 } },
      { key: 'bsp/g1850', id: 'g1850', form: 'betrag', inhalt: { rappen: 1850 } },
      { key: 'bsp/g35', id: 'g35', form: 'betrag', inhalt: { rappen: 35 } }], optionen: {} },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (!ganz(i.rappen) || i.rappen <= 0 || i.rappen > MAX_RAPPEN) return [`rappen muss eine ganze Zahl von 5 bis ${MAX_RAPPEN} sein`];
      if (i.rappen % 5 !== 0) return ['rappen muss ein Vielfaches von 5 sein: es gibt keine kleineren Münzen'];
      const z = i.stuecke === undefined ? zerlege(i.rappen) : i.stuecke;
      if (!Array.isArray(z) || z.some(w => !WERTE.includes(w))) f.push(`stuecke nennt nur Werte in Rappen aus ${WERTE.join(', ')}`);
      else if (z.reduce((s, w) => s + w, 0) !== i.rappen) f.push('die stuecke ergeben nicht den Betrag rappen');
      else if (z.length > MAX_STUECKE) f.push(`der Betrag braucht ${z.length} Stücke, mehr als ${MAX_STUECKE} passen nicht auf den Tisch`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [], opt = ctx.optionen || {}, soll = a.inhalt.rappen;
      if (signal.aborted) return Promise.resolve([]);
      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();
        const gerade = [...String(a.key)].reduce((s, c) => s + c.charCodeAt(0), 0) % 2 === 0, legen = opt.richtung === 'legen' || (opt.richtung !== 'zaehlen' && gerade);
        let beendet = false;
        const ende = erg => {
          if (beendet) return;
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const urteil = (rappen, c) => ende([{ aufgabeKey: a.key, urteil: rappen !== soll ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig', antwort: { rappen }, code: c, ms: stopp(), hilfen }]);

        function legenOberflaeche() {
          const gelegt = [], summe = () => gelegt.reduce((s, w) => s + w, 0);
          const ablage = H('div.geld-stuecke.ablage', { 'aria-label': 'Auf dem Tisch', role: 'group' }), anzeige = H('p.klein.geld-summe');
          const ok = H('button.knopf.primaer.geld-ok', { type: 'button', 'aria-label': 'Bestätigen', disabled: true, onclick: () => { if (!beendet && gelegt.length) urteil(summe(), undefined); } }, 'Fertig');
          const zeichne = () => {
            ablage.replaceChildren(...gelegt.map((w, n) => H('button.geld-stueck.gelegt', { type: 'button', 'data-index': n, 'aria-label': `${name(w)} zurücknehmen`, onclick: () => { gelegt.splice(n, 1); zeichne(); } }, stueck(w))));
            anzeige.textContent = opt.summe === 'sichtbar' ? `Auf dem Tisch: ${text(summe())}` : '';
            if (gelegt.length) ok.removeAttribute('disabled'); else ok.setAttribute('disabled', '');
          };
          const vorrat = WERTE.filter(w => w <= soll).reverse().map(w => H('button.geld-stueck', { type: 'button', 'data-rp': w, 'aria-label': name(w),
            onclick: () => { if (!beendet && gelegt.length < MAX_GELEGT) { gelegt.push(w); zeichne(); } } }, stueck(w)));
          zeichne();
          return H('div.geld-bedienung', H('p.aufgabe', `Lege ${text(soll)}`), H('div.geld-stuecke.vorrat', { role: 'group', 'aria-label': 'Münzen und Noten' }, vorrat), ablage, anzeige, ok);
        }

        function zaehlenOberflaeche() {
          const werte = { fr: '', rp: '' }, stuecke = Array.isArray(a.inhalt.stuecke) ? [...a.inhalt.stuecke].sort((x, y) => y - x) : zerlege(soll);
          let aktiv = 'fr';
          const felder = { fr: H('button.geld-feld', { type: 'button', 'aria-label': 'Franken', onclick: () => waehle('fr') }), rp: H('button.geld-feld', { type: 'button', 'aria-label': 'Rappen', onclick: () => waehle('rp') }) };
          const zeichne = () => {
            for (const k of ['fr', 'rp']) {
              felder[k].replaceChildren(H('span.geld-wert', werte[k] || '–'), H('span.klein', k === 'fr' ? 'Fr.' : 'Rp.'));
              felder[k].setAttribute('class', `geld-feld${aktiv === k ? ' aktiv' : ''}`);
            }
          };
          const tasten = L.ui.tastenfeld({ stellen: 4, nullen: true, onAenderung: w => {
            if (aktiv === 'rp' && w.length > 2) return tasten.setze(w.slice(0, 2));      // Rappen haben höchstens zwei Stellen
            werte[aktiv] = w; zeichne();
          }, onOk: w => {
            werte[aktiv] = w;
            if (aktiv === 'rp' || werte.rp !== '') return bestaetige();
            waehle('rp');
          } });
          function waehle(k) { aktiv = k; tasten.setze(werte[k]); zeichne(); }
          function bestaetige() {
            if (beendet) return;
            const fr = Number(werte.fr), rp = Number(werte.rp);                           // ein leeres Feld zählt als 0
            urteil(fr * 100 + rp, code(soll, fr, rp));
          }
          zeichne();
          return H('div.geld-bedienung', H('p.aufgabe', 'Wie viel Geld ist das?'), H('div.geld-stuecke.vorrat', { role: 'img', 'aria-label': `Geld: ${stuecke.map(name).join(', ')}` }, stuecke.map(w => H('div.geld-stueck', stueck(w)))),
            H('div.geld-eingabe', felder.fr, felder.rp), H('div.eingabe', tasten.el));
        }

        const hm = ctx.modus !== 'simulation' && ctx.hilfe && ctx.hilfe.verfuegbar && a.hilfe && a.hilfe.hilfsmittel;
        const hilfeOrt = H('div.hilfe-ort');
        const hilfsknopf = hm ? H('button.knopf.hilfe', { type: 'button', onclick: () => {
          ctx.hilfe.zeige(hm, hilfeOrt);                               // wirft das Hilfsmittel, zählt die Hilfe nicht
          if (!hilfen.includes(hm.name)) hilfen.push(hm.name);
          hilfsknopf.setAttribute('disabled', '');
        } }, 'Hilfe') : null;
        buehne.replaceChildren(H('div.uebung.uebung-geld', legen ? legenOberflaeche() : zaehlenOberflaeche(), hm ? H('div.hilfe-bereich', hilfsknopf, hilfeOrt) : null));
      });
    }
  });
})(globalThis);
