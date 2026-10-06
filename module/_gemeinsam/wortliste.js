/* module/_gemeinsam/wortliste.js: Baustein für eigene Wortlisten (AP-22, V-AP22-01). Der Elternbereich tippt die Wörter der Woche ein (Deutsch-Lernwörter,
   Englisch-Vocabulary), sie liegen nur im Lernstand (zustand.listen), nie im Repository und bei keiner KI. Dieser Baustein macht aus einer Liste ein
   vollwertiges Modulobjekt, das die App wie jedes andere Modul übt (Tagesauftrag, Prüfungsplan, Boxen). Reine Funktionen: kein Zustand, keine Oberfläche.
   Liste: { id, titel, fach: 'deutsch' | 'englisch', pruefung: null | 'JJJJ-MM-TT', bis: null | 'JJJJ-MM-TT', erstellt, geaendert, eintraege: [{ wort, bedeutung?, satz? }] }.
   Aufgaben-IDs stammen aus dem normalisierten Wort (w-hund, s-hund): Bedeutung, Satz und Gross-/Kleinschreibung zu ändern kostet keinen Fortschritt.
   Deutsch: Thema «woerter» (diktat, form satz) und «saetze» (lueckentext, nur wo das Wort im Beispielsatz steht). Englisch: «woerter» (karteikarten, hoeren,
   zuordnen, diktat, form wortkarte) und «saetze» wie im Deutschen. Das Modul bleibt Entwurf, es gibt keine Lösungswege (wege leer). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const FAECHER = ['deutsch', 'englisch'];
  const GRENZEN = { listen: 30, eintraege: 60, titel: 60, feld: 160, kern: 40, minEnglisch: 3, pruefAnzahl: 20 };
  const VERSION = '1.0.0';
  const UMLAUT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };

  /** Text für Tastatur und Anzeige: NFC, typografische Hochkommas gerade, Eszett als ss, Leerraum zusammengefasst. */
  const ESZETT = new RegExp(`[${String.fromCharCode(0xdf, 0x1e9e)}]`, 'g');          // kein Literal: die App enthält kein Eszett
  const sauber = s => String(s ?? '').normalize('NFC').replace(/[‘’´`]/g, "'").replace(/[–—]/g, '-')
    .replace(ESZETT, 'ss').replace(/\s+/g, ' ').trim();
  const feld = s => sauber(String(s ?? '').replace(/[{}|]/g, ' '));
  const gueltigerTag = t => typeof t === 'string' && L.Tag.gueltig(t);
  const regex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /** Der Kern der Aufgaben-ID: nur a-z, 0-9 und «-», Umlaute als ae oe ue, Akzente weg. */
  function normalisiere(wort) {
    const t = sauber(wort).toLowerCase().replace(/[äöü]/g, c => UMLAUT[c]).normalize('NFD').replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return t || `x${L.Zufall.hash(sauber(wort)).toString(36)}`;
  }

  /** Kern der ID, innerhalb einer Liste eindeutig (zweiter gleicher Kern: -2). Lange Wörter werden gekürzt und tragen einen Hash. */
  function kernVon(wort, benutzt) {
    let k = normalisiere(wort);
    if (k.length > GRENZEN.kern) k = `${k.slice(0, GRENZEN.kern)}-${L.Zufall.hash(k).toString(36)}`;
    let id = k, n = 1;
    while (benutzt.has(id)) id = `${k}-${++n}`;
    benutzt.add(id);
    return id;
  }

  /** Setzt die Lücke: steht das Wort im Satz (ganzes Wort, Gross-/Kleinschreibung egal), kommt es in {…}. Ein vom Elternteil markierter Satz bleibt.
      Gibt den Satz mit Lücke oder null zurück. */
  function markiere(wort, satz) {
    const s = sauber(satz), w = sauber(wort);
    if (!s || !w) return null;
    if (/\{[^{}]+\}/.test(s)) return s.replace(/\|/g, ' ');
    const t = s.replace(/[{}|]/g, ' '), m = new RegExp(`(^|[^\\p{L}\\p{N}])(${regex(w)})(?=$|[^\\p{L}\\p{N}])`, 'iu').exec(t);
    if (!m) return null;
    const von = m.index + m[1].length;
    return `${t.slice(0, von)}{${m[2]}}${t.slice(von + m[2].length)}`;
  }

  /**
   * Zerlegt den Text des Elternbereichs. Eine Zeile je Wort. Deutsch: «Wort» oder «Wort = Beispielsatz». Englisch: «word = Bedeutung» oder
   * «word = Bedeutung = Beispielsatz». Aufzählungszeichen und Nummern am Zeilenanfang fallen weg, ein Wort zweimal zählt einmal.
   * → { eintraege, probleme: [{ zeile, wort?, text }] (verhindern das Speichern), hinweise: [{ zeile, wort?, text }] }
   */
  function zerlege(text, fach) {
    const eintraege = [], probleme = [], hinweise = [], gesehen = new Map(), englisch = fach === 'englisch';
    String(text ?? '').split(/\r?\n/).forEach((roh, i) => {
      const zeile = i + 1, t = roh.replace(/^\s*(?:[-*•]\s+|\d{1,3}[.)]\s+)/, '');
      if (!t.trim()) return;
      const teile = t.split('='), wort = feld(teile[0]), bedeutung = englisch ? feld(teile[1]) : '';
      const satz = sauber(teile.slice(englisch ? 2 : 1).join(' ').replace(/\|/g, ' '));
      const p = text_ => probleme.push({ zeile, ...(wort ? { wort } : {}), text: text_ });
      if (!wort) return p('Vor dem Gleichheitszeichen fehlt das Wort.');
      if (englisch && !bedeutung) return p('Die deutsche Bedeutung fehlt. Schreibweise: Wort = Bedeutung.');
      if ([wort, bedeutung, satz].some(x => x.length > GRENZEN.feld)) return p(`Eine Angabe ist länger als ${GRENZEN.feld} Zeichen.`);
      if (/[{}]/.test(satz.replace(/\{[^{}]+\}/g, ''))) return p('Die geschweiften Klammern im Beispielsatz passen nicht zusammen.');
      if (gesehen.has(wort)) return hinweise.push({ zeile, wort, text: `«${wort}» steht schon in Zeile ${gesehen.get(wort)} und zählt nur einmal.` });
      gesehen.set(wort, zeile);
      if (satz && !markiere(wort, satz)) hinweise.push({ zeile, wort, text: `«${wort}» kommt im Beispielsatz nicht vor, darum gibt es keine Lückenaufgabe. Eine andere Form des Wortes lässt sich im Satz mit { } markieren.` });
      eintraege.push({ wort, ...(bedeutung ? { bedeutung } : {}), ...(satz ? { satz } : {}) });
    });
    return { eintraege, probleme, hinweise };
  }

  /** Die Einträge als Text für das Eingabefeld (Umkehrung von zerlege). */
  const alsText = liste => eintraegeVon(liste).map(e => [e.wort, e.bedeutung, e.satz].filter(Boolean).join(' = ')).join('\n');

  const eintraegeVon = liste => (Array.isArray(liste && liste.eintraege) ? liste.eintraege : []).filter(e => e && typeof e.wort === 'string' && e.wort.trim() !== '');

  /** Das Modulobjekt zur Liste und `quellen` (Aufgaben-ID → Eintrag), mit der sich Meldungen der Prüfung dem Wort zuordnen lassen. */
  function aufbau(liste) {
    const fach = liste.fach === 'englisch' ? 'englisch' : 'deutsch', de = fach === 'deutsch', benutzt = new Set(), quellen = new Map(), woerter = [], saetze = [];
    for (const e of eintraegeVon(liste)) {
      const kern = kernVon(e.wort, benutzt), id = `w-${kern}`, luecke = e.satz ? markiere(e.wort, e.satz) : null;
      quellen.set(id, e);
      woerter.push(de ? { id, form: 'satz', inhalt: { text: e.wort } } : { id, form: 'wortkarte', inhalt: { fremd: e.wort, mutter: e.bedeutung || '' } });
      if (luecke) { quellen.set(`s-${kern}`, e); saetze.push({ id: `s-${kern}`, form: 'satz', inhalt: { text: luecke } }); }
    }
    const n = woerter.length, anzahl = Math.max(1, Math.min(n, GRENZEN.pruefAnzahl));
    const leiter = de ? [{ box: 0, typ: 'diktat' }]                         // ohne Ton kein Diktat: die Aufgabe bleibt dann fällig (diktat hat keinen Ersatz)
      : [{ box: 0, typ: 'karteikarten' }, { box: 1, typ: 'hoeren' }, ...(n >= GRENZEN.minEnglisch ? [{ box: 2, typ: 'zuordnen' }] : []), { box: 3, typ: 'diktat' }];
    const themen = [{ id: 'woerter', titel: de ? 'Wörter schreiben' : 'Wörter lernen', ziele: ['lz1'], einfuehrung: de ? 'vortest' : 'erklaerung', leiter, hilfeVerzicht: true, aufgaben: woerter }];
    if (saetze.length) themen.push({ id: 'saetze', titel: 'Sätze mit Lücke', ziele: ['lz1'], einfuehrung: 'vortest', leiter: [{ box: 0, typ: 'lueckentext' }], hilfeVerzicht: true, aufgaben: saetze });
    const modul = {
      schema: 1, id: liste.id || 'liste-vorschau', version: VERSION, status: 'entwurf', titel: sauber(liste.titel) || 'Wortliste', fach, bereich: `${fach}.wortlisten`,
      stufen: [3, 4, 5, 6], zyklus: 2, lp21: [], lehrmittel: { name: 'Eigene Wortliste', kapitel: '' },
      sprache: de ? { mutter: 'de-CH' } : { fremd: 'en-GB', mutter: 'de-CH' },
      lernziele: [{ id: 'lz1', text: de ? 'Ich schreibe die Wörter der Liste richtig.' : 'Ich verstehe und schreibe die englischen Wörter der Liste.' }],
      wege: {}, standard: { neuProTag: 5 }, themen, fehlerCodes: {},
      anpassbar: { 'standard.neuProTag': { typ: 'zahl', min: 2, max: 8 }, 'themen.*.aktiv': { typ: 'bool' } },
      pruefung: { datum: gueltigerTag(liste.pruefung) ? liste.pruefung : null, themen: ['*'], richtzeitMin: Math.max(5, Math.ceil(anzahl / 2)),
        format: [{ thema: 'woerter', typ: 'diktat', anzahl, punkte: anzahl }] },
      begleitung: ['Die Wörter stammen aus der Liste, die im Elternbereich eingetragen wurde. Täglich wenige Minuten genügen.'],
      ...(gueltigerTag(liste.bis) ? { gueltigBis: liste.bis } : {})
    };
    return { modul, quellen };
  }

  const baue = liste => aufbau(liste).modul;

  /** Meldungen der Übungstypen nennen die erlaubten Zeichen samt Satzzeichen-Aufzählung; im Elternbereich gilt derselbe Ton ohne Ausrufezeichen. */
  const ton = text => String(text).replace(/ \(Buchstaben[^)]*\)/, '. Erlaubt sind Buchstaben, Ziffern und gängige Satzzeichen.').replace(/\s*!/g, '');

  /** Probleme der Liste, die das Speichern verhindern: Kopf (Titel, Fach, Daten, Zahl der Wörter) und die Inhaltsprüfung der Übungstypen,
      je Meldung dem Wort zugeordnet. → [{ wort?, text }] */
  function pruefe(liste) {
    const f = [], eintraege = eintraegeVon(liste), englisch = liste.fach === 'englisch';
    if (!sauber(liste.titel)) f.push({ text: 'Der Titel fehlt.' });
    else if (sauber(liste.titel).length > GRENZEN.titel) f.push({ text: `Der Titel ist länger als ${GRENZEN.titel} Zeichen.` });
    if (!FAECHER.includes(liste.fach)) f.push({ text: 'Das Fach fehlt.' });
    for (const [name, wert] of [['Das Prüfungsdatum', liste.pruefung], ['Das Datum «gültig bis»', liste.bis]]) if (wert && !gueltigerTag(wert)) f.push({ text: `${name} ist kein gültiges Datum.` });
    if (gueltigerTag(liste.pruefung) && gueltigerTag(liste.bis) && liste.bis < liste.pruefung) f.push({ text: 'Die Liste würde vor der Prüfung ausgeblendet: «gültig bis» liegt vor dem Prüfungsdatum.' });
    if (!eintraege.length) f.push({ text: 'Die Liste enthält noch kein Wort.' });
    else if (eintraege.length > GRENZEN.eintraege) f.push({ text: `Die Liste hat mehr als ${GRENZEN.eintraege} Wörter. Besser zwei Listen anlegen.` });
    else if (englisch && eintraege.length < GRENZEN.minEnglisch) f.push({ text: `Englisch braucht mindestens ${GRENZEN.minEnglisch} Wörter, damit Hören und Zuordnen eine Auswahl haben.` });
    if (f.length || !L.Pruefung || typeof L.Pruefung.pruefeModul !== 'function') return f;
    const b = aufbau(liste), da = new Set();
    for (const m of L.Pruefung.pruefeModul(b.modul, {})) {
      if (m.stufe !== 'fehler') continue;
      const id = /\/([a-z0-9._-]+)(?: \(|$)/.exec(m.ort || ''), e = id && b.quellen.get(id[1]), schluessel = `${e ? e.wort : ''}|${m.text}`;
      if (!da.has(schluessel)) { da.add(schluessel); f.push({ ...(e ? { wort: e.wort } : {}), text: ton(m.text) }); }
    }
    return f;
  }

  /** Ausgeblendet: «gültig bis» liegt vor heute. Der Fortschritt im Lernstand bleibt, die Liste erscheint nur nicht mehr im Plan. */
  const abgelaufen = (liste, heute) => gueltigerTag(liste && liste.bis) && gueltigerTag(heute) && liste.bis < heute;

  /** Neue Modul-ID: liste-<jjmmtt>-<drei Zeichen>, in `vorhanden` (Liste von IDs) nicht enthalten. */
  function neueId(vorhanden, jetzt = new Date(), zufall = Math.random) {
    const tag = `${String(jetzt.getFullYear()).slice(2)}${String(jetzt.getMonth() + 1).padStart(2, '0')}${String(jetzt.getDate()).padStart(2, '0')}`;
    for (let versuch = 0; ; versuch++) {
      const id = `liste-${tag}-${Math.floor(zufall() * 46656).toString(36).padStart(3, '0')}${versuch > 30 ? versuch : ''}`;
      if (!vorhanden.includes(id)) return id;
    }
  }

  L.baustein('_gemeinsam/wortliste', L.einfrieren({ FAECHER, GRENZEN, VERSION, normalisiere, kernVon, markiere, zerlege, alsText, aufbau, baue, pruefe, abgelaufen, neueId }));
})(globalThis);
