/* app/ansichten/lernen.js: die Ansicht «Lernen» (Architektur 6.4, «Tagesauftrag mit wählbaren Runden»). Zeigt den Tagesauftrag als Karten je Fach, das Kind
   wählt die Reihenfolge oder startet «Alle der Reihe nach». Eine Runde führt Lauf.start durch, danach zeigt der Abschluss den Bericht mit Ertrag.
   Ist alles Fällige erledigt, bietet die Ansicht eine freiwillige Zusatzrunde an und sagt offen, dass sie keinen Ertrag bringt (7.3).
   Der Plan kommt aus Lernplan.tagesauftrag, der Ertrag aus dem Zuwachs der Welt-Verbindung (Start.zuwachs), die Ansicht schreibt nichts selbst. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.lernen;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const tag = { heute: null, zustand: null, berichte: [], ertrag: {} };            // was seit dem Start der App heute schon fertig wurde (ein neuer Tag beginnt leer)
  const plus = (summe, mehr) => { for (const [k, n] of Object.entries(mehr)) summe[k] = (summe[k] || 0) + n; return summe; };
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
    if (tag.heute !== t.tag || tag.zustand !== L.Zustand) Object.assign(tag, { heute: t.tag, zustand: L.Zustand, berichte: [], ertrag: {} });
    const vorher = zuwachs(), thema = welt(), vorMoeglich = thema ? L.Abschluss.moeglich(L.Zustand.hole(), thema) : null, berichte = [];
    ctx.sperre(true);
    try {
      for (const r of runden) {
        const plan = art === 'zusatz' ? { heute: t.tag, eintraege: r.eintraege, deckel: t.deckel }
          : { heute: t.tag, eintraege: r.eintraege, deckel: t.deckel, maxMinuten: L.Lernplan.tagesauftrag().maxMinuten };
        const laufHuelle = H('div.lauf-huelle');
        huelle.replaceChildren(laufHuelle);
        const b = await L.Lauf.start({ art, plan, huelle: laufHuelle });
        berichte.push(b);
        if (b.abgebrochen || b.zeitdeckel) break;
      }
    } catch (fehler) { melde(fehler); } finally { ctx.sperre(false); }
    const gewinn = unterschied(zuwachs(), vorher), abgebrochen = berichte.some(b => b.abgebrochen);
    if (art === 'tagesauftrag') { tag.berichte.push(...berichte.map(b => ({ ...b, abgebrochen: false }))); plus(tag.ertrag, gewinn); }   // eine später fortgesetzte Pause zählt im Tagesbericht nicht
    // Ist der Tagesauftrag damit fertig, fasst der Abschluss den ganzen Tag zusammen, sonst nur diese Runden
    const tagesweit = art === 'tagesauftrag' && !abgebrochen && L.Lernplan.tagesauftrag().erledigt;
    L.Huelle.aktualisiere();
    L.Abschluss.zeige(huelle, { bericht: L.Lauf.summiere(tagesweit ? tag.berichte : berichte), ertrag: ertragListe(tagesweit ? tag.ertrag : gewinn, thema),
      erledigt: (art === 'zusatz' || tagesweit) && !abgebrochen, thema,
      neu: thema ? L.Abschluss.neuMoeglich(vorMoeglich, L.Abschluss.moeglich(L.Zustand.hole(), thema)) : [],
      weiter: () => ctx.gehe('lernen'), start: () => ctx.gehe('start'), siedlung: () => ctx.gehe('siedlung') });
  }

  const karte = (r, t, huelle, ctx, haupt) => H('article.kachel', { 'data-runde': r.id },
    H('div.kachel-kopf', H('h3', r.titel), r.neu ? H('span.etikett', T().neu(r.neu)) : ''), H('p', T().rundeInfo(r.aufgaben, r.minuten)),
    H('div.kachel-fuss', H(`button.knopf${haupt ? '.primaer' : ''}`, { type: 'button', onclick: () => spiele(huelle, ctx, t, [r], 'tagesauftrag') }, T().starten)));

  /** Alles Fällige ist erledigt: Zusammenfassung des Tages und die freiwillige Zusatzrunde. */
  function erledigt(t, huelle, ctx) {
    const z = L.Lernplan.zusatz();
    const kopf = t.gemacht.aufgaben > 0
      ? H('div.kasten.ok', { role: 'status' }, H('b', T().erledigt), ` ${T().erledigtZahlen(t.gemacht.aufgaben, t.gemacht.richtig)} ${t.zeitUm ? T().zeitUm : T().morgenNeu}`)
      : H('div.kasten.hilfe', { role: 'status' }, T().nichtsFaellig);
    const extra = z.length && !t.zeitUm ? H('article.kachel.zusatz', H('h3', T().zusatz), H('p', L.Rueckmeldung.texte.zusatzHinweis()), H('p.klein', T().zusatzFrei),
      H('div.kachel-fuss', H('button.knopf', { type: 'button', onclick: () => spiele(huelle, ctx, t, [{ id: 'zusatz', eintraege: z }], 'zusatz') }, T().zusatzStarten))) : '';
    return [kopf, extra];
  }

  function zeige(huelle, ctx) {
    let t;
    try { t = L.Lernplan.tagesauftrag(); } catch (fehler) { melde(fehler); huelle.replaceChildren(H('div.kasten.fehler', T().modulFehler(fehler.message))); return; }
    const probleme = t.probleme.map(p => H('div.kasten.fehler', { role: 'alert' }, T().modulFehler(`${p.modul}: ${p.grund}`)));
    const inhalt = t.keinModul ? H('div.kasten.hilfe', T().keinModul) : t.erledigt ? erledigt(t, huelle, ctx) : [
      H('div.kacheln', t.runden.map(r => karte(r, t, huelle, ctx, t.runden.length === 1))),
      t.runden.length > 1 ? H('button.knopf.primaer.gross.lernen-alle', { type: 'button', onclick: () => spiele(huelle, ctx, t, t.runden, 'tagesauftrag') }, T().alle) : '',
      t.gemacht.aufgaben > 0 ? H('p.hinweis', T().schonHeute(t.gemacht.aufgaben)) : ''];
    huelle.replaceChildren(H('div.seite.lernen', H('h2', T().titel), H('p.unterzeile', t.aufgaben ? T().unterzeile(t.aufgaben, t.minuten) : ''), probleme, inhalt));
  }

  L.Ansichten.lernen = { id: 'lernen', get titel() { return L.Texte.menue.lernen; }, icon: 'ueben', menue: 20, zeige };
})(globalThis);
