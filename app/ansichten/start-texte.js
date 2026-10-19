/* app/ansichten/start-texte.js: die neuen Texte der Startansicht, des Profils und der Einstufung (docs/gestaltung-umbau.md 2.2 bis 2.4, 6.1).
   Die bisherigen Texte (Gruss, Satz zum Tag, Ferien, Eltern) bleiben in texte.js (Texte.start) und der Einstufung (Texte.einstufung, einstieg.js).
   Der Ton ist sachlich und auf Augenhöhe: keine Ausrufezeichen, kein Lob, kein Druck, keine technischen Kennungen.
   tests/start-ansicht.test.mjs prüft jeden Text mit Pruefung.pruefeTexte und dem Muster der Kennungen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  /** «Donnerstag, 22. Oktober» aus einem Tag im Format JJJJ-MM-TT. Ein unlesbarer Tag ergibt einen leeren Text. */
  function datum(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '';
    const tag = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return `${WOCHENTAGE[tag.getUTCDay()]}, ${+m[3]}. ${MONATE[+m[2] - 1]}`;
  }

  L.Texte = L.Texte || {};
  L.Texte.startseite = {
    datum,
    begruessung: 'Begrüssung',
    // Profil beim ersten Start (Tafel «halb»)
    profilKicker: 'Erste Angaben',
    profilTitel: 'Wie heisst du?',
    // Nächstes Ziel auf der Begrüssungskarte
    zielKicker: 'Nächstes Ziel',
    zielOeffnen: name => `Nächstes Ziel: ${name}. Zur Forschung`,
    // Zusätze an den Ortsschildern der Insel
    schildBereit: name => `${name} bereit`, schildTorBereit: 'bereit zum Erforschen', schildNoch: text => `noch ${text}`,
    schildWissen: (hat, braucht) => `Wissen ${hat} von ${braucht}`, schildExpedition: n => (n === 1 ? '1 Expedition bereit' : `${n} Expeditionen bereit`),
    schildAusbau: 'Ausbau möglich', schildBauen: 'Bauen möglich',
    // Karte der Einstufung in der Tagesauftrag-Auswahl
    einstufungKicker: 'Neues Modul',
    einstufungLead: 'Zuerst schauen wir, was du schon kannst.'
  };
})(globalThis);
