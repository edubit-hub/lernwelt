/* app/ansichten/abschluss-texte.js: die Texte der Logbuchseite nach einer Runde (docs/gestaltung-umbau.md 2.8, Paket A3). Der Satz des Laufs
   (Rueckmeldung.texte.abschluss) und die Sätze «Neu möglich» (Texte.abschluss in texte.js) bleiben, wie sie sind; hier stehen nur die neuen Teile:
   Kopf mit Datum, Stempel, Überschriften der Abschnitte, Karte «Neu möglich» und die Knöpfe. Sachlich, Du-Form, ohne Ausrufezeichen, ohne Lob.
   tests/abschluss.test.mjs prüft jeden Text mit Pruefung.pruefeTexte. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  /** «JJJJ-MM-TT» → { lang: «Donnerstag, 22. Oktober», kurz: «22.10.» }, sonst null. Der Wochentag ist unabhängig von der Zeitzone. */
  function datum(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    const j = +m[1], mo = +m[2], t = +m[3], wt = new Date(Date.UTC(j, mo - 1, t)).getUTCDay();
    if (!MONATE[mo - 1] || !Number.isInteger(wt)) return null;
    return { lang: `${WOCHENTAGE[wt]}, ${t}. ${MONATE[mo - 1]}`, kurz: `${t}.${mo}.` };
  }

  L.Texte = L.Texte || {};
  L.Texte.abschlussseite = {
    datum,
    kicker: lang => (lang ? `Logbuch · ${lang}` : 'Logbuch'),
    stempel: 'Eingetragen', stempelUnten: 'Logbuch',
    stempelBeschriftung: lang => (lang ? `Eingetragen im Logbuch, ${lang}` : 'Eingetragen im Logbuch'),
    ertrag: 'Ertrag', ertragZeile: (name, menge) => `${name} +${menge}`,
    unterwegs: 'Unterwegs', tor: 'Tor zur nächsten Epoche',
    neu: 'Neu möglich', ortSiedlung: 'Ort: Siedlung', ortForschung: name => `Ort: ${name || 'Forschung'}`,
    ansehen: name => `${name} ansehen`, forschungAnsehen: 'Forschung ansehen',
    weiterUeben: 'Weiter üben', zurSiedlung: 'Zur Siedlung', zumStart: 'Zum Start',
    knoepfe: 'Wie es weitergeht',
    // Nachbesserung 2: der grosse Knopf für die nächste offene Runde des Tages
    naechsteRunde: name => `Nächste Runde: ${name}`, rundeUmfang: (n, m) => `${n} ${n === 1 ? 'Aufgabe' : 'Aufgaben'}, etwa ${m} Min.`,
    // Titel der Seite (Nachbesserung 1): ein eigener Titel, der Satz des Laufs steht darunter
    titelRunde: 'Runde fertig', titelTag: 'Tagesauftrag erledigt', titelPause: 'Pause', titelZeit: 'Zeit für heute um',
    // Karte «Als Nächstes»: genau ein nächster Schritt mit einem Knopf
    alsNaechstes: 'Als Nächstes', wissenNoch: (name, hat, braucht) => `${name}: Wissen ${hat} von ${braucht}`, ortUeben: 'Ort: Tagesauftrag'
  };
})(globalThis);
