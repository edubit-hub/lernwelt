/* app/hilfsmittel/zahlenstrahl.js: Hilfsmittel Zahlenstrahl (Architektur 4.2, modul-schema.md Abschnitt 8). Ein Strahl mit Strichen und Skalenwerten,
   auf dem Zahlen markiert sind (Lage einer Zahl, Nachbarzehner und Nachbarhunderter). Das Kind liest den Skalenwert und zählt keine Striche.
   Reine Darstellung: kein Zustand, kein Speichern, keine Ereignisse.
   daten: { von, bis, marken? }
     von, bis   ganze Zahlen mit von < bis, höchstens 100 000 auseinander
     marken     bis zu 8 Zahlen im Bereich, je eine Zahl oder { wert, text? }. Der Text ersetzt die Zahl über der Marke («?» verdeckt die Lösung)
   Teilung: Beschriftet sind die Vielfachen der grossen Schrittweite (höchstens 12 Abschnitte), dazwischen stehen feinere Striche.
   Farben stehen in app/stil/tokens.css, die Regeln dazu stehen hier, damit das Hilfsmittel ohne weitere Stylesheet-Datei auskommt. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, NS = 'http://www.w3.org/2000/svg';
  const B = 1000, RAND = 50, Y = 96, HOEHE = 160, BREITE_MAX = 640, MAX_BEREICH = 100000, MAX_MARKEN = 8, ABSTAND = 70;
  const GROSS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const BEKANNT = ['von', 'bis', 'marken'];
  const STIL = [
    '.hilfsmittel.zahlenstrahl{margin:0}',
    '.zahlenstrahl svg{display:block;max-width:100%;height:auto}',
    '.zahlenstrahl .achse{stroke:var(--tinte);stroke-width:3;stroke-linecap:round}',
    '.zahlenstrahl .fein{stroke:var(--tinte-leise);stroke-width:2}',
    '.zahlenstrahl .grob{stroke:var(--tinte);stroke-width:3}',
    '.zahlenstrahl text{fill:var(--tinte);font-size:28px;text-anchor:middle}',
    '.zahlenstrahl .punkt{fill:var(--akzent-warm);stroke:var(--flaeche);stroke-width:3}',
    '.zahlenstrahl .stiel{stroke:var(--akzent-warm);stroke-width:3}',
    '.zahlenstrahl .marke-text{fill:var(--tinte);font-weight:650}'
  ].join('');

  const fehlt = v => v === undefined || v === null;
  const ganz = Number.isInteger;
  const wertVon = m => (m !== null && typeof m === 'object' ? m.wert : m);

  /** SVG-Element. Die Mini-DOM-Attrappe der Tests kennt createElementNS (V-AP06-04), ältere Attrappen nur createElement. */
  function svgEl(name, attribute, text) {
    const e = document.createElementNS ? document.createElementNS(NS, name) : document.createElement(name);
    for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = String(text);
    return e;
  }

  /** Grosse Schrittweite (beschriftet) und feine Schrittweite (Striche) für den Bereich von bis. */
  function teilung(von, bis) {
    const gross = GROSS.find(s => (bis - von) / s <= 12) || GROSS[GROSS.length - 1];
    const anfang = Number(String(gross)[0]);
    return { gross, klein: gross === 1 ? 1 : gross / (anfang === 1 ? 10 : anfang) };
  }

  /** Fehlertexte für die daten einer Aufgabe, leer heisst in Ordnung (läuft im Prüfskript). */
  function pruefe(d) {
    if (d === null || typeof d !== 'object' || Array.isArray(d)) return ['daten fehlen'];
    const f = [];
    for (const k of ['von', 'bis']) {
      if (fehlt(d[k])) f.push(`daten.${k} fehlt`);
      else if (!ganz(d[k])) f.push(`daten.${k} ist keine ganze Zahl`);
    }
    for (const k of Object.keys(d)) if (!BEKANNT.includes(k)) f.push(`daten.${k} ist unbekannt (erlaubt: ${BEKANNT.join(', ')})`);
    if (f.length) return f;
    if (d.von >= d.bis) return ['daten.von muss kleiner sein als daten.bis'];
    if (d.bis - d.von > MAX_BEREICH) f.push(`daten: der Bereich ist grösser als ${MAX_BEREICH}`);
    if (fehlt(d.marken)) return f;
    if (!Array.isArray(d.marken) || d.marken.length > MAX_MARKEN) return [...f, `daten.marken ist keine Liste mit höchstens ${MAX_MARKEN} Marken`];
    d.marken.forEach((m, n) => {
      const w = wertVon(m);
      if (!ganz(w) || w < d.von || w > d.bis) f.push(`daten.marken[${n}]: wert ist keine ganze Zahl zwischen von und bis`);
      if (m !== null && typeof m === 'object' && !fehlt(m.text) && typeof m.text !== 'string') f.push(`daten.marken[${n}].text ist kein Text`);
    });
    return f;
  }

  const beschreibung = d => `Zahlenstrahl von ${d.von} bis ${d.bis}${d.marken && d.marken.length ? `, markiert: ${d.marken.map(wertVon).join(', ')}` : ''}`;

  L.hilfsmittel('zahlenstrahl', {
    titel: 'Zahlenstrahl',
    pruefe,
    /** Zeichnet den Zahlenstrahl in behaelter und gibt das figure-Element zurück. Ungültige daten werfen einen Fehler. */
    render(behaelter, d) {
      const fehler = pruefe(d);
      if (fehler.length) throw new Error(`Zahlenstrahl: ${fehler.join(', ')}`);
      const { von, bis } = d, { gross, klein } = teilung(von, bis), x = w => RAND + (w - von) / (bis - von) * (B - 2 * RAND);
      const svg = svgEl('svg', { viewBox: `0 0 ${B} ${HOEHE}`, width: BREITE_MAX, height: Math.round(BREITE_MAX * HOEHE / B), role: 'img', 'aria-label': beschreibung(d) });
      let fein = '', grob = `M${x(von)} ${Y - 18}V${Y + 18}M${x(bis)} ${Y - 18}V${Y + 18}`;
      const zahlen = [];
      for (let w = Math.ceil(von / klein) * klein; w <= bis; w += klein) {
        if (w % gross === 0) { grob += `M${x(w).toFixed(1)} ${Y - 18}V${Y + 18}`; zahlen.push(w); }
        else fein += `M${x(w).toFixed(1)} ${Y - 9}V${Y + 9}`;
      }
      svg.append(svgEl('line', { x1: RAND - 14, x2: B - RAND + 14, y1: Y, y2: Y, class: 'achse' }), svgEl('path', { d: fein, class: 'fein' }), svgEl('path', { d: grob, class: 'grob' }));
      for (const w of zahlen) svg.append(svgEl('text', { x: x(w).toFixed(1), y: Y + 54 }, w));
      let hoch = false, vorher = -Infinity;
      for (const m of [...(d.marken || [])].sort((a, b) => wertVon(a) - wertVon(b))) {
        const w = wertVon(m), px = x(w);
        hoch = px - vorher < ABSTAND ? !hoch : false;                  // enge Marken tragen ihre Beschriftung auf zwei Höhen
        vorher = px;
        const oben = Y - (hoch ? 76 : 44);
        svg.append(svgEl('line', { x1: px, x2: px, y1: oben + 8, y2: Y, class: 'stiel' }), svgEl('circle', { cx: px, cy: Y, r: 9, class: 'punkt' }),
          svgEl('text', { x: px, y: oben, class: 'marke-text' }, m !== null && typeof m === 'object' && typeof m.text === 'string' ? m.text : w));
      }
      const stil = document.createElement('style');
      stil.textContent = STIL;
      const figur = document.createElement('figure');
      figur.setAttribute('class', 'hilfsmittel zahlenstrahl');
      figur.append(stil, svg);
      behaelter.append(figur);
      return figur;
    }
  });
})(globalThis);
