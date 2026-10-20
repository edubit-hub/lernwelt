/* app/pruefung/inhalt-aufgaben.js: Prüfteil «aufgaben» der Inhaltsprüfung (Teil von inhalt.js, Architektur 9.4): Aufgaben-IDs und braucht,
   Form und Inhalt, Fehlercodes, Lösungswege und Hilfsmittel, Bild- und Audiodateien, Themengrösse, Ablenker für die Auswahl (V-AP06-03),
   Reproduzierbarkeit der Generatoren und migration. Die Datei hängt beim Laden von keiner anderen ab und meldet sich nur in Lernwelt.Pruefung.teile an. Alles Weitere
   (Meldefunktionen, Themen, Hilfsfunktionen) bekommt sie von pruefeModul als Kontext k. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const P = (L.Pruefung = L.Pruefung || {});
  const T = (P.teile = P.teile || {});

  const MIN_AUFGABEN = 8;                               // Themen mit weniger Aufgaben warnen, mindestens 8 je Thema empfiehlt der Prompt
  const CODE = /^[a-z0-9-]+$/;
  const MEDIEN = ['bild', 'audio'];

  /** Aufgaben-IDs, braucht, veraltete Aufgaben und migration. */
  function ids(k) {
    const { modul, fehler } = k, bekannt = new Map(), braucht = new Map(), veraltet = new Set();
    for (const th of k.themen) {
      for (const a of th.alle) {
        const ort = `${th.id}/${a.id}`;
        if (typeof a.id !== 'string' || !k.ID.test(a.id)) fehler('aufgaben-ids', ort, `ungültige Aufgaben-ID «${a.id}»`);
        if (bekannt.has(a.id)) fehler('aufgaben-ids', ort, `Aufgaben-ID im Modul doppelt (auch im Thema ${bekannt.get(a.id)}), eine ID wird nie wiederverwendet`);
        else bekannt.set(a.id, th.id);
        if (a.veraltet) { veraltet.add(a.id); continue; }
        if (!Array.isArray(a.braucht) || !a.braucht.every(k.text)) fehler('aufgaben-ids', ort, 'braucht: Liste von Aufgaben-IDs erwartet');
        else braucht.set(a.id, a.braucht);
      }
    }
    for (const [id, bs] of braucht) {
      for (const b of bs) {
        if (!bekannt.has(b)) fehler('aufgaben-ids', `${id}.braucht`, `Aufgabe «${b}» existiert nicht`);
        else if (veraltet.has(b)) fehler('aufgaben-ids', `${id}.braucht`, `Aufgabe «${b}» ist veraltet und wird nie geübt`);
      }
    }
    if (k.zyklus(braucht) !== null) fehler('aufgaben-ids', 'braucht', 'Aufgaben-Voraussetzungen (braucht) bilden einen Kreis');
    for (const [i, m] of (Array.isArray(modul.migration) ? modul.migration : []).entries()) {
      if (!k.objekt(m) || !/^\d+\.\d+\.\d+$/.test(m.ab || '') || !k.objekt(m.umbenenne)) fehler('aufgaben-ids', `migration[${i}]`, 'braucht ab (Version) und umbenenne (Objekt alt → neu)');
      else for (const neu of Object.values(m.umbenenne)) if (!bekannt.has(neu)) fehler('aufgaben-ids', `migration[${i}]`, `neue ID «${neu}» steht nicht im Modul`);
    }
  }

  /** Fehlercodes des Moduls: Aufbau, und jeder Code einer falschen Antwort muss dort stehen. */
  function fehlercodes(k) {
    const codes = k.modul.fehlerCodes;
    if (codes === undefined) return;
    if (!k.objekt(codes)) { k.fehler('fehlercode', 'fehlerCodes', 'Objekt erwartet'); return; }
    for (const [code, c] of Object.entries(codes)) {
      if (!CODE.test(code)) k.fehler('fehlercode', `fehlerCodes.${code}`, 'Fehlercode darf nur Kleinbuchstaben, Ziffern und Bindestrich enthalten');
      if (!k.objekt(c) || !k.text(c.kind) || !k.text(c.eltern)) k.fehler('fehlercode', `fehlerCodes.${code}`, 'kind und eltern brauchen je einen Text');
      else if (c.folge !== null && c.folge !== 'braucht') k.fehler('fehlercode', `fehlerCodes.${code}`, 'folge ist null oder braucht');
    }
  }

  function codeDerAntwort(w) { return w !== null && typeof w === 'object' ? w.code : null; }

  /** Lösungsweg, Hilfsmittel und Dateien einer Aufgabe. Sammelt, was sich für das Thema zusammenfassen lässt. */
  function aufgabe(k, th, a, sammel) {
    const { modul, reg, ctx } = k, ort = `${th.id}/${a.id}`;
    const form = reg.formen.get(a.form);
    if (!form) { k.fehler('form', ort, `Form «${a.form}» unbekannt`); return; }
    let meldungen;
    try { meldungen = form.pruefe(a.inhalt); } catch (e) { meldungen = [`die Prüfung der Form wirft einen Fehler: ${e.message}`]; }
    meldungen.forEach(x => k.fehler('form', ort, x));

    if (a.form === 'auswahl' && k.objekt(a.inhalt) && Array.isArray(a.inhalt.falsch)) {
      for (const w of a.inhalt.falsch) {
        const code = codeDerAntwort(w);
        if (code && code !== 'sonstige' && !(k.objekt(modul.fehlerCodes) && modul.fehlerCodes[code])) k.fehler('fehlercode', ort, `Fehlercode «${code}» fehlt in fehlerCodes`);
      }
    }

    if (a.hilfe === undefined) {
      if (!a.hilfeVerzicht && !th.roh.hilfeVerzicht) sammel.ohneHilfe.push(a.id);
    } else if (!k.objekt(a.hilfe)) k.fehler('loesungsweg', ort, 'hilfe ist kein Objekt');
    else {
      if (!k.text(a.hilfe.weg)) k.fehler('loesungsweg', ort, 'hilfe.weg fehlt');
      else if (!k.objekt(modul.wege) || !modul.wege[a.hilfe.weg]) k.fehler('loesungsweg', ort, `Lösungsweg «${a.hilfe.weg}» fehlt in wege`);
      if (a.hilfe.schritte !== undefined && !(Array.isArray(a.hilfe.schritte) && a.hilfe.schritte.every(k.text))) k.fehler('loesungsweg', ort, 'hilfe.schritte: Liste von Texten erwartet');
      const hm = a.hilfe.hilfsmittel;
      if (hm !== undefined) {
        const def = k.objekt(hm) && k.text(hm.name) ? reg.hilfsmittel.get(hm.name) : null;
        if (!k.objekt(hm) || !k.text(hm.name)) k.fehler('hilfsmittel', ort, 'hilfe.hilfsmittel braucht name und daten');
        else if (!def) sammel.fremdeHilfsmittel.set(hm.name, (sammel.fremdeHilfsmittel.get(hm.name) || 0) + 1);
        else {
          try { def.pruefe(hm.daten).forEach(x => k.fehler('hilfsmittel', ort, `${hm.name}: ${x}`)); } catch (e) { k.fehler('hilfsmittel', ort, `${hm.name}: die Prüfung wirft einen Fehler: ${e.message}`); }
        }
      }
    }

    for (const feld of MEDIEN) {                         // bild und audio nennen Dateien relativ zu assets.<feld>
      const datei = k.objekt(a.inhalt) ? a.inhalt[feld] : undefined;
      if (typeof datei !== 'string' || datei === '') continue;
      const basis = k.objekt(modul.assets) ? modul.assets[feld] : undefined;
      if (typeof basis !== 'string') { k.fehler('datei', ort, `inhalt.${feld} nennt «${datei}», aber das Modul hat kein assets.${feld}`); continue; }
      const pfad = `${basis}${basis === '' || basis.endsWith('/') ? '' : '/'}${datei}`;
      if (ctx.dateiVorhanden && !ctx.dateiVorhanden(`${modul.id}/${pfad}`)) k.warnung('datei', ort, `Datei fehlt: ${pfad}`);
    }
  }

  /** Ein Generator muss bei gleichen Parametern denselben Bestand liefern (kein Zufall, keine Uhr im pool). */
  function generator(k, th) {
    const gen = k.reg.generatoren.get(th.roh.generator.name), params = th.roh.generator.params === undefined ? {} : th.roh.generator.params;
    if (!gen) return;                                    // fehlender Generator steht schon als Ladefehler des Themas da
    try {
      if (JSON.stringify(gen.pool(params)) !== JSON.stringify(gen.pool(params))) k.fehler('generator', th.ort, 'Generator liefert nicht reproduzierbar: gleiche Parameter ergeben einen anderen Bestand (Math.random und Datum gehören nicht in pool)');
    } catch (e) { k.fehler('generator', th.ort, `pool wirft einen Fehler: ${e.message}`); }
  }

  /** Übungstypen mit Auswahl (multiple-choice) brauchen Ablenker: wortkarte und paar eines Themas müssen mindestens zwei verschiedene Antworten haben.
      Jede Aufgabe verlangt eine Eingabe, die die App prüft (Entscheid vom 19.10.2026): Eine Auswahl ohne falsche Antwort zeigte die Aufgabe nur an und ist ein Fehler.
      Eine paar-Aufgabe braucht eine Frage (inhalt.frage oder frage des Themas), sonst weiss das Kind nicht, was es mit dem Wort tun soll. */
  function ablenker(k, th) {
    const von = form => th.aufgaben.filter(a => a.form === form && k.objekt(a.inhalt));
    const verschieden = (liste, feld) => new Set(liste.map(a => a.inhalt[feld]).filter(k.text)).size;
    const karten = von('wortkarte'), paare = von('paar');
    if (karten.length && (verschieden(karten, 'mutter') < 2 || verschieden(karten, 'fremd') < 2)) k.fehler('ablenker', th.ort, 'wortkarte: weniger als zwei verschiedene Wörter, eine Auswahl hat dann keine falsche Antwort und zeigt die Aufgabe nur an');
    if (paare.length && verschieden(paare, 'rechts') < 2) k.fehler('ablenker', th.ort, 'paar: weniger als zwei verschiedene rechte Werte, eine Auswahl hat dann keine falsche Antwort und zeigt die Aufgabe nur an');
    if (th.roh.frage !== undefined && !k.text(th.roh.frage)) k.fehler('frage', `${th.ort}.frage`, 'frage ist kein Text');
    const ohne = paare.filter(a => !k.text(a.inhalt.frage));
    if (ohne.length) k.fehler('frage', th.ort, `${ohne.length} paar-Aufgaben ohne Frage (zum Beispiel «${ohne[0].id}»): frage im Thema angeben, etwa «Welche Wortart ist das?». Ohne Frage ist für das Kind unklar, was zu tun ist`);
  }

  /**
   * Vergleich mit der Liste aller je freigegebenen Aufgaben-IDs (module/<id>/ids.lock.json). Veraltete Aufgaben zählen mit,
   * ebenso die alten Namen aus migration.umbenenne. Eine ID aus der Liste, die im Modul fehlt, ist ein Fehler.
   * Lernwelt.Pruefung.pruefeLock(modul, lock) → [{ stufe, ort, text, regel: 'lock' }], lock ist die Liste oder { ids: [...] }.
   */
  function pruefeLock(modul, lock) {
    const R = [], f = (ort, t) => R.push({ stufe: 'fehler', ort, text: t, regel: 'lock' });
    const liste = Array.isArray(lock) ? lock : lock && Array.isArray(lock.ids) ? lock.ids : null;
    if (!liste || !liste.every(i => typeof i === 'string')) { f('ids.lock.json', 'Format unlesbar: erwartet wird eine Liste von Aufgaben-IDs'); return R; }
    const jetzt = new Set();
    try {
      for (const t of modul.themen) for (const a of L.Modell.aufgaben(modul, L.Modell.thema(modul, t), { veraltete: true })) jetzt.add(a.id);
    } catch (e) { f('ids.lock.json', `Aufgaben des Moduls nicht lesbar, der Abgleich entfällt: ${e.message}`); return R; }
    const ersetzt = new Set((modul.migration || []).flatMap(x => Object.keys((x && x.umbenenne) || {})));
    for (const id of liste) {
      if (!jetzt.has(id) && !ersetzt.has(id)) f(id, 'Aufgaben-ID verschwunden: der Fortschritt ginge verloren. Mit veraltet: true behalten oder in migration.umbenenne eintragen');
    }
    return R;
  }

  P.pruefeLock = pruefeLock;
  T.aufgaben = function (k) {
    ids(k);
    fehlercodes(k);
    const sammel = { ohneHilfe: [], fremdeHilfsmittel: new Map() };
    for (const th of k.themen) {
      if (!th.t) continue;
      if (th.laden === undefined && th.aufgaben.length === 0) k.fehler('aufgaben', th.ort, 'keine Aufgaben');
      sammel.ohneHilfe = [];
      for (const a of th.aufgaben) aufgabe(k, th, a, sammel);
      ablenker(k, th);
      if (sammel.ohneHilfe.length) k.warnung('loesungsweg', th.ort, `${sammel.ohneHilfe.length} Aufgaben ohne Lösungsweg (zum Beispiel «${sammel.ohneHilfe[0]}»): hilfe angeben oder mit hilfeVerzicht: true begründen`);
      if (th.laden === undefined && th.aufgaben.length < MIN_AUFGABEN) k.warnung('thema-klein', th.ort, `Thema hat nur ${th.aufgaben.length} Aufgaben, empfohlen sind mindestens ${MIN_AUFGABEN}`);
      if (th.roh.generator && k.objekt(th.roh.generator)) generator(k, th);
    }
    for (const [name, n] of sammel.fremdeHilfsmittel) k.warnung('hilfsmittel', 'hilfe.hilfsmittel', `Hilfsmittel «${name}» nicht registriert (${n} Aufgaben)`);
  };
})(globalThis);
