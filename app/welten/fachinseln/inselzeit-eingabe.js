/* app/welten/fachinseln/inselzeit-eingabe.js: Tippen und Ziehen auf der Leinwand der Inselzeit (E-2110-01).
     W3.InselzeitEingabe(leinwand, { tippe(e), ziehe(dx) }) → { loese() }
   Ein kurzer Tipp (höchstens 12 Bildpunkte Weg, ohne Ziehen) ruft tippe(e) mit dem Ereignis pointerup. Ziehen ab 8 Bildpunkten waagrecht ruft
   ziehe(dx) mit dem Weg seit dem letzten Aufruf. pointercancel bricht ab, loese() entfernt die Hörer. Schreibt keinen Zustand. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});

  W3.InselzeitEingabe = function (leinwand, { tippe, ziehe }) {
    let griff = null, gezogen = false;
    const HOERER = [
      ['pointerdown', e => { griff = { x: e.clientX, y: e.clientY, x0: e.clientX }; gezogen = false; }],
      ['pointermove', e => {
        if (!griff || e.buttons !== 1) return;
        if (Math.abs(e.clientX - griff.x0) > 8) gezogen = true;
        if (gezogen) { ziehe(e.clientX - griff.x); griff.x = e.clientX; }
      }],
      ['pointerup', e => { const g0 = griff; griff = null; if (g0 && !gezogen && Math.hypot(e.clientX - g0.x0, e.clientY - g0.y) <= 12) tippe(e); }],
      ['pointercancel', () => { griff = null; }]];
    for (const [art, f] of HOERER) leinwand.addEventListener(art, f);
    return { loese() { for (const [art, f] of HOERER) leinwand.removeEventListener(art, f); } };
  };
})(globalThis);
