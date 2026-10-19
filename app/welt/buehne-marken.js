/* app/welt/buehne-marken.js: die Marken auf der Bühne (Umbauplan 3.3, ausgelagert aus buehne.js): Ortsschilder, Schloss gesperrter Plätze mit der Nummer
   ihrer Epoche, Stufe des gewählten Gebäudes und warme Pfeile an Plätzen, auf denen sich jetzt bauen oder ausbauen lässt. Marken bleiben gleich gross,
   egal wie nah die Kamera ist (--inv in buehne.css), und sind Knöpfe ab 44 px. Kein Zustand, nur DOM in der Ebene «marken».
     BuehneMarken.baue({ ebene, neu, modell, thema, palette, waehle, beiOrt }) → { marke, alle(), platz(p, e), markiere(gewaehlt), schild(id, o), hinweise(nrListe), leere() } */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const SCHILDER = ['forschung', 'siedlung', 'hafen', 'tor'], MINI = { hafen: 'auftraege' };
  const SPERREN = '.hud-moeglich, header.hud .pille, header.hud .hud-links';           // schwebende Leisten über der Bühne (verdecke)
  const RANG = ['bn-stufe', 'bn-pfeil', 'bn-schild', 'bn-route', 'bn-siegel'];        // wer bei Überlappung bleibt
  const SCHLOSS = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8.3 10.5V7.8a3.7 3.7 0 0 1 7.4 0v2.7"/></svg>';
  const PFEIL = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/></svg>';
  const leere = e => { if (typeof e.replaceChildren === 'function') e.replaceChildren(); else e.innerHTML = ''; };

  function baue(o) {
    const eb = o.ebene, M = o.modell, schilder = new Map(), platzMarken = new Map(), pfeile = new Map();
    const nrEpoche = id => { const es = (o.thema && Array.isArray(o.thema.epochen)) ? o.thema.epochen : []; const i = es.findIndex(e => e && e.id === id); return i >= 0 ? i + 1 : null; };

    function marke(tag, klasse, p, attr) {
      const e = o.neu(tag, 'bn-marke ' + klasse, eb);
      e.style.cssText = `left:${L.Iso.f(p[0] - M().box.x0)}px;top:${L.Iso.f(p[1] - M().box.y0)}px`;
      for (const [k, v] of Object.entries(attr || {})) e.setAttribute(k, v);
      if (tag === 'button') e.setAttribute('type', 'button');
      return e;
    }
    const weg = liste => { for (const m of liste || []) if (m.parentNode) m.parentNode.removeChild(m); };

    /** Marken eines Platzes: Schloss mit Epochennummer (gesperrt) oder Stufe (gebaut, nur beim gewählten sichtbar). */
    function platz(p, e) {
      weg(platzMarken.get(p.platz));
      const liste = [];
      if (p.art === 'gesperrt') {
        const nr = nrEpoche(p.epoche), s = marke('button', 'bn-siegel', e.spitze, { 'data-siegel': p.platz, 'aria-label': `Bauplatz der Epoche ${p.name}, gesperrt` });
        s.innerHTML = SCHLOSS + (nr ? `<small class="bn-siegel-nr" aria-hidden="true">Epoche ${nr}</small>` : '');
        s.addEventListener('click', () => o.waehle(p.platz)); liste.push(s);
      } else if (p.art === 'gebaut') {
        const s = marke('div', 'bn-stufe', e.spitze, { 'data-stufe': p.platz }), max = Math.max(1, p.max | 0);
        s.innerHTML = `<span>Stufe ${p.stufe}</span><span class="bn-balken">${Array.from({ length: max }, (_, i) => `<i class="${i < p.stufe ? 'voll' : ''}"></i>`).join('')}</span>`;
        liste.push(s);
      }
      platzMarken.set(p.platz, liste);
    }

    function alle() {
      leere(eb); schilder.clear(); platzMarken.clear(); pfeile.clear();
      for (const id of SCHILDER) {
        const p0 = M().plaetze.get(0), ort = id === 'siedlung' ? (p0 && p0.p.art !== 'leer' ? { spitze: p0.e.spitze, name: 'Siedlung' } : null) : M().orte[id];
        if (!ort) continue;
        const k = marke('button', 'bn-schild marke-ort', ort.spitze, { 'data-schild': id, 'aria-label': ort.name }), bild = o.neu('span', 'bn-schild-bild', k), text = o.neu('span', 'bn-schild-text', k);
        bild.innerHTML = L.Iso.mini(MINI[id] || id, { groesse: 34, palette: o.palette });
        o.neu('b', '', text).textContent = ort.name;
        const zusatz = o.neu('small', '', text);
        k.addEventListener('click', () => o.beiOrt(id));
        schilder.set(id, { knopf: k, zusatz, name: ort.name });
      }
      for (const { p, e } of M().plaetze.values()) platz(p, e);
    }

    /** Die Stufe zeigt sich nur am gewählten Gebäude; dort tritt der Pfeil zurück. */
    function markiere(gewaehlt) {
      for (const [nr, liste] of platzMarken) for (const m of liste) if (m.classList.contains('bn-stufe')) m.classList.toggle('zeigen', nr === gewaehlt);
      for (const [nr, m] of pfeile) m.classList.toggle('still', nr === gewaehlt);
    }

    /** Warme Pfeile «hier geht etwas» an den Plätzen der Liste (Bauen auf einem freien Platz, Ausbau eines Gebäudes). */
    function hinweise(liste, gewaehlt) {
      for (const m of pfeile.values()) if (m.parentNode) m.parentNode.removeChild(m);
      pfeile.clear();
      for (const h of Array.isArray(liste) ? liste : []) {
        const x = M().plaetze.get(h.platz);
        if (!x || pfeile.has(h.platz)) continue;
        const m = marke('button', 'bn-pfeil', x.e.spitze, { 'data-hinweis': h.platz, 'aria-label': h.text || 'Hier geht es weiter' });
        m.innerHTML = PFEIL;
        m.addEventListener('click', () => o.waehle(h.platz));
        pfeile.set(h.platz, m);
      }
      markiere(gewaehlt);
    }

    function schild(id, w = {}) {
      const s = schilder.get(id);
      if (!s) return false;
      s.zusatz.textContent = w.zusatz || '';
      s.knopf.classList.toggle('warm', !!w.warm);
      s.knopf.setAttribute('aria-label', w.zusatz ? `${s.name}, ${w.zusatz}` : s.name);
      return true;
    }

    /** Ortsschilder, die nach einer Fahrt unter HUD, Dock oder einer Tafel liegen oder am Rand angeschnitten sind, treten zurück (.verdeckt).
        frei: { links, oben, rechts, unten } wie BuehneKamera.miss, breite und hoehe der Bühne. */
    function verdecke(frei, breite, hoehe) {
      const f = frei || {}, r0 = o.ebene && o.ebene.getBoundingClientRect ? o.ebene.closest && o.ebene.closest('.buehne-ebene') : null, b = r0 && r0.getBoundingClientRect ? r0.getBoundingClientRect() : { left: 0, top: 0 };
      // Alle Marken (Schilder, Pfeile, Schlösser, Stufe), nicht nur die Schilder: nichts steht halb unter HUD, Tafel oder Dock (Nachbesserung 2)
      const liste = o.ebene && typeof o.ebene.querySelectorAll === 'function' ? Array.from(o.ebene.querySelectorAll('.bn-marke')) : [...schilder.values()].map(s => s.knopf);
      // Schlussprüfung: auch schwebende Leisten über der Bühne («Jetzt möglich», Pillen und Medaille im HUD) sind Sperrflächen, und Marken
      // decken einander nicht: die wichtigere bleibt (Stufe des gewählten Gebäudes, Pfeil, Ortsschild, Route, Schloss), die übrigen treten zurück
      const d = o.ebene && o.ebene.ownerDocument, sperren = [], behalten = [];
      if (d && typeof d.querySelectorAll === 'function') for (const s of d.querySelectorAll(SPERREN)) { const q = s.getBoundingClientRect && s.getBoundingClientRect(); if (q && q.width) sperren.push(q); }
      // Fläche einer Marke mit ihren Kindern: die Epochennummer am Schloss hängt unter dem runden Knopf
      const flaeche = e => { const r = e.getBoundingClientRect(); if (!r || !r.width) return r; let { left, top, right, bottom } = r;
        for (const c of e.children || []) { const q = c.getBoundingClientRect && c.getBoundingClientRect(); if (q && q.width) { left = Math.min(left, q.left); top = Math.min(top, q.top); right = Math.max(right, q.right); bottom = Math.max(bottom, q.bottom); } }
        return { left, top, right, bottom, width: right - left, height: bottom - top }; };
      const deckt = (r, q, rand) => r.left < q.right + rand && r.right > q.left - rand && r.top < q.bottom + rand && r.bottom > q.top - rand;
      const rang = e => RANG.findIndex(k => e.classList.contains(k)) + 1 || RANG.length + 1;
      const modus = r0 && r0.getAttribute ? r0.getAttribute('data-marken') : null, routen = !!(r0 && r0.classList && r0.classList.contains('mit-routen'));
      const hat = (e, k) => e.classList.contains(k), zeigt = e => (hat(e, 'bn-schild') ? modus === 'orte' || (modus === 'plaetze' && hat(e, 'warm'))
        : hat(e, 'bn-route') ? routen : hat(e, 'bn-stufe') ? modus === 'plaetze' && hat(e, 'zeigen') : hat(e, 'bn-pfeil') ? modus === 'plaetze' && !hat(e, 'still') : modus === 'plaetze');
      liste.sort((a, c) => (a && c && a.classList && c.classList ? rang(a) - rang(c) : 0));
      for (const e of liste) {
        if (!e || typeof e.getBoundingClientRect !== 'function') continue;
        const r = flaeche(e);
        if (!r || !r.width) continue;
        const x0 = r.left - b.left, y0 = r.top - b.top, x1 = x0 + r.width, y1 = y0 + r.height;
        const weg = y0 < (f.oben || 0) - 2 || y1 > hoehe - (f.unten || 0) + 2 || x0 < (f.links || 0) - 2 || x1 > breite - (f.rechts || 0) + 2 ||
          (zeigt(e) && (sperren.some(q => deckt(r, q, 4)) || behalten.some(q => deckt(r, q, -3))));
        e.classList.toggle('verdeckt', weg);
        if (!weg && zeigt(e)) behalten.push(r);                         // nur was im Modus der Bühne sichtbar ist (buehne.css), verdeckt andere
      }
    }

    return { marke, alle, platz, markiere, hinweise, schild, schilder, verdecke };
  }

  L.BuehneMarken = { baue, SCHILDER };
})(globalThis);
