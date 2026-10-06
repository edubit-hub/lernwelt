/* app/ansichten/auftraege-plan.js: die Aufgaben einer Expedition und die Auswertung nach dem Lauf (Architektur 6.4, 7.2 und 7.8, AP-16). Kein DOM.
   Eine Expedition ist eine freiwillige, gemischte Wiederholung schon geübter Aufgaben im Bereich der Expedition. Die Auswahl ist reproduzierbar (Startwert aus
   Expedition und Tag), der Lohn nie zufällig. Gibt es weniger geübte Aufgaben als der Umfang, startet die Expedition nicht und der Text sagt, wie viele fehlen.
   Der Lohn wird nur über Expedition.bewerte gebucht, im Rückruf von Zustand.aendere (je Expedition einmal, eine Wiederholung bleibt möglich). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const bereichVon = modulId => { const m = L.registry.module.get(modulId); return m ? m.bereich : null; };

  /** Alle schon geübten Aufgaben der aktiven Module als { key, thema, bereich }: der Vorrat, aus dem jede Expedition wählt. Neues gehört nicht in eine Wiederholung. */
  const vorrat = (doc, tag) => L.Lernplan.kandidaten(doc, tag).kandidaten.filter(x => !x.neu).map(x => ({ key: x.key, thema: x.thema, bereich: bereichVon(x.modul) }));

  /** Aufgaben für Lauf.start: { ok, verfuegbar, umfang, eintraege: [{ key, grund }], grund }. Gemischt, damit nie zwei Aufgaben desselben Themas nebeneinander stehen. */
  function aufgaben(pool, e, tag) {
    const bereich = e.braucht && e.braucht.bereich, passend = pool.filter(x => !bereich || x.bereich === bereich);
    const rng = L.Zufall.aus(['expedition', e.id, tag].join('|')), ok = passend.length >= e.umfang;
    const gewaehlt = ok ? L.Sitzung.mischen(rng.mische(passend).slice(0, e.umfang), rng) : [];
    return { ok, verfuegbar: passend.length, umfang: e.umfang, eintraege: gewaehlt.map(x => ({ key: x.key, grund: 'extra' })), grund: ok ? '' : L.Texte.welt.zuWenigGeuebt(passend.length, e.umfang) };
  }

  /** Wertet die Runde aus und bucht den Lohn. Gibt das Ergebnis von Expedition.bewerte zurück: { ok, erreicht, beurteilt, richtig, quote, ziel, lohn, wiederholung, grund }. */
  function bewerte(thema, id, bericht, tag) {
    let r = { ok: false, erreicht: false, grund: '' };
    L.Zustand.aendere(z => {
      if (!objekt(z.ledger)) z.ledger = L.Ledger.leer();
      r = L.Expedition.bewerte(z.ledger, L.Welt.stand(z, thema.id), thema, id, bericht && bericht.ergebnisse, tag);
    });
    return r;
  }

  L.AuftraegePlan = { vorrat, aufgaben, bewerte };
})(globalThis);
