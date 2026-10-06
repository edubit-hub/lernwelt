/* app/ansichten/eltern-diagnose.js: Reiter «Diagnose» des Elternbereichs (Architektur 8.1, 8.4, 8.6, 8.8, 6.10): Speicherart, Datenbudget und
   «Speicherplatz messen», Version und Service-Worker-Status, Fähigkeiten des Geräts, Spieltag mit Rückfrage, Fehlerprotokoll und «Diagnose kopieren».
   Auf dem iPad ist der Safari-Inspektor kaum erreichbar, deshalb ist dieser Text die Diagnose. Er enthält nie den Vornamen oder den Lernstand.
   Asynchrone Angaben (persist, Service Worker, Cache) tragen sich ein, sobald sie da sind. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const SW_FRIST_MS = 3000;
  const FAEHIGKEITEN = [['localStorage', 'Speicher des Browsers'], ['structuredClone', 'structuredClone'], ['sprachmittel', 'Sprachmittel von JavaScript'],
    ['cryptoSubtle', 'crypto.subtle (Dateien prüfen)'], ['speechSynthesis', 'Sprachausgabe vorhanden'], ['serviceWorker', 'Service Worker vorhanden'],
    ['persist', 'Dauerhafter Speicher (persist)'], ['standalone', 'Installierte App (Home-Bildschirm)'], ['skripte', 'Alle Programmdateien geladen']];
  const ja = w => (w ? 'ja' : 'nein');
  const frist = (p, ms) => {
    let t = null;
    return Promise.race([Promise.resolve(p), new Promise((_, nein) => { t = g.setTimeout(() => nein(new Error('Zeitüberschreitung')), ms); })]).finally(() => g.clearTimeout(t));
  };

  // ---- Spieltag (6.10) ------------------------------------------------------------------------------------------
  function spieltagLage(z, heute) {
    const T = L.Tag, letzter = z && z.meta && z.meta.letzterTag, gueltig = typeof letzter === 'string' && T.gueltig(letzter);
    return { heute, letzter: gueltig ? letzter : null, spieltag: T.spieltag(heute, gueltig ? letzter : null), hinterher: gueltig && T.uhrHinterher(heute, letzter), tage: gueltig ? T.diff(letzter, heute) : 0 };
  }

  /** Rückfrage für den Kopf des Elternbereichs, wenn die Uhr mehr als 14 Tage hinter dem letzten Lerntag liegt. Sonst null. */
  function spieltagFrage(k) {
    const s = spieltagLage(k.Z.hole(), k.heute());
    if (!s.hinterher || k.verborgen.has('spieltag')) return null;
    const h = k.h;
    const zuruecksetzen = async () => {
      const ok = await k.dialog.frage({
        titel: 'Spieltag zurücksetzen?', ja: 'Zurücksetzen', nein: 'Abbrechen', gefahr: true,
        text: [`Der Spieltag wird vom ${k.datum(s.spieltag)} auf heute (${k.datum(s.heute)}) gesetzt. Der Lernstand selbst bleibt unverändert.`,
          'Aufgaben, die schon für spätere Tage eingeplant sind, werden erst an diesen Tagen wieder fällig.']
      });
      if (!ok || !k.offen) return;
      k.Z.aendere(z => { z.meta.letzterTag = s.heute; });
      k.meldung(`Der Spieltag ist jetzt der ${k.datum(s.heute)}.`, 'ok');
      k.neuZeichnen();
    };
    return k.kasten('hilfe', 'Die Uhr geht zurück',
      h('p', `Die Uhr dieses Geräts liegt ${s.tage} Tage hinter dem letzten Lerntag (${k.datum(s.letzter)}). Bis sie ihn erreicht, zählt die App den Lerntag vom ${k.datum(s.letzter)} weiter, damit nichts doppelt gezählt wird.`),
      h('p', `Wenn die Uhr vorher falsch ging und jetzt stimmt, kann der Spieltag auf heute (${k.datum(s.heute)}) zurückgesetzt werden.`),
      h('div.eltern-zeile', [h('button.knopf.primaer', { type: 'button', onclick: zuruecksetzen }, 'Spieltag zurücksetzen'),
        h('button.knopf.leise', { type: 'button', onclick: () => { k.verborgen.add('spieltag'); k.aktualisiere(); } }, 'Beibehalten')]));
  }

  // ---- Service Worker und Cache (8.5) ---------------------------------------------------------------------------
  async function swZeilen(k) {
    const loc = k.win.location || {}, sw = k.nav.serviceWorker, ms = k.opt.swFrist || SW_FRIST_MS;
    if (loc.protocol === 'file:') return [['Service Worker', 'Nicht verfügbar: Die Seite läuft als Datei (file://). Service Worker brauchen https oder localhost.']];
    if (!sw) return [['Service Worker', 'Dieser Browser bietet keine Service Worker.']];
    const reg = await frist(sw.getRegistration(), ms).catch(() => null), zeilen = [];
    if (!reg) zeilen.push(['Service Worker', 'Nicht registriert. Auf localhost startet er nur mit ?sw=1.']);
    else {
      const zustand = reg.active ? 'Aktiv' : reg.installing ? 'Wird installiert' : reg.waiting ? 'Wartet auf die Aktivierung' : 'Registriert, ohne aktiven Worker';
      zeilen.push(['Service Worker', `${zustand}${sw.controller ? ', steuert diese Seite' : ', steuert diese Seite noch nicht'}`],
        ['Neue Version', reg.waiting ? 'Eine neue Version wartet. Der Startbildschirm bietet «Neue Version bereit» an.' : 'Keine wartende Version.'], ['Bereich', reg.scope || 'unbekannt']);
    }
    if (!k.win.caches) zeilen.push(['Cache', 'Cache Storage ist nicht verfügbar.']);
    else {
      const namen = (await frist(k.win.caches.keys(), ms).catch(() => [])).filter(n => String(n).startsWith('lernwelt-'));
      zeilen.push(['Cache', namen.length ? `${namen.join(', ')} (${namen.includes(`lernwelt-${k.version.build}`) ? 'passt zur Version' : 'passt nicht zur Version'})` : 'Kein Cache der Lernwelt.']);
    }
    return zeilen;
  }

  // ---- Diagnosetext -----------------------------------------------------------------------------------------------
  const aktualisiere = k => { if (k.offen && k.diagnoseAktualisieren) k.diagnoseAktualisieren(); };
  function diagnoseText(k) {
    const z = k.Z.hole(), v = k.version, S = k.Z.speicher(), G = k.Z.GRENZEN, f = ((k.diag && k.diag.f) || {}).faehigkeiten || {}, loc = k.win.location || {}, sp = spieltagLage(z, k.heute());
    const zeilen = ['Lernwelt Diagnose', `Zeit: ${new Date().toISOString()}`, `App: ${v.app} (Build ${v.build}, Stand ${v.stand})`,
      `Seite: ${loc.origin || loc.protocol || ''}${loc.pathname || ''}`, `Browser: ${(k.nav.userAgent || 'unbekannt')}`, `Installierte App: ${ja(f.standalone)}`,
      `Speicher: ${S ? S.art : 'keiner'}, Namensraum ${S ? S.namensraum : 'unbekannt'}, Profil ${k.Z.profil() || 'Standard'}`,
      `Lernstand: Schema ${z.schema}, ${k.Z.zeichen()} Zeichen (${Math.round(k.Z.zeichen() / G.annahmeGrenze * 1000) / 10} % von ${G.annahmeGrenze})`,
      `Dauerhafter Speicher: ${(k.diag && k.diag.persist) || 'nicht geprüft'}`, ...((k.diag && k.diag.sw) || []).map(([n, w]) => `${n}: ${w}`),
      `Spieltag: heute ${sp.heute}, letzter Lerntag ${sp.letzter || 'keiner'}, Spieltag ${sp.spieltag}`,
      `Fähigkeiten: ${FAEHIGKEITEN.map(([id]) => `${id} ${ja(f[id])}`).join(', ')}`,
      ...(L.ElternStimmen ? L.ElternStimmen.zeilen(k) : []), '', `Fehlerprotokoll (${k.log.liste().length} Einträge):`, k.log.text() || 'leer'];
    return zeilen.join('\n');
  }

  // ---- Abschnitte -----------------------------------------------------------------------------------------------
  function speicherKachel(k) {
    const h = k.h, Z = k.Z, S = Z.speicher(), G = Z.GRENZEN, zeichen = Z.zeichen(), bel = S ? S.belegung() : { je: {}, belegt: 0 };
    const persist = h('span', 'wird geprüft'), ergebnis = h('div', { role: 'status', 'aria-live': 'polite' });
    const zeigePersist = r => {
      k.diag.persist = !r.unterstuetzt ? 'nicht unterstützt' : r.persistent === true ? 'ja' : r.persistent === false ? 'nein, der Browser kann den Speicher bei Platzmangel leeren' : 'unbekannt';
      if (r.fehler) k.diag.persist += ` (${r.fehler})`;
      persist.textContent = k.diag.persist;
      aktualisiere(k);
    };
    L.Speicher.persistenz(k.nav, false).then(r => { if (k.offen) zeigePersist(r); });
    const nochmal = h('button.knopf.leise', { type: 'button', onclick: () => L.Speicher.persistenz(k.nav, true).then(r => { if (k.offen) { zeigePersist(r); k.meldung('Der dauerhafte Speicher wurde angefragt.'); } }) }, 'Erneut anfragen');
    const messen = h('button.knopf', { type: 'button' }, 'Speicherplatz messen');
    messen.addEventListener('click', () => {
      messen.setAttribute('disabled', '');
      ergebnis.textContent = 'Die Messung läuft.';
      g.setTimeout(() => {
        try {
          const r = S.messePlatz();
          ergebnis.replaceChildren(h('p', `Freier Platz: ${k.zahl(r.frei)} Zeichen. Insgesamt belegt oder frei: ${k.zahl(r.gesamt)} Zeichen, davon dieser Lernstand ${k.zahl(r.eigen)}.`),
            h('p.hinweis', r.grenzeGefunden ? 'Die Grenze des Browsers wurde gefunden. Den Wert für die Abnahmeliste (Punkt 11) notieren.' : 'Die Messung hat bei der Obergrenze abgebrochen, der Speicher ist grösser als angenommen.'));
        } catch (e) { k.log.melde(e, { art: 'speicher', datei: 'eltern-diagnose.js' }); ergebnis.textContent = 'Die Messung ist fehlgeschlagen.'; }
        messen.removeAttribute('disabled');
      }, 0);
    });
    const je = n => k.zahl(bel.je[n] || 0);
    return k.kachel('Speicher',
      zeichen >= G.warnungAb ? k.kasten('fehler', 'Der Speicher füllt sich', `Der Lernstand ist gross (${k.zahl(zeichen)} Zeichen). Bitte eine Sicherung erstellen.`) : '',
      k.werte([['Speicherart', S ? `${S.art}, Namensraum ${S.namensraum}` : 'kein Speicher'], ['Profil', Z.profil() ? `Testprofil «${Z.profil()}»` : 'Standard'], ['Dauerhafter Speicher', persist],
        ['Lernstand', `${k.zahl(zeichen)} Zeichen, ${Math.round(zeichen / G.annahmeGrenze * 1000) / 10} % der angenommenen Grenze (${k.zahl(G.annahmeGrenze)})`],
        ['Belegung', `Dokument ${je('zustand')}, Kopie vom Vortag ${je('kopie')}, vor Import oder Migration ${je('vorher')}, beschädigte Fassung ${je('defekt')}`],
        ['Verdichten ab', `${k.zahl(G.verdichtenAb)} Zeichen, Warnung ab ${k.zahl(G.warnungAb)}`]]),
      h('div.eltern-zeile', [messen, nochmal]), ergebnis,
      h('p.hinweis', 'Das Messen schreibt vorübergehend Testdaten bis zur Grenze des Browsers und räumt danach auf. Der Lernstand bleibt unberührt.'));
  }

  function versionKachel(k) {
    const h = k.h, v = k.version, loc = k.win.location || {}, swKasten = h('div');
    const kopf = [['App-Version', v.app], ['Build', v.build], ['Stand', v.stand], ['Lernstand-Format', `Schema ${k.Z.hole().schema}`], ['Adresse', `${loc.origin || loc.protocol || ''}${loc.pathname || ''}`],
      ['Installierte App', ja((k.diag.f.faehigkeiten || {}).standalone)]];
    swKasten.replaceChildren(k.werte([...kopf, ['Service Worker', 'wird geprüft']]));
    swZeilen(k).then(z => { if (k.offen) { k.diag.sw = z; swKasten.replaceChildren(k.werte([...kopf, ...z])); aktualisiere(k); } }, e => { k.log.melde(e, { art: 'hinweis', datei: 'eltern-diagnose.js' }); });
    return k.kachel('Version und Offline-Betrieb', swKasten);
  }

  function faehigkeitenKachel(k) {
    const h = k.h, r = k.diag.f, f = r.faehigkeiten || {};
    return k.kachel('Fähigkeiten dieses Geräts',
      k.werte(FAEHIGKEITEN.map(([id, name]) => [name, h(f[id] ? 'span.ok-text' : 'span.fehler-text', ja(f[id]))])),
      (r.hinweise || []).length ? h('ul.liste', r.hinweise.map(x => h('li.klein', x.text))) : '');
  }

  function spieltagKachel(k) {
    const s = spieltagLage(k.Z.hole(), k.heute());
    return k.kachel('Spieltag', k.werte([['Heute (Uhr des Geräts)', k.datum(s.heute)], ['Letzter Lerntag', s.letzter ? k.datum(s.letzter) : 'noch keiner'], ['Spieltag', k.datum(s.spieltag)]]),
      k.h('p.hinweis', 'Der Spieltag ist nie früher als der letzte Lerntag. So wird bei zurückgestellter Uhr nichts doppelt gezählt.'));
  }

  function protokollKachel(k) {
    const h = k.h, feld = h('textarea.eltern-text', { readonly: true, rows: 8, spellcheck: 'false', 'aria-label': 'Diagnose' });
    const text = () => { feld.value = diagnoseText(k); return feld.value; };
    text();
    const kopieren = () => k.kopiere(text()).then(ok => k.meldung(ok ? 'Die Diagnose wurde kopiert.' : 'Kopieren nicht möglich. Den Text markieren und von Hand kopieren.', ok ? 'ok' : 'fehler'));
    const teilen = () => {
      try { Promise.resolve(k.nav.share({ title: 'Lernwelt Diagnose', text: text() })).then(() => k.meldung('Die Diagnose wurde geteilt.', 'ok'), f => { if (!f || f.name !== 'AbortError') k.meldung('Teilen nicht möglich. Bitte kopieren.', 'fehler'); }); } catch (e) { k.meldung('Teilen nicht möglich. Bitte kopieren.', 'fehler'); }
    };
    k.diagnoseAktualisieren = () => { if (k.offen) text(); };
    return k.kachel('Fehlerprotokoll', h('p', `${k.log.liste().length} Einträge im Protokoll. Es liegt nur im Arbeitsspeicher und gehört nicht in die Sicherung.`), feld,
      h('div.eltern-zeile', [h('button.knopf.primaer', { type: 'button', onclick: kopieren }, 'Diagnose kopieren'),
        typeof k.nav.share === 'function' ? h('button.knopf', { type: 'button', onclick: teilen }, 'Diagnose teilen') : '']));
  }

  function bau(k) {
    k.diag = { f: k.faehigkeiten() || {} };                  // einmal je Aufruf: die Prüfung schreibt einen Probeschlüssel in den Speicher
    return k.h('div.eltern-inhalt', speicherKachel(k), versionKachel(k), faehigkeitenKachel(k), spieltagKachel(k), protokollKachel(k));
  }

  const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === 'diagnose');
  if (alt >= 0) liste.splice(alt, 1);
  liste.push({ id: 'diagnose', titel: 'Diagnose', rang: 80, bau });
  L.ElternDiagnose = { spieltagLage, spieltagFrage, swZeilen, diagnoseText, bau };
})(globalThis);
