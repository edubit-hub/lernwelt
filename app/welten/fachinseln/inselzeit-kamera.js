/* app/welten/fachinseln/inselzeit-kamera.js: die Kamera der Inselzeit (E-2110-01): perspektivisch, folgt dem Jungen von schräg hinten.
     W3.InselzeitKamera(THREE) → { kamera, groesse(b, h), setze(ziel, blick), update(dt, ziel, blick, { art, boden }), drehe(dx) }
     art: 'gehen' (nah), 'reiten' (etwas weiter), 'boot' (weit und hoch), 'ende' (fährt langsam zurück).
   Die Kamera dreht sich weich hinter die Blickrichtung, solange sich der Junge bewegt. Ziehen dreht sie um ihn; der Versatz klingt beim
   Gehen wieder ab. Sie bleibt über dem Gelände und sieht alle Schichten der Areale (SzeneInsel.SCHICHT 1 bis 7). Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const LAGE = { gehen: [5.2, 2.3], reiten: [6.4, 2.9], boot: [15, 7.5], ende: [8.5, 4.2] };   // Abstand, Höhe über dem Ziel

  W3.InselzeitKamera = function (THREE) {
    const kamera = new THREE.PerspectiveCamera(50, 1, 0.1, 520);
    for (let s = 0; s <= 7; s++) kamera.layers.enable(s);
    const z = { yaw: 0, versatz: 0, abstand: LAGE.gehen[0], hoehe: LAGE.gehen[1], blick: new THREE.Vector3(), bereit: false };
    const soll = new THREE.Vector3(), hin = new THREE.Vector3();

    function groesse(b, h) { kamera.aspect = Math.max(0.2, b / Math.max(1, h)); kamera.updateProjectionMatrix(); }
    function stelle(ziel, faktor, boden) {
      const a = z.yaw + z.versatz;
      soll.set(ziel.x - Math.sin(a) * z.abstand, ziel.y + z.hoehe, ziel.z - Math.cos(a) * z.abstand);
      if (boden) soll.y = Math.max(soll.y, boden.hoehe(soll.x, soll.z) + 0.8);
      kamera.position.lerp(soll, faktor);
      hin.set(ziel.x, ziel.y + 0.9, ziel.z); z.blick.lerp(hin, faktor);
      kamera.lookAt(z.blick);
    }
    return {
      kamera, groesse,
      setze(ziel, blick) { z.yaw = blick; z.versatz = 0; z.blick.set(ziel.x, ziel.y + 0.9, ziel.z); stelle(ziel, 1); z.bereit = true; },
      /** ziel: Position des Jungen, blick: seine Richtung (rad). bewegt: dreht hinter ihn. */
      update(dt, ziel, blick, { art = 'gehen', boden = null, bewegt = false } = {}) {
        const [ab, ho] = LAGE[art] || LAGE.gehen, f = 1 - Math.exp(-dt * (art === 'ende' ? 0.6 : 3.2));
        z.abstand += (ab - z.abstand) * f; z.hoehe += (ho - z.hoehe) * f;
        if (bewegt || art === 'boot') {
          let d = blick - z.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
          z.yaw += d * (1 - Math.exp(-dt * 1.6));
          z.versatz *= Math.exp(-dt * 0.7);
        }
        stelle(ziel, z.bereit ? 1 - Math.exp(-dt * 5) : 1, boden); z.bereit = true;
      },
      /** Ziehen um den Jungen herum: dx in Bildpunkten */
      drehe(dx) { z.versatz -= dx * 0.006; }
    };
  };
})(globalThis);
