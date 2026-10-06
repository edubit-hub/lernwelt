/* app/lauf/verbuchen.js: was der Lauf mit einem Ergebnis des Übungstyps tut (Architektur 5.4 und 6.5): Wiederholungsplan anwenden, Fehler
   diagnostizieren, Zustand und Tageslog schreiben, lern:aufgabe senden, Nachfassen einreihen, die Fehlerfolge «braucht» auslösen.
   Dazu der Themenstand: lern:thema nach jedem Paket und die neu erreichten Stufen für den Bericht. k ist der Zustand einer Runde (lauf.js). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const URTEILE = ['richtig', 'hilfe', 'falsch', 'gezeigt'];
  const RANG = { neu: 0, ueben: 1, basis: 2, sicher: 3, gefestigt: 4 };
  const STUFE_BOX = { basis: 'basisBox', sicher: 'sicherBox', gefestigt: 'gefestigtBox' };

  /** Fehlercode: der des Typs (Auswahl mit Code je Antwort), sonst die Diagnose des Generators, sonst «sonstige». */
  function diagnose(a, e) {
    if (e.code) return e.code;
    const gen = a.generator && L.registry.generatoren.get(a.generator);
    try { return (gen && typeof gen.diagnose === 'function' && gen.diagnose(a, e.antwort || {})) || 'sonstige'; } catch (fehler) { return 'sonstige'; }
  }

  /** Ein Typ mit maxBox lässt eine Aufgabe nie höher steigen (Architektur 5.1), aber auch nie unter die Box, die sie schon hatte. */
  function kappe(z, maxBox, boxVor, heute) {
    const grenze = Math.max(maxBox || 0, boxVor);
    if (!maxBox || z.box <= grenze) return z;
    const spaetestens = L.Tag.plus(heute, L.lernregeln.wiederholung.intervalle[grenze]);
    return { ...z, box: grenze, faellig: z.faellig < spaetestens ? z.faellig : spaetestens };
  }

  /** Fehlerfolge «braucht»: Die Voraussetzungen der Aufgabe werden heute noch einmal geprüft (Architektur 6.5). Noch nie gesehene bleiben neu. */
  function vorziehen(k, a, code) {
    for (const id of L.Fehler.folge(k.katalog.modul(a.modul), code, a).braucht) {
      const r = k.katalog.suche(`${a.modul}/${id}`), z = r.aufgabe && k.z.lies(r.aufgabe);
      if (!z || !(z.versuche > 0) || k.gesehen.has(r.aufgabe.key)) continue;
      if (!k.ablauf.einreihen(r.aufgabe, L.Ablauf.typFuer(r.aufgabe, z.box, k))) continue;
      if (z.faellig > k.heute) k.z.schreibe(r.aufgabe, { ...z, faellig: k.heute });
      k.b.vorgezogen.push(r.aufgabe.key);
    }
  }

  /** Verbucht ein Ergebnis des Typs. Gibt { raten } zurück, bei einem Ergebnis ohne gültige Aufgabe oder Urteil null (es wird nichts verbucht). */
  function ergebnis(k, paket, e) {
    const a = paket.aufgaben.find(x => x.key === (e && e.aufgabeKey));
    if (!a || !URTEILE.includes(e.urteil)) { k.b.fehler.push({ typ: paket.typ, grund: 'Ergebnis ohne gültige Aufgabe oder gültiges Urteil' }); return null; }
    const { b, heute } = k, z0 = k.z.lies(a), neu = !z0 || !(z0.versuche > 0), boxVor = z0 ? z0.box : 0;
    const nachfassen = k.gesehen.has(a.key) || paket.art === 'nachfassen';        // zweiter Auftritt derselben Runde: kein unabhängiger Beweis
    const faellig = L.Wiederholung.faellig(z0, heute), ms = Number.isFinite(e.ms) && e.ms >= 0 ? Math.round(e.ms) : 0;
    const raten = e.urteil === 'falsch' && Number.isFinite(e.ms) && e.ms < k.mindestMs;   // Fehler ohne Nachdenken
    const korrigiert = !!(z0 && z0.offen && e.urteil === 'richtig' && faellig && !nachfassen);
    const typ = L.registry.typen.get(paket.typ), code = e.urteil === 'falsch' ? diagnose(a, e) : null;
    const bekannt = L.Einstufung.istBekannt({ neu, nachfassen, urteil: e.urteil, einfuehrung: a.einfuehrung });   // Vortest gleich richtig: kein neuer Stoff (AP-23)
    let z1 = L.Wiederholung.verbuche(z0, { urteil: e.urteil, vortest: !nachfassen && neu && a.einfuehrung === 'vortest', nachfassen, raten }, heute, k.deckel(a));
    z1 = { ...(nachfassen ? z1 : kappe(z1, typ && typ.eigenschaften.maxBox, boxVor, heute)) };
    if (code) z1.fehler = code;
    if (e.urteil !== 'gezeigt' && ms > 0 && !nachfassen && !raten) z1.ms = Math.round(z0 && z0.ms ? z0.ms * 0.7 + ms * 0.3 : ms);   // gleitender Mittelwert
    const grund = k.modus.grund || (k.eintragVon.get(a.key) || {}).grund || (neu ? 'neu' : 'faellig');
    const ev = { key: a.key, modul: a.modul, aufgabe: a.id, thema: a.thema, bereich: a.bereich, fach: a.fach, urteil: e.urteil, code,
      boxVor, boxNach: z1.box, faellig, nachfassen, korrigiert, ms, grund };
    k.z.schreibe(a, z1, { ev, code: nachfassen ? null : code, bekannt, neu: neu && !nachfassen && !bekannt });   // derselbe Fehler zählt je Runde einmal
    if (k.modus.schreibt) L.bus.emit('lern:aufgabe', ev);

    let folge = null;
    if (!nachfassen && k.modus.nachfassen && (e.urteil === 'falsch' || e.urteil === 'gezeigt')) {
      if (k.ablauf.nachfassen(a, L.Ablauf.typFuer(a, z1.box, k))) { folge = 'gleich'; b.nachgefasst += 1; }
    } else if ((nachfassen || k.modus.einstufung) && e.urteil === 'falsch' && k.modus.schreibt) folge = 'morgen';   // die Einstufung fasst nicht nach, die Aufgabe kommt morgen
    if (!nachfassen && code && k.modus.schreibt && k.modus.nachfassen) vorziehen(k, a, code);
    const f = code ? L.Fehler.folge(k.katalog.modul(a.modul), code, a) : null, modul = k.katalog.modul(a.modul);
    const weg = modul && modul.wege && a.hilfe && Object.hasOwn(modul.wege, a.hilfe.weg) ? modul.wege[a.hilfe.weg] : null;
    k.info[a.key] = { korrigiert, folge, kind: f ? f.kind : null, wegTitel: weg ? weg.titel : null };
    if (!nachfassen) {
      b.aufgaben += 1;
      if (neu) b.neu += 1;
      if (korrigiert) b.korrigiert += 1;
      if (e.urteil === 'richtig') b.ersterVersuch += 1; else b[e.urteil] += 1;
      k.verbucht.set(a.key, a);
    }
    b.ms += ms;
    k.gesehen.add(a.key);
    b.ergebnisse.push({ key: a.key, urteil: e.urteil, code, nachfassen, ms });
    if (bekannt) { b.bekannt += 1; nachruecken(k); }
    return { raten };
  }

  /** Eine schon bekannte Aufgabe war kein neuer Stoff: plan.nachschub({ offen, nachgerueckt }) nennt die nächste neue, sie kommt hinten in die Warteschlange.
      Ein Fehler der Ansicht oder eine nicht lesbare Aufgabe stoppt die Runde nicht (AP-23). */
  function nachruecken(k) {
    if (typeof k.plan.nachschub !== 'function' || !k.modus.schreibt || !k.modus.nachschub) return;
    try {
      const offen = k.ablauf.offen().filter(key => (k.eintragVon.get(key) || {}).grund === 'neu');
      const e = k.plan.nachschub({ offen, nachgerueckt: k.b.nachgerueckt });
      if (!e || !e.key || k.gesehen.has(e.key) || k.ablauf.vorgemerkt(e.key)) return;
      const g = L.Ablauf.bilde([e], { art: k.art, katalog: k.katalog, box: x => (k.z.lies(x) || {}).box || 0 });
      if (!g.pakete.length) return;
      g.eintragVon.forEach((v, key) => k.eintragVon.set(key, v));
      g.pakete.forEach(p => { k.ablauf.anhaengen(p); k.alleAufgaben.push(...p.aufgaben); });
      k.gesamt += g.pakete.reduce((s, p) => s + p.aufgaben.length, 0);
      k.b.nachgerueckt += 1;
    } catch (fehler) { k.b.fehler.push({ typ: 'nachschub', grund: String((fehler && fehler.message) || fehler) }); }
  }

  // ---- Themenstand ------------------------------------------------------------------------------------------
  function standVon(k, modulId, themaId) {
    const liste = k.katalog.aufgabenVon(modulId, themaId), cfg = k.katalog.thema(modulId, themaId).mastery;
    return { nach: L.Stand.themenStand(liste.map(a => k.z.lies(a)), cfg), liste, cfg };
  }
  const themenVon = paket => [...new Set(paket.aufgaben.map(a => `${a.modul}/${a.thema}`))].map(t => { const i = t.indexOf('/'); return [t.slice(0, i), t.slice(i + 1)]; });

  /** Merkt den Stand vor der ersten Berührung, damit der Bericht die neu erreichten Stufen findet. */
  function merkeStand(k, paket) {
    if (k.modus.schreibt) for (const [m, t] of themenVon(paket)) if (!k.vorher.has(`${m}/${t}`)) k.vorher.set(`${m}/${t}`, standVon(k, m, t).nach);
  }
  /** Nach jedem Paket für jedes berührte Thema ab «basis». Das Verdienstbuch prüft selbst, ob die Stufe schon bezahlt ist. */
  function meldeThemen(k, paket) {
    if (!k.modus.schreibt) return;
    for (const [m, t] of themenVon(paket)) {
      const s = standVon(k, m, t);
      if (STUFE_BOX[s.nach]) L.bus.emit('lern:thema', { themaKey: `${m}/${t}`, bereich: k.katalog.modul(m).bereich, aufgaben: s.liste.length, nach: s.nach });
    }
  }
  /** Die Themen, die in dieser Runde eine höhere Stufe ab «basis» erreicht haben, mit dem Text aus 6.9. */
  function neueStufen(k) {
    const aus = [];
    for (const [schluessel, vor] of k.vorher) {
      const i = schluessel.indexOf('/'), m = schluessel.slice(0, i), t = schluessel.slice(i + 1), s = standVon(k, m, t);
      if (!STUFE_BOX[s.nach] || RANG[s.nach] <= RANG[vor]) continue;
      const anzahl = s.liste.filter(a => { const z = k.z.lies(a); return z && z.box >= s.cfg[STUFE_BOX[s.nach]]; }).length, titel = k.katalog.thema(m, t).titel;
      aus.push({ themaKey: schluessel, bereich: k.katalog.modul(m).bereich, titel, vorher: vor, nach: s.nach, anzahl, gesamt: s.liste.length,
        text: L.Rueckmeldung.texte.themaStufe({ titel, nach: s.nach, anzahl, gesamt: s.liste.length }) });
    }
    return aus;
  }

  L.Verbuchen = { ergebnis, merkeStand, meldeThemen, neueStufen, diagnose, kappe };
})(globalThis);
