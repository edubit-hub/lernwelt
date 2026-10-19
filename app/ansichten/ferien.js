/* app/ansichten/ferien.js: Schulkalender 2026/27 und Ferienmodus (AP-13b). Reine Daten und Rechnung, kein DOM, nichts wird geschrieben.
   Die Daten stammen aus docs/recherche/curriculum-map.json (hinweise.kalender_2026_27 und schulwochen) und gelten für die Schulen der Gemeinde im Kanton Zug.
   Die Einstellung steht im Lernstand: einstellungen.ferien = { modus: 'auto' | 'an' | 'aus', bis?: 'JJJJ-MM-TT', eigene: [{ von, bis, name }] }.
   auto folgt dem Kalender (und den eigenen Zeiträumen), an gilt bis zum Datum «bis» (ohne Datum bis zum Ausschalten), aus ignoriert die Ferien.
   Vorgabe ohne Einstellung ist «aus» (Entscheid vom 19.10.2026: der Tagesauftrag gilt auch in den Ferien). Den Kalender schalten die Eltern bei Bedarf ein.
   Schulwochen zählen ab dem Schuljahresbeginn: wocheVon(tag) nennt die Woche, die den Tag enthält, in den Ferien die nächste Schulwoche. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const BEGINN = '2026-08-17', ENDE = '2027-07-02';
  const FERIEN = [
    { name: 'Herbstferien', von: '2026-10-03', bis: '2026-10-18' },
    { name: 'Weihnachtsferien', von: '2026-12-19', bis: '2027-01-03' },
    { name: 'Sportferien', von: '2027-02-06', bis: '2027-02-21' },
    { name: 'Frühlingsferien', von: '2027-04-17', bis: '2027-05-02' },
    { name: 'Auffahrt', von: '2027-05-06', bis: '2027-05-09' },
    { name: 'Sommerferien', von: '2027-07-03', bis: null }
  ];
  const FREI = [
    { name: 'Mariä Empfängnis', tag: '2026-12-08' }, { name: 'Karfreitag', tag: '2027-03-26' }, { name: 'Ostermontag', tag: '2027-03-29' },
    { name: 'Pfingstmontag', tag: '2027-05-17' }, { name: 'Fronleichnam', tag: '2027-05-27' }
  ];
  const MONTAGE = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-19', '2026-10-26', '2026-11-02',
    '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30', '2026-12-07', '2026-12-14', '2027-01-04', '2027-01-11', '2027-01-18', '2027-01-25', '2027-02-01',
    '2027-02-22', '2027-03-01', '2027-03-08', '2027-03-15', '2027-03-22', '2027-03-29', '2027-04-05', '2027-04-12', '2027-05-03', '2027-05-10', '2027-05-17',
    '2027-05-24', '2027-05-31', '2027-06-07', '2027-06-14', '2027-06-21', '2027-06-28'];
  const MODI = ['auto', 'an', 'aus'];
  const gueltig = t => typeof t === 'string' && L.Tag.gueltig(t);

  /** Die Einstellung aus dem Lernstand, immer vollständig und gültig. */
  function einstellung(doc) {
    const e = (doc && doc.einstellungen && doc.einstellungen.ferien) || {};
    const eigene = (Array.isArray(e.eigene) ? e.eigene : []).filter(x => x && gueltig(x.von) && gueltig(x.bis) && x.von <= x.bis)
      .map(x => ({ von: x.von, bis: x.bis, name: String(x.name || 'Ferien').slice(0, 40) }));
    return { modus: MODI.includes(e.modus) ? e.modus : 'aus', bis: gueltig(e.bis) ? e.bis : null, eigene };
  }

  /** Alle Zeiträume des Kalenders und der eigenen Eintragungen, nach Beginn geordnet: [{ name, von, bis (null = offen), quelle }]. */
  const abschnitte = e => [...FERIEN.map(f => ({ ...f, quelle: 'kalender' })), ...FREI.map(f => ({ name: f.name, von: f.tag, bis: f.tag, quelle: 'kalender' })),
    ...(e || { eigene: [] }).eigene.map(x => ({ ...x, quelle: 'eigen' }))].sort((a, b) => (a.von < b.von ? -1 : a.von > b.von ? 1 : 0));
  const enthaelt = (tag, a) => tag >= a.von && (a.bis === null || tag <= a.bis);

  /** Der Zeitraum, in dem der Tag liegt (Kalender oder eigener Eintrag), sonst null. Unabhängig vom Modus. */
  const imKalender = (tag, e) => abschnitte(e).find(a => enthaelt(tag, a)) || null;

  /** Die Lage am Tag: { modus, aktiv, grund: 'kalender' | 'manuell' | null, name, bis, naechste: { name, von, bis } | null }. */
  function lage(doc, tag) {
    const e = einstellung(doc), k = imKalender(tag, e), naechste = abschnitte(e).find(a => a.von > tag) || null;
    let aktiv = false, grund = null, name = null, bis = null;
    if (e.modus === 'an' && (e.bis === null || tag <= e.bis)) { aktiv = true; grund = 'manuell'; name = 'Ferienmodus'; bis = e.bis; }
    else if (e.modus === 'auto' && k) { aktiv = true; grund = 'kalender'; name = k.name; bis = k.bis; }
    return { modus: e.modus, aktiv, grund, name, bis, naechste };
  }

  /** Zahl der Kalendertage von `von` (einschliesslich) bis `bis` (ausschliesslich), die im Kalender oder in eigenen Zeiträumen liegen. */
  function tageIn(von, bis, doc) {
    const e = einstellung(doc);
    let n = 0;
    for (let d = von; L.Tag.diff(bis, d) > 0; d = L.Tag.plus(d, 1)) if (imKalender(d, e)) n += 1;
    return n;
  }

  /** Die Schulwoche (ab 1), die den Tag enthält, in den Ferien die nächste. null nach dem Ende des Schuljahres 2026/27. */
  function wocheVon(tag) {
    if (!gueltig(tag) || tag > ENDE) return null;
    const montag = L.Tag.plus(tag, -L.Tag.wochentag(tag)), i = MONTAGE.findIndex(m => m >= montag);
    return i < 0 ? null : i + 1;
  }
  /** Der Montag einer Schulwoche, null für eine Woche ausserhalb von 1 bis 38. */
  const montagDer = woche => MONTAGE[woche - 1] || null;

  L.Ferien = { FERIEN, FREI, MONTAGE, MODI, BEGINN, ENDE, einstellung, abschnitte, imKalender, lage, tageIn, wocheVon, montagDer };
})(globalThis);
