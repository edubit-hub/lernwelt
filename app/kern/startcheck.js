/* app/kern/startcheck.js: prüft Fähigkeiten statt Versionsnummern (Architektur 8.8). Fehlt etwas Wesentliches, zeigt die App eine lesbare
   Seite mit dem Grund. Fehlt nur die Sprachausgabe, läuft die App weiter und meldet einen Hinweis. Aufruf nach dem Laden der Skripte,
   vor Zustand.starte. pruefe() wirft nie. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const FEHLT = {
    localStorage: 'Der Speicher des Browsers ist nicht verfügbar. Ohne ihn kann die Lernwelt den Lernstand nicht behalten. Bitte die App nicht im privaten Modus öffnen und die Einstellungen für Website-Daten prüfen.',
    structuredClone: 'Der Browser ist zu alt, die Funktion «structuredClone» fehlt. Bitte iPadOS und Safari aktualisieren.',
    sprachmittel: 'Der Browser ist zu alt, grundlegende Funktionen von JavaScript fehlen. Bitte iPadOS und Safari aktualisieren.'
  };
  const HINWEIS = {
    speechSynthesis: 'Die Sprachausgabe fehlt in diesem Browser. Hör- und Diktataufgaben werden durch andere Aufgaben ersetzt.',
    speicherVoll: 'Der Speicher des Browsers ist voll. Bitte im Elternbereich eine Sicherung erstellen.',
    cryptoSubtle: 'Der Browser kann Dateien nicht prüfen (crypto.subtle fehlt). Die Installation für den Offline-Betrieb funktioniert so nicht.'
  };

  /** Klang- und Musikdaten sind Beiwerk: Lädt eine davon nicht, bleibt der Ton still (Vertrag von app/ui/klang.js), die App startet.
      Der Ladefehler steht trotzdem im Fehlerprotokoll (Fehlerlog hört am Lader mit). */
  const BEIWERK = /^app\/klang\//;

  /** 'ja', 'voll' (Schreiben scheitert am Platz) oder 'nein'. Der Probeschlüssel wird sofort wieder entfernt. */
  function speicherProbe(w) {
    try {
      const ls = w.localStorage;
      if (!ls) return 'nein';
      ls.setItem('lernwelt-startcheck', '1');
      const ok = ls.getItem('lernwelt-startcheck') === '1';
      ls.removeItem('lernwelt-startcheck');
      return ok ? 'ja' : 'nein';
    } catch (e) { return /quota/i.test(String(e && e.name)) ? 'voll' : 'nein'; }
  }

  /** Läuft die Seite als installierte App vom Home-Bildschirm? Das gibt dem Elternbereich die Angabe, ob der Speicher der App gemeint ist (8.4). */
  function istInstalliert(w, nav) {
    try { return nav.standalone === true || !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; }
  }

  /** → { ok, fehlt: [{ id, text }], hinweise: [{ id, text }], faehigkeiten }. opt: { g } für Tests, ein anderes globales Objekt. */
  function pruefe(opt = {}) {
    const w = opt.g || g, fehlt = [], hinweise = [];
    const nav = w.navigator || {};
    const probe = speicherProbe(w);
    const f = {
      localStorage: probe !== 'nein',
      structuredClone: typeof w.structuredClone === 'function',
      sprachmittel: typeof [].at === 'function' && typeof Object.fromEntries === 'function' && typeof Promise === 'function' && typeof Map === 'function',
      cryptoSubtle: !!(w.crypto && w.crypto.subtle),
      speechSynthesis: !!w.speechSynthesis,
      serviceWorker: !!nav.serviceWorker,
      persist: !!(nav.storage && typeof nav.storage.persist === 'function'),
      standalone: istInstalliert(w, nav)
    };
    ['localStorage', 'structuredClone', 'sprachmittel'].forEach(id => { if (!f[id]) fehlt.push({ id, text: FEHLT[id] }); });
    const lader = (w.Lernwelt && w.Lernwelt.Lader) || opt.lader;
    const dateien = lader && Array.isArray(lader.fehler) ? lader.fehler.map(e => e.datei).filter(d => !BEIWERK.test(String(d))) : [];
    f.skripte = dateien.length === 0;
    if (dateien.length) {
      const liste = dateien.slice(0, 5).join(', ') + (dateien.length > 5 ? ` und ${dateien.length - 5} weitere` : '');
      fehlt.push({ id: 'skripte', text: `Nicht alle Programmdateien konnten geladen werden: ${liste}. Bitte die Seite neu laden. Hilft das nicht, die Verbindung prüfen und die App neu installieren.` });
    }
    if (probe === 'voll') hinweise.push({ id: 'speicherVoll', text: HINWEIS.speicherVoll });
    if (!f.speechSynthesis) hinweise.push({ id: 'speechSynthesis', text: HINWEIS.speechSynthesis });
    if (f.serviceWorker && !f.cryptoSubtle) hinweise.push({ id: 'cryptoSubtle', text: HINWEIS.cryptoSubtle });
    return { ok: fehlt.length === 0, fehlt, hinweise, faehigkeiten: f };
  }

  /** Zeigt die lesbare Fehlerseite in huelle. Nur DOM-Grundfunktionen und eingebettete Farben, weil Stylesheets und ui.h fehlen können.
      Liegen Einträge im Fehlerprotokoll (log, Standard Lernwelt.Fehlerlog), stehen sie als markierbarer Text darunter: Der Elternbereich,
      der sie sonst teilt, ist auf dieser Seite nicht erreichbar. */
  function zeige(huelle, ergebnis, dok = g.document, log = L.Fehlerlog) {
    const el = (tag, stil, ...kinder) => {
      const e = dok.createElement(tag);
      if (stil) e.setAttribute('style', stil);
      kinder.forEach(k => e.appendChild(typeof k === 'string' ? dok.createTextNode(k) : k));
      return e;
    };
    let protokoll = '';
    try { protokoll = (log && typeof log.text === 'function' && log.text()) || ''; } catch (e) { protokoll = ''; }
    const leise = 'margin:.5rem 0;color:#5B6B78;font-size:.875rem';
    const kasten = el('div',
      'box-sizing:border-box;max-width:36rem;margin:3rem auto;padding:1.25rem 1.5rem;background:#FFFFFF;color:#1E2A34;border:1px solid #C7CDD3;border-left:4px solid #B5483A;border-radius:8px;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
      el('h1', 'margin:0 0 .5rem;font-size:1.25rem', 'Die Lernwelt kann nicht starten'),
      el('p', 'margin:.5rem 0', 'Auf diesem Gerät fehlt etwas, das die Lernwelt braucht:'),
      el('ul', 'margin:.5rem 0;padding-left:1.25rem', ...ergebnis.fehlt.map(x => el('li', 'margin:.25rem 0', x.text))),
      el('p', leise, 'Wenn es nach dem Aktualisieren von iPadOS und Safari weiterhin nicht klappt, hilft die Meldung bei der Suche.'),
      ...(protokoll ? [el('p', leise + ';margin-bottom:.25rem', 'Technische Angaben'),
        el('pre', 'margin:0;padding:.5rem .75rem;background:#F3EFE6;border-radius:4px;color:#1E2A34;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;-webkit-user-select:text;user-select:text', protokoll)] : []));
    kasten.setAttribute('role', 'alert');
    kasten.setAttribute('class', 'startfehler');
    huelle.replaceChildren(kasten);
    return kasten;
  }

  L.Startcheck = { pruefe, zeige };
})(globalThis);
