/* module/mathe-zahlraum-1000/fam-rechnen.js: Aufgabenfamilien der Themen «ergaenzen» (Ergänzen auf 100 und 1000) und «verdoppeln-halbieren».
   Form «rechnung»: a, b, op und ergebnis rechnen immer auf (Ergänzung von 760 auf 1000 ist 1000 − 760). Der Text sagt die Aufgabe als Ausdruck,
   den der Typ «eingabe» mit « = ?» zeigt. Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen. Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const R = Z.rechnung, zw = Z.zwischen, MINUS = '−';
  const hilfe = (weg, schritte, hilfsmittel) => ({ weg, schritte, ...(hilfsmittel ? { hilfsmittel } : {}) });
  const feld = (zahl, wegnehmen = 0) => ({ name: 'hunderterfeld', daten: { zahl, wegnehmen } });
  const oberH = n => Math.ceil(n / 100) * 100, oberZ = n => Math.ceil(n / 10) * 10;      // nächster voller Hunderter oder Zehner (bei n selbst: n)
  const ohne = (rng, min, max, nicht) => { let n; do { n = zw(rng, min, max); } while (nicht(n)); return n; };

  /** Weg über Stationen: start + a = s1, s1 + b = s2, …, am Ende die Summe der Teile. Die Teile sind die Sprünge für den Rechenstrich.
      Stationen ausserhalb von start bis ziel entfallen. */
  function ueber(start, ziel, ...stationen) {
    const punkte = [start, ...[...new Set(stationen)].filter(p => p > start && p < ziel).sort((a, b) => a - b), ziel], teile = punkte.slice(1).map((p, k) => p - punkte[k]);
    return { spruenge: teile,
      schritte: [...teile.map((t, k) => `${punkte[k]} + ${t} = ${punkte[k + 1]}`), ...(teile.length > 1 ? [`${teile.join(' + ')} = ${ziel - start}`] : [])] };
  }

  /* ---------- Ergänzen ---------- */
  function ergaenzen(id, s, aufgabe) {                              // aufgabe(rng) → { start, ziel, stationen, hilfsmittel }; ohne Hilfsmittel zeigt der Rechenstrich die Sprünge
    return { id, s, form: 'rechnung', mach(rng) {
      const { start, ziel, stationen = [], hilfsmittel } = aufgabe(rng), w = ueber(start, ziel, ...stationen);
      return { inhalt: R(ziel, MINUS, start, `Ergänzung von ${start} auf ${ziel}`, { art: 'ergaenzen' }),
        hilfe: hilfe('ergaenzen', w.schritte, hilfsmittel || { name: 'rechenstrich', daten: { start, spruenge: w.spruenge } }) };
    } };
  }
  const plan = (start, ziel, hilfsmittel, stationen) => ({ start, ziel, stationen, hilfsmittel });

  const ergaenzenFamilien = [
    ergaenzen('er-z-100', 1, rng => { const start = zw(rng, 1, 9) * 10; return plan(start, 100, feld(100, 100 - start), []); }),
    ergaenzen('er-h-1000', 1, rng => { const start = zw(rng, 1, 9) * 100; return plan(start, 1000, null, []); }),
    ergaenzen('er-fuenfzig-1000', 2, rng => { const start = zw(rng, 0, 9) * 100 + 50; return plan(start, 1000, null, [oberH(start)]); }),
    ergaenzen('er-z-1000', 2, rng => { const start = ohne(rng, 11, 99, n => n % 5 === 0) * 10; return plan(start, 1000, null, [oberH(start)]); }),
    ergaenzen('er-naechster-h', 2, rng => { const start = zw(rng, 1, 9) * 100 + zw(rng, 1, 9) * 10; return plan(start, oberH(start), null, []); }),
    ergaenzen('er-naechster-z', 1, rng => { const start = zw(rng, 10, 99) * 10 + zw(rng, 1, 9); return plan(start, oberZ(start), null, []); }),
    ergaenzen('er-e-1000', 3, rng => {                               // Zehner höchstens 8: der nächste Zehner liegt vor dem nächsten Hunderter
      const start = zw(rng, 1, 8) * 100 + zw(rng, 0, 8) * 10 + zw(rng, 1, 9);
      return plan(start, 1000, null, [oberZ(start), oberH(start)]);
    }),
    ergaenzen('er-zwischen', 3, rng => {
      const h = zw(rng, 1, 7), start = h * 100 + zw(rng, 1, 9) * 10;
      return plan(start, (h + zw(rng, 1, 2)) * 100 + zw(rng, 1, 9) * 10, null, [oberH(start)]);
    })
  ];

  const uebliche = [(z, c) => Z.einerZehnerVertauscht(z, c) && 'zehner-einer-vertauscht', (z, c) => Z.nullVergessen(z, c) && 'null-vergessen'];
  const nah = (z, c) => (Z.abstand(z, c) === 100 ? 'hunderter-daneben' : Z.abstand(z, c) === 10 ? 'zehner-daneben' : null);

  L.generator('mathe-zahlraum-1000/ergaenzen', F.bauen('mathe-zahlraum-1000/ergaenzen', ergaenzenFamilien, F.zahlDiag(
    (z, c, i) => (z === i.a || z === i.b) && 'ziel-statt-ergaenzung', nah, ...uebliche),
    { 'er-h-1000': ['er-z-100'], 'er-fuenfzig-1000': ['er-h-1000'], 'er-z-1000': ['er-fuenfzig-1000'], 'er-naechster-h': ['er-z-100'], 'er-e-1000': ['er-naechster-z', 'er-z-1000'], 'er-zwischen': ['er-naechster-h'] }));

  /* ---------- Verdoppeln und Halbieren ---------- */
  const familie = (art, id, s, zahl, schritte, hilfsmittel) => ({ id, s, form: 'rechnung', mach(rng) {
    const n = zahl(rng);
    return { inhalt: art === 'doppelt' ? R(n, '·', 2, `Doppeltes von ${n}`, { art }) : R(n, ':', 2, `Hälfte von ${n}`, { art }),
      hilfe: hilfe('verdoppeln', schritte(n), hilfsmittel && hilfsmittel(n)) };
  } });
  const doppelt = (...a) => familie('doppelt', ...a), haelfte = (...a) => familie('haelfte', ...a);
  const selbst = n => [`${n} + ${n} = ${2 * n}`];
  const zerlegt = n => { const rest = n % 100, hh = n - rest; return rest && hh ? [`${hh} + ${hh} = ${2 * hh}`, `${rest} + ${rest} = ${2 * rest}`, `${2 * hh} + ${2 * rest} = ${2 * n}`] : selbst(n); };
  const halb = (n, teil) => { const a = n - n % teil, b = n % teil; if (!b) return [`${n} : 2 = ${n / 2}`]; return [`${a} : 2 = ${a / 2}`, `${b} : 2 = ${b / 2}`, `${a / 2} + ${b / 2} = ${n / 2}`]; };

  /** Ab 0.2.0. Mehrmals verdoppeln oder halbieren: «Dreimal verdoppeln: 15» ergibt 120, «Dreimal halbieren: 960» ergibt 120. ks nennt die möglichen Male,
      m(rng, k) liefert die Zahl, mit der die Kette beginnt (beim Verdoppeln) oder endet (beim Halbieren). Nichts wird grösser als 1000. */
  const MAL = { 2: 'Zweimal', 3: 'Dreimal', 4: 'Viermal', 5: 'Fünfmal', 6: 'Sechsmal' };
  const mehrmals = (art, id, s, ks, kleinste) => ({ id, s, form: 'rechnung', mach(rng) {
    const k = rng.waehle(ks), f = 2 ** k, m = zw(rng, kleinste, Math.floor(1000 / f)), grosse = m * f;
    const reihe = Array.from({ length: k + 1 }, (_, j) => m * 2 ** j), weg = art === 'doppelt' ? reihe : [...reihe].reverse();
    const schritte = weg.slice(1).map((w, j) => (art === 'doppelt' ? `${weg[j]} · 2 = ${w}` : `${weg[j]} : 2 = ${w}`));
    return { inhalt: art === 'doppelt' ? R(m, '·', f, `${MAL[k]} verdoppeln: ${m}`, { art, mal: k }) : R(grosse, ':', f, `${MAL[k]} halbieren: ${grosse}`, { art, mal: k }),
      hilfe: hilfe('verdoppeln', schritte) };
  } });

  const doppelnFamilien = [
    doppelt('vd-bis-20', 1, rng => zw(rng, 3, 20), selbst, n => feld(2 * n)),
    doppelt('vd-bis-50', 2, rng => zw(rng, 21, 50), n => { const z = n - n % 10, e = n % 10; if (!e) return selbst(n); return [`${z} + ${z} = ${2 * z}`, `${e} + ${e} = ${2 * e}`, `${2 * z} + ${2 * e} = ${2 * n}`]; }, n => feld(2 * n)),
    doppelt('vd-zehner', 1, rng => zw(rng, 1, 4) * 10, selbst, n => feld(2 * n)),
    doppelt('vd-zehner-ue', 2, rng => zw(rng, 5, 9) * 10, selbst),
    doppelt('vd-zehner-gross', 2, rng => ohne(rng, 11, 49, n => n % 10 === 0) * 10, zerlegt),
    doppelt('vd-hunderter', 1, rng => zw(rng, 1, 5) * 100, selbst),
    haelfte('hb-bis-40', 1, rng => zw(rng, 2, 20) * 2, n => [`${n / 2} + ${n / 2} = ${n}`], n => feld(n)),
    haelfte('hb-bis-100', 2, rng => zw(rng, 21, 49) * 2, n => halb(n, 10), n => feld(n)),
    haelfte('hb-zehner', 2, rng => ohne(rng, 6, 49, n => n % 5 === 0) * 20, n => halb(n, 100)),
    haelfte('hb-zehner-ungerade', 3, rng => (zw(rng, 5, 49) * 2 + 1) * 10, n => [`${n - 10} : 2 = ${(n - 10) / 2}`, '10 : 2 = 5', `${(n - 10) / 2} + 5 = ${n / 2}`]),
    haelfte('hb-hunderter', 2, rng => zw(rng, 1, 10) * 100, n => ['Rechne mit den Hundertern: Die Hälfte von 100 ist 50.', `${n} : 2 = ${n / 2}`]),
    /* ab 0.2.0: das Doppelte mit Übertrag über den Hunderter und mehrmals verdoppeln oder halbieren */
    doppelt('vd-uebertrag', 2, rng => zw(rng, 1, 4) * 100 + zw(rng, 5, 9) * 10, zerlegt),
    mehrmals('doppelt', 'vd-zweimal', 2, [2], 3), mehrmals('doppelt', 'vd-dreimal', 3, [3], 3), mehrmals('doppelt', 'vd-kette', 3, [4, 5, 6], 3),
    mehrmals('haelfte', 'hb-zweimal', 2, [2], 3), mehrmals('haelfte', 'hb-dreimal', 3, [3], 3), mehrmals('haelfte', 'hb-kette', 3, [4, 5, 6], 3)
  ];

  L.generator('mathe-zahlraum-1000/verdoppeln-halbieren', F.bauen('mathe-zahlraum-1000/verdoppeln-halbieren', doppelnFamilien, F.zahlDiag(
    (z, c, i) => (i.art === 'doppelt' ? i.a % 2 === 0 && z === i.a / 2 : z === 2 * i.a) && 'doppelt-halb-verwechselt',
    (z, c) => (z * 10 === c || z === c * 10) && 'stellenwert-fehler', nah, ...uebliche),
    { 'vd-bis-50': ['vd-bis-20'], 'vd-zehner-ue': ['vd-zehner'], 'vd-zehner-gross': ['vd-zehner-ue'], 'vd-hunderter': ['vd-zehner'], 'hb-bis-100': ['hb-bis-40'],
      'hb-zehner': ['hb-bis-100'], 'hb-zehner-ungerade': ['hb-zehner'], 'hb-hunderter': ['hb-bis-40'],
      'vd-uebertrag': ['vd-zehner-gross'], 'vd-zweimal': ['vd-bis-50'], 'vd-dreimal': ['vd-zweimal'], 'vd-kette': ['vd-dreimal', 'vd-uebertrag'],
      'hb-zweimal': ['hb-bis-100'], 'hb-dreimal': ['hb-zweimal'], 'hb-kette': ['hb-dreimal'] }));
})(globalThis);
