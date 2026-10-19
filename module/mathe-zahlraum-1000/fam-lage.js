/* module/mathe-zahlraum-1000/fam-lage.js: Aufgabenfamilien der Themen «nachbarn» (Nachbarzahl, Nachbarzehner, Nachbarhunderter) und
   «zahlenstrahl» (Zahl am Zahlenstrahl setzen). Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen.
   Nachbarn: a ist die Zahl im Text, b der Abstand zum Nachbarn, ergebnis der Nachbar (a + b oder a − b). stufe ist 1, 10 oder 100.
   Zahlenstrahl: Form «position», die Antwort ist eine Zahl (antwort.zahl). Zufall nur über den rng, Teilung wie in app/uebungstypen/zahlenstrahl. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const zw = Z.zwischen, MINUS = '−', ganz = Number.isInteger;
  const ohne = (rng, min, max, nicht) => { let n; do { n = zw(rng, min, max); } while (nicht(n)); return n; };

  /* ---------- Nachbarn ---------- */
  const NAME = { 1: ['Vorgänger von', 'Nachfolger von'], 10: ['Nachbarzehner unter', 'Nachbarzehner über'], 100: ['Nachbarhunderter unter', 'Nachbarhunderter über'] };

  /** richtung: 0 = nach unten (Vorgänger, kleinerer Nachbar), 1 = nach oben. zahl(rng) liefert die Zahl, nie schon auf dem Strich der Stufe. */
  function nachbar(id, s, stufe, richtung, zahl) {
    return { id, s, form: 'rechnung', mach(rng) {
      const n = zahl(rng), rest = n % stufe, unten = n - rest, ziel = richtung ? unten + stufe : (rest ? unten : n - stufe), abst = Math.abs(ziel - n);
      const text = `${NAME[stufe][richtung]} ${n}`, op = richtung ? '+' : MINUS, was = stufe === 10 ? 'Zehner' : 'Hunderter';
      const satz = richtung ? `Bis zum nächsten ${was} fehlen ${abst}.` : rest ? `${stufe === 10 ? 'Der Einer ist' : 'Zehner und Einer sind'} ${rest}.`
        : `${n} liegt selbst auf einem vollen ${was}. Der Nachbar darunter ist ein ${was} weniger.`;            // ab 0.2.0: die Zahl liegt schon auf dem Strich
      const schritte = stufe === 1 ? [`${n} ${op} 1 = ${ziel}`] : [satz, `${n} ${op} ${abst} = ${ziel}`];
      const mitte = stufe === 1 ? [n - 3, n + 3] : !rest && stufe === 10 ? [n - 20, n + 20] : [Math.floor(n / 100) * 100, Math.floor(n / 100) * 100 + 100];
      return { inhalt: Z.rechnung(n, op, abst, text, { art: 'nachbar', stufe, richtung: richtung ? 'ueber' : 'unter' }),
        hilfe: { weg: 'nachbarn', schritte, hilfsmittel: { name: 'zahlenstrahl', daten: { von: mitte[0], bis: mitte[1], marken: [n] } } } };
    } };
  }

  const gegenueber = i => {                                         // der Nachbar auf der anderen Seite
    const rest = i.a % i.stufe, unten = i.a - rest;
    return i.stufe === 1 ? i.a + (i.richtung === 'unter' ? 1 : -1) : i.richtung === 'unter' ? unten + i.stufe : rest ? unten : unten - i.stufe;   // liegt die Zahl auf dem Strich, ist der untere Nachbar einen Strich tiefer
  };
  const wechsel = (z, c, i) => Math.floor(z / 100) === Math.floor(i.a / 100) && Math.floor(c / 100) !== Math.floor(i.a / 100) && z % 100 === c % 100;

  const nachbarn = [
    nachbar('nb-vorgaenger', 1, 1, 0, rng => ohne(rng, 101, 999, n => n % 10 === 0)),
    nachbar('nb-nachfolger', 1, 1, 1, rng => ohne(rng, 100, 998, n => n % 10 === 9)),
    nachbar('nb-vorgaenger-ue', 2, 1, 0, rng => Z.vielfaches(rng, 10, 110, 1000)),            // Zehner und Hunderter: 450 → 449, 700 → 699
    nachbar('nb-nachfolger-ue', 2, 1, 1, rng => Z.vielfaches(rng, 10, 110, 1000) - 1),        // 459 → 460, 999 → 1000
    nachbar('nb-zehner-unten', 2, 10, 0, rng => ohne(rng, 101, 999, n => n % 10 === 0)),
    nachbar('nb-zehner-oben', 2, 10, 1, rng => ohne(rng, 101, 999, n => n % 10 === 0)),
    nachbar('nb-hunderter-unten', 2, 100, 0, rng => ohne(rng, 101, 999, n => n % 100 === 0)),
    nachbar('nb-hunderter-oben', 2, 100, 1, rng => ohne(rng, 101, 999, n => n % 100 === 0)),
    /* ab 0.2.0: Nachbarzehner besonders üben, auch wenn die Zahl schon auf einem Zehner liegt oder an der Hunderter- und Tausendergrenze */
    nachbar('nb-zehner-unten-strich', 2, 10, 0, rng => Z.vielfaches(rng, 10, 110, 990)),                  // 400 → 390
    nachbar('nb-zehner-oben-strich', 2, 10, 1, rng => Z.vielfaches(rng, 10, 110, 990)),                   // 400 → 410, 990 → 1000
    nachbar('nb-zehner-unten-hunderter', 3, 10, 0, rng => zw(rng, 1, 9) * 100 + zw(rng, 1, 9)),          // 403 → 400
    nachbar('nb-zehner-oben-hunderter', 3, 10, 1, rng => zw(rng, 1, 8) * 100 + zw(rng, 91, 99)),         // 397 → 400
    nachbar('nb-zehner-oben-tausend', 3, 10, 1, rng => zw(rng, 991, 999))                                // 996 → 1000
  ];

  const zuerstN = { 'nb-vorgaenger-ue': ['nb-vorgaenger'], 'nb-nachfolger-ue': ['nb-nachfolger'], 'nb-zehner-unten': ['nb-vorgaenger-ue'], 'nb-zehner-oben': ['nb-nachfolger-ue'],
    'nb-hunderter-unten': ['nb-zehner-unten'], 'nb-hunderter-oben': ['nb-zehner-oben'],
    'nb-zehner-unten-strich': ['nb-zehner-unten'], 'nb-zehner-oben-strich': ['nb-zehner-oben'], 'nb-zehner-unten-hunderter': ['nb-zehner-unten'],
    'nb-zehner-oben-hunderter': ['nb-zehner-oben'], 'nb-zehner-oben-tausend': ['nb-zehner-oben-hunderter'] };
  L.generator('mathe-zahlraum-1000/nachbarn', F.bauen('mathe-zahlraum-1000/nachbarn', nachbarn, F.zahlDiag(
    (z, c, i) => z === gegenueber(i) && 'nachbar-andere-seite',
    (z, c, i) => wechsel(z, c, i) && 'hunderter-uebergang',
    (z, c) => z >= 100 && z <= 999 && z % 100 === c % 100 && Math.floor(z / 100) !== Math.floor(c / 100) && 'hunderterziffer-falsch'), zuerstN));

  /* ---------- Zahlenstrahl ---------- */
  const GROSS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  function teilung(von, bis) {                                      // wie in app/uebungstypen/zahlenstrahl/typ.js: beschriftete und feine Striche
    const gross = GROSS.find(s => (bis - von) / s <= 12), anfang = Number(String(gross)[0]);
    return { gross, klein: gross === 1 ? 1 : gross / (anfang === 1 ? 10 : anfang) };
  }

  /** Familie auf dem Strahl von bis; zahl(rng, von) liefert die gesuchte Zahl. */
  function strahl(id, s, bereich, zahl, toleranz = 0) {
    return { id, s, form: 'position', mach(rng) {
      const [von, bis] = bereich(rng), z = zahl(rng, von), { gross } = teilung(von, bis), unten = Math.floor(z / gross) * gross;
      const schritte = ['Lies die Zahlen unter den langen Strichen und zähle die Striche nicht.',
        ...(z % gross === 0 ? [`${z} liegt auf einem langen Strich.`] : [`${z} liegt zwischen ${unten} und ${unten + gross}.`, `${z} − ${unten} = ${z - unten}`])];
      return { inhalt: { zahl: z, von, bis, toleranz }, hilfe: { weg: 'strahl', schritte } };
    } };
  }

  const hunderter = rng => { const von = zw(rng, 0, 9) * 100; return [von, von + 100]; };
  const zahlenstrahl = [
    strahl('zs-hunderter', 1, () => [0, 1000], rng => zw(rng, 1, 9) * 100),
    strahl('zs-fuenfzig', 1, () => [0, 1000], rng => zw(rng, 0, 9) * 100 + 50),
    strahl('zs-zehner-h', 1, hunderter, (rng, von) => von + zw(rng, 1, 9) * 10),
    strahl('zs-mitte', 1, hunderter, (rng, von) => von + 50),
    strahl('zs-zehner-ganz', 2, () => [0, 1000], rng => ohne(rng, 1, 99, n => n % 5 === 0) * 10, 10),
    strahl('zs-halb', 2, rng => { const von = rng.int(2) * 500; return [von, von + 500]; }, (rng, von) => von + ohne(rng, 1, 49, n => n % 5 === 0) * 10),
    strahl('zs-zweihundert', 2, rng => { const von = zw(rng, 0, 8) * 100; return [von, von + 200]; }, (rng, von) => von + zw(rng, 1, 19) * 10),
    strahl('zs-einer-h', 3, hunderter, (rng, von) => von + ohne(rng, 1, 99, n => n % 10 === 0)),
    strahl('zs-nahe-tausend', 3, () => [900, 1000], rng => 900 + zw(rng, 1, 99))
  ];

  const spiegel = i => i.von + i.bis - i.zahl;
  const zuerstS = { 'zs-fuenfzig': ['zs-hunderter'], 'zs-zehner-h': ['zs-hunderter'], 'zs-mitte': ['zs-zehner-h'], 'zs-zehner-ganz': ['zs-fuenfzig', 'zs-zehner-h'], 'zs-halb': ['zs-zehner-h'],
    'zs-zweihundert': ['zs-halb'], 'zs-einer-h': ['zs-zehner-h'], 'zs-nahe-tausend': ['zs-einer-h'] };
  L.generator('mathe-zahlraum-1000/zahlenstrahl', F.bauen('mathe-zahlraum-1000/zahlenstrahl', zahlenstrahl, (auf, antwort) => {
    const i = auf.inhalt, z = antwort && antwort.zahl;
    if (!ganz(z)) return 'sonstige';
    if (Math.abs(z - i.zahl) <= i.toleranz) return null;
    if (z === spiegel(i)) return 'strahl-gespiegelt';
    return Math.abs(z - i.zahl) === teilung(i.von, i.bis).klein ? 'strahl-ein-strich' : 'sonstige';
  }, zuerstS));
})(globalThis);
