/* app/kern/sicherung.js: Export und Import des Lernstands als Datei (Architektur 8.3). Reine Funktionen: Dateiauswahl, Teilen-Menü
   und Download-Link liegen in der Ansicht. exportiere ist synchron, damit share() direkt im Klick-Handler stehen kann.
   lese wirft nie und meldet jeden Fehler als Text, der dem Elternteil gezeigt werden darf. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const FORMAT = 'lernwelt-sicherung';
  const summe = text => L.Zufall.hash(text).toString(16).padStart(8, '0');
  const istObjekt = x => x !== null && typeof x === 'object' && !Array.isArray(x);

  /** Dateiname nach Konvention 3.0: lernwelt_sicherung_JJJJ-MM-TT_1.0.json */
  const dateiname = heute => `lernwelt_sicherung_${heute}_1.0.json`;

  /** Die Sicherung als Objekt. Mit JSON.stringify wird daraus der Dateitext. app ist L.version.app. */
  function exportiere(zustand, appVersion, jetzt = new Date()) {
    return {
      format: FORMAT, schema: zustand.schema, app: appVersion || 'unbekannt', erstellt: jetzt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      pruefsumme: summe(JSON.stringify(zustand)), daten: zustand
    };
  }

  /** Liest den Text einer Sicherungsdatei. Wirft nie. → { ok: true, daten, vorschau } oder { ok: false, fehler }.
      Reihenfolge der Prüfungen: JSON, Objekt mit format, Objekt unter daten, Prüfsumme, schema, nicht neuer als die App, Migration.
      opt (für Tests): { ziel, tabelle } wie bei Migration.aufStand. */
  function lese(text, opt = {}) {
    try {
      let d;
      try { d = JSON.parse(typeof text === 'string' ? text.replace(/^\uFEFF/, '') : text); } catch (e) { return { ok: false, fehler: 'Die Datei ist keine gültige Sicherung (kein JSON).' }; }
      if (!istObjekt(d) || d.format !== FORMAT) return { ok: false, fehler: 'Das ist keine Lernwelt-Sicherung.' };
      if (!istObjekt(d.daten)) return { ok: false, fehler: 'Die Sicherung enthält keine Daten.' };
      if (summe(JSON.stringify(d.daten)) !== d.pruefsumme) return { ok: false, fehler: 'Die Datei ist beschädigt (Prüfsumme stimmt nicht).' };
      const daten = L.Migration.aufStand(d.daten, opt);
      const mods = Object.values(daten.module);
      const aufgaben = mods.reduce((n, m) => n + Object.keys(m.aufgaben).length, 0);
      return {
        ok: true, daten,
        vorschau: { erstellt: typeof d.erstellt === 'string' ? d.erstellt : null, app: typeof d.app === 'string' ? d.app : null,
          vorname: typeof daten.profil.vorname === 'string' ? daten.profil.vorname : '', module: mods.length, aufgaben, tage: Object.keys(daten.tage).length }
      };
    } catch (e) {
      return { ok: false, fehler: (e && e.message) || 'Unbekannter Fehler beim Lesen der Sicherung.' };
    }
  }

  L.Sicherung = { FORMAT, dateiname, exportiere, lese };
})(globalThis);
