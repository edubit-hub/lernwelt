/* app/welten/fachinseln/szene.js: die 3D-Bühne der Fachinseln mit Three.js (E-2010-02, nach docs/mockup/fachinsel-2026-10-20/szene.js).
     W3.Szene.baue(el, welt, stand, { stand(), wenig, kamera }) → Regler wie L.Buehne (app/welt/buehne.js), damit die Hülle beide gleich führt:
       kamera(name | { areal }, { frei, sofort }) → Promise, modus({ schleier, ruhig, marken }), aktualisiere() → geänderte Areale, zerstoere(),
       dazu beiWahl(fn) (fn({ areal, platz, fach }) beim Antippen eines Areals, fn({ fach }) im Archipel), gewaehlt(), miniatur(arealId) → Bild-URL, zustand(),
       inselzeit(an, { klang, beiWechsel }) → W3.Inselzeit oder null (E-2110-01, solange sie läuft, ruhen Schleife, Kamera und Tippen der Szene).
     Kameraziele: 'archipel' (alle Inseln im Meer), { areal: 'mathe.zahlen' } oder 'areal:mathe.zahlen' (Nahansicht), alles andere zeigt die ganze Insel.
     stand: { fach, ordnung (Areale.ordne), bau: { arealId: 0..3 } }. opt.stand() liefert ihn frisch, aktualisiere liest ihn dort nach.
   Ohne WebGL wirft baue: start.js fängt das ab und zeigt den ruhigen Grund. Die Szene schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const WASSER_VS = 'varying vec3 worldPos;void main(){vec4 w=modelMatrix*vec4(position,1.0);worldPos=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
  const WASSER_FS = `varying vec3 worldPos;uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec2 p=worldPos.xz;float d=length(p*vec2(.0185,.0244));float shallows=1.-smoothstep(.85,1.65,d);vec3 deep=vec3(.026,.15,.22),shallow=vec3(.075,.32,.30);vec3 c=mix(deep,shallow,shallows*.8);float n=noise(p*.7+time*.016);float ripple=sin(p.x*2.4+p.y*1.3+n*4.-time*.18);float glitter=pow(max(0.,ripple),32.)*.005;float rays=noise(p*.11+vec2(2.,-3.));c+=rays*.012+glitter;c=mix(c,vec3(.24,.43,.47),smoothstep(130.,300.,length(p)));gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`;

  function baue(el, welt, stand0, opt = {}) {
    const T = L.THREE;
    if (!el || !T) return null;
    const doc = el.ownerDocument || g.document, win = doc.defaultView || g;
    const holeStand = typeof opt.stand === 'function' ? opt.stand : () => stand0;
    el.replaceChildren(); el.classList.add('buehne-ebene', 'fi-buehne'); el.removeAttribute('aria-hidden');
    el.dataset.schleier = 'keine'; el.dataset.marken = 'orte';
    const leinwand = doc.createElement('canvas'), schilder = doc.createElement('div'), schleier = doc.createElement('div');
    leinwand.className = 'fi-leinwand'; leinwand.setAttribute('role', 'img'); schilder.className = 'fi-schilder'; schleier.className = 'schleier';
    el.append(leinwand, schleier, schilder);

    const renderer = new T.WebGLRenderer({ canvas: leinwand, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
    const scene = new T.Scene();
    scene.background = new T.Color('#a9dce0'); scene.fog = new T.Fog('#b7dfe1', 220, 450);
    scene.add(new T.HemisphereLight('#e5f5ff', '#9c8e62', 1.75));
    const sonne = new T.DirectionalLight('#fff0cb', 2.7);
    sonne.castShadow = true; sonne.shadow.mapSize.set(2048, 2048);
    Object.assign(sonne.shadow.camera, { left: -95, right: 95, top: 80, bottom: -80, near: 1, far: 250 });
    sonne.shadow.normalBias = 0.045; sonne.shadow.bias = -0.00015; sonne.shadow.radius = 3;
    scene.add(sonne, sonne.target);
    const fuell = new T.DirectionalLight('#b6e2f4', 0.5); fuell.position.set(25, 20, -15); scene.add(fuell);
    const camera = new T.OrthographicCamera(-80, 80, 54, -54, 0.1, 500);
    const zeit = { time: { value: 0 } };
    const wasser = new T.Mesh(new T.PlaneGeometry(600, 600, 1, 1), new T.ShaderMaterial({ uniforms: zeit, vertexShader: WASSER_VS, fragmentShader: WASSER_FS }));
    wasser.rotation.x = -Math.PI / 2; wasser.position.y = -0.18; scene.add(wasser);

    // Fertige Modelle aus Meshy (W3.ModellFabrik, Daten in modell-*.js); fehlen sie, bauen alle Teile wie bisher aus Grundformen
    const modelle = W3.ModellFabrik ? W3.ModellFabrik(T) : null;
    const bauten = W3.Bauten(T), objekte = W3.Objekte(T, modelle), natur = W3.Inselnatur(T, bauten, objekte, W3.Vegetation(T));
    // Bauphasen als Schnitt durch die fertigen Modelle (W3.Baustufen); ohne Modelle bleiben die Phasen aus Grundformen
    const baustufen = modelle && W3.Baustufen ? W3.Baustufen(T, modelle) : null;
    const leben = W3.Themenleben ? W3.Themenleben(T, modelle) : null, fachbauten = W3.Fachbauten(T, modelle, baustufen), mini = W3.Miniaturen(T, renderer);
    const I = W3.SzeneInsel(T, { scene, bauten, objekte, natur, leben, fachbauten, modelle, baustufen });
    const K = W3.SzeneKamera(T, { camera, sonne, renderer, schicht: I.SCHICHT });
    const M = W3.SzeneMarken({ ebene: schilder, doc, beiWahl: platz => waehle(platz) });
    // May, die Hauskatze: läuft auf einem Weg nahe beim gewählten Areal (W3.MayInsel), ihr Porträt spricht die Begrüssung (portraet)
    const mayFabrik = W3.MayModell(T), may = W3.MayInsel(T, mayFabrik);
    scene.add(may.root);
    let portraetUrl = null;
    const mayOrt = () => { if (z.aktiv) may.setContext(z.aktiv.insel, z.fokus, z.aktiv.orte, z.aktiv.profil); };
    const inseln = new Map(), z = { aktiv: null, fach: null, plaetze: new Map(), fokus: null, kam: 'start', frei: null, drehung: 0, archipel: false,
      ruhig: false, marken: 'orte', tot: false, wahlFn: null, bild: 0, zuletzt: 0, schatten: 0, fern: null, griff: null, gezogen: false };
    const wenig = () => !!opt.wenig || !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const masse = () => ({ breite: el.clientWidth || win.innerWidth || 1, hoehe: el.clientHeight || win.innerHeight || 1 });

    function insel(f) {
      if (!inseln.has(f.insel)) inseln.set(f.insel, I.baue(f.insel, f.farbe));
      return inseln.get(f.insel);
    }
    const plaetzeVon = f => { const m = new Map(f.areale.map(a => [a.platz, a])); if (f.erweiterung) m.set(f.erweiterung.platz, f.erweiterung); return m; };
    const stufenVon = (plaetze, bau) => Object.fromEntries([...plaetze].map(([p, a]) => [p, (objekt(bau) && Number.isInteger(bau[a.id])) ? bau[a.id] : 0]));

    /** Liest den Stand und zeigt das gewählte Fach in seinen Bauphasen. → IDs der Areale, deren Phase sich geändert hat. */
    function anwenden() {
      const s = holeStand() || {}, ordnung = Array.isArray(s.ordnung) ? s.ordnung : [];
      const f = ordnung.find(x => x.fach === s.fach) || ordnung.find(x => x.areale.length) || ordnung[0];
      if (!f) return [];
      const w = insel(f), plaetze = plaetzeVon(f), stufen = stufenVon(plaetze, s.bau), alt = z.aktiv === w ? w.stufen : {};
      if (z.aktiv !== w) { if (z.aktiv) I.zeige(z.aktiv, false); z.aktiv = w; z.fokus = null; w.land.root.visible = true; }
      z.fach = f.fach; z.plaetze = plaetze;
      I.setze(w, { plaetze, stufen, erweitert: !!f.erweiterung, wachsen: !wenig() && !z.ruhig && !z.archipel });
      mayOrt();
      M.setze([...plaetze].map(([platz, a]) => ({ platz, id: a.id, name: a.name, stufe: stufen[platz] })));
      leinwand.setAttribute('aria-label', `Insel ${f.name}: ${[...plaetze.values()].map(a => a.name).join(', ')}. Alle Themen sind auch über die Liste erreichbar.`);
      return [...plaetze].filter(([p]) => (alt[p] || 0) !== stufen[p]).map(([, a]) => a.id);
    }

    function zeichne() {
      if (z.tot || z.iz) return;
      const m = masse();
      if (z.archipel && z.fern) { renderer.render(z.fern.scene, z.fern.camera); M.stelle(() => null, { ...m, an: false }); return; }
      renderer.render(scene, camera);
      const r = m;
      M.stelle(platz => {                                                  // Ortsmarke über dem Dach der sichtbaren Phase (SzeneInsel.anker)
        const a = z.aktiv && I.anker(z.aktiv, platz);
        if (!a) return null;
        const p = a.clone().project(camera);
        return { x: (p.x * 0.5 + 0.5) * r.breite, y: (-p.y * 0.5 + 0.5) * r.hoehe };
      }, { ...m, frei: z.frei, fokus: z.fokus, an: z.marken !== 'keine' });
    }

    function stelleKamera() {
      const m = masse();
      renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 1.75));      // ein Fenster kann auf einen anderen Bildschirm wechseln
      renderer.setSize(m.breite, m.hoehe, false); if (z.iz) { z.iz.groesse(m.breite, m.hoehe); return; }
      if (z.archipel && z.fern) { z.fern.resize(m.breite, m.hoehe); return; }
      K.stelle({ ...m, insel: z.aktiv, fokus: z.fokus, frei: z.frei, drehung: z.drehung, zoom: 1 });
    }

    // ---- Bewegung: Wasser, Leben und Schiffe mit etwa 20 Bildern je Sekunde, Schatten alle 0,5 s. ruhig und wenig Bewegung halten an.
    function schleife(jetzt) {
      z.bild = 0;
      if (z.tot || doc.hidden || z.iz) return;
      if (jetzt - z.zuletzt > 50) {
        const t = jetzt * 0.001;
        zeit.time.value = t;
        if (z.archipel && z.fern) z.fern.update(t);
        else { weiter(t); may.update(t, true); }
        if (!z.archipel && jetzt - z.schatten > 500) { renderer.shadowMap.needsUpdate = true; z.schatten = jetzt; }
        z.zuletzt = jetzt;
        zeichne();
      }
      if (bewegt()) z.bild = win.requestAnimationFrame(schleife);
    }
    const weiter = t => { if (leben) leben.update(t); fachbauten.update(t); if (baustufen) baustufen.update(t); }, bewegt = () => !z.tot && !z.ruhig && !wenig() && !z.iz;
    function anstossen() { if (!z.bild && bewegt() && win.requestAnimationFrame) z.bild = win.requestAnimationFrame(schleife); }
    function neu() { stelleKamera(); renderer.shadowMap.needsUpdate = true; zeichne(); anstossen(); }

    // ---- Archipel: alle Inseln verkleinert in einem Meer, Schiffe zwischen passenden Themen (W3.Fernwelt, W3.Schiffe)
    function archipel() {
      const s = holeStand() || {}, ordnung = Array.isArray(s.ordnung) ? s.ordnung : [], vorher = z.aktiv, stufe = {};
      z.fern = z.fern || W3.Fernwelt(T, wasser, W3.Schiffe(T, modelle));
      for (const f of ordnung) {
        const w = insel(f), plaetze = plaetzeVon(f), stufen = stufenVon(plaetze, s.bau);
        if (z.aktiv && z.aktiv !== w) I.zeige(z.aktiv, false);
        z.aktiv = w; I.zeige(w, true); I.setze(w, { plaetze, stufen, erweitert: !!f.erweiterung });
        const ohne = new Set([wasser, may.root, ...(w.land.mist && w.land.mist.group ? [w.land.mist.group] : []), ...w.schilder.values()]);
        z.fern.setIsland(f.insel, scene, ohne, JSON.stringify([f.insel, stufen, !!f.erweiterung]));
        const werte = Object.values(stufen);
        stufe[f.insel] = werte.length ? Math.min(1, werte.reduce((a, b) => a + b / 3, 0) / 6) : 0;
      }
      if (z.aktiv && z.aktiv !== vorher) I.zeige(z.aktiv, false);
      z.aktiv = vorher; if (vorher) I.zeige(vorher, true);
      anwenden();
      z.fern.traffic.setProgress(stufe);
      z.archipel = true; z.fokus = null;
      leinwand.setAttribute('aria-label', 'Alle Fachinseln in einem Meer. Schiffe verbinden passende Themen. Die Inseln sind auch über die Liste erreichbar.');
    }

    function kamera(wunsch, o = {}) {
      if (z.tot) return Promise.resolve();
      z.kam = wunsch; z.frei = o.frei || z.frei;
      const areal = objekt(wunsch) ? wunsch.areal : typeof wunsch === 'string' && wunsch.startsWith('areal:') ? wunsch.slice(6) : null;
      if (wunsch === 'archipel') { if (!z.archipel) archipel(); }
      else {
        z.archipel = false;
        const eintrag = areal ? [...z.plaetze].find(([, a]) => a.id === areal) : null;
        z.fokus = eintrag ? eintrag[0] : null;
        z.drehung = z.fokus && z.aktiv ? K.freieSicht(z.aktiv, z.fokus) : 0;
        mayOrt();
      }
      may.root.visible = !z.archipel && may.root.userData.routeReady !== false && !z.iz;
      neu();
      return Promise.resolve();
    }

    function waehle(platz) {
      if (z.tot || z.marken === 'keine') return;
      const a = z.plaetze.get(platz);
      if (!a) return;
      if (z.wahlFn) z.wahlFn({ areal: a.id, platz, fach: z.fach }); else kamera({ areal: a.id }, { frei: z.frei });
    }

    // ---- Antippen und Drehen: kurzer Tipp wählt ein Areal (oder im Archipel eine Insel), Ziehen dreht die Insel
    const zeiger = new T.Vector2(), strahl = new T.Raycaster();
    function tipp(e) {
      const r = leinwand.getBoundingClientRect();
      zeiger.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      if (z.archipel && z.fern) {
        const id = z.fern.hit(strahl, zeiger), f = ((holeStand() || {}).ordnung || []).find(x => x.insel === id);
        if (f && z.wahlFn && z.marken !== 'keine') z.wahlFn({ fach: f.fach });
        return;
      }
      strahl.setFromCamera(zeiger, camera); strahl.layers.mask = camera.layers.mask;
      const w = z.aktiv, ziele = w ? [...w.modelle.values(), ...w.viertel.values()].flat().concat([...w.schilder.values()]).filter(o => o.visible) : [];
      const t = strahl.intersectObjects(ziele, true).find(h => h.object.userData.place);
      if (t) waehle(t.object.userData.place);
    }
    const unten = e => { if (z.iz) return; z.griff = { x: e.clientX, y: e.clientY, d: z.drehung }; z.gezogen = false; };
    const zieht = e => {
      if (!z.griff || e.buttons !== 1 || z.archipel) return;
      const dx = e.clientX - z.griff.x;
      if (Math.abs(dx) > 8) z.gezogen = true;
      if (z.gezogen) { z.drehung = z.griff.d + dx * 0.003; stelleKamera(); zeichne(); }
    };
    const oben = e => { const g0 = z.griff; z.griff = null; if (g0 && !z.gezogen && Math.hypot(e.clientX - g0.x, e.clientY - g0.y) <= 12) tipp(e); };
    leinwand.addEventListener('pointerdown', unten); leinwand.addEventListener('pointermove', zieht); leinwand.addEventListener('pointerup', oben);
    const sichtbar = () => { if (doc.hidden) { if (z.bild) win.cancelAnimationFrame(z.bild); z.bild = 0; } else anstossen(); };
    doc.addEventListener('visibilitychange', sichtbar);
    const beobachter = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(() => { if (!z.tot) { stelleKamera(); zeichne(); } }) : null;
    if (beobachter) beobachter.observe(el);

    const regler = {
      el, kamera,
      modus(o = {}) {
        if (z.tot) return;
        if (o.schleier) el.dataset.schleier = o.schleier;
        if (o.ruhig !== undefined) { z.ruhig = !!o.ruhig; el.classList.toggle('ruhig', z.ruhig); }
        if (o.marken) { z.marken = o.marken; el.dataset.marken = o.marken; }
        zeichne(); anstossen();
      },
      aktualisiere() { if (z.tot) return []; const neuIds = anwenden(); if (z.archipel) { z.archipel = false; archipel(); } neu(); return neuIds; },
      beiWahl(fn) { z.wahlFn = typeof fn === 'function' ? fn : null; },
      gewaehlt: () => (z.fokus && z.plaetze.get(z.fokus) ? z.plaetze.get(z.fokus).id : null),
      /** Porträt von May (sitzend, von vorn) als Bild-URL, einmal gerendert. */
      portraet() { if (!portraetUrl && !z.tot) portraetUrl = mini.asset(mayFabrik.create('sit'), 600, 720, { front: true }); return portraetUrl; },
      miniatur(arealId, b = 320, h = 240) {
        const e = [...z.plaetze].find(([, a]) => a.id === arealId);
        return e && z.aktiv ? mini.asset(I.modell(z.aktiv, e[0]), b, h) : null;
      },
      zustand: () => ({ fach: z.fach, fokus: z.fokus, ansicht: z.iz ? 'inselzeit' : z.archipel ? 'archipel' : z.fokus ? 'areal' : 'insel', drehung: z.drehung,
        zeichnungen: renderer.info.render.calls, dreiecke: renderer.info.render.triangles, version: T.REVISION }),
      inselzeit(an, o = {}) {
        if (z.iz) { z.iz.stoppe(); z.iz = null; may.root.visible = !z.archipel && may.root.userData.routeReady !== false; neu(); }
        z.iz = an && !z.tot && W3.Inselzeit ? W3.Inselzeit.starte(T, { scene, renderer, sonne, leinwand, zeit: zeit.time, modelle, mayFabrik, insel: () => z.aktiv, wenig: wenig(), weiter, ...o }) : null;
        if (z.iz) { may.root.visible = false; if (z.bild) win.cancelAnimationFrame(z.bild); z.bild = 0; stelleKamera(); }
        return z.iz;
      },
      zerstoere() {
        if (z.tot) return;
        z.tot = true; if (z.iz) { z.iz.stoppe(); z.iz = null; }
        if (z.bild) win.cancelAnimationFrame(z.bild);
        if (beobachter) beobachter.disconnect();
        doc.removeEventListener('visibilitychange', sichtbar);
        leinwand.removeEventListener('pointerdown', unten); leinwand.removeEventListener('pointermove', zieht); leinwand.removeEventListener('pointerup', oben);
        try { mini.dispose(); } catch (e) { /* Miniaturen ohne eigene Ressourcen */ }
        renderer.dispose();
        el.replaceChildren(); el.classList.remove('fi-buehne');
      }
    };
    anwenden();
    kamera(opt.kamera || 'start', { sofort: true });
    return regler;
  }

  W3.Szene = { baue };
})(globalThis);
