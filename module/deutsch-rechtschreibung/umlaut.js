/* module/deutsch-rechtschreibung/umlaut.js: Aufgabenbestand und Fehlerdiagnose für «e-/ä-Schreibung und Umlautregel» (AP-18c).
   Die Lücke steht mitten im Wort (H{ä}nde). Regeln: «ae» und «aeu» (es gibt ein verwandtes Wort mit a oder au: ä oder äu), «e» und «eu» (es gibt keines),
   «e-merk» (Ausnahme «Eltern») und «ae-merk» (ä ohne verwandtes Wort mit a: Bär, Käse). Die Ausnahmen haben Schwierigkeit 3. Die Entscheidung läuft über das
   verwandte Wort, nicht über das Gehör. Das Kind wählt aus Kacheln, später schreibt es den Satz im Diktat.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, R = L.registry.bausteine.get('_gemeinsam/rechtschreibung');
  if (!R) throw new Error('Umlaut: Baustein «_gemeinsam/rechtschreibung» fehlt. Er steht in modul.js unter braucht und wird vor den Dateien des Moduls geladen.');

  const ZEILEN = [                                       // [id, Satz mit Lücke, Regel, Schwierigkeit, verwandtes Wort mit a oder au]
    ['haende', 'Die H{ä}nde sind kalt.', 'ae', 1, 'Hand'],
    ['blaetter', 'Im Herbst fallen die Bl{ä}tter.', 'ae', 1, 'Blatt'],
    ['aepfel', 'Im Korb liegen {Ä}pfel.', 'ae', 1, 'Apfel'],
    ['gaertner', 'Der G{ä}rtner pflanzt Blumen.', 'ae', 2, 'Garten'],
    ['baecker', 'Der B{ä}cker backt Brot.', 'ae', 2, 'backen'],
    ['kaelter', 'Im Winter ist es k{ä}lter.', 'ae', 2, 'kalt'],
    ['baeume', 'Im Park stehen hohe B{äu}me.', 'aeu', 1, 'Baum'],
    ['maeuse', 'Die M{äu}se leben im Feld.', 'aeu', 1, 'Maus'],
    ['haeuser', 'Die H{äu}ser sind alt.', 'aeu', 2, 'Haus'],
    ['traeume', 'Ich habe schöne Tr{äu}me.', 'aeu', 2, 'Traum'],
    ['bett', 'Das B{e}tt ist weich.', 'e', 1],
    ['berg', 'Der B{e}rg ist hoch.', 'e', 1],
    ['nest', 'Im N{e}st liegen drei Eier.', 'e', 2],
    ['hemd', 'Ich trage ein H{e}md.', 'e', 2],
    ['welt', 'Die W{e}lt ist gross.', 'e', 2],
    ['feuer', 'Das F{eu}er brennt.', 'eu', 2],
    ['freund', 'Mein Fr{eu}nd kommt heute.', 'eu', 2],
    ['neu', 'Das ist ein n{eu}es Buch.', 'eu', 2],
    ['eltern', 'Meine {E}ltern kommen heute.', 'e-merk', 3],
    ['baer', 'Der B{ä}r lebt im Wald.', 'ae-merk', 3],
    ['kaese', 'Ich esse K{ä}se mit Brot.', 'ae-merk', 3]
  ];
  const WEG = { ae: 'ableiten', aeu: 'ableiten', e: 'ableiten', eu: 'ableiten', 'e-merk': 'merken', 'ae-merk': 'merken' };
  const ABLENKER = { 'ä': ['e', 'a'], 'Ä': ['E', 'A'], 'äu': ['eu', 'au'], e: ['ä'], E: ['Ä'], eu: ['äu'] };      // e/a: nach Gehör, ohne Umlaut
  const SCHRITTE = {
    ae: (w, s) => [`Suche ein verwandtes Wort mit a: «${s}».`, 'Gibt es ein verwandtes Wort mit a, schreibt man ä.', `Also: ${w}.`],
    aeu: (w, s) => [`Suche ein verwandtes Wort mit au: «${s}».`, 'Gibt es ein verwandtes Wort mit au, schreibt man äu.', `Also: ${w}.`],
    e: w => ['Suche ein verwandtes Wort mit a: Es gibt keines.', 'Gibt es kein verwandtes Wort mit a, schreibt man e.', `Also: ${w}.`],
    eu: w => ['Suche ein verwandtes Wort mit au: Es gibt keines.', 'Gibt es kein verwandtes Wort mit au, schreibt man eu.', `Also: ${w}.`],
    'e-merk': w => [`«${w}» gehört zu «alt». Man würde «Ä» erwarten. Trotzdem schreibt man «E».`, 'Das ist eine Ausnahme. Das Wort muss man sich merken.', `Also: ${w}.`],
    'ae-merk': w => [`Zu «${w}» gibt es kein verwandtes Wort mit a.`, 'Trotzdem schreibt man «ä». Das ist eine Ausnahme.', `Das Wort muss man sich merken: ${w}.`]
  };
  const REGEL = new Map(ZEILEN.map(z => [`um-${z[0]}`, z[2]]));

  function aufgabe([id, satz, regel, stufe, stamm]) {
    const stelle = R.woerter(satz).find(w => w.luecke);
    return {
      id: `um-${id}`, form: 'satz', schwierigkeit: stufe,
      inhalt: { text: satz, luecken: [{ ablenker: ABLENKER[stelle.soll] }] },
      hilfe: { weg: WEG[regel], schritte: SCHRITTE[regel](stelle.wort, stamm) }
    };
  }

  /** Fehlerart einer Stelle nach der Regel der Aufgabe. */
  function klassiere(p, regel) {
    const ist = p.ist.toLowerCase();
    if (regel === 'ae' || regel === 'aeu') return ist === 'e' || ist === 'eu' ? 'e-statt-ae' : ist === 'a' || ist === 'au' ? 'umlaut-vergessen' : null;
    if (regel === 'ae-merk') return ist === 'e' ? 'ae-merkwort' : ist === 'a' ? 'umlaut-vergessen' : null;
    return ist === 'ä' || ist === 'äu' ? 'ae-ohne-ableitung' : null;
  }

  L.generator('deutsch-rechtschreibung/umlaut', {
    pool: () => ZEILEN.map(aufgabe),
    diagnose: (auf, antwort) => R.kodiere(auf.inhalt.text, antwort, p => klassiere(p, REGEL.get(auf.id)))       // → Fehlercode oder null
  });
})(globalThis);
