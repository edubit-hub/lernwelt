/* app/welt/buehne-kamera.js: Kamera der Bühne (Umbauplan 3.3, Vorbild docs/mockup/richtung-a/a-kamera.js). Jede Ansicht ist eine Fahrt zu ihrem Ort: das Ziel
   liegt im freien Bereich (Fenster ohne HUD, Dock und offene Tafel), der Zoom ist höchstens 1,8 mal die Totale. Ziele kommen aus thema.kamera
   { <name>: { quer: [ziel, faktor, ankerX, ankerY], hoch: [...] } }, sonst aus STANDARD. ziel: 'insel', 'siedlung' (Rathaus, mit gewähltem Platz dieser)
   oder eine Ort-ID (forschung, hafen, tor, lager). Statt eines Namens geht auch { x, y, faktor, ankerX, ankerY } in Weltpunkten oder { platz, faktor }.
     BuehneKamera.rechne(modell, wunsch, { breite, hoehe, frei, thema, gewaehlt, routen }) → { tx, ty, s }   (rein, ohne DOM)
     BuehneKamera.miss(el) → frei { links, oben, rechts, unten } aus header.hud, nav.dock und aside.tafel
     BuehneKamera.fahre(kameraEl, ziel, { sofort, wenig }) → Promise: Fahrt in --dauer-kamera, will-change nur während der Fahrt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const BK = (L.BuehneKamera = L.BuehneKamera || {});
  const ZOOM_MAX = 1.8, DAUER = 1100;
  const STANDARD = {
    start: { quer: ['insel', .84, .5, .5], hoch: ['insel', .98, .5, .5] },
    siedlung: { quer: ['siedlung', 1.28, .5, .5], hoch: ['siedlung', 1.3, .5, .5] },
    forschung: { quer: ['forschung', 1.8, .5, .52], hoch: ['forschung', 1.75, .5, .6] },
    hafen: { quer: ['hafen', .72, .5, .5], hoch: ['hafen', .86, .5, .55] },
    logbuch: { quer: ['insel', 1, .5, .5], hoch: ['insel', 1, .5, .42] },
    aufgabe: { quer: ['lager', 1.3, .87, .56], hoch: ['lager', 1.2, .5, .86] }    // rechts neben der Karte (quer), unter ihr (hoch)
  };
  const zahl = v => typeof v === 'number' && Number.isFinite(v);
  const gueltig = e => Array.isArray(e) && e.length === 4 && typeof e[0] === 'string' && e.slice(1).every(zahl);

  /** Eintrag [ziel, faktor, ax, ay] für einen Namen, erst aus dem Thema, dann aus STANDARD, sonst die Insel. */
  function eintrag(thema, name, hoch) {
    const t = thema && thema.kamera && thema.kamera[name], e = t && t[hoch ? 'hoch' : 'quer'];
    if (gueltig(e)) return e;
    return STANDARD[name] ? STANDARD[name][hoch ? 'hoch' : 'quer'] : ['insel', 1, .5, .5];
  }
  /** Weltpunkt eines Ziels. */
  function punkt(M, ziel, gewaehlt, routen) {
    const P = L.Iso.punkt, mp = n => { const e = M.plaetze.get(n); return e ? P(e.p.x + e.p.b / 2, e.p.y + e.p.t / 2) : null; };
    if (ziel === 'siedlung') {
      const a = mp(0) || M.mitte, w = gewaehlt == null ? null : mp(gewaehlt);
      return w && gewaehlt !== 0 ? [w[0], w[1] - 40] : [a[0] - 20, a[1] - 150];
    }
    if (ziel === 'hafen' && M.orte.hafen) {
      const pts = [M.orte.hafen.punkt || M.orte.hafen.mitte, ...Object.values(routen || {})], xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      return pts.length > 1 ? [(Math.min(...xs) + Math.max(...xs)) / 2 + 45, (Math.min(...ys) + Math.max(...ys)) / 2 - 20] : [pts[0][0], pts[0][1] - 60];
    }
    if (ziel === 'forschung' && M.orte.forschung) return [M.orte.forschung.mitte[0] + 20, M.orte.forschung.mitte[1] - 10];
    if (M.orte[ziel]) return M.orte[ziel].mitte;
    return [M.mitte[0] + 70, M.mitte[1] - 50];
  }

  function rechne(M, wunsch, o = {}) {
    const breite = o.breite || 1180, hoehe = o.hoehe || 820, hoch = hoehe > breite, k = M.umriss, b = M.box, fr = o.frei || {};
    const s0 = Math.max(.05, Math.min(breite * (hoch ? 1.02 : .86) / (k.x1 - k.x0), (hoehe - (hoch ? 300 : 210)) / (k.y1 - k.y0)));
    let z, fak, ax = .5, ay = .5;
    if (wunsch && typeof wunsch === 'object') {
      const pz = Number.isInteger(wunsch.platz) && M.plaetze.get(wunsch.platz);
      z = pz ? L.Iso.punkt(pz.p.x + pz.p.b / 2, pz.p.y + pz.p.t / 2, .5) : zahl(wunsch.x) && zahl(wunsch.y) ? [wunsch.x, wunsch.y] : M.mitte;
      fak = zahl(wunsch.faktor) ? wunsch.faktor : 1.4; ax = zahl(wunsch.ankerX) ? wunsch.ankerX : .5; ay = zahl(wunsch.ankerY) ? wunsch.ankerY : .56;
    } else {
      const e = eintrag(o.thema, wunsch, hoch);
      z = punkt(M, e[0], o.gewaehlt, o.routen); fak = e[1]; ax = e[2]; ay = e[3];
    }
    const s = s0 * Math.max(.2, Math.min(fak, ZOOM_MAX));
    const r = { l: fr.links || 0, t: fr.oben || 0, r: breite - (fr.rechts || 0), b: hoehe - (fr.unten || 0) };
    if (r.r - r.l < 120) { r.l = 0; r.r = breite; }
    if (r.b - r.t < 120) { r.t = 0; r.b = hoehe; }
    return { tx: r.l + ax * (r.r - r.l) - s * (z[0] - b.x0), ty: r.t + ay * (r.b - r.t) - s * (z[1] - b.y0), s, s0 };
  }

  /** Freier Bereich aus den Layout-Massen von HUD, Dock und offener Tafel (Transformationen zählen nicht, die Tafel kann noch gleiten).
      Eine breite, flache Tafel (Blatt) deckt oben oder unten ab, eine hohe Tafel (auch die breite Karte der Forschung) links oder rechts. */
  function miss(el) {
    const f = { links: 0, oben: 0, rechts: 0, unten: 0 }, d = el && el.ownerDocument;
    if (!d || typeof d.querySelector !== 'function' || !el.getBoundingClientRect) return f;
    const W = el.clientWidth, H = el.clientHeight, r0 = el.getBoundingClientRect();
    const sicht = e => { if (!e || !e.offsetWidth || !e.offsetHeight) return false; const c = g.getComputedStyle ? g.getComputedStyle(e) : null; return !c || (c.visibility !== 'hidden' && c.display !== 'none' && Number(c.opacity) > .1); };
    const lage = e => { let x = 0, y = 0; for (let n = e; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return { x0: x - r0.left, y0: y - r0.top, x1: x - r0.left + e.offsetWidth, y1: y - r0.top + e.offsetHeight }; };
    const hud = d.querySelector('header.hud'), dock = d.querySelector('nav.dock');
    if (sicht(hud)) f.oben = Math.max(0, lage(hud).y1 + 4);
    if (sicht(dock)) f.unten = Math.max(0, H - lage(dock).y0 + 4);
    for (const t of d.querySelectorAll('aside.tafel')) {
      if (!sicht(t)) continue;
      const q = lage(t);
      if (q.x1 - q.x0 > W * .6 && q.y1 - q.y0 < H * .6) { if ((q.y0 + q.y1) / 2 > H / 2) { if (q.y0 - 4 - f.oben >= 220) f.unten = Math.max(f.unten, H - q.y0 + 4); } else if (H - f.unten - q.y1 - 4 >= 220) f.oben = Math.max(f.oben, q.y1 + 4); }
      else if ((q.x0 + q.x1) / 2 < W / 2) f.links = Math.max(f.links, q.x1 + 4); else f.rechts = Math.max(f.rechts, W - q.x0 + 4);
    }
    return f;
  }

  const timer = new WeakMap(), marke = new WeakMap();
  /** Setzt die Kamera auf das Ziel. Mit sofort ohne Fahrt, mit wenig (prefers-reduced-motion) ohne Fahrt und mit kurzem Einblenden.
      will-change kommt ein Bild vor der neuen Transformation (Safari rastert die Ebene sonst zu Beginn neu) und geht erst mit transitionend. */
  function fahre(e, z, o = {}) {
    const neu = `translate(${z.tx.toFixed(1)}px, ${z.ty.toFixed(1)}px) scale(${z.s.toFixed(4)})`;
    if (!e || !e.style) return Promise.resolve();
    const alt = timer.get(e);
    if (alt) { clearTimeout(alt.t); alt.fertig(); timer.delete(e); }
    const zeichen = {};
    marke.set(e, zeichen);
    if (o.sofort || o.wenig || typeof e.animate !== 'function') {
      e.classList.add('sofort'); e.style.transform = neu; void e.offsetWidth; e.classList.remove('sofort');
      if (o.wenig && !o.sofort && typeof e.animate === 'function') e.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      return Promise.resolve();
    }
    if (e.style.transform === neu) return Promise.resolve();
    e.classList.add('faehrt');
    const setze = () => { if (marke.get(e) === zeichen) e.style.transform = neu; };
    const ms = dauer(e);
    return new Promise(fertig => {
      let fort = false;
      const ende = () => { if (fort) return; fort = true; if (e.removeEventListener) e.removeEventListener('transitionend', beiEnde); e.classList.remove('faehrt'); fertig(); };
      const beiEnde = ev => { if (ev && ev.target === e && (!ev.propertyName || ev.propertyName === 'transform')) { const t = timer.get(e); if (t) clearTimeout(t.t); timer.delete(e); ende(); } };
      if (e.addEventListener) e.addEventListener('transitionend', beiEnde);
      timer.set(e, { t: setTimeout(() => { timer.delete(e); ende(); }, ms + 160), fertig: ende });
      if (typeof g.requestAnimationFrame === 'function') g.requestAnimationFrame(setze); else setze();
    });
  }
  function dauer(e) {
    const t = g.getComputedStyle ? String(g.getComputedStyle(e).transitionDuration || '').split(',')[0].trim() : '';
    const n = parseFloat(t);
    return Number.isFinite(n) ? (t.endsWith('ms') ? n : n * 1000) : DAUER;
  }

  Object.assign(BK, { rechne, miss, fahre, eintrag, punkt, STANDARD, ZOOM_MAX });
})(globalThis);
