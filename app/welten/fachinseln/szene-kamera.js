/* app/welten/fachinseln/szene-kamera.js: Kamera und Schatten der Fachinseln (nach docs/mockup/fachinsel-2026-10-20/szene.js, updateCamera und clearTopicRotation).
     W3.SzeneKamera(THREE, { camera, sonne, renderer, schicht }) → { stelle(z), freieSicht(w, platz, schild), ziel }
     stelle({ breite, hoehe, insel: w, fokus: platz | null, frei: { links, oben, rechts, unten } | null, drehung, zoom }) richtet die isometrische Kamera aus.
   Die Übersicht zeigt die ganze Insel im freien Bereich zwischen HUD, Tafel und Dock. Die Nahansicht zeigt nur das Areal und die Landschaft und dreht
   sich auf die nächste Seite, von der kein Berg die Sicht verdeckt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const WINKEL = 0.8, ABSTAND = 155, HOEHE = 121.5;

  W3.SzeneKamera = function (THREE, k) {
    const ziel = new THREE.Vector3(-9, 6, -4), sichten = new Map();

    function schatten(nah) {
      const c = nah ? ziel : new THREE.Vector3(-5, 5, 0), s = nah ? 26 : 95, sonne = k.sonne;
      sonne.position.set(c.x - 55, c.y + 105, c.z + 65); sonne.target.position.set(c.x, c.y, c.z);
      Object.assign(sonne.shadow.camera, { left: -s, right: s, top: s, bottom: -s });
      sonne.shadow.camera.updateProjectionMatrix(); k.renderer.shadowMap.needsUpdate = true;
    }

    function stelle(z) {
      const cam = k.camera, w = Math.max(1, z.breite), h = Math.max(1, z.hoehe), a = WINKEL + (z.drehung || 0), aspekt = w / h, f = z.frei;
      const fokus = z.fokus && z.insel && z.insel.orte[z.fokus] ? z.fokus : null;
      let hoch = fokus ? Math.max(20, 24 / aspekt) : Math.max(104, 125 / aspekt);
      if (fokus) { const p = z.insel.orte[fokus]; ziel.set(p[0], p[1] + 0.4, p[2]); }
      else ziel.set(z.insel && z.insel.erweitert ? -18 : -9, 6, z.insel && z.insel.erweitert ? -10 : -4);
      if (f) {
        const fb = Math.max(1, w - (f.links || 0) - (f.rechts || 0)), fh = Math.max(1, h - (f.oben || 0) - (f.unten || 0));
        if (!fokus) hoch *= Math.min(1.35, Math.max(1, h / fh, w / fb));   // die ganze Insel passt in den freien Bereich, höchstens um ein Drittel kleiner
        const cx = (f.links || 0) + fb / 2, cy = (f.oben || 0) + fh / 2;
        const rechts = (w / 2 - cx) / w * hoch * aspekt, vor = (h / 2 - cy) / h * hoch / 0.615;
        ziel.x += Math.cos(a) * rechts + Math.sin(a) * vor;
        ziel.z += -Math.sin(a) * rechts + Math.cos(a) * vor;
      }
      cam.layers.set(0);
      if (fokus) cam.layers.enable(k.schicht[fokus]); else cam.layers.enableAll();
      cam.left = -hoch * aspekt / 2; cam.right = hoch * aspekt / 2; cam.top = hoch / 2; cam.bottom = -hoch / 2;
      cam.position.set(ziel.x + Math.sin(a) * ABSTAND, ziel.y + HOEHE, ziel.z + Math.cos(a) * ABSTAND);
      cam.lookAt(ziel); cam.zoom = z.zoom || 1; cam.updateProjectionMatrix();
      if (z.insel) z.insel.schilder.forEach(s => { s.rotation.y = a; });     // die Pfosten bleiben im Boden, die Tafeln drehen sich zum Betrachter
      schatten(!!fokus);
      return a;
    }

    /** Drehung (Bogenmass) zur nächsten Seite, von der kein Gelände die Sicht auf Areal und Schild verdeckt. Je Insel und Platz einmal gerechnet. */
    function freieSicht(w, platz) {
      const key = `${w.insel}:${platz}`;
      if (sichten.has(key)) return sichten.get(key);
      const p = w.orte[platz], prof = w.profil, s = w.schilder.get(platz);
      const punkte = [[-7, -6], [0, -6], [7, -6], [-7, 0], [0, 0], [7, 0], [-7, 6], [0, 6], [7, 6]];
      let beste = 0, wert = Infinity;
      for (let schritt = 0; schritt <= 12; schritt++) for (const r of schritt ? [1, -1] : [1]) {
        const d = schritt * r * Math.PI / 12, a = WINKEL + d, ziele = punkte.slice();
        if (s) for (const seite of [-3, 0, 3]) ziele.push([s.position.x - p[0] + Math.cos(a) * seite, s.position.z - p[2] - Math.sin(a) * seite]);
        let summe = 0;
        for (const [dx, dz] of ziele) for (let weit = 2; weit <= 60; weit += 1.5) {
          const x = p[0] + dx + Math.sin(a) * weit, z = p[2] + dz + Math.cos(a) * weit;
          const verdeckt = prof.heightWorld(x, z) - (p[1] + 0.7 + weit * HOEHE / ABSTAND);
          if (verdeckt > 0) summe += verdeckt;
        }
        if (summe < wert) { beste = d; wert = summe; }
        if (summe === 0) { sichten.set(key, d); return d; }
      }
      sichten.set(key, beste);
      return beste;
    }

    return { stelle, freieSicht, ziel, schatten, WINKEL };
  };
})(globalThis);
