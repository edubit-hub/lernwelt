/* app/ansichten/abschluss-schritt.js: der nächste Schritt auf der Logbuchseite (Nachbesserung 1 zu docs/gestaltung-umbau.md 2.8).
   Ist nichts neu möglich, zeigt der Abschluss trotzdem eine Karte «Als Nächstes» mit genau einem Knopf: das Tor erforschen, wenn es bereit ist,
   sonst das Ziel der Forschung (erforschen, fehlendes Material oder Wissen sammeln). Dazu die Zeile zum Tor unter «Unterwegs» mit ihrem Zustand:
   «Tor: Wissen 4 von 6», «Tor: 33 von 40 Stein» (darunter «Wissen 6 von 6») oder «Tor bereit zum Erforschen». Liest nur (WeltDaten), schreibt nichts.
     AbschlussSchritt.schritt(k, d) → { titel, ort, text, bild, art ('forschung' | 'ueben'), tue } | null
     AbschlussSchritt.karte(k, d, { ohneKnopf }) → { el: div.abschluss-neu.als-naechstes, art, knopf } | null      AbschlussSchritt.torZeile(tor) → p.abschluss-tor (bei fehlendem Material zwei Zeilen)
     AbschlussSchritt.kartenBild(art) → span.neu-bild.neu-karte (Punkt, gestrichelte Route, Miniatur des Ziels) */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const TS = () => L.Texte.abschlussseite, TH = () => L.Texte.huelle, D = () => L.WeltDaten, B = () => L.WeltBausteine;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const ansicht = id => !!sicher(() => L.Huelle.ansicht(id), null);

  /** Üben im Fach: «Rechnen üben», führt zum Tagesauftrag (d.ueben(fach), sonst d.weiter()). */
  function ueben(fach, d) {
    const tue = typeof d.ueben === 'function' ? () => d.ueben(fach) : typeof d.weiter === 'function' ? () => d.weiter() : null;
    return tue ? { text: (fach && TH().ueben[fach]) || TH().uebenAllgemein, bild: 'lernen', art: 'ueben', tue } : null;
  }
  /** Zur Forschung mit dem gewählten Knoten. */
  const forschung = (id, text) => (ansicht('forschung') ? { text, bild: 'forschung', art: 'forschung', tue: () => L.Huelle.gehe('forschung', { wahl: id }) } : null);
  const fachVon = (k, rohstoff) => sicher(() => k.thema.rohstoffe[rohstoff].fach, null);
  const mit = (x, extra) => (x ? { ...x, ...extra } : null);

  function schritt(k, d = {}) {
    if (!k || !D()) return null;
    const s = TS(), h = TH(), ort = s.ortForschung(sicher(() => k.thema.orte.forschung.name, ''));
    const tor = sicher(() => D().epocheStand(k).tor, null);
    if (tor && tor.zustand === 'bereit') return mit(forschung(tor.id, h.torAnsehen), { titel: h.zielErforschen(tor.name), ort });
    const z = sicher(() => D().ziel(k), null);
    if (!z) return null;
    if (z.zustand === 'bereit') return mit(forschung(z.id, s.forschungAnsehen), { titel: h.zielErforschen(z.name), ort });
    if (z.zustand === 'material' && z.fehlt.length) return mit(ueben(fachVon(k, z.fehlt[0].id), d), { titel: h.zielStand(z.name, D().standText(z.fehlt)), ort: s.ortUeben });
    const w = z.wissen || { hat: 0, braucht: 0 }, fach = w.bereich ? String(w.bereich).split('.')[0] : null;
    return mit(ueben(fach, d), { titel: s.wissenNoch(z.name, Math.min(w.hat, w.braucht), w.braucht), ort: s.ortUeben });
  }

  /** Kleine Karte zum Ziel (Nachbesserung 2): ein Punkt «hier», eine gestrichelte Route und die Miniatur des Orts am Ende. Nur Bild, aria-hidden. */
  function kartenBild(art) {
    const el = H('span.neu-bild.neu-karte', { 'aria-hidden': 'true' }), mini = sicher(() => L.Iso.mini(art, { groesse: 52 }), '') || '';
    el.innerHTML = '<svg class="nk-route" viewBox="0 0 96 64"><path class="nk-weg" d="M12 52 C30 58 40 30 58 30 S76 18 80 16"/><circle class="nk-hier" cx="12" cy="52" r="5"/></svg>'
      + (mini ? `<span class="nk-ziel">${mini}</span>` : '');
    return el;
  }

  /** opt.ohneKnopf: der grosse Knopf «Nächste Runde» des Abschlusses führt schon dorthin (Üben), die Karte zeigt dann nur den Weg. */
  function karte(k, d, opt = {}) {
    const x = sicher(() => schritt(k, d), null);
    if (!x) return null;
    const knopf = !(opt.ohneKnopf && x.art === 'ueben');
    const el = H('div.abschluss-neu.als-naechstes', { 'data-schritt': x.art }, kartenBild(x.bild),
      H('div.neu-text', H('p.kicker', TS().alsNaechstes), H('p.neu-titel', x.titel), H('p.neu-ort', x.ort)),
      knopf ? H('button.knopf.primaer.neu-knopf', { type: 'button', 'data-aktion': x.art, onclick: () => x.tue() }, x.text) : '');
    return { el, art: x.art, knopf };
  }

  /** Das Tor unter «Unterwegs»: erfüllt erst, wenn auch das Material da ist. Rauten wie im HUD und in der Forschung. */
  function torZeile(tor) {
    const h = TH(), b = B(), rauten = (hat, braucht) => (b && braucht ? b.lampen(hat, braucht) : '');
    if (tor.zustand === 'bereit') return H('p.abschluss-tor.bereit', rauten(tor.braucht, tor.braucht), H('span', h.torBereit));
    // Wissen voll, Material fehlt: zwei Zeilen, damit klar ist, was erfüllt ist und was noch fehlt («Tor: 33 von 40 Stein», darunter «Wissen ◆◆ 6 von 6»)
    if (tor.zustand === 'material') return [H('p.abschluss-tor', H('span', h.torStand(D().standText(tor.fehlt)))),
      H('p.abschluss-tor.abschluss-wissen', H('span', h.wissenWort), rauten(tor.braucht, tor.braucht))];   // die Rauten tragen «6 von 6» selbst
    return H('p.abschluss-tor', H('span', h.torWissen(Math.min(tor.hat, tor.braucht), tor.braucht)), rauten(tor.hat, tor.braucht));
  }

  L.AbschlussSchritt = { schritt, karte, torZeile, kartenBild };
})(globalThis);
