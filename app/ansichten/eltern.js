/* app/ansichten/eltern.js: Elternbereich, Einstieg und Gerüst (AP-13a, Architektur 8.1 bis 8.8 und 11.2).
   Lernwelt.Eltern.zeige(huelle, opt) zeichnet den Elternbereich in huelle und gibt { schliesse, bereit, k } zurück: zuerst die PIN-Hürde
   (eltern-pin.js), dann Reiter. Jeder Reiter meldet sich in Lernwelt.Eltern.abschnitte an ({ id, titel, rang, bau(k) → Element, punkt?(k) → wahr/falsch }),
   auch die Reiter von AP-13b. Rang: Einstellungen 10, Module 20, Prüfung 30, Schwächen 40, Daten 70, Diagnose 80.
   Keine Datei setzt beim Laden eine andere voraus. Geschrieben wird nur über Zustand.aendere.
   opt (alles austauschbar für Tests): onZurueck, entsperrt, zustand, navigator, syn, sprache, fehlerlog, version, dokument, fenster, File,
   heute, zufall, neuLaden, download, faehigkeiten. Der Kontext k trägt die Helfer für die Abschnitte: h, Z, kachel, kasten, werte, meldung, kopiere,
   datum, zahl, waehle, aktualisiere, neuZeichnen, zurueck, offen, beiEnde(fn) (läuft, wenn der Bereich schliesst). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const E = (L.Eltern = L.Eltern || {});

  /* Gestaltung: app/stil/eltern.css (ruhiger Grund im Modus «eltern» der Hülle, Kacheln in der Form der Tafel ohne Glas, Schalter «Klänge»). */
  const holt = name => { try { return g[name] || null; } catch (e) { return null; } };
  const datum = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? `${m[3]}.${m[2]}.${m[1]}` : 'unbekannt'; };
  const z2 = n => String(n).padStart(2, '0');
  const zeitpunkt = iso => { const d = new Date(iso); return iso && !Number.isNaN(d.getTime()) ? `${datum(L.Tag.heute(d))}, ${z2(d.getHours())}:${z2(d.getMinutes())} Uhr` : 'unbekannt'; };
  const zahl = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');

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
    k.enden = [];
    k.beiEnde = fn => { if (typeof fn === 'function') k.enden.push(fn); };      // räumt auf, wenn der Elternbereich schliesst (AP-13b: eine laufende Probeprüfung abbrechen)
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
  /** Schalter «Klänge» und «Musik» (E-19, Umbauplan 2.13 und 3.5, G18): role=switch mit aria-checked, schreibt einstellungen.<feld> über Zustand.aendere
      und schaltet den Klangdienst (an bzw. musikAn). Standard an, ein Lernstand ohne Feld gilt als an. «Klänge» ist dieselbe Einstellung wie der
      Klangschalter im HUD (aus heisst ganz still, auch ohne Musik). Der Schalter ändert sich an Ort und Stelle, der Reiter bleibt stehen. */
  function schalterKachel(k, s) {
    const h = k.h, gesperrt = k.gesperrt(), istAn = () => ((k.Z.hole() || {}).einstellungen || {})[s.feld] !== false;
    const wort = h('span.eltern-schalter-wort'), schalter = h('button.schalter.eltern-schalter', { type: 'button', role: 'switch', 'aria-label': s.titel, disabled: gesperrt },
      h('span.eltern-schalter-bahn', { 'aria-hidden': 'true' }), wort);
    const zeige = an => { schalter.setAttribute('aria-checked', an ? 'true' : 'false'); wort.textContent = an ? 'An' : 'Aus'; };
    schalter.addEventListener('click', () => {
      if (k.gesperrt()) return;
      const neu = !istAn();
      k.Z.aendere(z => { z.einstellungen = z.einstellungen || {}; z.einstellungen[s.feld] = neu; });
      try { if (L.Klang && typeof L.Klang[s.dienst] === 'function') L.Klang[s.dienst](neu); } catch (e) { /* ohne Klangdienst bleibt nur die Einstellung */ }
      try { if (L.Huelle && typeof L.Huelle.aktualisiere === 'function') L.Huelle.aktualisiere(); } catch (e) { /* das HUD zeichnet beim nächsten Wechsel */ }
      zeige(istAn());
      k.meldung(neu ? s.an : s.aus, 'ok');
    });
    zeige(istAn());
    return k.kachel(s.titel, h('div.eltern-zeile', schalter), h('p.hinweis', s.hinweis),
      gesperrt ? h('p.hinweis', 'Der Lernstand ist nur lesbar. Änderungen werden nicht gespeichert.') : '');
  }
  const KLAENGE = { feld: 'klang', dienst: 'an', titel: 'Klänge', an: 'Die Klänge sind an.', aus: 'Die Klänge sind aus.',
    hinweis: 'Kurze Klänge bei Antworten, beim Bauen und beim Forschen. Während einer Aufgabe läuft kein Meeresrauschen. Der Klangschalter oben rechts in der Lernwelt ändert dieselbe Einstellung, aus heisst dort ganz still, auch ohne Musik.' };
  const MUSIK = { feld: 'musik', dienst: 'musikAn', titel: 'Musik', an: 'Die Musik ist an.', aus: 'Die Musik ist aus.',
    hinweis: 'Leise Musik in der Welt: beim ersten Öffnen einmal das Titelstück, danach eine ruhige Schleife. Während einer Aufgabe und im Abschluss pausiert sie. Die Klänge bleiben davon unberührt.' };
  const einstellungen = k => k.h('div.eltern-inhalt', profilKachel(k), schalterKachel(k, KLAENGE), schalterKachel(k, MUSIK), L.ElternStimmen ? L.ElternStimmen.kachel(k) : '', L.ElternPin ? L.ElternPin.kachel(k) : '');

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
    const ende = () => {
      if (!k.offen) return;
      k.offen = false;
      for (const fn of k.enden.splice(0)) { try { fn(); } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'eltern.js' }); } }
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
