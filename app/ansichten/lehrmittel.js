/* app/ansichten/lehrmittel.js: das Lehrmittel der Klasse und was daraus für die Themen folgt (AP-13b, R44). Reine Daten und Rechnung, kein DOM.
   Das Lehrmittel der Klasse ist nicht bekannt. Themen, die nur in einem Lehrmittelprofil Kern sind, stehen im Modul auf aktiv: false. Die Eltern nennen das
   Lehrmittel je Fach (einstellungen.lehrmittel = { mathe, deutsch, englisch }, Standard «unbekannt»), und die App schlägt vor, welche ausgeschalteten Themen dazu passen.
   Vorschläge schaltet nie die App selbst ein: Der Elternbereich zeigt sie, die Eltern bestätigen.
   Die Tabelle fasst zusammen, was die Recherche (docs/recherche/curriculum-map.json) für das Profil belegt. `ab` ist die Schulwoche aus dem Jahresplan, ohne Angabe
   gibt es keinen Termin. Alle Texte sind eigene Worte. Die Zuordnung ist nicht mit der Lehrperson abgeglichen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const FAECHER = { mathe: 'Mathematik', deutsch: 'Deutsch', englisch: 'Englisch' };
  const PROFILE = {
    'zahlenbuch-3': { fach: 'mathe', titel: 'Zahlenbuch 3' }, 'mathwelt-2': { fach: 'mathe', titel: 'Mathwelt 2' },
    'sprachstarken-3': { fach: 'deutsch', titel: 'Sprachstarken 3' }, 'deutsch-drei': { fach: 'deutsch', titel: 'Deutsch Drei' }, sprachwelt: { fach: 'deutsch', titel: 'Sprachwelt' },
    'young-world-1': { fach: 'englisch', titel: 'Young World 1' }
  };
  const UNBEKANNT = 'unbekannt';

  const R = (modul, thema, profil, ab, grund) => ({ modul, thema, profil, ab, grund });
  const WOCHE = 'Der Jahresplan setzt das Thema ab dieser Schulwoche an.';
  const TABELLE = [
    R('mathe-einmaleins', 'zehner', 'zahlenbuch-3', 24, 'Das Zehner-Einmaleins folgt im Jahresplan nach dem kleinen Einmaleins, im Block zu Multiplikation und Division.'),
    R('mathe-plus-minus-1000', 'schriftlich-add', 'mathwelt-2', null, 'Dieses Lehrmittel führt das schriftliche Addieren in der 3. und 4. Klasse ein. Der Zeitpunkt in der 3. Klasse ist nicht belegt.'),
    R('mathe-groessen', 'zeit-einheiten', 'zahlenbuch-3', 37, `Zeiteinheiten stehen im Jahresplan spät im Schuljahr. ${WOCHE}`),
    R('mathe-groessen', 'zeitdauer', 'zahlenbuch-3', 37, `Zeitspannen stehen im Jahresplan spät im Schuljahr. ${WOCHE}`),
    R('mathe-groessen', 'hohlmass-l-dl', 'zahlenbuch-3', 37, `Hohlmasse stehen im Jahresplan spät im Schuljahr. ${WOCHE}`),
    R('mathe-groessen', 'hohlmass-einheit', 'zahlenbuch-3', 37, `Hohlmasse stehen im Jahresplan spät im Schuljahr. ${WOCHE}`),
    R('mathe-groessen', 'zeit-einheiten', 'mathwelt-2', null, 'Die Zeit gehört in diesem Lehrmittel zum ersten Semester. Eine genaue Woche ist nicht belegt.'),
    R('mathe-groessen', 'zeitdauer', 'mathwelt-2', null, 'Die Zeit gehört in diesem Lehrmittel zum ersten Semester. Eine genaue Woche ist nicht belegt.'),
    R('mathe-groessen', 'hohlmass-l-dl', 'mathwelt-2', 21, 'Hohlmasse gehören in diesem Lehrmittel zum zweiten Semester.'),
    R('mathe-groessen', 'hohlmass-einheit', 'mathwelt-2', 21, 'Hohlmasse gehören in diesem Lehrmittel zum zweiten Semester.'),
    R('deutsch-wortarten', 'satzarten', 'sprachstarken-3', null, 'Satzarten kommen in diesem Lehrmittel in der 3. Klasse vor. Der Zeitpunkt ist nicht belegt.'),
    R('deutsch-wortarten', 'nachschlagen', 'sprachstarken-3', null, 'Das Nachschlagen im Wörterbuch kommt in diesem Lehrmittel in der 3. Klasse vor. Der Zeitpunkt ist nicht belegt.'),
    R('deutsch-wortarten', 'nachschlagen', 'sprachwelt', null, 'Das Nachschlagen im Wörterbuch kommt in diesem Lehrmittel in der 3. Klasse vor. Der Zeitpunkt ist nicht belegt.'),
    R('deutsch-rechtschreibung', 'doppelkonsonant-ck-tz', 'sprachwelt', null, 'Wahrscheinlich im ersten Quartal. Die Zuordnung ist nicht sicher belegt.'),
    ...[['koerper', 7], ['essen-trinken', 12], ['wetter-kleidung', 18], ['tageszeit-uhr', 24], ['haus-moebel', 28]].map(([t, w]) => R('englisch-themen', t, 'young-world-1', w, `Im Jahresplan von Young World 1 gehört dieses Thema zu einer Unit ab Schulwoche ${w}.`)),
    ...[['zahlen-21-100', 7], ['zahlen-teen-ty', 7], ['monate', 18], ['monate-reihenfolge', 18], ['datum', 23], ['wochentage', 24], ['wochentage-reihenfolge', 24]]
      .map(([t, w]) => R('englisch-grundlagen', t, 'young-world-1', w, `Im Jahresplan von Young World 1 kommt dieses Wortfeld ab Schulwoche ${w} vor.`))
  ];

  /** Die Wahl je Fach aus dem Lernstand: { mathe, deutsch, englisch }, jeder Wert eine Profil-ID oder «unbekannt». */
  function stand(doc) {
    const e = (doc && doc.einstellungen && doc.einstellungen.lehrmittel) || {};
    return Object.fromEntries(Object.keys(FAECHER).map(f => [f, PROFILE[e[f]] && PROFILE[e[f]].fach === f ? e[f] : UNBEKANNT]));
  }

  /** Die Profile eines Fachs als [{ id, titel }], «unbekannt» zuerst. */
  const waehlbar = fach => [{ id: UNBEKANNT, titel: 'Noch nicht bekannt' }, ...Object.entries(PROFILE).filter(([, p]) => p.fach === fach).map(([id, p]) => ({ id, titel: p.titel }))];

  /**
   * Die Vorschläge für die gewählten Lehrmittel: [{ modul, modulTitel, thema, titel, profil, profilTitel, ab, abDatum, grund, bereitsAn, vorgewaehlt }].
   * Nur Themen, die es im geladenen Modul gibt. vorgewaehlt gilt, wenn die Schulwoche heute `ab` erreicht hat oder kein Termin bekannt ist. Bereits eingeschaltete Themen
   * stehen mit bereitsAn und sind nie vorgewählt. opt: { lehrmittel, heute, modulVon(id) → Modul | null, themaAn(modulId, themaId) → wahr/falsch }.
   */
  function vorschlaege({ lehrmittel, heute, modulVon, themaAn }) {
    const woche = L.Ferien.wocheVon(heute);
    return TABELLE.filter(v => lehrmittel && lehrmittel[PROFILE[v.profil].fach] === v.profil).map(v => {
      const m = modulVon(v.modul), t = m && (m.themen || []).find(x => x.id === v.thema);
      if (!t) return null;
      const an = !!themaAn(v.modul, v.thema);
      return { modul: v.modul, modulTitel: m.titel, thema: v.thema, titel: t.titel, profil: v.profil, profilTitel: PROFILE[v.profil].titel, ab: v.ab, abDatum: v.ab ? L.Ferien.montagDer(v.ab) : null,
        grund: v.grund, bereitsAn: an, vorgewaehlt: !an && (v.ab === null || (woche !== null && woche >= v.ab)) };
    }).filter(Boolean).sort((a, b) => a.modul.localeCompare(b.modul) || a.thema.localeCompare(b.thema));
  }

  L.Lehrmittel = { FAECHER, PROFILE, TABELLE, UNBEKANNT, stand, waehlbar, vorschlaege };
})(globalThis);
