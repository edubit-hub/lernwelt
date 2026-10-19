/* app/ansichten/logbuch-grafik.js: die Minidiagramme und Bilder des Logbuchs als SVG-Text (Architektur 7.8, docs/gestaltung-umbau.md 2.12, AP-16). Kein DOM.
   Sieben Tage, ein Wert je Tag: saeulen() für Mengen, linie() für Prozentwerte mit Lücken (ein Tag ohne Aufgaben hat keinen Punkt). Die sieben Tage davor
   stehen leise mit im Bild (vor: je Tag eine gestrichelte Marke .v auf ihrer Höhe bzw. die Linie .lg-vor), damit der Vergleich mit sich selbst sichtbar ist. Farben stehen nur als Klassen
   im Text (logbuch.css, Token aus tokens.css). Jede Gruppe trägt data-txt (der Text zur Ablesung) und aria-label, sie ist mit der Tastatur erreichbar.
   reihe: [{ kurz, wert, txt }] mit wert null für «kein Wert». fund(bild, { breite, hoehe, leer }) zeichnet ein Sammlungsstück aus seiner Formenliste (Iso.bild),
   ohne Bild ein ruhiges Platzhalter-Objekt (Iso.objekt). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const Y0 = 52, HMAX = 40, SCHRITT = 28;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const r1 = n => Math.round(n * 10) / 10;
  const svg = (titel, inner) => `<svg class="lg-svg" viewBox="0 0 200 66" role="group" aria-label="${esc(titel)}">${inner}<line class="lg-achse" x1="0" x2="200" y1="${Y0 + 0.5}" y2="${Y0 + 0.5}"/></svg>`;
  const beschriftung = (x, text, heute) => `<text class="${heute ? 'heute' : ''}" x="${x}" y="64" text-anchor="middle">${esc(heute ? L.Texte.welt.heute : text)}</text>`;
  const gruppe = (r, heute, inhalt, x) => `<g class="saeule${heute ? ' heute' : ''}" tabindex="0" role="img" aria-label="${esc(r.txt)}" data-txt="${esc(r.txt)}"><rect class="lg-flaeche" x="${r1(x - 14)}" y="0" width="28" height="66"/>${inhalt}</g>`;
  const balken = (klasse, x, bw, top) => `<path class="${klasse}" d="M${x} ${Y0}V${top + 4}Q${x} ${top} ${x + 4} ${top}H${x + bw - 4}Q${x + bw} ${top} ${x + bw} ${top + 4}V${Y0}Z"/>`;

  /** Säulen. max: die Skala reicht mindestens bis dahin (so bleiben die Wochen vergleichbar). vor: die Werte der sieben Tage davor als gestrichelte Marken. */
  function saeulen(titel, reihe, max = 1, vor = []) {
    const hoechst = Math.max(max, ...reihe.map(r => r.wert || 0), ...vor.map(v => v || 0), 1), hoehe = w => (w > 0 ? Math.max(5, Math.round(w / hoechst * HMAX)) : 0);
    const marke = (v, i) => { const x = 4 + i * SCHRITT, y = Y0 - hoehe(v); return `<path class="v" d="M${x - 2} ${y}H${x + 22}"/>`; };
    const leise = vor.length ? `<g class="lg-vor-saeulen" aria-hidden="true">${vor.map((v, i) => (v > 0 ? marke(v, i) : '')).join('')}</g>` : '';
    return svg(titel, reihe.map((r, i) => {
      const x = 4 + i * SCHRITT, bw = 20, mitte = x + bw / 2, heute = i === reihe.length - 1, wert = r.wert || 0, h = hoehe(wert), top = Y0 - h;
      return gruppe(r, heute, (wert > 0 ? balken('s', x, bw, top) : '') +
        (heute && wert > 0 ? `<text class="wert" x="${mitte}" y="${Math.max(10, top - 5)}" text-anchor="middle">${wert}</text>` : '') + beschriftung(mitte, r.kurz, heute), mitte);
    }).join('') + leise);
  }

  /** Linie durch die Tage mit Wert. Die Skala beginnt unter dem kleinsten Wert (auf Zehner abgerundet) und endet bei 100. vor: die Linie der sieben Tage davor, gestrichelt. */
  function linie(titel, reihe, vor = []) {
    const werte = [...reihe.map(r => r.wert), ...vor].filter(w => w !== null && w !== undefined), lo = werte.length ? Math.max(0, Math.floor((Math.min(...werte) - 10) / 10) * 10) : 0, hi = 100;
    const y = w => r1(Y0 - (w - lo) / (hi - lo) * HMAX);
    const pt = reihe.map((r, i) => (r.wert === null ? null : { r, i, x: 14 + i * SCHRITT, y: y(r.wert) })).filter(Boolean);
    const pv = vor.map((w, i) => (w === null || w === undefined ? null : `${14 + i * SCHRITT} ${y(w)}`)).filter(Boolean);
    const weg = pt.map(p => `${p.x} ${p.y}`).join('L');
    const leise = pv.length > 1 ? `<path class="lg-vor" aria-hidden="true" d="M${pv.join('L')}"/>` : '';
    const flaeche = pt.length ? `<path class="lg-flaeche-linie" d="M${weg}L${pt[pt.length - 1].x} ${Y0}L${pt[0].x} ${Y0}Z"/><path class="lg-linie" d="M${weg}"/>` : '';
    const punkte = pt.map(p => { const heute = p.i === reihe.length - 1; return gruppe(p.r, heute, `<circle class="lg-punkt" cx="${p.x}" cy="${p.y}" r="${heute ? 5 : 3.5}"/>` +
      (heute ? `<text class="wert" x="${p.x}" y="${r1(p.y - 10)}" text-anchor="end">${p.r.wert}</text>` : ''), p.x); }).join('');
    return svg(titel, leise + flaeche + punkte + reihe.map((r, i) => beschriftung(14 + i * SCHRITT, r.kurz, i === reihe.length - 1)).join(''));
  }

  /** Ein Sammlungsstück als kleines Iso-Bild im Seitenverhältnis breite zu hoehe. leer: noch nicht gefunden (nur blass). Ohne Bild oder ohne Bausatz das Platzhalter-Objekt. */
  function fund(bild, opt = {}) {
    const I = L.Iso, bw = opt.breite || 96, bh = opt.hoehe || 72, klasse = `fund-svg${opt.leer ? ' umriss' : ''}`;
    const platzhalter = () => (I && I.objekt ? I.objekt('fundstueck', { groesse: Math.min(bw, bh), leer: !!opt.leer, klasse }) : '');
    if (!Array.isArray(bild) || !bild.length || !I || !I.bild || !I.masse || !I.punkt) return platzhalter();
    const pal = L.Render && typeof L.Render.lesePalette === 'function' ? L.Render.lesePalette() : null, m = I.masse(bild), P = I.punkt, rand = 14;
    const x0 = P(m.x0, m.y1, 0)[0] - rand, x1 = P(m.x1, m.y0, 0)[0] + rand, y0 = P(m.x0, m.y0, m.h)[1] - rand, y1 = P(m.x1, m.y1, 0)[1] + rand;
    const w = x1 - x0, h = y1 - y0, k = Math.max(w / bw, h / bh), box = [x0 - (bw * k - w) / 2, y0 - (bh * k - h) / 2, bw * k, bh * k].map(r1).join(' ');
    const inhalt = I.bild(bild, { palette: pal });
    return inhalt ? `<svg class="${klasse}" viewBox="${box}" width="${bw}" height="${bh}" aria-hidden="true" focusable="false">${inhalt}</svg>` : platzhalter();
  }

  L.LogbuchGrafik = { saeulen, linie, fund, esc };
})(globalThis);
