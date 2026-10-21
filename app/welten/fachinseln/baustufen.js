/* app/welten/fachinseln/baustufen.js: Bauphasen aus den fertigen Meshy-Modellen (Prüfung vom 21.10.2026, docs/plaene/asset-verbesserung_plan_2026-10-21_0.1.md).
     W3.Baustufen(THREE, modelle) → { hat(id), stufe(id, s, { breite, tiefe, hoehe, garten, requisiten }) → Group, anteil(id, s, garten), wachse(obj, s), update(t) }
   Stufe 0 zeigt Grundriss und Sockel, Stufe 1 die Mauern bis zur halben Traufe, Stufe 2 bis knapp unter die Traufe, Stufe 3 ist das fertige Modell.
   Der Schnitt läuft im Netz: Dreiecke an der Schnitthöhe werden geteilt, so sehen Schatten, Miniaturen und Strahltests dasselbe wie das Bild, und das iPad zeichnet nichts zusätzlich.
   Rohbau: Eckenfarben zur Hälfte bis fast ganz Richtung Sandstein, Gerüst aus Stangen rund um den Grundriss (ein Netz), daneben das Baustellen-Set aus Meshy
   (bretterstapel, steinpalette, schubkarre, je nach Stufe). Gärten wachsen ohne Gerüst und ohne Rohbaufarbe.
   wachse(obj, s) lässt die Modelle eines sichtbaren Objekts von der Höhe der Stufe s - 1 auf ihre eigene Höhe wachsen (DAUER), update(t) führt das mit der Uhr der Szene weiter.
   Ein Modell mit userData.wachsAb (Anteil 0..1) wächst ab dieser Höhe. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const DAUER = 1.6, ROH = '#cfc6b4', MISCHUNG = [0.85, 0.45, 0.1], GARTEN = { anteil: [0.16, 0.3, 0.6], mischung: [0.6, 0, 0] };
  // Traufe als Anteil der Höhe, wo die Messung des Dachüberstands nicht trägt (Anbau mit Wasserrad, gemessen 21.10.2026)
  const TRAUFE = { rechenwerkstatt: 0.5 };
  // Baustellen-Set je Stufe: [Modell, Breite, x, z, Drehung]. Die Plätze der Mathe-Areale sind frei von Station (links), Pavillon (hinten rechts) und Schild (vorne rechts)
  const SET = [[['steinpalette', 1.5, -4.3, -2.6, .3], ['schubkarre', 1.6, -1.6, 3.5, .6]],
    [['steinpalette', 1.5, -4.3, -2.6, .3], ['bretterstapel', 2.3, 4, .6, 1.57], ['schubkarre', 1.6, -1.6, 3.5, .6]],
    [['bretterstapel', 2.3, 4, .6, 1.57], ['schubkarre', 1.6, -1.6, 3.5, .6]]];

  W3.Baustufen = function (THREE, modelle) {
    const M = modelle && modelle.hat ? modelle : null, roh = new THREE.Color(ROH), holz = new THREE.Color('#9c6b3f'), brett = new THREE.Color('#b88a57');
    // Offene Bauten zeigen die Innenseite ihrer Wände (flatShading richtet die Normale zur Kamera); ein Material für alle Baustellen
    const offen = M && Object.assign(M.material.clone(), { side: THREE.DoubleSide });
    const traufen = new Map(), schnitte = new Map(), laeufe = [];
    const hat = id => !!(M && M.hat(id));

    /** Traufe: erste Höhe (Anteil), ab der die Schicht deutlich breiter ist als die Wand bei 30 % */
    function traufe(id) {
      if (TRAUFE[id]) return TRAUFE[id];
      if (traufen.has(id)) return traufen.get(id);
      const geo = M.geometrie(id), p = geo.attributes.position.array, b = geo.boundingBox, H = b.max.y - b.min.y, n = 24, br = new Float32Array(n);
      const mx = (b.min.x + b.max.x) / 2, mz = (b.min.z + b.max.z) / 2;
      for (let i = 0; i < p.length; i += 3) { const k = Math.min(n - 1, (p[i + 1] - b.min.y) / H * n | 0); br[k] = Math.max(br[k], Math.abs(p[i] - mx), Math.abs(p[i + 2] - mz)); }
      let t = 0.75; const wand = br[Math.round(n * 0.3)];
      for (let k = Math.round(n * 0.35); k < n; k++) if (br[k] > wand * 1.06) { t = k / n; break; }
      traufen.set(id, t); return t;
    }
    function anteil(id, s, garten) { return s >= 3 ? 1.001 : s < 0 ? 0 : garten ? GARTEN.anteil[s] : [0.12, traufe(id) * 0.5, traufe(id) - 0.02][s]; }

    /** Schneidet quelle bei der Höhe h (Raum des Modells) und mischt die Farben zu mischung Richtung Rohbau. In ziel, wenn es Platz hat, sonst neu und knapp. */
    function schneide(quelle, h, mischung, ziel) {
      const namen = Object.keys(quelle.attributes), A = namen.map(n => quelle.attributes[n]), pos = quelle.attributes.position.array, n = pos.length / 3;
      const aus = ziel ? namen.map(nm => ziel.attributes[nm].array) : A.map(a => new Float32Array(n * 2 * a.itemSize));
      let o = 0; const poly = [];
      const schreibe = (i, j, t) => {
        A.forEach((a, k) => { const s = a.itemSize, q = a.array, z = aus[k]; for (let c = 0; c < s; c++) z[o * s + c] = q[i * s + c] + (q[j * s + c] - q[i * s + c]) * t; });
        if (mischung) { const c = aus[namen.indexOf('color')]; for (let e = 0; e < 3; e++) c[o * 3 + e] += ([roh.r, roh.g, roh.b][e] - c[o * 3 + e]) * mischung; }
        o++;
      };
      for (let v = 0; v < n; v += 3) {
        poly.length = 0;
        for (let e = 0; e < 3; e++) {   // Sutherland-Hodgman an der Ebene y = h
          const i = v + e, j = v + (e + 1) % 3, yi = pos[i * 3 + 1], yj = pos[j * 3 + 1];
          if (yi <= h) poly.push([i, i, 0]);
          if ((yi <= h) !== (yj <= h)) poly.push([i, j, (h - yi) / (yj - yi)]);
        }
        for (let k = 1; k + 1 < poly.length; k++) { schreibe(...poly[0]); schreibe(...poly[k]); schreibe(...poly[k + 1]); }
      }
      const geo = ziel || new THREE.BufferGeometry();
      if (ziel) { namen.forEach(nm => { ziel.attributes[nm].needsUpdate = true; }); ziel.setDrawRange(0, o); return ziel; }
      namen.forEach((nm, k) => geo.setAttribute(nm, new THREE.BufferAttribute(aus[k].slice(0, o * A[k].itemSize), A[k].itemSize)));
      geo.boundingBox = quelle.boundingBox.clone(); geo.boundingSphere = quelle.boundingSphere.clone();
      return geo;
    }
    function leer(quelle) {   // Platz für jeden Schnitt, zum Wachsen
      const geo = new THREE.BufferGeometry(), n = quelle.attributes.position.count;
      for (const [nm, a] of Object.entries(quelle.attributes)) geo.setAttribute(nm, new THREE.BufferAttribute(new Float32Array(n * 2 * a.itemSize), a.itemSize).setUsage(THREE.DynamicDrawUsage));
      geo.boundingBox = quelle.boundingBox.clone(); geo.boundingSphere = quelle.boundingSphere.clone(); return geo;
    }

    /** Gerüst als ein Netz: Stangen alle rund 1,3 Einheiten, Bretter auf halber und voller Höhe, je Seite eine Strebe */
    function geruest(sx, sz, h) {
      const teile = [], X = sx / 2 + 0.3, Z = sz / 2 + 0.3, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      const quader = (x, y, z, b, hh, t, farbe, ry = 0, rz = 0) => {
        const geo = new THREE.BoxGeometry(b, hh, t).toNonIndexed(); e.set(0, ry, rz, 'YZX');
        geo.applyMatrix4(m4.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e), new THREE.Vector3(1, 1, 1)));
        const c = new Float32Array(geo.attributes.position.count * 3); for (let i = 0; i < c.length; i += 3) farbe.toArray(c, i);
        geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); teile.push(geo);
      };
      for (const [x0, z0, x1, z1] of [[-X, -Z, X, -Z], [X, -Z, X, Z], [X, Z, -X, Z], [-X, Z, -X, -Z]]) {
        const l = Math.hypot(x1 - x0, z1 - z0), m = Math.max(1, Math.round(l / 1.3)), ry = -Math.atan2(z1 - z0, x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        for (let i = 0; i < m; i++) quader(x0 + (x1 - x0) * i / m, (h + 0.3) / 2, z0 + (z1 - z0) * i / m, 0.08, h + 0.3, 0.08, holz);
        for (const y of [h * 0.5, h]) quader(cx, y, cz, l + 0.12, 0.05, 0.3, brett, ry);
        quader(x0 + (x1 - x0) * 0.5 / m, h * 0.5, z0 + (z1 - z0) * 0.5 / m, Math.hypot(l / m, h), 0.05, 0.05, holz, ry, Math.atan2(h, l / m));   // Strebe im ersten Feld
      }
      const n = teile.reduce((s, t) => s + t.attributes.position.count, 0), geo = new THREE.BufferGeometry();
      for (const nm of ['position', 'normal', 'color']) {
        const a = new Float32Array(n * 3); let o = 0; for (const t of teile) { a.set(t.attributes[nm].array, o); o += t.attributes[nm].array.length; }
        geo.setAttribute(nm, new THREE.BufferAttribute(a, 3));
      }
      teile.forEach(t => t.dispose());
      const mesh = new THREE.Mesh(geo, M.material); mesh.name = 'Gerüst'; mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
    }

    function stufe(id, s, o = {}) {
      const root = new THREE.Group(), bau = M.statisch(id, { name: id + ' Stufe ' + s, breite: o.breite, tiefe: o.tiefe, hoehe: o.hoehe }), mesh = bau.children[0];
      const quelle = mesh.geometry, b = quelle.boundingBox, a = anteil(id, s, o.garten), mischung = (o.garten ? GARTEN.mischung : MISCHUNG)[s];
      const h = b.min.y + (b.max.y - b.min.y) * a, k = id + '|' + s + '|' + !!o.garten;
      if (!schnitte.has(k)) schnitte.set(k, schneide(quelle, h, mischung));
      mesh.geometry = schnitte.get(k); mesh.material = offen; mesh.userData.bau = { id, s, garten: !!o.garten, quelle, h, mischung };
      root.name = 'Baustelle ' + id + ' · Stufe ' + s; root.add(bau);
      const sx = (b.max.x - b.min.x) * bau.scale.x, sz = (b.max.z - b.min.z) * bau.scale.z;
      if (s > 0 && !o.garten) root.add(geruest(sx, sz, Math.max(0.8, (b.max.y - b.min.y) * a * bau.scale.y)));
      for (const [teil, breite, x, z, ry] of (o.requisiten || SET[s])) {
        if (!hat(teil)) continue;
        const r = M.statisch(teil, { name: teil, breite }); r.position.set(x, 0, z); r.rotation.y = ry; r.userData.wachsAb = 1; r.userData.requisit = true; root.add(r);
      }
      return root;
    }

    /** Lässt die Modelle in obj von der Höhe der Stufe s - 1 auf ihre Höhe wachsen. Figuren und Grundformen bleiben, wie sie sind. */
    function wachse(obj, s) {
      obj.traverse(m => {
        if (!m.isMesh || m.isSkinnedMesh || !m.parent || !m.parent.userData.modell || laeufe.some(l => l.mesh === m)) return;
        const bau = m.userData.bau, quelle = bau ? bau.quelle : m.geometry, b = quelle.boundingBox, H = b.max.y - b.min.y, id = m.parent.userData.modell;
        const ab = m.parent.userData.wachsAb !== undefined ? m.parent.userData.wachsAb : anteil(id, s - 1, bau ? bau.garten : !!m.parent.userData.garten);
        const bis = bau ? bau.h : b.max.y + 1e-3;
        if (ab >= 1 || b.min.y + H * ab >= bis) return;
        laeufe.push({ mesh: m, quelle, ziel: m.geometry, material: m.material, von: b.min.y + H * ab, bis, mischung: bau ? bau.mischung : 0, temp: leer(quelle), start: null });
        const l = laeufe[laeufe.length - 1]; m.geometry = schneide(quelle, l.von, l.mischung, l.temp); m.material = offen;
      });
    }
    function update(t) {
      for (let i = laeufe.length - 1; i >= 0; i--) {
        const l = laeufe[i]; if (l.start === null) l.start = t;
        const f = Math.min(1, (t - l.start) / DAUER), e = 1 - (1 - f) * (1 - f);
        if (f < 1) { schneide(l.quelle, l.von + (l.bis - l.von) * e, l.mischung, l.temp); continue; }
        l.mesh.geometry = l.ziel; l.mesh.material = l.material; l.temp.dispose(); laeufe.splice(i, 1);
      }
    }
    return { hat, stufe, anteil, wachse, update, waechst: () => laeufe.length > 0 };
  };
})(globalThis);
