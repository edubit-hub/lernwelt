/* app/ansichten/start-orte.js: was die Ortsschilder auf der Insel in der Startansicht sagen (Nachbesserung 1 zu docs/gestaltung-umbau.md 2.2).
   Die Insel trägt Information und lädt zum Antippen ein: Forschung mit einem bereiten Knoten (warm), Tor mit dem Stand (Wissen, fehlendes Material
   oder bereit), Hafen mit einer bereiten Expedition, Siedlung mit «Ausbau möglich» oder «Bauen möglich». Liest nur (WeltDaten, WeltBedingungen).
     StartOrte.zusaetze(k) → { forschung?, tor?, hafen?, siedlung? } je { zusatz, warm }      StartOrte.setze(buehne, k) */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const D = () => L.WeltDaten, C = () => L.WeltBedingungen, T = () => L.Texte.startseite;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const liste = x => (Array.isArray(x) ? x : []);

  /** Ein offener Forschungsknoten, für den Wissen und Material reichen (ohne das Tor, das sein eigenes Schild hat). */
  function bereiterKnoten(k) {
    const tore = new Set(liste(k.thema.epochen).map(e => e.tor));
    return liste(k.thema.forschung).find(f => !tore.has(f.id) && !D().erforscht(k, f.id) && L.Welt.epocheOffen(k.thema, k.stand, f.epoche)
      && D().wissenStand(k, f).every(w => w.ok) && !D().posten(k, f.kosten).some(p => p.fehlt > 0)) || null;
  }

  function zusaetze(k) {
    const aus = {}, t = T();
    const f = sicher(() => bereiterKnoten(k), null);
    if (f) aus.forschung = { zusatz: t.schildBereit(f.name), warm: true };
    const tor = sicher(() => D().epocheStand(k).tor, null);
    if (tor) aus.tor = tor.zustand === 'bereit' ? { zusatz: t.schildTorBereit, warm: true } : tor.zustand === 'material' ? { zusatz: D().standText(tor.fehlt) } : { zusatz: t.schildWissen(Math.min(tor.hat, tor.braucht), tor.braucht) };
    const fertig = (k.ledger && k.ledger.expeditionen) || {};
    const exp = sicher(() => liste(k.thema.expeditionen).filter(e => !fertig[e.id] && C().expedition(k, e).plan.ok).length, 0);
    if (exp) aus.hafen = { zusatz: t.schildExpedition(exp), warm: true };
    const ausbau = sicher(() => D().ausbauIds(k).length, 0), bauen = sicher(() => D().moeglich(k).some(x => x.art === 'b' && D().stufe(k, x.ziel) < 1), false);
    if (ausbau || bauen) aus.siedlung = { zusatz: ausbau ? t.schildAusbau : t.schildBauen, warm: false };
    return aus;
  }

  /** Setzt die Zusätze an die Schilder der Bühne; Schilder ohne Zusatz werden ruhig. */
  function setze(b, k) {
    if (!b || typeof b.schild !== 'function' || !k) return;
    const z = sicher(() => zusaetze(k), {});
    for (const id of ['forschung', 'tor', 'hafen', 'siedlung']) sicher(() => b.schild(id, z[id] || {}));
  }

  L.StartOrte = { zusaetze, setze, bereiterKnoten };
})(globalThis);
