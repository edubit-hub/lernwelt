/* app/lauf/rueckmeldung.js: zeigt die Rückmeldung nach einem Paket (Architektur 5.2 Schritt 4) und hält ALLE Texte des Laufs an einer einzigen
   Stelle: Rueckmeldung.texte (die Rückmeldungen aus 6.9 und die kleinen Beschriftungen der Runde). Der Ton ist sachlich und genau, ohne
   Ausrufezeichen und ohne Lob. Das Prüfskript und die Tests lesen die Texte über beispieltexte(). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
  const und = liste => liste.length > 1 ? `${liste.slice(0, -1).join(', ')} und ${liste[liste.length - 1]}` : String(liste[0] ?? '');
  const zahl = x => String(Math.round(x * 10) / 10);
  const punkt = s => (/[.!?:]$/.test(s) ? s : `${s}.`);
  const SCHWACH = 0.7;                                   // Themen unter diesem Anteil der Punkte nennt das Ergebnis der Probeprüfung

  // ---- Lösung und Frage als kurzer Text, je Aufgabenform ----------------------------------------------------
  const KURZ = {
    rechnung: i => `${i.text} = ${i.ergebnis}`,
    wortkarte: i => `${i.fremd} = ${i.mutter}`,
    paar: i => `${i.links}: ${i.rechts}`,
    satz: i => String(i.text).replace(/[{}]/g, '').replace(/\s*\|\s*/g, ' '),
    auswahl: i => `Antwort: ${i.richtig}`,
    abfolge: i => `Reihenfolge: ${i.schritte.join(', ')}`,
    beschriftung: i => i.punkte.map((p, n) => `${n + 1} ${p.text}`).join(', '),
    position: i => String(i.zahl),
    uhrzeit: i => `${i.h}.${String(i.min).padStart(2, '0')} Uhr`,          // Schreibweise wie die Typen uhr und geld (V-AP17c-02)
    betrag: i => [i.rappen >= 100 || !i.rappen ? `${Math.floor(i.rappen / 100)} Fr.` : '', i.rappen % 100 ? `${i.rappen % 100} Rp.` : ''].filter(Boolean).join(' '),
    frei: i => `Musterantwort: ${i.muster}`
  };
  const FRAGE = { rechnung: i => i.text, wortkarte: i => i.fremd, paar: i => i.links, satz: i => KURZ.satz(i), auswahl: i => i.frage, abfolge: i => i.frage || 'Reihenfolge' };
  const von = (tabelle, a) => { try { return a && a.inhalt && tabelle[a.form] ? tabelle[a.form](a.inhalt) : ''; } catch (fehler) { return ''; } };
  /** Die Lösung einer Aufgabe als kurzer Text («8 · 7 = 56»), leer bei unbekannter Form. */
  const loesungText = a => von(KURZ, a);
  /** Kurzer Text der Frage, damit die Rückmeldung zu einer Gruppe jede Aufgabe benennt. */
  const aufgabenText = a => von(FRAGE, a);

  // ---- Texte ------------------------------------------------------------------------------------------------
  const satz = (kopf, a) => { const k = loesungText(a); return k ? `${kopf}. ${punkt(k)}` : `${kopf}.`; };
  /** « Ertrag: Stein +6, Holz +2.» aus einer Liste { name, menge }, einer Tabelle { Name: Menge } oder einem fertigen Text. Ohne Angabe nichts. */
  const ertragSatz = ertrag => {
    if (ertrag === undefined || ertrag === null) return '';
    const eintraege = Array.isArray(ertrag) ? ertrag : typeof ertrag === 'object' ? Object.entries(ertrag).map(([name, menge]) => ({ name, menge })) : null;
    const text = eintraege ? eintraege.filter(x => x.menge).map(x => `${x.name} +${x.menge}`).join(', ') : String(ertrag);
    return text ? ` Ertrag: ${punkt(text)}` : ' Ertrag: keiner.';
  };

  /** Am ersten Tag: wann Ertrag entsteht. Der Ertrag kommt, wenn eine Aufgabe an einem späteren Tag sitzt (Welt: Box 2 und höher). */
  const ertragErklaerung = b => `Ertrag gibt es, wenn eine Aufgabe an einem späteren Tag sitzt. ${b.morgen > 0 ? 'Morgen' : 'Übermorgen'} ist es so weit.`;
  const ohneErtrag = e => !(Array.isArray(e) ? e.some(x => x.menge) : e && typeof e === 'object' ? Object.values(e).some(Boolean) : e);

  /** Text zum Ende einer Runde. b: Bericht des Laufs, ertrag: Liste { name, menge } oder Text, nur wenn die Ansicht ihn kennt.
      Am ersten Tag (b.ersterTag, Bericht.ausTageslog) und ohne Ertrag erklärt der Text, wann Ertrag entsteht. */
  function abschluss(b, ertrag) {
    const n = b.aufgaben || 0, ers = b.ersterVersuch || 0;
    const gewinn = ertragSatz(ertrag) + (b.ersterTag && ertrag !== undefined && ertrag !== null && ohneErtrag(ertrag) ? ` ${ertragErklaerung(b)}` : '');
    const zahlen = `${mz(n, 'Aufgabe', 'Aufgaben')}, ${ers} beim ersten Versuch.`;
    const morgen = b.morgen > 0 ? ` ${b.morgen === 1 ? '1 Aufgabe kommt' : `${b.morgen} Aufgaben kommen`} morgen wieder.` : '';
    if (b.abgebrochen) return n ? `Pause. ${mz(n, 'Aufgabe ist', 'Aufgaben sind')} gespeichert. Der Rest bleibt fällig.` : 'Pause. Es ist noch nichts gespeichert, alles bleibt fällig.';
    if (b.zeitdeckel) return `Die Zeit für heute ist um: ${zahlen} Der Rest bleibt fällig.${gewinn}`;
    switch (b.art) {
      case 'zusatz': return `Zusatzrunde erledigt: ${zahlen}${morgen}${gewinn}`;
      case 'expedition': {
        const ziel = b.ziel ? ` Ziel: ${Math.round(b.ziel * 100)} %, ${b.zielErreicht ? 'erreicht' : 'noch nicht erreicht'}.` : '';
        return `Expedition beendet: ${ers} von ${n} Aufgaben beim ersten Versuch richtig.${ziel}${gewinn}`;
      }
      case 'simulation': return `${b.pruefung && b.pruefung.art === 'diagnose' ? 'Probelauf' : 'Probeprüfung'} beendet: ${b.pruefung ? b.pruefung.text : zahlen}`;
      case 'herausforderung': return `Runde beendet: ${ers} von ${n} richtig.`;
      case 'vorschau': return 'Vorschau beendet.';
      default: return `Tagesauftrag erledigt: ${zahlen}${morgen}${gewinn}`;
    }
  }

  /** Meldung, wenn ein Thema eine Stufe erreicht. { titel, nach: 'basis'|'sicher'|'gefestigt', anzahl, gesamt, forschung?: [Namen] } */
  function themaStufe({ titel, nach, anzahl, gesamt, forschung = [] }) {
    const f = forschung.length ? ` ${forschung.length === 1 ? 'Forschung' : 'Forschungen'} ${und(forschung.map(x => `«${x}»`))} ${forschung.length === 1 ? 'ist' : 'sind'} jetzt möglich.` : '';
    if (nach === 'sicher') return `Thema ${titel} ist sicher: ${anzahl} von ${gesamt} Aufgaben an drei verschiedenen Tagen richtig.${f}`;
    if (nach === 'gefestigt') return `Thema ${titel} ist gefestigt: ${anzahl} von ${gesamt} Aufgaben waren nach einer längeren Pause noch richtig.${f}`;
    return `Bei Thema ${titel} steht die Grundlage: ${anzahl} von ${gesamt} Aufgaben sitzen schon.${f}`;
  }

  /** Ergebnis einer Probeprüfung: Punkte und die Themen, bei denen noch Luft ist. themen: [{ titel, punkte, max }] */
  function pruefung({ punkte, max, themen = [] }) {
    const schwach = themen.filter(t => t.max > 0 && t.punkte / t.max < SCHWACH).sort((a, b) => a.punkte / a.max - b.punkte / b.max).slice(0, 2);
    return `${zahl(punkte)} von ${zahl(max)} ${max === 1 ? 'Punkt' : 'Punkten'}.${schwach.length ? ` Bei ${und(schwach.map(t => `«${t.titel}»`))} ist noch Luft.` : ''}`;
  }

  const STUFEN = { neu: 'Neu', ueben: 'In Arbeit', basis: 'Grundlage steht', sicher: 'Sicher', gefestigt: 'Gefestigt' };
  const texte = {
    richtig: a => satz('Richtig', a),
    richtigNachSchwaeche: () => 'Richtig. Die Aufgabe war zuletzt unsicher. Jetzt war sie an einem fälligen Tag richtig.',
    falsch: a => satz('Nicht ganz', a),
    mitHilfe: () => 'Richtig, mit Hilfe. Morgen kommt sie noch einmal ohne.',
    gleichNochEinmal: () => 'Die Aufgabe kommt gleich noch einmal.',
    morgenWieder: () => 'Die Aufgabe kommt morgen wieder.',
    zeitNehmen: () => 'Lass dir Zeit. Schau dir den Lösungsweg an, dann versuchst du es noch einmal.',
    zusatzHinweis: () => 'Heute ist alles Fällige erledigt. Zusätzliches Üben bringt jetzt kaum etwas. Morgen kommt Neues.',
    stufeName: stand => STUFEN[stand] || '',
    loesungsweg: titel => `Lösungsweg: ${titel}`,
    // Beschriftungen der Runde (nicht aus 6.9, stehen aber ebenfalls nur hier)
    weiter: () => 'Weiter',
    beenden: () => 'Beenden',
    beendenBeschriftung: () => 'Runde beenden',
    fortschritt: (art, nr, gesamt) => (art === 'nachfassen' ? 'Noch einmal' : art === 'basis' ? 'Zur Sicherheit' : `Aufgabe ${nr} von ${gesamt}`),
    abschluss, themaStufe, pruefung
  };

  /** Ein Satz aus jeder Vorlage mit Beispieldaten, für Textprüfung und Tests. */
  function beispieltexte() {
    const a = { form: 'rechnung', inhalt: { text: '8 · 7', ergebnis: 56 } };
    const b = { art: 'tagesauftrag', aufgaben: 22, ersterVersuch: 19, morgen: 3 };
    const t = texte;
    return [t.richtig(a), t.richtigNachSchwaeche(), t.falsch(a), t.mitHilfe(), t.gleichNochEinmal(), t.morgenWieder(), t.zeitNehmen(), t.zusatzHinweis(),
      ...Object.values(STUFEN), t.loesungsweg('Mit Kernaufgaben rechnen'), t.weiter(), t.beenden(), t.beendenBeschriftung(),
      t.fortschritt('runde', 3, 12), t.fortschritt('nachfassen'), t.fortschritt('basis'),
      abschluss(b, [{ name: 'Stein', menge: 6 }, { name: 'Holz', menge: 2 }]), abschluss({ ...b, ersterTag: true }, []), abschluss({ ...b, ersterTag: true, morgen: 0 }, []),
      abschluss({ ...b, art: 'zusatz' }), abschluss({ ...b, abgebrochen: true }),
      abschluss({ ...b, aufgaben: 0, abgebrochen: true }), abschluss({ ...b, zeitdeckel: true }),
      abschluss({ ...b, art: 'expedition', ziel: 0.8, zielErreicht: true }), abschluss({ ...b, art: 'simulation' }), abschluss({ ...b, art: 'herausforderung' }),
      abschluss({ ...b, art: 'vorschau' }),
      ...['basis', 'sicher', 'gefestigt'].map(nach => themaStufe({ titel: '7er- und 8er-Reihe', nach, anzahl: 36, gesamt: 40, forschung: ['Zahlenkunde II'] })),
      pruefung({ punkte: 14, max: 20, themen: [{ titel: 'Wortarten', punkte: 2, max: 6 }] })];
  }

  // ---- Anzeige ----------------------------------------------------------------------------------------------
  const STIL = [
    '.rueckmeldung{display:grid;gap:var(--a3)}',
    '.rm-eintrag{display:grid;gap:var(--a2)}',
    '.rm-weg{margin-top:var(--a2)}',
    '.rm-weg-titel{font-weight:600}',
    '.rm-schritte{margin:var(--a1) 0 0;padding-left:22px}',
    '.rm-hilfsmittel{margin-top:var(--a2)}',
    '.rm-code,.rm-folge{margin-top:var(--a2)}',
    '.rm-weiter{justify-self:end}'
  ].join('');

  /** Kasten der Rückmeldung (Klassen aus basis.css): der erste Satz fett, danach der Rest des Textes und die weiteren Teile. art: ok, fehler, hilfe. */
  function kasten(H, art, text, ...innen) {
    const i = text.indexOf('. '), kopf = i < 0 ? text : text.slice(0, i + 1);
    return H(`div.kasten.${art}`, H('b', kopf), i < 0 ? '' : text.slice(i + 1), ...innen);
  }

  /** Das Bild zur Lösung zeigt, was die Aufgabe selbst verdeckte: das Ende des Rechenstrichs und die Zahl unter den Plättchen (V-AP18f-04). */
  function aufgedeckt(daten) {
    const d = { ...(daten || {}) };
    delete d.verdecke;
    if (d.zeige === 'plaettchen') delete d.zeige;
    return d;
  }

  function hilfsmittel(H, h) {
    const def = h && L.registry.hilfsmittel.get(h.name);
    if (!def) return '';
    const behaelter = H('div.rm-hilfsmittel');
    try { def.render(behaelter, aufgedeckt(h.daten)); } catch (fehler) { return ''; }
    return behaelter;
  }

  function weg(H, hilfe, info) {
    const schritte = hilfe.schritte || [];
    if (!info.wegTitel && !schritte.length && !hilfe.hilfsmittel) return '';
    return H('div.rm-weg',
      info.wegTitel ? H('p.rm-weg-titel', texte.loesungsweg(info.wegTitel)) : '',
      schritte.length ? H('ol.rm-schritte', schritte.map(s => H('li', s))) : '',
      hilfsmittel(H, hilfe.hilfsmittel));
  }

  function eintrag(H, a, e, info, mehrere) {
    const falsch = e.urteil === 'falsch', frage = mehrere ? aufgabenText(a) : '';
    const kopf = e.urteil === 'hilfe' ? texte.mitHilfe() : !falsch ? (info.korrigiert ? texte.richtigNachSchwaeche() : texte.richtig(a)) : texte.falsch(a);
    return H('div.rm-eintrag', { 'data-urteil': e.urteil },
      frage ? H('p.klein.rm-aufgabe', frage) : '',
      kasten(H, falsch ? 'fehler' : e.urteil === 'hilfe' ? 'hilfe' : 'ok', kopf,
        falsch && a && a.hilfe ? weg(H, a.hilfe, info) : '',
        falsch && info.kind ? H('p.rm-code', info.kind) : '',
        falsch && info.folge ? H('p.rm-folge', info.folge === 'gleich' ? texte.gleichNochEinmal() : texte.morgenWieder()) : ''));
  }

  /** Zeigt die Rückmeldung in `huelle` und wartet auf «Weiter». Eingeführte Karten (urteil 'gezeigt') brauchen keine Rückmeldung.
      optionen: { hinweisZeitNehmen, info: { [aufgabeKey]: { korrigiert, kind, wegTitel, folge: 'gleich'|'morgen'|null } }, kopf, weiter, signal }.
      Bei Abbruch über signal endet das Warten sofort. Gibt ein Promise zurück, die Hülle ist danach leer. */
  function zeige(huelle, paket, ergebnisse, optionen = {}) {
    const H = L.ui.h, info = optionen.info || {}, signal = optionen.signal;
    const gewertet = (ergebnisse || []).filter(e => e && e.urteil !== 'gezeigt');
    if (!gewertet.length && !optionen.hinweisZeitNehmen) return Promise.resolve();
    if (L.Dienste && L.Dienste.stil) L.Dienste.stil('lauf-rueckmeldung-stil', STIL);
    return new Promise(fertig => {
      const ende = () => { if (signal) signal.removeEventListener('abort', ende); huelle.replaceChildren(); fertig(); };
      const weiter = H('button.knopf.primaer.rm-weiter', { type: 'button', onclick: ende }, optionen.weiter || texte.weiter());
      const mehrere = paket.aufgaben.length > 1;
      huelle.replaceChildren(H('div.rueckmeldung', { role: 'status', 'aria-live': 'polite' },
        optionen.kopf ? kasten(H, 'rm-ergebnis', optionen.kopf) : '',
        gewertet.map(e => eintrag(H, paket.aufgaben.find(x => x.key === e.aufgabeKey), e, info[e.aufgabeKey] || {}, mehrere)),
        optionen.hinweisZeitNehmen ? kasten(H, 'hilfe.rm-zeit', texte.zeitNehmen()) : '',
        weiter));
      if (typeof weiter.focus === 'function') weiter.focus();
      if (signal && signal.aborted) ende(); else if (signal) signal.addEventListener('abort', ende, { once: true });
    });
  }

  L.Rueckmeldung = { zeige, texte, loesungText, aufgabenText, beispieltexte };
})(globalThis);
