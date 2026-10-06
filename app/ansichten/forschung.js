/* app/ansichten/forschung.js: die Ansicht «Forschung» (Architektur 7.8, Mockup docs/mockup/siedlung.html, AP-16). Der Baum (forschung-graph.js) zeigt Name, Bereich,
   Wissen «x von y» und Kosten jedes Knotens, auch die gesperrten Zweige samt Bedingung («Horizont»). Ein Tipp wählt einen Knoten, das Informationsfeld nennt Bereich, Wissen,
   Kosten, was er freischaltet und was fehlt. «Erforschen» geht über die Engine (Welt.erforsche, mit Probelauf), «Ziel setzen» merkt einen Knoten für die Statusleiste
   (zustand.welt[thema].ziel). Wissen wird nie verbraucht, bezahlt wird nur der Preis in Rohstoffen.
   ctx.daten: { wahl: Knoten-ID } wählt einen Knoten beim Öffnen (aus der Statusleiste, der Siedlung oder dem Menü des Abschlusses). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine;
  const WEG = 12;                                            // grösste Bewegung eines Tipps in Pixeln (wie die Karte der Siedlung)

  /** Wissensanzeige einer Bedingung: Striche bis 12, sonst eine Spur. */
  const wissenZeile = x => (x.braucht <= 12 ? B().stufenAnzeige(Math.min(x.hat, x.braucht), x.braucht, T().wissenKurz(Math.min(x.hat, x.braucht), x.braucht))
    : H('div.stufen', H('span.spur', H('i', { style: `width:${Math.round(100 * Math.min(1, x.hat / x.braucht))}%` })), H('span', T().wissenKurz(Math.min(x.hat, x.braucht), x.braucht))));

  /** Das Informationsfeld zu einem Knoten: { inhalt, aktionen }. z.ziel: das gesetzte Ziel (ID) oder null. */
  function infoKnoten(k, f, z, tun) {
    const t = T(), Bs = B(), c = C().knoten(k, f), erf = c.zustand === 'erforscht';
    if (c.zustand === 'horizont') {
      const e = D().epoche(k, f.epoche);
      return { inhalt: [Bs.kopf({ icon: 'schloss', titel: f.name, gruppe: t.zustand.horizont }), Bs.abschnitt(t.horizont, H('p', t.horizontText(e ? e.name || e.id : '')))],
        aktionen: [Bs.knopf({ text: t.nochNichtWaehlbar, gesperrt: true, name: 'ziel', klick: () => tun.melde(t.horizontMeldung) })] };
    }
    const frei = c.frei.length ? c.frei : [t.nichtsFrei];
    const inhalt = [Bs.kopf({ icon: erf ? 'haken' : c.zustand === 'moeglich' ? 'forschung' : 'schloss', titel: f.name, gruppe: t.zustand[c.zustand] + (c.tor ? `, ${t.torKurz}` : '') }),
      Bs.abschnitt(t.bereich, H('p', c.bereich ? [D().bereichName(c.bereich), D().bereichModule(c.bereich).length ? H('span.klein', ` · ${D().bereichModule(c.bereich).join(', ')}`) : ''] : t.alleBereiche)),
      Bs.abschnitt(c.tor ? t.wissenspunkte : t.wissen, c.wissen.map(wissenZeile)),
      Bs.abschnitt(erf ? t.bezahlt : t.kosten, Bs.kostenListe(c.kosten, { ohneVorrat: erf })),
      Bs.abschnitt(t.schaltetFrei, H('ul.liste', frei.map(s => H('li.zeile', Bs.ico('pfeil', 'klein'), H('span', s))))),
      erf ? '' : Bs.abschnitt(t.voraussetzung, Bs.bedingungsListe(c.bedingungen))];
    const aktionen = erf ? [Bs.knopf({ text: t.inDerSiedlung, icon: 'siedlung', name: 'siedlung', klick: () => tun.gehe('siedlung') })]
      : [Bs.knopf({ text: t.erforschen, icon: 'forschung', primaer: true, gesperrt: !c.moeglich, name: 'erforschen', klick: () => tun.erforsche(f.id) }),
        Bs.knopf({ text: z.ziel === f.id ? t.zielEntfernen : t.zielSetzen, icon: 'pfeil', name: 'ziel', klick: () => tun.ziel(f.id) })];
    return { inhalt, aktionen };
  }

  function zeige(huelle, ctx) {
    const k0 = D().kontext(), liste = k0 && Array.isArray(k0.thema.forschung) ? k0.thema.forschung : [];
    if (!liste.length) { huelle.replaceChildren(H('div.seite', H('h2', T().menue.forschung), H('div.kasten.hilfe', { role: 'status' }, k0 ? T().keineForschung : T().keineWelt))); return null; }
    const rahmen = L.WeltRahmen.oeffne(huelle, ctx, { voll: true, info: true, zeit: true }), t = T(), Graph = L.ForschungGraph;
    const feld = H('div.forschung-feld'), wunsch = ctx.daten.wahl || (D().ziel(k0) || {}).id;
    const z = { k: k0, id: liste.some(f => f.id === wunsch) ? wunsch : liste[0].id, ziel: null };
    rahmen.seite.append(feld);

    const holeK = () => { z.k = D().kontext(); const s = D().ziel(z.k); z.ziel = s && s.gesetzt ? s.id : null; return z.k; };
    const zeichneInfo = () => { const teil = infoKnoten(z.k, D().knoten(z.k, z.id), z, tun); B().setzeInfo(rahmen.info, teil.inhalt, teil.aktionen); };
    const knotenEl = () => (typeof feld.querySelector === 'function' ? feld.querySelector('.fo-knoten.gewaehlt') : null);
    function zeichneAlles(fokus) {
      feld.innerHTML = Graph.zeichne(Graph.modell(z.k, z.id));
      zeichneInfo();
      const n = knotenEl();
      if (n && fokus && typeof n.focus === 'function') n.focus({ preventScroll: true });
    }
    const scrolle = () => { const n = knotenEl(); if (n && typeof n.scrollIntoView === 'function') n.scrollIntoView({ block: 'nearest' }); };
    function waehle(id) {
      const doc = feld.ownerDocument, fokus = !!(doc && doc.activeElement && typeof feld.contains === 'function' && feld.contains(doc.activeElement));
      z.id = id;
      zeichneAlles(fokus);
    }
    function nachAktion(text) {
      const k = holeK();
      rahmen.leiste(k); rahmen.ziel(k);
      zeichneAlles(false);
      rahmen.meldung(text);
    }

    const tun = {
      melde: text => rahmen.meldung(text),
      gehe: (id, daten) => ctx.gehe(id, daten),
      erforsche(id) {
        const k = holeK(), f = D().knoten(k, id), c = C().knoten(k, f);
        if (!c.moeglich) { rahmen.meldung(c.grund); return; }
        const vorher = D().moeglich(k).map(x => x.satz), r = D().aktion(k, 'erforsche', id);
        if (!r.ok) { rahmen.meldung(r.grund); return; }
        const neu = D().moeglich(D().kontext()).map(x => x.satz).filter(s => !vorher.includes(s));
        nachAktion(`${t.erforscht(f.name)}${neu.length ? ` ${t.neuMoeglich(neu)}` : ''}`);
      },
      ziel(id) {
        const k = holeK(), f = D().knoten(k, id), loeschen = z.ziel === id;
        D().setzeZiel(k, loeschen ? null : id);
        nachAktion(loeschen ? t.zielEntfernt : `${t.zielGesetzt(f.name)} ${C().knoten(D().kontext(), f).grund || t.alleErfuellt}`);
      }
    };

    // Tippen wie auf der Karte: Zeiger runter und hoch an derselben Stelle, Wischen (Scrollen) wählt nichts. Tastatur: Enter und Leertaste.
    let runter = null;
    const idVon = ziel => { for (let n = ziel; n && n !== feld; n = n.parentNode) { const v = n.getAttribute && n.getAttribute('data-id'); if (v) return v; } return null; };
    feld.addEventListener('pointerdown', e => { runter = e.isPrimary === false || (e.button || 0) !== 0 ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, knoten: idVon(e.target) }; });
    feld.addEventListener('pointerup', e => { const d = runter; runter = null; if (d && d.knoten && d.id === e.pointerId && Math.hypot(e.clientX - d.x, e.clientY - d.y) <= WEG) waehle(d.knoten); });
    feld.addEventListener('pointercancel', () => { runter = null; });
    feld.addEventListener('keydown', e => { const id = e.key === 'Enter' || e.key === ' ' ? idVon(e.target) : null; if (id) { if (e.preventDefault) e.preventDefault(); waehle(id); } });

    holeK();
    rahmen.leiste(z.k); rahmen.ziel(z.k);
    zeichneAlles(false);
    scrolle();
    return { waehle, tun, zustand: z, schliesse() { rahmen.schliesse(); } };
  }

  L.Ansichten.forschung = { id: 'forschung', get titel() { return L.Texte.welt.menue.forschung; }, icon: 'forschung', menue: 40, zeige };
})(globalThis);
