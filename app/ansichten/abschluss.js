/* app/ansichten/abschluss.js: der Abschluss nach einer Runde oder nach dem Tagesauftrag (Architektur 6.9 und 7.8): der Bericht mit Ertrag, die erreichten
   Themenstufen, die Zeile «Neu möglich: ...» und, solange es keine Siedlungsansicht gibt, der Platzhalter «Siedlung folgt» in der Anmutung des Mockups
   (7.1: flache Isometrie, drei Töne je Körper, Palette aus tokens.css). Gibt es Lernwelt.Ansichten.siedlung (AP-16), führt der Knopf dorthin. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const SVG = 'http://www.w3.org/2000/svg';
  const T = () => L.Texte.abschluss;

  /** Ein Würfel in drei Tönen: Mitte des Bodens (x, y), halbe Breite w, halbe Tiefe d, Höhe h. Die Klassen o, l und r färbt start-lernen.css. */
  function wuerfel(x, y, w, d, h, farbe) {
    const f = (klasse, punkte) => { const e = document.createElementNS(SVG, 'polygon'); e.setAttribute('class', `${farbe}-${klasse}`); e.setAttribute('points', punkte.map(p => p.join(',')).join(' ')); return e; };
    return [f('l', [[x - w, y - h], [x, y - h + d], [x, y + d], [x - w, y]]), f('r', [[x, y - h + d], [x + w, y - h], [x + w, y], [x, y + d]]),
      f('o', [[x, y - h - d], [x + w, y - h], [x, y - h + d], [x - w, y - h]])];
  }

  /** Eine kleine Insel aus Code: drei Körper auf einer Kachel, ohne Gesichter und ohne Beschriftung. */
  function insel() {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 240 150'); svg.setAttribute('class', 'insel'); svg.setAttribute('aria-hidden', 'true');
    const flaeche = (klasse, punkte) => { const e = document.createElementNS(SVG, 'polygon'); e.setAttribute('class', klasse); e.setAttribute('points', punkte); return e; };
    svg.append(flaeche('insel-meer', '120,6 234,72 120,138 6,72'), flaeche('insel-seite-l', '30,72 120,118 120,134 30,88'), flaeche('insel-seite-r', '120,118 210,72 210,88 120,134'),
      flaeche('insel-gras', '120,26 210,72 120,118 30,72'), ...wuerfel(122, 70, 14, 7, 30, 'kalk'), ...wuerfel(88, 84, 20, 10, 16, 'stein'), ...wuerfel(152, 86, 20, 10, 12, 'holz'));
    return svg;
  }

  /** Was das Welt-Thema jetzt zulässt: id → Satz («Werkstatt auf Stufe 2 ausbauen»). Probelauf der Aktionen auf einer Kopie, nichts ändert sich. */
  function moeglich(doc, thema) {
    const W = L.Welt, t = T(), aus = new Map(), welt = (doc.welt && doc.welt[thema.id]) || W.leer(), name = (liste, id) => (liste[id] && liste[id].name) || id;
    const geht = (art, id) => W.probe(art, doc.ledger, welt, thema, id);
    for (const id of Object.keys(thema.bauteile || {})) { const r = geht('baue', id); if (r.ok) aus.set(`b:${id}:${r.stufe}`, t.bauen(name(thema.bauteile, id), r.stufe)); }
    for (const id of Object.keys(thema.rezepte || {})) if (geht('veredle', id).ok) aus.set(`v:${id}`, t.veredeln(name(thema.rezepte, id)));
    for (const f of thema.forschung || []) if (geht('erforsche', f.id).ok) aus.set(`f:${f.id}`, t.forschen(f.name || f.id));
    return aus;
  }

  /** Die Sätze, die gegenüber dem Stand davor neu dazugekommen sind. */
  const neuMoeglich = (vorher, nachher) => [...nachher].filter(([id]) => !vorher.has(id)).map(([, satz]) => satz);

  /** Der Kopf des Textes fett, der Rest normal: «Tagesauftrag erledigt:» oder «Pause.» */
  function kasten(art, text) {
    const i = text.search(/[:.] /);
    return H(`div.kasten.${art}`, { role: 'status' }, H('b', i < 0 ? text : text.slice(0, i + 1)), i < 0 ? '' : text.slice(i + 1));
  }

  /**
   * Zeichnet den Abschluss in `huelle`. d: { bericht (summiert), ertrag: [{ name, menge }], erledigt, neu: [Sätze «Neu möglich»], thema, weiter(), start() }.
   * Abgebrochen: «Pause», Tagesauftrag fertig: der Text des Laufs, sonst der Text einer einzelnen Runde.
   */
  function zeige(huelle, d) {
    const t = T(), b = d.bericht, R = L.Rueckmeldung.texte, siedlung = L.Huelle && L.Huelle.ansicht('siedlung');
    const text = b.abgebrochen || b.zeitdeckel || d.erledigt ? R.abschluss(b, d.ertrag) : t.runde(b, d.ertrag);
    const platzhalter = H('div.kachel.abschluss-siedlung', insel(), H('div', H('h3', t.siedlungFolgt), H('p.klein', t.siedlungText)));
    const zurSiedlung = [t.zurSiedlung, d.siedlung], zumStart = [t.zumStart, d.start];
    // Fertig: erst zur Siedlung (sobald es sie gibt), sonst zum Start. Sonst geht es mit «Weiter» zur nächsten Runde.
    const knoepfe = d.erledigt ? (siedlung ? [zurSiedlung, zumStart] : [zumStart]) : [[t.weiter, d.weiter], siedlung ? zurSiedlung : zumStart];
    huelle.replaceChildren(H('div.abschluss', kasten(b.abgebrochen ? 'hilfe' : 'ok', text), (b.stufen || []).map(s => H('div.kasten.hilfe', s.text)),
      d.neu && d.neu.length ? H('p.abschluss-neu', H('b', t.neuMoeglich(d.neu))) : '', siedlung ? '' : platzhalter,
      H('div.abschluss-knoepfe', knoepfe.map(([text, tue], i) => H(`button.knopf${i ? '' : '.primaer.gross'}`, { type: 'button', onclick: () => tue() }, text)))));
  }

  L.Abschluss = { zeige, insel, moeglich, neuMoeglich, kasten };
})(globalThis);
