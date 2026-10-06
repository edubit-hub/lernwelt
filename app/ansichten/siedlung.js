/* app/ansichten/siedlung.js: die Ansicht «Siedlung» (Architektur 7.8, Mockup docs/mockup/siedlung.html, AP-16). Die Karte mit den festen Bauplätzen (Render.karte)
   füllt die Hauptfläche, rechts steht das Informationsfeld (siedlung-info.js), oben die Ressourcenleiste (welt-rahmen.js). Bauen dauert zwei Berührungen:
   freien Platz antippen, «Hier bauen». Ausbau, Veredeln und Tauschen sind je eine Berührung nach der Wahl des Gebäudes. Die Engine entscheidet (Welt.baue, veredle, tausche,
   verschiebe, über WeltDaten.aktion mit Probelauf); die Ansicht zeigt vorher Kosten, Wirkung und Voraussetzung und nennt bei einer Absage, was fehlt.
   ctx.daten: { neu: [Sätze «Neu möglich»] } vom Abschluss einer Sitzung, { wahl: Gebäude-ID } für einen Sprung aus der Forschung. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine;
  const hochformat = () => !!(g.matchMedia && g.matchMedia('(orientation: portrait)').matches);
  const RAND_HOCH = 140;                                       // Platz über der Insel im Hochformat für die Hinweise (Einheiten der Karte)

  function zeige(huelle, ctx) {
    const k0 = D().kontext();
    if (!k0) { huelle.replaceChildren(H('div.seite', H('h2', T().menue.siedlung), H('div.kasten.hilfe', { role: 'status' }, T().keineWelt))); return null; }
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { voll: true, info: true, zeit: true }), t = T();
    const z = { k: k0, wahl: null, kand: null, verschiebe: null, neu: Array.isArray(ctx.daten.neu) && ctx.daten.neu.length ? ctx.daten.neu : null };
    const hud = H('div.hud'), legende = H('div.welt-legende', { 'aria-hidden': 'true' }, H('span', B().ico('hoch', 'klein.akzent'), t.legendeAusbau), H('span', B().ico('schloss', 'klein'), t.legendeGesperrt), H('span', t.legendeStufe));
    const karteHuelle = H('div.welt-karte-huelle', hud, legende);
    let regler = null, mq = null;
    rahmen.seite.append(karteHuelle);

    const holeK = () => (z.k = D().kontext());
    const zeichneInfo = () => L.SiedlungInfo.zeichne(rahmen.info, z.k, z.wahl, z, tun);
    const name = id => (z.k.thema.bauteile[id] || {}).name || id;

    /** «Neu möglich: ...» nach einer Sitzung, danach «Jetzt möglich: ...» mit dem, was der Stand hergibt, und der Stand der Bauplätze. */
    function zeichneHud() {
      const mg = D().moeglich(z.k), e = D().epocheStand(z.k), pl = D().plaetzeStand(z.k), liste = z.neu || mg.map(x => x.satz);
      const ziel = (z.neu && mg.find(x => z.neu.includes(x.satz))) || mg[0];
      hud.replaceChildren(liste.length ? H('button.chip.hud-moeglich', { type: 'button', onclick: () => ziel && zumZiel(ziel) }, B().ico('hoch'),
        H('span', H('b', z.neu ? t.neuKopf : t.jetztKopf), ` ${liste.slice(0, 3).join(', ')}`, liste.length > 3 ? t.undWeitere(liste.length - 3) : '')) : '',
      e ? H('span.chip.leise', t.platzStand(e.nr, pl.belegt, pl.gesamt)) : '');
    }

    function alles() {
      const k = holeK();
      rahmen.leiste(k); rahmen.ziel(k);
      if (regler) regler.aktualisiere(k.stand, { ausbau: D().ausbauIds(k) });
      zeichneHud(); zeichneInfo();
    }

    /** Nach einer gelungenen Aktion: Leiste, Karte und Feld neu, der Platz bleibt oder wird gewählt, das Gebäude hüpft, eine Meldung sagt, was geschah. */
    function fertig(text, platz) {
      z.neu = null;
      const k = holeK();
      rahmen.leiste(k); rahmen.ziel(k);
      regler.aktualisiere(k.stand, { ausbau: D().ausbauIds(k) });
      zeichneHud();
      if (platz !== undefined) { regler.waehle(platz); regler.hupf(platz); } else zeichneInfo();
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
        const frei = L.Welt.plaetze(k.thema, k.stand).frei[0];
        if (frei !== undefined) { regler.waehle(frei); z.kand = id; zeichneInfo(); }
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
    };

    const tun = {
      gehe: (id, daten) => ctx.gehe(id, daten),
      kandidat: id => { z.kand = id; zeichneInfo(); },
      baue(id, platz) {
        const k = holeK(), bn = C().bauen(k, id);
        if (!bn.moeglich) { rahmen.meldung(bn.grund); return; }
        const r = D().aktion(k, 'baue', id, platz);
        if (!r.ok) rahmen.meldung(r.grund); else fertig(r.stufe > 1 ? t.ausgebaut(name(id), r.stufe) : t.gebaut(name(id)), r.platz);
      },
      ausbau(id) { tun.baue(id, undefined); },
      veredle(rid, n) {
        const r = D().aktion(holeK(), 'veredle', rid, n);
        if (!r.ok) rahmen.meldung(r.grund); else fertig(t.veredelt(r.menge, D().name(z.k, rid)));
      },
      tausche(id, nr, n) {
        const r = D().aktion(holeK(), 'tausche', id, nr, n);
        if (!r.ok) rahmen.meldung(r.grund); else fertig(t.getauscht(C().aufzaehlung(Object.entries(r.erhalten).map(([gut, m]) => `${m} ${D().name(z.k, gut)}`))));
      },
      verschieben(id) { z.verschiebe = id; rahmen.meldung(t.verschiebeHinweis(name(id))); zeichneInfo(); },
      abbrechen() { z.verschiebe = null; rahmen.meldung(''); zeichneInfo(); }
    };

    regler = L.Render.karte(karteHuelle, k0.thema, k0.stand, { onWahl, ausbau: D().ausbauIds(k0), randOben: hochformat() ? RAND_HOCH : 0 });
    if (g.matchMedia) {
      mq = g.matchMedia('(orientation: portrait)');
      mq.onchange = () => regler.aktualisiere(undefined, { randOben: hochformat() ? RAND_HOCH : 0 });
    }
    alles();
    const mg = D().moeglich(k0), start = ctx.daten.wahl ? { art: 'b', ziel: ctx.daten.wahl } : z.neu ? mg.find(x => z.neu.includes(x.satz) && x.art !== 'f') : mg.find(x => x.art !== 'f');
    const belegt = Object.entries(k0.stand.platz || {}).filter(([id]) => D().stufe(k0, id) >= 1).map(([, p]) => p).sort((a, b) => a - b);
    if (start) zumZiel(start); else regler.waehle(belegt.length ? belegt[0] : (L.Welt.plaetze(k0.thema, k0.stand).frei[0] ?? 0));
    return {
      regler, tun, zustand: z, alles,
      schliesse() { if (mq) mq.onchange = null; regler.zerstoere(); rahmen.schliesse(); }
    };
  }

  L.Ansichten.siedlung = { id: 'siedlung', get titel() { return L.Texte.welt.menue.siedlung; }, icon: 'siedlung', menue: 30, zeige };
})(globalThis);
