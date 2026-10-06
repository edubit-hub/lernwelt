/* app/ansichten/welt-bedingungen.js: Kosten, Wirkung und Voraussetzung jeder Aktion der Welt als Daten (Architektur 7.1, 7.8 und 13.3 AP-16).
   Die Ansichten zeigen sie vor jeder Aktion, und wenn etwas fehlt, nennt der Text, was: «Wissen im Bereich mathe.zahl: 1 von 2».
   Eine Voraussetzung ist eine Zeile { ok, text, fehlt }. «moeglich» kommt immer vom Probelauf der Engine (Welt.probe), nie von einer eigenen Rechnung,
   damit Anzeige und Aktion nicht auseinanderlaufen. Kein DOM, nichts wird verändert. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const D = () => L.WeltDaten, T = () => L.Texte.welt;
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const eigen = (o, k) => (objekt(o) && Object.hasOwn(o, k) ? o[k] : undefined);
  const zeile = (ok, text, fehlt) => ({ ok, text, fehlt: ok ? '' : fehlt });
  const punkt = s => (/[.:]$/.test(s) ? s : `${s}.`);
  const mengen = (k, o) => D().posten(k, o).map(p => `${p.menge} ${p.name}`);
  /** «3 Stein», «3 Stein und 1 Holz», «3 Stein, 1 Holz und 2 Erz». */
  const aufzaehlung = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} und ${l[l.length - 1]}`);

  /** Die Zeile zur Epoche eines Gebäudes oder einer Forschung (nur, wenn es Epochen gibt). */
  function epocheZeile(k, id) {
    const e = D().epoche(k, id);
    if (!e) return null;
    const tor = D().knoten(k, e.tor), name = e.name || e.id;
    const offen = L.Welt.epocheOffen(k.thema, k.stand, id);
    return zeile(offen, offen ? T().epocheOffen(name) : T().epocheNein(name, tor ? tor.name : null),T().epocheZu(name, tor ? tor.name : null));
  }

  /** Was beim Wissen fehlt, in der Sprache des Kindes: «1 Wissenspunkt in «Zahlen»». Die Zeile zeigt den Fortschritt, dieser Teil die Meldung. */
  const wissenSatz = (bereich, hat, braucht) => T().wissenFehlt(bereich ? D().bereichName(bereich) : null, Math.max(0, braucht - hat));

  /** Warum sich ein Forschungsknoten jetzt nicht erforschen lässt, aus den Angaben der Engine (nicht aus ihrem Text mit der technischen Kennung), sonst ein leerer Text. */
  function knotenGrund(k, f) {
    const r = D().probe(k, 'erforsche', f.id);
    if (r.ok || r.code === 'schon' || r.code === 'epoche') return '';
    return r.code === 'wissen' ? wissenSatz(r.bereich, r.hat, r.braucht) : r.grund;
  }

  function forschungZeile(k, id) {
    const f = D().knoten(k, id), name = f ? f.name : id, ok = D().erforscht(k, id), grund = f ? knotenGrund(k, f) : '';
    return zeile(ok, ok ? T().forschungErforscht(name) : T().forschungNein(name), T().forschungFehlt(name, grund));
  }

  /** Eine Wissenszeile: der Fortschritt als Text (auch wenn erfüllt), bei fehlendem Wissen der Satz dazu. */
  function wissenZeile(bereich, hat, braucht) {
    const h = Math.min(hat, braucht), text = bereich ? T().wissenBereich(D().bereichName(bereich), h, braucht) : T().wissenSumme(h, braucht);
    return zeile(hat >= braucht, text, T().esFehlt(wissenSatz(bereich, hat, braucht)));
  }

  /** Alle Wissensbedingungen und die Epoche eines Knotens als Voraussetzungszeilen. */
  function knotenZeilen(k, f) {
    return [epocheZeile(k, f.epoche), ...D().wissenStand(k, f).map(w => wissenZeile(w.art === 'summe' ? null : w.bereich, w.hat, w.braucht))].filter(Boolean);
  }

  /** Der Satz zu allem, was fehlt: Voraussetzungen und Material, jeder Teil mit Punkt. */
  function grundText(zeilen, kosten) {
    const material = (kosten || []).filter(c => c.fehlt > 0).map(c => `${c.name} ${c.fehlt}`);
    return [...zeilen.filter(z => !z.ok).map(z => z.fehlt), material.length ? T().materialFehlt(material.join(', ')) : ''].filter(Boolean).map(punkt).join(' ');
  }

  /** Bauen oder Ausbauen: die nächste Stufe eines Gebäudes. { stufe (nächste), max, kosten, bedingungen, moeglich, grund, voll } */
  function bauen(k, id) {
    const b = eigen(k.thema.bauteile, id), st = D().stufe(k, id), s = b && Array.isArray(b.stufen) ? b.stufen[st] : null;
    if (!s) return { id, stufe: st, max: b && b.stufen ? b.stufen.length : 0, kosten: [], bedingungen: [], moeglich: false, grund: T().hoechsteStufe, voll: true };
    const kosten = D().posten(k, s.kosten), bed = [epocheZeile(k, b.epoche)], fo = s.braucht ?? b.braucht;
    if (fo) bed.push(forschungZeile(k, fo));
    if (st === 0) { const frei = L.Welt.plaetze(k.thema, k.stand).frei.length > 0; bed.push(zeile(frei, T().platzFrei, T().keinPlatz)); }
    const bedingungen = bed.filter(Boolean), r = D().probe(k, 'baue', id);
    return { id, stufe: st + 1, max: b.stufen.length, kosten, bedingungen, moeglich: r.ok, grund: r.ok ? '' : grundText(bedingungen, kosten) || r.grund, voll: false };
  }

  /** Kurzer Name der Rolle eines Gebäudes («Produktion», «Handel»). Heisst das Gebäude wie seine Rolle («Rathaus»), bleibt der Name der Rolle weg. */
  const gruppe = b => {
    const r = b && b.rolle ? (T().rollen[b.rolle] || b.rolle.charAt(0).toUpperCase() + b.rolle.slice(1)) : '';
    return r && b.name === r ? '' : r;
  };

  /** Ausbeute eines Rezepts auf einer Stufe des Gebäudes. */
  const ausbeute = (r, st) => (Array.isArray(r.ergibt) && st >= 1 ? r.ergibt[Math.min(st, r.ergibt.length) - 1] : 0);
  const rezepteIn = (k, id) => Object.entries(objekt(k.thema.rezepte) ? k.thema.rezepte : {}).filter(([, r]) => r.in === id);

  /** Die Wirkung eines Gebäudes auf einer Stufe als Sätze. Ein Text im Gebäude (`text`) geht vor. */
  function wirkung(k, id, st) {
    const b = eigen(k.thema.bauteile, id), t = T();
    if (!b) return [];
    if (typeof b.text === 'string' && b.text) return [b.text];
    if (b.wirkung === 'rezept' && rezepteIn(k, id).length) return rezepteIn(k, id).map(([rid, r]) => t.rezept(aufzaehlung(mengen(k, r.aus)), r.name || rid, ausbeute(r, Math.max(1, st))));
    if (b.wirkung === 'tausch' && Array.isArray(b.tausch)) return [t.tausch(b.tausch.map(x => `${aufzaehlung(mengen(k, x.gib))} gegen ${aufzaehlung(mengen(k, x.erhalte))}`).join(', '))];
    return [b.wirkung === 'ansicht' ? t.wirkungAnsicht : t.wirkungFrei];
  }

  /** Was die nächste Stufe ändert («Danach ergibt jede Veredelung 3 Ziegel statt 2.»). */
  function danach(k, id, naechste) {
    const b = eigen(k.thema.bauteile, id), t = T();
    if (!b || naechste < 2) return '';
    const rez = b.wirkung === 'rezept' ? rezepteIn(k, id) : [];
    if (rez.length) return rez.map(([rid, r]) => t.danachRezept(r.name || rid, ausbeute(r, naechste), ausbeute(r, naechste - 1))).join(' ');
    return t.danachAussehen;
  }

  /** Was ein Tausch kostet und bringt: { gib, erhalte, max, ok, grund } für Geschäft nr eines Gebäudes. */
  function tausch(k, id, nr) {
    const b = eigen(k.thema.bauteile, id), x = b && Array.isArray(b.tausch) ? b.tausch[nr] : null;
    if (!x) return null;
    const gib = D().posten(k, x.gib), r = D().probe(k, 'tausche', id, nr, 1);
    return { nr, gib, erhalte: D().posten(k, x.erhalte), max: D().maxMenge(gib), ok: r.ok, grund: r.ok ? '' : r.grund };
  }

  /** Was eine Veredelung kostet und bringt: { aus, name, menge (je Veredelung), max, ok, grund } für ein Rezept. */
  function veredeln(k, rid) {
    const r = eigen(k.thema.rezepte, rid);
    if (!r) return null;
    const aus = D().posten(k, r.aus), p = D().probe(k, 'veredle', rid, 1);
    return { id: rid, name: r.name || rid, aus, menge: ausbeute(r, D().stufe(k, r.in)), max: D().maxMenge(aus), ok: p.ok, grund: p.ok ? '' : p.grund };
  }

  /** Zustand eines Forschungsknotens: erforscht, moeglich (Epoche offen und Wissen reicht), gesperrt oder horizont (Epoche hinter der ersten geschlossenen). */
  function zustand(k, f) {
    if (D().erforscht(k, f.id)) return 'erforscht';
    const es = Array.isArray(k.thema.epochen) ? k.thema.epochen : [], erste = es.findIndex(e => !L.Welt.epocheOffen(k.thema, k.stand, e.id));
    if (!L.Welt.epocheOffen(k.thema, k.stand, f.epoche)) return erste >= 0 && es.findIndex(e => e.id === f.epoche) > erste ? 'horizont' : 'gesperrt';
    return D().wissenStand(k, f).every(w => w.ok) ? 'moeglich' : 'gesperrt';
  }

  /** Was ein Knoten freischaltet: Gebäude, Stufen und Epochen, in Sätzen. */
  function schaltetFrei(k, f) {
    const t = T(), aus = [], es = Array.isArray(k.thema.epochen) ? k.thema.epochen : [];
    for (const [, b] of D().bauteile(k)) {
      (b.stufen || []).forEach((s, i) => {
        if (s.braucht === f.id || (i === 0 && s.braucht === undefined && b.braucht === f.id)) aus.push(i === 0 ? t.freiBauteil(b.name) : t.freiStufe(b.name, i + 1));
      });
    }
    es.forEach((e, i) => { if (e.tor === f.id) aus.push(t.freiEpoche(e.name || e.id, Math.max(0, (e.plaetze || 0) - (es[i - 1] ? es[i - 1].plaetze || 0 : 0)))); });
    return aus;
  }

  /** Alles zu einem Forschungsknoten: { id, name, zustand, tor, bereich, kosten, bedingungen, moeglich, grund, frei, wissen }. */
  function knoten(k, f) {
    const kosten = D().posten(k, f.kosten), bed = knotenZeilen(k, f), r = D().probe(k, 'erforsche', f.id), z = zustand(k, f);
    return { id: f.id, name: f.name, zustand: z, tor: f.summe !== undefined, epoche: f.epoche, bereich: f.bereich || null, kosten, bedingungen: bed, wissen: D().wissenStand(k, f),
      moeglich: r.ok, grund: r.ok || z === 'erforscht' ? '' : grundText(bed, kosten) || r.grund, frei: schaltetFrei(k, f) };
  }

  /** Eine Expedition mit Voraussetzungen und Lohn: { plan, bedingungen, lohn: [{ name, symbol, menge }], sammlung, grund }. */
  function expedition(k, e) {
    const plan = L.Expedition.plan(k.ledger, k.stand, k.thema, e.id), bed = [epocheZeile(k, e.epoche)];
    if (e.braucht && e.braucht.bereich) bed.push(wissenZeile(e.braucht.bereich, zeile0(k, e.braucht.bereich), e.braucht.wissen ?? 0));
    const bedingungen = bed.filter(Boolean), lohn = D().posten(k, plan.lohn.rohstoffe);
    return { plan, bedingungen, lohn, sammlung: plan.lohn.sammlung, grund: grundText(bedingungen, []) };
  }
  const zeile0 = (k, bereich) => { const w = objekt(k.ledger.wissen) ? eigen(k.ledger.wissen, bereich) : 0; return typeof w === 'number' ? w : 0; };

  L.WeltBedingungen = { aufzaehlung, grundText, bauen, gruppe, wirkung, danach, tausch, veredeln, zustand, schaltetFrei, knoten, expedition, epocheZeile, forschungZeile };
})(globalThis);
