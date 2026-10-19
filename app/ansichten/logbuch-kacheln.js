/* app/ansichten/logbuch-kacheln.js: die Teile des Logbuchs als DOM (Architektur 7.8, docs/gestaltung-umbau.md 2.12, Vorbild docs/mockup/richtung-a/a-logbuch.js, AP-16).
   Die Zahlen kommen aus logbuch-daten.js, Diagramme und Bilder aus logbuch-grafik.js, die Klassen stehen in logbuch.css. Linke Buchseite: vier Wochenwerte als
   Minidiagramme (stat) und die Bestwerte (best). Rechte Buchseite: Wissensstand je Bereich (wissen) und die Sammlung als Vitrine mit Plaketten (sammlung).
   Ein Tipp auf eine Säule oder einen Punkt (oder der Fokus mit der Tastatur) schreibt den Wert des Tages in die Ablesung: die Beschriftung bleibt klein und ruhig. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, TL = () => L.Texte.logbuchseite, D = () => L.WeltDaten;

  /** Der Text zur Ablesung eines Tages, zum Beispiel «Mi 30.09.: 18 Aufgaben». wert null: kein Wert. */
  const ablesung = (r, wert, einheit) => T().ablesung(r.kurz, D().datum(r.datum).slice(0, 6), wert, einheit);

  /** Kopf eines Teils der Buchseite: Überschrift in Buchschrift, rechts eine leise Angabe. */
  const kopf = (titel, rechts) => H('div.titel', H('h3', titel), rechts ? H('span', rechts) : '');

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
        H('summary.stand-gruppe', H('b', gr.module.join(', ')), H('span.klein', `${t.wissenImBereich(D().bereichName(gr.bereich), gr.punkte)} · ${t.themenBegonnen(begonnen, gr.themen.length)}`)), gr.themen.map(zeile));
    });
    return H('section.buch-teil.wissen', { 'data-kachel': 'wissen', 'data-seite': 'wissen' }, kopf(t.wissenTitel, t.wissenStufen), bloecke.length ? bloecke : H('p.klein', t.keinModul));
  }

  /** Bestwerte gegen sich selbst. */
  function best(liste, heute) {
    const t = T();
    return H('section.buch-teil.best', { 'data-kachel': 'best' }, kopf(t.bestTitel),
      liste.length ? H('div.best-liste', liste.map(b => H('div.eintrag', { 'data-best': b.id }, H('div.w', b.wert, b.einheit ? H('small', ` ${b.einheit}`) : ''),
        H('div.b', H('span', b.label), b.neu || b.tag === heute ? H('span.neu', t.neuBest) : H('span', b.tag ? D().datum(b.tag).slice(0, 6) : ''))))) : H('p.klein', t.keineBestwerte));
  }

  const abzeichen = klasse => { const el = H('span.abzeichen', { 'aria-hidden': 'true' }); el.innerHTML = `<svg viewBox="0 0 44 44"><circle class="pl-rand ${klasse}" cx="22" cy="22" r="19"/><circle class="pl-innen" cx="22" cy="22" r="14"/>` +
    `${klasse === 'pl-leer' ? '' : '<path class="pl-haken" d="M15.5 22.5 20 27l8.5-9"/>'}</svg>`; return el; };

  /** Ein Fach der Vitrine: das Fundstück als Bild (blass, solange es fehlt), Name und woher es kommt. */
  function fach(f) {
    const bild = H('span.fach-bild', { 'aria-hidden': 'true' });
    try { bild.innerHTML = L.LogbuchGrafik.fund(f.bild, { breite: 92, hoehe: 66, leer: !f.da }); } catch (e) { bild.innerHTML = ''; }
    return H(`figure.fach${f.da ? '' : '.leer'}`, { 'data-fund': f.id }, bild,
      H('figcaption', H('b', f.name), H('small', f.da ? T().fundDatum(f.quelle, D().datum(f.tag)) : T().fundOffen(f.quelle))));
  }

  /** Sammlung: die Vitrine mit den Fundstücken der Expeditionen (erreichte und noch offene), darunter die Plaketten mit dem «Ich kann»-Satz und Datum. */
  function sammlung(plaketten, fund) {
    const t = T(), tl = TL(), da = fund.filter(f => f.da).length;
    const vitrine = fund.length ? [H('h4', tl.fundstuecke), H('div.vitrine', { role: 'group', 'aria-label': tl.vitrine }, fund.map(fach))] : '';
    const pl = plaketten.length ? [H('h4', tl.plaketten), H('div.plaketten', plaketten.map(p => H('div.plakette', { 'data-plakette': p.id }, abzeichen(`pl-${p.stufe}`),
      H('div.t', p.satz, H('small', t.plakette(p.titel, t.stufe[p.stufe], D().datum(p.tag)))))))] : '';
    return H('section.buch-teil.sammlung', { 'data-kachel': 'sammlung', 'data-seite': 'sammlung' }, kopf(t.sammlungTitel, t.sammlungZahl(plaketten.length, da, fund.length)),
      vitrine, pl, fund.length || plaketten.length ? '' : H('p.klein', t.keineSammlung));
  }

  L.LogbuchKacheln = { stat, wissen, best, sammlung, ablesung, fach };
})(globalThis);
