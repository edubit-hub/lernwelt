/* app/welt/render.js: die Karte der Siedlung (Architektur 7.7 und 7.8). Ein einziges SVG mit festen Bauplätzen, gezeichnet aus dem Bausatz iso.js
   und der Insel aus render-land.js. Sie liest Welt-Thema und Welt-Stand und ändert beide nie.
     Render.karte(huelle, thema, weltStand, { onWahl, gewaehlt, ausbau, palette }) → Regler
       huelle    DOM-Element. Die Karte hängt als div.welt-karte darin, ein zweiter Aufruf auf derselben Hülle ersetzt die erste Karte.
       weltStand zustand.welt[themaId] (Welt.stand). Plätze, Gebäude und Stufen kommen von dort, offene Plätze von Welt.plaetze.
       onWahl    Rückruf bei Auswahl durch Antippen, Tastatur oder waehle(): { platz, art, bauteil, stufe, epoche }. art: 'gebaut', 'frei' oder 'gesperrt'.
       gewaehlt  Platz, der zu Beginn gewählt ist. ausbau: IDs der Gebäude, deren Ausbau jetzt möglich ist (Pfeil an der Stufenmarke, rechnet AP-16 mit Welt.probe).
       palette   Iso.palette, Funktion oder Objekt. Ohne Angabe liest die Karte die CSS-Variablen von :root.
       Regler    { el, waehle(platz, { still }), gewaehlt(), aktualisiere(weltStand?, optionen?), hupf(platz), plaetze(), zerstoere() }
     Render.baue(thema, weltStand, opt) → { svg, viewBox, plaetze }: dasselbe als Text, ohne DOM (für Tests).
     Render.vorschau(thema, bauteilId, stufe, opt) → SVG-Text eines Gebäudes für das Informationsfeld (opt.breite und opt.hoehe, Standard 108 x 84).
   Auswahl: Pointer Events (ein Tipp, Weg höchstens 12 Pixel) und Tastatur (Enter, Leertaste). Unter den Stufenbildern eines Gebäudes gilt das letzte vorhandene,
   ein Eintrag svg: 'name' liest Lernwelt.sprites[name] (SVG-Text mit dem Nullpunkt in der Mitte des Platzes). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const R = (L.Render = L.Render || {});
  const I = () => L.Iso, W = () => L.Land;

  const ZP = .09, WEG = 12;                                  // Dicke der Platte, grösste Bewegung eines Tipps in Pixeln
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const PLATZHALTER = [['quader', { b: 2, t: 2, h: 1, farbe: 'stein' }], ['dach', { h: .5, farbe: 'schiefer' }]];
  const STIL = '.welt-karte{position:relative;width:100%;height:100%;background:var(--meer);touch-action:manipulation}.welt-karte svg{display:block;width:100%;height:100%}' +
    '.welt .bauplatz{cursor:pointer;outline:none}.welt .bau{transition:transform var(--dauer,180ms) ease-out}.welt .ring{transition:opacity var(--dauer,180ms) ease-out}' +
    '.welt .gewaehlt .ring,.welt .bauplatz:focus-visible .ring{opacity:1}.welt .hupf .bau{transform:translateY(-16px)}' +
    '@media (hover:hover){.welt .bauplatz:hover .bau{transform:translateY(-4px)}.welt .bauplatz:hover .ring{opacity:.75}}' +
    '@media (prefers-reduced-motion:reduce){.welt .bau,.welt .ring{transition:none}}';

  /** Bild einer Stufe: die letzte vorhandene bis zu dieser Stufe, sonst das Bild des Bauteils, sonst ein Platzhalter. */
  function bildVon(b, stufe) {
    const st = Array.isArray(b && b.stufen) ? b.stufen : [];
    for (let s = Math.min(stufe, st.length) - 1; s >= 0; s--) {
      if (st[s] && Array.isArray(st[s].bild)) return { liste: st[s].bild };
      const sprite = st[s] && typeof st[s].svg === 'string' && objekt(L.sprites) ? L.sprites[st[s].svg] : null;
      if (typeof sprite === 'string') return { svg: sprite };
    }
    return { liste: b && Array.isArray(b.bild) ? b.bild : PLATZHALTER };
  }

  /** Das Gebäude, in der Mitte (cx, cy) auf der Platte: { svg, m } mit m = Ausdehnung in Zellen (x0, y0, x1, y1, h über der Platte). */
  function koerper(b, stufe, cx, cy, pal) {
    const v = bildVon(b, stufe), P = I().punkt;
    if (v.svg !== undefined) { const o = P(cx, cy, ZP); return { svg: `<g transform="translate(${I().f(o[0])} ${I().f(o[1])})">${v.svg}</g>`, m: { x0: cx - 1, y0: cy - 1, x1: cx + 1, y1: cy + 1, h: 2 } }; }
    const m = I().masse(v.liste), ox = cx - (m.x0 + m.x1) / 2, oy = cy - (m.y0 + m.y1) / 2;
    return { svg: I().bild(v.liste, { x: ox, y: oy, z: ZP, palette: pal }), m: { x0: m.x0 + ox, y0: m.y0 + oy, x1: m.x1 + ox, y1: m.y1 + oy, h: m.h } };
  }

  /** Lage der Bauplätze: offene (frei oder gebaut) und die gesperrten der nächsten Epoche. */
  function lage(thema, welt) {
    const V = L.Welt, Ld = W(), info = V.plaetze(thema, welt), offen = Math.min(info.anzahl, Ld.MAX);
    const zu = (Array.isArray(thema.epochen) ? thema.epochen : []).find(e => !V.epocheOffen(thema, welt, e.id));
    const gesperrt = zu ? Math.max(0, Math.min(Ld.MAX, zu.plaetze | 0) - offen) : 0, bauteile = objekt(thema.bauteile) ? thema.bauteile : {};
    return Ld.plan(offen + gesperrt).map(p => {
      if (p.platz >= offen) return { ...p, art: 'gesperrt', bauteil: null, stufe: 0, epoche: zu.id, name: zu.name || zu.id };
      const id = info.belegt[p.platz], b = id !== undefined && Object.hasOwn(bauteile, id) ? bauteile[id] : null, stufe = b && objekt(welt.gebaut) ? welt.gebaut[id] | 0 : 0;
      return b && stufe >= 1 ? { ...p, art: 'gebaut', bauteil: id, stufe, max: Array.isArray(b.stufen) ? b.stufen.length : 1, epoche: b.epoche ?? null, name: b.name || id, def: b }
        : { ...p, art: 'frei', bauteil: null, stufe: 0, epoche: null, name: 'Freier Bauplatz' };
    });
  }

  /** Ein Bauplatz als Gruppe: Platte, Schatten, Auswahlring, Trefferfläche, Gebäude. Gibt { svg, tafel, marke, oben } zurück. */
  function platz(p, pal, opt, ausbau) {
    const Q = I(), P = Q.punkt, f = Q.f, pt = Q.pt, cx = p.x + p.b / 2, cy = p.y + p.t / 2;
    const raute = (x, y, b, t, z) => [P(x, y, z), P(x + b, y, z), P(x + b, y + t, z), P(x, y + t, z)].map(pt).join(' ');
    const akzent = pal.hole('akzent'), ring = r => `<polygon class="ring" points="${r}" fill="${akzent}" fill-opacity=".14" stroke="${akzent}" stroke-width="5" stroke-linejoin="round" opacity="0"/>`;
    const treffer = pts => `<polygon points="${pts}" fill="currentColor" fill-opacity="0" stroke="none"/>`;
    const kopf = (klasse, label) => `<g class="${['bauplatz', klasse, opt.gewaehlt === p.platz ? 'gewaehlt' : ''].filter(Boolean).join(' ')}" data-platz="${p.platz}" data-art="${p.art}"${p.bauteil ? ` data-bauteil="${esc(p.bauteil)}"` : ''} role="button" tabindex="0" aria-label="${esc(label)}">`;
    const unter = (sx, sy, sw, st) => ({ platte: Q.kachel({ x: sx, y: sy, b: sw, t: st, z: ZP, dicke: ZP, farbe: pal.hole('platte', 'stein') }, pal), slab: raute(sx - .14, sy - .14, sw + .28, st + .28, ZP) });
    const { platte, slab } = unter(p.x + .1, p.y + .1, p.b - .2, p.t - .2);
    if (p.art === 'gesperrt') {
      const tinte = pal.hole('tinte-leise'), o = P(cx, cy);
      return { tafel: '', oben: o[1], rect: [p.x - .1, p.y - .1, p.x + p.b + .1, p.y + p.t + .1], svg: kopf('leer gesperrt', `Bauplatz der Epoche ${p.name}, gesperrt`) + `<polygon points="${raute(p.x, p.y, p.b, p.t, 0)}" fill="${pal.weiss}" fill-opacity=".34"/>` +
        ring(raute(p.x - .1, p.y - .1, p.b + .2, p.t + .2, 0)) + `<polygon points="${raute(p.x, p.y, p.b, p.t, 0)}" fill="none" stroke="${tinte}" stroke-opacity=".75" stroke-width="2.4" stroke-dasharray="10 8" stroke-linejoin="round"/>` +
        `<g transform="translate(${f(o[0])} ${f(o[1] - 4)}) scale(1.35)" fill="none" stroke="${tinte}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"><rect x="-9" y="-3" width="18" height="14" rx="3" fill="${pal.hole('papier', 'kalk', 'flaeche')}"/><path d="M-5.5 -3v-4a5.5 5.5 0 0 1 11 0v4"/></g>` +
        treffer(raute(p.x, p.y, p.b, p.t, 0)) + '</g>' };
    }
    if (p.art === 'frei') {
      const m = pal.hole('tinte-leise'), o = P(cx, cy, ZP);                       // Marke «hier lässt sich bauen»: Plus im Kreis, flach auf dem Bildschirm
      return { tafel: '', oben: o[1] - 24, rect: [p.x - .1, p.y - .1, p.x + p.b + .1, p.y + p.t + .1], svg: kopf('leer frei', 'Freier Bauplatz') + platte + ring(slab) +
        `<g transform="translate(${f(o[0])} ${f(o[1])})"><circle r="24" fill="${pal.weiss}" fill-opacity=".9" stroke="${m}" stroke-opacity=".5" stroke-width="1.5"/>` +
        `<path d="M-9 0H9M0 -9V9" stroke="${m}" stroke-width="3" stroke-linecap="round" fill="none"/></g>` + treffer(slab) + '</g>' };
    }
    const k = koerper(p.def, p.stufe, cx, cy, pal), m = k.m, H = ZP + m.h, a = m.x0, b = m.y0, c = m.x1, d = m.y1, l = Math.min(.8, m.h * .5);
    const sw = Math.max(p.b - .2, c - a + .3), st = Math.max(p.t - .2, d - b + .3), u = unter(cx - sw / 2, cy - st / 2, sw, st);
    const hull = [P(a, b, H), P(c, b, H), P(c, d, H * .6), P(c, d, 0), P(a, d, 0), P(a, d, H * .6)].map(pt).join(' ');
    const schatten = Q.poly([P(c, b, ZP + .01), P(c + l, b + l * .35, ZP + .01), P(c + l, d + l * .35, ZP + .01), P(c, d, ZP + .01)], pal.tinte, ' fill-opacity=".07" stroke-opacity="0"');
    const spitze = P(cx, cy, H + .35), w = ausbau.has(p.bauteil) ? 74 : 44, ton = pal.tinte;
    const mass = `<g class="mass" transform="scale(${opt.marke || 1})">`, marke = `<g class="marke" pointer-events="none" transform="translate(${f(spitze[0])} ${f(spitze[1])})">${mass}<g transform="translate(0 -16)"><rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="${pal.weiss}" fill-opacity=".94" stroke="${ton}" stroke-opacity=".16" stroke-width="1.5"/>` +
      `<text x="${ausbau.has(p.bauteil) ? -w / 2 + 14 : 0}" y="6.2" font-size="17" font-weight="650" fill="${ton}" text-anchor="${ausbau.has(p.bauteil) ? 'start' : 'middle'}">${p.stufe}</text>` +
      (ausbau.has(p.bauteil) ? `<g transform="translate(${w / 2 - 25} 0)"><circle r="11" fill="${akzent}"/><path d="M0 6V-5M-5 0 0 -5.5 5 0" stroke="${pal.weiss}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>` : '') + '</g></g></g>';
    const bw = esc(p.name).length * 11.5 + 36;
    const tafel = `<g transform="translate(${f(spitze[0])} ${f(spitze[1])})">${mass}<g transform="translate(0 -56)"><rect x="${f(-bw / 2)}" y="-17" width="${f(bw)}" height="34" rx="8" fill="${ton}" fill-opacity=".92"/><path d="M-7 17h14l-7 8z" fill="${ton}" fill-opacity=".92"/>` +
      `<text y="6" text-anchor="middle" font-size="18" font-weight="600" fill="${pal.weiss}">${esc(p.name)}</text></g></g></g>`;
    return { tafel, marke, oben: spitze[1] - 56 - 25 - 4, rect: [cx - sw / 2 - .1, cy - st / 2 - .1, cx + sw / 2 + .1, cy + st / 2 + .1],
      svg: kopf('', `${p.name}, Stufe ${p.stufe} von ${p.max}`) + u.platte + schatten + ring(u.slab) + treffer(u.slab) + treffer(hull) + `<g class="bau">${k.svg}</g></g>` };
  }

  /** Die ganze Karte als SVG-Text. opt: { gewaehlt, ausbau, palette, praefix (Vorsilbe der IDs), randOben (zusätzlicher Platz oben in Einheiten) }. */
  function baue(thema, welt, opt = {}) {
    if (!objekt(thema)) return { svg: '', viewBox: '0 0 0 0', plaetze: [] };
    const Q = I(), Ld = W(), pal = Q.palette(opt.palette), pre = opt.praefix || 'lw-', ausbau = new Set(opt.ausbau || []);
    const liste = lage(thema, objekt(welt) ? welt : {});
    if (!liste.length) return { svg: '', viewBox: '0 0 0 0', plaetze: [] };                  // ein Thema ohne Bauplätze hat keine Karte
    const ins = Ld.insel(liste), u = Ld.umriss(ins), bd = Ld.boden(ins, pal);
    const plaetze = liste.map(p => ({ p, e: platz(p, pal, opt, ausbau) }));
    const objs = [...Ld.baeume(ins, pre), ...plaetze.map(({ e }) => ({ x0: e.rect[0], y0: e.rect[1], x1: e.rect[2], y1: e.rect[3], svg: e.svg }))];
    const y0 = Math.min(u.y0, ...plaetze.map(({ e }) => e.oben)) - (opt.randOben || 0) - 16, x0 = u.x0 - 16, w = u.x1 - u.x0 + 32, h = u.y1 - y0 + 16;
    const viewBox = [x0, y0, w, h].map(Q.f).join(' '), gebaut = plaetze.filter(({ p }) => p.art === 'gebaut').length;
    const sel = plaetze.find(({ p }) => p.platz === opt.gewaehlt), name = gebaut === 0 ? 'Insel ohne Gebäude' : gebaut === 1 ? 'Insel mit einem Gebäude' : `Insel mit ${gebaut} Gebäuden`;
    const marken = plaetze.map(({ e }) => e.marke || '').join('');
    const svg = `<svg class="welt" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${name}" style="-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent">` +
      `<style>${STIL}</style>${Ld.defs(pal, pre)}${bd.svg}${Ld.wasser(ins, u, pal, bd.ring)}${Ld.ordne(objs).map(o => o.svg).join('')}${marken}<g class="tafel" id="${pre}tafel" pointer-events="none">${sel ? sel.e.tafel : ''}</g></svg>`;
    return { svg, viewBox, plaetze: plaetze.map(({ p, e }) => { const { def, ...rest } = p; return { ...rest, tafel: e.tafel }; }) };
  }

  /** Wie hoch Rauch und Antennenschüssel über die Platte ragen. Iso.masse zählt sie nicht zur Höhe (die Karte legt das Schild darüber), die Vorschau
      braucht aber Platz für sie (V-AP15-03). In Rasterzellen über der Platte, 0 ohne beide. */
  function ueberstand(liste) {
    let h = 0;
    try {
      for (const { art, r } of I().normal(liste)) {
        const z = Number(r.z) || 0;
        if (art === 'rauch') h = Math.max(h, z + 58 / I().HE);
        else if (art === 'schale') h = Math.max(h, z + (36 + (Number(r.r) || 0)) / I().HE);
      }
    } catch (fehler) { return 0; }
    return h;
  }

  /** Gebäude einer Stufe auf seiner Platte für das Informationsfeld: SVG-Text mit viewBox im Seitenverhältnis von opt.breite zu opt.hoehe. */
  function vorschau(thema, id, stufe = 1, opt = {}) {
    const Q = I(), P = Q.punkt, pal = Q.palette(opt.palette ?? lesePalette()), bw = opt.breite || 108, bh = opt.hoehe || 84;
    const b = objekt(thema) && objekt(thema.bauteile) && Object.hasOwn(thema.bauteile, id) ? thema.bauteile[id] : null;
    if (!b) return '';
    const k = koerper(b, stufe, 0, 0, pal), m = k.m, s = Math.max(m.x1 - m.x0, m.y1 - m.y0, 1.6) + .6, h = s / 2, hoch = Math.max(m.h, ueberstand(bildVon(b, stufe).liste || []));
    const platte = Q.kachel({ x: -h, y: -h, b: s, t: s, z: ZP, dicke: ZP, farbe: pal.hole('platte', 'stein') }, pal);
    const x0 = P(-h, h)[0] - 18, x1 = P(h, -h)[0] + 18, y0 = P(0, 0, ZP + hoch + .3)[1] - 14, y1 = P(h, h, -.05)[1] + 14, w = x1 - x0, hh = y1 - y0, kk = Math.max(w / bw, hh / bh);
    const box = [x0 - (bw * kk - w) / 2, y0 - (bh * kk - hh) / 2, bw * kk, bh * kk].map(Q.f).join(' ');
    return `<svg class="iso-vorschau" xmlns="http://www.w3.org/2000/svg" viewBox="${box}" aria-hidden="true" focusable="false">${platte}${k.svg}</svg>`;
  }

  /** CSS-Variablen von :root als Palette-Funktion, oder null ohne Browser. */
  function lesePalette() {
    const d = g.document;
    if (!d || !d.documentElement || typeof g.getComputedStyle !== 'function') return null;
    const stil = g.getComputedStyle(d.documentElement);
    return n => String(stil.getPropertyValue('--' + n) || '').trim();
  }

  const KARTEN = new WeakMap();
  let zaehler = 0;
  function karte(huelle, thema, weltStand, optionen = {}) {
    if (KARTEN.has(huelle)) KARTEN.get(huelle).zerstoere();
    const doc = huelle.ownerDocument || g.document, pre = `lwk${++zaehler}-`, el = doc.createElement('div');
    el.setAttribute('class', 'welt-karte');
    let welt = weltStand, opt = optionen, gewaehlt = Number.isInteger(optionen.gewaehlt) ? optionen.gewaehlt : null, erg = { plaetze: [] }, down = null, tot = false, marke = 1;
    const zeichne = () => {
      erg = baue(thema, welt, { ...opt, palette: opt.palette ?? lesePalette(), gewaehlt, praefix: pre, marke });
      el.innerHTML = erg.svg;
    };
    const finde = platzNr => erg.plaetze.find(p => p.platz === platzNr) || null;
    const anwenden = () => el.querySelectorAll('.mass').forEach(n => n.setAttribute('transform', `scale(${marke})`));
    /** Stufenmarken und Schild bleiben lesbar: wird die Karte kleiner dargestellt, wachsen sie mit (etwa 13 Pixel Schrift, höchstens 2,4fach). */
    function skaliere() {
      const [, , vw, vh] = String(erg.viewBox || '').split(' ').map(Number), b = el.clientWidth, h = el.clientHeight;
      if (tot || !el.querySelectorAll || !(b > 0 && h > 0 && vw > 0 && vh > 0)) return;
      const m = Math.round(Math.min(2.4, Math.max(1, .75 / Math.min(b / vw, h / vh))) * 50) / 50;
      if (m !== marke) { marke = m; anwenden(); }
    }
    function markiere() {
      if (!el.querySelector) return zeichne();                    // Mini-DOM ohne Suche: neu zeichnen
      el.querySelectorAll('.bauplatz.gewaehlt').forEach(n => n.classList.remove('gewaehlt'));
      const n = gewaehlt === null ? null : el.querySelector(`[data-platz="${gewaehlt}"]`);
      if (n) n.classList.add('gewaehlt');
      const t = el.querySelector(`#${pre}tafel`);
      if (t) { t.innerHTML = gewaehlt !== null && finde(gewaehlt) ? finde(gewaehlt).tafel : ''; anwenden(); }
    }
    function waehle(nr, o = {}) {
      if (tot) return;
      if (nr === null) { gewaehlt = null; markiere(); return; }
      const p = finde(nr);
      if (!p) return;
      gewaehlt = nr;
      markiere();
      if (!o.still && typeof opt.onWahl === 'function') opt.onWahl({ platz: p.platz, art: p.art, bauteil: p.bauteil, stufe: p.stufe, epoche: p.epoche });
    }
    const platzNr = ziel => {
      for (let n = ziel; n && n !== el; n = n.parentNode) { const v = n.getAttribute && n.getAttribute('data-platz'); if (v !== null && v !== undefined) return +v; }
      return null;
    };
    el.addEventListener('pointerdown', e => { down = e.isPrimary === false || (e.button || 0) !== 0 ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, platz: platzNr(e.target) }; });
    el.addEventListener('pointerup', e => {
      const d = down;
      down = null;
      if (d && d.platz !== null && d.id === e.pointerId && Math.hypot(e.clientX - d.x, e.clientY - d.y) <= WEG) waehle(d.platz);
    });
    el.addEventListener('pointercancel', () => { down = null; });
    el.addEventListener('keydown', e => {
      const nr = e.key === 'Enter' || e.key === ' ' ? platzNr(e.target) : null;
      if (nr === null) return;
      if (e.preventDefault) e.preventDefault();
      waehle(nr);
    });

    const regler = {
      el,
      waehle,
      gewaehlt: () => gewaehlt,
      plaetze: () => erg.plaetze.map(({ tafel, ...p }) => p),
      aktualisiere(neu, neueOpt) {
        if (tot) return;
        if (neu !== undefined) welt = neu;
        if (neueOpt) opt = { ...opt, ...neueOpt };
        const fokus = doc.activeElement && el.contains && el.contains(doc.activeElement) ? platzNr(doc.activeElement) : null;
        zeichne();
        if (gewaehlt !== null && !finde(gewaehlt)) gewaehlt = null;
        if (fokus !== null && el.querySelector) { const n = el.querySelector(`[data-platz="${fokus}"]`); if (n && n.focus) n.focus(); }
      },
      hupf(nr) {                                                 // das Gebäude springt kurz: Rückmeldung nach dem Ausbau
        const n = el.querySelector ? el.querySelector(`[data-platz="${nr}"]`) : null;
        if (!n) return;
        n.classList.add('hupf');
        setTimeout(() => n.classList.remove('hupf'), 260);
      },
      zerstoere() { tot = true; if (beobachter) beobachter.disconnect(); if (el.parentNode) el.parentNode.removeChild(el); if (KARTEN.get(huelle) === regler) KARTEN.delete(huelle); }
    };
    const beobachter = typeof g.ResizeObserver === 'function' ? new g.ResizeObserver(skaliere) : null;
    zeichne();
    huelle.append(el);
    KARTEN.set(huelle, regler);
    if (beobachter) beobachter.observe(el);
    skaliere();
    return regler;
  }

  Object.assign(R, { baue, karte, vorschau, lage, lesePalette, STIL });
})(globalThis);
