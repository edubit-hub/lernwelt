/* app/lernsteuerung/lernregeln.js: alle Stellschrauben des Lernmodells an einem Ort (Architektur 6.7).
   Jede Zahl gehört zu einer Regel R1 bis R10 im Register docs/lernregeln.md und hat einen Test. Alle Werte sind Startwerte
   und werden nach etwa drei Wochen echter Nutzung kalibriert. Eine Zahl ändern heisst: Eintrag im Register, Test, Simulation. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.lernregeln = L.einfrieren({
    version: 1,
    wiederholung: {                                  // R2 verteiltes Üben, R4 Mastery
      intervalle: [0, 1, 2, 4, 8, 16, 32],           // Tage je Box (Box 0 = noch nie gesehen)
      fehlerSchritte: 2,                             // Fehler: Box minus 2, morgen wieder
      vortestTage: 2                                 // Vortest richtig: Box 1, erste Wiederholung nach 2 Tagen
    },
    mastery: {                                       // R4: Stand eines Themas aus den Boxen seiner Aufgaben
      basisBox: 2, basisAnteil: 0.5,                 // basis: mindestens 50 % in Box 2 oder höher
      sicherBox: 4, sicherAnteil: 0.9,               // sicher: mindestens 90 % in Box 4 oder höher (an drei verschiedenen Tagen)
      gefestigtBox: 5, gefestigtAnteil: 0.8          // gefestigt: zusätzlich mindestens 80 % in Box 5 oder höher
    },
    freischaltung: { box: 2, anteil: 0.6 },          // Folgethema öffnet, wenn 60 % des Vorgängers Box 2 erreicht haben
    sitzung: {                                       // R1 (nachfassenAbstand), R3 (aufwaermen, minAbstandThema), R7 (Dosierung), R8 (ratenMs)
      zielMinuten: 12, maxMinuten: 15, sekProAufgabe: 12,
      mix: { neu: 0.3 },                             // höchstens 30 % neue Aufgaben
      neuProTagMax: 8,                               // je Modul
      neuProTagGesamt: 12,                           // über alle Module zusammen: so verteilen sich die neuen Aufgaben auf mehrere Module (Neuverteilung)
      quoteFenster: 40, quoteVoll: 0.80, quoteHalb: 0.65,   // Trefferquote der letzten 40 fälligen Abrufe: darunter weniger, ganz darunter kein neuer Stoff
      rueckstauFaktor: 2,                            // mehr als 2 mal Tagesziel fällig: keine neuen Aufgaben
      aufwaermen: 2,                                 // Einstieg mit zwei sicheren Aufgaben
      minAbstandThema: 2,                            // gleiches Thema nie direkt hintereinander (ausser es gibt nur eines)
      nachfassenAbstand: 3,                          // falsche Aufgabe kommt nach 3 anderen Paketen noch einmal
      ratenMs: 1500,                                 // ein Fehler in weniger als 1500 ms gilt als Raten
      schaetzung: {                                  // Zeitschätzung je Aufgabe: gleitende Antwortzeit plus Rückmeldezeit, begrenzt (6.4)
        rueckmeldeSek: 8, min: 6, max: 25,
        typSek: {                                    // Richtwerte in Sekunden für Aufgaben ohne Messwert, mit Rückmeldung. Annahmen, nach drei Wochen aus den echten Zeiten zu kalibrieren
          karteikarten: 8, blitzrechnen: 6, 'multiple-choice': 10, eingabe: 14, hoeren: 14, zahlenstrahl: 20, uhr: 20, lueckentext: 20, geld: 22,
          reihenfolge: 25, beschriften: 25, diktat: 28, zuordnen: 12, freitext: 40
        }
      },
      quoteMindest: 15                               // so viele fällige Abrufe braucht die Trefferquote, bevor sie die Bremse steuert
    },
    einstufung: {                                    // R7 (AP-23): Vortest-Aufgaben, die schon sitzen, sind kein neuer Stoff
      anzahl: 20,                                    // Einstufungsrunde beim ersten Kontakt mit einem Modul: bis zu 20 Vortest-Aufgaben quer über die Themen
      nachschubMax: 30                               // so viele neue Aufgaben rücken je Runde höchstens für schon bekannte nach (die 15 Minuten des Tages gelten weiter)
    },
    pruefung: {                                      // R9: Prüfungsmodus, Tage vor der Prüfung
      festigen: 10, diagnoseVon: 10, diagnoseBis: 7, simulation: 3, abschluss: 2,
      intervallDeckel: [[3, 1], [7, 2], [14, 4]],    // bis in N Tagen Prüfung: höchstens M Tage Abstand
      plan: {                                        // Rechnung und Ampel des Plans (6.6)
        beruehrungenNeu: 4, beruehrungenAngelernt: 2,   // Berührungen bis «sicher» je neue und je schon angelernte Aufgabe
        gelb: 0.7, rot: 1,                           // Auslastung ab gelb und ab rot
        neuAnteilGelb: 0.75,                         // bei gelb nur so viel des neuen Stoffs im Umfang
        diagnoseAnteil: 0.5, vorabendMinuten: 8      // Diagnose mit halber Anzahl, am Vorabend höchstens 8 Minuten
      }
    },
    zeit: { standardZeitlimit: false, tempoNurGegenBestwert: true }   // R7: kein Zeitdruck
  });
})(globalThis);
