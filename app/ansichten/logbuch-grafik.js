/* app/ansichten/logbuch-grafik.js: die Minidiagramme des Logbuchs als SVG-Text (Architektur 7.8, Mockup docs/mockup/siedlung.html, AP-16). Kein DOM.
   Sieben Tage, ein Wert je Tag: saeulen() für Mengen, linie() für Prozentwerte mit Lücken (ein Tag ohne Aufgaben hat keinen Punkt). Farben stehen nur als Klassen im Text
   (welt-ansichten.css, Token aus tokens.css). Jede Gruppe trägt data-txt (der Text zur Ablesung) und aria-label, sie ist mit der Tastatur erreichbar.
   reihe: [{ kurz, wert, txt }] mit wert null für «kein Wert». */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const Y0 = 52, HMAX = 40, SCHRITT = 28;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const r1 = n => Math.round(n * 10) / 10;
  const svg = (titel, inner) => `<svg class="lg-svg" viewBox="0 0 200 66" role="group" aria-label="${esc(titel)}">${inner}<line class="lg-achse" x1="0" x2="200" y1="${Y0 + 0.5}" y2="${Y0 + 0.5}"/></svg>`;
  const beschriftung = (x, text, heute) => `<text class="${heute ? 'heute' : ''}" x="${x}" y="64" text-anchor="middle">${esc(heute ? L.Texte.welt.heute : text)}</text>`;
  const gruppe = (r, heute, inhalt, x) => `<g class="saeule${heute ? ' heute' : ''}" tabindex="0" role="img" aria-label="${esc(r.txt)}" data-txt="${esc(r.txt)}"><rect class="lg-flaeche" x="${r1(x - 14)}" y="0" width="28" height="66"/>${inhalt}</g>`;

  /** Säulen. max: die Skala reicht mindestens bis dahin (so bleiben die Wochen vergleichbar). */
  function saeulen(titel, reihe, max = 1) {
    const hoechst = Math.max(max, ...reihe.map(r => r.wert || 0), 1);
    return svg(titel, reihe.map((r, i) => {
      const x = 4 + i * SCHRITT, bw = 20, mitte = x + bw / 2, heute = i === reihe.length - 1, wert = r.wert || 0;
      const h = wert > 0 ? Math.max(5, Math.round(wert / hoechst * HMAX)) : 0, top = Y0 - h;
      return gruppe(r, heute, (wert > 0 ? `<path class="s" d="M${x} ${Y0}V${top + 4}Q${x} ${top} ${x + 4} ${top}H${x + bw - 4}Q${x + bw} ${top} ${x + bw} ${top + 4}V${Y0}Z"/>` : '') +
        (heute ? `<text class="wert" x="${mitte}" y="${Math.max(10, top - 5)}" text-anchor="middle">${wert}</text>` : '') + beschriftung(mitte, r.kurz, heute), mitte);
    }).join(''));
  }

  /** Linie durch die Tage mit Wert. Die Skala beginnt unter dem kleinsten Wert (auf Zehner abgerundet) und endet bei 100. */
  function linie(titel, reihe) {
    const werte = reihe.map(r => r.wert).filter(w => w !== null), lo = werte.length ? Math.max(0, Math.floor((Math.min(...werte) - 10) / 10) * 10) : 0, hi = 100;
    const pt = reihe.map((r, i) => (r.wert === null ? null : { r, i, x: 14 + i * SCHRITT, y: r1(Y0 - (r.wert - lo) / (hi - lo) * HMAX) })).filter(Boolean);
    const weg = pt.map(p => `${p.x} ${p.y}`).join('L');
    const flaeche = pt.length ? `<path class="lg-flaeche-linie" d="M${weg}L${pt[pt.length - 1].x} ${Y0}L${pt[0].x} ${Y0}Z"/><path class="lg-linie" d="M${weg}"/>` : '';
    const punkte = pt.map(p => { const heute = p.i === reihe.length - 1; return gruppe(p.r, heute, `<circle class="lg-punkt" cx="${p.x}" cy="${p.y}" r="${heute ? 5 : 3.5}"/>` +
      (heute ? `<text class="wert" x="${p.x}" y="${r1(p.y - 10)}" text-anchor="end">${p.r.wert}</text>` : ''), p.x); }).join('');
    return svg(titel, flaeche + punkte + reihe.map((r, i) => beschriftung(14 + i * SCHRITT, r.kurz, i === reihe.length - 1)).join(''));
  }

  L.LogbuchGrafik = { saeulen, linie, esc };
})(globalThis);
