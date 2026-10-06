/* module/_gemeinsam/luecken.js: gemeinsamer Baustein für Aufgaben der Form «satz» mit Zahlen in den Lücken (Architektur 4.1 und 4.3).
   Reine Funktionen: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Ein Generator baut damit Sätze wie «Ein Punktefeld hat 4 Zeilen
   mit je 6 Punkten. Es hat insgesamt {24} Punkte.», die der Übungstyp lueckentext als Auswahl zeigt (die falschen Zahlen stehen in luecken[].ablenker).
     loesungen(text)             die Lösungen der Lücken {wort} in der Reihenfolge im Text, als Texte
     ablenker(loesung, typisch)  bis zu drei falsche Zahlen als Texte: zuerst die typischen Fehler, dann die Nachbarn. Nie die Lösung, nie unter 1
     aufgabe({ id, text, luecken, ... })  Aufgabe der Form satz. luecken: ein Eintrag je Lücke: [Lösung (Zahl), typische Fehler] (Zahlen zur Auswahl),
                                 { ablenker: [Texte] } (Wörter zur Auswahl) oder null (die Lücke wird getippt)
     antwort(inhalt, antwort)    { richtig, ist, soll } zu einer Antwort des Typs lueckentext ({ luecken: [Texte] }), ist ist null ohne lesbare Antwort
   Gebrauch: das Modul nennt den Baustein in modul.js unter braucht: ['_gemeinsam/luecken'], sein Generator liest ihn mit
   Lernwelt.registry.bausteine.get('_gemeinsam/luecken'). Die Texte der Aufgaben und der Fehlercodes schreibt das Modul selbst. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const LUECKE = /\{([^{}]*)\}/g;

  /** Die Lösungen der Lücken eines Satzes in der Reihenfolge im Text. */
  const loesungen = text => [...String(text).matchAll(LUECKE)].map(m => m[1]);

  /** Bis zu drei falsche Zahlen für eine Auswahllücke: zuerst die typischen Fehler, dann die Nachbarn. Nie die Lösung, nie unter 1, keine doppelten. */
  function ablenker(loesung, typisch = []) {
    const aus = [];
    for (const z of [...typisch, loesung + 1, loesung - 1, loesung + 10, loesung - 10, loesung + 2]) {
      if (aus.length < 3 && Number.isInteger(z) && z >= 1 && z !== loesung && !aus.includes(z)) aus.push(z);
    }
    return aus.map(String);
  }

  /** Eintrag von inhalt.luecken: null (die Lücke wird getippt), [Lösung als Zahl, typische Fehler] (Zahlen zur Auswahl) oder { ablenker: [Texte] } (Wörter zur Auswahl). */
  const lueckeVon = l => (l === null ? null : Array.isArray(l) ? { ablenker: ablenker(l[0], l[1]) } : { ablenker: [...l.ablenker] });

  /** Aufgabe der Form satz. Alles ausser id, text, luecken, schwierigkeit, braucht und hilfe wandert in inhalt (zum Beispiel art und die Zahlen für diagnose). */
  function aufgabe({ id, text, luecken = [], schwierigkeit = 1, braucht = [], hilfe, ...inhalt }) {
    return { id, form: 'satz', schwierigkeit, braucht, hilfe, inhalt: { text, luecken: luecken.map(lueckeVon), ...inhalt } };
  }

  /** Antwort des Typs lueckentext gegen die Lösungen im Text: { richtig, ist, soll }. */
  function antwort(inhalt, a) {
    const soll = loesungen(inhalt && inhalt.text), ist = a && Array.isArray(a.luecken) ? a.luecken.map(w => String(w).trim()) : null;
    return { richtig: !!ist && ist.length === soll.length && soll.every((l, n) => ist[n] === l), ist: ist && ist.length === soll.length ? ist : null, soll };
  }

  L.baustein('_gemeinsam/luecken', L.einfrieren({ loesungen, ablenker, aufgabe, antwort }));
})(globalThis);
