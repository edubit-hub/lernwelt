/* app/start.js: Startablauf und Verdrahtung der Schichten (Architektur 2.2, 8.5, 8.8, F-AP03-01). index.html bindet diese Datei als letzte ein, der Lader
   fügt danach alle anderen Dateien ein. Ablauf: Kern laden, Fehlerprotokoll, Startcheck, Zustand laden und migrieren, aktive Module und Welt-Thema laden,
   Welt-Verbindung am Bus, Service Worker, Gerüst und Startansicht. Nur diese Datei verbindet Lernen und Welt (Kopplungsregel 4).
   Nachgeladen wird nur beim Start (und beim Anlegen des Profils, bevor die erste Runde läuft), nie mitten in einer Sitzung. Einzige Ausnahme ist der
   Baustein der eigenen Wortlisten (AP-22), wenn der Elternbereich die erste Liste anlegt: eine Datei, ohne Wirkung auf eine laufende Runde. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const S = (L.Start = L.Start || {});

  /** Welche Module das Anlegen des Profils aktiviert (V-AP12-01): die der Klasse mit Status «freigegeben». Entwürfe sind für das Kind unsichtbar
      (Modul-Schema), nur die Entwicklungsfassung aktiviert sie, damit sich Einmaleins vor der Freigabe spielen lässt. Entwicklung heisst: nicht über https.
      Die veröffentlichte Fassung läuft immer über https (iPad, 8.6), `file://` und `http://localhost` (lw start) sind Entwicklung. version.js bleibt aussen vor,
      weil lw veroeffentlichen es überschreibt und der Entwicklungsstand sonst nach der ersten Veröffentlichung verloren wäre. */
  const entwicklung = () => { const ort = ((S.fenster || g).location) || {}; return ort.protocol !== 'https:'; };
  const statusErlaubt = () => (entwicklung() ? ['freigegeben', 'entwurf'] : ['freigegeben']);
  const sicher = f => { try { return f(); } catch (e) { return undefined; } };

  /** In der Entwicklungsfassung beschränkt ?module=<id>,<id> die Wahl auf die genannten Module (zum Prüfen eines einzelnen Moduls und für die Abnahmeläufe).
      Die veröffentlichte Fassung (https) ignoriert den Parameter. */
  const nurModule = () => { const ort = ((S.fenster || g).location) || {}, m = entwicklung() && /[?&]module=([a-z0-9,_-]+)/.exec(ort.search || ''); return m ? m[1].split(',') : null; };

  /** Die Module, die zur Klasse passen und im Manifest stehen (IDs). */
  S.modulWahl = klasse => { const nur = nurModule(); return (L.katalog || []).filter(k => L.manifest && L.manifest.module[k.id] && statusErlaubt().includes(k.status) && (!k.stufen || k.stufen.includes(klasse)) && (!nur || nur.includes(k.id))).map(k => k.id); };

  /** Welt-Thema: ?welt=<id> (Entwicklung), sonst die Einstellung, sonst «fachinseln», sonst das erste Thema ausser «test». Nur was im Manifest steht, sonst keines.
      Die Fachinseln lösen den Archipel ab (E-2010-01): die alte Einstellung «archipel» (Standard jedes Lernstands) führt zu den Fachinseln, solange es sie gibt.
      Der Archipel bleibt mit ?welt=archipel erreichbar. Der Lernstand selbst ändert sich dabei nicht. */
  function waehleWelt(manifest, einstellungen, suche) {
    const ids = Object.keys((manifest && manifest.welten) || {}), param = /[?&]welt=([a-z0-9._-]+)/.exec(suche || '');
    if (param && ids.includes(param[1])) return param[1];
    const e = einstellungen && einstellungen.welt, neu = ids.includes('fachinseln') ? 'fachinseln' : null;
    if (e === 'archipel' && neu) return neu;
    return ids.includes(e) ? e : neu || ids.find(id => id !== 'test') || null;
  }

  /** Lädt die Dateien der aktiven Module und des Welt-Themas (nach dem Start des Zustands) und zieht die Modulversion nach (Migration umbenannter IDs). */
  S.ladeModule = async function ladeModule() {
    const doc = L.Zustand.hole(), manifest = L.manifest, w = S.fenster || g;
    const ids = Object.keys(manifest.module).filter(id => doc.module[id] && doc.module[id].aktiv === true);
    const weltId = waehleWelt(manifest, doc.einstellungen, w.location && w.location.search);
    const bericht = await (S.lader || L.Lader).laden(manifest, { welt: weltId, module: ids });
    S.welt = (weltId && L.registry.welten.get(weltId)) || null;
    const alt = ids.filter(id => L.registry.module.has(id) && doc.module[id].version !== L.registry.module.get(id).version);
    if (alt.length) L.Zustand.aendere(z => alt.forEach(id => L.Migration.modulMigration(z, L.registry.module.get(id))));
    return bericht;
  };

  /** Eigene Wortlisten (AP-22, V-AP22-01): zustand.listen trägt die Listen aus dem Elternbereich, der Baustein module/_gemeinsam/wortliste.js baut daraus je
      Liste ein Modul, das hier wie ein Manifest-Modul angemeldet und aktiviert wird. Der Baustein steht nicht im Manifest (kein Modul nennt ihn unter braucht)
      und wird darum nur geladen, wenn es eine Liste gibt oder der Elternbereich eine anlegt. Abgelaufene Listen (gueltig bis) fehlen in der Registry,
      ihr Fortschritt bleibt im Lernstand. */
  const LISTEN_BAUSTEIN = '_gemeinsam/wortliste', LISTEN_DATEI = 'module/_gemeinsam/wortliste.js';
  S.listenIds = new Set();

  S.ladeListen = async function ladeListen() {
    if (L.registry.bausteine.has(LISTEN_BAUSTEIN)) return true;
    try { await (S.lader || L.Lader).laden({ module: { _wortlisten: [LISTEN_DATEI] } }, { welt: null, module: ['_wortlisten'] }); } catch (fehler) { sicher(() => L.Fehlerlog.melde(fehler)); }
    return L.registry.bausteine.has(LISTEN_BAUSTEIN);
  };

  /** Meldet die Listen des Lernstands als Module an (synchron, der Baustein muss geladen sein). Gelöschte und abgelaufene Listen verlassen die Registry,
      die übrigen werden neu gebaut (nach einer Änderung im Elternbereich) und im Lernstand aktiviert. → { angemeldet, ausgeblendet, fehler } (IDs und Texte). */
  S.meldeListen = function meldeListen(opt = {}) {         // opt: { heute, zustand } (für Tests und den Elternbereich)
    const W = L.registry.bausteine.get(LISTEN_BAUSTEIN), Z = opt.zustand || L.Zustand, doc = Z.hole(), listen = Array.isArray(doc.listen) ? doc.listen : [];
    const heute = opt.heute || (L.Lernplan && L.Lernplan.heute ? L.Lernplan.heute(doc) : L.Tag.heute()), bericht = { angemeldet: [], ausgeblendet: [], fehler: [] }, ids = new Set();
    for (const liste of listen) {
      const id = liste && liste.id;
      if (typeof id !== 'string') continue;
      if (L.registry.module.has(id) && !S.listenIds.has(id)) { bericht.fehler.push(`«${id}» gehört schon einem Modul`); continue; }
      ids.add(id);
      if (W.abgelaufen(liste, heute)) { L.registry.module.delete(id); bericht.ausgeblendet.push(id); continue; }
      try { L.registry.module.set(id, W.baue(liste)); bericht.angemeldet.push(id); } catch (fehler) { bericht.fehler.push(`«${id}»: ${fehler.message}`); sicher(() => L.Fehlerlog.melde(fehler)); }
    }
    for (const id of S.listenIds) if (!ids.has(id)) L.registry.module.delete(id);
    S.listenIds = ids;
    const neu = bericht.angemeldet.filter(id => { const m = doc.module && doc.module[id]; return !m || m.aktiv !== true || m.version !== W.VERSION; });
    if (neu.length) Z.aendere(z => neu.forEach(id => { const m = Z.modul(id); m.aktiv = true; m.version = W.VERSION; }));
    return bericht;
  };

  /** Beim Start: gibt es Listen, wird der Baustein geladen und die Listen angemeldet. Ohne Listen geschieht nichts (kein zusätzlicher Ladevorgang). Wirft nie. */
  S.registriereListen = async function registriereListen() {
    try {
      const doc = L.Zustand.hole();
      if (!(Array.isArray(doc.listen) && doc.listen.length)) return { angemeldet: [], ausgeblendet: [], fehler: [] };
      if (!(await S.ladeListen())) return { angemeldet: [], ausgeblendet: [], fehler: ['Der Baustein für Wortlisten lässt sich nicht laden'] };
      return S.meldeListen();
    } catch (fehler) {
      sicher(() => L.Fehlerlog.melde(fehler));
      return { angemeldet: [], ausgeblendet: [], fehler: [String((fehler && fehler.message) || fehler)] };
    }
  };

  /** Schreibt den Ertrag, den die Welt-Verbindung `ab` sammelt, in den Tageslog (zustand.tage[heute].ertrag = { fach: n }), damit der Tagesbericht auch nach
      einem Neustart und über mehrere Runden stimmt (AP-23). Läuft nach der Welt-Verbindung am selben Bus, ihr Hörer ist dann schon durch. Gibt die Abmeldung zurück. */
  S.merkeErtrag = function merkeErtrag(bus, ab, zustand = L.Zustand) {
    let schon = {};
    return bus.on('lern:aufgabe', () => {
      const jetzt = ab.zuwachs().ertrag, neu = Object.entries(jetzt).map(([f, n]) => [f, n - (schon[f] || 0)]).filter(([, n]) => n > 0);
      schon = jetzt;
      if (!neu.length) return;
      sicher(() => zustand.aendere(z => {
        const tag = L.Lernplan.heute(z), t = ((z.tage = z.tage || {})[tag] = z.tage[tag] || {}), e = (t.ertrag = { ...t.ertrag });
        for (const [fach, n] of neu) e[fach] = (e[fach] || 0) + n;
      }));
    });
  };

  /** In derselben Berührung wie der Tipp auf «Start» aufrufen: iOS gibt Sprache und Audio nur aus einer Berührung frei (5.7). */
  S.entsperre = function entsperre() {
    const sp = L.Sprache;
    if (L.Klang && typeof L.Klang.entsperre === 'function') sicher(() => L.Klang.entsperre());   // Web Audio in derselben Berührung
    if (!sp) return false;
    const ok = sicher(() => sp.entsperre() !== false) === true;
    sicher(() => sp.entsperreAudio());
    return ok;
  };

  /** Die Bühne (docs/gestaltung-umbau.md 3.1 und 3.3): einmal beim Start in div.buehne-ebene, nur mit Welt-Thema und nur, wenn L.Buehne geladen ist.
      Die Weltschicht wird danach nie neu aufgebaut, die Hülle führt Modus, Kamera und geänderte Plätze nach. Ohne Bühne bleibt ein ruhiger Grund. */
  S.baueBuehne = function baueBuehne(ebene) {
    const inseln = !!(S.welt && S.welt.art === 'inseln'), B = inseln ? L.W3 && L.W3.Szene : L.Buehne;   // Fachinseln: 3D-Szene mit Three.js (E-2010-02)
    if (!ebene || !S.welt || !B || typeof B.baue !== 'function') return null;
    try {
      const doc = L.Zustand.hole(), wenig = !!(L.Effekte && typeof L.Effekte.wenig === 'function' && L.Effekte.wenig());
      const stand = inseln ? L.InselDaten.stand(doc) : (doc.welt && doc.welt[S.welt.id]) || (L.Welt && L.Welt.leer ? L.Welt.leer() : {});
      return L.Huelle.buehne(B.baue(ebene, S.welt, stand, { wenig, kamera: 'start', stand: inseln ? () => L.InselDaten.stand() : undefined }));
    } catch (fehler) { sicher(() => L.Fehlerlog.melde(fehler)); return null; }
  };

  /** Fachinseln: schreibt nach jedem Lern-Ereignis die Bauphasen der Areale in zustand.welt.fachinseln.bau (eine erreichte Phase bleibt, Ä19)
      und führt die Szene nach. Ohne Thema der Art «inseln» tut der Hörer nichts. Gibt die Abmeldung zurück. */
  S.merkeBau = function merkeBau(bus, zustand = L.Zustand) {
    const nach = () => {
      if (!L.InselDaten || !L.InselDaten.aktiv()) return;
      const id = S.welt.id, alt = sicher(() => ((zustand.hole().welt || {})[id] || {}).bau, null) || {}, neu = L.InselDaten.bau();
      if (JSON.stringify(neu) === JSON.stringify(alt)) return;
      sicher(() => zustand.aendere(z => { z.welt = z.welt || {}; z.welt[id] = { ...(z.welt[id] || {}), bau: neu }; }));
      const r = L.Huelle && L.Huelle.buehne();
      if (r && typeof r.aktualisiere === 'function') sicher(() => r.aktualisiere());
    };
    const ab = [bus.on('lern:aufgabe', nach), bus.on('lern:thema', nach)];
    return () => ab.forEach(f => f());
  };

  /** Im ersten Tipp irgendwo: Sprache und Klang entsperren (iOS gibt Audio nur aus einer Berührung frei, 5.7). Danach hört nichts mehr zu. */
  // Nur touchend, click und keydown zählen in Safari als Nutzeraktivierung (pointerdown mit Touch nicht). Die Hörer bleiben, bis der Ton läuft
  // (Klang.bereit) oder es keinen AudioContext gibt; jeder weitere Tipp versucht es erneut.
  S.ersterTipp = function ersterTipp(d) {
    if (!d || typeof d.addEventListener !== 'function') return;
    const arten = ['touchend', 'click', 'keydown'];
    const ohneTon = !(g.AudioContext || g.webkitAudioContext);
    const tipp = () => {
      S.entsperre();
      const fertig = ohneTon || !L.Klang || typeof L.Klang.bereit !== 'function' || sicher(() => L.Klang.bereit()) === true;
      if (fertig) arten.forEach(a => { if (d.removeEventListener) d.removeEventListener(a, tipp, true); });
    };
    arten.forEach(a => d.addEventListener(a, tipp, true));
    // Nachbesserung 2: iOS unterbricht den Ton im Hintergrund; läuft er beim Zurückkommen nicht, hört der nächste Tipp wieder zu (doppelte Hörer verwirft der Browser)
    d.addEventListener('visibilitychange', () => {
      if (ohneTon || d.visibilityState === 'hidden' || !L.Klang || typeof L.Klang.bereit !== 'function' || sicher(() => L.Klang.bereit()) === true) return;
      arten.forEach(a => d.addEventListener(a, tipp, true));
    });
  };

  /** Service Worker (8.5): nur unter https und auf localhost mit ?sw=1. Gibt { registriert, bereit(), aktiviere(), pruefe() } zurück, «bereit» heisst: eine neue Version wartet. */
  function registriereSw(w) {
    const nav = w.navigator, ort = w.location || {}, st = { registriert: false, fehler: null, bereit: () => false, aktiviere: () => false, pruefe: () => {} };
    const lokal = ['localhost', '127.0.0.1', '[::1]'].includes(ort.hostname);
    if (!nav || !nav.serviceWorker || !(ort.protocol === 'https:' || (lokal && /[?&]sw=1(?:&|$)/.test(ort.search || '')))) return st;
    let reg = null, angefordert = false;
    const neu = () => { if (typeof S.beiUpdate === 'function') sicher(S.beiUpdate); };
    st.bereit = () => !!(reg && reg.waiting && reg.active);
    st.aktiviere = () => { if (!st.bereit()) return false; angefordert = true; reg.waiting.postMessage('aktivieren'); return true; };
    st.pruefe = () => sicher(() => Promise.resolve(reg && reg.update()).catch(() => {}));
    nav.serviceWorker.addEventListener('controllerchange', () => { if (angefordert) w.location.reload(); });   // nur auf den Tipp hin, nicht bei der ersten Installation
    nav.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(r => {
      reg = r; st.registriert = true;
      const beobachte = wk => { if (wk) wk.addEventListener('statechange', () => { if (wk.state === 'installed') neu(); }); };
      beobachte(r.installing);
      r.addEventListener('updatefound', () => beobachte(r.installing));
      neu(); st.pruefe();
    }).catch(fehler => { st.fehler = String((fehler && fehler.message) || fehler); L.Fehlerlog.melde(fehler); });
    return st;
  }
  S.registriereSw = registriereSw;

  /** Eine schlichte Fehlerseite, falls beim Start etwas Unerwartetes schiefgeht (der Wächter in index.html bleibt dann still). */
  function fehlerSeite(wurzel, fehler) {
    const d = g.document, el = (tag, text) => { const e = d.createElement(tag); e.textContent = text; return e; };
    const kasten = d.createElement('div');
    kasten.setAttribute('class', 'startfehler'); kasten.setAttribute('role', 'alert');
    kasten.setAttribute('style', 'max-width:36rem;margin:3rem auto;padding:1.25rem 1.5rem;background:#FFFFFF;border:1px solid #C7CDD3;border-left:4px solid #B5483A;border-radius:8px');
    kasten.append(el('h1', 'Die Lernwelt kann nicht starten'), el('p', 'Beim Start ist ein Fehler aufgetreten. Bitte die App neu öffnen. Hilft das nicht, hilft diese Meldung bei der Suche:'), el('p', String((fehler && fehler.message) || fehler)));
    wurzel.replaceChildren(kasten);
  }

  /**
   * Der Startablauf. opt (für Tests): fenster, dokument, huelle, lader, zustand (Optionen für Zustand.starte).
   * Gibt das Promise von Lernwelt.Start zurück, sobald die Startansicht steht oder die Fehlerseite.
   */
  S.starte = async function starte(opt = {}) {
    const w = opt.fenster || g, d = opt.dokument || w.document, wurzel = opt.huelle || d.getElementById('app');
    S.fenster = w; S.lader = opt.lader || L.Lader; S.hinweise = []; S.welt = null;
    try {
      await S.lader.laden(L.manifest, { welt: null, module: [] });               // Kern, Typen, Hilfsmittel. Module und Welt hängen vom Zustand ab
      L.Fehlerlog.installiere(w); L.Fehlerlog.verbindeLader(S.lader);
      if (L.ElternListen) sicher(() => L.ElternListen.anmelden());               // der Reiter «Wortlisten» (AP-22) meldet sich erst hier an, nicht beim Laden der Datei
      for (const n of ['ElternModule', 'ElternPruefung', 'ElternSchwaechen', 'ElternGespraech']) if (L[n]) sicher(() => L[n].anmelden());   // ebenso die Reiter von AP-13b
      const check = L.Startcheck.pruefe({ g: w, lader: S.lader });                // im Browser ist w das globale Objekt, Tests geben ein Fenster vor
      S.faehigkeiten = check.faehigkeiten;
      if (!check.ok) { L.Startcheck.zeige(wurzel, check, d); L.gestartet = true; return S; }
      S.hinweise = check.hinweise.map(h => h.text);
      S.ergebnis = L.Zustand.starte(opt.zustand || {});
      if (!S.ergebnis.fehler) {
        await S.ladeModule();
        await S.registriereListen();                                             // eigene Wortlisten (AP-22), vor dem Warten auf die Stimmen
        if ((L.Lernplan.aktive(L.Zustand.hole()).some(id => L.registry.module.get(id).sprache)) && L.Sprache) await L.Sprache.bereit();   // iOS lädt die Stimmen verzögert (5.7)
        const ab = L.Welt.verbinde(L.bus);
        S.zuwachs = () => ab.zuwachs();
        if (S.ertragAb) S.ertragAb();
        S.ertragAb = S.merkeErtrag(L.bus, ab);
        if (S.bauAb) S.bauAb();
        S.bauAb = S.merkeBau(L.bus);
        S.persistenz = L.Speicher.persistenz(w.navigator, !!check.faehigkeiten.standalone);
      }
      S.sw = registriereSw(w);
      S.beiUpdate = () => { if (L.Huelle.aktuell() === 'start' && L.Zustand.hole().profil.vorname) L.Huelle.gehe('start'); };
      if (d.addEventListener) d.addEventListener('visibilitychange', () => { if (d.visibilityState === 'visible') S.sw.pruefe(); });
      const rahmen = L.Huelle.aufbauen(wurzel);
      S.baueBuehne(rahmen && rahmen.ebene);
      if (L.Klang) sicher(() => { const e = L.Zustand.hole().einstellungen; L.Klang.an(e.klang !== false); if (L.Klang.musikAn) L.Klang.musikAn(e.musik !== false); });   // ohne Feld: an
      S.ersterTipp(d);
      L.Huelle.gehe('start');
      if (entwicklung() && /[?&]inselzeit(?:[&=]|$)/.test((w.location && w.location.search) || '')) L.Huelle.gehe('inselzeit', { probe: true });   // E-2110-01: Probe ohne Buchung
      L.gestartet = true;
    } catch (fehler) {
      sicher(() => L.Fehlerlog.melde(fehler));
      fehlerSeite(wurzel, fehler);
      L.gestartet = true;
    }
    return S;
  };

  if (!L.keinAutostart && g.document && g.document.getElementById && g.document.getElementById('app')) S.starte();
})(globalThis);
