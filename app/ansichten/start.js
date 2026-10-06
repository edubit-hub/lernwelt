/* app/ansichten/start.js: die Startansicht (Architektur 5.7, 7.8, 8.5). Beim ersten Start legt sie das Profil an (Vorname, Klasse), danach grüsst sie,
   nennt den Umfang des Tages und hat den Knopf «Start». Der Tipp darauf entsperrt in derselben Berührung Sprache und Audio (iOS), ein kleiner Knopf
   «Eltern» führt in den Elternbereich (AP-13a meldet ihn als Lernwelt.Ansichten.eltern an). Nur hier erscheint «Neue Version bereit» (8.5). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.start;
  const S = () => L.Start || {};
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };

  /** Die Ansicht «eltern» (F-AP12-01). Meldet sich der Elternbereich nur als Lernwelt.Eltern.zeige(huelle, { onZurueck }) (AP-13a), macht diese Datei
      daraus beim ersten Gebrauch eine Ansicht. Eine echte Anmeldung als Lernwelt.Ansichten.eltern geht vor. */
  function elternAnsicht() {
    if (!L.Ansichten.eltern && L.Eltern && typeof L.Eltern.zeige === 'function') {
      L.Ansichten.eltern = { id: 'eltern', get titel() { return L.Texte.start.eltern; }, zeige: (huelle, ctx) => L.Eltern.zeige(huelle, { onZurueck: () => ctx.gehe('start') }) };
    }
    return L.Huelle.ansicht('eltern');
  }

  /** Steht im Elternbereich eine Erinnerung an (Sicherung fällig, V-AP13a-01)? Fehlt der Elternbereich oder scheitert die Frage, gibt es keinen Hinweis. */
  const elternHinweis = () => { try { return !!(L.ElternDaten && L.ElternDaten.lage(L.Zustand.hole(), L.Tag.heute()).erinnerung); } catch (e) { return false; } };

  /** Der unauffällige Einstieg in den Elternbereich, mit einem kleinen Punkt, wenn dort ein Hinweis wartet. Ohne Elternbereich meldet er das ehrlich. */
  const eltern = (ctx, hinweis = false) => H('button.knopf.leise.start-eltern', { type: 'button', 'aria-label': hinweis ? T().elternMitHinweis : T().elternBeschriftung, title: hinweis ? T().elternHinweis : null, onclick: () => {
    if (elternAnsicht()) ctx.gehe('eltern'); else L.ui.dialog.meldung(T().elternFehlt);
  } }, T().eltern, hinweis ? H('i.start-punkt', { 'aria-hidden': 'true' }) : '');
  /** Hinweise zum Gerät und zum Speicher: sachlich, ohne Dringlichkeit. */
  function hinweise() {
    const texte = [...(S().hinweise || [])], st = L.Zustand.status();
    if (st.hinweisText && !S().hinweisGezeigt) { texte.push(st.hinweisText); if (L.Start) L.Start.hinweisGezeigt = true; }
    return texte.map(t => H('div.kasten.hilfe', { role: 'status' }, t));
  }

  /** «Neue Version bereit, jetzt laden» (8.5): nur auf dem Startbildschirm, nie mitten in einer Sitzung. */
  const update = () => (S().sw && S().sw.bereit() ? H('div.kasten.hilfe.start-update', { role: 'status' }, H('b', T().neueVersion),
    H('button.knopf', { type: 'button', onclick: () => S().sw.aktiviere() }, T().neueVersionKnopf)) : '');

  /** Profil beim ersten Start. Aktiviert die Module der Klasse (Start.modulWahl), lädt sie und öffnet danach die Startansicht. */
  function profil(ctx) {
    let klasse = 3;
    const feld = H('input.profil-feld', { type: 'text', id: 'profil-vorname', maxlength: '30', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'words', spellcheck: 'false',
      onkeydown: e => { if (e.key === 'Enter') speichere(); } });
    const meldung = H('p.fehler-text.klein', { role: 'alert' });
    const knoepfe = [3, 4, 5, 6].map(k => H('button.knopf', { type: 'button', 'aria-pressed': String(k === klasse), onclick: () => {
      klasse = k; knoepfe.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 3 === k)));
    } }, String(k)));
    const weiter = H('button.knopf.primaer.gross', { type: 'button', onclick: () => speichere() }, T().weiter);
    async function speichere() {
      const name = String(feld.value || '').trim().replace(/\s+/g, ' ').slice(0, 30);
      if (!name) { meldung.textContent = T().vornameFehlt; if (feld.focus) feld.focus(); return; }
      weiter.disabled = true;
      L.Zustand.aendere(d => { d.profil.vorname = name; d.profil.klasse = klasse; (S().modulWahl ? S().modulWahl(klasse) : []).forEach(id => { L.Zustand.modul(id).aktiv = true; }); });
      try { if (S().ladeModule) await S().ladeModule(); } catch (fehler) { melde(fehler); }
      ctx.gehe('start');
    }
    return H('div.start-seite', H('h1', T().willkommen), H('p.unterzeile', T().profilEinleitung),
      H('div.profil', H('label.profil-etikett', { for: 'profil-vorname' }, T().vorname), feld,
        H('div.profil-etikett', { id: 'profil-klasse' }, T().klasse), H('div.wahl', { role: 'group', 'aria-labelledby': 'profil-klasse' }, knoepfe), meldung, weiter),
      H('div.start-fuss', eltern(ctx)));
  }

  /** Der grosse Knopf «Zu den Eltern»: Ist noch nichts eingerichtet, ist das für das Kind der einzige Weg (die Module schaltet der Elternbereich ein). */
  const zuDenEltern = ctx => H('button.knopf.primaer.gross.start-zu-eltern', { type: 'button', onclick: () => {
    if (elternAnsicht()) ctx.gehe('eltern'); else L.ui.dialog.meldung(T().elternFehlt);
  } }, T().zuDenEltern);

  /** Zusammenfassung des Tages in einem Satz. In den Ferien steht, dass es keinen Tagesauftrag gibt, und nie ein Rückstand. */
  function heute(t) {
    if (t.keinModul) return '';
    if (t.ferien) return `${T().heuteFerien(t.ferien.name)}${t.gemacht.aufgaben > 0 ? ` ${T().heuteFerienGeuebt(t.gemacht.aufgaben)}` : ''}`;
    if (t.aufgaben > 0) return T().heuteOffen(t.aufgaben, t.minuten);
    return t.gemacht.aufgaben > 0 ? T().heuteErledigt : T().heuteNichts;
  }

  function zeige(huelle, ctx) {
    const doc = L.Zustand.hole(), r = S().ergebnis || {};
    if (r.fehler) {
      huelle.replaceChildren(H('div.start-seite', H('h1', T().fehlerTitel), H('div.kasten.fehler', { role: 'alert' }, L.Zustand.status().text || ''), update(), H('div.start-fuss', eltern(ctx))));
      return;
    }
    if (!doc.profil || !String(doc.profil.vorname || '').trim()) { huelle.replaceChildren(profil(ctx)); return; }
    let t = null;
    try { t = L.Lernplan.tagesauftrag(); } catch (fehler) { melde(fehler); }
    const los = t && !t.keinModul ? H('button.knopf.primaer.gross.start-los', { type: 'button', onclick: () => { if (S().entsperre) S().entsperre(); ctx.gehe('lernen'); } }, t.ferien ? T().losFerien : T().los) : '';
    // Die Versionsnummer steht im Elternbereich unter «Diagnose», nicht hier.
    huelle.replaceChildren(H('div.start-seite', L.Abschluss && L.Abschluss.insel ? L.Abschluss.insel() : '', H('h1', T().hallo(doc.profil.vorname)),
      H('p.unterzeile', t ? heute(t) : ''), t && t.keinModul ? H('div.kein-modul', H('p', T().keinModul), zuDenEltern(ctx)) : '', update(), hinweise(), los,
      H('div.start-fuss', eltern(ctx, elternHinweis()))));
  }

  // titel als Getter: texte.js lädt nach dieser Datei (alphabetisch), gelesen wird erst beim Aufruf
  L.Ansichten.start = { id: 'start', get titel() { return L.Texte.menue.start; }, icon: 'pfeil', menue: 10, zeige, zuDenEltern };
})(globalThis);
