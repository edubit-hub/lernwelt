/* app/hilfsmittel/stellenwerttafel.js: Hilfsmittel Stellenwerttafel (Architektur 4.2, modul-schema.md Abschnitt 8). Spalten T, H, Z, E mit Plättchen:
   Hunderter als Quadrat, Zehner als Balken, Einer als Punkt. Zum Bündeln (10 Einer sind 1 Zehner) und Entbündeln (1 Hunderter sind 10 Zehner).
   Reine Darstellung: kein Zustand, kein Speichern, keine Ereignisse.
   daten: { h, z, e, t?, zeige? }
     h, z, e    Anzahl Plättchen je Spalte, 0 bis 19 (über 9 steht für ein ungebündeltes oder entbündeltes Bild)
     t          Anzahl Tausender, 0 bis 19. Wer t angibt, bekommt die Spalte T dazu
     zeige      'beides' (Standard), 'plaettchen' (Zahl unten verdeckt) oder 'ziffern' (nur die Zahl, ohne Plättchen)
   Farben stehen in app/stil/tokens.css, die Regeln dazu stehen hier, damit das Hilfsmittel ohne weitere Stylesheet-Datei auskommt. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const SPALTE = 180, KOPF = 46, ZELLE = 34, JE_ZEILE = 5, MAX = 19, FUSS = 56, BREITE_MAX = 640;
  const BEKANNT = ['t', 'h', 'z', 'e', 'zeige'], ZEIGE = ['beides', 'plaettchen', 'ziffern'];
  const NAMEN = { t: 'T', h: 'H', z: 'Z', e: 'E' }, VOLL = { t: 'Tausender', h: 'Hunderter', z: 'Zehner', e: 'Einer' };
  const STIL = [
    '.stellenwerttafel{margin:0}',
    '.stellenwerttafel svg{display:block;max-width:100%;height:auto}',
    '.stellenwerttafel .rahmen{fill:var(--flaeche);stroke:var(--tinte);stroke-width:2}',
    '.stellenwerttafel .trenner{stroke:var(--linie);stroke-width:2}',
    '.stellenwerttafel .kopf{fill:var(--tinte);font-size:30px;font-weight:700;text-anchor:middle}',
    '.stellenwerttafel .ziffer{fill:var(--tinte);font-size:34px;font-weight:700;text-anchor:middle}',
    '.stellenwerttafel .platte{fill:var(--akzent);stroke:var(--akzent-dunkel);stroke-width:1.5}',
    '.stellenwerttafel .balken{fill:var(--meer);stroke:var(--akzent-dunkel);stroke-width:1.5}',
    '.stellenwerttafel .einer{fill:var(--akzent-warm);stroke:var(--akzent-dunkel);stroke-width:1.5}'
  ].join('');

  /** SVG-Element. Die Mini-DOM-Attrappe der Tests kennt createElementNS nicht überall, dort genügt createElement. */
  function svgEl(name, attribute, text) {
    const e = document.createElementNS ? document.createElementNS(NS, name) : document.createElement(name);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = String(text);
    return e;
  }

  const fehlt = v => v === undefined || v === null;
  const ganz = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

  /** Fehlertexte für die daten einer Aufgabe, leer heisst in Ordnung (läuft im Prüfskript). */
  function pruefe(d) {
    if (d === null || typeof d !== 'object' || Array.isArray(d)) return ['daten fehlen'];
    const f = [];
    for (const k of ['h', 'z', 'e']) if (fehlt(d[k])) f.push(`daten.${k} fehlt`);
    for (const k of ['t', 'h', 'z', 'e']) if (!fehlt(d[k]) && !ganz(d[k], 0, MAX)) f.push(`daten.${k} ist keine ganze Zahl von 0 bis ${MAX}`);
    if (!fehlt(d.zeige) && !ZEIGE.includes(d.zeige)) f.push(`daten.zeige ist keiner von ${ZEIGE.join(', ')}`);
    for (const k of Object.keys(d)) if (!BEKANNT.includes(k)) f.push(`daten.${k} ist unbekannt (erlaubt: ${BEKANNT.join(', ')})`);
    return f;
  }

  const beschreibung = (d, reihe) => `Stellenwerttafel: ${reihe.map(k => `${d[k]} ${VOLL[k]}`).join(', ')}`;

  /** Ein Plättchen der Spalte: Quadrat (H, T), Balken (Z) oder Punkt (E), x und y sind die Mitte der Zelle. */
  function plaettchen(k, x, y) {
    if (k === 'e') return svgEl('circle', { cx: x, cy: y, r: 8, class: 'platte einer' });
    if (k === 'z') return svgEl('rect', { x: x - 6, y: y - 15, width: 12, height: 30, rx: 2, class: 'platte balken' });
    return svgEl('rect', { x: x - 14, y: y - 14, width: 28, height: 28, rx: 3, class: 'platte' });
  }

  L.hilfsmittel('stellenwerttafel', {
    titel: 'Stellenwerttafel',
    pruefe,
    /** Zeichnet die Tafel in behaelter und gibt das figure-Element zurück. Ungültige daten werfen einen Fehler. */
    render(behaelter, d) {
      const fehler = pruefe(d);
      if (fehler.length) throw new Error(`Stellenwerttafel: ${fehler.join(', ')}`);
      const reihe = (fehlt(d.t) ? ['h', 'z', 'e'] : ['t', 'h', 'z', 'e']), zeige = d.zeige || 'beides';
      const zeilen = Math.max(2, ...reihe.map(k => Math.ceil(d[k] / JE_ZEILE))), w = reihe.length * SPALTE, h = KOPF + zeilen * ZELLE + 16 + FUSS;
      const breite = Math.min(w, BREITE_MAX), svg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, width: breite, height: Math.round(breite * h / w), role: 'img', 'aria-label': beschreibung(d, reihe) });
      svg.append(svgEl('rect', { x: 1, y: 1, width: w - 2, height: h - 2, rx: 8, class: 'rahmen' }),
        svgEl('line', { x1: 1, x2: w - 1, y1: KOPF, y2: KOPF, class: 'trenner' }), svgEl('line', { x1: 1, x2: w - 1, y1: h - FUSS, y2: h - FUSS, class: 'trenner' }));
      reihe.forEach((k, n) => {
        const mitte = n * SPALTE + SPALTE / 2;
        if (n > 0) svg.append(svgEl('line', { x1: n * SPALTE, x2: n * SPALTE, y1: 1, y2: h - 1, class: 'trenner' }));
        svg.append(svgEl('text', { x: mitte, y: 33, class: 'kopf' }, NAMEN[k]));
        if (zeige !== 'ziffern') {
          for (let i = 0; i < d[k]; i++) svg.append(plaettchen(k, n * SPALTE + 22 + (i % JE_ZEILE) * ZELLE, KOPF + 24 + Math.floor(i / JE_ZEILE) * ZELLE));
        }
        svg.append(svgEl('text', { x: mitte, y: h - 18, class: 'ziffer' }, zeige === 'plaettchen' ? '?' : d[k]));
      });
      const stil = document.createElement('style');
      stil.textContent = STIL;
      const figur = document.createElement('figure');
      figur.setAttribute('class', 'hilfsmittel stellenwerttafel');
      figur.append(stil, svg);
      behaelter.append(figur);
      return figur;
    }
  });
})(globalThis);
