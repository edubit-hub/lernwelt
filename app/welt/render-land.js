/* app/welt/render-land.js: Insel, Wasser, Wege und Bäume der Karte (Architektur 7.7, Vorlage: docs/mockup/siedlung.html), Teil von render.js.
   Alles ist deterministisch: gleiche Bauplätze ergeben dieselbe Insel. Nach dem Öffnen einer Epoche bleibt jeder Baum stehen, ausser ein neuer
   Bauplatz, ein neuer Weg oder ein neuer Baum rückt ihm näher. Kein DOM, nur SVG-Text.
   Bauplätze liegen auf einem Gitter: Platz 2,3 x 2,3 Zellen, Abstand 3,5 Zellen, dazwischen laufen Wege von Platzmitte zu Platzmitte. Die Reihenfolge ist fest (Platz 0 in der Mitte,
   dann nach Abstand auf dem Bildschirm), so dass ein Gebäude nie seinen Platz wechselt, wenn weitere Plätze aufgehen. Höchstens MAX Plätze. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const Land = (L.Land = L.Land || {});
  const I = () => L.Iso;

  const GROESSE = 2.3, RASTER = 3.5, WEGBREITE = .8, MAX = 36, DICKE = .42, STRAND = .3;
  const rausch = (i, j) => (((i * 73856093) ^ (j * 19349663)) >>> 0) % 1000 / 1000;

  // Gitterpunkte (a, b) nach Abstand auf dem Bildschirm: eine Gitterstufe ist in u = a - b 256 Pixel breit, in v = a + b 128 Pixel hoch,
  // die Insel soll etwa 1,6 mal so breit wie hoch werden. Gleichstand: vorne (grösseres v) zuerst, dann links.
  const GITTER = (() => {
    const l = [];
    for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) l.push({ a, b, u: a - b, v: a + b, m: 25600 * (a - b) ** 2 + 16384 * (a + b) ** 2 });
    return l.sort((p, q) => p.m - q.m || q.v - p.v || p.u - q.u).slice(0, MAX);
  })();

  /** Die ersten n Bauplätze: [{ platz, gx, gy, x, y, b, t }], x und y in Rasterzellen (linke obere Ecke), b und t die Grösse. */
  function plan(n) {
    return GITTER.slice(0, Math.max(0, Math.min(MAX, n | 0))).map((p, k) => ({ platz: k, gx: p.a, gy: p.b, x: RASTER * p.a, y: RASTER * p.b, b: GROESSE, t: GROESSE }));
  }

  /** Landmaske für die Bauplätze: ins.land(i, j), ins.rects, ins.wege (Streifen), ins.zellen (alle Landzellen), ins.grenze. */
  function insel(plaetze) {
    const rects = plaetze.map(p => [p.x, p.y, p.x + p.b, p.y + p.t]);
    if (!rects.length) return { land: () => false, rects, zellen: [], grenze: [0, 0, 0, 0], wege: [] };
    const i0 = Math.floor(Math.min(...rects.map(r => r[0]))) - 4, j0 = Math.floor(Math.min(...rects.map(r => r[1]))) - 4;
    const i1 = Math.ceil(Math.max(...rects.map(r => r[2]))) + 4, j1 = Math.ceil(Math.max(...rects.map(r => r[3]))) + 4, w = i1 - i0, h = j1 - j0;
    const abstand = (i, j) => Math.min(...rects.map(([x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - i - .5, 0, i + .5 - x1), Math.max(y0 - j - .5, 0, j + .5 - y1))));
    const roh = new Uint8Array(w * h);
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) roh[(j - j0) * w + i - i0] = abstand(i, j) <= .75 + 1.1 * rausch(i, j) ? 1 : 0;
    const r0 = (i, j) => (i >= i0 && j >= j0 && i < i1 && j < j1 ? roh[(j - j0) * w + i - i0] : 0);
    const maske = new Uint8Array(w * h);
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {   // Glätten: keine Einzelzellen, keine Löcher
      const n = r0(i + 1, j) + r0(i - 1, j) + r0(i, j + 1) + r0(i, j - 1);
      maske[(j - j0) * w + i - i0] = r0(i, j) ? (n >= 2 ? 1 : 0) : (n >= 3 ? 1 : 0);
    }
    for (const [x0, y0, x1, y1] of rects) for (let j = Math.floor(y0); j < y1; j++) for (let i = Math.floor(x0); i < x1; i++) maske[(j - j0) * w + i - i0] = 1;
    const land = (i, j) => (i >= i0 && j >= j0 && i < i1 && j < j1 ? maske[(j - j0) * w + i - i0] === 1 : false);
    const zellen = [];
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) if (land(i, j)) zellen.push([i, j]);
    return { land, rects, zellen, grenze: [i0, j0, i1, j1], wege: wege(plaetze) };
  }

  /** Wege als Streifen [x0, y0, x1, y1] von Platzmitte zu Platzmitte: jeder Platz hängt über seinen Nachbarn in Richtung Mitte an einem Weg (ein Baum
      von Wegen). So bleibt zwischen den Gebäuden Platz für Bäume. */
  function wege(plaetze) {
    const da = new Map(plaetze.map(p => [`${p.gx},${p.gy}`, p])), aus = [], h = WEGBREITE / 2, s = Math.sign;
    for (const p of plaetze) {
      if (p.gx === 0 && p.gy === 0) continue;
      const laengs = Math.abs(p.gx) >= Math.abs(p.gy);
      const q = [[laengs ? p.gx - s(p.gx) : p.gx, laengs ? p.gy : p.gy - s(p.gy)], [laengs ? p.gx : p.gx - s(p.gx), laengs ? p.gy - s(p.gy) : p.gy]]
        .filter(([a, b]) => a !== p.gx || b !== p.gy).map(([a, b]) => da.get(`${a},${b}`)).find(Boolean);
      if (!q) continue;
      const ax = p.x + p.b / 2, ay = p.y + p.t / 2, bx = q.x + q.b / 2, by = q.y + q.t / 2;   // der Weg endet am Rand der Plätze, nicht in ihrer Mitte
      aus.push(p.gx !== q.gx ? [Math.min(p.x, q.x) + GROESSE - .05, ay - h, Math.max(p.x, q.x) + .05, ay + h] : [ax - h, Math.min(p.y, q.y) + GROESSE - .05, ax + h, Math.max(p.y, q.y) + .05]);
    }
    return aus;
  }
  /** Umriss der Insel samt Flachwasser (eine Zelle rundum) auf dem Bildschirm: { x0, y0, x1, y1 }, ohne Gebäude. */
  function umriss(ins) {
    const k = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const [i, j] of ins.zellen) {
      k.x0 = Math.min(k.x0, (i - j - 3) * 64); k.x1 = Math.max(k.x1, (i - j + 3) * 64);
      k.y0 = Math.min(k.y0, (i + j - 2) * 32); k.y1 = Math.max(k.y1, (i + j + 4) * 32);
    }
    k.y1 += DICKE * I().HE;
    return k;
  }

  /** Boden als wenige zusammengefasste Pfade: Flachwasser, Klippe links und rechts, Gras, Strand, Wege. */
  function boden(ins, pal) {
    const P = I().punkt, pt = I().pt, d = [[], [], [], [], [], []], land = ins.land;
    const fl = (i, j, b = 1, t = 1, z = 0) => 'M' + [P(i, j, z), P(i + b, j, z), P(i + b, j + t, z), P(i, j + t, z)].map(pt).join('L') + 'Z';
    const ring = new Set();
    for (const [i, j] of ins.zellen) {
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (!land(i + di, j + dj)) ring.add(`${i + di},${j + dj}`);
      if (!land(i, j + 1)) d[1].push('M' + [P(i, j + 1, 0), P(i + 1, j + 1, 0), P(i + 1, j + 1, -DICKE), P(i, j + 1, -DICKE)].map(pt).join('L') + 'Z');
      if (!land(i + 1, j)) d[2].push('M' + [P(i + 1, j, 0), P(i + 1, j + 1, 0), P(i + 1, j + 1, -DICKE), P(i + 1, j, -DICKE)].map(pt).join('L') + 'Z');
      d[3].push(fl(i, j));
      if (!land(i, j - 1)) d[4].push(fl(i, j, 1, STRAND));
      if (!land(i - 1, j)) d[4].push(fl(i, j, STRAND, 1));
      if (!land(i, j + 1)) d[4].push(fl(i, j + 1 - STRAND, 1, STRAND));
      if (!land(i + 1, j)) d[4].push(fl(i + 1 - STRAND, j, STRAND, 1));
    }
    for (const k of ring) { const [i, j] = k.split(',').map(Number); d[0].push(fl(i, j)); }
    for (const [x0, y0, x1, y1] of ins.wege) d[5].push(fl(x0, y0, x1 - x0, y1 - y0));
    const c = pal.drei('erde', 'holz'), farben = [pal.hole('flachwasser', 'meer'), c.l, c.r, pal.hole('gras'), pal.hole('sand'), pal.hole('weg', 'stein')];
    return { ring, svg: d.map((x, k) => (x.length ? `<path d="${x.join('')}" fill="${farben[k]}" stroke="${farben[k]}" stroke-width=".7" stroke-linejoin="round"/>` : '')).join('') };
  }

  // ---- Bäume und Felsen: einmal in <defs>, je Vorkommen ein <use> -------------------------------------------------
  const BAUM = {
    tanne: (I_, pal) => I_.quader({ x: -.07, y: -.07, b: .14, t: .14, h: .2, farbe: pal.hole('holz') }, pal) +
      [[.15, .4, .5], [.45, .32, .48], [.72, .22, .42]].map(([z, r, h]) => I_.formen.kegel({ cx: 0, cy: 0, z, r, h, farbe: pal.hole('tanne', 'gras') }, pal)).join(''),
    laub: (I_, pal) => I_.quader({ x: -.06, y: -.06, b: .12, t: .12, h: .34, farbe: pal.hole('holz') }, pal) + I_.formen.kugel({ cx: 0, cy: 0, z: .72, r: 27, farbe: pal.hole('laub', 'gras') }, pal),
    busch: (I_, pal) => I_.formen.kugel({ cx: 0, cy: 0, z: .2, r: 15, farbe: pal.mix('laub', 'tanne', .4) }, pal),
    fels: (I_, pal) => I_.quader({ x: -.22, y: -.18, b: .44, t: .36, h: .2, farbe: pal.hole('stein') }, pal) + I_.quader({ x: -.08, y: -.1, b: .26, t: .22, z: .2, h: .12, farbe: pal.mix('stein', 'flaeche', .12) }, pal)
  };
  const defs = (pal, p) => `<defs>${Object.entries(BAUM).map(([n, z]) => `<g id="${p}${n}">${z(I(), pal)}</g>`).join('')}</defs>`;

  /** Bäume und Felsen als Objekte für die Maler-Reihenfolge: [{ x0, y0, x1, y1, svg }]. Abstand zu allen Bauplätzen, nicht auf Wegen. */
  function baeume(ins, p) {
    const P = I().punkt, sperr = ins.rects.map(([a, b, c, d]) => [a - .45, b - .45, c + .45, d + .45]), aus = [];
    const stelle = (art, x, y) => { const o = P(x, y); aus.push({ x0: x - .3, y0: y - .3, x1: x + .3, y1: y + .3, art, x, y, svg: `<use href="#${p}${art}" x="${I().f(o[0])}" y="${I().f(o[1])}" pointer-events="none"/>` }); };
    const frei = (x, y) => !sperr.some(r => x > r[0] && x < r[2] && y > r[1] && y < r[3]) && !ins.wege.some(r => x > r[0] - .25 && x < r[2] + .25 && y > r[1] - .25 && y < r[3] + .25);
    for (const [i, j] of ins.zellen) {
      if (rausch(i + 3, j + 5) > .8) continue;
      const x = i + .35 + .3 * rausch(j * 7, i * 3), y = j + .35 + .3 * rausch(i * 5, j * 11);
      if (!frei(x, y) || aus.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < 1.3)) continue;
      const q = rausch(i * 13, j * 17);
      stelle(q < .5 ? 'tanne' : q < .8 ? 'laub' : 'busch', x, y);
    }
    const felsen = [];
    for (const [i, j] of ins.zellen) {                                // Felsblöcke am Ufer, höchstens fünf, mit Abstand
      if (felsen.length >= 5 || rausch(i * 29, j * 31) < .93) continue;
      const rand = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !ins.land(i + a, j + b)), x = i + .5, y = j + .5;
      if (rand && frei(x, y) && !aus.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < 1.3) && !felsen.some(o => Math.abs(o[0] - x) + Math.abs(o[1] - y) < 6)) {
        stelle('fels', x, y);
        felsen.push([x, y]);
      }
    }
    return aus;
  }

  /** Wellen und zwei Segelboote im Wasser ausserhalb der Insel, innerhalb des Umrisses k. Ohne Figuren. */
  function wasser(ins, k, pal, ring) {
    const f = I().f, w = pal.weiss, papier = pal.hole('papier', 'kalk', 'flaeche'), schatten = I().mischen(papier, pal.tinte, .12);
    const imWasser = (x, y) => { const i = Math.floor((x / 64 + y / 32) / 2), j = Math.floor((y / 32 - x / 64) / 2); return !ins.land(i, j) && !ring.has(`${i},${j}`); };
    let d = '', n = 0;
    for (let q = 0; q < 400 && n < 12; q++) {
      const x = k.x0 + rausch(q, 7) * (k.x1 - k.x0), y = k.y0 + rausch(q, 11) * (k.y1 - k.y0);
      if (imWasser(x - 30, y) && imWasser(x + 30, y) && imWasser(x, y + 16)) { d += `M${f(x - 20)} ${f(y)}q10 -7 20 0t20 0`; n++; }
    }
    const boot = (x, y, r) => `<g transform="translate(${f(x)} ${f(y)}) scale(${r * 1.15} 1.15)" pointer-events="none"><path d="M-40 24q12 -4 24 0t24 0t24 0" stroke="${w}" stroke-opacity=".6" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      I().poly([[-34, 0], [0, 0], [0, 14], [-24, 14]], papier) + I().poly([[0, 0], [34, 0], [24, 14], [0, 14]], schatten) +
      `<path d="M0 0V-52" stroke="${pal.hole('tinte-leise')}" stroke-width="2.4" stroke-linecap="round"/>` + I().poly([[0, -50], [-26, -6], [0, -6]], papier) + I().poly([[0, -42], [22, -6], [0, -6]], schatten) + '</g>';
    const boote = [[.1, .82, 1], [.9, .2, -1]].map(([a, b, r]) => { const x = k.x0 + a * (k.x1 - k.x0), y = k.y0 + b * (k.y1 - k.y0); return imWasser(x - 50, y + 20) && imWasser(x + 50, y + 20) && imWasser(x, y - 60) ? boot(x, y, r) : ''; }).join('');
    return (d ? `<path d="${d}" stroke="${w}" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round" fill="none" pointer-events="none"/>` : '') + boote;
  }

  /** Maler-Reihenfolge nach Rasterlage: ein Objekt liegt hinter einem anderen, wenn es in einer Achse vollständig davor endet. */
  function ordne(objs) {
    const n = objs.length, hinter = (p, o) => p.x1 <= o.x0 || p.y1 <= o.y0, nach = objs.map(() => []), grad = new Array(n).fill(0), fertig = new Array(n).fill(false);
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b && hinter(objs[a], objs[b]) && !hinter(objs[b], objs[a])) { nach[a].push(b); grad[b]++; }
    const schluessel = o => o.x0 + o.y0, aus = [];
    for (let k = 0; k < n; k++) {
      let best = -1;
      for (let a = 0; a < n; a++) if (!fertig[a] && (best < 0 || grad[a] < grad[best] || (grad[a] === grad[best] && schluessel(objs[a]) < schluessel(objs[best])))) best = a;
      fertig[best] = true;
      for (const b of nach[best]) grad[b]--;
      aus.push(objs[best]);
    }
    return aus;
  }

  Object.assign(Land, { GROESSE, RASTER, MAX, plan, insel, umriss, boden, defs, baeume, wasser, ordne, rausch });
})(globalThis);
