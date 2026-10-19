/* app/ansichten/siedlung-info.js: der Inhalt der Bauplatz-Tafel (docs/gestaltung-umbau.md 2.9 und 3.8, Vorbild docs/mockup/richtung-a/a-siedlung.js
   und das Bauplatz-Panel aus docs/mockup/richtung-c/app-c.js). Zu jedem Platz steht vor der Aktion, was sie kostet, was sie bringt und was sie voraussetzt:
     gebauter Platz:   Bild, Stufe, Wirkung, Ausbau mit Kosten («du hast n») und Folge, Veredeln und Tauschen als Zeilen, Voraussetzung, «Ausbauen» und «Verschieben»
     freier Platz:     die Gebäude zur Wahl, das gewählte mit Bild, Wirkung, Kosten und Voraussetzung, Knopf «Hier bauen» (zwei Berührungen: Platz, Knopf)
     gesperrter Platz: was dort später steht und der Weg dahin (Wissen, Tor erforschen, Platz offen)
   Fehlt etwas, steht statt eines Sperrtexts ein Weg mit höchstens drei Schritten und genau einem Handlungsknopf (WeltWeg). Fehlt Material, heisst der Knopf
   nach dem Fach des Rohstoffs («Rechnen üben») und führt zum Tagesauftrag. Ein gesperrter Aktionsknopf bleibt antippbar, die Ansicht meldet dann, was fehlt.
   zeichne(info, k, wahl, z, tun): k = Kontext (WeltDaten), wahl = Auswahl der Bühne oder Karte, z = { kand, verschiebe }, tun = Rückrufe der Ansicht. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.welt, S = () => L.Texte.siedlungsseite, D = () => L.WeltDaten, C = () => L.WeltBedingungen, B = () => L.WeltBausteine;
  const vorschau = (k, id, st) => (L.Render && L.Render.vorschau ? L.Render.vorschau(k.thema, id, st) : '');
  const posten = p => `${p.menge} ${p.name}`;
  const rezepteIn = (k, id) => Object.entries(k.thema.rezepte || {}).filter(([, r]) => r.in === id).map(([rid]) => rid);
  const absatz = saetze => saetze.map(s => H('p', s));

  /** Gebäude, die auf einem freien Platz zur Wahl stehen: noch nicht gebaut, Epoche offen, zuerst die, die sich jetzt bauen lassen. */
  function kandidaten(k) {
    const l = D().bauteile(k).filter(([id, b]) => D().stufe(k, id) < 1 && L.Welt.epocheOffen(k.thema, k.stand, b.epoche)).map(([id, b]) => ({ id, name: b.name || id, bn: C().bauen(k, id) }));
    return [...l.filter(x => x.bn.moeglich), ...l.filter(x => !x.bn.moeglich)];
  }

  /** Fach, aus dem ein Rohstoff kommt; ein Gut über die Rohstoffe seines Rezepts. null, wenn keines bekannt ist. */
  function fachVon(k, id, tiefe = 0) {
    const r = (k.thema.rohstoffe || {})[id], rz = (k.thema.rezepte || {})[id];
    if (r && r.fach) return r.fach;
    if (rz && rz.aus && tiefe < 3) for (const roh of Object.keys(rz.aus)) { const f = fachVon(k, roh, tiefe + 1); if (f) return f; }
    return null;
  }

  /** Handlungsknopf «Rechnen üben» (Wort nach Fach), ohne Fach «Zum Tagesauftrag». Er führt über die Ansicht zum Tagesauftrag. */
  const uebenKnopf = (fach, tun) => ({ text: (fach && L.Texte.huelle.ueben[fach]) || S().zumTagesauftrag, name: 'ueben', aktion: () => tun.ueben(fach) });

  /** Ein fehlendes Gut, das dieses Gebäude selbst veredeln kann: Knopf «Ziegel veredeln» statt «Rechnen üben». */
  function veredelnKnopf(k, id, fehlt, tun) {
    if (!id || !fehlt || !rezepteIn(k, id).includes(fehlt.id) || D().stufe(k, id) < 1) return null;
    const v = C().veredeln(k, fehlt.id);
    return v.ok ? { text: S().gutVeredeln(v.name), name: `veredeln:${fehlt.id}`, aktion: () => tun.veredle(fehlt.id, 1) } : null;
  }

  /** Der Weg zum Bauen oder Ausbauen aus Voraussetzungen und Kosten: { el, knopf }. Der Knopf zeigt auf den ersten offenen Schritt und steht im festen Fuss
      der Tafel (an der Stelle des gesperrten Hauptknopfs), damit er nie unter der Kante liegt. */
  function weg(k, bn, titel, tun, id) {
    const w = L.WeltWeg.ausBedingungen(k, bn.bedingungen, bn.kosten), erster = w.schritte.find(s => !s.erledigt), art = erster && erster.weg ? erster.weg.art : null;
    let knopf = w.knopf;
    if (art === 'material') { const fehlt = bn.kosten.find(p => p.fehlt > 0); knopf = veredelnKnopf(k, id, fehlt, tun) || uebenKnopf(fehlt ? fachVon(k, fehlt.id) : null, tun); }
    else if (art === 'wissen') knopf = uebenKnopf(erster.weg.bereich ? String(erster.weg.bereich).split('.')[0] : null, tun);
    else if (knopf && knopf.ansicht) { const { ansicht, daten } = knopf; knopf = { ...knopf, aktion: () => tun.gehe(ansicht, daten) }; }
    return { el: L.WeltWeg.baue({ titel, schritte: w.schritte, fortschritt: w.fortschritt, knopf, aussen: true }), knopf: L.WeltWeg.knopfEl(knopf) };
  }

  /** Voraussetzung: erfüllt als kurze Liste mit Haken, sonst als Weg. Ohne WeltWeg die Liste. → { el, knopf } */
  function voraussetzung(k, bn, titel, tun, id) {
    if (bn.moeglich || !L.WeltWeg) return { el: B().abschnitt(T().voraussetzung, bn.bedingungen.length ? B().bedingungsListe(bn.bedingungen) : H('p.klein', T().keineVoraussetzung)), knopf: '' };
    const w = weg(k, bn, titel, tun, id);
    return { el: B().abschnitt(T().voraussetzung, w.el), knopf: w.knopf, wegEl: w.el };
  }
  const kosten = liste => (B().kosten ? B().kosten(liste, { duHast: true }) : B().kostenListe(liste));

  /** Veredeln: je Rezept des Gebäudes eine Zeile mit Ergebnis, Kosten und den Knöpfen «Veredeln» und «Alles». */
  const veredelnZeilen = (k, id, tun) => rezepteIn(k, id).map(rid => {
    const v = C().veredeln(k, rid), t = T();
    return H('div.aktion-zeile', B().objekt ? B().objekt(rid, 28) : '', H('div.aktion-text', H('b', t.posten(v.name, v.menge)), H('span.klein', t.aus(C().aufzaehlung(v.aus.map(posten)))), v.ok ? '' : H('span.klein.warm-text', v.grund)),
      H('div.aktion-knoepfe', B().knopf({ text: t.veredeln, gesperrt: !v.ok, name: `veredeln:${rid}`, klick: () => tun.veredle(rid, 1) }),
        v.max >= 2 ? B().knopf({ text: t.alles(v.max), name: `veredeln-alles:${rid}`, klick: () => tun.veredle(rid, v.max) }) : ''));
  });

  /** Tauschen: je Geschäft eine Zeile mit Kosten und Ertrag. */
  const tauschZeilen = (k, id, tun) => (k.thema.bauteile[id].tausch || []).map((_, nr) => {
    const x = C().tausch(k, id, nr), t = T();
    return H('div.aktion-zeile', H('div.aktion-text', H('b', t.tauschText(C().aufzaehlung(x.gib.map(posten)), C().aufzaehlung(x.erhalte.map(posten)))), x.ok ? '' : H('span.klein.warm-text', x.grund)),
      H('div.aktion-knoepfe', B().knopf({ text: t.tauschen, gesperrt: !x.ok, name: `tauschen:${nr}`, klick: () => tun.tausche(id, nr, 1) }),
        x.max >= 2 ? B().knopf({ text: t.alles(x.max), name: `tauschen-alles:${nr}`, klick: () => tun.tausche(id, nr, x.max) }) : ''));
  });

  function gebaut(k, w, tun) {
    const id = w.bauteil, b = k.thema.bauteile[id], st = D().stufe(k, id), bn = C().bauen(k, id), t = T(), B_ = B(), name = b.name || id;
    const folge = bn.voll ? '' : C().danach(k, id, bn.stufe), vs = bn.voll ? { el: '', knopf: '' } : voraussetzung(k, bn, S().wegAusbau(name, bn.stufe), tun, id);
    // Was das Gebäude jetzt tut (Veredeln, Tauschen) steht oben, dann der Ausbau mit Kosten und Voraussetzung, die Wirkung zuletzt.
    // Schlussprüfung: Ist der Ausbau gesperrt, steht der nummerierte Weg gleich unter dem Kopf, im Abschnitt des Ausbaus vor den Kosten
    // (keine Überschrift «Voraussetzung» ohne Inhalt am unteren Rand); der Knopf im Fuss führt zu seinem ersten offenen Schritt.
    const gesperrt = !bn.voll && !bn.moeglich && vs.wegEl;
    if (gesperrt && vs.wegEl.classList) vs.wegEl.classList.add('kompakt');
    const ausbau = bn.voll ? B_.abschnitt(t.ausbau, H('p', t.hoechsteStufe))
      : B_.abschnitt(t.ausbauAuf(bn.stufe), gesperrt ? vs.wegEl : '', kosten(bn.kosten), folge ? H('p.hinweis', folge) : '');
    const tut = [b.wirkung === 'rezept' && rezepteIn(k, id).length ? B_.abschnitt(t.veredeln, veredelnZeilen(k, id, tun)) : '',
      b.wirkung === 'tausch' && Array.isArray(b.tausch) ? B_.abschnitt(t.tauschen, tauschZeilen(k, id, tun)) : ''];
    const inhalt = [B_.kopf({ bild: vorschau(k, id, st), titel: name, gruppe: C().gruppe(b), zusatz: B_.stufenAnzeige(st, bn.max, t.stufeVon(st, bn.max)) }),
      ...(gesperrt ? [ausbau, ...tut] : [...tut, ausbau, vs.el]), B_.abschnitt(t.wirkung, absatz(C().wirkung(k, id, st)))];
    // Ist der Ausbau gesperrt, steht an seiner Stelle der Knopf zum fehlenden Schritt
    const haupt = bn.voll ? '' : !bn.moeglich && vs.knopf ? vs.knopf : B_.knopf({ text: t.ausbauen, icon: 'hoch', primaer: true, gesperrt: !bn.moeglich, name: 'ausbauen', klick: () => tun.ausbau(id) });
    return { inhalt, aktionen: [haupt, B_.knopf({ text: t.verschieben, icon: 'pfeil', name: 'verschieben', klick: () => tun.verschieben(id) })] };
  }

  function frei(k, w, z, tun) {
    const t = T(), s = S(), B_ = B(), kand = kandidaten(k), wahl = kand.find(x => x.id === z.kand) || kand[0];
    if (!wahl) {
      return { inhalt: [B_.kopf({ icon: 'siedlung', titel: t.freierPlatz, gruppe: t.bauplatz(w.platz + 1) }), H('p', t.nichtsZuBauen)],
        aktionen: [B_.knopf({ text: t.zumForschungsbaum, icon: 'forschung', primaer: true, name: 'forschung', klick: () => tun.gehe('forschung') })] };
    }
    const b = k.thema.bauteile[wahl.id], bn = wahl.bn;
    const liste = H('div.wahlliste', { role: 'group', 'aria-label': s.zurWahl }, kand.map(x => H(`button.wahlzeile${x.bn.moeglich ? '.baubar' : ''}`,
      { type: 'button', 'data-bauteil': x.id, 'aria-pressed': String(x.id === wahl.id), onclick: () => tun.kandidat(x.id) }, H('b', x.name), H('small', x.bn.moeglich ? s.baubar : s.spaeter))));
    const vs = voraussetzung(k, bn, s.wegBauen(wahl.name), tun, null), pl = D().plaetzeStand(k), e = D().epocheStand(k);
    // Kosten stehen gleich unter der Wahl, damit keine Zeile unter der Kante liegt; die Wirkung zuletzt
    const inhalt = [B_.kopf({ bild: vorschau(k, wahl.id, 1), titel: wahl.name, gruppe: [C().gruppe(b), t.bauplatz(w.platz + 1)].filter(Boolean).join(' · '), zusatz: B_.stufenAnzeige(0, bn.max, t.stufeNach(1, bn.max)) }),
      kand.length > 1 ? B_.abschnitt(s.zurWahl, liste) : '',
      B_.abschnitt(t.kosten, kosten(bn.kosten)), vs.el, B_.abschnitt(t.wirkung, absatz(C().wirkung(k, wahl.id, 1))),
      e ? H('p.klein.platz-stand', t.platzStand(e.nr, pl.belegt, pl.gesamt)) : ''];
    const bauen = B_.knopf({ text: t.hierBauen, icon: 'hoch', primaer: true, gesperrt: !bn.moeglich, name: 'bauen', klick: () => tun.baue(wahl.id, w.platz) });
    return { inhalt, aktionen: [!bn.moeglich && vs.knopf ? vs.knopf : bauen] };
  }

  /** Weg zu einem gesperrten Platz: der offene Schritt vor dem Tor (Wissen oder Epoche), das Tor erforschen, der Platz ist offen. */
  /** Nachbesserung 2: «Wissen sammeln» (darunter «Wissen 6 von 6»), «Tor erforschen» (darunter nur, was an Material fehlt), «Der Bauplatz ist offen».
      Der Knopf zeigt auf den ersten offenen Teil: Wissen oder Material üben, sonst das Tor ansehen. */
  function torWeg(k, name, tor, beispiele, tun) {
    const s = S(), h = L.Texte.huelle, vor = C().knoten(k, tor).bedingungen, w = D().wissenStand(k, tor)[0] || null;
    const v = vor.find(x => !x.ok) || vor.filter(x => x.weg && x.weg.art === 'wissen').pop() || null, wissen = !!(v && v.weg && v.weg.art === 'wissen');
    const fehlt = D().posten(k, tor.kosten).filter(p => p.fehlt > 0), vorOk = !v || v.ok;
    const schritte = [v ? (wissen ? { text: s.wissenSammeln, unter: w ? T().torWissen(Math.min(w.hat, w.braucht), w.braucht) : '', erledigt: v.ok } : { text: v.text, erledigt: v.ok }) : null,
      { text: s.torErforschen(tor.name), unter: vorOk && fehlt.length ? s.torMaterial(D().standText(fehlt)) : '', erledigt: false },
      { text: s.platzOffen, erledigt: false }].filter(Boolean);
    let knopf = { text: h.torAnsehen, name: 'forschung', aktion: () => tun.gehe('forschung', { wahl: tor.id }) };
    if (v && !v.ok && wissen) knopf = uebenKnopf(v.weg.bereich ? String(v.weg.bereich).split('.')[0] : null, tun);
    else if (v && !v.ok && v.weg && v.weg.art === 'epoche' && v.weg.ziel) knopf = { text: h.torAnsehen, name: 'forschung', aktion: () => tun.gehe('forschung', { wahl: v.weg.ziel }) };
    else if (fehlt.length) knopf = uebenKnopf(fachVon(k, fehlt[0].id), tun);
    return { el: L.WeltWeg.baue({ titel: s.wegEpoche(name), schritte, knopf, aussen: true }), knopf: L.WeltWeg.knopfEl(knopf) };
  }

  function gesperrt(k, w, tun) {
    const t = T(), B_ = B(), e = D().epoche(k, w.epoche), name = e ? e.name || e.id : String(w.epoche), tor = e && D().knoten(k, e.tor);
    const beispiele = D().bauteile(k).filter(([, b]) => b.epoche === w.epoche).slice(0, 2).map(([, b]) => b.name);
    const zeilen = [C().epocheZeile(k, w.epoche), ...(tor ? C().knoten(k, tor).bedingungen : [])].filter(Boolean);
    const weg = tor && L.WeltWeg ? torWeg(k, name, tor, beispiele, tun) : null;   // der Knopf des Wegs steht im festen Fuss
    return { inhalt: [B_.kopf({ icon: 'schloss', titel: t.gesperrterPlatz(name), gruppe: t.nochGesperrt }),
      B_.abschnitt(t.voraussetzung, weg ? weg.el : B_.bedingungsListe(zeilen)), B_.abschnitt(t.wirkung, H('p', t.gesperrtWirkung(name, C().aufzaehlung(beispiele))))],
    aktionen: [weg && weg.knopf ? weg.knopf : B_.knopf({ text: t.zumForschungsbaum, icon: 'forschung', name: 'forschung', klick: () => tun.gehe('forschung', tor ? { wahl: tor.id } : undefined) })] };
  }

  /** Verschieben: das Gebäude steht fest, der nächste Tipp auf einen freien Platz setzt es dorthin. */
  function verschieben(k, id, tun) {
    const t = T(), B_ = B(), b = k.thema.bauteile[id];
    return { inhalt: [B_.kopf({ bild: vorschau(k, id, D().stufe(k, id)), titel: b.name || id, gruppe: C().gruppe(b) }), B_.abschnitt(t.verschieben, H('p', t.verschiebeHinweis(b.name || id)), H('p.hinweis', t.verschiebenKostenlos))],
      aktionen: [B_.knopf({ text: t.abbrechen, name: 'abbrechen', klick: tun.abbrechen })] };
  }

  /** Zeichnet die Tafel neu. wahl ist die Auswahl ({ platz, art, bauteil, stufe, epoche }) oder null. */
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

  L.SiedlungInfo = { zeichne, kandidaten, fachVon };
})(globalThis);
