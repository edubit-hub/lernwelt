/* app/ui/effekte-flug.js: der Flug der Rohstoff-Objekte (Umbauplan 3.4, ausgelagert aus effekte.js). Generisch, ohne Wissen über Welt, Zustand oder Lauf.
     Effekte.flug({ von, nach, inhalt, anzahl = 1, abstand = 70, dauer = 900, bahn: 'bogen'|'gasse', gasse?, beiAnkunft? }) → Promise
   Höchstens 12 Objekte und 1200 ms gesamt. Bahn «gasse» (Vorbild C): steigen oder sinken auf eine freie Höhe unter dem HUD, dort waagrecht bis unter das Ziel
   und erst dann hinein, damit der Flug keine Zahl der Kopfleiste kreuzt. Die Werkzeuge (Ebene, Teile, Animation) liefert effekte.js (Effekte.werkzeug),
   gelesen erst beim Aufruf, damit die Ladereihenfolge keine Rolle spielt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const E = (L.Effekte = L.Effekte || {});
  const FLUG = 12;

  const glatt = q => { const v = Math.max(0, Math.min(1, q)); return v * v * (3 - 2 * v); };

  /** Bildfolge eines Objekts. Bogen: quadratisch über die Mitte, nie über den oberen Rand. Gasse: über die freie Höhe. */
  function bahn(a, z, i, n, gasse, hoehe, f) {
    const streu = n > 1 ? ((i * 0.618) % 1) - 0.5 : 0, sx = a.x + streu * 28, sy = a.y + streu * 10, dx = z.x - sx, dy = z.y - sy;
    const gy = hoehe + streu * 10 - sy, bilder = [];                     // gy: freie Höhe relativ zum Start
    const cx = dx * 0.5 + streu * 40, cy = Math.max(Math.min(0, dy) - 110 - Math.abs(streu) * 30, (24 - sy) * 2);
    for (let k = 0; k <= 16; k++) {
      const t = k / 16, u = 1 - t;
      const x = gasse ? dx * glatt((t - 0.12) / 0.68) : 2 * u * t * cx + t * t * dx;
      const y = gasse ? (t < 0.3 ? gy * glatt(t / 0.3) : t < 0.8 ? gy : gy + (dy - gy) * glatt((t - 0.8) / 0.2)) : 2 * u * t * cy + t * t * dy;
      const s = t < 0.3 ? 0.6 + t * 1.67 : 1.1 - (t - 0.3) * 0.5;
      bilder.push({ offset: t, opacity: t === 0 ? 0 : t > 0.95 ? 0.6 : 1, transform: `translate(${f(sx + x)}px, ${f(sy + y)}px) translate(-50%, -50%) scale(${s.toFixed(3)})` });
    }
    return bilder;
  }

  /** Objekte fliegen von → nach. beiAnkunft(i) kommt für jedes angeforderte Objekt, auch wenn es nicht fliegt (weniger Bewegung, keine Ebene). */
  function flug(opt = {}) {
    const W = E.werkzeug, fertig = () => Promise.resolve();
    const a0 = typeof opt.anzahl === 'number' && isFinite(opt.anzahl) ? opt.anzahl : 1, n0 = Math.max(0, Math.min(FLUG, Math.floor(a0)));
    const ankunft = i => { try { if (typeof opt.beiAnkunft === 'function') opt.beiAnkunft(i); } catch (e) { /* Fehler des Aufrufers stoppen den Flug nicht */ } };
    const rest = ab => { for (let i = ab; i < n0; i++) ankunft(i); };
    if (!W) { rest(0); return fertig(); }
    const von = W.punkt(opt.von), nach = W.punkt(opt.nach), ebene = W.ebene();
    if (W.wenig()) { rest(0); return opt.nach && opt.nach.nodeType ? W.einblenden(opt.nach, 0.4) : fertig(); }
    if (!W.kann(ebene) || !von || !nach) { rest(0); return fertig(); }
    const n = W.frei(n0), dauer = W.begrenze(W.zahl(opt.dauer, 900), 0, W.GRENZE);
    const abstand = n > 1 ? Math.min(Math.max(0, W.zahl(opt.abstand, 70)), (W.GRENZE - dauer) / (n - 1)) : 0;
    const gasse = opt.bahn === 'gasse', hoehe = gasse ? (typeof opt.gasse === 'number' ? opt.gasse - W.versatz().top : nach.y + 56) : 0;
    const laeufe = [];
    for (let i = 0; i < n; i++) {
      const el = W.teil('flug-objekt'), inhalt = el && typeof opt.inhalt === 'function' ? opt.inhalt(i) : null;
      if (!el) break;
      if (inhalt && inhalt.nodeType) el.appendChild(inhalt);
      else if (typeof inhalt === 'string') el.innerHTML = inhalt;          // SVG-Text der App, etwa aus Iso.objekt
      laeufe.push(W.spiel(el, bahn(von, nach, i, n, gasse, hoehe, W.f), { duration: dauer, delay: i * abstand, fill: 'both' }).then(() => { W.weg(el); ankunft(i); }));
    }
    const geflogen = laeufe.length;
    return Promise.all(laeufe).then(() => rest(geflogen));
  }

  E.flug = flug;
})(globalThis);
