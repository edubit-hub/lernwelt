/* module/deutsch-rechtschreibung/doppelkonsonant.js: Aufgabenbestand und Fehlerdiagnose für «Kurzvokal, Doppelkonsonant, ck und tz» (AP-18c).
   Die Lücke steht mitten im Wort (So{nn}e). Regeln: «doppel» (nach kurzem Vokal ein doppelter Konsonant), «einfach» (nach langem Vokal nur einer), «verb» (die
   Grundform zeigt den Doppelkonsonanten: Verlängern), «ck» und «tz» (statt kk und zz), «tz-v» (Mehrzahl zeigt das tz: Blitz, Blitze). Das Thema ist beim
   Start ausgeschaltet, weil es nicht in allen Lehrmitteln der 3. Klasse steht (modul.js, Feld geltung). Das Kind wählt aus Kacheln, später schreibt es den Satz im Diktat.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, R = L.registry.bausteine.get('_gemeinsam/rechtschreibung');
  if (!R) throw new Error('Doppelkonsonant: Baustein «_gemeinsam/rechtschreibung» fehlt. Er steht in modul.js unter braucht und wird vor den Dateien des Moduls geladen.');

  const ZEILEN = [                                       // [id, Satz mit Lücke, Regel, Schwierigkeit, Grundform bei «verb»]
    ['sonne', 'Die So{nn}e scheint hell.', 'doppel', 1],
    ['mutter', 'Meine Mu{tt}er kocht.', 'doppel', 1],
    ['kanne', 'Die Ka{nn}e steht auf dem Tisch.', 'doppel', 1],
    ['ball', 'Der Ba{ll} rollt weg.', 'doppel', 1],
    ['bett', 'Im Be{tt} liegt ein Kissen.', 'doppel', 1],
    ['wasser', 'Das Wa{ss}er ist kalt.', 'doppel', 2],
    ['loeffel', 'Ich esse mit dem Lö{ff}el.', 'doppel', 2],
    ['treppe', 'Auf der Tre{pp}e steht ein Kind.', 'doppel', 2],
    ['hose', 'Die Ho{s}e ist neu.', 'einfach', 2],
    ['besen', 'Der Be{s}en steht in der Ecke.', 'einfach', 2],
    ['name', 'Mein Na{m}e ist kurz.', 'einfach', 2],
    ['jacke', 'Die Ja{ck}e ist warm.', 'ck', 2],
    ['zucker', 'Der Zu{ck}er ist süss.', 'ck', 2],
    ['bruecke', 'Die Brü{ck}e ist lang.', 'ck', 2],
    ['dackel', 'Der Da{ck}el bellt laut.', 'ck', 2],
    ['katze', 'Die Ka{tz}e schläft.', 'tz', 2],
    ['muetze', 'Die Mü{tz}e ist rot.', 'tz', 2],
    ['platz', 'Auf dem Pla{tz} spielen Kinder.', 'tz', 2],
    ['rennt', 'Er re{nn}t zum Bus.', 'verb', 3, 'rennen'],
    ['kommt', 'Er ko{mm}t nach Hause.', 'verb', 3, 'kommen'],
    ['schwimmt', 'Sie schwi{mm}t im See.', 'verb', 3, 'schwimmen'],
    ['blitz', 'Der Bli{tz} ist hell.', 'tz-v', 3]
  ];
  const WEG = { doppel: 'mitsprechen', einfach: 'mitsprechen', verb: 'verlaengern', 'tz-v': 'verlaengern', ck: 'merken', tz: 'merken' };
  const ABLENKER = { nn: ['n'], tt: ['t'], ll: ['l'], ss: ['s'], ff: ['f'], pp: ['p'], mm: ['m'], s: ['ss'], m: ['mm'], ck: ['kk', 'k'], tz: ['zz', 'z'] };
  const SCHRITTE = {
    doppel: w => [`Sprich das Wort langsam: «${w}». Der Vokal ist kurz.`, 'Nach einem kurzen Vokal steht meist ein doppelter Konsonant.', `Also: ${w}.`],
    einfach: w => [`Sprich das Wort langsam: «${w}». Der Vokal ist lang.`, 'Nach einem langen Vokal steht nur ein Konsonant.', `Also: ${w}.`],
    verb: (w, grund) => [`Bilde die Grundform: «${grund}».`, `In «${grund}» hört man den kurzen Vokal und schreibt den Konsonanten doppelt.`, `Also: ${w}.`],
    'tz-v': w => [`Bilde die Mehrzahl: «die ${w}e».`, `In «${w}e» hört man «tz». Das Wort schreibt man gleich.`, `Also: ${w}.`],
    ck: w => ['Nach einem kurzen Vokal schreibt man «ck», nicht «kk».', `Also: ${w}.`],
    tz: w => ['Nach einem kurzen Vokal schreibt man «tz», nicht «zz».', `Also: ${w}.`]
  };
  const REGEL = new Map(ZEILEN.map(z => [`dk-${z[0]}`, z[2]]));

  function aufgabe([id, satz, regel, stufe, grund]) {
    const stelle = R.woerter(satz).find(w => w.luecke);
    return {
      id: `dk-${id}`, form: 'satz', schwierigkeit: stufe,
      inhalt: { text: satz, luecken: [{ ablenker: ABLENKER[stelle.soll] }] },
      hilfe: { weg: WEG[regel], schritte: SCHRITTE[regel](stelle.wort, grund) }
    };
  }

  /** Fehlerart einer Stelle: Doppelung fehlt oder ist zu viel, ck oder tz fehlt, kk oder zz statt ck oder tz. Bei Verlängern-Aufgaben zählt «nicht verlängert». */
  function klassiere(p, regel) {
    const ist = p.ist.toLowerCase(), soll = p.soll.toLowerCase(), fehlt = WEG[regel] === 'verlaengern' ? 'nicht-verlaengert' : null;
    if (soll === 'ck' || soll === 'tz') return ist === 'kk' || ist === 'zz' ? 'kk-zz-statt-ck-tz' : ist === 'k' || ist === 'z' || ist === 'c' ? fehlt || 'ck-tz-fehlt' : null;
    if (soll.length === 2 && soll[0] === soll[1]) return ist === soll[0] ? fehlt || 'doppel-fehlt' : null;
    return soll.length === 1 && ist === soll + soll ? 'doppel-zuviel' : null;
  }

  L.generator('deutsch-rechtschreibung/doppelkonsonant', {
    pool: () => ZEILEN.map(aufgabe),
    diagnose: (auf, antwort) => R.kodiere(auf.inhalt.text, antwort, p => klassiere(p, REGEL.get(auf.id)))       // → Fehlercode oder null
  });
})(globalThis);
