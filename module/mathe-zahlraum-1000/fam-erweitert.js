/* module/mathe-zahlraum-1000/fam-erweitert.js: Aufgabenfamilien des Themas «erweitert-1000» (Zahlen über 1000 mit Tausendern).
   Das Thema ist für das Kind aus, bis die Eltern es einschalten: Der Raum über 1000 gehört in den erweiterten Anforderungen dazu
   (modul.js, themen, geltung). Form «rechnung»: a, b, op und ergebnis rechnen immer auf. Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const R = Z.rechnung, zw = Z.zwischen, V = Z.vielfaches, MINUS = '−';
  const hilfe = (weg, schritte, hilfsmittel) => ({ weg, schritte, ...(hilfsmittel ? { hilfsmittel } : {}) });
  const tafel = (t, h, z, e) => ({ name: 'stellenwerttafel', daten: { t, h, z, e } });
  const teile = (t, h, z, e) => [[t, 1000, 'T'], [h, 100, 'H'], [z, 10, 'Z'], [e, 1, 'E']].filter(([x]) => x);
  const einheiten = (t, h, z, e) => teile(t, h, z, e).map(([x, w, b]) => `${x} ${b} = ${x * w}`);
  const summe = (t, h, z, e) => `${teile(t, h, z, e).map(([x, w]) => x * w).join(' + ')} = ${t * 1000 + h * 100 + z * 10 + e}`;
  const nachbar = (id, op, text) => ({ id, s: 2, form: 'rechnung', mach(rng) {
    const n = op === '+' ? V(rng, 100, 1100, 4900) - 1 : V(rng, 100, 1100, 5000);
    return { inhalt: R(n, op, 1, `${text} ${n}`, { art: 'nachbar' }), hilfe: hilfe('nachbarn', [`${n} ${op} 1 = ${op === '+' ? n + 1 : n - 1}`]) };
  } });

  const familien = [
    { id: 'ew-thze', s: 2, form: 'rechnung', mach(rng) {
      const t = zw(rng, 1, 4), h = zw(rng, 1, 9), z = zw(rng, 1, 9), e = zw(rng, 1, 9);
      return { inhalt: R(t * 1000 + h * 100 + z * 10, '+', e, `${t} T + ${h} H + ${z} Z + ${e} E`, { t, h, z, e }), hilfe: hilfe('stellen-tausend', [...einheiten(t, h, z, e), summe(t, h, z, e)], tafel(t, h, z, e)) };
    } },
    { id: 'ew-null', s: 3, form: 'rechnung', mach(rng) {                // leere Stellen: die Null hält den Platz
      const t = zw(rng, 1, 9), [h, z, e] = [[zw(rng, 1, 9), 0, zw(rng, 1, 9)], [0, zw(rng, 1, 9), 0], [0, 0, zw(rng, 1, 9)]][rng.int(3)];
      const text = teile(t, h, z, e).map(([x, , b]) => `${x} ${b}`).join(' + ');
      return { inhalt: R(t * 1000 + h * 100 + z * 10, '+', e, text, { t, h, z, e }), hilfe: hilfe('stellen-tausend', ['Eine leere Stelle bekommt eine 0.', summe(t, h, z, e)], tafel(t, h, z, e)) };
    } },
    nachbar('ew-nachfolger', '+', 'Nachfolger von'), nachbar('ew-vorgaenger', MINUS, 'Vorgänger von'),
    { id: 'ew-hunderter-mehr', s: 2, form: 'rechnung', mach(rng) {
      const n = V(rng, 50, 900, 1900);
      return { inhalt: R(n, '+', 100, `100 mehr als ${n}`, { art: 'schritt' }), hilfe: hilfe('nachbarn', [`${n} + 100 = ${n + 100}`]) };
    } },
    { id: 'ew-hunderter-anzahl', s: 2, form: 'rechnung', mach(rng) {
      const n = V(rng, 100, 1100, 4900);
      return { inhalt: R(n, ':', 100, `Hunderter in ${n}`, { art: 'anzahl' }), hilfe: hilfe('stellen-tausend', ['1 H = 100', `${n} : 100 = ${n / 100}`]) };
    } },
    { id: 'ew-ergaenzen', s: 3, form: 'rechnung', mach(rng) {
      const start = V(rng, 50, 1050, 1950), oben = Math.ceil(start / 100) * 100;
      const zweiteilig = oben > start && oben < 2000, spruenge = zweiteilig ? [oben - start, 2000 - oben] : [2000 - start];
      const schritte = zweiteilig ? [`${start} + ${oben - start} = ${oben}`, `${oben} + ${2000 - oben} = 2000`, `${oben - start} + ${2000 - oben} = ${2000 - start}`] : [`${start} + ${2000 - start} = 2000`];
      return { inhalt: R(2000, MINUS, start, `Ergänzung von ${start} auf 2000`, { art: 'ergaenzen' }), hilfe: hilfe('ergaenzen', schritte, { name: 'rechenstrich', daten: { start, spruenge } }) };
    } },
    { id: 'ew-doppelt', s: 3, form: 'rechnung', mach(rng) {
      const n = zw(rng, 6, 25) * 100;
      return { inhalt: R(n, '·', 2, `Doppeltes von ${n}`, { art: 'doppelt' }), hilfe: hilfe('verdoppeln', [`${n} + ${n} = ${2 * n}`]) };
    } }
  ];

  L.generator('mathe-zahlraum-1000/erweitert-1000', F.bauen('mathe-zahlraum-1000/erweitert-1000', familien, F.zahlDiag(
    (z, c) => c >= 1000 && z > 0 && z === c % 1000 && 'tausender-fehlt',
    (z, c) => Z.nullVergessen(z, c) && 'null-vergessen',
    (z, c) => (Z.abstand(z, c) === 100 ? 'hunderter-daneben' : Z.abstand(z, c) === 10 ? 'zehner-daneben' : null)),
    { 'ew-null': ['ew-thze'], 'ew-vorgaenger': ['ew-nachfolger'], 'ew-hunderter-anzahl': ['ew-thze'], 'ew-ergaenzen': ['ew-hunderter-mehr'], 'ew-doppelt': ['ew-hunderter-anzahl'] }));
})(globalThis);
