/* app/welt/iso-objekte.js: Rohstoffe als kleine Objekte und die Iso-Miniaturen des Docks (Architektur 7.7, Umbauplan 3.6, Vorbild docs/mockup/richtung-c/symbole-c.js).
   Iso.objekt(name, { groesse = 28, leer }) → SVG-Text: stein Steinblock, holz Stamm mit Jahresringen, handelsgut Kiste mit Seil, proben Fläschchen, dazu ziegel
     und balken, unbekannt eine ruhige Kugel. Töne nur über var(--rs-…) mit Rückfall auf die Palette aus tokens.css, Licht und Schatten als Überzug in
     --flaeche und --tinte. leer: graue Fassung für «fehlt» oder «noch 0».
   Iso.mini(name, { grau, groesse = 44, palette }) → Iso-Miniatur (start: Insel mit Fahne, siedlung, forschung, lernen, auftraege, logbuch, tor), gezeichnet mit dem Bausatz iso.js.
   Iso.stapel(name, n, { palette }) → kleiner Stapel (Lager, Abschluss). Kein DOM, keine Farbwerte im Skript: die Palette kommt aus den CSS-Variablen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const I = (L.Iso = L.Iso || {});
  const r1 = n => Math.round(n * 10) / 10;

  // ---- Objekte im Feld 40 x 40 -------------------------------------------------------------------------------------
  const TOENE = {
    stein: { grund: 'rs-stein', hell: 'rs-stein-hell', ersatz: 'stein' },
    holz: { grund: 'rs-holz', stirn: 'rs-holz-stirn', ersatz: 'holz' },
    handelsgut: { grund: 'rs-handel', akz: 'rs-handel-reif', ersatz: 'sand' },
    proben: { grund: 'rs-proben', akz: 'rs-proben-blatt', glas: 'proben-tint', kork: 'rs-holz', ersatz: 'meer' },
    ziegel: { grund: 'ziegel', ersatz: 'holz' },
    balken: { grund: 'brett', stirn: 'rs-holz-stirn', ersatz: 'holz' },
    kugel: { grund: 'akzent-mitte', ersatz: 'meer' }
  };
  const LEER = { grund: 'spur', hell: 'gesperrt', stirn: 'gesperrt', akz: 'lampe-aus', glas: 'gesperrt', kork: 'spur' };
  const ueber = (n, o) => `style="fill:var(--${n})" fill-opacity="${o}"`;
  const LICHT = ueber('flaeche', .45), SCHATTEN = ueber('tinte', .2), HALB = ueber('tinte', .09);
  const kante = (o = .35, w = .9) => `fill="none" style="stroke:var(--tinte)" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  /** Kleiner Quader im Objektfeld: drei Flächen aus einem Ton, oben aufgehellt, rechts abgedunkelt. */
  function klotz(x, y, z, b, t, h, ton) {
    const k = 6.2, P = (a, c, d) => [20 + (a - c) * k, 24 + (a + c) * k / 2 - d * k], pts = l => l.map(p => P(...p).map(r1).join(',')).join(' ');
    const o = pts([[x, y, z + h], [x + b, y, z + h], [x + b, y + t, z + h], [x, y + t, z + h]]), l = pts([[x, y + t, z + h], [x + b, y + t, z + h], [x + b, y + t, z], [x, y + t, z]]);
    const r = pts([[x + b, y, z + h], [x + b, y + t, z + h], [x + b, y + t, z], [x + b, y, z]]);
    return `<polygon points="${l}" ${ton}/><polygon points="${r}" ${ton}/><polygon points="${r}" ${SCHATTEN}/><polygon points="${o}" ${ton}/><polygon points="${o}" ${LICHT}/>` +
      `<path d="M${l.split(' ').join('L')}ZM${r.split(' ').join('L')}Z" ${kante(.22, .7)}/>`;
  }
  const OBJEKTE = {
    stein: f => `<polygon points="8,17 13,21 15,32 7,27" ${f('grund')}/><polygon points="13,21 26,20 27,31 15,32" ${f('grund')}/><polygon points="13,21 26,20 27,31 15,32" ${HALB}/>` +
      `<polygon points="26,20 33,14 33,25 27,31" ${f('grund')}/><polygon points="26,20 33,14 33,25 27,31" ${SCHATTEN}/><polygon points="8,17 14,10 25,8 33,14 26,20 13,21" ${f('hell')}/>` +
      `<path d="M17 24.5l3 1.6.4 3.2M29 19.5l1.6 3M8 17l5 4 13-1 7-6M13 21l2 11M26 20l1 11" ${kante(.3, 1)}/><path d="M8 17 14 10 25 8 33 14" fill="none" style="stroke:var(--flaeche)" stroke-opacity=".8" stroke-width="1.2" stroke-linejoin="round"/>`,
    holz: f => `<polygon points="12,17.5 30,8.5 30,23.5 12,32.5" ${f('grund')}/><polygon points="12,25 30,16 30,23.5 12,32.5" ${HALB}/>` +
      `<ellipse cx="30" cy="16" rx="3.4" ry="7.5" ${f('grund')}/><ellipse cx="30" cy="16" rx="3.4" ry="7.5" ${SCHATTEN}/>` +
      `<path d="M15 20.6 26 15.1M16 28.4l9-4.5M20 23.6l5-2.5" ${kante(.32, 1.1)}/><path d="M12 17.5 30 8.5" fill="none" style="stroke:var(--flaeche)" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>` +
      `<ellipse cx="12" cy="25" rx="5.4" ry="7.6" ${f('stirn')}/><ellipse cx="12" cy="25" rx="5.4" ry="7.6" ${kante(.45, 1)}/>` +
      `<ellipse cx="12" cy="25" rx="3.2" ry="4.7" ${kante(.3, .9)}/><ellipse cx="12" cy="25" rx="1.2" ry="1.8" ${f('grund')}/>`,
    handelsgut: f => `<polygon points="7,14 20,20 20,33 7,27" ${f('grund')}/><polygon points="20,20 33,14 33,27 20,33" ${f('grund')}/><polygon points="20,20 33,14 33,27 20,33" ${SCHATTEN}/>` +
      `<polygon points="7,14 20,8 33,14 20,20" ${f('grund')}/><polygon points="7,14 20,8 33,14 20,20" ${LICHT}/>` +
      `<path d="M7 18.4 20 24.6M7 22.7 20 28.9M20 24.6 33 18.4M20 28.9 33 22.7M7 14l13 6 13-6M20 20v13" ${kante(.28, .9)}/>` +
      `<path d="M13.5 11 26.5 17V30" fill="none" ${f('akz').replace('fill:', 'stroke:')} stroke-width="2.6" stroke-linejoin="round"/>`,
    proben: f => `<circle cx="20" cy="25" r="10" ${f('glas')}/><path d="M10.4 27.2A10 10 0 0 0 29.6 27.2Z" ${f('grund')}/>` +
      `<rect x="16.6" y="7" width="6.8" height="10" ${f('glas')}/><circle cx="20" cy="25" r="10" ${kante(.4, 1.1)}/><path d="M16.6 7v9.4M23.4 7v9.4" ${kante(.4, 1.1)}/>` +
      `<rect x="15.8" y="3.6" width="8.4" height="5" rx="1.6" ${f('kork')}/><path d="M17 26.5c0-2.6 2-4.4 5-4.4 0 2.6-2 4.4-5 4.4z" ${f('akz')}/>` +
      `<path d="M14 21.5a7 7 0 0 1 4-3.6" fill="none" style="stroke:var(--flaeche)" stroke-width="1.8" stroke-linecap="round"/>`,
    ziegel: f => klotz(-1.3, -.6, 0, 2.6, 1.1, .75, f('grund')) + klotz(-1.1, -.5, .75, 2.2, 1, .7, f('grund')),
    balken: f => klotz(-2, -.45, 0, 3.6, .9, .9, f('grund')) + klotz(-2, -.45, .9, 3.6, .9, .85, f('grund')),
    kugel: f => `<ellipse cx="20" cy="33" rx="10" ry="3" ${HALB}/><circle cx="20" cy="20" r="11.5" ${f('grund')}/><path d="M9.5 24a11.5 11.5 0 0 0 21 0z" ${HALB}/>` +
      `<ellipse cx="16" cy="15" rx="4.6" ry="3.2" ${LICHT}/><circle cx="20" cy="20" r="11.5" ${kante(.3, 1)}/>`
  };
  const SCHATTEN_BODEN = `<ellipse cx="20" cy="34.5" rx="13" ry="3" ${ueber('tinte', .1)}/>`;

  /** Rohstoff oder Gut als kleines Objekt. Unbekannte Namen ergeben die Kugel. */
  function objekt(name, opt = {}) {
    const art = Object.hasOwn(OBJEKTE, name) ? name : 'kugel', t = TOENE[art], gr = opt.groesse || 28;
    const f = rolle => (opt.leer ? `style="fill:var(--${LEER[rolle] || 'spur'}, var(--stein))"` : `style="fill:var(--${t[rolle] || t.grund}, var(--${t.ersatz}))"`);
    const klasse = ['iso-objekt', `iso-objekt-${art}`, opt.leer ? 'leer' : '', opt.klasse].filter(Boolean).join(' ');
    return `<svg class="${klasse}" viewBox="0 0 40 40" width="${gr}" height="${gr}" aria-hidden="true" focusable="false">${art === 'kugel' ? '' : SCHATTEN_BODEN}${OBJEKTE[art](f)}</svg>`;
  }

  // ---- Miniaturen und Stapel mit dem Bausatz ---------------------------------------------------------------------
  function farben(opt) {
    const quelle = opt.palette ?? (L.Render && typeof L.Render.lesePalette === 'function' ? L.Render.lesePalette() : null);
    const pal = I.palette(quelle);
    if (!opt.grau) return pal;
    const g0 = pal.hole('stein'), m = c => I.mischen(I.mischen(c, g0, .78), pal.weiss, .22);
    return { hole: (...a) => m(pal.hole(...a)), mix: (a, b, t) => m(pal.mix(a, b, t)), drei: (...a) => { const c = pal.drei(...a); return { o: m(c.o), l: m(c.l), r: m(c.r) }; }, weiss: pal.weiss, tinte: m(pal.tinte) };
  }
  const q = (a, p) => I.quader(a, p), F = () => I.formen;
  const sockel = p => q({ x: -1.05, y: -1.05, z: -.4, b: 2.1, t: 2.1, h: .4, farbe: 'erde' }, p) + I.kachel({ x: -1.05, y: -1.05, b: 2.1, t: 2.1, farbe: 'gras' }, p);
  const tanne = (cx, cy, p) => q({ x: cx - .06, y: cy - .06, b: .12, t: .12, h: .2, farbe: 'holz' }, p) +
    [[.15, .42, .55], [.5, .32, .5]].map(([z, r, h]) => F().kegel({ cx, cy, z, r, h, farbe: p.hole('tanne', 'gras') }, p)).join('');
  const MINI = {
    start: [.9, p => `<ellipse cx="0" cy="40" rx="122" ry="46" fill="${p.hole('meer')}"/>` + sockel(p) + tanne(-.45, .4, p) + tanne(.3, .55, p) +
      F().fahne({ x: .35, y: -.4, z: 0, h: 1.3, farbe: 'akzent' }, p)],
    siedlung: [1, p => sockel(p) + q({ x: -.6, y: -.5, b: 1.2, t: 1, h: .62, farbe: 'kalk' }, p) + I.dach({ x: -.6, y: -.5, z: .62, b: 1.2, t: 1, h: .5, farbe: 'ziegel', achse: 'y', giebel: 'kalk' }, p) +
      q({ x: .05, y: -.3, z: .85, b: .2, t: .2, h: .4, farbe: 'stein' }, p)],
    forschung: [.72, p => sockel(p) + q({ x: -.7, y: -.7, b: 1.4, t: 1.4, h: .2, farbe: 'stein' }, p) + F().zylinder({ cx: 0, cy: 0, r: .45, z: .2, h: 1.1, farbe: 'kalk' }, p) +
      F().zylinder({ cx: 0, cy: 0, r: .56, z: 1.3, h: .08, farbe: 'schiefer' }, p) + F().kuppel({ cx: 0, cy: 0, r: .45, z: 1.38, h: .45, farbe: 'akzent-mitte' }, p) + F().fahne({ x: 0, y: 0, z: 1.8, h: .45, farbe: 'akzent' }, p)],
    lernen: [1, p => q({ x: -1.05, y: -.75, b: 2.1, t: 1.5, h: .08, farbe: 'akzent' }, p) + q({ x: -1, y: -.7, z: .08, b: .98, t: 1.4, h: .12, farbe: 'papier' }, p) +
      q({ x: .02, y: -.7, z: .08, b: .98, t: 1.4, h: .12, farbe: 'papier' }, p) + I.poly([I.punkt(.2, .5, .22), I.punkt(.9, -.9, 1.5), I.punkt(.55, -.2, .7)], p.hole('flaeche'), ` style="stroke:var(--tinte-leise)" stroke-width="2"`)],
    auftraege: [1, p => `<ellipse cx="0" cy="34" rx="118" ry="44" fill="${p.hole('meer')}"/>` + I.poly([[-80, 10], [0, 10], [0, 42], [-56, 42]], p.hole('brett')) +
      I.poly([[0, 10], [80, 10], [56, 42], [0, 42]], p.hole('dachholz')) + `<path d="M0 10V-118" stroke="${p.hole('tinte-leise')}" stroke-width="5" stroke-linecap="round"/>` +
      I.poly([[0, -112], [-64, -6], [0, -6]], p.hole('papier')) + I.poly([[0, -96], [50, -6], [0, -6]], p.mix('papier', 'tinte', .12)) + I.poly([[0, -118], [28, -110], [0, -102]], p.hole('akzent'))],
    logbuch: [1, p => q({ x: -.95, y: -.75, b: 1.9, t: 1.5, h: .12, farbe: 'akzent' }, p) + q({ x: -.88, y: -.7, z: .12, b: 1.78, t: 1.38, h: .3, farbe: 'papier' }, p) +
      q({ x: -.95, y: -.75, z: .42, b: 1.9, t: 1.5, h: .1, farbe: 'akzent' }, p) + q({ x: .35, y: -.75, z: .52, b: .22, t: 1.5, h: .02, farbe: 'ziegel' }, p)],
    tor: [.85, p => sockel(p) + q({ x: -.25, y: -.9, b: .4, t: .4, h: 1.2, farbe: 'kalk' }, p) + q({ x: -.25, y: .5, b: .4, t: .4, h: 1.2, farbe: 'kalk' }, p) +
      q({ x: -.15, y: -.5, b: .1, t: 1, h: 1, farbe: 'dachholz', rillen: 3 }, p) + q({ x: -.3, y: -.95, z: 1.2, b: .5, t: 1.9, h: .26, farbe: 'stein' }, p)]
  };
  /** Iso-Miniatur für Dock und Ortsschilder. Unbekannte Namen ergeben die Siedlung. */
  function mini(name, opt = {}) {
    const art = Object.hasOwn(MINI, name) ? name : 'siedlung', [s, zeichne] = MINI[art], gr = opt.groesse || 44, p = farben(opt);
    const klasse = ['iso-mini', `iso-mini-${art}`, opt.grau ? 'grau' : ''].filter(Boolean).join(' ');
    return `<svg class="${klasse}" viewBox="-136 -128 272 226" width="${gr}" height="${r1(gr * 226 / 272)}" aria-hidden="true" focusable="false"><g transform="translate(0 ${r1((1 - s) * 40)}) scale(${s})">${zeichne(p)}</g></svg>`;
  }

  const POS = [[0, 0, 0], [.62, 0, 0], [0, .62, 0], [.62, .62, 0], [.31, .04, .42], [.31, .6, .42], [.31, .31, .84], [.95, .31, .42], [0, .31, .84], [.62, .31, .84]];
  const LANG = []; [[0, [0, .28, .56, .84]], [.24, [.14, .42, .7]], [.48, [.28, .56]], [.72, [.42]]].forEach(([z, ys]) => ys.forEach(y => LANG.push([0, y, z])));
  const STUECK = {
    stein: (x, y, z, p) => q({ x, y, z, b: .55, t: .55, h: .38, farbe: 'stein' }, p),
    handelsgut: (x, y, z, p) => q({ x, y, z, b: .55, t: .55, h: .4, farbe: 'rs-handel', rillen: 2 }, p),
    proben: (x, y, z, p) => F().zylinder({ cx: x + .27, cy: y + .27, r: .2, z, h: .32, farbe: 'rs-proben' }, p) + F().zylinder({ cx: x + .27, cy: y + .27, r: .08, z: z + .32, h: .1, farbe: 'holz' }, p),
    ziegel: (x, y, z, p) => q({ x, y, z, b: .58, t: .3, h: .2, farbe: 'ziegel' }, p),
    holz: (x, y, z, p) => { const e = I.punkt(x + 1.25, y + .12, z + .11); return q({ x, y, z, b: 1.25, t: .25, h: .23, farbe: 'holz' }, p) +
      `<ellipse cx="${r1(e[0])}" cy="${r1(e[1])}" rx="6.4" ry="7" transform="rotate(-24 ${r1(e[0])} ${r1(e[1])})" fill="${p.hole('rs-holz-stirn', 'sand')}"/>`; },
    balken: (x, y, z, p) => q({ x, y, z, b: 1.25, t: .26, h: .24, farbe: 'brett' }, p)
  };
  /** Kleiner Stapel aus n Stücken (höchstens 10) auf einer Platte. */
  function stapel(name, n, opt = {}) {
    const p = farben(opt), lang = name === 'holz' || name === 'balken', zahl = Math.max(0, Math.min(10, n | 0));
    const zeichne = STUECK[name] || ((x, y, z, pp) => q({ x, y, z, b: .55, t: .55, h: .38, farbe: 'akzent-mitte' }, pp));
    const reihe = (lang ? LANG : POS).slice(0, zahl).map(o => o).sort((a, b) => a[2] - b[2] || (a[0] + a[1]) - (b[0] + b[1]));
    const platte = I.kachel({ x: -.25, y: -.25, b: lang ? 1.75 : 1.65, t: 1.6, dicke: .1, farbe: 'sand' }, p);
    return `<svg class="iso-stapel iso-stapel-${STUECK[name] ? name : 'kugel'}" viewBox="-150 -125 300 190" width="${opt.breite || 120}" height="${r1((opt.breite || 120) * 190 / 300)}" aria-hidden="true" focusable="false">${platte}${reihe.map(o => zeichne(o[0], o[1], o[2], p)).join('')}</svg>`;
  }

  Object.assign(I, { objekt, mini, stapel, OBJEKTE: Object.keys(OBJEKTE), MINIS: Object.keys(MINI) });
})(globalThis);
