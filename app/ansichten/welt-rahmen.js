/* app/ansichten/welt-rahmen.js: der Rahmen der Welt-Ansichten im Gerüst der Hülle (Architektur 7.1 und 7.8, AP-16, Raster aus bauteile.css).
   Die Hülle zeichnet nur Marke, Menü, Hauptfläche und Statusleiste. Eine Welt-Ansicht ergänzt für die Dauer ihrer Anzeige
     die Ressourcenleiste und den Epochenstand in header.leiste (Vorrat, Zuwachs der Sitzung, Tor, Knopf «Üben»),
     das Informationsfeld aside.info im Raster (die Klasse ohne-info fällt weg),
     und rechts in der Statusleiste das «Nächste Ziel».
   schliesse() räumt alles wieder ab und bucht die Zeit in der Welt (tage[heute].weltMin, höchstens fünf Minuten je Besuch, Schutzregel 7).
   Steht die Ansicht nicht in einem Gerüst (zum Beispiel im Elternbereich), bleibt alles in der Ansicht: Leiste oben, Informationsfeld daneben. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten, B = () => L.WeltBausteine;
  const hatKlasse = (n, k) => !!n && typeof n.getAttribute === 'function' && (n.getAttribute('class') || '').split(/\s+/).includes(k);
  const kindMit = (el, k) => (el && el.children ? Array.from(el.children).find(c => hatKlasse(c, k)) : null) || null;
  const jetzt = () => (L.Dienste && typeof L.Dienste.jetzt === 'function' ? L.Dienste.jetzt() : Date.now());
  const MELDEZEIT = 6500, MAX_MINUTEN = 5;

  /** Ressourcenleiste, Epoche und «Üben» in den Behälter `leiste` zeichnen. */
  function zeichneLeiste(leiste, ctx, k) {
    const t = T(), res = D().ressourcen(k, D().zuwachs()), e = D().epocheStand(k);
    const eintrag = x => H(`li.res${x.zahl === 0 ? '.null' : ''}`, { title: x.name }, B().symbol(x.symbol, 26, 'res-symbol'),
      H('span.res-text', H('span.res-name', x.name), H('span.res-zahl', String(x.zahl), x.plus ? H('span.res-plus', { title: t.zuwachs }, `+${x.plus}`) : '')));
    const gueter = res.gueter.map(eintrag), anteil = e && e.tor ? Math.round(100 * Math.min(1, e.tor.hat / Math.max(1, e.tor.braucht))) : 0;
    const epoche = e ? H('div.epoche', { 'aria-label': t.epocheName(e.nr, e.name) }, H('span.e', t.epoche(e.nr)), H('span.n', e.name),
      e.tor ? H('span.tor', { title: e.tor.name }, H('span', t.tor), H('span.spur', H('i', { style: `width:${anteil}%` })), H('span', t.torStand(Math.min(e.tor.hat, e.tor.braucht), e.tor.braucht))) : '') : '';
    leiste.replaceChildren(H('ul.ressourcen', { 'aria-label': t.vorratName }, res.roh.map(eintrag), gueter.length ? H('li.trenner', { 'aria-hidden': 'true' }) : '', gueter), epoche,
      H('button.knopf.primaer.ueben', { type: 'button', 'aria-label': t.uebenBeschriftung, onclick: () => ctx.gehe('lernen') }, B().ico('ueben'), t.ueben));
  }

  /**
   * Öffnet den Rahmen in `huelle` (die Hauptfläche) und gibt die Griffe zurück.
   * opt: { voll (Ansicht ohne Rand und ohne eigenes Scrollen), info (Informationsfeld), zeit (Zeit in der Welt zählen) }
   * → { seite, info, leiste(k), ziel(k), meldung(text), aktualisiere(), schliesse() }. seite ist der Inhalt der Ansicht.
   */
  function oeffne(huelle, ctx, opt = {}) {
    const wurzel = huelle.parentNode && huelle.parentNode.parentNode, geruest = hatKlasse(wurzel, 'app') ? wurzel : null;
    const kopfLeiste = geruest ? kindMit(geruest, 'leiste') : null, status = geruest ? kindMit(geruest, 'status') : null;
    const seite = H(`div.welt-seite${opt.voll ? '.voll' : ''}`), leiste = H(`div.welt-leiste${kopfLeiste ? '' : '.eigen'}`), meldungEl = H('div.welt-meldung', { role: 'status' });
    const info = opt.info ? H('aside.info', { 'aria-live': 'polite', 'aria-label': T().infoFeld }) : null;
    let tot = false, timer = null, zielEl = null, zielDaten = null, abmelden = null;
    const t0 = jetzt();
    if (opt.voll) huelle.classList.add('welt-ansicht');
    huelle.replaceChildren(seite);
    if (kopfLeiste) kopfLeiste.append(leiste); else seite.append(leiste);
    if (info && geruest) { geruest.classList.remove('ohne-info'); if (status && typeof geruest.insertBefore === 'function') geruest.insertBefore(info, status); else geruest.append(info); }
    seite.append(meldungEl);
    if (info && !geruest) { seite.classList.add('eingebettet'); seite.append(info); }

    const zeichneZiel = () => {                                 // die Hülle zeichnet die Statusleiste bei jeder Änderung neu: das Ziel wird danach wieder angehängt
      if (zielEl) zielEl.remove();
      zielEl = null;
      if (!status || !zielDaten || tot) return;
      zielEl = H('button.ziel', { type: 'button', onclick: zielDaten.klick }, H('i.fahne', { 'aria-hidden': 'true' }), H('span', `${T().naechstesZiel}: `, H('b', zielDaten.text)));
      status.append(zielEl);
    };
    try { if (L.Zustand && typeof L.Zustand.beiStatus === 'function') abmelden = L.Zustand.beiStatus(() => { if (!tot) zeichneZiel(); }); } catch (e) { abmelden = null; }

    const r = {
      seite, info,
      leiste: k => zeichneLeiste(leiste, ctx, k),
      /** «Nächstes Ziel» in der Statusleiste: Forschung mit Stand des Wissens. Ohne offenes Ziel verschwindet die Zeile. */
      ziel(k) {
        const z = D().ziel(k), w = z && z.wissen;
        zielDaten = z ? { text: T().zielZeile(z.name, w ? (w.art === 'summe' ? T().zielSumme(Math.min(w.hat, w.braucht), w.braucht) : T().zielWissen(Math.min(w.hat, w.braucht), w.braucht)) : ''), klick: () => ctx.gehe('forschung', { wahl: z.id }) } : null;
        zeichneZiel();
      },
      /** Kurze Meldung unten links in der Ansicht, zum Beispiel was nach einem Tipp fehlt. Ein leerer Text räumt sie weg. */
      meldung(text) {
        meldungEl.textContent = text || '';
        clearTimeout(timer);
        timer = text ? setTimeout(() => { meldungEl.textContent = ''; }, MELDEZEIT) : null;
        if (timer && typeof timer.unref === 'function') timer.unref();
      },
      /** Statusleiste und Menü der Hülle neu zeichnen (Tagesstand) und das Ziel danach wieder anhängen. */
      aktualisiere() { ctx.aktualisiere(); zeichneZiel(); },
      schliesse() {
        if (tot) return;
        tot = true;
        clearTimeout(timer);
        if (abmelden) abmelden();
        [leiste, info, zielEl, meldungEl].forEach(n => { if (n) n.remove(); });
        if (info && geruest) geruest.classList.add('ohne-info');
        if (opt.voll) huelle.classList.remove('welt-ansicht');
        const min = Math.min(MAX_MINUTEN, (jetzt() - t0) / 60000);
        if (opt.zeit && min >= 0.05) {
          try { L.Zustand.aendere(z => { const tag = L.Lernplan.heute(z); z.tage = z.tage || {}; z.tage[tag] = L.Statistik.tag(z.tage[tag], { weltMin: min }); }); } catch (e) { /* die Zeit ist nur Anzeige */ }
        }
      }
    };
    return r;
  }

  L.WeltRahmen = { oeffne };
})(globalThis);
