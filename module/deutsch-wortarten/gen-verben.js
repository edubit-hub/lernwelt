/* module/deutsch-wortarten/gen-verben.js: Verb mit Grundform und Personalform im Präsens, Adjektive steigern (beides Form satz, getippt).
   Jedes Verb ist mit allen sechs Personalformen eingetragen, damit der Lösungsweg die Reihe zeigt und die Diagnose eine verwechselte Person erkennt.
   Der Modultest rechnet die regelmässigen Formen aus Wortstamm und Endung unabhängig nach. Alle Sätze sind eigene Beispiele.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const S = L.registry.bausteine.get('_gemeinsam/schreibantwort');
  if (!S) throw new Error('deutsch-wortarten: Baustein «_gemeinsam/schreibantwort» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');
  const UMLAUT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };
  const idVon = w => w.toLowerCase().replace(/[äöü]/g, c => UMLAUT[c]);
  const luecken = auf => [...auf.inhalt.text.matchAll(/\{([^{}]*)\}/g)].map(m => m[1]);
  const PERSONEN = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];
  const PRONOMEN = { ich: 'ich', du: 'du', er: 'er, sie, es', wir: 'wir', ihr: 'ihr', sie: 'sie (mehrere)' };

  // Grundform, dann ich, du, er (sie, es), wir, ihr, sie (mehrere)
  const VERBEN = {
    lachen: ['lache', 'lachst', 'lacht', 'lachen', 'lacht', 'lachen'], spielen: ['spiele', 'spielst', 'spielt', 'spielen', 'spielt', 'spielen'],
    malen: ['male', 'malst', 'malt', 'malen', 'malt', 'malen'], singen: ['singe', 'singst', 'singt', 'singen', 'singt', 'singen'],
    kochen: ['koche', 'kochst', 'kocht', 'kochen', 'kocht', 'kochen'], bauen: ['baue', 'baust', 'baut', 'bauen', 'baut', 'bauen'],
    lernen: ['lerne', 'lernst', 'lernt', 'lernen', 'lernt', 'lernen'], hören: ['höre', 'hörst', 'hört', 'hören', 'hört', 'hören'],
    warten: ['warte', 'wartest', 'wartet', 'warten', 'wartet', 'warten'], lesen: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
    fahren: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'], laufen: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen'],
    fragen: ['frage', 'fragst', 'fragt', 'fragen', 'fragt', 'fragen']
  };
  // Verb, Person, Satz mit der Lücke, Schwierigkeit
  const FORMEN = [
    ['lachen', 'ich', 'Ich {lache} gern.', 1], ['spielen', 'du', 'Du {spielst} im Garten.', 1], ['malen', 'er', 'Er {malt} ein Bild.', 1],
    ['singen', 'wir', 'Wir {singen} ein Lied.', 1], ['kochen', 'ihr', 'Ihr {kocht} eine Suppe.', 1], ['bauen', 'sie', 'Die Kinder {bauen} einen Turm.', 1],
    ['lernen', 'du', 'Du {lernst} neue Wörter.', 1], ['hören', 'ich', 'Ich {höre} gern Musik.', 1], ['warten', 'du', 'Du {wartest} auf den Bus.', 2],
    ['lesen', 'er', 'Er {liest} ein Buch.', 3], ['fahren', 'du', 'Du {fährst} mit dem Velo.', 3], ['laufen', 'er', 'Mia {läuft} schnell.', 3]
  ];
  // Verb, Satz in der Personalform
  const GRUNDFORMEN = [
    ['lachen', 'Mia lacht laut.'], ['malen', 'Du malst ein Haus.'], ['singen', 'Wir singen laut.'], ['kochen', 'Er kocht Tee.'],
    ['spielen', 'Ich spiele Fussball.'], ['warten', 'Du wartest auf den Zug.'], ['hören', 'Sie hört Musik.'], ['fragen', 'Tom fragt die Lehrerin.']
  ];
  const stammVon = inf => inf.slice(0, -2);

  const formAufgabe = ([inf, person, satz, s]) => {
    const f = VERBEN[inf], stamm = stammVon(inf), wechselt = !f[1].startsWith(stamm);
    return {
      id: `pf-${idVon(inf)}-${person}`, form: 'satz', schwierigkeit: s, braucht: [],
      inhalt: { text: `Grundform «${inf}»: ${satz}` },
      hilfe: { weg: 'personalformprobe', schritte: [
        `Grundform: ${inf}. Der Wortstamm ist «${stamm}».${wechselt ? ' Bei diesem Verb ändert sich ein Buchstabe im Wortstamm.' : ''}`,
        `Die Formen: ${PERSONEN.map((p, i) => `${p} ${f[i]}`).join(', ')}.`, `Zu «${PRONOMEN[person]}» passt: ${f[PERSONEN.indexOf(person)]}.`] }
    };
  };
  const grundAufgabe = ([inf, satz]) => ({
    id: `pf-${idVon(inf)}-grundform`, form: 'satz', schwierigkeit: 1, braucht: [],
    inhalt: { text: `${satz} Die Grundform heisst {${inf}}.` },
    hilfe: { weg: 'personalformprobe', schritte: [`Die Grundform hat keine Person und endet auf -en: ${inf}.`, `Probe: ${PERSONEN.slice(0, 3).map((p, i) => `${p} ${VERBEN[inf][i]}`).join(', ')}. Der Wortstamm «${stammVon(inf)}» bleibt gleich.`] }
  });

  L.generator('deutsch-wortarten/personalform', {
    pool: () => [...FORMEN.map(formAufgabe), ...GRUNDFORMEN.map(grundAufgabe)],
    diagnose(auf, antwort) {                                              // antwort: { luecken, arten } des Lückentexts
      const art = S.art(antwort, 0), e = S.eingabe(antwort, 0), soll = luecken(auf)[0], inf = Object.keys(VERBEN).find(v => idVon(v) === auf.id.split('-')[1]);
      if (art === null || art === 'richtig') return null;
      if (art === 'gross-klein') return 'gross-klein';
      if (!inf || e === '') return 'sonstige';
      if (auf.id.endsWith('-grundform')) return VERBEN[inf].includes(e) ? 'personalform-getippt' : 'sonstige';
      if (e === inf) return 'grundform-getippt';
      if (VERBEN[inf].includes(e)) return 'person-verwechselt';
      return S.umlautFehlt(e, soll) ? 'umlaut-fehlt' : 'sonstige';
    }
  });

  // Grundstufe, Mehrstufe, Höchststufe, Satz, welche Stufen gefragt sind, Schwierigkeit, unregelmässig
  const STUFEN = [
    ['klein', 'kleiner', 'kleinsten', 'Die Maus ist klein, die Ameise ist noch {kleiner}.', 'komp', 1], ['schnell', 'schneller', 'schnellsten', 'Der Hund ist schnell, das Pferd ist noch {schneller}.', 'komp', 1],
    ['gross', 'grösser', 'grössten', 'Der Hund ist gross, der Elefant ist noch {grösser}.', 'komp', 2], ['stark', 'stärker', 'stärksten', 'Tom ist stark, sein Vater ist noch {stärker}.', 'komp', 2],
    ['alt', 'älter', 'ältesten', 'Opa ist alt, der Baum ist noch {älter}.', 'komp', 2], ['hoch', 'höher', 'höchsten', 'Der Hügel ist hoch, der Berg ist noch {höher}.', 'komp', 2],
    ['warm', 'wärmer', 'wärmsten', 'Im Frühling ist es warm, im Sommer ist es noch {wärmer}.', 'komp', 2], ['lang', 'länger', 'längsten', 'Der Bleistift ist lang, das Lineal ist noch {länger}.', 'komp', 2],
    ['schön', 'schöner', 'schönsten', 'Die Blume ist schön, der Garten ist noch {schöner}.', 'komp', 2], ['leicht', 'leichter', 'leichtesten', 'Die Feder ist leicht, die Flocke ist noch {leichter}.', 'komp', 1],
    ['klein', 'kleiner', 'kleinsten', 'Die Maus ist klein, die Ameise ist kleiner, der Floh ist am {kleinsten}.', 'sup', 2],
    ['schnell', 'schneller', 'schnellsten', 'Der Hund ist schnell, das Pferd ist schneller, der Gepard ist am {schnellsten}.', 'sup', 2],
    ['gross', 'grösser', 'grössten', 'Das Haus ist gross, der Turm ist grösser, der Berg ist am {grössten}.', 'sup', 3],
    ['jung', 'jünger', 'jüngsten', 'Anna ist jung, Ben ist jünger, das Baby ist am {jüngsten}.', 'sup', 3],
    ['kalt', 'kälter', 'kältesten', 'Im Oktober ist es kalt, im Dezember ist es kälter, im Januar ist es am {kältesten}.', 'sup', 3],
    ['gut', 'besser', 'besten', 'Mia singt gut, Lena singt besser, Noah singt am {besten}.', 'sup', 3],
    ['warm', 'wärmer', 'wärmsten', 'Die Suppe ist warm, der Tee ist {wärmer}, das Bad ist am {wärmsten}.', 'beide', 3]
  ];
  const STUFE_ID = { komp: 'komp', sup: 'sup', beide: 'beide' };
  const stufeId = ([g_, , , , wo]) => `st-${idVon(g_)}-${STUFE_ID[wo]}`;

  /** Der Satz mit dem Buchstaben, der sich beim Steigern ändert (a wird ä), sonst null. Für «gut» gilt: unregelmässig. */
  function aenderung(grund, komp) {
    if (grund === 'gut') return 'Dieses Wort wird unregelmässig gesteigert: gut, besser, am besten.';
    const i = [...grund].findIndex((z, k) => z !== komp[k]);
    return i >= 0 && i < grund.length ? `Beim Steigern wird aus «${grund[i]}» ein «${komp[i]}».` : null;
  }
  const stufenAufgabe = e => {
    const [grund, komp, sup, satz, wo, s] = e;
    const gesucht = { komp: [`Gesucht ist die zweite Stufe: ${komp}.`], sup: [`Gesucht ist die dritte Stufe: am ${sup}.`], beide: [`Gesucht sind die zweite Stufe ${komp} und die dritte Stufe am ${sup}.`] }[wo];
    return {
      id: stufeId(e), form: 'satz', schwierigkeit: s, braucht: [], inhalt: { text: satz },
      hilfe: { weg: 'steigerungsprobe', schritte: [`Die drei Stufen: ${grund}, ${komp}, am ${sup}.`, ...gesucht, ...(aenderung(grund, komp) ? [aenderung(grund, komp)] : [])] }
    };
  };

  L.generator('deutsch-wortarten/steigerung', {
    pool: () => STUFEN.map(stufenAufgabe),
    diagnose(auf, antwort) {                                              // antwort: { luecken, arten } des Lückentexts
      const arten = antwort && Array.isArray(antwort.arten) ? antwort.arten : [], i = arten.findIndex(a => a !== 'richtig');
      if (!arten.length || i < 0) return null;
      const e = S.eingabe(antwort, i), soll = luecken(auf)[i], t = STUFEN.find(x => stufeId(x) === auf.id);
      if (arten[i] === 'gross-klein') return 'gross-klein';
      if (!t || e === '') return 'sonstige';
      if (e === t[0]) return 'nicht-gesteigert';
      if ((e === t[1] || e === t[2]) && e !== soll) return 'stufe-verwechselt';
      return S.umlautFehlt(e, soll) ? 'umlaut-fehlt' : 'sonstige';
    }
  });
})(globalThis);
