/* module/deutsch-rechtschreibung/ie-regel.js: Aufgabenbestand und Fehlerdiagnose für «ie-Regel und sp-/st-Schreibung» (AP-18c).
   Die Lücke steht mitten im Wort (Sp{ie}l). Regeln: «ie» (langer i-Laut), «i» (kurzer i-Laut), «i-merk» (langer i-Laut, trotzdem «i»: Tiger),
   «ih» (ihm, ihn, ihr) und «st» (am Wortanfang «sp» und «st», gesprochen «schp» und «scht»). Die Ausnahmen gehören zum Grundanspruch Stufe d und
   haben darum Schwierigkeit 3. Das Kind wählt aus Kacheln, später schreibt es den Satz im Diktat.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, R = L.registry.bausteine.get('_gemeinsam/rechtschreibung');
  if (!R) throw new Error('ie-Regel: Baustein «_gemeinsam/rechtschreibung» fehlt. Er steht in modul.js unter braucht und wird vor den Dateien des Moduls geladen.');

  const ZEILEN = [                                       // [id, Satz mit Lücke, Regel, Schwierigkeit]
    ['spiel', 'Das Sp{ie}l macht Spass.', 'ie', 1],
    ['wiese', 'Die Kuh steht auf der W{ie}se.', 'ie', 1],
    ['brief', 'Ich schreibe einen Br{ie}f.', 'ie', 1],
    ['ziege', 'Die Z{ie}ge frisst Gras.', 'ie', 1],
    ['fliege', 'Eine Fl{ie}ge sitzt am Fenster.', 'ie', 1],
    ['tier', 'Das T{ie}r hat vier Beine.', 'ie', 1],
    ['lied', 'Wir singen ein L{ie}d.', 'ie', 2],
    ['ziel', 'Er z{ie}lt auf die Scheibe.', 'ie-ab', 2],
    ['wind', 'Der W{i}nd weht stark.', 'i-kurz', 2],
    ['fisch', 'Der F{i}sch schwimmt im See.', 'i-kurz', 2],
    ['milch', 'Ich trinke M{i}lch.', 'i-kurz', 2],
    ['kind', 'Das K{i}nd spielt im Garten.', 'i-kurz', 2],
    ['stern', 'Am Himmel leuchtet ein {St}ern.', 'st', 2],
    ['spinne', 'Die {Sp}inne sitzt im Netz.', 'st', 2],
    ['steigen', 'Ich {st}eige auf den Baum.', 'st', 2],
    ['stuhl', 'Der {St}uhl steht am Tisch.', 'st', 2],
    ['tiger', 'Im Zoo sehen wir einen T{i}ger.', 'i-merk', 3],
    ['biber', 'Der B{i}ber baut einen Damm.', 'i-merk', 3],
    ['kino', 'Wir gehen ins K{i}no.', 'i-merk', 3],
    ['ihm', 'Ich gebe {ih}m das Buch.', 'ih', 3],
    ['ihr', 'Das ist {ih}r Heft.', 'ih', 3],
    ['ihn', 'Ich sehe {ih}n im Garten.', 'ih', 3]
  ];
  const WEG = { ie: 'mitsprechen', 'ie-ab': 'ableiten', 'i-kurz': 'mitsprechen', 'i-merk': 'merken', ih: 'merken', st: 'merken' };
  const FAMILIE = { ziel: 'Ziel' };                       // Regel «ie-ab»: das verwandte Wort, das den Stamm zeigt
  const ABLENKER = {                                     // die anderen Kacheln neben der Lösung
    ie: () => ['i', 'ih'], 'ie-ab': () => ['i', 'ih'], 'i-kurz': () => ['ie', 'ih'], 'i-merk': () => ['ie', 'ih'], ih: () => ['ie', 'i'],
    st: soll => [`${soll[0]}ch${soll.slice(1)}`]         // St → Scht, sp → schp
  };
  const SCHRITTE = {
    ie: w => [`Sprich das Wort langsam: «${w}». Der i-Laut ist lang.`, 'Einen langen i-Laut schreibt man meist «ie».', `Also: ${w}.`],
    'ie-ab': (w, id) => [`Zu «${w}» gehört das Wort «${FAMILIE[id]}».`, 'Wörter derselben Familie schreibt man gleich: «ie».', `Also: ${w}.`],
    'i-kurz': w => [`Sprich das Wort langsam: «${w}». Der i-Laut ist kurz.`, 'Einen kurzen i-Laut schreibt man «i».', `Also: ${w}.`],
    'i-merk': w => [`Der i-Laut in «${w}» ist lang. Trotzdem schreibt man «i».`, 'Das ist eine Ausnahme. Das Wort muss man sich merken.', `Also: ${w}.`],
    ih: w => [`«${w}» gehört zu den Wörtern «ihm», «ihn», «ihr» und «ihnen».`, 'Diese Wörter schreibt man mit «ih». Das muss man sich merken.', `Also: ${w}.`],
    st: w => ['Am Anfang des Wortes oder der Silbe schreibt man «sp» und «st».', 'Man spricht «schp» und «scht», aber man schreibt «sp» und «st».', `Also: ${w}.`]
  };
  const REGEL = new Map(ZEILEN.map(z => [`ie-${z[0]}`, z[2]]));

  function aufgabe([id, satz, regel, stufe]) {
    const stelle = R.woerter(satz).find(w => w.luecke);
    return {
      id: `ie-${id}`, form: 'satz', schwierigkeit: stufe,
      inhalt: { text: satz, luecken: [{ ablenker: ABLENKER[regel](stelle.soll) }] },
      hilfe: { weg: WEG[regel], schritte: SCHRITTE[regel](stelle.wort, id) }
    };
  }

  /** Fehlerart einer Stelle nach der Regel der Aufgabe. */
  function klassiere(p, regel) {
    const ist = p.ist.toLowerCase();
    if (regel === 'ie' || regel === 'ie-ab') return ist === 'i' ? 'ie-nur-i' : ist === 'ih' ? 'ih-zuviel' : null;
    if (regel === 'i-kurz' || regel === 'i-merk') return ist === 'ie' ? 'ie-zuviel' : ist === 'ih' ? 'ih-zuviel' : null;
    if (regel === 'ih') return ist === 'i' || ist === 'ie' ? 'ih-vergessen' : null;
    return /^sch/.test(ist) ? 'schp-scht-geschrieben' : null;
  }

  L.generator('deutsch-rechtschreibung/ie-regel', {
    pool: () => ZEILEN.map(aufgabe),
    diagnose: (auf, antwort) => R.kodiere(auf.inhalt.text, antwort, p => klassiere(p, REGEL.get(auf.id)))       // → Fehlercode oder null
  });
})(globalThis);
