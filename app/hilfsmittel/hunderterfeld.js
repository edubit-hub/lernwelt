/* app/hilfsmittel/hunderterfeld.js: Hilfsmittel Hunderterfeld (Architektur 4.2, modul-schema.md Abschnitt 8). Zehn Spalten, Zeilen von links nach rechts gefüllt,
   mit kräftigen Linien nach der fünften Spalte und der fünften Zeile. So sieht das Kind 10 · 4 + 3 oder 100 − 27 auf einen Blick.
   Reine Darstellung: kein Zustand, kein Speichern, keine Ereignisse.
   daten: { zahl, wegnehmen?, zeilen? }
     zahl       gefüllte Felder von 0 bis zeilen · 10, gefüllt wird zeilenweise von oben links
     wegnehmen  Felder, die von den gefüllten wieder abgezogen werden: die letzten Punkte stehen gestrichelt ohne Füllung (0 bis zahl)
     zeilen     Zahl der Zeilen, 1 bis 10 (Standard 10, zwei Zeilen sind ein Zwanzigerfeld)
   Farben stehen in app/stil/tokens.css, die Regeln dazu stehen hier, damit das Hilfsmittel ohne weitere Stylesheet-Datei auskommt. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const ABSTAND = 30, RAND = 6, RADIUS = 10, SPALTEN = 10, BREITE_MAX = 340;
  const BEKANNT = ['zahl', 'wegnehmen', 'zeilen'];
  const STIL = [
    '.hunderterfeld{margin:0}',
    '.hunderterfeld svg{display:block;max-width:100%;height:auto}',
    '.hunderterfeld .rahmen{fill:var(--flaeche);stroke:var(--tinte);stroke-width:2}',
    '.hunderterfeld .raster{stroke:var(--linie);stroke-width:1}',
    '.hunderterfeld .fuenf{stroke:var(--tinte);stroke-width:2.5}',
    '.hunderterfeld .voll{fill:var(--akzent)}',
    '.hunderterfeld .weg{fill:none;stroke:var(--tinte-leise);stroke-width:2;stroke-dasharray:3 3}'
  ].join('');

  /** SVG-Element. Die Mini-DOM-Attrappe der Tests kennt createElementNS nicht überall, dort genügt createElement. */
  function svgEl(name, attribute) {
    const e = document.createElementNS ? document.createElementNS(NS, name) : document.createElement(name);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    return e;
  }

  const fehlt = v => v === undefined || v === null;
  const ganz = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

  /** Fehlertexte für die daten einer Aufgabe, leer heisst in Ordnung (läuft im Prüfskript). */
  function pruefe(d) {
    if (d === null || typeof d !== 'object' || Array.isArray(d)) return ['daten fehlen'];
    const f = [], zeilen = fehlt(d.zeilen) ? SPALTEN : d.zeilen;
    if (!fehlt(d.zeilen) && !ganz(d.zeilen, 1, SPALTEN)) f.push(`daten.zeilen ist keine ganze Zahl von 1 bis ${SPALTEN}`);
    const max = ganz(zeilen, 1, SPALTEN) ? zeilen * SPALTEN : SPALTEN * SPALTEN;
    if (fehlt(d.zahl)) f.push('daten.zahl fehlt');
    else if (!ganz(d.zahl, 0, max)) f.push(`daten.zahl ist keine ganze Zahl von 0 bis ${max}`);
    if (!fehlt(d.wegnehmen) && !ganz(d.wegnehmen, 0, ganz(d.zahl, 0, max) ? d.zahl : 0)) f.push('daten.wegnehmen ist keine ganze Zahl von 0 bis zahl');
    for (const k of Object.keys(d)) if (!BEKANNT.includes(k)) f.push(`daten.${k} ist unbekannt (erlaubt: ${BEKANNT.join(', ')})`);
    return f;
  }

  const beschreibung = d => `Hunderterfeld mit ${d.zahl} Punkten${d.wegnehmen > 0 ? `, davon ${d.wegnehmen} weggenommen` : ''}`;

  L.hilfsmittel('hunderterfeld', {
    titel: 'Hunderterfeld',
    pruefe,
    /** Zeichnet das Hunderterfeld in behaelter und gibt das figure-Element zurück. Ungültige daten werfen einen Fehler. */
    render(behaelter, d) {
      const fehler = pruefe(d);
      if (fehler.length) throw new Error(`Hunderterfeld: ${fehler.join(', ')}`);
      const zeilen = d.zeilen || SPALTEN, weg = d.wegnehmen || 0, w = SPALTEN * ABSTAND + 2 * RAND, h = zeilen * ABSTAND + 2 * RAND;
      const svg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, width: Math.min(w, BREITE_MAX), height: Math.round(Math.min(w, BREITE_MAX) * h / w), role: 'img', 'aria-label': beschreibung(d) });
      svg.append(svgEl('rect', { x: RAND, y: RAND, width: SPALTEN * ABSTAND, height: zeilen * ABSTAND, class: 'rahmen' }));
      for (let s = 1; s < SPALTEN; s++) svg.append(svgEl('line', { x1: RAND + s * ABSTAND, x2: RAND + s * ABSTAND, y1: RAND, y2: h - RAND, class: s === 5 ? 'fuenf' : 'raster' }));
      for (let z = 1; z < zeilen; z++) svg.append(svgEl('line', { x1: RAND, x2: w - RAND, y1: RAND + z * ABSTAND, y2: RAND + z * ABSTAND, class: z === 5 ? 'fuenf' : 'raster' }));
      for (let n = 0; n < d.zahl; n++) {
        svg.append(svgEl('circle', { cx: RAND + (n % SPALTEN) * ABSTAND + ABSTAND / 2, cy: RAND + Math.floor(n / SPALTEN) * ABSTAND + ABSTAND / 2, r: RADIUS, class: `punkt ${n >= d.zahl - weg ? 'weg' : 'voll'}` }));
      }
      const stil = document.createElement('style');
      stil.textContent = STIL;
      const figur = document.createElement('figure');
      figur.setAttribute('class', 'hilfsmittel hunderterfeld');
      figur.append(stil, svg);
      behaelter.append(figur);
      return figur;
    }
  });
})(globalThis);
