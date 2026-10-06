/* app/welt/ledger.js: Verdienstbuch (Architektur 7.3 und 7.4). Es wächst nur, kennt kein Welt-Thema (nur Fächer und Bereiche)
   und wird nur aus Lern-Ereignissen und dem Lohn einer Expedition gespeist. Jede Funktion verbucht in das übergebene Buch und gibt
   zurück, was neu hinzukam (für die Anzeige «+2 Stein»). Die Zahlen stehen in L.weltregeln und werden bei jedem Aufruf gelesen.
   Form: { ertrag: {fach: n}, wissen: {bereich: n}, vergeben: {modul: {aufgabe: box}}, errungen: {themaKey: {basis, sicher, gefestigt}},
           pflegeRest, heute: {tag, pflege, korrektur}, expeditionen: {id: tag}, sammlung: [{id, tag, quelle}] }
   Ist `heute` kein Tag der Form JJJJ-MM-TT, wird nichts verbucht. Jede Zahlung hängt am Buch selbst, deshalb ändern ein Import oder ein erneutes
   Senden desselben Ereignisses an den Stufen und Boxen nichts. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const STUFEN = ['basis', 'sicher', 'gefestigt'];
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const zahl = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const eigen = (o, k) => (objekt(o) && Object.hasOwn(o, k) ? o[k] : undefined);   // nie über die Prototypkette lesen («constructor» ist eine gültige Modul-ID)
  const kennung = s => typeof s === 'string' && s !== '' && s !== '__proto__';
  const tag = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);   // Spieltag «JJJJ-MM-TT»: ein anderer Text würde die Tageszähler festklemmen
  const plus = (o, k, n) => { o[k] = zahl(eigen(o, k)) + n; };

  const leer = () => ({ ertrag: {}, wissen: {}, vergeben: {}, errungen: {}, pflegeRest: 0,
    heute: { tag: null, pflege: 0, korrektur: 0 }, expeditionen: {}, sammlung: [] });

  /** Ergänzt Felder, die in einem älteren oder teilweisen Buch fehlen. Vorhandene Werte bleiben unberührt. */
  function sicher(buch) {
    for (const k of ['ertrag', 'wissen', 'vergeben', 'errungen', 'expeditionen']) if (!objekt(buch[k])) buch[k] = {};
    if (!Array.isArray(buch.sammlung)) buch.sammlung = [];
    buch.pflegeRest = zahl(buch.pflegeRest);
    if (!objekt(buch.heute)) buch.heute = {};
    buch.heute.pflege = zahl(buch.heute.pflege);
    buch.heute.korrektur = zahl(buch.heute.korrektur);
    if (!tag(buch.heute.tag)) buch.heute.tag = null;
    return buch;
  }

  /** Neuer Tag: Tageszähler auf null. Ein früherer Tag (Uhr zurückgestellt) setzt die Zähler nicht zurück, der Tagesdeckel bleibt. */
  function tageswechsel(buch, heute) {
    if (!buch.heute.tag || heute > buch.heute.tag) buch.heute = { tag: heute, pflege: 0, korrektur: 0 };
  }

  /** Das Unterobjekt `o[k]`, bei Bedarf neu angelegt. */
  const unter = (o, k, neu) => (objekt(eigen(o, k)) ? o[k] : (o[k] = neu));

  /** ev: { fach, modul, aufgabe, urteil, boxVor, boxNach, faellig, nachfassen, korrigiert } aus dem Ereignis lern:aufgabe. */
  function verbucheAufgabe(ledger, ev, heute) {
    const neu = {};
    if (!objekt(ledger) || !objekt(ev) || !tag(heute)) return neu;
    if (ev.nachfassen || !kennung(ev.fach) || !kennung(ev.modul) || !kennung(ev.aufgabe)) return neu;   // Nachfassen: kein unabhängiger Beweis
    const R = L.weltregeln.ertrag;
    sicher(ledger);
    tageswechsel(ledger, heute);
    const gib = n => { if (n > 0) { plus(ledger.ertrag, ev.fach, n); plus(neu, ev.fach, n); } };

    const bisher = zahl(eigen(eigen(ledger.vergeben, ev.modul), ev.aufgabe)) || 1;   // höchste Box, für die diese Aufgabe schon bezahlt hat
    const vor = zahl(ev.boxVor), nach = zahl(ev.boxNach);
    if (nach > vor && nach > bisher) {                                           // nur echter Fortschritt in diesem Ereignis zahlt
      for (const b of Object.keys(R.wissen).map(Number).sort((a, c) => a - c)) if (b > bisher && b <= nach) gib(R.wissen[b]);
      unter(ledger.vergeben, ev.modul, {})[ev.aufgabe] = nach;
    }
    if (ev.urteil === 'richtig' && ev.faellig) {
      if (ev.korrigiert && ledger.heute.korrektur < R.korrektur.tagesDeckel) { ledger.heute.korrektur += 1; gib(R.korrektur.menge); }
      ledger.pflegeRest += 1;                                                    // Pflege: der Rest bleibt erhalten, wenn der Tagesdeckel greift
      if (ledger.pflegeRest >= R.pflege.je && ledger.heute.pflege < R.pflege.tagesDeckel) {
        ledger.pflegeRest -= R.pflege.je; ledger.heute.pflege += 1; gib(R.pflege.menge);
      }
    }
    return neu;
  }

  /** Jede Themenstufe zahlt genau einmal, auch bei Rückfall und erneutem Aufstieg. ev: { themaKey, bereich, aufgaben, nach } */
  function verbucheThema(ledger, ev, heute) {
    const neu = {}, bis = objekt(ev) ? STUFEN.indexOf(ev.nach) : -1;
    if (!objekt(ledger) || bis < 0 || !kennung(ev.themaKey) || !kennung(ev.bereich) || !tag(heute)) return neu;
    const W = L.weltregeln.wissenspunkte;
    sicher(ledger);
    const e = unter(ledger.errungen, ev.themaKey, { basis: null, sicher: null, gefestigt: null });
    const grund = Math.max(1, Math.round(zahl(ev.aufgaben) / W.aufgabenJePunkt));
    for (const stufe of STUFEN.slice(0, bis + 1)) {
      if (e[stufe]) continue;
      e[stufe] = heute;
      const p = Math.max(1, Math.ceil(grund * W[stufe]));
      plus(ledger.wissen, ev.bereich, p); plus(neu, ev.bereich, p);
    }
    return neu;
  }

  /** Lohn einer erreichten Expedition, je Expedition genau einmal. ev: { id, rohstoffe: { fach: menge }, sammlung: Stück-ID oder null }.
      Gibt { neu, ertrag, sammlung } zurück. neu ist falsch, wenn der Lohn schon bezahlt war oder die Eingabe nicht passt. */
  function verbucheExpedition(ledger, ev, heute) {
    const aus = { neu: false, ertrag: {}, sammlung: null };
    if (!objekt(ledger) || !objekt(ev) || !kennung(ev.id) || !tag(heute)) return aus;
    sicher(ledger);
    if (eigen(ledger.expeditionen, ev.id)) return aus;
    ledger.expeditionen[ev.id] = heute;
    aus.neu = true;
    for (const [f, n] of Object.entries(objekt(ev.rohstoffe) ? ev.rohstoffe : {})) {
      if (kennung(f) && zahl(n) > 0) { plus(ledger.ertrag, f, n); plus(aus.ertrag, f, n); }
    }
    if (kennung(ev.sammlung) && !ledger.sammlung.some(s => objekt(s) && s.id === ev.sammlung)) {
      ledger.sammlung.push({ id: ev.sammlung, tag: heute, quelle: ev.id });
      aus.sammlung = ev.sammlung;
    }
    return aus;
  }

  L.Ledger = { leer, sicher, verbucheAufgabe, verbucheThema, verbucheExpedition };
})(globalThis);
