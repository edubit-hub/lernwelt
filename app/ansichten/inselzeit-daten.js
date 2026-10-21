/* app/ansichten/inselzeit-daten.js: die Zeit der Inselzeit (E-2110-01): höchstens zwei Minuten am Tag, erst nach dem Tagesauftrag.
     InselzeitDaten.rest(doc) → Sekunden, die heute noch bleiben (0 bis SEKUNDEN)
     InselzeitDaten.offen(Z, t) → true, wenn die Fachinseln laufen, heute geübt wurde, der Tagesauftrag erledigt ist und noch Zeit bleibt
       (t: der Tagesauftrag, wenn ihn die Ansicht schon geplant hat, sonst plant ihn offen selbst)
     InselzeitDaten.buche(sekunden, Z) → zählt die Sekunden in zustand.welt.<id>.inselzeit = { tag, sekunden } und als Zeit in der Welt
       (tage[heute].weltMin), damit der Hinweis im Elternbereich sie mitzählt (Schutzregel 7, weltregeln.weltzeit).
   Die Zeit ist eine feste Länge am Tag und keine Belohnung (docs/gestaltung.md G16): wer mehr übt, bekommt nicht mehr davon. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const SEKUNDEN = 120;
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const weltId = () => (L.Start && L.Start.welt ? L.Start.welt.id : null);

  /** Heute schon verbrauchte Sekunden */
  function verbraucht(doc) {
    const d = doc || L.Zustand.hole(), id = weltId(), w = id && objekt(d.welt) && objekt(d.welt[id]) ? d.welt[id].inselzeit : null;
    return objekt(w) && w.tag === L.Lernplan.heute(d) && Number.isFinite(w.sekunden) ? Math.max(0, w.sekunden) : 0;
  }
  const rest = doc => Math.max(0, SEKUNDEN - verbraucht(doc));

  function offen(Z = L.Zustand, t) {
    try {
      if (!L.InselDaten || !L.InselDaten.aktiv()) return false;
      const a = t || L.Lernplan.tagesauftrag(Z);
      return !!a && !a.keinModul && a.erledigt === true && a.gemacht.aufgaben > 0 && rest(Z.hole()) > 0;
    } catch (e) { return false; }
  }

  function buche(sekunden, Z = L.Zustand) {
    const s = Math.round(sekunden), id = weltId();
    if (!id || !(s > 0)) return false;
    Z.aendere(d => {
      const tag = L.Lernplan.heute(d), alt = objekt(d.welt) && objekt(d.welt[id]) ? d.welt[id] : {};
      const vorher = objekt(alt.inselzeit) && alt.inselzeit.tag === tag && Number.isFinite(alt.inselzeit.sekunden) ? alt.inselzeit.sekunden : 0;
      d.welt = d.welt || {}; d.welt[id] = { ...alt, inselzeit: { tag, sekunden: vorher + s } };
      d.tage = d.tage || {}; d.tage[tag] = L.Statistik.tag(d.tage[tag], { weltMin: s / 60 });
    });
    return true;
  }

  L.InselzeitDaten = { SEKUNDEN, verbraucht, rest, offen, buche };
})(globalThis);
