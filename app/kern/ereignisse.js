/* app/kern/ereignisse.js: der Ereignisbus. on(art, fn) meldet an und gibt die Abmeldung zurück, emit(art, daten) sendet.
   Es gibt vier Ereignisse (Architektur 2.5): lern:aufgabe, lern:thema, lern:sitzung, lern:pruefung. Nur der Lauf sendet sie. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  function neuerBus() {
    const hoerer = new Map();
    return {
      on(art, fn) {
        if (typeof fn !== 'function') throw new Error(`Ereignis «${art}»: Hörer ist keine Funktion`);
        if (!hoerer.has(art)) hoerer.set(art, []);
        hoerer.get(art).push(fn);
        return () => this.off(art, fn);
      },
      off(art, fn) {
        const liste = hoerer.get(art) || [];
        const i = liste.indexOf(fn);
        if (i >= 0) liste.splice(i, 1);
      },
      /** Ruft alle Hörer der Reihe nach. Ein fehlerhafter Hörer stoppt die anderen nicht. Gibt die Zahl der Hörer zurück. */
      emit(art, daten) {
        const liste = (hoerer.get(art) || []).slice();
        liste.forEach(fn => {
          try { fn(daten); } catch (fehler) { (g.console || { error() {} }).error(`Hörer von «${art}» ist fehlgeschlagen:`, fehler); }
        });
        return liste.length;
      }
    };
  }

  L.neuerBus = neuerBus;
  L.bus = neuerBus();
})(globalThis);
