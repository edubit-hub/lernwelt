/* app/ansichten/eltern-pruefung.js: Reiter «Prüfung» des Elternbereichs (AP-13b, Architektur 6.6 und 13.3). Je aktivem Modul eine Karte: Prüfungsdatum und Umfang setzen, der Plan
   mit Ampel und Empfehlung (eltern-plan.js), Diagnose-Probelauf und Probeprüfung starten (eltern-probe.js), das echte Ergebnis eintragen (eltern-ergebnis.js). Davor steht die Karte
   «Ferien» (eltern-ferien.js). Ampel und Auslastung gibt es nur hier: Keine Ansicht für das Kind liest pruefung-lage.js. Geschrieben wird module[id].pruefung.datum und .themen über
   Zustand.aendere. Der Reiter meldet sich über Lernwelt.ElternPruefung.anmelden() an (app/start.js beim Start, V-AP22-03). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /* Gestaltung: app/stil/eltern.css (pr-*, gedrückte Schalter). */

  const lagen = k => {
    const doc = k.Z.hole(), heute = k.heute();
    let vt = null;
    try { vt = L.Lernplan.verteilung(doc, heute); } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'lernplan.js' }); }
    return [...L.registry.module.keys()].filter(id => doc.module[id] && doc.module[id].aktiv === true && (L.katalog || []).some(e => e.id === id))
      .map(id => { try { return L.PruefungLage.lage(doc, id, heute, vt); } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'pruefung-lage.js' }); return null; } }).filter(Boolean);
  };

  function datumFeld(k, l) {
    const h = k.h, gesperrt = k.gesperrt(), md = k.Z.hole().module[l.id] || {}, gesetzt = (md.pruefung && md.pruefung.datum) || '';
    const feld = h('input', { type: 'date', 'aria-label': `Prüfungsdatum ${l.titel}`, value: gesetzt, disabled: gesperrt });
    feld.value = gesetzt;
    const speichere = v => {
      if (v && !L.Tag.gueltig(v)) { k.meldung('Bitte ein gültiges Datum wählen.', 'fehler'); return; }
      k.Z.aendere(() => { k.Z.modul(l.id).pruefung.datum = v || null; });
      k.meldung(v ? 'Prüfungsdatum gespeichert.' : 'Prüfungsdatum entfernt.', 'ok');
      k.neuZeichnen();
    };
    feld.addEventListener('change', () => speichere(String(feld.value || '')));
    return h('div.eltern-zeile', h('label.eltern-feld', h('span', 'Prüfungsdatum'), feld),
      gesetzt ? h('button.knopf.leise', { type: 'button', disabled: gesperrt, onclick: () => speichere('') }, 'Datum entfernen') : '');
  }

  function umfangFeld(k, l) {
    const h = k.h, gesperrt = k.gesperrt(), modul = L.registry.module.get(l.id), alle = l.themen.includes('*');
    const aktiv = modul.themen.filter(t => L.Modell.thema(modul, t, (k.Z.hole().module[l.id] || {}).anpassung).aktiv !== false).map(t => t.id);
    const schalte = id => {
      const jetzt = new Set(alle ? aktiv : l.themen.filter(t => aktiv.includes(t)));
      if (jetzt.has(id)) jetzt.delete(id); else jetzt.add(id);
      if (!jetzt.size) { k.meldung('Mindestens ein Thema bleibt im Umfang.', 'fehler'); return; }
      L.ElternPlan.setzeUmfang(k, { ...l, imUmfang: aktiv }, aktiv.filter(t => jetzt.has(t)));
      k.neuZeichnen();
    };
    const gewaehlt = id => alle || l.themen.includes(id);
    return h('div', h('p.klein', alle ? 'Prüfungsumfang: alle eingeschalteten Themen.' : `Prüfungsumfang: ${aktiv.filter(gewaehlt).length} von ${aktiv.length} Themen. Der übrige Stoff bleibt zurück.`),
      h('div.eltern-zeile', { role: 'group', 'aria-label': `Themen der Prüfung ${l.titel}` }, aktiv.map(id => h('button.knopf.schalter', { type: 'button', disabled: gesperrt,
        'aria-pressed': gewaehlt(id) ? 'true' : 'false', onclick: () => schalte(id) }, (modul.themen.find(t => t.id === id) || {}).titel || id))));
  }

  function probe(k, l, modul) {
    const h = k.h, gesperrt = k.gesperrt(), md = k.Z.hole().module[l.id] || {}, P = L.ElternProbe, v = P.verlauf(k, modul, md), richt = l.format && modul.pruefung && modul.pruefung.richtzeitMin;
    return h('div.pr-teil', h('h4', 'Diagnose und Probeprüfung'),
      l.format ? h('p.klein', `Die Aufgaben folgen dem Aufbau der Prüfung, ohne Hilfen. Die Rückmeldung kommt am Ende.${richt ? ` Richtzeit etwa ${richt} Minuten, die Zeit läuft dabei nicht ab.` : ''}`)
        : h('p.klein', 'Für dieses Modul ist noch kein Prüfungsaufbau hinterlegt.'),
      h('div.eltern-zeile', ['diagnose', 'simulation'].map(art => h('button.knopf', { type: 'button', disabled: gesperrt || !l.format, onclick: () => P.starte(k, l, art, () => k.neuZeichnen()) },
        art === 'diagnose' ? 'Diagnose-Probelauf starten' : 'Probeprüfung starten'))),
      v.length ? h('ul.pr-verlauf', v.map(x => h('li', x.text, x.schwach.length ? `. Weniger als die Hälfte der Punkte: ${x.schwach.join(', ')}` : ''))) : h('p.klein', 'Noch keine Probe gemacht.'));
  }

  function karte(k, l) {
    const h = k.h, modul = L.registry.module.get(l.id), neu = () => k.neuZeichnen();
    return h('article.kachel.eltern-kachel', { 'data-modul': l.id }, h('div.pr-kopf', h('h3', l.titel)), datumFeld(k, l), umfangFeld(k, l),
      h('div.pr-teil', h('h4', 'Plan'), L.ElternPlan.block(k, l, neu)), probe(k, l, modul),
      h('div.pr-teil', h('h4', 'Echtes Ergebnis'), h('p.klein', 'Nach der Prüfung eintragen. Das Ergebnis bleibt im Elternbereich, das Kind sieht es hier nicht.'), L.ElternErgebnis.formular(k, l.id, neu)));
  }

  function bau(k) {
    const h = k.h, liste = lagen(k);
    return h('div.eltern-inhalt', L.ElternFerien ? L.ElternFerien.kachel(k) : '',
      liste.length ? h('div.pr-liste', liste.map(l => karte(k, l))) : k.kasten('hilfe', 'Kein Modul aktiv', 'Schalten Sie im Reiter «Module» ein Modul ein. Danach lässt sich hier ein Prüfungsdatum setzen.'));
  }

  /** Hinweispunkt am Reiter: ein Modul hat einen roten Plan. */
  const punkt = k => lagen(k).some(l => l.plan && l.plan.ampel === 'rot');

  const abschnitt = { id: 'pruefung', titel: 'Prüfung', rang: 30, bau, punkt };
  /** Meldet den Reiter im Elternbereich an (ersetzt einen früheren Eintrag). app/start.js ruft das beim Start auf. */
  function anmelden() {
    const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === abschnitt.id);
    if (alt >= 0) liste.splice(alt, 1);
    liste.push(abschnitt);
  }

  L.ElternPruefung = { abschnitt, anmelden, bau, punkt, lagen };
})(globalThis);
