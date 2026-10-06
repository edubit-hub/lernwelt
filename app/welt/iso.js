/* app/welt/iso.js: Bausatz für flache Isometrie (Architektur 7.1 und 7.7, Vorlage: docs/mockup/siedlung.html). Alles erzeugt SVG-Zeichenketten,
   nichts berührt das DOM. Kachel 128 x 64, eine Höheneinheit sind 64 Pixel, Rasterpunkt (x, y, z) liegt bei ((x - y) * 64, (x + y) * 32 - z * 64).
   Jeder Körper hat drei Töne aus einer Grundfarbe: oben 26 % Weiss, links die Grundfarbe, rechts 22 % Tinte. Keine Gesichter, keine Figuren.
   Farben: eine Palette (Iso.palette) löst Namen wie «kalk» oder Farbwerte auf. Die Namen stammen aus app/stil/tokens.css und der CSS-Datei des
   Welt-Themas (CSS-Variable --<name>). Ohne Palette zeichnet der Bausatz in Grautönen, damit er auch in Node ohne Stylesheets läuft.
   Ein Gebäude ist eine Liste von Formen: bild: [['quader', { b: 2, t: 2, h: 1, farbe: 'stein' }], ['dach', { h: .6, farbe: 'ziegel' }]].
   Fehlen x, y und z, liegt ein Quader am Ursprung auf dem Boden, ein Dach auf dem letzten Quader. Weitere Formen (Zylinder, Kuppel, Kegel, Kugel,
   Uhr, Fahne, Schale, Rauch, Linie) und die Symbole stehen in iso-formen.js, sie melden sich in Iso.formen an. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const I = (L.Iso = L.Iso || {});

  const HE = 64;
  const f = n => Math.round(n * 10) / 10;
  const punkt = (x, y, z = 0) => [(x - y) * 64, (x + y) * 32 - z * HE];
  const pt = p => `${f(p[0])},${f(p[1])}`;
  const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}" stroke="${fill}" stroke-width=".7" stroke-linejoin="round"${extra}/>`;

  // ---- Farben ------------------------------------------------------------------------------------------------
  const NOTFALL = { flaeche: '#FFFFFF', tinte: '#1E2A34', stein: '#C7CDD3' };   // nur ohne Stylesheet (Node, Mini-DOM), sonst gelten tokens.css und das Thema
  function rgb(c) {
    const s = String(c || '').trim().toLowerCase();
    let m = /^#([0-9a-f]{6})$/.exec(s);
    if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    if ((m = /^#([0-9a-f]{3})$/.exec(s))) return [...m[1]].map(h => parseInt(h + h, 16));
    return (m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(s)) ? [+m[1], +m[2], +m[3]] : null;
  }
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mischen = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };

  /** Palette aus einer Funktion Name → Farbtext (zum Beispiel aus getComputedStyle) oder einem Objekt { name: '#rrggbb' }. Gibt ein Objekt mit
      hole(name, ...ersatz) → '#rrggbb' (erster auflösbarer Name oder Farbwert, zuletzt «stein»), mix(a, b, t) und drei(name) → { o, l, r }. */
  function palette(quelle) {
    if (quelle && typeof quelle.drei === 'function') return quelle;
    const lies = typeof quelle === 'function' ? quelle : n => (quelle && Object.hasOwn(quelle, n) ? quelle[n] : '');
    const cache = new Map(), drei = new Map();
    const roh = n => { const c = rgb(n) || rgb(lies(n)) || (Object.hasOwn(NOTFALL, n) ? rgb(NOTFALL[n]) : null); return c ? hex(c) : null; };
    const stein = roh('stein'), weiss = roh('flaeche'), tinte = roh('tinte');
    const pal = {
      hole(n, ...ersatz) {
        const k = [n, ...ersatz].join('|');
        if (!cache.has(k)) cache.set(k, [n, ...ersatz].map(roh).find(Boolean) || stein);
        return cache.get(k);
      },
      mix: (a, b, t) => mischen(pal.hole(a), pal.hole(b), t),
      drei(n, ...ersatz) {
        const c = pal.hole(n, ...ersatz), k = c;
        if (!drei.has(k)) drei.set(k, { o: mischen(c, weiss, .26), l: c, r: mischen(c, tinte, .22) });
        return drei.get(k);
      },
      weiss, tinte
    };
    return pal;
  }
  const STANDARD = palette(null);

  // ---- Formen: jede nimmt (Angaben, Palette, Körper) und gibt SVG-Text zurück ---------------------------------
  function kachel(a, pal = STANDARD) {                       // flache Platte oder Fliese: x, y, b, t, z, dicke, farbe
    const x = a.x || 0, y = a.y || 0, b = a.b ?? 1, t = a.t ?? 1, z = a.z || 0, d = a.dicke || 0, c = pal.drei(a.farbe), P = punkt;
    return (d > 0 ? poly([P(x, y + t, z), P(x + b, y + t, z), P(x + b, y + t, z - d), P(x, y + t, z - d)], c.l) +
      poly([P(x + b, y, z), P(x + b, y + t, z), P(x + b, y + t, z - d), P(x + b, y, z - d)], c.r) : '') +
      poly([P(x, y, z), P(x + b, y, z), P(x + b, y + t, z), P(x, y + t, z)], c.o);
  }

  function quader(a, pal = STANDARD) {                       // x, y, z, b, t, h, farbe, rillen (Bretterfugen)
    const x = a.x || 0, y = a.y || 0, z = a.z || 0, b = a.b, t = a.t, zt = z + a.h, c = pal.drei(a.farbe), P = punkt, ink = pal.tinte;
    let s = poly([P(x, y + t, zt), P(x + b, y + t, zt), P(x + b, y + t, z), P(x, y + t, z)], c.l) +
      poly([P(x + b, y, zt), P(x + b, y + t, zt), P(x + b, y + t, z), P(x + b, y, z)], c.r) +
      poly([P(x, y, zt), P(x + b, y, zt), P(x + b, y + t, zt), P(x, y + t, zt)], c.o);
    for (let k = 1; k < (a.rillen || 0); k++) {
      const zz = z + a.h * k / a.rillen;
      s += `<path d="M${pt(P(x, y + t, zz))}L${pt(P(x + b, y + t, zz))}" stroke="${ink}" stroke-opacity=".16" stroke-width="1.2" fill="none"/>` +
        `<path d="M${pt(P(x + b, y, zz))}L${pt(P(x + b, y + t, zz))}" stroke="${ink}" stroke-opacity=".2" stroke-width="1.2" fill="none"/>`;
    }
    return s;
  }

  function dach(a, pal = STANDARD) {                         // x, y, z, b, t, h, farbe, art (sattel | walm | pult), achse (x | y), giebel, ue, streifen, n
    const x = a.x || 0, y = a.y || 0, z = a.z || 0, b = a.b, t = a.t, h = a.h, ue = a.ue ?? .1, c = pal.drei(a.farbe), P = punkt;
    const gi = a.giebel ? pal.drei(a.giebel) : null, x0 = x - ue, y0 = y - ue, x1 = x + b + ue, y1 = y + t + ue;
    if (a.art === 'walm') {
      const m = P(x + b / 2, y + t / 2, z + h);
      return poly([P(x0, y1, z), P(x1, y1, z), m], c.l) + poly([P(x1, y0, z), P(x1, y1, z), m], c.r);
    }
    if (a.art === 'pult') {                                  // Vordach, fällt zur Vorderseite ab, mit Streifen als Markise
      const n = a.streifen ? a.streifen.length * (a.n || 3) : 1;
      let s = poly([P(x1, y0, z + h), P(x1, y1, z), P(x1, y0, z)], gi ? gi.r : c.r);
      for (let i = 0; i < n; i++) {
        const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n, farbe = a.streifen ? pal.drei(a.streifen[i % a.streifen.length]).l : c.l;
        s += poly([P(xa, y0, z + h), P(xb, y0, z + h), P(xb, y1, z), P(xa, y1, z)], farbe);
      }
      return s;
    }
    if (a.achse === 'y') {                                   // Satteldach, First entlang y
      const xm = x + b / 2;
      return poly([P(x0, y0, z), P(x0, y1, z), P(xm, y1, z + h), P(xm, y0, z + h)], c.o) +
        (gi ? poly([P(x, y + t, z), P(x + b, y + t, z), P(xm, y + t, z + h)], gi.l) : '') +
        poly([P(x1, y0, z), P(x1, y1, z), P(xm, y1, z + h), P(xm, y0, z + h)], c.r);
    }
    const ym = y + t / 2;                                    // Satteldach, First entlang x
    return poly([P(x0, y0, z), P(x1, y0, z), P(x1, ym, z + h), P(x0, ym, z + h)], c.o) +
      (gi ? poly([P(x + b, y, z), P(x + b, y + t, z), P(x + b, ym, z + h)], gi.r) : '') +
      poly([P(x0, y1, z), P(x1, y1, z), P(x1, ym, z + h), P(x0, ym, z + h)], c.l);
  }

  /** Abbildung der Fläche einer Quaderseite: lokale Koordinaten u (entlang) und v (Höhe), Ursprung unten an der Kante. an: 'l' oder 'r'. */
  function seite(q, an) {
    const o = an === 'l' ? punkt(q.x, q.y + q.t, q.z) : punkt(q.x + q.b, q.y, q.z);
    return `matrix(${an === 'l' ? '64 32' : '-64 32'} 0 -64 ${f(o[0])} ${f(o[1])})`;
  }
  function rechteck(q, a, farbe, pal) {
    const kreuz = a.kreuz ? pal.hole(a.kreuz) : null;
    return `<g transform="${seite(q, a.an)}"><rect x="${a.s}" y="${a.z}" width="${a.w}" height="${a.h}" rx=".02" fill="${farbe}"/>` +
      (kreuz ? `<path d="M${a.s + a.w / 2} ${a.z}v${a.h}M${a.s} ${a.z + a.h / 2}h${a.w}" stroke="${kreuz}" stroke-width=".035" fill="none"/>` : '') + '</g>';
  }
  function fenster(q, a, pal = STANDARD) {                   // an, s (Abstand entlang), z (Höhe über dem Boden des Körpers), w, h, kreuz
    const c = pal.hole('fenster', 'schiefer');
    return rechteck(q, a, a.an === 'l' ? c : mischen(c, pal.tinte, .2), pal);
  }
  function tuer(q, a, pal = STANDARD) {
    return rechteck(q, a, a.farbe ? pal.hole(a.farbe) : pal.hole('tuer', 'dachholz'), pal);
  }

  // ---- Bild: eine Liste von Formen -----------------------------------------------------------------------------
  const formen = I.formen || (I.formen = {});
  Object.assign(formen, {
    quader: (r, pal) => quader(r, pal), dach: (r, pal) => dach(r, pal),
    fenster: (r, pal, q) => (q ? fenster(q, r, pal) : ''), tuer: (r, pal, q) => (q ? tuer(q, r, pal) : '')
  });
  const ABSOLUT = new Set(['quader', 'dach', 'zylinder', 'kuppel', 'kegel', 'kugel', 'fahne', 'schale', 'rauch']);   // z gilt vom Boden aus

  /** Ergänzt die Vorgaben der Liste (Quader am Ursprung, Dach auf dem letzten Quader). Gibt [{ art, r, q }] zurück, ohne zu verschieben. */
  function normal(liste) {
    const aus = [];
    let q = null;
    for (const e of Array.isArray(liste) ? liste : []) {
      if (!Array.isArray(e) || typeof e[0] !== 'string') continue;
      const r = { ...(e[1] || {}) };
      if (e[0] === 'quader') { r.x ??= 0; r.y ??= 0; r.z ??= 0; q = r; }
      else if (e[0] === 'dach' && q) { r.x ??= q.x; r.y ??= q.y; r.b ??= q.b; r.t ??= q.t; r.z ??= q.z + q.h; }
      aus.push({ art: e[0], r, q });
    }
    return aus;
  }
  const schiebe = (r, ox, oy, oz, absolut) => {
    const s = { ...r };
    if (s.x !== undefined) s.x += ox;
    if (s.y !== undefined) s.y += oy;
    if (s.cx !== undefined) { s.cx += ox; s.cy += oy; }
    if (s.von) { s.von = [s.von[0] + ox, s.von[1] + oy, s.von[2] + oz]; s.bis = [s.bis[0] + ox, s.bis[1] + oy, s.bis[2] + oz]; }
    if (absolut) s.z = (s.z || 0) + oz;
    return s;
  };

  /** Zeichnet die Liste. opt: { x, y, z } verschiebt das ganze Bild (Rasterzellen), palette (Iso.palette). Unbekannte Formen entfallen. */
  function bild(liste, opt = {}) {
    const pal = palette(opt.palette), ox = opt.x || 0, oy = opt.y || 0, oz = opt.z || 0;
    let s = '', koerper = null;
    for (const { art, r, q } of normal(liste)) {
      const form = formen[art];
      if (!form) continue;
      const v = schiebe(r, ox, oy, oz, ABSOLUT.has(art));
      if (art === 'quader') koerper = v;
      let t = '';
      try { t = form(v, pal, q ? schiebe(q, ox, oy, oz, true) : koerper) || ''; } catch (e) { t = ''; }   // fehlerhafte Angaben lassen nur diese Form weg, nie die Karte
      if (!/NaN|undefined|Infinity/.test(t)) s += t;
    }
    return s;
  }

  /** Ausdehnung der Liste in Rasterzellen: { x0, y0, x1, y1, h } (ohne Verschiebung). Eine leere Liste ergibt 2 x 2 und Höhe 1. */
  function masse(liste) {
    const m = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, h: 0 };
    const ein = (x0, y0, x1, y1, h) => { if (![x0, y0, x1, y1, h].every(Number.isFinite)) return; m.x0 =Math.min(m.x0, x0); m.y0 = Math.min(m.y0, y0); m.x1 = Math.max(m.x1, x1); m.y1 = Math.max(m.y1, y1); m.h = Math.max(m.h, h); };
    for (const { art, r } of normal(liste)) {
      const z = r.z || 0;
      if (art === 'quader' || art === 'dach') ein(r.x, r.y, r.x + r.b, r.y + r.t, z + (r.h || 0));
      else if (art === 'zylinder' || art === 'kuppel' || art === 'kegel') ein(r.cx - r.r, r.cy - r.r, r.cx + r.r, r.cy + r.r, z + (r.h || 0));
      else if (art === 'kugel') ein(r.cx, r.cy, r.cx, r.cy, z + 2 * (r.r || 0) / HE);
      else if (art === 'fahne') ein(r.x, r.y, r.x, r.y, z + (r.h || .5));        // Rauch und Schüssel zählen nicht zur Höhe (Marke und Schild sitzen darunter)
    }
    return m.x0 === Infinity ? { x0: 0, y0: 0, x1: 2, y1: 2, h: 1 } : m;
  }

  Object.assign(I, { HE, KACHEL: [128, 64], f, pt, punkt, poly, seite, palette, STANDARD, mischen, kachel, quader, dach, fenster, tuer, bild, masse, normal });
})(globalThis);
