/* app/ansichten/pruefung-lage.js: die Lage eines Moduls vor der Prüfung, gerechnet für den Elternbereich (AP-13b, Architektur 6.6). Kein DOM, nichts wird geschrieben.
   Ampel, Auslastung und Risiken gehören nur in den Elternbereich (eltern-pruefung.js): Keine Ansicht für das Kind ruft diese Datei auf.
   lage() nimmt Datum und Umfang aus dem Lernstand (das Datum im Zustand gewinnt gegen das Modul), zählt aus Lernplan.kandidaten die offenen und neuen Aufgaben im Umfang
   und lässt Pruefungsplan.plan rechnen. kuerzung() macht aus der Empfehlung «Umfang kürzen» einen Vorschlag: welche Themen bleiben, damit höchstens
   `neueAufgabenHoechstens` neue Aufgaben im Umfang liegen. Themen mit hoher Punktzahl je Aufgabe (pruefung.format) haben Vorrang, Themen ohne neue Aufgaben kosten nichts. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const gueltig = t => typeof t === 'string' && L.Tag.gueltig(t);
  const PHASEN = { aufbauen: 'Aufbauen', festigen: 'Festigen', simulation: 'Probeprüfung', abschluss: 'Abschluss' };

  /** Prüfungsdatum und Umfang des Moduls: das Datum im Lernstand gewinnt, sonst das des Moduls. themen ist immer eine Liste (['*'] heisst alles). */
  function eintrag(doc, id, modul) {
    const p = (doc.module && doc.module[id] && doc.module[id].pruefung) || {}, m = (modul && modul.pruefung) || {}, eigen = gueltig(p.datum);
    const themen = eigen ? p.themen : m.themen;
    return { datum: eigen ? p.datum : (gueltig(m.datum) ? m.datum : null), eigen, themen: Array.isArray(themen) && themen.length ? themen : ['*'] };
  }

  /** Kandidaten des Moduls mit der Thema-ID ohne Modulvorsatz: [{ thema, box, neu }]. */
  function kandidaten(doc, id, heute) {
    return L.Lernplan.kandidaten(doc, heute, [id]).kandidaten.map(x => ({ thema: String(x.thema).slice(id.length + 1), box: x.box, neu: x.neu }));
  }

  /** Die Tage von heute bis vor dem Prüfungstag, an denen der Ferienmodus gilt: kein Tagesauftrag, also kein Lerntag im Plan. */
  function freieTage(doc, heute, datum) {
    const aus = [];
    if (!L.Ferien) return aus;
    for (let d = heute; L.Tag.diff(datum, d) > 0; d = L.Tag.plus(d, 1)) if (L.Ferien.lage(doc, d).aktiv) aus.push(d);
    return aus;
  }

  /**
   * Die Lage eines aktiven, geladenen Moduls, sonst null.
   * → { id, titel, datum, eigen, themen, imUmfang (Thema-IDs der eingeschalteten Themen im Umfang), umfang: { gesamt, offen, davonNeu }, tageBis, phase, format, plan | null }
   * plan ist null ohne Datum und ab dem Prüfungstag (tageBis ≤ 0).
   */
  function lage(doc, id, heute, verteilung = null) {
    const modul = L.registry.module.get(id), md = doc.module && doc.module[id];
    if (!modul || !md || md.aktiv !== true) return null;
    const e = eintrag(doc, id, modul), kand = kandidaten(doc, id, heute), format = (modul.pruefung && modul.pruefung.format) || null;
    const u = L.Pruefungsplan.umfang(kand, e.themen), tageBis = e.datum ? L.Tag.diff(e.datum, heute) : null;
    const imUmfang = modul.themen.map(t => t.id).filter(t => L.Modell.thema(modul, t, md.anpassung).aktiv !== false && L.Pruefungsplan.imUmfang(e.themen, t));
    const gr = format ? L.Pruefungsplan.groesse(format) : { simulation: 0, diagnose: 0 };
    const v = tageBis !== null && tageBis > 0 ? (verteilung || L.Lernplan.verteilung(doc, heute)) : null, aktive = L.Lernplan.aktive(doc).length;
    // Der Plan rechnet mit dem, was der Tagesauftrag diesem Modul gibt: seine Quote an neuen Aufgaben und seinen Anteil an der Übungszeit (Lernplan.verteilung)
    const plan = v ? L.Pruefungsplan.plan({ heute, datum: e.datum, offen: u.offen, davonNeu: u.davonNeu, simulation: gr.simulation || undefined, diagnose: gr.diagnose || undefined, format,
      neuMax: v.quoten[id] ?? null, anteil: v.anteil[id] ?? 1 / Math.max(1, aktive), freieTage: freieTage(doc, heute, e.datum) }) : null;
    return { id, titel: modul.titel, datum: e.datum, eigen: e.eigen, themen: e.themen, imUmfang, umfang: u, tageBis, phase: tageBis !== null && tageBis > 0 ? L.Pruefungsplan.phaseVon(tageBis) : null, format, plan, kand,
      weitere: v ? Object.keys(v.quoten).filter(x => x !== id).length : 0 };
  }

  /** Auslastung als ganze Prozent, «mehr als 100» nie gerundet weggelassen. Ohne Kapazität (kein Lerntag) null. */
  const prozent = plan => (plan && Number.isFinite(plan.auslastung) ? Math.round(plan.auslastung * 100) : null);

  /**
   * Vorschlag für «Umfang kürzen»: { themen: [IDs, die im Umfang bleiben], weggelassen: [IDs], davonNeu, hoechstens }.
   * Themen ohne neue Aufgaben bleiben immer. Von den übrigen kommen die mit der höchsten Punktzahl je Aufgabe zuerst, solange die neuen Aufgaben zusammen höchstens
   * `hoechstens` ergeben. Passt keines, bleibt das Thema mit den wenigsten neuen Aufgaben (der Umfang darf nicht leer sein).
   */
  function kuerzung(l, hoechstens) {
    const ids = l.imUmfang, neu = Object.fromEntries(ids.map(t => [t, l.kand.filter(k => k.thema === t && k.neu && !(k.box >= L.lernregeln.mastery.sicherBox)).length]));
    const rang = new Map(L.Pruefungsplan.vorrang(l.format).map((x, i) => [x.thema, i]));
    const reihe = ids.filter(t => neu[t] > 0).sort((a, b) => (rang.has(a) ? rang.get(a) : 1e6) - (rang.has(b) ? rang.get(b) : 1e6) || neu[a] - neu[b]);
    const bleibt = ids.filter(t => neu[t] === 0);
    let summe = 0;
    for (const t of reihe) if (summe + neu[t] <= hoechstens) { bleibt.push(t); summe += neu[t]; }
    if (!bleibt.length && reihe.length) { const t = reihe.slice().sort((a, b) => neu[a] - neu[b])[0]; bleibt.push(t); summe = neu[t]; }
    const themen = ids.filter(t => bleibt.includes(t));
    return { themen, weggelassen: ids.filter(t => !bleibt.includes(t)), davonNeu: summe, hoechstens };
  }

  /** Die Empfehlung des Plans als Text für die Eltern, null ohne Empfehlung. */
  function empfehlungText(plan) {
    const e = plan && plan.empfehlung;
    if (!e) return null;
    if (e.art === 'umfang-kuerzen') return `Umfang kürzen auf höchstens ${e.neueAufgabenHoechstens} neue Aufgaben`;
    if (e.art === 'mehr-minuten') return `Mehr Zeit einplanen: etwa ${e.minuten} Minuten pro Lerntag`;
    return 'Bis zur Prüfung bleibt kein Lerntag. Das Datum prüfen';
  }

  L.PruefungLage = { PHASEN, eintrag, lage, prozent, kuerzung, empfehlungText };
})(globalThis);
