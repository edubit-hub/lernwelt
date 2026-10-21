/* app/welten/fachinseln/inselzeit-boot.js: Steg und Boot der Inselzeit (E-2110-01).
     W3.InselzeitBoot(THREE, modelle) → { baue(boden, farbe) → Hafen oder null (ohne Steg) }
     Hafen: { root, steg, boot, ort(name) → Vector3 im Boot, setze(figur, name), griffe(), blick(), vaterPlatz(), update(dt, t), fahrt('ab' | 'an', u),
       dreht(), entsorge() }
   Der Steg führt vom Plateau flach bis zur Küstenwand und dann als Rampe hinab bis knapp über das Wasser (boden.steg). Am Ende liegt das
   Familienboot aus Meshy (modell-familienboot.js, Ruderboot 3,8 m mit zwei Bänken, Bug +z), das Heck am Steg, der Streifen in der Farbe der Insel.
   Es ist gleichmässig grösser skaliert als die Figuren (K), damit May im Bug steht und die Bänke zur Sitzhöhe passen. Vater und Junge sitzen
   einander gegenüber (Clip Sitzen), der Vater rudert mit dem Gesicht zum Bug: Die Ruder sind Grundformen und schwingen nur während der Fahrt,
   seine Hände folgen den Griffen. Der Boden innen liegt über dem Wasser (das Boot wird so weit angehoben). Fehlt das Familienboot, liegt das
   Segelschiff da wie in schiffe.js, die Figuren stehen auf dem Deck. fahrt('ab', u) fährt das Boot mit u von 0 bis 1 aufs Meer hinaus. fahrt('an', u)
   bringt es mit dem Bug voran an den Steg der neuen Insel, danach schwenkt es in sechs Sekunden um seine Mitte zurück (dreht()). Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const WEIT = 16, SCHWENK = 6, TAKT = 2.4;                        // Fahrstrecke vom Steg aufs Meer, Sekunden für das Schwenken, Sekunden je Ruderschlag
  const K = [1.95, 1.95];                                          // Familienboot: Meter → Einheiten waagrecht und senkrecht
  const FAMILIE = { laenge: 3.8, sitz: { vater: [-0.76, 0], junge: [0.53, Math.PI] }, may: 1.25,                       // Bänke [längs, Blick], May im Bug
    ruder: [0.795, 0.405, -0.57], innen: 0.72, aussen: 1.64 };                                                       // Dolle, Ruder innen und aussen
  const SCHIFF = { laenge: 7.5, plaetze: { vater: [0.35, -2.3], junge: [0.3, -1.15], may: [-0.45, 0.55] } };          // [quer, längs], Bug +z
  const glatt = u => u * u * (3 - 2 * u);

  W3.InselzeitBoot = function (THREE, modelle) {
    const holz = new THREE.MeshStandardMaterial({ color: '#8f6c49', roughness: 1, flatShading: true });
    const pfahl = new THREE.MeshStandardMaterial({ color: '#5f4733', roughness: 1, flatShading: true });
    const planke = new THREE.BoxGeometry(1.7, 0.08, 0.28), balken = new THREE.BoxGeometry(0.14, 0.16, 1), stange = new THREE.CylinderGeometry(0.07, 0.08, 1, 6);
    const v = new THREE.Vector3();

    /** Ein Ruder als Gruppe in der Dolle: Schaft entlang +x (aussen), Griff bei −innen, Blatt am Ende */
    function ruder(innen, aussen) {
      const r = new THREE.Group(), schaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, innen + aussen, 6), holz);
      schaft.rotation.z = Math.PI / 2; schaft.position.x = (aussen - innen) / 2;
      const blatt = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.2), pfahl); blatt.position.x = aussen - 0.3;
      for (const m of [schaft, blatt]) { m.castShadow = true; r.add(m); }
      return r;
    }

    function baue(boden, farbe) {
      const s = boden.steg, root = new THREE.Group(); root.name = 'Hafen der Inselzeit';
      if (!s) return null;
      const yaw = Math.atan2(s.dir[0], s.dir[1]), steg = new THREE.Group();
      steg.position.set(s.land[0], 0, s.land[1]); steg.rotation.y = yaw; root.add(steg);
      // Querbretter mit 4 cm Fuge (eine Instanzgruppe) auf zwei Längsbalken, flach bis zur Küstenwand, dann als Rampe
      const hoeheBei = t => (t <= s.kante ? s.h0 : s.h0 + (s.hEnde - s.h0) * (t - s.kante) / (s.laenge - s.kante)), neigung = -Math.atan2(s.hEnde - s.h0, s.laenge - s.kante);
      const bretter = new THREE.InstancedMesh(planke, holz, Math.ceil((s.laenge + 1.2) / 0.32) + 1), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eins = new THREE.Vector3(1, 1, 1);
      let n = 0;
      for (let t = -1.04; t < s.laenge; t += 0.32) m4.compose(new THREE.Vector3(0, hoeheBei(t) - 0.04, t), q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), t > s.kante ? neigung : 0), eins), bretter.setMatrixAt(n++, m4);
      bretter.count = n; bretter.castShadow = true; bretter.receiveShadow = true; steg.add(bretter);
      const traeger = (z0, z1, y0, y1) => { for (const x of [-0.62, 0.62]) {
        const m = new THREE.Mesh(balken, pfahl), l = Math.hypot(z1 - z0, y1 - y0);
        m.scale.z = l; m.position.set(x, (y0 + y1) / 2 - 0.16, (z0 + z1) / 2); m.rotation.x = -Math.atan2(y1 - y0, z1 - z0); m.castShadow = true; steg.add(m);
      } };
      traeger(-1.2, s.kante, s.h0, s.h0); traeger(s.kante, s.laenge, s.h0, s.hEnde);
      for (let z = s.kante + 0.6; z <= s.laenge + 0.01; z += 1.5) for (const x of [-0.72, 0.72]) {
        const y = s.h0 + (s.hEnde - s.h0) * (z - s.kante) / (s.laenge - s.kante), p = new THREE.Mesh(stange, pfahl);
        p.scale.y = y + 0.9; p.position.set(x, (y - 0.9) / 2, z); p.castShadow = true; steg.add(p);
      }

      // Boot: Heck am Stegende, Bug aufs Meer
      const boot = new THREE.Group(); boot.name = 'Boot der Inselzeit'; root.add(boot);
      const tinted = (r, gr, b) => gr > r + 0.08 && b > r + 0.08, ersetze = farbe ? [tinted, farbe] : undefined;
      const familie = !!(modelle && modelle.hat('familienboot')), LAENGE = familie ? FAMILIE.laenge * K[0] : SCHIFF.laenge;
      const rumpf = familie ? modelle.statisch('familienboot', { name: 'Familienboot', ersetze })
        : modelle && modelle.hat('segelschiff') ? modelle.statisch('segelschiff', { name: 'Segelschiff', breite: LAENGE, ersetze }) : null;
      if (rumpf && familie) rumpf.scale.set(K[0], K[1], K[0]);
      else if (rumpf) { rumpf.rotation.y = Math.PI / 2; rumpf.position.y = -0.5; }
      if (rumpf) boot.add(rumpf);
      const liegt = new THREE.Vector3(s.ende[0] + s.dir[0] * (LAENGE / 2 + 0.4), 0, s.ende[1] + s.dir[1] * (LAENGE / 2 + 0.4));
      boot.position.copy(liegt); boot.rotation.y = yaw;
      // Höhe im Boot aus einem Strahl von oben: Familienboot der oberste Treffer (Bank oder Boden innen), Segelschiff der tiefste über −0,1 (Deck)
      const strahl = new THREE.Raycaster(), unten = new THREE.Vector3(0, -1, 0);
      const hoehe = (x, z) => {
        root.updateMatrixWorld(true); strahl.set(boot.localToWorld(v.set(x, 12, z)), unten);
        const t = rumpf ? strahl.intersectObject(rumpf, true) : [];
        if (familie) return t.length ? boot.worldToLocal(t[0].point.clone()).y : 0;
        const deck = t.filter(h => h.point.y > -0.1); return deck.length ? Math.min(...deck.map(h => h.point.y)) : 0.45;
      };
      if (familie) rumpf.position.y = Math.max(0, 0.03 - hoehe(0, 0));
      const lift = familie ? rumpf.position.y : 0, deck = {};
      if (familie) {
        for (const [n, [z, b]] of Object.entries(FAMILIE.sitz)) deck[n] = { p: new THREE.Vector3(0, hoehe(0, z * K[0]), z * K[0]), blick: b };
        deck.may = { p: new THREE.Vector3(0, hoehe(0, FAMILIE.may * K[0]), FAMILIE.may * K[0]), blick: 0 };
      } else for (const [n, [x, z]] of Object.entries(SCHIFF.plaetze)) deck[n] = { p: new THREE.Vector3(x, hoehe(x, z), z), blick: 0 };

      // Ruder: Dollen backbord und steuerbord, backbord gespiegelt
      const [rx, ry, rz] = FAMILIE.ruder, riemen = familie ? [-1, 1].map(seite => {
        const r = ruder(FAMILIE.innen * K[0], FAMILIE.aussen * K[0]); r.rotation.order = 'YZX';
        r.position.set(rx * K[0] * seite, ry * K[1] + lift, rz * K[0]); r.scale.x = seite; r.userData.seite = seite; boot.add(r); return r;
      }) : [];
      let wo = 0, dreh = 0, faehrt = false, schlag = 0, kraft = 0, ruderer = null;   // draussen (0 am Steg, 1 auf dem Meer), Drehung (1 heisst Bug zum Land)
      const richte = () => { boot.rotation.y = yaw + Math.PI * glatt(dreh); };
      const griff = r => r.localToWorld(v.set(-FAMILIE.innen * K[0], 0, 0)).clone();
      /** Ruderschlag: Das Blatt geht im Wasser nach hinten (Griffe nach vorn, der Vater stösst), in der Luft zurück. */
      function rudere(dt) {
        kraft += ((faehrt || dreh > 0 ? 1 : 0) - kraft) * Math.min(1, dt * 2); schlag += dt * kraft * 2 * Math.PI / TAKT;
        const gier = 0.08 + 0.13 * Math.sin(schlag) * kraft, tauch = 0.12 + 0.18 * kraft * Math.max(0, Math.cos(schlag));
        for (const r of riemen) { r.rotation.y = gier * r.userData.seite; r.rotation.z = -tauch * r.userData.seite; }
      }
      return {
        root, steg, boot,
        /** Platz im Boot (Raum des Boots, Bug +z): Sitzfläche der Bank oder Boden */
        ort: n => deck[n].p.clone(),
        /** Setzt eine Figur, die schon Kind des Boots ist, auf ihren Platz: im Familienboot sitzend (der Vater rudert), sonst stehend */
        setze(f, n) {
          if (!f) return;
          const d = deck[n]; f.root.position.copy(d.p); f.root.rotation.set(0, d.blick, 0);
          if (!familie || !f.figur.aktionen.Sitzen) return;
          f.haltung(n === 'vater' ? 'rudern' : 'sitzen');
          f.root.position.y = d.p.y + 0.055 * f.groesse - f.huefte();     // Hüftgelenk etwa 5,5 % der Grösse über der Bank
          if (n === 'vater') { ruderer = f; boot.updateMatrixWorld(true); f.griffe(griff(riemen[0]), griff(riemen[1])); }
        },
        /** Griffe der Ruder (Welt), backbord und steuerbord */
        griffe: () => riemen.map(griff),
        blick: () => yaw + Math.PI * glatt(dreh),
        /** Platz des Vaters am Stegende, neben dem Boot, Blick zum Land */
        vaterPlatz() { const t = s.laenge - 0.7; return { x: s.land[0] + s.dir[0] * t - s.dir[1] * 0.45, z: s.land[1] + s.dir[1] * t + s.dir[0] * 0.45, blick: yaw + Math.PI }; },
        update(dt, t) {
          boot.position.y = Math.sin(t * 1.1) * 0.035;
          boot.rotation.z = Math.sin(t * 0.8) * 0.02; boot.rotation.x = Math.sin(t * 0.63 + 1) * 0.012;
          if (!faehrt && dreh > 0) dreh = Math.max(0, dreh - dt / SCHWENK);
          richte();
          if (!wo) boot.position.x = liegt.x, boot.position.z = liegt.z;
          if (riemen.length) {
            rudere(dt);
            if (ruderer && ruderer.root.parent === boot) { boot.updateMatrixWorld(true); ruderer.griffe(griff(riemen[0]), griff(riemen[1])); }
            else ruderer = null;
          }
        },
        /** Fahrt hinaus ('ab') oder herein ('an'), u von 0 bis 1 */
        fahrt(art, u) {
          const e = glatt(Math.min(1, u));
          faehrt = u < 1; wo = art === 'ab' ? e : 1 - e;
          if (art === 'an') dreh = 1;
          boot.position.x = liegt.x + s.dir[0] * WEIT * wo; boot.position.z = liegt.z + s.dir[1] * WEIT * wo; richte();
        },
        dreht: () => faehrt || dreh > 0,
        entsorge() { root.removeFromParent(); }
      };
    }
    return { baue };
  };
})(globalThis);
