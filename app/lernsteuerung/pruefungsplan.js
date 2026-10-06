/* app/lernsteuerung/pruefungsplan.js: Prüfungsplan, Phasen, Diagnose und Simulation (Architektur 6.6). Reine Funktionen. Die Phasengrenzen kommen
   bei jedem Aufruf aus L.lernregeln.pruefung. Der Plan wird jeden Tag aus dem tatsächlichen Stand neu berechnet. Ampel, Auslastung und
   Risiken sieht nur der Elternbereich, das Kind sieht sie nie. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const einstellung = () => L.lernregeln.pruefung.plan;                  // Zahlen aus 6.6: lernregeln.pruefung.plan, bei jedem Aufruf neu gelesen
  const rund2 = x => Math.round(x * 100) / 100;

  /** `bis` ist die Zahl der Tage bis zur Prüfung: aufbauen (mehr als `festigen` Tage), festigen, simulation (genau `simulation` Tage) oder abschluss. */
  function phaseVon(bis, R = L.lernregeln.pruefung) {
    if (bis <= R.abschluss) return 'abschluss';
    if (bis <= R.simulation) return 'simulation';
    return bis <= R.festigen ? 'festigen' : 'aufbauen';
  }
  /** Neue Aufgaben gibt es in `aufbauen` und `festigen`, in den letzten Tagen nie. */
  const neuErlaubt = (bis, R = L.lernregeln.pruefung) => ['aufbauen', 'festigen'].includes(phaseVon(bis, R));

  /** Gehört das Thema zum Prüfungsumfang? `themen` ist ein Set, eine Liste oder '*'. Ohne Angabe gehört alles dazu. */
  function imUmfang(themen, thema) {
    if (themen == null || themen === '*') return true;
    const liste = themen instanceof Set ? themen : new Set([].concat(themen));
    return liste.has('*') || liste.has(thema);
  }

  /** Themen mit hoher Punktzahl je Aufgabe zuerst (`pruefung.format`). Bei einer Kürzung des Umfangs bleiben sie bestehen. */
  function vorrang(format) {
    const proThema = new Map();
    for (const teil of format || []) for (const t of [].concat(teil.thema)) {
      proThema.set(t, Math.max(proThema.get(t) || 0, teil.anzahl > 0 ? teil.punkte / teil.anzahl : 0));
    }
    return [...proThema].map(([thema, punkteJeAufgabe]) => ({ thema, punkteJeAufgabe })).sort((a, b) => b.punkteJeAufgabe - a.punkteJeAufgabe);
  }

  /** Grösse von Simulation und Diagnose-Probelauf in Aufgaben, aus dem Format (der Diagnose-Probelauf hat die halbe Anzahl). */
  function groesse(format) {
    const E = einstellung(), summe = f => (format || []).reduce((s, teil) => s + f(teil.anzahl), 0);
    return { simulation: summe(n => n), diagnose: summe(n => Math.max(1, Math.ceil(n * E.diagnoseAnteil))) };
  }

  /**
   * Plan vom Tag `heute` bis zum Tag vor der Prüfung `datum`.
   * @param offen        Aufgaben im Prüfungsumfang, die noch nicht «sicher» sind
   * @param davonNeu     davon noch nie gesehen
   * @param tagesMinuten Zeit je Lerntag, @param lerntage erlaubte Wochentage (0 = Montag), @param sek Sekunden je Aufgabe
   * @param simulation, diagnose  Zahl der Aufgaben von Simulation und Diagnose-Probelauf (siehe groesse), @param format optional für `vorrang`
   */
  function plan({ heute, datum, offen, davonNeu, tagesMinuten = 12, lerntage = [0, 1, 2, 3, 4, 5, 6], sek = 12, simulation = 30, diagnose = 20, format = null }) {
    const R = L.lernregeln.pruefung, S = L.lernregeln.sitzung, E = einstellung(), Tag = L.Tag;
    const tage = [];
    for (let d = heute; Tag.diff(datum, d) > 0; d = Tag.plus(d, 1)) {
      if (!lerntage.includes(Tag.wochentag(d))) continue;
      const bis = Tag.diff(datum, d);
      tage.push({ datum: d, bis, phase: phaseVon(bis, R), neuErlaubt: neuErlaubt(bis, R) });
    }
    const proTag = Math.floor(tagesMinuten * 60 / sek), angelernt = Math.max(0, offen - davonNeu);
    const bedarf = davonNeu * E.beruehrungenNeu + angelernt * E.beruehrungenAngelernt + simulation + diagnose;   // Berührungen bis «sicher»
    const kapazitaet = tage.length * proTag, auslastung = kapazitaet ? bedarf / kapazitaet : Infinity;
    const neuTage = tage.filter(t => t.neuErlaubt).length;
    const neuProTag = neuTage ? Math.ceil(davonNeu / neuTage) : davonNeu;
    const neuMoeglich = neuTage * S.neuProTagMax;                      // so viel Neues passt höchstens noch hinein
    const ampel = auslastung >= E.rot || davonNeu > neuMoeglich ? 'rot'
      : auslastung >= E.gelb || neuProTag > E.neuAnteilGelb * S.neuProTagMax ? 'gelb' : 'gruen';

    const risiken = [];
    if (!tage.length) risiken.push('Bis zur Prüfung bleibt kein Lerntag.');
    else if (davonNeu && !neuTage) risiken.push('Es bleibt keine Zeit mehr für neuen Stoff.');
    else if (neuProTag > S.neuProTagMax) risiken.push(`Neuer Stoff: ${neuProTag} Aufgaben pro Tag nötig, empfohlen höchstens ${S.neuProTagMax}.`);
    if (tage.length && auslastung >= E.rot) risiken.push(`Der Bedarf von etwa ${bedarf} Berührungen übersteigt die ${kapazitaet}, die in der verfügbaren Zeit Platz haben.`);

    let empfehlung = null;
    if (ampel === 'rot') {
      if (!tage.length) empfehlung = { art: 'kein-lerntag' };
      else if (davonNeu > neuMoeglich) empfehlung = { art: 'umfang-kuerzen', neueAufgabenHoechstens: neuMoeglich, ...(format ? { vorrang: vorrang(format).map(x => x.thema) } : {}) };
      else empfehlung = { art: 'mehr-minuten', minuten: Math.ceil(bedarf / tage.length * sek / 60) };
    }
    const diagnoseAm = (tage.find(t => t.bis <= R.diagnoseVon && t.bis >= R.diagnoseBis) || tage.find(t => t.bis < R.diagnoseBis && t.bis > R.simulation) || {}).datum || null;
    const simulationAm = ([...tage].reverse().find(t => t.bis >= R.simulation) || {}).datum || null;
    return { tage, kapazitaet, bedarf, auslastung, neuProTag, ampel, empfehlung, diagnoseAm, simulationAm, risiken };
  }

  /**
   * Die Lage am Tag `heute` für Sitzung.plane und Wiederholung.verbuche, aus dem Prüfungseintrag des Moduls ({ datum, themen }).
   * null ohne gültiges Datum und nach der Prüfung. `maxMinuten` gilt nur am Vorabend (sonst null), `deckel` ist der Intervalldeckel.
   */
  function fuerHeute(pruefung, heute) {
    if (!pruefung || !L.Tag.gueltig(pruefung.datum)) return null;
    const tageBis = L.Tag.diff(pruefung.datum, heute);
    if (tageBis < 0) return null;
    const R = L.lernregeln.pruefung;
    return { datum: pruefung.datum, themen: new Set(pruefung.themen && pruefung.themen.length ? pruefung.themen : ['*']), tageBis,
      phase: phaseVon(tageBis, R), neuErlaubt: neuErlaubt(tageBis, R), deckel: L.Wiederholung.deckelFuer(tageBis),
      maxMinuten: tageBis === 1 ? einstellung().vorabendMinuten : null };
  }

  /** Zählt für den Plan: Aufgaben im Umfang, davon offen (Box unter `sicherBox`) und davon neu. kandidaten: [{ thema, box, neu }]. */
  function umfang(kandidaten, themen, cfg = L.lernregeln.mastery) {
    const offen = kandidaten.filter(k => imUmfang(themen, k.thema) && !(k.box >= cfg.sicherBox));
    return { gesamt: kandidaten.filter(k => imUmfang(themen, k.thema)).length, offen: offen.length,
             davonNeu: offen.filter(k => (k.neu === undefined ? !(k.box > 0) : k.neu)).length };
  }

  /**
   * Aufgabenauswahl für Simulation und Diagnose-Probelauf nach `pruefung.format`: je Teil `anzahl` Aufgaben aus den genannten Themen, gleichmässig
   * gezogen und nicht nach Schwäche bevorzugt, damit die Probe den echten Stand misst. Mit { anteil: 0.5 } entsteht die Diagnose (halbe Anzahl).
   * @param aufgabenVon thema-ID → Aufgaben des Themas (mit `key`), @param rng Zufall mit Startwert (L.Zufall.aus)
   * @returns [{ teil, thema, typ, punkte, aufgabe }] in der Reihenfolge der Teile, `punkte` je Aufgabe
   */
  function auswahl(format, aufgabenVon, rng, { anteil = 1 } = {}) {
    const gezogen = new Set(), aus = [];
    (format || []).forEach((teil, i) => {
      const pool = [].concat(teil.thema).flatMap(t => (aufgabenVon(t) || []).map(a => ({ thema: t, aufgabe: a }))).filter(x => !gezogen.has(x.aufgabe.key));
      const n = Math.min(pool.length, anteil >= 1 ? teil.anzahl : Math.max(1, Math.ceil(teil.anzahl * anteil)));
      for (const x of rng.mische(pool).slice(0, n)) {
        gezogen.add(x.aufgabe.key);
        aus.push({ teil: i, thema: x.thema, typ: teil.typ, punkte: teil.punkte / teil.anzahl, aufgabe: x.aufgabe });
      }
    });
    return aus;
  }

  /**
   * Wertet eine Probe aus: Punkte je Teil und je Thema und die Fehlercodes falscher Antworten. Nur `richtig` gibt Punkte, eine nicht
   * beantwortete Aufgabe zählt mit null Punkten. ergebnisse: [{ aufgabeKey, urteil, code? }].
   * @returns { punkte, max, proTeil: [{ teil, punkte, max, richtig, aufgaben }], proThema: { id: { punkte, max, richtig, aufgaben } }, fehler: { code: n } }
   */
  function auswerte(gewaehlt, ergebnisse) {
    const nach = new Map((ergebnisse || []).map(e => [e.aufgabeKey, e])), teile = new Map(), proThema = {}, fehler = new Map();
    const neuerPosten = () => ({ punkte: 0, max: 0, richtig: 0, aufgaben: 0 });
    for (const x of gewaehlt) {
      const e = nach.get(x.aufgabe.key), richtig = !!e && e.urteil === 'richtig';
      if (!teile.has(x.teil)) teile.set(x.teil, { teil: x.teil, ...neuerPosten() });
      if (!Object.hasOwn(proThema, x.thema)) proThema[x.thema] = neuerPosten();
      for (const s of [teile.get(x.teil), proThema[x.thema]]) {
        s.max += x.punkte; s.aufgaben += 1;
        if (richtig) { s.punkte += x.punkte; s.richtig += 1; }
      }
      if (e && e.urteil === 'falsch' && e.code) fehler.set(e.code, (fehler.get(e.code) || 0) + 1);
    }
    const proTeil = [...teile.values()].sort((a, b) => a.teil - b.teil);
    for (const s of [...proTeil, ...Object.values(proThema)]) { s.punkte = rund2(s.punkte); s.max = rund2(s.max); }
    return { punkte: rund2(proTeil.reduce((s, t) => s + t.punkte, 0)), max: rund2(proTeil.reduce((s, t) => s + t.max, 0)),
             proTeil, proThema, fehler: Object.fromEntries(fehler) };
  }

  L.Pruefungsplan = { plan, phaseVon, neuErlaubt, imUmfang, fuerHeute, umfang, vorrang, groesse, auswahl, auswerte };
})(globalThis);
