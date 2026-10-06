/* module/mathe-zahlraum-1000/fam-zahlwoerter.js: Aufgabenfamilien des Themas «zahlwoerter» (Zahlwort lesen, Ziffern schreiben).
   Nur die Zahlen von 200 bis 999: ob das Lehrmittel für 100 bis 199 «hundert» oder «einhundert» schreibt, ist offen (README, TODO).
   Die Aufgabe zeigt das Zahlwort, das Kind tippt die Zahl. a ist die Zahl, b eine 0, ergebnis gleich a. Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const zw = Z.zwischen, TRENNER = '­';
  /** Das Zahlwort für die Anzeige: nach «hundert» steht eine Trennstelle (weiches Trennzeichen), wenn noch etwas folgt. Das lange Wort
      («neunhundertachtundneunzig») passt sonst neben dem Zahlenfeld nicht in die Zeile, der Typ «eingabe» bricht von sich aus nirgends um. */
  const anzeige = wort => wort.replace(/hundert(?=.)/, `hundert${TRENNER}`);

  /** Eine Familie: zahl(rng) liefert die Zahl, das Zahlwort wird daraus gebaut. */
  function familie(id, s, zahl) {
    return { id, s, form: 'rechnung', mach(rng) {
      const n = zahl(rng), h = Math.floor(n / 100) * 100, r = n % 100, wort = Z.zahlwort(n), { z, e } = Z.stellen(n);
      const schritte = r === 0 ? [`${wort} = ${n}`] : [`${Z.zahlwort(h)} = ${h}`, `${Z.zahlwort(r)} = ${r}`,
        ...(r > 20 && e > 0 ? [`Bei «${Z.zahlwort(r)}» kommt zuerst der Einer (${e}), dann der Zehner (${z * 10}).`] : []), `${h} + ${r} = ${n}`];
      return { inhalt: Z.rechnung(n, '+', 0, anzeige(wort), { art: 'wort' }),
        hilfe: { weg: 'zahlwort', schritte, hilfsmittel: { name: 'stellenwerttafel', daten: { h: h / 100, z, e, zeige: 'plaettchen' } } } };
    } };
  }

  const hund = rng => zw(rng, 2, 9) * 100;
  const familien = [
    familie('zw-h', 1, hund),
    familie('zw-he', 1, rng => hund(rng) + zw(rng, 1, 9)),
    familie('zw-hz', 2, rng => hund(rng) + zw(rng, 2, 9) * 10),
    familie('zw-zehn', 2, rng => hund(rng) + zw(rng, 10, 19)),
    familie('zw-klein', 2, rng => hund(rng) + zw(rng, 2, 5) * 10 + zw(rng, 2, 9)),
    familie('zw-gross', 3, rng => hund(rng) + zw(rng, 6, 9) * 10 + zw(rng, 2, 9)),
    familie('zw-eins', 2, rng => hund(rng) + (rng.int(2) ? 1 : zw(rng, 2, 9) * 10 + 1)),                   // Einer 1: «dreihunderteins», «zweihunderteinundvierzig»
    familie('zw-misch', 3, rng => zw(rng, 200, 999))
  ];

  const zuerst = { 'zw-he': ['zw-h'], 'zw-hz': ['zw-h'], 'zw-zehn': ['zw-hz'], 'zw-klein': ['zw-hz', 'zw-he'], 'zw-gross': ['zw-klein'], 'zw-eins': ['zw-klein'], 'zw-misch': ['zw-gross', 'zw-eins', 'zw-zehn'] };
  L.generator('mathe-zahlraum-1000/zahlwoerter', F.bauen('mathe-zahlraum-1000/zahlwoerter', familien, F.zahlDiag(
    (z, c) => Z.einerZehnerVertauscht(z, c) && 'zehner-einer-vertauscht',
    (z, c) => Z.nullVergessen(z, c) && 'null-vergessen',
    (z, c) => Z.hunderterWeg(z, c) && 'hunderter-weg'), zuerst));
})(globalThis);
