/* app/welten/fachinseln/szene-marken.js: antippbare Ortsmarken der Areale über der 3D-Szene (nach docs/mockup/fachinsel-2026-10-20/szene.js, updateMarkers).
     W3.SzeneMarken({ ebene, doc, beiWahl(platz) }) → { setze(liste), stelle(projiziere, { breite, hoehe, frei, fokus, an }), alle() }
     liste: [{ platz, id, name, stufe }], projiziere(platz) → { x, y } in Pixeln der Bühne (Punkt über dem Dach) oder null.
   Jede Marke ist ein Knopf mit mindestens 44 Pixeln in fester Grösse: Sie hängt mit einem Zeiger über dem Dach, damit sie das Gebäude nicht verdeckt,
   und zeigt die Bauphase als Häuschen (Umriss gestrichelt, Fundament, Mauern, ganzes Haus), der Name der Phase steht im aria-label und im title.
   Eine Marke weicht nach oben aus, wenn sie eine andere verdeckt, und tritt zurück, wenn sie ausserhalb des freien Bereichs liegt
   oder in der Nahansicht zu einem anderen Areal gehört. Die Szene ruft stelle nach jedem gezeichneten Bild. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const PHASEN = ['Bauplatz', 'Fundament', 'Rohbau', 'Ausgebaut'];
  // Häuschen je Phase (24 × 24): Mauern hell, Dach in der Farbe der Marke (currentColor), Umriss in Tinte
  const UMRISS = 'M4 11 12 4l8 7v9H4z', SOCKEL = '<rect x="3" y="18" width="18" height="3" rx="1" fill="#b9a27a"/>';
  const SYMBOL = [
    `<path d="${UMRISS}" fill="none" stroke="#5b6b6a" stroke-width="1.6" stroke-dasharray="2.4 2"/>`,
    `<path d="${UMRISS}" fill="none" stroke="#5b6b6a" stroke-width="1.6" stroke-dasharray="2.4 2"/>${SOCKEL}`,
    `<path d="M5 11h14v8H5z" fill="#efe3c6" stroke="#233b3f" stroke-width="1.4"/><path d="M4 11 12 4l8 7" fill="none" stroke="#5b6b6a" stroke-width="1.6" stroke-dasharray="2.4 2"/>${SOCKEL}`,
    `<path d="M5 11h14v8H5z" fill="#efe3c6" stroke="#233b3f" stroke-width="1.4"/><path d="M10 19v-5h4v5" fill="#233b3f"/><path d="M3 11.5 12 4l9 7.5z" fill="currentColor" stroke="#233b3f" stroke-width="1.4" stroke-linejoin="round"/>${SOCKEL}`];

  W3.SzeneMarken = function (k) {
    const knoepfe = new Map();
    let reihe = [];

    function setze(liste) {
      const neu = new Set(liste.map(x => x.platz));
      for (const [p, b] of knoepfe) if (!neu.has(p)) { b.remove(); knoepfe.delete(p); }
      for (const x of liste) {
        let b = knoepfe.get(x.platz);
        if (!b) {
          b = k.doc.createElement('button');
          b.type = 'button'; b.className = 'fi-schild';
          const bild = k.doc.createElement('span'); bild.className = 'fi-phase'; bild.setAttribute('aria-hidden', 'true');
          b.append(bild, k.doc.createElement('b'));
          b.addEventListener('click', () => k.beiWahl(x.platz));
          k.ebene.appendChild(b); knoepfe.set(x.platz, b);
        }
        const s = Math.max(0, Math.min(3, x.stufe || 0)), phase = PHASEN[s];
        b.dataset.areal = x.id; b.dataset.stufe = String(s);
        if (b.firstChild.dataset.stufe !== String(s)) { b.firstChild.dataset.stufe = String(s); b.firstChild.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22">${SYMBOL[s]}</svg>`; }
        b.lastChild.textContent = x.name;
        b.setAttribute('aria-label', `${x.name}, ${phase}`); b.title = phase;
      }
      reihe = liste.map(x => x.platz);
    }

    function stelle(projiziere, o) {
      const f = o.frei || { links: 0, oben: 0, rechts: 0, unten: 0 }, belegt = [];
      const x0 = f.links || 0, y0 = f.oben || 0, x1 = o.breite - (f.rechts || 0), y1 = o.hoehe - (f.unten || 0);
      for (const platz of reihe) {
        const b = knoepfe.get(platz), p = o.an && (!o.fokus || o.fokus === platz) ? projiziere(platz) : null;
        if (!b) continue;
        if (p) { b.style.left = `${Math.round(p.x)}px`; b.style.top = `${Math.round(p.y)}px`; }
        const bw = b.offsetWidth || 120, bh = (b.offsetHeight || 44) + 8;    // + Zeiger
        // Die Marke steht mit dem Zeiger auf dem Punkt über dem Dach. Verdeckt sie eine andere, rückt sie mit längerem Zeiger nach oben, sonst tritt sie zurück
        let r = null;
        if (p) for (const dy of [0, -(bh + 4), -2 * (bh + 4)]) {
          const q = { l: p.x - bw / 2, r: p.x + bw / 2, o: p.y + dy - bh, u: p.y + dy };
          const passt = q.l >= x0 + 4 && q.r <= x1 - 4 && q.o >= y0 + 4 && q.u <= y1 - 4 && !belegt.some(s => q.l < s.r && q.r > s.l && q.o < s.u && q.u > s.o);
          if (passt) { r = q; b.style.setProperty('--zeiger', `${8 - dy}px`); break; }
        }
        b.style.visibility = r ? '' : 'hidden'; b.inert = !r;              // visibility statt hidden: die Grösse bleibt messbar
        if (r) belegt.push({ l: r.l - 4, r: r.r + 4, o: r.o - 4, u: r.u + 4 });
      }
    }

    return { setze, stelle, alle: () => [...knoepfe.values()], PHASEN };
  };
})(globalThis);
