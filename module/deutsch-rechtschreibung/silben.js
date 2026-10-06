/* module/deutsch-rechtschreibung/silben.js: Aufgabenbestand für «Silben gliedern und trennen» (AP-18c, Form auswahl, Typ multiple-choice).
   Zwei Arten von Fragen: «Wie trennt man das Wort richtig?» (eine richtige Trennung, drei falsche) und «Wie viele Silben hat das Wort?».
   Jede falsche Antwort trägt ihren Fehlercode: falsche Silbenzahl (zu viele oder zu wenige Trennstriche), einzelner Buchstabe abgetrennt, Silbengrenze
   verschoben. Die Codes werden hier aus Richtig und Falsch berechnet, der Typ meldet sie beim Wählen. Es gibt darum keine Diagnose des Generators.
   Regel: Von mehreren Konsonanten zwischen zwei Vokalen geht der letzte zur nächsten Silbe, «ck» und «sch» bleiben zusammen.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;

  const TRENNEN = [                                      // [id, richtige Trennung, Regel, Schwierigkeit, drei falsche Trennungen]
    ['garten', 'Gar-ten', 'mehr', 1, ['Ga-rten', 'Gart-en', 'Ga-r-ten']],
    ['kerze', 'Ker-ze', 'mehr', 1,['Ke-rze', 'Kerz-e', 'Ker-z-e']],
    ['blume', 'Blu-me', 'normal', 1, ['Blum-e', 'Bl-ume', 'Blu-m-e']],
    ['hose', 'Ho-se', 'normal', 1, ['Hos-e', 'H-ose', 'Ho-s-e']],
    ['banane', 'Ba-na-ne', 'normal', 1, ['Ban-a-ne', 'Ba-nan-e', 'Bana-ne']],
    ['fenster', 'Fens-ter', 'mehr', 2, ['Fen-ster', 'Fenst-er', 'Fe-nst-er']],
    ['katze', 'Kat-ze', 'mehr', 2, ['Ka-tze', 'Katz-e', 'Ka-t-ze']],
    ['sonne', 'Son-ne', 'doppel', 2, ['So-nne', 'Sonn-e', 'So-n-ne']],
    ['apfel', 'Ap-fel', 'mehr', 2, ['A-pfel', 'Apf-el', 'Ap-f-el']],
    ['pinsel', 'Pin-sel', 'mehr', 2, ['Pi-nsel', 'Pins-el', 'Pi-n-sel']],
    ['zucker', 'Zu-cker', 'ck', 3, ['Zuc-ker', 'Zuck-er', 'Zu-c-ker']],
    ['tasche', 'Ta-sche', 'sch', 3, ['Tas-che', 'Tasc-he', 'Ta-s-che']]
  ];
  const ZAEHLEN = [                                      // [id, Trennung, Schwierigkeit]
    ['haus', 'Haus', 1], ['schule', 'Schu-le', 1], ['fussball', 'Fuss-ball', 1],
    ['kartoffel', 'Kar-tof-fel', 2], ['schokolade', 'Scho-ko-la-de', 2], ['schmetterling', 'Schmet-ter-ling', 2]
  ];
  const REGEL = {
    normal: 'Ein einzelner Konsonant zwischen zwei Vokalen geht zur nächsten Silbe. Ein einzelner Buchstabe bleibt nicht allein stehen.',
    mehr: 'Stehen mehrere Konsonanten hintereinander, geht der letzte zur nächsten Silbe.',
    doppel: 'Bei einem doppelten Konsonanten trennt man in der Mitte.',
    ck: '«ck» bleibt zusammen und kommt zur nächsten Silbe.',
    sch: '«sch» bleibt zusammen und kommt zur nächsten Silbe.'
  };
  const wort = trennung => trennung.replace(/-/g, '');

  /** Fehlerart einer falschen Trennung: andere Silbenzahl, ein einzelner Buchstabe allein, sonst eine verschobene Grenze. */
  function code(richtig, falsch) {
    const r = richtig.split('-'), f = falsch.split('-');
    if (f.length !== r.length) return 'silbenzahl-falsch';
    return f.some(s => s.length === 1) ? 'einzelner-buchstabe' : 'silbengrenze-falsch';
  }

  const trennen = ([id, richtig, regel, stufe, falsch]) => ({
    id: `silbe-${id}`, form: 'auswahl', schwierigkeit: stufe,
    inhalt: { frage: `Wie trennt man das Wort «${wort(richtig)}» am Zeilenende richtig?`, richtig, falsch: falsch.map(f => ({ text: f, code: code(richtig, f) })) },
    hilfe: { weg: 'mitsprechen', schritte: [`Klatsche das Wort: ${richtig}.`, REGEL[regel], `Also: ${richtig}.`] }
  });

  const zaehlen = ([id, trennung, stufe]) => {
    const n = trennung.split('-').length, falsch = [n + 1, n - 1, n + 2].filter(z => z >= 1);
    return {
      id: `silbe-zahl-${id}`, form: 'auswahl', schwierigkeit: stufe,
      inhalt: { frage: `Wie viele Silben hat das Wort «${wort(trennung)}»?`, richtig: String(n), falsch: falsch.map(z => ({ text: String(z), code: 'silbenzahl-falsch' })) },
      hilfe: { weg: 'mitsprechen', schritte: ['Klatsche das Wort in die Hände.', `Das Wort «${wort(trennung)}» klatscht man so: ${trennung}.`, `Jeder Klatscher ist eine Silbe. Das sind ${n} Silbe${n === 1 ? '' : 'n'}.`] }
    };
  };

  L.generator('deutsch-rechtschreibung/silben', { pool: () => [...TRENNEN.map(trennen), ...ZAEHLEN.map(zaehlen)] });
})(globalThis);
