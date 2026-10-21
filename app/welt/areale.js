/* app/welt/areale.js: ordnet die Themen der Module den Arealen der Fachinseln zu (Plan 0.2, E-2010-03). Reine Logik ohne DOM und ohne Zustand.
     Areale.ordne(welt, module) → [{ fach, insel, name, kultur, farbe, beschreibung, areale: [Areal], erweiterung: Areal | null }]
     Areal: { id: '<fach>.<platz>', fach, platz, name, schild, text, themen: [{ key, modul, thema, titel }], module: [modul-ID] }
   module: Moduldefinitionen { id, fach, titel, themen: [{ id, titel }] }. Ein Eintrag in inhalt ist «modul», «modul/thema» oder «modul/anfang*».
   Der genaueste Eintrag gewinnt über alle Areale eines Fachs: ein genanntes Thema vor einem Anfang, ein längerer Anfang vor einem kürzeren,
   ein Anfang vor dem ganzen Modul. Themen ohne Areal kommen auf das neue Land (welt.erweiterung). Areale ohne Themen fallen weg. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const liste = v => (Array.isArray(v) ? v : []);
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);

  /** Wie genau trifft der Eintrag e das Thema? 0 heisst gar nicht. */
  function treffer(e, modul, thema) {
    if (typeof e !== 'string') return 0;
    const i = e.indexOf('/');
    if (i < 0) return e === modul ? 1 : 0;
    if (e.slice(0, i) !== modul) return 0;
    const rest = e.slice(i + 1);
    if (rest.endsWith('*')) return thema.startsWith(rest.slice(0, -1)) ? 2 + rest.length : 0;
    return rest === thema ? 10000 : 0;
  }

  const areal = (fach, a, themen) => ({ id: `${fach}.${a.platz}`, fach, platz: a.platz, name: a.name, schild: liste(a.schild).length ? a.schild.slice() : [a.name],
    text: a.text || '', themen, module: [...new Set(themen.map(t => t.modul))] });

  function ordne(welt, module) {
    if (!objekt(welt)) return [];
    const ms = liste(module).filter(m => objekt(m) && typeof m.id === 'string');
    return liste(welt.faecher).filter(objekt).map(f => {
      const plaetze = liste(f.areale).filter(objekt), sammel = new Map(plaetze.map(a => [a.platz, []])), rest = [];
      for (const m of ms.filter(m => m.fach === f.fach)) {
        for (const t of liste(m.themen).filter(t => objekt(t) && typeof t.id === 'string' && !t.veraltet)) {
          let best = null, wert = 0;
          for (const a of plaetze) for (const e of liste(a.inhalt)) { const w = treffer(e, m.id, t.id); if (w > wert) { wert = w; best = a; } }
          const x = { key: `${m.id}/${t.id}`, modul: m.id, thema: t.id, titel: t.titel || t.id };
          (best ? sammel.get(best.platz) : rest).push(x);
        }
      }
      const E = objekt(welt.erweiterung) ? welt.erweiterung : null;
      const neu = E && rest.length ? areal(f.fach, rest.every(t => t.modul === rest[0].modul) ? { ...E, name: (ms.find(m => m.id === rest[0].modul) || {}).titel || E.name, schild: null } : E, rest) : null;
      return { fach: f.fach, insel: f.insel, name: f.name, kultur: f.kultur, farbe: f.farbe || null, beschreibung: f.beschreibung || '',
        areale: plaetze.map(a => areal(f.fach, a, sammel.get(a.platz))).filter(a => a.themen.length), erweiterung: neu };
    });
  }

  /** Das Areal mit dieser ID ('mathe.zahlen') in einer Ordnung, auch auf neuem Land, sonst null. */
  function finde(ordnung, id) {
    for (const f of liste(ordnung)) for (const a of [...f.areale, f.erweiterung]) if (a && a.id === id) return a;
    return null;
  }

  L.Areale = { ordne, finde, treffer };
})(globalThis);
