/* app/lernsteuerung/neuverteilung.js: wie sich die neuen Aufgaben eines Tages auf die Module verteilen (Architektur 6.4, R7). Reine Funktionen.
   Gruppe heisst hier ein Modul. Jede Gruppe mit offenem Stoff bekommt zuerst eine neue Aufgabe, solange der Tag reicht. Gruppen mit Prüfungsdruck (Gewicht über 1) stehen
   in dieser ersten Runde vorn, die übrigen reihum, jeden Tag ab einer anderen Gruppe. Was danach noch frei ist, geht nach Gewicht (Höchstzahlverfahren). Keine Gruppe bekommt
   mehr als `jeGruppe`. Der Elternbereich rechnet den Plan mit denselben Zahlen (quoten), damit Ampel und Tagesauftrag dasselbe sagen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /**
   * @param gruppen   [{ id, gewicht = 1, frei = Infinity }]: gewicht ist der Bedarf je Tag (1 ohne Prüfung), frei die Zahl der verfügbaren neuen Aufgaben
   * @param max       höchstens so viele neue Aufgaben insgesamt, @param rotation Tagesnummer: ab welcher Gruppe die erste Runde reihum läuft
   * @param jeGruppe  Obergrenze je Gruppe (Standard lernregeln.sitzung.neuProTagMax)
   * @returns Map id → Zahl der neuen Aufgaben, in der Reihenfolge der ersten Runde
   */
  function verteile(gruppen, max, rotation = 0, jeGruppe = L.lernregeln.sitzung.neuProTagMax) {
    const offen = gruppen.filter(x => (x.frei === undefined ? Infinity : x.frei) > 0).map(x => ({ id: x.id, w: Math.max(1, x.gewicht || 1), frei: Math.min(jeGruppe, x.frei === undefined ? Infinity : x.frei) }));
    const dringend = offen.filter(x => x.w > 1).sort((a, b) => b.w - a.w), ruhig = offen.filter(x => x.w <= 1);
    const start = ruhig.length ? ((rotation % ruhig.length) + ruhig.length) % ruhig.length : 0;
    const reihe = [...dringend, ...ruhig.slice(start), ...ruhig.slice(0, start)], anzahl = new Map(reihe.map(x => [x.id, 0]));
    let summe = 0;
    for (const x of reihe) { if (summe >= max) break; anzahl.set(x.id, 1); summe += 1; }
    while (summe < max) {
      const kand = reihe.filter(x => anzahl.get(x.id) < x.frei);
      if (!kand.length) break;
      const best = kand.reduce((b, x) => (x.w / (anzahl.get(x.id) + 1) > b.w / (anzahl.get(b.id) + 1) ? x : b));
      anzahl.set(best.id, anzahl.get(best.id) + 1);
      summe += 1;
    }
    return anzahl;
  }

  /**
   * Die mittlere Zahl neuer Aufgaben je Tag und Gruppe: der Durchschnitt über alle Startpunkte der Rotation. Das ist die Menge, mit der der Plan eines Moduls rechnen darf.
   * Ohne Angabe von `max` gilt lernregeln.sitzung.neuProTagGesamt (sonst neuProTagMax).
   * @returns { id: Zahl }
   */
  function quoten(gruppen, max, jeGruppe = L.lernregeln.sitzung.neuProTagMax) {
    const S = L.lernregeln.sitzung, m = max === undefined ? (S.neuProTagGesamt ?? S.neuProTagMax) : max, ruhig = gruppen.filter(x => !(x.gewicht > 1)).length, n = Math.max(1, ruhig);
    const summe = Object.fromEntries(gruppen.map(x => [x.id, 0]));
    for (let r = 0; r < n; r++) for (const [id, a] of verteile(gruppen, m, r, jeGruppe)) summe[id] += a;
    return Object.fromEntries(Object.entries(summe).map(([id, s]) => [id, Math.round(s / n * 10) / 10]));
  }

  L.Neuverteilung = { verteile, quoten };
})(globalThis);
