/* app/ansichten/huelle.js: das Gerüst der App (Raster aus bauteile.css: Leiste, Menü, Hauptfläche, Statusleiste) und die Navigation zwischen Ansichten.
   Eine Ansicht meldet sich ohne Aufruf an, damit die Ladereihenfolge keine Rolle spielt (F-AP12-01):
     Lernwelt.Ansichten.<id> = { id, titel, icon?, menue?, zeige(huelle, ctx) }
   `menue` (Zahl) bringt sie ins Hauptmenü, die Zahl ordnet. `zeige` zeichnet in `huelle` (die Hauptfläche) und darf ein Promise zurückgeben.
   ctx = { id, daten, gehe(id, daten), sperre(an), aktualisiere() }. Während einer Runde sperrt die Ansicht «Lernen» das Menü (sperre). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const z = { wurzel: null, aktuell: null, schliesse: null, gesperrt: false, titel: null, menue: null, ansicht: null, status: null, leiste: null };
  const H = (...a) => L.ui.h(...a);
  const ico = name => H(`span.ico.ico-${name}`, { 'aria-hidden': 'true' });
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* ohne Protokoll bleibt nur die Anzeige */ } };

  const ansicht = id => { const a = L.Ansichten[id]; return a && typeof a.zeige === 'function' ? a : null; };
  const menueEintraege = () => Object.entries(L.Ansichten).filter(([, a]) => a && typeof a.menue === 'number' && typeof a.zeige === 'function')
    .sort((a, b) => a[1].menue - b[1].menue).map(([id, a]) => ({ id, titel: a.titel || id, icon: a.icon || 'ueben' }));

  function zeichneMenue() {
    z.menue.replaceChildren(...menueEintraege().map(e => H('button', {
      type: 'button', 'data-ansicht': e.id, 'aria-current': e.id === z.aktuell ? 'page' : null, 'aria-disabled': z.gesperrt && e.id !== z.aktuell ? 'true' : null,
      onclick: () => gehe(e.id) }, ico(e.icon), H('span.txt', e.titel))));
  }

  /** Statusleiste: Stand des Tagesauftrags links, Speicherstatus in der Mitte (dauerhaft, solange etwas nicht gespeichert wird), Testprofil rechts. */
  function zeichneStatus() {
    const T = L.Texte.lernen, s = L.Zustand.status();
    let heute = '';
    try {
      const t = L.Lernplan.tagesauftrag(), gesamt = t.gemacht.aufgaben + t.aufgaben;
      heute = t.keinModul ? '' : H('div.heute', t.erledigt ? T.statusErledigt : T.statusOffen(t.aufgaben), H('span.spur', H('i', { style: `width:${gesamt ? Math.round(100 * t.gemacht.aufgaben / gesamt) : 100}%` })));
    } catch (fehler) { melde(fehler); }
    z.status.replaceChildren(heute, H('div.meldung', { role: 'status' }, s.ok ? '' : s.text), s.profil ? H('span.modus', L.Texte.start.testprofil(s.profil)) : '');
    z.leiste.classList.toggle('testprofil', !!s.profil);
  }

  /** Schliesst die Ansicht, die beim Zeigen ein { schliesse } zurückgab (Elternbereich: Sprachausgabe stoppen). Mehrfaches Schliessen ist harmlos. */
  function schliesseAlte() {
    const f = z.schliesse; z.schliesse = null;
    if (typeof f === 'function') { try { f(); } catch (e) { melde(e); } }
  }

  /** Zeigt die Ansicht `id` in der Hauptfläche. Gibt falsch zurück, wenn es sie nicht gibt oder das Menü gerade gesperrt ist. */
  function gehe(id, daten) {
    const a = ansicht(id);
    if (!a || (z.gesperrt && id !== z.aktuell)) return false;
    schliesseAlte();                                      // vor dem Zeichnen: die alte Ansicht räumt in dieselbe Hauptfläche
    z.aktuell = id;
    z.ansicht.replaceChildren();
    z.ansicht.scrollTop = 0;
    const fehler = f => { melde(f); z.ansicht.replaceChildren(H('div.kasten.fehler', H('b', 'Diese Ansicht lässt sich nicht öffnen.'), 'Bitte zum Start zurückkehren und es noch einmal versuchen.')); };
    const ctx = { id, daten: daten || {}, gehe, aktualisiere, sperre: an => { z.gesperrt = !!an; zeichneMenue(); } };
    try {
      const r = a.zeige(z.ansicht, ctx);
      if (r && typeof r.schliesse === 'function') z.schliesse = r.schliesse;            // der Elternbereich stoppt so die Sprachausgabe, auch wenn das Menü ihn verlässt
      Promise.resolve(r).catch(fehler);
    } catch (f) { fehler(f); }
    z.titel.textContent = a.titel || id;
    zeichneMenue(); zeichneStatus();
    return true;
  }
  const aktualisiere = () => { if (z.wurzel) { zeichneMenue(); zeichneStatus(); } };

  /** Baut das Gerüst in `wurzel` (das Element #app). Mehrfaches Aufrufen ersetzt das Gerüst. */
  function aufbauen(wurzel) {
    z.titel = H('small', '');
    z.menue = H('nav.menue', { 'aria-label': 'Hauptmenü' });
    z.ansicht = H('section.ansicht', { tabindex: '-1' });
    z.status = H('footer.status');
    z.leiste = H('header.leiste', H('div.marke', ico('wuerfel'), H('span', 'Lernwelt', z.titel)));
    z.wurzel = wurzel; z.aktuell = null; z.gesperrt = false;
    wurzel.replaceChildren(H('div.app.ohne-info', z.leiste, z.menue, H('main.haupt', z.ansicht), z.status));
    if (z.abmelden) z.abmelden();
    z.abmelden = L.Zustand.beiStatus(aktualisiere);
    return { ansicht: z.ansicht };
  }

  L.Huelle = { aufbauen, gehe, aktualisiere, ansicht, menueEintraege, aktuell: () => z.aktuell, gesperrt: () => z.gesperrt };
})(globalThis);
