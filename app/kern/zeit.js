/* app/kern/zeit.js: Kalendertage als Text «JJJJ-MM-TT». Die Rechnung läuft über UTC-Tagesnummern und ist deshalb von der
   Sommerzeit unabhängig (Architektur 6.10). Nur Tag.heute() liest die lokalen Felder der Uhr. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const MS = 86400000;
  const z2 = n => String(n).padStart(2, '0');

  /** Tagesnummer seit 1970 oder NaN, wenn der Text kein gültiger Kalendertag ist (zum Beispiel 2026-02-30). */
  function nummer(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return NaN;
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return new Date(t).toISOString().slice(0, 10) === iso ? t / MS : NaN;
  }
  function nr(iso) {
    const n = nummer(iso);
    if (Number.isNaN(n)) throw new Error(`Ungültiger Tag «${iso}», erwartet JJJJ-MM-TT`);
    return n;
  }

  L.Tag = {
    heute: (jetzt = new Date()) => `${jetzt.getFullYear()}-${z2(jetzt.getMonth() + 1)}-${z2(jetzt.getDate())}`,
    gueltig: iso => !Number.isNaN(nummer(iso)),
    plus: (iso, n) => new Date((nr(iso) + n) * MS).toISOString().slice(0, 10),
    diff: (a, b) => nr(a) - nr(b),                                     // a minus b, in Tagen
    wochentag: iso => (new Date(nr(iso) * MS).getUTCDay() + 6) % 7,    // 0 = Montag
    /** Der spielbare Tag: nie vor dem letzten gespielten Tag, damit bei zurückgestellter Uhr nichts doppelt zählt. */
    spieltag: (realTag, letzterTag) => (letzterTag && letzterTag > realTag ? letzterTag : realTag),
    /** Wahr, wenn der reale Tag mehr als `grenze` Tage hinter dem letzten gespielten Tag liegt (der Elternbereich fragt dann). */
    uhrHinterher: (realTag, letzterTag, grenze = 14) => !!letzterTag && nr(letzterTag) - nr(realTag) > grenze
  };
})(globalThis);
