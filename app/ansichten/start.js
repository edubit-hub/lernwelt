/* app/ansichten/start.js: die Startansicht (Architektur 5.7, 7.8, 8.5; docs/gestaltung-umbau.md 2.2 bis 2.4, Vorbild docs/mockup/richtung-a «start»).
   Die Insel steht in Totale (Kamera «start», ohne Schleier, Ortsschilder antippbar). Darauf liegt die Begrüssungskarte aus Glas: Datum als Kicker,
   «Hallo Mia.», der Satz zum Tag (in den Ferien ohne Rückstand) und das nächste Ziel als nächster Schritt. Der eine Einstieg ist der Hauptknopf
   «Tagesauftrag» im Dock (dort .start-los). Die Ortsschilder sagen, was an jedem Ort geht (start-orte.js).
   Quer steht die Karte links unter der Medaille, hoch im unteren Drittel über dem Dock (start.css). Ohne Profil liegt die Insel im leichten Schleier, das Dock fehlt, und eine Tafel
   «halb» fragt «Wie heisst du?» (Feld input.profil-feld, Klasse, «Weiter»). Den Weg in den Elternbereich bietet der Schlüssel im HUD
   (button.hud-eltern.start-eltern, huelle-hud.js, mit .start-punkt bei einem Hinweis); nur «Zu den Eltern» (.start-zu-eltern) steht hier, solange
   nichts eingerichtet ist. Nur hier erscheint «Neue Version bereit» (8.5). Texte: texte.js (Texte.start) und start-texte.js (Texte.startseite). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  L.Ansichten = L.Ansichten || {};

  const H = (...a) => L.ui.h(...a);
  const T = () => L.Texte.start, TS = () => L.Texte.startseite;
  const S = () => L.Start || {};
  const melde = fehler => { try { L.Fehlerlog.melde(fehler); } catch (e) { /* nur Protokoll */ } };
  const sicher = (f, sonst) => { try { return f(); } catch (fehler) { melde(fehler); return sonst; } };

  /** Fehlt das Profil (noch kein Vorname)? Scheitert die Frage, gilt das Profil als vorhanden. */
  const ohneProfil = doc => { try { const d = doc || L.Zustand.hole(); return !d.profil || !String(d.profil.vorname || '').trim(); } catch (e) { return false; } };

  /** Die Ansicht «eltern» (F-AP12-01). Meldet sich der Elternbereich nur als Lernwelt.Eltern.zeige(huelle, { onZurueck }) (AP-13a), macht diese Datei
      daraus beim ersten Gebrauch eine Ansicht. Eine echte Anmeldung als Lernwelt.Ansichten.eltern geht vor. */
  function elternAnsicht() {
    if (!L.Ansichten.eltern && L.Eltern && typeof L.Eltern.zeige === 'function') {
      L.Ansichten.eltern = { id: 'eltern', get titel() { return L.Texte.start.eltern; }, zeige: (huelle, ctx) => L.Eltern.zeige(huelle, { onZurueck: () => ctx.gehe('start') }) };
    }
    return L.Huelle.ansicht('eltern');
  }

  /** Hinweise zum Gerät und zum Speicher: sachlich, ohne Dringlichkeit. */
  function hinweise() {
    const texte = [...(S().hinweise || [])], st = L.Zustand.status();
    if (st.hinweisText && !S().hinweisGezeigt) { texte.push(st.hinweisText); if (L.Start) L.Start.hinweisGezeigt = true; }
    return texte.map(t => H('div.kasten.hilfe', { role: 'status' }, t));
  }

  /** «Neue Version bereit, jetzt laden» (8.5): nur auf dem Startbildschirm, nie mitten in einer Sitzung. */
  const update = () => (S().sw && S().sw.bereit() ? H('div.kasten.hilfe.start-update', { role: 'status' }, H('b', T().neueVersion),
    H('button.knopf', { type: 'button', onclick: () => S().sw.aktiviere() }, T().neueVersionKnopf)) : '');

  /** Profil beim ersten Start in einer Tafel «halb» (hoch als Blatt). Aktiviert die Module der Klasse (Start.modulWahl), lädt sie und öffnet danach
      die Startansicht. Gibt { schliesse } zurück, damit die Hülle die Tafel beim Wechsel wegräumt. Ohne Tafel (eingebettet) steht alles in der Ansicht. */
  function profil(huelle, ctx) {
    let klasse = 3;
    const feld = H('input.profil-feld', { type: 'text', id: 'profil-vorname', maxlength: '30', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'words', spellcheck: 'false',
      enterkeyhint: 'done', onkeydown: e => { if (e.key === 'Enter') speichere(); } });
    const meldung = H('p.fehler-text.klein', { role: 'alert' });
    const knoepfe = [3, 4, 5, 6].map(k => H('button.knopf', { type: 'button', 'aria-pressed': String(k === klasse), onclick: () => {
      klasse = k; knoepfe.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 3 === k)));
    } }, String(k)));
    const weiter = H('button.knopf.primaer.gross.profil-weiter', { type: 'button', onclick: () => speichere() }, T().weiter);
    async function speichere() {
      const name = String(feld.value || '').trim().replace(/\s+/g, ' ').slice(0, 30);
      if (!name) { meldung.textContent = T().vornameFehlt; if (feld.focus) feld.focus(); return; }
      weiter.disabled = true;
      L.Zustand.aendere(d => { d.profil.vorname = name; d.profil.klasse = klasse; (S().modulWahl ? S().modulWahl(klasse) : []).forEach(id => { L.Zustand.modul(id).aktiv = true; }); });
      try { if (S().ladeModule) await S().ladeModule(); } catch (fehler) { melde(fehler); }
      ctx.gehe('start');
    }
    const inhalt = H('div.profil-seite', H('p.unterzeile', `${T().willkommen} ${T().profilEinleitung}`),
      H('div.profil', H('label.profil-etikett', { for: 'profil-vorname' }, T().vorname), feld,
        H('div.profil-etikett', { id: 'profil-klasse' }, T().klasse), H('div.wahl', { role: 'group', 'aria-labelledby': 'profil-klasse' }, knoepfe), meldung));
    const tafel = typeof ctx.tafel === 'function' && L.Tafel ? sicher(() => ctx.tafel({ art: 'halb', klasse: 'profil-tafel', kicker: TS().profilKicker, titel: TS().profilTitel }), null) : null;
    if (!tafel) { huelle.replaceChildren(H('div.start-seite', H('h1', TS().profilTitel), inhalt, weiter)); return undefined; }
    huelle.replaceChildren();
    tafel.rumpf.append(inhalt);
    tafel.fuss.append(weiter);
    return { schliesse: () => tafel.schliesse() };
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

  /** Das nächste Ziel der Forschung (WeltDaten.ziel) als warme Karte. Sie sagt den nächsten Schritt: Wissen als Rauten, «noch 7 Stein»
      mit dem Rohstoff, oder «Sprachkunde I erforschen» mit vollen Rauten. Ohne Welt-Thema oder ohne offenes Ziel nichts. */
  function ziel(ctx) {
    const D = L.WeltDaten, B = L.WeltBausteine, h = L.Texte.huelle;
    if (!D || typeof D.kontext !== 'function' || typeof D.ziel !== 'function') return '';
    const z = sicher(() => { const k = D.kontext(); return k ? D.ziel(k) : null; }, null);
    if (!z) return '';
    const w = z.wissen, bild = H('span.start-ziel-bild', { 'aria-hidden': 'true' });
    bild.innerHTML = sicher(() => (L.Iso && L.Iso.mini && (!L.Iso.MINIS || L.Iso.MINIS.includes('forschung')) ? L.Iso.mini('forschung') : ''), '') || '';
    const lampen = w && B && typeof B.lampen === 'function' ? sicher(() => B.lampen(w.hat, w.braucht), '') : '';
    const unter = z.zustand === 'material' && z.fehlt[0] ? H('span.start-ziel-noch', B && B.objekt ? B.objekt(z.fehlt[0].symbol, 24) : '', D.standText(z.fehlt))
      : z.zustand === 'bereit' ? H('span.start-ziel-noch.bereit', lampen, H('span', h.bereitZumErforschen)) : lampen;
    return H(`button.start-ziel.z-${z.zustand || 'wissen'}`, { type: 'button', 'aria-label': TS().zielOeffnen(z.name), onclick: () => ctx.gehe('forschung', { wahl: z.id }) }, bild,
      H('span.start-ziel-text', H('small', TS().zielKicker), H('b', z.zustand === 'bereit' ? h.zielErforschen(z.name) : z.name), unter));
  }

  /** Die Karte gleitet herein (quer von links, hoch von unten), wenn die Hülle nicht gerade selbst einen Wechsel zeigt. Kein weiterer Effekt. */
  function gleite(el) {
    if (!L.Uebergang || !el || typeof el.animate !== 'function') return;
    Promise.resolve().then(() => {
      if (typeof el.getAnimations === 'function' && el.getAnimations().length) return;
      L.Uebergang.wechsel(el, { von: L.Tafel && L.Tafel.hoch() ? 'unten' : 'links' });
    }).catch(() => {});
  }

  /** Die Kamera rückt die Insel neben (quer) oder über (hoch) die Begrüssungskarte: freier Bereich aus der Lage der Karte im Layout. Nur im Browser. */
  function kameraNebenKarte(huelle, ctx) {
    const b = ctx.buehne, d = huelle.ownerDocument;
    if (!b || typeof b.kamera !== 'function' || typeof g.requestAnimationFrame !== 'function' || !d || typeof d.querySelector !== 'function') return;
    g.requestAnimationFrame(() => sicher(() => {
      const karte = huelle.querySelector('.start-seite');
      if (!karte || !karte.isConnected || !karte.offsetWidth || L.Huelle.aktuell() !== 'start') return;
      let x = 0, y = 0;                                   // Lage ohne die Transformation des Hereingleitens
      for (let n = karte; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
      const W = g.innerWidth, Hh = g.innerHeight, hud = d.querySelector('header.hud'), dock = d.querySelector('nav.dock');
      const oben = hud ? Math.round(hud.getBoundingClientRect().bottom) : 0, unten = dock ? Math.round(Hh - dock.getBoundingClientRect().top) : 0;
      b.kamera('start', { frei: Hh > W ? { links: 0, oben, rechts: 0, unten: Math.max(unten, Hh - y + 8) } : { links: x + karte.offsetWidth + 8, oben, rechts: 0, unten } });
    }));
  }

  function zeige(huelle, ctx) {
    const doc = L.Zustand.hole(), r = S().ergebnis || {};
    if (r.fehler) {
      huelle.replaceChildren(H('div.start-seite', H('h1', T().fehlerTitel), H('div.kasten.fehler', { role: 'alert' }, L.Zustand.status().text || ''), update()));
      return undefined;
    }
    if (ohneProfil(doc)) return profil(huelle, ctx);
    let t = null;
    try { t = L.Lernplan.tagesauftrag(); } catch (fehler) { melde(fehler); }
    const ferien = !!(t && t.ferien), inseln = !!(L.InselDaten && sicher(() => L.InselDaten.aktiv(), false));
    // Der eine Einstieg in den Tag ist der grosse Knopf «Tagesauftrag» im Dock (huelle-dock.js, auf dem Start mit .start-los); die Karte begrüsst und zeigt das Ziel
    const zielKarte = t && !t.keinModul && !inseln ? ziel(ctx) : '';
    const tag = sicher(() => TS().datum(L.Lernplan.heute(doc)), '');
    // Die Versionsnummer steht im Elternbereich unter «Diagnose», nicht hier.
    const gruss = [tag ? H('p.kicker.start-datum', tag) : '', H('h1', T().hallo(doc.profil.vorname)), H('p.unterzeile.start-satz', t ? heute(t) : '')];
    const rest = [zielKarte, t && t.keinModul ? H('div.kein-modul', H('p', T().keinModul), zuDenEltern(ctx)) : '', update(), hinweise()];
    // Fachinseln: May, die Hauskatze, sagt die Begrüssung (Porträt aus der Szene, Text in der Sprechblase)
    const may = inseln && ctx.buehne && typeof ctx.buehne.portraet === 'function' ? sicher(() => ctx.buehne.portraet(), null) : null;
    // Inselzeit (E-2110-01): nach dem Tagesauftrag lädt May für zwei Minuten auf die Insel ein
    const IZ = L.Texte.inselzeit, insel = may && t && IZ && L.InselzeitDaten && sicher(() => L.InselzeitDaten.offen(L.Zustand, t), false)
      ? H('button.knopf.primaer.start-inselzeit', { type: 'button', 'aria-label': IZ.einstiegLabel, onclick: () => ctx.gehe('inselzeit') }, H('b', IZ.einstieg), H('small', IZ.einstiegKlein)) : '';
    huelle.replaceChildren(H(`div.start-seite${zielKarte ? '.mit-ziel' : ''}${ferien ? '.ferien' : ''}${may ? '.may-spricht' : ''}`, { role: 'group', 'aria-label': TS().begruessung },
      may ? H('div.may-gruss', H('img.may-portraet', { src: may, alt: TS().may }), H('div.may-blase', gruss, insel)) : gruss, rest));
    // Fachinseln: ein Tipp auf ein Areal öffnet seine Tafel (inseln.js). Sonst sagen die Ortsschilder, was an jedem Ort geht.
    if (inseln) { if (ctx.buehne && typeof ctx.buehne.beiWahl === 'function') ctx.buehne.beiWahl(w => { if (w && w.areal) ctx.gehe('areal', { areal: w.areal }); }); }
    else if (L.StartOrte && L.WeltDaten) sicher(() => L.StartOrte.setze(ctx.buehne, L.WeltDaten.kontext()));
    gleite(huelle);
    kameraNebenKarte(huelle, ctx);
    return undefined;
  }

  // titel als Getter: texte.js lädt nach dieser Datei (alphabetisch), gelesen wird erst beim Aufruf. buehne ebenso: ohne Profil Schleier und kein Dock.
  L.Ansichten.start = {
    // Kein Eintrag im Dock: zur ganzen Insel führt die Medaille im HUD (oder das Schliessen einer Tafel)
    id: 'start', get titel() { return L.Texte.menue.start; }, icon: 'pfeil', zeige, zuDenEltern,
    get buehne() {
      return ohneProfil() ? { kamera: 'start', schleier: 'leicht', marken: 'keine', dock: false } : { kamera: 'start', schleier: 'keine', marken: 'orte' };
    }
  };
})(globalThis);
