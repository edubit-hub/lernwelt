/* app/kern/lader.js: fügt die Skripte und Stylesheets aus app/manifest.js in die Seite ein.
   Skripte mit async = false: sie laden gleichzeitig, laufen aber in der Reihenfolge der Liste. Jede fehlende Datei wird einzeln
   gemeldet (Lader.fehler und der Hörer Lader.beiFehler), der Rest läuft weiter. Alles Nötige wird beim Start geladen,
   nachgeladen wird später nie (Architektur 2.6). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const IMMER = ['kern', 'typen', 'hilfsmittel'];    // Gruppen, die immer geladen werden. welten und module sind Tabellen nach ID

  function neuerLader() {
    const bestellt = new Map();                      // Pfad → Promise, jede Datei wird höchstens einmal eingefügt
    const lader = { fehler: [], beiFehler: null, grenzeMs: 20000, geladen: new Set(), plan, laden };

    /** Dateiliste in Ladereihenfolge, ohne Doppelte. opt.welt: ID des Welt-Themas (ohne Angabe alle, null keines),
        opt.module: Liste von Modul-IDs (ohne Angabe alle, [] keine). Unbekannte IDs landen in `unbekannt`. */
    function plan(manifest, opt = {}) {
      const m = manifest || {}, dateien = [], unbekannt = [];
      const nimm = pfade => (pfade || []).forEach(p => { if (!dateien.includes(p)) dateien.push(p); });
      IMMER.forEach(gruppe => nimm(m[gruppe]));
      [['welten', opt.welt, 'Welt-Thema'], ['module', opt.module, 'Modul']].forEach(([gruppe, wahl, name]) => {
        const tabelle = m[gruppe] || {};
        const ids = wahl === undefined ? Object.keys(tabelle) : wahl === null ? [] : [].concat(wahl);
        ids.forEach(id => { if (tabelle[id]) nimm(tabelle[id]); else unbekannt.push({ art: name, id }); });
      });
      return { dateien, unbekannt };
    }

    function melde(bericht, datei, grund) {
      const eintrag = { datei, meldung: grund };
      bericht.fehlend.push(eintrag);
      lader.fehler.push(eintrag);
      if (typeof lader.beiFehler === 'function') lader.beiFehler(eintrag);
    }

    function einfuegen(doc, pfad, bericht) {
      if (bestellt.has(pfad)) return bestellt.get(pfad);
      const versprechen = new Promise(fertig => {
        const css = /\.css$/.test(pfad), el = doc.createElement(css ? 'link' : 'script');
        let zeitgeber = null, erledigt = false;
        const ende = grund => {
          if (erledigt) return;
          erledigt = true;
          if (zeitgeber !== null) g.clearTimeout(zeitgeber);
          if (grund) melde(bericht, pfad, grund); else { lader.geladen.add(pfad); bericht.geladen.push(pfad); }
          fertig();
        };
        el.onload = () => ende(null);
        el.onerror = () => ende('Datei fehlt oder ist nicht lesbar');
        if (css) { el.rel = 'stylesheet'; el.href = pfad; } else { el.async = false; el.src = pfad; }
        zeitgeber = g.setTimeout(() => ende('Zeitüberschreitung beim Laden'), lader.grenzeMs);
        doc.head.appendChild(el);
      });
      bestellt.set(pfad, versprechen);
      return versprechen;
    }

    /** Lädt die Dateien nach plan(manifest, opt). Gibt ein Promise mit { geladen[], fehlend[{datei, meldung}], unbekannt[] } zurück,
        es wird nur ohne document abgelehnt. opt.dokument ersetzt das globale document (für Tests). */
    function laden(manifest, opt = {}) {
      const doc = opt.dokument || g.document, bericht = { geladen: [], fehlend: [], unbekannt: [] };
      if (!doc) return Promise.reject(new Error('Lader: kein document vorhanden'));
      const p = plan(manifest, opt);
      bericht.unbekannt = p.unbekannt;
      p.unbekannt.forEach(u => melde(bericht, `${u.art} «${u.id}»`, 'steht nicht im Manifest'));
      return Promise.all(p.dateien.map(pfad => einfuegen(doc, pfad, bericht))).then(() => bericht);
    }

    return lader;
  }

  L.neuerLader = neuerLader;
  L.Lader = neuerLader();
})(globalThis);
