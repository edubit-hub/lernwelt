/* app/ui/uebergang.js: räumliche Übergänge zwischen Ansichten (docs/gestaltung-umbau.md 3.1, Effekt-Regeln in docs/gestaltung.md).
     Uebergang.fahre({ kamera, zeichne }) startet zuerst die Kamerafahrt (kamera() darf ein Promise liefern) und zeichnet danach sofort die Ansicht.
       Gewartet wird nicht: die Eingabe bleibt frei, die Fahrt läuft im Hintergrund. → { fahrt: Promise }
     Uebergang.wechsel(el, { von: 'rechts'|'links'|'unten'|null }) lässt den neuen Inhalt kurz hereingleiten (transform und opacity, Web Animations),
       bei weniger Bewegung nur ein kurzes Einblenden. Ohne el.animate (Node-Tests) gilt sofort der Endzustand.
     Uebergang.wenig() → true bei prefers-reduced-motion. Uebergang.dauer(name, standard) liest eine Dauer aus den Tokens (ms).
   Kern-Schicht: kennt weder Welt noch Zustand noch Lauf. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const VERSATZ = { rechts: 'translateX(28px)', links: 'translateX(-28px)', unten: 'translateY(28px)' };

  function wenig() {
    try { return !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }

  /** Dauer eines Tokens in Millisekunden («320ms» oder «1.1s»), sonst der Standard. */
  function dauer(name, standard) {
    try {
      const d = g.document, wert = g.getComputedStyle && d && d.documentElement ? String(g.getComputedStyle(d.documentElement).getPropertyValue(name)).trim() : '';
      const m = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(wert);
      return m ? Math.round(+m[1] * (m[2] === 's' ? 1000 : 1)) : standard;
    } catch (e) { return standard; }
  }

  function fahre({ kamera, zeichne } = {}) {
    let fahrt = Promise.resolve();
    try { if (typeof kamera === 'function') fahrt = Promise.resolve(kamera()).catch(() => {}); } catch (e) { fahrt = Promise.resolve(); }
    if (typeof zeichne === 'function') zeichne();
    return { fahrt };
  }

  function wechsel(el, { von = 'rechts' } = {}) {
    if (!el || typeof el.animate !== 'function') return Promise.resolve();
    const ruhig = wenig(), start = ruhig || !VERSATZ[von] ? { opacity: 0 } : { opacity: 0, transform: VERSATZ[von] };
    const ziel = ruhig || !VERSATZ[von] ? { opacity: 1 } : { opacity: 1, transform: 'none' };
    try {
      const a = el.animate([start, ziel], { duration: ruhig ? dauer('--dauer', 180) : dauer('--dauer-tafel', 320), easing: 'cubic-bezier(.2, .8, .2, 1)' });
      return a.finished ? a.finished.then(() => {}, () => {}) : Promise.resolve();
    } catch (e) { return Promise.resolve(); }
  }

  L.Uebergang = { fahre, wechsel, wenig, dauer };
})(globalThis);
