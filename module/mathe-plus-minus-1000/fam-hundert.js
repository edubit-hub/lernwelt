/* module/mathe-plus-minus-1000/fam-hundert.js: Aufgabenfamilien der Grundlage bis 100: Themen «plus-100», «minus-100» und «luecken-100».
   Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen (_gemeinsam/familien). Reine Berechnung, Zufall nur über den rng.
   Die Wege (Schritte und Rechenstrich) kommen aus _gemeinsam/rechenweg. Bei Aufgaben der Form «rechnung» sind a und b die Zahlen der Rechnung,
   bei den Lückensätzen stehen art, a, b und c im inhalt, damit die Diagnose und der Test wissen, was gesucht ist. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, W = L.registry.bausteine.get('_gemeinsam/rechenweg'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!W || !F) throw new Error('mathe-plus-minus-1000: die Bausteine «_gemeinsam/rechenweg» und «_gemeinsam/familien» fehlen (modul.js, braucht).');
  const { ziehe, hilfe, luecke: lk } = W, MINUS = '−';

  /** Familie der Form «rechnung»: zahlen(rng) gibt [a, b], weg(a, b) einen Weg des Bausteins, name ist der Schlüssel in wege (modul.js). */
  const rf = (id, s, op, zahlen, name, weg, diag, braucht) => ({ id, s, form: 'rechnung', braucht, diag, mach(rng) {
    const [a, b] = zahlen(rng);
    return { inhalt: W.rechnung(a, op, b, `${a} ${op} ${b}`), hilfe: hilfe(name, weg(a, b)) };
  } });
  /** Familie der Form «satz» (Lückentext): mach(rng) gibt { inhalt, hilfe }. */
  const sf = (id, s, mach, diag, braucht) => ({ id, s, form: 'satz', braucht, diag, mach });

  const einer = (a, b) => W.kette(a, [b]);                                // ein einziger Sprung
  const tausch = (a, b) => { const k = W.plusUeber(b, a); return { ...k, schritte: [`${a} + ${b} = ${b} + ${a}`, ...k.schritte] }; };
  const erg = (a, b) => W.ergaenzen(b, a);                                // a − b durch Ergänzen von b bis a

  // ---- plus-100: Addieren im Hunderterraum ohne Zählen --------------------------------------------------------
  const plus = W.zahlDiag('+');
  const PLUS = [
    rf('p100-ze', 1, '+', r => ziehe(r, [[11, 89], [2, 8]], (a, b) => a % 10 >= 1 && a % 10 + b <= 9), 'schrittweise', einer, plus),
    rf('p100-bis-zehner', 1, '+', r => { const [a] = ziehe(r, [[11, 89]], x => x % 10 !== 0); return [a, 10 - a % 10]; }, 'ueber-zehner', einer, plus),
    rf('p100-zz', 1, '+', r => ziehe(r, [[11, 59], [10, 40, 10]]), 'schrittweise', einer, plus),
    rf('p100-zz-ohne', 1, '+', r => ziehe(r, [[11, 79], [11, 88]], (a, b) => a % 10 >= 1 && b % 10 >= 1 && a % 10 + b % 10 <= 9 && a + b <= 99), 'schrittweise', W.schrittweise, plus),
    rf('p100-ue', 2, '+', r => ziehe(r, [[12, 89], [2, 9]], (a, b) => a % 10 + b >= 11 && a + b <= 99), 'ueber-zehner', W.plusUeber, plus, ['p100-bis-zehner']),
    rf('p100-eu', 2, '+', r => ziehe(r, [[2, 9], [12, 89]], (a, b) => b % 10 + a >= 11 && a + b <= 99), 'ueber-zehner', tausch, plus, ['p100-ue']),
    rf('p100-zz-ue', 3, '+', r => ziehe(r, [[12, 79], [12, 87]], (a, b) => a % 10 + b % 10 >= 11 && a + b <= 99), 'ueber-zehner', W.plusUeber, plus, ['p100-ue', 'p100-zz-ohne']),
    rf('p100-fast-doppel', 2, '+', r => { const [n, k] = ziehe(r, [[12, 48], [1, 3]]); return [n, n + k]; }, 'doppelt', (a, b) => W.doppel(a, b - a), plus, ['p100-zz-ohne'])
  ];

  // ---- minus-100: Subtrahieren im Hunderterraum ohne Zählen ---------------------------------------------------
  const minus = W.zahlDiag(MINUS), minusErg = W.zahlDiag(MINUS, (z, c, i) => W.sprungVergessen(z, i.a, i.b) && 'sprung-vergessen');
  const MINUS100 = [
    rf('m100-ze', 1, MINUS, r => ziehe(r, [[21, 99], [1, 8]], (a, b) => a % 10 > b), 'abziehen', (a, b) => W.kette(a, [-b]), minus),
    rf('m100-bis-zehner', 1, MINUS, r => { const [a] = ziehe(r, [[21, 99]], x => x % 10 !== 0); return [a, a % 10]; }, 'ueber-zehner', (a, b) => W.kette(a, [-b]), minus),
    rf('m100-zz', 1, MINUS, r => ziehe(r, [[31, 99], [10, 70, 10]], (a, b) => a - b >= 10), 'abziehen', (a, b) => W.kette(a, [-b]), minus),
    rf('m100-zz-ohne', 1, MINUS, r => ziehe(r, [[31, 99], [11, 88]], (a, b) => b % 10 >= 1 && a % 10 > b % 10 && a - b >= 10), 'abziehen', W.abziehen, minus),
    rf('m100-ue', 2, MINUS, r => ziehe(r, [[21, 99], [2, 9]], (a, b) => a % 10 >= 1 && a % 10 < b), 'ueber-zehner', W.minusUeber, minus, ['m100-bis-zehner']),
    rf('m100-zz-ue', 3, MINUS, r => ziehe(r, [[32, 99], [12, 89]], (a, b) => a % 10 >= 1 && a % 10 < b % 10 && a - b >= 5), 'abziehen', W.minusUeber, minus, ['m100-ue', 'm100-zz-ohne']),
    rf('m100-von-hundert', 2, MINUS, r => { const [b] = ziehe(r, [[11, 89]], x => x % 10 !== 0); return [100, b]; }, 'ergaenzen', erg, minusErg),
    rf('m100-nah', 2, MINUS, r => {                                     // die Zahlen liegen nah beieinander und der Abstand geht über einen Zehner: Ergänzen bietet sich an
      const [a, d] = ziehe(r, [[31, 99], [5, 19]], (x, y) => (x - y) % 10 !== 0 && Math.floor(x / 10) > Math.floor((x - y) / 10) && W.ergaenzSpruenge(x - y, x).length > 1);
      return [a, a - d];
    }, 'ergaenzen', erg, minusErg, ['m100-bis-zehner'])
  ];

  // ---- luecken-100: ergänzen, Platzhalter und Umkehraufgabe ----------------------------------------------------
  /** Regeln für die Lücken der Sätze dieses Themas (z Eingabe, c Lösung der Lücke). */
  const lueckenRegel = (z, c, i) => {
    if (['fehlt-plus', 'fehlt-minus'].includes(i.art) && z === i.c) return 'zielzahl-eingesetzt';      // die Zielzahl steht in der Lücke statt des fehlenden Teils
    if (['fehlt-plus', 'fehlt-minus'].includes(i.art) && z === i.a + i.c) return 'rechenzeichen-verwechselt';
    if (i.art === 'start-plus' && z === i.c + i.b) return 'rechenzeichen-verwechselt';
    if (i.art === 'start-minus' && z === Math.abs(i.c - i.b)) return 'rechenzeichen-verwechselt';
    if (i.art === 'umkehr' && z === i.a + i.b) return 'rechenzeichen-verwechselt';
    return null;
  };
  const luecken = W.lueckenDiag(lueckenRegel);
  const fehltPlus = (id, s, braucht, zahlen) => sf(id, s, rng => {
    const [a, c] = zahlen(rng);
    return { inhalt: { text: `${a} + ${lk(c - a)} = ${c}`, art: 'fehlt-plus', a, b: c - a, c }, hilfe: hilfe('ergaenzen', W.ergaenzen(a, c), false) };
  }, luecken, braucht);

  const LUECKEN = [
    fehltPlus('l100-bis-zehner', 1, undefined, r => { const [a] = ziehe(r, [[11, 89]], x => x % 10 !== 0); return [a, a + 10 - a % 10]; }),
    fehltPlus('l100-auf-100', 1, undefined, r => [ziehe(r, [[11, 89]])[0], 100]),
    fehltPlus('l100-plus-fehlt', 2, ['l100-auf-100'], r => { const [a, x] = ziehe(r, [[11, 79], [11, 60]], (p, q) => p + q <= 99); return [a, a + x]; }),
    sf('l100-minus-fehlt', 2, r => {
      const [a, x] = ziehe(r, [[31, 99], [11, 60]], (p, q) => p - q >= 11), c = a - x;
      return { inhalt: { text: `${a} ${MINUS} ${lk(x)} = ${c}`, art: 'fehlt-minus', a, b: x, c }, hilfe: hilfe('ergaenzen', W.ergaenzen(c, a), false) };
    }, luecken, ['l100-auf-100']),
    sf('l100-umkehr', 2, r => {
      const [a, b] = ziehe(r, [[31, 99], [11, 88]], (p, q) => p - q >= 11), c = a - b;
      return { inhalt: { text: `${a} ${MINUS} ${b} = ${lk(c)}, weil ${b} + ${lk(c)} = ${a}`, art: 'umkehr', a, b, c },
        hilfe: hilfe('umkehren', { schritte: [`${a} ${MINUS} ${b} = ${c}`, `${b} + ${c} = ${a}`] }, false) };
    }, luecken, ['l100-minus-fehlt']),
    sf('l100-start-plus', 3, r => {
      const [c, b] = ziehe(r, [[31, 99], [11, 88]], (p, q) => p - q >= 11), x = c - b;
      return { inhalt: { text: `${lk(x)} + ${b} = ${c}`, art: 'start-plus', a: x, b, c },
        hilfe: hilfe('umkehren', { schritte: [`${c} ${MINUS} ${b} = ${x}`, `${x} + ${b} = ${c}`] }, false) };
    }, luecken, ['l100-plus-fehlt']),
    sf('l100-start-minus', 3, r => {
      const [b, c] = ziehe(r, [[11, 60], [11, 88]], (p, q) => p + q <= 99), x = c + b;
      return { inhalt: { text: `${lk(x)} ${MINUS} ${b} = ${c}`, art: 'start-minus', a: x, b, c },
        hilfe: hilfe('umkehren', { schritte: [`${c} + ${b} = ${x}`, `${x} ${MINUS} ${b} = ${c}`] }, false) };
    }, luecken, ['l100-minus-fehlt']),
    sf('l100-umgruppieren', 3, r => {
      const [a, b] = ziehe(r, [[12, 48], [12, 49]], (p, q) => p % 10 !== 0 && q > 10 - p % 10 + 1 && p + q <= 99), k = W.ueberEinheit(a, b, 10);
      return { inhalt: { text: `${a} + ${b}: ${k.folge.map(([v, s, n]) => `${v} + ${lk(s)} = ${n}`).join(', ')}`, art: 'umgruppieren', a, b, c: a + b, folge: k.folge },
        hilfe: hilfe('ueber-zehner', k, false) };
    }, luecken, ['l100-bis-zehner'])
  ];

  L.generator('mathe-plus-minus-1000/plus-100', F.bauen('mathe-plus-minus-1000/plus-100', PLUS, plus, W.voraus(PLUS)));
  L.generator('mathe-plus-minus-1000/minus-100', F.bauen('mathe-plus-minus-1000/minus-100', MINUS100, minus, W.voraus(MINUS100)));
  L.generator('mathe-plus-minus-1000/luecken-100', F.bauen('mathe-plus-minus-1000/luecken-100', LUECKEN, undefined, W.voraus(LUECKEN)));
})(globalThis);
