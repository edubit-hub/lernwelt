/* app/ansichten/welt-daten.js: Lesen der Welt für die Ansichten Siedlung, Forschung, Aufträge und Logbuch (Architektur 7.8, AP-16). Kein DOM.
   Gelesen wird aus Zustandsdokument und Welt-Thema, nichts davon wird verändert. Geschrieben wird nur über aktion() und setzeZiel(): beide gehen über
   Zustand.aendere und rufen die Engine erst, wenn der Probelauf (Welt.probe auf einer Kopie) gelungen ist, damit eine abgelehnte Aktion nie speichert.
   k ist der Kontext aus kontext(): { thema, doc, ledger, stand }. Alle Funktionen sind für Tests mit Attrappen aufrufbar. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const eigen = (o, k) => (objekt(o) && Object.hasOwn(o, k) ? o[k] : undefined);
  const liste = x => (Array.isArray(x) ? x : []);
  const zahl = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

  /** Alles, was eine Ansicht zum Lesen braucht, oder null ohne Welt-Thema. doc und thema sind für Tests austauschbar. */
  function kontext(doc, thema) {
    const d = doc || L.Zustand.hole(), t = thema === undefined ? (L.Start && L.Start.welt) || null : thema;
    if (!t) return null;
    return { thema: t, doc: d, ledger: objekt(d.ledger) ? d.ledger : L.Ledger.leer(), stand: eigen(d.welt, t.id) || L.Welt.leer() };
  }

  const name = (k, id) => (eigen(k.thema.rohstoffe, id) || eigen(k.thema.rezepte, id) || eigen(k.thema.bauteile, id) || {}).name || id;
  const symbol = (k, id) => (eigen(k.thema.rohstoffe, id) || {}).symbol || id;
  const knoten = (k, id) => liste(k.thema.forschung).find(f => f.id === id);
  const epoche = (k, id) => liste(k.thema.epochen).find(e => e.id === id);
  const bauteile = k => (objekt(k.thema.bauteile) ? Object.entries(k.thema.bauteile) : []);
  const stufe = (k, id) => zahl(eigen(k.stand.gebaut, id));
  const erforscht = (k, id) => liste(k.stand.erforscht).includes(id);
  const saldo = (k, id) => L.Welt.saldo(k.ledger, k.stand, k.thema, id);
  const probe = (k, art, ...args) => L.Welt.probe(art, k.ledger, k.stand, k.thema, ...args);
  const heute = () => L.Lernplan.heute(L.Zustand.hole());

  /** Kostenzeilen: { id, name, symbol, menge, hat, fehlt } mit dem Vorrat, wie ihn Welt.saldo sieht. */
  const posten = (k, kosten) => Object.entries(objekt(kosten) ? kosten : {}).filter(([, n]) => n > 0)
    .map(([id, menge]) => { const hat = saldo(k, id); return { id, name: name(k, id), symbol: symbol(k, id), menge, hat, fehlt: Math.max(0, menge - hat) }; });

  /** Was fehlt, als kurzer Text: «7 Stein» oder «7 Stein, 2 Holz». */
  const fehltText = zeilen => (zeilen || []).filter(p => p.fehlt > 0).map(p => `${p.fehlt} ${p.name}`).join(', ');
  /** Der Stand der fehlenden Posten: «33 von 40 Stein» (Nachbesserung 2: eindeutiger als «noch 7 Stein»). Ohne hat und menge wie fehltText. */
  const standText = zeilen => (zeilen || []).filter(p => p.fehlt > 0)
    .map(p => (Number.isFinite(p.menge) && Number.isFinite(p.hat) ? `${Math.min(p.hat, p.menge)} von ${p.menge} ${p.name}` : `${p.fehlt} ${p.name}`)).join(', ');

  /** Wie oft sich ein Posten bezahlen lässt (für «Alles»). */
  const maxMenge = zeilen => (zeilen.length ? Math.min(...zeilen.map(p => Math.floor(p.hat / p.menge))) : 0);

  /** Ressourcenleiste: Rohstoffe und Güter mit Stand und Zuwachs der Sitzung. Güter erscheinen, sobald es sie gibt oder ihr Gebäude steht. */
  function ressourcen(k, zuwachs = {}) {
    const roh = Object.entries(objekt(k.thema.rohstoffe) ? k.thema.rohstoffe : {}).map(([id, r]) => ({ id, name: r.name || id, symbol: r.symbol || id, zahl: saldo(k, id), plus: Math.max(0, zahl(zuwachs[r.fach])) }));
    const gueter = Object.entries(objekt(k.thema.rezepte) ? k.thema.rezepte : {}).map(([id, r]) => ({ id, name: r.name || id, symbol: id, zahl: saldo(k, id), plus: 0, in: r.in }))
      .filter(x => x.zahl > 0 || stufe(k, x.in) >= 1);
    return { roh, gueter };
  }

  /** Wissensbedingungen eines Knotens in der Form, wie Welt.erforsche sie prüft: [{ art: 'bereich' | 'summe', bereich?, hat, braucht, ok }]. */
  function wissenStand(k, f) {
    const w = objekt(k.ledger.wissen) ? k.ledger.wissen : {}, aus = [];
    if (f.bereich) aus.push({ art: 'bereich', bereich: f.bereich, hat: zahl(eigen(w, f.bereich)), braucht: f.wissen ?? 0 });
    if (f.summe) aus.push({ art: 'summe', hat: Object.values(w).reduce((s, v) => s + zahl(v), 0), braucht: f.summe });
    return aus.map(x => ({ ...x, ok: x.hat >= x.braucht }));
  }

  /** Die höchste offene Epoche (Nummer ab 1) und das Tor zur nächsten: { nr, id, name, tor: { id, name, hat, braucht } | null }, null ohne Epochen. */
  function epocheStand(k) {
    const es = liste(k.thema.epochen);
    if (!es.length) return null;
    let nr = 0;
    es.forEach((e, i) => { if (L.Welt.epocheOffen(k.thema, k.stand, e.id)) nr = i; });
    const tor = es[nr + 1] && knoten(k, es[nr + 1].tor), w = tor ? wissenStand(k, tor)[0] : null;
    if (!tor) return { nr: nr + 1, id: es[nr].id, name: es[nr].name || es[nr].id, tor: null };
    const kosten = posten(k, tor.kosten), fehlt = kosten.filter(p => p.fehlt > 0), wissenOk = !w || w.hat >= w.braucht;
    // zustand: «wissen» (es fehlt Wissen), «material» (Wissen voll, es fehlt Material) oder «bereit» (Tor lässt sich erforschen)
    return { nr: nr + 1, id: es[nr].id, name: es[nr].name || es[nr].id,
      tor: { id: tor.id, name: tor.name, hat: w ? w.hat : 0, braucht: w ? w.braucht : 0, kosten, fehlt, zustand: !wissenOk ? 'wissen' : fehlt.length ? 'material' : 'bereit' } };
  }

  /** Bauplätze der offenen Epochen: { belegt, gesamt }. */
  function plaetzeStand(k) {
    const P = L.Welt.plaetze(k.thema, k.stand);
    return { belegt: P.anzahl - P.frei.length, gesamt: P.anzahl, frei: P.frei };
  }

  /** Was sich jetzt tun lässt: Sätze aus Abschluss.moeglich als [{ id, art: 'b' | 'v' | 'f', ziel, satz }]. Bei «b» ist ziel die Bauteil-ID. */
  function moeglich(k) {
    return [...L.Abschluss.moeglich(k.doc, k.thema)].map(([id, satz]) => { const t = id.split(':'); return { id, art: t[0], ziel: t[1], satz }; });
  }

  /** IDs der gebauten Gebäude, deren nächste Stufe jetzt zu bauen ist (die Karte zeichnet dort den Pfeil). */
  const ausbauIds = k => bauteile(k).filter(([id]) => stufe(k, id) >= 1 && probe(k, 'baue', id).ok).map(([id]) => id);

  /** Das Ziel im Forschungsbaum: das gesetzte, solange es nicht erforscht ist, sonst der offene Knoten mit dem grössten Wissensanteil. null, wenn nichts mehr offen ist. */
  function ziel(k) {
    const offen = liste(k.thema.forschung).filter(f => !erforscht(k, f.id) && L.Welt.epocheOffen(k.thema, k.stand, f.epoche));
    const anteil = f => { const w = wissenStand(k, f); return w.length ? Math.min(...w.map(x => (x.braucht ? Math.min(1, x.hat / x.braucht) : 1))) : 1; };
    const gesetzt = knoten(k, eigen(k.stand, 'ziel')), f = gesetzt && !erforscht(k, gesetzt.id) ? gesetzt : offen.reduce((b, x) => (!b || anteil(x) > anteil(b) ? x : b), null);
    if (!f) return null;
    const w = wissenStand(k, f), massgeblich = w.find(x => !x.ok) || w[0] || null, kosten = posten(k, f.kosten), fehlt = kosten.filter(p => p.fehlt > 0);
    // zustand sagt, was als Nächstes zu tun ist: Wissen sammeln, Material sammeln oder erforschen
    const zustand = w.some(x => !x.ok) ? 'wissen' : fehlt.length ? 'material' : 'bereit';
    return { id: f.id, name: f.name, gesetzt: f === gesetzt, wissen: massgeblich, kosten, fehlt, zustand, tor: liste(k.thema.epochen).some(e => e.tor === f.id) };
  }

  /** Eine Welt-Aktion ausführen: erst der Probelauf auf einer Kopie, dann (nur bei ok) die echte Aktion im Rückruf von Zustand.aendere. Gibt das Ergebnis der Engine zurück. */
  function aktion(k, art, ...args) {
    const p = probe(k, art, ...args);
    if (!p.ok) return p;
    let r = p;
    L.Zustand.aendere(z => {
      if (!objekt(z.ledger)) z.ledger = L.Ledger.leer();
      r = L.Welt[art](z.ledger, L.Welt.stand(z, k.thema.id), k.thema, ...args);
    });
    return r;
  }

  /** Setzt oder löscht (null) das Ziel im Forschungsbaum: zustand.welt[themaId].ziel. */
  function setzeZiel(k, id) { L.Zustand.aendere(z => { const s = L.Welt.stand(z, k.thema.id); if (id) s.ziel = id; else delete s.ziel; }); }

  /** Der Zuwachs dieser Sitzung je Fach (Lernwelt.Start.zuwachs), leer ohne Verbindung. */
  function zuwachs() { try { return (L.Start && L.Start.zuwachs ? L.Start.zuwachs().ertrag : {}) || {}; } catch (e) { return {}; } }

  /** Die Titel der Module, die einen Bereich füttern. */
  const bereichModule = bereich => [...L.registry.module.values()].filter(m => m.bereich === bereich).map(m => m.titel);

  /** Der Name eines Bereichs für das Kind: «Zahlen», «Sprache», «Wörter Englisch». Ohne Eintrag im Textbestand die Titel der Module, zuletzt der Teil nach dem Punkt. */
  function bereichName(bereich) {
    const n = L.Texte && L.Texte.welt && L.Texte.welt.bereiche;
    if (n && Object.hasOwn(n, bereich)) return n[bereich];
    const t = bereichModule(bereich), rest = String(bereich).split('.').pop();
    return t.length ? t.join(', ') : rest.charAt(0).toUpperCase() + rest.slice(1);
  }

  /** Ein Tag «JJJJ-MM-TT» als «TT.MM.JJJJ» (Schweizer Schreibweise). Ein anderer Text bleibt, wie er ist. */
  const datum = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso)); return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso ?? ''); };

  /** Der Name eines Sammlungsstücks im Welt-Thema, sonst die Kennung. */
  const sammlungName = (k, id) => (liste(k.thema.sammlung).find(s => s && s.id === id) || {}).name || id;

  L.WeltDaten = { kontext, name, symbol, knoten, epoche, bauteile, stufe, erforscht, saldo, probe, heute, posten, fehltText, standText, maxMenge, ressourcen, wissenStand, epocheStand, plaetzeStand,
    moeglich, ausbauIds, ziel, aktion, setzeZiel, zuwachs, bereichName, bereichModule, datum, sammlungName };
})(globalThis);
