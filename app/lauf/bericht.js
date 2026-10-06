/* app/lauf/bericht.js: der Bericht einer Runde (was Lauf.start zurückgibt), das Zusammenfassen mehrerer Berichte, der Tagesbericht aus dem Tageslog
   und die Auswertung einer Probeprüfung (Architektur 6.6). Der Text zum Ende steht in Rueckmeldung.texte.abschluss, hier stehen nur Zahlen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const ZAEHLER = ['aufgaben', 'ersterVersuch', 'hilfe', 'falsch', 'gezeigt', 'neu', 'bekannt', 'nachgerueckt', 'korrigiert', 'nachgefasst', 'morgen', 'minuten', 'pakete', 'ms'];
  const LISTEN = ['uebersprungen', 'fehler', 'vorgezogen', 'ergebnisse'];

  /** Leerer Bericht. aufgaben zählt jede Aufgabe einmal je Runde (Nachfassen nicht), ersterVersuch davon die selbständig richtigen,
      hilfe, falsch und gezeigt die übrigen Urteile. ms ist die aktive Bearbeitungszeit aller Ergebnisse in Millisekunden (inklusive Nachfassen). */
  function neu(art, heute) {
    return { art, heute, ...Object.fromEntries(ZAEHLER.map(f => [f, 0])), abgebrochen: false, grund: null, zeitdeckel: false,
      uebersprungen: [], fehler: [], vorgezogen: [], stufen: [], ergebnisse: [], pruefung: null };
  }

  /** Fasst mehrere Berichte zusammen, zum Beispiel die Runden eines Tagesauftrags, für den Text zum Ende. Gibt einen neuen Bericht zurück. */
  function summiere(berichte) {
    const liste = (berichte || []).filter(Boolean), summe = neu(liste.length ? liste[0].art : null, liste.length ? liste[0].heute : null);
    for (const x of liste) {
      for (const f of ZAEHLER) summe[f] += x[f] || 0;
      summe.abgebrochen = summe.abgebrochen || !!x.abgebrochen;
      summe.zeitdeckel = summe.zeitdeckel || !!x.zeitdeckel;
      summe.pruefung = x.pruefung || summe.pruefung;
      for (const f of LISTEN) summe[f].push(...(x[f] || []));
      for (const s of x.stufen || []) {                                  // je Thema die erste Ausgangsstufe und die letzte erreichte
        const alt = summe.stufen.findIndex(y => y.themaKey === s.themaKey);
        if (alt < 0) summe.stufen.push(s); else summe.stufen[alt] = { ...s, vorher: summe.stufen[alt].vorher };
      }
    }
    return summe;
  }

  /** Wahr, wenn vor `heute` noch kein Tag mit Aufgaben im Tageslog steht: der erste Tag. */
  const ersterTag = (doc, heute) => !Object.entries((doc && doc.tage) || {}).some(([tag, log]) => tag < heute && log && log.aufgaben > 0);

  /** Wie viele Aufgaben von heute morgen oder früher wieder fällig sind (aus den Aufgabenzuständen aller Module, ohne Lauf). */
  function morgenFaellig(doc, heute) {
    const morgen = L.Tag.plus(heute, 1);
    return Object.values((doc && doc.module) || {}).reduce((n, m) => n + Object.values((m && m.aufgaben) || {}).filter(z => z && z.zuletzt === heute && z.faellig <= morgen).length, 0);
  }

  /** Der Tagesbericht aus dem Tageslog des Zustands (zustand.tage[heute]) und nicht aus den Runden seit dem Start der App (AP-23): er stimmt auch
      nach einem Neustart und zählt jede Runde des Tages mit. `neu` ohne die schon bekannten Aufgaben. Die Themenstufen kennt der Log nicht (opt.stufen). */
  function ausTageslog(doc, heute, opt = {}) {
    const log = (doc && doc.tage && doc.tage[heute]) || {}, b = neu('tagesauftrag', heute);
    return Object.assign(b, { aufgaben: log.aufgaben || 0, ersterVersuch: log.richtig || 0, hilfe: log.hilfe || 0, falsch: log.falsch || 0, bekannt: log.bekannt || 0,
      neu: Math.max(0, (log.neu || 0) - (log.bekannt || 0)), minuten: Math.round(log.min || 0), morgen: morgenFaellig(doc, heute), stufen: opt.stufen || [],
      ersterTag: ersterTag(doc, heute) });
  }

  /** Der Ertrag von heute aus dem Tageslog als Tabelle { fach: n }. */
  const ertragVon = (doc, heute) => ({ ...((doc && doc.tage && doc.tage[heute] && doc.tage[heute].ertrag) || {}) });

  /** Wertet eine Probeprüfung aus (Pruefungsplan.auswerte, V-AP02-02). Es zählt der erste Versuch, nur «richtig» gibt Punkte. k: Zustand der Runde,
      titelVon(themaId) gibt den Titel eines Themas. Gibt { modul, art, punkte, max, proTeil, proThema, fehler, text } zurück. */
  function wertePruefung(k, titelVon) {
    const p = k.plan.pruefung, art = p.art || 'simulation';
    const gewaehlt = k.alleAufgaben.map(a => { const e = k.eintragVon.get(a.key) || {}; return { teil: e.teil ?? 0, thema: a.thema, punkte: e.punkte ?? 1, aufgabe: a }; });
    const erste = k.b.ergebnisse.filter(e => !e.nachfassen).map(e => ({ aufgabeKey: e.key, urteil: e.urteil, code: e.code }));
    const r = L.Pruefungsplan.auswerte(gewaehlt, erste);
    const themen = Object.entries(r.proThema).map(([id, t]) => ({ titel: titelVon(id), punkte: t.punkte, max: t.max }));
    return { modul: p.modul, art, punkte: r.punkte, max: r.max, proTeil: r.proTeil, proThema: r.proThema, fehler: r.fehler,
      text: L.Rueckmeldung.texte.pruefung({ punkte: r.punkte, max: r.max, themen }) };
  }

  L.Bericht = { neu, summiere, wertePruefung, ausTageslog, ertragVon, ersterTag, morgenFaellig };
})(globalThis);
