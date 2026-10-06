/* app/welt/engine.js: Regeln der Aufbau-Welt (Architektur 7.2 bis 7.5): bauen, verschieben, veredeln, tauschen, erforschen.
   Die Engine liest das Verdienstbuch und ein Welt-Thema (Daten, app/welten/<id>/welt.js), schreibt nur in den Welt-Stand und kennt
   weder DOM noch Module noch ein bestimmtes Thema. Das Verdienstbuch ändert sie nie, Bauen berührt es nicht.
   Alle Aktionen haben dieselbe Form: aktion(ledger, welt, thema, ...) → { ok: true, ... } oder { ok: false, code, grund, ... }.
   Eine abgelehnte Aktion ändert nichts. Gebautes und Erforschtes geht nie verloren, es gibt keine Funktion zum Abreissen.
   Welt-Stand (zustand.welt[themaId]): { ausgaben: {rohstoff: n}, vorrat: {gut: n}, gebaut: {bauteil: stufe}, platz: {bauteil: bauplatz},
   erforscht: [id] }. Kontostand eines Rohstoffs = Ertrag seines Fachs aus dem Buch minus Ausgaben plus Vorrat (aus Tausch), nie unter 0.
   Bauplätze sind Nummern ab 0. Offen sind so viele, wie die höchste offene Epoche nennt (plaetze zählt gesamt, nicht je Epoche). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const eigen = (o, k) => (objekt(o) && Object.hasOwn(o, k) ? o[k] : undefined);   // nie über die Prototypkette lesen
  const zahl = (o, k) => { const v = eigen(o, k); return typeof v === 'number' && Number.isFinite(v) ? v : 0; };
  const nein = (code, grund, mehr) => ({ ok: false, code, grund, ...mehr });
  const posten = kosten => Object.entries(objekt(kosten) ? kosten : {}).filter(([, n]) => typeof n === 'number' && Number.isFinite(n) && n > 0);
  const mal = (kosten, n) => Object.fromEntries(posten(kosten).map(([id, k]) => [id, k * n]));
  const ganz = n => Number.isInteger(n) && n >= 1;

  const leer = () => ({ ausgaben: {}, vorrat: {}, gebaut: {}, platz: {}, erforscht: [] });
  /** Ergänzt Felder, die in einem älteren oder teilweisen Stand fehlen, ohne Vorhandenes anzutasten. */
  function fest(welt) {
    for (const k of ['ausgaben', 'vorrat', 'gebaut', 'platz']) if (!objekt(welt[k])) welt[k] = {};
    if (!Array.isArray(welt.erforscht)) welt.erforscht = [];
    return welt;
  }
  /** Der Stand eines Themas im Zustandsdokument, bei Bedarf neu angelegt. Ein neuer Stand startet leer, sein Saldo ist das ganze Buch. */
  function stand(z, themaId) {
    if (typeof themaId !== 'string' || themaId === '' || themaId === '__proto__') throw new Error(`Welt.stand: ungültige Thema-ID «${themaId}»`);
    if (!objekt(z.welt)) z.welt = {};
    return fest(objekt(eigen(z.welt, themaId)) ? z.welt[themaId] : (z.welt[themaId] = leer()));
  }

  const istRoh = (thema, id) => objekt(eigen(thema.rohstoffe, id));
  const name = (thema, id) => (eigen(thema.rohstoffe, id) || eigen(thema.rezepte, id) || eigen(thema.bauteile, id) || {}).name || id;
  const knoten = (thema, id) => (Array.isArray(thema.forschung) ? thema.forschung : []).find(f => f.id === id);
  const epochen = thema => (Array.isArray(thema.epochen) ? thema.epochen : []);

  /** Kontostand eines Guts: Rohstoff = Ertrag des Fachs minus Ausgaben plus Vorrat, Zwischenprodukt = Vorrat. Nie negativ. */
  function saldo(ledger, welt, thema, id) {
    if (!istRoh(thema, id)) return Math.max(0, zahl(welt.vorrat, id));
    return Math.max(0, zahl(ledger && ledger.ertrag, thema.rohstoffe[id].fach) - zahl(welt.ausgaben, id) + zahl(welt.vorrat, id));
  }
  const fehlend = (ledger, welt, thema, kosten) => posten(kosten)
    .map(([id, n]) => ({ id, fehlt: n - saldo(ledger, welt, thema, id) })).filter(f => f.fehlt > 0);
  const materialFehlt = (thema, f) => nein('material', `Material fehlt: ${f.map(x => `${name(thema, x.id)} ${x.fehlt}`).join(', ')}`, { fehlend: f });
  function zahle(welt, thema, kosten) {
    for (const [id, n] of posten(kosten)) {
      if (istRoh(thema, id)) welt.ausgaben[id] = zahl(welt.ausgaben, id) + n; else welt.vorrat[id] = zahl(welt.vorrat, id) - n;
    }
  }

  /** Eine Epoche ist offen, wenn sie kein Tor hat oder ihr Tor erforscht ist. Ohne Epochen im Thema ist alles offen. */
  function epocheOffen(thema, welt, id) {
    if (!epochen(thema).length || id === undefined || id === null) return true;
    const e = epochen(thema).find(x => x.id === id);
    return !!e && (!e.tor || (Array.isArray(welt.erforscht) && welt.erforscht.includes(e.tor)));
  }
  const epocheNein = (thema, id) => nein('epoche', `Epoche «${(epochen(thema).find(e => e.id === id) || {}).name || id}» ist noch nicht offen`, { epoche: id });

  /** Bauplätze: { anzahl, belegt: { platz: bauteilId }, frei: [platz] }. Ohne Epochen hat jedes Bauteil einen Platz. */
  function plaetze(thema, welt) {
    const offen = epochen(thema).filter(e => epocheOffen(thema, welt, e.id));
    const anzahl = epochen(thema).length ? Math.max(0, ...offen.map(e => zahl(e, 'plaetze'))) : Object.keys(thema.bauteile || {}).length;
    const belegt = {};
    for (const [id, p] of Object.entries(objekt(welt.platz) ? welt.platz : {})) if (Number.isInteger(p)) belegt[p] = id;
    return { anzahl, belegt, frei: Array.from({ length: anzahl }, (_, i) => i).filter(i => !(i in belegt)) };
  }

  /** Wissen für einen Forschungsknoten: je Bereich (`bereich`, `wissen`) und aus beliebigen Bereichen (`summe`). Gibt die Ablehnung oder null. */
  function wissenFehlt(ledger, f) {
    const w = objekt(ledger && ledger.wissen) ? ledger.wissen : {};
    if (f.bereich && zahl(w, f.bereich) < (f.wissen ?? 0)) {
      return nein('wissen', `Wissen im Bereich ${f.bereich}: ${zahl(w, f.bereich)} von ${f.wissen}`, { bereich: f.bereich, hat: zahl(w, f.bereich), braucht: f.wissen });
    }
    const alle = Object.values(w).reduce((s, v) => s + (typeof v === 'number' && Number.isFinite(v) ? v : 0), 0);
    if (f.summe && alle < f.summe) {
      return nein('wissen', `Wissenspunkte aus beliebigen Bereichen: ${alle} von ${f.summe}`, { hat: alle, braucht: f.summe });
    }
    return null;
  }

  function erforsche(ledger, welt, thema, id) {
    fest(welt);
    const f = knoten(thema, id);
    if (!f) return nein('unbekannt', 'Unbekannte Forschung');
    if (welt.erforscht.includes(id)) return nein('schon', 'Bereits erforscht');
    if (!epocheOffen(thema, welt, f.epoche)) return epocheNein(thema, f.epoche);
    const w = wissenFehlt(ledger, f);
    if (w) return w;
    const fe = fehlend(ledger, welt, thema, f.kosten);
    if (fe.length) return materialFehlt(thema, fe);
    zahle(welt, thema, f.kosten);
    welt.erforscht.push(id);
    return { ok: true };
  }

  /** Baut Stufe 1 auf einem freien Bauplatz (`platz`, sonst der erste freie) oder baut die nächste Stufe aus. Stufen gehen nur nach oben. */
  function baue(ledger, welt, thema, id, platz) {
    fest(welt);
    const b = eigen(thema.bauteile, id);
    if (!b) return nein('unbekannt', 'Unbekanntes Bauteil');
    const stufe = zahl(welt.gebaut, id), s = Array.isArray(b.stufen) ? b.stufen[stufe] : undefined;
    if (!s) return nein('stufe-max', 'Höchste Stufe erreicht');
    if (!epocheOffen(thema, welt, b.epoche)) return epocheNein(thema, b.epoche);
    const fo = s.braucht ?? b.braucht;
    if (fo && !welt.erforscht.includes(fo)) {
      return nein('forschung', `Forschung «${(knoten(thema, fo) || {}).name || fo}» fehlt`, { forschung: fo });
    }
    let ort = eigen(welt.platz, id);
    if (stufe === 0) {
      const P = plaetze(thema, welt);
      ort = platz === undefined ? P.frei[0] : platz;
      if (ort === undefined) return nein('platz', 'Kein freier Bauplatz');
      if (!P.frei.includes(ort)) return nein('platz', 'Dieser Bauplatz ist nicht frei oder noch nicht offen');
    }
    const fe = fehlend(ledger, welt, thema, s.kosten);
    if (fe.length) return materialFehlt(thema, fe);
    zahle(welt, thema, s.kosten);
    welt.gebaut[id] = stufe + 1;
    if (stufe === 0) welt.platz[id] = ort;
    return { ok: true, stufe: stufe + 1, platz: ort };
  }

  /** Setzt ein gebautes Bauteil auf einen freien Bauplatz. Kostenlos, ohne Rückerstattung, ohne Wirkung auf Stufe und Saldo. */
  function verschiebe(ledger, welt, thema, id, platz) {
    fest(welt);
    if (zahl(welt.gebaut, id) < 1) return nein('gebaeude', `${name(thema, id)} steht noch nicht`);
    const P = plaetze(thema, welt);
    if (!Number.isInteger(platz) || platz < 0 || platz >= P.anzahl) return nein('platz', 'Diesen Bauplatz gibt es nicht oder er ist noch nicht offen');
    if (platz in P.belegt && P.belegt[platz] !== id) return nein('platz', 'Der Bauplatz ist besetzt');
    welt.platz[id] = platz;
    return { ok: true, platz };
  }

  /** Veredeln: Rohstoffe und Güter in ein Gut umwandeln. Die Stufe des Gebäudes bestimmt die Ausbeute, es gibt keine Wartezeit. */
  function veredle(ledger, welt, thema, id, anzahl = 1) {
    fest(welt);
    const r = eigen(thema.rezepte, id);
    if (!r) return nein('unbekannt', 'Unbekanntes Rezept');
    if (!ganz(anzahl)) return nein('menge', 'Die Menge muss eine ganze Zahl ab 1 sein');
    const stufe = zahl(welt.gebaut, r.in);
    if (stufe < 1) return nein('gebaeude', `Dafür fehlt das Gebäude «${name(thema, r.in)}»`);
    const je = Array.isArray(r.ergibt) ? r.ergibt[Math.min(stufe, r.ergibt.length) - 1] : undefined;
    if (!(je > 0)) return nein('unbekannt', 'Das Rezept hat keine Ausbeute');
    const kosten = mal(r.aus, anzahl), fe = fehlend(ledger, welt, thema, kosten);
    if (fe.length) return materialFehlt(thema, fe);
    zahle(welt, thema, kosten);
    welt.vorrat[id] = zahl(welt.vorrat, id) + je * anzahl;
    return { ok: true, menge: je * anzahl };
  }

  /** Tauschen: das Bauteil nennt Geschäfte `tausch: [{ gib, erhalte }]`, `nr` ist die Stelle in der Liste. Erhalten wird als Vorrat. */
  function tausche(ledger, welt, thema, id, nr, anzahl = 1) {
    fest(welt);
    const b = eigen(thema.bauteile, id);
    if (!b) return nein('unbekannt', 'Unbekanntes Bauteil');
    const t = Array.isArray(b.tausch) && Number.isInteger(nr) ? b.tausch[nr] : undefined;
    if (!objekt(t)) return nein('unbekannt', 'Unbekanntes Tauschgeschäft');
    if (!ganz(anzahl)) return nein('menge', 'Die Menge muss eine ganze Zahl ab 1 sein');
    if (zahl(welt.gebaut, id) < 1) return nein('gebaeude', `Dafür fehlt das Gebäude «${name(thema, id)}»`);
    const kosten = mal(t.gib, anzahl), fe = fehlend(ledger, welt, thema, kosten);
    if (fe.length) return materialFehlt(thema, fe);
    zahle(welt, thema, kosten);
    const erhalten = mal(t.erhalte, anzahl);
    for (const [gut, n] of Object.entries(erhalten)) welt.vorrat[gut] = zahl(welt.vorrat, gut) + n;
    return { ok: true, erhalten };
  }

  const AKTIONEN = ['baue', 'verschiebe', 'veredle', 'tausche', 'erforsche'];
  /** Probelauf einer Aktion auf einer Kopie des Stands: sagt, ob sie ginge und was fehlt, ohne etwas zu ändern (für «Neu möglich»). */
  function probe(art, ledger, welt, thema, ...args) {
    if (!AKTIONEN.includes(art)) throw new Error(`Welt.probe: unbekannte Aktion «${art}»`);
    return L.Welt[art](ledger, structuredClone(welt), thema, ...args);
  }

  L.Welt = Object.assign(L.Welt || {}, { leer, stand, saldo, epocheOffen, plaetze, baue, verschiebe, veredle, tausche, erforsche, probe });
})(globalThis);
