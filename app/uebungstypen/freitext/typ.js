/* app/uebungstypen/freitext/typ.js: Übungstyp «freitext» (Architektur 5.6 und 11.2). Das Kind antwortet in eigenen Worten und prüft sich dann selbst:
   erst die Frage und die eigene Antwort, danach die Musterantwort und die Kriterien, die das Kind einzeln abhakt. Die App bewertet den Text nicht,
   das Urteil kommt aus der Selbstkontrolle. Weil sie keine Prüfung ist, erreicht eine Aufgabe allein mit diesem Typ höchstens Box 3 (maxBox).
   Form frei: frage, kriterien[] (1 bis 6 Punkte, die eine gute Antwort enthält), muster. Urteil: richtig, wenn alle Kriterien abgehakt sind, sonst falsch.
   Option schreiben: tastatur (Standard, die Antwort wird auf der eigenen Buchstabentastatur getippt) oder papier (auf einem Blatt oder gesprochen,
   Aufgaben mit freiem Schreiben und Sprechen bleiben analog, R36). antwort: { text, erfuellt: [Wahrheitswerte], anzahl, von }.
   Ein Hilfsmittel gibt es nicht: Hilfe wäre hier die Musterantwort, und die zeigt der Typ ohnehin nach der eigenen Antwort. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const MAX = { frage: 300, kriterium: 160, kriterien: 6, muster: 600, antwort: 400 };
  const SCHREIBEN = ['tastatur', 'papier'];
  const text = v => typeof v === 'string' && v.trim() !== '';

  L.uebungstyp('freitext', {
    titel: 'Frei antworten und selbst prüfen',
    eigenschaften: { akzeptiert: ['frei'], gruppe: { min: 1, max: 1 }, gruppierung: 'beliebig', braucht: [],
                     ersatz: null, zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 3 },
    optionen: { schreiben: { art: 'wahl', werte: SCHREIBEN, standard: 'tastatur' } },
    beispiel: {
      aufgaben: [{
        key: 'bsp/tag-nacht', id: 'tag-nacht', form: 'frei',
        inhalt: {
          frage: 'Erkläre, warum es Tag und Nacht gibt.',
          kriterien: ['Die Erde dreht sich um sich selbst.', 'Die Sonne beleuchtet immer nur eine Hälfte der Erde.', 'Wo die Sonne hinscheint, ist Tag, auf der anderen Seite ist Nacht.'],
          muster: 'Die Erde dreht sich einmal am Tag um sich selbst. Die Sonne beleuchtet immer nur die Hälfte der Erde. Wo es hell ist, ist Tag, auf der abgewandten Seite ist Nacht.'
        }
      }],
      optionen: {}
    },

    pruefeAufgabe(a, optionen) {
      const i = (a && a.inhalt) || {}, f = [], w = optionen || {};
      const laenge = (feld, wert, max) => { if (wert.length > max) f.push(`${feld} ist länger als ${max} Zeichen`); };
      if (!text(i.frage)) f.push('inhalt.frage fehlt'); else laenge('inhalt.frage', i.frage, MAX.frage);
      if (!text(i.muster)) f.push('inhalt.muster fehlt'); else laenge('inhalt.muster', i.muster, MAX.muster);
      if (!Array.isArray(i.kriterien) || !i.kriterien.length) f.push('inhalt.kriterien braucht mindestens ein Kriterium');
      else {
        if (i.kriterien.length > MAX.kriterien) f.push(`inhalt.kriterien hat ${i.kriterien.length} Einträge, erlaubt sind höchstens ${MAX.kriterien}`);
        i.kriterien.forEach((k, n) => { if (!text(k)) f.push(`inhalt.kriterien[${n}] braucht einen Text`); else laenge(`inhalt.kriterien[${n}]`, k, MAX.kriterium); });
        if (i.kriterien.every(text) && new Set(i.kriterien.map(k => k.trim())).size !== i.kriterien.length) f.push('inhalt.kriterien nennt ein Kriterium doppelt');
      }
      if (w.schreiben !== undefined && !SCHREIBEN.includes(w.schreiben)) f.push(`optionen.schreiben muss eine von ${SCHREIBEN.join(', ')} sein`);
      return f;
    },

    /** Zeigt genau ein Paket (hier: eine Aufgabe). Ein Abbruch über signal meldet nichts, die Aufgabe bleibt fällig. */
    zeige(ctx) {
      const { buehne, aufgaben: [a], signal, dienste } = ctx, H = L.ui.h, i = a.inhalt;
      if (signal.aborted) return Promise.resolve([]);
      const papier = !!ctx.optionen && ctx.optionen.schreiben === 'papier';
      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, tast = null, ms = 0, geschrieben = '';
        const ende = erg => {
          if (beendet) return;                                        // ein zweiter Tipp meldet nichts mehr
          beendet = true;
          signal.removeEventListener('abort', abbruch);
          if (tast) tast.schliesse();
          fertig(erg);
        };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const frage = H('p.aufgabe', i.frage);

        /** Schritt 1: die eigene Antwort. Die Zeit bis hierher ist die Bearbeitungszeit, die Selbstkontrolle zählt nicht dazu. */
        function schreibe() {
          const weiter = () => { ms = stopp(); vergleiche(); };
          if (papier) {
            buehne.replaceChildren(H('div.uebung.uebung-freitext', frage,
              H('p.hinweis', 'Schreibe deine Antwort auf ein Blatt oder sage sie laut. Danach vergleichst du sie mit der Musterantwort.'),
              H('button.knopf.primaer.gross', { type: 'button', onclick: () => { if (!beendet) weiter(); } }, 'Musterantwort zeigen')));
            return;
          }
          tast = L.ui.tastatur({ layout: 'de-ch', zahlen: true, satzzeichen: '.,?:-', maxLaenge: MAX.antwort,
            onOk: w => { if (beendet) return; geschrieben = w.trim(); weiter(); } });
          buehne.replaceChildren(H('div.uebung.uebung-freitext', frage,
            H('p.hinweis', 'Schreibe deine Antwort in eigenen Worten und tippe dann auf OK.'),
            H('div.eingabe', tast.anzeige, tast.el)));
        }

        /** Schritt 2: Musterantwort und Kriterien. Das Kind hakt ab, was in seiner Antwort steht. */
        function vergleiche() {
          if (tast) { tast.schliesse(); tast = null; }
          const haken = i.kriterien.map(() => false);
          const punkte = i.kriterien.map((k, n) => {
            const b = H('button.kriterium', { type: 'button', 'aria-pressed': 'false', onclick: () => {
              if (beendet) return;
              haken[n] = !haken[n];
              b.setAttribute('aria-pressed', String(haken[n]));
              b.classList.toggle('an', haken[n]);
            } }, H('span.kaestchen', H('span.ico.ico-haken', { 'aria-hidden': 'true' })), H('span.punkt', k));
            return b;
          });
          const abgabe = () => {
            const anzahl = haken.filter(Boolean).length;
            ende([{ aufgabeKey: a.key, urteil: anzahl === haken.length ? 'richtig' : 'falsch', antwort: { text: geschrieben, erfuellt: haken.slice(), anzahl, von: haken.length }, ms, hilfen: [] }]);
          };
          buehne.replaceChildren(H('div.uebung.uebung-freitext.vergleich', frage,
            geschrieben ? H('div.kasten.eigene', H('b', 'Deine Antwort'), H('p.text', geschrieben)) : null,
            H('div.kasten.muster', H('b', 'Musterantwort'), H('p.text', i.muster)),
            H('p.hinweis', 'Tippe auf jeden Punkt, der in deiner Antwort steht.'),
            H('div.kriterien', { role: 'group', 'aria-label': 'Kriterien' }, punkte),
            H('button.knopf.primaer.gross', { type: 'button', onclick: abgabe }, 'Fertig')));
        }

        schreibe();
      });
    }
  });
})(globalThis);
