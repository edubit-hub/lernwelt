/* app/ansichten/lernplan.js: der Tagesauftrag für die Ansicht «Lernen» (Architektur 6.4, V-AP02-02). Baut aus Zustand und Katalog die Kandidaten,
   ruft Sitzung.plane und teilt das Ergebnis in wählbare Runden je Fach. Kein DOM. Der Plan eines Tages entsteht einmal und liegt danach in
   zustand.meta.auftrag = { tag, module, eintraege: [{ key, grund, fach }], probleme } (F-AP12-02): Eine Aufgabe zählt als erledigt, sobald sie heute einen Versuch
   hat (zuletzt = heute). So bleibt der Auftrag nach «Beenden» und nach dem Neuladen derselbe, und eine fertige Runde macht keine neuen Aufgaben auf.
   Kommt im Lauf des Tages ein Modul dazu (Elternbereich), wird nur sein Teil nachgeplant. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const fachName = id => (L.Texte && L.Texte.fach[id]) || (id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Lernen');
  const gueltig = x => typeof x === 'string' && L.Tag.gueltig(x);

  /** Der Spieltag des Dokuments: nie vor dem letzten gespielten Tag, ein beschädigter Eintrag zählt nicht. */
  const heute = doc => L.Tag.spieltag(L.Tag.heute(), gueltig(doc && doc.meta && doc.meta.letzterTag) ? doc.meta.letzterTag : null);
  const aktive = doc => [...L.registry.module.keys()].filter(id => { const m = doc.module && doc.module[id]; return !!m && m.aktiv === true; });
  const zustandVon = (doc, key) => {
    const i = String(key).indexOf('/'), m = i > 0 && doc.module ? doc.module[key.slice(0, i)] : null;
    return m && m.aufgaben ? m.aufgaben[key.slice(i + 1)] : undefined;
  };

  /** Kandidaten eines Moduls für Sitzung.plane. Themen, die die Eltern abgeschaltet haben, fehlen ganz (auch ihr Fälliges). */
  function kandidatenVon(modulId, doc, tag) {
    const modul = L.registry.module.get(modulId), md = (doc.module && doc.module[modulId]) || {}, zs = md.aufgaben || {};
    const themen = modul.themen.map(t => L.Modell.thema(modul, t, md.anpassung)), proThema = new Map(themen.map(t => [t.id, L.Modell.aufgaben(modul, t.id)]));
    const frei = t => L.Stand.freigeschaltet(t.voraussetzung || [], id => (proThema.get(id) || []).map(a => zs[a.id]), t.freischaltung);
    return themen.filter(t => t.aktiv !== false).flatMap(t => {
      const offen = frei(t);
      return proThema.get(t.id).map(a => {
        const z = zs[a.id];
        return { key: a.key, modul: modulId, fach: modul.fach, thema: L.Modell.themaKey(modul, a.thema), box: z ? z.box || 0 : 0, faellig: z && z.faellig ? z.faellig : tag,
          neu: !z, letzteFalsch: !!z && String(z.verlauf || '').endsWith('0'), bereit: offen && a.schwierigkeit <= t.maxSchwierigkeit,
          braucht: a.braucht.map(b => `${modulId}/${b}`), neuProTag: t.neuProTag };
      });
    });
  }

  /** Alle Kandidaten der aktiven Module (oder nur der in `nur` genannten). Ein Modul, das sich nicht lesen lässt, steht in `probleme` und blockiert die anderen nicht. */
  function kandidaten(doc, tag, nur = null) {
    const alle = [], probleme = [];
    for (const id of aktive(doc).filter(m => !nur || nur.includes(m))) {
      try { alle.push(...kandidatenVon(id, doc, tag)); } catch (fehler) { probleme.push({ modul: id, grund: fehler.message }); }
    }
    return { kandidaten: alle, probleme };
  }

  /** Die Lage vor einer Prüfung (6.6): je Modul Pruefungsplan.fuerHeute, das Datum im Zustand gewinnt gegen das Modul. `fuerPlan` fasst sie für
      Sitzung.plane zusammen (Themen als Schlüssel «modul/thema», die nächste Prüfung bestimmt Phase und Neues), `deckel` ist die Tabelle für Lauf.start. */
  function lagen(doc, tag) {
    const deckel = {}, fuerPlan = { themen: new Set(), tageBis: Infinity, neuErlaubt: true, phase: null, maxMinuten: null };
    for (const id of aktive(doc)) {
      const modul = L.registry.module.get(id), z = (doc.module[id] && doc.module[id].pruefung) || {}, eigen = gueltig(z.datum);
      const lage = L.Pruefungsplan.fuerHeute({ datum: eigen ? z.datum : (modul.pruefung || {}).datum, themen: eigen ? z.themen : (modul.pruefung || {}).themen }, tag);
      if (!lage) continue;
      deckel[id] = lage;
      const ids = lage.themen.has('*') ? modul.themen.map(t => t.id) : [...lage.themen];
      ids.forEach(t => fuerPlan.themen.add(`${id}/${t}`));
      if (lage.tageBis < fuerPlan.tageBis) Object.assign(fuerPlan, { tageBis: lage.tageBis, neuErlaubt: lage.neuErlaubt, phase: lage.phase });
      if (lage.maxMinuten !== null) fuerPlan.maxMinuten = Math.min(lage.maxMinuten, fuerPlan.maxMinuten ?? Infinity);
    }
    return { deckel, fuerPlan: Object.keys(deckel).length ? fuerPlan : null };
  }

  /** Neuer Plan des Tages aus Sitzung.plane, gruppiert nach Fach. `nur`: Module, die im Lauf des Tages dazukamen. */
  function plane(doc, tag, nur = null) {
    const k = kandidaten(doc, tag, nur), l = lagen(doc, tag);
    const eintraege = L.Sitzung.plane({ kandidaten: k.kandidaten, heute: tag, quote: L.Statistik.quote(doc.meta && doc.meta.abrufe), pruefung: l.fuerPlan, gruppe: x => x.fach })
      .map(x => ({ key: x.key, grund: x.grund, fach: x.fach }));
    return { eintraege, probleme: k.probleme };
  }

  /** Wählbare Runden: je Fach eine, mit Zahl der Aufgaben und geschätzter Dauer. Nur Aufgaben ohne Versuch an diesem Tag und aus aktiven Modulen. */
  function runden(doc, tag, eintraege) {
    const aktiv = new Set(aktive(doc)), nach = new Map();
    for (const e of eintraege) {
      const z = zustandVon(doc, e.key);
      if (!aktiv.has(e.key.split('/')[0]) || (z && z.zuletzt === tag)) continue;
      if (!nach.has(e.fach)) nach.set(e.fach, []);
      nach.get(e.fach).push({ ...e, sek: L.Sitzung.schaetzeSekunden(z) });
    }
    return [...nach].map(([fach, liste]) => ({ id: fach, titel: fachName(fach), aufgaben: liste.length, neu: liste.filter(e => e.grund === 'neu').length,
      minuten: Math.max(1, Math.round(liste.reduce((s, e) => s + e.sek, 0) / 60)), eintraege: liste.map(({ key, grund }) => ({ key, grund })) }));
  }

  /**
   * Der Tagesauftrag von heute für Ansicht und Statusleiste. Legt den Plan beim ersten Aufruf des Tages an und merkt ihn in meta.auftrag.
   * Z: Zustand mit hole() und aendere(fn). → { tag, runden, aufgaben, minuten, gemacht: { aufgaben, richtig, min, neu }, erledigt, zeitUm, keinModul, probleme, deckel, maxMinuten }
   * zeitUm: die 15 Minuten des Tages sind aufgebraucht, der Rest bleibt fällig. deckel gehört in plan.deckel, maxMinuten in plan.maxMinuten von Lauf.start.
   */
  function tagesauftrag(Z = L.Zustand) {
    const doc = Z.hole(), tag = heute(doc), gespeichert = doc.meta && doc.meta.auftrag, ids = aktive(doc);
    let plan = gespeichert && gespeichert.tag === tag && Array.isArray(gespeichert.eintraege) && gespeichert.eintraege.length ? gespeichert : null;
    let probleme = plan && Array.isArray(plan.probleme) ? plan.probleme : [];                // Module, die sich beim Planen nicht lesen liessen, bleiben im Plan vermerkt
    if (!plan && ids.length) {
      const neu = plane(doc, tag);
      probleme = neu.probleme;
      plan = { tag, module: ids, eintraege: neu.eintraege, probleme };
      if (neu.eintraege.length) Z.aendere(z => { z.meta.auftrag = plan; });
    } else if (plan && ids.some(id => !(plan.module || ids).includes(id))) {      // ein Modul kam im Lauf des Tages dazu: sein Teil kommt zum Plan
      const neu = plane(doc, tag, ids.filter(id => !(plan.module || ids).includes(id)));
      probleme = [...probleme, ...neu.probleme];
      plan = { tag, module: ids, eintraege: [...plan.eintraege, ...neu.eintraege], probleme };
      Z.aendere(z => { z.meta.auftrag = plan; });
    }
    const log = (doc.tage && doc.tage[tag]) || {}, l = lagen(doc, tag), rest = L.lernregeln.sitzung.maxMinuten - (log.min || 0);
    const zeitUm = rest <= 0 && (log.aufgaben || 0) > 0, offen = zeitUm ? [] : runden(doc, tag, plan ? plan.eintraege : []);   // der Rest bleibt für morgen fällig
    const aufgaben = offen.reduce((s, r) => s + r.aufgaben, 0);
    return { tag, runden: offen, aufgaben, minuten: offen.reduce((s, r) => s + r.minuten, 0), keinModul: aktive(doc).length === 0, probleme, deckel: l.deckel, zeitUm,
      gemacht: { aufgaben: log.aufgaben || 0, richtig: log.richtig || 0, min: log.min || 0, neu: log.neu || 0 }, erledigt: aufgaben === 0,
      maxMinuten: Math.max(1, Math.min(rest, l.fuerPlan && l.fuerPlan.maxMinuten !== null ? l.fuerPlan.maxMinuten : Infinity)) };
  }

  /** Eine freiwillige Zusatzrunde aus schon gesehenen, nicht fälligen Aufgaben: zuerst die zuletzt falschen und die mit niedriger Box. Leer, wenn es keine gibt. */
  function zusatz(Z = L.Zustand, anzahl = 12) {
    const doc = Z.hole(), tag = heute(doc), schwach = kandidaten(doc, tag).kandidaten.filter(k => !k.neu)
      .sort((a, b) => (b.letzteFalsch - a.letzteFalsch) || (a.box - b.box)).slice(0, anzahl);
    const rng = L.Zufall.aus(['zusatz', tag, (doc.tage && doc.tage[tag] && doc.tage[tag].aufgaben) || 0].join('|'));
    return L.Sitzung.mischen(schwach, rng).map(k => ({ key: k.key, grund: 'extra' }));
  }

  L.Lernplan = { heute, aktive, kandidaten, lagen, plane, runden, tagesauftrag, zusatz, fachName, zustandVon };
})(globalThis);
