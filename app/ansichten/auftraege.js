/* app/ansichten/auftraege.js: die Ansicht «Aufträge» am Hafen (docs/gestaltung-umbau.md 2.11, Architektur 6.4, 7.2 und 7.8, Vorbild docs/mockup/richtung-a/a-hafen.js, AP-16).
   Die Kamera fährt zum Hafen, auf dem Wasser steht je Expedition eine Route mit Fähnchen (Buehne.routen), ein Tipp wählt sie. Die schmale Tafel (hoch als Blatt
   von unten) zeigt die gewählte Route: Ziel und Umfang, Fundstück, Voraussetzung als Weg mit Handlungsknopf, festen Lohn als Objekte und «Starten». Darunter stehen
   die übrigen Routen kurz, jede mit eigenem Knopf (data-aktion «starten:<id>»), damit jede Expedition auch ohne Bühne erreichbar bleibt. «Starten» ruft
   Lauf.start({ art: 'expedition' }) im Aufgabenrahmen auf, danach wertet AuftraegePlan.bewerte die Runde aus, der neue Lohn fliegt zu den Pillen.
   Aufträge der Siedlung (Lieferungen) gibt es in der Engine noch nicht, die Tafel sagt das offen (V-AP16-06). ctx.daten: { ergebnis: { id, r }, wahl }. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, TH = () => L.Texte.hafen, D = () => L.WeltDaten, B = () => L.WeltBausteine, P = () => L.AuftraegePlan;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const prozent = q => `${Math.round(q * 100)} %`;
  const zielAnteil = e => `${Math.ceil(e.ziel * e.umfang - 1e-9)} von ${e.umfang}`;   // für Kinder als Bruch statt Prozent
  const liste = x => (Array.isArray(x) ? x : []);

  /** Die Fähnchen der Routen für die Bühne: offen als kräftiger Strich (warm, solange die Expedition bereit und nicht erledigt ist), gesperrt fein gepunktet. */
  const fahnen = routen => routen.map(r => ({ id: r.id, name: r.e.name, ziel: r.e.name, art: r.ok || r.erledigt ? 'offen' : 'zu', warm: r.ok && !r.erledigt,
    text: r.erledigt ? TH().routeErledigt : r.ok ? TH().routeAufgaben(r.e.umfang) : TH().routeZu }));
  const etikett = r => H(`span.etikett${r.ok || r.erledigt ? '' : '.grau'}`, r.erledigt ? T().erledigtAm(D().datum(r.c.plan.erledigt)) : r.ok ? T().bereit : T().gesperrt);
  const bereich = (k, e) => (e.braucht && e.braucht.bereich ? D().bereichModule(e.braucht.bereich).join(', ') || D().bereichName(e.braucht.bereich) : T().alleModule);

  /** Das Fundstück der Route mit seinem Bild aus dem Thema (sonst ein ruhiges Platzhalter-Objekt), grau, solange es nicht gefunden ist. */
  function fund(k, r) {
    if (!r.c.sammlung) return '';
    const s = liste(k.thema.sammlung).find(x => x && x.id === r.c.sammlung) || {}, da = liste(k.ledger.sammlung).some(x => x && x.id === r.c.sammlung);
    const bild = H('span.fund-bild', { 'aria-hidden': 'true' });
    bild.innerHTML = sicher(() => L.LogbuchGrafik.fund(s.bild, { breite: 72, hoehe: 54, leer: !da }), '') || '';
    return H('div.route-fund', bild, H('div.route-fund-text', H('p.kicker', TH().fundstueck), H('b', D().sammlungName(k, r.c.sammlung)), H('small', da ? TH().fundDa : TH().fundOffen)));
  }

  /** Fester Lohn als Objekte mit Menge. */
  const lohn = r => H('div.route-lohn', H('p.kicker', TH().lohn),
    H('ul.lohn-chips', r.c.lohn.map(p => H('li.lohn-chip', { 'data-rohstoff': p.id }, B().objekt(p.symbol || p.id, 26), H('span', TH().lohnPosten(p.name, p.menge))))),
    H('p.klein.route-leise', r.erledigt ? T().lohnEinmal : TH().lohnFest));

  /** Voraussetzung: erfüllt eine ruhige Zeile, sonst der Weg in höchstens drei Schritten mit dem Satz «So kommst du hin» am aktuellen Schritt. */
  function weg(k, r) {
    if (r.ok) return { el: H('p.route-bereit', B().ico('haken', 'klein.ok'), H('span', TH().bereit)), knopf: '' };
    const w = L.WeltWeg.ausBedingungen(k, r.bed, []), jetzt = w.schritte.find(s => s.aktuell);
    if (jetzt && r.hinweis) jetzt.unter = r.hinweis;
    return { el: L.WeltWeg.baue({ titel: TH().voraussetzung, ...w, aussen: true }), knopf: L.WeltWeg.knopfEl(w.knopf) };
  }

  const startKnopf = (r, tun, gross) => B().knopf({ text: r.erledigt ? T().nochEinmal : T().starten, icon: r.ok ? 'pfeil' : 'schloss', primaer: gross, gesperrt: !r.ok,
    name: `starten:${r.id}`, klick: () => (r.ok ? tun.starte(r.id) : tun.melde(r.id, r.grund)) });

  /** Eine Route: gewählt mit allen Angaben, sonst kurz (Name, Stand, was fehlt) mit Tipp zum Wählen. */
  function karte(k, r, tun, offen) {
    const feld = H('p.klein.karte-meldung', { role: 'status', 'data-meldung': r.id });
    tun.felder.set(r.id, feld);
    const klasse = `article.route-karte${offen ? '.gewaehlt' : '.kompakt'}${r.ok || r.erledigt ? '' : '.gesperrt'}`;
    if (!offen) {
      const fehlt = r.ok ? [] : r.bed.filter(b => !b.ok).slice(0, 3);
      return H(klasse, { 'data-expedition': r.id },
        H('button.route-wahl', { type: 'button', 'data-route': r.id, onclick: () => tun.waehle(r.id) }, H('span.route-punkt', { 'aria-hidden': 'true' }),
          H('span.route-zeilen', H('span.route-name', H('b', r.e.name), etikett(r)),
            fehlt.length ? fehlt.map(b => H('small.route-fehlt', b.text)) : H('small', T().expeditionText(bereich(k, r.e), r.e.umfang, zielAnteil(r.e))))),
        startKnopf(r, tun, false), feld);
    }
    // Gesperrt: der Knopf zum nächsten Schritt steht gleich unter dem Text (nicht unter der Kante), der Weg darunter
    const w = weg(k, r), fuss = w.knopf ? H('div.route-fuss.mit-weg', w.knopf, startKnopf(r, tun, false)) : H('div.route-fuss', startKnopf(r, tun, true));
    return H(klasse, { 'data-expedition': r.id }, H('div.route-kopf', H('h3.nur-vorlesen', r.e.name), etikett(r)),
      H('p.route-text', T().expeditionText(bereich(k, r.e), r.e.umfang, zielAnteil(r.e))), ...(w.knopf ? [fuss, w.el, fund(k, r), lohn(r)] : [fund(k, r), w.el, lohn(r), fuss]), feld);
  }

  /** Das Ergebnis der letzten Runde: Ziel erreicht mit Lohn, oder was fehlt. */
  function ergebnis(k, erg, tun) {
    const t = T(), e = liste(k.thema.expeditionen).find(x => x && x.id === erg.id), r = erg.r;
    if (!e || !r) return '';
    if (!r.erreicht) return H('div.kasten.hilfe.ergebnis', { role: 'status' }, H('b', t.nichtErreicht(e.name)), ` ${r.grund ? `${r.grund}. ` : ''}${t.wiederholbar}`);
    const c = L.WeltBedingungen.expedition(k, e), neu = r.lohn && r.lohn.neu, name = c.sammlung ? D().sammlungName(k, c.sammlung) : null;
    const text = neu ? t.lohnBezahlt(L.WeltBedingungen.aufzaehlung([...c.lohn.map(p => t.posten(p.name, p.menge)), ...(r.lohn.sammlung && name ? [t.sammlungKurz(name)] : [])])) : t.lohnSchonBezahlt;
    return H('div.kasten.ok.ergebnis', { role: 'status' }, H('b', t.erreicht(e.name)), ` ${t.trefferText(r.richtig, r.beurteilt, prozent(r.quote), prozent(r.ziel))} ${text}`,
      H('div.kachel-fuss', B().knopf({ text: t.zurSiedlung, icon: 'siedlung', name: 'siedlung', klick: () => tun.gehe('siedlung') })));
  }

  const lieferungen = k => { const t = T(), es = liste(k.thema.epochen); return H('div.hafen-notiz', H('div.hafen-notiz-kopf', H('b', t.lieferungen), H('span.etikett.grau', t.nochNicht)), H('p.klein', t.lieferungenText(es.length > 2 ? es[2].name : null))); };

  function zeige(huelle, ctx) {
    const k = D().kontext(), t = T();
    if (!k) { huelle.replaceChildren(H('div.seite', H('h2', t.menue.auftraege), H('div.kasten.hilfe', { role: 'status' }, t.keineWelt))); return null; }
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { info: false, zeit: true }), tag = D().heute(), regler = ctx.buehne && typeof ctx.buehne.routen === 'function' ? ctx.buehne : null;
    const z = { wahl: null, tafel: null, tot: false, erg: null };
    const routen = P().routen(k, P().vorrat(k.doc, tag), tag), da = id => routen.some(r => r.id === id), daten = ctx.daten || {};
    z.wahl = [daten.ergebnis && daten.ergebnis.id, daten.wahl].find(da) || (routen.find(r => r.ok && !r.erledigt) || routen.find(r => !r.erledigt) || routen[0] || {}).id || null;   // offene vor erledigten
    const neueTafel = () => (typeof ctx.tafel === 'function' ? sicher(() => ctx.tafel({ art: 'schmal', klasse: 'info hafen-tafel', kicker: TH().kicker, schliessen: () => tun.zu() }), null) : null);

    const tun = {
      felder: new Map(),
      gehe: (id, d) => ctx.gehe(id, d),
      melde(id, text) { const feld = tun.felder.get(id); if (feld) feld.textContent = text || ''; },
      /** Die Tafel geht zu, die Routen bleiben auf dem Wasser. Ohne Bühne führt Schliessen zurück zum Start. */
      zu() { if (!regler) { ctx.gehe('start'); return; } if (z.tafel) z.tafel.schliesse(); z.tafel = null; markiere(null); },
      waehle(id) { if (z.tot || !da(id)) return; z.wahl = id; zeichne(); },
      /** Startet die Runde. Die Zeit der Runde zählt als Übungszeit, nicht als Zeit in der Welt: der Rahmen wird vorher geschlossen. */
      async starte(id) {
        if (L.Lauf.laeuft()) return;
        const kk = D().kontext(), r = P().routen(kk, P().vorrat(kk.doc, tag), tag).find(x => x.id === id);
        if (!r || !r.ok) { tun.melde(id, r ? r.grund || r.a.grund : ''); return; }
        aufraeumen();
        if (L.Start && L.Start.entsperre) L.Start.entsperre();
        ctx.sperre(true);
        let bericht = null, ar = null;
        try {
          // Wie eine Runde des Tagesauftrags im Aufgabenrahmen (Route, Schiff, Ertrag der Runde), ohne Rahmen in einer schlichten Hülle
          ar = L.AufgabeRahmen ? sicher(() => L.AufgabeRahmen.baue({ art: 'expedition', thema: kk.thema }), null) : null;
          const laufHuelle = ar ? ar.huelle : H('div.lauf-huelle');
          if (ar) huelle.classList.add('mit-rahmen');
          huelle.replaceChildren(ar ? ar.el : laufHuelle);
          bericht = await L.Lauf.start({ art: 'expedition', plan: { heute: tag, eintraege: r.a.eintraege, ziel: r.e.ziel }, huelle: laufHuelle, beobachter: ar ? ar.beobachter : null });
        } catch (fehler) { melde(fehler); } finally {
          if (ar) { sicher(() => ar.zerstoere()); huelle.classList.remove('mit-rahmen'); }
          ctx.sperre(false);
        }
        const erg = bericht ? P().bewerte(kk.thema, id, bericht, tag) : null;
        L.Huelle.aktualisiere();
        ctx.gehe('auftraege', { ergebnis: { id, r: erg } });
      }
    };

    /** Hebt die gewählte Route auch auf dem Wasser hervor. */
    function markiere(id) {
      if (regler && typeof regler.waehleRoute === 'function') { sicher(() => regler.waehleRoute(id)); return; }
      const el = regler && regler.el;
      if (el && typeof el.querySelectorAll === 'function') el.querySelectorAll('.bn-route').forEach(m => m.classList.toggle('gewaehlt', m.getAttribute('data-route') === id));
    }
    function zeichne() {
      const r0 = routen.find(r => r.id === z.wahl), andere = routen.filter(r => r !== r0);
      if (!z.tafel && !z.ohneTafel) { z.tafel = neueTafel(); if (!z.tafel) z.ohneTafel = true; }
      tun.felder.clear();
      const inhalt = H('div.auftraege', z.erg || '', r0 ? karte(k, r0, tun, true) : H('p.klein', t.keineExpeditionen),
        andere.length ? [H('p.kicker.route-weitere', TH().weitere), H('div.route-liste', andere.map(r => karte(k, r, tun, false)))] : '', lieferungen(k));
      if (z.tafel) { z.tafel.rumpf.replaceChildren(inhalt); z.tafel.rumpf.scrollTop = 0; z.tafel.setzeTitel(TH().kicker, r0 ? r0.e.name : TH().titel); } else rahmen.seite.replaceChildren(inhalt);
      markiere(z.wahl);
    }
    function aufraeumen() {
      if (z.tot) return;
      z.tot = true;
      if (regler) sicher(() => regler.routen([]));
      if (z.tafel) z.tafel.schliesse();
      z.tafel = null;
      rahmen.schliesse();
    }

    /** Der neue Lohn fliegt als Objekte zu den Pillen, dort springt die Plakette ab. Nur im Browser, die Eingabe bleibt frei. */
    function ertragFlug(r, erg) {
      if (!r || !erg || !erg.lohn || !erg.lohn.neu || typeof g.requestAnimationFrame !== 'function' || !ctx.effekte || !ctx.hud) return;
      g.setTimeout(() => {
        if (z.tot || !z.tafel) return;
        sicher(() => ctx.klang.spiele('sammeln'));
        for (const p of r.c.lohn) {
          const von = z.tafel.el.querySelector(`.gewaehlt .lohn-chip[data-rohstoff="${p.id}"]`), nach = ctx.hud.pille(p.id);
          if (!von || !nach) continue;
          Promise.resolve(ctx.effekte.flug({ von, nach, anzahl: Math.min(5, p.menge), bahn: 'gasse', inhalt: () => L.Iso.objekt(p.symbol || p.id, { groesse: 26 }) }))
            .then(() => ctx.hud.plakette(p.id, `+${p.menge}`, { art: 'plus' })).catch(() => {});
        }
      }, 420);
    }

    rahmen.leiste(k); rahmen.ziel(k);
    if (daten.ergebnis) z.erg = ergebnis(k, daten.ergebnis, tun);
    zeichne();
    if (z.tafel && rahmen.seite.parentNode === huelle) huelle.replaceChildren();          // die Ansicht bleibt leer: die Insel ist die Bühne, die Tafel trägt den Inhalt
    if (regler) sicher(() => regler.routen(fahnen(routen), id => { if (!z.tafel && !z.tot) z.ohneTafel = false; tun.waehle(id); }, { gewaehlt: z.wahl }));
    markiere(z.wahl);
    if (daten.ergebnis) ertragFlug(routen.find(r => r.id === daten.ergebnis.id), daten.ergebnis.r);
    return { tun, routen, schliesse: aufraeumen };
  }

  L.Ansichten.auftraege = { id: 'auftraege', get titel() { return L.Texte.welt.menue.auftraege; }, icon: 'auftraege', dock: 50,
    buehne: { kamera: 'hafen', schleier: 'keine', marken: 'keine' }, zeige };
})(globalThis);
