/* app/lernsteuerung/wiederholung.js: Leitner-Boxen je Aufgabe (Architektur 6.2). Reine Funktionen, kein Speicher, kein DOM.
   Alle Zahlen kommen bei jedem Aufruf aus L.lernregeln.wiederholung und L.lernregeln.pruefung. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const KURZ = { richtig: '1', hilfe: 'h', falsch: '0', gezeigt: 'g' };   // Zeichen im Verlauf
  const VERLAUF = 8;                                                      // der Verlauf hält die letzten 8 Urteile

  /** Zustand einer noch nie gesehenen Aufgabe. */
  const leer = heute => ({ box: 0, faellig: heute, versuche: 0, richtig: 0, verlauf: '', zuletzt: null });

  /** Wahr, wenn die Aufgabe am Tag `heute` fällig ist. Eine noch nie gesehene Aufgabe ist es immer. */
  const faellig = (z, heute) => !z || !(z.versuche > 0) || !z.faellig || z.faellig <= heute;

  /**
   * Verbucht ein Urteil und gibt den neuen Zustand zurück (z0 bleibt unverändert).
   * @param z0     bisheriger Zustand der Aufgabe oder undefined
   * @param e      { urteil: 'richtig' | 'hilfe' | 'falsch' | 'gezeigt', vortest?, nachfassen?, raten? }
   * @param heute  'JJJJ-MM-TT'
   * @param deckel höchster erlaubter Abstand in Tagen (Prüfungsplan, siehe deckelFuer) oder null
   */
  function verbuche(z0, e, heute, deckel = null) {
    const R = L.lernregeln.wiederholung;
    if (!e || !Object.hasOwn(KURZ, e.urteil)) throw new Error(`Wiederholung.verbuche: unbekanntes Urteil «${e && e.urteil}»`);
    const z = { ...leer(heute), ...z0 };
    const warFaellig = faellig(z, heute);
    z.versuche += 1;
    z.zuletzt = heute;
    if (e.urteil === 'richtig') z.richtig += 1;
    z.verlauf = (z.verlauf + KURZ[e.urteil]).slice(-VERLAUF);
    if (e.nachfassen) return z;                         // gleiche Sitzung: kein unabhängiger Beweis, Box und Termin bleiben

    let tage;
    if (e.urteil === 'gezeigt') { z.box = Math.max(z.box, 1); tage = R.intervalle[1]; }
    else if (e.urteil === 'falsch') {
      z.box = Math.max(1, z.box - R.fehlerSchritte); tage = 1;
      if (!e.raten) z.offen = true; else delete z.offen;   // ein Fehler ohne Nachdenken gilt später nicht als «korrigiert»
    }
    else if (e.urteil === 'hilfe') { z.box = Math.max(1, z.box); tage = 1; }
    else if (z.box === 0 && e.vortest) { z.box = 1; tage = R.vortestTage; }
    else {
      if (warFaellig) { z.box = Math.min(R.intervalle.length - 1, z.box + 1); delete z.offen; }   // vorzeitiges Üben ändert die Box nicht
      tage = R.intervalle[z.box];
    }
    z.faellig = L.Tag.plus(heute, deckel == null ? tage : Math.min(tage, Math.max(1, deckel)));
    return z;
  }

  /** Höchster erlaubter Abstand in Tagen, wenn in `tageBisPruefung` Tagen eine Prüfung ansteht. null heisst: kein Deckel. */
  function deckelFuer(tageBisPruefung) {
    if (!Number.isFinite(tageBisPruefung)) return null;
    const regel = L.lernregeln.pruefung.intervallDeckel.find(([bis]) => tageBisPruefung <= bis);
    return regel ? regel[1] : null;
  }

  L.Wiederholung = { leer, faellig, verbuche, deckelFuer };
})(globalThis);
