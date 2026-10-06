/* app/ansichten/eltern-daten.js: Reiter «Daten» des Elternbereichs: Sicherung erstellen, Sicherung einspielen und die Erinnerung
   «Sicherung fällig» (Architektur 8.3 und 8.4, F-AP03-01). Die Sicherung entsteht synchron, damit navigator.share() direkt im Klick steht
   (iOS verlangt eine frische Berührung). Reihenfolge: Teilen-Menü, dann Download-Link, dann Text zum Kopieren. Beim Import schreibt erst
   «Ersetzen» nach einer Rückfrage, das Angebot, den aktuellen Stand vorher als Datei zu sichern, steht in der Vorschau.
   Lernwelt.ElternDaten.lage(zustand, heute) sagt auch der Startansicht, ob eine Erinnerung ansteht. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  /** faellig: Tage seit der letzten Sicherung (8.4), pruefungVorlauf und pruefungNeu: Erinnerung vor einer Prüfung, maxDatei: Zeichen einer Sicherungsdatei. */
  const FRISTEN = Object.freeze({ faellig: 14, pruefungVorlauf: 7, pruefungNeu: 3, maxDatei: 8000000 });
  const istText = x => typeof x === 'string';
  const klon = x => (typeof g.structuredClone === 'function' ? g.structuredClone(x) : JSON.parse(JSON.stringify(x)));
  const vorTagen = n => (n <= 0 ? 'heute' : n === 1 ? 'gestern' : `vor ${n} Tagen`);

  /** Lage der Sicherung am Tag heute: { faellig, nie, tage, letzte, pruefungen, vorPruefung, erinnerung }. «Fällig»: leer oder älter als 14 Tage (F-AP03-01). */
  function lage(z, heute) {
    const T = L.Tag, letzte = z && z.meta && z.meta.zuletztExport, hat = istText(letzte) && T.gueltig(letzte);
    const tage = hat ? T.diff(heute, letzte) : null, faellig = !hat || tage > FRISTEN.faellig, pruefungen = [];
    Object.entries((z && z.module) || {}).forEach(([id, m]) => {
      const d = m && m.aktiv && m.pruefung && m.pruefung.datum, bis = istText(d) && T.gueltig(d) ? T.diff(d, heute) : -1;
      if (bis >= 0 && bis <= FRISTEN.pruefungVorlauf) pruefungen.push({ modul: id, datum: d, tageBis: bis });
    });
    pruefungen.sort((a, b) => a.datum.localeCompare(b.datum));
    const vorPruefung = !faellig && pruefungen.length > 0 && tage > FRISTEN.pruefungNeu;
    return { faellig, nie: !hat, tage, letzte: hat ? letzte : null, pruefungen, vorPruefung, erinnerung: faellig || vorPruefung };
  }
  const stand = (k, l) => (l.nie ? 'Es wurde noch keine Sicherung erstellt.' : `Letzte Sicherung: ${k.datum(l.letzte)} (${vorTagen(l.tage)}).`);

  /** Hinweiskasten für den Kopf des Elternbereichs. */
  function erinnerung(k, l) {
    const h = k.h, p = l.pruefungen[0], modul = p && ((L.registry.module.get(p.modul) || {}).titel || p.modul);
    const text = l.faellig ? [stand(k, l), 'Bitte eine Sicherung erstellen, damit der Lernstand bei einem Gerätewechsel oder einem Fehler nicht verloren geht.']
      : [`Am ${k.datum(p.datum)} ist eine Prüfung (${modul}). ${stand(k, l)} Bitte vorher eine Sicherung erstellen.`];
    return k.kasten('hilfe', l.faellig ? 'Sicherung fällig' : 'Sicherung vor der Prüfung', text.map(t => h('p', t)),
      h('div.eltern-zeile', h('button.knopf.primaer', { type: 'button', onclick: () => k.waehle('daten') }, 'Zur Sicherung')));
  }

  const zusammenfassung = z => {
    const mods = Object.values((z && z.module) || {});
    return { vorname: (z && z.profil && z.profil.vorname) || '', module: mods.length, aufgaben: mods.reduce((n, m) => n + Object.keys((m && m.aufgaben) || {}).length, 0), tage: Object.keys((z && z.tage) || {}).length };
  };

  // ---- Export ---------------------------------------------------------------------------------------------------
  function zeigeText(k, ziel, text, name, erfolg) {
    const h = k.h, feld = h('textarea.eltern-text', { readonly: true, rows: 6, spellcheck: 'false', 'aria-label': 'Text der Sicherung' });
    feld.value = text;
    const kopieren = () => k.kopiere(text).then(ok => {
      if (ok) { erfolg('text'); k.meldung('Der Text wurde kopiert.', 'ok'); } else k.meldung('Kopieren nicht möglich. Den Text markieren und von Hand kopieren.', 'fehler');
    });
    ziel.replaceChildren(k.kasten('hilfe', 'Wenn keine Datei erscheint',
      h('p', `Den Text kopieren und in einer Textdatei mit der Endung .json ablegen, zum Beispiel als «${name}».`), feld,
      h('div.eltern-zeile', h('button.knopf', { type: 'button', onclick: kopieren }, 'Text kopieren'))));
  }

  /** Zweite und dritte Wahl: Download-Link, dann Text. weg 'text' zeigt nur den Text. */
  function ausweichen(k, text, name, o) {
    let geladen = false;
    if (o.weg !== 'text') {
      try { k.download(name, text); geladen = true; } catch (e) { k.log.melde(e, { art: 'hinweis', datei: 'eltern-daten.js' }); }
    }
    if (geladen) o.erfolg('datei');
    zeigeText(k, o.ziel, text, name, o.erfolg);
    if (o.weg === 'text') k.meldung('Der Text steht unten zum Kopieren bereit.', 'ok');
    else if (geladen) k.meldung(`Die Datei «${name}» wurde zum Laden angeboten.`, 'ok');
    else k.meldung('Die Datei konnte nicht angeboten werden. Der Text unten lässt sich kopieren.', 'fehler');
  }

  /** Muss direkt aus dem Klick aufgerufen werden, ohne await davor. o: { ziel, weg ('datei' | 'text'), beiErfolg(art) }.
      Die Datei trägt das Datum von heute als letzte Sicherung, damit ein Lernstand nach dem Einspielen nicht gleich «fällig» ist. */
  function sichere(k, o = {}) {
    const heute = k.heute(), kopie = klon(k.Z.hole());
    if (kopie.meta) kopie.meta.zuletztExport = heute;
    const text = JSON.stringify(L.Sicherung.exportiere(kopie, k.version.app)), name = L.Sicherung.dateiname(heute);
    const erfolg = art => { k.Z.aendere(z => { z.meta.zuletztExport = heute; }); k.aktualisiere(); if (o.beiErfolg) o.beiErfolg(art); };
    const ausweg = () => ausweichen(k, text, name, { erfolg, ziel: o.ziel || k.h('div'), weg: o.weg });
    if (o.weg) return ausweg();
    let datei = null, teilbar = false;
    try { datei = new k.File([text], name, { type: 'application/json' }); teilbar = typeof k.nav.share === 'function' && typeof k.nav.canShare === 'function' && !!k.nav.canShare({ files: [datei] }); } catch (e) { teilbar = false; }
    if (!teilbar) return ausweg();
    let p;
    try { p = k.nav.share({ files: [datei], title: 'Lernwelt Sicherung' }); } catch (e) { return ausweg(); }
    return Promise.resolve(p).then(() => { erfolg('geteilt'); k.meldung('Die Sicherung wurde geteilt.', 'ok'); },
      f => { if (f && f.name === 'AbortError') k.meldung('Das Teilen wurde abgebrochen. Es wurde nichts gesichert.'); else ausweg(); });
  }

  function exportKachel(k) {
    const h = k.h, panel = h('div'), zeile = h('p', { role: 'status' });
    const zeigeStand = () => { const l = lage(k.Z.hole(), k.heute()); zeile.replaceChildren(stand(k, l), ' ', l.faellig ? h('span.etikett', 'Sicherung fällig') : ''); };
    zeigeStand();
    const los = weg => () => sichere(k, { ziel: panel, weg, beiErfolg: zeigeStand });
    return k.kachel('Sicherung erstellen', zeile,
      h('p', 'Die Sicherung enthält den ganzen Lernstand in einer Datei. Auf dem iPad öffnet sich das Teilen-Menü, dort «In Dateien sichern» wählen.'),
      h('div.eltern-zeile', [h('button.knopf.primaer', { type: 'button', onclick: los(null) }, 'Sicherung erstellen'),
        h('button.knopf', { type: 'button', onclick: los('datei') }, 'Als Datei laden'), h('button.knopf.leise', { type: 'button', onclick: los('text') }, 'Als Text anzeigen')]),
      h('p.hinweis', 'Die Datei enthält den Vornamen des Kindes und gehört nicht an einen öffentlichen Ort.'), panel);
  }

  // ---- Import ---------------------------------------------------------------------------------------------------
  const lies = datei => (typeof datei.text === 'function' ? datei.text() : new Promise((ok, nein) => {
    const r = new g.FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => nein(r.error); r.readAsText(datei);
  }));

  function importKachel(k) {
    const h = k.h, vorschau = h('div.eltern-inhalt'), sicherungsziel = h('div');
    let gesichert = false;
    const eingabe = h('textarea.eltern-text', { rows: 4, placeholder: 'Text der Sicherung hier einfügen', 'aria-label': 'Text einer Sicherung', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' });
    const fehler = text => vorschau.replaceChildren(k.kasten('fehler', 'Die Sicherung lässt sich nicht einspielen', text));
    const abbrechen = () => { vorschau.replaceChildren(); eingabe.value = ''; gesichert = false; };

    async function ersetzen(r) {
      const ja = await k.dialog.frage({
        titel: 'Lernstand ersetzen?', ja: 'Ersetzen', nein: 'Abbrechen', gefahr: true,
        text: [`Der aktuelle Lernstand wird durch die Sicherung vom ${k.datum(r.vorschau.erstellt)} ersetzt.`, gesichert ? 'Der aktuelle Stand wurde vorher als Datei gesichert.'
          : 'Der aktuelle Stand wurde nicht als Datei gesichert. Die interne Kopie liegt im selben Speicher und schützt nicht vor dem Löschen durch das System.']
      });
      if (!ja || !k.offen) return;
      const e = k.Z.ersetze(r.daten);
      if (!e.ok) return fehler(e.fehler || 'Der Lernstand konnte nicht ersetzt werden.');
      await k.dialog.meldung({ titel: 'Lernstand ersetzt', text: 'Die Sicherung ist eingespielt. Die App lädt jetzt neu.' });
      k.neuLaden();
    }

    function zeigeVorschau(r) {
      const v = r.vorschau, jetzt = zusammenfassung(k.Z.hole()), weniger = v.aufgaben < jetzt.aufgaben || v.tage < jetzt.tage;
      const beschreibe = s => `${s.vorname || 'ohne Vorname'}, ${s.module} Module, ${k.zahl(s.aufgaben)} Aufgaben, ${s.tage} Lerntage`;
      vorschau.replaceChildren(
        k.kasten('ok', 'Sicherung gelesen', k.werte([['Erstellt', k.zeitpunkt(v.erstellt)], ['App-Version', v.app || 'unbekannt'], ['Vorname', v.vorname || 'nicht angegeben'],
          ['Module', v.module], ['Aufgaben', k.zahl(v.aufgaben)], ['Lerntage', v.tage], ['Aktueller Stand', beschreibe(jetzt)]]),
        weniger ? h('p', 'Die Sicherung enthält weniger Aufgaben oder Lerntage als der aktuelle Stand. Beim Ersetzen gehen die neueren Fortschritte verloren.') : '',
        h('p', 'Beim Ersetzen geht der aktuelle Lernstand verloren. Die interne Kopie liegt im selben Speicher und schützt nicht vor dem Löschen durch das System.')),
        h('div.eltern-zeile', [
          h('button.knopf', { type: 'button', onclick: () => sichere(k, { ziel: sicherungsziel, beiErfolg: () => { gesichert = true; } }) }, 'Aktuellen Stand zuerst als Datei sichern'),
          h('button.knopf.gefahr', { type: 'button', onclick: () => ersetzen(r) }, 'Ersetzen'),
          h('button.knopf.leise', { type: 'button', onclick: abbrechen }, 'Abbrechen')]), sicherungsziel);
    }

    const pruefe = text => {
      gesichert = false;
      if (!String(text || '').trim()) return fehler('Es wurde kein Text eingefügt.');
      const r = L.Sicherung.lese(text);
      return r.ok ? zeigeVorschau(r) : fehler(r.fehler);
    };
    const datei = h('input.nur-vorlesen', { type: 'file', accept: '.json,application/json,text/plain', 'aria-label': 'Sicherungsdatei wählen' });
    datei.addEventListener('change', () => {
      const f = datei.files && datei.files[0];
      if (!f) return;
      if (f.size > FRISTEN.maxDatei) return fehler('Die Datei ist zu gross für eine Sicherung.');
      lies(f).then(pruefe, () => fehler('Die Datei lässt sich nicht lesen.')).then(() => { try { datei.value = ''; } catch (e) { /* ohne Belang */ } });
    });
    return k.kachel('Sicherung einspielen', h('p', 'Eine Sicherungsdatei wählen oder den Text einer Sicherung einfügen. Der aktuelle Lernstand wird dabei ersetzt.'),
      h('div.eltern-zeile', h('label.knopf', 'Datei wählen', datei)), eingabe,
      h('div.eltern-zeile', h('button.knopf', { type: 'button', onclick: () => pruefe(eingabe.value) }, 'Text prüfen')), vorschau);
  }

  const bau = k => k.h('div.eltern-inhalt', exportKachel(k), importKachel(k));

  const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === 'daten');
  if (alt >= 0) liste.splice(alt, 1);
  liste.push({ id: 'daten', titel: 'Daten', rang: 70, bau, punkt: k => lage(k.Z.hole(), k.heute()).erinnerung });
  L.ElternDaten = { FRISTEN, lage, erinnerung, zusammenfassung, sichere, bau };
})(globalThis);
