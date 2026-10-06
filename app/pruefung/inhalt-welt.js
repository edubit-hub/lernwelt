/* app/pruefung/inhalt-welt.js: Prüfung eines Welt-Thema (Teil von inhalt.js, Architektur 7.5 und 9.4): Aufbau, Budget aus weltregeln.budget,
   ein Rohstoff für jedes Fach der Module, alle Texte vorhanden, Verweise innerhalb des Themas gültig.
   Lernwelt.Pruefung.pruefeWelt(welt, ctx) → [{ stufe: 'fehler', ort, text, regel }], alles sind Fehler (Regel «welt», Eszett: «eszett»).
   ctx: { faecher (Fächer der aktiven Module, Standard: alle Fächer der registrierten Module), budget (Standard: weltregeln.budget) }.
   Die Datei hängt beim Laden von keiner anderen ab. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const P = (L.Pruefung = L.Pruefung || {});

  const FAECHER = ['mathe', 'deutsch', 'englisch', 'nmg'];
  const BEREICH = /^[a-z0-9]+\.[a-z0-9][a-z0-9-]*$/;
  const text = v => typeof v === 'string' && v.trim() !== '';
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const zahl = v => typeof v === 'number' && Number.isFinite(v);

  /** Einträge als [id, objekt]: Objekte nach Schlüssel (rohstoffe, rezepte, bauteile), Listen nach Feld id (epochen, forschung ...). */
  const paare = x => (Array.isArray(x) ? x.map(o => [objekt(o) ? o.id : undefined, o]) : objekt(x) ? Object.entries(x) : []);

  function pruefeWelt(welt, ctx = {}) {
    const R = [], f = (ort, t, regel = 'welt') => R.push({ stufe: 'fehler', ort, text: t, regel });
    if (!objekt(welt)) { f('welt', 'Das Welt-Thema ist kein Objekt'); return R; }
    const B = ctx.budget || (L.weltregeln && L.weltregeln.budget) || {};
    const module = L.registry ? [...L.registry.module.values()] : [];
    const faecher = ctx.faecher || [...new Set(module.map(m => m.fach))];

    if (!text(welt.id) || !P.ID.test(welt.id)) f('id', `«${welt.id}» passt nicht zum Muster ${P.ID}`);
    if (!text(welt.titel)) f('titel', 'Text fehlt');
    for (const feld of ['epochen', 'rohstoffe', 'bauteile']) if (!paare(welt[feld]).length) f(feld, 'fehlt oder ist leer');
    for (const feld of ['rezepte', 'forschung', 'expeditionen', 'sammlung']) if (welt[feld] !== undefined && !Array.isArray(welt[feld]) && !objekt(welt[feld])) f(feld, 'Liste oder Objekt erwartet');

    const gruppen = Object.fromEntries(['epochen', 'rohstoffe', 'rezepte', 'bauteile', 'forschung', 'expeditionen', 'sammlung'].map(n => [n, paare(welt[n])]));
    const ids = Object.fromEntries(Object.entries(gruppen).map(([n, liste]) => [n, new Set(liste.map(([id]) => id))]));
    for (const [gruppe, liste] of Object.entries(gruppen)) {            // jeder Eintrag: ID, Name als Text, keine ID doppelt
      const gesehen = new Set();
      for (const [id, o] of liste) {
        const ort = `${gruppe}.${id}`;
        if (!text(id)) { f(gruppe, 'ein Eintrag ohne id'); continue; }
        if (gesehen.has(id)) f(ort, 'ID doppelt');
        gesehen.add(id);
        if (!objekt(o)) f(ort, 'Objekt erwartet');
        else if (!text(o.name)) f(`${ort}.name`, 'Text fehlt');
      }
    }

    const bezahlbar = new Set([...ids.rohstoffe, ...ids.rezepte]);        // womit sich bezahlen lässt: Rohstoffe und Güter
    const betrag = (ort, o) => {
      if (!objekt(o) || !Object.keys(o).length) { f(ort, 'Objekt mit mindestens einem Posten erwartet'); return; }
      for (const [k, n] of Object.entries(o)) {
        if (!bezahlbar.has(k)) f(ort, `«${k}» ist weder Rohstoff noch Gut dieses Themas`);
        if (!zahl(n) || n <= 0) f(ort, `Menge von «${k}» muss eine Zahl über 0 sein`);
      }
    };

    // Budget (7.5): schützt die Pflegezeit
    const hoechstens = (ort, n, max, was) => { if (typeof max === 'number' && n > max) f(ort, `${n} ${was}, erlaubt sind höchstens ${max}`); };
    hoechstens('epochen', gruppen.epochen.length, B.epochen, 'Epochen');
    hoechstens('bauteile', gruppen.bauteile.length, B.gebaeudeArtenGesamt, 'Gebäudearten');
    hoechstens('rezepte', gruppen.rezepte.length, B.rezepte, 'Rezepte');
    hoechstens('forschung', gruppen.forschung.length, B.forschungsknoten, 'Forschungsknoten');
    hoechstens('expeditionen', gruppen.expeditionen.length, B.expeditionen, 'Expeditionen');
    hoechstens('sammlung', gruppen.sammlung.length, B.sammlung, 'Sammlungsstücke');
    for (const [id] of gruppen.epochen) {
      const n = gruppen.bauteile.filter(([, b]) => objekt(b) && b.epoche === id).length;
      hoechstens(`epochen.${id}`, n, B.gebaeudeArtenJeEpoche, 'neue Gebäudearten in der Epoche');
    }

    // Rohstoff für jedes Fach der aktiven Module
    for (const [id, r] of gruppen.rohstoffe) {
      if (!objekt(r)) continue;
      if (!FAECHER.includes(r.fach)) f(`rohstoffe.${id}.fach`, `erwartet eines von ${FAECHER.join(', ')}`);
      if (!text(r.symbol)) f(`rohstoffe.${id}.symbol`, 'Text fehlt');
    }
    for (const fach of faecher) if (!gruppen.rohstoffe.some(([, r]) => objekt(r) && r.fach === fach)) f('rohstoffe', `Das Fach «${fach}» hat keinen Rohstoff: jedes Fach aktiver Module braucht einen`);

    // Epochen und Tore
    gruppen.epochen.forEach(([id, e], i) => {
      if (!objekt(e)) return;
      if (!Number.isInteger(e.plaetze) || e.plaetze < 1) f(`epochen.${id}.plaetze`, 'ganze Zahl ab 1 erwartet');
      if (i === 0 && e.tor != null) f(`epochen.${id}.tor`, 'die erste Epoche hat kein Tor (tor: null)');
      if (i > 0 && !ids.forschung.has(e.tor)) f(`epochen.${id}.tor`, `Tor «${e.tor}» ist kein Forschungsknoten`);
    });

    // Bauteile, Rezepte, Forschung, Expeditionen, Sammlung
    for (const [id, b] of gruppen.bauteile) {
      if (!objekt(b)) continue;
      const ort = `bauteile.${id}`;
      if (!ids.epochen.has(b.epoche)) f(`${ort}.epoche`, `Epoche «${b.epoche}» gibt es nicht`);
      if (Array.isArray(B.wirkungstypen) && !B.wirkungstypen.includes(b.wirkung)) f(`${ort}.wirkung`, `«${b.wirkung}» ist kein Wirkungstyp (erlaubt: ${B.wirkungstypen.join(', ')}), neue Wirkungstypen gibt es nur mit Test`);
      if (b.braucht !== undefined && !ids.forschung.has(b.braucht)) f(`${ort}.braucht`, `Forschungsknoten «${b.braucht}» gibt es nicht`);
      if (!Array.isArray(b.stufen) || !b.stufen.length) f(`${ort}.stufen`, 'mindestens eine Stufe erwartet');
      else {
        hoechstens(`${ort}.stufen`, b.stufen.length, B.stufenJeGebaeude, 'Stufen');
        b.stufen.forEach((s, i) => { if (!objekt(s)) f(`${ort}.stufen[${i}]`, 'Objekt erwartet'); else betrag(`${ort}.stufen[${i}].kosten`, s.kosten); });
      }
      if (b.wirkung === 'tausch') {
        if (!Array.isArray(b.tausch) || !b.tausch.length) f(`${ort}.tausch`, 'ein Handelsposten braucht mindestens einen Tausch');
        else b.tausch.forEach((t, i) => { betrag(`${ort}.tausch[${i}].gib`, objekt(t) ? t.gib : null); betrag(`${ort}.tausch[${i}].erhalte`, objekt(t) ? t.erhalte : null); });
      }
    }
    for (const [id, r] of gruppen.rezepte) {
      if (!objekt(r)) continue;
      const bauteil = new Map(gruppen.bauteile).get(r.in);
      if (!objekt(bauteil) || bauteil.wirkung !== 'rezept') f(`rezepte.${id}.in`, `«${r.in}» ist kein Gebäude mit Wirkung rezept`);
      betrag(`rezepte.${id}.aus`, r.aus);
      if (objekt(r.aus) && id in r.aus) f(`rezepte.${id}.aus`, 'ein Gut kann nicht aus sich selbst entstehen');
    }
    for (const [id, k] of gruppen.forschung) {
      if (!objekt(k)) continue;
      const ort = `forschung.${id}`;
      if (!ids.epochen.has(k.epoche)) f(`${ort}.epoche`, `Epoche «${k.epoche}» gibt es nicht`);
      if (k.summe !== undefined) { if (!zahl(k.summe) || k.summe <= 0) f(`${ort}.summe`, 'Zahl über 0 erwartet'); }
      else if (!(typeof k.bereich === 'string' && BEREICH.test(k.bereich)) || !zahl(k.wissen) || k.wissen <= 0) f(ort, 'braucht entweder summe oder bereich (<fach>.<name>) mit wissen über 0');
      betrag(`${ort}.kosten`, k.kosten);
    }
    for (const [id, x] of gruppen.expeditionen) {
      if (!objekt(x)) continue;
      const ort = `expeditionen.${id}`;
      if (!ids.epochen.has(x.epoche)) f(`${ort}.epoche`, `Epoche «${x.epoche}» gibt es nicht`);
      if (!Number.isInteger(x.umfang) || x.umfang < 1) f(`${ort}.umfang`, 'ganze Zahl ab 1 erwartet');
      if (!zahl(x.ziel) || x.ziel <= 0 || x.ziel > 1) f(`${ort}.ziel`, 'Zahl über 0 bis 1 erwartet');
      if (!objekt(x.belohnung)) f(`${ort}.belohnung`, 'Objekt erwartet: der Lohn steht fest und ist vorher sichtbar');
      else {
        if (x.belohnung.sammlung !== undefined && !ids.sammlung.has(x.belohnung.sammlung)) f(`${ort}.belohnung.sammlung`, `Sammlungsstück «${x.belohnung.sammlung}» gibt es nicht`);
        if (x.belohnung.rohstoffe !== undefined) for (const k of Object.keys(objekt(x.belohnung.rohstoffe) ? x.belohnung.rohstoffe : {})) if (!ids.rohstoffe.has(k)) f(`${ort}.belohnung.rohstoffe`, `«${k}» ist kein Rohstoff dieses Themas`);
      }
    }

    for (const r of P.pruefeTexte(P.texteIn(welt, 'welt'), { ton: false })) f(r.ort, r.text, r.regel);
    return R;
  }

  P.pruefeWelt = pruefeWelt;
})(globalThis);
