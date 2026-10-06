/* app/ansichten/eltern-probe.js: Diagnose-Probelauf und Probeprüfung aus dem Elternbereich starten (AP-13b, Architektur 6.6). Die Aufgaben wählt Pruefungsplan.auswahl nach
   `pruefung.format` des Moduls, gleichmässig gezogen und nicht nach Schwäche bevorzugt, nur aus eingeschalteten Themen im Prüfungsumfang. Der Diagnose-Probelauf hat die halbe Anzahl.
   Gelaufen wird mit Lauf.start (art «simulation», Hilfen aus, die Rückmeldung kommt am Ende). Lauf.start schreibt das Ergebnis selbst nach module[id].pruefung.simulationen.
   Während der Runde zeigt die Hülle des Elternbereichs nur die Runde. Danach kehren die Karten zurück. Schliesst der Elternbereich mitten in der Runde, bricht k.beiEnde sie ab.
   Das Kind sieht diese Runden nicht: Sie lassen sich nur hier starten. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const NAMEN = { diagnose: 'Diagnose-Probelauf', simulation: 'Probeprüfung' };

  /** Die Aufgaben einer Probe als Einträge für Lauf.start: [{ key, typ, teil, punkte, grund: 'pruefung' }]. Leer ohne Format oder ohne passende Aufgaben. */
  function waehle(k, lage, art) {
    const modul = L.registry.module.get(lage.id), md = k.Z.hole().module[lage.id] || {};
    if (!modul || !lage.format || !lage.format.length) return [];
    const rng = L.Zufall.aus([art, lage.id, k.heute(), ((md.pruefung && md.pruefung.simulationen) || []).length].join('|'));
    const wahl = L.Pruefungsplan.auswahl(lage.format, t => (lage.imUmfang.includes(t) ? L.Modell.aufgaben(modul, t) : []), rng,
      art === 'diagnose' ? { anteil: L.lernregeln.pruefung.plan.diagnoseAnteil } : {});
    return wahl.map(x => ({ key: x.aufgabe.key, typ: x.typ, teil: x.teil, punkte: x.punkte, grund: 'pruefung' }));
  }

  /** Startet die Probe und zeigt danach die Karten wieder. fertig() zeichnet den Reiter neu. */
  async function starte(k, lage, art, fertig) {
    if (k.gesperrt()) return;
    if (L.Lauf.laeuft()) { k.meldung('Es läuft schon eine Runde.', 'fehler'); return; }
    const eintraege = waehle(k, lage, art);
    if (!eintraege.length) { k.meldung('Für dieses Modul gibt es kein Prüfungsformat oder keine passenden Aufgaben im Umfang.', 'fehler'); return; }
    if (L.Start && typeof L.Start.entsperre === 'function') L.Start.entsperre();       // iOS gibt Sprache nur aus einer Berührung frei
    const vorher = [...k.huelle.childNodes], laufHuelle = k.h('div.lauf-huelle');
    k.beiEnde(() => L.Lauf.abbrechen('extern'));
    k.huelle.replaceChildren(k.h('p.klein.probe-kopf', { role: 'status' }, `${NAMEN[art]}, ohne Hilfen. Das Ergebnis sieht nur der Elternbereich.`), laufHuelle);
    let bericht = null;
    try {
      bericht = await L.Lauf.start({ art: 'simulation', plan: { heute: L.Lernplan.heute(k.Z.hole()), eintraege, pruefung: { modul: lage.id, art } }, huelle: laufHuelle });
    } catch (fehler) { k.log.melde(fehler, { art: 'fehler', datei: 'eltern-probe.js' }); }
    if (!k.offen) return;
    k.huelle.replaceChildren(...vorher);
    fertig();
    if (bericht && !bericht.abgebrochen && bericht.pruefung) k.meldung(`${NAMEN[art]} beendet. ${bericht.pruefung.text}`, 'ok');
    else k.meldung(`${NAMEN[art]} nicht gewertet: Die Runde wurde nicht zu Ende gespielt.`, '');
  }

  /** Der Verlauf aus module[id].pruefung.simulationen, neueste zuerst: [{ name, text, schwach }]. schwach nennt Themen mit weniger als der Hälfte der Punkte. */
  function verlauf(k, modul, md) {
    const liste = ((md && md.pruefung && md.pruefung.simulationen) || []).slice().reverse();
    return liste.map(s => {
      const schwach = Object.entries(s.proThema || {}).filter(([, t]) => t && t.max > 0 && t.punkte / t.max < 0.5)
        .map(([id]) => ((modul.themen || []).find(t => t.id === id) || {}).titel || id);
      return { name: NAMEN[s.art] || 'Probe', text: `${NAMEN[s.art] || 'Probe'} am ${L.Eltern.datum(s.tag)}: ${s.punkte} von ${s.max} Punkten`, schwach };
    });
  }

  L.ElternProbe = { NAMEN, waehle, starte, verlauf };
})(globalThis);
