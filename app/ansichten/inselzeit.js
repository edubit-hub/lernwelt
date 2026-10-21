/* app/ansichten/inselzeit.js: die Inselzeit (E-2110-01, docs/plaene/inselzeit_konzept_2026-10-21_0.1.md). Nach dem Tagesauftrag geht das Kind
   bis zu zwei Minuten selbst über die Insel: May folgt, lässt sich streicheln und trägt es, der Vater wartet am Steg mit dem Boot zu den anderen
   Inseln. Die Szene führt W3.Inselzeit (regler.inselzeit in szene.js). Diese Ansicht legt Zeitleiste, Hinweis und Knöpfe darüber und bucht die
   Zeit (InselzeitDaten.buche alle 30 s, beim Ausblenden und beim Schliessen). Ist die Zeit um, endet die Inselzeit ruhig: der Junge winkt, die Kamera
   fährt zurück, eine Karte führt zur Insel. Mit { probe: true } (Entwicklung, ?inselzeit) öffnet sie auch ohne Tagesauftrag und bucht nichts.
   Geschrieben werden die Zeit (InselzeitDaten) und die Wahl der Insel nach einer Überfahrt (zustand.welt.<id>.fach wie in inseln.js). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.inselzeit, D = () => L.InselzeitDaten;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const sicher = (f, sonst) => { try { return f(); } catch (fehler) { melde(fehler); return sonst; } };
  const jetzt = () => (L.Dienste && typeof L.Dienste.jetzt === 'function' ? L.Dienste.jetzt() : Date.now());
  const TAKT = 200, BUCHEN = 30, BOOT_REST = 12;                 // ms je Blick auf die Szene, s je Buchung, Sekunden, die eine Überfahrt braucht

  /** Die anderen Inseln mit Arealen: die Ziele des Boots */
  const ziele = () => sicher(() => { const I = L.InselDaten, hier = I.fach(); return I.ordnung().filter(f => I.areale(f).length && f.fach !== hier); }, []);

  function zeige(huelle, ctx) {
    const t = T(), probe = !!(ctx.daten && ctx.daten.probe), b = ctx.buehne, d = huelle.ownerDocument;
    if (!b || typeof b.inselzeit !== 'function' || (!probe && !sicher(() => D().offen(), false))) { ctx.gehe('start'); return undefined; }
    const z = { tot: false, gezaehlt: 0, gebucht: 0, letzte: jetzt(), wahl: false, ziel: null, schluessel: '', endet: false, rest0: probe ? D().SEKUNDEN : D().rest() };
    const rest = () => Math.max(0, z.rest0 - z.gezaehlt);

    // Nach der Überfahrt: die Wahl merken wie in der Ansicht «inseln», die Szene zeigt die neue Insel noch in der Abblende
    function wechsel(fach) {
      const id = L.Start && L.Start.welt ? L.Start.welt.id : null;
      if (id) sicher(() => L.Zustand.aendere(s => { s.welt = s.welt || {}; s.welt[id] = { ...(s.welt[id] || {}), fach }; }));
      sicher(() => b.aktualisiere());
    }
    const iz = sicher(() => b.inselzeit(true, { klang: n => sicher(() => ctx.klang.spiele(n)), beiWechsel: wechsel }), null);
    if (!iz) { ctx.gehe('start'); return undefined; }

    const fuellung = H('span.iz-fuellung');
    const leiste = H('div.iz-zeit', { role: 'img', 'aria-label': t.zeit(Math.ceil(rest() / 60)) }, H('span.iz-name', t.titel), H('span.iz-leiste', fuellung));
    const hinweis = H('p.iz-hinweis', { role: 'status' }), knoepfe = H('div.iz-knoepfe', { role: 'group', 'aria-label': t.knoepfe });
    const ende = H('div.iz-ende', { hidden: true }, H('div.iz-karte', H('h2', t.endeTitel), H('p', t.endeText),
      H('button.knopf.primaer.gross.iz-fertig', { type: 'button', onclick: () => ctx.gehe('start') }, t.zurInsel)));
    huelle.replaceChildren(H('div.iz-oben', leiste, H('button.knopf.iz-zurueck', { type: 'button', onclick: () => ctx.gehe('start') }, t.zurInsel)), hinweis, knoepfe, ende);

    const knopf = (wort, tue, art = '') => H(`button.knopf${art}`, { type: 'button', onclick: () => { sicher(tue); takt(); } }, wort);
    /** Die Knöpfe zur Lage: May rufen, Streicheln und Aufsteigen neben May, Absteigen im Sattel, am Steg das Boot mit der Wahl der Insel */
    function auswahl(s) {
      if (s.ende || s.faehrt) return [];
      if (z.wahl) return [...ziele().map(f => knopf(t.inselKnopf(f.name), () => { z.wahl = false; z.ziel = f.name; iz.aktion('fahren', f.fach); }, '.primaer')),
        knopf(t.hierbleiben, () => { z.wahl = false; }, '.leise')];
      const k = s.reitet ? [knopf(t.absteigen, () => iz.aktion('absteigen'))]
        : s.mayNah ? [knopf(t.streicheln, () => iz.aktion('streicheln')), knopf(t.aufsteigen, () => iz.aktion('aufsteigen'))]
          : s.modus === 'frei' ? [knopf(t.rufen, () => iz.aktion('rufen'))] : [];
      if (s.amSteg && rest() > BOOT_REST && ziele().length) k.push(knopf(t.boot, () => { z.wahl = true; }, '.primaer'));
      return k;
    }
    const hinweisFuer = s => (s.ende ? '' : s.faehrt ? t.ueberfahrt(z.ziel) : z.wahl ? t.wohin : s.reitet ? t.reiten : s.amSteg ? t.steg : s.gegangen ? '' : t.gehen);

    function buche() {
      const s = z.gezaehlt - z.gebucht;
      if (probe || s < 1) return;
      z.gebucht = z.gezaehlt; sicher(() => D().buche(s));
    }
    /** Fünfmal je Sekunde: Zeit zählen (nur sichtbar und vor dem Ende), Leiste, Knöpfe und Hinweis nachführen, bei 0 die Inselzeit beenden */
    function takt() {
      if (z.tot) return;
      const n = jetzt(), dt = Math.max(0, Math.min(1, (n - z.letzte) / 1000)), s = sicher(() => iz.zustand(), null) || {};
      z.letzte = n;
      if (d && d.hidden) { buche(); return; }
      if (!s.ende) z.gezaehlt += dt;
      if (z.gezaehlt - z.gebucht >= BUCHEN) buche();
      const r = rest();
      fuellung.style.transform = `translateX(-${Math.round((1 - r / D().SEKUNDEN) * 1000) / 10}%)`;   // G8: nur transform, die Leiste schneidet ab
      if (r <= 0 && !z.endet) { z.endet = true; sicher(() => iz.aktion('ende')); }
      if (!s.amSteg) z.wahl = false;
      const schluessel = JSON.stringify([s.modus, s.mayNah, s.reitet, s.amSteg && r > BOOT_REST, s.faehrt, s.ende, s.gegangen, z.wahl, Math.ceil(r / 60)]);
      if (schluessel !== z.schluessel) {
        z.schluessel = schluessel;
        knoepfe.replaceChildren(...auswahl(s)); hinweis.textContent = hinweisFuer(s); leiste.setAttribute('aria-label', t.zeit(Math.ceil(r / 60)));
        if (s.ende) ende.hidden = false;
      }
    }
    const sichtbar = () => { if (d.hidden) buche(); else z.letzte = jetzt(); };     // die Zeit im Hintergrund zählt nicht
    const uhr = g.setInterval(takt, TAKT);
    if (d && typeof d.addEventListener === 'function') d.addEventListener('visibilitychange', sichtbar);
    takt();

    return {
      schliesse() {
        if (z.tot) return;
        takt(); z.tot = true;
        g.clearInterval(uhr);
        if (d && typeof d.removeEventListener === 'function') d.removeEventListener('visibilitychange', sichtbar);
        buche();
        sicher(() => b.inselzeit(false));
      }
    };
  }

  // Kein Eintrag im Dock: der Weg führt über May auf dem Start und über den Abschluss des Tagesauftrags
  L.Ansichten.inselzeit = { id: 'inselzeit', welt: 'inseln', get titel() { return L.Texte.inselzeit.titel; },
    buehne: { kamera: 'start', schleier: 'keine', marken: 'keine', hud: 'aus', dock: false }, zeige };
})(globalThis);
