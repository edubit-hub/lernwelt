/* app/welt/buehne-land.js: die ruhende Insel der Bühne (Umbauplan 3.3, Vorbild docs/mockup/richtung-a/a-welt.js und a-land.js). Aus den Bauplätzen
   (Render.lage) und der Landmaske (Land.insel) entstehen eine gerundete Küste mit Klippe, Wiese, Wege, Bäume, die Orte aus thema.orte (an der Küste
   in Richtung lage, Land.orte) und zwei kleine Nachbarinseln, eine davon im Nebel. Nur SVG-Text und ein Modell, kein DOM ausser stueck().
     BuehneLand.baue(thema, weltStand, { palette, praefix }) → Modell { box, mitte, umriss, liste, plaetze (Map), orte, fern, svg: { flachwasser, insel }, ... }
     BuehneLand.lage(thema, weltStand) → Bauplätze; ohne Thema fünf leere Plätze, damit Meer und Insel stehen.
   Koordinaten: Bildschirmpixel des Bausatzes iso.js (Weltpunkte), Rasterzellen nur innerhalb der Rechnung. Bewegtes baut buehne-leben.js. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const BL = (L.BuehneLand = L.BuehneLand || {});
  const I = () => L.Iso, D = () => L.Land;
  const ZP = .09, DICKE = 29, RAND = 360, ORTE = ['lager', 'forschung', 'hafen', 'tor'];
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);

  // ---- Küste --------------------------------------------------------------------------------------------------------
  /** Ecken eines Küstenzugs auf dem Bildschirm runden: jede Ecke als Bogen über r Pixel (Bezier, abgetastet). */
  function runde(ecken, r, z = 0) {
    const s = ecken.map(([i, j]) => I().punkt(i, j, z)), n = s.length, aus = [];
    for (let k = 0; k < n; k++) {
      const v = s[(k - 1 + n) % n], c = s[k], w = s[(k + 1) % n], lv = Math.hypot(v[0] - c[0], v[1] - c[1]), lw = Math.hypot(w[0] - c[0], w[1] - c[1]);
      const rv = Math.min(r, lv / 2) / lv, rw = Math.min(r, lw / 2) / lw, a = [c[0] + (v[0] - c[0]) * rv, c[1] + (v[1] - c[1]) * rv], b = [c[0] + (w[0] - c[0]) * rw, c[1] + (w[1] - c[1]) * rw];
      for (let t = 0; t <= 1.001; t += .25) { const u = 1 - t; aus.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
    }
    return aus;
  }
  const pfad = (pts, dy = 0) => 'M' + pts.map(p => `${I().f(p[0])} ${I().f(p[1] + dy)}`).join('L') + 'Z';
  /** Sichtbare Seiten der Klippe, h Pixel hoch, getönt nach Richtung (Licht von oben links). */
  function klippe(zuege, h, pal, farbe, band) {
    const c = pal.drei(farbe), eimer = [[], [], [], [], [], []], streifen = [], quads = [], f = I().f;
    for (const pts of zuege) {
      let fl = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; fl += a[0] * b[1] - b[0] * a[1]; }
      const vz = fl > 0 ? 1 : -1;
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k], q = pts[(k + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
        if (-vz * dx / l >= .04) quads.push({ p, q, y: (p[1] + q[1]) / 2, t: Math.min(5, Math.max(0, Math.round((vz * dy / l + 1) / 2 * 5))) });
      }
    }
    quads.sort((a, b) => a.y - b.y);
    const q4 = (p, q, y1) => `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}L${f(q[0])} ${f(q[1] + y1)}L${f(p[0])} ${f(p[1] + y1)}Z`;
    for (const { p, q, t } of quads) { eimer[t].push(q4(p, q, h)); streifen.push(q4(p, q, 6)); }
    return eimer.map((d, t) => { const ton = I().mischen(c.l, c.r, t / 5); return d.length ? `<path d="${d.join('')}" fill="${ton}" stroke="${ton}" stroke-width=".8" stroke-linejoin="round"/>` : ''; }).join('') +
      (streifen.length ? `<path d="${streifen.join('')}" fill="${band}"/>` : '');
  }

  // ---- Hilfen für Bilder -----------------------------------------------------------------------------------------------
  const kasten = (m, z) => { const P = I().punkt; return [P(m.x0, m.y1)[0] - 24, P(m.x0, m.y0, z + m.h)[1] - 46, P(m.x1, m.y0)[0] + 24, P(m.x1, m.y1, z)[1] + 12]; };
  /** Liste mittig auf (cx, cy) in Höhe z: { svg, m (Rasterkasten), ox, oy, kasten (Bildschirm) }. */
  function setze(liste, cx, cy, z, pal) {
    const m = I().masse(liste), ox = cx - (m.x0 + m.x1) / 2, oy = cy - (m.y0 + m.y1) / 2;
    const mm = { x0: m.x0 + ox, y0: m.y0 + oy, x1: m.x1 + ox, y1: m.y1 + oy, h: m.h };
    return { svg: I().bild(liste, { x: ox, y: oy, z, palette: pal }), m: mm, ox, oy, kasten: kasten(mm, z) };
  }
  /** Ein Stück Welt als eigene kleine Ebene (Bau, Lager, wiegende Bäume): div in Weltkoordinaten der Box mit passendem SVG. */
  function stueck(doc, svg, k, box, klasse = '') {
    const e = doc.createElement('div'), f = I().f, w = k[2] - k[0], h = k[3] - k[1];
    e.className = 'stueck ' + klasse;
    e.style.cssText = `left:${f(k[0] - box.x0)}px;top:${f(k[1] - box.y0)}px;width:${f(w)}px;height:${f(h)}px`;
    e.innerHTML = `<svg viewBox="${f(k[0])} ${f(k[1])} ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" aria-hidden="true">${svg}</svg>`;
    return e;
  }

  /** Bauplätze aus Thema und Stand. Ohne Thema (oder ohne Plätze) fünf leere Plätze: die Insel steht, nichts ist wählbar. */
  function lage(thema, welt) {
    if (objekt(thema) && L.Render && L.Welt) {
      try { const l = L.Render.lage(thema, objekt(welt) ? welt : {}); if (l.length) return l; } catch (e) { /* weiter mit der leeren Insel */ }
    }
    return D().plan(5).map(p => ({ ...p, art: 'leer', bauteil: null, stufe: 0, epoche: null, name: '' }));
  }

  // ---- Hafen: Steg vom Ufer ins Wasser ------------------------------------------------------------------------------------
  function steg(h, ins, pal) {
    const Q = I(), P = Q.punkt, ax = Math.abs(h.d[0]) >= Math.abs(h.d[1]) ? [Math.sign(h.d[0]), 0] : [0, Math.sign(h.d[1])], quer = [Math.abs(ax[1]), Math.abs(ax[0])];
    let t = 0; while (t < 12 && ins.land(Math.floor(h.cx + ax[0] * t), Math.floor(h.cy + ax[1] * t))) t += .25;
    const a = Math.max(t - .7, (ax[0] ? h.b : h.t) / 2 + .1), e = t + 2.3, lq = -.2, w = .75;
    const pkt = (s, q) => [h.cx + ax[0] * s + quer[0] * q, h.cy + ax[1] * s + quer[1] * q], ecken = [pkt(a, lq - w / 2), pkt(e, lq + w / 2)];
    const r = { x0: Math.min(ecken[0][0], ecken[1][0]), y0: Math.min(ecken[0][1], ecken[1][1]), x1: Math.max(ecken[0][0], ecken[1][0]), y1: Math.max(ecken[0][1], ecken[1][1]) };
    let s = '';
    for (const s0 of [a + 1.2, a + 2.2, e - .1]) for (const q of [lq - w / 2 + .05, lq + w / 2 - .05]) { const p = pkt(s0, q); s += Q.formen.zylinder({ cx: p[0], cy: p[1], r: .06, z: -.55, h: .66, farbe: 'dachholz' }, pal); }
    s += Q.quader({ x: r.x0, y: r.y0, b: r.x1 - r.x0, t: r.y1 - r.y0, h: .1, farbe: 'brett' }, pal);
    let fugen = ''; for (let k = a + .25; k < e; k += .25) fugen += `M${Q.pt(P(...pkt(k, lq - w / 2), .1))}L${Q.pt(P(...pkt(k, lq + w / 2), .1))}`;
    s += `<path d="${fugen}" stroke="${pal.tinte}" stroke-opacity=".14" stroke-width="1.2"/>`;
    return { r, svg: s, punkt: P(...pkt(e - .2, lq + w / 2 + .6), 0), boot: pkt(a + 1.75, lq + w / 2 + .55) };
  }

  /** Boden einer Insel: Klippe, Gras, Strand, Wege, Saum. */
  function boden(n, zuege, pal, id, extra, wege) {
    const d = zuege.map(p => pfad(p)).join('');
    return { d, svg: klippe(zuege, DICKE, pal, 'erde', pal.mix('gras-tief', 'erde', .45)) +
      `<path d="${zuege.map(p => pfad(p, DICKE)).join('')}" fill="none" stroke="${pal.hole('erde-saum')}" stroke-width="2.4" stroke-opacity=".55"/><path d="${d}" fill="${pal.hole('gras')}"/>` +
      `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${extra}<path d="${d}" fill="none" stroke="${pal.hole('sand')}" stroke-width="30"/>${wege}</g>` +
      `<path d="${d}" fill="none" stroke="${pal.weiss}" stroke-opacity=".4" stroke-width="1.6"/>` };
  }
  function wiese(n, pre, pal) {
    const P = I().punkt, f = I().f, R = D().rausch;
    let s = '', tupf = '';
    n.zellen.filter(([i, j]) => R(i * 11 + 3, j * 7 + 1) > .9).slice(0, 18).forEach(([i, j], k) => { const p = P(i + .5, j + .5), r = 140 + R(i, j) * 120; s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r)}" ry="${f(r * .5)}" fill="url(#${pre}${k % 3 ? 'gl-hell' : 'gl-tief'})"/>`; });
    n.zellen.forEach(([i, j]) => { if (R(i * 5 + 9, j * 13 + 4) > .82) { const p = P(i + R(i, j * 3), j + R(j, i * 7)); tupf += `M${f(p[0] - 5)} ${f(p[1])}l3 -5l2 4l3 -6l2 7`; } });
    return s + `<path d="${tupf}" fill="none" stroke="${pal.hole('gras-tief')}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>`;
  }

  // ---- Zusammenbau ---------------------------------------------------------------------------------------------------------
  function baue(thema, welt, opt = {}) {
    const Q = I(), Ld = D(), P = Q.punkt, f = Q.f, pal = Q.palette(opt.palette), pre = opt.praefix || 'bn-', B = L.BuehneBau;
    const liste = lage(thema, welt), def = objekt(thema) && objekt(thema.orte) ? thema.orte : {};
    const wuensche = ORTE.filter(id => objekt(def[id]) && Array.isArray(def[id].bild)).map(id => {
      const m = Q.masse(def[id].bild);
      return { id, lage: def[id].lage, b: Math.ceil((m.x1 - m.x0 + .3) * 10) / 10, t: Math.ceil((m.y1 - m.y0 + .3) * 10) / 10, innen: id === 'lager' };
    });
    const lagen = Ld.orte(liste, wuensche), ins = Ld.insel([...liste, ...Object.values(lagen)]);
    const i0 = Math.min(...liste.map(p => p.x)), j0 = Math.min(...liste.map(p => p.y)), i1 = Math.max(...liste.map(p => p.x + p.b)), j1 = Math.max(...liste.map(p => p.y + p.t));
    const kleine = [{ x: i1 + 3.6, y: j0 - 5.9, b: .5, s: 'ia' }, { x: i0 - 2.9, y: j1 + 8.4, b: 1.2, s: 'ib', nebel: true }].map(r => ({ ...r, ins: Ld.insel([{ x: r.x, y: r.y, b: r.b, t: r.b }]) }));
    const alle = [ins, ...kleine.map(k => k.ins)], istLand = (i, j) => alle.some(n => n.land(i, j));
    const k = Ld.umriss(ins), u = alle.map(n => Ld.umriss(n));
    const ux0 = Math.min(...u.map(q => q.x0)), uy0 = Math.min(...u.map(q => q.y0)), ux1 = Math.max(...u.map(q => q.x1)), uy1 = Math.max(...u.map(q => q.y1));
    const box = { x0: Math.floor(ux0 - RAND), y0: Math.floor(uy0 - RAND - 160), W: Math.ceil(ux1 - ux0 + 2 * RAND), H: Math.ceil(uy1 - uy0 + 2 * RAND + 160) };
    const mitte = [(k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2];

    // Orte, Wege zu den Orten, Steg
    const orte = {}, objs = [], wegeOrt = [], fl = (a, b, c, d) => 'M' + [P(a, b), P(c, b), P(c, d), P(a, d)].map(Q.pt).join('L') + 'Z';
    for (const o of Object.values(lagen)) {
      const s = setze(def[o.id].bild.filter(e => Array.isArray(e) && e[0] !== 'rauch'), o.cx, o.cy, 0, pal);
      orte[o.id] = { ...o, name: def[o.id].name, spitze: P(o.cx, o.cy, s.m.h + .55), mitte: P(o.cx, o.cy, s.m.h * .45) };
      objs.push({ x0: o.x, y0: o.y, x1: o.x + o.b, y1: o.y + o.t, svg: `<g class="ort" data-ort="${o.id}">${s.svg}</g>` });
      if (o.id === 'lager') continue;
      const l = Math.hypot(...o.d), ud = [o.d[0] / l, o.d[1] / l], v = [-ud[1] * .4, ud[0] * .4], hd = (o.b * Math.abs(ud[0]) + o.t * Math.abs(ud[1])) / 2;
      const pk = (s0, q) => [o.cx - ud[0] * s0 + v[0] * q, o.cy - ud[1] * s0 + v[1] * q];
      wegeOrt.push({ a: pk(hd - .2, 0), b: pk(hd + 1.4, 0), d: 'M' + [pk(hd - .2, -1), pk(hd + 1.4, -1), pk(hd + 1.4, 1), pk(hd - .2, 1)].map(p => Q.pt(P(...p))).join('L') + 'Z' });
    }
    if (lagen.hafen) {
      const st = steg(lagen.hafen, ins, pal);
      Object.assign(orte.hafen, { punkt: st.punkt, boot: st.boot, steg: st.r });
      objs.push({ ...st.r, svg: `<g class="ort" data-ort="hafen">${st.svg}</g>` });
    }
    const nahWeg = (x, y) => wegeOrt.some(({ a, b }) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) < .75; });
    const imSteg = (x, y) => orte.hafen && orte.hafen.steg && x > orte.hafen.steg.x0 - .4 && x < orte.hafen.steg.x1 + .4 && y > orte.hafen.steg.y0 - .4 && y < orte.hafen.steg.y1 + .4;

    // Bäume: fünf vorne an der Küste wiegen sich in eigenen kleinen Ebenen, damit das Insel-SVG ruht
    const baeume = Ld.baeume(ins, pre).filter(o => !nahWeg(o.x, o.y) && !imSteg(o.x, o.y)), wiege = [];
    for (const o of [...baeume].filter(o => o.art === 'laub' || o.art === 'tanne').sort((a, b) => (b.x + b.y) - (a.x + a.y))) {
      if (wiege.length >= 5) break;
      if (!wiege.some(q => Math.abs(q.x - o.x) + Math.abs(q.y - o.y) < 4)) { o.wiegt = true; wiege.push(o); }
    }
    const plaetze = new Map();
    for (const p of liste) {
      const e = B ? B.platz(p, pal) : { svg: '', rect: [p.x, p.y, p.x + p.b, p.y + p.t], spitze: P(p.x + p.b / 2, p.y + p.t / 2, 1) };
      plaetze.set(p.platz, { p, e });
      objs.push({ x0: e.rect[0], y0: e.rect[1], x1: e.rect[2], y1: e.rect[3], svg: e.svg });
    }
    objs.push(...baeume.filter(o => !o.wiegt));

    // Inselboden und Nachbarinseln
    const zuege = n => Ld.kueste(n).map(e => runde(e, 34));
    const hz = zuege(ins), wegeD = ins.wege.map(([a, b, c, d]) => fl(a, b, c, d)).join('') + wegeOrt.map(w => w.d).join('');
    const licht = `<rect x="${f(k.x0)}" y="${f(k.y0)}" width="${f(k.x1 - k.x0)}" height="${f(k.y1 - k.y0)}" fill="url(#${pre}licht)"/>`;
    const haupt = boden(ins, hz, pal, `${pre}clip`, licht + wiese(ins, pre, pal), `<path d="${wegeD}" fill="${pal.hole('weg')}" stroke="${pal.hole('weg')}" stroke-width=".8"/>`);
    let nachbarn = '', alleZuege = [...hz];
    for (const n of kleine) { const z = zuege(n.ins); alleZuege = alleZuege.concat(z); nachbarn += boden(n.ins, z, pal, `${pre}clip-${n.s}`, '', '').svg + Ld.ordne(Ld.baeume(n.ins, pre)).map(o => o.svg).join(''); }
    const gl = (id, n, o) => `<radialGradient id="${pre}${id}"><stop offset="0" stop-color="${pal.hole(n)}" stop-opacity="${o}"/><stop offset="1" stop-color="${pal.hole(n)}" stop-opacity="0"/></radialGradient>`;
    const defs = `<defs>${Ld.defs(pal, pre).slice(6, -7)}${gl('gl-hell', 'gras-licht', .75)}${gl('gl-tief', 'gras-tief', .42)}` +
      `<linearGradient id="${pre}licht" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.hole('gras-licht')}" stop-opacity=".55"/><stop offset=".5" stop-color="${pal.hole('gras-licht')}" stop-opacity="0"/><stop offset="1" stop-color="${pal.hole('gras-tief')}" stop-opacity=".3"/></linearGradient></defs>`;
    const kopf = (klasse, extra = '') => `<svg class="${klasse}" xmlns="http://www.w3.org/2000/svg" viewBox="${box.x0} ${box.y0} ${box.W} ${box.H}" width="${box.W}" height="${box.H}"${extra}>`;
    const insel = kopf('insel-svg', ' role="group" aria-label="Insel"') + defs + nachbarn + haupt.svg + Ld.ordne(objs).map(o => o.svg).join('') + '</svg>';

    // Flachwasser: Glanz, Tiefe, Flachwasser um die Küste, Inselschatten, ruhender Saum
    const wl = alleZuege.map(p => pfad(p, DICKE)).join(''), ob = alleZuege.map(p => pfad(p)).join('');
    const flach = (farbe, breite, o) => `<path d="${wl}" fill="${pal.hole(farbe)}" stroke="${pal.hole(farbe)}" stroke-width="${breite}" stroke-linejoin="round" opacity="${o}"/>`;
    const flachwasser = kopf('flachwasser-svg', ' aria-hidden="true"') + `<defs>${gl('tief', 'see-tief', .18)}${gl('glanz', 'see-flach', .9)}</defs>` +
      `<ellipse cx="${f(mitte[0])}" cy="${f(mitte[1])}" rx="${f((k.x1 - k.x0) * .78)}" ry="${f((k.y1 - k.y0) * .85)}" fill="url(#${pre}glanz)"/>` +
      `<ellipse cx="${f(mitte[0] + 420)}" cy="${f(mitte[1] + 520)}" rx="${f((k.x1 - k.x0) * .55)}" ry="${f((k.y1 - k.y0) * .5)}" fill="url(#${pre}tief)"/>` +
      flach('see-lagune', 250, .55) + flach('see-flach', 130, .8) + flach('see-flach', 54, 1) +
      `<path d="${wl}" fill="${pal.hole('see-schatten')}" opacity=".12" transform="translate(30 20)"/><path d="${wl}${ob}" fill="none" stroke="${pal.weiss}" stroke-width="5" stroke-linejoin="round" opacity=".9"/></svg>`;

    const fern = kleine[1];
    return { box, mitte, umriss: k, liste, plaetze, orte, istLand, wiege, pal, pre, zuege: hz, DICKE, ZP,
      fern: P(fern.x + .6, fern.y + .6, .3), svg: { flachwasser, insel } };
  }

  // ---- Routen auf dem Wasser (Vorbild a-hafen.js): Rundgang, Küste, ferne Insel, weitere als Bögen nach rechts ---------------------
  function glatt(pts) {
    const f = L.Iso.f, n = pts.length, q = i => pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = q(i - 1), p1 = q(i), p2 = q(i + 1), p3 = q(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }
  function routenSvg(M, liste) {
    const k = M.umriss, mi = M.mitte, H = M.orte.hafen ? (M.orte.hafen.punkt || M.orte.hafen.mitte) : [mi[0], k.y1], F = M.fern, b = M.box, enden = {};
    const wege = i => [
      [[H, [H[0] - 330, H[1] - 250], [k.x0 + 40, mi[1] - 250], [mi[0] - 280, k.y0 - 90], [mi[0] + 420, k.y0 - 20], [k.x1 + 40, mi[1] + 10], [mi[0] + 520, k.y1 + 40], [mi[0] - 120, k.y1 + 90], H], 2],
      [[H, [H[0] + 190, H[1] + 210], [mi[0] - 200, k.y1 + 160], [mi[0] + 60, k.y1 + 140]], 3],
      [[H, [H[0] - 240, H[1] + 110], [F[0] + 230, F[1] + 150], [F[0] + 90, F[1] + 60]], 3],
      [[H, [mi[0] + 300 + 140 * Math.max(0, i - 3), k.y1 + 220], [k.x1 + 120, mi[1] + 260 + 120 * Math.max(0, i - 3)]], 2]
    ][Math.min(i, 3)];
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x0} ${b.y0} ${b.W} ${b.H}" width="${b.W}" height="${b.H}" aria-hidden="true">`;
    liste.forEach((r, i) => {
      const [pts, e] = wege(i), d = glatt(pts), zu = r.art === 'zu';
      enden[r.id] = pts[e];
      s += `<g class="route ${zu ? 'zu' : 'offen'}" data-route="${String(r.id).replace(/"/g, '')}">` + (zu
        ? `<path d="${d}" fill="none" style="stroke:var(--flaeche)" stroke-width="10" stroke-linecap="round" opacity=".5"/><path d="${d}" fill="none" style="stroke:var(--tinte-leise)" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13" opacity=".75"/>`
        : `<path d="${d}" fill="none" style="stroke:var(--flaeche)" stroke-width="16" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" style="stroke:var(--${r.warm ? 'akzent-warm' : 'akzent'})" stroke-width="7" stroke-linecap="round" stroke-dasharray="22 14"/>`) + '</g>';
    });
    return { svg: s + '</svg>', enden };
  }

  Object.assign(BL, { baue, lage, setze, stueck, kasten, runde, pfad, klippe, routen: routenSvg, ZP, ORTE });
})(globalThis);
