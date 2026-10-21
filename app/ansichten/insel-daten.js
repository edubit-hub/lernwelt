/* app/ansichten/insel-daten.js: was die Ansichten und die Szene über die Fachinseln lesen (Plan 0.2, S2). Liest nur, geschrieben wird in start.js.
     InselDaten.aktiv() → true, wenn das gewählte Welt-Thema die Art «inseln» hat
     InselDaten.ordnung() → Areale.ordne(Thema, geladene Module), zwischengespeichert, solange sich Module und Versionen nicht ändern
     InselDaten.bau(doc) → { arealId: 0..3 }: aus dem Verdienstbuch berechnet und mit den gespeicherten Phasen fortgeschrieben (eine Phase bleibt)
     InselDaten.stand(doc) → { fach, ordnung, bau } für W3.Szene
   Gespeichert ist unter zustand.welt.fachinseln: { fach, bau }. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const z = { key: null, ordnung: [], aufgaben: new Map() };

  const thema = () => (L.Start && L.Start.welt) || null;
  const aktiv = () => { const t = thema(); return !!(t && t.art === 'inseln'); };
  const dok = doc => doc || (L.Zustand ? L.Zustand.hole() : {});
  const gespeichert = doc => { const t = thema(), d = dok(doc); return t && objekt(d.welt) && objekt(d.welt[t.id]) ? d.welt[t.id] : {}; };

  function ordnung() {
    const t = thema();
    if (!t || t.art !== 'inseln') return [];
    const module = L.registry ? [...L.registry.module.values()] : [], key = t.id + '|' + module.map(m => `${m.id}@${m.version}`).join(',');
    if (key !== z.key) { z.key = key; z.ordnung = L.Areale.ordne(t, module); z.aufgaben.clear(); }
    return z.ordnung;
  }

  /** Aufgaben eines Themas, je Modul und Thema einmal gebaut. Ein fehlerhaftes Modul zählt keine Aufgaben. */
  function aufgabenVon(modulId, themaId) {
    const k = `${modulId}/${themaId}`;
    if (!z.aufgaben.has(k)) {
      const m = L.registry.module.get(modulId), t = m && (m.themen || []).find(x => x.id === themaId);
      let liste = [];
      try { liste = t ? L.Modell.aufgaben(m, t) : []; } catch (e) { liste = []; }
      z.aufgaben.set(k, liste);
    }
    return z.aufgaben.get(k);
  }

  function bau(doc) {
    const d = dok(doc), neu = {};
    for (const f of ordnung()) for (const a of [...f.areale, f.erweiterung].filter(Boolean)) neu[a.id] = L.Bau.phase(L.Bau.zaehle(a, d.ledger, aufgabenVon));
    return L.Bau.fortschreibe(gespeichert(d).bau, neu);
  }

  function fach(doc) {
    const o = ordnung(), f = gespeichert(doc).fach;
    return o.some(x => x.fach === f) ? f : ((o.find(x => x.areale.length) || o[0] || {}).fach || null);
  }

  const stand = doc => ({ fach: fach(doc), ordnung: ordnung(), bau: bau(doc) });
  const areale = f => (f ? [...f.areale, f.erweiterung].filter(Boolean) : []);
  const inselVon = (doc, id) => ordnung().find(x => x.fach === (id || fach(doc))) || null;

  /** Medaille im HUD: Name der gewählten Insel, ausgebaute Areale und der Anteil aller Phasen. */
  function medaille(doc) {
    const f = inselVon(doc), b = bau(doc), liste = areale(f);
    if (!f) return null;
    const phasen = liste.map(a => b[a.id] || 0);
    return { fach: f.fach, name: f.name, ausgebaut: phasen.filter(p => p === 3).length, areale: liste.length, anteil: liste.length ? phasen.reduce((s, p) => s + p, 0) / (3 * liste.length) : 0 };
  }

  /** Stand eines Areals für die Tafel: Phase, Zahlen und was für die nächste Phase fehlt ({ phase, hat, soll } oder null, wenn ausgebaut). */
  function fortschritt(arealId, doc) {
    const d = dok(doc), a = L.Areale.finde(ordnung(), arealId);
    if (!a) return null;
    const z = L.Bau.zaehle(a, d.ledger, aufgabenVon), R = L.weltregeln.bau, phase = bau(d)[a.id] || 0;
    const naechste = phase >= 3 ? null
      : phase === 0 ? { phase: 1, hat: Math.min(z.richtig, R.fundament.richtig), soll: R.fundament.richtig }
        : phase === 1 ? { phase: 2, hat: z.basis, soll: Math.ceil(z.themen * R.rohbau.basisAnteil) }
          : { phase: 3, hat: z.sicher, soll: Math.ceil(z.themen * R.fertig.sicherAnteil) };
    return { areal: a, phase, zahlen: z, naechste };
  }

  /** Stufe eines Themas für die Liste: gefestigt, sicher oder basis aus dem Verdienstbuch, sonst begonnen (ein Versuch) oder neu. */
  function themaStufe(key, doc) {
    const d = dok(doc), e = objekt(d.ledger) && objekt(d.ledger.errungen) && Object.hasOwn(d.ledger.errungen, key) ? d.ledger.errungen[key] : null;
    if (objekt(e)) for (const s of ['gefestigt', 'sicher', 'basis']) if (e[s]) return s;
    const i = key.indexOf('/'), m = objekt(d.module) ? d.module[key.slice(0, i)] : null, zs = m && objekt(m.aufgaben) ? m.aufgaben : {};
    return aufgabenVon(key.slice(0, i), key.slice(i + 1)).some(a => objekt(zs[a.id]) && zs[a.id].versuche > 0) ? 'begonnen' : 'neu';
  }

  L.InselDaten = { aktiv, ordnung, bau, fach, stand, aufgabenVon, areale, inselVon, medaille, fortschritt, themaStufe };
})(globalThis);
