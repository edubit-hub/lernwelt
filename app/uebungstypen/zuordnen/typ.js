/* app/uebungstypen/zuordnen/typ.js: Übungstyp «zuordnen» (Architektur 5.6). Eine Gruppe von 3 bis 6 Aufgaben desselben Themas wird zugeordnet:
   Das Kind tippt eine Karte an und dann das Feld, in das sie gehört (auch umgekehrt: erst das Feld, dann die Karte). Ziehen gibt es nicht (5.8).
   Formen: paar (Karte = links, Feld = rechts, gleiche rechts-Werte bilden ein Feld) und wortkarte (Fremdwort zu Muttersprache oder Bild, ein Feld je
   Wort, Option richtung wie bei multiple-choice). Erst «Prüfen» beurteilt, jede Karte einzeln: Gäbe es vorher eine Rückmeldung, liesse sich probieren.
   Hat das Paket weniger als zwei Felder (und die Geschwisteraufgaben liefern keine), gibt es nichts zuzuordnen: Der Typ zeigt die Lösung mit «Weiter»
   und meldet «gezeigt». Weil man raten kann, erreicht eine Aufgabe allein mit diesem Typ höchstens Box 4. Zu kleine Gruppen übernimmt multiple-choice. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const RICHTUNGEN = ['auto', 'fremd-mutter', 'mutter-fremd'];
  const MAX_TEXT = 40;                                                // längere Texte passen nicht auf eine Karte
  let durchgang = 0;                                                  // jeder Aufruf mischt anders

  const text = v => typeof v === 'string' && v.trim() !== '';
  const zahlen = n => Array.from({ length: n }, (_, i) => i);

  /** Richtung der Wortkarten eines Pakets: Bild, wenn alle ein Bild haben und nichts anderes gewünscht ist. */
  function richtungVon(aufgaben, optionen) {
    const wunsch = optionen && RICHTUNGEN.includes(optionen.richtung) ? optionen.richtung : 'auto', wk = aufgaben.filter(a => a.form === 'wortkarte');
    return wunsch !== 'auto' ? wunsch : wk.length && wk.every(a => text(a.inhalt.bild)) ? 'bild' : 'fremd-mutter';
  }

  /** Karte und Feld einer Aufgabe: { a, karte, feld: { id, text, bild?, aufgabe? } }. Gleiche id heisst gleiches Feld. */
  function modell(a, richtung) {
    const i = a.inhalt;
    if (a.form === 'paar') return { a, karte: i.links, feld: { id: `t:${i.rechts}`, text: i.rechts } };
    if (richtung === 'bild') return { a, karte: i.fremd, feld: { id: `b:${i.bild}`, text: i.mutter, bild: i.bild, aufgabe: a.id } };
    const [von, nach] = richtung === 'mutter-fremd' ? ['mutter', 'fremd'] : ['fremd', 'mutter'];
    return { a, karte: i[von], feld: { id: `w:${i[nach]}`, text: i[nach], aufgabe: a.id } };
  }

  /** Felder des Pakets ohne Doppelte, gemischt. kap ist die Zahl der Karten, die ein Feld aufnimmt (ein Wortfeld nimmt nur sein Gegenstück).
      Hat das Paket weniger als zwei, kommen Felder der Geschwisteraufgaben dazu, wie die Ablenker bei multiple-choice. */
  function felderVon(karten, ctx, rng) {
    const felder = new Map();
    for (const k of karten) {
      const da = felder.get(k.feld.id);
      felder.set(k.feld.id, { ...k.feld, kap: k.a.form === 'paar' ? Infinity : (da ? da.kap : 0) + 1 });
    }
    const liste = ctx.pool && typeof ctx.pool.thema === 'function' ? ctx.pool.thema(karten[0].a.thema) : [];
    for (const s of rng.mische(Array.isArray(liste) ? liste : [])) {
      if (felder.size >= 2) break;
      if (s && s.form === 'paar' && s.inhalt && text(s.inhalt.rechts)) { const f = modell(s, 'fremd-mutter').feld; if (!felder.has(f.id)) felder.set(f.id, { ...f, kap: Infinity }); }
    }
    return rng.mische([...felder.values()]);
  }

  L.uebungstyp('zuordnen', {
    titel: 'Zuordnen',
    eigenschaften: { akzeptiert: ['wortkarte', 'paar'], gruppe: { min: 3, max: 6 }, gruppierung: 'thema', braucht: [],
                     ersatz: 'multiple-choice', zeitlimit: 'nie', freiwillig: false, rueckmeldung: 'je-paket', maxBox: 4 },
    optionen: { richtung: { art: 'wahl', werte: RICHTUNGEN, standard: 'auto' } },
    beispiel: {
      aufgaben: [
        { key: 'bsp/hund', id: 'hund', form: 'paar', inhalt: { links: 'Hund', rechts: 'Nomen' } },
        { key: 'bsp/rennen', id: 'rennen', form: 'paar', inhalt: { links: 'rennen', rechts: 'Verb' } },
        { key: 'bsp/schnell', id: 'schnell', form: 'paar', inhalt: { links: 'schnell', rechts: 'Adjektiv' } }
      ],
      optionen: {}
    },

    pruefeAufgabe(a, optionen) {
      const i = (a && a.inhalt) || {}, f = [], kurz = (feld, t) => { if (text(t) && t.length > MAX_TEXT) f.push(`${feld} ist länger als ${MAX_TEXT} Zeichen und passt nicht auf eine Karte`); };
      if (!a || (a.form !== 'paar' && a.form !== 'wortkarte')) f.push(`Form «${a && a.form}» versteht zuordnen nicht`);
      else if (a.form === 'paar') { kurz('links', i.links); kurz('rechts', i.rechts); } else { kurz('fremd', i.fremd); kurz('mutter', i.mutter); }
      if (optionen && optionen.richtung !== undefined && !RICHTUNGEN.includes(optionen.richtung)) f.push(`optionen.richtung muss eine von ${RICHTUNGEN.join(', ')} sein`);
      return f;
    },

    /** Zeigt genau ein Paket (3 bis 6 Aufgaben). Ein Abbruch über signal meldet nichts, die Aufgaben bleiben fällig. */
    zeige(ctx) {
      const { buehne, aufgaben, signal, dienste } = ctx, H = L.ui.h;
      if (signal.aborted || !aufgaben.length) return Promise.resolve([]);
      const fremd = aufgaben.find(a => a.form !== 'paar' && a.form !== 'wortkarte');
      if (fremd) throw new Error(`zuordnen: Form «${fremd.form}» wird nicht unterstützt`);
      const rng = L.Zufall.aus(`${aufgaben.map(a => a.key).join('|')}|${durchgang++}`), richtung = richtungVon(aufgaben, ctx.optionen);
      const karten = aufgaben.map(a => modell(a, richtung)), felder = felderVon(karten, ctx, rng), reihe = rng.mische(zahlen(karten.length));
      const markiert = ctx.modus !== 'simulation';                    // in der Probeprüfung zeigt erst die Rückmeldung am Ende, was stimmt
      const ziel = f => ({ text: f.text, ...(f.aufgabe && { aufgabe: f.aufgabe }) });

      return new Promise(fertig => {
        const stopp = dienste.zeit.starte();                          // aktive Zeit, pausiert bei verdecktem Tab
        let beendet = false, bewertet = null, sel = null;             // sel: { karte } oder { feld }, bewertet: Urteil je Karte nach «Prüfen»
        const ort = karten.map(() => null);                           // ort[i]: Index des Feldes, in dem die Karte liegt, sonst null (im Vorrat)
        const ende = erg => { if (beendet) return; beendet = true; signal.removeEventListener('abort', abbruch); fertig(erg); };
        const abbruch = () => ende([]);
        signal.addEventListener('abort', abbruch, { once: true });
        const ergebnis = (urteil, i, f, ms) => ({ aufgabeKey: karten[i].a.key, urteil, antwort: ziel(f), ms: Math.round(ms / karten.length), hilfen: [] });

        if (felder.length < 2) {                                      // nichts zu wählen: Lösung zeigen, ohne Beweis und ohne Ertrag
          const weiter = () => { const ms = stopp(); ende(karten.map((k, i) => ergebnis('gezeigt', i, k.feld, ms))); };
          buehne.replaceChildren(H('div.uebung.uebung-zuordnen', H('ul.paarliste', karten.map(k => H('li', `${k.karte}: ${k.feld.text}`))),
            H('button.knopf.primaer.weiter', { type: 'button', onclick: weiter }, 'Weiter')));
          return;
        }

        const karte = i => {
          const gewaehlt = !!sel && sel.karte === i, urteil = markiert && bewertet ? (bewertet[i] ? 'richtig' : 'falsch') : null;
          return H('button.karte', { type: 'button', 'aria-pressed': String(gewaehlt), disabled: !!bewertet, class: gewaehlt ? 'gewaehlt' : urteil, onclick: () => tippeKarte(i) }, karten[i].karte);
        };
        const feld = j => {
          const f = felder[j], gewaehlt = !!sel && sel.feld === j, besitzer = (karten.find(k => k.feld.id === f.id) || karten[0]).a;   // Felder der Geschwister haben kein Bild
          const kopf = H('button.feld-kopf', { type: 'button', 'aria-pressed': String(gewaehlt), 'aria-label': f.bild ? `Bild ${j + 1}` : null, disabled: !!bewertet, onclick: () => tippeFeld(j) },
            f.bild ? H('img', { src: dienste.bild ? dienste.bild.url(f.bild, besitzer) : f.bild, alt: '', draggable: 'false', onerror: () => kopf.replaceChildren(f.text) }) : f.text);
          return H('div.feld', { class: gewaehlt ? 'gewaehlt' : null }, kopf, H('div.feld-inhalt', reihe.filter(i => ort[i] === j).map(karte)));
        };

        const vorrat = H('div.vorrat', { role: 'group', 'aria-label': 'Karten' });
        const flaechen = H(`div.felder.spalten-${felder.length === 2 || felder.length === 4 ? 2 : 3}`, { role: 'group', 'aria-label': 'Felder' });
        const pruefen = H('button.knopf.primaer.gross.pruefen', { type: 'button', disabled: true, onclick: pruefe }, 'Prüfen');
        const hinweis = karten.every(k => k.feld.bild) ? 'Tippe ein Wort an und dann das passende Bild.'
          : karten.every(k => k.feld.aufgabe) ? 'Tippe ein Wort an und dann das Wort, das dazugehört.' : 'Tippe eine Karte an und dann das Feld, in das sie gehört.';

        function zeichne() {
          vorrat.replaceChildren(...reihe.filter(i => ort[i] === null).map(karte));
          flaechen.replaceChildren(...felder.map((_, j) => feld(j)));
          flaechen.classList.toggle('bereit', !!sel && sel.karte !== undefined);
          pruefen.disabled = !!bewertet || ort.includes(null);
        }
        function setze(i, j) {                                        // ein volles Feld (Wortfeld) gibt eine Karte zurück in den Vorrat
          const da = reihe.filter(x => ort[x] === j && x !== i);
          while (felder[j].kap !== Infinity && da.length >= felder[j].kap) ort[da.shift()] = null;
          ort[i] = j; sel = null; zeichne();
        }
        function tippeKarte(i) {
          if (beendet || bewertet) return;
          if (sel && sel.feld !== undefined) return setze(i, sel.feld);
          sel = sel && sel.karte === i ? null : { karte: i }; zeichne();
        }
        function tippeFeld(j) {
          if (beendet || bewertet) return;
          if (sel && sel.karte !== undefined) return setze(sel.karte, j);
          sel = sel && sel.feld === j ? null : { feld: j }; zeichne();
        }
        function pruefe() {
          if (beendet || bewertet || ort.includes(null)) return;
          const ms = stopp();
          bewertet = karten.map((k, i) => felder[ort[i]].id === k.feld.id);
          sel = null; zeichne();
          ende(karten.map((k, i) => ergebnis(bewertet[i] ? 'richtig' : 'falsch', i, felder[ort[i]], ms)));
        }

        buehne.replaceChildren(H('div.uebung.uebung-zuordnen', H('p.hinweis', hinweis), vorrat, flaechen, H('div.leiste', pruefen)));
        zeichne();
        if (vorrat.offsetHeight) vorrat.style.minHeight = `${vorrat.offsetHeight}px`;   // der Vorrat schrumpft nicht, wenn Karten liegen: die Felder darunter bleiben an ihrem Ort
      });
    }
  });
})(globalThis);
