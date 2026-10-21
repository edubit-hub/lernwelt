/* app/welten/fachinseln/inselzeit-figur.js: Figuren der Inselzeit (E-2110-01) aus Meshy: der Junge (modell-hauptfigur.js) und der Vater (modell-vater.js).
     W3.InselzeitFigur(THREE, modelle) → { junge() → Figur, vater() → Figur }
     Figur: { root, gang(tempo), haltung('stehen' | 'sitzen' | 'rudern' | 'boden' | 'reiten' | 'streicheln'), jetzt(), streichelZiel(punkt, achse) oder (null),
       griffe(links, rechts) (Ruder, Welt), huefte() → Höhe der Hüfte über root, sattel (root unter Mays Sattelpunkt), winke(), update(dt) }
   Gehen und Rennen kommen aus den Clips (walking_2_inplace, Run_02, beim Vater Casual_Walk_inplace), Stehen aus Idle, Sitzen aus dem Clip Sitzen
   (Meshy-Aktion 33, Chair Sit Idle Male), Sitzen am Boden aus Sitzen_Boden (Aktion 363, nur der Junge; Gehen lässt ihn aufstehen). Die Clips laufen schneller als geliefert, damit das Tempo der Inselzeit trägt (gemessen 21.10.2026:
   Gehen 0,59, Rennen 1,08 Einheiten je Sekunde bei Tempo 1). Beim Rudern zeigen beide Arme auf die Griffe der Ruder.
   Reiten kommt aus dem Clip Reiten (Meshy Text-zu-Bewegung, 21.10.2026), fehlt er, ist es wie Streicheln eine Pose: nach dem Clip zeigt jeder genannte Knochen in eine Richtung im Raum der Figur (Blick +z, links +x),
   so passt die Haltung unabhängig von den Achsen des Skeletts. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  // Reiten auf May (Massstab 1): Oberschenkel schräg nach vorn und aussen, Unterschenkel an der Flanke, Hände im Nackenfell
  const REITEN = {
    LeftUpLeg: ['LeftLeg', [0.55, -0.45, 0.70]], LeftLeg: ['LeftFoot', [0.40, -0.88, -0.20]],
    RightUpLeg: ['RightLeg', [-0.55, -0.45, 0.70]], RightLeg: ['RightFoot', [-0.40, -0.88, -0.20]],
    LeftArm: ['LeftForeArm', [0.15, -0.55, 0.82]], LeftForeArm: ['LeftHand', [-0.10, -0.30, 0.95]],
    RightArm: ['RightForeArm', [-0.15, -0.55, 0.82]], RightForeArm: ['RightHand', [0.10, -0.30, 0.95]] };
  const ART = {
    junge: { id: 'hauptfigur', name: 'Junge', hoehe: 1.1, gehen: ['walking_2_inplace', 0.59], rennen: ['Run_02', 1.08] },
    vater: { id: 'vater', name: 'Vater', hoehe: 1.52, gehen: ['Casual_Walk_inplace', 0.45], rennen: null } };

  W3.InselzeitFigur = function (THREE, modelle) {
    const q = { p: new THREE.Quaternion(), w: new THREE.Quaternion(), d: new THREE.Quaternion(), i: new THREE.Quaternion() };
    const v = { a: new THREE.Vector3(), b: new THREE.Vector3(), z: new THREE.Vector3(), r: new THREE.Vector3(), t: new THREE.Vector3() };

    function baue(art) {
      const a = ART[art];
      if (!modelle || !modelle.hat(a.id)) return null;
      const root = modelle.figur(a.id, { name: a.name, hoehe: a.hoehe }), f = root.figur, knochen = new Map(f.bones.map(b => [b.name, b]));
      let haltung = 'stehen', ziel = null, uhr = 0, winkt = false, griff = null;
      f.spiele('Idle', { ueberblend: 0 });
      f.mixer.addEventListener('finished', () => { winkt = false; f.spiele('Idle', { ueberblend: 0.4 }); });

      /** Dreht einen Knochen so, dass er zum Kind hin in die Richtung zeigt (Raum der Figur oder Welt). */
      function richte(name, kind, richtung, inWelt) {
        const b = knochen.get(name), k = knochen.get(kind);
        if (!b || !k) return;
        root.updateMatrixWorld(true);
        b.getWorldPosition(v.a); k.getWorldPosition(v.b); v.b.sub(v.a).normalize();
        if (inWelt) v.z.copy(richtung).normalize(); else { root.getWorldQuaternion(q.w); v.z.fromArray(richtung).normalize().applyQuaternion(q.w); }
        q.d.setFromUnitVectors(v.b, v.z); b.parent.getWorldQuaternion(q.p); q.i.copy(q.p).invert();
        b.quaternion.premultiply(q.p).premultiply(q.d).premultiply(q.i);
      }
      /** Dreht einen Knochen so, dass er zum Kind hin auf einen Punkt in der Welt zeigt. */
      function richteAuf(name, kind, punkt) {
        const b = knochen.get(name);
        if (!b) return;
        root.updateMatrixWorld(true); b.getWorldPosition(v.r);
        richte(name, kind, v.r.subVectors(punkt, v.r), true);
      }

      /** Tempo in Einheiten je Sekunde: 0 steht, bis 1,4 geht, darüber rennt. Wechselt den Clip nur, wenn sich die Gangart ändert. */
      function gang(tempo) {
        if ((winkt || haltung === 'boden') && tempo < 0.05) return;
        if (haltung === 'boden') haltung = 'stehen';
        const rennt = a.rennen && tempo > 1.4, c = tempo < 0.05 ? null : rennt ? a.rennen : a.gehen;
        if (!c) { if (f.aktuell() !== 'Idle') f.spiele('Idle', { ueberblend: 0.25 }); return; }
        winkt = false;
        const aktion = f.spiele(c[0], { ueberblend: 0.2 });
        if (aktion) aktion.timeScale = Math.max(0.6, Math.min(2.4, tempo / c[1] * 0.8));
      }
      function winke() { if (f.aktionen.Wave_One_Hand && haltung === 'stehen') { winkt = true; f.spiele('Wave_One_Hand', { schleife: false, ueberblend: 0.3 }); } }

      function update(dt) {
        uhr += dt;
        f.update(dt);
        if (haltung === 'reiten') {           // mit Clip nur die Beine: Mays Körper ist breiter als ein Pony, die Oberschenkel gehen weiter nach aussen
          if (!f.aktionen.Reiten) richte('Spine01', 'neck', [0, 1, 0.18]);
          for (const [n, [k, r]] of Object.entries(REITEN)) if (!f.aktionen.Reiten || n.endsWith('Leg')) richte(n, k, r);
        }
        else if (haltung === 'streicheln' && ziel) {
          // Die rechte Hand streicht über Mays Rücken: der Zielpunkt pendelt langsam entlang ihrer Längsachse
          v.t.copy(ziel.achse).multiplyScalar(Math.sin(uhr * 2.2) * 0.24).add(ziel.punkt);
          richteAuf('RightArm', 'RightForeArm', v.t); richteAuf('RightForeArm', 'RightHand', v.t);
        } else if (haltung === 'rudern' && griff) {
          richteAuf('LeftArm', 'LeftForeArm', griff[0]); richteAuf('LeftForeArm', 'LeftHand', griff[0]);
          richteAuf('RightArm', 'RightForeArm', griff[1]); richteAuf('RightForeArm', 'RightHand', griff[1]);
        }
      }
      /** Höhe der Hüfte über root im aktuellen Bild des Clips (Raum des Elternobjekts von root) */
      function huefte() {
        f.mixer.update(0); root.updateMatrixWorld(true);
        const h = knochen.get('Hips'); if (!h) return 0;
        h.getWorldPosition(v.a); root.getWorldPosition(v.b); return v.a.y - v.b.y;
      }
      // Sattel: root so tief unter Mays Sattelpunkt, dass die Hüfte 0,1 darüber liegt (Clip Reiten, Meshy Text-zu-Bewegung; ohne ihn die Pose oben)
      let sattel = 0.47;
      if (f.aktionen.Reiten) { f.spiele('Reiten', { ueberblend: 0 }); sattel = huefte() - 0.1; f.mixer.stopAllAction(); f.stehen(); f.spiele('Idle', { ueberblend: 0 }); }
      const sitzt = h => (h === 'sitzen' || h === 'rudern') && f.aktionen.Sitzen;
      return { root, art, figur: f, groesse: a.hoehe, sattel, gang, winke, update, knochen, huefte,
        haltung(h) {
          const war = sitzt(haltung); haltung = h; winkt = false;
          if (sitzt(h) || war) { f.mixer.stopAllAction(); f.stehen(); }    // ohne Überblendung: huefte() misst sonst eine Mischung mit dem Stehen
          if (sitzt(h)) f.spiele('Sitzen', { ueberblend: 0 });
          else if (h === 'boden' && f.aktionen.Sitzen_Boden) f.spiele('Sitzen_Boden', { ueberblend: 0.8 });
          else if (h === 'reiten' && f.aktionen.Reiten) f.spiele('Reiten', { ueberblend: 0.25 });
          else if (h !== 'stehen' || war) f.spiele('Idle', { ueberblend: war ? 0 : 0.2 });
        },
        griffe(l, r) { if (!l) { griff = null; return; } griff = griff || [new THREE.Vector3(), new THREE.Vector3()]; griff[0].copy(l); griff[1].copy(r); },
        /** Punkt auf Mays Rücken und ihre Längsachse (Welt), oder null */
        streichelZiel(punkt, achse) { ziel = punkt ? { punkt: punkt.clone(), achse: achse.clone().normalize() } : null; },
        jetzt: () => haltung };
    }
    return { junge: () => baue('junge'), vater: () => baue('vater') };
  };
})(globalThis);
