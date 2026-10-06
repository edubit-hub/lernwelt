/* module/mathe-plus-minus-1000/fam-addition.js: Aufgabenfamilien der Addition bis 1000: Themen «plus-1000», «add-wege», «add-reihenfolge» und «add-fehler».
   Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen (_gemeinsam/familien). Reine Berechnung, Zufall nur über den rng.
   Die Rechenwege (schrittweise, stellenweise, über den Zehner, Hilfsaufgabe, Vereinfachen) kommen aus _gemeinsam/rechenweg.
   Die Begriffe stellenweise, schrittweise und Vereinfachen stammen aus einem Elternmerkblatt, die Wortwahl der Lehrperson kann abweichen (README, TODO).
   Aufgaben der Form «rechnung» haben a und b als Zahlen der Rechnung. Lückensätze, Abfolgen und Auswahlaufgaben tragen art, a, b und c im inhalt,
   damit Diagnose und Test wissen, was gefragt ist. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, W = L.registry.bausteine.get('_gemeinsam/rechenweg'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!W || !F) throw new Error('mathe-plus-minus-1000: die Bausteine «_gemeinsam/rechenweg» und «_gemeinsam/familien» fehlen (modul.js, braucht).');
  const { ziehe, hilfe, luecke: lk } = W, MINUS = '−';
  const keineNull = n => !String(n).includes('0');
  const e1 = n => n % 10, z1 = n => Math.floor(n / 10) % 10;                              // Einer- und Zehnerziffer

  const rf = (id, s, op, zahlen, name, weg, diag, braucht, extra) => ({ id, s, form: 'rechnung', braucht, diag, mach(rng) {
    const [a, b] = zahlen(rng);
    return { inhalt: W.rechnung(a, op, b, `${a} ${op} ${b}`, extra ? extra(a, b) : {}), hilfe: hilfe(name, weg(a, b)) };
  } });
  const sf = (id, s, mach, diag, braucht) => ({ id, s, form: 'satz', braucht, diag, mach });
  const af = (id, s, mach, braucht) => ({ id, s, form: 'abfolge', braucht, mach });
  const mc = (id, s, mach, braucht) => ({ id, s, form: 'auswahl', braucht, mach });
  const t = (text, code) => (code ? { text, code } : text);               // falsche Antwort mit oder ohne Fehlercode
  const einer = (a, b) => W.kette(a, [b]);
  const zwei = rng => ziehe(rng, [[101, 899], [111, 899]], (a, b) => keineNull(b) && a + b <= 999);                    // a beliebig, b mit drei Ziffern ab 1
  const zweiKnapp = rng => ziehe(rng, [[101, 899], [111, 899]], (a, b) => keineNull(b) && a + b <= 985);                  // Fehler von +10 bleiben unter 1000
  const alle = rng => ziehe(rng, [[111, 899], [111, 899]], (a, b) => keineNull(a) && keineNull(b) && a + b <= 999);   // beide Zahlen ohne Null

  // ---- plus-1000: Addieren im Tausenderraum -------------------------------------------------------------------
  const plus = W.zahlDiag('+');
  const plusAusgleich = W.zahlDiag('+', (z, c, i) => i.d && W.ausgleich(z, c, i.d, 1));
  const plusTeil = W.zahlDiag('+', (z, c, i) => W.teilsummeVergessen(z, i.a, i.b) && 'teilsumme-vergessen');
  const AD = [
    rf('ad-h', 1, '+', r => ziehe(r, [[101, 899], [100, 800, 100]], (a, b) => a % 100 !== 0 && a + b <= 999), 'schrittweise', einer, plus),
    rf('ad-z', 1, '+', r => ziehe(r, [[101, 899], [10, 90, 10]], (a, b) => a % 100 !== 0 && a % 100 + b <= 99), 'schrittweise', einer, plus),
    rf('ad-e', 1, '+', r => ziehe(r, [[101, 899], [2, 8]], (a, b) => a % 10 >= 1 && a % 10 + b <= 9), 'schrittweise', einer, plus),
    rf('ad-z-ue', 2, '+', r => ziehe(r, [[101, 899], [10, 90, 10]], (a, b) => a % 100 !== 0 && a % 100 + b > 100 && a + b <= 999), 'ueber-zehner', (a, b) => W.ueberEinheit(a, b, 100), plus, ['ad-z']),
    rf('ad-e-ue', 2, '+', r => ziehe(r, [[101, 899], [3, 9]], (a, b) => a % 10 + b >= 11), 'ueber-zehner', W.plusUeber, plus, ['ad-e']),
    rf('ad-3p2', 2, '+', r => ziehe(r, [[101, 899], [11, 88]], (a, b) => b % 10 >= 1 && W.ohneUebertrag(a, b) === a + b), 'schrittweise', W.schrittweise, plus, ['ad-z', 'ad-e']),
    rf('ad-3p2-ue', 2, '+', r => ziehe(r, [[101, 899], [12, 88]], (a, b) => a % 10 + b % 10 >= 11 && a + b <= 999), 'ueber-zehner', W.plusUeber, plus, ['ad-3p2', 'ad-e-ue']),
    rf('ad-3p3', 2, '+', r => ziehe(r, [[101, 799], [101, 799]], (a, b) => a % 10 >= 1 && b % 10 >= 1 && W.ohneUebertrag(a, b) === a + b), 'schrittweise', W.schrittweise, plus, ['ad-3p2']),
    rf('ad-3p3-ue', 3, '+', r => ziehe(r, [[101, 799], [101, 799]], (a, b) => b % 10 >= 1 && W.ohneUebertrag(a, b) !== a + b && a + b <= 999), 'schrittweise', W.schrittweise, plus, ['ad-3p3', 'ad-3p2-ue']),
    rf('ad-stellen', 3, '+', alle, 'stellenweise', W.stellenweise, plusTeil, ['ad-3p3']),
    rf('ad-rund', 3, '+', r => {                                          // a liegt 1 bis 3 unter einem vollen Hunderter
      const [x, d] = ziehe(r, [[300, 800, 100], [1, 3]]), a = x - d;
      return [a, ziehe(r, [[101, 1000 - x]])[0]];
    }, 'hilfsaufgabe', (a, b) => W.rundenPlus(a, b, a + 100 - a % 100), plusAusgleich, ['ad-3p3'], a => ({ d: 100 - a % 100, r: a + 100 - a % 100 })),
    rf('ad-auf-1000', 2, '+', r => { const [a] = ziehe(r, [[101, 899]], x => x % 100 !== 0 && x % 10 !== 0); return [a, 1000 - a]; },
      'schrittweise', a => W.kette(a, W.ergaenzSpruenge(a, 1000)), plus, ['ad-z-ue'])
  ];

  // ---- add-wege: Rechenwege der Addition mit Zahlen in den Lücken -----------------------------------------------
  const wegRegel = (z, c, i, nr) => {
    if (i.art === 'stellen' && nr === 1 && z * 10 === c) return 'stellen-vermischt';                           // Zehner wie Einer gerechnet: 9 statt 90
    if (i.art === 'summe' && nr === 1 && i.teile.some(x => z === i.c - x)) return 'teilsumme-vergessen';
    if (i.art === 'rund' && nr === 2) return W.ausgleich(z, c, i.d, 1);
    if (i.art === 'gleich' && nr === 0 && z === i.b + i.d) return 'ausgleich-falsch';
    if (i.art === 'probe-plus' && nr === 1 && z === i.c + i.b) return 'rechenzeichen-verwechselt';
    return null;
  };
  const luecken = W.lueckenDiag(W.kettenRegel, wegRegel);
  const kettenSatz = (id, s, was, zahlen, weg, name, braucht) => sf(id, s, rng => {
    const [a, b] = zahlen(rng), k = weg(a, b);
    return { inhalt: { text: `${a} + ${b}: ${W.kettenText(k, was)}`, art: was === 'nach' ? 'kette' : 'sprung', a, b, c: a + b, folge: k.folge }, hilfe: hilfe(name, k, false) };
  }, luecken, braucht);
  const AW = [
    kettenSatz('aw-schritt-hze', 2, 'nach', zwei, W.schrittweise, 'schrittweise'),
    kettenSatz('aw-schritt-sprung', 2, 'sprung', zwei, W.schrittweise, 'schrittweise'),
    kettenSatz('aw-ueber-zehner', 1, 'sprung', r => ziehe(r, [[12, 899], [3, 9]], (a, b) => a % 10 + b >= 11), W.plusUeber, 'ueber-zehner'),
    kettenSatz('aw-ueber-hunderter', 2, 'sprung', r => ziehe(r, [[101, 899], [20, 95]], (a, b) => a % 100 !== 0 && a % 100 + b > 100 && a + b <= 999),
      (a, b) => W.ueberEinheit(a, b, 100), 'ueber-zehner', ['aw-ueber-zehner']),
    sf('aw-stellen-teile', 2, rng => {
      const [a, b] = alle(rng), s = W.stellenweise(a, b), [ae, az, ah] = W.spalten(a), [be, bz, bh] = W.spalten(b), [H, Z, E] = s.teile;
      const text = `${a} + ${b}: ${ah * 100} + ${bh * 100} = ${lk(H)}, ${az * 10} + ${bz * 10} = ${lk(Z)}, ${ae} + ${be} = ${lk(E)}`;
      return { inhalt: { text, art: 'stellen', a, b, c: a + b, teile: s.teile }, hilfe: hilfe('stellenweise', s, false) };
    }, luecken),
    sf('aw-stellen-summe', 2, rng => {
      const [a, b] = alle(rng), s = W.stellenweise(a, b), [H, Z, E] = s.teile;
      return { inhalt: { text: `${a} + ${b}: ${Z} + ${E} = ${lk(Z + E)}, ${H} + ${Z + E} = ${lk(a + b)}`, art: 'summe', a, b, c: a + b, teile: s.teile }, hilfe: hilfe('stellenweise', s, false) };
    }, luecken, ['aw-stellen-teile']),
    sf('aw-hilfs-rund', 3, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), a = x - d, [b] = ziehe(rng, [[101, 1000 - x]]), k = W.rundenPlus(a, b, x);
      return { inhalt: { text: `${a} + ${b}: ${x} + ${b} = ${lk(x + b)}, ${x + b} ${MINUS} ${lk(d)} = ${lk(a + b)}`, art: 'rund', a, b, c: a + b, d, r: x }, hilfe: hilfe('hilfsaufgabe', k, false) };
    }, luecken, ['aw-schritt-hze']),
    sf('aw-hilfs-gleich', 3, rng => {
      const [a, b] = ziehe(rng, [[101, 899], [111, 899]], (p, q) => p % 10 !== 0 && q > 20 - p % 10 && p + q <= 999), d = 10 - a % 10, k = W.vereinfachen(a, b, [d]);
      return { inhalt: { text: `${a} + ${b} = ${a + d} + ${lk(b - d)} = ${lk(a + b)}`, art: 'gleich', a, b, c: a + b, d }, hilfe: hilfe('hilfsaufgabe', k, false) };
    }, luecken, ['aw-hilfs-rund']),
    sf('aw-umkehr', 2, rng => {
      const [a, b] = ziehe(rng, [[101, 799], [101, 799]], (p, q) => p + q <= 999), c = a + b;
      return { inhalt: { text: `${a} + ${b} = ${lk(c)}. Probe: ${c} ${MINUS} ${b} = ${lk(a)}`, art: 'probe-plus', a, b, c },
        hilfe: hilfe('umkehren', { schritte: [`${a} + ${b} = ${c}`, `${c} ${MINUS} ${b} = ${a}`] }, false) };
    }, luecken, ['aw-schritt-hze'])
  ];

  // ---- add-reihenfolge: die Schritte eines Rechenwegs in die richtige Reihenfolge bringen -----------------------------
  const erkl = (a, c) => ['Jeder Schritt rechnet mit dem Ergebnis des Schritts davor weiter.', `Der erste Schritt beginnt bei ${a}, der letzte endet bei ${c}.`];
  const erklRund = ['Zuerst wird die Rechnung mit der runden Zahl umgeschrieben.', 'Danach wird gerechnet und am Schluss der Unterschied ausgeglichen.'];
  const erklGleich = ['Zuerst werden beide Zahlen so verändert, dass die Rechnung leichter wird.', 'Danach wird die leichtere Rechnung gerechnet.'];
  const abfolge = (frage, w, a, b, c, extra) => ({ frage, schritte: w.schritte.slice(), a, b, c, op: '+', ...extra });
  const AR = [
    af('ar-schritt-hze', 1, rng => {
      const [a, b] = zwei(rng), k = W.schrittweise(a, b);
      return { inhalt: abfolge(`Rechne ${a} + ${b} schrittweise. Was kommt zuerst, was zuletzt?`, k, a, b, a + b, { art: 'kette' }), hilfe: hilfe('schrittweise', { ...k, schritte: erkl(a, a + b) }, 'keines') };
    }),
    af('ar-schritt-ze', 1, rng => {
      const [a, b] = ziehe(rng, [[101, 899], [11, 88]], (p, q) => keineNull(q) && p + q <= 999), k = W.schrittweise(a, b);
      return { inhalt: abfolge(`Rechne ${a} + ${b} schrittweise. Was kommt zuerst, was zuletzt?`, k, a, b, a + b, { art: 'kette' }), hilfe: hilfe('schrittweise', { ...k, schritte: erkl(a, a + b) }, 'keines') };
    }),
    af('ar-ueber-zehner', 1, rng => {
      const [a, b] = ziehe(rng, [[12, 899], [3, 9]], (p, q) => p % 10 + q >= 11), k = W.plusUeber(a, b);
      return { inhalt: abfolge(`Rechne ${a} + ${b} über den Zehner. Was kommt zuerst, was zuletzt?`, k, a, b, a + b, { art: 'kette' }), hilfe: hilfe('ueber-zehner', { ...k, schritte: erkl(a, a + b) }, 'keines') };
    }),
    af('ar-ueber-hunderter', 2, rng => {
      const [a, b] = ziehe(rng, [[101, 799], [120, 295]], (p, q) => p % 100 !== 0 && q % 100 > 100 - p % 100 && q >= 120 && p + q <= 999), bt = b % 100;
      const k = W.kette(a, [100 - a % 100, b - bt, bt - (100 - a % 100)]);
      return { inhalt: abfolge(`Rechne ${a} + ${b} und mache beim vollen Hunderter einen Halt. Was kommt zuerst, was zuletzt?`, k, a, b, a + b, { art: 'kette' }), hilfe: hilfe('ueber-zehner', { ...k, schritte: erkl(a, a + b) }, 'keines') };
    }, ['ar-ueber-zehner']),
    af('ar-stellen', 2, rng => {
      const [a, b] = alle(rng), s = W.stellenweise(a, b);
      return { inhalt: abfolge(`Rechne ${a} + ${b} stellenweise, von den Hundertern zu den Einern. Was kommt zuerst?`, s, a, b, a + b, { art: 'stellen' }),
        hilfe: hilfe('stellenweise', { ...s, schritte: ['Erst die Hunderter, dann die Zehner, dann die Einer.', 'Am Schluss kommen alle Teilsummen zusammen.'] }) };
    }, ['ar-schritt-hze']),
    af('ar-hilfs-rund', 2, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), a = x - d, [b] = ziehe(rng, [[101, 1000 - x]]), k = W.rundenPlus(a, b, x);
      return { inhalt: abfolge(`Rechne ${a} + ${b} mit der runden Zahl ${x}. Was kommt zuerst, was zuletzt?`, k, a, b, a + b, { art: 'rund', d, r: x }), hilfe: hilfe('hilfsaufgabe', { ...k, schritte: erklRund }, 'keines') };
    }, ['ar-schritt-hze']),
    af('ar-hilfs-gleich', 3, rng => {
      const [a, b] = ziehe(rng, [[131, 849], [151, 899]], (p, q) => p % 100 >= 31 && p % 100 <= 49 && p + q <= 999), d1 = 50 - a % 100, k = W.vereinfachen(a, b, [d1, 50]);
      return { inhalt: abfolge(`Vereinfache ${a} + ${b} in zwei Schritten und rechne zum Schluss aus. Was kommt zuerst, was zuletzt?`, k, a, b, a + b, { art: 'gleich' }), hilfe: hilfe('hilfsaufgabe', { ...k, schritte: erklGleich }, 'keines') };
    }, ['ar-hilfs-rund']),
    af('ar-umkehr', 2, rng => {
      const [a, b] = ziehe(rng, [[101, 799], [101, 799]], (p, q) => p + q <= 999), c = a + b;
      return { inhalt: abfolge(`Rechne ${a} + ${b} und kontrolliere mit der Umkehraufgabe. Was kommt zuerst?`, { schritte: [`${a} + ${b} = ${c}`, `${c} ${MINUS} ${b} = ${a}`] }, a, b, c, { art: 'probe-plus' }),
        hilfe: hilfe('umkehren', { schritte: ['Zuerst die Aufgabe rechnen, danach das Ergebnis mit der Umkehraufgabe kontrollieren.', 'Kommt die erste Zahl heraus, stimmt das Ergebnis.'] }, false) };
    }, ['ar-schritt-hze'])
  ];

  // ---- add-fehler: Fehler in Rechenwegen finden, Ergebnisse kontrollieren --------------------------------------------
  const NACH = 'rechenweg-nicht-nachvollzogen', UEBER = 'ueberschlag-falsch', PROBE = 'probe-falsch';
  const rundHunderter = n => Math.round(n / 100) * 100;
  const klar = n => n % 100 >= 10 && n % 100 <= 39 || n % 100 >= 61 && n % 100 <= 90;                  // Abstand zur halben Hundert: das Runden ist eindeutig
  const AF = [
    mc('af-schritt', 1, rng => {
      const [a, b] = zweiKnapp(rng), k = W.schrittweise(a, b), n = rng.int(k.folge.length), z = W.kettenMitFehler(a, k.folge, n, rng.waehle([-10, -1, 1, 10]));
      return { inhalt: { frage: `Ein Kind rechnet ${a} + ${b} schrittweise: ${z.join(', ')}. Welcher Schritt stimmt nicht?`, richtig: z[n],
        falsch: [...z.filter((_, i) => i !== n).map(x => t(x, NACH)), t('Alle Schritte stimmen.', NACH)], art: 'schritt', a, b, c: a + b }, hilfe: hilfe('schrittweise', k, false) };
    }),
    mc('af-teil', 2, rng => {
      const [a, b] = alle(rng), s = W.stellenweise(a, b), [ae, az, ah] = W.spalten(a), [be, bz, bh] = W.spalten(b);
      const teile = [[ah * 100, bh * 100], [az * 10, bz * 10], [ae, be]], n = rng.int(3), delta = rng.waehle(n === 2 ? [-10, -1, 1, 10] : [-100, -10, 10, 100]);
      const zeilen = teile.map(([x, y], i) => `${x} + ${y} = ${x + y + (i === n ? delta : 0)}`);
      return { inhalt: { frage: `Ein Kind rechnet ${a} + ${b} stellenweise. Welche Teilrechnung stimmt nicht?`, richtig: zeilen[n],
        falsch: [...zeilen.filter((_, i) => i !== n).map(x => t(x, NACH)), t('Alle Teilrechnungen stimmen.', NACH)], art: 'teil', a, b, c: a + b }, hilfe: hilfe('stellenweise', s, false) };
    }, ['af-schritt']),
    mc('af-hilfs-schritt', 3, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), a = x - d, [b] = ziehe(rng, [[101, 990 - x]]), k = W.rundenPlus(a, b, x), n = rng.int(2), delta = rng.waehle([-10, -1, 1, 10]);
      const erste = x + b + (n === 0 ? delta : 0), zeilen = [`${x} + ${b} = ${erste}`, `${erste} ${MINUS} ${d} = ${n === 0 ? erste - d : a + b + delta}`];
      return { inhalt: { frage: `Ein Kind rechnet ${a} + ${b} mit der runden Zahl ${x}: ${zeilen.join(', ')}. Welcher Schritt stimmt nicht?`, richtig: zeilen[n],
        falsch: [t(zeilen[1 - n], NACH), t('Alle Schritte stimmen.', NACH), t('Die runde Zahl passt nicht zur Rechnung.', NACH)], art: 'schritt', a, b, c: a + b }, hilfe: hilfe('hilfsaufgabe', k, false) };
    }, ['af-schritt']),
    mc('af-ausgleich', 3, rng => {
      const [x, d] = ziehe(rng, [[300, 800, 100], [1, 3]]), a = x - d, [b] = ziehe(rng, [[101, 1000 - x]]), k = W.rundenPlus(a, b, x);
      return { inhalt: { frage: `Ein Kind rechnet ${a} + ${b} mit der runden Zahl ${x}: ${x} + ${b} = ${x + b}. Was muss es danach tun?`, richtig: `${d} abziehen`,
        falsch: [t(`${d} addieren`, 'ausgleich-falsch'), t(`Nichts, ${x + b} ist schon das Ergebnis`, 'ausgleich-vergessen'), `${x} abziehen`], art: 'ausgleich', a, b, c: a + b, d, r: x }, hilfe: hilfe('hilfsaufgabe', k, false) };
    }, ['af-hilfs-schritt']),
    mc('af-ueberschlag', 2, rng => {
      const [a, b] = ziehe(rng, [[101, 899], [101, 899]], (p, q) => klar(p) && klar(q) && p + q <= 780), ra = rundHunderter(a), rb = rundHunderter(b);
      const ra2 = a % 100 < 50 ? ra + 100 : ra - 100, rb2 = b % 100 < 50 ? rb + 100 : rb - 100, zeile = (x, y) => `${x} + ${y} = ${x + y}`;
      return { inhalt: { frage: `Überschlag: Runde ${a} und ${b} auf ganze Hunderter. Welche Rechnung ist richtig?`, richtig: zeile(ra, rb),
        falsch: [t(zeile(ra2, rb), UEBER), t(zeile(ra, rb2), UEBER), t(zeile(ra2, rb2), UEBER)], art: 'ueberschlag', a, b, c: a + b },
      hilfe: hilfe('ueberschlag', { schritte: [`${a} liegt näher bei ${ra}.`, `${b} liegt näher bei ${rb}.`, zeile(ra, rb)] }, false) };
    }, ['af-schritt']),
    mc('af-probe', 2, rng => {
      const [a, b] = ziehe(rng, [[101, 799], [101, 799]], (p, q) => p + q <= 999 && p !== q), c = a + b;           // p = q gäbe zwei gleiche Ablenker (c + b und c + a)
      return { inhalt: { frage: `Du hast ${a} + ${b} = ${c} gerechnet. Welche Rechnung kontrolliert das Ergebnis?`, richtig: `${c} ${MINUS} ${b}`,
        falsch: [t(`${c} + ${b}`, PROBE), t(`${c} + ${a}`, PROBE), t(`${a} + ${b} + ${c}`, PROBE)], art: 'probe', a, b, c },
      hilfe: hilfe('umkehren', { schritte: [`${c} ${MINUS} ${b} = ${a}`, 'Kommt die erste Zahl heraus, stimmt das Ergebnis.'] }, false) };
    }, ['af-schritt']),
    mc('af-ergebnis', 2, rng => {
      const [a, b] = ziehe(rng, [[101, 799], [12, 88]], (p, q) => {
        const c = p + q, w = [W.ohneUebertrag(p, q), p + W.ziffernSumme(q), c + 10];
        return q % 10 >= 1 && p % 10 + q % 10 >= 10 && c <= 985 && new Set([c, ...w]).size === 4;
      }), c = a + b;
      return { inhalt: { frage: `Welches Ergebnis ist richtig? ${a} + ${b}`, richtig: String(c),
        falsch: [t(String(W.ohneUebertrag(a, b)), 'uebergang-vergessen'), t(String(a + W.ziffernSumme(b)), 'stellen-vermischt'), t(String(c + 10), 'zehner-daneben')], art: 'ergebnis', a, b, c },
      hilfe: hilfe('schrittweise', W.plusUeber(a, b), false) };
    }, ['af-schritt']),
    mc('af-stellenwert', 2, rng => {
      const [a, b] = ziehe(rng, [[111, 899], [111, 899]], (p, q) => keineNull(p) && keineNull(q) && p + q <= 999 && (e1(p) !== z1(p) || e1(q) !== z1(q))), s = W.stellenweise(a, b), [ae, az, ah] = W.spalten(a), [be, bz, bh] = W.spalten(b), zeile = (x, y) => `${x} + ${y} = ${x + y}`;
      return { inhalt: { frage: `Welche Teilrechnung gehört zu den Zehnern von ${a} + ${b}?`, richtig: zeile(az * 10, bz * 10),
        falsch: [t(zeile(az, bz), 'stellen-vermischt'), zeile(ah * 100, bh * 100), zeile(ae, be)], art: 'stellenwert', a, b, c: a + b }, hilfe: hilfe('stellenweise', s, false) };
    }, ['af-teil'])
  ];

  L.generator('mathe-plus-minus-1000/plus-1000', F.bauen('mathe-plus-minus-1000/plus-1000', AD, plus, W.voraus(AD)));
  L.generator('mathe-plus-minus-1000/add-wege', F.bauen('mathe-plus-minus-1000/add-wege', AW, undefined, W.voraus(AW)));
  L.generator('mathe-plus-minus-1000/add-reihenfolge', F.bauen('mathe-plus-minus-1000/add-reihenfolge', AR, undefined, W.voraus(AR)));
  L.generator('mathe-plus-minus-1000/add-fehler', F.bauen('mathe-plus-minus-1000/add-fehler', AF, undefined, W.voraus(AF)));
})(globalThis);
