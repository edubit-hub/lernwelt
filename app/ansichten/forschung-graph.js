/* app/ansichten/forschung-graph.js: der Forschungsbaum als SVG-Graph (Architektur 7.8, Mockup docs/mockup/siedlung.html, AP-16).
   modell(k) berechnet Lage und Zustand der Knoten ohne DOM (testbar), zeichne(modell, opt) macht daraus SVG-Text. Farben stehen nur als Klassen im Text
   (welt-ansichten.css, Token aus tokens.css), nie als Werte.
   Aufbau wie im Mockup: eine Spalte je Fach, eine Zeile je Wissensstufe, ein Band je Epoche. Knoten mit `summe` (die Tore) laufen als breite Zeile am Ende ihres Bandes.
   Das Welt-Thema kennt keine Kanten: sie ergeben sich aus der Reihenfolge je Spalte, ein Tor liegt zwischen den Epochen. Bänder hinter der ersten geschlossenen Epoche
   bleiben sichtbar als «Horizont». Zustände eines Knotens: erforscht, moeglich, gesperrt, horizont (WeltBedingungen.zustand). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const BREITE = 716, ABSTAND = 170, NB = 156, NH = 74, TORH = 60, REIHE = 108, FOLGE = ['mathe', 'deutsch', 'englisch', 'nmg'];
  const liste = x => (Array.isArray(x) ? x : []);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const r1 = n => Math.round(n * 10) / 10;
  const fachVon = f => (f.bereich ? String(f.bereich).split('.')[0] : null);

  /** Modell des Baums für den Kontext k: { spalten, baender, knoten, kanten, hoehe, breite }. gewaehlt: ID des gewählten Knotens. */
  function modell(k, gewaehlt = null) {
    const D = L.WeltDaten, C = L.WeltBedingungen, alle = liste(k.thema.forschung), es = liste(k.thema.epochen);
    const faecher = [...new Set(alle.map(fachVon).filter(Boolean))].sort((a, b) => (FOLGE.indexOf(a) + 1 || 99) - (FOLGE.indexOf(b) + 1 || 99) || (a < b ? -1 : 1));
    const spalten = faecher.map((fach, i) => {
      const roh = Object.values(k.thema.rohstoffe || {}).find(r => r.fach === fach);
      return { fach, name: L.Texte.welt.fach[fach] || fach.charAt(0).toUpperCase() + fach.slice(1), symbol: roh ? roh.symbol : null, x: BREITE / 2 + (i - (faecher.length - 1) / 2) * ABSTAND };
    });
    const erste = es.findIndex(e => !L.Welt.epocheOffen(k.thema, k.stand, e.id)), ziel = D.ziel(k);
    const epochen = es.length ? es.map((e, i) => ({ id: e.id, name: e.name || e.id, nr: i + 1 })) : [{ id: undefined, name: '', nr: 1 }];
    const knoten = [], baender = [];
    let y = 40;
    epochen.forEach((e, bi) => {
      const hier = alle.filter(f => (es.length ? f.epoche === e.id : true)), normal = hier.filter(f => f.summe === undefined), tore = hier.filter(f => f.summe !== undefined);
      const rang = new Map(), anzahl = {};
      [...normal].sort((a, b) => (a.wissen ?? 0) - (b.wissen ?? 0)).forEach(f => { const fach = fachVon(f); rang.set(f.id, anzahl[fach] = (anzahl[fach] ?? -1) + 1); });
      const reihen = normal.length ? Math.max(...Object.values(anzahl)) + 1 : 0, y0 = y, mitte = r => y0 + 84 + r * REIHE;
      normal.forEach(f => { const s = faecher.indexOf(fachVon(f)); knoten.push({ f, band: bi, spalte: s, tor: false, x: spalten[s].x - NB / 2, y: mitte(rang.get(f.id)) - NH / 2, w: NB, h: NH, rang: rang.get(f.id) }); });
      let ende = reihen ? mitte(reihen - 1) + NH / 2 + 18 : y0 + 56;
      tore.forEach((f, i) => { const c = (reihen ? mitte(reihen - 1) + 90 : y0 + 70) + i * (TORH + 16); knoten.push({ f, band: bi, spalte: -1, tor: true, x: 26, y: c - TORH / 2, w: BREITE - 52, h: TORH, rang: reihen }); ende = c + TORH / 2 + 4; });
      baender.push({ id: e.id, name: e.name, nr: e.nr, y0, y1: ende, status: erste < 0 || bi < erste ? 'offen' : bi === erste ? 'gesperrt' : 'horizont' });
      y = ende + 12;
    });
    const mk = knoten.map(n => ({ id: n.f.id, name: n.f.name, band: n.band, spalte: n.spalte, tor: n.tor, x: r1(n.x), y: r1(n.y), w: n.w, h: n.h, rang: n.rang, zustand: C.zustand(k, n.f),
      bereich: n.f.bereich || null, wissen: (D.wissenStand(k, n.f).find(w => !w.ok) || D.wissenStand(k, n.f)[0]) || null, kosten: D.posten(k, n.f.kosten),
      ziel: !!ziel && ziel.id === n.f.id, gewaehlt: n.f.id === gewaehlt }));
    return { spalten, baender, knoten: mk, kanten: kanten(mk), hoehe: y + 4, breite: BREITE };
  }

  /** Kanten: je Spalte von Knoten zu Knoten in Reihenfolge, über das Tor, wenn zwischen ihnen eines liegt. aktiv: der Knoten davor ist erforscht. */
  function kanten(knoten) {
    const aus = [], tore = knoten.filter(n => n.tor), spaltenIds = [...new Set(knoten.filter(n => !n.tor).map(n => n.spalte))];
    const tor = (von, bis) => [...tore].reverse().find(t => t.band >= von && t.band < bis) || null;
    const kante = (a, b) => aus.push({ von: a.id, nach: b.id, aktiv: a.zustand === 'erforscht', horizont: b.zustand === 'horizont', spalte: a.tor ? b.spalte : a.spalte });
    for (const s of spaltenIds) {
      const reihe = knoten.filter(n => !n.tor && n.spalte === s).sort((a, b) => a.band - b.band || a.rang - b.rang);
      const t0 = tor(-1, reihe[0].band);
      if (t0) kante(t0, reihe[0]);
      reihe.slice(1).forEach((n, i) => { const a = reihe[i], t = a.band < n.band ? tor(a.band, n.band) : null; if (t) { kante(a, t); kante(t, n); } else kante(a, n); });
    }
    return aus;
  }

  function bandSvg(b, m) {
    const T = L.Texte.welt, titel = `${T.epoche(b.nr)}${b.name ? ` · ${b.name}` : ''}`.toUpperCase();
    return `<g class="fo-band fo-${b.status}"><rect x="6" y="${b.y0}" width="${m.breite - 12}" height="${r1(b.y1 - b.y0)}" rx="10"/><text x="22" y="${b.y0 + 22}">${esc(titel)}</text>` +
      (b.status === 'offen' ? '' : `<g class="fo-schloss" transform="translate(${r1(30 + titel.length * 8.3)} ${b.y0 + 17}) scale(.7)"><rect x="-6" y="-2" width="12" height="9" rx="2"/><path d="M-3.5 -2v-1.8a3.5 3.5 0 0 1 7 0V-2"/></g>`) + '</g>';
  }

  function kanteSvg(e, m) {
    const von = m.knoten.find(n => n.id === e.von), nach = m.knoten.find(n => n.id === e.nach), sx = m.spalten[e.spalte] ? m.spalten[e.spalte].x : von.x + von.w / 2;
    const x1 = von.tor ? sx : von.x + von.w / 2, y1 = von.y + von.h, x2 = nach.tor ? sx : nach.x + nach.w / 2, y2 = nach.y, mid = r1((y1 + y2) / 2);
    return `<path class="fo-kante${e.aktiv ? ' aktiv' : ''}${e.horizont ? ' horizont' : ''}" d="M${r1(x1)} ${r1(y1)}C${r1(x1)} ${mid} ${r1(x2)} ${mid} ${r1(x2)} ${r1(y2)}"/>`;
  }

  const MARKE = {
    erforscht: (cx, cy) => `<circle class="fo-marke" cx="${cx}" cy="${cy}" r="10"/><path class="fo-haken" d="M${r1(cx - 4.6)} ${cy}l3.2 3.4 6-6.6"/>`,
    moeglich: (cx, cy) => `<circle class="fo-marke" cx="${cx}" cy="${cy}" r="10"/><path class="fo-haken" d="M${cx} ${r1(cy + 4.6)}V${r1(cy - 4.4)}M${r1(cx - 4.2)} ${r1(cy - .4)}l4.2 -4.2 4.2 4.2"/>`
  };
  const schloss = (cx, cy) => `<g class="fo-schloss" transform="translate(${cx} ${cy}) scale(.78)"><rect x="-7" y="-3" width="14" height="10.5" rx="2.4"/><path d="M-4.2 -3v-2.2a4.2 4.2 0 0 1 8.4 0V-3"/></g>`;

  function kostenSvg(n, xr, y) {
    let x = xr, s = '';
    [...n.kosten].reverse().forEach(p => { const w = String(p.menge).length * 8.4 + 22; x -= w; s += `<g transform="translate(${r1(x)} ${y - 14})">${L.Iso.symbol(p.symbol, { groesse: 16 })}</g><text class="fo-kosten" x="${r1(x + 19)}" y="${y - 1.5}">${p.menge}</text>`; x -= 4; });
    return s;
  }

  function knotenSvg(n) {
    const T = L.Texte.welt, tx = n.x + 14, z = n.zustand, w = n.wissen, bar = n.tor ? 150 : 40, anteil = w && w.braucht ? Math.min(1, w.hat / w.braucht) : 1;
    const label = `${n.name}, ${T.zustand[z]}${n.tor ? `, ${T.torKurz}` : ''}${n.ziel ? `, ${T.zielKurz}` : ''}`, groesse = n.name.length > 18 ? 12 : n.name.length > 15 ? 13 : n.tor ? 15.5 : 15;
    let s = `<g class="fo-knoten z-${z}${n.gewaehlt ? ' gewaehlt' : ''}" data-id="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(label)}"><title>${esc(label)}</title>` +
      `<rect class="fo-aussen" x="${n.x - 6}" y="${n.y - 6}" width="${n.w + 12}" height="${n.h + 12}" rx="14"/><rect class="fo-rahmen" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"/>`;
    s += `<text class="fo-name" font-size="${groesse}" x="${tx}" y="${n.y + (n.tor ? 26 : 29)}">${esc(n.name)}</text>`;
    if (z === 'horizont') s += `<text class="fo-leise" x="${tx}" y="${n.y + 52}">${esc(T.horizontKurz)}</text>`;
    else if (w) {
      const yy = n.y + (n.tor ? 38 : 47), hat = Math.min(w.hat, w.braucht), text = n.tor ? T.torWissen(hat, w.braucht) : T.wissenKurz(hat, w.braucht);   // mehr Wissen als verlangt zeigt «2 von 2»
      s += `<rect class="fo-spur" x="${tx}" y="${yy}" width="${bar}" height="${n.tor ? 7 : 6}" rx="3"/><rect class="fo-fuell" x="${tx}" y="${yy}" width="${r1(bar * anteil)}" height="${n.tor ? 7 : 6}" rx="3"/>` +
        `<text class="fo-leise" x="${tx + bar + (n.tor ? 10 : 6)}" y="${yy + 7.5}">${esc(text)}</text>` + kostenSvg(n, n.x + n.w - (n.tor ? 14 : 10), n.tor ? n.y + 29 : n.y + 59);
    }
    s += (MARKE[z] ? MARKE[z](n.x + n.w - 12, n.y + 12) : schloss(n.x + n.w - 12, n.y + 12));
    if (n.ziel) s += `<circle class="fo-ziel" cx="${n.x + 10}" cy="${n.y + 10}" r="5"/>`;
    return `${s}</g>`;
  }

  /** SVG-Text des ganzen Baums. */
  function zeichne(m) {
    const T = L.Texte.welt;
    const kopf = m.spalten.map(s => `<g class="fo-spalte" transform="translate(${r1(s.x - 56)} 8)">${s.symbol ? `<g transform="translate(0 -2)">${L.Iso.symbol(s.symbol, { groesse: 20 })}</g>` : ''}<text x="26" y="12.5">${esc(s.name)}</text></g>`).join('');
    return `<svg class="fo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.breite} ${m.hoehe}" preserveAspectRatio="xMidYMin meet" role="group" aria-label="${esc(T.baumName)}">` +
      `${m.baender.map(b => bandSvg(b, m)).join('')}${kopf}${m.kanten.map(e => kanteSvg(e, m)).join('')}${m.knoten.map(knotenSvg).join('')}</svg>`;
  }

  L.ForschungGraph = { modell, zeichne, kanten, esc };
})(globalThis);
