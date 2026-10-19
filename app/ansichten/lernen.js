/* app/ansichten/lernen.js: die Ansicht «Lernen» (Architektur 6.4, «Tagesauftrag mit wählbaren Runden», docs/gestaltung-umbau.md 2.5 bis 2.7).
   Die Auswahl liegt als Tafel «Tagesauftrag» über der Insel (quer von rechts, hoch als Blatt): je Runde eine Karte mit dem Fach als Rohstoff-Objekt,
   Anzahl, Minuten und Etikett «neu», darunter «Alle der Reihe nach» und «Weitere Möglichkeiten». Eine Runde läuft im Aufgabenrahmen (aufgabe-rahmen.js:
   Route, Schiff, Ertrag der Runde) über Lauf.start, danach zeigt der Abschluss den Bericht mit Ertrag. Ist alles Fällige erledigt, bietet die Ansicht
   eine freiwillige Zusatzrunde an und sagt offen, dass sie keinen Ertrag bringt (7.3). Beim ersten Kontakt mit einem Modul bietet sie die Einstufung an.
   Der Plan kommt aus Lernplan.tagesauftrag, der Tagesbericht zählt aus dem Tageslog (zustand.tage[heute]). Die Ansicht schreibt nichts selbst. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.lernen, R = () => L.Texte.lernrahmen;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const tag = { heute: null, zustand: null, berichte: [] };                       // die Themenstufen der Runden seit dem Start (der Tageslog kennt sie nicht), ein neuer Tag beginnt leer
  const unterschied = (nachher, vorher) => Object.fromEntries(Object.entries(nachher).map(([k, n]) => [k, n - (vorher[k] || 0)]).filter(([, n]) => n > 0));
  const welt = () => (L.Start && L.Start.welt) || null;
  const zuwachs = () => (L.Start && L.Start.zuwachs ? L.Start.zuwachs().ertrag : {});
  const rohstoff = fach => (L.AufgabeRahmen ? L.AufgabeRahmen.rohstoff(welt(), fach) : null);
  let tafel = null;                                                                 // die offene Tafel der Auswahl (es gibt höchstens eine)

  /** Ertrag je Fach als Liste { name, menge }: mit Welt-Thema der Name des Rohstoffs, sonst der Name des Fachs. */
  function ertragListe(ertrag, thema) {
    return Object.entries(ertrag).filter(([, n]) => n > 0).map(([fach, menge]) => {
      const roh = thema && Object.values(thema.rohstoffe || {}).find(r => r.fach === fach);
      return { name: roh ? roh.name : L.Lernplan.fachName(fach), menge };
    });
  }

  /** Schliesst die Tafel der Auswahl und gibt die Ansicht für Lauf oder Abschluss frei. */
  function raeume(huelle) {
    if (tafel) { const t = tafel; tafel = null; Promise.resolve(t.schliesse()).catch(() => {}); }
    huelle.classList.remove('lernen-auswahl');
  }

  /** Mitte eines Elements auf dem Bildschirm (Start des Auswahl-Flugs), ohne Layout null. */
  function mitte(el) {
    const r = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
    return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  }

  /** Eine Runde im Aufgabenrahmen. { art, plan, fach, flug } → Bericht. Ohne Rahmen (AufgabeRahmen fehlt) läuft sie in einer schlichten Hülle. */
  async function runde(huelle, { art, plan, fach, flug }) {
    const rahmen = L.AufgabeRahmen ? L.AufgabeRahmen.baue({ art, fach, thema: welt(), flug }) : null;
    const laufHuelle = rahmen ? rahmen.huelle : H('div.lauf-huelle');
    huelle.classList.add('mit-rahmen');
    huelle.replaceChildren(rahmen ? rahmen.el : laufHuelle);
    try { return await L.Lauf.start({ art, plan, huelle: laufHuelle, beobachter: rahmen ? rahmen.beobachter : null }); } finally {
      if (rahmen) rahmen.zerstoere();
      huelle.classList.remove('mit-rahmen');
    }
  }

  /** Führt die gewählten Runden hintereinander durch und zeigt danach den Abschluss. art: 'tagesauftrag' oder 'zusatz'. quelle: Element für den Auswahl-Flug. */
  async function spiele(huelle, ctx, t, runden, art, quelle) {
    if (L.Lauf.laeuft()) return;
    if (L.Start && L.Start.entsperre) L.Start.entsperre();            // dieselbe Berührung wie der Tipp: iOS lässt Sprache nur aus einer Berührung zu
    if (tag.heute !== t.tag || tag.zustand !== L.Zustand) Object.assign(tag, { heute: t.tag, zustand: L.Zustand, berichte: [] });
    const vorher = zuwachs(), thema = welt(), vorMoeglich = thema ? L.Abschluss.moeglich(L.Zustand.hole(), thema) : null, berichte = [];
    const von = mitte(quelle);
    raeume(huelle);
    if (typeof ctx.musikRuht === 'function') ctx.musikRuht();      // die Musik ruht auch im Abschluss (Logbuch-Stempel), bis das Kind weitergeht
    ctx.sperre(true);
    try {
      for (const [i, r] of runden.entries()) {
        const plan = art === 'zusatz' ? { heute: t.tag, eintraege: r.eintraege, deckel: t.deckel }
          : { heute: t.tag, eintraege: r.eintraege, deckel: t.deckel, maxMinuten: L.Lernplan.tagesauftrag().maxMinuten, nachschub: L.Einstieg.nachschub(t.tag) };
        const b = await runde(huelle, { art, plan, fach: art === 'zusatz' ? null : r.id, flug: i === 0 && von ? { von } : null });
        berichte.push(b);
        if (b.abgebrochen || b.zeitdeckel) break;
      }
    } catch (fehler) { melde(fehler); } finally { ctx.sperre(false); }
    const gewinn = unterschied(zuwachs(), vorher), abgebrochen = berichte.some(b => b.abgebrochen);
    if (art === 'tagesauftrag') tag.berichte.push(...berichte.map(b => ({ ...b, abgebrochen: false })));   // eine später fortgesetzte Pause zählt im Tagesbericht nicht
    // Ist der Tagesauftrag damit fertig, fasst der Abschluss den ganzen Tag aus dem Tageslog zusammen, sonst nur diese Runden
    const tagesweit = art === 'tagesauftrag' && !abgebrochen && L.Lernplan.tagesauftrag().erledigt, doc = L.Zustand.hole();
    L.Huelle.aktualisiere();
    const neu = thema ? L.Abschluss.neuMoeglich(vorMoeglich, L.Abschluss.moeglich(L.Zustand.hole(), thema)) : [];
    // Die nächste offene Runde des Tages für den grossen Knopf des Abschlusses (Nachbesserung 2); sie startet ohne Umweg über die Auswahl
    let nt = null;
    try { nt = art === 'tagesauftrag' ? L.Lernplan.tagesauftrag() : null; } catch (fehler) { melde(fehler); }
    const nr = nt && !nt.erledigt && !nt.keinModul && Array.isArray(nt.runden) ? nt.runden[0] : null;
    const naechste = nr ? { name: nr.titel, aufgaben: nr.aufgaben, minuten: nr.minuten, tue: () => ctx.gehe('lernen', { fach: nr.id, los: true }) } : null;
    L.Abschluss.zeige(huelle, { bericht: tagesweit ? L.Bericht.ausTageslog(doc, t.tag, { stufen: L.Lauf.summiere(tag.berichte).stufen }) : L.Lauf.summiere(berichte),
      ertrag: ertragListe(tagesweit ? L.Bericht.ertragVon(doc, t.tag) : gewinn, thema),
      erledigt: (art === 'zusatz' || tagesweit) && !abgebrochen, thema, neu,
      weiter: () => ctx.gehe('lernen'), start: () => ctx.gehe('start'), siedlung: () => ctx.gehe('siedlung', { neu }),   // die Siedlung zeigt «Neu möglich: ...» (AP-16)
      forschung: () => ctx.gehe('forschung'), ueben: fach => ctx.gehe('lernen', { fach }), naechste, hud: ctx.hud });
  }

  /** Die Einstufungsrunde eines Moduls (art 'einstufung'). Danach steht das Ergebnis oben in der Ansicht, der Rest des Tagesauftrags darunter. */
  async function einstufung(huelle, ctx, t, modul) {
    if (L.Lauf.laeuft()) return;
    if (L.Start && L.Start.entsperre) L.Start.entsperre();
    raeume(huelle);
    ctx.sperre(true);
    try {
      const m = L.registry.module.get(modul.id);
      await runde(huelle, { art: 'einstufung', fach: m ? m.fach : null, plan: { heute: t.tag, modul: modul.id, eintraege: L.Einstieg.einstufungsPlan(L.Zustand.hole(), modul.id, t.tag),
        deckel: t.deckel, maxMinuten: L.Lernplan.tagesauftrag().maxMinuten } });
    } catch (fehler) { melde(fehler); } finally { ctx.sperre(false); }
    L.Huelle.aktualisiere();
    zeige(huelle, ctx);
  }

  /** Rohstoff-Objekt einer Runde (Iso.objekt), ohne Welt-Thema die Miniatur des Tagesauftrags. */
  function bild(fach, px) {
    const r = rohstoff(fach), el = H(`span.runde-objekt${r ? '' : '.ohne'}`, { 'aria-hidden': 'true' });
    try { el.innerHTML = r && L.Iso && L.Iso.objekt ? L.Iso.objekt(r.symbol, { groesse: px }) : L.Iso && L.Iso.mini ? L.Iso.mini('lernen') : ''; } catch (e) { /* ohne Bild */ }
    return el;
  }

  /** Karte einer Runde: links das Fach als Rohstoff-Objekt, rechts Titel, Etikett «neu», Anzahl und Minuten, Ertrag. Die ganze Karte startet die Runde. */
  function karte(r, t, huelle, ctx, haupt) {
    const ro = rohstoff(r.id), gross = bild(r.id, 76);
    const tint = ro ? { style: `--tint: var(--${ro.symbol}-tint, var(--akzent-hell))` } : {};
    const hervor = !!(ctx.daten && ctx.daten.fach && ctx.daten.fach === r.id);       // «Rechnen üben» aus der Siedlung oder dem Hafen meint diese Runde
    return H(`article.kachel.runde-karte${hervor ? '.hervor' : ''}`, { 'data-runde': r.id, ...tint },
      H('div.runde-bild', gross),
      H('div.runde-text',
        H('div.kachel-kopf', H('h3', r.titel), r.neu ? H('span.etikett', R().neu(r.neu)) : ''),
        H('p.runde-info', R().rundeInfo(r.aufgaben, r.minuten)),
        ro ? H('p.runde-ertrag', bild(r.id, 22), R().ertragVon(ro.name)) : '',
        H('div.kachel-fuss', H(`button.knopf.runde-los${haupt ? '.primaer' : ''}`, { type: 'button', 'aria-label': R().rundeStarten(r.titel), onclick: () => spiele(huelle, ctx, t, [r], 'tagesauftrag', gross) }, T().starten))));
  }

  /** Alles Fällige ist erledigt: Zusammenfassung des Tages und die freiwillige Zusatzrunde. In den Ferien gibt es weder «Morgen kommt Neues» noch eine Zusatzrunde. */
  function erledigt(t, huelle, ctx) {
    const z = t.ferien ? [] : L.Lernplan.zusatz();
    const kopf = t.ferien ? ''
      : t.gemacht.aufgaben > 0
        ? H('div.kasten.ok', { role: 'status' }, H('b', T().erledigt), ` ${T().erledigtZahlen(t.gemacht.aufgaben, t.gemacht.richtig)} ${t.zeitUm ? T().zeitUm : T().morgenNeu}`)
        : H('div.kasten.hilfe', { role: 'status' }, T().nichtsFaellig);
    const extra = z.length && !t.zeitUm ? H('article.kachel.zusatz', H('h3', T().zusatz), H('p', L.Rueckmeldung.texte.zusatzHinweis()), H('p.klein', T().zusatzFrei),
      H('div.kachel-fuss', H('button.knopf', { type: 'button', onclick: () => spiele(huelle, ctx, t, [{ id: 'zusatz', eintraege: z }], 'zusatz') }, T().zusatzStarten))) : '';
    return [kopf, extra];
  }

  /** Ohne Modul gibt es für das Kind nichts zu tun: ein Satz und der Weg zu den Eltern (die Module schaltet der Elternbereich ein). */
  const keinModul = ctx => H('div.kein-modul', H('p', T().keinModul), L.Ansichten.start && L.Ansichten.start.zuDenEltern ? L.Ansichten.start.zuDenEltern(ctx) : '');

  /** Die Karten der Einstufung stehen unter dem Tagesauftrag. In den ersten Tagen sind sie aufgeklappt, danach hinter «Weitere Möglichkeiten». */
  const weitere = (angebote, frueh) => (angebote.length ? H('details.weitere', { open: frueh }, H('summary', T().weitere), angebote) : '');

  /** Vorschau für Aufnahmen und Prüfung (docs/gestaltung-umbau.md 3.7): daten.vorschau = { eintraege: [{ key }] } oder { beispiel: '<typ>' } startet einen
      Lauf mit art 'vorschau' (schreibt nichts) im Aufgabenrahmen, danach steht wieder der Tagesauftrag da. */
  async function vorschau(huelle, ctx, v) {
    if (L.Lauf.laeuft()) return;
    const bsp = v.beispiel && L.Dienste.beispielKatalog ? L.Dienste.beispielKatalog(v.beispiel) : null;   // { beispiel: '<typ>' }: das eingebaute Beispiel des Typs
    const eintraege = bsp ? bsp.eintraege : Array.isArray(v.eintraege) ? v.eintraege : [], m = eintraege.length ? L.registry.module.get(String(eintraege[0].key).split('/')[0]) : null;
    raeume(huelle);
    ctx.sperre(true);
    try { await runde(huelle, { art: 'vorschau', fach: m ? m.fach : null, plan: { heute: L.Lernplan.heute(L.Zustand.hole()), eintraege, ...(bsp ? { katalog: bsp } : {}) } }); } catch (fehler) { melde(fehler); } finally { ctx.sperre(false); }
    zeige(huelle, { ...ctx, daten: {} });
  }

  /** Die Tafel «Tagesauftrag» in der Ansicht (quer von rechts, hoch als Blatt). Ohne Tafel-Baustein steht der Inhalt direkt in der Ansicht. */
  function tafelMit(huelle, ctx, t, inhalt) {
    raeume(huelle);
    const zahlen = t.aufgaben && !t.ferien;
    if (!L.Tafel) { huelle.replaceChildren(H('div.seite.lernen', H('h2', T().titel), inhalt)); return null; }
    huelle.replaceChildren();
    huelle.classList.add('lernen-auswahl');
    tafel = L.Tafel.oeffne(huelle, { art: 'seite', klasse: 'lernen-tafel', kicker: zahlen ? T().titel : '', titel: zahlen ? R().umfang(t.aufgaben, t.minuten) : T().titel,
      schliessen: () => ctx.gehe('start'), schliessenText: R().schliessen });
    tafel.rumpf.append(H('div.lernen', inhalt));
    const eigene = tafel;
    return { schliesse: () => { if (tafel === eigene) raeume(huelle); } };
  }

  function zeige(huelle, ctx) {
    if (ctx.daten && ctx.daten.vorschau) { vorschau(huelle, ctx, ctx.daten.vorschau); return undefined; }
    let t, ergebnisse = [], angebote = [], frueh = true;
    try { t = L.Lernplan.tagesauftrag(); } catch (fehler) { melde(fehler); raeume(huelle); huelle.replaceChildren(H('div.kasten.fehler', T().modulFehler(fehler.message))); return undefined; }
    try {
      const doc = L.Zustand.hole();
      frueh = Object.keys(doc.tage || {}).length < 3;
      ergebnisse = L.Einstieg.ergebnis(doc, t.tag);
      // Eine Einstufung nach der anderen: mit mehreren neuen Modulen läge der Tagesauftrag sonst unter lauter gleichen Karten. In den Ferien gibt es keine.
      angebote = t.ferien ? [] : L.Einstieg.angebot(doc, t.tag).slice(0, 1).map(m => L.Einstieg.karte(m, () => einstufung(huelle, ctx, t, m)));
    } catch (fehler) { melde(fehler); }
    // «Nächste Runde» aus dem Abschluss: die Runde des Fachs startet sofort (gibt es sie nicht mehr, steht die Auswahl da)
    const los = ctx.daten && ctx.daten.los && !t.erledigt && !t.keinModul ? t.runden.find(r => r.id === ctx.daten.fach) : null;
    if (los) { spiele(huelle, ctx, t, [los], 'tagesauftrag'); return undefined; }
    const probleme = t.probleme.map(p => H('div.kasten.fehler', { role: 'alert' }, T().modulFehler(`${p.modul}: ${p.grund}`)));
    const ferien = t.ferien && !t.keinModul ? H('div.kasten.hilfe.ferien', { role: 'status' }, H('b', T().ferien(t.ferien.name)),
      ` ${t.gemacht.aufgaben > 0 ? T().ferienGeuebt(t.gemacht.aufgaben) : (t.aufgaben > 0 ? T().ferienFrei : '')}`.trimEnd()) : '';
    const inhalt = t.keinModul ? keinModul(ctx) : t.erledigt ? erledigt(t, huelle, ctx) : [
      H('div.kacheln.runden', t.runden.map(r => karte(r, t, huelle, ctx, t.runden.length === 1))),
      t.runden.length > 1 ? H('button.knopf.primaer.gross.lernen-alle', { type: 'button', onclick: ev => spiele(huelle, ctx, t, t.runden, 'tagesauftrag', ev && ev.currentTarget) }, T().alle) : '',
      t.gemacht.aufgaben > 0 ? H('p.hinweis', T().schonHeute(t.gemacht.aufgaben)) : ''];
    const unter = t.runden.length > 1 && !t.ferien && !t.erledigt ? H('p.unterzeile', R().reihenfolge) : '';
    return tafelMit(huelle, ctx, t, [unter, probleme, ferien, ergebnisse, inhalt, weitere(angebote, frueh)]) || undefined;
  }

  L.Ansichten.lernen = { id: 'lernen', get titel() { return L.Texte.menue.lernen; }, icon: 'ueben', dock: 20, haupt: true,
    buehne: { kamera: 'start', schleier: 'leicht' }, zeige };
})(globalThis);
