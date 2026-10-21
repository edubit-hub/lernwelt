/* app/welten/fachinseln/inselzeit-gruss.js: Grüsse in der Inselzeit (E-2110-01): Bewohner und Vater winken, wenn der Junge nahe kommt.
     W3.InselzeitGruss(THREE) → { setze(w), update(dt, uhr, junge (Object3D), vater (Figur oder null), still), zurueck() }
   setze(w) sammelt die sichtbaren Bewohner einer Insel (Figuren mit userData.figur und root.figur in den Arealen, modelle.bewohner). Ein Bewohner
   winkt höchstens alle 25 s und dreht sich dazu weich zum Jungen, der Vater winkt alle 30 s (nicht während der Fahrt: still). zurueck() stellt
   die Drehungen der Bewohner wieder her, damit die Totale sie wie vorher zeigt. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const NAH = 4.5, NAH_VATER = 6, PAUSE = 25, PAUSE_VATER = 30;

  W3.InselzeitGruss = function (THREE) {
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    const z = { bewohner: [], gewinkt: new Map(), drehung: new Map(), naechste: 0, vater: -99 };

    function setze(w) {
      z.bewohner = [];
      for (const liste of [...w.modelle.values(), ...w.viertel.values()]) liste.forEach(m => { if (m.visible) m.traverse(o => { if (o.userData.figur && o.figur) z.bewohner.push(o); }); });
    }
    function update(dt, uhr, junge, vater, still) {
      for (const [o, d] of z.drehung) o.quaternion.rotateTowards(d.ziel, dt * 3);
      if (uhr < z.naechste) return;
      z.naechste = uhr + 0.5;
      junge.getWorldPosition(p);
      for (const o of z.bewohner) {
        o.getWorldPosition(q);
        if ((z.gewinkt.has(o) && uhr - z.gewinkt.get(o) < PAUSE) || Math.hypot(q.x - p.x, q.z - p.z) > NAH || !o.figur.aktionen.Wave_One_Hand) continue;
        z.gewinkt.set(o, uhr);
        const d = z.drehung.get(o) || { alt: o.quaternion.clone() }, vorher = o.quaternion.clone();
        o.lookAt(p.x, q.y, p.z); d.ziel = o.quaternion.clone(); o.quaternion.copy(vorher); z.drehung.set(o, d);
        o.figur.spiele('Wave_One_Hand', { schleife: false, ueberblend: 0.3 });
      }
      if (vater && !still && uhr - z.vater > PAUSE_VATER && Math.hypot(vater.root.position.x - p.x, vater.root.position.z - p.z) < NAH_VATER) { z.vater = uhr; vater.winke(); }
    }
    function zurueck() { for (const [o, d] of z.drehung) o.quaternion.copy(d.alt); z.drehung.clear(); }
    return { setze, update, zurueck };
  };
})(globalThis);
