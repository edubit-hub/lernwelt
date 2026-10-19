/* module/mathe-zahlraum-1000/fam-stellenwert.js: Aufgabenfamilien des Themas «stellenwert» (Hunderter, Zehner, Einer, Bündeln).
   Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen (_gemeinsam/familien). Reine Berechnung, Zufall nur über den rng.
   Schreibweise: H, Z, E für Hunderter, Zehner, Einer. Ob das Lehrmittel der Klasse dieselbe Schreibweise nutzt, ist offen (README, TODO).
   Bei Fragen nach Ziffer, Wert oder Anzahl ist a die Zahl im Text, b eine 0 und das Ergebnis die Antwort. art und stelle benennen die Frage.
   Ab 0.2.0: Ziffernkarten (auch mit Nullen vorne) und Zeichnung in Worten (Quadrate, Striche, Punkte), die Familien sw-karten bis sw-zeichnen-anzahl. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const R = Z.rechnung, zw = Z.zwischen, tafel = (h, z, e) => ({ name: 'stellenwerttafel', daten: { h, z, e } });
  const hilfe = (weg, schritte, hilfsmittel) => ({ weg, schritte, hilfsmittel });
  const WERT = { h: 100, z: 10, e: 1 }, NAME = { h: 'Hunderterziffer', z: 'Zehnerziffer', e: 'Einerziffer' };
  const summe = (h, z, e) => `${h * 100} + ${z * 10} + ${e} = ${h * 100 + z * 10 + e}`;
  const teile = (h, z, e) => [`${h} H = ${h * 100}`, `${z} Z = ${z * 10}`, `${e} E = ${e}`];
  const drei = rng => rng.mische([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);       // drei verschiedene Ziffern: eine verwechselte Stelle fällt am Ergebnis auf

  const ueblich = [(z, c) => Z.einerZehnerVertauscht(z, c) && 'zehner-einer-vertauscht', (z, c) => Z.nullVergessen(z, c) && 'null-vergessen'];
  const D = (...regeln) => F.zahlDiag(...regeln, ...ueblich);
  const ziffern = i => { const s = Z.stellen(i.a); return [s.h, s.z, s.e]; };

  /* Zeichnung in Worten (Annahme, die Zeichenweise des Lehrmittels ist offen): Hunderterquadrat, Zehnerstrich, Einerpunkt. */
  const ZEICHEN = { h: 'Hunderterquadrat', z: 'Zehnerstrich', e: 'Einerpunkt' };
  const anzahlVon = (n, stelle) => `${n} ${ZEICHEN[stelle]}${n === 1 ? '' : 'e'}`;
  /** «3 Hunderterquadrate, 0 Zehnerstriche, 5 Einerpunkte». weg nennt Stellen, die nicht im Text stehen (sie bleiben leer). */
  const zeichnung = (h, z, e, weg = []) => ['h', 'z', 'e'].filter(s => !weg.includes(s)).map(s => anzahlVon({ h, z, e }[s], s)).join(', ');

  function ziffer(id, stelle) {
    return { id, s: 1, form: 'rechnung', mach(rng) {
      const [h, z, e] = drei(rng), n = h * 100 + z * 10 + e, d = { h, z, e }[stelle];
      return { inhalt: R(n, '+', 0, `${NAME[stelle]} von ${n}`, { ergebnis: d, art: 'ziffer', stelle }),
        hilfe: hilfe('stellen', [`${n} = ${h * 100} + ${z * 10} + ${e}`, `Die ${NAME[stelle]} ist ${d}.`], tafel(h, z, e)) };
    }, diag: D((z, c, i) => ziffern(i).includes(z) && 'stelle-verwechselt') };
  }

  const buendeln = (id, text) => ({ id, s: 3, form: 'rechnung', mach(rng) {      // mehr als 9 Zehner oder mehr als 9 Einer
    const viele = id === 'sw-viele-zehner', h = zw(rng, 1, viele ? 8 : 9), z = viele ? zw(rng, 10, 16) : zw(rng, 1, 8), e = viele ? zw(rng, 1, 9) : zw(rng, 10, 19);
    return { inhalt: R(h * 100 + z * 10, '+', e, `${h} H + ${z} Z + ${e} E`, { h, z, e, art: 'buendeln' }),
      hilfe: hilfe('buendeln', [text, ...teile(h, z, e), summe(h, z, e)], tafel(h, z, e)) };
  }, diag: D((z, c, i) => z === Number(`${i.h}${i.z}${i.e}`) && 'buendeln-vergessen') });

  const familien = [
    { id: 'sw-hze', s: 1, form: 'rechnung', mach(rng) {
      const h = zw(rng, 1, 9), z = zw(rng, 1, 9), e = zw(rng, 1, 9);
      return { inhalt: R(h * 100 + z * 10, '+', e, `${h} H + ${z} Z + ${e} E`, { h, z, e }), hilfe: hilfe('stellen', [...teile(h, z, e), summe(h, z, e)], tafel(h, z, e)) };
    } },
    { id: 'sw-null', s: 2, form: 'rechnung', mach(rng) {                      // eine Stelle ist leer: die Null hält den Platz
      const h = zw(rng, 1, 9), art = rng.int(3), z = art === 1 ? zw(rng, 1, 9) : 0, e = art === 1 ? 0 : zw(rng, 1, 9);
      const text = art === 0 ? `${h} H + ${e} E` : art === 1 ? `${h} H + ${z} Z` : `${h} H + 0 Z + ${e} E`;
      const leer = z === 0 ? 'Kein Zehner: In der Zehnerstelle steht eine 0.' : 'Kein Einer: In der Einerstelle steht eine 0.';
      return { inhalt: R(h * 100 + z * 10, '+', e, text, { h, z, e }), hilfe: hilfe('stellen', [`${h} H = ${h * 100}`, leer, summe(h, z, e)], tafel(h, z, e)) };
    } },
    buendeln('sw-viele-zehner', '10 Z sind 1 H.'), buendeln('sw-viele-einer', '10 E sind 1 Z.'),
    ziffer('sw-ziffer-h', 'h'), ziffer('sw-ziffer-z', 'z'), ziffer('sw-ziffer-e', 'e'),
    { id: 'sw-wert', s: 2, form: 'rechnung', mach(rng) {
      const [h, z, e] = drei(rng), n = h * 100 + z * 10 + e, stelle = rng.waehle(['h', 'z', 'e']), d = { h, z, e }[stelle], wert = d * WERT[stelle], S = stelle.toUpperCase();
      return { inhalt: R(n, '+', 0, `Wert der ${d} in ${n}`, { ergebnis: wert, art: 'wert', stelle, ziffer: d }),
        hilfe: hilfe('stellen', [`Die ${d} steht an der Stelle ${S}.`, `${d} ${S} = ${wert}`], tafel(h, z, e)) };
    }, diag: D((z, c, i) => z === i.ziffer && 'ziffer-statt-wert', (z, c, i) => ziffern(i).some((d, k) => z === d * [100, 10, 1][k]) && 'stelle-verwechselt') },
    { id: 'sw-anzahl-z', s: 2, form: 'rechnung', mach(rng) {                  // wie viele Zehner stecken in der Zahl
      const h = zw(rng, 1, 9), z = zw(rng, 1, 9), n = h * 100 + z * 10;
      return { inhalt: R(n, ':', 10, `Zehner in ${n}`, { art: 'anzahl' }), hilfe: hilfe('buendeln', ['1 Z = 10', `${n} : 10 = ${n / 10}`], tafel(h, z, 0)) };
    }, diag: D((z, c, i) => z === i.a && 'wert-statt-anzahl', (z, c, i) => z === Z.stellen(i.a).z && 'ziffer-statt-wert') },
    { id: 'sw-entbuendeln', s: 2, form: 'rechnung', mach(rng) {                // 1 H sind 10 Z
      const h = zw(rng, 2, 9);
      return { inhalt: R(h, '·', 10, `${h} H in Zehnern`, { art: 'entbuendeln' }), hilfe: hilfe('buendeln', ['1 H sind 10 Z.', `${h} · 10 = ${h * 10}`], tafel(h, 0, 0)) };
    }, diag: D((z, c, i) => z === i.a * 100 && 'wert-statt-anzahl', (z, c, i) => z === i.a && 'ziffer-statt-wert') },

    /* ---------- Ziffernkarten und Zeichnung (neu in 0.2.0) ---------- */
    { id: 'sw-karten', s: 2, form: 'rechnung', mach(rng) {                  // drei Karten H Z E, an der Stelle der Zehner oder Einer steht eine 0
      const h = zw(rng, 1, 9), art = rng.int(3), z = art === 1 ? zw(rng, 1, 9) : 0, e = art === 0 ? zw(rng, 1, 9) : 0;
      return { inhalt: R(h * 100 + z * 10, '+', e, `Karten ${h} ${z} ${e}`, { h, z, e, art: 'karten' }),
        hilfe: hilfe('karten-zeichnung', ['Eine Karte mit 0 heisst: Die Stelle ist leer.', ...teile(h, z, e), summe(h, z, e)], tafel(h, z, e)) };
    } },
    { id: 'sw-karten-nullen', s: 3, form: 'rechnung', mach(rng) {           // fünf Karten, vorne stehen zwei bis vier Nullen: sie ändern die Zahl nicht
      const vorn = zw(rng, 2, 4), ziff = [zw(rng, 1, 9), ...Array.from({ length: 4 - vorn }, () => zw(rng, 0, 9))];
      const n = Number(ziff.join('')), s = Z.stellen(n), karten = [...Array(vorn).fill(0), ...ziff].join(' ');
      return { inhalt: R(n, '+', 0, `Karten ${karten}`, { art: 'karten-nullen', nullen: vorn }),
        hilfe: hilfe('karten-zeichnung', ['Nullen ganz vorne ändern die Zahl nicht.', ...teile(s.h, s.z, s.e), summe(s.h, s.z, s.e)], tafel(s.h, s.z, s.e)) };
    } },
    { id: 'sw-zeichnung', s: 2, form: 'rechnung', mach(rng) {              // Zeichnung mit 1 bis 9 Quadraten, Strichen und Punkten
      const h = zw(rng, 1, 9), z = zw(rng, 1, 9), e = zw(rng, 1, 9);
      return { inhalt: R(h * 100 + z * 10, '+', e, zeichnung(h, z, e), { h, z, e, art: 'zeichnung' }),
        hilfe: hilfe('karten-zeichnung', [...teile(h, z, e), summe(h, z, e)], tafel(h, z, e)) };
    } },
    { id: 'sw-zeichnung-null', s: 3, form: 'rechnung', mach(rng) {          // Striche oder Punkte fehlen: im Text steht gar nichts oder eine 0
      const h = zw(rng, 1, 9), art = rng.int(4), leer = art % 2 === 0 ? 'z' : 'e', z = leer === 'z' ? 0 : zw(rng, 1, 9), e = leer === 'e' ? 0 : zw(rng, 1, 9);
      const text = zeichnung(h, z, e, art < 2 ? [leer] : []), satz = leer === 'z' ? 'Kein Zehnerstrich: In der Zehnerstelle steht eine 0.' : 'Kein Einerpunkt: In der Einerstelle steht eine 0.';
      return { inhalt: R(h * 100 + z * 10, '+', e, text, { h, z, e, art: 'zeichnung-null' }), hilfe: hilfe('karten-zeichnung', [satz, ...teile(h, z, e), summe(h, z, e)], tafel(h, z, e)) };
    } },
    { id: 'sw-zeichnung-viele', s: 3, form: 'rechnung', mach(rng) {         // mehr als 9 Striche oder Punkte: bündeln
      const viele = rng.int(2) === 0, h = zw(rng, 1, 7), z = viele ? zw(rng, 10, 15) : zw(rng, 1, 8), e = viele ? zw(rng, 1, 9) : zw(rng, 10, 19);
      return { inhalt: R(h * 100 + z * 10, '+', e, zeichnung(h, z, e), { h, z, e, art: 'zeichnung-viele' }),
        hilfe: hilfe('buendeln', [viele ? '10 Z sind 1 H.' : '10 E sind 1 Z.', ...teile(h, z, e), summe(h, z, e)], tafel(h, z, e)) };
    }, diag: D((z, c, i) => z === Number(`${i.h}${i.z}${i.e}`) && 'buendeln-vergessen') },
    { id: 'sw-zeichnen-anzahl', s: 2, form: 'rechnung', mach(rng) {          // wie viele Quadrate, Striche oder Punkte hat die Zeichnung der Zahl
      const h = zw(rng, 1, 9), z = rng.int(3) === 0 ? 0 : zw(rng, 1, 9), e = rng.int(3) === 0 ? 0 : zw(rng, 1, 9), stelle = rng.waehle(['h', 'z', 'e']);
      const n = h * 100 + z * 10 + e, d = { h, z, e }[stelle];
      return { inhalt: R(n, '+', 0, `${ZEICHEN[stelle]}e in der Zeichnung von ${n}`, { ergebnis: d, art: 'zeichnen-anzahl', stelle }),
        hilfe: hilfe('karten-zeichnung', [`${n} = ${h * 100} + ${z * 10} + ${e}`, `Die Zeichnung hat ${anzahlVon(d, stelle)}.`], tafel(h, z, e)) };
    }, diag: D((z, c, i) => ziffern(i).includes(z) && 'stelle-verwechselt', (z, c, i) => z === c * WERT[i.stelle] && 'wert-statt-anzahl') }
  ];

  const zuerst = { 'sw-null': ['sw-hze'], 'sw-viele-zehner': ['sw-hze'], 'sw-viele-einer': ['sw-hze'], 'sw-wert': ['sw-ziffer-z'], 'sw-anzahl-z': ['sw-hze'], 'sw-entbuendeln': ['sw-anzahl-z'],
    'sw-karten': ['sw-null'], 'sw-karten-nullen': ['sw-karten'], 'sw-zeichnung': ['sw-hze'], 'sw-zeichnung-null': ['sw-zeichnung', 'sw-null'], 'sw-zeichnung-viele': ['sw-zeichnung', 'sw-viele-zehner'],
    'sw-zeichnen-anzahl': ['sw-zeichnung', 'sw-ziffer-z'] };
  L.generator('mathe-zahlraum-1000/stellenwert', F.bauen('mathe-zahlraum-1000/stellenwert', familien, D(), zuerst));
})(globalThis);
