/* app/welt/iso-formen.js: weitere Formen und Symbole des Bausatzes (Architektur 7.7), Teil von iso.js. Die Formen melden sich in Iso.formen an,
   Iso.bild() findet sie dort: zylinder, kuppel, kegel, kugel, uhr, fahne, schale, rauch, linie. Kein DOM, keine Gesichter.
   Radien r von zylinder, kuppel und kegel stehen in Rasterzellen, der Radius einer kugel in Pixeln.
   Iso.symbol(name) liefert ein Linien-Symbol (24 x 24, Strich 1,5) für Rohstoffe und Güter: stein, holz (ein Stamm mit Jahresringen), handelsgut, proben, ziegel, balken, wuerfel.
   Die Füllungen nehmen die Farben des Themas über CSS-Variablen (tokens.css), ein unbekannter Name ergibt den Würfel. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const I = (L.Iso = L.Iso || {});
  const f = n => Math.round(n * 10) / 10;
  const RX = 90.5, RY = 45.25;                               // Halbachsen eines Kreises mit Radius 1 Zelle auf dem Boden

  function zylinder(a, pal) {
    const c = pal.drei(a.farbe), o = I.punkt(a.cx, a.cy, a.z || 0), rx = RX * a.r, ry = RY * a.r, yb = o[1], yt = yb - a.h * I.HE, x = o[0];
    const seite = (xs, aus, fill) => `<path d="M${f(xs)} ${f(yt)}V${f(yb)}A${f(rx)} ${f(ry)} 0 0 ${aus} ${f(x)} ${f(yb + ry)}V${f(yt + ry)}A${f(rx)} ${f(ry)} 0 0 ${1 - aus} ${f(xs)} ${f(yt)}Z" fill="${fill}" stroke="${fill}" stroke-width=".7"/>`;
    return seite(x - rx, 0, c.l) + seite(x + rx, 1, c.r) + `<ellipse cx="${f(x)}" cy="${f(yt)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c.o}"/>`;
  }
  function kuppel(a, pal) {
    const c = pal.drei(a.farbe), o = I.punkt(a.cx, a.cy, a.z || 0), rx = RX * a.r, ry = RY * a.r, rh = a.h * I.HE, x = o[0], y = o[1];
    const A = (r1, r2, s) => `A${f(r1)} ${f(r2)} 0 0 ${s} `;
    return `<path d="M${f(x)} ${f(y - rh)}${A(rx, rh, 0)}${f(x - rx)} ${f(y)}${A(rx, ry, 0)}${f(x)} ${f(y + ry)}Z" fill="${c.l}" stroke="${c.l}" stroke-width=".7"/>` +
      `<path d="M${f(x)} ${f(y - rh)}${A(rx, rh, 1)}${f(x + rx)} ${f(y)}${A(rx, ry, 1)}${f(x)} ${f(y + ry)}Z" fill="${c.r}" stroke="${c.r}" stroke-width=".7"/>` +
      `<ellipse cx="${f(x - rx * .3)}" cy="${f(y - rh * .62)}" rx="${f(rx * .34)}" ry="${f(rh * .2)}" fill="${c.o}" opacity=".85"/>`;
  }
  function kegel(a, pal) {                                   // Tannenstufe
    const c = pal.drei(a.farbe), o = I.punkt(a.cx, a.cy, a.z || 0), rx = RX * a.r, ry = RY * a.r, x = o[0], yb = o[1], ya = yb - a.h * I.HE;
    const halb = (xs, s, fill) => `<path d="M${f(x)} ${f(ya)}L${f(xs)} ${f(yb)}A${f(rx)} ${f(ry)} 0 0 ${s} ${f(x)} ${f(yb + ry)}Z" fill="${fill}" stroke="${fill}" stroke-width=".7" stroke-linejoin="round"/>`;
    return halb(x - rx, 0, c.l) + halb(x + rx, 1, c.r);
  }
  function kugel(a, pal) {                                   // Laubkrone oder Busch, r in Pixeln
    const c = pal.drei(a.farbe), o = I.punkt(a.cx, a.cy, a.z || 0), x = o[0], y = o[1], r = a.r;
    return `<path d="M${f(x)} ${f(y - r)}A${r} ${r} 0 0 0 ${f(x)} ${f(y + r)}Z" fill="${c.l}"/>` +
      `<path d="M${f(x)} ${f(y - r)}A${r} ${r} 0 0 1 ${f(x)} ${f(y + r)}Z" fill="${c.r}"/>` +
      `<ellipse cx="${f(x - r * .28)}" cy="${f(y - r * .42)}" rx="${f(r * .45)}" ry="${f(r * .3)}" fill="${c.o}" opacity=".9"/>`;
  }
  function uhr(a, pal, q) {                                  // Zifferblatt auf einer Quaderseite: an, s, z, r. Zeiger, kein Gesicht
    if (!q) return '';
    const tinte = pal.tinte, blatt = pal.hole('papier', 'kalk', 'flaeche');
    return `<g transform="${I.seite(q, a.an)}"><circle cx="${a.s}" cy="${a.z}" r="${a.r}" fill="${blatt}"/><circle cx="${a.s}" cy="${a.z}" r="${a.r}" fill="none" stroke="${tinte}" stroke-width=".03"/>` +
      `<path d="M${a.s} ${a.z + a.r * .6}V${a.z}h${a.r * .45}" stroke="${tinte}" stroke-width=".035" fill="none" stroke-linecap="round"/></g>`;
  }
  const mast = pal => pal.mix('tinte-leise', 'tinte', .35);
  function fahne(a, pal) {                                   // x, y, z, h, farbe
    const o = I.punkt(a.x, a.y, a.z), c = pal.drei(a.farbe), top = o[1] - a.h * I.HE;
    return `<path d="M${I.pt(o)}V${f(top)}" stroke="${mast(pal)}" stroke-width="3" stroke-linecap="round"/>` + I.poly([[o[0], top], [o[0] + 30, top + 7], [o[0], top + 15]], c.l);
  }
  function schale(a, pal) {                                  // Antennenschüssel auf Mast: x, y, z, r (Pixel), farbe
    const o = I.punkt(a.x, a.y, a.z), x = o[0], y = o[1], c = pal.drei(a.farbe), r = a.r, m = mast(pal);
    return `<path d="M${f(x)} ${f(y)}v-16" stroke="${m}" stroke-width="4" stroke-linecap="round"/>` +
      `<g transform="translate(${f(x)} ${f(y - 30)}) rotate(-34)"><ellipse rx="${r}" ry="${f(r * .5)}" fill="${c.r}"/><ellipse rx="${f(r * .84)}" ry="${f(r * .38)}" cx="${f(r * .08)}" fill="${c.o}"/></g>` +
      `<path d="M${f(x)} ${f(y - 30)}l${f(r * .5)} ${f(-r * .55)}" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  function rauch(a, pal) {                                   // drei blasse Kreise über dem Schornstein, still: x, y, z
    const o = I.punkt(a.x, a.y, a.z);
    return [[0, -7, 9, .55], [7, -23, 12, .42], [16, -43, 15, .3]].map(k => `<circle cx="${f(o[0] + k[0])}" cy="${f(o[1] + k[1])}" r="${k[2]}" fill="${pal.weiss}" fill-opacity="${k[3]}"/>`).join('');
  }
  function linie(a, pal) {                                   // von, bis (Rasterpunkte), farbe, w
    const p = I.punkt(...a.von), q = I.punkt(...a.bis), c = pal.hole(a.farbe), d = `M${I.pt(p)}L${I.pt(q)}`;
    return `<path d="${d}" stroke="${c}" stroke-width="${a.w}" stroke-linecap="round" fill="none"/>` +
      `<path d="${d}" stroke="${pal.weiss}" stroke-opacity=".35" stroke-width="${f(a.w * .3)}" stroke-linecap="round" fill="none" transform="translate(-1.4 -1.4)"/>`;
  }
  Object.assign(I.formen = I.formen || {}, { zylinder, kuppel, kegel, kugel, uhr, fahne, schale, rauch, linie });

  // ---- Symbole ---------------------------------------------------------------------------------------------------
  const fuell = (n, ersatz, offen) => `style="fill:var(--${n}${ersatz ? `, var(--${ersatz})` : ''})${offen ? `;fill-opacity:${offen}` : ''}"`;
  const SYMBOLE = {
    stein: () => `<path d="M4 15.5 6.8 8.2 12.6 5l6.8 3.6.6 7.2-6.6 3.7z" ${fuell('stein')}/><path d="M6.8 8.2 12 11.6l7.4-3M12 11.6l1.4 7.9"/>`,
    holz: () => `<path d="M7 7h11.5a2.8 5 0 0 1 0 10H7z" ${fuell('holz')}/><path d="M11 9.6h6.2M12.5 14.4h4.5"/>` +    // Stamm: Rinde mit Fugen, vorne die Schnittfläche
      `<ellipse cx="7" cy="12" rx="3.4" ry="5" ${fuell('sand')}/><ellipse cx="7" cy="12" rx="1.7" ry="2.6"/><path d="M7 11.4v1.2"/>`,
    handelsgut: () => `<path d="M4 8.2 12 4.5l8 3.7v8.1L12 20l-8-3.7z" ${fuell('sand')}/><path d="M4 8.2 12 12l8-3.8M12 12v8"/>`,
    proben: () => `<path d="M10 4h4M10.6 4v5.4L5.6 17.8a1.8 1.8 0 0 0 1.6 2.7h9.6a1.8 1.8 0 0 0 1.6-2.7l-5-8.4V4" ${fuell('meer')}/><path d="M8 15.2h8"/>`,
    ziegel: () => `<path d="M3.5 11 12 7l8.5 4v3.6L12 18.5l-8.5-3.9z" ${fuell('ziegel', 'holz', .7)}/><path d="M3.5 11 12 15l8.5-4M12 15v3.5"/>`,
    balken: () => `<path d="M3 13.4 15 6.6l6 3v3.1l-12 7-6-3z" ${fuell('holz', null, .7)}/><path d="M3 13.4l6 3 12-7M9 16.4v3.3"/>`,
    wuerfel: () => `<path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" ${fuell('akzent-mitte', 'meer')}/><path d="M4 8l8 4.5L20 8M12 12.5v8"/>`
  };
  /** SVG-Text eines Symbols. opt: { groesse (Pixel, Standard 24), klasse, titel }. Mit titel ist das Symbol beschriftet, sonst für Vorlese-Programme verborgen. */
  function symbol(name, opt = {}) {
    const art = Object.hasOwn(SYMBOLE, name) ? name : 'wuerfel', gr = opt.groesse || 24, klasse = ['iso-symbol', `iso-symbol-${art}`, opt.klasse].filter(Boolean).join(' ');
    const titel = opt.titel ? `role="img" aria-label="${String(opt.titel).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`)}"` : 'aria-hidden="true"';
    return `<svg class="${klasse}" viewBox="0 0 24 24" width="${gr}" height="${gr}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false" ${titel}>${SYMBOLE[art]()}</svg>`;
  }
  Object.assign(I, { symbol, SYMBOLE: Object.keys(SYMBOLE) });
})(globalThis);
