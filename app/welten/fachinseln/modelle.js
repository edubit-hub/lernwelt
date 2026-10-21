/* Vorgefertigte Modelle aus Meshy (tools/blender/meshy_netz.py → app/welten/fachinseln/modell-<id>.js, Daten in W3.Modelle).
 * Feste Modelle teilen Geometrie und Material. Figuren erhalten je Instanz ein eigenes Skelett und einen eigenen AnimationMixer;
 * geteilt werden nur Geometrie, Material und die unveränderlichen Clips. Koordinaten: y oben, Vorderseite +z, Unterseite auf y = 0. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  // Base64 mit Alphabet ohne Vokale und ohne Füllzeichen (tools/blender/meshy_netz.py): In den Daten entstehen keine Wörter
  const ZEICHEN = 'BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz0123456789+/-_.!*~()$#', WERT = new Uint8Array(128);
  for (let i = 0; i < 64; i++) WERT[ZEICHEN.charCodeAt(i)] = i;
  W3.ModellBytes = function (s) {
    const aus = new Uint8Array(s.length * 3 >> 2);
    for (let i = 0, o = 0; i < s.length; i += 4) {
      const n = WERT[s.charCodeAt(i)] << 18 | WERT[s.charCodeAt(i + 1)] << 12 | (i + 2 < s.length ? WERT[s.charCodeAt(i + 2)] << 6 : 0) | (i + 3 < s.length ? WERT[s.charCodeAt(i + 3)] : 0);
      aus[o++] = n >> 16; if (o < aus.length) aus[o++] = n >> 8 & 255; if (o < aus.length) aus[o++] = n & 255;
    }
    return aus;
  };
  W3.ModellFabrik = function (THREE) {
    const daten = () => W3.Modelle || {};
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
    const geometrien = new Map(), clips = new Map();
    const bytes = W3.ModellBytes;

    function geometrie(id) {
      if (geometrien.has(id)) return geometrien.get(id);
      const m = daten()[id], d = m.netz, haut = !!m.knochen;
      const p = new Int16Array(bytes(d.p).buffer), ix = new Uint16Array(bytes(d.i).buffer), f = bytes(d.f), k = d.s / 32767, c = new THREE.Color();
      const pos = new Float32Array(ix.length * 3), col = new Float32Array(ix.length * 3), j = haut && bytes(d.j), w = haut && bytes(d.w);
      const gelenke = haut && new Uint16Array(ix.length * 4), gewichte = haut && new Float32Array(ix.length * 4);
      for (let n = 0; n < ix.length; n++) {   // flache Dreiecke: Farbe je Dreieck, Knochen und Gewichte je Ecke
        const v = ix[n], t = (n / 3 | 0) * 3;
        pos[n * 3] = p[v * 3] * k; pos[n * 3 + 1] = p[v * 3 + 1] * k; pos[n * 3 + 2] = p[v * 3 + 2] * k;
        c.setRGB(f[t] / 255, f[t + 1] / 255, f[t + 2] / 255, THREE.SRGBColorSpace).toArray(col, n * 3);
        if (haut) for (let q = 0; q < 4; q++) { gelenke[n * 4 + q] = j[v * 4 + q]; gewichte[n * 4 + q] = w[v * 4 + q] / 255; }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      if (haut) { geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(gelenke, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(gewichte, 4)); }
      geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
      geometrien.set(id, geo); return geo;
    }

    function clipsVon(id) {
      if (clips.has(id)) return clips.get(id);
      const m = daten()[id], n = m.knochen.length, aus = {};
      for (const [name, c] of Object.entries(m.clips || {})) {
        const q = new Int16Array(bytes(c.q).buffer), lage = new Int16Array(bytes(c.lage.d).buffer), bewegt = c.lage.k, ls = c.lage.s / 32767;
        const zeiten = Float32Array.from({ length: c.bilder }, (_, i) => i * c.dauer / (c.bilder - 1)), spuren = [];
        m.knochen.forEach((kn, b) => {
          const werte = new Float32Array(c.bilder * 4);
          for (let i = 0; i < c.bilder; i++) for (let a = 0; a < 4; a++) werte[i * 4 + a] = q[(i * n + b) * 4 + a] / 32767;
          spuren.push(new THREE.QuaternionKeyframeTrack(kn.n + '.quaternion', zeiten, werte));
          const r = bewegt.indexOf(b);
          if (r >= 0) {
            const lw = new Float32Array(c.bilder * 3);
            for (let i = 0; i < c.bilder; i++) for (let a = 0; a < 3; a++) lw[i * 3 + a] = lage[(i * bewegt.length + r) * 3 + a] * ls;
            spuren.push(new THREE.VectorKeyframeTrack(kn.n + '.position', zeiten, lw));
          }
        });
        aus[name] = new THREE.AnimationClip(name, c.dauer, spuren);
      }
      clips.set(id, aus); return aus;
    }

    function hat(id) { return !!daten()[id]; }

    // Kopie der Geometrie, in der alle Dreiecke mit test(r, g, b) (lineare Farbwerte 0..1) die Farbe farbe erhalten
    function umgefaerbt(id, test, farbe) {
      const schluessel = id + '|' + farbe; if (geometrien.has(schluessel)) return geometrien.get(schluessel);
      const geo = geometrie(id).clone(), col = geo.attributes.color.array, neu = new THREE.Color(farbe);
      for (let n = 0; n < col.length; n += 3) if (test(col[n], col[n + 1], col[n + 2])) neu.toArray(col, n);
      geometrien.set(schluessel, geo); return geo;
    }

    // Festes Modell, auf Wunsch so skaliert, dass es in eine Grundfläche (breite × tiefe) oder auf eine Höhe passt.
    // ersetze: [test, farbe] färbt passende Dreiecke um (siehe umgefaerbt).
    function statisch(id, { name = id, breite, tiefe, hoehe, ersetze } = {}) {
      const geo = ersetze ? umgefaerbt(id, ...ersetze) : geometrie(id), box = geo.boundingBox, groesse = box.getSize(new THREE.Vector3()), g = new THREE.Group();
      const mesh = new THREE.Mesh(geo, material); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh);
      const s = [breite && breite / groesse.x, tiefe && tiefe / groesse.z, hoehe && hoehe / groesse.y].filter(Boolean);
      if (s.length) g.scale.setScalar(Math.min(...s));
      g.name = name; g.userData.modell = id; return g;
    }

    // Figur mit eigenem Skelett. hoehe skaliert die Figur auf diese Höhe, massstab je Meter (sonst Meter wie geliefert).
    // Die Steuerung liegt in root.figur und bewusst nicht in userData: clone() kopiert userData als JSON, Knochen sind zyklisch.
    function figur(id, { name = id, hoehe, massstab } = {}) {
      const m = daten()[id], root = new THREE.Group(), wurzel = new THREE.Group();
      root.name = name; root.userData.modell = id; root.userData.figur = true;
      wurzel.position.fromArray(m.wurzel.p); wurzel.quaternion.fromArray(m.wurzel.q); wurzel.scale.setScalar(m.wurzel.s); root.add(wurzel);
      const bones = m.knochen.map(k => { const b = new THREE.Bone(); b.name = k.n; b.position.fromArray(k.p); b.quaternion.fromArray(k.q); return b; });
      m.knochen.forEach((k, i) => (k.e < 0 ? wurzel : bones[k.e]).add(bones[i]));
      const mesh = new THREE.SkinnedMesh(geometrie(id), material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; wurzel.add(mesh);
      root.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
      if (hoehe && m.masse) root.scale.setScalar(hoehe / m.masse[1]); else if (massstab) root.scale.setScalar(massstab);
      const mixer = new THREE.AnimationMixer(wurzel), aktionen = {}, ruhe = bones.map(b => [b, b.position.clone(), b.quaternion.clone()]);
      for (const [n, c] of Object.entries(clipsVon(id))) aktionen[n] = mixer.clipAction(c);
      let aktuell = null;
      // Clip abspielen: schleife für Gehen und Rennen, sonst einmal und auf dem letzten Bild halten; Überblendung in Sekunden
      function spiele(clip, { schleife = true, ueberblend = .25, tempo = 1 } = {}) {
        const a = aktionen[clip]; if (!a || a === aktuell) return a || null;
        a.reset(); a.setLoop(schleife ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !schleife; a.timeScale = tempo; a.play();
        if (aktuell) aktuell.crossFadeTo(a, ueberblend, false); aktuell = a; return a;
      }
      function stehen() { if (aktuell) { aktuell.stop(); aktuell = null; } ruhe.forEach(([b, p, q]) => { b.position.copy(p); b.quaternion.copy(q); }); }
      function update(dt) { if (aktuell) mixer.update(dt); }
      // Ruhiger Alltag für Bewohner: Ruheclip in Schleife, in Abständen eine Geste und zurück. Gibt takt(t) mit t in Sekunden zurück.
      function alltag({ ruhe = 'Idle', geste = 'Agree_Gesture', abstand = 16, phase = 0, tempo = .8 } = {}) {
        let zuletzt = null, naechste = 0;
        mixer.addEventListener('finished', e => { if (e.action !== aktionen[ruhe]) spiele(ruhe, { tempo, ueberblend: .6 }); });
        return function takt(t) {
          if (zuletzt === null) {
            spiele(ruhe, { tempo, ueberblend: 0 });
            if (aktionen[ruhe]) aktionen[ruhe].time = phase % aktionen[ruhe].getClip().duration;
            naechste = t + 4 + phase * 3 % abstand;
          }
          const dt = zuletzt === null ? 0 : Math.max(0, Math.min(.1, t - zuletzt)); zuletzt = t;
          if (t >= naechste && aktionen[geste] && aktuell === aktionen[ruhe]) { spiele(geste, { schleife: false, ueberblend: .5 }); naechste = t + abstand + phase * 7 % 5; }
          mixer.update(dt);
        };
      }
      root.figur = { spiele, stehen, update, alltag, aktionen, bones, mixer, clips: Object.keys(aktionen), aktuell: () => aktuell && aktuell.getClip().name };
      return root;
    }

    // Bewohner der Fachareale: acht Figuren in fester Reihenfolge, 0,8 Einheiten je Meter wie die Bauten.
    // Gibt { root, takt } zurück oder null, wenn keine Bewohnerdaten geladen sind.
    const BEWOHNER = ['bewohner-frau-gross', 'bewohner-mann-klein', 'bewohner-maedchen', 'bewohner-mann-aelter', 'bewohner-frau-klein', 'bewohner-junge', 'bewohner-frau-aelter', 'bewohner-mann-gross'];
    function bewohner(n, { phase = 0 } = {}) {
      const ids = BEWOHNER.filter(hat); if (!ids.length) return null;
      const root = figur(ids[(n % ids.length + ids.length) % ids.length], { name: 'Bewohner', massstab: .8 });
      return { root, takt: root.figur.alltag({ phase }) };
    }

    // Ersetzt in einer Kopie (clone) jede Figur durch eine neue mit eigenem Skelett: Ein geklontes SkinnedMesh würde die Knochen des Originals verwenden.
    function figurenErsetzen(kopie) {
      const alte = []; kopie.traverse(o => { if (o.userData.figur && o.userData.modell && hat(o.userData.modell)) alte.push(o); });
      for (const alt of alte) {
        const neu = figur(alt.userData.modell); neu.position.copy(alt.position); neu.quaternion.copy(alt.quaternion); neu.scale.copy(alt.scale);
        const ruhe = neu.figur.aktionen.Idle; if (ruhe) { ruhe.play(); neu.figur.mixer.update(0); }
        alt.parent.add(neu); alt.removeFromParent();
      }
      return kopie;
    }

    return { hat, statisch, figur, bewohner, figurenErsetzen, geometrie, material };
  };
})(globalThis);
