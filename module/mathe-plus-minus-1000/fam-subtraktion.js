/* module/mathe-plus-minus-1000/fam-subtraktion.js: Aufgabenfamilien der Subtraktion bis 1000: Themen «minus-1000», «sub-wege», «sub-reihenfolge» und «sub-fehler».
   Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen (_gemeinsam/familien). Reine Berechnung, Zufall nur über den rng.
   Zwei Wege führen zur Differenz: Abziehen (von der ersten Zahl nach links springen) und Ergänzen (von der kleineren zur grösseren Zahl springen).
   Welcher Weg im Lehrmittel der Klasse zuerst kommt, ist offen (README, TODO). Das schriftliche Verfahren steht hier nicht: es hängt vom Lehrmittel ab.
   Aufgaben der Form «rechnung» haben a (Minuend) und b (Subtrahend). Lückensätze, Abfolgen und Auswahlaufgaben tragen art, a, b und c im inhalt. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, W = L.registry.bausteine.get('_gemeinsam/rechenweg'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!W || !F) throw new Error('mathe-plus-minus-1000: die Bausteine «_gemeinsam/rechenweg» und «_gemeinsam/familien» fehlen (modul.js, braucht).');
  const { ziehe, hilfe, luecke: lk } = W, MINUS = '−';
  const keineNull = n => !String(n).includes('0');

  const rf = (id, s, zahlen, name, weg, diag, braucht, extra) => ({ id, s, form: 'rechnung', braucht, diag, mach(rng) {
    const [a, b] = zahlen(rng);
    return { inhalt: W.rechnung(a, MINUS, b, `${a} ${MINUS} ${b}`, extra ? extra(a, b) : {}), hilfe: hilfe(name, weg(a, b)) };
  } });
  const sf = (id, s, mach, diag, braucht) => ({ id, s, form: 'satz', braucht, diag, mach });
  const af = (id, s, mach, braucht) => ({ id, s, form: 'abfolge', braucht, mach });
  const mc = (id, s, mach, braucht) => ({ id, s, form: 'auswahl', braucht, mach });
  const t = (text, code) => (code ? { text, code } : text);
  const ab = (a, b) => W.kette(a, [-b]);                                  // ein einziger Sprung nach links
  const erg = (a, b) => W.ergaenzen(b, a);                                // a − b durch Ergänzen von b bis a
  const zwei = rng => ziehe(rng, [[301, 999], [111, 899]], (a, b) => keineNull(b) && a - b >= 10);                      // b mit drei Ziffern ab 1
  const dreiSprung = (b, a) => W.ergaenzSpruenge(b, a).length === 3;
  const dreiVerschieden = (b, a) => { const s = W.ergaenzSpruenge(b, a); return s.length === 3 && new Set(s).size === 3; };

  // ---- minus-1000: Subtrahieren im Tausenderraum ---------------------------------------------------------------
  const minus = W.zahlDiag(MINUS);
  const minusErg = W.zahlDiag(MINUS, (z, c, i) => W.sprungVergessen(z, i.a, i.b) && 'sprung-vergessen');
  const minusAus = W.zahlDiag(MINUS, (z, c, i) => i.d && W.ausgleich(z, c, i.d, -1));
  const SU = [
    rf('su-h', 1, r => ziehe(r, [[201, 999], [100, 800, 100]], (a, b) => a % 100 !== 0 && a - b >= 10), 'abziehen', ab, minus),
    rf('su-z', 1, r => ziehe(r, [[201, 999], [10, 90, 10]], (a, b) => a % 100 > b), 'abziehen', ab, minus),
    rf('su-e', 1, r => ziehe(r, [[201, 999], [1, 8]], (a, b) => a % 10 > b), 'abziehen', ab, minus),
    rf('su-z-ue', 2, r => ziehe(r, [[201, 999], [10, 90, 10]], (a, b) => a % 100 !== 0 && a % 100 < b), 'ueber-zehner', (a, b) => W.ueberEinheitMinus(a, b, 100), minus, ['su-z']),
    rf('su-e-ue', 2, r => ziehe(r, [[201, 999], [3, 9]], (a, b) => a % 10 >= 1 && a % 10 < b), 'ueber-zehner', W.minusUeber, minus, ['su-e']),
    rf('su-3m2', 2, r => ziehe(r, [[201, 999], [11, 88]], (a, b) => b % 10 >= 1 && !W.borgen(a, b).some(Boolean)), 'abziehen', W.abziehen, minus, ['su-z', 'su-e']),
    rf('su-3m2-ue', 3, r => ziehe(r, [[201, 999], [12, 88]], (a, b) => a % 10 >= 1 && a % 10 < b % 10), 'abziehen', W.minusUeber, minus, ['su-3m2', 'su-e-ue']),
    rf('su-3m3', 2, r => ziehe(r, [[301, 999], [101, 799]], (a, b) => b % 10 >= 1 && a - b >= 10 && !W.borgen(a, b).some(Boolean)), 'abziehen', W.abziehen, minus, ['su-3m2']),
    rf('su-3m3-ue', 3, r => ziehe(r, [[301, 999], [101, 799]], (a, b) => b % 10 >= 1 && a - b >= 10 && W.borgen(a, b).some(Boolean)), 'abziehen', W.minusUeber, minus, ['su-3m3', 'su-3m2-ue']),
    rf('su-von-tausend', 2, r => { const [b] = ziehe(r, [[101, 899]], x => x % 100 !== 0 && x % 10 !== 0); return [1000, b]; }, 'ergaenzen', erg, minusErg),
    rf('su-nah', 2, r => {                                               // die Zahlen liegen nah beieinander und der Abstand geht über einen Zehner
      const [a, d] = ziehe(r, [[301, 999], [8, 60]], (x, y) => (x - y) % 10 !== 0 && Math.floor(x / 10) > Math.floor((x - y) / 10) && W.ergaenzSpruenge(x - y, x).length > 1);
      return [a, a - d];
    }, 'ergaenzen', erg, minusErg, ['su-von-tausend']),
    rf('su-null', 3, r => ziehe(r, [[200, 900, 100], [101, 899]], (a, b) => b < a - 10 && b % 100 !== 0 && W.ergaenzSpruenge(b, a).length > 1), 'ergaenzen', erg, minusErg, ['su-von-tausend']),
    rf('su-rund', 3, r => {                                               // b liegt 1 bis 3 unter einem vollen Hunderter
      const [x, d] = ziehe(r, [[300, 800, 100], [1, 3]]), b = x - d;
      return [ziehe(r, [[b + 110, 999]])[0], b];
    }, 'hilfsaufgabe', (a, b) => W.rundenMinus(a, b, b + 100 - b % 100), minusAus, ['su-3m3'], (a, b) => ({ d: 100 - b % 100, r: b + 100 - b % 100 }))
  ];

  // ---- sub-wege: Rechenwege der Subtraktion mit Zahlen in den Lücken ---------------------------------------------
  const wegRegel = (z, c, i, nr) => {
    if (i.art === 'rund' && nr === 2) return W.ausgleich(z, c, i.d, -1);
    if (i.art === 'gleich' && nr === 0 && z === i.a - i.d) return 'ausgleich-falsch';
    if (i.art === 'probe-minus' && nr === 1 && z === i.c - i.b) return 'rechenzeichen-verwechselt';
    if (i.art === 'erg' && nr === i.spruenge.length && i.spruenge.some(j => z === i.c - j)) return 'sprung-vergessen';
    return null;
  };
  const luecken = W.lueckenDiag(W.kettenRegel, wegRegel);
  const kettenSatz = (id, s, was, zahlen, weg, name, braucht) => sf(id, s, rng => {
    const [a, b] = zahlen(rng), k = weg(a, b);
    return { inhalt: { text: `${a} ${MINUS} ${b}: ${W.kettenText(k, was)}`, art: was === 'nach' ? 'kette' : 'sprung', a, b, c: a - b, folge: k.folge }, hilfe: hilfe(name, k, false) };
  }, luecken, braucht);
  const ergSatz = (id, s, zahlen, braucht) => sf(id, s, rng => {
    const [a, b] = zahlen(rng), k = erg(a, b);
    return { inhalt: { text: `${a} ${MINUS} ${b}: ${W.kettenText(k, 'sprung')}. Die Sprünge zusammen: ${lk(a - b)}`, art: 'erg', a, b, c: a - b, folge: k.folge, spruenge: k.strich.spruenge }, hilfe: hilfe('ergaenzen', k, false) };
  }, luecken, braucht);
  const SW = [
    kettenSatz('sw-abz-hze', 2, 'nach', zwei, W.abziehen, 'abziehen'),
    kettenSatz('sw-abz-sprung', 2, 'sprung', zwei, W.abziehen, 'abziehen'),
    kettenSatz('sw-ueber-zehner', 1, 'sprung', r => ziehe(r, [[12, 999], [3, 9]], (a, b) => a % 10 >= 1 && a % 10 < b), W.minusUeber, 'ueber-zehner'),
    ergSatz('sw-erg-hze', 3, r => ziehe(r, [[400, 1000, 100], [101, 899]], (a, b) => a - b >= 60 && b % 100 !== 0 && b % 10 !== 0 && dreiSprung(b, a)), ['sw-erg-nah']),
    ergSatz('sw-erg-nah', 2, r => {
      const [a, d] = ziehe(r, [[301, 999], [8, 60]], (x, y) => (x - y) % 10 !== 0 && Math.floor(x / 10) > Math.floor((x - y) / 10) && W.ergaenzSpruenge(x - y, x).length > 1 && W.ergaenzSpruenge(x - y, x).length <= 3);
      return [a, a - d];
    }),
    sf('sw-hilfs-rund', 3, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), b = x - d, [a] = ziehe(rng, [[b + 110, 999]]), k = W.rundenMinus(a, b, x);
      return { inhalt: { text: `${a} ${MINUS} ${b}: ${a} ${MINUS} ${x} = ${lk(a - x)}, ${a - x} + ${lk(d)} = ${lk(a - b)}`, art: 'rund', a, b, c: a - b, d, r: x }, hilfe: hilfe('hilfsaufgabe', k, false) };
    }, luecken, ['sw-abz-hze']),
    sf('sw-hilfs-gleich', 3, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), b = x - d, [a] = ziehe(rng, [[b + 110, 996]]), k = W.gleichMinus(a, b, d);
      return { inhalt: { text: `${a} ${MINUS} ${b} = ${lk(a + d)} ${MINUS} ${x} = ${lk(a - b)}`, art: 'gleich', a, b, c: a - b, d, r: x }, hilfe: hilfe('hilfsaufgabe', k, false) };
    }, luecken, ['sw-hilfs-rund']),
    sf('sw-umkehr', 2, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [101, 799]], (p, q) => p - q >= 10), c = a - b;
      return { inhalt: { text: `${a} ${MINUS} ${b} = ${lk(c)}. Probe: ${c} + ${b} = ${lk(a)}`, art: 'probe-minus', a, b, c },
        hilfe: hilfe('umkehren', { schritte: [`${a} ${MINUS} ${b} = ${c}`, `${c} + ${b} = ${a}`] }, false) };
    }, luecken, ['sw-abz-hze'])
  ];

  // ---- sub-reihenfolge: die Schritte eines Rechenwegs in die richtige Reihenfolge bringen ---------------------------
  const erkl = (a, c) => ['Jeder Schritt rechnet mit dem Ergebnis des Schritts davor weiter.', `Der erste Schritt beginnt bei ${a}, der letzte endet bei ${c}.`];
  const erklRund = ['Zuerst wird die Rechnung mit der runden Zahl umgeschrieben.', 'Danach wird gerechnet und am Schluss der Unterschied ausgeglichen.'];
  const erklGleich = ['Zuerst werden beide Zahlen so verändert, dass die Rechnung leichter wird.', 'Danach wird die leichtere Rechnung gerechnet.'];
  const abfolge = (frage, w, a, b, c, extra) => ({ frage, schritte: w.schritte.slice(), a, b, c, op: MINUS, ...extra });
  const AR = [
    af('sr-abz-hze', 1, rng => {
      const [a, b] = zwei(rng), k = W.abziehen(a, b);
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} schrittweise. Was kommt zuerst, was zuletzt?`, k, a, b, a - b, { art: 'kette' }), hilfe: hilfe('abziehen', { ...k, schritte: erkl(a, a - b) }, 'keines') };
    }),
    af('sr-abz-ze', 1, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [11, 88]], (p, q) => keineNull(q)), k = W.abziehen(a, b);
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} schrittweise. Was kommt zuerst, was zuletzt?`, k, a, b, a - b, { art: 'kette' }), hilfe: hilfe('abziehen', { ...k, schritte: erkl(a, a - b) }, 'keines') };
    }),
    af('sr-ueber-zehner', 1, rng => {
      const [a, b] = ziehe(rng, [[12, 999], [3, 9]], (p, q) => p % 10 >= 1 && p % 10 < q), k = W.minusUeber(a, b);
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} über den Zehner. Was kommt zuerst, was zuletzt?`, k, a, b, a - b, { art: 'kette' }), hilfe: hilfe('ueber-zehner', { ...k, schritte: erkl(a, a - b) }, 'keines') };
    }),
    af('sr-ueber-hunderter', 2, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [120, 295]], (p, q) => p % 100 !== 0 && q % 100 > p % 100 && p - q >= 10), r = a % 100, bt = b % 100;
      const k = W.kette(a, [-r, -(b - bt), -(bt - r)]);
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} und mache beim vollen Hunderter einen Halt. Was kommt zuerst, was zuletzt?`, k, a, b, a - b, { art: 'kette' }), hilfe: hilfe('ueber-zehner', { ...k, schritte: erkl(a, a - b) }, 'keines') };
    }, ['sr-ueber-zehner']),
    af('sr-erg-hze', 2, rng => {
      const [a, b] = ziehe(rng, [[400, 1000, 100], [101, 899]], (p, q) => p - q >= 60 && q % 100 !== 0 && q % 10 !== 0 && dreiSprung(q, p)), k = erg(a, b);
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} durch Ergänzen: erst springen, dann die Sprünge zusammenzählen. Was kommt zuerst?`, k, a, b, a - b, { art: 'erg' }),
        hilfe: hilfe('ergaenzen', { ...k, schritte: ['Zuerst springt man von der kleineren zur grösseren Zahl, jeder Sprung baut auf dem davor auf.', 'Am Schluss werden die Sprünge zusammengezählt.'] }, 'keines') };
    }, ['sr-abz-hze']),
    af('sr-hilfs-rund', 2, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), b = x - d, [a] = ziehe(rng, [[b + 110, 999]]), k = W.rundenMinus(a, b, x);
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} mit der runden Zahl ${x}. Was kommt zuerst, was zuletzt?`, k, a, b, a - b, { art: 'rund', d, r: x }), hilfe: hilfe('hilfsaufgabe', { ...k, schritte: erklRund }, 'keines') };
    }, ['sr-abz-hze']),
    af('sr-hilfs-gleich', 3, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), b = x - d, [a] = ziehe(rng, [[b + 110, 996]]), k = W.gleichMinus(a, b, d);
      return { inhalt: abfolge(`Verändere beide Zahlen von ${a} ${MINUS} ${b} gleich stark und rechne dann. Was kommt zuerst?`, k, a, b, a - b, { art: 'gleich', d }), hilfe: hilfe('hilfsaufgabe', { ...k, schritte: erklGleich }, 'keines') };
    }, ['sr-hilfs-rund']),
    af('sr-umkehr', 2, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [101, 799]], (p, q) => p - q >= 10), c = a - b;
      return { inhalt: abfolge(`Rechne ${a} ${MINUS} ${b} und kontrolliere mit der Umkehraufgabe. Was kommt zuerst?`, { schritte: [`${a} ${MINUS} ${b} = ${c}`, `${c} + ${b} = ${a}`] }, a, b, c, { art: 'probe-minus' }),
        hilfe: hilfe('umkehren', { schritte: ['Zuerst die Aufgabe rechnen, danach das Ergebnis mit der Umkehraufgabe kontrollieren.', 'Kommt die erste Zahl heraus, stimmt das Ergebnis.'] }, false) };
    }, ['sr-abz-hze'])
  ];

  // ---- sub-fehler: Fehler in Rechenwegen finden, Weg wählen, Ergebnisse kontrollieren ---------------------------------
  const NACH = 'rechenweg-nicht-nachvollzogen', UEBER = 'ueberschlag-falsch', PROBE = 'probe-falsch';
  const rundHunderter = n => Math.round(n / 100) * 100;
  const klar = n => n % 100 >= 10 && n % 100 <= 39 || n % 100 >= 61 && n % 100 <= 90;
  const AF = [
    mc('sf-schritt', 1, rng => {
      const [a, b] = zwei(rng), k = W.abziehen(a, b), n = rng.int(k.folge.length), z = W.kettenMitFehler(a, k.folge, n, rng.waehle([-10, -1, 1, 10]));
      return { inhalt: { frage: `Ein Kind rechnet ${a} ${MINUS} ${b} schrittweise: ${z.join(', ')}. Welcher Schritt stimmt nicht?`, richtig: z[n],
        falsch: [...z.filter((_, i) => i !== n).map(x => t(x, NACH)), t('Alle Schritte stimmen.', NACH)], art: 'schritt', a, b, c: a - b }, hilfe: hilfe('abziehen', k, false) };
    }),
    mc('sf-erg-schritt', 2, rng => {
      const [a, b] = ziehe(rng, [[400, 900, 100], [101, 899]], (p, q) => p - q >= 60 && q % 100 !== 0 && q % 10 !== 0 && dreiSprung(q, p)), k = erg(a, b);
      const n = rng.int(k.folge.length), z = W.kettenMitFehler(b, k.folge, n, rng.waehle([-10, -1, 1, 10]));
      return { inhalt: { frage: `Ein Kind rechnet ${a} ${MINUS} ${b} durch Ergänzen: ${z.join(', ')}. Welcher Schritt stimmt nicht?`, richtig: z[n],
        falsch: [...z.filter((_, i) => i !== n).map(x => t(x, NACH)), t('Alle Schritte stimmen.', NACH)], art: 'schritt', a, b, c: a - b }, hilfe: hilfe('ergaenzen', k, false) };
    }, ['sf-schritt']),
    mc('sf-wahl', 2, rng => {
      const [a1, d1] = ziehe(rng, [[301, 999], [8, 40]], (x, y) => (x - y) % 10 !== 0), [a2, d2] = ziehe(rng, [[501, 999], [150, 450]]);
      const [a3, d3] = ziehe(rng, [[501, 999], [150, 450]], (x, y) => x !== a2 || y !== d2), zeile = (a, d) => `${a} ${MINUS} ${a - d}`, b1 = a1 - d1;
      return { inhalt: { frage: 'Bei welcher Aufgabe liegen die beiden Zahlen so nah beieinander, dass sich das Ergänzen anbietet?', richtig: zeile(a1, d1),
        falsch: [zeile(a2, d2), zeile(a3, d3)], art: 'wahl', a: a1, b: b1, c: d1 }, hilfe: hilfe('ergaenzen', erg(a1, b1), false) };
    }, ['sf-schritt']),
    mc('sf-ziffern-einzeln', 3, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [101, 899]], (p, q) => p - q >= 10 && q % 10 >= 1 && W.borgen(p, q).some(Boolean) && W.kleinereVonGroesserer(W.ziffernDifferenz(p, q), p, q)
        && W.ziffernDifferenz(p, q) >= 100 && !W.entbuendelnVergessen(W.ziffernDifferenz(p, q), p, q)), z = W.ziffernDifferenz(a, b);
      return { inhalt: { frage: `Ein Kind rechnet ${a} ${MINUS} ${b} und erhält ${z}. Was ist passiert?`, richtig: 'In jeder Stelle wurde die kleinere von der grösseren Ziffer abgezogen.',
        falsch: ['Es wurde addiert statt subtrahiert.', 'Beim Tauschen wurde die Stelle davor nicht um 1 verkleinert.', 'Die Hunderter wurden vergessen.'], art: 'ziffern-einzeln', a, b, c: a - b, z }, hilfe: hilfe('abziehen', W.abziehen(a, b), false) };
    }, ['sf-schritt']),
    mc('sf-ueberschlag', 2, rng => {
      const [a, b] = ziehe(rng, [[401, 999], [101, 699]], (p, q) => klar(p) && klar(q) && p - q >= 300), ra = rundHunderter(a), rb = rundHunderter(b);
      const ra2 = a % 100 < 50 ? ra + 100 : ra - 100, rb2 = b % 100 < 50 ? rb + 100 : rb - 100, zeile = (x, y) => `${x} ${MINUS} ${y} = ${x - y}`;
      return { inhalt: { frage: `Überschlag: Runde ${a} und ${b} auf ganze Hunderter. Welche Rechnung ist richtig?`, richtig: zeile(ra, rb),
        falsch: [t(zeile(ra2, rb), UEBER), t(zeile(ra, rb2), UEBER), t(zeile(ra2, rb2), UEBER)], art: 'ueberschlag', a, b, c: a - b },
      hilfe: hilfe('ueberschlag', { schritte: [`${a} liegt näher bei ${ra}.`, `${b} liegt näher bei ${rb}.`, zeile(ra, rb)] }, false) };
    }, ['sf-schritt']),
    mc('sf-probe', 2, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [101, 799]], (p, q) => p - q >= 10 && p !== 2 * q), c = a - b;      // p = 2q gäbe zwei gleiche Ablenker (a + b und a + c)
      return { inhalt: { frage: `Du hast ${a} ${MINUS} ${b} = ${c} gerechnet. Welche Rechnung kontrolliert das Ergebnis?`, richtig: `${c} + ${b}`,
        falsch: [t(`${c} ${MINUS} ${b}`, PROBE), t(`${a} + ${b}`, PROBE), t(`${a} + ${c}`, PROBE)], art: 'probe', a, b, c },
      hilfe: hilfe('umkehren', { schritte: [`${c} + ${b} = ${a}`, 'Kommt die erste Zahl heraus, stimmt das Ergebnis.'] }, false) };
    }, ['sf-schritt']),
    mc('sf-ergebnis', 2, rng => {
      const [a, b] = ziehe(rng, [[301, 999], [101, 899]], (p, q) => {
        const c = p - q, [e, z] = W.borgen(p, q), w = [W.ziffernDifferenz(p, q), c + (e ? 10 : 100), p + q];
        return c >= 10 && p + q <= 999 && q % 10 >= 1 && (e || z) && W.kleinereVonGroesserer(w[0], p, q) && W.entbuendelnVergessen(w[1], p, q) && new Set([c, ...w]).size === 4;
      }), c = a - b, [e] = W.borgen(a, b);
      return { inhalt: { frage: `Welches Ergebnis ist richtig? ${a} ${MINUS} ${b}`, richtig: String(c),
        falsch: [t(String(W.ziffernDifferenz(a, b)), 'kleinere-von-groesserer'), t(String(c + (e ? 10 : 100)), 'entbuendeln-vergessen'), t(String(a + b), 'rechenzeichen-verwechselt')], art: 'ergebnis', a, b, c },
      hilfe: hilfe('abziehen', W.minusUeber(a, b), false) };
    }, ['sf-schritt']),
    mc('sf-spruenge', 2, rng => {
      const [a, b] = ziehe(rng, [[400, 1000, 100], [101, 899]], (p, q) => p - q >= 60 && q % 100 !== 0 && q % 10 !== 0 && dreiVerschieden(q, p)), s = W.ergaenzSpruenge(b, a), c = a - b;
      return { inhalt: { frage: `Ein Kind ergänzt ${b} bis ${a} mit den Sprüngen ${s.map(x => `+${x}`).join(', ')}. Wie gross ist der Unterschied?`, richtig: String(c),
        falsch: [t(String(c - s[0]), 'sprung-vergessen'), t(String(c - s[2]), 'sprung-vergessen'), t(String(a), 'zielzahl-eingesetzt')], art: 'spruenge', a, b, c, spruenge: s }, hilfe: hilfe('ergaenzen', erg(a, b), false) };
    }, ['sf-erg-schritt'])
  ];

  L.generator('mathe-plus-minus-1000/minus-1000', F.bauen('mathe-plus-minus-1000/minus-1000', SU, minus, W.voraus(SU)));
  L.generator('mathe-plus-minus-1000/sub-wege', F.bauen('mathe-plus-minus-1000/sub-wege', SW, undefined, W.voraus(SW)));
  L.generator('mathe-plus-minus-1000/sub-reihenfolge', F.bauen('mathe-plus-minus-1000/sub-reihenfolge', AR, undefined, W.voraus(AR)));
  L.generator('mathe-plus-minus-1000/sub-fehler', F.bauen('mathe-plus-minus-1000/sub-fehler', AF, undefined, W.voraus(AF)));
})(globalThis);
