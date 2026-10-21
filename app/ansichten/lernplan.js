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

  /** Kandidaten eines Moduls für Sitzung.plane. Themen, die die Eltern abgeschaltet haben, fehlen ganz (auch ihr Fälliges) und zählen als Voraussetzung für ihre Nachfolger als erfüllt. */
  function kandidatenVon(modulId, doc, tag) {
    const modul = L.registry.module.get(modulId), md = (doc.module && doc.module[modulId]) || {}, zs = md.aufgaben || {};
    const themen = modul.themen.map(t => L.Modell.thema(modul, t, md.anpassung)), proThema = new Map(themen.map(t => [t.id, L.Modell.aufgaben(modul, t.id)]));
    const aus = new Set(themen.filter(t => t.aktiv === false).map(t => t.id));        // ein abgeschaltetes Thema sperrt seine Nachfolger nicht (V-AP18f-05)
    const frei = t => L.Stand.freigeschaltet(t.voraussetzung || [], id => (aus.has(id) ? [] : (proThema.get(id) || []).map(a => zs[a.id])), t.freischaltung);
    return themen.filter(t => t.aktiv !== false).flatMap(t => {
      const offen = frei(t);
      return proThema.get(t.id).map(a => {
        const z = zs[a.id], box = z ? z.box || 0 : 0;
        let typ; try { typ = L.Modell.typFuer(t, box).typ; } catch (e) { typ = undefined; }          // nur für die Zeitschätzung
        return { key: a.key, modul: modulId, fach: modul.fach, typ, thema: L.Modell.themaKey(modul, a.thema), box, faellig: z && z.faellig ? z.faellig : tag,
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
      Sitzung.plane zusammen, `deckel` ist die Tabelle für Lauf.start. Eine Prüfung gilt nur für ihr Modul: Der Stoff eines Moduls ohne Prüfung gehört immer zum Umfang
      (`themen` als Schlüssel «modul/thema»), und sein Neues sperrt keine fremde Prüfung. `neuGesperrt` sind die Module, deren Prüfung keinen neuen Stoff mehr zulässt,
      `module` die mit Prüfung (nur sie zählen als «Prüfung» im Tagesauftrag). Die nächste Prüfung bestimmt `tageBis` und `phase`. */
  function lagen(doc, tag) {
    const deckel = {}, fuerPlan = { themen: new Set(), module: new Set(), neuGesperrt: new Set(), tageBis: Infinity, neuErlaubt: false, phase: null, maxMinuten: null }, frei = [];
    for (const id of aktive(doc)) {
      const modul = L.registry.module.get(id), z = (doc.module[id] && doc.module[id].pruefung) || {}, eigen = gueltig(z.datum);
      const lage = L.Pruefungsplan.fuerHeute({ datum: eigen ? z.datum : (modul.pruefung || {}).datum, themen: eigen ? z.themen : (modul.pruefung || {}).themen }, tag);
      if (!lage) { frei.push([id, modul]); continue; }
      deckel[id] = lage;
      fuerPlan.module.add(id);
      const ids = lage.themen.has('*') ? modul.themen.map(t => t.id) : [...lage.themen];
      ids.forEach(t => fuerPlan.themen.add(`${id}/${t}`));
      if (lage.neuErlaubt) fuerPlan.neuErlaubt = true; else fuerPlan.neuGesperrt.add(id);
      if (lage.tageBis < fuerPlan.tageBis) Object.assign(fuerPlan, { tageBis: lage.tageBis, phase: lage.phase });
      if (lage.maxMinuten !== null) fuerPlan.maxMinuten = Math.min(lage.maxMinuten, fuerPlan.maxMinuten ?? Infinity);
    }
    if (!Object.keys(deckel).length) return { deckel, fuerPlan: null };
    for (const [id, modul] of frei) { modul.themen.forEach(t => fuerPlan.themen.add(`${id}/${t.id}`)); fuerPlan.neuErlaubt = true; }
    return { deckel, fuerPlan };
  }

  /**
   * Wie sich die neuen Aufgaben des Tages auf die Module verteilen (Neuverteilung): { gewichte, quoten, anteil }, je Modul mit offenem Stoff.
   * Das Gewicht ist der Bedarf je Tag: bei einer Prüfung die neuen Aufgaben im Umfang durch die Tage, an denen Neues noch erlaubt ist, sonst 1. `quoten` sind die neuen
   * Aufgaben je Tag, die ein Modul im Mittel bekommt, `anteil` sein Anteil an allen (so viel der Übungszeit rechnet der Plan ihm zu). Der Plan der Eltern nimmt dieselben Zahlen.
   */
  function verteilung(doc, tag, kand = null) {
    const alle = (kand || kandidaten(doc, tag)).kandidaten, l = lagen(doc, tag), R = L.lernregeln, gewichte = {}, gruppen = [];
    for (const id of aktive(doc)) {
      const neu = alle.filter(x => x.modul === id && x.neu), lage = l.deckel[id];
      if (!neu.length) continue;
      let gewicht = 1;
      if (lage && lage.neuErlaubt) {
        const imUmfang = neu.filter(x => L.Pruefungsplan.imUmfang(lage.themen, String(x.thema).slice(id.length + 1))).length;
        gewicht = Math.min(R.sitzung.neuProTagMax, Math.max(1, Math.ceil(imUmfang / Math.max(1, lage.tageBis - R.pruefung.simulation))));
      }
      if (lage && !lage.neuErlaubt) continue;
      gewichte[id] = gewicht;
      gruppen.push({ id, gewicht });
    }
    const quoten = L.Neuverteilung.quoten(gruppen), summe = Object.values(quoten).reduce((s, x) => s + x, 0) || 1;
    return { gewichte, quoten, anteil: Object.fromEntries(Object.entries(quoten).map(([id, q]) => [id, q / summe])) };
  }

  /** Neuer Plan des Tages aus Sitzung.plane, gruppiert nach Fach. `nur`: Module, die im Lauf des Tages dazukamen. */
  function plane(doc, tag, nur = null) {
    const k = kandidaten(doc, tag, nur), l = lagen(doc, tag);
    const eintraege = L.Sitzung.plane({ kandidaten: k.kandidaten, heute: tag, quote: L.Statistik.quote(doc.meta && doc.meta.abrufe), pruefung: l.fuerPlan, gruppe: x => x.fach,
      gewichte: verteilung(doc, tag, k).gewichte })
      .map(x => ({ key: x.key, grund: x.grund, fach: x.fach, ...(x.typ ? { typ: x.typ } : {}) }));
    return { eintraege, probleme: k.probleme };
  }

  /** Wählbare Runden: je Fach eine, mit Zahl der Aufgaben und geschätzter Dauer. Nur Aufgaben ohne Versuch an diesem Tag und aus aktiven Modulen. */
  function runden(doc, tag, eintraege) {
    const aktiv = new Set(aktive(doc)), nach = new Map();
    for (const e of eintraege) {
      const z = zustandVon(doc, e.key);
      if (!aktiv.has(e.key.split('/')[0]) || (z && z.zuletzt === tag)) continue;
      if (!nach.has(e.fach)) nach.set(e.fach, []);
      nach.get(e.fach).push({ ...e, sek: L.Sitzung.schaetzeSekunden(z, undefined, e.typ) });
    }
    return [...nach].map(([fach, liste]) => ({ id: fach, titel: fachName(fach), aufgaben: liste.length, neu: liste.filter(e => e.grund === 'neu').length,
      minuten: Math.max(1, Math.ceil(liste.reduce((s, e) => s + e.sek, 0) / 60)), eintraege: liste.map(({ key, grund }) => ({ key, grund })) }));
  }

  /**
   * Der Tagesauftrag von heute für Ansicht und Statusleiste. Legt den Plan beim ersten Aufruf des Tages an und merkt ihn in meta.auftrag.
   * Z: Zustand mit hole() und aendere(fn). → { tag, runden, aufgaben, minuten, gemacht: { aufgaben, richtig, min, neu }, erledigt, zeitUm, keinModul, probleme, deckel, maxMinuten }
   * zeitUm: die 15 Minuten des Tages sind aufgebraucht, der Rest bleibt fällig. deckel gehört in plan.deckel, maxMinuten in plan.maxMinuten von Lauf.start.
   */
  function tagesauftrag(Z = L.Zustand) {
    const doc = Z.hole(), tag = heute(doc), gespeichert = doc.meta && doc.meta.auftrag, ids = aktive(doc);
    let plan = gespeichert && gespeichert.tag === tag && Array.isArray(gespeichert.eintraege) && gespeichert.eintraege.length ? gespeichert : null;
    // Ändern die Eltern die Module, bevor heute etwas geübt wurde (Einrichten am ersten Tag), gilt der alte Plan nicht mehr: er kennt die neue Verteilung nicht.
    const geuebt = ((doc.tage && doc.tage[tag]) || {}).aufgaben > 0;
    if (plan && !geuebt && Array.isArray(plan.module) && (plan.module.length !== ids.length || ids.some(id => !plan.module.includes(id)))) plan = null;
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
    const aufgaben = offen.reduce((s, r) => s + r.aufgaben, 0), fe = L.Ferien ? L.Ferien.lage(doc, tag) : null;
    return { tag, runden: offen, aufgaben, minuten: offen.reduce((s, r) => s + r.minuten, 0), keinModul: aktive(doc).length === 0, probleme, deckel: l.deckel, zeitUm,
      ferien: fe && fe.aktiv ? { name: fe.name, bis: fe.bis } : null,                       // im Ferienmodus gibt es keinen verlangten Tagesauftrag, die Runden bleiben freiwillig
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

  /** Eine Runde zu einem Thema (Fachinseln, «Üben» im Areal): zuerst das Fällige, dann bis zu `neu` neue Aufgaben (leichte zuerst), dann die mit niedriger Box.
      Aufgaben, die heute schon dran waren, fehlen. Ein Thema, das die Eltern abgeschaltet haben, gibt eine leere Liste. → [{ key, grund }] */
  function themaRunde(modulId, themaId, { anzahl = 10, neu = 5 } = {}, Z = L.Zustand) {
    const doc = Z.hole(), tag = heute(doc), modul = L.registry.module.get(modulId);
    if (!modul || !(modul.themen || []).some(t => t.id === themaId)) return [];
    const md = (doc.module && doc.module[modulId]) || {}, zs = md.aufgaben || {}, t = L.Modell.thema(modul, themaId, md.anpassung);
    if (t.aktiv === false) return [];
    const k = L.Modell.aufgaben(modul, themaId).map(a => { const z = zs[a.id]; return { a, z, box: z ? z.box || 0 : 0, frisch: !z }; })
      .filter(x => !x.z || x.z.zuletzt !== tag);
    const faellig = k.filter(x => !x.frisch && L.Wiederholung.faellig(x.z, tag));
    const neue = k.filter(x => x.frisch).sort((x, y) => (x.a.schwierigkeit || 1) - (y.a.schwierigkeit || 1)).slice(0, neu);
    const rest = k.filter(x => !x.frisch && !faellig.includes(x)).sort((x, y) => x.box - y.box);
    return [...faellig, ...neue, ...rest].slice(0, anzahl).map(x => ({ key: x.a.key, grund: x.frisch ? 'neu' : faellig.includes(x) ? 'faellig' : 'extra' }));
  }

  L.Lernplan = { heute, aktive, kandidaten, lagen, verteilung, plane, runden, tagesauftrag, zusatz, themaRunde, fachName, zustandVon };
})(globalThis);
