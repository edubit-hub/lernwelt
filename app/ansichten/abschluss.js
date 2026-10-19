/* app/ansichten/abschluss.js: der Abschluss nach einer Runde oder nach dem Tagesauftrag als Logbuchseite (Architektur 6.9 und 7.8, docs/gestaltung-umbau.md 2.8,
   Vorbild docs/mockup/richtung-b szene-logbuch.js und effekte-b.js für die Seite, richtung-a a-abschluss.js für Ertragsflug und Lager).
   Die Seite: Kopf mit Datum, der Satz des Laufs (.kasten.ergebnis, er bleibt der erste Text in .abschluss), Stempel «Eingetragen», Ertragszeilen je Rohstoff
   (Objekt, Wort, Zahl), Themenstufen und Tor als kurze Zeilen, die Karte «Neu möglich» (.abschluss-neu) mit kleiner Karte, Ort und Knopf, darunter der grosse Knopf
   «Nächste Runde: Rechnen» (solange heute eine Runde offen ist, d.naechste), «Zur Siedlung» und leise «Zum Start» (Nachbesserung 2). Mit Bühne liegt die Seite als Tafel (aside.tafel.tafel-buch) in der Ansicht, quer rechts, hoch als Blatt von unten; die Kamera
   fährt zurück auf die Insel mit dem Lager im freien Teil. Der Ertrag fliegt auf der Gasse unter dem HUD zu den Pillen, die Zahl zählt hoch, das Lager wächst
   (Effekte, Klang und Bühne nur geschützt, nichts blockiert die Eingabe). Ohne Bühne bleibt eine schlichte Seite, ohne Siedlung der Platzhalter «Siedlung folgt».
   moeglich und neuMoeglich liefern weiter Sätze (lernen.js, siedlung.js und WeltDaten.moeglich hängen daran). Geschrieben wird nichts. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const SVG = 'http://www.w3.org/2000/svg';
  const T = () => L.Texte.abschluss, TS = () => L.Texte.abschlussseite, B = () => L.WeltBausteine;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const melde = f => { try { L.Fehlerlog.melde(f); } catch (e) { /* nur Protokoll */ } };
  const hat = (el, k) => !!el && String((el.getAttribute && el.getAttribute('class')) || '').split(/\s+/).includes(k);
  const vorfahr = (el, k) => { for (let n = el; n; n = n.parentNode) if (hat(n, k)) return n; return null; };
  const kind = (el, k) => (!el ? null : el.querySelector ? el.querySelector(`.${k}`) : el.finde ? el.finde(n => hat(n, k)) || null : null);
  const spiele = name => { try { if (L.Klang) L.Klang.spiele(name); } catch (e) { /* still */ } };

  /** Ein Würfel in drei Tönen: Mitte des Bodens (x, y), halbe Breite w, halbe Tiefe d, Höhe h. Die Klassen o, l und r färbt start.css. */
  function wuerfel(x, y, w, d, h, farbe) {
    const f = (klasse, punkte) => { const e = document.createElementNS(SVG, 'polygon'); e.setAttribute('class', `${farbe}-${klasse}`); e.setAttribute('points', punkte.map(p => p.join(',')).join(' ')); return e; };
    return [f('l', [[x - w, y - h], [x, y - h + d], [x, y + d], [x - w, y]]), f('r', [[x, y - h + d], [x + w, y - h], [x + w, y], [x, y + d]]),
      f('o', [[x, y - h - d], [x + w, y - h], [x, y - h + d], [x - w, y - h]])];
  }

  /** Eine kleine Insel aus Code (Platzhalter ohne Bühne, Startansicht): drei Körper auf einer Kachel, ohne Gesichter und ohne Beschriftung. */
  function insel() {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 240 150'); svg.setAttribute('class', 'insel'); svg.setAttribute('aria-hidden', 'true');
    const flaeche = (klasse, punkte) => { const e = document.createElementNS(SVG, 'polygon'); e.setAttribute('class', klasse); e.setAttribute('points', punkte); return e; };
    svg.append(flaeche('insel-meer', '120,6 234,72 120,138 6,72'), flaeche('insel-seite-l', '30,72 120,118 120,134 30,88'), flaeche('insel-seite-r', '120,118 210,72 210,88 120,134'),
      flaeche('insel-gras', '120,26 210,72 120,118 30,72'), ...wuerfel(122, 70, 14, 7, 30, 'kalk'), ...wuerfel(88, 84, 20, 10, 16, 'stein'), ...wuerfel(152, 86, 20, 10, 12, 'holz'));
    return svg;
  }

  /** Was das Welt-Thema jetzt zulässt: id → Satz («Werkstatt auf Stufe 2 ausbauen»). Probelauf der Aktionen auf einer Kopie, nichts ändert sich. */
  function moeglich(doc, thema) {
    const W = L.Welt, t = T(), aus = new Map(), welt = (doc.welt && doc.welt[thema.id]) || W.leer(), name = (liste, id) => (liste[id] && liste[id].name) || id;
    const geht = (art, id) => W.probe(art, doc.ledger, welt, thema, id);
    for (const id of Object.keys(thema.bauteile || {})) { const r = geht('baue', id); if (r.ok) aus.set(`b:${id}:${r.stufe}`, t.bauen(name(thema.bauteile, id), r.stufe)); }
    for (const id of Object.keys(thema.rezepte || {})) if (geht('veredle', id).ok) aus.set(`v:${id}`, t.veredeln(name(thema.rezepte, id)));
    for (const f of thema.forschung || []) if (geht('erforsche', f.id).ok) aus.set(`f:${f.id}`, t.forschen(f.name || f.id));
    return aus;
  }

  /** Die Sätze, die gegenüber dem Stand davor neu dazugekommen sind. */
  const neuMoeglich = (vorher, nachher) => [...nachher].filter(([id]) => !vorher.has(id)).map(([, satz]) => satz);

  /** Der Kopf des Textes fett, der Rest normal: «Tagesauftrag erledigt:» oder «Pause.». ohneErtrag: der Teil « Ertrag: …» steht nur für die Sprachausgabe
      (die Ertragszeilen zeigen ihn), im Text des Abschlusses bleibt er für Prüfungen und Vorlesen vollständig. */
  function kasten(art, text, ohneErtrag = false) {
    const i = text.search(/[:.] /), kopf = i < 0 ? text : text.slice(0, i + 1), rest = i < 0 ? '' : text.slice(i + 1), j = ohneErtrag ? rest.indexOf(' Ertrag: ') : -1;
    // Der Satz zum Festigen steht als eigene Zeile (Nachbesserung 2); der Text bleibt Zeichen für Zeichen gleich
    const satz = j < 0 ? rest : rest.slice(0, j), f = satz.search(/ [^.]*zum Festigen\./);
    const teil = f < 0 ? satz : [satz.slice(0, f), H('span.ergebnis-festigen', satz.slice(f))];
    return H(`div.kasten.${art}`, { role: 'status' }, H('b', kopf), j < 0 ? teil : [teil, H('span.nur-vorlesen', rest.slice(j))]);
  }

  /** Stempel «Eingetragen» als SVG-Text: Schrift auf Kreisbögen, Tinte mit kleinen Fehlstellen (Maske, Töne in abschluss.css). */
  function stempelBild(kurz) {
    const s = TS(), r = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }, z = v => v.toFixed(1);
    const loecher = Array.from({ length: 46 }, (_, k) => `<circle class="st-loch" cx="${z(r(k) * 200)}" cy="${z(r(k + 97) * 200)}" r="${z(.6 + r(k + 211) * 2)}"/>`).join('');
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="abs-st-o" d="M30 100a70 70 0 0 1 140 0"/><path id="abs-st-u" d="M21 100a79 79 0 0 0 158 0"/>`
      + `<mask id="abs-st-m" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect class="st-grund" width="200" height="200"/>${loecher}</mask></defs><g mask="url(#abs-st-m)">`
      + '<circle class="st-ring" cx="100" cy="100" r="94" stroke-width="5"/><circle class="st-ring" cx="100" cy="100" r="87" stroke-width="1.6"/><circle class="st-ring" cx="100" cy="100" r="55" stroke-width="1.6"/>'
      + `<text class="st-oben"><textPath href="#abs-st-o" startOffset="50%" text-anchor="middle">${s.stempel.toUpperCase()}</textPath></text>`
      + `<text class="st-unten"><textPath href="#abs-st-u" startOffset="50%" text-anchor="middle">${s.stempelUnten.toUpperCase()}</textPath></text>`
      + `<path class="st-stern" d="M100 66l5 26 26 8-26 8-5 26-5-26-26-8 26-8z"/>${kurz ? `<text class="st-datum" x="100" y="108" text-anchor="middle">${kurz}</text>` : ''}</g></svg>`;
  }

  /** Ertrag als Zeilen: { id (Rohstoff), symbol, name, menge }. Ohne Thema bleibt id leer (der Name ist dann das Fach). */
  const ertragZeilen = d => (Array.isArray(d.ertrag) ? d.ertrag : []).filter(x => x && x.menge > 0).map(x => {
    const e = d.thema ? Object.entries(d.thema.rohstoffe || {}).find(([, r]) => r && r.name === x.name) : null;
    return { id: e ? e[0] : null, symbol: e ? e[1].symbol || e[0] : null, name: x.name, menge: x.menge };
  });

  /** Wohin der nächste Schritt führt: { ort, text, tue, bild } aus einem Eintrag von WeltDaten.moeglich, null ohne passende Ansicht. */
  function zielVon(m, d, k) {
    const s = TS(), HU = L.Huelle, name = id => sicher(() => L.WeltDaten.name(k, id), id);
    if (m.art === 'f') return HU && HU.ansicht('forschung') ? { ort: s.ortForschung(sicher(() => k.thema.orte.forschung.name, '')), text: s.forschungAnsehen, bild: 'forschung',
      tue: () => (typeof d.forschung === 'function' ? d.forschung() : HU.gehe('forschung')) } : null;
    const bau = m.art === 'v' ? sicher(() => k.thema.rezepte[m.ziel].in, null) : m.ziel;
    return bau && HU && HU.ansicht('siedlung') && typeof d.siedlung === 'function' ? { ort: s.ortSiedlung, text: s.ansehen(name(bau)), bild: 'siedlung', tue: () => d.siedlung() } : null;
  }

  /** Karte «Neu möglich»: alle neuen Sätze, dazu Ort und Knopf des ersten, der zu einer Ansicht führt. Text für Sprachausgabe und Tests: «Neu möglich: A, B.» */
  function karte(d, k) {
    if (!Array.isArray(d.neu) || !d.neu.length) return '';
    const s = TS(), liste = k ? sicher(() => L.WeltDaten.moeglich(k).filter(m => d.neu.includes(m.satz)), []) : [];
    const ziel = liste.map(m => zielVon(m, d, k)).find(Boolean) || null;
    const bild = ziel && L.AbschlussSchritt ? L.AbschlussSchritt.kartenBild(ziel.bild) : H('span.neu-bild', { 'aria-hidden': 'true' });
    return H('div.abschluss-neu', ziel ? bild : '', H('div.neu-text', H('p.kicker', s.neu, H('span.nur-vorlesen', ':')), H('p.neu-titel', ` ${d.neu.join(', ')}`, H('span.nur-vorlesen', '.')),
      ziel ? H('p.neu-ort', ziel.ort) : ''), ziel ? H('button.knopf.neu-knopf', { type: 'button', onclick: () => ziel.tue() }, ziel.text) : '');
  }

  /** Freier Bereich der Bühne neben der Seite (quer) oder über dem Blatt (hoch), ohne HUD und Dock. Lage ohne Transformation (die Seite gleitet noch). */
  function frei(app, seite, hoch) {
    const W = g.innerWidth || 0, Hh = g.innerHeight || 0, q = sel => { const e = app && app.querySelector ? app.querySelector(sel) : null; return e && e.getBoundingClientRect ? e.getBoundingClientRect() : null; };
    if (!W || !Hh || !seite.offsetParent || !seite.offsetParent.getBoundingClientRect) return null;
    const hud = q('header.hud'), dock = q('nav.dock .dock-reihe'), p = seite.offsetParent.getBoundingClientRect();
    const f = { links: 0, oben: hud ? Math.round(hud.bottom) + 4 : 0, rechts: 0, unten: dock ? Math.round(Hh - dock.top) + 4 : 0 };
    if (hoch) f.unten = Math.max(f.unten, Math.round(Hh - p.top - seite.offsetTop) + 4); else f.rechts = Math.round(W - p.left - seite.offsetLeft) + 4;
    return f;
  }

  /** Kamera, Gleiten, Stempel und Ertragsflug. Alles ist Zugabe: ohne Bühne, Effekte oder Klang bleibt die Seite still stehen, nichts wartet auf einen Effekt. */
  function bewege(o) {
    const E = L.Effekte, hoch = sicher(() => L.Tafel.hoch(), false), wenig = sicher(() => E.wenig(), true), anim = el => !!el && typeof el.animate === 'function';
    if (o.regler) {
      sicher(() => o.regler.modus({ schleier: 'keine', ruhig: false, marken: 'keine' }));   // Ortsschilder sofort weg: die Seite und das Lager sprechen
      // Gleicher Zoom wie die Totale des Starts: die Marken behalten während der Fahrt ihre Grösse (--inv), die Kamera schiebt nur das Lager ins Bild
      const faktor = sicher(() => L.BuehneKamera.eintrag(o.thema, 'start', hoch)[1], null) || (hoch ? .98 : .84);
      // Lager und Tor (mit Schild) liegen frei neben der Seite: die Kamera zielt auf ihre Mitte, ohne Tor auf Lager und Insel
      const fahre = () => sicher(() => { const a = o.regler.ort('lager'), t = sicher(() => o.regler.ort('tor'), null), m = o.regler.ort('insel'), b2 = t || m;
        // quer etwas weiter und näher am Tor, damit sein Schild links der Seite frei steht
        const w = t && !hoch ? .6 : .5, f2 = t && !hoch ? faktor * .9 : faktor;
        o.regler.kamera(a && b2 ? { x: a.x + (b2.x - a.x) * w, y: a.y + (b2.y - a.y) * w + (t ? 30 : 0), faktor: f2, ankerX: .5, ankerY: hoch ? .55 : .5 } : 'start', { frei: frei(o.app, o.seite, hoch) }); });
      if (typeof g.requestAnimationFrame === 'function') g.requestAnimationFrame(fahre); else fahre();
    }
    if (anim(o.seite) && o.regler) sicher(() => o.seite.animate(wenig ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: hoch ? 'translateY(56px)' : 'translateX(56px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    if (o.stempel) {
      if (anim(o.stempel)) sicher(() => o.stempel.animate(wenig ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'rotate(-18deg) scale(1.7)', opacity: 0 }, { transform: 'rotate(-9deg) scale(.95)', opacity: 1, offset: .62 }, { transform: 'rotate(-10deg) scale(1)', opacity: 1 }],
        { duration: 360, delay: 120, easing: 'cubic-bezier(.3,0,.3,1)', fill: 'backwards' }));
      if (typeof g.setTimeout === 'function') g.setTimeout(() => spiele('stempel'), 340); else spiele('stempel');
    }
    // Die Karte meldet sich parallel zum Flug (die ganze Kette bleibt unter etwa zwei Sekunden): Siegel für «Neu möglich», Lichtpuls für «Als Nächstes»
    const karte = () => { if (!o.karte || !E) return; const neu = !hat(o.karte, 'als-naechstes'), bild = kind(o.karte, 'neu-bild');
      sicher(() => (neu && bild && typeof E.siegel === 'function' ? E.siegel(bild) : E.puls(o.karte, { warm: true }))); };
    if (o.karte) { if (typeof g.setTimeout === 'function') g.setTimeout(karte, 620); else karte(); }
    if (!E || typeof E.flug !== 'function') return;
    let erster = true;
    const fluege = o.zeilen.filter(z => z.id).map(z => {
      const pille = sicher(() => (o.hud && typeof o.hud.pille === 'function' ? o.hud.pille(z.id) : o.app && o.app.querySelector ? o.app.querySelector(`.hud .pille.res[data-rohstoff="${z.id}"]`) : null), null);
      if (!pille) return null;
      const zahl = kind(pille, 'res-zahl'), bis = zahl ? parseInt(zahl.textContent, 10) : NaN, von = Math.max(0, bis - z.menge), zaehlt = Number.isFinite(bis) && anim(zahl) && !wenig;
      if (zaehlt) zahl.textContent = String(von);                      // erst beim Eintreffen zählt die Pille hoch
      const n = Math.max(1, Math.min(4, Math.ceil(z.menge / 4)));
      return Promise.resolve(E.flug({ von: z.el, nach: kind(pille, 'res-objekt') || pille, anzahl: n, abstand: 90, dauer: 760, bahn: 'gasse',
        inhalt: () => H('span.abschluss-flug', { style: `--tint: var(--${z.symbol}-tint, var(--akzent-hell))` }, B() ? B().objekt(z.symbol, 26) : ''),
        beiAnkunft: i => {
          if (i) return;
          if (zaehlt) sicher(() => E.zaehle(zahl, von, bis, { dauer: 420 }));
          sicher(() => E.stoss(pille)); sicher(() => o.regler && o.regler.lagerWachsen(z.id));
          if (erster) { erster = false; spiele('muenze'); }
        } })).catch(() => { if (zahl && Number.isFinite(bis)) zahl.textContent = String(bis); });
    }).filter(Boolean);
    if (fluege.length) Promise.all(fluege).then(() => spiele('sammeln'));
  }

  /**
   * Zeichnet den Abschluss in `huelle`. d: { bericht (summiert), ertrag: [{ name, menge }], erledigt, neu: [Sätze «Neu möglich»], thema, weiter(), start(),
   * siedlung(), forschung(), hud? ({ pille(rohstoff) } aus ctx.hud) }. Abgebrochen: «Pause», Tagesauftrag fertig: der Text des Laufs, sonst der Text einer Runde.
   */
  function zeige(huelle, d) {
    const t = T(), s = TS(), b = d.bericht || {}, R = L.Rueckmeldung.texte, siedlung = !!(L.Huelle && L.Huelle.ansicht('siedlung'));
    const text = b.abgebrochen || b.zeitdeckel || d.erledigt ? R.abschluss(b, d.ertrag) : t.runde(b, d.ertrag);
    const regler = sicher(() => L.Huelle.buehne(), null) || null, flaeche = vorfahr(huelle, 'ansicht'), mitBuehne = !!(regler && d.thema && flaeche);
    const k = d.thema ? sicher(() => L.WeltDaten.kontext(undefined, d.thema), null) : null, tag = s.datum(sicher(() => L.Lernplan.heute(L.Zustand.hole()), null));
    const zeilen = ertragZeilen(d), tor = k ? sicher(() => L.WeltDaten.epocheStand(k).tor, null) : null;
    zeilen.forEach(z => { z.el = H('span.ertrag-muenze', { style: z.symbol ? `--tint: var(--${z.symbol}-tint, var(--akzent-hell))` : null }, z.symbol && B() ? B().objekt(z.symbol, 30) : ''); });
    const stempel = (b.aufgaben || 0) > 0 ? H('div.abschluss-stempel', { role: 'img', 'aria-label': s.stempelBeschriftung(tag && tag.lang) }) : null;
    if (stempel) stempel.innerHTML = stempelBild(tag && tag.kurz);
    // Ist nichts neu möglich, zeigt die Karte «Als Nächstes» den einen nächsten Schritt; die Knöpfe darunter doppeln ihn nicht
    // Nachbesserung 2: statt «Weiter üben» der eine grosse Knopf «Nächste Runde», solange heute eine Runde offen ist; «Zum Start» leise als Textknopf
    const runde = !d.erledigt && d.naechste && typeof d.naechste.tue === 'function' ? d.naechste : null;
    const neu = karte(d, k), naechst = !neu && k && L.AbschlussSchritt && !b.abgebrochen ? L.AbschlussSchritt.karte(k, d, { ohneKnopf: !!runde }) : null;
    const zurSiedlung = siedlung && d.siedlung && !naechst ? [s.zurSiedlung, d.siedlung] : null;
    const rundeKnopf = runde ? H('button.knopf.primaer.gross.abschluss-runde', { type: 'button', onclick: () => runde.tue(),
      'aria-label': `${s.naechsteRunde(runde.name)}, ${s.rundeUmfang(runde.aufgaben, runde.minuten)}` },
      H('b', s.naechsteRunde(runde.name)), H('small', s.rundeUmfang(runde.aufgaben, runde.minuten))) : '';
    const dahin = [zurSiedlung, [s.zumStart, d.start, '.leise']];
    const torZeile = tor && L.AbschlussSchritt ? L.AbschlussSchritt.torZeile(tor) : '';
    const unterwegs = [...(b.stufen || []).map(x => H('p.abschluss-stufe', x.text)), torZeile].filter(Boolean);
    const platzhalter = !siedlung && !regler ? H('div.kachel.abschluss-siedlung', insel(), H('div', H('h3', t.siedlungFolgt), H('p.klein', t.siedlungText))) : '';
    const abschluss = H(`div.abschluss${zeilen.length ? '' : '.ohne-ertrag'}`, kasten(`${b.abgebrochen ? 'hilfe' : 'ok'}.ergebnis`, text, zeilen.length > 0), stempel || '',
      zeilen.length ? H('section.abschluss-ertrag', H('p.kicker', s.ertrag), zeilen.map(z => H('div.ertrag-zeile', { 'data-rohstoff': z.id, 'aria-label': s.ertragZeile(z.name, z.menge) },
        z.el, H('span.ertrag-wort', z.name), H('span.ertrag-linie', { 'aria-hidden': 'true' }), H('b.ertrag-zahl', `+${z.menge}`)))) : '',
      unterwegs.length ? H('section.abschluss-unterwegs', H('p.kicker', s.unterwegs), unterwegs) : '', neu || (naechst ? naechst.el : ''), platzhalter,
      H('div.abschluss-knoepfe', { role: 'group', 'aria-label': s.knoepfe }, rundeKnopf,
        dahin.filter(Boolean).map(([wort, tue, art]) => H(`button.knopf${art || ''}`, { type: 'button', onclick: () => tue() }, wort))));
    // Eigener Titel ohne Doppelpunkt; der Satz des Laufs bleibt der erste Text in .abschluss (sein Kopf nur noch für Vorleser)
    const titel = b.abgebrochen ? s.titelPause : b.zeitdeckel ? s.titelZeit : d.erledigt ? s.titelTag : s.titelRunde;
    const seite = H('div.abschluss-seite', H('p.kicker.abschluss-kicker', s.kicker(tag && tag.lang)), H('h2.abschluss-titel', titel), abschluss);
    const tafel = mitBuehne ? H('aside.tafel.tafel-buch.abschluss-tafel.an', { 'aria-label': s.kicker(tag && tag.lang) }, H('div.tafel-griff', { 'aria-hidden': 'true' }), seite) : null;
    if (mitBuehne) flaeche.classList.add('abschluss-ansicht');
    huelle.replaceChildren(tafel || seite);
    try { bewege({ app: vorfahr(huelle, 'app'), seite: tafel || seite, regler: mitBuehne ? regler : null, thema: d.thema, hud: d.hud || null, stempel, karte: neu || (naechst && naechst.el) || null, zeilen }); } catch (f) { melde(f); }
  }

  L.Abschluss = { zeige, insel, moeglich, neuMoeglich, kasten };
})(globalThis);
