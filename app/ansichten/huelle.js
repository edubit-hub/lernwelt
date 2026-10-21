/* app/ansichten/huelle.js: der Rahmen der App und die Navigation zwischen Ansichten (docs/gestaltung-umbau.md 2.1 und 3.1, Architektur 7.1 und 7.8).
   Die Insel füllt als Bühne den ganzen Bildschirm, darüber liegen das Spiel-HUD (huelle-hud.js), die Hauptfläche und das schwebende Dock (huelle-dock.js).
     div.app > div.buehne-ebene, header.hud, main.haupt > section.ansicht, nav.dock, div.flug-ebene, div.status-meldung[role=status]
   Eine Ansicht meldet sich ohne Aufruf an, damit die Ladereihenfolge keine Rolle spielt (F-AP12-01):
     Lernwelt.Ansichten.<id> = { id, titel, icon?, dock?: Rang im Dock, haupt?: true, buehne?: { kamera, schleier, ruhig, marken, hud, dock }, zeige(huelle, ctx) }
   ctx = { id, daten, gehe, sperre, aktualisiere, buehne, hud: { aktualisiere, pille, plakette }, tafel(opt), modus(m), effekte, klang, musikRuht() }.
   Fehlen Effekte oder Klang (F2), liefert ctx stille Attrappen; fehlt die Bühne (F3, kein Thema), bleibt ein ruhiger Grund. Während einer Runde sperrt «Lernen»
   die Navigation (sperre), das schaltet den Modus «aufgabe»: Schleier stark, Bühne ruhig, HUD knapp, Dock aus, keine Klangschleife, keine Musik.
   Musik läuft nur im Modus «welt»; ctx.musikRuht() hält sie bis zum nächsten Ansichtswechsel an (Runde mit Abschluss und Logbuch-Stempel). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const z = { wurzel: null, app: null, ebene: null, ansicht: null, status: null, flug: null, hud: null, dock: null, aktuell: null, schliesse: null, gesperrt: false,
    regler: null, modus: 'welt', b: null, kamera: null, standKey: null, musikRuht: false };
  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.huelle;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* ohne Protokoll bleibt nur die Anzeige */ } };
  const STILL = () => Promise.resolve();
  const EFFEKTE_STILL = { wenig: () => false, setzeEbene() {}, flug: STILL, zaehle: STILL, plakette: STILL, stoss() {}, wackle() {}, leuchte() {}, puls() {}, haken: STILL, siegel: STILL, splitter: STILL, druecke() {} };
  const KLANG_STILL = { spiele() {}, schleife() {}, musik() {}, musikAn: w => (w === undefined ? true : !!w), an: w => (w === undefined ? true : !!w), entsperre() {}, bereit: () => false };
  const effekte = () => L.Effekte || EFFEKTE_STILL, klang = () => L.Klang || KLANG_STILL;

  /** Bühne je Ansicht, solange die Ansichten sie noch nicht selbst nennen (Phase 1). Die Angabe der Ansicht geht vor. */
  const STANDARD = { start: { kamera: 'start' }, lernen: { kamera: 'start', schleier: 'leicht' }, siedlung: { kamera: 'siedlung', marken: 'plaetze' },
    forschung: { kamera: 'forschung', schleier: 'leicht' }, auftraege: { kamera: 'hafen' }, logbuch: { kamera: 'logbuch', schleier: 'leicht' } };
  // a.buehne darf eine Funktion der Daten sein (Fachinseln: die Kamera fährt zum gewählten Areal)
  const buehneVon = (id, a, daten) => ({ kamera: 'start', schleier: 'keine', marken: 'orte', hud: 'voll', dock: true, ...(STANDARD[id] || {}),
    ...((a && (typeof a.buehne === 'function' ? sicher(() => a.buehne(daten || {}), null) : a.buehne)) || {}) });
  /** Art des Welt-Themas: «inseln» (Fachinseln) oder «archipel» (das bisherige Thema und jedes ohne Art). Eine Ansicht mit welt gehört nur zu dieser Art. */
  const weltArt = () => sicher(() => (L.Start && L.Start.welt && L.Start.welt.art) || 'archipel', 'archipel');
  const passt = a => !a.welt || a.welt === weltArt();
  const modusVon = (id, a) => (id === 'eltern' || (a && a.modus === 'eltern') ? 'eltern' : 'welt');

  const ansicht = id => { const a = L.Ansichten[id]; return a && typeof a.zeige === 'function' ? a : null; };
  const rang = a => (typeof a.dock === 'number' ? a.dock : null);
  const dockEintraege = () => Object.entries(L.Ansichten).filter(([, a]) => a && typeof a.zeige === 'function' && rang(a) !== null && passt(a))
    .sort((x, y) => rang(x[1]) - rang(y[1])).map(([id, a]) => ({ id, titel: a.titel || id, icon: a.icon || 'ueben', haupt: a.haupt === true || id === 'lernen' }));

  const klangAn = () => (sicher(() => L.Zustand.hole().einstellungen, null) || {}).klang !== false;
  function schalteKlang() {
    const neu = !klangAn();
    sicher(() => L.Zustand.aendere(d => { d.einstellungen = d.einstellungen || {}; d.einstellungen.klang = neu; }));
    sicher(() => klang().an(neu));
    if (neu) { sicher(() => klang().schleife(z.modus === 'welt' ? 'meer' : null)); sicher(() => klang().spiele('taste')); }
    zeichneHud();
  }

  /** Freier Bereich der Bühne: ohne HUD, Dock und Tafel (Pixel ab dem Rand). Ohne Layout (Node) null. */
  function frei() {
    if (!z.app || typeof z.app.getBoundingClientRect !== 'function') return null;
    const hoehe = g.innerHeight || 0, hud = z.hud.el.getBoundingClientRect(), dock = z.dock.el.getBoundingClientRect(), t = (L.Tafel && L.Tafel.flaeche()) || {};
    const dockAn = z.app.getAttribute('data-dock') === 'an', hudAn = z.app.getAttribute('data-hud') !== 'aus';
    return { links: 0, oben: hudAn ? Math.round(hud.bottom) : 0, rechts: t.rechts || 0, unten: Math.max(dockAn ? Math.round(hoehe - dock.top) : 0, t.unten || 0) };
  }
  function fahreKamera(name, opt = {}) {
    z.kamera = name;
    if (!z.regler || !name || typeof z.regler.kamera !== 'function') return Promise.resolve();
    try { return Promise.resolve(z.regler.kamera(name, { frei: frei(), ...opt })).catch(() => {}); } catch (e) { melde(e); return Promise.resolve(); }
  }

  /** Modus: welt (Bühne lebt, Klangschleife Meer), aufgabe (still unter starkem Schleier, HUD knapp, Dock aus), eltern (ruhiger Grund, ohne HUD und Dock). */
  function setzeModus(m) {
    const b = z.b || buehneVon(null, null), vorher = z.modus;
    z.modus = m;
    // Während einer Runde zeigt die Kamera die Insel ruhig neben der Karte (Ziel «aufgabe», das Lager), danach wieder den Ort der Ansicht
    if (m !== vorher && (m === 'aufgabe' || vorher === 'aufgabe') && z.regler) fahreKamera(m === 'aufgabe' ? 'aufgabe' : b.kamera);
    if (!z.app) return;
    z.app.setAttribute('data-modus', m);
    z.app.setAttribute('data-hud', m === 'aufgabe' ? 'knapp' : m === 'eltern' ? 'aus' : b.hud || 'voll');
    z.app.setAttribute('data-dock', m === 'welt' && b.dock !== false ? 'an' : 'aus');
    if (z.regler && typeof z.regler.modus === 'function') sicher(() => z.regler.modus({ schleier: m === 'welt' ? b.schleier : 'stark', ruhig: m !== 'welt' || !!b.ruhig, marken: m === 'welt' ? b.marken : 'keine' }));
    sicher(() => klang().schleife(m === 'welt' ? 'meer' : null));
    stimmeMusik();
  }
  /** Musik nur in der Welt; ruht sie (Abschluss einer Runde), gilt das wie eine Aufgabe. */
  function stimmeMusik() { sicher(() => klang().musik(z.musikRuht ? 'aufgabe' : z.modus)); }

  function zeichneDock() { if (z.dock) z.dock.zeichne({ eintraege: dockEintraege(), aktuell: z.aktuell, gesperrt: z.gesperrt }); }
  function zeichneHud() {
    if (!z.hud) return;
    const s = sicher(() => L.Zustand.status(), {}) || {}, k = sicher(() => (L.WeltDaten ? L.WeltDaten.kontext() : null), null);
    z.hud.zeichne(k);
    z.hud.testprofil(s.profil || null);
    z.status.textContent = s.ok === false ? s.text || '' : '';
    const key = k ? JSON.stringify([k.stand.gebaut, k.stand.platz, k.stand.erforscht]) : null;
    if (k && z.regler && key !== z.standKey && typeof z.regler.aktualisiere === 'function') sicher(() => z.regler.aktualisiere(k.stand));
    z.standKey = key;
  }
  const aktualisiere = () => { if (z.wurzel) { zeichneDock(); zeichneHud(); } };

  /** Schliesst die Ansicht, die beim Zeigen ein { schliesse } zurückgab (Elternbereich: Sprachausgabe stoppen). Mehrfaches Schliessen ist harmlos. */
  function schliesseAlte() {
    const f = z.schliesse; z.schliesse = null;
    z.wechselt = true;                                    // eine Tafel, die dabei zugeht, fährt die alte Kamera nicht noch einmal an
    if (typeof f === 'function') { try { f(); } catch (e) { melde(e); } }
    z.wechselt = false;
  }

  function baueCtx(id, daten) {
    const pille = r => (z.hud ? z.hud.pille(r) : null);
    return {
      id, daten: daten || {}, gehe, aktualisiere,
      sperre: an => { z.gesperrt = !!an; setzeModus(an ? 'aufgabe' : modusVon(id, ansicht(id))); zeichneDock(); },
      buehne: z.regler,
      hud: { aktualisiere: zeichneHud, pille, ziel: daten => { if (z.hud) z.hud.ziel(daten); if (z.app) z.app.classList.toggle('mit-ziel', !!daten); }, plakette: (r, text, opt) => { const p = pille(r); return p ? Promise.resolve(sicher(() => effekte().plakette(p, text, opt || {}))).catch(() => {}) : Promise.resolve(); } },
      tafel: opt => L.Tafel.oeffne(z.app, { schliessenText: T().schliessen, ...(opt || {}) }),
      modus: setzeModus, effekte: effekte(), klang: klang(),
      musikRuht: () => { z.musikRuht = true; stimmeMusik(); }
    };
  }

  /** Zeigt die Ansicht `id`. Erst fährt die Kamera an ihren Ort, dann steht der Inhalt da. Falsch, wenn es sie nicht gibt oder die Navigation gesperrt ist. */
  function gehe(id, daten) {
    const a = ansicht(id);
    if (!a || !z.app || (z.gesperrt && id !== z.aktuell)) return false;
    schliesseAlte();                                      // vor dem Zeichnen: die alte Ansicht räumt in dieselbe Hauptfläche
    const vorher = z.aktuell, reihe = dockEintraege().map(e => e.id);
    z.musikRuht = false;                                  // eine neue Ansicht hebt die Ruhe der Musik auf
    z.aktuell = id; z.b = buehneVon(id, a, daten);
    z.ansicht.replaceChildren();
    z.ansicht.setAttribute('class', 'ansicht');
    z.ansicht.setAttribute('data-ansicht', id);
    z.ansicht.scrollTop = 0;
    setzeModus(modusVon(id, a));
    const fehler = f => { melde(f); z.ansicht.replaceChildren(H('div.kasten.fehler', H('b', 'Diese Ansicht lässt sich nicht öffnen.'), 'Bitte zum Start zurückkehren und es noch einmal versuchen.')); };
    const ctx = baueCtx(id, daten);
    const zeichne = () => {
      try {
        const r = a.zeige(z.ansicht, ctx);
        if (r && typeof r.schliesse === 'function') z.schliesse = r.schliesse;          // der Elternbereich stoppt so die Sprachausgabe, auch wenn das Dock ihn verlässt
        Promise.resolve(r).catch(fehler);
      } catch (f) { fehler(f); }
    };
    if (L.Uebergang) L.Uebergang.fahre({ kamera: () => fahreKamera(z.b.kamera), zeichne }); else { fahreKamera(z.b.kamera); zeichne(); }
    if (vorher && vorher !== id && modusVon(id, a) !== 'eltern') {                 // der Elternbereich ist ruhig: kein Schieben, kein Wechselklang (2.13)
      if (L.Uebergang) L.Uebergang.wechsel(z.ansicht, { von: reihe.indexOf(id) < reihe.indexOf(vorher) ? 'links' : 'rechts' });
      sicher(() => klang().spiele('wechsel'));
    }
    zeichneDock(); zeichneHud();
    return true;
  }

  /** Baut den Rahmen in `wurzel` (das Element #app). Mehrfaches Aufrufen ersetzt ihn. → { ansicht, ebene } (ebene: div.buehne-ebene für Buehne.baue) */
  function aufbauen(wurzel) {
    if (z.regler && typeof z.regler.zerstoere === 'function') sicher(() => z.regler.zerstoere());
    z.regler = null; z.standKey = null; z.kamera = null; z.b = null;
    z.ebene = H('div.buehne-ebene.leer');                // ohne aria-hidden: die Bühne trägt antippbare Ortsschilder und Plätze
    z.hud = L.HuelleHud.baue({ gehe, ansicht, klangAn, schalteKlang });
    z.dock = L.HuelleDock.baue({ gehe });
    z.ansicht = H('section.ansicht', { tabindex: '-1' });
    z.flug = H('div.flug-ebene', { 'aria-hidden': 'true' });
    z.status = H('div.status-meldung', { role: 'status' });
    z.app = H('div.app', z.ebene, z.hud.el, H('main.haupt', z.ansicht), z.dock.el, z.flug, z.status);
    z.wurzel = wurzel; z.aktuell = null; z.gesperrt = false;
    wurzel.replaceChildren(z.app);
    setzeModus('welt');
    sicher(() => effekte().setzeEbene(z.flug));
    if (L.Tafel) L.Tafel.melder(() => { if (z.app) z.app.classList.toggle('mit-tafel', L.Tafel.offen() > 0); if (z.regler && z.kamera && !z.wechselt) fahreKamera(z.kamera); });
    if (z.abmelden) z.abmelden();
    z.abmelden = L.Zustand.beiStatus(aktualisiere);
    if (z.zaehlt) z.zaehlt();
    z.zaehlt = L.bus && typeof L.bus.on === 'function' ? L.bus.on('lern:aufgabe', () => { if (z.dock) z.dock.heute(); if (z.hud) zeichneHud(); }) : null;   // der Tagesstand zählt während der Runde mit
    aktualisiere();
    return { ansicht: z.ansicht, ebene: z.ebene };
  }

  /** Ohne Wert: der Regler der Bühne oder null. Mit Wert (start.js): den Regler einsetzen, Modus und Kamera gelten sofort. */
  function buehne(regler) {
    if (regler === undefined) return z.regler;
    if (z.regler && z.regler !== regler && typeof z.regler.zerstoere === 'function') sicher(() => z.regler.zerstoere());
    z.regler = regler || null; z.standKey = null;
    if (z.ebene) z.ebene.classList.toggle('leer', !z.regler);
    setzeModus(z.gesperrt ? 'aufgabe' : z.modus);
    if (z.b) fahreKamera(z.b.kamera, { sofort: true });
    return z.regler;
  }

  L.Huelle = { aufbauen, gehe, aktualisiere, ansicht, dockEintraege, aktuell: () => z.aktuell, gesperrt: () => z.gesperrt, buehne, modus: () => z.modus };
})(globalThis);
