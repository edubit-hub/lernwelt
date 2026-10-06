/* module/_gemeinsam/schreibantwort.js: gemeinsamer Baustein für Module mit getippten Antworten (Übungstyp «lueckentext», Form «satz»).
   Der Typ meldet als antwort { luecken: [Eingaben], arten: ['richtig' | 'gross-klein' | 'falsch'] }. Dieser Baustein liest das Feld sicher
   und erkennt zwei häufige Schreibfehler, die ein Generator in diagnose() einem Fehlercode zuordnen kann: nur die Gross-/Kleinschreibung
   weicht ab, oder ein Umlaut fehlt (alter statt älter). Reine Funktionen auf Texten: kein Zustand, keine Oberfläche, kein Zufall.
   Gebrauch: das Modul nennt den Baustein in modul.js unter braucht: ['_gemeinsam/schreibantwort'], sein Generator liest ihn in diagnose()
   mit Lernwelt.registry.bausteine.get('_gemeinsam/schreibantwort'). Fehlende oder falsch gebaute Antworten ergeben '' beziehungsweise false. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ARTEN = ['richtig', 'gross-klein', 'falsch'];
  const BASIS = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U' };
  const UMLAUT = /[äöüÄÖÜ]/g;

  const text = v => (typeof v === 'string' ? v.normalize('NFC').trim().replace(/\s+/g, ' ') : '');
  const ohneUmlaut = s => text(s).replace(UMLAUT, c => BASIS[c]);
  const zahlUmlaute = s => (text(s).match(UMLAUT) || []).length;
  const arten = antwort => (antwort && Array.isArray(antwort.arten) ? antwort.arten.filter(a => ARTEN.includes(a)) : []);

  L.baustein('_gemeinsam/schreibantwort', L.einfrieren({
    /** Die Eingabe der Lücke i, bereinigt (NFC, Leerraum zusammengefasst). Ohne gültige Antwort ''. */
    eingabe: (antwort, i = 0) => text(antwort && Array.isArray(antwort.luecken) ? antwort.luecken[i] : ''),

    /** Die Art der Lücke i: 'richtig', 'gross-klein' oder 'falsch'. Ohne gültige Antwort null. */
    art: (antwort, i = 0) => {
      const a = antwort && Array.isArray(antwort.arten) ? antwort.arten[i] : null;
      return ARTEN.includes(a) ? a : null;
    },

    /** Mindestens eine Lücke weicht nur in der Gross-/Kleinschreibung ab, und keine ist inhaltlich falsch. */
    nurGrossKlein: antwort => { const a = arten(antwort); return a.includes('gross-klein') && !a.includes('falsch'); },

    /** Der Text ohne Umlaute (ä wird a, Ä wird A). */
    ohneUmlaut,

    /** Die Eingabe ist das Soll-Wort mit weniger Umlauten (alter statt älter). Gleiche Wörter und andere Unterschiede ergeben false. */
    umlautFehlt: (eingabe, soll) => { const e = text(eingabe), s = text(soll); return e !== '' && e !== s && ohneUmlaut(e) === ohneUmlaut(s) && zahlUmlaute(e) < zahlUmlaute(s); },

    /** Beide Wörter sind bis auf die Gross-/Kleinschreibung gleich, aber nicht identisch. */
    nurGrossKleinGleich: (eingabe, soll) => { const e = text(eingabe), s = text(soll); return e !== '' && e !== s && e.toLowerCase() === s.toLowerCase(); }
  }));
})(globalThis);
