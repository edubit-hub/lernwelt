/* app/ansichten/aufgabe-rahmen.js: der Rahmen einer Runde (docs/gestaltung-umbau.md 2.6, 2.7 und 3.7, Vorbild docs/mockup/richtung-b/szene-aufgabe.js).
   Über der Aufgabe liegt eine Route über die Breite: Anker am Start, je Aufgabe eine Station (bis 12, darüber Etappen zu 6), das Schiff an der
   aktuellen Station und am Ende der Ziel-Rohstoff als Objekt. Daneben «Ertrag der Runde» mit Objekt und Zahl, darunter das Etikett «Rechnen · Einmaleins»
   mit dem Rohstoff-Objekt und der Arbeitsauftrag des Übungstyps (Paketangaben des Laufs: typ, fach, thema).
     AufgabeRahmen.baue({ fach?, thema?, art?, flug?: { von: {x,y}, inhalt } }) → { el, huelle, beobachter, ziel(), zerstoere() }
   huelle (div.lauf-huelle) geht an Lauf.start, beobachter ebenso. Beim ersten Paket rücken Route und Ertrag in den Kopf des Laufs (.lauf-kopf),
   neben «Beenden» und die Fortschrittszahl. Der Lauf kennt die Welt nicht: den Ertrag liest der Rahmen über den Bus (lern:aufgabe) und Start.zuwachs().
   Richtig rückt das Schiff vor und der Ertrag zählt hoch (Effekte.zaehle, ein kleiner Flug vom Ergebnis zum Ertrag). Alles geschützt, nichts blockiert. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.lernrahmen;
  const ETAPPE = 6, EINZELN = 12;
  const HEBEN = ['zuordnen', 'reihenfolge', 'lueckentext', 'geld'];               // Typen, deren feste Anleitung (p.hinweis) an die Stelle des Arbeitsauftrags rückt
  const leise = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const hat = (n, k) => !!n && n.nodeType === 1 && String((n.getAttribute && n.getAttribute('class')) || '').split(/\s+/).includes(k);
  const suche = (w, k) => (!w ? null : typeof w.finde === 'function' ? w.finde(n => hat(n, k)) || null : typeof w.querySelector === 'function' ? w.querySelector(`.${k}`) : null);
  const pct = x => `${(Math.round(x * 10000) / 100).toString()}%`;
  const ANKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M12 7v13M8 11h8M5 14a7 7 0 0 0 14 0"/></svg>';
  const SCHIFF = '<svg viewBox="-20 -26 40 32" aria-hidden="true"><path class="boot-rumpf" d="M-15 0H15L10 6H-10Z"/><path class="boot-mast" d="M0 0V-24"/>'
    + '<path class="boot-segel" d="M0 -23L-12 -3H0Z"/><path class="boot-wimpel" d="M1 -18L10 -3H1Z"/></svg>';

  /** Lage der Route (rein, auch für Tests): n Aufgaben, fertig beantwortet, status je Station ('ok' | 'offen' | undefined, fehlt: ok), bei = Station,
      an der das Schiff liegt (Standard: fertig). Das Schiff ist die einzige Marke für «jetzt» (Abnahme 2): es liegt an der Station der aktuellen
      Aufgabe, also bei (bei + 0,5) / n, und fährt bei richtig zur nächsten. Sind alle beantwortet und noch welche offen (falsch, kommen noch einmal),
      liegt es an der ersten offenen Station; erst wenn nichts mehr offen ist, läuft es am Ziel ein (1). Die Spur zeigt nur Erledigtes (Schlussprüfung):
      richtig beantwortete Aufgaben je Anteil der Runde, vor der ersten Antwort 0, nach einer falschen Antwort unverändert.
      Bis 12 Aufgaben eine Station je Aufgabe, darüber Etappen zu 6 Aufgaben als Rauten (etappe: Nummer der aktuellen Etappe, ab 1).
      → { etappen, etappe, schiff, spur, stationen: [{ links, art }] } mit art 'ok' | 'offen' | 'jetzt' | 'kommt' */
  function lage(n, fertig, status = [], bei = fertig) {
    const anzahl = Math.max(0, n | 0), f = Math.max(0, Math.min(anzahl, fertig | 0));
    if (!anzahl) return { etappen: false, etappe: 0, schiff: 0, spur: 0, stationen: [] };
    const offen = status.slice(0, f).indexOf('offen');
    let j = Math.max(0, Math.min(anzahl, Number.isFinite(bei) ? bei | 0 : f));
    if (j >= anzahl) j = offen >= 0 ? offen : anzahl;
    const spur = (f - status.slice(0, f).filter(s => s === 'offen').length) / anzahl;
    const schiff = j >= anzahl ? 1 : (j + 0.5) / anzahl, art = k => (k === j ? 'jetzt' : k < f ? (status[k] === 'offen' ? 'offen' : 'ok') : 'kommt');
    if (anzahl <= EINZELN) return { etappen: false, etappe: 0, schiff, spur, stationen: Array.from({ length: anzahl }, (_, k) => ({ links: (k + 0.5) / anzahl, art: art(k) })) };
    const etappen = Math.ceil(anzahl / ETAPPE), jetzt = Math.min(etappen - 1, Math.floor(Math.min(j, anzahl - 1) / ETAPPE));
    return { etappen: true, etappe: jetzt + 1, schiff: j >= anzahl ? 1 : (jetzt + 0.5) / etappen, spur,     // das Schiff liegt an der Raute der aktuellen Etappe
      stationen: Array.from({ length: etappen }, (_, k) => {
        const von = k * ETAPPE, bis = Math.min((k + 1) * ETAPPE, anzahl);
        let fertigIn = 0;
        for (let i = von; i < bis; i++) if (i < f && status[i] !== 'offen') fertigIn += 1;
        return { links: (k + 0.5) / etappen, art: j < anzahl && k === jetzt ? 'jetzt' : fertigIn === bis - von ? 'ok' : k < jetzt ? 'offen' : 'kommt' };
      }) };
  }

  /** Rohstoff eines Fachs im Welt-Thema: { id, name, symbol } oder null. */
  function rohstoff(thema, fach) {
    const e = thema && fach ? Object.entries(thema.rohstoffe || {}).find(([, r]) => r && r.fach === fach) : null;
    return e ? { id: e[0], name: e[1].name, symbol: e[1].symbol || e[0] } : null;
  }
  const svgObjekt = (r, px) => (r ? leise(() => (L.Iso && L.Iso.objekt ? L.Iso.objekt(r.symbol, { groesse: px }) : ''), '') : '');
  function objekt(r, px) {
    const el = L.HuelleHud && L.HuelleHud.objekt && r ? L.HuelleHud.objekt(r.symbol, px) : H('span.res-objekt.leer', { 'aria-hidden': 'true' });
    if (r) el.setAttribute('style', `--tint: var(--${r.symbol}-tint, var(--akzent-hell))`);
    return el;
  }
  /** Ertrag dieser Sitzung je Fach (Start.zuwachs), ohne Welt leer. */
  const zuwachs = () => leise(() => (L.Start && L.Start.zuwachs ? L.Start.zuwachs().ertrag || {} : {}), {});
  const summe = (z, fach) => (fach ? z[fach] || 0 : Object.values(z).reduce((s, x) => s + (x || 0), 0));

  function baue(opt = {}) {
    const r = rohstoff(opt.thema, opt.fach), name = r ? r.name : null, start = summe(zuwachs(), opt.fach);
    const z = { n: 0, fertig: 0, status: [], schluessel: new Map(), schiff: 0, ertrag: 0, eingehaengt: false, ab: null, ende: false };
    const anker = H('span.ar-anker', { 'aria-hidden': 'true' }), ziel = H('span.ar-ziel', { 'aria-hidden': 'true' }, objekt(r, 22));
    anker.innerHTML = ANKER;
    const spur = H('i.ar-spur'), boot = H('span.ar-boot'), schiff = H('div.ar-schiff', boot), stationen = H('div.ar-stationen');
    boot.innerHTML = SCHIFF;
    const bahn = H('div.ar-bahn', H('i.ar-wasser'), spur, stationen, schiff);
    const route = H('div.ar-route', { role: 'img', 'aria-label': T().route(0, 0) }, anker, bahn, ziel);
    const zahl = H('b.ar-ertrag-zahl', T().ertragZahl(0, name));
    const marke = objekt(r, 28);
    // Ohne Rohstoff (Freitext, kein Welt-Thema) gibt es keinen Ertrag der Runde; solange nichts angefallen ist, steht nur das Objekt blass da (keine «0»)
    const ertrag = H(`div.ar-ertrag.leer${r ? '' : '.ohne'}`, { 'aria-label': T().ertragBeschriftung(0, name) }, marke, H('span.ar-ertrag-text', H('small', T().ertragKicker), zahl));
    const etappe = H('span.ar-etappe');
    // Etikett «Rechnen · Einmaleins» mit dem Rohstoff-Objekt und der Arbeitsauftrag des Übungstyps (Zeile unter Route und Ertrag)
    const etikettBild = H('span.ar-etikett-bild', { 'aria-hidden': 'true' }), etikettText = H('span.ar-etikett-text'), auftrag = H('p.ar-auftrag');
    const zeile = H('div.ar-zeile', H('p.ar-etikett', etikettBild, etikettText), auftrag);
    const kopf = H('div.ar-kopf', route, ertrag), huelle = H('div.lauf-huelle');
    let worum = '';
    function beschrifte({ typ, fach, thema } = {}) {
      const f = fach || opt.fach || null, schluessel = `${typ}|${f}|${thema}`;
      if (schluessel === worum) return;
      worum = schluessel; z.typ = typ;
      const fachName = f ? leise(() => L.Lernplan.fachName(f), f) : null, ro = rohstoff(opt.thema, f);
      const ganz = T().etikett(fachName, thema || null);                               // «Rechnen · Einmaleins»: das Fach fett, das Thema normal
      etikettText.replaceChildren(...(fachName && thema ? [H('b', fachName), ganz.slice(String(fachName).length)] : ganz ? [ganz] : []));
      etikettBild.replaceChildren(...(ro ? [objekt(ro, 22)] : []));
      auftrag.textContent = typ ? T().auftrag(typ) : '';
    }
    /** Der Arbeitsauftrag steht immer an derselben Stelle über der Arbeitsfläche: bringt der Typ eine eigene Zeile mit (p.hinweis direkt in .uebung),
        rückt ihr Text in den Auftrag, und die Zeile im Typ tritt zurück. */
    function hebeHinweis() {
      if (!HEBEN.includes(z.typ)) return;
      const b = suche(huelle, 'lauf-buehne'), u = b && b.children ? Array.from(b.children).find(n => hat(n, 'uebung')) : null, p = suche(u, 'hinweis');
      if (!p || !String(p.textContent || '').trim() || p.getAttribute('aria-live')) return;          // eine Zeile, die sich während der Aufgabe ändert, bleibt im Typ
      auftrag.textContent = String(p.textContent).trim();
      p.classList.add('gehoben');
    }
    const el = H('div.aufgabe-rahmen', { 'data-art': opt.art || 'tagesauftrag' }, kopf, huelle);

    function zeichne() {
      const l = lage(z.n, z.fertig, z.status, z.schiff);
      etappe.textContent = l.etappen ? T().etappe(l.etappe, l.stationen.length) : '';
      if (stationen.children.length !== l.stationen.length || bahn.getAttribute('data-n') !== String(z.n)) {
        stationen.replaceChildren(...l.stationen.map(() => H('i.ar-station')));
        bahn.setAttribute('data-n', String(z.n));
      }
      l.stationen.forEach((s, k) => {
        const st = stationen.children[k];
        st.setAttribute('class', `ar-station ${s.art}${l.etappen ? ' etappe' : ''}`);
        st.setAttribute('style', `left: ${pct(s.links)}`);
      });
      spur.setAttribute('style', `transform: scaleX(${l.spur.toFixed(4)})`);
      schiff.setAttribute('style', `transform: translateX(${pct(l.schiff)})`);
      route.setAttribute('aria-label', T().route(z.fertig, z.n));
    }

    /** Route und Ertrag in den Kopf des Laufs: neben «Beenden» und die Fortschrittszahl. Ohne Kopf bleiben sie über der Runde stehen. */
    function einhaengen() {
      if (z.eingehaengt) return;
      z.eingehaengt = true;
      const lk = suche(huelle, 'lauf-kopf');
      if (!lk) return;
      lk.append(etappe, route, ertrag, zeile);
      lk.classList.add('mit-route');
      kopf.remove();
      if (opt.flug && opt.flug.von) startFlug();
    }

    /** Auswahl-Flug (Vorbild C): das Objekt der gewählten Runde fliegt zum Ziel am Ende der Route, das Ziel pulsiert kurz. */
    function startFlug() {
      const E = L.Effekte, f = opt.flug;
      if (!E || typeof E.flug !== 'function') return;
      const los = () => leise(() => Promise.resolve(E.flug({ von: f.von, nach: ziel, inhalt: () => f.inhalt || svgObjekt(r, 34), anzahl: 1, dauer: 820 }))
        .then(() => { if (!z.ende) { leise(() => E.puls(ziel, { warm: true })); leise(() => L.Klang && L.Klang.spiele('sammeln')); } }).catch(() => {}));
      if (typeof g.requestAnimationFrame === 'function') g.requestAnimationFrame(los); else los();
    }

    /** Der Ertrag der Runde ist gewachsen: zählt hoch, ein kleiner Flug vom Ergebnis zum Objekt, Stoss an der Marke. */
    function ertragNeu() {
      if (z.ende) return;
      const neu = Math.max(0, summe(zuwachs(), opt.fach) - start), alt = z.ertrag;
      if (neu === alt) return;
      z.ertrag = neu;
      ertrag.setAttribute('aria-label', T().ertragBeschriftung(neu, name));
      ertrag.classList.toggle('leer', neu === 0);
      const E = L.Effekte;
      if (!E || neu < alt) { zahl.textContent = T().ertragZahl(neu, name); return; }
      const quelle = suche(huelle, 'lauf-buehne'), setze = () => { zahl.textContent = T().ertragZahl(z.ertrag, name); };
      const flug = leise(() => E.flug({ von: quelle, nach: marke, inhalt: () => svgObjekt(r, 26), anzahl: Math.min(3, neu - alt), dauer: 700, abstand: 90 }), null);
      Promise.resolve(flug).then(() => {
        if (z.ende) return setze();
        leise(() => E.stoss(marke));
        leise(() => L.Klang && L.Klang.spiele('muenze'));
        return Promise.resolve(E.zaehle(zahl, alt, neu, { dauer: 500, format: x => T().ertragZahl(x, name) })).then(setze);
      }).catch(setze);
    }
    if (L.bus && typeof L.bus.on === 'function') z.ab = L.bus.on('lern:aufgabe', () => Promise.resolve().then(ertragNeu));

    const beobachter = {
      paket({ nr, gesamt, art, typ, fach, thema } = {}) {
        einhaengen();
        beschrifte({ typ, fach, thema });
        z.n = Math.max(0, gesamt | 0);
        z.fertig = Math.max(z.fertig, Math.min(z.n, (nr | 0) - 1));
        const offen = z.status.indexOf('offen');
        z.schiff = art === 'nachfassen' && offen >= 0 ? offen : z.fertig;                   // «Noch einmal»: das Schiff liegt an der offenen Station
        zeichne();
        if (typeof g.setTimeout === 'function') g.setTimeout(() => { if (!z.ende) leise(hebeHinweis); }, 0); else leise(hebeHinweis);
      },
      ergebnis({ urteil, aufgabeKey } = {}) {
        const ok = urteil !== 'falsch';
        let i = z.schluessel.get(aufgabeKey);
        if (i === undefined) { i = z.schluessel.size; z.schluessel.set(aufgabeKey, i); z.status[i] = ok ? 'ok' : 'offen'; } else if (ok) z.status[i] = 'ok';
        z.fertig = Math.max(z.fertig, Math.min(z.n || z.schluessel.size, z.schluessel.size));
        if (ok) z.schiff = z.fertig;                                                      // richtig: das Schiff fährt zur nächsten Station, falsch: es bleibt liegen
        zeichne();
      }
    };
    zeichne();
    return {
      el, huelle, beobachter, ziel: () => ziel, stand: () => ({ n: z.n, fertig: z.fertig, ertrag: z.ertrag, status: z.status.slice() }),
      zerstoere() { z.ende = true; if (z.ab) { leise(() => z.ab()); z.ab = null; } }
    };
  }

  L.AufgabeRahmen = { baue, lage, rohstoff };
})(globalThis);
