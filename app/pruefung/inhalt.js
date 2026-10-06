/* app/pruefung/inhalt.js: Inhaltsprüfung für Module (Architektur 9.4, modul-schema Abschnitt 3). Läuft im Browser (Vorschau) und in Node
   (`lw check` lädt dieselbe Datei per vm). Die Datei rechnet nur, sie liest nichts: Dateien, Stopwortliste und Freigabemodus reicht der
   Aufrufer in ctx herein. Meldungen: [{ stufe: 'fehler' | 'warnung', ort, text, regel }]. `regel` ist eine feste Kennung je Zeile der
   Tabelle in 9.4 (kopf, eszett, themen, aufgaben-ids, form, fehlercode, leiter-typ, freiwillig, gruppe, leiter-raten, abweichung,
   baustein, loesungsweg, geprueft, hilfsmittel, datei, thema-klein, pruefungsformat, generator, lock, ton, anpassbar ...).
   Die Prüfteile für Aufgaben (mit pruefeLock), Leiter und Prüfungsformat stehen in inhalt-aufgaben.js und inhalt-leiter.js und melden sich in
   Lernwelt.Pruefung.teile an. Die Datei hängt beim Laden von keiner anderen ab, erst pruefeModul ruft sie auf.
   ctx: { freigabe (jede Warnung zählt als Fehler, ausser der begründeten Abweichung), dateiVorhanden(pfad relativ zu module/),
          stopwoerter (Text oder Liste) } */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const P = (L.Pruefung = L.Pruefung || {});
  const T = (P.teile = P.teile || {});

  const ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;
  const SEMVER = /^\d+\.\d+\.\d+$/;
  const FAECHER = ['mathe', 'deutsch', 'englisch', 'nmg'];
  const MAX_JE_REGEL = 25;                              // mehr Meldungen derselben Regel werden zu einer Zeile zusammengefasst
  const THEMA_FELDER = { aktiv: ['bool'], neuProTag: ['zahl'], maxSchwierigkeit: ['zahl'] };
  const STANDARD_FELDER = { neuProTag: ['zahl'], maxSchwierigkeit: ['zahl'] };

  const text = v => typeof v === 'string' && v.trim() !== '';
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const fehlt = v => v === undefined || v === null;
  const listeVon = (v, ok) => Array.isArray(v) && v.every(ok);

  /** Zyklus-Suche in einem Graphen Map(knoten → [nachbarn]). Gibt einen Knoten auf dem Zyklus zurück oder null. */
  function zyklus(graph) {
    const stand = new Map();                            // 1 = in Arbeit, 2 = fertig
    const besuche = k => {
      if (stand.get(k) === 1) return k;
      if (stand.get(k) === 2) return null;
      stand.set(k, 1);
      for (const n of graph.get(k) || []) { const z = besuche(n); if (z !== null) return z; }
      stand.set(k, 2);
      return null;
    };
    for (const k of graph.keys()) { const z = besuche(k); if (z !== null) return z; }
    return null;
  }

  /** Sammelt Meldungen. Je Regel und Stufe höchstens MAX_JE_REGEL, der Rest wird gezählt. */
  function sammler(ctx) {
    const R = [], zaehler = new Map(), strikt = !!(ctx && ctx.freigabe);
    const add = (stufe, regel, ort, t) => {
      const schluessel = `${stufe}|${regel}`, n = (zaehler.get(schluessel) || 0) + 1;
      zaehler.set(schluessel, n);
      if (n <= MAX_JE_REGEL) R.push({ stufe, ort, text: t, regel });
    };
    return {
      fehler: (regel, ort, t) => add('fehler', regel, ort, t),
      /** bleibt: die Warnung bleibt auch im Freigabemodus eine Warnung (begründete Abweichung). */
      warnung: (regel, ort, t, bleibt) => add(strikt && !bleibt ? 'fehler' : 'warnung', regel, ort, t),
      ende() {
        for (const [schluessel, n] of zaehler) {
          if (n > MAX_JE_REGEL) { const [stufe, regel] = schluessel.split('|'); R.push({ stufe, ort: regel, text: `und ${n - MAX_JE_REGEL} weitere Meldungen der Regel «${regel}»`, regel }); }
        }
        return R;
      }
    };
  }

  /** Pflichtfeld: fehlt es, meldet die Prüfung «fehlt», sonst die Beschreibung, wenn der Wert nicht passt. */
  function pflicht(k, ort, wert, ok, was) {
    if (fehlt(wert)) k.fehler('kopf', ort, 'fehlt');
    else if (!ok(wert)) k.fehler('kopf', ort, was);
  }

  function kopf(k) {
    const m = k.modul, tag = L.Tag && L.Tag.gueltig ? L.Tag.gueltig : () => true;
    pflicht(k, 'schema', m.schema, v => v === 1, `Version ${m.schema} ist nicht bekannt (erwartet 1)`);
    pflicht(k, 'id', m.id, v => typeof v === 'string' && ID.test(v), `«${m.id}» passt nicht zum Muster ${ID}`);
    pflicht(k, 'version', m.version, v => typeof v === 'string' && SEMVER.test(v), 'Semver erwartet, zum Beispiel 1.0.0');
    pflicht(k, 'status', m.status, v => v === 'entwurf' || v === 'freigegeben', 'entweder entwurf oder freigegeben');
    pflicht(k, 'titel', m.titel, text, 'ist kein Text');
    pflicht(k, 'fach', m.fach, v => FAECHER.includes(v), `erwartet eines von ${FAECHER.join(', ')}`);
    pflicht(k, 'bereich', m.bereich, v => typeof v === 'string' && /^[a-z0-9]+\.[a-z0-9][a-z0-9-]*$/.test(v) && v.startsWith(`${m.fach}.`), `Form «${m.fach}.<name>» erwartet`);
    pflicht(k, 'stufen', m.stufen, v => listeVon(v, s => Number.isInteger(s) && s >= 3 && s <= 6) && v.length > 0, 'Liste der Klassen 3 bis 6 erwartet');
    pflicht(k, 'zyklus', m.zyklus, v => Number.isInteger(v) && v >= 1 && v <= 3, 'ganze Zahl von 1 bis 3 erwartet');
    pflicht(k, 'lp21', m.lp21, v => listeVon(v, text), 'Liste von Texten erwartet');
    pflicht(k, 'lehrmittel', m.lehrmittel, v => objekt(v) && text(v.name) && typeof v.kapitel === 'string', 'Objekt mit name und kapitel erwartet');
    pflicht(k, 'lernziele', m.lernziele, v => Array.isArray(v) && v.length > 0 && v.every(z => objekt(z) && text(z.id) && text(z.text)), 'Liste mit id und text erwartet');
    pflicht(k, 'wege', m.wege, objekt, 'Objekt erwartet');
    pflicht(k, 'standard', m.standard, objekt, 'Objekt erwartet');
    pflicht(k, 'themen', m.themen, v => Array.isArray(v) && v.length > 0 && v.every(objekt), 'Liste von Themen erwartet');
    if (!fehlt(m.gueltigBis) && !(typeof m.gueltigBis === 'string' && tag(m.gueltigBis))) k.fehler('kopf', 'gueltigBis', 'kein gültiges Datum JJJJ-MM-TT');
    if (!fehlt(m.kopieVon) && !(typeof m.kopieVon === 'string' && ID.test(m.kopieVon))) k.fehler('kopf', 'kopieVon', 'keine gültige Modul-ID');
    if (!fehlt(m.begleitung) && !listeVon(m.begleitung, text)) k.fehler('kopf', 'begleitung', 'Liste von Texten erwartet');
    for (const f of ['sprache', 'assets', 'optionen']) if (!fehlt(m[f]) && !objekt(m[f])) k.fehler('kopf', f, 'Objekt erwartet');
    if (Array.isArray(m.lernziele)) {
      const ids = m.lernziele.map(z => z && z.id);
      ids.forEach((id, i) => { if (ids.indexOf(id) !== i) k.fehler('kopf', `lernziele.${id}`, 'Lernziel-ID doppelt'); });
    }
    if (objekt(m.wege)) {
      for (const [id, w] of Object.entries(m.wege)) {
        if (!objekt(w) || !text(w.titel) || !text(w.quelle)) k.fehler('kopf', `wege.${id}`, 'Lösungsweg braucht titel und quelle');
        else if (w.geprueft === undefined) k.fehler('kopf', `wege.${id}`, 'geprueft fehlt (null oder Datum)');
        else if (w.geprueft === null) k.warnung('geprueft', `wege.${id}`, 'Lösungsweg noch nicht gegen das Lehrmittel geprüft');
        else if (!(typeof w.geprueft === 'string' && tag(w.geprueft))) k.fehler('geprueft', `wege.${id}`, 'geprueft ist weder null noch ein Datum JJJJ-MM-TT');
      }
    }
    k.struktur = Array.isArray(m.themen) && m.themen.length > 0 && m.themen.every(objekt) && Array.isArray(m.lernziele) && objekt(m.standard) && objekt(m.wege);
  }

  /** Themen laden (Parameter und Aufgaben, einmal für alle Prüfteile) und die Beziehungen der Themen prüfen. */
  function themen(k) {
    const m = k.modul, ziele = new Set(m.lernziele.filter(objekt).map(z => z.id)), gedeckt = new Set(), graph = new Map(), ids = new Set();
    for (const roh of m.themen) {
      const id = roh.id, ort = `themen.${id}`, eintrag = { roh, id, ort, t: null, aufgaben: [], alle: [] };
      k.themen.push(eintrag);
      if (!text(id) || !ID.test(id)) { k.fehler('themen', ort, `Thema-ID «${id}» passt nicht zum Muster ${ID}`); continue; }
      if (ids.has(id)) k.fehler('themen', ort, 'ID doppelt');
      ids.add(id);
      if (!text(roh.titel)) k.fehler('themen', ort, 'titel fehlt');
      if (!listeVon(roh.ziele, text)) k.fehler('themen', ort, 'ziele: Liste von Lernziel-IDs erwartet');
      else for (const z of roh.ziele) { if (ziele.has(z)) gedeckt.add(z); else k.fehler('themen', `${ort}.ziele`, `Lernziel «${z}» fehlt in lernziele`); }
      if (!fehlt(roh.voraussetzung) && !listeVon(roh.voraussetzung, text)) k.fehler('themen', ort, 'voraussetzung: Liste von Thema-IDs erwartet');
      graph.set(id, Array.isArray(roh.voraussetzung) ? roh.voraussetzung : []);
      if (roh.generator !== undefined && roh.aufgaben !== undefined) k.fehler('themen', ort, 'generator und aufgaben zugleich: nur eines von beiden');
      else if (roh.generator === undefined && roh.aufgaben === undefined) k.fehler('themen', ort, 'weder generator noch aufgaben');
      else if (roh.generator !== undefined && !(objekt(roh.generator) && text(roh.generator.name))) k.fehler('themen', ort, 'generator braucht name');
      try { eintrag.t = L.Modell.thema(m, roh); } catch (e) { k.fehler('themen', ort, e.message); continue; }
      try {
        eintrag.alle = L.Modell.aufgaben(m, roh, { veraltete: true });
        eintrag.aufgaben = eintrag.alle.filter(a => !a.veraltet);
      } catch (e) { eintrag.laden = e.message; k.fehler('aufgaben', ort, e.message); }
    }
    for (const [t, vs] of graph) for (const v of vs) if (!ids.has(v)) k.fehler('themen', `themen.${t}.voraussetzung`, `Thema «${v}» existiert nicht`);
    if (zyklus(graph) !== null) k.fehler('themen', 'themen', 'Voraussetzungen der Themen bilden einen Kreis');
    for (const z of ziele) if (!gedeckt.has(z)) k.warnung('lernziel-unbearbeitet', 'lernziele', `Lernziel «${z}» wird von keinem Thema bearbeitet`);
  }

  /** Bausteine, Dateien im Modulordner und Generatoren: ein Modul kennt nur sich selbst und module/_gemeinsam. */
  function bausteine(k) {
    const m = k.modul, reg = L.registry;
    for (const b of m.braucht || []) {
      if (typeof b !== 'string' || !/^_gemeinsam\/[a-z0-9][a-z0-9._-]*$/.test(b)) k.fehler('baustein', 'braucht', `«${b}» zeigt nicht nach module/_gemeinsam: ein Modul kennt nur sich selbst und die gemeinsamen Bausteine`);
      else if (!reg.bausteine.has(b)) k.fehler('baustein', 'braucht', `Baustein «${b}» ist unbekannt`);
    }
    for (const d of m.dateien || []) {
      if (typeof d !== 'string' || /^[\\/]|^[a-z]:|(^|[\\/])\.\.([\\/]|$)|^module[\\/]/i.test(d)) k.fehler('baustein', 'dateien', `Pfad «${d}» zeigt aus dem Modulordner hinaus`);
      else if (k.ctx.dateiVorhanden && !k.ctx.dateiVorhanden(`${m.id}/${d}`)) k.fehler('dateien', 'dateien', `Datei fehlt im Modulordner: ${d}`);
    }
    for (const t of k.themen) {
      const name = t.roh.generator && t.roh.generator.name;
      if (typeof name === 'string' && !name.startsWith(`${m.id}/`) && !name.startsWith('_gemeinsam/')) k.fehler('baustein', t.ort, `Generator «${name}» gehört zu einem anderen Modul`);
    }
  }

  /** Abweichungen von lernregeln.js brauchen einen Grund. Mastery und Freischaltung gehören nie in standard oder ein Thema. */
  function abweichung(k) {
    const m = k.modul, ab = m.abweichung;
    if (ab !== undefined) {
      const unbekannt = objekt(ab) ? Object.keys(ab).filter(f => f !== 'mastery' && f !== 'freischaltung') : ['(kein Objekt)'];
      if (unbekannt.length) k.fehler('abweichung', 'abweichung', `nur mastery und freischaltung dürfen abweichen, nicht: ${unbekannt.join(', ')}`);
      if (!text(m.abweichungGrund)) k.fehler('abweichung', 'abweichung', 'abweichung ohne abweichungGrund');
      else k.warnung('abweichung', 'abweichung', `Abweichung von lernregeln.js (${Object.keys(objekt(ab) ? ab : {}).join(', ')}): ${m.abweichungGrund}`, true);
    } else if (m.abweichungGrund !== undefined) k.warnung('abweichung', 'abweichungGrund', 'abweichungGrund ohne abweichung');
    for (const [ort, o] of [['standard', m.standard], ...k.themen.map(t => [t.ort, t.roh])]) {
      for (const f of ['mastery', 'freischaltung']) if (objekt(o) && o[f] !== undefined) k.fehler('abweichung', `${ort}.${f}`, `${f} wird hier nicht gelesen: Abweichungen gehören nach abweichung mit abweichungGrund`);
    }
  }

  /** Whitelist anpassbar: nur Pfade, die der Kern wirklich auswertet (Modell.anpassungen), mit passender Eingabeart. */
  function anpassbar(k) {
    const m = k.modul, a = m.anpassbar;
    if (a === undefined) return;
    if (!objekt(a)) { k.fehler('anpassbar', 'anpassbar', 'Objekt erwartet'); return; }
    const ids = k.themen.map(t => t.id);
    const optionen = new Set([...Object.keys(m.optionen || {}), ...Object.keys(objekt(m.standard) && m.standard.optionen || {}), ...k.themen.flatMap(t => Object.keys(t.roh.optionen || {}))]);
    for (const [pfad, b] of Object.entries(a)) {
      const ort = `anpassbar.${pfad}`, teile = pfad.split('.');
      let erlaubt = null;
      if (teile[0] === 'themen' && teile.length === 3 && (teile[1] === '*' || ids.includes(teile[1]))) erlaubt = THEMA_FELDER[teile[2]];
      else if (teile[0] === 'standard' && teile.length === 2) erlaubt = STANDARD_FELDER[teile[1]];
      else if (teile[0] === 'optionen' && teile.length === 2 && optionen.has(teile[1])) erlaubt = ['bool', 'zahl'];
      else if (pfad === 'tempo.themen' && m.tempo !== undefined) erlaubt = ['themen'];
      if (!erlaubt) k.fehler('anpassbar', ort, 'Pfad gibt es nicht oder der Kern wertet ihn nicht aus (erlaubt: themen.<id oder *>.aktiv, .neuProTag, .maxSchwierigkeit, standard.neuProTag, standard.maxSchwierigkeit, optionen.<name>, tempo.themen)');
      else if (!objekt(b) || !erlaubt.includes(b.typ)) k.fehler('anpassbar', ort, `typ muss ${erlaubt.join(' oder ')} sein`);
      else if (b.typ === 'zahl' && (![b.min, b.max].every(Number.isFinite) || b.min > b.max)) k.fehler('anpassbar', ort, 'min und max müssen Zahlen sein, min höchstens max');
    }
  }

  /** Eszett im ganzen Modul (auch in erzeugten Aufgaben), Ton in den Texten für Kind und Eltern, offene TODO. */
  function texte(k) {
    const m = k.modul, alle = P.texteIn(m), ton = [];     // alle: jeder Text des Moduls. ton: nur, was Kind oder Eltern als Rückmeldung lesen
    for (const [code, c] of Object.entries(objekt(m.fehlerCodes) ? m.fehlerCodes : {})) if (objekt(c)) ton.push(...P.texteIn({ kind: c.kind, eltern: c.eltern }, `fehlerCodes.${code}`));
    ton.push(...P.texteIn(m.begleitung, 'begleitung'));
    for (const t of k.themen) {
      ton.push(...P.texteIn(objekt(t.roh.hilfe) ? t.roh.hilfe.schritte : null, `${t.ort}.hilfe.schritte`));
      for (const a of t.alle) {
        if (objekt(a.hilfe) && a.hilfe !== t.roh.hilfe) ton.push(...P.texteIn(a.hilfe.schritte, `${t.id}/${a.id}.hilfe.schritte`));   // eigene Hilfe der Aufgabe
        if (t.roh.generator) alle.push(...P.texteIn({ inhalt: a.inhalt, hilfe: a.hilfe }, `${t.id}/${a.id}`));      // erzeugte Aufgaben stehen nicht im Modul
      }
    }
    for (const r of P.pruefeTexte(alle, { ton: false })) k.fehler(r.regel, r.ort, r.text);
    for (const r of P.pruefeTexte(ton, { stopwoerter: k.ctx.stopwoerter, eszett: false })) k.fehler(r.regel, r.ort, r.text);
    const offen = alle.filter(x => /\bTODO\b/.test(x.text));
    if (offen.length) k.warnung('todo', 'modul', `${offen.length} Texte mit TODO, zum Beispiel ${offen[0].ort}`);
  }

  /**
   * @param modul  Eintrag aus Lernwelt.registry.module
   * @param ctx    { freigabe?, dateiVorhanden?, stopwoerter? }
   * @returns [{ stufe, ort, text, regel }]
   */
  function pruefeModul(modul, ctx = {}) {
    const S = sammler(ctx);
    if (!objekt(modul)) { S.fehler('kopf', 'modul', 'Das Modul ist kein Objekt'); return S.ende(); }
    const k = { modul, ctx, reg: L.registry, L, fehler: S.fehler, warnung: S.warnung, ID, text, objekt, zyklus, themen: [], struktur: false };
    kopf(k);
    if (!k.struktur) return S.ende();                   // ohne Themen, Lernziele, standard und wege lässt sich nichts weiter prüfen
    themen(k);
    bausteine(k);
    abweichung(k);
    anpassbar(k);
    for (const name of ['aufgaben', 'leiter', 'pruefung']) {
      if (typeof T[name] === 'function') T[name](k);
      else S.fehler('kopf', 'pruefung', `Prüfteil «${name}» ist nicht geladen (inhalt-aufgaben.js und inhalt-leiter.js gehören zu inhalt.js)`);
    }
    texte(k);
    return S.ende();
  }

  P.ID = ID;
  P.FAECHER = FAECHER;
  P.pruefeModul = pruefeModul;
  P.zyklus = zyklus;                                   // pruefeLock (ids.lock.json) steht in inhalt-aufgaben.js
})(globalThis);
