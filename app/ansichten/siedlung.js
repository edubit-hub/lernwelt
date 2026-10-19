/* app/ansichten/siedlung.js: die Ansicht «Siedlung» (docs/gestaltung-umbau.md 2.9, Architektur 7.8, Vorbild docs/mockup/richtung-a/a-siedlung.js).
   Die Siedlung steht auf der Bühne: die Kamera fährt zur Siedlung, die Bauplätze der Insel sind antippbar (Bühne.beiWahl, waehle). Ein Tipp auf einen Platz fährt
   die Kamera so, dass die Baustelle mitten im freien Bereich steht (quer links der Tafel, hoch über dem Blatt), und öffnet die Bauplatz-Tafel (siedlung-info.js).
   Orte der Insel führen weiter (beiOrt): Forschungsturm und Tor zur Forschung, Hafen zu den Aufträgen, Lager zum Logbuch. Ohne Bühne (Test-Thema, Fehler)
   zeigt die Ansicht die Karte mit den Bauplätzen (Render.karte) in der Seite; beide liefern denselben Regler { waehle, gewaehlt, plaetze, aktualisiere, zerstoere }.
   Bauen dauert zwei Berührungen: Platz, «Hier bauen». Die Engine entscheidet (WeltDaten.aktion mit Probelauf). Danach springt «−n» an der Pille ab, die Zahl
   zählt herunter, das Gebäude entsteht auf dem Platz (Bühne.bauEffekt, höchstens 1,2 s), die Eingabe bleibt frei.
   ctx.daten: { neu: [Sätze «Neu möglich»] } vom Abschluss (der passende Ort leuchtet warm), { wahl: Gebäude-ID } für einen Sprung aus der Forschung. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, S = () => L.Texte.siedlungsseite, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine;
  const hochformat = () => !!(g.matchMedia && g.matchMedia('(orientation: portrait)').matches);
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const RAND_HOCH = 140;                                       // Platz über der Insel im Hochformat für die Hinweise (Einheiten der Karte, nur ohne Bühne)
  const ORT = { forschung: ['forschung'], tor: ['forschung'], hafen: ['auftraege'], lager: ['logbuch'] };
  const SCHILD = { b: 'siedlung', v: 'siedlung', f: 'forschung' };

  /** Alle Vorräte, die eine Aktion verändern kann (Rohstoffe und Güter), für Plaketten und Zählen. */
  const salden = k => Object.fromEntries([...Object.keys(k.thema.rohstoffe || {}), ...Object.keys(k.thema.rezepte || {})].map(id => [id, D().saldo(k, id)]));

  /** Der Regler auf der Bühne: dieselben Griffe wie die Karte. plaetze() liest das Modell der Bühne. */
  function aufBuehne(b, onWahl, beiOrt) {
    b.beiWahl(onWahl); b.beiOrt(beiOrt);
    return {
      buehne: b, waehle: (nr, o) => b.waehle(nr, o), gewaehlt: () => b.gewaehlt(),
      plaetze: () => ((sicher(() => b.modell(), null) || {}).liste || []).filter(p => p.art !== 'leer').map(({ platz, art, bauteil, stufe, epoche }) => ({ platz, art, bauteil, stufe, epoche })),
      aktualisiere: stand => (stand ? b.aktualisiere(stand) : []),
      zerstoere() { b.beiWahl(null); b.beiOrt(null); b.waehle(null); }
    };
  }

  function zeige(huelle, ctx) {
    const k0 = D().kontext();
    if (!k0) { huelle.replaceChildren(H('div.seite', H('h2', T().menue.siedlung), H('div.kasten.hilfe', { role: 'status' }, T().keineWelt))); return null; }
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { voll: true, info: true, zeit: true }), t = T(), s = S();
    const z = { k: k0, wahl: null, kand: null, verschiebe: null, neu: Array.isArray(ctx.daten.neu) && ctx.daten.neu.length ? ctx.daten.neu : null, warm: [] };
    const b = ctx.buehne && typeof ctx.buehne.beiWahl === 'function' && typeof ctx.buehne.waehle === 'function' ? ctx.buehne : null;
    // Auf der Bühne erklären sich Plätze und Gebäude selbst (Plus, Schloss, warmer Pfeil); nur die Karte ohne Bühne behält ihre Legende
    const hinweise = H('div.hud'), legende = b ? ''
      : H('div.welt-legende', { 'aria-hidden': 'true' }, H('span', B().ico('hoch', 'klein.akzent'), t.legendeAusbau), H('span', B().ico('schloss', 'klein'), t.legendeGesperrt), H('span', t.legendeStufe));
    const flaeche = H(`div.welt-karte-huelle${b ? '.auf-buehne' : ''}`, hinweise, legende);
    let regler = null, mq = null;
    rahmen.seite.append(flaeche);
    if (b) huelle.classList.add('siedlung-buehne');

    const holeK = () => (z.k = D().kontext());
    /** Inhalt der Tafel und ihr Kicker je Zustand: «Bauplatz» (frei oder gesperrt), «Gebäude» (gebaut), sonst der Name der Ansicht (Vorbild A). */
    const zeichneInfo = () => {
      L.SiedlungInfo.zeichne(rahmen.info, z.k, z.wahl, z, tun);
      const w = z.wahl, kicker = !w ? T().menue.siedlung : w.art === 'gebaut' ? s.kickerGebaeude : s.kickerBauplatz;
      if (typeof rahmen.setzeTitel === 'function') rahmen.setzeTitel(kicker, '');
    };
    const name = id => (z.k.thema.bauteile[id] || {}).name || id;

    /** Ein einziger schwebender Hinweis mit dem wichtigsten Schritt («Neu möglich: …» nach einer Sitzung, sonst «Jetzt möglich: …»). Was sonst noch geht,
        zeigen warme Pfeile an den Plätzen selbst (Bühne.hinweise). Ohne Bühne bleibt der Stand der Bauplätze als Zeile über der Karte. */
    function zeichneHinweise() {
      const mg = D().moeglich(z.k), ziel = (z.neu && mg.find(x => z.neu.includes(x.satz))) || mg.find(x => x.art !== 'f') || mg[0];
      const satz = z.neu ? (ziel ? ziel.satz : z.neu[0]) : ziel ? ziel.satz : '', e = !b ? D().epocheStand(z.k) : null, pl = e ? D().plaetzeStand(z.k) : null;
      // Nachbesserung 2: der Hinweis ist ein Ortsschild mit Miniatur des Gebäudes und Pfeil; ein Tipp fährt dorthin
      const bild = H('span.hm-bild', { 'aria-hidden': 'true' }), id = ziel && ziel.art !== 'f' ? (ziel.art === 'v' ? sicher(() => z.k.thema.rezepte[ziel.ziel].in, null) : ziel.ziel) : null;
      bild.innerHTML = id && L.Render && L.Render.vorschau ? sicher(() => L.Render.vorschau(z.k.thema, id, Math.max(1, D().stufe(z.k, id))), '') : sicher(() => L.Iso.mini(ziel && ziel.art === 'f' ? 'forschung' : 'siedlung'), '') || '';
      hinweise.replaceChildren(satz ? H('button.chip.hud-moeglich', { type: 'button', onclick: () => ziel && zumZiel(ziel) }, bild, H('span', H('b', z.neu ? t.neuKopf : t.jetztKopf), ` ${satz}`), H('span.ico.ico-pfeil.hm-pfeil', { 'aria-hidden': 'true' })) : '',
        e ? H('span.chip.leise', t.platzStand(e.nr, pl.belegt, pl.gesamt)) : '');
      if (b && typeof b.hinweise === 'function' && L.SiedlungHinweise) sicher(() => b.hinweise(L.SiedlungHinweise.pfeile(z.k, mg)));
    }

    /** «Neu möglich» hebt den passenden Ort auf der Bühne warm hervor (Forschung, Tor, Siedlung). Ohne «neu» sind alle Schilder wieder ruhig. */
    function schilder() {
      if (!b || typeof b.schild !== 'function') return;
      for (const id of z.warm) sicher(() => b.schild(id, {}));
      z.warm = [];
      if (!z.neu) return;
      const tore = new Set((z.k.thema.epochen || []).map(e => e.tor));
      for (const x of D().moeglich(z.k).filter(m => z.neu.includes(m.satz))) {
        const id = x.art === 'f' && tore.has(x.ziel) ? 'tor' : SCHILD[x.art];
        if (id && !z.warm.includes(id) && sicher(() => b.schild(id, { zusatz: s.schildNeu, warm: true }), false)) z.warm.push(id);
      }
    }

    /** Freier Bereich der Bühne nach Layout (ohne die Verschiebung der gleitenden Tafel): unter dem HUD, über dem Dock, links der Tafel oder über dem Blatt. */
    function frei() {
      const tafel = rahmen.info && rahmen.info.parentNode, app = tafel && tafel.parentNode, doc = app && app.ownerDocument;
      if (!doc || typeof doc.querySelector !== 'function' || !(app.clientWidth > 0)) return undefined;
      const W = app.clientWidth, Hh = app.clientHeight, hud = doc.querySelector('header.hud'), dock = doc.querySelector('nav.dock'), f = { links: 0, oben: 0, rechts: 0, unten: 0 };
      if (hud && hud.offsetHeight) f.oben = hud.offsetTop + hud.offsetHeight + 4;
      if (dock && dock.offsetHeight && app.getAttribute('data-dock') === 'an') f.unten = Hh - dock.offsetTop + 4;
      if (tafel.offsetWidth && !tafel.classList.contains('eingeklappt')) {
        if (tafel.offsetWidth > W * .6) f.unten = Math.max(f.unten, Hh - tafel.offsetTop + 4); else f.rechts = W - tafel.offsetLeft + 4;
      }
      return f;
    }
    /** Kamera auf die Siedlung, mit gewähltem Platz auf die Baustelle. Erst nach dem Zeichnen, damit die Tafel steht. */
    const fahre = () => { if (b) Promise.resolve().then(() => { if (!z.tot) sicher(() => b.kamera('siedlung', { frei: frei() })); }); };

    function alles() {
      const k = holeK();
      rahmen.leiste(k); rahmen.ziel(k);
      if (!b && regler) regler.aktualisiere(k.stand, { ausbau: D().ausbauIds(k) });
      zeichneHinweise(); zeichneInfo(); schilder();
    }

    /** Ereigniseffekte nach einer Aktion: Plakette an jeder Pille, deren Vorrat sich änderte, die Zahl zählt nach. Nie blockierend. */
    function wirke(vorher) {
      const k = z.k, E = ctx.effekte, bezahlt = [];
      for (const [id, alt] of Object.entries(vorher)) {
        const neu = D().saldo(k, id), d = neu - alt, p = ctx.hud && ctx.hud.pille ? ctx.hud.pille(id) : null;
        if (!d) continue;
        if (d < 0) bezahlt.push(id);
        const zahl = p && p.querySelector ? p.querySelector('.res-zahl') : null;
        if (zahl && E) sicher(() => E.zaehle(zahl, alt, neu, { dauer: 600 }));
        if (ctx.hud && ctx.hud.plakette) sicher(() => ctx.hud.plakette(id, d < 0 ? s.minus(-d) : s.plus(d), { art: d < 0 ? 'minus' : 'plus' }));
      }
      return bezahlt;
    }

    /** Bau-Effekt auf der Bühne: Rohstoffe fliegen von der Pille zum Platz, dann wächst das Gebäude. Ohne Bühne hüpft das Gebäude der Karte. */
    function baueEffekt(platz, bezahlt, text) {
      if (!b) { if (regler.hupf) regler.hupf(platz); if (ctx.klang) sicher(() => ctx.klang.spiele('gebaut')); rahmen.meldung(text); return; }
      const E = ctx.effekte, p = bezahlt.length && ctx.hud && ctx.hud.pille ? ctx.hud.pille(bezahlt[0]) : null, ort = sicher(() => b.ort(platz), null);
      // Nachbesserung 2: die Kamera rückt nah an die Baustelle (Faktor 1,6), am Ende steht «… gebaut.» über dem Haus statt als Meldung über dem Dock
      const nah = sicher(() => b.kamera({ platz, faktor: 1.6 }, { frei: frei() }), null);
      if (p && ort && E && typeof E.flug === 'function') sicher(() => E.flug({ von: p, nach: b.zuSchirm(ort), anzahl: 3, abstand: 60, dauer: 420, bahn: 'gasse', inhalt: () => (L.Iso && L.Iso.objekt ? L.Iso.objekt(bezahlt[0], { groesse: 26 }) : '') }));
      Promise.all([nah, b.bauEffekt(platz)]).then(() => {                       // Fahrt und Bau laufen zusammen, der Satz kommt, wenn beide stehen
        if (z.tot) return;
        const o = sicher(() => b.ort(platz), null), punkt = o ? sicher(() => b.zuSchirm(o), null) : null;
        const gezeigt = punkt && E && typeof E.ortText === 'function' ? sicher(() => E.ortText(punkt, text), null) : null;
        if (!gezeigt) rahmen.meldung(text);
        setTimeout(() => { if (!z.tot) fahre(); }, 1800);                     // danach wieder die ganze Siedlung mit dem Platz im freien Teil
      }).catch(() => rahmen.meldung(text));
    }

    /** Nach einer gelungenen Aktion: HUD, Bühne und Tafel neu, der Platz bleibt oder wird gewählt, Effekte laufen, eine Meldung sagt, was geschah. */
    function fertig(text, platz, vorher, bau) {
      z.neu = null;
      const k = holeK();
      rahmen.leiste(k); rahmen.ziel(k);
      if (b) regler.aktualisiere(k.stand); else regler.aktualisiere(k.stand, { ausbau: D().ausbauIds(k) });
      zeichneHinweise(); schilder();
      const bezahlt = vorher ? wirke(vorher) : [];
      if (platz !== undefined) regler.waehle(platz); else zeichneInfo();
      if (bau && platz !== undefined) { baueEffekt(platz, bezahlt, text); return; }
      if (ctx.klang && vorher) sicher(() => ctx.klang.spiele(bezahlt.length ? 'muenze' : 'sammeln'));
      rahmen.meldung(text);
    }

    /** Springt zu dem, was «möglich» ist: gebautes Gebäude wählen, freien Platz mit dem Gebäude vorwählen oder in die Forschung. */
    function zumZiel(x) {
      const k = holeK();
      if (x.art === 'f') return ctx.gehe('forschung', { wahl: x.ziel });
      const id = x.art === 'v' ? (k.thema.rezepte[x.ziel] || {}).in : x.ziel, platz = id && k.stand.platz ? k.stand.platz[id] : undefined;
      z.verschiebe = null;
      if (Number.isInteger(platz) && D().stufe(k, id) >= 1) regler.waehle(platz);
      else {
        const fr = L.Welt.plaetze(k.thema, k.stand).frei[0];
        if (fr !== undefined) { regler.waehle(fr); z.kand = id; zeichneInfo(); }
      }
      return undefined;
    }

    function versetze(platz) {
      const id = z.verschiebe, r = D().aktion(holeK(), 'verschiebe', id, platz);
      if (!r.ok) { rahmen.meldung(r.grund); return; }
      z.verschiebe = null;
      fertig(t.verschoben(name(id)), platz);
    }

    const onWahl = w => {
      if (z.verschiebe && w.art === 'frei') { versetze(w.platz); return; }
      Object.assign(z, { verschiebe: null, wahl: w, kand: null });
      zeichneInfo();
      fahre();
    };
    /** Ein Ort der Insel: Forschungsturm und Tor zur Forschung (das Tor mit gewähltem Knoten), Hafen zu den Aufträgen, Lager zum Logbuch, Rathaus wählt Platz 0. */
    const beiOrt = id => {
      if (id === 'siedlung') { regler.waehle(0); return; }
      const ziel = ORT[id];
      if (!ziel) return;
      const tor = id === 'tor' ? sicher(() => D().epocheStand(z.k).tor, null) : null;
      ctx.gehe(ziel[0], tor ? { wahl: tor.id } : undefined);
    };

    const tun = {
      gehe: (id, daten) => ctx.gehe(id, daten),
      ueben: fach => ctx.gehe('lernen', fach ? { fach } : undefined),
      kandidat: id => { z.kand = id; zeichneInfo(); },
      baue(id, platz) {
        const k = holeK(), bn = C().bauen(k, id);
        if (!bn.moeglich) { rahmen.meldung(bn.grund); return; }
        const vorher = salden(k), r = D().aktion(k, 'baue', id, platz);
        if (!r.ok) rahmen.meldung(r.grund); else fertig(r.stufe > 1 ? t.ausgebaut(name(id), r.stufe) : t.gebaut(name(id)), r.platz, vorher, true);
      },
      ausbau(id) { tun.baue(id, undefined); },
      veredle(rid, n) {
        const vorher = salden(holeK()), r = D().aktion(z.k, 'veredle', rid, n);
        if (!r.ok) rahmen.meldung(r.grund); else fertig(t.veredelt(r.menge, D().name(z.k, rid)), undefined, vorher);
      },
      tausche(id, nr, n) {
        const vorher = salden(holeK()), r = D().aktion(z.k, 'tausche', id, nr, n);
        if (!r.ok) rahmen.meldung(r.grund); else fertig(t.getauscht(C().aufzaehlung(Object.entries(r.erhalten).map(([gut, m]) => `${m} ${D().name(z.k, gut)}`))), undefined, vorher);
      },
      verschieben(id) { z.verschiebe = id; rahmen.meldung(t.verschiebeHinweis(name(id))); zeichneInfo(); },
      abbrechen() { z.verschiebe = null; rahmen.meldung(''); zeichneInfo(); }
    };

    if (b) regler = aufBuehne(b, onWahl, beiOrt);
    else {
      regler = L.Render.karte(flaeche, k0.thema, k0.stand, { onWahl, ausbau: D().ausbauIds(k0), randOben: hochformat() ? RAND_HOCH : 0 });
      if (g.matchMedia) {
        mq = g.matchMedia('(orientation: portrait)');
        mq.onchange = () => regler.aktualisiere(undefined, { randOben: hochformat() ? RAND_HOCH : 0 });
      }
    }
    alles();
    // Auf der Bühne beginnt die Siedlung mit der freien Insel, die Tafel kommt erst mit einem Tipp (oder mit einem Sprung aus Forschung und Abschluss)
    const mg = D().moeglich(k0), start = ctx.daten.wahl ? { art: 'b', ziel: ctx.daten.wahl } : z.neu ? mg.find(x => z.neu.includes(x.satz) && x.art !== 'f') : b ? null : mg.find(x => x.art !== 'f');
    const belegt = Object.entries(k0.stand.platz || {}).filter(([id]) => D().stufe(k0, id) >= 1).map(([, p]) => p).sort((a, c) => a - c);
    if (start) zumZiel(start);
    else if (b && typeof rahmen.einklappen === 'function') { rahmen.einklappen(); fahre(); }
    else regler.waehle(belegt.length ? belegt[0] : (L.Welt.plaetze(k0.thema, k0.stand).frei[0] ?? 0));
    if (L.SiedlungHinweise) L.SiedlungHinweise.freischaltung(b, ctx);
    return {
      regler, tun, zustand: z, alles,
      schliesse() {
        z.tot = true;
        if (mq) mq.onchange = null;
        z.neu = null; schilder();
        regler.zerstoere(); rahmen.schliesse();
        huelle.classList.remove('siedlung-buehne');
      }
    };
  }

  L.Ansichten.siedlung = { id: 'siedlung', get titel() { return L.Texte.welt.menue.siedlung; }, icon: 'siedlung', dock: 30,
    buehne: { kamera: 'siedlung', marken: 'plaetze' }, zeige };
})(globalThis);
