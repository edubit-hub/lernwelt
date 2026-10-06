/* app/ansichten/lernen.js: die Ansicht «Lernen» (Architektur 6.4, «Tagesauftrag mit wählbaren Runden»). Zeigt den Tagesauftrag als Karten je Fach, das Kind
   wählt die Reihenfolge oder startet «Alle der Reihe nach». Eine Runde führt Lauf.start durch, danach zeigt der Abschluss den Bericht mit Ertrag.
   Ist alles Fällige erledigt, bietet die Ansicht eine freiwillige Zusatzrunde an und sagt offen, dass sie keinen Ertrag bringt (7.3).
   Beim ersten Kontakt mit einem Modul bietet sie zusätzlich die Einstufungsrunde an (einstieg.js, AP-23).
   Der Plan kommt aus Lernplan.tagesauftrag. Der Tagesbericht zählt aus dem Tageslog des Zustands (zustand.tage[heute]) und nicht seit dem Start der App,
   auch der Ertrag steht dort (Start.merkeErtrag). Die Ansicht schreibt nichts selbst. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.lernen;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const tag = { heute: null, zustand: null, berichte: [] };                       // die Themenstufen der Runden seit dem Start (der Tageslog kennt sie nicht), ein neuer Tag beginnt leer
  const unterschied = (nachher, vorher) => Object.fromEntries(Object.entries(nachher).map(([k, n]) => [k, n - (vorher[k] || 0)]).filter(([, n]) => n > 0));
  const welt = () => (L.Start && L.Start.welt) || null;
  const zuwachs = () => (L.Start && L.Start.zuwachs ? L.Start.zuwachs().ertrag : {});

  /** Ertrag je Fach als Liste { name, menge }: mit Welt-Thema der Name des Rohstoffs, sonst der Name des Fachs. */
  function ertragListe(ertrag, thema) {
    return Object.entries(ertrag).filter(([, n]) => n > 0).map(([fach, menge]) => {
      const roh = thema && Object.values(thema.rohstoffe || {}).find(r => r.fach === fach);
      return { name: roh ? roh.name : L.Lernplan.fachName(fach), menge };
    });
  }

  /** Führt die gewählten Runden hintereinander durch und zeigt danach den Abschluss. art: 'tagesauftrag' oder 'zusatz'. */
  async function spiele(huelle, ctx, t, runden, art) {
    if (L.Lauf.laeuft()) return;
    if (L.Start && L.Start.entsperre) L.Start.entsperre();            // dieselbe Berührung wie der Tipp: iOS lässt Sprache nur aus einer Berührung zu
    if (tag.heute !== t.tag || tag.zustand !== L.Zustand) Object.assign(tag, { heute: t.tag, zustand: L.Zustand, berichte: [] });
    const vorher = zuwachs(), thema = welt(), vorMoeglich = thema ? L.Abschluss.moeglich(L.Zustand.hole(), thema) : null, berichte = [];
    ctx.sperre(true);
    try {
      for (const r of runden) {
        const plan = art === 'zusatz' ? { heute: t.tag, eintraege: r.eintraege, deckel: t.deckel }
          : { heute: t.tag, eintraege: r.eintraege, deckel: t.deckel, maxMinuten: L.Lernplan.tagesauftrag().maxMinuten, nachschub: L.Einstieg.nachschub(t.tag) };
        const laufHuelle = H('div.lauf-huelle');
        huelle.replaceChildren(laufHuelle);
        const b = await L.Lauf.start({ art, plan, huelle: laufHuelle });
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
    L.Abschluss.zeige(huelle, { bericht: tagesweit ? L.Bericht.ausTageslog(doc, t.tag, { stufen: L.Lauf.summiere(tag.berichte).stufen }) : L.Lauf.summiere(berichte),
      ertrag: ertragListe(tagesweit ? L.Bericht.ertragVon(doc, t.tag) : gewinn, thema),
      erledigt: (art === 'zusatz' || tagesweit) && !abgebrochen, thema, neu,
      weiter: () => ctx.gehe('lernen'), start: () => ctx.gehe('start'), siedlung: () => ctx.gehe('siedlung', { neu }) });   // die Siedlung zeigt «Neu möglich: ...» (AP-16)
  }

  /** Die Einstufungsrunde eines Moduls (art 'einstufung'). Danach steht das Ergebnis oben in der Ansicht, der Rest des Tagesauftrags darunter. */
  async function einstufung(huelle, ctx, t, modul) {
    if (L.Lauf.laeuft()) return;
    if (L.Start && L.Start.entsperre) L.Start.entsperre();
    ctx.sperre(true);
    try {
      const laufHuelle = H('div.lauf-huelle');
      huelle.replaceChildren(laufHuelle);
      await L.Lauf.start({ art: 'einstufung', plan: { heute: t.tag, modul: modul.id, eintraege: L.Einstieg.einstufungsPlan(L.Zustand.hole(), modul.id, t.tag),
        deckel: t.deckel, maxMinuten: L.Lernplan.tagesauftrag().maxMinuten }, huelle: laufHuelle });
    } catch (fehler) { melde(fehler); } finally { ctx.sperre(false); }
    L.Huelle.aktualisiere();
    zeige(huelle, ctx);
  }

  const karte = (r, t, huelle, ctx, haupt) => H('article.kachel', { 'data-runde': r.id },
    H('div.kachel-kopf', H('h3', r.titel), r.neu ? H('span.etikett', T().neu(r.neu)) : ''), H('p', T().rundeInfo(r.aufgaben, r.minuten)),
    H('div.kachel-fuss', H(`button.knopf${haupt ? '.primaer' : ''}`, { type: 'button', onclick: () => spiele(huelle, ctx, t, [r], 'tagesauftrag') }, T().starten)));

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

  function zeige(huelle, ctx) {
    let t, ergebnisse = [], angebote = [], frueh = true;
    try { t = L.Lernplan.tagesauftrag(); } catch (fehler) { melde(fehler); huelle.replaceChildren(H('div.kasten.fehler', T().modulFehler(fehler.message))); return; }
    try {
      const doc = L.Zustand.hole();
      frueh = Object.keys(doc.tage || {}).length < 3;
      ergebnisse = L.Einstieg.ergebnis(doc, t.tag);
      // Eine Einstufung nach der anderen: mit mehreren neuen Modulen läge der Tagesauftrag sonst unter lauter gleichen Karten. In den Ferien gibt es keine.
      angebote = t.ferien ? [] : L.Einstieg.angebot(doc, t.tag).slice(0, 1).map(m => L.Einstieg.karte(m, () => einstufung(huelle, ctx, t, m)));
    } catch (fehler) { melde(fehler); }
    const probleme = t.probleme.map(p => H('div.kasten.fehler', { role: 'alert' }, T().modulFehler(`${p.modul}: ${p.grund}`)));
    const ferien = t.ferien && !t.keinModul ? H('div.kasten.hilfe.ferien', { role: 'status' }, H('b', T().ferien(t.ferien.name)),
      ` ${t.gemacht.aufgaben > 0 ? T().ferienGeuebt(t.gemacht.aufgaben) : (t.aufgaben > 0 ? T().ferienFrei : '')}`.trimEnd()) : '';
    const inhalt = t.keinModul ? keinModul(ctx) : t.erledigt ? erledigt(t, huelle, ctx) : [
      H('div.kacheln', t.runden.map(r => karte(r, t, huelle, ctx, t.runden.length === 1))),
      t.runden.length > 1 ? H('button.knopf.primaer.gross.lernen-alle', { type: 'button', onclick: () => spiele(huelle, ctx, t, t.runden, 'tagesauftrag') }, T().alle) : '',
      t.gemacht.aufgaben > 0 ? H('p.hinweis', T().schonHeute(t.gemacht.aufgaben)) : ''];
    huelle.replaceChildren(H('div.seite.lernen', H('h2', T().titel), H('p.unterzeile', t.aufgaben && !t.ferien ? T().unterzeile(t.aufgaben, t.minuten) : ''), probleme, ferien, ergebnisse, inhalt, weitere(angebote, frueh)));
  }

  L.Ansichten.lernen = { id: 'lernen', get titel() { return L.Texte.menue.lernen; }, icon: 'ueben', menue: 20, zeige };
})(globalThis);
