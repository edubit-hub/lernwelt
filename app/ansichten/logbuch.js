/* app/ansichten/logbuch.js: die Ansicht «Logbuch» als aufgeschlagenes Buch über der ruhigen Insel (docs/gestaltung-umbau.md 2.12, Architektur 7.8,
   Vorbild docs/mockup/richtung-a/a-logbuch.js und richtung-b/szene-logbuch.js, AP-16). Das Kind sieht, wie es sich entwickelt, und zwar nur gegen sich selbst.
   Quer liegt eine Tafel «buch» mit zwei Seiten: links die Wochenwerte als Minidiagramme (Aufgaben, Treffer im ersten Versuch, Übungszeit, neue Aufgaben, die
   sieben Tage davor leise dahinter) und die Bestwerte, rechts der Wissensstand je Bereich und die Sammlung als Vitrine mit Plaketten. Hoch ist es eine Seite
   als Blatt von unten, die Reiter oben (Woche, Wissen, Sammlung) springen zu ihrem Teil. Keine Rangliste, keine Serie. Die Ansicht liest nur. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, TL = () => L.Texte.logbuchseite, D = () => L.WeltDaten, LD = () => L.LogbuchDaten, G = () => L.LogbuchGrafik, K = () => L.LogbuchKacheln;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const REITER = ['woche', 'wissen', 'sammlung'];

  /** Die vier Kacheln der Woche. w: LogbuchDaten.wochen. Gibt die Kacheln (stat) in der Reihenfolge der Ansicht zurück. */
  function wochenKacheln(w) {
    const t = T(), k = K(), gr = G(), davor = x => t.davor(x), spanne = f => Math.max(...w.vorTage.map(f));
    const serie = (f, einheit) => w.tage.map(r => ({ kurz: r.kurz, wert: f(r), txt: k.ablesung(r, f(r), einheit) }));
    const vor = f => w.vorTage.map(f);
    const reihe = (id, titel, gross, klein, vergleich, svg, daten) => k.stat({ id, titel, gross, klein, vergleich, svg, texte: daten.map(x => x.txt) });
    const aufgaben = serie(r => r.aufgaben, t.einheitAufgaben), treffer = serie(r => r.treffer, '%'), zeit = serie(r => r.zeit, t.einheitMinuten), neu = serie(r => r.neu, t.einheitNeu);
    const tr = w.jetzt.treffer, tv = w.davor.treffer;
    return [reihe('aufgaben', t.kAufgaben, String(w.jetzt.aufgaben), '', davor(String(w.davor.aufgaben)), gr.saeulen(t.kAufgaben, aufgaben, Math.max(10, spanne(r => r.aufgaben)), vor(r => r.aufgaben)), aufgaben),
      reihe('treffer', t.kTreffer, tr === null ? '–' : String(tr), tr === null ? '' : '%', tv === null ? t.davorKein : davor(`${tv} %`), gr.linie(t.kTreffer, treffer, vor(r => r.treffer)), treffer),
      reihe('zeit', t.kZeit, String(w.jetzt.zeit), t.einheitMinuten, davor(`${w.davor.zeit} ${t.einheitMinuten}`), gr.saeulen(t.kZeit, zeit, Math.max(10, spanne(r => r.zeit)), vor(r => r.zeit)), zeit),
      reihe('neu', t.kNeu, String(w.jetzt.neu), '', davor(String(w.davor.neu)), gr.saeulen(t.kNeu, neu, Math.max(5, spanne(r => r.neu)), vor(r => r.neu)), neu)];
  }

  /** Die Reiter für das Hochformat: ein Tipp springt zum Teil, beim Blättern folgt der aktive Reiter. Quer sind sie ausgeblendet (logbuch.css). */
  function reiter(blatt, teile) {
    const tl = TL(), knoepfe = new Map();
    const setze = id => knoepfe.forEach((b, k) => { b.setAttribute('aria-selected', String(k === id)); b.classList.toggle('an', k === id); });
    const springe = id => {
      setze(id);
      const ziel = teile[id];
      if (ziel && typeof blatt.scrollTo === 'function') blatt.scrollTo({ top: Math.max(0, ziel.offsetTop - 6), behavior: sicher(() => L.Effekte.wenig(), false) ? 'auto' : 'smooth' });
    };
    const nav = H('nav.buch-reiter', { role: 'tablist', 'aria-label': tl.reiterName }, REITER.map(id => {
      const b = H('button.reiter', { type: 'button', role: 'tab', 'data-reiter': id, 'aria-selected': 'false', onclick: () => springe(id) }, tl.reiter[id]);
      knoepfe.set(id, b);
      return b;
    }));
    blatt.addEventListener('scroll', () => {
      let jetzt = REITER[0];
      for (const id of REITER) if (teile[id] && teile[id].offsetTop - 40 <= blatt.scrollTop) jetzt = id;
      if (blatt.scrollTop > 0 && blatt.scrollTop + blatt.clientHeight >= blatt.scrollHeight - 4) jetzt = REITER[REITER.length - 1];   // ganz unten: der letzte Teil
      setze(jetzt);
    });
    setze(REITER[0]);
    return nav;
  }

  function zeige(huelle, ctx) {
    const doc = L.Zustand.hole(), k = D().kontext(doc), heute = D().heute(), t = T(), tl = TL(), ld = LD();
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { info: false, zeit: true });
    if (k) { rahmen.leiste(k); rahmen.ziel(k); }
    const w = ld.wochen(doc, heute), wk = wochenKacheln(w), gruppen = ld.wissen(doc), best = ld.bestwerte(doc, heute), plaketten = ld.plaketten(doc);
    const fund = k ? ld.fundstuecke(k.thema, k.ledger) : [], kk = K();
    const links = H('section.buch-seite.links', { 'data-seite': 'woche' }, H('div.titel', H('h3', tl.woche)), H('p.klein.buch-unter', tl.wocheUnter),
      w.hatTage ? '' : H('p.klein.leer-hinweis', t.nochKeineTage), H('div.log-raster', wk.map(x => x.el)), kk.best(best, heute));
    const teilWissen = kk.wissen(gruppen), teilSammlung = kk.sammlung(plaketten, fund);
    const blatt = H('div.buch-blatt', links, H('section.buch-seite.rechts', teilWissen, teilSammlung));
    const buch = H('div.logbuch.buch', reiter(blatt, { woche: links, wissen: teilWissen, sammlung: teilSammlung }), blatt);
    const tafel = typeof ctx.tafel === 'function' ? sicher(() => ctx.tafel({ art: 'buch', klasse: 'logbuch-tafel', kicker: tl.kicker, titel: tl.titel, schliessenText: tl.schliessen,
      schliessen: () => ctx.gehe('start') }), null) : null;
    if (tafel) { tafel.rumpf.append(buch); if (rahmen.seite.parentNode === huelle) huelle.replaceChildren(); }   // die Ansicht bleibt leer, das Buch liegt über der Insel
    else rahmen.seite.append(H('div.kopf', H('h2', t.menue.logbuch), H('span', t.logbuchUnterzeile)), buch);
    return {
      daten: { wochen: w, wissen: gruppen, bestwerte: best, plaketten, fundstuecke: fund },
      /** Zeigt den Wert des Tages i (0 bis 6, 6 ist heute) in der Ablesung der Kachel. id: aufgaben, treffer, zeit oder neu. */
      lies(id, i) { const x = wk.find(y => y.el.getAttribute('data-kachel') === id); if (x) x.lies(i); },
      schliesse() { if (tafel) tafel.schliesse(); rahmen.schliesse(); }
    };
  }

  L.Ansichten.logbuch = { id: 'logbuch', get titel() { return L.Texte.welt.menue.logbuch; }, icon: 'logbuch', dock: 60,
    buehne: { kamera: 'logbuch', schleier: 'leicht', marken: 'keine' }, zeige };
})(globalThis);
