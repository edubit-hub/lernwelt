/* app/ansichten/welt-rahmen.js: der Rahmen der Welt-Ansichten über der Bühne (docs/gestaltung-umbau.md 2.1 und 3.2, Architektur 7.8, AP-16).
     WeltRahmen.oeffne(huelle, ctx, { voll, info, zeit }) → { seite, info, leiste(k), ziel(k), meldung(text), aktualisiere(), schliesse() }
   seite ist der Inhalt der Ansicht in der Hauptfläche (voll: ohne Rand, über die ganze freie Fläche). info ist der Rumpf einer Tafel (aside.tafel.info),
   die quer von rechts hereingleitet und hoch als Blatt von unten kommt. leiste(k) führt die Pillen und die Medaille im HUD nach, ziel(k) setzt das
   «Nächste Ziel» unter die Medaille, die kurze Meldung schwebt über dem Dock. schliesse() räumt alles ab und bucht die Zeit in der Welt
   (tage[heute].weltMin, höchstens fünf Minuten je Besuch, Schutzregel 7). Ohne Rahmen der Hülle (eingebettet) bleibt alles in der Ansicht. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten;
  const hatKlasse = (n, k) => !!n && typeof n.getAttribute === 'function' && (n.getAttribute('class') || '').split(/\s+/).includes(k);
  const jetzt = () => (L.Dienste && typeof L.Dienste.jetzt === 'function' ? L.Dienste.jetzt() : Date.now());
  const MELDEZEIT = 6500, MAX_MINUTEN = 5;

  /** Der Text des Ziels sagt den nächsten Schritt: «Moosbau I, Wissen 0 von 2», «Moosbau I: 3 von 10 Stein» oder «Moosbau I erforschen». */
  function zielText(z) {
    const w = z.wissen, t = T(), h = L.Texte.huelle;
    if (z.zustand === 'bereit') return h.zielErforschen(z.name);
    if (z.zustand === 'material') return h.zielStand(z.name, D().standText(z.fehlt));
    return t.zielZeile(z.name, w ? t.zielWissen(Math.min(w.hat, w.braucht), w.braucht) : '');
  }

  /** Öffnet den Rahmen in `huelle` (section.ansicht) und gibt die Griffe zurück. */
  function oeffne(huelle, ctx, opt = {}) {
    const app = huelle.parentNode && huelle.parentNode.parentNode, geruest = hatKlasse(app, 'app') ? app : null;
    const seite = H(`div.welt-seite${opt.voll ? '.voll' : ''}`), meldungEl = H('div.welt-meldung', { role: 'status' });
    const a = L.Ansichten[ctx.id], kicker = (a && a.titel) || '';
    let tot = false, timer = null, tafel = null, info = null, beobachter = null;
    const t0 = jetzt();
    const melde = () => { if (L.Tafel && typeof L.Tafel.melde === 'function') L.Tafel.melde(); };          // die Kamera rückt den Ort neu in den freien Teil
    const einklappen = () => {
      if (!tafel || tot) return;
      if (beobachter && typeof beobachter.takeRecords === 'function') beobachter.takeRecords();   // Inhalt von vorher holt die Tafel nicht zurück
      tafel.el.classList.add('eingeklappt'); if (geruest) geruest.classList.remove('mit-tafel'); melde();
    };
    if (opt.voll) huelle.classList.add('welt-ansicht');
    huelle.replaceChildren(seite);
    if (opt.info && geruest && L.Tafel) {
      tafel = typeof ctx.tafel === 'function' ? ctx.tafel({ art: 'seite', klasse: 'info welt-tafel', kicker, schliessen: einklappen })
        : L.Tafel.oeffne(geruest, { art: 'seite', klasse: 'info welt-tafel', kicker, schliessen: einklappen });
      info = tafel.rumpf;
      tafel.el.setAttribute('aria-live', 'polite');
      // Neuer Inhalt (ein anderer Platz, ein anderer Knoten) holt die eingeklappte Tafel zurück
      if (typeof g.MutationObserver === 'function') {
        beobachter = new g.MutationObserver(() => { if (!tot && tafel.el.classList.contains('eingeklappt')) { tafel.el.classList.remove('eingeklappt'); geruest.classList.add('mit-tafel'); melde(); } });
        beobachter.observe(info, { childList: true });
      }
    } else if (opt.info) {
      info = H('aside.info', { 'aria-live': 'polite', 'aria-label': T().infoFeld });
      seite.classList.add('eingebettet');
      seite.append(info);
    }
    if (geruest) geruest.append(meldungEl); else seite.append(meldungEl);

    const hud = () => (ctx.hud && typeof ctx.hud.aktualisiere === 'function' ? ctx.hud.aktualisiere() : null);
    const setzeZiel = daten => { if (ctx.hud && typeof ctx.hud.ziel === 'function') ctx.hud.ziel(daten); };

    return {
      seite, info,
      /** Die Tafel der Welt-Ansicht (oder null, eingebettet) und ihr Kopf: setzeTitel(kicker, titel), etwa «Bauplatz» oder «Gebäude» je Zustand. */
      tafel,
      setzeTitel: (k2, t2) => { if (tafel && !tot) tafel.setzeTitel(k2, t2); },
      /** Klappt die Tafel ein (wie «Schliessen»); neuer Inhalt holt sie zurück. */
      einklappen,
      /** Pillen und Medaille im HUD nach dem Stand k (der Stand kommt aus dem Zustand, k bleibt für die Ansichten gleich). */
      leiste: () => { if (!tot) hud(); },
      /** «Nächstes Ziel» unter der Medaille: Forschung mit Stand des Wissens. Ohne offenes Ziel verschwindet die Zeile. */
      ziel(k) {
        if (tot) return;
        const z = D().ziel(k);
        setzeZiel(z ? { text: zielText(z), klick: () => ctx.gehe('forschung', { wahl: z.id }) } : null);
      },
      /** Kurze Meldung über dem Dock, zum Beispiel was nach einem Tipp fehlt. Ein leerer Text räumt sie weg. */
      meldung(text) {
        meldungEl.textContent = text || '';
        clearTimeout(timer);
        timer = text ? setTimeout(() => { meldungEl.textContent = ''; }, MELDEZEIT) : null;
        if (timer && typeof timer.unref === 'function') timer.unref();
      },
      /** HUD und Dock der Hülle neu zeichnen (Tagesstand). */
      aktualisiere() { ctx.aktualisiere(); },
      schliesse() {
        if (tot) return;
        tot = true;
        clearTimeout(timer);
        if (beobachter) beobachter.disconnect();
        setzeZiel(null);
        meldungEl.remove();
        if (tafel) tafel.schliesse(); else if (info) info.remove();
        if (opt.voll) huelle.classList.remove('welt-ansicht');
        const min = Math.min(MAX_MINUTEN, (jetzt() - t0) / 60000);
        if (opt.zeit && min >= 0.05) {
          try { L.Zustand.aendere(z => { const tag = L.Lernplan.heute(z); z.tage = z.tage || {}; z.tage[tag] = L.Statistik.tag(z.tage[tag], { weltMin: min }); }); } catch (e) { /* die Zeit ist nur Anzeige */ }
        }
      }
    };
  }

  L.WeltRahmen = { oeffne, zielText };
})(globalThis);
