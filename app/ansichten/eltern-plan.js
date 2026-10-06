/* app/ansichten/eltern-plan.js: der Plan eines Moduls mit Ampel, Auslastung und Empfehlung (AP-13b, Architektur 6.6). Nur der Elternbereich zeigt das, das Kind sieht in keiner
   Ansicht eine Ampel oder die Auslastung. Die Zahlen kommen aus PruefungLage.lage (Pruefungsplan.plan). Bei Rot entscheiden die Eltern: Umfang kürzen (die App schlägt vor, welche
   Themen bleiben, Themen mit hoher Punktzahl je Aufgabe zuerst) oder mehr Zeit einplanen. «Umfang kürzen» schreibt pruefung.themen, zurückgestellter Stoff bleibt im Lernstand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const AMPEL = { gruen: ['Grün', 'Der Plan geht auf.'], gelb: ['Gelb', 'Der Plan geht auf, lässt aber wenig Spielraum.'], rot: ['Rot', 'Der Plan geht in der verbleibenden Zeit nicht auf.'] };
  const titelVon = (modul, id) => ((modul.themen || []).find(t => t.id === id) || {}).titel || id;
  const aufzaehlung = liste => (liste.length > 1 ? `${liste.slice(0, -1).join(', ')} und ${liste[liste.length - 1]}` : liste[0] || '');

  /** Schreibt den Prüfungsumfang. Alle eingeschalteten Themen heissen ['*']. */
  function setzeUmfang(k, l, themen) {
    const alle = l.imUmfang.length === themen.length && l.imUmfang.every(t => themen.includes(t));
    k.Z.aendere(() => { k.Z.modul(l.id).pruefung.themen = alle ? ['*'] : themen.slice(); });
  }

  /** Der Vorschlag bei Rot. Zuerst die Mittel ohne Verlust (Zeit, weniger Module gleichzeitig), danach erst das Kürzen des Umfangs. */
  function empfehlung(k, l, neu) {
    const h = k.h, p = l.plan, modul = L.registry.module.get(l.id), e = p.empfehlung, S = L.lernregeln.sitzung;
    if (!e) return '';
    const kz = e.art === 'umfang-kuerzen' ? L.PruefungLage.kuerzung(l, e.neueAufgabenHoechstens) : null, zeitRot = p.auslastung >= L.lernregeln.pruefung.plan.rot && p.minuten;
    const kuerze = () => {
      if (k.gesperrt()) return;
      setzeUmfang(k, l, kz.themen);
      k.meldung('Der Umfang ist gekürzt. Zurückgestellte Themen bleiben im Lernstand.', 'ok');
      neu();
    };
    const zeit = zeitRot || e.art === 'mehr-minuten' ? h('p', `Mehr Zeit einplanen: etwa ${e.minuten || p.minuten} Minuten pro Lerntag statt ${S.zielMinuten}.`)
      : h('p.klein', `Mehr Zeit allein hilft hier nicht: Die neuen Aufgaben je Tag sind begrenzt (höchstens ${S.neuProTagMax} je Modul, ${S.neuProTagGesamt} für alle Module zusammen).`);
    const module = e.art === 'umfang-kuerzen' && l.weitere > 0 ? h('p', `Weniger Module gleichzeitig: Neben diesem Modul bekommen ${l.weitere} weitere neue Aufgaben. Schaltet man welche bis zur Prüfung aus (Reiter «Module»), bekommt dieses mehr.`) : '';
    return k.kasten('fehler', 'Vorschlag', zeit, module, kz ? h('p', `${L.PruefungLage.empfehlungText(p)}.`) : '',
      kz ? [h('p', `Es bleiben ${kz.themen.length} von ${l.imUmfang.length} Themen im Umfang: ${aufzaehlung(kz.themen.map(t => titelVon(modul, t)))}.${kz.weggelassen.length ? ` Zurückgestellt: ${aufzaehlung(kz.weggelassen.map(t => titelVon(modul, t)))}.` : ''} Themen mit hoher Punktzahl je Aufgabe bleiben zuerst.`),
        h('div.eltern-zeile', h('button.knopf.primaer', { type: 'button', disabled: k.gesperrt(), onclick: kuerze }, 'Umfang kürzen'))] : '',
      h('p.klein', 'Die Eltern entscheiden.'));
  }

  /** Der Plan als Element. Ohne Datum oder nach dem Prüfungstag steht ein kurzer Hinweis da. neu() zeichnet den Reiter neu. */
  function block(k, l, neu) {
    const h = k.h, p = l.plan, d = L.Eltern.datum, doc = k.Z.hole();
    if (!l.datum) return h('p.klein', 'Ohne Prüfungsdatum gibt es keinen Plan. Mit einem Datum zeigt die App, ob der Stoff bis dahin Platz hat.');
    if (!p) return h('p.klein', 'Das Prüfungsdatum liegt nicht in der Zukunft. Dafür gibt es keinen Plan.');
    const a = AMPEL[p.ampel], prozent = L.PruefungLage.prozent(p), ferien = p.freieTage, md =doc.module[l.id] || {}, sim = (md.pruefung && md.pruefung.simulationen) || [];
    const gemacht = art => sim.some(s => s.art === art), am = x => (x ? d(x) : 'kein Lerntag mehr');
    const paare = [['Prüfung', `${d(l.datum)}, in ${l.tageBis} ${l.tageBis === 1 ? 'Tag' : 'Tagen'}`], ['Phase heute', L.PruefungLage.PHASEN[l.phase]],
      ['Offen im Umfang', `${l.umfang.offen} Aufgaben, davon ${l.umfang.davonNeu} neu`], ['Auslastung', prozent === null ? 'kein Lerntag' : `${prozent} Prozent der verfügbaren Übungszeit`],
      ['Neue Aufgaben pro Tag', `${p.neuProTag} nötig, im Tagesauftrag im Mittel ${String(Math.round(p.neuMax * 10) / 10).replace('.', ',')}`], ['Diagnose-Probelauf', gemacht('diagnose') ? `gemacht, empfohlen am ${am(p.diagnoseAm)}` : `empfohlen am ${am(p.diagnoseAm)}`],
      ['Probeprüfung', gemacht('simulation') ? `gemacht, empfohlen am ${am(p.simulationAm)}` : `empfohlen am ${am(p.simulationAm)}`]];
    if (ferien) paare.push(['Ferientage bis zur Prüfung', `${ferien}, sie zählen im Plan nicht als Lerntage`]);
    const teilt = p.anteil < 1 ? ` Dieses Modul teilt sich die Übungszeit mit den anderen Modulen und rechnet mit ${Math.round(p.anteil * 100)} Prozent davon.` : '';
    return h('div.pr-plan', h('p.pr-ampel.pr-' + p.ampel, { role: 'status' }, h('b', `Ampel: ${a[0]}.`), ` ${a[1]}`), k.werte(paare),
      p.risiken.length ? h('ul.pr-risiken', p.risiken.map(r => h('li', r))) : '', p.ampel === 'rot' ? empfehlung(k, l, neu) : '',
      h('p.klein', `Der Plan rechnet jeden Tag neu aus dem tatsächlichen Stand und stimmt mit dem Tagesauftrag überein. Die Zahlen ändern sich, wenn Aufgaben sicher werden, Module oder Themen ein- oder ausgeschaltet werden oder die Prüfung näher rückt.${teilt}`));
  }

  L.ElternPlan = { AMPEL, block, setzeUmfang, empfehlung };
})(globalThis);
