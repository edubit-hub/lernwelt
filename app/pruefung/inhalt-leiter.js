/* app/pruefung/inhalt-leiter.js: Prüfteile «leiter» und «pruefung» der Inhaltsprüfung (Teil von inhalt.js, Architektur 9.4 und modul-schema 3.6,
   5, 3.8): Leiter jedes Themas (Typen, Formen, Gruppentypen, freiwillige Typen, Raten), Prüfungsformat und Tempo-Runde.
   Die Datei hängt beim Laden von keiner anderen ab und meldet sich nur in Lernwelt.Pruefung.teile an. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const P = (L.Pruefung = L.Pruefung || {});
  const T = (P.teile = P.teile || {});

  const FREIWILLIG = ['blitzrechnen'];                  // gilt auch, solange der Typ noch nicht registriert ist
  const STAENDE = ['basis', 'sicher', 'gefestigt'];

  const eig = def => (def && def.eigenschaften) || {};
  const freiwillig = (id, def) => (def ? eig(def).freiwillig === true : FREIWILLIG.includes(id));

  /** Aufbau der Leiter: Einträge mit box und typ, Boxen aufsteigend, erster Eintrag box 0, wenn nennt eine Option des Moduls. */
  function aufbau(k, th, leiter, ort) {
    const optionen = new Set(Object.keys(th.t.optionen || {}));
    let vorher = -1, ok = true;
    leiter.forEach((s, i) => {
      const o = `${ort}[${i}]`;
      if (!k.objekt(s) || !k.text(s.typ) || !Number.isInteger(s.box) || s.box < 0 || s.box > 6) { k.fehler('leiter-aufbau', o, 'ein Eintrag braucht box (ganze Zahl 0 bis 6) und typ'); ok = false; return; }
      if (s.box < vorher) k.fehler('leiter-aufbau', o, 'die Einträge stehen nicht nach Box aufsteigend');
      vorher = s.box;
      if (s.wenn !== undefined && !optionen.has(s.wenn)) k.fehler('leiter-aufbau', o, `wenn «${s.wenn}» ist keine Option des Moduls oder Themas`);
      if (s.ersatz !== undefined && !k.text(s.ersatz)) k.fehler('leiter-aufbau', o, 'ersatz ist kein Text');
    });
    if (ok && leiter[0].box !== 0) { k.fehler('leiter-aufbau', ort, 'der erste Eintrag hat box: 0'); ok = false; }
    return ok;
  }

  function pruefeLeiter(k, th) {
    const ort = `${th.ort}.leiter`, leiter = th.t.leiter, reg = k.reg;
    if (!Array.isArray(leiter) || !leiter.length) { k.fehler('leiter-typ', ort, 'Leiter fehlt (weder im Thema noch in standard)'); return; }
    if (!aufbau(k, th, leiter, ort)) return;

    const typen = new Map();                            // Typ-ID → Definition oder null
    for (const s of leiter) for (const id of [s.typ, s.ersatz]) if (id && !typen.has(id)) typen.set(id, reg.typen.get(id) || null);
    for (const [id, def] of typen) {
      if (!def) k.fehler('leiter-typ', ort, `Übungstyp «${id}» fehlt`);
      if (freiwillig(id, def)) k.fehler('freiwillig', ort, `Freiwilliger Typ «${id}» steht in der Leiter: Tempo-Runden gehören in tempo, nie in eine Leiter`);
    }

    const formen = new Map();                           // Form → IDs der Aufgaben
    for (const a of th.aufgaben) { if (!formen.has(a.form)) formen.set(a.form, []); formen.get(a.form).push(a.id); }
    for (const [id, def] of typen) {
      if (!def) continue;
      for (const [form, idsDerForm] of formen) {
        if (!reg.formen.has(form)) continue;            // unbekannte Form steht schon bei der Aufgabe
        if (!(eig(def).akzeptiert || []).includes(form)) { k.fehler('leiter-typ', ort, `Übungstyp «${id}» akzeptiert Form «${form}» nicht (${idsDerForm.length} Aufgaben, zum Beispiel «${idsDerForm[0]}»)`); continue; }
        for (const a of th.aufgaben.filter(x => x.form === form)) {
          try { (def.pruefeAufgabe ? def.pruefeAufgabe(a, th.t.optionen) : []).forEach(x => k.fehler('leiter-typ', `${th.id}/${a.id} (${id})`, x)); }
          catch (e) { k.fehler('leiter-typ', `${th.id}/${a.id} (${id})`, `pruefeAufgabe wirft einen Fehler: ${e.message}`); }
        }
      }
    }

    for (const s of leiter) {                           // Gruppentypen: Ersatz nötig, Ersatz ist ein Einzeltyp, das Thema ist gross genug
      const def = typen.get(s.typ), min = (eig(def).gruppe || {}).min || 1;
      if (!def || min <= 1) continue;
      const ersatz = s.ersatz || eig(def).ersatz, ersatzDef = ersatz ? reg.typen.get(ersatz) : null;
      if (!ersatz) k.fehler('gruppe', ort, `Gruppentyp «${s.typ}» braucht einen ersatz in der Leiter (für Gruppen unter ${min} Aufgaben und fehlende Fähigkeiten)`);
      else if (ersatzDef && ((eig(ersatzDef).gruppe || {}).min || 1) > 1) k.fehler('gruppe', ort, `ersatz «${ersatz}» ist selbst ein Gruppentyp`);
      if (th.aufgaben.length < min) k.fehler('gruppe', ort, `Gruppentyp «${s.typ}» braucht mindestens ${min} Aufgaben, das Thema hat ${th.aufgaben.length}`);
    }

    const grenze = L.lernregeln.mastery.gefestigtBox;   // ab dieser Box heisst ein Thema «gefestigt»: Typen mit tieferem maxBox lassen Raten zu
    const aktiv = [3, 4, 5, 6].map(b => { try { return typen.get(L.Modell.typFuer(th.t, b).typ) || null; } catch (e) { return null; } });
    if (aktiv.every(d => d && eig(d).maxBox < grenze)) k.warnung('leiter-raten', ort, `ab Box 3 nur Typen, bei denen Raten möglich ist (maxBox unter ${grenze}): die Aufgaben erreichen den Stand «gefestigt» nicht`);
  }

  /** Prüfungsformat nach modul-schema 3.8: Themen, Anzahl, Typ, Punkte. */
  function format(k, p) {
    const ids = k.themen.map(t => t.id), reg = k.reg;
    if (!Array.isArray(p.format) || !p.format.length) { k.fehler('pruefungsformat', 'pruefung.format', 'Liste der Teile erwartet'); return; }
    p.format.forEach((teil, i) => {
      const ort = `pruefung.format[${i}]`;
      if (!k.objekt(teil)) { k.fehler('pruefungsformat', ort, 'Objekt erwartet'); return; }
      const themen = [].concat(teil.thema === undefined ? [] : teil.thema);
      if (!themen.length || !themen.every(k.text)) k.fehler('pruefungsformat', ort, 'thema: Thema-ID oder Liste von Thema-IDs erwartet');
      for (const t of themen) if (!ids.includes(t)) k.fehler('pruefungsformat', ort, `Thema «${t}» fehlt`);
      const aufgaben = k.themen.filter(t => themen.includes(t.id)).flatMap(t => t.aufgaben);
      if (!Number.isInteger(teil.anzahl) || teil.anzahl < 1) k.fehler('pruefungsformat', ort, 'anzahl: ganze Zahl ab 1 erwartet');
      else if (teil.anzahl > aufgaben.length) k.fehler('pruefungsformat', ort, `${teil.anzahl} Aufgaben verlangt, nur ${aufgaben.length} vorhanden`);
      if (typeof teil.punkte !== 'number' || !Number.isFinite(teil.punkte) || teil.punkte < 0) k.fehler('pruefungsformat', ort, 'punkte: Zahl ab 0 erwartet');
      const def = reg.typen.get(teil.typ);
      if (!k.text(teil.typ) || (!def && !FREIWILLIG.includes(teil.typ))) k.fehler('pruefungsformat', ort, `Übungstyp «${teil.typ}» fehlt`);
      if (k.text(teil.typ) && freiwillig(teil.typ, def)) k.fehler('freiwillig', ort, `Freiwilliger Typ «${teil.typ}» steht im Prüfungsformat`);
      if (def) for (const form of new Set(aufgaben.map(a => a.form))) if (reg.formen.has(form) && !(eig(def).akzeptiert || []).includes(form)) k.fehler('pruefungsformat', ort, `Übungstyp «${teil.typ}» akzeptiert Form «${form}» nicht`);
    });
  }

  function pruefung(k) {
    const m = k.modul, p = m.pruefung, tag = L.Tag && L.Tag.gueltig ? L.Tag.gueltig : () => true, ids = k.themen.map(t => t.id);
    if (p !== undefined) {
      if (!k.objekt(p)) k.fehler('pruefungsformat', 'pruefung', 'Objekt erwartet');
      else {
        if (p.datum !== null && !(typeof p.datum === 'string' && tag(p.datum))) k.fehler('pruefungsformat', 'pruefung.datum', 'null oder ein Datum JJJJ-MM-TT erwartet');
        if (!Array.isArray(p.themen) || !p.themen.length || !p.themen.every(t => t === '*' || ids.includes(t))) k.fehler('pruefungsformat', 'pruefung.themen', "erwartet wird ['*'] oder eine Liste vorhandener Thema-IDs");
        if (typeof p.richtzeitMin !== 'number' || !(p.richtzeitMin > 0)) k.fehler('pruefungsformat', 'pruefung.richtzeitMin', 'Zahl über 0 erwartet');
        format(k, p);
      }
    }
    const t = m.tempo;
    if (t === undefined) return;
    if (!k.objekt(t)) { k.fehler('tempo', 'tempo', 'Objekt erwartet'); return; }
    const def = k.reg.typen.get(t.typ);
    if (!k.text(t.typ) || (!def && !FREIWILLIG.includes(t.typ))) k.fehler('tempo', 'tempo.typ', `Übungstyp «${t.typ}» fehlt`);
    else if (def && !freiwillig(t.typ, def)) k.fehler('tempo', 'tempo.typ', `«${t.typ}» ist nicht freiwillig: eine Tempo-Runde braucht einen freiwilligen Typ`);
    if (!Array.isArray(t.themen) || !t.themen.length || !t.themen.every(x => ids.includes(x))) k.fehler('tempo', 'tempo.themen', 'Liste vorhandener Thema-IDs erwartet');
    if (!Number.isInteger(t.anzahl) || t.anzahl < 10 || t.anzahl > 30) k.fehler('tempo', 'tempo.anzahl', 'ganze Zahl von 10 bis 30 erwartet');
    if (t.nurWennStand !== undefined && !STAENDE.includes(t.nurWennStand)) k.fehler('tempo', 'tempo.nurWennStand', `eines von ${STAENDE.join(', ')} erwartet`);
  }

  T.leiter = function (k) { for (const th of k.themen) if (th.t) pruefeLeiter(k, th); };
  T.pruefung = pruefung;
})(globalThis);
