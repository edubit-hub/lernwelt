/* app/uebungstypen/zahlenstrahl/typ.js: Übungstyp «zahlenstrahl» (Architektur 5.6, Form «position»). Das Kind setzt eine Marke auf die genannte Zahl.
   Es liest dazu den Skalenwert an den beschrifteten Strichen und zählt keine Striche. Die Marke lässt sich mit dem Finger ziehen (Pointer Events,
   touch-action: none) oder mit den Schritt-Knöpfen setzen. Der Wert der Marke steht nirgends als Zahl auf dem Bildschirm, nur als aria-valuenow.
   Der Typ zeigt genau ein Paket (eine Aufgabe) und meldet Urteil, Antwort und Zeit. Rückmeldung und Speichern gehören dem Lauf. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const B = 1000, RAND = 50, Y = 84, HOEHE = 150, MAX_BEREICH = 100000, MINUS = '−';
  const GROSS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const BESCHRIFTUNG = ['alle', 'enden'];
  const ganz = Number.isInteger;

  /** Grosse Schrittweite (beschriftet, höchstens 12 Abschnitte) und kleine (Striche). Dieselbe Teilung zeichnet das Hilfsmittel «zahlenstrahl». */
  function teilung(von, bis) {
    const gross = GROSS.find(s => (bis - von) / s <= 12) || GROSS[GROSS.length - 1], anfang = Number(String(gross)[0]);
    return { gross, klein: gross === 1 ? 1 : gross / (anfang === 1 ? 10 : anfang) };
  }
  const ort = (w, von, bis) => RAND + (w - von) / (bis - von) * (B - 2 * RAND);

  /** SVG-Element. Die Mini-DOM-Attrappe der Tests kennt createElementNS, ältere Attrappen nur createElement. */
  function svgEl(name, attribute, text) {
    const e = document.createElementNS ? document.createElementNS(NS, name) : document.createElement(name);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = String(text);
    return e;
  }

  /** Achse, Striche und Zahlen. beschriftung «enden» beschriftet nur den Anfang und das Ende. */
  function zeichneSkala(svg, von, bis, gross, klein, beschriftung) {
    let fein = '', grob = '';
    const zahlen = [];
    for (let w = von; w <= bis; w += klein) {
      const x = ort(w, von, bis).toFixed(1);
      if (w % gross === 0 || w === von || w === bis) { grob += `M${x} ${Y - 18}V${Y + 18}`; if (beschriftung === 'alle' || w === von || w === bis) zahlen.push([w, x]); }
      else fein += `M${x} ${Y - 9}V${Y + 9}`;
    }
    svg.append(svgEl('line', { x1: RAND - 14, x2: B - RAND + 14, y1: Y, y2: Y, class: 'zs-achse' }), svgEl('path', { d: fein, class: 'zs-fein' }), svgEl('path', { d: grob, class: 'zs-grob' }));
    for (const [w, x] of zahlen) svg.append(svgEl('text', { x, y: Y + 54, class: 'zs-zahl' }, w));
  }

  L.uebungstyp('zahlenstrahl', {
    titel: 'Zahl am Zahlenstrahl setzen',
    eigenschaften: { akzeptiert: ['position'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 5 },
    optionen: { beschriftung: { art: 'wahl', werte: BESCHRIFTUNG, standard: 'alle' } },
    beispiel: { aufgaben: [{ key: 'bsp/zs340', id: 'zs340', form: 'position', inhalt: { zahl: 340, von: 300, bis: 400, toleranz: 0 } }], optionen: {} },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (![i.zahl, i.von, i.bis].every(ganz)) return ['zahl, von und bis müssen ganze Zahlen sein'];
      if (i.von >= i.bis || i.bis - i.von > MAX_BEREICH) return [`von muss kleiner sein als bis, höchstens ${MAX_BEREICH} auseinander`];
      const { klein } = teilung(i.von, i.bis), tol = typeof i.toleranz === 'number' ? i.toleranz : 0;
      if (i.von % klein !== 0 || i.bis % klein !== 0) f.push(`von und bis müssen auf einem Strich liegen (Schrittweite ${klein})`);
      if (Math.abs(Math.round(i.zahl / klein) * klein - i.zahl) > tol) f.push(`zahl liegt zwischen zwei Strichen (Schrittweite ${klein}) und die toleranz reicht nicht bis zum nächsten`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [], { zahl, von, bis } = a.inhalt, tol = a.inhalt.toleranz || 0;
      if (signal.aborted) return Promise.resolve([]);
      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();
        const { gross, klein } = teilung(von, bis), beschriftung = (ctx.optionen && ctx.optionen.beschriftung) || 'alle';
        let beendet = false, wert = von, beruehrt = false, zieht = null;
        const ende = erg => {
          if (beendet) return;
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        const svg = svgEl('svg', { viewBox: `0 0 ${B} ${HOEHE}`, class: 'zs-flaeche', role: 'group', 'aria-label': `Zahlenstrahl von ${von} bis ${bis}` });
        zeichneSkala(svg, von, bis, gross, klein, beschriftung);
        const marke = svgEl('g', { class: 'zs-marke aus', role: 'slider', tabindex: 0, 'aria-label': 'Marke', 'aria-valuemin': von, 'aria-valuemax': bis, 'aria-valuenow': von });   // bis zur ersten Berührung unsichtbar
        marke.append(svgEl('line', { x1: 0, x2: 0, y1: Y - 46, y2: Y, class: 'zs-stiel' }), svgEl('circle', { cx: 0, cy: Y, r: 13, class: 'zs-kopf' }));
        svg.append(marke);
        const ok = H('button.knopf.primaer.zs-ok', { type: 'button', 'aria-label': 'Bestätigen', disabled: true, onclick: bestaetige }, 'Fertig');

        function setze(neu) {
          if (beendet || neu === null || !Number.isFinite(neu)) return;
          wert = Math.min(bis, Math.max(von, neu));
          beruehrt = true;
          marke.setAttribute('class', 'zs-marke');
          marke.setAttribute('transform', `translate(${ort(wert, von, bis).toFixed(1)} 0)`);
          marke.setAttribute('aria-valuenow', wert);
          ok.removeAttribute('disabled');
        }
        function bestaetige() {
          if (beendet || !beruehrt) return;
          const richtig = Math.abs(wert - zahl) <= tol;
          ende([{ aufgabeKey: a.key, urteil: !richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig', antwort: { zahl: wert }, ms: stopp(), hilfen }]);
        }
        const einrasten = e => {                                       // x des Fingers → nächster Strich der kleinen Schrittweite
          const r = svg.getBoundingClientRect && svg.getBoundingClientRect();
          if (!r || !(r.width > 0)) return null;
          const roh = von + ((e.clientX - r.left) / r.width * B - RAND) / (B - 2 * RAND) * (bis - von);
          return von + Math.round((roh - von) / klein) * klein;
        };
        svg.addEventListener('pointerdown', e => {
          if (beendet) return;
          zieht = e.pointerId === undefined ? 0 : e.pointerId;
          try { svg.setPointerCapture(zieht); } catch (fehler) { /* ohne Capture folgt die Marke dem Finger nur auf dem Strahl, das genügt */ }
          setze(einrasten(e));
        });
        svg.addEventListener('pointermove', e => { if (zieht !== null) setze(einrasten(e)); });
        for (const art of ['pointerup', 'pointercancel', 'lostpointercapture']) svg.addEventListener(art, () => { zieht = null; });
        marke.addEventListener('keydown', e => {
          const d = { ArrowLeft: -klein, ArrowDown: -klein, ArrowRight: klein, ArrowUp: klein, PageDown: -gross, PageUp: gross }[e.key];
          if (d) setze(wert + d);
        });

        const schritt = d => H('button.knopf.zs-schritt', { type: 'button', 'data-delta': d, 'aria-label': `${Math.abs(d)} nach ${d < 0 ? 'links' : 'rechts'}`,
          onclick: () => setze(wert + d) }, (d < 0 ? MINUS : '+') + Math.abs(d));
        const schritte = [-gross, -klein, klein, gross].filter((d, n, alle) => alle.indexOf(d) === n);   // bei gross gleich klein nur zwei Knöpfe

        const hm = ctx.modus !== 'simulation' && ctx.hilfe && ctx.hilfe.verfuegbar && a.hilfe && a.hilfe.hilfsmittel;
        const hilfeOrt = H('div.hilfe-ort');
        const hilfsknopf = hm ? H('button.knopf.hilfe', { type: 'button', onclick: () => {
          ctx.hilfe.zeige(hm, hilfeOrt);                               // wirft das Hilfsmittel, zählt die Hilfe nicht
          if (!hilfen.includes(hm.name)) hilfen.push(hm.name);
          hilfsknopf.setAttribute('disabled', '');
        } }, 'Hilfe') : null;

        buehne.replaceChildren(H('div.uebung.uebung-zahlenstrahl',
          H('p.aufgabe', `Setze die Marke auf ${zahl}.`),
          svg,
          H('div.zs-schritte', { role: 'group', 'aria-label': 'Marke verschieben' }, schritte.map(schritt), ok),
          hm ? H('div.hilfe-bereich', hilfsknopf, hilfeOrt) : null));
      });
    }
  });
})(globalThis);
