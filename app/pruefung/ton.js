/* app/pruefung/ton.js: Textprüfung für alles, was das Kind oder die Eltern lesen (Architektur 6.9 und 9.4, modul-schema Regel 4 und 5).
   Es gibt drei Befunde: Ausrufezeichen (immer verboten), Wörter aus der Stopwortliste tools/stopwoerter.txt und das Eszett.
   Die Datei läuft im Browser und in Node und liest selbst nichts: Die Stopwortliste reicht der Aufrufer als Text oder Liste herein
   (`lw check` liest sie aus der Datei). Ohne Liste prüft die Datei nur Ausrufezeichen und Eszett.
   Format der Liste: ein Eintrag je Zeile, «#» beginnt eine Kommentarzeile. Gross- und Kleinschreibung zählt nicht, ein Wort gilt nur ganz
   («super» trifft «Super», nicht «Supermarkt»), ein Stern am Ende steht für beliebige Endungen («grossartig*» trifft «grossartige»),
   mehrere Wörter in einem Eintrag gelten als Wortfolge, ein Eintrag ohne Buchstaben (ein Zeichen) gilt überall im Text. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const P = (L.Pruefung = L.Pruefung || {});

  const AUSRUF = /[!！‼❗]/;               // Ausrufezeichen, vollbreit, doppelt und das rote Symbol
  const ESZETT = /[\u00df\u1e9e]/;                       // das scharfe s und sein Grossbuchstabe, als Code geschrieben: die App selbst enthält kein Eszett
  const BUCHSTABE = /\p{L}/u;
  const GRENZE = '[\\p{L}\\p{N}]';
  const maskiere = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const auszug = (t, n = 60) => { const s = String(t).replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };

  /** Einträge der Stopwortliste aus dem Dateitext oder einer Liste, ohne Leerzeilen und Kommentare. */
  function eintraege(quelle) {
    const zeilen = Array.isArray(quelle) ? quelle : String(quelle == null ? '' : quelle).split(/\r?\n/);
    return zeilen.map(z => String(z).replace(/^﻿/, '').trim()).filter(z => z && !z.startsWith('#'));
  }

  /** Ein Eintrag als Prüfer { eintrag, re }. Das Wortende prüft eine Vorausschau, der Wortanfang ein Zeichen davor (kein Lookbehind: ältere Safari). */
  function pruefer(eintrag) {
    const stern = eintrag.endsWith('*'), kern = (stern ? eintrag.slice(0, -1) : eintrag).trim();
    if (!kern) return null;
    const wort = BUCHSTABE.test(kern), muster = kern.split(/\s+/).map(maskiere).join('\\s+');
    return { eintrag: kern + (stern ? '*' : ''), re: new RegExp((wort ? `(?:^|[^\\p{L}\\p{N}])` : '') + muster + (wort && !stern ? `(?!${GRENZE})` : ''), 'iu') };
  }
  const kompiliere = quelle => eintraege(quelle).map(pruefer).filter(Boolean);

  /**
   * Befunde zu einem Text: Liste von { regel: 'ton' | 'eszett', text }. `liste` ist die Stopwortliste (Text, Liste oder schon kompiliert).
   * opt.ton und opt.eszett schalten die beiden Prüfungen einzeln aus (beide Standard: an).
   */
  function pruefe(text, liste, opt = {}) {
    const t = String(text), aus = [], l = liste && liste.length && liste[0] && liste[0].re ? liste : kompiliere(liste);
    if (opt.ton !== false) {
      if (AUSRUF.test(t)) aus.push({ regel: 'ton', text: `Ausrufezeichen: «${auszug(t)}»` });
      for (const p of l) if (p.re.test(t)) aus.push({ regel: 'ton', text: `Wort «${p.eintrag.replace(/\*$/, '')}» aus der Stopwortliste: «${auszug(t)}»` });
    }
    if (opt.eszett !== false && ESZETT.test(t)) aus.push({ regel: 'eszett', text: `Eszett gefunden, Schweizer Schreibweise verlangt «ss»: «${auszug(t)}»` });
    return aus;
  }

  /** Alle Texte unter einem Wert als [{ ort, text }]. Listen zählen als `pfad[n]`, Objekte als `pfad.schluessel`. */
  function texteIn(wert, pfad = '') {
    if (typeof wert === 'string') return [{ ort: pfad, text: wert }];
    if (Array.isArray(wert)) return wert.flatMap((w, i) => texteIn(w, `${pfad}[${i}]`));
    if (wert !== null && typeof wert === 'object') return Object.entries(wert).flatMap(([k, w]) => texteIn(w, pfad ? `${pfad}.${k}` : k));
    return [];
  }

  /**
   * Prüft Texte auf den Ton. `texte` ist ein Text, eine Liste von Texten oder von { ort, text } oder ein (verschachteltes) Objekt.
   * opt: { stopwoerter, ort (Vorsatz für die Orte), ton (Standard: ja), eszett (Standard: ja) }. Ergebnis wie bei der Modulprüfung:
   * [{ stufe, ort, text, regel }].
   */
  function pruefeTexte(texte, opt = {}) {
    const liste = kompiliere(opt.stopwoerter), vorsatz = opt.ort || '';
    const paare = (Array.isArray(texte) ? texte : [texte]).flatMap((t, i) => t !== null && typeof t === 'object' && typeof t.text === 'string'
      ? [{ ort: t.ort || `${vorsatz}[${i}]`, text: t.text }] : texteIn(t, Array.isArray(texte) ? `${vorsatz}[${i}]` : vorsatz));
    return paare.flatMap(({ ort, text }) => pruefe(text, liste, opt).map(b => ({ stufe: 'fehler', ort: ort || 'text', text: b.text, regel: b.regel })));
  }

  P.Ton = { eintraege, kompiliere, pruefe, ausrufezeichen: t => AUSRUF.test(String(t)), eszett: t => ESZETT.test(String(t)) };
  P.texteIn = texteIn;
  P.pruefeTexte = pruefeTexte;
})(globalThis);
