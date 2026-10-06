/* app/uebungstypen/blitzrechnen/typ.js: Übungstyp «blitzrechnen» (Architektur 5.6). Freiwillige Bestzeit-Runde: 10 bis 30 Rechnungen hintereinander, so schnell
   das Kind mag, nur gegen die eigene Bestzeit. Der Typ steht in keiner Leiter und in keinem Prüfungsformat und läuft nur in der Herausforderung (über «tempo»),
   die den Lernstand nie ändert. Darum gibt es keinen sichtbaren Countdown, keine Rangliste, keine Rückmeldung je Aufgabe und keinen Hilfe-Knopf.
   Ablauf: Startkarte, die Rechnungen im Zahlenfeld, Endkarte mit Zeit und Bestzeit, dann meldet der Typ alle Ergebnisse. Die Zeit zählt erst ab «Start».
   ctx.bestzeit (optional, Millisekunden, die bisherige Bestzeit des Kindes) liest der Typ nur. Die neue Bestzeit speichert nicht der Typ, sondern die Ansicht. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const STELLEN = 5;                                                  // so viele Ziffern nimmt das Zahlenfeld
  const BESTZEIT = ['zeigen', 'ausblenden'];

  /** Zeit als «2:14 min» oder «47 s». */
  function zeitText(ms) {
    const s = Math.round(ms / 1000), m = Math.floor(s / 60);
    return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')} min` : `${s} s`;
  }
  const rechnung = (a, b, op, ergebnis) => ({ key: `bsp/b${a}x${b}`, id: `b${a}x${b}`, form: 'rechnung', inhalt: { a, b, op, ergebnis, text: `${a} ${op} ${b}` } });

  L.uebungstyp('blitzrechnen', {
    titel: 'Blitzrunde gegen die eigene Bestzeit',
    eigenschaften: { akzeptiert: ['rechnung'], gruppe: { min: 10, max: 30 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: 'eingabe', zeitlimit: 'nie', freiwillig: true, rueckmeldung: 'am-ende', maxBox: 1 },
    optionen: { bestzeit: { art: 'wahl', werte: BESTZEIT, standard: 'zeigen' } },
    beispiel: { aufgaben: [rechnung(2, 3, '·', 6), rechnung(3, 4, '·', 12), rechnung(4, 5, '·', 20), rechnung(5, 6, '·', 30), rechnung(6, 7, '·', 42),
                           rechnung(7, 8, '·', 56), rechnung(8, 9, '·', 72), rechnung(9, 3, '·', 27), rechnung(4, 6, '·', 24), rechnung(7, 7, '·', 49)], optionen: {} },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (![i.a, i.b, i.ergebnis].every(Number.isInteger)) f.push('a, b und ergebnis müssen ganze Zahlen sein');
      else {
        if (String(Math.abs(i.ergebnis)).length > STELLEN) f.push(`ergebnis hat mehr als ${STELLEN} Stellen: das Zahlenfeld nimmt höchstens ${STELLEN}`);
        if (i.ergebnis < 0) f.push('ergebnis ist negativ: das Zahlenfeld hat keine Minustaste');
      }
      return f;
    },

    /** Zeigt eine Runde (die ganze Gruppe). Ein Abbruch über signal oder «Runde beenden» meldet nichts. */
    zeige(ctx) {
      const { buehne, aufgaben, signal, dienste } = ctx, H = L.ui.h, ergebnisse = [], opt = ctx.optionen || {};
      const mitBestzeit = opt.bestzeit !== 'ausblenden', bestzeit = Number.isFinite(ctx.bestzeit) && ctx.bestzeit > 0 ? ctx.bestzeit : null;
      if (signal.aborted) return Promise.resolve([]);
      return new Promise(fertig => {
        let beendet = false;
        const ende = erg => {
          if (beendet) return;
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const verlassen = H('button.knopf.leise.bl-aus', { type: 'button', onclick: () => ende([]) }, 'Runde beenden');
        const bild = (...inhalt) => buehne.replaceChildren(H('div.uebung.uebung-blitz', ...inhalt));

        function start() {
          bild(H('div.kachel.bl-karte', H('h3', 'Blitzrunde'),
            H('p', `${aufgaben.length} Rechnungen hintereinander. Es zählt nur deine eigene Zeit.`),
            mitBestzeit ? H('p.klein', bestzeit ? `Deine Bestzeit: ${zeitText(bestzeit)}` : 'Die erste Runde legt deine Bestzeit fest.') : null,
            H('div.kachel-fuss', H('button.knopf.primaer.gross', { type: 'button', onclick: () => frage(0) }, 'Start'), verlassen)));
        }

        function frage(n) {
          if (beendet) return;
          const a = aufgaben[n], stopp = dienste.zeit.starte();           // jede Rechnung misst ihre aktive Zeit
          let beantwortet = false;
          const feld = L.ui.tastenfeld({ stellen: STELLEN, onOk(w) {
            if (beendet || beantwortet) return;                           // ein zweiter Tipp auf OK zählt nicht doppelt
            beantwortet = true;
            const zahl = Number(w);
            ergebnisse.push({ aufgabeKey: a.key, urteil: zahl === a.inhalt.ergebnis ? 'richtig' : 'falsch', antwort: { zahl }, ms: stopp(), hilfen: [] });
            if (n + 1 < aufgaben.length) frage(n + 1); else endkarte();
          } });
          bild(H('p.klein.bl-stand', `${n + 1} von ${aufgaben.length}`), H('p.aufgabe', a.inhalt.text, ' = ?'), H('div.eingabe', feld.anzeige, feld.el), H('div.bl-fuss', verlassen));
        }

        function endkarte() {
          const summe = ergebnisse.reduce((s, r) => s + r.ms, 0), richtig = ergebnisse.filter(r => r.urteil === 'richtig').length, fehlerfrei = richtig === aufgaben.length;
          const rekord = fehlerfrei && (bestzeit === null || summe < bestzeit);
          const zeilen = [`Zeit: ${zeitText(summe)}`, `${richtig} von ${aufgaben.length} richtig`];
          if (mitBestzeit && rekord) zeilen.push(bestzeit === null ? 'Das ist deine erste Bestzeit.' : `Neue Bestzeit. Die bisherige war ${zeitText(bestzeit)}.`);
          else if (mitBestzeit && !fehlerfrei) zeilen.push('Für eine Bestzeit zählen nur Runden ohne Fehler.');
          else if (mitBestzeit && bestzeit !== null) zeilen.push(`Deine Bestzeit: ${zeitText(bestzeit)}`);
          bild(H('div.kachel.bl-karte', H('h3', 'Runde zu Ende'), zeilen.map(z => H('p', z)),
            H('div.kachel-fuss', H('button.knopf.primaer.gross', { type: 'button', onclick: () => ende(ergebnisse) }, 'Weiter'))));
        }
        start();
      });
    }
  });
})(globalThis);
