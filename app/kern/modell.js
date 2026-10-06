/* app/kern/modell.js: macht aus einer Moduldatei Themen, Aufgaben und aufgelöste Parameter. Rein, ohne DOM und Zustand.
   Auflösungsreihenfolge (Architektur 2.7), später gewinnt: lernregeln → modul.standard → thema → modul.abweichung
   (nur Mastery und Freischaltung) → Eltern-Anpassung (nur Felder aus modul.anpassbar). lernregeln wird bei jedem Aufruf neu gelesen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const klemme = (v, min, max) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  const regex = muster => new RegExp('^' + muster.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.+') + '$');

  /** Prüft einen Wert gegen die Beschreibung aus `anpassbar`. Gibt { wert } oder null (dann wird er ignoriert). */
  function pruefeWert(beschreibung, wert) {
    switch (beschreibung && beschreibung.typ) {
      case 'bool': return typeof wert === 'boolean' ? { wert } : null;
      case 'zahl': return typeof wert === 'number' && Number.isFinite(wert) ? { wert: klemme(wert, beschreibung.min, beschreibung.max) } : null;
      case 'themen': return Array.isArray(wert) && wert.every(t => typeof t === 'string') ? { wert } : null;
      default: return null;
    }
  }

  /** Die gültigen Eltern-Einstellungen als { pfad: wert }. Pfade ausserhalb von `anpassbar` und ungültige Werte fallen weg. */
  function anpassungen(modul, anpassung) {
    const erlaubt = Object.entries(modul.anpassbar || {}).map(([muster, beschreibung]) => ({ re: regex(muster), beschreibung }));
    const aus = {};
    for (const [pfad, wert] of Object.entries(anpassung || {})) {
      const e = erlaubt.find(x => x.re.test(pfad)), r = e && pruefeWert(e.beschreibung, wert);
      if (r) aus[pfad] = r.wert;
    }
    return aus;
  }

  /** Thema-Objekt aus Objekt oder ID. */
  function themaDaten(modul, t) {
    const th = typeof t === 'string' ? (modul.themen || []).find(x => x.id === t) : t;
    if (!th || typeof th !== 'object') throw new Error(`Modul «${modul.id}»: Thema «${t}» gibt es nicht`);
    return th;
  }

  /** Alle aufgelösten Parameter eines Themas: aktiv, einfuehrung, leiter, optionen, neuProTag, maxSchwierigkeit, mastery, freischaltung. */
  function parameter(modul, t, anpassung) {
    const th = themaDaten(modul, t), R = L.lernregeln, S = modul.standard || {}, ab = modul.abweichung || {};
    const a = anpassungen(modul, anpassung);
    const wert = (feld, vorgabe) => {
      let v = S[feld] !== undefined ? S[feld] : vorgabe;
      if (th[feld] !== undefined) v = th[feld];
      for (const pfad of [`standard.${feld}`, `themen.${th.id}.${feld}`]) if (pfad in a) v = a[pfad];
      return v;
    };
    const optionen = { ...modul.optionen, ...S.optionen, ...th.optionen };
    for (const [pfad, v] of Object.entries(a)) if (pfad.startsWith('optionen.')) optionen[pfad.slice(9)] = v;
    return {
      aktiv: `themen.${th.id}.aktiv` in a ? a[`themen.${th.id}.aktiv`] !== false : th.aktiv !== false,   // Eltern-Einstellung gewinnt, sonst das Feld des Themas (V-AP20-02)
      einfuehrung: wert('einfuehrung', 'vortest'),
      leiter: wert('leiter', []),
      optionen,
      neuProTag: Math.floor(klemme(wert('neuProTag', R.sitzung.neuProTagMax), 1, R.sitzung.neuProTagMax)),
      maxSchwierigkeit: Math.floor(klemme(wert('maxSchwierigkeit', 3), 1, 3)),
      mastery: { ...R.mastery, ...ab.mastery },
      freischaltung: { ...R.freischaltung, ...ab.freischaltung }
    };
  }

  /** Thema mit allen aufgelösten Parametern (überschreiben gleichnamige Felder des Themas). */
  function thema(modul, t, anpassung) {
    const th = themaDaten(modul, t);
    return { ...th, ...parameter(modul, th, anpassung) };
  }

  /** Alle Aufgaben eines Themas aus Generator, Tabelle oder Liste, mit key, modul, thema, fach, bereich und geerbter Hilfe.
      Veraltete Aufgaben fehlen, ausser mit { veraltete: true } (zum Beispiel für den Abgleich der IDs). */
  function aufgaben(modul, t, opt = {}) {
    const th = themaDaten(modul, t), einfuehrung = parameter(modul, th).einfuehrung;
    let roh;
    if (th.generator) {
      const gen = L.registry.generatoren.get(th.generator.name);
      if (!gen) throw new Error(`Generator «${th.generator.name}» ist nicht registriert`);
      roh = gen.pool(th.generator.params ?? {});
    } else if (th.aufgaben && !Array.isArray(th.aufgaben) && th.aufgaben.tabelle) {
      const { form, spalten, zeilen } = th.aufgaben.tabelle;
      roh = zeilen.map(z => {
        const { id, ...inhalt } = Object.fromEntries(spalten.map((s, i) => [s, z[i]]));
        return { id, form, inhalt };
      });
    } else roh = th.aufgaben ?? [];
    return roh.filter(a => opt.veraltete || !a.veraltet).map(a => {
      const aufgabe = { ...a, braucht: a.braucht ?? [], schwierigkeit: a.schwierigkeit ?? 1, einfuehrung,
        key: `${modul.id}/${a.id}`, modul: modul.id, thema: th.id, fach: modul.fach, bereich: modul.bereich };
      const hilfe = a.hilfe ?? (a.hilfeVerzicht ? undefined : th.hilfe);
      if (hilfe === undefined) delete aufgabe.hilfe; else aufgabe.hilfe = hilfe;
      if (th.generator) aufgabe.generator = th.generator.name;
      return aufgabe;
    });
  }

  /** Aufgabe eines Generators mit instanz(): neue Zahlen je Tag, reproduzierbar aus Aufgabenschlüssel und Tag. Sonst die Aufgabe selbst. */
  function instanz(aufgabe, tag) {
    const gen = aufgabe.generator && L.registry.generatoren.get(aufgabe.generator);
    if (!gen || typeof gen.instanz !== 'function') return aufgabe;
    const neu = gen.instanz(aufgabe, L.Zufall.aus(`${aufgabe.key}|${tag}`));
    return { ...aufgabe, ...neu, id: aufgabe.id, key: aufgabe.key, modul: aufgabe.modul, thema: aufgabe.thema };
  }

  /** Eintrag der Leiter für eine Box: der mit der grössten box, die höchstens der Box der Aufgabe entspricht und deren «wenn» erfüllt ist.
      `t` ist ein aufgelöstes Thema (mit leiter und optionen). */
  function typFuer(t, box) {
    const leiter = (t && t.leiter) || [];
    if (!leiter.length) throw new Error(`Thema «${t && t.id}» hat keine Leiter`);
    const b = Number.isFinite(box) ? box : 0, frei = s => !s.wenn || !!(t.optionen && t.optionen[s.wenn]);
    let treffer = null;
    for (const s of leiter) if (s.box <= b && frei(s) && (!treffer || s.box >= treffer.box)) treffer = s;
    return treffer || leiter.find(frei) || leiter[0];
  }

  L.Modell = { thema, aufgaben, instanz, typFuer, parameter, anpassungen, themaKey: (modul, t) => `${modul.id}/${typeof t === 'string' ? t : t.id}` };
})(globalThis);
