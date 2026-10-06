/* app/welt/verbindung.js: Welt.verbinde(bus, zustand, opt). Hängt das Verdienstbuch an den Ereignisbus (Architektur 2.3 Regel 4 und 2.5).
   Hört auf lern:aufgabe und lern:thema und schreibt über zustand.aendere in zustand.ledger. Der Lauf weiss davon nichts, nur app/start.js ruft das auf.
   zustand: Objekt mit aendere(fn), ohne Angabe Lernwelt.Zustand. opt.heute(z) ersetzt den Spieltag (Standard: Tag.spieltag mit meta.letzterTag).
   Gibt die Abmeldung zurück. Sie trägt zwei Zusätze für die Anzeige «Zuwachs dieser Sitzung»:
   abmelden.zuwachs() → { ertrag: {fach: n}, wissen: {bereich: n} } seit dem Verbinden oder seit nullen(), abmelden.nullen().
   Je Bus gilt eine Verbindung: ein zweites verbinde auf demselben Bus löst die erste ab, damit nichts doppelt ankommt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const verbunden = new WeakMap();
  const sammle = (summe, neu) => { for (const [k, n] of Object.entries(neu)) summe[k] = (summe[k] || 0) + n; };

  function verbinde(bus, zustand, opt = {}) {
    const Z = zustand || L.Zustand;
    if (!bus || typeof bus.on !== 'function') throw new Error('Welt.verbinde: Ereignisbus fehlt');
    if (!Z || typeof Z.aendere !== 'function') throw new Error('Welt.verbinde: Zustand mit aendere(fn) fehlt');
    if (verbunden.has(bus)) verbunden.get(bus)();
    const letzter = z => (z.meta && L.Tag.gueltig(z.meta.letzterTag) ? z.meta.letzterTag : null);   // ein beschädigter Tag im Dokument sperrt das Buch nicht
    const tagVon = typeof opt.heute === 'function' ? opt.heute : z => L.Tag.spieltag(L.Tag.heute(), letzter(z));
    let zuwachs = { ertrag: {}, wissen: {} };

    const buche = (art, ziel, ev) => Z.aendere(z => {
      if (z.ledger === null || typeof z.ledger !== 'object' || Array.isArray(z.ledger)) z.ledger = L.Ledger.leer();
      sammle(zuwachs[ziel], L.Ledger[art](z.ledger, ev, tagVon(z)));     // im Rückruf: wird nicht geschrieben, zählt auch nichts
    });
    const hoerer = [bus.on('lern:aufgabe', ev => buche('verbucheAufgabe', 'ertrag', ev)), bus.on('lern:thema', ev => buche('verbucheThema', 'wissen', ev))];

    const abmelden = () => { hoerer.forEach(ab => ab()); if (verbunden.get(bus) === abmelden) verbunden.delete(bus); };
    abmelden.zuwachs = () => ({ ertrag: { ...zuwachs.ertrag }, wissen: { ...zuwachs.wissen } });
    abmelden.nullen = () => { zuwachs = { ertrag: {}, wissen: {} }; };
    verbunden.set(bus, abmelden);
    return abmelden;
  }

  L.Welt = Object.assign(L.Welt || {}, { verbinde });
})(globalThis);
