/* module/deutsch-rechtschreibung/nomen.js: Aufgabenbestand und Fehlerdiagnose für «Nomen und Grossschreibung» (AP-18c).
   Jeder Satz hat zwei bis drei Lücken: Nomen (gross) und Wörter, die keine Nomen sind (klein). Bei jeder Lücke wählt das Kind zwischen der grossen und der
   kleinen Schreibung (lueckentext mit Ablenker), später schreibt es den Satz im Diktat. Lösungsweg ist die Artikelprobe.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, R = L.registry.bausteine.get('_gemeinsam/rechtschreibung');
  if (!R) throw new Error('Nomen: Baustein «_gemeinsam/rechtschreibung» fehlt. Er steht in modul.js unter braucht und wird vor den Dateien des Moduls geladen.');

  const ARTIKEL = {                                      // Artikelprobe: welcher Artikel passt vor das Nomen (Mehrzahl: die)
    Hund: 'der', Katze: 'die', Sofa: 'das', Bus: 'der', Schule: 'die', Kind: 'das', Bild: 'das', Garten: 'der', Rose: 'die', Mutter: 'die', Suppe: 'die',
    Vogel: 'der', Baum: 'der', Wasser: 'das', See: 'der', Morgen: 'der', Sonne: 'die', Buch: 'das', Pferde: 'die', Lehrerin: 'die', Geschichte: 'die',
    Park: 'der', Ball: 'der', Apfel: 'der', Ast: 'der', Hunger: 'der', Durst: 'der', Spiel: 'das', Spass: 'der', Mut: 'der', Glück: 'das', Angst: 'die',
    Gewitter: 'das', Freude: 'die', Geschenk: 'das'
  };
  const ZEILEN = [                                       // [id, Satz mit Lücken, Schwierigkeit]
    ['hund', 'Der {Hund} {bellt} laut.', 1],
    ['katze', 'Die {Katze} {schläft} auf dem {Sofa}.', 1],
    ['bus', 'Der {Bus} {fährt} zur {Schule}.', 1],
    ['kind', 'Das {Kind} {malt} ein {Bild}.', 1],
    ['garten', 'Im {Garten} {blüht} eine {Rose}.', 1],
    ['mutter', 'Die {Mutter} {kocht} eine {Suppe}.', 1],
    ['vogel', 'Der {Vogel} {singt} auf dem {Baum}.', 1],
    ['wasser', 'Das {Wasser} im {See} ist {kalt}.', 2],
    ['morgen', 'Am {Morgen} {scheint} die {Sonne}.', 2],
    ['buch', 'Ich {lese} ein {Buch} über {Pferde}.', 2],
    ['lehrerin', 'Die {Lehrerin} {liest} eine {Geschichte} vor.', 2],
    ['ball', 'Wir {spielen} im {Park} mit dem {Ball}.', 2],
    ['apfel', 'Der {Apfel} {fällt} vom {Ast}.', 2],
    ['hunger', 'Ich habe {Hunger} und {Durst}.', 3],
    ['spass', 'Das {Spiel} macht {Spass}.', 3],
    ['mut', 'Mit {Mut} {springt} er ins {Wasser}.', 3],
    ['glueck', 'Wir haben {Glück} und {finden} den Weg.', 3],
    ['angst', 'Sie hat {Angst} vor dem {Gewitter}.', 3],
    ['freude', 'Die {Freude} über das {Geschenk} ist {gross}.', 3]
  ];

  const gross = w => /^\p{Lu}/u.test(w);
  const umgekehrt = w => (gross(w) ? w[0].toLowerCase() : w[0].toUpperCase()) + w.slice(1);   // die jeweils andere Schreibung als Ablenker

  function aufgabe([id, satz, stufe]) {
    const luecken = R.woerter(satz).filter(w => w.luecke).map(w => w.soll);
    return {
      id: `nomen-${id}`, form: 'satz', schwierigkeit: stufe,
      inhalt: { text: satz, luecken: luecken.map(w => ({ ablenker: [umgekehrt(w)] })) },
      hilfe: { weg: 'artikelprobe', schritte: ['Setze «der», «die» oder «das» vor das Wort. Passt einer davon, ist es ein Nomen.',
        ...luecken.map(w => (gross(w) ? `«${w}»: «${ARTIKEL[w]} ${w}» passt. Nomen, also gross.` : `«${w}»: «der ${w}» passt nicht. Kein Nomen, also klein.`))] }
    };
  }

  /** Fehlerart einer Stelle: nur die Gross- und Kleinschreibung weicht ab. Ein Nomen klein ist etwas anderes als ein Verb oder Adjektiv gross. */
  const klassiere = p => (p.ist.toLowerCase() !== p.soll.toLowerCase() ? null : gross(p.soll) ? 'nomen-klein' : 'kleinwort-gross');

  L.generator('deutsch-rechtschreibung/nomen', {
    pool: () => ZEILEN.map(aufgabe),
    diagnose: (auf, antwort) => R.kodiere(auf.inhalt.text, antwort, klassiere)       // → Fehlercode oder null
  });
})(globalThis);
