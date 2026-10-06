/* module/mathe-plus-minus-1000/fam-schriftlich.js: Aufgabenfamilien des Themas «schriftlich-add» (Zahlen untereinander addieren, Stelle für Stelle).
   Das Thema ist standardmässig aus (modul.js: aktiv false, geltung): Nur Mathwelt 2 und die Ausgabe 2017 des Zahlenbuchs führen die schriftliche
   Addition schon in der 3. Klasse ein, die Neuausgabe des Zahlenbuchs erst in der 4. Klasse (R44, README). Schreibweise und Sprechweise des Verfahrens
   sind ungeprüft. Darum steht hier nur die Rechnung je Stelle («Einer: 8 + 5 = 13»), ohne Wörter wie «übertragen» oder «merken».
   Die schriftliche Subtraktion fehlt mit Absicht (TODO, README): Ob die Klasse abzieht oder ergänzt, hängt vom Lehrmittel ab.
   Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen (_gemeinsam/familien). Reine Berechnung, Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, W = L.registry.bausteine.get('_gemeinsam/rechenweg'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!W || !F) throw new Error('mathe-plus-minus-1000: die Bausteine «_gemeinsam/rechenweg» und «_gemeinsam/familien» fehlen (modul.js, braucht).');
  const { ziehe, hilfe } = W;

  const plus = W.zahlDiag('+');
  /** uebergaenge: [aus den Einern, aus den Zehnern] als 0 oder 1, damit eine Familie sagen kann, wo es Reste gibt. */
  const sa = (id, s, zahlen, ok, braucht) => ({ id, s, form: 'rechnung', braucht, diag: plus, mach(rng) {
    const [a, b] = ziehe(rng, zahlen, (p, q) => p + q <= 999 && ok(p, q, W.spaltenAdd(p, q).uebergaenge));
    return { inhalt: W.rechnung(a, '+', b, `${a} + ${b}`), hilfe: hilfe('schriftlich-add', W.spaltenAdd(a, b)) };
  } });
  const drei = [[101, 799], [101, 799]];

  const SA = [
    sa('sa-ohne', 1, drei, (a, b, u) => u[0] === 0 && u[1] === 0),
    sa('sa-e', 1, drei, (a, b, u) => u[0] === 1 && u[1] === 0, ['sa-ohne']),
    sa('sa-z', 2, drei, (a, b, u) => u[0] === 0 && u[1] === 1, ['sa-ohne']),
    sa('sa-ez', 2, drei, (a, b, u) => u[0] === 1 && u[1] === 1, ['sa-e', 'sa-z']),
    sa('sa-zwei-drei', 2, [[11, 99], [101, 899]], (a, b, u) => u[0] + u[1] >= 1, ['sa-e']),
    sa('sa-null', 3, drei, (a, b, u) => (String(a).includes('0') || String(b).includes('0')) && u[0] + u[1] >= 1, ['sa-ez']),
    sa('sa-kette', 3, drei, (a, b, u) => u[0] === 1 && u[1] === 1 && Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10 === 9, ['sa-ez']),
    sa('sa-nah-tausend', 3, [[301, 799], [201, 699]], (a, b, u) => a + b >= 900, ['sa-ez'])
  ];

  L.generator('mathe-plus-minus-1000/schriftlich-add', F.bauen('mathe-plus-minus-1000/schriftlich-add', SA, plus, W.voraus(SA)));
})(globalThis);
