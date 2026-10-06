/* app/ansichten/logbuch-kacheln.js: die Kacheln des Logbuchs als DOM (Architektur 7.8, Mockup docs/mockup/siedlung.html, AP-16). Die Zahlen kommen aus logbuch-daten.js,
   die Diagramme aus logbuch-grafik.js, die Klassen stehen in welt-ansichten.css. Jede Kachel ist ein Abschnitt mit Überschrift. Ein Tipp auf eine Säule oder einen Punkt
   (oder der Fokus mit der Tastatur) schreibt den Wert des Tages in die Ablesung oben rechts: die Beschriftung der Diagramme bleibt klein und ruhig. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten;

  /** Der Text zur Ablesung eines Tages, zum Beispiel «Mi 30.09.: 18 Aufgaben». wert null: kein Wert. */
  const ablesung = (r, wert, einheit) => T().ablesung(r.kurz, D().datum(r.datum).slice(0, 6), wert, einheit);

  /** Kachel mit grosser Zahl und Minidiagramm. o: { id, titel, gross, klein, vergleich, svg (Text), texte: [Ablesung je Tag] }. Gibt { el, lies(i) } zurück. */
  function stat(o) {
    const lesen = H('span.ablesung', { 'aria-live': 'polite' }), diagramm = H('div.diagramm');
    diagramm.innerHTML = o.svg;
    const von = n => { for (let x = n; x && x !== diagramm; x = x.parentNode) { const v = x.getAttribute && x.getAttribute('data-txt'); if (v) return v; } return null; };
    const zeige = text => { lesen.textContent = text || ''; };
    diagramm.addEventListener('click', e => zeige(von(e.target)));
    diagramm.addEventListener('focusin', e => zeige(von(e.target)));
    return { el: H('div.kachel.stat', { 'data-kachel': o.id }, H('div.kopf2', H('h3', o.titel), lesen), H('div.gross', o.gross, o.klein ? H('small', o.klein) : ''), H('div.vgl', o.vergleich), diagramm),
      lies: i => zeige(o.texte[i]) };
  }

  /** Wissensstand je Bereich: je Bereich ein Block mit Kopfzeile (Module, Wissenspunkte aus dem Verdienstbuch, begonnene Themen), darin je Thema eine Zeile mit fünf Stufen
      und dem Stand. Ein Block ist offen, sobald ein Thema begonnen ist; die übrigen lassen sich mit einem Tipp aufklappen (sonst wäre die Liste mit allen Modulen sehr lang). */
  function wissen(gruppen) {
    const t = T(), zeile = x => H('div.stand-zeile', { 'data-thema': x.id }, H('div.n', x.titel, H('small', L.Lernplan.fachName(x.fach))),
      H('div.skala', { role: 'img', 'aria-label': t.stufe[x.stand] }, [1, 2, 3, 4, 5].map(i => H(i <= x.stufe ? `i.s${i}` : 'i'))),
      H('div.z', H('b', t.stufe[x.stand]), H('small', x.stand === 'neu' ? t.nochNichtBegonnen : t.sicherVon(x.sicher, x.aufgaben))));
    const bloecke = gruppen.map(gr => {
      const begonnen = gr.themen.filter(x => x.stand !== 'neu').length;
      return H('details.stand-block', { open: begonnen > 0, 'data-bereich': gr.bereich },
        H('summary.stand-gruppe', H('b', gr.module.join(', ')), H('span.klein', `${t.wissenImBereich(L.WeltDaten.bereichName(gr.bereich), gr.punkte)} · ${t.themenBegonnen(begonnen, gr.themen.length)}`)), gr.themen.map(zeile));
    });
    return H('div.kachel.wissen', { 'data-kachel': 'wissen' }, H('div.titel', H('h3', t.wissenTitel), H('span', t.wissenStufen)), bloecke.length ? bloecke : H('p.klein', t.keinModul));
  }

  /** Bestwerte gegen sich selbst. */
  function best(liste, heute) {
    const t = T();
    return H('div.kachel.best', { 'data-kachel': 'best' }, H('div.titel', H('h3', t.bestTitel)),
      liste.length ? liste.map(b => H('div.eintrag', { 'data-best': b.id }, H('div.w', b.wert, b.einheit ? H('small', ` ${b.einheit}`) : ''),
        H('div.b', H('span', b.label), b.neu || b.tag === heute ? H('span.neu', t.neuBest) : H('span', b.tag ? D().datum(b.tag).slice(0, 6) : '')))) : H('p.klein', t.keineBestwerte));
  }

  const abzeichen = klasse => { const el = H('span.abzeichen', { 'aria-hidden': 'true' }); el.innerHTML = `<svg viewBox="0 0 44 44"><circle class="pl-rand ${klasse}" cx="22" cy="22" r="19"/><circle class="pl-innen" cx="22" cy="22" r="14"/>` +
    `${klasse === 'pl-leer' ? '' : '<path class="pl-haken" d="M15.5 22.5 20 27l8.5-9"/>'}</svg>`; return el; };

  /** Sammlung: Plaketten mit dem «Ich kann»-Satz und Datum, dazu die Fundstücke der Expeditionen (erreichte und noch offene). */
  function sammlung(plaketten, fund) {
    const t = T(), da = fund.filter(f => f.da).length;
    const teile = [...plaketten.map(p => H('div.plakette', { 'data-plakette': p.id }, abzeichen(`pl-${p.stufe}`), H('div.t', p.satz, H('small', t.plakette(p.titel, t.stufe[p.stufe], D().datum(p.tag)))))),
      ...fund.map(f => H(`div.plakette${f.da ? '' : '.leer'}`, { 'data-fund': f.id }, abzeichen(f.da ? 'pl-fund' : 'pl-leer'),
        H('div.t', f.name, H('small', f.da ? t.fundDatum(f.quelle, D().datum(f.tag)) : t.fundOffen(f.quelle)))))];
    return H('div.kachel.sammlung', { 'data-kachel': 'sammlung' }, H('div.titel', H('h3', t.sammlungTitel), H('span', t.sammlungZahl(plaketten.length, da, fund.length))),
      teile.length ? H('div.plaketten', teile) : H('p.klein', t.keineSammlung));
  }

  L.LogbuchKacheln = { stat, wissen, best, sammlung, ablesung };
})(globalThis);
