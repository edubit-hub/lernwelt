/* module/_gemeinsam/familien.js: gemeinsames Gerüst für Generatoren mit Aufgabenfamilien (modul-schema.md Abschnitt 6, Architektur 4.3).
   Eine Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen: der Lernstand gilt für die ganze Familie. bauen() macht aus
   einer Liste von Familien die drei Funktionen eines Generators (pool, instanz, diagnose), die das Modul mit Lernwelt.generator anmeldet.
   Familie: { id, s, form, mach(rng) → { inhalt, hilfe? }, diag?(aufgabe, antwort) → Fehlercode | null }
     id      stabil, nie ändern (Muster wie Aufgaben-IDs)         s       Schwierigkeit 1 bis 3
     mach    erzeugt eine Instanz aus dem rng; Zufall nur über rng, nie Math.random oder die Uhr
   pool() ist für jeden Aufruf gleich: jede Familie erscheint mit einer festen Beispielinstanz (Seed aus Generator und ID).
   Reine Berechnung, kein Zustand, keine Oberfläche. Gebrauch: modul.js nennt den Baustein unter braucht, der Generator liest ihn mit
   Lernwelt.registry.bausteine.get('_gemeinsam/familien'). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;

  /** Aus Familien die Funktionen eines Generators. name steht in Fehlermeldungen und im Seed. standard ist die Diagnose für Familien ohne eigene.
      voraussetzungen: { id: [IDs anderer Familien dieses Generators] }, was zuerst sicher sein muss (wird zu braucht der Aufgabe). */
  function bauen(name, familien, standard, voraussetzungen = {}) {
    const nach = new Map();
    for (const f of familien) {
      if (!ID.test(f.id)) throw new Error(`${name}: Familien-ID «${f.id}» passt nicht zum ID-Muster`);
      if (nach.has(f.id)) throw new Error(`${name}: Familien-ID «${f.id}» kommt doppelt vor`);
      if (typeof f.mach !== 'function' || ![1, 2, 3].includes(f.s)) throw new Error(`${name}: Familie «${f.id}» braucht mach() und s von 1 bis 3`);
      nach.set(f.id, f);
    }
    for (const [id, liste] of Object.entries(voraussetzungen)) {
      if (!nach.has(id) || liste.some(v => !nach.has(v) || v === id)) throw new Error(`${name}: voraussetzungen von «${id}» nennt eine unbekannte Familie oder sich selbst`);
    }
    const stueck = (f, rng) => {
      const r = f.mach(rng);
      return { inhalt: r.inhalt, ...(r.hilfe ? { hilfe: r.hilfe } : {}) };
    };
    return {
      pool: () => familien.map(f => ({ id: f.id, form: f.form, schwierigkeit: f.s, braucht: [...(voraussetzungen[f.id] || [])], ...stueck(f, L.Zufall.aus(`pool|${name}|${f.id}`)) })),
      instanz(aufgabe, rng) {
        const f = nach.get(aufgabe.id);
        if (!f) throw new Error(`${name}: Aufgabe «${aufgabe.id}» gehört nicht zu diesem Generator`);
        return stueck(f, rng);
      },
      diagnose(aufgabe, antwort) {
        const f = nach.get(aufgabe.id), d = (f && f.diag) || standard;
        return d ? d(aufgabe, antwort || {}) : null;
      }
    };
  }

  /** Diagnose für Aufgaben, deren Antwort eine Zahl ist (antwort.zahl). Richtig ergibt null, keine Zahl ergibt «sonstige».
      Jede Regel (z, c, inhalt) gibt einen Fehlercode oder etwas Falsches zurück, die erste Regel mit Treffer gilt. */
  const zahlDiag = (...regeln) => (aufgabe, antwort) => {
    const z = antwort && antwort.zahl, c = aufgabe.inhalt.ergebnis;
    if (z === c) return null;
    if (!Number.isInteger(z)) return 'sonstige';
    for (const regel of regeln) {
      const code = regel(z, c, aufgabe.inhalt);
      if (code) return code;
    }
    return 'sonstige';
  };

  L.baustein('_gemeinsam/familien', L.einfrieren({ bauen, zahlDiag }));
})(globalThis);
