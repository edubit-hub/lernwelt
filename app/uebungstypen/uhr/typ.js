/* app/uebungstypen/uhr/typ.js: Übungstyp «uhr» (Architektur 5.6, Form «uhrzeit»). Eine analoge Uhr als SVG, in zwei Richtungen.
   einstellen: Das Kind stellt die Zeiger auf eine genannte Zeit (Sprechweise «halb vier» oder digital «3.30 Uhr»), mit dem Finger (Pointer Events,
               touch-action: none) oder mit den Schritt-Knöpfen. Der Stundenzeiger läuft mit den Minuten mit, wie bei einer echten Uhr.
   ablesen:    Die Uhr steht auf einer Zeit, das Kind schreibt Stunde und Minute ins Zahlenfeld.
   Der Typ zeigt genau ein Paket (eine Aufgabe). Rückmeldung und Speichern gehören dem Lauf. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const W = 340, M = 170, MINUS = '−';
  const RICHTUNG = ['gemischt', 'einstellen', 'ablesen'], GENAU = ['5-min', '1-min'], ANZEIGE = ['sprechweise', 'digital'], STUNDEN = ['zwoelf', 'vierundzwanzig'];
  const ZAHL = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf'];
  const ganz = Number.isInteger;
  const stunde = h => ZAHL[((h % 12) + 12) % 12];
  const digital = (h, min) => `${h}.${String(min).padStart(2, '0')} Uhr`;

  /** Schweizer Sprechweise auf fünf Minuten genau, null für die übrigen Minuten. TODO Lehrmittel: 20 und 40 («zwanzig nach», «zehn vor halb») gegen das Lehrmittel der Klasse prüfen. */
  function sprechweise(h, min) {
    const n = stunde(h + 1);
    if (min === 0) return `${h % 12 === 1 ? 'ein' : stunde(h)} Uhr`;
    return { 5: `fünf nach ${stunde(h)}`, 10: `zehn nach ${stunde(h)}`, 15: `Viertel nach ${stunde(h)}`, 20: `zwanzig nach ${stunde(h)}`, 25: `fünf vor halb ${n}`, 30: `halb ${n}`,
             35: `fünf nach halb ${n}`, 40: `zwanzig vor ${n}`, 45: `Viertel vor ${n}`, 50: `zehn vor ${n}`, 55: `fünf vor ${n}` }[min] || null;
  }
  const tageszeit = h => (h < 5 ? 'nachts' : h < 11 ? 'morgens' : h < 14 ? 'mittags' : h < 18 ? 'nachmittags' : h < 22 ? 'abends' : 'nachts');

  /** Fehlercode, wenn der Fehler typisch ist (undefiniert sonst, dann diagnostiziert der Generator des Moduls). soll {h, min}, h12 und min stehen auf der Uhr. */
  function code(soll, h12, min) {
    const s = soll.h % 12;
    if (soll.min % 5 === 0 && h12 === (soll.min / 5) % 12 && min === s * 5) return 'zeiger-vertauscht';
    if (min === soll.min && h12 === (s + 1) % 12 && soll.min >= 25) return 'stunde-ab-halb';
    if (min === soll.min && (h12 === (s + 1) % 12 || h12 === (s + 11) % 12)) return 'stunde-daneben';
    if (h12 === s && min !== soll.min && (min + soll.min) % 60 === 0) return 'vor-nach-vertauscht';
    return undefined;
  }

  const svgEl = (name, attribute, text) => {
    const e = document.createElementNS ? document.createElementNS(NS, name) : document.createElement(name);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = String(text);
    return e;
  };
  const polar = (grad, r) => [(M + r * Math.sin(grad * Math.PI / 180)).toFixed(1), (M - r * Math.cos(grad * Math.PI / 180)).toFixed(1)];

  /** Zifferblatt mit zwei Zeigern. Gibt { svg, stundenzeiger, minutenzeiger, stelle(h12, min) } zurück. */
  function zifferblatt(einstellbar) {
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${W}`, class: `uhr-flaeche${einstellbar ? ' einstellbar' : ''}`, role: 'group', 'aria-label': 'Analoge Uhr' });
    svg.append(svgEl('circle', { cx: M, cy: M, r: 136, class: 'uhr-rand' }));
    for (let m = 0; m < 60; m++) {
      const [x1, y1] = polar(m * 6, m % 5 === 0 ? 118 : 126), [x2, y2] = polar(m * 6, 132);
      svg.append(svgEl('line', { x1, y1, x2, y2, class: m % 5 === 0 ? 'uhr-strich gross' : 'uhr-strich' }));
      if (m % 5 === 0) {
        const [zx, zy] = polar(m * 6, 98), [mx, my] = polar(m * 6, 153);
        svg.append(svgEl('text', { x: zx, y: Number(zy) + 10, class: 'uhr-zahl' }, m === 0 ? 12 : m / 5), svgEl('text', { x: mx, y: Number(my) + 5, class: 'uhr-minute' }, m === 0 ? 60 : m));
      }
    }
    const zeiger = (art, laenge, name) => {
      const z = svgEl('g', { class: `uhr-zeiger ${art}`, ...(einstellbar ? { role: 'slider', 'aria-label': name, 'aria-valuemin': 0 } : {}) });
      z.append(svgEl('line', { x1: M, y1: M, x2: M, y2: M - laenge, class: 'uhr-arm' }));
      if (einstellbar) z.append(svgEl('circle', { cx: M, cy: M - laenge, r: 13, class: 'uhr-knauf' }));
      return z;
    };
    const stundenzeiger = zeiger('stunde', 66, 'Stundenzeiger'), minutenzeiger = zeiger('minute', 104, 'Minutenzeiger');
    svg.append(stundenzeiger, minutenzeiger, svgEl('circle', { cx: M, cy: M, r: 7, class: 'uhr-mitte' }));
    const stelle = (h12, min) => {
      stundenzeiger.setAttribute('transform', `rotate(${h12 * 30 + min * 0.5} ${M} ${M})`);
      minutenzeiger.setAttribute('transform', `rotate(${min * 6} ${M} ${M})`);
      if (!einstellbar) return;
      stundenzeiger.setAttribute('aria-valuenow', h12); stundenzeiger.setAttribute('aria-valuemax', 11);
      minutenzeiger.setAttribute('aria-valuenow', min); minutenzeiger.setAttribute('aria-valuemax', 59);
    };
    return { svg, stelle };
  }

  L.uebungstyp('uhr', {
    titel: 'Uhr einstellen und ablesen',
    eigenschaften: { akzeptiert: ['uhrzeit'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 6 },
    optionen: {
      richtung: { art: 'wahl', werte: RICHTUNG, standard: 'gemischt' },
      genauigkeit: { art: 'wahl', werte: GENAU, standard: '5-min' },
      anzeige: { art: 'wahl', werte: ANZEIGE, standard: 'sprechweise' },
      stunden: { art: 'wahl', werte: STUNDEN, standard: 'zwoelf' }
    },
    beispiel: { aufgaben: [
      { key: 'bsp/u330', id: 'u330', form: 'uhrzeit', inhalt: { h: 3, min: 30 } },
      { key: 'bsp/u1545', id: 'u1545', form: 'uhrzeit', inhalt: { h: 15, min: 45 } },
      { key: 'bsp/u700', id: 'u700', form: 'uhrzeit', inhalt: { h: 7, min: 0 } }], optionen: {} },

    pruefeAufgabe(a, o) {
      const i = (a && a.inhalt) || {}, f = [];
      if (!(ganz(i.h) && i.h >= 0 && i.h <= 23 && ganz(i.min) && i.min >= 0 && i.min <= 59)) return ['h (0 bis 23) und min (0 bis 59) müssen ganze Zahlen sein'];
      if (!(o && o.genauigkeit === '1-min') && i.min % 5 !== 0) f.push('min ist kein Vielfaches von 5, dafür braucht es die Option genauigkeit «1-min»');
      if (i.text !== undefined && (typeof i.text !== 'string' || i.text === '')) f.push('text ist kein Text');
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [], opt = ctx.optionen || {}, { h, min } = a.inhalt;
      if (signal.aborted) return Promise.resolve([]);
      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();
        const gerade = [...String(a.key)].reduce((s, c) => s + c.charCodeAt(0), 0) % 2 === 0;
        const einstellen = opt.richtung === 'einstellen' || (opt.richtung !== 'ablesen' && gerade), schritt = opt.genauigkeit === '1-min' ? 1 : 5;
        let beendet = false;
        const ende = erg => {
          if (beendet) return;
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const uhr = zifferblatt(einstellen), urteil = (richtig, h12, m) => ende([{ aufgabeKey: a.key, urteil: !richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig',
          antwort: { h: richtig ? h : h12, min: m }, code: richtig ? undefined : code(a.inhalt, h12 % 12, m), ms: stopp(), hilfen }]);
        const bedienung = einstellen ? einstellenOberflaeche() : ablesenOberflaeche();

        function einstellenOberflaeche() {
          let h12 = 0, m = 0, beruehrt = false, zieht = null, ziehe = null;
          uhr.stelle(h12, m);
          const ok = H('button.knopf.primaer.uhr-ok', { type: 'button', 'aria-label': 'Bestätigen', disabled: true, onclick: () => { if (!beendet && beruehrt) urteil(h12 === h % 12 && m === min, h12, m); } }, 'Fertig');
          const stelle = (nh, nm) => {
            if (beendet) return;
            h12 = ((nh % 12) + 12) % 12; m = ((nm % 60) + 60) % 60; beruehrt = true;
            uhr.stelle(h12, m);
            ok.removeAttribute('disabled');
          };
          const lage = e => {
            const r = uhr.svg.getBoundingClientRect && uhr.svg.getBoundingClientRect();
            if (!r || !(r.width > 0)) return null;
            const x = (e.clientX - r.left) / r.width * W - M, y = (e.clientY - r.top) / r.width * W - M;
            return { grad: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, abstand: Math.hypot(x, y) };
          };
          const bewege = p => { if (p) ziehe === 'minute' ? stelle(h12, Math.round(p.grad / (6 * schritt)) * schritt) : stelle(Math.round((p.grad - m * 0.5) / 30), m); };
          uhr.svg.addEventListener('pointerdown', e => {
            if (beendet) return;
            const p = lage(e);
            if (!p) return;
            ziehe = p.abstand > 80 ? 'minute' : 'stunde';              // aussen der Minutenzeiger, innen der Stundenzeiger
            zieht = e.pointerId === undefined ? 0 : e.pointerId;
            try { uhr.svg.setPointerCapture(zieht); } catch (fehler) { /* ohne Capture folgt der Zeiger dem Finger nur auf der Uhr, das genügt */ }
            bewege(p);
          });
          uhr.svg.addEventListener('pointermove', e => { if (zieht !== null) bewege(lage(e)); });
          for (const art of ['pointerup', 'pointercancel', 'lostpointercapture']) uhr.svg.addEventListener(art, () => { zieht = null; });
          const knopf = (name, art, d) => H('button.knopf.uhr-schritt', { type: 'button', 'data-art': art, 'data-delta': d, 'aria-label': `${name} ${d < 0 ? 'zurück' : 'vor'}`,
            onclick: () => (art === 'stunde' ? stelle(h12 + d, m) : stelle(h12, m + d)) }, `${d < 0 ? MINUS : '+'}${Math.abs(d)}`);
          const minuten = schritt === 1 ? [-5, -1, 1, 5] : [-5, 5];
          const text = opt.anzeige === 'digital' ? digital(h, min) : a.inhalt.text || sprechweise(h, min) || digital(h, min);   // text im Inhalt ersetzt die erzeugte Sprechweise
          return H('div.uhr-bedienung', H('p.aufgabe', `Stelle die Uhr auf ${text}.`),
            H('div.uhr-gruppe', { role: 'group', 'aria-label': 'Stunden' }, H('span.klein', 'Stunde'), knopf('Stunde', 'stunde', -1), knopf('Stunde', 'stunde', 1)),
            H('div.uhr-gruppe', { role: 'group', 'aria-label': 'Minuten' }, H('span.klein', 'Minute'), minuten.map(d => knopf('Minute', 'minute', d))), ok);
        }

        function ablesenOberflaeche() {
          const werte = { h: '', min: '' }, vollTag = opt.stunden === 'vierundzwanzig';
          let aktiv = 'h';
          uhr.stelle(h % 12, min);
          const felder = { h: H('button.uhr-feld', { type: 'button', 'aria-label': 'Stunde', onclick: () => waehle('h') }), min: H('button.uhr-feld', { type: 'button', 'aria-label': 'Minute', onclick: () => waehle('min') }) };
          const zeichne = () => {
            for (const k of ['h', 'min']) {
              felder[k].replaceChildren(H('span.uhr-wert', werte[k] || '–'), H('span.klein', k === 'h' ? 'Stunde' : 'Minute'));
              felder[k].setAttribute('class', `uhr-feld${aktiv === k ? ' aktiv' : ''}`);
            }
          };
          const tasten = L.ui.tastenfeld({ stellen: 2, nullen: true, onAenderung: w => { werte[aktiv] = w; zeichne(); }, onOk: w => {
            werte[aktiv] = w;
            if (werte.h !== '' && werte.min !== '') return bestaetige();
            waehle(werte.h === '' ? 'h' : 'min');
          } });
          function waehle(k) { aktiv = k; tasten.setze(werte[k]); zeichne(); }
          function bestaetige() {
            if (beendet) return;
            const eh = Number(werte.h), em = Number(werte.min);
            urteil(em === min && (vollTag ? eh === h : eh % 12 === h % 12) && em < 60, eh, em);
          }
          zeichne();
          return H('div.uhr-bedienung', H('p.aufgabe', 'Wie spät ist es?'), vollTag ? H('p.klein', `Es ist ${tageszeit(h)}. Schreibe die Zeit mit 24 Stunden.`) : null,
            H('div.uhr-eingabe', felder.h, H('span.uhr-punkt', '.'), felder.min, H('span.uhr-punkt', 'Uhr')), H('div.eingabe', tasten.el));
        }

        const hm = ctx.modus !== 'simulation' && ctx.hilfe && ctx.hilfe.verfuegbar && a.hilfe && a.hilfe.hilfsmittel;
        const hilfeOrt = H('div.hilfe-ort');
        const hilfsknopf = hm ? H('button.knopf.hilfe', { type: 'button', onclick: () => {
          ctx.hilfe.zeige(hm, hilfeOrt);                               // wirft das Hilfsmittel, zählt die Hilfe nicht
          if (!hilfen.includes(hm.name)) hilfen.push(hm.name);
          hilfsknopf.setAttribute('disabled', '');
        } }, 'Hilfe') : null;
        buehne.replaceChildren(H('div.uebung.uebung-uhr', uhr.svg, bedienung, hm ? H('div.hilfe-bereich', hilfsknopf, hilfeOrt) : null));
      });
    }
  });
})(globalThis);
