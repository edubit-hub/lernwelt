/* app/ansichten/inseln.js: die Ansichten der Fachinseln (Plan 0.2, S3). Nur mit einem Welt-Thema der Art «inseln» (welt: 'inseln', die Hülle blendet sie sonst aus).
     inseln: alle Inseln im Meer (Kamera «archipel»), daneben eine schmale Tafel mit je einem Knopf je Insel. Die Wahl merkt sich das Fach und zeigt die Insel.
     areal: die Tafel eines Areals (Kamera in der Nahansicht), mit Phase, nächstem Schritt, Miniatur und den Themen mit «Üben».
     themen: alle Themen aller Inseln als Liste, je Thema «Üben» (der Weg ohne Karte).
   Geschrieben wird nur die Wahl der Insel (zustand.welt.<id>.fach). Üben startet die Ansicht «lernen» mit { thema: { modul, thema, areal } }. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.inseln, D = () => L.InselDaten;
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const sicher = (f, sonst) => { try { return f(); } catch (fehler) { melde(fehler); return sonst; } };

  /** Merkt die gewählte Insel und zeigt sie (Startansicht mit der Insel des Fachs). */
  function waehleInsel(fach, ctx) {
    const id = L.Start && L.Start.welt ? L.Start.welt.id : null;
    if (id) sicher(() => L.Zustand.aendere(z => { z.welt = z.welt || {}; z.welt[id] = { ...(z.welt[id] || {}), fach }; }));
    if (ctx.buehne && typeof ctx.buehne.aktualisiere === 'function') sicher(() => ctx.buehne.aktualisiere());
    ctx.gehe('start');
  }

  const standText = f => { const b = D().bau(), liste = D().areale(f); return T().ausgebaut(liste.filter(a => b[a.id] === 3).length, liste.length); };

  function zeigeInseln(huelle, ctx) {
    if (ctx.buehne && typeof ctx.buehne.beiWahl === 'function') ctx.buehne.beiWahl(w => { if (w && w.fach) waehleInsel(w.fach, ctx); });
    const tafel = ctx.tafel({ art: 'schmal', klasse: 'inseln-tafel', kicker: T().archipelKicker, titel: T().archipelTitel, schliessen: () => ctx.gehe('start') });
    huelle.replaceChildren();
    const aktuell = D().fach();
    tafel.rumpf.append(H('p.unterzeile', T().archipelHinweis), H('div.inseln-liste', D().ordnung().filter(f => D().areale(f).length).map(f => {
      const stand = standText(f);
      return H(`button.inseln-knopf${f.fach === aktuell ? '.aktuell' : ''}`, { type: 'button', 'data-fach': f.fach, 'aria-label': T().inselKnopf(f.name, stand), onclick: () => waehleInsel(f.fach, ctx) },
        H('b', f.name), H('small', f.kultur), H('span.inseln-stand', stand));
    })));
    return { schliesse: () => tafel.schliesse() };
  }

  /** Eine Zeile der Themenliste: Titel, Stufe und «Üben». */
  function themaZeile(t, ctx, areal) {
    const stufe = sicher(() => D().themaStufe(t.key), 'neu');
    return H('li.thema-zeile', { 'data-thema': t.key },
      H('span.thema-titel', t.titel), H(`span.thema-stufe.s-${stufe}`, T().stufe[stufe]),
      H('button.knopf.thema-ueben', { type: 'button', 'aria-label': T().uebenThema(t.titel), onclick: () => ctx.gehe('lernen', { thema: { modul: t.modul, thema: t.thema, areal } }) }, T().ueben));
  }

  /** Vier Marken für die Phasen, die erreichten gefüllt. */
  const phasenLeiste = phase => H('ol.areal-phasen', { 'aria-hidden': 'true' }, T().phasen.map((n, i) => H(`li${i <= phase ? '.erreicht' : ''}`, n)));

  function zeigeAreal(huelle, ctx) {
    const id = ctx.daten && ctx.daten.areal, s = id ? sicher(() => D().fortschritt(id), null) : null;
    if (!s) { ctx.gehe('start'); return undefined; }
    if (ctx.buehne && typeof ctx.buehne.beiWahl === 'function') ctx.buehne.beiWahl(w => { if (w && w.areal && w.areal !== id) ctx.gehe('areal', { areal: w.areal }); });
    const a = s.areal, f = D().inselVon(null, a.fach);
    const tafel = ctx.tafel({ art: 'seite', klasse: 'areal-tafel', kicker: f ? f.name : '', titel: a.name, schliessen: () => ctx.gehe('start'), schliessenText: T().zurInsel });
    huelle.replaceChildren();
    const bild = sicher(() => (ctx.buehne && typeof ctx.buehne.miniatur === 'function' ? ctx.buehne.miniatur(a.id) : null), null);
    tafel.rumpf.append(
      bild ? H('img.areal-bild', { src: bild, alt: '' }) : '',
      H('p.areal-text', a.text),
      H('div.areal-stand', H('p.areal-phase', T().phaseVon(s.phase, T().phasen[s.phase])), phasenLeiste(s.phase),
        H('p.areal-naechste', s.naechste ? T().naechste(s.naechste.phase, s.naechste.hat, s.naechste.soll) : T().fertig)),
      H('h3.areal-themen-kopf', T().themenKopf),
      H('ul.thema-liste', a.themen.map(t => themaZeile(t, ctx, a.id))));
    return { schliesse: () => tafel.schliesse() };
  }

  function zeigeThemen(huelle, ctx) {
    const tafel = ctx.tafel({ art: 'seite', klasse: 'themen-tafel', kicker: T().themenKicker, titel: T().themenTitel, schliessen: () => ctx.gehe('start') });
    huelle.replaceChildren();
    const aktuell = D().fach();
    tafel.rumpf.append(...D().ordnung().filter(f => D().areale(f).length).map(f => H('details.themen-fach', { open: f.fach === aktuell },
      H('summary', H('b', f.name), H('small', standText(f))),
      D().areale(f).map(a => H('section.themen-areal', H('h4', a.name), H('ul.thema-liste', a.themen.map(t => themaZeile(t, ctx, a.id))))))));
    return { schliesse: () => tafel.schliesse() };
  }

  L.Ansichten.inseln = { id: 'inseln', welt: 'inseln', get titel() { return L.Texte.inseln.fachinseln; }, icon: 'insel', dock: 10,
    buehne: { kamera: 'archipel', schleier: 'keine', marken: 'orte' }, zeige: zeigeInseln };
  L.Ansichten.areal = { id: 'areal', welt: 'inseln', get titel() { return L.Texte.inseln.themen; },
    buehne: d => ({ kamera: d && d.areal ? `areal:${d.areal}` : 'start', schleier: 'keine', marken: 'orte' }), zeige: zeigeAreal };
  L.Ansichten.themen = { id: 'themen', welt: 'inseln', get titel() { return L.Texte.inseln.themen; }, icon: 'liste', dock: 30,
    buehne: { kamera: 'start', schleier: 'leicht', marken: 'keine' }, zeige: zeigeThemen };
  L.InselAnsicht = { waehleInsel };
})(globalThis);
