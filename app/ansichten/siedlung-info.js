/* app/ansichten/siedlung-info.js: das Informationsfeld der Siedlung (Architektur 7.1 und 7.8, Mockup docs/mockup/siedlung.html, AP-16).
   Es zeigt zu jedem Bauplatz, was eine Aktion kostet, was sie bringt und was sie voraussetzt, bevor das Kind sie ausführt:
     gebauter Platz: Stufe, Wirkung, Ausbau mit Kosten und Folge, Veredeln und Tauschen als Zeilen, Voraussetzung, Knöpfe «Ausbauen» und «Verschieben»
     freier Platz:   das gewählte Gebäude mit Wirkung, Kosten und Voraussetzung, darunter die anderen zur Wahl, Knopf «Hier bauen» (zwei Berührungen: Platz, Knopf)
     gesperrter Platz: was dort gebaut werden kann und was zur Öffnung der Epoche fehlt
   zeichne(info, k, wahl, z, tun): k = Kontext (WeltDaten), wahl = Auswahl der Karte, z = { kand, verschiebe }, tun = Rückrufe der Ansicht. Ein gesperrter Knopf bleibt
   antippbar: die Ansicht meldet dann, was fehlt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine;
  const vorschau = (k, id, st) => (L.Render && L.Render.vorschau ? L.Render.vorschau(k.thema, id, st) : '');
  const posten = p => `${p.menge} ${p.name}`;
  const rezepteIn = (k, id) => Object.entries(k.thema.rezepte || {}).filter(([, r]) => r.in === id).map(([rid]) => rid);
  const absatz = saetze => saetze.map(s => H('p', s));

  /** Gebäude, die auf einem freien Platz zur Wahl stehen: noch nicht gebaut, Epoche offen, zuerst die, die sich jetzt bauen lassen. */
  function kandidaten(k) {
    const l = D().bauteile(k).filter(([id, b]) => D().stufe(k, id) < 1 && L.Welt.epocheOffen(k.thema, k.stand, b.epoche)).map(([id, b]) => ({ id, name: b.name || id, bn: C().bauen(k, id) }));
    return [...l.filter(x => x.bn.moeglich), ...l.filter(x => !x.bn.moeglich)];
  }

  /** Veredeln: je Rezept des Gebäudes eine Zeile mit Ergebnis, Kosten und den Knöpfen «Veredeln» und «Alles». */
  const veredelnZeilen = (k, id, tun) => rezepteIn(k, id).map(rid => {
    const v = C().veredeln(k, rid), t = T();
    return H('div.aktion-zeile', H('div.aktion-text', H('b', t.posten(v.name, v.menge)), H('span.klein', t.aus(C().aufzaehlung(v.aus.map(posten)))), v.ok ? '' : H('span.klein.fehler-text', v.grund)),
      H('div.aktion-knoepfe', B().knopf({ text: t.veredeln, gesperrt: !v.ok, name: `veredeln:${rid}`, klick: () => tun.veredle(rid, 1) }),
        v.max >= 2 ? B().knopf({ text: t.alles(v.max), name: `veredeln-alles:${rid}`, klick: () => tun.veredle(rid, v.max) }) : ''));
  });

  /** Tauschen: je Geschäft eine Zeile mit Kosten und Ertrag. */
  const tauschZeilen = (k, id, tun) => (k.thema.bauteile[id].tausch || []).map((_, nr) => {
    const x = C().tausch(k, id, nr), t = T();
    return H('div.aktion-zeile', H('div.aktion-text', H('b', t.tauschText(C().aufzaehlung(x.gib.map(posten)), C().aufzaehlung(x.erhalte.map(posten)))), x.ok ? '' : H('span.klein.fehler-text', x.grund)),
      H('div.aktion-knoepfe', B().knopf({ text: t.tauschen, gesperrt: !x.ok, name: `tauschen:${nr}`, klick: () => tun.tausche(id, nr, 1) }),
        x.max >= 2 ? B().knopf({ text: t.alles(x.max), name: `tauschen-alles:${nr}`, klick: () => tun.tausche(id, nr, x.max) }) : ''));
  });

  function gebaut(k, w, tun) {
    const id = w.bauteil, b = k.thema.bauteile[id], st = D().stufe(k, id), bn = C().bauen(k, id), t = T(), B_ = B();
    const folge = bn.voll ? '' : C().danach(k, id, bn.stufe);
    const inhalt = [B_.kopf({ bild: vorschau(k, id, st), titel: b.name || id, gruppe: C().gruppe(b), zusatz: B_.stufenAnzeige(st, bn.max, t.stufeVon(st, bn.max)) }),
      B_.abschnitt(t.wirkung, absatz(C().wirkung(k, id, st))),
      bn.voll ? B_.abschnitt(t.ausbau, H('p', t.hoechsteStufe)) : B_.abschnitt(t.ausbauAuf(bn.stufe), B_.kostenListe(bn.kosten), folge ? H('p.hinweis', folge) : ''),
      b.wirkung === 'rezept' && rezepteIn(k, id).length ? B_.abschnitt(t.veredeln, veredelnZeilen(k, id, tun)) : '',
      b.wirkung === 'tausch' && Array.isArray(b.tausch) ? B_.abschnitt(t.tauschen, tauschZeilen(k, id, tun)) : '',
      bn.voll ? '' : B_.abschnitt(t.voraussetzung, bn.bedingungen.length ? B_.bedingungsListe(bn.bedingungen) : H('p.klein', t.keineVoraussetzung))];
    const aktionen = [bn.voll ? '' : B_.knopf({ text: t.ausbauen, icon: 'hoch', primaer: true, gesperrt: !bn.moeglich, name: 'ausbauen', klick: () => tun.ausbau(id) }),
      B_.knopf({ text: t.verschieben, icon: 'pfeil', name: 'verschieben', klick: () => tun.verschieben(id) })];
    return { inhalt, aktionen };
  }

  function frei(k, w, z, tun) {
    const t = T(), B_ = B(), kand = kandidaten(k), wahl = kand.find(x => x.id === z.kand) || kand[0];
    if (!wahl) {
      return { inhalt: [B_.kopf({ icon: 'siedlung', titel: t.freierPlatz, gruppe: t.bauplatz(w.platz + 1) }), H('p', t.nichtsZuBauen)],
        aktionen: [B_.knopf({ text: t.zumForschungsbaum, icon: 'forschung', primaer: true, name: 'forschung', klick: () => tun.gehe('forschung') })] };
    }
    const b = k.thema.bauteile[wahl.id], bn = wahl.bn;
    const liste = H('ul.liste.wahlliste', kand.map(x => H('li', H('button.wahlzeile', { type: 'button', 'data-bauteil': x.id, 'aria-pressed': String(x.id === wahl.id), onclick: () => tun.kandidat(x.id) },
      H('span', x.name), B_.ico(x.bn.moeglich ? 'haken' : 'schloss', `klein.${x.bn.moeglich ? 'ok' : 'leise'}`)))));
    const inhalt = [B_.kopf({ bild: vorschau(k, wahl.id, 1), titel: wahl.name, gruppe: [C().gruppe(b), t.bauplatz(w.platz + 1)].filter(Boolean).join(' · '), zusatz: B_.stufenAnzeige(0, bn.max, t.stufeNach(1, bn.max)) }),
      B_.abschnitt(t.wirkung, absatz(C().wirkung(k, wahl.id, 1))), B_.abschnitt(t.kosten, B_.kostenListe(bn.kosten)),
      B_.abschnitt(t.voraussetzung, B_.bedingungsListe(bn.bedingungen)), kand.length > 1 ? B_.abschnitt(t.weitere, liste) : ''];
    return { inhalt, aktionen: [B_.knopf({ text: t.hierBauen, icon: 'hoch', primaer: true, gesperrt: !bn.moeglich, name: 'bauen', klick: () => tun.baue(wahl.id, w.platz) })] };
  }

  function gesperrt(k, w, tun) {
    const t = T(), B_ = B(), e = D().epoche(k, w.epoche), name = e ? e.name || e.id : String(w.epoche), tor = e && D().knoten(k, e.tor);
    const beispiele = D().bauteile(k).filter(([, b]) => b.epoche === w.epoche).slice(0, 2).map(([, b]) => b.name);
    const zeilen = [C().epocheZeile(k, w.epoche), ...(tor ? C().knoten(k, tor).bedingungen : [])].filter(Boolean);
    return { inhalt: [B_.kopf({ icon: 'schloss', titel: t.gesperrterPlatz(name), gruppe: t.nochGesperrt }),
      B_.abschnitt(t.wirkung, H('p', t.gesperrtWirkung(name, C().aufzaehlung(beispiele)))), B_.abschnitt(t.kosten, H('p.klein', t.kostenSpaeter)), B_.abschnitt(t.voraussetzung, B_.bedingungsListe(zeilen))],
    aktionen: [B_.knopf({ text: t.zumForschungsbaum, icon: 'forschung', primaer: true, name: 'forschung', klick: () => tun.gehe('forschung', tor ? { wahl: tor.id } : undefined) })] };
  }

  /** Verschieben: das Gebäude steht fest, der nächste Tipp auf einen freien Platz setzt es dorthin. */
  function verschieben(k, id, tun) {
    const t = T(), B_ = B(), b = k.thema.bauteile[id];
    return { inhalt: [B_.kopf({ bild: vorschau(k, id, D().stufe(k, id)), titel: b.name || id, gruppe: C().gruppe(b) }), B_.abschnitt(t.verschieben, H('p', t.verschiebeHinweis(b.name || id)), H('p.hinweis', t.verschiebenKostenlos))],
      aktionen: [B_.knopf({ text: t.abbrechen, name: 'abbrechen', klick: tun.abbrechen })] };
  }

  /** Zeichnet das Informationsfeld neu. wahl ist die Auswahl der Karte ({ platz, art, bauteil, stufe, epoche }) oder null. */
  function zeichne(info, k, wahl, z, tun) {
    const t = T();
    let teil;
    if (z.verschiebe) teil = verschieben(k, z.verschiebe, tun);
    else if (!wahl) teil = { inhalt: [H('p.klein', t.platzWaehlen)], aktionen: [] };
    else if (wahl.art === 'gebaut') teil = gebaut(k, wahl, tun);
    else if (wahl.art === 'frei') teil = frei(k, wahl, z, tun);
    else teil = gesperrt(k, wahl, tun);
    B().setzeInfo(info, teil.inhalt, teil.aktionen);
  }

  L.SiedlungInfo = { zeichne, kandidaten };
})(globalThis);
