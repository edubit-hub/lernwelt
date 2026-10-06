/* app/kern/zufall.js: Zufall mit Startwert, damit Generatoren, Mischung und Tests reproduzierbar sind. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** FNV-1a, 32 Bit, über die Codepunkte des Textes. */
  function hash(text) {
    let h = 0x811c9dc5;
    for (const c of String(text)) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  /** mulberry32. Der Startwert ist eine Zahl oder ein Text (dann dessen Hash). Gibt r() in [0, 1) mit r.int, r.waehle, r.mische. */
  function aus(seed) {
    let s = (typeof seed === 'number' ? seed : hash(seed)) >>> 0;
    const r = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = n => Math.floor(r() * n);
    r.waehle = liste => liste[r.int(liste.length)];
    r.mische = liste => {                              // Kopie in zufälliger Reihenfolge (Fisher-Yates)
      const a = liste.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = r.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    };
    return r;
  }

  L.Zufall = { hash, aus };
})(globalThis);
