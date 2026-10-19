/* app/ansichten/forschung.js: die Ansicht «Forschung» am Forschungsturm (docs/gestaltung-umbau.md 2.10, Architektur 7.8, Vorbild B quer-forschung und A quer-forschung-effekt).
   Die Kamera fährt zum Turm, eine breite Tafel (Art karte) zeigt oben den Baum als Karte (forschung-graph.js: Spalten je Epoche, Zeilen je Fach, Knoten als
   Siegel mit Name, Bereich, Lampen «x von y» und Kosten, gesperrte Epochen blass mit Schild «Horizont») und unten den gewählten Knoten: Wissen, Kosten mit
   «du hast», was er freischaltet, den Weg zum nächsten Schritt (WeltWeg) und «Erforschen» sowie «Als Ziel merken». Hoch wird die Tafel zum Blatt von unten,
   die Karte läuft darin waagrecht. «Erforschen» geht über die Engine (WeltDaten.aktion mit Probelauf), danach öffnet sich das Siegel, ein Licht läuft die Kante
   entlang, die Kosten springen als Plakette an der Pille ab, Klang «forschung». Die Effekte blockieren nichts. Wissen wird nie verbraucht.
   ctx.daten: { wahl: Knoten-ID } wählt einen Knoten beim Öffnen (aus dem HUD, der Siedlung, dem Weg oder dem Abschluss). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const TW = () => L.Texte.welt, TK = () => L.Texte.forschungskarte, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine;
  const WEG = 12;                                            // grösste Bewegung eines Tipps in Pixeln, darüber ist es ein Wischen (Bildlauf der Karte)
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const kann = (el, f) => !!el && typeof el[f] === 'function';

  /** Das Siegel des Knotens im Kopf der Tafel: Rohstoff-Objekt des Zweigs, beim Tor die Miniatur des Tors. */
  function siegelKopf(k, c) {
    const el = H(`span.fo-detail-siegel.s-${c.zustand}`, { 'aria-hidden': 'true' }), fach = c.bereich ? String(c.bereich).split('.')[0] : null;
    const roh = fach ? Object.values(k.thema.rohstoffe || {}).find(r => r.fach === fach) : null;
    if (roh) el.append(B().objekt(roh.symbol, 30));
    else el.innerHTML = sicher(() => (c.tor && L.Iso && L.Iso.mini ? L.Iso.mini('tor', { groesse: 40 }) : ''), '') || '';
    return el;
  }

  /** Der Teil der Tafel unter der Karte: { inhalt, weg, aktionen } zum gewählten Knoten f. z.ziel: das gesetzte Ziel (ID) oder null. */
  function detail(k, f, z, tun) {
    const tw = TW(), tk = TK(), Bs = B(), c = C().knoten(k, f), erf = c.zustand === 'erforscht';
    const kicker = c.tor ? tk.kickerTor : c.zustand === 'horizont' ? tk.kickerHorizont : tk.kickerKnoten(c.bereich ? D().bereichName(c.bereich) : tk.alleBereiche);
    const kopf = H('div.fo-detail-kopf', siegelKopf(k, c), H('div.fo-detail-titel', Bs.kicker(kicker), H('h3', f.name)),
      H(`span.fo-status.s-${c.zustand}`, tw.zustand[c.zustand] + (c.tor ? `, ${tw.torKurz}` : '')));
    if (c.zustand === 'horizont') {
      const e = D().epoche(k, f.epoche);
      return { inhalt: [kopf, H('p.fo-text', tw.horizontText(e ? e.name || e.id : ''))], weg: null,
        aktionen: [Bs.knopf({ text: tw.nochNichtWaehlbar, gesperrt: true, name: 'ziel', klick: () => tun.melde(tw.horizontMeldung) })] };
    }
    const module = c.bereich ? D().bereichModule(c.bereich) : [];
    const fakten = H('div.fo-fakten',
      c.wissen.map(w => H('div.fo-fakt', H('span.fo-fakt-titel', `${tk.wissen} · ${w.art === 'summe' ? tw.alleBereiche : D().bereichName(w.bereich)}`), Bs.lampen(w.hat, w.braucht))),
      H('div.fo-fakt', H('span.fo-fakt-titel', erf ? tk.bezahlt : tk.kosten), Bs.kosten(c.kosten, { duHast: !erf })));
    const inhalt = [kopf, module.length ? H('p.fo-module', tk.uebenMit(module.join(', '))) : '', fakten,
      c.frei.length ? H('p.fo-frei', H('b', `${tk.schaltetFrei}: `), c.frei.join(', ')) : ''];
    const plan = erf ? null : sicher(() => L.WeltWeg.ausBedingungen(k, c.bedingungen, c.kosten), null), weg = plan ? sicher(() => L.WeltWeg.baue(plan), null) : null;
    if (weg && plan.schritte.every(s => s.erledigt)) weg.classList.add('fertig');      // alles erfüllt: die Wegbox fällt weg (forschung.css), es bleibt «Erforschen»
    const aktionen = erf ? [Bs.knopf({ text: tw.inDerSiedlung, icon: 'siedlung', name: 'siedlung', klick: () => tun.gehe('siedlung') })]
      : [Bs.knopf({ text: tw.erforschen, icon: 'forschung', primaer: true, gesperrt: !c.moeglich, name: 'erforschen', klick: () => tun.erforsche(f.id) }),
        Bs.knopf({ text: z.ziel === f.id ? tw.zielEntfernen : tw.zielSetzen, icon: 'pfeil', name: 'ziel', klick: () => tun.ziel(f.id) })];
    return { inhalt, weg, aktionen };
  }

  function zeige(huelle, ctx) {
    const k0 = D().kontext(), liste = k0 && Array.isArray(k0.thema.forschung) ? k0.thema.forschung : [];
    if (!liste.length) { huelle.replaceChildren(H('div.seite', H('h2', TW().menue.forschung), H('div.kasten.hilfe', { role: 'status' }, k0 ? TW().keineForschung : TW().keineWelt))); return null; }
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { voll: true, zeit: true }), tk = TK(), Graph = L.ForschungGraph;
    const ort = k0.thema.orte && k0.thema.orte.forschung, stand = D().epocheStand(k0);
    const zu = () => { if (tafel) { tafel.el.classList.add('eingeklappt'); sicher(() => tafel.el.parentNode.classList.remove('mit-tafel')); } };
    // Nachbesserung 2: ein Kopf ohne Versalien-Kicker, «Forschung · Epoche 1 Landung»; der Ort steht auf der Bühne
    const tafel = typeof ctx.tafel === 'function' ? ctx.tafel({ art: 'karte', klasse: 'info forschung-tafel', kicker: '',
      titel: stand ? tk.titel(stand.nr, stand.name) : tk.titelOhneEpoche, schliessen: zu }) : null;
    const wurzel = tafel ? tafel.rumpf : H('aside.info.forschung-tafel.eingebettet');
    if (tafel) huelle.classList.add('fo-ansicht'); else rahmen.seite.append(wurzel);
    const feld = H('div.forschung-feld.fo-karte'), unten = H('div.fo-detail');
    wurzel.append(feld, unten);
    const wunsch = ctx.daten.wahl || (D().ziel(k0) || {}).id;
    const z = { k: k0, id: liste.some(f => f.id === wunsch) ? wunsch : liste[0].id, ziel: null };

    const holeK = () => { z.k = D().kontext(); const s = D().ziel(z.k); z.ziel = s && s.gesetzt ? s.id : null; return z.k; };
    const knotenEl = id => (kann(feld, 'querySelector') ? feld.querySelector(`.fo-knoten[data-id="${String(id).replace(/["\\]/g, '')}"]`) : null);
    function zeichneDetail() {
      const t = detail(z.k, D().knoten(z.k, z.id), z, tun);
      unten.classList.toggle('mit-weg', !!t.weg);
      unten.replaceChildren(H('div.fo-detail-info', t.inhalt), H('div.fo-detail-seite', H('div.fo-aktionen', t.aktionen), t.weg || ''));
    }
    /** Holt den Knoten waagrecht in die Karte, ohne die Seite zu bewegen. */
    function zeigeKnoten(id) {
      const n = knotenEl(id);
      if (!kann(n, 'getBoundingClientRect') || !kann(feld, 'getBoundingClientRect')) return;
      const r = n.getBoundingClientRect(), fr = feld.getBoundingClientRect();
      if (r.left < fr.left + 8 || r.right > fr.right - 8) feld.scrollLeft += (r.left + r.width / 2) - (fr.left + fr.width / 2);
    }
    function zeichneAlles(fokus) {
      feld.innerHTML = Graph.zeichne(Graph.modell(z.k, z.id));
      zeichneDetail();
      const n = knotenEl(z.id);
      if (fokus && kann(n, 'focus')) n.focus({ preventScroll: true });
    }
    function waehle(id) {
      const doc = feld.ownerDocument, fokus = !!(doc && doc.activeElement && kann(feld, 'contains') && feld.contains(doc.activeElement));
      z.id = id;
      if (tafel && tafel.el.classList.contains('eingeklappt')) { tafel.el.classList.remove('eingeklappt'); sicher(() => tafel.el.parentNode.classList.add('mit-tafel')); sicher(() => L.Tafel.melde()); }
      zeichneAlles(fokus);
      zeigeKnoten(id);
    }
    function nachAktion(text) {
      const k = holeK();
      rahmen.leiste(k);
      zeichneAlles(false);
      rahmen.meldung(text);
    }

    /** Ereigniseffekt nach «Erforschen»: Kosten fliegen von der Pille zum Siegel, das Siegel öffnet sich, ein Licht läuft die Kanten entlang. */
    function effekt(id, kosten) {
      const fx = ctx.effekte || L.Effekte, n = knotenEl(id), siegel = n && kann(n, 'querySelector') ? n.querySelector('.fo-siegel') || n : n;
      const tor = sicher(() => (holeK().thema.epochen || []).some(e => e.tor === id), false);   // das Tor öffnet die nächste Epoche: eigener Klang
      sicher(() => ctx.klang && (tor ? ctx.klang.spiele('tor') : ctx.klang.spiele('forschung')));
      kosten.forEach(p => sicher(() => ctx.hud && ctx.hud.plakette(p.id, `−${p.menge}`, { art: 'minus' })));
      if (!fx || !siegel) return;
      const pille = kosten[0] && ctx.hud && ctx.hud.pille ? sicher(() => ctx.hud.pille(kosten[0].id), null) : null;
      // Freie Bahn: erst waagrecht in der Gasse knapp unter den Pillen, dann am Knoten hinein (kreuzt weder Tafelkopf noch Epochenband)
      const gasse = pille && kann(pille, 'getBoundingClientRect') ? sicher(() => pille.getBoundingClientRect().bottom + 16, undefined) : undefined;
      if (pille) sicher(() => fx.flug({ von: pille, nach: siegel, inhalt: () => B().objekt(kosten[0].symbol, 26), anzahl: 3, abstand: 50, dauer: 520, bahn: 'gasse', gasse }));
      sicher(() => fx.siegel(siegel));
      if (kann(feld, 'querySelectorAll')) [...feld.querySelectorAll(`.fo-kante[data-von="${String(id).replace(/["\\]/g, '')}"]`)].slice(0, 3).forEach(p => sicher(() => licht(p, fx)));
    }
    function licht(p, fx) {
      if (!kann(p, 'cloneNode') || !p.parentNode) return;
      const lang = Number(p.getAttribute('data-laenge')) || 100, seg = Math.min(56, lang * 0.5), l = p.cloneNode(false);
      l.setAttribute('class', 'fo-licht');
      l.setAttribute('stroke-dasharray', `${seg} ${lang + seg}`);
      p.parentNode.insertBefore(l, p.nextSibling);
      if (!kann(l, 'animate')) { l.remove(); return; }
      const bilder = fx.wenig && fx.wenig() ? [{ opacity: 0, strokeDashoffset: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0, strokeDashoffset: 0 }]
        : [{ opacity: 0, strokeDashoffset: seg }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85, strokeDashoffset: -lang + seg * 0.2 }, { opacity: 0, strokeDashoffset: -lang - seg * 0.2 }];
      const a = l.animate(bilder, { duration: 560, delay: 560, easing: 'ease-in-out', fill: 'both' }), weg = () => l.remove();
      Promise.resolve(a && a.finished).then(weg, weg);
    }

    const tun = {
      melde: text => rahmen.meldung(text),
      gehe: (id, daten) => ctx.gehe(id, daten),
      erforsche(id) {
        const k = holeK(), f = D().knoten(k, id), c = C().knoten(k, f), tw = TW();
        if (!c.moeglich) { rahmen.meldung(c.grund); return; }
        const vorher = D().moeglich(k).map(x => x.satz), r = D().aktion(k, 'erforsche', id);
        if (!r.ok) { rahmen.meldung(r.grund); return; }
        const neu = D().moeglich(D().kontext()).map(x => x.satz).filter(s => !vorher.includes(s));
        nachAktion(`${tw.erforscht(f.name)}${neu.length ? ` ${tw.neuMoeglich(neu)}` : ''}`);
        effekt(id, c.kosten);
      },
      ziel(id) {
        const k = holeK(), f = D().knoten(k, id), loeschen = z.ziel === id, tw = TW();
        D().setzeZiel(k, loeschen ? null : id);
        nachAktion(loeschen ? tw.zielEntfernt : `${tw.zielGesetzt(f.name)} ${C().knoten(D().kontext(), f).grund || tw.alleErfuellt}`);
      }
    };

    // Tippen wie auf der Karte der Siedlung: Zeiger runter und hoch an derselben Stelle, Wischen (Bildlauf) wählt nichts. Tastatur: Enter und Leertaste.
    let runter = null;
    const idVon = ziel => { for (let n = ziel; n && n !== feld; n = n.parentNode) { const v = n.getAttribute && n.getAttribute('data-id'); if (v) return v; } return null; };
    feld.addEventListener('pointerdown', e => { runter = e.isPrimary === false || (e.button || 0) !== 0 ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, knoten: idVon(e.target) }; });
    feld.addEventListener('pointerup', e => { const d = runter; runter = null; if (d && d.knoten && d.id === e.pointerId && Math.hypot(e.clientX - d.x, e.clientY - d.y) <= WEG) waehle(d.knoten); });
    feld.addEventListener('pointercancel', () => { runter = null; });
    feld.addEventListener('keydown', e => { const id = e.key === 'Enter' || e.key === ' ' ? idVon(e.target) : null; if (id) { if (e.preventDefault) e.preventDefault(); waehle(id); } });

    holeK();
    rahmen.leiste(z.k);
    zeichneAlles(false);
    if (typeof g.requestAnimationFrame === 'function') g.requestAnimationFrame(() => zeigeKnoten(z.id));
    return { waehle, tun, zustand: z, tafel, schliesse() { rahmen.schliesse(); if (tafel) tafel.schliesse(); else wurzel.remove(); } };
  }

  L.Ansichten.forschung = { id: 'forschung', get titel() { return L.Texte.welt.menue.forschung; }, icon: 'forschung', dock: 40,
    buehne: { kamera: 'forschung', schleier: 'keine', marken: 'orte' }, zeige };
})(globalThis);
