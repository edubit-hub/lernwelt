/* app/lauf/zugriff.js: Zugriff des Laufs auf Module und Lernstand für die Dauer einer Runde (gleicher Namensraum wie dienste.js).
   Katalog: Module, Themen und Aufgaben, jede Aufgabe nur einmal gebaut. Lernstand: Lesen und Schreiben der Aufgabenzustände, des Tageslogs,
   der Fehlerzähler und des Fensters der fälligen Abrufe. Geschrieben wird immer über Zustand.aendere, ohne Schreiben nur in einer Kopie. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const D = (L.Dienste = L.Dienste || {});

  /** Das Zustandsdokument oder ein leeres Objekt: Zustand.hole() wirft, solange der Zustand nicht gestartet ist (Vorschau, Tests). */
  function holeDokument() {
    try { return (L.Zustand && L.Zustand.hole && L.Zustand.hole()) || {}; } catch (fehler) { return {}; }
  }
  D.dokument = holeDokument;

  // ---- Katalog -----------------------------------------------------------------------------------------------
  /** Hält die Aufgaben der beteiligten Module bereit. heute: Tag für die Instanzen der Generatoren. Ein fehlerhaftes Modul meldet seinen Grund. */
  D.katalog = function katalog(heute) {
    const module = new Map(), themen = new Map();
    const anpassung = id => { const m = (holeDokument().module || {})[id]; return m ? m.anpassung : undefined; };
    function eintrag(id) {
      if (module.has(id)) return module.get(id);
      const modul = L.registry.module.get(id), e = { modul, ids: new Map(), proThema: new Map(), grund: null };
      if (!modul) e.grund = `Modul «${id}» ist nicht geladen`;
      else try {
        for (const t of modul.themen || []) {
          const liste = L.Modell.aufgaben(modul, t);
          e.proThema.set(t.id, liste);
          liste.forEach(a => e.ids.set(a.id, a));
        }
      } catch (fehler) { e.grund = `Modul «${id}» ist fehlerhaft: ${fehler.message}`; e.ids.clear(); e.proThema.clear(); }
      module.set(id, e);
      return e;
    }
    return {
      modul: id => eintrag(id).modul || null,
      /** Findet die Aufgabe zu «modul/id» und gibt { aufgabe } als Instanz des Tages oder { grund } zurück. */
      suche(key) {
        const i = String(key).indexOf('/');
        if (i < 1) return { grund: `Schlüssel «${key}» ist ungültig` };
        const e = eintrag(key.slice(0, i)), a = e.ids.get(key.slice(i + 1));
        return a ? { aufgabe: L.Modell.instanz(a, heute) } : { grund: e.grund || `Aufgabe «${key}» gibt es nicht` };
      },
      /** Das Thema mit allen aufgelösten Parametern (Leiter, Optionen, Mastery), Eltern-Einstellungen eingerechnet. */
      thema(modulId, themaId) {
        const schluessel = `${modulId}/${themaId}`;
        if (!themen.has(schluessel)) themen.set(schluessel, L.Modell.thema(eintrag(modulId).modul, themaId, anpassung(modulId)));
        return themen.get(schluessel);
      },
      aufgabenVon: (modulId, themaId) => (eintrag(modulId).proThema.get(themaId) || []).slice()
    };
  };

  // ---- Lernstand ---------------------------------------------------------------------------------------------
  /** Lesen und Schreiben des Lernstands für eine Runde. Ohne schreibt (Herausforderung, Vorschau) bleibt jede Änderung in einer Kopie,
      die nur diese Runde sieht, und der Zustand wird nie angefasst. */
  D.lernstand = function lernstand({ schreibt, heute }) {
    const kopie = new Map(), Z = () => L.Zustand;
    const alsText = f => (Array.isArray(f) ? f.join('') : String(f || ''));
    return {
      lies(a) {
        if (kopie.has(a.key)) return kopie.get(a.key);
        const m = (holeDokument().module || {})[a.modul];
        return m && m.aufgaben ? m.aufgaben[a.id] : undefined;
      },
      /** Schreibt den Zustand z der Aufgabe a. extra.ev (Ereignis lern:aufgabe) führt Tageslog und Fenster der Abrufe nach Statistik.tag und
          Statistik.abruf (V-AP02-02), extra.code zählt den Fehlercode im Modul. Alles in einem aendere-Aufruf. */
      schreibe(a, z, extra = {}) {
        if (!schreibt) { kopie.set(a.key, z); return; }
        Z().aendere(d => {
          const m = Z().modul(a.modul);
          (m.aufgaben = m.aufgaben || {})[a.id] = z;
          if (extra.code) m.fehler = L.Fehler.zaehle(m, extra.code, heute).fehler;
          if (extra.ev) {
            d.tage = d.tage || {};
            d.tage[heute] = L.Statistik.tag(d.tage[heute], extra.ev);
            if (d.meta) d.meta.abrufe = L.Statistik.abruf(alsText(d.meta.abrufe), extra.ev);
          }
        });
      },
      /** Zählt aktive Minuten in den Tageslog (nur beim Schreiben). */
      minuten(m) {
        if (!schreibt || !(m > 0)) return;
        Z().aendere(d => { d.tage = d.tage || {}; d.tage[heute] = L.Statistik.tag(d.tage[heute], { minuten: m }); });
      },
      /** Trägt eine Probeprüfung im Modulzustand ein: module[id].pruefung.simulationen. */
      trageSimulationEin(modulId, eintrag) {
        if (!schreibt) return;
        Z().aendere(() => { const p = Z().modul(modulId).pruefung; (p.simulationen = p.simulationen || []).push(eintrag); });
      }
    };
  };
})(globalThis);
