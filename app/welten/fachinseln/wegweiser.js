/* app/welten/fachinseln/wegweiser.js: wo der Wegweiser eines Areals steht (Schilder vom 21.10.2026).
     W3.Wegweiser(THREE).plaetze(profil, orte, massstab) → { platz: { x, z, ry } } (Versatz zum Ort in Weltkoordinaten, Drehung um y)
   Der Wegweiser steht vor dem Areal am Rand eines Wegs: 1,3 bis 2,6 Einheiten von der Wegmitte (Weg 1,2 breit), nie auf dem Weg.
   Vor dem Gebäude bleibt ein Streifen frei, damit das Schild das Gebäude aus der Inselkamera (von +z, schräg oben) nicht verdeckt.
   Das Areal selbst reicht bis z 4,2 und ±6,4; dort stehen Gebäude, Stationen und das Baustellen-Set. Die Tafel dreht sich zum Weg,
   höchstens so weit, dass sie von der Kamera aus lesbar bleibt. Findet sich kein Platz am Weg, steht das Schild vorne rechts. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const DREHUNG = 0.7, DEKO = [[-7.9, 5.6], [-6, 4]];   // Bäume am Arealrand (inselnatur.js, districtLandscape)

  W3.Wegweiser = function (THREE) {
    /** Wegpunkte in Weltkoordinaten, wie inselnatur.js: erst im Profil interpolieren, dann abbilden */
    function wege(p, s) {
      const aus = [];
      for (const r of [...p.roads, p.expansionRoad].filter(Boolean)) {
        new THREE.CatmullRomCurve3(r.map(q => new THREE.Vector3(q[0], 0, q[1]))).getPoints(120).forEach(v => { const m = p.map(v.x, v.z); aus.push([m[0] * s, m[1] * s]); });
      }
      return aus;
    }
    function platz(o, nah) {
      let best = null;
      for (let x = -7; x <= 7; x += 0.5) for (let z = 4.6; z <= 9.5; z += 0.5) {
        const gx = o[0] + x, gz = o[2] + z;
        if (Math.hypot(x, z) > 9.3 || DEKO.some(d => Math.hypot(x - d[0], z - d[1]) < 2)) continue;   // nur auf dem ebenen Plateau (Radius rund 10)
        let d = Infinity, n = null;
        for (const q of nah) { const e = Math.hypot(q[0] - gx, q[1] - gz); if (e < d) { d = e; n = q; } }
        if (d < 1.3 || d > 2.6) continue;
        // nahe am Weg, nahe am Areal, nicht direkt vor dem Gebäude (dort verdeckt die Tafel den Eingang)
        const wert = Math.abs(d - 1.5) * 2 + Math.hypot(x, z - 4.6) * 0.3 + (Math.abs(x) < 3 && z < 6 ? 4 : 0);
        if (!best || wert < best.wert) best = { wert, x, z, ry: Math.max(-DREHUNG, Math.min(DREHUNG, Math.atan2(n[0] - gx, n[1] - gz))) };
      }
      return best ? { x: best.x, z: best.z, ry: best.ry } : { x: 4, z: 5, ry: 0 };
    }
    function plaetze(p, orte, s) {
      const alle = wege(p, s), aus = {};
      for (const [key, o] of Object.entries(orte)) {
        if (key === 'neuland') continue;
        aus[key] = platz(o, alle.filter(q => Math.hypot(q[0] - o[0], q[1] - o[2]) < 14));
      }
      return aus;
    }
    return { plaetze };
  };
})(globalThis);
