/* app/ansichten/texte.js: alle Texte der Startansicht, der Ansicht «Lernen» und des Tagesabschlusses an einer Stelle (Architektur 6.9).
   Der Ton ist sachlich und auf Augenhöhe: keine Ausrufezeichen, kein Lob, kein Druck. tests/lernansichten.test.mjs prüft jeden Text
   mit Pruefung.pruefeTexte (Ausrufezeichen, Stopwortliste, Schweizer Schreibweise). Die Texte des Laufs stehen in Rueckmeldung.texte. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
  const min = m => mz(m, 'Minute', 'Minuten');

  L.Texte = Object.assign(L.Texte || {}, {
    fach: { mathe: 'Rechnen', deutsch: 'Deutsch', englisch: 'Englisch', nmg: 'Natur, Mensch, Gesellschaft' },
    menue: { start: 'Start', lernen: 'Lernen' },
    start: {
      willkommen: 'Willkommen in der Lernwelt.',
      profilEinleitung: 'Zwei Angaben vorab. Sie bleiben auf diesem Gerät.',
      vorname: 'Vorname', klasse: 'Klasse', weiter: 'Weiter', vornameFehlt: 'Bitte einen Vornamen eingeben.',
      hallo: name => `Hallo ${name}.`,
      heuteOffen: (n, m) => `Heute: ${mz(n, 'Aufgabe', 'Aufgaben')}, etwa ${min(m)}.`,
      heuteErledigt: 'Heute ist alles Fällige erledigt.',
      heuteNichts: 'Heute ist nichts fällig.',
      keinModul: 'Noch kein Lernmodul aktiv. Eine Sicherung mit aktivem Modul lässt sich im Elternbereich unter «Daten» einspielen.',
      los: 'Start', eltern: 'Eltern', elternBeschriftung: 'Elternbereich öffnen', elternMitHinweis: 'Elternbereich öffnen. Es gibt einen Hinweis.', elternHinweis: 'Hinweis: Eine Sicherung ist fällig.',
      elternFehlt: 'Der Elternbereich ist in dieser Version noch nicht verfügbar.',
      neueVersion: 'Neue Version bereit.', neueVersionKnopf: 'Jetzt laden',
      version: v => `Version ${v}`, testprofil: p => `Testprofil «${p}»`,
      fehlerTitel: 'Die Lernwelt kann den Lernstand nicht laden.'
    },
    lernen: {
      titel: 'Tagesauftrag',
      unterzeile: (n, m) => `${mz(n, 'Aufgabe', 'Aufgaben')}, etwa ${min(m)}. Du wählst die Reihenfolge.`,
      rundeInfo: (n, m) => `${mz(n, 'Aufgabe', 'Aufgaben')}, etwa ${min(m)}`,
      neu: n => `Neu: ${n}`, starten: 'Starten', alle: 'Alle der Reihe nach',
      schonHeute: n => `Heute schon erledigt: ${mz(n, 'Aufgabe', 'Aufgaben')}.`,
      erledigt: 'Tagesauftrag erledigt.',
      erledigtZahlen: (n, ers) => `${mz(n, 'Aufgabe', 'Aufgaben')}, ${ers} beim ersten Versuch.`,
      morgenNeu: 'Morgen kommt Neues.', zeitUm: 'Die Zeit für heute ist um. Der Rest bleibt fällig.',
      nichtsFaellig: 'Heute ist nichts fällig. Morgen geht es weiter.',
      zusatz: 'Zusatzrunde', zusatzStarten: 'Zusatzrunde starten',
      zusatzFrei: 'Eine Zusatzrunde ist freiwillig und bringt keinen Ertrag.',
      keinModul: 'Es ist noch kein Lernmodul aktiv.',
      modulFehler: grund => `Ein Modul lässt sich nicht lesen: ${grund}`,
      statusOffen: n => `Heute: Tagesauftrag noch ${mz(n, 'Aufgabe', 'Aufgaben')}`,
      statusErledigt: 'Heute: Tagesauftrag erledigt'
    },
    abschluss: {
      /** Text, wenn eine Runde fertig ist, der Tagesauftrag aber noch nicht (sonst gilt Rueckmeldung.texte.abschluss). */
      runde: (b, ertrag) => {
        const n = b.aufgaben || 0, morgen = b.morgen > 0 ? ` ${b.morgen === 1 ? '1 Aufgabe kommt' : `${b.morgen} Aufgaben kommen`} morgen wieder.` : '';
        const gewinn = ertrag && ertrag.length ? ` Ertrag: ${ertrag.map(x => `${x.name} +${x.menge}`).join(', ')}.` : ' Ertrag: keiner.';
        return `Runde beendet: ${mz(n, 'Aufgabe', 'Aufgaben')}, ${b.ersterVersuch || 0} beim ersten Versuch.${morgen}${gewinn}`;
      },
      neuMoeglich: liste => `Neu möglich: ${liste.join(', ')}.`,
      bauen: (name, stufe) => (stufe > 1 ? `${name} auf Stufe ${stufe} ausbauen` : `${name} bauen`),
      veredeln: name => `${name} veredeln`, forschen: name => `Forschung «${name}»`,
      siedlungFolgt: 'Siedlung folgt.',
      siedlungText: 'Dein Ertrag ist gespeichert. Sobald die Siedlung da ist, setzt du ihn dort ein.',
      weiter: 'Weiter', zumStart: 'Zum Start', zurSiedlung: 'Zur Siedlung'
    }
  });
})(globalThis);
