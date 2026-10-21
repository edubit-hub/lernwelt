/* app/welten/fachinseln/inselzeit.js: die Inselzeit (E-2110-01, docs/plaene/inselzeit_konzept_2026-10-21_0.1.md). Nach dem Tagesauftrag geht der
   Junge selbst über die Insel, mit May und dem Vater. Solange sie läuft, führt diese Datei die Szene, szene.js hält die eigene Schleife an.
     W3.Inselzeit.starte(THREE, k) → Regler oder null (ohne Figurdaten)
       k: { scene, renderer, sonne, leinwand, zeit (Uniform des Wassers), modelle, mayFabrik, insel() → w (SzeneInsel), weiter(t) (Leben, Bewohner),
            klang(name), beiWechsel(fach) (die Ansicht merkt die Wahl, danach zeigt die Szene die neue Insel), wenig }
       Regler: { aktion(name, wert) → bool, zustand(), groesse(b, h), teile() (für Prüfungen), stoppe() }
     Aktionen: 'rufen', 'streicheln', 'aufsteigen', 'absteigen', 'fahren' (wert: Fach der Zielinsel), 'ende'.
   Tippen auf die Insel schickt den Jungen dorthin (weit weg rennt er, im Sattel trägt ihn May), Tippen auf May streichelt oder ruft sie,
   Ziehen dreht die Kamera (inselzeit-eingabe.js). Zum Streicheln und Aufsteigen geht er zuerst neben May. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const BILD = 33, NAH = 2.6, SEITE = 0.62;                  // ms je Bild, Nähe für Mays Knöpfe, Abstand beim Streicheln (Sattelhöhe: junge.sattel)
  const DAUER = { ab: 3.2, an: 3.4, blende: 0.6, steigen: 0.55, streicheln: 3.4 };

  function starte(T, k) {
    const w0 = k.insel();
    if (!w0 || !W3.InselzeitFigur || !k.modelle || !k.modelle.hat('hauptfigur')) return null;
    const doc = k.leinwand.ownerDocument, win = doc.defaultView || g, SCHATTEN = k.wenig ? 320 : 160;
    const figuren = W3.InselzeitFigur(T, k.modelle), junge = figuren.junge(), vater = figuren.vater(), gruss = W3.InselzeitGruss(T);
    const may = W3.InselzeitMay(T, k.mayFabrik), kam = W3.InselzeitKamera(T), hafenBau = W3.InselzeitBoot(T, k.modelle), bodenBau = W3.InselzeitBoden(T);
    const j = junge.root, alle = [j, may.root, vater && vater.root].filter(Boolean), v = new T.Vector3(), zeiger = new T.Vector2(), strahl = new T.Raycaster();
    strahl.layers.enableAll();
    const z = { boden: null, hafen: null, flaechen: [], ziel: null, tempo: 0, klemmt: 0, ruhe: 0, modus: 'frei', fahrt: null, steigen: null, plan: [], uhr: 0,
      zuletzt: 0, bild: 0, schatten: 0, tot: false, gegangen: false, ende: false, fehler: null, belichtung: k.renderer.toneMappingExposure };
    const sk = k.sonne.shadow.camera, sonneAlt = { p: k.sonne.position.clone(), t: k.sonne.target.position.clone(), c: [sk.left, sk.right, sk.top, sk.bottom] };
    const spiele = n => { try { if (k.klang) k.klang(n); } catch (e) { /* Ton ist Beiwerk */ } };
    const spaeter = (s, f) => z.plan.push({ bei: z.uhr + s, f });
    const welt = (o, ziel) => o.getWorldPosition(ziel || new T.Vector3());
    function stelle(f, x, zz, blick) { f.root.position.set(x, z.boden.hoehe(x, zz), zz); f.root.rotation.set(0, blick, 0); }

    /** Richtet die Inselzeit auf der Insel w ein: Boden, Steg mit Boot und Vater, beim ersten Mal auch Junge und May neben dem Steg. */
    function richteEin(w, erstes) {
      z.boden = bodenBau.fuer(w); z.hafen = hafenBau.baue(z.boden, w.farbe && w.farbe.kante);
      if (z.hafen) k.scene.add(z.hafen.root);
      z.flaechen = []; w.land.root.traverse(o => { if (o.isMesh && o.userData.terrainSurface) z.flaechen.push(o); });
      if (z.hafen) z.flaechen.push(z.hafen.steg);
      gruss.setze(w);
      const s = z.boden.start;
      if (erstes) { stelle(junge, s.x, s.z, s.blick); may.setze(s.x + Math.cos(s.blick) * 1.4, s.z - Math.sin(s.blick) * 1.4, s.blick); }
      if (vater && z.hafen) { const p = z.hafen.vaterPlatz(); stelle(vater, p.x, p.z, p.blick); }
    }
    richteEin(w0, true);
    for (const f of alle) k.scene.add(f);
    kam.groesse(k.leinwand.clientWidth || 1, k.leinwand.clientHeight || 1);
    kam.setze(j.position, j.rotation.y + Math.PI * 0.8);           // zuerst von vorn: Junge, May und dahinter der Steg mit dem Vater
    Object.assign(sk, { left: -24, right: 24, top: 24, bottom: -24 }); sk.updateProjectionMatrix();

    // ---- Gehen, Reiten und Steigen
    function drehe(o, soll, dt, rate = 9) { let d = soll - o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); o.rotation.y += Math.max(-rate * dt, Math.min(rate * dt, d)); }
    function zuFuss(dt) {
      const ziel = z.modus === 'frei' ? z.ziel : null;
      if (ziel) {
        const dx = ziel.x - j.position.x, dz = ziel.z - j.position.z, rest = Math.hypot(dx, dz);
        if (rest < 0.12) { z.ziel = null; if (ziel.dann) ziel.dann(); }
        else {
          z.tempo += ((ziel.rennt ? 2.0 : 0.9) - z.tempo) * Math.min(1, dt * 5); drehe(j, Math.atan2(dx, dz), dt);
          const s = Math.min(rest, z.tempo * dt), neu = z.boden.schiebe(j.position, v.set(j.position.x + Math.sin(j.rotation.y) * s, 0, j.position.z + Math.cos(j.rotation.y) * s), 0.28);
          const weg = Math.hypot(neu.x - j.position.x, neu.z - j.position.z);
          j.position.x = neu.x; j.position.z = neu.z;
          z.klemmt = weg < s * 0.2 ? z.klemmt + dt : 0;
          if (z.klemmt > 0.5) { z.ziel = null; if (ziel.dann) { if (may.nahe(j.position) < 1.4) ziel.dann(); else may.modus('folgen'); } }
        }
      }
      if (!z.ziel) z.tempo = Math.max(0, z.tempo - dt * 6);
      z.ruhe = z.ziel || z.modus !== 'frei' ? 0 : z.ruhe + dt;        // steht er 10 s still neben May, setzt er sich zu ihr auf den Boden
      if (z.ruhe > 10 && junge.jetzt() === 'stehen' && may.nahe(j.position) < NAH) junge.haltung('boden');
      j.position.y = z.boden.hoehe(j.position.x, j.position.z);
      junge.gang(z.ziel ? z.tempo : 0);
    }
    function imSattel() { const s = may.sattel(); j.position.set(s.x, s.y - junge.sattel, s.z); j.rotation.y = may.blick(); }
    function steigen(dt) {
      const st = z.steigen; st.u = Math.min(1, st.u + dt / DAUER.steigen);
      const nach = st.nach || (() => { const s = may.sattel(); s.y -= junge.sattel; return s; })();
      j.position.lerpVectors(st.von, nach, st.u); j.position.y += Math.sin(Math.PI * st.u) * 0.35;
      if (st.auf) { drehe(j, may.blick(), dt, 12); if (st.u > 0.5 && junge.jetzt() !== 'reiten') junge.haltung('reiten'); }
      else if (st.u > 0.3 && junge.jetzt() !== 'stehen') junge.haltung('stehen');
      if (st.u >= 1) { z.steigen = null; z.modus = st.auf ? 'reiten' : 'frei'; may.modus(st.auf ? 'reiten' : 'folgen'); }
    }

    // ---- Überfahrt: einsteigen, hinaus, abblenden und Insel wechseln, mit dem Bug voran herein, aussteigen und vom Steg auf die Insel gehen
    function insBoot(h) {
      for (const f of alle) { h.boot.add(f); f.rotation.set(0, 0, 0); }
      h.setze(junge, 'junge'); h.setze(vater, 'vater'); may.root.position.copy(h.ort('may'));       // sitzen im Familienboot, der Vater rudert
    }
    function fahre(dt) {
      const f = z.fahrt; f.u += dt / DAUER[f.phase];
      if (f.phase === 'ab') { z.hafen.fahrt('ab', f.u); if (f.u >= 1) { f.phase = 'blende'; f.u = 0; } }
      else if (f.phase === 'blende') {
        k.renderer.toneMappingExposure = z.belichtung * Math.max(0.02, 1 - f.u);
        if (f.u < 1) return;
        const alt = z.hafen;
        try { if (k.beiWechsel) k.beiWechsel(f.ziel); } catch (e) { /* bleibt auf derselben Insel */ }
        richteEin(k.insel(), false);
        if (z.hafen) { insBoot(z.hafen); z.hafen.fahrt('an', 0); f.phase = 'an'; f.u = 0; kam.setze(welt(z.hafen.boot), z.hafen.blick()); }
        else for (const o of alle) k.scene.attach(o);
        alt.entsorge();
        if (!z.hafen) aussteigen();
      } else {
        k.renderer.toneMappingExposure = z.belichtung * Math.min(1, 0.02 + f.u * 3);
        z.hafen.fahrt('an', f.u);
        if (f.u >= 1) aussteigen();
      }
    }
    function aussteigen() {
      const s = z.boden.steg, h = z.hafen, st = z.boden.start;
      for (const f of alle) k.scene.attach(f);
      if (s && h) {
        const t = s.laenge - 2.6, blick = Math.atan2(-s.dir[0], -s.dir[1]), bei = q => [s.land[0] + s.dir[0] * t - s.dir[1] * q, s.land[1] + s.dir[1] * t + s.dir[0] * q];
        const [x, zz] = bei(-0.3), [mx, mz] = bei(0.45);                // Junge und May nebeneinander auf dem Steg, der Vater bleibt am Boot
        stelle(junge, x, zz, blick); may.setze(mx, mz, blick);
        if (vater) { const p = h.vaterPlatz(); stelle(vater, p.x, p.z, p.blick); }
        kam.setze(j.position, blick + 0.35);
      } else { stelle(junge, st.x, st.z, st.blick); may.setze(st.x + 1.4, st.z, st.blick); kam.setze(j.position, st.blick); }
      may.modus('folgen'); junge.haltung('stehen'); if (vater) vater.haltung('stehen');
      z.fahrt = null; z.modus = 'frei'; k.renderer.toneMappingExposure = z.belichtung;
      z.ziel = { x: st.x, z: st.z, rennt: false };
      if (z.ende) aktion('ende');
    }
    const amSteg = () => { if (!z.hafen || z.hafen.dreht()) return false; const p = z.hafen.vaterPlatz(); return Math.hypot(j.position.x - p.x, j.position.z - p.z) < 3.2; };

    // ---- Aktionen
    function loslassen() { z.modus = 'frei'; may.modus('folgen'); junge.haltung('stehen'); junge.streichelZiel(null); }
    /** Geht neben May (auf seiner Seite) und tut dann, was folgt. May wartet so lange. */
    function zuMay(dann) {
      const m = may.root.position, l = may.quer(), seite = (j.position.x - m.x) * l[0] + (j.position.z - m.z) * l[1] >= 0 ? 1 : -1;
      const x = m.x + l[0] * SEITE * seite, zz = m.z + l[1] * SEITE * seite;
      may.modus('fest');
      if (Math.hypot(x - j.position.x, zz - j.position.z) < 0.2 || !z.boden.begehbar(x, zz)) dann(seite);
      else { z.ziel = { x, z: zz, rennt: false, dann: () => dann(seite) }; z.klemmt = 0; }
    }
    function streichle(seite) {
      const b = may.blick(), m = may.root.position, l = may.quer(), ruecken = may.sattel();
      z.modus = 'streicheln'; may.modus('streicheln'); junge.gang(0);
      j.rotation.y = Math.atan2(m.x - j.position.x, m.z - j.position.z);
      ruecken.x += l[0] * 0.12 * seite; ruecken.z += l[1] * 0.12 * seite; ruecken.y += 0.02;
      junge.haltung('streicheln'); junge.streichelZiel(ruecken, v.set(Math.sin(b), 0, Math.cos(b)));
      spiele('gurren'); spaeter(0.5, () => spiele('schnurren'));
      spaeter(DAUER.streicheln, () => { if (z.modus === 'streicheln') loslassen(); });
    }
    function steigAuf() { z.ziel = null; may.modus('fest'); spiele('mrrp'); junge.gang(0); z.steigen = { auf: true, u: 0, von: j.position.clone() }; z.modus = 'steigen'; }

    function aktion(name, wert) {
      if (z.tot) return false;
      const nah = may.nahe(j.position) < NAH;
      if (name === 'ende') {
        z.ende = true;
        if (z.fahrt) return true;                                    // erst nach dem Anlegen
        const unten = z.modus === 'reiten' || z.modus === 'steigen';
        z.ziel = null; z.steigen = null; loslassen();
        if (unten) { const p = may.neben(0.95, z.boden); stelle(junge, p.x, p.z, may.blick()); }
        z.modus = 'ende'; spaeter(0.5, () => junge.winke());
        return true;
      }
      if (z.fahrt || z.steigen || z.modus === 'ende') return false;
      if (name === 'rufen' && z.modus === 'frei') { spiele('pfiff'); spaeter(0.9, () => { spiele('miau'); may.ruf(); }); return true; }
      if (name === 'streicheln' && z.modus === 'frei' && nah) { zuMay(streichle); return true; }
      if (name === 'aufsteigen' && z.modus === 'frei' && nah) { zuMay(steigAuf); return true; }
      if (name === 'absteigen' && z.modus === 'reiten') {
        may.modus('fest'); z.steigen = { auf: false, u: 0, von: j.position.clone(), nach: may.neben(0.95, z.boden) }; z.modus = 'steigen';
        return true;
      }
      if (name === 'fahren' && wert && (z.modus === 'frei' || z.modus === 'reiten') && amSteg()) {
        z.ziel = null; junge.haltung('stehen'); junge.streichelZiel(null); junge.gang(0); may.modus('fest');
        insBoot(z.hafen); spiele('boot');
        z.fahrt = { phase: 'ab', u: 0, ziel: wert }; z.modus = 'boot';
        return true;
      }
      return false;
    }

    /** Ein Tipp auf die Leinwand: May streicheln oder rufen, sonst dorthin gehen (im Sattel: May läuft hin) */
    function tippe(e) {
      if (z.fahrt || z.steigen || z.modus === 'ende') return;
      const r = k.leinwand.getBoundingClientRect();
      zeiger.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      strahl.setFromCamera(zeiger, kam.kamera);
      if (z.modus !== 'reiten' && strahl.intersectObject(may.root, true).length) { aktion(may.nahe(j.position) < NAH ? 'streicheln' : 'rufen'); return; }
      const t = strahl.intersectObjects(z.flaechen, true)[0];
      if (!t) return;
      if (z.modus === 'streicheln') loslassen();
      if (z.modus === 'reiten') { may.ziel(t.point.x, t.point.z); return; }
      if (may.modus() === 'fest') may.modus('folgen');
      z.ziel = { x: t.point.x, z: t.point.z, rennt: Math.hypot(t.point.x - j.position.x, t.point.z - j.position.z) > 5 }; z.klemmt = 0; z.gegangen = true;
    }
    const eingabe = W3.InselzeitEingabe(k.leinwand, { tippe, ziehe: dx => kam.drehe(dx) });

    // ---- Schleife: etwa 30 Bilder je Sekunde, Schatten etwa sechsmal je Sekunde um den Jungen
    function schritt(dt, t) {
      z.uhr += dt; k.zeit.value = t; if (k.weiter) k.weiter(t);
      for (const p of z.plan.filter(x => x.bei <= z.uhr)) { z.plan.splice(z.plan.indexOf(p), 1); p.f(); }
      if (z.hafen) z.hafen.update(dt, t);
      if (z.fahrt) fahre(dt); else if (z.steigen) steigen(dt); else if (z.modus !== 'reiten') zuFuss(dt);
      may.update(dt, z.boden, j);
      if (z.modus === 'reiten') imSattel();
      junge.update(dt); if (vater) vater.update(dt);
      gruss.update(dt, z.uhr, j, vater, !!z.fahrt);
      const p = z.fahrt ? welt(z.hafen.boot, v) : j.position, blick = z.fahrt ? z.hafen.blick() : z.modus === 'streicheln' ? j.rotation.y + 1.3 : j.rotation.y;
      kam.update(dt, p, blick, { art: z.fahrt ? 'boot' : z.modus === 'ende' ? 'ende' : z.modus === 'reiten' ? 'reiten' : 'gehen',      // streicheln: von rechts, der Arm ist sichtbar
        boden: z.boden, bewegt: !!z.ziel || z.modus === 'streicheln' || (z.modus === 'reiten' && !may.steht()) });
      k.sonne.target.position.copy(p); k.sonne.position.set(p.x - 55, p.y + 105, p.z + 65); k.sonne.target.updateMatrixWorld();
    }
    function schleife(jetzt) {
      z.bild = 0;
      if (z.tot) return;
      if (!doc.hidden && jetzt - z.zuletzt >= BILD - 2) {
        const dt = z.zuletzt ? Math.min(0.1, (jetzt - z.zuletzt) / 1000) : 0;
        z.zuletzt = jetzt;
        try { schritt(dt, jetzt / 1000); } catch (e) { z.fehler = z.fehler || e; }   // ein Fehler hält die Inselzeit nicht an
        if (jetzt - z.schatten > SCHATTEN) { k.renderer.shadowMap.needsUpdate = true; z.schatten = jetzt; }
        k.renderer.render(k.scene, kam.kamera);
      }
      z.bild = win.requestAnimationFrame(schleife);
    }
    z.bild = win.requestAnimationFrame(schleife);

    return {
      aktion,
      zustand: () => ({ modus: z.modus, mayNah: z.modus === 'frei' && may.nahe(j.position) < NAH, reitet: z.modus === 'reiten', streichelt: z.modus === 'streicheln',
        amSteg: !z.fahrt && (z.modus === 'frei' || z.modus === 'reiten') && amSteg(), faehrt: !!z.fahrt, ende: z.modus === 'ende', gegangen: z.gegangen,
        fehler: z.fehler ? String(z.fehler.message || z.fehler) : null }),
      groesse: (b, h) => kam.groesse(b, h),
      teile: () => ({ junge, vater, may, kamera: kam.kamera, boden: z.boden, hafen: z.hafen }),
      stoppe() {
        if (z.tot) return;
        z.tot = true;
        if (z.bild) win.cancelAnimationFrame(z.bild);
        eingabe.loese(); gruss.zurueck();
        if (z.hafen) z.hafen.entsorge();
        for (const f of alle) f.removeFromParent();
        k.renderer.toneMappingExposure = z.belichtung;
        k.sonne.position.copy(sonneAlt.p); k.sonne.target.position.copy(sonneAlt.t); [sk.left, sk.right, sk.top, sk.bottom] = sonneAlt.c;
        sk.updateProjectionMatrix(); k.sonne.target.updateMatrixWorld();
      }
    };
  }

  W3.Inselzeit = { starte };
})(globalThis);
