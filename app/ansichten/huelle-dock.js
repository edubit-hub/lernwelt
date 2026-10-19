/* app/ansichten/huelle-dock.js: das schwebende Dock unten (docs/gestaltung-umbau.md 2.1 und 3.1, Vorbild docs/mockup/richtung-a/a-stil.css «Dock»).
     nav.dock > button.dock-knopf[data-ansicht] (Iso-Miniatur und Wort), in der Mitte der grosse plastische Hauptknopf button.dock-haupt[data-ansicht=lernen]
     mit «Tagesauftrag», Anzahl und Minuten, darüber die Statuszeile .heute mit dem Stand des Tages (Texte aus texte.js, in den Ferien ohne Rückstand).
   Die Reihenfolge kommt aus Huelle.dockEintraege (Rang dock). Der Hauptknopf steht in der Mitte der übrigen Einträge.
   Die Miniaturen liefert Iso.mini (F3), für eine Ansicht ohne eigene Miniatur steht das Linien-Icon der Ansicht. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.huelle, TL = () => L.Texte.lernen;
  const sicher = (f, sonst) => { try { return f(); } catch (e) { return sonst; } };
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };

  function mini(e) {
    const el = H('span.dock-mini', { 'aria-hidden': 'true' }), svg = sicher(() => (L.Iso && L.Iso.mini && (!L.Iso.MINIS || L.Iso.MINIS.includes(e.id)) ? L.Iso.mini(e.id) : ''), '');
    if (svg) el.innerHTML = svg; else el.append(H(`span.ico.ico-${e.icon || 'ueben'}`));
    return el;
  }

  /** Der Tagesauftrag für Hauptknopf und Statuszeile, oder null (kein Modul, Fehler). */
  function tagesauftrag() {
    try { return L.Lernplan.tagesauftrag(); } catch (fehler) { melde(fehler); return null; }
  }

  /** Stand des Tages im Hauptknopf: der Satz für Vorleser (Texte aus texte.js) und ein dünner Balken, sobald heute etwas gemacht ist.
      In den Ferien nie ein Rückstand und kein Balken. Ohne Modul nichts. Haken: .dock .heute (textContent). */
  function heute(t) {
    if (!t || t.keinModul) return '';
    const gesamt = t.gemacht.aufgaben + t.aufgaben, anteil = gesamt ? Math.round(100 * t.gemacht.aufgaben / gesamt) : 100;
    if (t.ferien) return H('span.heute', H('span.nur-vorlesen', t.gemacht.aufgaben > 0 ? TL().statusFerienGeuebt(t.gemacht.aufgaben) : TL().statusFerien));
    const balken = t.gemacht.aufgaben > 0 ? H('span.spur', { 'aria-hidden': 'true' }, H('i', { style: `width:${anteil}%` })) : '';
    return H(`span.heute${balken ? '.mit-balken' : ''}`, H('span.nur-vorlesen', t.erledigt ? TL().statusErledigt : TL().statusOffen(t.aufgaben)), balken);
  }

  function hauptInhalt(t) {
    const info = !t || t.keinModul ? '' : t.ferien ? '' : t.erledigt || !t.aufgaben ? T().hauptErledigt : T().hauptInfo(t.aufgaben, t.minuten);
    return [H('span.haupt-ring', { 'aria-hidden': 'true' }, H('span.ico.ico-pfeil')),
      H('span.haupt-text', H('b', t && t.ferien && !t.keinModul ? T().hauptFerien : T().haupt), info ? H('small.haupt-info', info) : ''), heute(t)];
  }

  /** api: { gehe(id) } */
  function baue(api) {
    const el = H('nav.dock', { 'aria-label': T().dockName });
    // Der Tipp spielt «taste» und entsperrt in derselben Berührung Sprache und Audio (iOS), dann geht es weiter
    const knopf = (e, aktuell, gesperrt, inhalt, extra = '') => H(`button.dock-knopf${extra}`, {
      type: 'button', 'data-ansicht': e.id, 'aria-current': e.id === aktuell ? 'page' : null, 'aria-disabled': gesperrt && e.id !== aktuell ? 'true' : null,
      onclick: () => { if (L.Klang && L.Klang.spiele) sicher(() => L.Klang.spiele('taste')); if (L.Start && L.Start.entsperre) sicher(() => L.Start.entsperre()); api.gehe(e.id); } }, inhalt);
    let hauptKnopf = null;

    return {
      el,
      /** eintraege: [{ id, titel, icon, haupt }] in Reihenfolge, aktuell: ID der Ansicht, gesperrt: während einer Runde.
          Auf dem Start ist der Hauptknopf der eine Einstieg in den Tag (.start-los, in den Ferien .ferien). */
      zeichne({ eintraege, aktuell, gesperrt }) {
        const haupt = eintraege.find(e => e.haupt), rest = eintraege.filter(e => !e.haupt), t = haupt ? tagesauftrag() : null;
        const knoepfe = rest.map(e => knopf(e, aktuell, gesperrt, [mini(e), H('span.txt', e.titel)]));
        const los = aktuell === 'start' && t && !t.keinModul ? `.start-los${t.ferien ? '.ferien' : ''}` : '';
        hauptKnopf = haupt ? knopf(haupt, aktuell, gesperrt, hauptInhalt(t), `.dock-haupt${los}`) : null;
        if (hauptKnopf) knoepfe.splice(Math.ceil(rest.length / 2), 0, hauptKnopf);
        el.replaceChildren(H('div.dock-reihe', knoepfe));
      },
      /** Nur den Stand des Tages im Hauptknopf neu (nach jeder Antwort einer Runde). */
      heute() {
        if (!hauptKnopf) return;
        const alt = Array.from(hauptKnopf.children).find(c => (c.getAttribute('class') || '').split(/\s+/).includes('heute')), neu = heute(tagesauftrag());
        if (alt) alt.remove();
        if (neu) hauptKnopf.append(neu);
      }
    };
  }

  L.HuelleDock = { baue, heute };
})(globalThis);
