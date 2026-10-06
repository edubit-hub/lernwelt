/* app/hilfsmittel/punktefeld.js: Hilfsmittel Punktefeld. Eine Malaufgabe als Rechteck aus Punkten, in Kernaufgaben zerlegt
   (Architektur 4.3, modul-schema.md Abschnitt 8). Reine Darstellung: kein Zustand, kein Speichern, keine Ereignisse.
   daten: { zeilen, spalten, trenne?, wegnehmen? }
     zeilen, spalten  Anzahl Punktzeilen und Punktspalten, je 1 bis 12
     trenne           Zeilen des ersten Teils. Darunter liegt eine Trennlinie, die Zeilen darunter tragen den zweiten Ton.
                      0, fehlend oder gleich zeilen: keine Linie (zum Beispiel bei 8 · 7 = 10 · 7 − 2 · 7 mit trenne 10)
     wegnehmen        die letzten Zeilen, die abgezogen werden: gestrichelte Kreise ohne Füllung
   Farben stehen in app/stil/tokens.css, die Regeln dazu stehen hier, damit das Hilfsmittel ohne weitere Stylesheet-Datei auskommt. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const ABSTAND = 26, RAND = 8, RADIUS = 8, MAX = 12, BREITE_MAX = 320;
  const BEKANNT = ['zeilen', 'spalten', 'trenne', 'wegnehmen'];
  const STIL = [
    '.punktefeld{margin:0}',
    '.punktefeld svg{display:block;max-width:100%;height:auto}',
    '.punktefeld .teil1{fill:var(--akzent)}',
    '.punktefeld .teil2{fill:var(--akzent-warm)}',
    '.punktefeld .weg{fill:none;stroke:var(--tinte-leise);stroke-width:1.5;stroke-dasharray:3 3}',
    '.punktefeld .trenner{stroke:var(--tinte);stroke-width:1.5}'
  ].join('');

  /** SVG-Element. Die Mini-DOM-Attrappe der Tests kennt createElementNS nicht, dort genügt createElement. */
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
    const f = [], zeilen = Number.isInteger(d.zeilen) ? d.zeilen : MAX;
    for (const k of ['zeilen', 'spalten']) {
      if (fehlt(d[k])) f.push(`daten.${k} fehlt`);
      else if (!ganz(d[k], 1, MAX)) f.push(`daten.${k} ist keine ganze Zahl von 1 bis ${MAX}`);
    }
    if (!fehlt(d.trenne) && !ganz(d.trenne, 0, zeilen)) f.push(`daten.trenne ist keine ganze Zahl von 0 bis ${zeilen}`);
    if (!fehlt(d.wegnehmen) && !ganz(d.wegnehmen, 0, zeilen - 1)) f.push(`daten.wegnehmen ist keine ganze Zahl von 0 bis ${zeilen - 1}`);
    for (const k of Object.keys(d)) if (!BEKANNT.includes(k)) f.push(`daten.${k} ist unbekannt (erlaubt: ${BEKANNT.join(', ')})`);
    return f;
  }

  /** Beschreibung für Vorlese-Programme und Tests. */
  function beschreibung(d) {
    let t = `${d.zeilen} Zeilen mit je ${d.spalten} Punkten`;
    if (d.trenne > 0 && d.trenne < d.zeilen) t += `, Trennlinie nach Zeile ${d.trenne}`;
    if (d.wegnehmen > 0) t += `, die letzten ${d.wegnehmen} Zeilen werden weggenommen`;
    return t;
  }

  L.hilfsmittel('punktefeld', {
    titel: 'Punktefeld',
    pruefe,
    /** Zeichnet das Punktefeld in behaelter und gibt das figure-Element zurück. Ungültige daten werfen einen Fehler. */
    render(behaelter, d) {
      const fehler = pruefe(d);
      if (fehler.length) throw new Error(`Punktefeld: ${fehler.join(', ')}`);
      const trenne = d.trenne || 0, weg = d.wegnehmen || 0;
      const w = d.spalten * ABSTAND + 2 * RAND, h = d.zeilen * ABSTAND + 2 * RAND, breite = Math.min(w, BREITE_MAX);
      const svg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, width: breite, height: Math.round(breite * h / w), role: 'img', 'aria-label': beschreibung(d) });
      for (let z = 0; z < d.zeilen; z++) {
        const ton = z >= d.zeilen - weg ? 'weg' : trenne && z >= trenne ? 'teil2' : 'teil1';
        for (let s = 0; s < d.spalten; s++) {
          svg.append(svgEl('circle', { cx: RAND + s * ABSTAND + ABSTAND / 2, cy: RAND + z * ABSTAND + ABSTAND / 2, r: RADIUS, class: `punkt ${ton}` }));
        }
      }
      if (trenne > 0 && trenne < d.zeilen) {
        const y = RAND + trenne * ABSTAND;
        svg.append(svgEl('line', { x1: 2, x2: w - 2, y1: y, y2: y, class: 'trenner' }));
      }
      const stil = document.createElement('style');
      stil.textContent = STIL;
      const figur = document.createElement('figure');
      figur.setAttribute('class', 'hilfsmittel punktefeld');
      figur.append(stil, svg);
      behaelter.append(figur);
      return figur;
    }
  });
})(globalThis);
