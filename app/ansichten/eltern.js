/* app/ansichten/eltern.js: Elternbereich, Einstieg und Gerüst (AP-13a, Architektur 8.1 bis 8.8 und 11.2).
   Lernwelt.Eltern.zeige(huelle, opt) zeichnet den Elternbereich in huelle und gibt { schliesse, bereit, k } zurück: zuerst die PIN-Hürde
   (eltern-pin.js), dann Reiter. Jeder Reiter meldet sich in Lernwelt.Eltern.abschnitte an ({ id, titel, rang, bau(k) → Element, punkt?(k) → wahr/falsch }),
   auch die Reiter von AP-13b. Rang: Einstellungen 10, Module 20, Prüfung 30, Schwächen 40, Daten 70, Diagnose 80.
   Keine Datei setzt beim Laden eine andere voraus. Geschrieben wird nur über Zustand.aendere.
   opt (alles austauschbar für Tests): onZurueck, entsperrt, zustand, navigator, syn, sprache, fehlerlog, version, dokument, fenster, File,
   heute, zufall, neuLaden, download, faehigkeiten. Der Kontext k trägt die Helfer für die Abschnitte: h, Z, kachel, kasten, werte, meldung, kopiere,
   datum, zahl, waehle, aktualisiere, neuZeichnen, zurueck, offen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const E = (L.Eltern = L.Eltern || {});

  const STIL = `
.eltern { max-width: 880px; }
.eltern-kopf { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--a3); margin-bottom: var(--a4); }
.eltern-banner { display: grid; gap: var(--a2); }
.eltern-banner:not(:empty) { margin-bottom: var(--a4); }
.eltern-banner .kasten p + p { margin-top: 4px; }
.eltern-reiter { display: flex; flex-wrap: wrap; gap: var(--a1); margin-bottom: var(--a4); border-bottom: 1px solid var(--linie); }
.eltern-reiter button { min-height: var(--ziel); padding: 0 var(--a4); border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--tinte-leise); font-weight: 600; }
.eltern-reiter button[aria-selected="true"] { color: var(--tinte); border-bottom-color: var(--akzent); }
.eltern-punkt { display: inline-block; width: 8px; height: 8px; margin-left: 6px; border-radius: 50%; background: var(--akzent-warm); vertical-align: middle; }
.eltern-inhalt { display: grid; gap: var(--a4); min-width: 0; }
.eltern-kachel h4 { font-size: var(--t-text); }
.eltern-zeile { display: flex; flex-wrap: wrap; align-items: center; gap: var(--a2); }
.eltern-werte { display: grid; grid-template-columns: minmax(120px, 210px) minmax(0, 1fr); gap: 6px var(--a4); margin: 0; }
.eltern-werte + p { margin-top: var(--a3); }
.eltern-werte dt { color: var(--tinte-leise); }
.eltern-werte dd { margin: 0; overflow-wrap: anywhere; }
.eltern-feld { display: grid; gap: 4px; max-width: 360px; }
.eltern-feld > span { font-size: var(--t-klein); color: var(--tinte-leise); }
.eltern-feld input, .eltern-feld select, .eltern-zeile select, .eltern-text { min-height: var(--ziel); padding: 8px 12px; border: 1px solid var(--linie); border-radius: var(--radius); background: var(--flaeche); color: var(--tinte); }
.eltern-text { display: block; width: 100%; font: 12.5px/1.4 ui-monospace, Menlo, Consolas, monospace; resize: vertical; overflow-wrap: anywhere; -webkit-user-select: text; user-select: text; }
.eltern-meldung { min-height: 1.4em; margin-top: var(--a3); font-size: var(--t-klein); color: var(--tinte-leise); }
.eltern-meldung.ok { color: var(--ok-text); }
.eltern-meldung.fehler { color: var(--fehler-text); }
label.knopf { position: relative; }
.eltern-pin { max-width: 380px; margin: var(--a5) auto; align-items: center; text-align: center; }
.eltern-pin .kachel-fuss { flex-wrap: wrap; justify-content: center; }
.eltern-punkte { display: flex; gap: 14px; }
.eltern-punkte i { width: 16px; height: 16px; border: 2px solid var(--akzent); border-radius: 50%; }
.eltern-punkte i.an { background: var(--akzent); }
.eltern-fehler { min-height: 1.4em; color: var(--fehler-text); }
@media (max-width: 600px) { .eltern-werte { grid-template-columns: minmax(0, 1fr); gap: 0; } .eltern-werte dd { margin-bottom: var(--a2); } }
`;

  const holt = name => { try { return g[name] || null; } catch (e) { return null; } };
  const datum = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? `${m[3]}.${m[2]}.${m[1]}` : 'unbekannt'; };
  const z2 = n => String(n).padStart(2, '0');
  const zeitpunkt = iso => { const d = new Date(iso); return iso && !Number.isNaN(d.getTime()) ? `${datum(L.Tag.heute(d))}, ${z2(d.getHours())}:${z2(d.getMinutes())} Uhr` : 'unbekannt'; };
  const zahl = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');

  function stil(k) {
    const d = k.dok;
    if (!d || !d.head || (d.getElementById && d.getElementById('eltern-stil'))) return;
    const s = d.createElement('style');
    s.setAttribute('id', 'eltern-stil');
    s.textContent = STIL;
    d.head.append(s);
  }

  /** Standard-Download: Blob, Link mit download-Attribut, Klick. Der Link entfällt danach, die Adresse nach einer Minute. */
  function laden(k, name, text) {
    const url = g.URL.createObjectURL(new g.Blob([text], { type: 'application/json' })), a = k.dok.createElement('a');
    a.href = url; a.download = name;
    k.dok.body.appendChild(a);
    a.click();
    a.remove();
    g.setTimeout(() => g.URL.revokeObjectURL(url), 60000);
  }

  /** In die Zwischenablage, sonst über ein verstecktes Textfeld. Gibt ein Promise auf wahr oder falsch zurück. Direkt im Klick aufrufen. */
  function kopiere(k, text) {
    const notbehelf = () => {
      try {
        const ta = k.dok.createElement('textarea');
        ta.value = text;
        k.dok.body.appendChild(ta);
        if (ta.select) ta.select();
        if (ta.setSelectionRange) ta.setSelectionRange(0, text.length);
        const ok = !!(k.dok.execCommand && k.dok.execCommand('copy'));
        ta.remove();
        return ok;
      } catch (e) { return false; }
    };
    const cb = k.nav.clipboard;
    if (cb && typeof cb.writeText === 'function') {
      try { return Promise.resolve(cb.writeText(text)).then(() => true, notbehelf); } catch (e) { return Promise.resolve(notbehelf()); }
    }
    return Promise.resolve(notbehelf());
  }

  function kontext(huelle, opt) {
    const h = L.ui.h, win = opt.fenster || g;
    const k = {
      opt, huelle, h, win, offen: true, verborgen: new Set(), diag: {}, Z: opt.zustand || L.Zustand, dok: opt.dokument || g.document,
      nav: opt.navigator || g.navigator || {}, syn: opt.syn !== undefined ? opt.syn : holt('speechSynthesis'), sprache: opt.sprache || L.Sprache,
      log: opt.fehlerlog || L.Fehlerlog, version: opt.version || L.version || {}, dialog: L.ui.dialog, File: opt.File || holt('File'),
      heute: opt.heute || (() => L.Tag.heute()), zufall: opt.zufall || Math.random, datum, zeitpunkt, zahl,
      neuLaden: opt.neuLaden || (() => { win.location.reload(); }), faehigkeiten: opt.faehigkeiten || (() => L.Startcheck.pruefe({ g: win })),
      meldung: () => {}, aktualisiere: () => {}, neuZeichnen: () => {}, waehle: () => {}
    };
    k.download = opt.download || ((name, text) => laden(k, name, text));
    k.kopiere = text => kopiere(k, text);
    k.kachel = (titel, ...kinder) => h('section.kachel.eltern-kachel', h('h3', titel), kinder);
    k.kasten = (art, titel, ...kinder) => h(`div.kasten.${art}`, h('b', titel), kinder);
    k.werte = paare => h('dl.eltern-werte', paare.map(([n, w]) => [h('dt', n), h('dd', w)]));
    k.gesperrt = () => { try { return !!k.Z.status().nurLesen; } catch (e) { return false; } };
    return k;
  }

  // ---- Reiter «Einstellungen» ---------------------------------------------------------------------------------------
  function profilKachel(k) {
    const h = k.h, p = k.Z.hole().profil || {}, gesperrt = k.gesperrt();
    const name = h('input', { type: 'text', maxlength: 30, autocomplete: 'off', autocorrect: 'off', autocapitalize: 'words', spellcheck: 'false', disabled: gesperrt });
    const klasse = h('select', { 'aria-label': 'Klasse', disabled: gesperrt },[1, 2, 3, 4, 5, 6].map(n => h('option', { value: n }, `${n}. Klasse`)));
    name.value = p.vorname || '';
    klasse.value = String(p.klasse);
    const speichere = () => {
      const vorname = String(name.value).replace(/\s+/g, ' ').trim().slice(0, 30), nr = Number(klasse.value);
      k.Z.aendere(z => { z.profil.vorname = vorname; if (nr >= 1 && nr <= 6) z.profil.klasse = nr; });
      name.value = vorname;
      k.meldung('Gespeichert.', 'ok');
    };
    name.addEventListener('change', speichere);
    klasse.addEventListener('change', speichere);
    return k.kachel('Kind', h('div.eltern-zeile', [h('label.eltern-feld', h('span', 'Vorname'), name), h('label.eltern-feld', h('span', 'Klasse'), klasse)]),
      h('p.hinweis', 'Der Vorname bleibt im Gerät und steht in der Sicherungsdatei.'),
      gesperrt ? h('p.hinweis', 'Der Lernstand ist nur lesbar. Änderungen werden nicht gespeichert.') : '');
  }
  const einstellungen = k => k.h('div.eltern-inhalt', profilKachel(k), L.ElternStimmen ? L.ElternStimmen.kachel(k) : '', L.ElternPin ? L.ElternPin.kachel(k) : '');

  // ---- Gerüst -------------------------------------------------------------------------------------------------------
  function baue(k) {
    const h = k.h, banner = h('div.eltern-banner'), reiter = h('div.eltern-reiter', { role: 'tablist', 'aria-label': 'Bereiche des Elternbereichs' });
    const tafel = h('div.eltern-tafel', { role: 'tabpanel' }), meldung = h('p.eltern-meldung', { role: 'status', 'aria-live': 'polite' });
    const sicher = (fn, ort) => { try { return fn(); } catch (e) { k.log.melde(e, { art: 'fehler', datei: ort }); return null; } };
    const liste = () => (E.abschnitte || []).slice().sort((a, b) => (a.rang - b.rang) || String(a.id).localeCompare(String(b.id)));
    let aktuell = (liste()[0] || {}).id;

    function zeichneBanner() {
      const st = sicher(() => k.Z.status(), 'eltern.js'), z = sicher(() => k.Z.hole(), 'eltern.js'), D = L.ElternDaten, sp = L.ElternDiagnose, eintraege = [];
      if (st && !st.ok && st.text) eintraege.push(k.kasten('fehler', 'Speichern', st.text));
      if (st && st.hinweisText) eintraege.push(k.kasten('hilfe', 'Hinweis', st.hinweisText));
      const lage = z && D && sicher(() => D.lage(z, k.heute()), 'eltern-daten.js');
      if (lage && lage.erinnerung) eintraege.push(D.erinnerung(k, lage));
      const frage = z && sp && sicher(() => sp.spieltagFrage(k), 'eltern-diagnose.js');
      if (frage) eintraege.push(frage);
      banner.replaceChildren(...eintraege);
    }
    function zeichneReiter() {
      reiter.replaceChildren(...liste().map(a => h('button', { type: 'button', role: 'tab', 'aria-selected': a.id === aktuell ? 'true' : 'false', onclick: () => k.waehle(a.id) },
        a.titel, a.punkt && sicher(() => a.punkt(k), a.id) ? h('i.eltern-punkt', { title: 'Hinweis', 'aria-label': 'Hinweis' }) : '')));
    }
    function zeichneTafel() {
      const a = liste().find(x => x.id === aktuell), inhalt = a && sicher(() => a.bau(k), a.id);
      tafel.replaceChildren(inhalt || k.kasten('fehler', 'Dieser Bereich fehlt', 'Er konnte nicht angezeigt werden. Einzelheiten stehen im Fehlerprotokoll unter «Diagnose».'));
    }
    k.meldung = (text, art = '') => { meldung.textContent = text; meldung.setAttribute('class', `eltern-meldung ${art}`.trim()); };
    k.aktualisiere = () => { if (k.offen) { zeichneBanner(); zeichneReiter(); } };
    k.neuZeichnen = () => { if (k.offen) { k.aktualisiere(); zeichneTafel(); } };
    k.waehle = id => { if (liste().some(a => a.id === id)) { aktuell = id; k.meldung(''); k.neuZeichnen(); } };

    const kopf = h('header.eltern-kopf', h('div', h('h2', 'Elternbereich'), h('p.klein', 'Einstellungen, Sicherung und Diagnose.')),
      k.opt.onZurueck ? h('button.knopf.leise', { type: 'button', onclick: () => k.zurueck() }, h('span.ico.klein.ico-zurueck', { 'aria-hidden': 'true' }), 'Zurück') : '');
    k.huelle.replaceChildren(h('div.seite.eltern', kopf, banner, reiter, tafel, meldung));
    k.neuZeichnen();
  }

  /** Zeichnet den Elternbereich in huelle. → { schliesse(), bereit: Promise<boolean>, k }. */
  function zeige(huelle, opt = {}) {
    if (!huelle || huelle.nodeType !== 1) throw new Error('Eltern.zeige: huelle muss ein DOM-Element sein');
    const k = kontext(huelle, opt);
    stil(k);
    const ende = () => {
      if (!k.offen) return;
      k.offen = false;
      try { if (k.sprache && k.sprache.stopp) k.sprache.stopp(); } catch (e) { /* nichts zu stoppen */ }
      huelle.replaceChildren();
    };
    k.zurueck = () => { ende(); if (typeof opt.onZurueck === 'function') opt.onZurueck(); };
    const bereit = L.ElternPin.tor(k, huelle).then(ok => { if (ok && k.offen) { baue(k); return true; } return false; }).catch(e => {
      k.log.melde(e, { art: 'fehler', datei: 'eltern.js' });
      if (k.offen) huelle.replaceChildren(h2(k, e));
      return false;
    });
    return { schliesse: ende, bereit, k };
  }
  const h2 = (k, e) => k.h('div.eltern', k.kasten('fehler', 'Der Elternbereich konnte nicht geöffnet werden', String((e && e.message) || e)));

  const alt = (E.abschnitte = E.abschnitte || []).findIndex(a => a.id === 'einstellungen');
  if (alt >= 0) E.abschnitte.splice(alt, 1);
  E.abschnitte.push({ id: 'einstellungen', titel: 'Einstellungen', rang: 10, bau: einstellungen });
  Object.assign(E, { zeige, datum, zeitpunkt, zahl });
})(globalThis);
