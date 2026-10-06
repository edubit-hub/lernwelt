/* app/start.js: Startablauf und Verdrahtung der Schichten (Architektur 2.2, 8.5, 8.8, F-AP03-01). index.html bindet diese Datei als letzte ein, der Lader
   fügt danach alle anderen Dateien ein. Ablauf: Kern laden, Fehlerprotokoll, Startcheck, Zustand laden und migrieren, aktive Module und Welt-Thema laden,
   Welt-Verbindung am Bus, Service Worker, Gerüst und Startansicht. Nur diese Datei verbindet Lernen und Welt (Kopplungsregel 4).
   Nachgeladen wird nur beim Start (und beim Anlegen des Profils, bevor die erste Runde läuft), nie mitten in einer Sitzung. */
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

  /** Die Module, die zur Klasse passen und im Manifest stehen (IDs). */
  S.modulWahl = klasse => (L.katalog || []).filter(k => L.manifest && L.manifest.module[k.id] && statusErlaubt().includes(k.status) && (!k.stufen || k.stufen.includes(klasse))).map(k => k.id);

  /** Welt-Thema: ?welt=<id> (Entwicklung), sonst die Einstellung, sonst das erste Thema ausser «test». Nur was im Manifest steht, sonst keines. */
  function waehleWelt(manifest, einstellungen, suche) {
    const ids = Object.keys((manifest && manifest.welten) || {}), param = /[?&]welt=([a-z0-9._-]+)/.exec(suche || '');
    if (param && ids.includes(param[1])) return param[1];
    return ids.includes(einstellungen && einstellungen.welt) ? einstellungen.welt : ids.find(id => id !== 'test') || null;
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

  /** In derselben Berührung wie der Tipp auf «Start» aufrufen: iOS gibt Sprache und Audio nur aus einer Berührung frei (5.7). */
  S.entsperre = function entsperre() {
    const sp = L.Sprache;
    if (!sp) return false;
    const ok = sicher(() => sp.entsperre() !== false) === true;
    sicher(() => sp.entsperreAudio());
    return ok;
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
      const check = L.Startcheck.pruefe({ g: w, lader: S.lader });                // im Browser ist w das globale Objekt, Tests geben ein Fenster vor
      S.faehigkeiten = check.faehigkeiten;
      if (!check.ok) { L.Startcheck.zeige(wurzel, check, d); L.gestartet = true; return S; }
      S.hinweise = check.hinweise.map(h => h.text);
      S.ergebnis = L.Zustand.starte(opt.zustand || {});
      if (!S.ergebnis.fehler) {
        await S.ladeModule();
        if ((L.Lernplan.aktive(L.Zustand.hole()).some(id => L.registry.module.get(id).sprache)) && L.Sprache) await L.Sprache.bereit();   // iOS lädt die Stimmen verzögert (5.7)
        const ab = L.Welt.verbinde(L.bus);
        S.zuwachs = () => ab.zuwachs();
        S.persistenz = L.Speicher.persistenz(w.navigator, !!check.faehigkeiten.standalone);
      }
      S.sw = registriereSw(w);
      S.beiUpdate = () => { if (L.Huelle.aktuell() === 'start' && L.Zustand.hole().profil.vorname) L.Huelle.gehe('start'); };
      if (d.addEventListener) d.addEventListener('visibilitychange', () => { if (d.visibilityState === 'visible') S.sw.pruefe(); });
      L.Huelle.aufbauen(wurzel);
      L.Huelle.gehe('start');
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
