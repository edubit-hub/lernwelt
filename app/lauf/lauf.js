/* app/lauf/lauf.js: führt eine Runde durch (Architektur 5.2 bis 5.4): Pakete bilden (ablauf.js), die Schleife über die Pakete (schleife.js),
   Verbuchen (verbuchen.js) und Rückmeldung (rueckmeldung.js). Die Welt kennt der Lauf nicht, sie hört nur auf die Ereignisse aus 2.5.
   Der Vertrag für plan, huelle und den Bericht steht in docs/vertragsaenderungen.md (F-AP05-01). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const MODI = {                                         // schreibt: Lernstand und Ereignisse. sammelt: Rückmeldung erst am Ende. nachschub: rückt Neues nach (AP-23)
    tagesauftrag:    { modus: 'ueben',           schreibt: true,  nachfassen: true, deckel: true, nachschub: true },
    einstufung:      { modus: 'ueben',           schreibt: true,  nachfassen: false, deckel: true, einstufung: true },
    zusatz:          { modus: 'ueben',           schreibt: true,  nachfassen: true, grund: 'extra' },
    expedition:      { modus: 'ueben',           schreibt: true,  nachfassen: true },
    simulation:      { modus: 'simulation',      schreibt: true,  nachfassen: false, sammelt: true },
    herausforderung: { modus: 'herausforderung', schreibt: false, nachfassen: false },
    vorschau:        { modus: 'vorschau',        schreibt: false, nachfassen: true }
  };
  const STIL = [
    '.lauf{display:flex;flex-direction:column;gap:var(--a4);min-height:100%}',
    '.lauf-kopf{display:flex;align-items:center;justify-content:space-between;gap:var(--a3)}',
    '.lauf-buehne{flex:1 1 auto}',
    '.lauf-buehne[inert]{pointer-events:none}',
    '.lauf-rueckmeldung:empty{display:none}',
    '.lauf-frage-ort:empty{display:none}'
  ].join('');
  let aktiv = null;                                      // { abbrechen } der laufenden Runde, es gibt nie zwei

  const sicher = f => { try { f(); } catch (fehler) { /* ohne Sprachausgabe oder Dialog gibt es nichts zu tun */ } };
  const raeumeAuf = () => {                              // beim Abbruch: Sprechen stoppen (5.7, «Hintergrund») und offene Dialoge schliessen
    sicher(() => { if (L.Sprache && L.Sprache.stopp) L.Sprache.stopp(); else if (g.speechSynthesis) g.speechSynthesis.cancel(); });
    sicher(() => { if (L.ui && L.ui.dialog) L.ui.dialog.schliesseAlle(); });
  };

  /** Intervalldeckel je Aufgabe (Prüfungsplan, 6.2). deckel ist null, eine Zahl (für alle Aufgaben), eine Funktion Aufgabe → Zahl oder null,
      oder eine Tabelle { <modul-id>: Zahl | Lage } mit Lage = Pruefungsplan.fuerHeute(...): dann gilt der Deckel nur für Themen im Umfang. */
  function deckelVon(deckel) {
    const gueltig = w => (Number.isFinite(w) ? w : null);
    if (typeof deckel === 'function') return a => gueltig(deckel(a));
    if (deckel !== null && typeof deckel === 'object') {
      return a => {
        const w = deckel[a.modul];
        if (w !== null && typeof w === 'object') return L.Pruefungsplan.imUmfang(w.themen, a.thema) ? gueltig(w.deckel) : null;
        return gueltig(w);
      };
    }
    return () => gueltig(deckel);
  }

  function pruefeVoraussetzungen(modus) {
    const noetig = { Wiederholung: L.Wiederholung, Stand: L.Stand, Fehler: L.Fehler, Statistik: L.Statistik, Modell: L.Modell, ui: L.ui, Dienste: L.Dienste,
      Ablauf: L.Ablauf, Verbuchen: L.Verbuchen, Schleife: L.Schleife, Bericht: L.Bericht, Rueckmeldung: L.Rueckmeldung, Einstufung: L.Einstufung };
    if (modus.schreibt) noetig.Zustand = L.Zustand;
    for (const [name, wert] of Object.entries(noetig)) if (!wert) throw new Error(`Lauf: Lernwelt.${name} ist nicht geladen`);
  }

  /** iOS lädt die Stimmenliste verzögert: Bei Modulen mit Sprache wird kurz darauf gewartet, bevor die Fähigkeit geprüft wird. */
  async function warteAufStimmen(eintraege) {
    const mitSprache = eintraege.some(e => { const m = e && L.registry.module.get(String(e.key).split('/')[0]); return !!(m && m.sprache); });
    if (mitSprache && L.Sprache && typeof L.Sprache.bereit === 'function') await Promise.resolve(L.Sprache.bereit()).catch(() => false);
  }

  /** Führt eine Runde durch. art: tagesauftrag, einstufung, zusatz, expedition, herausforderung, simulation oder vorschau.
      plan: { heute, eintraege: [{ key, grund?, typ?, teil?, punkte? }], deckel?, maxMinuten?, ziel?, pruefung?: { modul, art }, modul? (einstufung),
      nachschub?: ({ offen, nachgerueckt }) → Eintrag | null (tagesauftrag: nächste neue Aufgabe für eine schon bekannte, AP-23),
      katalog? (nur vorschau: Dienste.beispielKatalog(typ), das eingebaute Beispiel eines Typs) }.
      huelle: DOM-Element, in dem die Runde erscheint. signal: optionaler AbortSignal von aussen. Gibt ein Promise mit dem Bericht zurück.
      beobachter (optional, Umbauplan 3.7): { paket({ nr, gesamt, art }), ergebnis({ urteil, aufgabeKey }) }. Der Lauf ruft ihn vor jedem Paket und nach
      jedem verbuchten Ergebnis, geschützt (ein Fehler des Beobachters stoppt die Runde nicht). Er bekommt nur Zahlen und Urteile, kein Welt-Wissen. */
  async function start({ art, plan, huelle, signal: extern, beobachter = null } = {}) {
    const modus = MODI[art];
    if (!modus) throw new Error(`Lauf: unbekannte Art «${art}»`);
    if (!plan || !L.Tag.gueltig(plan.heute) || !Array.isArray(plan.eintraege)) throw new Error('Lauf: plan braucht heute (JJJJ-MM-TT) und eintraege');
    if (!huelle || huelle.nodeType !== 1) throw new Error('Lauf: huelle muss ein DOM-Element sein');
    if (aktiv) throw new Error('Lauf: Es läuft schon eine Runde');
    pruefeVoraussetzungen(modus);
    L.Dienste.stil('lauf-stil', STIL);

    const ac = new g.AbortController(), H = L.ui.h, doc = g.document, jetzt = () => L.Dienste.jetzt(), T = L.Rueckmeldung.texte;
    const t0 = jetzt(), maxMin = Number.isFinite(plan.maxMinuten) && plan.maxMinuten > 0 ? plan.maxMinuten : modus.deckel ? L.lernregeln.sitzung.maxMinuten : null;
    let grund = null, marke = t0;
    const beende = von => { if (ac.signal.aborted) return false; grund = von; ac.abort(); return true; };
    const beendenKnopf = H('button.knopf.leise.lauf-beenden', { type: 'button', 'aria-label': T.beendenBeschriftung(), 'aria-expanded': 'false', onclick: () => frage(!frageOrt.children.length) }, T.beenden());
    const frageOrt = H('div.lauf-frage-ort');
    const fortschritt = H('span.klein.lauf-fortschritt', { 'aria-live': 'polite' }), buehne = H('div.lauf-buehne'), rueck = H('div.lauf-rueckmeldung');
    const wurzel = H('div.lauf', { 'data-art': art },
      H('div.lauf-kopf', fortschritt, beendenKnopf), frageOrt,
      art === 'zusatz' ? H('p.klein.lauf-hinweis', T.zusatzHinweis()) : '', buehne, rueck);
    // «Beenden» fragt kurz nach (ein Tipp im Griffbereich des Daumens beendet die Runde nicht aus Versehen): Ja beendet, «Weiterüben» schliesst die Frage
    const frageEl = H('div.lauf-frage', { role: 'group', 'aria-label': T.beendenBeschriftung() }, H('p', T.beendenFrage()),
      H('div.lauf-frage-knoepfe', H('button.knopf.lauf-beenden-ja', { type: 'button', onclick: () => beende('kind') }, T.beendenJa()),
        H('button.knopf.primaer.lauf-weiterueben', { type: 'button', onclick: () => frage(false) }, T.weiterUeben())));
    function frage(an) {
      if (an) frageOrt.replaceChildren(frageEl); else frageOrt.replaceChildren();
      beendenKnopf.setAttribute('aria-expanded', String(!!an));
    }
    const k = { art, modus, plan, heute: plan.heute, signal: ac.signal, katalog: art === 'vorschau' && plan.katalog ? plan.katalog : L.Dienste.katalog(plan.heute), zeit: L.Dienste.neueZeit(), buehne, rueck, fortschritt,
      gesehen: new Set(), verbucht: new Map(), vorher: new Map(), info: {}, sammlung: { ergebnisse: [], aufgaben: [], info: {} }, mindestMs: L.lernregeln.sitzung.ratenMs, t0,
      maxMs: maxMin ? maxMin * 60000 : null, eintragVon: new Map(), alleAufgaben: [], deckel: deckelVon(plan.deckel), b: L.Bericht.neu(art, plan.heute),
      z: L.Dienste.lernstand({ schreibt: modus.schreibt, heute: plan.heute }), beobachter: beobachter && typeof beobachter === 'object' ? beobachter : null };
    k.zeitbuchen = () => { const t = jetzt(); k.z.minuten((t - marke) / 60000); marke = t; };
    const verdeckt = () => { if (doc.visibilityState === 'hidden') beende('hintergrund'); }, vonAussen = () => beende('extern');
    aktiv = { abbrechen: beende };
    try {
      ac.signal.addEventListener('abort', raeumeAuf, { once: true });
      if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', verdeckt);
      if (extern) { if (extern.aborted) vonAussen(); else extern.addEventListener('abort', vonAussen, { once: true }); }
      huelle.replaceChildren(wurzel);
      await warteAufStimmen(plan.eintraege);
      const gebildet = L.Ablauf.bilde(plan.eintraege, { art, katalog: k.katalog, box: a => (k.z.lies(a) || {}).box || 0 });
      Object.assign(k, { eintragVon: gebildet.eintragVon, ablauf: L.Ablauf.neuerAblauf(gebildet.pakete), alleAufgaben: gebildet.pakete.flatMap(p => p.aufgaben) });
      k.gesamt = new Set(k.alleAufgaben.map(a => a.key)).size;
      L.Dienste.ladeVor(k.alleAufgaben);                                            // 5.2 Schritt 2: Bilder im Hintergrund vorladen
      const b = k.b;
      b.uebersprungen = gebildet.uebersprungen;
      await L.Schleife.fuehreAus(k);
      b.abgebrochen = ac.signal.aborted; b.grund = grund;
      if (plan.pruefung && modus.sammelt && !b.abgebrochen) L.Schleife.schliessePruefung(k);
      if (k.sammlung.ergebnisse.length && !ac.signal.aborted) {
        await L.Rueckmeldung.zeige(rueck, { aufgaben: k.sammlung.aufgaben, art: 'sammlung' }, k.sammlung.ergebnisse,
          { info: k.sammlung.info, signal: ac.signal, kopf: b.pruefung ? b.pruefung.text : null });
      }
      k.zeitbuchen();
      b.minuten = Math.round((jetzt() - t0) / 60000);
      b.stufen = modus.schreibt ? L.Verbuchen.neueStufen(k) : [];
      if (modus.schreibt) {
        const morgen = L.Tag.plus(plan.heute, 1);
        b.morgen = [...k.verbucht.values()].filter(a => { const z = k.z.lies(a); return z && z.faellig <= morgen; }).length;
        if (art === 'einstufung' && plan.modul && b.aufgaben > 0) k.z.trageEinstufungEin(plan.modul, { tag: plan.heute, aufgaben: b.aufgaben, bekannt: b.bekannt });
        if (b.aufgaben > 0) L.bus.emit('lern:sitzung', { art, minuten: b.minuten, aufgaben: b.aufgaben, ersterVersuch: b.ersterVersuch, neu: b.neu, korrigiert: b.korrigiert });
      }
      if (plan.ziel) { b.ziel = plan.ziel; b.zielErreicht = b.aufgaben > 0 && b.ersterVersuch / b.aufgaben >= plan.ziel; }
      return b;
    } finally {
      if (doc && doc.removeEventListener) doc.removeEventListener('visibilitychange', verdeckt);
      ac.signal.removeEventListener('abort', raeumeAuf);
      if (extern) extern.removeEventListener('abort', vonAussen);
      if (typeof wurzel.remove === 'function') wurzel.remove();
      aktiv = null;
    }
  }

  /** Beendet die laufende Runde (das Kind verlässt sie, die App wechselt). Bereits verbuchte Ergebnisse bleiben. Gibt wahr zurück, wenn eine lief. */
  const abbrechen = (grund = 'extern') => !!aktiv && aktiv.abbrechen(grund);

  /** Sendet lern:pruefung. Nur der Lauf sendet Ereignisse, deshalb geht auch der Eintrag des echten Ergebnisses im Elternbereich hierher. */
  function meldePruefung({ modul, art, punkte, max, proTeil = [] } = {}) {
    if (!modul || !['diagnose', 'simulation', 'echt'].includes(art) || !Number.isFinite(punkte) || !Number.isFinite(max) || max <= 0) throw new Error('Lauf: ungültige Angaben zur Prüfung');
    L.bus.emit('lern:pruefung', { modul, art, punkte, max, proTeil });
  }

  L.Lauf = { start, abbrechen, meldePruefung, summiere: berichte => L.Bericht.summiere(berichte), laeuft: () => aktiv !== null, ARTEN: Object.keys(MODI) };
})(globalThis);
