/* app/uebungstypen/eingabe/typ.js: Übungstyp «eingabe» (Architektur 5.5). Das Kind tippt das Ergebnis einer Rechnung ins eigene Zahlenfeld.
   Ruhiger Standard fürs Rechnen: keine Zeitanzeige, kein Zeitlimit. Der Typ zeigt genau ein Paket (eine Aufgabe) und meldet Urteil, Antwort
   und Bearbeitungszeit. Rückmeldung, Nachfassen und Speichern gehören dem Lauf. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const STELLEN = 5;                                                  // so viele Ziffern nimmt das Zahlenfeld

  L.uebungstyp('eingabe', {
    titel: 'Antwort eingeben',
    eigenschaften: { akzeptiert: ['rechnung'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 6 },
    optionen: {},
    beispiel: { aufgaben: [{ key: 'bsp/7x8', id: '7x8', form: 'rechnung', inhalt: { a: 7, b: 8, op: '·', ergebnis: 56, text: '7 · 8' } }], optionen: {} },

    pruefeAufgabe(a) {
      const i = (a && a.inhalt) || {}, f = [];
      if (![i.a, i.b, i.ergebnis].every(Number.isInteger)) f.push('a, b und ergebnis müssen ganze Zahlen sein');
      else {
        if (String(Math.abs(i.ergebnis)).length > STELLEN) f.push(`ergebnis hat mehr als ${STELLEN} Stellen: das Zahlenfeld nimmt höchstens ${STELLEN}`);
        if (i.ergebnis < 0) f.push('ergebnis ist negativ: das Zahlenfeld hat keine Minustaste, dafür passt multiple-choice');
      }
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, hilfen = [];
      if (signal.aborted) return Promise.resolve([]);
      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false;
        const ende = erg => {
          if (beendet) return;                                        // ein zweiter Tipp auf OK meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });

        const feld = L.ui.tastenfeld({
          stellen: STELLEN,
          onOk(w) {
            if (beendet) return;                                      // ein zweiter Tipp auf OK stoppt die Zeit nicht noch einmal
            const zahl = Number(w), richtig = zahl === a.inhalt.ergebnis;
            ende([{ aufgabeKey: a.key, urteil: !richtig ? 'falsch' : hilfen.length ? 'hilfe' : 'richtig', antwort: { zahl }, ms: stopp(), hilfen }]);
          }
        });

        const hm = ctx.modus !== 'simulation' && ctx.hilfe && ctx.hilfe.verfuegbar && a.hilfe && a.hilfe.hilfsmittel;
        const hilfeOrt = H('div.hilfe-ort');
        const hilfsknopf = hm ? H('button.knopf.hilfe', { type: 'button', onclick: () => {
          ctx.hilfe.zeige(hm, hilfeOrt);                              // wirft das Hilfsmittel, zählt die Hilfe nicht
          if (!hilfen.includes(hm.name)) hilfen.push(hm.name);
          hilfsknopf.setAttribute('disabled', '');
        } }, 'Hilfe') : null;

        buehne.replaceChildren(H('div.uebung.uebung-eingabe',
          H('p.aufgabe', a.inhalt.text, ' = ?'),
          H('div.eingabe', feld.anzeige, feld.el),
          hm ? H('div.hilfe-bereich', hilfsknopf, hilfeOrt) : null));
      });
    }
  });
})(globalThis);
