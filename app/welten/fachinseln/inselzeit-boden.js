/* app/welten/fachinseln/inselzeit-boden.js: der Boden der Inselzeit (E-2110-01): Höhe, begehbare Fläche, Hindernisse und Steg einer Fachinsel.
     W3.InselzeitBoden(THREE).fuer(w), w aus W3.SzeneInsel → { hoehe(x, z), begehbar(x, z, von), schiebe(von, nach, r) → Vector3, steg, start }
     steg: { land: [x, z], ende: [x, z], dir: [x, z], laenge, kante, h0, hEnde } (land liegt auf dem Plateau, ende über dem Wasser).
   Begehbar ist das Plateau innerhalb der Küste (Kontur wie gelaende.js, mit Rand), ohne steilen Hang hinauf oder hinab, dazu der Steg, den man nur
   an seinem Landende verlässt. Hindernisse sind Kreise:
   Stämme, Büsche und Steine (Instanzen in w.land.root), die sichtbaren Bauten der Areale samt Leben und die Schilder. Der Steg liegt an einer
   flachen Küste auf der Seite der Totale. Welt = Profil.map(lokal) × 3,4, die Höhe ist nicht skaliert. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const S = 3.4, RAND = 0.045, STEIL = 0.95, BLICK = 0.8, BREIT = 0.85;   // Massstab, Abstand zur Küste (Anteil), Steigung, Seite der Totale, halbe Stegbreite
  const DREH = [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4];          // Drehungen eines Schritts beim Gleiten (rad)
  const kontur = a => 1 + 0.039 * Math.sin(3 * a + 0.8) + 0.026 * Math.sin(5 * a - 1.2) + 0.012 * Math.cos(11 * a + 0.3) + 0.006 * Math.sin(23 * a + 1.4);

  W3.InselzeitBoden = function (THREE) {
    function fuer(w) {
      const p = w.profil, welt = (x, z) => { const m = p.map(x, z); return [m[0] * S, m[1] * S]; };
      const kuestenPunkt = (a, f) => { const r = kontur(a) * f; return welt(15.1 * Math.cos(a) * r, 10.85 * Math.sin(a) * r); };
      /** Lage relativ zur Küste: 1 heisst Küstenlinie, kleiner liegt innen */
      const anteil = (x, z) => { const [a, b] = p.unmap(x / S, z / S), u = a / 15.1, v = b / 10.85; return Math.hypot(u, v) / kontur(Math.atan2(v, u)); };

      // ---- Steg: flache Küste, weg von den Arealen, möglichst auf der Seite, die die Totale zeigt
      const orte = Object.values(w.orte), blick = [Math.sin(BLICK), Math.cos(BLICK)];
      let steg = null;
      for (let i = 0; i < 180; i++) {
        const a = i / 180 * Math.PI * 2, land = kuestenPunkt(a, 1 - RAND - 0.01), ende = kuestenPunkt(a, 1.12), h0 = p.heightWorld(land[0], land[1]);
        if (h0 > 2.4 || orte.some(o => Math.hypot(o[0] - land[0], o[2] - land[1]) < 10)) continue;
        const dx = ende[0] - land[0], dz = ende[1] - land[1], laenge = Math.hypot(dx, dz), dir = [dx / laenge, dz / laenge];
        const wert = (1 - dir[0] * blick[0] - dir[1] * blick[1]) * 2 + (h0 - 1.6);
        if (!steg || wert < steg.wert) {
          const k = kuestenPunkt(a, 1.0);
          steg = { wert, land, ende, dir, laenge, h0: h0 + 0.05, hEnde: 0.35, kante: Math.hypot(k[0] - land[0], k[1] - land[1]) };
        }
      }
      /** Lage auf dem Steg: Strecke ab dem Landpunkt, oder null daneben */
      function aufSteg(x, z) {
        if (!steg) return null;
        const rx = x - steg.land[0], rz = z - steg.land[1], t = rx * steg.dir[0] + rz * steg.dir[1], s = -rx * steg.dir[1] + rz * steg.dir[0];
        return t >= -1.2 && t <= steg.laenge && Math.abs(s) <= BREIT ? t : null;
      }
      const deck = t => (t <= steg.kante ? steg.h0 : steg.h0 + (steg.hEnde - steg.h0) * (t - steg.kante) / (steg.laenge - steg.kante));
      const hoehe = (x, z) => { const t = aufSteg(x, z); return t === null ? p.heightWorld(x, z) : Math.max(deck(t), t < 0 ? p.heightWorld(x, z) : -9); };

      // ---- Hindernisse als Kreise
      const kreise = [], m4 = new THREE.Matrix4(), m5 = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sk = new THREE.Vector3();
      const sichtbar = o => { for (let n = o; n && n !== w.land.root; n = n.parent) if (!n.visible) return false; return true; };
      w.land.root.updateMatrixWorld(true);
      w.land.root.traverse(o => {
        if (!o.isInstancedMesh || !sichtbar(o)) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const kugel = o.geometry.boundingSphere;
        if (kugel.center.length() > 3) return;                                   // Felsplatten mit Weltkoordinaten im Netz
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, m4); m5.multiplyMatrices(o.matrixWorld, m4); m5.decompose(pos, q, sk);
          const r = kugel.radius * sk.x;
          if (r < 0.18 || pos.y - p.heightWorld(pos.x, pos.z) > 0.9) continue;   // Gras, Blüten und Baumkronen
          kreise.push({ x: pos.x, z: pos.z, r: Math.min(0.75, Math.max(0.3, r * 0.5)) });
        }
      });
      const box = new THREE.Box3(), teil = new THREE.Box3();
      for (const platz of w.plaetze) {
        const o = w.orte[platz], st = Math.max(0, Math.min(3, w.stufen[platz] || 0)), s = w.schilder.get(platz);
        box.makeEmpty();
        for (const m of [(w.modelle.get(platz) || [])[st], (w.viertel.get(platz) || [])[st]]) if (m) box.union(teil.setFromObject(m));
        const r = box.isEmpty() ? 3 : Math.min(4.6, Math.max(2.2, 0.42 * Math.max(box.max.x - box.min.x, box.max.z - box.min.z)));
        kreise.push({ x: o[0], z: o[2], r });
        if (s && s.visible) kreise.push({ x: s.position.x, z: s.position.z, r: 0.55 });
      }

      /** Begehbar, mit «von» auch erreichbar: Vom Steg geht es nur an seinem Landende auf die Insel. Was zu steil zum Hinaufgehen ist, ist auch
          zu steil zum Hinuntergehen, sonst sässe man unter einer Klippe fest. */
      function begehbar(x, z, von) {
        if (aufSteg(x, z) !== null) return true;
        if (anteil(x, z) > 1 - RAND) return false;
        if (!von) return true;
        const t = aufSteg(von.x, von.z);
        if (t !== null) return t <= 0;
        const d = Math.hypot(x - von.x, z - von.z);
        return d < 1e-4 || Math.abs(p.heightWorld(x, z) - p.heightWorld(von.x, von.z)) / d <= STEIL;
      }
      /** Schritt von «von» nach «nach» mit Radius r: aus Hindernissen hinaus, an Küste, Hängen und Stegrand entlang gleitend. Geht der Schritt nicht,
          dreht er sich in Stufen bis 80 Grad zur Seite und wird dabei kürzer (so folgt May auch dem schräg liegenden Steg). Steht «von» selbst
          ausserhalb der Laufzone, ist jeder Schritt nach innen erlaubt. */
      function schiebe(von, nach, r = 0.3) {
        const z = nach.clone();
        for (let n = 0; n < 2; n++) for (const c of kreise) {
          const dx = z.x - c.x, dz = z.z - c.z, d = Math.hypot(dx, dz), min = c.r + r;
          if (d < min && d > 1e-6) { z.x = c.x + dx / d * min; z.z = c.z + dz / d * min; }
        }
        if (begehbar(z.x, z.z, von) || (!begehbar(von.x, von.z) && anteil(z.x, z.z) < anteil(von.x, von.z))) return z;
        const dx = z.x - von.x, dz = z.z - von.z;
        for (const w of DREH) {
          const c = Math.cos(w), s = Math.sin(w), x = von.x + (dx * c - dz * s) * c, zz = von.z + (dx * s + dz * c) * c;
          if (begehbar(x, zz, von)) return z.set(x, z.y, zz);
        }
        return von.clone();
      }

      const innen = steg ? [steg.land[0] - steg.dir[0] * 3.5, steg.land[1] - steg.dir[1] * 3.5] : [orte[0][0] + 5, orte[0][2] + 5];
      return { hoehe, begehbar, schiebe, aufSteg, steg, kreise, start: { x: innen[0], z: innen[1], blick: steg ? Math.atan2(-steg.dir[0], -steg.dir[1]) : 0 } };
    }
    return { fuer };
  };
})(globalThis);
