/* app/kern/fehlerlog.js: Ring der letzten 50 Fehler (Architektur 8.8). Der Safari-Inspektor braucht praktisch einen Mac, deshalb ist
   dieser Ring die Diagnose auf dem iPad. Er liegt nur im Arbeitsspeicher und gehört nicht in die Sicherung.
   melde() wirft nie. Quellen: window.error, unhandledrejection, Ladefehler des Laders, Speicherfehler (meldet Zustand). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const GROESSE = 50, MAX_ZEICHEN = 300;

  /** Kurzer Ort «datei.js:zeile» aus einem Stacktrace (Safari «f@https://h/x.js:12:3», Chrome «at f (https://h/x.js:12:3)»). */
  function ortAus(stack) {
    const m = /([^\s()@\/\\]+\.js):(\d+)/.exec(String(stack || ''));
    return m ? `${m[1]}:${m[2]}` : '';
  }

  function neuesFehlerlog(opt = {}) {
    const jetzt = opt.jetzt || (() => new Date());
    const ring = [];
    let abmelden = null;

    /** was: Error, Text oder Ereignisdaten. info: { art, datei }. art ist fehler, ablehnung, laden, speicher oder hinweis. */
    function melde(was, info = {}) {
      try {
        const fehler = was instanceof Error ? was : null;
        const text = fehler ? `${fehler.name}: ${fehler.message}` : String(was ?? 'Unbekannter Fehler');
        const eintrag = {
          zeit: jetzt().toISOString(), art: info.art || 'fehler',
          meldung: text.slice(0, MAX_ZEICHEN), datei: String(info.datei || (fehler && ortAus(fehler.stack)) || ''), n: 1
        };
        const letzter = ring[ring.length - 1];
        if (letzter && letzter.art === eintrag.art && letzter.meldung === eintrag.meldung && letzter.datei === eintrag.datei) {
          letzter.n += 1; letzter.zeit = eintrag.zeit;           // dieselbe Meldung in Folge: zählen statt den Ring zu fluten
        } else {
          ring.push(eintrag);
          if (ring.length > GROESSE) ring.shift();
        }
        return true;
      } catch (e) { return false; }
    }

    const liste = () => ring.map(e => ({ ...e }));
    const leere = () => { ring.length = 0; };
    const text = () => ring.map(e => `${e.zeit} [${e.art}] ${e.meldung}${e.datei ? ` (${e.datei})` : ''}${e.n > 1 ? ` (${e.n} mal)` : ''}`).join('\n');

    /** Hängt window.error und unhandledrejection ein. Gibt die Abmeldung zurück. Ein zweiter Aufruf meldet zuerst ab. */
    function installiere(ziel = g) {
      if (abmelden) abmelden();
      const beiFehler = e => {
        if (e && e.target && e.target !== ziel && (e.target.src || e.target.href)) return;     // Ladefehler meldet der Lader selbst
        const ort = e && e.filename ? `${String(e.filename).split('/').pop()}:${e.lineno}` : '';
        melde(e && e.error instanceof Error ? e.error : (e && e.message) || 'Fehler', { datei: ort });     // e.error ist der Error selbst, e.message trägt in Chrome ein «Uncaught» davor
      };
      const beiAblehnung = e => melde(e && e.reason instanceof Error ? e.reason : `Abgelehnt: ${e && e.reason}`, { art: 'ablehnung' });
      ziel.addEventListener('error', beiFehler, true);
      ziel.addEventListener('unhandledrejection', beiAblehnung);
      abmelden = () => {
        ziel.removeEventListener('error', beiFehler, true);
        ziel.removeEventListener('unhandledrejection', beiAblehnung);
        abmelden = null;
      };
      return abmelden;
    }

    /** Verbindet den Lader (Lernwelt.Lader): schon aufgelaufene und künftige Ladefehler landen im Ring. */
    function verbindeLader(lader) {
      const melden = e => melde(e.meldung || 'Laden fehlgeschlagen', { art: 'laden', datei: e.datei });
      (lader.fehler || []).forEach(melden);
      const vorher = lader.beiFehler;
      lader.beiFehler = e => { melden(e); if (typeof vorher === 'function') vorher(e); };
    }

    return { GROESSE, melde, liste, leere, text, installiere, verbindeLader };
  }

  L.neuesFehlerlog = neuesFehlerlog;
  L.Fehlerlog = neuesFehlerlog();
})(globalThis);
