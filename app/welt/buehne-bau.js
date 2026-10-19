/* app/welt/buehne-bau.js: Bauplätze der Bühne und der Bau-Effekt (Umbauplan 2.9 und 3.3, Vorbild docs/mockup/richtung-a/a-siedlung.js).
     BuehneBau.platz(p, palette) → { svg, rect, spitze, kamin, m }: ein Platz als Gruppe g.bauplatz[data-platz] im Insel-SVG. frei: Platte mit Rahmen und Plus,
       gesperrt: Pfosten mit Seil, gebaut: Gebäude der Stufe auf seiner Platte (die stille Rauchform entfällt, buehne-leben.js lässt Rauch steigen).
     BuehneBau.effekt(api, platz) → Promise: Fundament senkt sich mit Staub, Gerüst wächst, das Haus wächst von unten im Gerüst, das Gerüst geht. Etwa 1,1 s,
       ohne el.animate oder bei wenig() sofort der Endzustand. Die Eingabe bleibt frei, nichts wird gesperrt.
     BuehneBau.lager(api, rohstoff): ein Stück mehr auf dem Stapel am Lager (höchstens vier je Rohstoff, nur für diese Sitzung).
   api kommt aus buehne.js: { modell, ebenen, doc, wenig(), gruppe(platz), verberge(nr, ja), imBau, lager }. Kein Zustand wird geschrieben. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const BB = (L.BuehneBau = L.BuehneBau || {});
  const I = () => L.Iso, BL = () => L.BuehneLand;
  const ZP = .09, PLATZHALTER = [['quader', { b: 2, t: 2, h: 1, farbe: 'stein' }], ['dach', { h: .5, farbe: 'schiefer' }]];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);

  /** Bild einer Stufe: die letzte vorhandene Bildliste bis zu dieser Stufe, sonst das Bild des Bauteils, sonst ein Platzhalter. */
  function bildVon(b, stufe) {
    const st = objekt(b) && Array.isArray(b.stufen) ? b.stufen : [];
    for (let s = Math.min(stufe, st.length) - 1; s >= 0; s--) if (st[s] && Array.isArray(st[s].bild)) return st[s].bild;
    return objekt(b) && Array.isArray(b.bild) ? b.bild : PLATZHALTER;
  }

  function platz(p, pal) {
    const Q = I(), P = Q.punkt, f = Q.f, cx = p.x + p.b / 2, cy = p.y + p.t / 2, rect = [p.x - .1, p.y - .1, p.x + p.b + .1, p.y + p.t + .1];
    const raute = (x, y, b, t, z = 0) => [P(x, y, z), P(x + b, y, z), P(x + b, y + t, z), P(x, y + t, z)].map(Q.pt).join(' ');
    if (p.art === 'leer') return { svg: '', rect, spitze: P(cx, cy, 1), kamin: null };
    const label = p.art === 'gesperrt' ? `Bauplatz der Epoche ${p.name}, gesperrt` : p.art === 'frei' ? 'Freier Bauplatz' : `${p.name}, Stufe ${p.stufe} von ${p.max}`;
    const kopf = `<g class="bauplatz platz-${p.art}" data-platz="${p.platz}" data-art="${p.art}"${p.bauteil ? ` data-bauteil="${esc(p.bauteil)}"` : ''} role="button" tabindex="0" aria-label="${esc(label)}">`;
    const ring = `<polygon class="ring" points="${raute(p.x - .16, p.y - .16, p.b + .32, p.t + .32, ZP)}" style="fill:var(--akzent);fill-opacity:.14;stroke:var(--akzent)" stroke-width="6" stroke-linejoin="round"/>`;
    const treffer = `<polygon class="treffer" points="${raute(p.x - .1, p.y - .1, p.b + .2, p.t + .2)}" fill="transparent"/>`;
    if (p.art === 'gesperrt') {
      const ecken = [[p.x + .12, p.y + .12], [p.x + p.b - .12, p.y + .12], [p.x + p.b - .12, p.y + p.t - .12], [p.x + .12, p.y + p.t - .12]];
      const pf = ecken.map(([x, y]) => Q.quader({ x: x - .05, y: y - .05, b: .1, t: .1, h: .3, farbe: 'holz' }, pal)), oben = ecken.map(([x, y]) => P(x, y, .26));
      const seile = [0, 1, 2, 3].map(k => { const a = oben[k], b = oben[(k + 1) % 4], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6]; return `M${Q.pt(a)}Q${Q.pt(m)} ${Q.pt(b)}`; }).join('');
      return { rect, spitze: P(cx, cy, .32), kamin: null, svg: kopf + `<polygon points="${raute(p.x, p.y, p.b, p.t)}" fill="${pal.weiss}" fill-opacity=".2"/>` + ring + pf[0] + pf[1] +
        `<path d="${seile}" stroke="${pal.mix('dachholz', 'tinte', .2)}" stroke-width="2.2" fill="none" opacity=".8"/>` + pf[3] + pf[2] + treffer + '</g>' };
    }
    const platte = (x, y, b, t) => Q.kachel({ x, y, b, t, z: ZP, dicke: ZP, farbe: 'platte' }, pal);
    if (p.art === 'frei') {
      const c = P(cx, cy, ZP), rahmen = `<polygon points="${raute(p.x + .3, p.y + .3, p.b - .6, p.t - .6, ZP)}" fill="none" stroke="${pal.weiss}" stroke-opacity=".75" stroke-width="2.5"/>`;
      const plus = `<path class="plus" d="M${f(c[0] - 34)} ${f(c[1])}h68M${f(c[0])} ${f(c[1] - 17)}v34" style="stroke:var(--akzent)" stroke-width="11" stroke-linecap="round" fill="none" opacity=".85"/>`;
      return { rect, spitze: P(cx, cy, .5), kamin: null, svg: kopf + platte(p.x + .1, p.y + .1, p.b - .2, p.t - .2) + rahmen + plus + ring + treffer + '</g>' };
    }
    const liste = bildVon(p.def, p.stufe), rauch = liste.find(e => Array.isArray(e) && e[0] === 'rauch' && objekt(e[1]));
    const k = BL().setze(liste.filter(e => !(Array.isArray(e) && e[0] === 'rauch')), cx, cy, ZP, pal), m = k.m, l = Math.min(.8, m.h * .5);
    const sw = Math.max(p.b - .2, m.x1 - m.x0 + .3), st = Math.max(p.t - .2, m.y1 - m.y0 + .3);
    const schatten = Q.poly([P(m.x1, m.y0, ZP + .01), P(m.x1 + l, m.y0 + l * .35, ZP + .01), P(m.x1 + l, m.y1 + l * .35, ZP + .01), P(m.x1, m.y1, ZP + .01)], pal.tinte, ' fill-opacity=".08" stroke-opacity="0"');
    const kamin = rauch && objekt(p.def) && p.def.rolle === 'produktion' ? P((rauch[1].x || 0) + k.ox, (rauch[1].y || 0) + k.oy, (rauch[1].z || 0) + ZP) : null;
    return { rect: [cx - sw / 2 - .1, cy - st / 2 - .1, cx + sw / 2 + .1, cy + st / 2 + .1], spitze: P(cx, cy, ZP + m.h + .35), kamin, m, k,
      svg: kopf + platte(cx - sw / 2, cy - st / 2, sw, st) + schatten + ring + treffer + `<g class="bau">${k.svg}</g></g>` };
  }

  // ---- Bau-Effekt --------------------------------------------------------------------------------------------------------
  const warte = ms => new Promise(r => setTimeout(r, ms));
  function effekt(api, nr) {
    const M = api.modell, eintrag = M.plaetze.get(nr), Q = I(), P = Q.punkt, pal = M.pal;
    if (!eintrag || eintrag.p.art !== 'gebaut' || !eintrag.e.m) return Promise.resolve(false);
    const { p, e } = eintrag, m = e.m, cx = p.x + p.b / 2, cy = p.y + p.t / 2, kk = BL().kasten({ ...m, x0: m.x0 - .2, y0: m.y0 - .2, x1: m.x1 + .2, y1: m.y1 + .2 }, ZP);
    const kann = !api.wenig() && api.ebenen.bau && typeof api.ebenen.bau.animate === 'function';
    const klang = n => { if (L.Klang && typeof L.Klang.spiele === 'function') L.Klang.spiele(n); };
    if (!kann) { klang('gebaut'); return Promise.resolve(true); }   // weniger Bewegung: das Haus steht sofort, nur «gebaut» klingt (Nachbesserung 2)
    klang('bauen');
    api.imBau.add(nr);
    // Während des Baus treten Auswahlring und Stufenschild zurück (Klasse .baut, buehne.css)
    if (api.el && api.el.classList) api.el.classList.add('baut');
    api.verberge(nr, true);
    const fund = { x0: p.x + .22, y0: p.y + .22, x1: p.x + p.b - .22, y1: p.y + p.t - .22, h: .07 }, stueck = (svg, k) => BL().stueck(api.doc, svg, k, M.box, 'bau-teil');
    const eF = stueck(Q.quader({ x: fund.x0, y: fund.y0, z: ZP, b: fund.x1 - fund.x0, t: fund.y1 - fund.y0, h: .07, farbe: 'stein' }, pal), BL().kasten(fund, ZP));
    const H = m.h * .9, z0 = ZP + .07, e0 = [[m.x0 - .06, m.y0 - .06], [m.x1 + .06, m.y0 - .06], [m.x1 + .06, m.y1 + .06], [m.x0 - .06, m.y1 + .06]];
    const li = (a, b, za, zb) => `M${Q.pt(P(a[0], a[1], za))}L${Q.pt(P(b[0], b[1], zb))}`, holz = pal.mix('dachholz', 'tinte', .12);
    const hinten = li(e0[0], e0[0], z0, z0 + H) + li(e0[1], e0[1], z0, z0 + H) + li(e0[3], e0[3], z0, z0 + H);
    const vorne = li(e0[2], e0[2], z0, z0 + H) + li(e0[3], e0[2], z0, z0 + H * .5) + li(e0[2], e0[1], z0, z0 + H * .5) + li(e0[3], e0[2], z0 + H * .5, z0 + H) + li(e0[2], e0[1], z0 + H * .5, z0 + H);
    const platt = Q.quader({ x: m.x0 - .12, y: m.y1 - .02, z: z0 + H * .5, b: m.x1 - m.x0 + .24, t: .16, h: .05, farbe: 'brett' }, pal);
    const eG = stueck(`<path d="${hinten}" stroke="${holz}" stroke-width="4.5" stroke-linecap="round" opacity=".8"/>${platt}<path d="${vorne}" stroke="${holz}" stroke-width="4.5" stroke-linecap="round"/>`, kk);
    const eH = stueck(e.k.svg, kk);
    const neu = p.stufe > 1 ? [eH, eG] : [eF, eH, eG];
    api.ebenen.bau.append(...neu);
    const an = (el, fr, o) => el.animate(fr, { fill: 'both', ...o }), hF = kk[3] - kk[1];
    const staub = (y, anzahl, start) => setTimeout(() => {
      const fm = P(cx, cy, ZP), x = fm[0] - M.box.x0;
      if (L.Effekte && typeof L.Effekte.splitter === 'function') L.Effekte.splitter(api.ebenen.bau, x, fm[1] - M.box.y0 + y, { anzahl, art: 'staub' });
    }, start);
    if (p.stufe <= 1) { an(eF, [{ transform: 'translateY(-30px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .75 }, { transform: 'translateY(2px)' }, { transform: 'none' }], { duration: 240, delay: 120, easing: 'ease-in' }); staub(0, 6, 330); }
    const wisch = (el, start, dauer) => {
      an(el, [{ transform: `translateY(${I().f(hF)}px)` }, { transform: 'none' }], { duration: dauer, delay: start, easing: 'cubic-bezier(.3,.6,.3,1)' });
      an(el.firstChild, [{ transform: `translateY(${I().f(-hF)}px)` }, { transform: 'none' }], { duration: dauer, delay: start, easing: 'cubic-bezier(.3,.6,.3,1)' });
    };
    wisch(eG, 320, 240);
    wisch(eH, 480, 420);
    an(eG, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 860 });
    staub(10, 8, 900);
    return warte(1080).then(() => {
      api.imBau.delete(nr);
      api.verberge(nr, false);
      if (api.el && api.el.classList && !api.imBau.size) api.el.classList.remove('baut');
      for (const el of neu) if (el.parentNode) el.parentNode.removeChild(el);
      klang('gebaut');
      return true;
    });
  }

  // ---- Lager -----------------------------------------------------------------------------------------------------------------
  const TON = { stein: 'rs-stein', holz: 'rs-holz', handelsgut: 'rs-handel', proben: 'rs-proben' };
  function lager(api, rohstoff) {
    const M = api.modell, o = M.orte.lager;
    if (!o) return false;
    const vorher = api.lager[rohstoff] || 0;
    if (vorher >= 4) return false;
    api.lager[rohstoff] = vorher + 1;
    const art = Math.max(0, Object.keys(TON).indexOf(rohstoff)), x = o.x + (art % 2) * .4 - .2, y = o.y + o.t + .05 + Math.floor(art / 2) * .34, z = vorher * .2;
    const b = { x0: x, y0: y, x1: x + .26, y1: y + .26, h: .2 };
    const el = BL().stueck(api.doc, I().quader({ x, y, z, b: .26, t: .26, h: .2, farbe: TON[rohstoff] || 'stein' }, M.pal), BL().kasten(b, z), 'lager-stueck');
    api.ebenen.bau.appendChild(el);
    if (!api.wenig() && typeof el.animate === 'function') el.animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3,.6,.3,1)' });
    return true;
  }

  Object.assign(BB, { platz, effekt, lager, bildVon });
})(globalThis);
