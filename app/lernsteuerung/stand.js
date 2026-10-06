/* app/lernsteuerung/stand.js: Wissensstand eines Themas (Architektur 6.3). Wird immer aus den Aufgabenzuständen berechnet und nie
   gespeichert. Die Schwellen kommen bei jedem Aufruf aus L.lernregeln (mastery, freischaltung), ein Modul darf sie nur über eine
   begründete `abweichung` ändern (L.Modell.parameter liefert die aufgelösten Werte als `cfg`). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const STUFEN = Object.freeze(['neu', 'ueben', 'basis', 'sicher', 'gefestigt']);
  const EPS = 1e-9;                                    // gegen Rundungsfehler bei Anteilen wie 3 / 5 gegen 0,6

  const anteilAb = (zs, box) => (zs.length ? zs.filter(z => z && z.box >= box).length / zs.length : 0);

  /**
   * @param zustaende Zustände aller Aufgaben des Themas (undefined = noch nie gesehen), ohne veraltete Aufgaben
   * @returns 'neu' | 'ueben' | 'basis' | 'sicher' | 'gefestigt'
   */
  function themenStand(zustaende, cfg = L.lernregeln.mastery) {
    if (!zustaende.length || !zustaende.some(z => z && z.versuche > 0)) return 'neu';
    const sicher = anteilAb(zustaende, cfg.sicherBox) >= cfg.sicherAnteil - EPS;
    if (sicher && anteilAb(zustaende, cfg.gefestigtBox) >= cfg.gefestigtAnteil - EPS) return 'gefestigt';
    if (sicher) return 'sicher';
    return anteilAb(zustaende, cfg.basisBox) >= cfg.basisAnteil - EPS ? 'basis' : 'ueben';
  }

  /**
   * Weiches Freischalten: ein Folgethema öffnet, wenn jeder Vorgänger eine tragfähige Basis hat (Anteil der Aufgaben in einer Mindestbox),
   * und wartet nicht auf «sicher». Ein Vorgänger ohne Aufgaben oder ohne Eintrag sperrt nicht.
   * @param voraussetzungen IDs der Vorgänger-Themen
   * @param zustaendeVon    id → Zustände der Aufgaben dieses Themas
   */
  function freigeschaltet(voraussetzungen, zustaendeVon, cfg = L.lernregeln.freischaltung) {
    return (voraussetzungen || []).every(id => {
      const zs = zustaendeVon(id) || [];
      return zs.length === 0 || anteilAb(zs, cfg.box) >= cfg.anteil - EPS;
    });
  }

  /** Wahr, wenn `stand` mindestens `minimum` erreicht (zum Beispiel für tempo.nurWennStand). Unbekannte Namen ergeben false. */
  function mindestens(stand, minimum) {
    const a = STUFEN.indexOf(stand), b = STUFEN.indexOf(minimum);
    return a >= 0 && b >= 0 && a >= b;
  }

  /** Anzahlen für die Anzeige («36 von 40 Aufgaben sicher»): gesehen und je Schwelle die Aufgaben in der jeweiligen Box oder höher. */
  function zaehle(zustaende, cfg = L.lernregeln.mastery) {
    const ab = box => zustaende.filter(z => z && z.box >= box).length;
    return { aufgaben: zustaende.length, gesehen: zustaende.filter(z => z && z.versuche > 0).length,
             basis: ab(cfg.basisBox), sicher: ab(cfg.sicherBox), gefestigt: ab(cfg.gefestigtBox) };
  }

  L.Stand = { STUFEN, themenStand, freigeschaltet, mindestens, zaehle };
})(globalThis);
