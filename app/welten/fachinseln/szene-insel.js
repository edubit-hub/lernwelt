/* app/welten/fachinseln/szene-insel.js: baut eine Fachinsel in die Szene und zeigt ihre Areale in der richtigen Bauphase (nach docs/mockup/fachinsel-2026-10-20/szene.js).
     W3.SzeneInsel(THREE, { scene, bauten, objekte, natur, leben, fachbauten, modelle, baustufen }) → { baue(insel, farbe), zeige(w, an), setze(w, { plaetze, stufen, erweitert, wachsen }),
       modell(w, platz), orte(insel), anker(w, platz) → Punkt über dem Dach oder null }
   Eine Insel w: { insel, profil, orte, land, modelle: Map(platz → [Phase 0..3]), viertel: Map(platz → [Phase 0..3]), schilder: Map(platz → Objekt), stufen, plaetze }.
   Mathematik hat eigene Bauwerke (W3.Bauten), Baustellen (W3.Objekte) und Leben (W3.Themenleben). Die anderen Fächer bauen alle Phasen mit W3.Fachbauten.
   Jeder Platz liegt auf einer eigenen Kameraschicht (SCHICHT), damit die Nahansicht nur das gewählte Areal und die Landschaft zeigt. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});

  const MASSSTAB = 3.4;
  const PLAETZE = ['zahlen', 'rechnen', 'messen', 'garten', 'hafen', 'turm', 'brueche'];
  const MATHE = { zahlen: 'observatory', rechnen: 'workshop', messen: 'measure', garten: 'garden', hafen: 'harbour', turm: 'clocktower', brueche: 'fraction' };
  // Fertige Mathebauten aus Meshy (W3.ModellFabrik) mit Zielhöhe; die Grundfläche bleibt in 5,4 × 5,4 wie bei den Bauten aus Grundformen
  const MATHE_MODELL = { zahlen: ['sternwarte', 5], rechnen: ['rechenwerkstatt', 3.6], messen: ['halle-der-masse', 3.4], garten: ['mustergarten', 3], hafen: ['hafenstation', 3], turm: ['uhrenturm', 6.2] };
  const SCHICHT = { zahlen: 1, rechnen: 2, messen: 3, garten: 4, hafen: 5, turm: 6, brueche: 7 };

  W3.SzeneInsel = function (THREE, k) {
    const profil = insel => W3.Landschaften.getProfile(insel), weiser = W3.Wegweiser(THREE);

    /** Orte der Plätze in Weltkoordinaten [x, y, z] aus dem Landschaftsprofil. */
    function orte(insel) {
      const p = profil(insel);
      return Object.fromEntries(Object.entries(p.locations).map(([key, q]) => { const m = p.map(...q); return [key, [m[0] * MASSSTAB, p.height(...q), m[1] * MASSSTAB]]; }));
    }

    function markiere(obj, platz) {
      obj.userData.place = platz;
      obj.traverse(o => { o.layers.set(SCHICHT[platz]); if (o.isMesh) o.userData.place = platz; });
      return obj;
    }
    const M = k.modelle && k.modelle.hat ? k.modelle : null, B = k.baustufen || null;
    function bauwerk(platz) {
      const m = MATHE_MODELL[platz];
      if (!M || !m || !M.hat(m[0])) return k.bauten[MATHE[platz]]();
      const g = M.statisch(m[0], { name: m[0], breite: 5.4, tiefe: 5.4, hoehe: m[1] }); g.userData.garten = platz === 'garten'; return g;
    }
    // Baustelle: Schnitt durch das fertige Modell (W3.Baustufen). Ohne Modell Phase 0 bis 2 aus Grundformen, Phase 2 mit dem Holzbaugerüst aus Meshy
    function baustelle(platz, s) {
      const w = platz === 'garten' ? 5.8 : 5, d = platz === 'hafen' ? 4.8 : 4.4, m = MATHE_MODELL[platz];
      if (B && m && B.hat(m[0])) return B.stufe(m[0], s, { breite: 5.4, tiefe: 5.4, hoehe: m[1], garten: platz === 'garten' });
      if (s < 2 || !M || !M.hat('holzbaugeruest')) return k.objekte.construction(w, d, s);
      const g = k.objekte.construction(w, d, 1);
      g.add(M.statisch('holzbaugeruest', { name: 'Holzbaugerüst', breite: w - .6, tiefe: d - .6, hoehe: 3.4 }));
      return g;
    }
    // Das Baustellen-Set steht neben dem Bau auf dem Gelände (das nur unter dem Areal eben ist)
    const v = new THREE.Vector3();
    function setzeHin(obj, ort, p) {
      obj.position.set(ort[0], ort[1], ort[2]); obj.visible = false; k.scene.add(obj);
      if (p) { obj.updateMatrixWorld(true); obj.traverse(o => { if (o.userData.requisit) { o.getWorldPosition(v); o.position.y += p.heightWorld(v.x, v.z) - v.y; } }); }
      return obj;
    }

    function baue(insel, farbe) {
      const o = orte(insel), p = profil(insel);
      const w = { insel, profil: p, orte: o, farbe: farbe || null, modelle: new Map(), viertel: new Map(), schilder: new Map(), schildText: new Map(), stufen: {}, gezeigt: {}, plaetze: new Set(), erweitert: false };
      w.weiser = weiser.plaetze(p, o, MASSSTAB);   // Wegweiser am Wegrand vor jedem Areal (W3.Wegweiser); die Bäume halten Abstand
      w.land = k.natur.create(insel, p, o, Object.fromEntries(Object.entries(w.weiser).map(([key, s]) => [key, [s.x, s.z]])));
      k.scene.add(w.land.root);
      for (const platz of PLAETZE) {
        if (!o[platz]) continue;
        if (insel === 'math') {
          const phasen = [0, 1, 2].map(s => setzeHin(markiere(baustelle(platz, s), platz), o[platz], p));
          phasen.push(setzeHin(markiere(bauwerk(platz), platz), o[platz]));
          w.modelle.set(platz, phasen);
          w.viertel.set(platz, [0, 1, 2, 3].map(s => setzeHin(markiere(k.leben ? k.leben.create(platz, s) : new THREE.Group(), platz), o[platz])));
        } else {
          w.modelle.set(platz, [0, 1, 2, 3].map(s => setzeHin(markiere(k.fachbauten.create(insel, platz, s), platz), o[platz], p)));
          w.viertel.set(platz, []);
        }
      }
      zeige(w, false);
      return w;
    }

    /** Schild eines Platzes: wird neu gebaut, wenn sich die Zeilen ändern (neues Land trägt den Namen seines Moduls). */
    function schild(w, platz, zeilen) {
      const text = zeilen.join('\n');
      if (w.schildText.get(platz) === text) return w.schilder.get(platz);
      const alt = w.schilder.get(platz);
      if (alt) k.scene.remove(alt);
      const s = markiere(k.objekte.sign(zeilen, w.farbe ? { edge: w.farbe.kante, ink: w.farbe.tinte } : {}), platz), ort = w.orte[platz], v = w.weiser[platz];
      s.position.set(ort[0] + v.x, w.profil.heightWorld(ort[0] + v.x, ort[2] + v.z), ort[2] + v.z); s.rotation.y = v.ry;
      k.scene.add(s);
      w.schilder.set(platz, s); w.schildText.set(platz, text);
      return s;
    }

    function zeige(w, an) {
      w.land.root.visible = !!an;
      if (!an) for (const liste of [...w.modelle.values(), ...w.viertel.values()]) liste.forEach(m => { m.visible = false; });
      if (!an) w.schilder.forEach(s => { s.visible = false; });
      if (an) setze(w, { plaetze: w.plaetzeDaten || new Map(), stufen: w.stufen, erweitert: w.erweitert });
    }

    /** plaetze: Map(platz → { schild }), stufen: { platz: 0..3 }, erweitert: das neue Land ist sichtbar. Plätze ohne Areal bleiben leer.
     *  wachsen: Ein sichtbares Areal, das seit dem letzten Zeigen eine Stufe aufgestiegen ist, wächst in seine neue Phase (W3.Baustufen). */
    function setze(w, s) {
      w.plaetzeDaten = s.plaetze; w.stufen = { ...s.stufen }; w.erweitert = !!s.erweitert;
      w.plaetze = new Set([...s.plaetze.keys()].filter(p => w.modelle.has(p) && (p !== 'brueche' || w.erweitert)));
      const an = w.land.root.visible, L0 = w.land;
      for (const [platz, phasen] of w.modelle) {
        const da = an && w.plaetze.has(platz), st = Math.max(0, Math.min(3, w.stufen[platz] || 0));
        phasen.forEach((m, i) => { m.visible = da && i === st; });
        if (da && B && s.wachsen && w.gezeigt[platz] !== undefined && st > w.gezeigt[platz]) B.wachse(phasen[st], st);
        if (da) w.gezeigt[platz] = st;
        (w.viertel.get(platz) || []).forEach((m, i) => { m.visible = da && i === st; });
        if (L0.districtLandscape && L0.districtLandscape.get(platz)) L0.districtLandscape.get(platz).visible = da;
        if (da) schild(w, platz, (s.plaetze.get(platz).schild || [platz])).visible = true;
        else if (w.schilder.has(platz)) w.schilder.get(platz).visible = false;
      }
      for (const t of [L0.extension, L0.extensionDecor, L0.expansionRoad]) if (t) t.visible = an && w.erweitert;
      if (L0.mist) L0.mist.setReveal(w.erweitert ? 1 : 0);
    }

    /** Punkt knapp über dem höchsten Teil der sichtbaren Phase (Welt): dort hängt die Ortsmarke, über dem Dach statt vor dem Gebäude. */
    function anker(w, platz) {
      const st = Math.max(0, Math.min(3, w.stufen[platz] || 0)), m = (w.modelle.get(platz) || [])[st];
      if (!m || !m.visible) return null;
      if (!m.userData.anker) { const b = new THREE.Box3().setFromObject(m); m.userData.anker = new THREE.Vector3(m.position.x, b.max.y + 0.5, m.position.z - 0.5); }
      return m.userData.anker;
    }

    /** Das sichtbare Modell eines Platzes mit seinem Leben, als Kopie ohne Schichten (für Miniaturen). */
    function modell(w, platz) {
      const st = Math.max(0, Math.min(3, w.stufen[platz] || 0)), gruppe = new THREE.Group();
      for (const m of [(w.modelle.get(platz) || [])[st], (w.viertel.get(platz) || [])[st]]) {
        if (!m) continue;
        const teil = M ? M.figurenErsetzen(m.clone(true)) : m.clone(true); teil.visible = true; teil.position.set(0, 0, 0); teil.traverse(o => o.layers.set(0)); gruppe.add(teil);
      }
      return gruppe;
    }

    return { baue, zeige, setze, modell, orte, anker, SCHICHT, PLAETZE };
  };
})(globalThis);
