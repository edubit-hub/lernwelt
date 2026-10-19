/* app/ansichten/siedlung-hinweise.js: was die Siedlung auf der Bühne selbst zeigt, statt es als Satzliste zu schreiben (Nachbesserung 1 zu
   docs/gestaltung-umbau.md 2.9): warme Pfeile an Plätzen, auf denen jetzt etwas geht, und ein kurzer Lichtpuls mit Klang, wenn ein Bauplatz aufgegangen ist.
     SiedlungHinweise.pfeile(k, moeglich) → [{ platz, text }]      SiedlungHinweise.freischaltung(buehne, ctx) → Anzahl aufgegangener Plätze
   Liest nur über WeltDaten und Welt.plaetze, schreibt nichts. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const D = () => L.WeltDaten, S = () => L.Texte.siedlungsseite;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };

  /** Gebaute Gebäude, deren Ausbau jetzt geht, und ein freier Platz, wenn sich ein neues Gebäude bauen lässt. */
  function pfeile(k, mg) {
    const platzVon = id => (k.stand.platz ? k.stand.platz[id] : undefined), name = id => ((k.thema.bauteile || {})[id] || {}).name || id, aus = [];
    for (const id of D().ausbauIds(k)) if (Number.isInteger(platzVon(id))) aus.push({ platz: platzVon(id), text: S().pfeilAusbau(name(id)) });
    const neu = (mg || []).find(x => x.art === 'b' && D().stufe(k, x.ziel) < 1), fr = L.Welt.plaetze(k.thema, k.stand).frei[0];
    if (neu && fr !== undefined) aus.push({ platz: fr, text: S().pfeilBauen(name(neu.ziel)) });
    return aus;
  }

  /** Ist seit dem letzten Besuch ein Bauplatz aufgegangen (neue Epoche), leuchtet er kurz warm auf. Klang «tor» für eine neue Epoche
      (mehrere Plätze zugleich), sonst «freischalten». Nie blockierend. */
  function freischaltung(b, ctx) {
    if (!b || typeof b.offenNeu !== 'function') return 0;
    const neu = sicher(() => b.offenNeu(), []) || [], E = ctx.effekte;
    if (!neu.length) return 0;
    if (ctx.klang) sicher(() => ctx.klang.spiele(neu.length > 1 ? 'tor' : 'freischalten'));
    for (const nr of neu.slice(0, 4)) {
      const ort = sicher(() => b.ort(nr), null), p = ort && sicher(() => b.zuSchirm(ort), null);
      if (p && E && typeof E.puls === 'function') sicher(() => E.puls(p, { warm: true }));
    }
    return neu.length;
  }

  L.SiedlungHinweise = { pfeile, freischaltung };
})(globalThis);
