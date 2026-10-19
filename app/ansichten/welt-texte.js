/* app/ansichten/welt-texte.js: alle Texte der Welt-Ansichten Siedlung, Forschung, Aufträge und Logbuch an einer Stelle (Architektur 6.9 und 7.8, AP-16).
   Der Ton ist sachlich und auf Augenhöhe: keine Ausrufezeichen, kein Lob, kein Druck, kein Vergleich mit anderen. Jeder Text, der eine Aktion absagt, nennt, was fehlt
   («Wissen im Bereich mathe.zahl: 1 von 2»). tests/welt-siedlung.test.mjs, welt-forschung.test.mjs und welt-auftraege.test.mjs prüfen jeden Text mit Pruefung.pruefeTexte (Ausrufezeichen, Stopwortliste, Schweizer Schreibweise). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
  const nach = (hat, braucht) => `${hat} von ${braucht}`;

  L.Texte = Object.assign(L.Texte || {}, {
    welt: {
      menue: { siedlung: 'Siedlung', forschung: 'Forschung', auftraege: 'Aufträge', logbuch: 'Logbuch' },
      keineWelt: 'Hier gibt es noch keine Welt. Sie erscheint, sobald ein Welt-Thema geladen ist.',
      fach: { mathe: 'Rechnen', deutsch: 'Deutsch', englisch: 'Englisch', nmg: 'NMG' },
      heute: 'heute',

      // Ressourcenleiste, Epoche, Statusleiste
      vorratName: 'Vorrat', zuwachs: 'Zuwachs in dieser Sitzung', epoche: nr => `Epoche ${nr}`, epocheName: (nr, name) => `Epoche ${nr}: ${name}`,
      tor: 'Tor', torStand: nach, ueben: 'Üben', uebenBeschriftung: 'Üben: zum Tagesauftrag', infoFeld: 'Informationen zur Auswahl',
      naechstesZiel: 'Nächstes Ziel', zielZeile: (name, wissen) => (wissen ? `${name}, ${wissen}` : name), zielSumme: (hat, braucht) => `Wissen ${nach(hat, braucht)}`, zielWissen: (hat, braucht) => `Wissen ${nach(hat, braucht)}`,

      // Bausteine: Kosten und Voraussetzungen
      posten: (name, menge) => `${name} ${menge}`, vorrat: n => `Vorrat ${n}`, vorratFehlt: (hat, fehlt) => `Vorrat ${hat}, es fehlen ${fehlt}`,
      esFehlt: text => `Es fehlt: ${text}`, materialFehlt: text => `Material fehlt: ${text}`,
      // Eine Voraussetzung ist eine Zeile mit Fortschritt. Der Satz «Es fehlt: ...» erscheint nur als Meldung, wenn ein gesperrter Knopf angetippt wird.
      epocheOffen: name => `Epoche «${name}» offen`, epocheNein: (name, tor) => (tor ? `Epoche «${name}» noch zu, sie öffnet mit der Forschung «${tor}»` : `Epoche «${name}» noch zu`),
      epocheZu: (name, tor) => (tor ? `Es fehlt: Forschung «${tor}», sie öffnet die Epoche «${name}»` : `Es fehlt: die Epoche «${name}»`),
      forschungErforscht: name => `Forschung «${name}» erforscht`, forschungNein: name => `Forschung «${name}» noch nicht erforscht`,
      forschungFehlt: (name, grund) => `Es fehlt: Forschung «${name}»${grund ? ` (${grund})` : ''}`,
      // Bereiche heissen für das Kind «Zahlen», «Sprache» oder «Wörter Englisch», nie mit der technischen Kennung
      bereiche: { 'mathe.zahl': 'Zahlen', 'mathe.groessen': 'Grössen', 'deutsch.sprache': 'Sprache', 'englisch.wortschatz': 'Wörter Englisch', 'nmg.natur': 'Natur' },
      punkte: n => `Wissen ${n}`,
      wissenBereich: (name, hat, braucht) => `${name}: Wissen ${nach(hat, braucht)}${hat < braucht ? `, noch ${braucht - hat}` : ''}`,
      wissenSumme: (hat, braucht) => `Alle Bereiche zusammen: Wissen ${nach(hat, braucht)}${hat < braucht ? `, noch ${braucht - hat}` : ''}`,
      wissenFehlt: (name, noch) => `${noch} Wissen${name ? ` in «${name}»` : ', aus allen Bereichen zusammen'}`,
      platzFrei: 'Ein freier Bauplatz', keinPlatz: 'Es fehlt: ein freier Bauplatz', hoechsteStufe: 'Die höchste Stufe ist erreicht.',

      // Wirkung der Gebäude
      rollen: { rathaus: 'Rathaus', produktion: 'Produktion', handel: 'Handel', wohnen: 'Wohnen', forschung: 'Forschung', denkmal: 'Denkmal', landschaft: 'Landschaft' },
      rezept: (aus, name, menge) => `${aus} ergeben ${menge} ${name}.`, tausch: text => `Tausch möglich: ${text}.`,
      wirkungAnsicht: 'Keine Produktion. Ein Ausbau verändert nur das Aussehen der Siedlung.', wirkungFrei: 'Landschaft zum Gestalten. Ein Ausbau verändert nur das Aussehen.',
      danachRezept: (name, neu, alt) => `Danach ergibt jede Veredelung ${neu} ${name} statt ${alt}.`, danachAussehen: 'Danach sieht das Gebäude anders aus.',
      freiBauteil: name => `Gebäude «${name}»`, freiStufe: (name, st) => `«${name}» auf Stufe ${st}`, freiEpoche: (name, plaetze) => `Epoche «${name}» mit ${mz(plaetze, 'neuem Bauplatz', 'neuen Bauplätzen')}`,

      // Siedlung
      legendeAusbau: 'Ausbau möglich', legendeGesperrt: 'Epoche noch zu', legendeStufe: 'Zahl am Gebäude: Stufe', neuKopf: 'Neu möglich:', jetztKopf: 'Jetzt möglich:', undWeitere: n => ` und ${n} weitere`,
      platzStand: (nr, belegt, gesamt) => `Epoche ${nr}: ${belegt} von ${gesamt} Bauplätzen belegt`,
      gebaut: name => `${name} gebaut.`, ausgebaut: (name, stufe) => `${name} ist jetzt auf Stufe ${stufe}.`, verschoben: name => `${name} verschoben.`,
      veredelt: (menge, name) => `${menge} ${name} hergestellt.`, getauscht: text => `Getauscht: ${text} erhalten.`,
      verschiebeHinweis: name => `Tippe auf einen freien Bauplatz, um ${name} dorthin zu setzen.`,
      platzWaehlen: 'Tippe auf einen Bauplatz. Hier steht dann, was er kostet, was er bringt und was dafür nötig ist.',
      freierPlatz: 'Freier Bauplatz', bauplatz: nr => `Bauplatz ${nr}`, hierBauen: 'Hier bauen', weitere: 'Weitere Gebäude zur Wahl',
      nichtsZuBauen: 'Zurzeit gibt es nichts zu bauen. Neue Gebäude kommen durch Forschung.', zumForschungsbaum: 'Zur Forschung',
      gesperrterPlatz: name => `Bauplatz der Epoche «${name}»`, nochGesperrt: 'Noch gesperrt', kostenSpaeter: 'Die Kosten zeigt das Gebäude, sobald die Epoche offen ist.',
      gesperrtWirkung: (name, beispiele) => `Hier lässt sich ab der Epoche «${name}» bauen${beispiele ? `, zum Beispiel ${beispiele}` : ''}.`,
      wirkung: 'Wirkung', kosten: 'Kosten', voraussetzung: 'Voraussetzung', keineVoraussetzung: 'Keine Voraussetzung.', stufeVon: (st, max) => `Stufe ${st} von ${max}`, stufeNach: (n, max) => `Wird Stufe ${n} von ${max}`,
      ausbau: 'Ausbau', ausbauAuf: stufe => `Ausbau auf Stufe ${stufe}`, ausbauen: 'Ausbauen', verschieben: 'Verschieben', verschiebenKostenlos: 'Verschieben kostet nichts.', abbrechen: 'Abbrechen',
      veredeln: 'Veredeln', tauschen: 'Tauschen', alles: max => `Alles (${max})`, aus: text => `aus ${text}`, tauschText: (gib, erhalte) => `${gib} gegen ${erhalte}`,

      // Forschung
      baumName: 'Forschungsbaum', zielKurz: 'Ziel', torKurz: 'Tor', horizontKurz: 'Noch nicht wählbar', torWissen: (hat, braucht) => `Wissen ${nach(hat, braucht)}`, wissenKurz: nach,
      zustand: { erforscht: 'Erforscht', moeglich: 'Bereit zum Erforschen', gesperrt: 'Gesperrt', horizont: 'Später' },
      keineForschung: 'Diese Welt hat keinen Forschungsbaum.', bereich: 'Bereich', alleBereiche: 'Alle Bereiche zusammen', wissen: 'Wissen', wissenspunkte: 'Wissen',
      bezahlt: 'Bezahlt', schaltetFrei: 'Schaltet frei', nichtsFrei: 'Keine neuen Gebäude', erforschen: 'Erforschen', erforscht: name => `${name} erforscht.`,
      neuMoeglich: liste => `Neu möglich: ${liste.join(', ')}.`, zielSetzen: 'Als Ziel merken', zielEntfernen: 'Ziel entfernen', zielGesetzt: name => `Ziel gesetzt: ${name}.`,
      zielEntfernt: 'Ziel entfernt.', alleErfuellt: 'Alle Bedingungen sind erfüllt.', inDerSiedlung: 'In der Siedlung ansehen', horizont: 'Später', nochNichtWaehlbar: 'Noch nicht wählbar',
      horizontText: name => `Dieser Zweig gehört zur Epoche «${name}». Er ist sichtbar, damit klar ist, was später kommt. Wählbar wird er, sobald die Epoche offen ist.`,
      horizontMeldung: 'Dieser Zweig liegt hinter einer Epoche, die noch zu ist.',

      // Aufträge
      auftraegeUnterzeile: 'Expeditionen und Aufträge der Siedlung. Ertrag und Anforderung stehen vorher fest.', expeditionen: 'Expeditionen', keineExpeditionen: 'Diese Welt hat noch keine Expeditionen.',
      siedlungsauftraege: 'Aufträge der Siedlung', lieferungen: 'Lieferungen für die Siedlung', nochNicht: 'Noch nicht',
      lieferungenText: epoche => `Aufträge verlangen Güter aus mehreren Fächern und schalten Bauplätze frei. ${epoche ? `Sie öffnen mit der Epoche «${epoche}».` : 'Sie kommen mit einer späteren Epoche.'}`,
      // Was einer gesperrten Expedition zum Start fehlt, als Weg: was zu üben ist
      soEpoche: tor => (tor ? `So kommst du hin: Erforsche «${tor}», dann öffnet sich die Epoche.` : 'So kommst du hin: Die Epoche muss zuerst offen sein.'),
      soWissen: (name, module, noch) => `So kommst du hin: Übe ${module.length ? module.join(', ') : name} im Tagesauftrag. Es fehlt noch Wissen in «${name}»: ${noch}.`,
      soGeuebt: noch => `So kommst du hin: Übe im Tagesauftrag weiter. Es fehlen noch ${mz(noch, 'geübte Aufgabe', 'geübte Aufgaben')}.`,
      bereit: 'Bereit', gesperrt: 'Gesperrt', erledigtAm: datum => `Erledigt am ${datum}`, alleModule: 'allen geübten Bereichen',
      expeditionText: (bereich, umfang, ziel) => `${umfang} Aufgaben aus ${bereich} · Ziel: ${ziel} beim ersten Mal`,
      geuebt: (n, umfang) => `Geübte Aufgaben dafür: ${nach(n, umfang)}`, geuebtFehlt: (n, umfang) => `Es fehlt: geübte Aufgaben dafür, ${nach(n, umfang)}`,
      zuWenigGeuebt: (n, umfang) => `Zu wenige geübte Aufgaben dafür: ${nach(n, umfang)}.`,
      lohn: 'Ertrag', sammlungLohn: name => `Sammlung: ${name}`, sammlungKurz: name => `Sammlung: ${name}`, lohnEinmal: 'Der Ertrag kommt nur einmal. Eine Wiederholung ist trotzdem möglich.',
      starten: 'Starten', nochEinmal: 'Noch einmal', zurSiedlung: 'Zur Siedlung', erreicht: name => `${name}: Ziel erreicht.`,
      trefferText: (richtig, beurteilt, quote, ziel) => `${richtig} von ${beurteilt} Aufgaben beim ersten Versuch richtig, das sind ${quote}. Ziel: ${ziel}.`,
      lohnBezahlt: text => `Ertrag: ${text}.`, lohnSchonBezahlt: 'Den Ertrag gab es schon.', nichtErreicht: name => `${name}: nicht abgeschlossen.`, wiederholbar: 'Die Expedition lässt sich jederzeit wiederholen.',

      // Logbuch
      logbuchUnterzeile: 'Die letzten sieben Tage, gegen dich selbst', nochKeineTage: 'In den letzten zwei Wochen gab es noch keinen Übungstag. Die Diagramme füllen sich mit dem Üben.',
      tagKurz: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], kAufgaben: 'Aufgaben', kTreffer: 'Treffer im ersten Versuch', kZeit: 'Übungszeit', kNeu: 'Neue Aufgaben',
      einheitAufgaben: 'Aufgaben', einheitMinuten: 'min', einheitSekunden: 's', bestBlitz: titel => `Beste Zeit im Blitzrechnen: ${titel}`, einheitNeu: 'neue Aufgaben', davor: x => `Sieben Tage davor: ${x}`, davorKein: 'Sieben Tage davor: kein Wert',
      ablesung: (kurz, datum, wert, einheit) => (wert === null ? `${kurz} ${datum}: kein Wert` : `${kurz} ${datum}: ${wert} ${einheit}`),
      wissenTitel: 'Wissensstand je Bereich', wissenStufen: 'Neu, In Arbeit, Grundlage steht, Sicher, Gefestigt', keinModul: 'Es ist noch kein Lernmodul aktiv.',
      wissenImBereich: (name, punkte) => `${name}: Wissen ${punkte}`, themenBegonnen: (n, m) => `${n} von ${m} Themen begonnen`, nochNichtBegonnen: 'Noch nicht begonnen', sicherVon: (s, n) => `${s} von ${n} Aufgaben sicher`,
      stufe: { neu: 'Neu', ueben: 'In Arbeit', basis: 'Grundlage steht', sicher: 'Sicher', gefestigt: 'Gefestigt' },
      bestTitel: 'Bestwerte', neuBest: 'neu', keineBestwerte: 'Noch keine Bestwerte. Sie entstehen beim Üben.', bestAufgaben: 'Meiste Aufgaben an einem Tag',
      bestTreffer: 'Beste Trefferquote an einem Tag (ab 10 Aufgaben)', bestZeit: 'Längste Übungszeit an einem Tag', bestName: {}, bestEinheit: {},
      sammlungTitel: 'Sammlung', sammlungZahl: (pl, da, ges) => [mz(pl, 'Plakette', 'Plaketten'), ges ? `Fundstücke ${nach(da, ges)}` : ''].filter(Boolean).join(', '),
      plakette: (titel, stufe, datum) => `${titel} · ${stufe} · ${datum}`, fundDatum: (quelle, datum) => (quelle ? `Expedition «${quelle}» · ${datum}` : datum),
      fundOffen: quelle => (quelle ? `Offen. Expedition «${quelle}»` : 'Offen'),
      keineSammlung: 'Noch nichts gesammelt. Plaketten entstehen, wenn ein Thema sicher ist, Fundstücke bringen die Expeditionen.'
    }
  });
})(globalThis);
