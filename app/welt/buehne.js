/* app/welt/buehne.js: die lebendige Insel als Bühne hinter allen Ansichten (Architektur 7.7, Umbauplan 3.3, Vorbild docs/mockup/richtung-a).
     Buehne.baue(el, thema, weltStand, { palette, wenig, kamera }) → Regler. el ist div.buehne-ebene der Hülle; ein zweiter Aufruf auf demselben el ersetzt die erste Bühne.
   Aufbau: div.lagune (Meeresgrund, Ton aus der CSS-Datei des Themas), div.buehne-kamera > div.buehne-welt mit den Weltebenen flachwasser, reflexe, schaum,
   insel, bau, wiege, boote, rauch, nebel, routen, wolkenschatten, wolken, marken, darüber am Bildschirm voegel, licht, schleier. Die Welt wird einmal
   aufgebaut; aktualisiere ersetzt nur geänderte Plätze (nur wenn sich die Zahl der Plätze ändert, also mit einer neuen Epoche, entsteht die Insel neu).
   Die Bühne liest Thema und Stand und schreibt nie in den Zustand. Ohne Thema zeigt sie Meer und Insel ohne Orte. Beim Laden kein DOM-Zugriff.
   Regler: el, kamera(name | { x, y, faktor } | { platz, faktor }, { frei, sofort }) → Promise, modus({ schleier, ruhig, marken }), waehle(platz, { still }),
     gewaehlt(), beiWahl(fn), beiOrt(fn), schild(ortId, { zusatz, warm }), hinweise([{ platz, text }]) (warme Pfeile, buehne-marken.js), offenNeu() → aufgegangene Plätze,
     aktualisiere(weltStand) → geänderte Plätze, bauEffekt(platz) → Promise,
     lagerWachsen(rohstoff), routen(liste, beiWahl, { gewaehlt }), waehleRoute(id), ort(id) → { x, y } | null, zuSchirm({ x, y }) → { x, y }, leben() → Anzahl bewegter Elemente, zerstoere(). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const B = (L.Buehne = L.Buehne || {});
  const WELT = ['flachwasser', 'reflexe', 'schaum', 'insel', 'bau', 'wiege', 'boote', 'rauch', 'nebel', 'routen', 'wolkenschatten', 'wolken', 'marken'];
  const NS = 'http://www.w3.org/2000/svg', WEG = 12;
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const leere = e => { if (typeof e.replaceChildren === 'function') e.replaceChildren(); else e.innerHTML = ''; };
  const setzeVar = (e, k, v) => { if (e.style && typeof e.style.setProperty === 'function') e.style.setProperty(k, v); else if (e.style) e.style[k] = v; };
  const BUEHNEN = new WeakMap();
  const inv = s => (Math.ceil(10010 / s) / 10000).toFixed(4);          // aufgerundet: eine Marke mit 44 px bleibt nach dem Zoom nicht knapp darunter
  let zaehler = 0;

  function baue(el, thema, weltStand, opt = {}) {
    if (!el) return null;
    if (BUEHNEN.has(el)) BUEHNEN.get(el).zerstoere();
    const doc = el.ownerDocument || g.document, pre = `bn${++zaehler}-`, BL = L.BuehneLand, BK = L.BuehneKamera;
    const pal = L.Iso.palette(opt.palette ?? (L.Render && typeof L.Render.lesePalette === 'function' ? L.Render.lesePalette() : null));
    const wenig = () => !!opt.wenig || !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const neu = (tag, klasse, eltern) => { const e = doc.createElement(tag); e.className = klasse; if (eltern) eltern.appendChild(e); return e; };
    leere(el);
    el.classList.add('buehne-ebene');
    el.removeAttribute('aria-hidden');                                  // die Bühne trägt antippbare Ortsschilder und Plätze
    el.dataset.schleier = 'keine'; el.dataset.marken = 'orte';
    neu('div', 'lagune', el);
    const kameraEl = neu('div', 'buehne-kamera', el), weltEl = neu('div', 'buehne-welt', kameraEl), eb = {};
    for (const n of WELT) eb[n] = neu('div', 'ebene ' + n, weltEl);
    for (const n of ['voegel', 'licht', 'schleier']) eb[n] = neu('div', n, el);
    let M = null, welt = weltStand, gewaehlt = null, wahlFn = null, ortFn = null, routeFn = null, kam = null, freiAlt = null, tot = false, unten = null;
    let routenListe = [], routenEnde = {}, routeGewaehlt = null;
    const zustand = { tx: 0, ty: 0, s: 1 }, routenMarken = [], offenNeu = new Set();
    const gruppe = nr => (eb.insel.querySelector ? eb.insel.querySelector(`g.bauplatz[data-platz="${nr}"]`) : null);
    const verberge = (nr, an) => { const n = gruppe(nr), b = n && n.querySelector ? n.querySelector('.bau') : null; if (b) b.style.opacity = an ? '0' : ''; };
    const api = { el, ebenen: eb, doc, wenig, imBau: new Set(), lager: {}, gruppe, verberge, get modell() { return M; } };

    // ---- Marken: Ortsschilder, Schloss gesperrter Plätze, Stufe des gewählten Gebäudes, warme Pfeile (buehne-marken.js)
    const MK = L.BuehneMarken.baue({ ebene: eb.marken, neu, modell: () => M, thema: objekt(thema) ? thema : null, palette: pal, waehle: nr => waehle(nr), beiOrt: id => { if (ortFn) ortFn(id); } });
    const marke = MK.marke;
    let hinweisListe = [];
    function marken() { routenMarken.length = 0; MK.alle(); MK.hinweise(hinweisListe, gewaehlt); }
    function markiere() {
      if (eb.insel.querySelectorAll) eb.insel.querySelectorAll('.bauplatz.gewaehlt').forEach(n => n.classList.remove('gewaehlt'));
      const n = gewaehlt === null ? null : gruppe(gewaehlt);
      if (n) n.classList.add('gewaehlt');
      MK.markiere(gewaehlt);
    }

    function aufbau() {
      M = BL.baue(objekt(thema) ? thema : null, welt, { palette: pal, praefix: pre });
      weltEl.style.width = M.box.W + 'px'; weltEl.style.height = M.box.H + 'px';
      eb.flachwasser.innerHTML = M.svg.flachwasser;
      eb.insel.innerHTML = M.svg.insel;
      leere(eb.bau); api.lager = {};
      if (L.BuehneLeben) L.BuehneLeben.lebe(eb, M, objekt(thema) ? thema.leben : null, doc);
      marken();
      if (gewaehlt !== null && !M.plaetze.has(gewaehlt)) gewaehlt = null;
      markiere();
      zeichneRouten();
    }

    // ---- Auswahl: Antippen (Pointer Events, Weg höchstens 12 Pixel) und Tastatur (Enter, Leertaste) wie in render.js
    const treffer = t => {
      for (let n = t; n && n !== el; n = n.parentNode) {
        if (!n.getAttribute) continue;
        const pl = n.getAttribute('data-platz');
        if (pl !== null && pl !== undefined && n.classList && n.classList.contains('bauplatz')) return { platz: +pl };
        const o = n.getAttribute('data-ort');
        if (o) return { ort: o };
      }
      return null;
    };
    function tippe(z) {
      const m = el.dataset.marken;
      if (!z || tot || m === 'keine') return;
      if ('platz' in z) { if (m === 'plaetze') waehle(z.platz); else if (ortFn) ortFn('siedlung'); }
      else if (ortFn) ortFn(z.ort);
    }
    const beiDown = e => { unten = e.isPrimary === false || (e.button || 0) !== 0 ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, z: treffer(e.target) }; };
    const beiUp = e => { const d = unten; unten = null; if (d && d.z && d.id === e.pointerId && Math.hypot(e.clientX - d.x, e.clientY - d.y) <= WEG) tippe(d.z); };
    const beiTaste = e => { if (e.key !== 'Enter' && e.key !== ' ') return; const z = treffer(e.target); if (!z) return; if (e.preventDefault) e.preventDefault(); tippe(z); };
    const beiAbbruch = () => { unten = null; };
    el.addEventListener('pointerdown', beiDown); el.addEventListener('pointerup', beiUp); el.addEventListener('pointercancel', beiAbbruch); el.addEventListener('keydown', beiTaste);

    function waehle(nr, o = {}) {
      if (tot) return;
      if (nr === null || nr === undefined) { gewaehlt = null; markiere(); return; }
      const x = M.plaetze.get(nr);
      if (!x || x.p.art === 'leer') return;
      gewaehlt = nr;
      markiere();
      if (!o.still && wahlFn) wahlFn({ platz: x.p.platz, art: x.p.art, bauteil: x.p.bauteil, stufe: x.p.stufe, epoche: x.p.epoche });
      if (kam === 'siedlung') kamera('siedlung');
    }
    function kamera(wunsch, o = {}) {
      if (tot || !M) return Promise.resolve();
      kam = wunsch; freiAlt = o.frei || null;
      const breite = el.clientWidth || g.innerWidth, hoehe = el.clientHeight || g.innerHeight, frei = o.frei || BK.miss(el);
      const z = BK.rechne(M, wunsch, { breite, hoehe, frei, thema, gewaehlt, routen: routenEnde });
      const alt = zustand.s, sofort = !!o.sofort || wenig() || typeof kameraEl.animate !== 'function';
      Object.assign(zustand, z);
      // Während der Fahrt gilt der kleinere Zoom von Start und Ziel: so bleiben Schilder und Fähnchen auf dem ganzen Weg mindestens so gross wie am Ziel (44 px)
      setzeVar(eb.marken, '--inv', inv(sofort ? z.s : Math.min(alt || z.s, z.s)));
      return BK.fahre(kameraEl, z, { sofort: !!o.sofort, wenig: wenig() }).then(() => {
        if (tot || zustand.s !== z.s) return;
        setzeVar(eb.marken, '--inv', inv(z.s));
        try { MK.verdecke(frei, breite, hoehe); } catch (e) { /* Schilder bleiben sichtbar */ }   // Schilder unter Tafel, Dock oder am Rand treten zurück
      });
    }

    // ---- Routen des Hafens
    function zeichneRouten() {
      leere(eb.routen);
      for (const m of routenMarken) if (m.parentNode) m.parentNode.removeChild(m);
      routenMarken.length = 0; routenEnde = {};
      el.classList.toggle('mit-routen', routenListe.length > 0);
      if (!routenListe.length || !M) return;
      const r = BL.routen(M, routenListe);
      eb.routen.innerHTML = r.svg; routenEnde = r.enden;
      for (const x of routenListe) {
        const p = r.enden[x.id];
        if (!p) continue;
        const k = marke('button', `bn-route ${x.art === 'zu' ? 'zu' : 'offen'}${x.warm ? ' warm' : ''}${x.id === routeGewaehlt ? ' gewaehlt' : ''}`, [p[0], p[1] - 12], { 'data-route': x.id });
        const text = neu('span', 'bn-schild-text', k);
        neu('b', '', text).textContent = x.name || x.ziel || '';
        if (x.text) neu('small', '', text).textContent = x.text;
        k.addEventListener('click', () => { waehleRoute(x.id); if (routeFn) routeFn(x.id); });
        routenMarken.push(k);
      }
    }

    /** Hebt eine Route (Fähnchen) hervor, null hebt keine hervor. */
    function waehleRoute(id) {
      routeGewaehlt = id == null ? null : id;
      for (const m of routenMarken) m.classList.toggle('gewaehlt', m.getAttribute('data-route') === routeGewaehlt);
    }

    const regler = {
      el,
      kamera,
      modus(o = {}) {
        if (tot) return;
        if (o.schleier) el.dataset.schleier = o.schleier;
        if (o.ruhig !== undefined) el.classList.toggle('ruhig', !!o.ruhig);
        if (o.marken) el.dataset.marken = o.marken;
      },
      waehle,
      gewaehlt: () => gewaehlt,
      beiWahl(fn) { wahlFn = typeof fn === 'function' ? fn : null; },
      beiOrt(fn) { ortFn = typeof fn === 'function' ? fn : null; },
      schild: (id, o) => MK.schild(id, o || {}),
      /** Warme Pfeile an Plätzen, auf denen jetzt etwas geht: [{ platz, text }]. Leer räumt sie weg. */
      hinweise(liste) { hinweisListe = Array.isArray(liste) ? liste : []; if (!tot && M) MK.hinweise(hinweisListe, gewaehlt); },
      /** Plätze, die seit der letzten Frage aufgegangen sind (gesperrt → frei), für Lichtpuls und Klang der Ansicht. Die Liste leert sich dabei. */
      offenNeu() { const l = [...offenNeu]; offenNeu.clear(); return l; },
      aktualisiere(stand) {
        if (tot) return [];
        if (stand !== undefined) welt = stand;
        const liste = BL.lage(objekt(thema) ? thema : null, welt), alt = M.liste;
        const vorher = new Map(alt.map(p => [p.platz, p.art]));
        for (const p of liste) if (p.art !== 'gesperrt' && p.art !== 'leer' && (vorher.get(p.platz) === 'gesperrt' || (!vorher.has(p.platz) && alt.length))) offenNeu.add(p.platz);
        if (liste.length !== alt.length || liste.some((p, i) => p.platz !== alt[i].platz)) {
          aufbau();
          if (kam !== null) kamera(kam, { sofort: true, frei: freiAlt });
          return liste.map(p => p.platz);
        }
        const sig = p => [p.art, p.bauteil, p.stufe, p.epoche, p.name].join('|'), geaendert = [];
        liste.forEach((p, i) => {
          if (sig(p) === sig(alt[i])) return;
          const e = L.BuehneBau.platz(p, pal), g0 = gruppe(p.platz);
          M.plaetze.set(p.platz, { p, e }); alt[i] = p;
          if (g0 && doc.createElementNS) { const tmp = doc.createElementNS(NS, 'g'); tmp.innerHTML = e.svg; if (tmp.firstElementChild) g0.replaceWith(tmp.firstElementChild); }
          if (api.imBau.has(p.platz)) verberge(p.platz, true);
          MK.platz(p, e);
          geaendert.push(p.platz);
        });
        if (geaendert.length) { if (L.BuehneLeben) L.BuehneLeben.rauch(eb.rauch, M, doc); markiere(); }
        return geaendert;
      },
      bauEffekt: nr => (tot || !L.BuehneBau ? Promise.resolve(false) : L.BuehneBau.effekt(api, nr)),
      lagerWachsen: r => (!tot && L.BuehneBau ? L.BuehneBau.lager(api, r) : false),
      routen(liste, fn, o = {}) { routenListe = Array.isArray(liste) ? liste.filter(objekt) : []; routeFn = typeof fn === 'function' ? fn : null; if ('gewaehlt' in (o || {})) routeGewaehlt = o.gewaehlt; zeichneRouten(); },
      waehleRoute,
      ort(id) {
        if (!M) return null;
        const P = L.Iso.punkt, x = Number.isInteger(id) ? M.plaetze.get(id) : id === 'siedlung' ? M.plaetze.get(0) : null;
        const p = x ? (Number.isInteger(id) ? P(x.p.x + x.p.b / 2, x.p.y + x.p.t / 2, .4) : x.e.spitze) : M.orte[id] ? M.orte[id].mitte : id === 'insel' ? M.mitte : null;
        return p ? { x: p[0], y: p[1] } : null;
      },
      zuSchirm(p) {
        const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0 };
        return { x: r.left + zustand.tx + zustand.s * (p.x - M.box.x0), y: r.top + zustand.ty + zustand.s * (p.y - M.box.y0) };
      },
      leben: () => (L.BuehneLeben ? L.BuehneLeben.zaehle(eb) : 0),
      modell: () => M,
      zerstoere() {
        if (tot) return;
        tot = true;
        if (beobachter) beobachter.disconnect();
        el.removeEventListener('pointerdown', beiDown); el.removeEventListener('pointerup', beiUp); el.removeEventListener('pointercancel', beiAbbruch); el.removeEventListener('keydown', beiTaste);
        leere(el);
        if (BUEHNEN.get(el) === regler) BUEHNEN.delete(el);
      }
    };
    aufbau();
    BUEHNEN.set(el, regler);
    const beobachter = typeof g.ResizeObserver === 'function' ? new g.ResizeObserver(() => { if (kam !== null) kamera(kam, { sofort: true, frei: freiAlt }); }) : null;
    if (beobachter) beobachter.observe(el);
    kamera(opt.kamera || 'start', { sofort: true });
    return regler;
  }

  Object.assign(B, { baue, WELT });
})(globalThis);
