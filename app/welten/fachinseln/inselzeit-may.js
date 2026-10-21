/* app/welten/fachinseln/inselzeit-may.js: May in der Inselzeit (E-2110-01): folgt dem Jungen, kommt auf den Pfiff, lässt sich streicheln und trägt ihn.
     W3.InselzeitMay(THREE, mayFabrik) → { root, setze(x, z, blick), update(dt, boden, junge), ruf(), modus(m), ziel(x, z), sattel(), blick(), quer(),
       neben(abstand, boden) → Vector3, steht(), nahe(punkt) }
     Modi: 'folgen' (neben dem Jungen, leicht dahinter, im Schritt mit ihm: so verdeckt sie ihn vor der Kamera nicht), 'kommen' (auf den Pfiff),
       'streicheln' (steht still, Augen zu), 'reiten' (läuft zum Ziel), 'fest' (Boot, Ende).
   May hat hier den Massstab 1 (in der Totale 0,78): so trägt sie den Jungen wie ein Pony (Rücken 0,9 hoch, gemessen 21.10.2026). Ihr Gehclip
   legt 0,707 Einheiten je Zyklus zurück; die Zeit des Clips läuft mit dem Weg mit, damit die Pfoten nicht gleiten. Bleibt sie mehr als 6 Einheiten
   zurück (gerufen 4 s, sonst 6 s lang), springt sie neben den Jungen. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const SCHRITT = 0.7074, SATTEL = [0, 0.9, -0.05], RADIUS = 0.55;
  const TEMPO = { folgen: 1.0, eilen: 2.2, kommen: 2.6, reiten: 2.6 };    // Einheiten je Sekunde

  W3.InselzeitMay = function (THREE, mayFabrik) {
    const root = new THREE.Group(); root.name = 'May in der Inselzeit';
    const modell = mayFabrik.create('walk'); modell.scale.setScalar(1); root.add(modell);
    root.traverse(n => { n.userData.may = true; });
    const S = W3.MaySkin, tempoClip = S && S.gehen && S.gehen.schritt > 0 ? Math.min(1.5, 0.4 / S.gehen.schritt) : 1;
    const lid = modell.getObjectByName('may-lid'), v = new THREE.Vector3(), w = new THREE.Vector3();
    const z = { modus: 'folgen', ziel: null, phase: 0, uhr: 0, tempo: 0, blick: 0, fern: 0, jx: null, jz: null, jtempo: 0 };

    function setze(x, zz, blick = 0) { root.position.set(x, 0, zz); z.blick = blick; root.rotation.y = blick; z.ziel = null; z.tempo = 0; }
    /** Läuft auf das Ziel zu, dreht sich mit höchstens 3,2 rad/s. Gibt den Rest der Strecke zurück. */
    function laufe(dt, boden, ziel, soll) {
      v.set(ziel.x - root.position.x, 0, ziel.z - root.position.z);
      const rest = v.length();
      if (rest < 0.05) { z.tempo = 0; return 0; }
      const wunsch = Math.atan2(v.x, v.z);
      let d = wunsch - z.blick; d = Math.atan2(Math.sin(d), Math.cos(d));
      z.blick += Math.max(-3.2 * dt, Math.min(3.2 * dt, d)); root.rotation.y = z.blick;
      z.tempo += (soll * (Math.abs(d) > 1.2 ? 0.35 : 1) - z.tempo) * Math.min(1, dt * 4);   // in engen Kurven langsamer
      const schritt = Math.min(rest, z.tempo * dt);
      w.set(root.position.x + Math.sin(z.blick) * schritt, 0, root.position.z + Math.cos(z.blick) * schritt);
      const neu = boden.schiebe(root.position, w, RADIUS), weg = Math.hypot(neu.x - root.position.x, neu.z - root.position.z);
      root.position.x = neu.x; root.position.z = neu.z; z.phase += weg / SCHRITT;
      z.klemmt = weg < schritt * 0.2 ? (z.klemmt || 0) + dt : 0;                // steckt an einem Hindernis fest: nach 0,6 s gilt das Ziel als erreicht
      if (z.klemmt > 0.6) { z.klemmt = 0; z.tempo = 0; return 0; }
      return rest - weg;
    }

    function update(dt, boden, junge) {
      z.uhr += dt;
      const j = junge.position, nah = Math.hypot(j.x - root.position.x, j.z - root.position.z);
      // Tempo des Jungen, geglättet (ein Sprung beim Ein- und Aussteigen zählt nicht)
      if (z.jx !== null && dt > 0) { const s = Math.hypot(j.x - z.jx, j.z - z.jz) / dt; z.jtempo += ((s < 5 ? s : 0) - z.jtempo) * Math.min(1, dt * 6); }
      z.jx = j.x; z.jz = j.z;
      if (z.modus === 'folgen' || z.modus === 'kommen') {
        // Platz neben dem Jungen, leicht dahinter; auf den Pfiff kommt sie bis vor ihn
        const b = junge.rotation.y, kommt = z.modus === 'kommen', seite = kommt ? 1.1 : 1.25, hinten = kommt ? -1.2 : 0.35, mit = !kommt && z.jtempo > 0.3;
        const ziel = { x: j.x - Math.sin(b) * hinten + Math.cos(b) * seite, z: j.z - Math.cos(b) * hinten - Math.sin(b) * seite };
        const weit = Math.hypot(ziel.x - root.position.x, ziel.z - root.position.z);
        const geht = kommt ? weit > 0.3 : mit || weit > (z.tempo > 0.1 ? 0.4 : 2.4);
        // Geht er, hält sie Schritt und holt auf, was sie zurückliegt: sie zielt einen Schritt vor ihren Platz und bleibt so neben ihm in Gang.
        // Steht er, kommt sie gemächlich nach
        const soll = kommt ? TEMPO.kommen : mit ? Math.min(TEMPO.kommen, z.jtempo + weit * 0.8) : weit > 5 ? TEMPO.eilen : TEMPO.folgen;
        if (geht) laufe(dt, boden, mit ? { x: ziel.x + Math.sin(b), z: ziel.z + Math.cos(b) } : ziel, soll);
        else { z.tempo = 0; if (z.modus === 'kommen') z.modus = 'folgen'; dreheZu(dt, j); }
        z.fern = nah > 6 ? z.fern + dt : 0;                                    // bleibt sie zurück oder steckt fest, springt sie neben den Jungen
        if (z.fern > (z.modus === 'kommen' ? 4 : 6)) springe(boden, junge);
      } else if (z.modus === 'reiten' && z.ziel) {
        if (laufe(dt, boden, z.ziel, TEMPO.reiten) <= 0.05) { z.ziel = null; z.tempo = 0; }
      } else if (z.modus === 'streicheln' || z.modus === 'fest') z.tempo = 0;
      if (z.modus !== 'fest') root.position.y = boden.hoehe(root.position.x, root.position.z);
      const geht = z.tempo > 0.05;
      // Clipzeit so, dass (t · tempoClip) mod Dauer der zurückgelegten Zyklen entspricht (may-modell.js)
      mayFabrik.update(modell, geht ? z.phase / tempoClip : z.uhr, geht ? true : 'play');
      if (z.modus === 'reiten' && geht) root.position.y += Math.abs(Math.sin(z.phase * Math.PI * 2)) * 0.035;
      if (lid && z.modus === 'streicheln') lid.visible = true;                 // zufrieden mit geschlossenen Augen
      return nah;
    }
    /** Neben den Jungen: hinter ihn, sonst schräg dahinter oder seitlich, wo der Boden begehbar und von ihm aus erreichbar ist */
    function springe(boden, junge) {
      const j = junge.position, b = junge.rotation.y;
      z.fern = 0;
      for (const w of [0, 0.9, -0.9, 1.8, -1.8]) {
        const x = j.x - Math.sin(b + w) * 1.8, zz = j.z - Math.cos(b + w) * 1.8;
        if (boden.begehbar(x, zz, j)) { setze(x, zz, b); z.modus = 'folgen'; return; }
      }
    }
    function dreheZu(dt, p) {
      let d = Math.atan2(p.x - root.position.x, p.z - root.position.z) - z.blick; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) > 0.6) { z.blick += Math.max(-1.6 * dt, Math.min(1.6 * dt, d)); root.rotation.y = z.blick; }
    }

    return {
      root, setze, update,
      ruf() { if (z.modus === 'folgen') z.modus = 'kommen'; },
      modus(m) { if (m) { z.modus = m; if (m !== 'reiten') z.ziel = null; } return z.modus; },
      ziel(x, zz) { z.ziel = { x, z: zz }; },
      /** Sattelpunkt in Weltkoordinaten (Mitte des Rückens) */
      sattel() { return v.fromArray(SATTEL).applyAxisAngle(new THREE.Vector3(0, 1, 0), z.blick).add(root.position).clone(); },
      blick: () => z.blick,
      /** Einheitsvektor [x, z] quer zu ihrem Blick (ihre linke Seite) */
      quer: () => [Math.cos(z.blick), -Math.sin(z.blick)],
      /** Ein begehbarer Platz neben ihr (von ihr aus erreichbar, auf dem Steg also auf dem Steg): links, rechts oder hinter ihr, sonst links auch ohne Boden */
      neben(abstand, boden) {
        const m = root.position, l = [Math.cos(z.blick), -Math.sin(z.blick)], s = Math.sin(z.blick), c = Math.cos(z.blick);
        for (const [x, zz] of [[m.x + l[0] * abstand, m.z + l[1] * abstand], [m.x - l[0] * abstand, m.z - l[1] * abstand], [m.x - s * 1.1, m.z - c * 1.1]])
          if (boden.begehbar(x, zz, m)) return new THREE.Vector3(x, boden.hoehe(x, zz), zz);
        return new THREE.Vector3(m.x + l[0] * abstand, m.y, m.z + l[1] * abstand);
      },
      steht: () => z.tempo <= 0.05,
      nahe: p => Math.hypot(p.x - root.position.x, p.z - root.position.z)
    };
  };
})(globalThis);
