/* app/welt/expedition.js: Expeditionen (Architektur 7.2 und 7.5). Eine Expedition ist eine freiwillige gemischte Wiederholung mit
   Zielwert (Treffer im ersten Versuch) und festem, vorher sichtbarem Lohn. Nie Zufall, nie Wartezeit.
   plan(ledger, welt, thema, id)   → { ok, id, name, epoche, bereich, umfang, ziel, lohn: { rohstoffe, sammlung }, erledigt, lohnOffen }
                                      oder { ok: false, code, grund }. Sagt, was der Lauf braucht (Bereich, Umfang) und ob sie offen ist.
   bewerte(ledger, welt, thema, id, ergebnisse, heute) → { ok, erreicht, beurteilt, richtig, quote, ziel, lohn, grund }
                                      ergebnisse: Liste von { urteil, nachfassen? } aus dem Bericht des Laufs. Ein Treffer ist urteil
                                      «richtig» im ersten Versuch (nicht mit Hilfe, nicht beim Nachfassen). «gezeigt» und Nachfassen zählen nicht.
                                      Der Lohn wird je Expedition einmal bezahlt, über Ledger.verbucheExpedition. Eine Wiederholung bleibt
                                      möglich, bringt aber keinen zweiten Lohn (lohnOffen ist dann falsch, bewerte liefert wiederholung: true). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const eigen = (o, k) => (objekt(o) && Object.hasOwn(o, k) ? o[k] : undefined);
  const zaehlt = ['richtig', 'hilfe', 'falsch'];
  const prozent = q => `${Math.round(q * 100)} %`;
  const finde = (thema, id) => (Array.isArray(thema.expeditionen) ? thema.expeditionen : []).find(e => e.id === id);

  function plan(ledger, welt, thema, id) {
    const e = finde(thema, id);
    if (!e) return { ok: false, code: 'unbekannt', grund: 'Unbekannte Expedition', id };
    const lohn = objekt(e.belohnung) ? e.belohnung : {}, erledigt = eigen(ledger && ledger.expeditionen, id) || null;
    const aus = { ok: true, id, name: e.name, epoche: e.epoche, bereich: e.braucht ? e.braucht.bereich : null, umfang: e.umfang, ziel: e.ziel,
      lohn: { rohstoffe: { ...(objekt(lohn.rohstoffe) ? lohn.rohstoffe : {}) }, sammlung: lohn.sammlung ?? null }, erledigt, lohnOffen: !erledigt };
    if (!L.Welt.epocheOffen(thema, welt, e.epoche)) {
      const ep = (thema.epochen || []).find(x => x.id === e.epoche);
      return { ...aus, ok: false, code: 'epoche', grund: `Epoche «${ep ? ep.name : e.epoche}» ist noch nicht offen` };
    }
    if (e.braucht && e.braucht.bereich) {
      const hat = eigen(ledger && ledger.wissen, e.braucht.bereich) || 0, soll = e.braucht.wissen ?? 0;
      if (hat < soll) return { ...aus, ok: false, code: 'wissen', grund: `Wissen im Bereich ${e.braucht.bereich}: ${hat} von ${soll}` };
    }
    return aus;
  }

  function bewerte(ledger, welt, thema, id, ergebnisse, heute) {
    const p = plan(ledger, welt, thema, id);
    if (!p.ok) return p;
    const gezaehlt = (Array.isArray(ergebnisse) ? ergebnisse : []).filter(x => objekt(x) && !x.nachfassen && zaehlt.includes(x.urteil));
    const n = gezaehlt.length, richtig = gezaehlt.filter(x => x.urteil === 'richtig').length, quote = n ? richtig / n : 0;
    const aus = { ok: true, id, umfang: p.umfang, ziel: p.ziel, beurteilt: n, richtig, quote, erreicht: false, lohn: null };
    if (n < p.umfang) return { ...aus, grund: `Erst ${n} von ${p.umfang} Aufgaben gelöst` };
    if (quote < p.ziel - 1e-9) return { ...aus, grund: `Ziel nicht erreicht: ${prozent(quote)} von ${prozent(p.ziel)}` };
    aus.erreicht = true;
    if (!p.lohnOffen) return { ...aus, wiederholung: true };
    const fach = {};                                                     // Das Buch kennt Fächer, das Thema ordnet den Rohstoff dem Fach zu
    for (const [r, menge] of Object.entries(p.lohn.rohstoffe)) {
      const def = eigen(thema.rohstoffe, r);
      if (def && def.fach) fach[def.fach] = (fach[def.fach] || 0) + menge;
    }
    const tag = L.Tag.gueltig(heute) ? heute : L.Tag.heute();
    aus.lohn = L.Ledger.verbucheExpedition(ledger, { id, rohstoffe: fach, sammlung: p.lohn.sammlung }, tag);
    return aus;
  }

  L.Expedition = { plan, bewerte };
})(globalThis);
