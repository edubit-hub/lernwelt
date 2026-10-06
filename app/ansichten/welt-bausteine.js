/* app/ansichten/welt-bausteine.js: kleine DOM-Bausteine der Welt-Ansichten (Architektur 7.1 und 7.8, AP-16): Symbole, Kostenzeilen mit Vorrat,
   Voraussetzungszeilen, Stufenanzeige, Abschnitte und Knöpfe des Informationsfelds. Klassen stehen in app/stil/bauteile.css, basis.css und
   welt-ansichten.css. Gesperrte Knöpfe bleiben antippbar (aria-disabled), die Meldung nennt dann, was fehlt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt;

  /** Linien-Icon der Oberfläche (icons.css). extra: weitere Klassen mit Punkt, zum Beispiel 'klein.ok'. */
  const ico = (name, extra) => H(`span.ico.ico-${name}${extra ? `.${extra}` : ''}`, { 'aria-hidden': 'true' });

  /** Symbol eines Rohstoffs oder Guts aus dem Bausatz (Iso.symbol), px Pixel gross. klasse: Klasse des Behälters. */
  function symbol(name, px = 22, klasse = 'welt-symbol') {
    const el = H(`span.${klasse}`, { 'aria-hidden': 'true' });
    el.innerHTML = L.Iso && L.Iso.symbol ? L.Iso.symbol(name, { groesse: px }) : '';
    return el;
  }

  /** Kostenzeilen mit Vorrat: «Stein 30», rechts «Vorrat 124» mit Haken oder «Vorrat 8, es fehlen 2». opt.ohneVorrat zeigt nur die Menge (Bezahltes). */
  const kostenListe = (zeilen, opt = {}) => H('ul.liste', zeilen.map(p => H(`li.zeile${p.fehlt && !opt.ohneVorrat ? '.fehlt' : ''}`, symbol(p.symbol, 22), H('span.menge', T().posten(p.name, p.menge)),
    opt.ohneVorrat ? '' : H('span.vorrat', p.fehlt ? T().vorratFehlt(p.hat, p.fehlt) : [T().vorrat(p.hat), ico('haken', 'klein.ok')]))));

  /** Voraussetzungszeilen: eine Zeile je Voraussetzung mit Fortschritt, Haken wenn erfüllt, sonst Schloss. Der Satz «Es fehlt: ...» (z.fehlt) steht nicht mehr darunter,
      er erscheint als Meldung, wenn ein gesperrter Knopf angetippt wird. */
  const bedingungsListe = zeilen => H('ul.liste', zeilen.map(z => H('li.zeile.text', ico(z.ok ? 'haken' : 'schloss', `klein.${z.ok ? 'ok' : 'fehler'}`), H('span', z.text))));

  /** Stufenanzeige: max Striche, die ersten `stufe` gefüllt, daneben der Text. */
  const stufenAnzeige = (stufe, max, text) => H('div.stufen', Array.from({ length: max }, (_, i) => H(i < stufe ? 'i.an' : 'i')), H('span', text));

  /** Abschnitt des Informationsfelds mit Überschrift. */
  const abschnitt = (titel, ...inhalt) => H('section.abschnitt', H('h3', titel), ...inhalt);

  /** Kopf des Informationsfelds: Bild (SVG-Text) oder Symbol (Icon-Name), Titel, Gruppe, weitere Zeile. */
  function kopf({ bild, icon, titel, gruppe, zusatz }) {
    const b = H(`div.info-bild${bild ? '' : '.symbol'}`);
    if (bild) b.innerHTML = bild; else b.append(ico(icon || 'info'));
    return H('div.info-kopf', b, H('div', H('h2', titel), gruppe ? H('div.gruppe', gruppe) : '', zusatz || ''));
  }

  /** Knopf der Aktionen. gesperrt: grau, aber antippbar. name: data-aktion für Tests und Auswertung. */
  const knopf = ({ text, unter, icon, primaer, gesperrt, klick, name, beschriftung }) => H(`button.knopf${primaer && !gesperrt ? '.primaer' : ''}${gesperrt ? '.gesperrt' : ''}`,
    { type: 'button', 'aria-disabled': gesperrt ? 'true' : null, 'aria-label': beschriftung || null, 'data-aktion': name || null, onclick: klick }, icon ? ico(icon) : '',
    H('span', text, unter ? H('span.unter', unter) : ''));

  /** Der Inhalt des Informationsfelds: scrollender Inhalt und feste Aktionsleiste. */
  function setzeInfo(info, inhalt, aktionen) {
    info.replaceChildren(H('div.info-inhalt', inhalt), aktionen && aktionen.length ? H('div.info-aktionen', aktionen) : '');
  }

  L.WeltBausteine = { ico, symbol, kostenListe, bedingungsListe, stufenAnzeige, abschnitt, kopf, knopf, setzeInfo };
})(globalThis);
