/* app/hilfsmittel/rechenstrich.js: Hilfsmittel Rechenstrich (Architektur 4.2, modul-schema.md Abschnitt 8). Der leere Zahlenstrahl für das halbschriftliche
   Rechnen: eine Startzahl, Bögen mit der Sprunggrösse darüber und die Zwischenergebnisse darunter. Die Abstände sind gleich gross und nicht masstreu,
   denn der Strich zeigt den Rechenweg und keine Länge. Reine Darstellung: kein Zustand, kein Speichern, keine Ereignisse.
   daten: { start, spruenge, verdecke? }
     start      ganze Zahl von 0 bis 100 000
     spruenge   1 bis 6 ganze Zahlen ohne 0, plus vorwärts, minus rückwärts. Jeder Zwischenstand bleibt zwischen 0 und 100 000
     verdecke   'keines' (Standard), 'ende' (letzte Zahl steht als «?») oder 'start' (die Startzahl steht als «?»)
   Farben stehen in app/stil/tokens.css, die Regeln dazu stehen hier, damit das Hilfsmittel ohne weitere Stylesheet-Datei auskommt. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const B = 1000, HOEHE = 190, Y = 112, RAND = 90, MAX = 100000, MAX_SPRUENGE = 6, BREITE_MAX = 640;
  const BEKANNT = ['start', 'spruenge', 'verdecke'], VERDECKE = ['keines', 'ende', 'start'];
  const STIL = [
    '.rechenstrich{margin:0}',
    '.rechenstrich svg{display:block;max-width:100%;height:auto}',
    '.rechenstrich .strich{stroke:var(--tinte);stroke-width:3;stroke-linecap:round;fill:none}',
    '.rechenstrich .spitze{fill:var(--tinte)}',
    '.rechenstrich .punkt{fill:var(--tinte)}',
    '.rechenstrich .bogen{fill:none;stroke:var(--akzent);stroke-width:3}',
    '.rechenstrich .bogen.zurueck{stroke:var(--akzent-warm)}',
    '.rechenstrich text{fill:var(--tinte);font-size:30px;text-anchor:middle}',
    '.rechenstrich .sprung{fill:var(--akzent-dunkel);font-weight:700}'
  ].join('');

  /** SVG-Element. Die Mini-DOM-Attrappe der Tests kennt createElementNS nicht überall, dort genügt createElement. */
  function svgEl(name, attribute, text) {
    const e = document.createElementNS ? document.createElementNS(NS, name) : document.createElement(name);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = String(text);
    return e;
  }

  const fehlt = v => v === undefined || v === null;

  /** Die Zahlen vom Start bis zum Ende, eine je Punkt auf dem Strich. */
  const staende = d => d.spruenge.reduce((a, s) => (a.push(a[a.length - 1] + s), a), [d.start]);

  /** Fehlertexte für die daten einer Aufgabe, leer heisst in Ordnung (läuft im Prüfskript). */
  function pruefe(d) {
    if (d === null || typeof d !== 'object' || Array.isArray(d)) return ['daten fehlen'];
    const f = [];
    if (fehlt(d.start)) f.push('daten.start fehlt');
    else if (!Number.isInteger(d.start) || d.start < 0 || d.start > MAX) f.push(`daten.start ist keine ganze Zahl von 0 bis ${MAX}`);
    if (!Array.isArray(d.spruenge) || d.spruenge.length < 1 || d.spruenge.length > MAX_SPRUENGE) f.push(`daten.spruenge ist keine Liste mit 1 bis ${MAX_SPRUENGE} Sprüngen`);
    else if (d.spruenge.some(s => !Number.isInteger(s) || s === 0)) f.push('daten.spruenge enthält etwas anderes als ganze Zahlen ausser 0');
    if (!fehlt(d.verdecke) && !VERDECKE.includes(d.verdecke)) f.push(`daten.verdecke ist keiner von ${VERDECKE.join(', ')}`);
    for (const k of Object.keys(d)) if (!BEKANNT.includes(k)) f.push(`daten.${k} ist unbekannt (erlaubt: ${BEKANNT.join(', ')})`);
    if (!f.length && staende(d).some(z => z < 0 || z > MAX)) f.push(`daten: ein Zwischenstand liegt ausserhalb von 0 bis ${MAX}`);
    return f;
  }

  const vorzeichen = s => (s > 0 ? '+' : '−') + Math.abs(s);
  const beschreibung = d => `Rechenstrich von ${d.start}: ${d.spruenge.map(vorzeichen).join(', ')}`;

  L.hilfsmittel('rechenstrich', {
    titel: 'Rechenstrich',
    pruefe,
    /** Zeichnet den Rechenstrich in behaelter und gibt das figure-Element zurück. Ungültige daten werfen einen Fehler. */
    render(behaelter, d) {
      const fehler = pruefe(d);
      if (fehler.length) throw new Error(`Rechenstrich: ${fehler.join(', ')}`);
      const zahlen = staende(d), schritt = (B - 2 * RAND) / (zahlen.length - 1), x = n => RAND + n * schritt, verdecke = d.verdecke || 'keines';
      const svg = svgEl('svg', { viewBox: `0 0 ${B} ${HOEHE}`, width: BREITE_MAX, height: Math.round(BREITE_MAX * HOEHE / B), role: 'img', 'aria-label': beschreibung(d) });
      svg.append(svgEl('path', { d: `M24 ${Y}H${B - 34}`, class: 'strich' }), svgEl('path', { d: `M${B - 18} ${Y}l-20 -9v18z`, class: 'spitze' }));
      zahlen.forEach((z, n) => {
        const verdeckt = (n === 0 && verdecke === 'start') || (n === zahlen.length - 1 && verdecke === 'ende');
        svg.append(svgEl('circle', { cx: x(n), cy: Y, r: 7, class: 'punkt' }), svgEl('text', { x: x(n), y: Y + 50 }, verdeckt ? '?' : z));
        if (n === 0) return;
        const s = d.spruenge[n - 1], mitte = (x(n - 1) + x(n)) / 2, zurueck = s < 0;
        svg.append(svgEl('path', { d: `M${x(n - 1)} ${Y - 10}Q${mitte} ${Y - 90} ${x(n)} ${Y - 10}`, class: zurueck ? 'bogen zurueck' : 'bogen' }),
          svgEl('text', { x: mitte, y: Y - 66, class: 'sprung' }, vorzeichen(s)));
      });
      const stil = document.createElement('style');
      stil.textContent = STIL;
      const figur = document.createElement('figure');
      figur.setAttribute('class', 'hilfsmittel rechenstrich');
      figur.append(stil, svg);
      behaelter.append(figur);
      return figur;
    }
  });
})(globalThis);
