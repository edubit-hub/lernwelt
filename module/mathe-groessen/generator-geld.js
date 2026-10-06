/* module/mathe-groessen/generator-geld.js: Aufgabenbestand «Geld zählen und legen» (Form betrag) und Fehlerdiagnose, nur für dieses Modul.
   Der Bestand besteht aus festen Listen von Münzen und Noten (Werte in Rappen, grösste zuerst). Der Betrag ist die Summe der Stücke und
   wird in pool gerechnet. Der Typ «geld» zeigt die Stücke (Zählen) oder verlangt sie auf dem Tisch (Legen), je nach Aufgabe.
   Reine Berechnung: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr. Gleiche Parameter ergeben denselben Bestand. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const B = L.registry.bausteine.get('_gemeinsam/rechnen');
  if (!B) throw new Error('mathe-groessen: Baustein «_gemeinsam/rechnen» fehlt. Er steht in modul.js unter braucht und wird vor den Generatoren geladen.');

  const summe = liste => liste.reduce((s, w) => s + w, 0);
  const franken = rp => Math.floor(rp / 100), rest = rp => rp % 100;
  /** Schreibweise «3 Fr. 50 Rp.», wie sie der Typ «geld» und die Rückmeldung verwenden. */
  const betragText = rp => (rp === 0 ? '0 Fr.' : [franken(rp) ? `${franken(rp)} Fr.` : '', rest(rp) ? `${rest(rp)} Rp.` : ''].filter(Boolean).join(' '));

  /** Je Eintrag [Schwierigkeit, Stücke in Rappen]. Höchstens 14 Stücke (mehr passen nicht auf den Tisch), die Beträge sind verschieden. */
  const BESTAND = {
    muenzen: { praefix: 'm', liste: [
      [1, [10, 5]], [1, [20, 10]], [1, [20, 10, 5]], [1, [20, 20, 5]], [1, [50, 10]], [1, [50, 10, 5]], [1, [50, 20, 5]], [1, [50, 20, 10]],
      [2, [100, 50]], [2, [100, 20, 10]], [2, [200, 50, 20]], [2, [100, 100, 20, 5]], [2, [200, 100, 50]], [2, [200, 200, 50, 20]],
      [2, [500, 100, 50]], [2, [500, 200, 100, 20, 10]],
      [3, [100, 100, 50, 50, 20, 20, 10, 10]], [3, [100, 50, 50, 20, 20, 20, 10, 10, 5, 5]], [3, [200, 100, 100, 50, 20, 20, 10, 5]],
      [3, [200, 200, 100, 100, 50, 20, 20, 10, 5]], [3, [500, 200, 200, 100, 50, 50, 20, 10, 5]], [3, [500, 500, 100, 100, 50, 20, 20, 10]]
    ] },
    noten: { praefix: 'n', liste: [
      [1, [1000, 500]], [1, [1000, 1000, 500]], [1, [2000, 1000]], [1, [2000, 1000, 500]], [1, [5000, 1000]], [1, [5000, 1000, 500, 200]],
      [1, [5000, 2000]], [1, [5000, 2000, 1000]],
      [2, [2000, 2000, 1000, 500, 100, 50]], [2, [5000, 2000, 1000, 500, 200]], [2, [5000, 2000, 2000, 200, 100, 100]],
      [2, [10000, 2000, 500, 200, 100, 50]], [2, [5000, 5000, 2000, 1000, 200]], [2, [10000, 2000, 1000, 200, 100]],
      [2, [10000, 5000, 1000, 1000, 500]], [2, [20000, 5000, 2000, 500]],
      [3, [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5]], [3, [10000, 10000, 5000, 2000, 2000, 500, 200, 100]],
      [3, [20000, 10000, 10000, 5000, 2000, 1000, 200, 100, 50, 20]], [3, [20000, 20000, 10000, 5000, 2000, 500]],
      [3, [20000, 10000, 5000, 2000, 1000, 500, 200]], [3, [20000, 20000, 10000, 2000, 1000, 100, 50]]
    ] }
  };

  /** Lösungsweg: erst die Franken, dann die Rappen, dann zusammen. Jeder Schritt rechnet nur mit gleichen Einheiten. */
  function schritte(stuecke) {
    const fr = stuecke.filter(w => w >= 100), rp = stuecke.filter(w => w < 100), F = summe(fr) / 100, R = summe(rp), s = [];
    if (fr.length) s.push(fr.length === 1 ? `Franken: ${F} Fr.` : `Franken: ${fr.map(w => w / 100).join(' + ')} = ${F} Fr.`);
    if (rp.length) s.push(rp.length === 1 ? `Rappen: ${R} Rp.` : `Rappen: ${rp.join(' + ')} = ${R} Rp.`);
    if (fr.length && rp.length) s.push(`Zusammen: ${F} Fr. + ${R} Rp. = ${betragText(summe(stuecke))}`);
    return s;
  }

  L.generator('mathe-groessen/geld-betraege', {
    pool(params) {
      const name = params && params.bestand, bestand = typeof name === 'string' && Object.hasOwn(BESTAND, name) ? BESTAND[name] : null;
      if (!bestand) throw new Error(`mathe-groessen/geld-betraege: params.bestand muss einer von ${Object.keys(BESTAND).join(', ')} sein`);
      return bestand.liste.map(([schwierigkeit, stuecke]) => {
        const rappen = summe(stuecke);
        return {
          id: `${bestand.praefix}${rappen}`,
          form: 'betrag',
          inhalt: { rappen, stuecke },
          schwierigkeit,
          hilfe: { weg: 'geld-zaehlen', schritte: schritte(stuecke) }
        };
      });
    },

    /** antwort: { rappen } (Zählen: der geschriebene Betrag, Legen: die Summe der gelegten Stücke). Typische Fehler des Typs («rappen-als-franken» und Verwandte) meldet der Typ selbst. */
    diagnose(auf, antwort) {
      const { rappen: soll, stuecke } = auf.inhalt, z = antwort && antwort.rappen;
      if (z === soll) return null;
      if (!Number.isInteger(z)) return 'sonstige';
      if (stuecke.some(w => z === soll - w || z === soll + w)) return 'stueck-vergessen';        // ein Stück vergessen oder doppelt gezählt
      if (B.ziffernVertauscht(z, soll)) return 'ziffern-vertauscht';
      return 'sonstige';
    }
  });
})(globalThis);
