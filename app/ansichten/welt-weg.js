/* app/ansichten/welt-weg.js: der Weg statt eines Sperrtexts (docs/gestaltung-umbau.md 2.1 und 3.8, Vorbild docs/mockup/richtung-a/a-tafeln.css «.weg»).
     WeltWeg.baue({ titel?, schritte: [{ text, unter?, erledigt, aktuell? }], fortschritt?: { ist, soll }, knopf?: { text, aktion? | ansicht, daten? } }) → div.weg
       höchstens drei nummerierte Schritte (erledigt mit Häkchen, der aktuelle hervorgehoben), der Stand «2 von 3» und genau ein Handlungsknopf.
     WeltWeg.ausBedingungen(k, bedingungen, kosten) → { schritte, fortschritt, knopf } aus den Zeilen von WeltBedingungen (mit ihrer Angabe weg) und den Kosten.
   Der Knopf nennt immer eine Handlung («Rechnen üben», «Forschung ansehen») und führt über die Hülle dorthin. Klassen stehen in app/stil/welt.css. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.huelle;
  const MAX = 3;

  /** Der Handlungsknopf eines Wegs als eigenes Element (button.weg-knopf), etwa für den festen Fuss einer Tafel. Ohne Text nichts. */
  function knopfEl(knopf) {
    if (!knopf || !knopf.text) return '';
    const klick = () => {
      if (typeof knopf.aktion === 'function') knopf.aktion();
      else if (knopf.ansicht && L.Huelle) L.Huelle.gehe(knopf.ansicht, knopf.daten);
    };
    return H('button.knopf.primaer.weg-knopf', { type: 'button', 'data-aktion': knopf.name || 'weg', onclick: klick }, H('span.ico.ico-pfeil', { 'aria-hidden': 'true' }), H('span', knopf.text));
  }

  /** aussen: true lässt den Knopf weg (er steht dann im Fuss der Tafel, knopfEl). */
  function baue({ titel, schritte = [], fortschritt, knopf, aussen } = {}) {
    const liste = schritte.slice(0, MAX), jetzt = liste.findIndex(s => s.aktuell) >= 0 ? liste.findIndex(s => s.aktuell) : liste.findIndex(s => !s.erledigt);
    const stand = fortschritt || { ist: liste.filter(s => s.erledigt).length, soll: liste.length };
    const punkt = (s, i) => H('span.weg-punkt', { 'aria-hidden': 'true' }, s.erledigt ? H('span.ico.ico-haken.klein') : String(i + 1));
    const schritt = (s, i) => H(`li${s.erledigt ? '.erledigt' : ''}${i === jetzt ? '.jetzt' : ''}`, { 'aria-current': i === jetzt ? 'step' : null }, punkt(s, i),
      H('span.weg-text', H('b', s.text), s.unter ? H('small', s.unter) : '', s.erledigt ? H('span.nur-vorlesen', `, ${T().erledigt}`) : ''));
    const anteil = stand.soll ? Math.round(100 * Math.min(1, stand.ist / stand.soll)) : 0;
    return H('div.weg', { role: 'group', 'aria-label': titel || T().wegTitel },
      H('div.weg-titel', H('span.ico.ico-pfeil', { 'aria-hidden': 'true' }), H('span', titel || T().wegTitel), H('span.weg-stand', T().wegStand(stand.ist, stand.soll))),
      H('span.weg-balken', { 'aria-hidden': 'true' }, H('i', { style: `width:${anteil}%` })),
      H('ol.weg-schritte', liste.map(schritt)),
      aussen ? '' : knopfEl(knopf));
  }

  /** Der Handlungsknopf zu einem offenen Schritt: Üben im passenden Fach, die Forschung oder das Tor. Ohne Handlung (Platz) keiner. */
  function knopfFuer(k, s) {
    const t = T(), w = s.weg || {}, ueben = fach => ({ text: (fach && t.ueben[fach]) || t.uebenAllgemein, ansicht: 'lernen', daten: fach ? { fach } : undefined, name: 'ueben' });
    if (w.art === 'forschung' && w.ziel) return { text: t.forschungAnsehen, ansicht: 'forschung', daten: { wahl: w.ziel }, name: 'forschung' };
    if (w.art === 'epoche' && w.ziel) return { text: t.torAnsehen, ansicht: 'forschung', daten: { wahl: w.ziel }, name: 'forschung' };
    if (w.art === 'wissen') return ueben(w.bereich ? String(w.bereich).split('.')[0] : null);
    if (w.art === 'material') { const r = k && k.thema && k.thema.rohstoffe && k.thema.rohstoffe[w.rohstoff]; return ueben(r && r.fach); }
    return null;
  }

  function ausBedingungen(k, bedingungen = [], kosten = []) {
    const alle = bedingungen.filter(Boolean).map(b => ({ text: b.text, erledigt: !!b.ok, weg: b.weg }));
    const fehlt = (kosten || []).filter(c => c.fehlt > 0);
    if (fehlt.length) alle.push({ text: T().materialSammeln(fehlt.map(c => `${c.name} ${c.fehlt}`).join(', ')), erledigt: false, weg: { art: 'material', rohstoff: fehlt[0].id } });
    // Offene Schritte gehen vor, erledigte füllen bis drei auf, die Reihenfolge bleibt
    const offen = alle.filter(s => !s.erledigt).slice(0, MAX), platz = MAX - offen.length, fertig = alle.filter(s => s.erledigt).slice(0, platz);
    const schritte = alle.filter(s => offen.includes(s) || fertig.includes(s));
    const erster = schritte.find(s => !s.erledigt);
    if (erster) erster.aktuell = true;
    return { schritte, fortschritt: { ist: schritte.filter(s => s.erledigt).length, soll: schritte.length }, knopf: erster ? knopfFuer(k, erster) : null };
  }

  L.WeltWeg = { baue, knopfEl, ausBedingungen };
})(globalThis);
