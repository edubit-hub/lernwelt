/* app/ansichten/logbuch.js: die Ansicht «Logbuch» (Architektur 7.8, Mockup docs/mockup/siedlung.html, AP-16). Das Kind sieht, wie es sich entwickelt, und zwar nur gegen sich selbst:
   Aufgaben, Treffer im ersten Versuch, Übungszeit und neue Aufgaben der letzten sieben Tage als Minidiagramme (mit den sieben Tagen davor als Vergleich), den Wissensstand je Bereich,
   Bestwerte und die Sammlung mit Plaketten. Es gibt keine Rangliste, keine Serie von Tagen und keinen Vergleich mit anderen. Die Ansicht liest nur (WeltDaten, LogbuchDaten). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten, LD = () => L.LogbuchDaten, G = () => L.LogbuchGrafik, K = () => L.LogbuchKacheln;

  /** Die vier Kacheln der Woche. w: LogbuchDaten.wochen. Gibt die Kacheln (stat) in der Reihenfolge der Ansicht zurück. */
  function wochenKacheln(w) {
    const t = T(), k = K(), gr = G(), davor = x => t.davor(x), spanne = f => Math.max(...w.vorTage.map(f));
    const serie = (f, einheit) => w.tage.map(r => ({ kurz: r.kurz, wert: f(r), txt: k.ablesung(r, f(r), einheit) }));
    const reihe = (id, titel, gross, klein, vergleich, svg, daten) => k.stat({ id, titel, gross, klein, vergleich, svg, texte: daten.map(x => x.txt) });
    const aufgaben = serie(r => r.aufgaben, t.einheitAufgaben), treffer = serie(r => r.treffer, '%'), zeit = serie(r => r.zeit, t.einheitMinuten), neu = serie(r => r.neu, t.einheitNeu);
    const tr = w.jetzt.treffer, tv = w.davor.treffer;
    return [reihe('aufgaben', t.kAufgaben, String(w.jetzt.aufgaben), '', davor(String(w.davor.aufgaben)), gr.saeulen(t.kAufgaben, aufgaben, Math.max(10, spanne(r => r.aufgaben))), aufgaben),
      reihe('treffer', t.kTreffer, tr === null ? '–' : String(tr), tr === null ? '' : '%', tv === null ? t.davorKein : davor(`${tv} %`), gr.linie(t.kTreffer, treffer), treffer),
      reihe('zeit', t.kZeit, String(w.jetzt.zeit), t.einheitMinuten, davor(`${w.davor.zeit} ${t.einheitMinuten}`), gr.saeulen(t.kZeit, zeit, Math.max(10, spanne(r => r.zeit))), zeit),
      reihe('neu', t.kNeu, String(w.jetzt.neu), '', davor(String(w.davor.neu)), gr.saeulen(t.kNeu, neu, Math.max(5, spanne(r => r.neu))), neu)];
  }

  function zeige(huelle, ctx) {
    const doc = L.Zustand.hole(), k = D().kontext(doc), heute = D().heute(), t = T(), ld = LD();
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { info: false, zeit: true });
    if (k) { rahmen.leiste(k); rahmen.ziel(k); }
    const w = ld.wochen(doc, heute), wk = wochenKacheln(w), gruppen = ld.wissen(doc), best = ld.bestwerte(doc, heute), plaketten = ld.plaketten(doc);
    const fund = k ? ld.fundstuecke(k.thema, k.ledger) : [], kk = L.LogbuchKacheln;
    rahmen.seite.append(H('div.logbuch', H('div.kopf', H('h2', t.menue.logbuch), H('span', t.logbuchUnterzeile)), w.hatTage ? '' : H('p.klein.leer-hinweis', t.nochKeineTage),
      H('div.log-raster', wk.map(x => x.el), kk.wissen(gruppen), kk.best(best, heute), kk.sammlung(plaketten, fund))));
    return {
      daten: { wochen: w, wissen: gruppen, bestwerte: best, plaketten, fundstuecke: fund },
      /** Zeigt den Wert des Tages i (0 bis 6, 6 ist heute) in der Ablesung der Kachel. id: aufgaben, treffer, zeit oder neu. */
      lies(id, i) { const x = wk.find(y => y.el.getAttribute('data-kachel') === id); if (x) x.lies(i); },
      schliesse: rahmen.schliesse
    };
  }

  L.Ansichten.logbuch = { id: 'logbuch', get titel() { return L.Texte.welt.menue.logbuch; }, icon: 'logbuch', menue: 60, zeige };
})(globalThis);
