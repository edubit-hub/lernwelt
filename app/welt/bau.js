/* app/welt/bau.js: Bauphasen der Themenareale aus dem Verdienstbuch (Ä19 «Bauen durch Lernen», E-2010-03). Reine Logik ohne DOM und ohne Zustand.
     Bau.zaehle(areal, ledger, aufgabenVon) → { themen, richtig, basis, sicher }
       richtig: verschiedene Aufgaben des Areals, die mindestens Box 2 erreicht haben (ledger.vergeben, also selbständig richtig gelöst);
       basis, sicher: Themen des Areals mit dieser Stufe in ledger.errungen. aufgabenVon(modul, thema) → [{ id }].
     Bau.phase(zahlen, regeln) → 0 Bauplatz, 1 Fundament, 2 Rohbau, 3 Ausgebaut. Die Phasen bauen aufeinander auf, die Schwellen stehen in weltregeln.bau.
     Bau.fortschreibe(alt, neu) → { arealId: phase }: eine erreichte Phase bleibt, auch wenn ein Thema später wegfällt oder zurückfällt.
   Das Verdienstbuch wächst nur, deshalb sinken die Zahlen nie. fortschreibe sichert das zusätzlich für geänderte Zuordnungen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const eigen = (o, k) => (objekt(o) && Object.hasOwn(o, k) ? o[k] : undefined);
  const PHASEN = ['bauplatz', 'fundament', 'rohbau', 'ausgebaut'];

  function zaehle(areal, ledger, aufgabenVon) {
    const z = { themen: 0, richtig: 0, basis: 0, sicher: 0 };
    if (!objekt(areal) || !Array.isArray(areal.themen)) return z;
    const vergeben = objekt(ledger) ? ledger.vergeben : null, errungen = objekt(ledger) ? ledger.errungen : null;
    for (const t of areal.themen) {
      z.themen += 1;
      const e = eigen(errungen, t.key);
      if (objekt(e) && e.basis) z.basis += 1;
      if (objekt(e) && e.sicher) z.sicher += 1;
      const boxen = eigen(vergeben, t.modul);
      if (!objekt(boxen) || typeof aufgabenVon !== 'function') continue;
      for (const a of aufgabenVon(t.modul, t.thema) || []) if (a && (Number(eigen(boxen, a.id)) || 0) >= 2) z.richtig += 1;
    }
    return z;
  }

  function phase(z, regeln) {
    const R = regeln || (L.weltregeln && L.weltregeln.bau);
    if (!objekt(z) || !R || !(z.themen > 0)) return 0;
    if (!(z.richtig >= R.fundament.richtig)) return 0;
    if (!(z.basis >= Math.ceil(z.themen * R.rohbau.basisAnteil))) return 1;
    if (!(z.sicher >= Math.ceil(z.themen * R.fertig.sicherAnteil))) return 2;
    return 3;
  }

  function fortschreibe(alt, neu) {
    const aus = {};
    for (const q of [alt, neu]) if (objekt(q)) for (const [k, v] of Object.entries(q)) {
      const n = Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0;
      if (k !== '__proto__' && n > (eigen(aus, k) || 0)) aus[k] = n;
    }
    return aus;
  }

  L.Bau = { zaehle, phase, fortschreibe, PHASEN };
})(globalThis);
