/* app/ansichten/einstieg.js: der Einstieg in ein Modul (AP-23). Beim ersten Kontakt bietet der Tagesauftrag eine Einstufungsrunde an: bis zu 20 Vortest-Aufgaben
   quer über die Themen. Was schon sitzt, ist kein neuer Stoff (Lernwelt.Einstufung). Dazu die Funktion, mit der im Lauf des Tages für schon Bekanntes
   neuer Stoff nachrückt (plan.nachschub des Laufs), und der Kasten mit dem Ergebnis der Einstufung. Die Ansicht «Lernen» ruft das auf, geschrieben wird nichts hier. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;

  L.Texte = Object.assign(L.Texte || {}, { einstufung: {
    titel: name => `Einstufung ${name}`,
    info: (n, m) => `Bis zu ${mz(n, 'Aufgabe', 'Aufgaben')} aus allen Themen, etwa ${mz(m, 'Minute', 'Minuten')}, zusätzlich zum Tagesauftrag. Was schon sitzt, zählt nicht als neuer Stoff.`,
    frei: 'Die Einstufung ist freiwillig. Ohne sie beginnt das Modul mit dem Tagesauftrag.',
    starten: 'Einstufung starten',
    kopf: name => `Einstufung ${name} erledigt.`,
    ergebnis: (n, bekannt, tage) => (bekannt > 0
      ? `${bekannt} von ${mz(n, 'Aufgabe', 'Aufgaben')} waren schon bekannt und kommen in ${mz(tage, 'Tag', 'Tagen')} zur Wiederholung.`
      : `Keine der ${mz(n, 'Aufgabe', 'Aufgaben')} war schon bekannt.`),
    morgen: n => (n > 1 ? `${n} Aufgaben kommen morgen wieder.` : '1 Aufgabe kommt morgen wieder.')
  } });

  const beruehrt = md => Object.values((md && md.aufgaben) || {}).some(z => z && z.versuche > 0);

  /** Noch nie gesehene Vortest-Aufgaben eines Moduls: [{ key, thema }]. Abgeschaltete Themen und zu schwere Aufgaben fehlen. Die Freischaltung der Themen
      gilt hier nicht: die Einstufung geht quer über alle Themen, die Boxen und damit die Mastery-Regel bleiben davon unberührt. */
  function vortestAufgaben(doc, id) {
    const modul = L.registry.module.get(id), md = (doc.module && doc.module[id]) || {}, zs = md.aufgaben || {};
    return modul.themen.map(t => L.Modell.thema(modul, t, md.anpassung)).filter(t => t.aktiv !== false && t.einfuehrung === 'vortest')
      .flatMap(t => {
        let typ; try { typ = L.Modell.typFuer(t, 0).typ; } catch (e) { typ = undefined; }
        return L.Modell.aufgaben(modul, t.id).filter(a => a.schwierigkeit <= t.maxSchwierigkeit && !(zs[a.id] && zs[a.id].versuche > 0)).map(a => ({ key: a.key, thema: t.id, typ }));
      });
  }

  /** Die Module, für die heute eine Einstufung möglich ist: aktiv, noch nie berührt, nicht schon eingestuft, Neues erlaubt (nicht kurz vor einer Prüfung). */
  function angebot(doc, tag) {
    const lage = L.Lernplan.lagen(doc, tag).fuerPlan, R = L.lernregeln, aus = [];
    for (const id of L.Lernplan.aktive(doc)) {
      const md = doc.module[id];
      if (md.einstufung || beruehrt(md) || (lage && lage.neuGesperrt.has(id))) continue;       // kurz vor der Prüfung des Moduls gibt es keinen neuen Stoff
      try {
        const v = vortestAufgaben(doc, id), n = Math.min(R.einstufung.anzahl, v.length);
        const sek = v.length ? v.reduce((s, a) => s + L.Sitzung.schaetzeSekunden(null, undefined, a.typ), 0) / v.length : R.sitzung.sekProAufgabe;       // im Mittel über die Vortest-Aufgaben
        if (n > 0) aus.push({ id, titel: L.registry.module.get(id).titel || id, aufgaben: n, minuten: Math.max(1, Math.ceil(n * sek / 60)) });
      } catch (fehler) { /* ein Modul, das sich nicht lesen lässt, meldet der Tagesauftrag (probleme), die anderen behalten ihre Einstufung */ }
    }
    return aus;
  }

  /** Die Einträge der Einstufungsrunde eines Moduls für Lauf.start (art 'einstufung'). */
  const einstufungsPlan = (doc, id, tag) => L.Einstufung.waehle(vortestAufgaben(doc, id), L.Zufall.aus(['einstufung', tag, id].join('|')));

  /** plan.nachschub für den Tagesauftrag: Der Plan hat so viele neue Aufgaben vorgesehen, wie die Bremse erlaubte. Für jede, die schon bekannt war,
      rückt die nächste neue nach, solange gezählter und noch offener neuer Stoff unter dieser Zahl bleiben und die Zeit des Tages reicht. */
  function nachschub(tag) {
    return ({ offen, nachgerueckt }) => {
      const doc = L.Zustand.hole(), a = doc.meta && doc.meta.auftrag, lage = L.Lernplan.lagen(doc, tag).fuerPlan;
      return L.Einstufung.nachrueckend({ kandidaten: L.Lernplan.kandidaten(doc, tag).kandidaten, soll: ((a && a.tag === tag && a.eintraege) || []).filter(e => e.grund === 'neu').length,
        gezaehlt: L.Einstufung.gezaehlt(doc.meta, tag), offen, nachgerueckt, imUmfang: lage ? k => L.Pruefungsplan.imUmfang(lage.themen, k.thema) && !lage.neuGesperrt.has(k.modul) : null });
    };
  }

  /** Bild der Karte: die Miniatur «lernen» (Buch mit Feder, Iso.mini), sonst nichts. */
  function bild() {
    const el = L.ui.h('span.einstufung-bild', { 'aria-hidden': 'true' });
    try { if (L.Iso && L.Iso.mini && (!L.Iso.MINIS || L.Iso.MINIS.includes('lernen'))) el.innerHTML = L.Iso.mini('lernen'); } catch (e) { /* ohne Bild */ }
    return el;
  }

  /** Die Karte «Einstufung» für ein Modul aus angebot() im Kartenstil der Auswahl (docs/gestaltung-umbau.md 2.3, Stil in start.css): Bild, Kicker,
      Titel, ein Satz, Umfang, freiwillig, Knopf (kein Primärknopf, der gehört dem Tagesauftrag). start() startet die Runde. */
  function karte(m, start) {
    const H = L.ui.h, T = L.Texte.einstufung, TS = L.Texte.startseite || {};
    return H('section.kasten.hilfe.einstufung', { 'data-einstufung': m.id }, bild(), TS.einstufungKicker ? H('p.kicker.einstufung-kicker', TS.einstufungKicker) : '',
      H('b.einstufung-titel', T.titel(m.titel)), TS.einstufungLead ? H('p.einstufung-lead', TS.einstufungLead) : '',
      H('p.einstufung-info', T.info(m.aufgaben, m.minuten)), H('p.klein', T.frei),
      H('div.kachel-fuss', H('button.knopf.einstufung-los', { type: 'button', onclick: start }, T.starten)));
  }

  /** Der Kasten mit dem Ergebnis der Einstufung von heute (je Modul), bleibt am selben Tag in der Ansicht stehen. Er erscheint als kurze Logbuchseite
      (.kasten.ergebnis: Papier, Linien, Stempel mit Häkchen ohne Text, start.css), der Text bleibt ein Satz. */
  function ergebnis(doc, tag) {
    const H = L.ui.h, T = L.Texte.einstufung, tage = L.lernregeln.wiederholung.vortestTage;
    return L.Lernplan.aktive(doc).map(id => ({ id, e: doc.module[id].einstufung })).filter(x => x.e && x.e.tag === tag).map(({ id, e }) => {
      const titel = (L.registry.module.get(id) || {}).titel || id, rest = e.aufgaben - e.bekannt;
      return H('div.kasten.ok.ergebnis.einstufung-ergebnis', { role: 'status' }, H('b', T.kopf(titel)), ` ${T.ergebnis(e.aufgaben, e.bekannt, tage)}${rest > 0 ? ` ${T.morgen(rest)}` : ''}`,
        H('i.ergebnis-stempel', { 'aria-hidden': 'true' }));
    });
  }

  L.Einstieg = { angebot, einstufungsPlan, nachschub, karte, ergebnis, vortestAufgaben };
})(globalThis);
