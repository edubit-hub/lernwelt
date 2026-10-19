/* app/ansichten/forschung-graph.js: der Forschungsbaum als Karte (docs/gestaltung-umbau.md 2.10, Vorbild docs/mockup/richtung-b/szene-forschung.js).
   modell(k, gewaehlt) berechnet Lage und Zustand jedes Knotens ohne DOM (testbar, deterministisch), zeichne(m) macht daraus SVG-Text.
   Aufbau: eine Spalte je Epoche (links die erste), eine Zeile je Fach (Zweig), in der Spalte je Fach die Knoten nach Wissen geordnet nebeneinander.
   Ein Tor (Knoten mit `summe`) steht als hohe Säule am Ende seiner Epoche. Jeder Knoten hat seine eigene Zelle, so überlappt nichts, auch nicht
   bei 24 Knoten (Budget 7.5). Kanten laufen je Zweig von Knoten zu Knoten, über das Tor, wenn eine Epoche dazwischen liegt.
   Zustände: erforscht, moeglich, gesperrt, horizont (WeltBedingungen.zustand). Wissen und Lampen kommen aus WeltDaten.wissenStand, beim Tor der
   offenen Epoche aus WeltDaten.epocheStand (dieselbe Quelle wie die Medaille im HUD). Farben nur als Klassen (forschung.css), nie als Werte. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const KOPF = 46, LINKS = 64, ZEILE = 66, NB = 196, NH = 58, SPALTE = 206, POLSTER = 10, TORB = 116, TORABSTAND = 14, LUECKE = 8, UNTEN = 8, MIN_ZEILEN = 3;
  const FOLGE = ['mathe', 'deutsch', 'englisch', 'nmg'];
  const liste = x => (Array.isArray(x) ? x : []);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const r1 = n => Math.round(n * 10) / 10;
  const fachVon = f => (f.bereich ? String(f.bereich).split('.')[0] : '');
  const TW = () => L.Texte.welt, TK = () => L.Texte.forschungskarte;
  const objekt = (name, gr) => (L.Iso && L.Iso.objekt ? L.Iso.objekt(name, { groesse: gr }) : L.Iso && L.Iso.symbol ? L.Iso.symbol(name, { groesse: gr - 4 }) : '');

  /** Das Wissen, das ein Knoten zeigt: beim Tor der offenen Epoche aus epocheStand, sonst die erste offene Bedingung aus wissenStand. */
  function wissenVon(k, f, stand) {
    if (stand && stand.tor && stand.tor.id === f.id) return { art: 'summe', hat: stand.tor.hat, braucht: stand.tor.braucht };
    const ws = L.WeltDaten.wissenStand(k, f), w = ws.find(x => !x.ok) || ws[0];
    return w ? { art: w.art, hat: w.hat, braucht: w.braucht } : null;
  }

  /** Modell der Karte: { zeilen, baender, knoten, kanten, breite, hoehe }. gewaehlt: ID des gewählten Knotens. */
  function modell(k, gewaehlt = null) {
    const D = L.WeltDaten, C = L.WeltBedingungen, alle = liste(k.thema.forschung), es = liste(k.thema.epochen);
    const faecher = [...new Set(alle.filter(f => f.summe === undefined).map(fachVon))].sort((a, b) => (FOLGE.indexOf(a) + 1 || 99) - (FOLGE.indexOf(b) + 1 || 99) || (a < b ? -1 : 1));
    const raster = Math.max(faecher.length, MIN_ZEILEN) * ZEILE;
    const zeilen = faecher.map((fach, i) => {
      const roh = Object.values(k.thema.rohstoffe || {}).find(r => r.fach === fach);
      return { fach, name: fach ? TW().fach[fach] || fach.charAt(0).toUpperCase() + fach.slice(1) : TK().alleBereiche, symbol: roh ? roh.symbol : null, y: KOPF + i * ZEILE, mitte: KOPF + i * ZEILE + ZEILE / 2 };
    });
    const erste = es.findIndex(e => !L.Welt.epocheOffen(k.thema, k.stand, e.id)), stand = D.epocheStand(k), ziel = D.ziel(k);
    const epochen = es.length ? es.map((e, i) => ({ id: e.id, name: e.name || e.id, nr: i + 1 })) : [{ id: undefined, name: '', nr: 1 }];
    const roh = [], baender = [];
    let x = LINKS;
    epochen.forEach((e, bi) => {
      const hier = alle.filter(f => (es.length ? f.epoche === e.id : true)), normal = hier.filter(f => f.summe === undefined), tore = hier.filter(f => f.summe !== undefined);
      const rang = new Map(), anzahl = {};
      [...normal].sort((a, b) => (a.wissen ?? 0) - (b.wissen ?? 0)).forEach(f => { const fach = fachVon(f); rang.set(f.id, anzahl[fach] = (anzahl[fach] ?? -1) + 1); });
      const spalten = normal.length ? Math.max(...Object.values(anzahl)) + 1 : 0, innen = x + POLSTER;
      normal.forEach(f => { const z = faecher.indexOf(fachVon(f)), r = rang.get(f.id); roh.push({ f, band: bi, zeile: z, tor: false, x: innen + r * SPALTE, y: KOPF + z * ZEILE + (ZEILE - NH) / 2, w: NB, h: NH, rang: r }); });
      let rechts = spalten ? innen + (spalten - 1) * SPALTE + NB : innen;
      tore.forEach((f, i) => { const tx = spalten || i ? rechts + TORABSTAND : innen; roh.push({ f, band: bi, zeile: -1, tor: true, x: tx, y: KOPF + 6, w: TORB, h: raster - 12, rang: spalten + i }); rechts = tx + TORB; });
      const status = erste < 0 || bi < erste ? 'offen' : bi === erste ? 'gesperrt' : 'horizont';
      const kopf = 24 + `${TK().epoche(e.nr)} · ${e.name}`.length * 7.1 + (status === 'offen' ? 0 : 84);
      const x1 = Math.ceil(Math.max(rechts + POLSTER, x + kopf, x + 150));
      baender.push({ id: e.id, name: e.name, nr: e.nr, x0: x, x1, status });
      x = x1 + LUECKE;
    });
    const knoten = roh.map(n => {
      const wissen = wissenVon(k, n.f, stand), zf = n.zeile >= 0 ? zeilen[n.zeile] : null;
      return { id: n.f.id, name: n.f.name, band: n.band, zeile: n.zeile, tor: n.tor, x: r1(n.x), y: r1(n.y), w: n.w, h: n.h, rang: n.rang, zustand: C.zustand(k, n.f),
        bereich: n.f.bereich || null, bereichName: n.f.bereich ? D.bereichName(n.f.bereich) : null, symbol: zf ? zf.symbol : null, wissen, kosten: D.posten(k, n.f.kosten),
        ziel: !!ziel && ziel.id === n.f.id, gewaehlt: n.f.id === gewaehlt };
    });
    const m = { zeilen, baender, knoten, breite: x - LUECKE + 6, hoehe: KOPF + raster + UNTEN };
    m.kanten = kanten(knoten, m);
    return m;
  }

  /** Kanten je Zweig: von Knoten zu Knoten, über das Tor zwischen den Epochen, der letzte Knoten eines Zweigs zum nächsten Tor. Mit Weg (d) und Länge. */
  function kanten(knoten, m) {
    const aus = [], gesehen = new Set(), tore = knoten.filter(n => n.tor).sort((a, b) => a.band - b.band || a.rang - b.rang);
    const torZw = (von, bis) => [...tore].reverse().find(t => t.band >= von && t.band < bis) || null;
    const kante = (a, b, zeile) => {
      if (gesehen.has(`${a.id}>${b.id}`)) return;
      gesehen.add(`${a.id}>${b.id}`);
      const y = zeile >= 0 && m ? m.zeilen[zeile].mitte : a.y + a.h / 2, x1 = a.x + a.w, x2 = b.x, y1 = a.tor ? y : a.y + a.h / 2, y2 = b.tor ? y : b.y + b.h / 2, mx = r1((x1 + x2) / 2);
      aus.push({ von: a.id, nach: b.id, zeile, aktiv: a.zustand === 'erforscht', bereit: a.zustand === 'erforscht' && b.zustand === 'moeglich', horizont: b.zustand === 'horizont',
        d: `M${r1(x1)} ${r1(y1)}C${mx} ${r1(y1)} ${mx} ${r1(y2)} ${r1(x2)} ${r1(y2)}`, laenge: Math.ceil(Math.hypot(x2 - x1, y2 - y1)) });
    };
    for (const z of [...new Set(knoten.filter(n => !n.tor).map(n => n.zeile))]) {
      const reihe = knoten.filter(n => !n.tor && n.zeile === z).sort((a, b) => a.band - b.band || a.rang - b.rang);
      const t0 = torZw(-1, reihe[0].band);
      if (t0) kante(t0, reihe[0], z);
      reihe.slice(1).forEach((n, i) => { const a = reihe[i], t = a.band < n.band ? torZw(a.band, n.band) : null; if (t) { kante(a, t, z); kante(t, n, z); } else kante(a, n, z); });
      const letzte = reihe[reihe.length - 1], tl = tore.find(t => t.band >= letzte.band);
      if (tl) kante(letzte, tl, z);
    }
    tore.slice(1).forEach((t, i) => { if (!aus.some(e => e.von === tore[i].id && e.nach === t.id)) kante(tore[i], t, -1); });
    return aus;
  }

  // ---- SVG ------------------------------------------------------------------------------------------------------------------------------
  const SIEGELRAND = (() => { let d = ''; for (let i = 0; i <= 24; i++) { const w = i / 24 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 21 : 19; d += `${i ? 'L' : 'M'}${r1(Math.cos(w) * r)} ${r1(Math.sin(w) * r)}`; } return `${d}Z`; })();
  const TORBOGEN = '<path class="fo-bogen" d="M-9 10V-1a9 9 0 0 1 18 0V10M-13 10H13"/>';
  const ZEICHEN = { erforscht: '<path class="fo-zeichen" d="M-3.6 .2l2.5 2.6 4.8-5"/>', moeglich: '<circle class="fo-zeichen-punkt" r="2.6"/>',
    gesperrt: '<rect class="fo-zeichen-voll" x="-3.6" y="-1" width="7.2" height="5.4" rx="1.2"/><path class="fo-zeichen" d="M-2.2 -1v-1.4a2.2 2.2 0 0 1 4.4 0V-1"/>' };
  const marke = (z, x, y) => `<g class="fo-marke r-${z}" transform="translate(${r1(x)} ${r1(y)})"><rect x="-7.5" y="-7.5" width="15" height="15" rx="2.5" transform="rotate(45)"/>${ZEICHEN[z] || ZEICHEN.gesperrt}</g>`;
  const fahne = (x, y) => `<g class="fo-ziel" transform="translate(${r1(x)} ${r1(y)})"><path class="fo-ziel-stab" d="M0 9V-8"/><path class="fo-ziel-tuch" d="M0 -8h9l-2.4 3.4L9 -1.2H0z"/></g>`;

  /** Siegel eines Knotens: gezackter Rand, darin das Rohstoff-Objekt des Zweigs (beim Tor ein Bogen). */
  function siegel(n, cx, cy) {
    const inhalt = n.tor ? TORBOGEN : n.symbol ? `<g transform="translate(-13 -13)">${objekt(n.symbol, 26)}</g>` : '';
    return `<g transform="translate(${r1(cx)} ${r1(cy)})"><g class="fo-siegel">${n.zustand === 'moeglich' ? '<circle class="fo-glanz" r="27"/>' : ''}` +
      `<path class="fo-siegel-rand" d="${SIEGELRAND}"${n.tor ? ' transform="scale(1.15)"' : ''}/>${inhalt}</g></g>`;   // die Lage aussen, damit ein Effekt (transform) sie nicht ersetzt
  }

  /** Wissen als Rauten (überall dasselbe Zeichen, auch am Tor), die ersten ist an. Über zwölf eine Spur. Breite in px, Rückgabe { svg, ende }. */
  function lampen(w, x, y, breite, raute) {
    const ist = Math.min(w.hat, w.braucht), soll = w.braucht;
    if (soll > 12) return { svg: `<rect class="fo-spur" x="${x}" y="${y - 3}" width="${breite}" height="6" rx="3"/><rect class="fo-fuell" x="${x}" y="${y - 3}" width="${r1(breite * ist / soll)}" height="6" rx="3"/>`, ende: x + breite };
    const ab = raute ? Math.min(15, breite / Math.min(soll, 6)) : Math.min(11, breite / Math.max(1, soll)), reihe = raute ? 6 : 12;
    let s = '';
    for (let i = 0; i < soll; i++) {
      const lx = r1(x + (i % reihe) * ab + ab / 2), ly = r1(y + Math.floor(i / reihe) * 16), an = i < ist ? ' an' : '';
      const q = Math.min(9, r1(ab * .66));
      s += raute ? `<rect class="fo-raute${an}" x="${r1(lx - q / 2)}" y="${r1(ly - q / 2)}" width="${q}" height="${q}" rx="1.2" transform="rotate(45 ${lx} ${ly})"/>` : `<circle class="fo-lampe${an}" cx="${lx}" cy="${ly}" r="${r1(Math.min(4, ab / 2 - .6))}"/>`;
    }
    return { svg: s, ende: x + Math.min(soll, reihe) * ab };
  }

  const kostenText = (p, x, y, anker, fehlt) => `<g transform="translate(${r1(anker === 'end' ? x - 18 - String(p.menge).length * 8.2 : x)} ${r1(y - 9)})">${objekt(p.symbol, 16)}</g>` +
    `<text class="fo-kosten${fehlt ? ' warm' : ''}" x="${r1(anker === 'end' ? x : x + 18)}" y="${r1(y + 4)}"${anker === 'end' ? ' text-anchor="end"' : ''}>${p.menge}</text>`;

  function knotenSvg(n) {
    const tw = TW(), z = n.zustand, w = n.wissen, wissenText = w ? tw.wissenKurz(Math.min(w.hat, w.braucht), w.braucht) : '';
    const label = TK().knoten(n.name, tw.zustand[z], z === 'horizont' ? '' : wissenText, n.ziel);
    let s = `<g class="fo-knoten z-${z}${n.tor ? ' fo-tor' : ''}${n.gewaehlt ? ' gewaehlt' : ''}" data-id="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(label)}"${n.gewaehlt ? ' aria-current="true"' : ''}>` +
      `<rect class="fo-aussen" x="${n.x - 5}" y="${n.y - 5}" width="${n.w + 10}" height="${n.h + 10}" rx="18"/><rect class="fo-schatten" x="${n.x}" y="${n.y + 3}" width="${n.w}" height="${n.h}" rx="14"/>` +
      `<rect class="fo-platte" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="14"/>`;
    if (n.tor) {
      const cx = n.x + n.w / 2, worte = String(n.name).split(' '), zeilen = [];
      worte.forEach(wort => { const l = zeilen.length - 1; if (l >= 0 && (zeilen[l] + ' ' + wort).length <= 13) zeilen[l] += ' ' + wort; else zeilen.push(wort); });
      s += siegel(n, cx, n.y + 30) + marke(z, cx + 19, n.y + 48);
      zeilen.slice(0, 3).forEach((t, i) => { s += `<text class="fo-name" x="${r1(cx)}" y="${n.y + 74 + i * 16}" text-anchor="middle">${esc(t)}</text>`; });
      let y = n.y + 74 + Math.min(3, zeilen.length) * 16 + 6;
      if (w && z !== 'horizont') {
        const l = lampen(w, n.x + 13, y, n.w - 26, true);
        s += l.svg + `<text class="fo-leise" x="${r1(cx)}" y="${y + (w.braucht > 6 && w.braucht <= 12 ? 36 : 22)}" text-anchor="middle">${esc(tw.torWissen(Math.min(w.hat, w.braucht), w.braucht))}</text>`;
        y += w.braucht > 6 && w.braucht <= 12 ? 58 : 44;
        n.kosten.forEach((p, i) => { s += kostenText({ ...p, menge: TK().torKosten(Math.min(p.hat ?? p.menge, p.menge), p.menge) }, cx - 34, y + i * 21, null, p.fehlt > 0); });
      } else if (z === 'horizont') s += `<text class="fo-leise" x="${r1(cx)}" y="${y + 6}" text-anchor="middle">${esc(tw.horizontKurz)}</text>`;
      if (n.ziel) s += fahne(n.x + n.w - 18, n.y + 16);
      return `${s}</g>`;
    }
    const tx = n.x + 56;
    s += siegel(n, n.x + 28, n.y + n.h / 2) + marke(z, n.x + 43, n.y + n.h / 2 + 16);
    s += `<text class="fo-name" x="${tx}" y="${n.y + 20}"${n.name.length > 17 ? ' style="font-size: 12.5px"' : ''}>${esc(n.name)}</text>`;
    if (n.bereichName) s += `<text class="fo-bereich" x="${tx}" y="${n.y + 35}">${esc(n.bereichName)}</text>`;
    if (z === 'horizont') s += `<text class="fo-leise" x="${tx}" y="${n.y + 51}">${esc(tw.horizontKurz)}</text>`;
    else if (w) {
      const l = lampen(w, tx, n.y + 46, 44, true);
      s += l.svg + `<text class="fo-leise" x="${r1(l.ende + 6)}" y="${n.y + 50}">${esc(wissenText)}</text>`;
      if (n.kosten[0]) s += kostenText(n.kosten[0], n.x + n.w - 10, n.y + 46, 'end');
    }
    if (n.ziel) s += fahne(n.x + n.w - 16, n.y + 14);
    return `${s}</g>`;
  }

  function bandSvg(b, m) {
    const titel = `${TK().epoche(b.nr)}${b.name ? ` · ${b.name}` : ''}`, zu = b.status !== 'offen';
    const flaeche = `x="${b.x0}" y="4" width="${b.x1 - b.x0}" height="${m.hoehe - 8}" rx="12"`;
    return `<g class="fo-band fo-${b.status}"><rect class="fo-band-flaeche" ${flaeche}/>${zu ? `<rect class="fo-band-schraffur" ${flaeche} fill="url(#fo-schraffur)"/>` : ''}` +
      `<text class="fo-band-titel" x="${b.x0 + 12}" y="${KOPF - 22}">${esc(titel.toUpperCase())}</text>` +
      (zu ? `<g class="fo-schild" transform="translate(${b.x1 - 84} ${KOPF - 38})"><rect width="76" height="24" rx="12"/><g transform="translate(15 12) scale(1.1)">${ZEICHEN.gesperrt}</g>` +
        `<text x="26" y="16.5">${esc(TK().horizont)}</text></g>` : '') + '</g>';
  }

  const zweigSvg = z => `<g class="fo-zweig" transform="translate(${LINKS / 2 - 2} ${z.mitte})" role="img" aria-label="${esc(TK().zweig(z.name))}">` +
    `${z.symbol ? `<g transform="translate(-12 -24)">${objekt(z.symbol, 24)}</g>` : ''}<text y="16" text-anchor="middle">${esc(z.name)}</text></g>`;

  const kanteSvg = e => `<path class="fo-kante${e.aktiv ? ' aktiv' : ''}${e.bereit ? ' bereit' : ''}${e.horizont ? ' horizont' : ''}" data-von="${esc(e.von)}" data-nach="${esc(e.nach)}" data-laenge="${e.laenge}" d="${e.d}"/>`;

  /** SVG-Text der ganzen Karte. Breite und Seitenverhältnis stehen als Variable am Element, forschung.css skaliert höchstens leicht nach unten. */
  function zeichne(m) {
    const linien = m.zeilen.slice(1).map(z => `<path class="fo-zeile" d="M${LINKS - 6} ${z.y}H${m.breite - 6}"/>`).join('');
    return `<svg class="fo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.breite} ${m.hoehe}" style="--fo-breite: ${m.breite}px; aspect-ratio: ${m.breite} / ${m.hoehe}" role="group" aria-label="${esc(TK().karteName)}">` +
      '<defs><pattern id="fo-schraffur" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="fo-schraffur" d="M0 0V10"/></pattern></defs>' +
      `${m.baender.map(b => bandSvg(b, m)).join('')}${linien}<g class="fo-zweige" aria-label="${esc(TK().zweige)}">${m.zeilen.map(zweigSvg).join('')}</g>` +
      `${m.kanten.map(kanteSvg).join('')}${m.knoten.map(knotenSvg).join('')}</svg>`;
  }

  L.ForschungGraph = { modell, zeichne, kanten, esc, MASSE: { KOPF, LINKS, ZEILE, NB, NH, SPALTE, TORB } };
})(globalThis);
