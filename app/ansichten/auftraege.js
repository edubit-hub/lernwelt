/* app/ansichten/auftraege.js: die Ansicht «Aufträge» (Architektur 6.4, 7.2 und 7.8, Mockup docs/mockup/siedlung.html, AP-16).
   Jede Expedition steht als Karte da: Ziel, Umfang, Voraussetzung und fester Lohn, vorher sichtbar. «Starten» ruft Lauf.start({ art: 'expedition' }) auf, danach wertet
   Expedition.bewerte die Runde aus (auftraege-plan.js). Fehlt etwas, bleibt der Knopf antippbar und die Karte nennt, was: «Wissen im Bereich mathe.zahl: 1 von 2».
   Aufträge der Siedlung (Lieferungen von Gütern) gibt es in der Engine noch nicht, die Ansicht sagt das offen (docs/vertragsaenderungen.md, V-AP16-06).
   ctx.daten: { ergebnis: { id, r } } zeigt nach einer Runde, was sie gebracht hat. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine, P = () => L.AuftraegePlan;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const prozent = q => `${Math.round(q * 100)} %`;
  const expeditionen = k => (Array.isArray(k.thema.expeditionen) ? k.thema.expeditionen : []);

  /** Der Weg zum Start einer gesperrten Expedition: was zu üben ist (Epoche, Wissen im Bereich oder geübte Aufgaben), sonst ein leerer Text. */
  function hinweis(k, e, c, a) {
    const t = T();
    if (c.plan.code === 'epoche') { const ep = D().epoche(k, e.epoche), tor = ep && D().knoten(k, ep.tor); return t.soEpoche(tor ? tor.name : null); }
    if (c.plan.code === 'wissen') {
      const w = D().wissenStand(k, { bereich: e.braucht.bereich, wissen: e.braucht.wissen })[0];
      return t.soWissen(D().bereichName(e.braucht.bereich), D().bereichModule(e.braucht.bereich), w.braucht - w.hat);
    }
    return a.ok ? '' : t.soGeuebt(Math.max(1, e.umfang - a.verfuegbar));
  }

  /** Die Karte einer Expedition. meldungen: Map ID → Textfeld der Karte, tun.melde und tun.starte bedienen sie. */
  function karte(k, e, pool, tag, tun, meldungen) {
    const t = T(), c = C().expedition(k, e), a = P().aufgaben(pool, e, tag), ok = c.plan.ok && a.ok, erledigt = c.plan.erledigt;
    const bed = [...c.bedingungen, { ok: a.ok, text: t.geuebt(Math.min(a.verfuegbar, e.umfang), e.umfang), fehlt: t.geuebtFehlt(a.verfuegbar, e.umfang) }];
    const grund = C().grundText(bed, []), name = c.sammlung ? D().sammlungName(k, c.sammlung) : null, feld = H('p.klein.karte-meldung', { role: 'status', 'data-meldung': e.id });
    meldungen.set(e.id, feld);
    const bereich = e.braucht && e.braucht.bereich ? D().bereichModule(e.braucht.bereich).join(', ') || D().bereichName(e.braucht.bereich) : t.alleModule;
    return H(`article.kachel${ok || erledigt ? '' : '.gesperrt'}`, { 'data-expedition': e.id },
      H('div.kachel-kopf', H('h3', e.name), H(`span.etikett${ok || erledigt ? '' : '.grau'}`, erledigt ? t.erledigtAm(D().datum(c.plan.erledigt)) : ok ? t.bereit : t.gesperrt)),
      H('p', t.expeditionText(bereich, e.umfang, prozent(e.ziel))), B().bedingungsListe(bed), ok || erledigt ? '' : H('p.klein.weg', hinweis(k, e, c, a)),
      H('div.lohn', H('div.klein', t.lohn), B().kostenListe(c.lohn, { ohneVorrat: true }),
        name ? H('ul.liste', H('li.zeile', B().ico('logbuch'), H('span.menge', t.sammlungLohn(name)))) : ''), erledigt ? H('p.klein', t.lohnEinmal) : '',
      H('div.kachel-fuss', B().knopf({ text: erledigt ? t.nochEinmal : t.starten, icon: ok ? 'pfeil' : 'schloss', primaer: true, gesperrt: !ok, name: `starten:${e.id}`,
        klick: () => (ok ? tun.starte(e.id) : tun.melde(e.id, grund)) })), feld);
  }

  /** Das Ergebnis der letzten Runde: Ziel erreicht mit Lohn, oder was fehlt. */
  function ergebnis(k, erg, tun) {
    const t = T(), e = expeditionen(k).find(x => x.id === erg.id), r = erg.r;
    if (!e || !r) return '';
    if (!r.erreicht) return H('div.kasten.hilfe.ergebnis', { role: 'status' }, H('b', t.nichtErreicht(e.name)), ` ${r.grund ? `${r.grund}. ` : ''}${t.wiederholbar}`);
    const c = C().expedition(k, e), neu = r.lohn && r.lohn.neu, name = c.sammlung ? D().sammlungName(k, c.sammlung) : null;
    const lohn = neu ? t.lohnBezahlt(C().aufzaehlung([...c.lohn.map(p => t.posten(p.name, p.menge)), ...(r.lohn.sammlung && name ? [t.sammlungKurz(name)] : [])])) : t.lohnSchonBezahlt;
    return H('div.kasten.ok.ergebnis', { role: 'status' }, H('b', t.erreicht(e.name)), ` ${t.trefferText(r.richtig, r.beurteilt, prozent(r.quote), prozent(r.ziel))} ${lohn}`,
      H('div.kachel-fuss', B().knopf({ text: t.zurSiedlung, icon: 'siedlung', name: 'siedlung', klick: () => tun.gehe('siedlung') })));
  }

  function zeige(huelle, ctx) {
    const k = D().kontext(), t = T();
    if (!k) { huelle.replaceChildren(H('div.seite', H('h2', t.menue.auftraege), H('div.kasten.hilfe', { role: 'status' }, t.keineWelt))); return null; }
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { info: false, zeit: true }), meldungen = new Map(), tag = D().heute(), liste = expeditionen(k);
    const es = Array.isArray(k.thema.epochen) ? k.thema.epochen : [];
    const tun = {
      gehe: (id, daten) => ctx.gehe(id, daten),
      melde(id, text) { const feld = meldungen.get(id); if (feld) feld.textContent = text || ''; },
      /** Startet die Runde. Die Zeit der Runde zählt als Übungszeit, nicht als Zeit in der Welt: der Rahmen wird vorher geschlossen. */
      async starte(id) {
        if (L.Lauf.laeuft()) return;
        const kk = D().kontext(), e = expeditionen(kk).find(x => x.id === id), c = C().expedition(kk, e), a = P().aufgaben(P().vorrat(kk.doc, tag), e, tag);
        if (!c.plan.ok || !a.ok) { tun.melde(id, c.plan.ok ? a.grund : C().grundText(c.bedingungen, [])); return; }
        rahmen.schliesse();
        if (L.Start && L.Start.entsperre) L.Start.entsperre();
        ctx.sperre(true);
        let bericht = null;
        try {
          const laufHuelle = H('div.lauf-huelle');
          huelle.replaceChildren(laufHuelle);
          bericht = await L.Lauf.start({ art: 'expedition', plan: { heute: tag, eintraege: a.eintraege, ziel: e.ziel }, huelle: laufHuelle });
        } catch (fehler) { melde(fehler); } finally { ctx.sperre(false); }
        const r = bericht ? P().bewerte(kk.thema, id, bericht, tag) : null;
        L.Huelle.aktualisiere();
        ctx.gehe('auftraege', { ergebnis: { id, r } });
      }
    };
    const pool = P().vorrat(k.doc, tag);
    rahmen.leiste(k); rahmen.ziel(k);
    rahmen.seite.append(H('div.seite.auftraege', H('h2', t.menue.auftraege), H('p.unterzeile', t.auftraegeUnterzeile), ctx.daten.ergebnis ? ergebnis(k, ctx.daten.ergebnis, tun) : '',
      H('h3.abschnitt-titel', t.expeditionen), liste.length ? H('div.kacheln', liste.map(e => karte(k, e, pool, tag, tun, meldungen))) : H('p.klein', t.keineExpeditionen),
      H('h3.abschnitt-titel', t.siedlungsauftraege), H('article.kachel.gesperrt', H('div.kachel-kopf', H('h3', t.lieferungen), H('span.etikett.grau', t.nochNicht)), H('p', t.lieferungenText(es.length > 2 ? es[2].name : null)))));
    return { tun, schliesse: rahmen.schliesse };
  }

  L.Ansichten.auftraege = { id: 'auftraege', get titel() { return L.Texte.welt.menue.auftraege; }, icon: 'auftraege', menue: 50, zeige };
})(globalThis);
