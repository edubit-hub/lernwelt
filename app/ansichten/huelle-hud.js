/* app/ansichten/huelle-hud.js: das Spiel-HUD oben (docs/gestaltung-umbau.md 2.1 und 3.1, Vorbild docs/mockup/richtung-a/a-stil.css «HUD oben»).
     header.hud > .hud-links (.hud-medaille: Ring mit Epochenzahl, «Epoche 1», Name, «Tor 1 von 4»; darunter button.ziel.hud-ziel «Nächstes Ziel»),
                  .hud-pillen (.pille.res[data-rohstoff] mit Objekt, .res-zahl, .res-name, .res-plus), span.modus (Testprofil),
                  button.hud-klang[aria-pressed], button.hud-eltern.start-eltern (Schlüssel, .start-punkt bei einem Hinweis für die Eltern).
   Die Hülle baut das HUD einmal (HuelleHud.baue) und ruft zeichne(k) bei jeder Änderung. Die Pillen werden an Ort und Stelle nachgeführt, damit Effekte
   (Flug, Plakette, Zählen) ihr Ziel behalten. Gelesen wird über WeltDaten, geschrieben nur die Einstellung «klang» (über die Hülle). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.huelle, D = () => L.WeltDaten;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const SCHLUESSEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.2"/><path d="M12.2 12H21M18 12v3.2M21 12v2.2"/></svg>';
  // Lautsprecher mit Schallbögen (Nachbesserung 2: eindeutiger als die Note); aus: die Bögen gehen, ein Strich liegt darüber
  const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.6L12.5 5v14l-4.9-4.5H4z"/><path class="note-an" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/><path class="note-aus" d="M3.5 3.5l17 17"/></svg>';
  const RING = 2 * Math.PI * 19;

  /** Objekt eines Rohstoffs: Iso.objekt (F3), sonst das Linien-Symbol, sonst nichts. */
  function objekt(name, px = 30) {
    const el = H('span.res-objekt', { 'aria-hidden': 'true' });
    el.innerHTML = sicher(() => (L.Iso && L.Iso.objekt ? L.Iso.objekt(name, { groesse: px }) : L.Iso && L.Iso.symbol ? L.Iso.symbol(name, { groesse: px - 4 }) : ''), '') || '';
    return el;
  }

  /** Steht im Elternbereich eine Erinnerung an (Sicherung fällig)? Scheitert die Frage, gibt es keinen Hinweis. */
  const elternHinweis = () => sicher(() => !!(L.ElternDaten && L.ElternDaten.lage(L.Zustand.hole(), L.Tag.heute()).erinnerung), false);

  /** api: { gehe(id, daten), ansicht(id), klangAn() → bool, schalteKlang() } */
  function baue(api) {
    const z = { ids: null, pillen: new Map(), ziel: null };
    const ring = H('span.medaille-ring', { 'aria-hidden': 'true' }), nr = H('b.medaille-nr'), kick = H('small'), name = H('b'), tor = H('em');
    // Die Medaille ist zugleich der Weg zurück zur ganzen Insel (Ansicht «start», ohne eigenen Eintrag im Dock)
    // Fachinseln: auf dem Start führt die Medaille zur Wahl der Insel (Ansicht «inseln»), sonst zurück zur ganzen Insel
    const inselModus = () => sicher(() => !!(L.InselDaten && L.InselDaten.aktiv()), false);
    const ziel = () => (inselModus() && sicher(() => L.Huelle.aktuell(), null) === 'start' ? 'inseln' : 'start');
    const medaille = H('button.hud-medaille', { type: 'button', 'data-ansicht': 'start', onclick: () => { if (L.Klang && L.Klang.spiele) sicher(() => L.Klang.spiele('taste')); api.gehe(ziel()); } },
      H('span.medaille-zurueck', { 'aria-hidden': 'true' }, H('span.ico.ico-pfeil'), H('span', T().inselZurueck)), ring, H('span.medaille-text', kick, name, tor));   // «Insel» nur ausserhalb des Starts (huelle.css)
    const zielOrt = H('div.hud-ziel-ort'), links = H('div.hud-links', medaille, zielOrt);
    const pillen = H('div.hud-pillen', { role: 'group', 'aria-label': T().vorrat }), modus = H('span.modus');
    // Klangschalter mit eigenem Zeichen (Note), klar getrennt vom Lautsprecher «Anhören» in den Aufgaben; während einer Aufgabe ist er ausgeblendet
    const klang = H('button.hud-klang', { type: 'button', 'aria-label': T().klangBeschriftung, 'aria-pressed': 'true', onclick: () => api.schalteKlang() }, H('span.hud-note', { 'aria-hidden': 'true' }));
    klang.firstChild.innerHTML = NOTE;
    const schluessel = H('span.hud-schluessel');
    schluessel.innerHTML = SCHLUESSEL;
    const eltern = H('button.hud-eltern.start-eltern', { type: 'button', onclick: () => oeffneEltern() }, schluessel);
    const el = H('header.hud', { 'aria-label': T().hudName }, links, pillen, modus, klang, eltern);
    ring.innerHTML = `<svg viewBox="0 0 44 44"><circle class="ring-spur" cx="22" cy="22" r="19"/><circle class="ring-wert" cx="22" cy="22" r="19" transform="rotate(-90 22 22)" stroke-dasharray="0 ${RING.toFixed(1)}"/></svg>`;
    ring.append(nr);

    /** Der Elternbereich: wie in der Startansicht, eine echte Anmeldung als Lernwelt.Ansichten.eltern geht vor. */
    function oeffneEltern() {
      if (!api.ansicht('eltern') && L.Eltern && typeof L.Eltern.zeige === 'function') {
        L.Ansichten.eltern = { id: 'eltern', get titel() { return L.Texte.start.eltern; }, zeige: (huelle, ctx) => L.Eltern.zeige(huelle, { onZurueck: () => ctx.gehe('start') }) };
      }
      if (api.ansicht('eltern')) api.gehe('eltern'); else sicher(() => L.ui.dialog.meldung(L.Texte.start.elternFehlt));
    }

    /** Text und Anteil des Tors: Wissen (Raute), dann Material, erst dann «bereit». Der Ring füllt sich mit Wissen und Material zusammen. */
    function torStand(t) {
      if (!t) return { text: '', anteil: 1, zustand: '' };
      const wissen = Math.min(1, t.hat / Math.max(1, t.braucht)), k = t.kosten || [], summe = k.reduce((s, p) => s + p.menge, 0);
      const material = summe ? k.reduce((s, p) => s + Math.min(p.hat, p.menge), 0) / summe : 1, z = t.zustand || (wissen < 1 ? 'wissen' : 'bereit');
      const text = z === 'bereit' ? T().torBereit : z === 'material' ? T().torStand(D().standText(t.fehlt)) : T().torWissen(Math.min(t.hat, t.braucht), t.braucht);
      return { text, anteil: z === 'bereit' ? 1 : .7 * wissen + .3 * material, zustand: z };
    }

    function zeichneMedaille(e) {
      medaille.hidden = !e;
      if (!e) return;
      const t = e.tor, s = torStand(t), anteil = s.anteil, torText = s.text;
      nr.textContent = String(e.nr); kick.textContent = T().epoche(e.nr); name.textContent = e.name; tor.textContent = torText; tor.hidden = !t;
      tor.setAttribute('data-zustand', s.zustand);
      const wert = ring.finde ? ring.finde(n => n.getAttribute && n.getAttribute('class') === 'ring-wert') : ring.querySelector && ring.querySelector('.ring-wert');
      if (wert && wert.setAttribute) wert.setAttribute('stroke-dasharray', `${(RING * anteil).toFixed(1)} ${RING.toFixed(1)}`);
      medaille.setAttribute('aria-label', `${T().medaille(e.nr, e.name, torText)}. ${T().zurInsel}`);
    }

    /** Medaille der Fachinseln: Ring mit der Zahl der ausgebauten Areale, «Insel», Name des Fachs, «2 von 6 Arealen ausgebaut». */
    function zeichneInsel(m) {
      const TI = L.Texte.inseln, stand = TI.ausgebaut(m.ausgebaut, m.areale);
      medaille.hidden = false;
      nr.textContent = String(m.ausgebaut); kick.textContent = TI.medailleKick; name.textContent = m.name; tor.textContent = stand; tor.hidden = false;
      tor.setAttribute('data-zustand', '');
      const wert = ring.querySelector && ring.querySelector('.ring-wert');
      if (wert && wert.setAttribute) wert.setAttribute('stroke-dasharray', `${(RING * m.anteil).toFixed(1)} ${RING.toFixed(1)}`);
      medaille.setAttribute('aria-label', ziel() === 'inseln' ? TI.medaille(m.name, stand) : TI.medailleZurInsel(m.name, stand));
    }

    function neuePille(x) {
      const zahl = H('span.res-zahl'), plus = H('span.res-plus'), nameEl = H('span.res-name', x.name);
      const p = H('div.pille.res', { 'data-rohstoff': x.id, style: `--tint: var(--${x.symbol}-tint, var(--akzent-hell))` }, objekt(x.symbol), H('span.res-wert', zahl, nameEl), plus);
      z.pillen.set(x.id, { p, zahl, plus });
      return p;
    }

    function zeichnePillen(k) {
      const res = k ? sicher(() => D().ressourcen(k, D().zuwachs()), null) : null, liste = res ? [...res.roh, ...res.gueter] : [], ids = liste.map(x => x.id).join(',');
      if (ids !== z.ids) { z.pillen.clear(); pillen.replaceChildren(...liste.map(neuePille)); z.ids = ids; }
      for (const x of liste) {
        const t = z.pillen.get(x.id);
        t.zahl.textContent = String(x.zahl); t.plus.textContent = x.plus ? `+${x.plus}` : ''; t.plus.hidden = !x.plus;
        t.p.classList.toggle('null', x.zahl === 0);
        t.p.setAttribute('aria-label', T().pille(x.name, x.zahl, x.plus));
      }
      pillen.hidden = !liste.length;
      pillen.classList.toggle('eng', liste.length > 4);
    }

    return {
      el,
      /** Medaille, Pillen und Schlüssel neu. k: Welt-Kontext (WeltDaten.kontext), ohne Angabe selbst geholt. */
      zeichne(k) {
        const kk = k === undefined ? sicher(() => (D() ? D().kontext() : null), null) : k;
        const insel = inselModus() ? sicher(() => L.InselDaten.medaille(), null) : null;
        if (insel) zeichneInsel(insel); else zeichneMedaille(kk ? sicher(() => D().epocheStand(kk), null) : null);
        zeichnePillen(insel ? null : kk);
        const hinweis = elternHinweis();
        eltern.replaceChildren(schluessel, hinweis ? H('i.start-punkt', { 'aria-hidden': 'true' }) : '');
        eltern.setAttribute('aria-label', hinweis ? L.Texte.start.elternMitHinweis : L.Texte.start.elternBeschriftung);
        if (hinweis) eltern.setAttribute('title', L.Texte.start.elternHinweis); else eltern.removeAttribute('title');
        klang.setAttribute('aria-pressed', String(!!api.klangAn()));
        klang.setAttribute('title', api.klangAn() ? T().klangAn : T().klangAus);
      },
      /** «Nächstes Ziel» unter der Medaille: { text, klick } oder null. */
      ziel(daten) {
        z.ziel = daten || null;
        zielOrt.replaceChildren(daten ? H('button.ziel.hud-ziel', { type: 'button', onclick: daten.klick }, H('i.fahne', { 'aria-hidden': 'true' }),
          H('span', `${L.Texte.welt.naechstesZiel}: `, H('b', daten.text))) : '');
      },
      pille: id => (z.pillen.get(id) || {}).p || null,
      testprofil(name) { el.classList.toggle('testprofil', !!name); modus.textContent = name ? L.Texte.start.testprofil(name) : ''; modus.hidden = !name; }
    };
  }

  L.HuelleHud = { baue, objekt };
})(globalThis);
