/* module/mathe-zahlraum-1000/fam-plaettchen.js: Aufgabenfamilien des Themas «plaettchen» (ab 0.2.0): Plättchen in der Stellentafel.
   Auf der Tafel liegt eine dreistellige Zahl, in jeder Spalte (Hunderter, Zehner, Einer) liegen höchstens 9 Plättchen. Ein Plättchen kommt dazu oder fällt weg,
   dann ändert sich genau eine Spalte um 1. Die Zahl der Plättchen einer Zahl ist ihre Ziffernsumme.
   Form «rechnung», Typ «eingabe». Bei Fragen nach der Zahl der Plättchen und nach der grössten oder kleinsten Zahl ist a die Zahl im Text, b eine 0 und das
   Ergebnis die Antwort. Die Fragen mit mehreren Lösungen («welche Zahl kann entstehen?») stehen im Thema «plaettchen-moeglich» (Form auswahl).
   Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const R = Z.rechnung, zw = Z.zwischen, MINUS = '−';
  const WORT = { h: 'Hunderter', z: 'Zehner', e: 'Einer' }, WERT = { h: 100, z: 10, e: 1 };
  const tafel = n => { const s = Z.stellen(n); return { name: 'stellenwerttafel', daten: { h: s.h, z: s.z, e: s.e, zeige: 'plaettchen' } }; };
  const hilfe = (schritte, n) => ({ weg: 'plaettchen', schritte, hilfsmittel: tafel(n) });
  const summe = x => [...String(x)].reduce((s, d) => s + Number(d), 0);
  /** Grösste dreistellige Zahl mit n Plättchen (je Spalte höchstens 9): zuerst alle in die Hunderter. */
  const gross = n => { const h = Math.min(9, n), z = Math.min(9, n - h); return h * 100 + z * 10 + (n - h - z); };
  /** Kleinste dreistellige Zahl mit n Plättchen: ein Hunderter, der Rest zuerst in die Einer. */
  const klein = n => { const e = Math.min(9, n - 1), z = Math.min(9, n - 1 - e); return 100 + z * 10 + e; };

  /** Ein Plättchen kommt dazu oder fällt weg, in der Spalte stelle. Die Ziffer dieser Spalte lässt das zu (dazu: höchstens 8, weg: mindestens 1, bei den Hundertern mindestens 2). */
  function aendern(id, stelle, dazu) {
    return { id, s: 1, form: 'rechnung', mach(rng) {
      const d = { h: zw(rng, 1, 9), z: zw(rng, 0, 9), e: zw(rng, 0, 9) };
      d[stelle] = dazu ? zw(rng, stelle === 'h' ? 1 : 0, 8) : zw(rng, stelle === 'h' ? 2 : 1, 9);
      const n = d.h * 100 + d.z * 10 + d.e, w = WERT[stelle], op = dazu ? '+' : MINUS;
      return { inhalt: R(n, op, w, `${n} und ein ${WORT[stelle]}-Plättchen ${dazu ? 'mehr' : 'weniger'}`, { art: dazu ? 'dazu' : 'weg', stelle }),
        hilfe: hilfe([`Ein ${WORT[stelle]}-Plättchen zählt ${w}.`, `${n} ${op} ${w} = ${dazu ? n + w : n - w}`], n) };
    } };
  }

  /** Wie viele Plättchen braucht die Zahl? Mit nullen liegt in mindestens einer Spalte kein Plättchen. */
  function anzahl(id, nullen) {
    return { id, s: 2, form: 'rechnung', mach(rng) {
      const art = nullen ? rng.int(3) : -1, h = zw(rng, 1, 9), z = art === 0 || art === 2 ? 0 : zw(rng, 1, 9), e = art === 1 || art === 2 ? 0 : zw(rng, 1, 9);
      const n = h * 100 + z * 10 + e;
      return { inhalt: R(n, '+', 0, `Plättchen für ${n}`, { ergebnis: h + z + e, art: 'anzahl' }), hilfe: hilfe([`${h} + ${z} + ${e} = ${h + z + e}`], n) };
    } };
  }

  /** Grösste oder kleinste dreistellige Zahl mit n Plättchen, n von min bis max. */
  function extrem(id, s, groesste, min, max) {
    return { id, s, form: 'rechnung', mach(rng) {
      const n = zw(rng, min, max), c = groesste ? gross(n) : klein(n), rest = n - 9;
      const wege = groesste
        ? (n <= 9 ? [`Alle ${n} Plättchen kommen zu den Hundertern.`, `${n} · 100 = ${c}`]
          : ['In einer Spalte liegen höchstens 9 Plättchen.', '9 · 100 = 900', `Die übrigen ${rest} Plättchen kommen zu den Zehnern.`, `${rest} · 10 = ${rest * 10}`, `900 + ${rest * 10} = ${c}`])
        : (n <= 9 ? ['Ein Plättchen kommt zu den Hundertern, sonst hat die Zahl keine drei Stellen.', `Die übrigen ${n - 1} Plättchen kommen zu den Einern.`, `100 + ${n - 1} = ${c}`]
          : ['Ein Plättchen kommt zu den Hundertern, sonst hat die Zahl keine drei Stellen.', 'Bei den Einern liegen höchstens 9 Plättchen.',
            ...(n > 10 ? [`Die übrigen ${n - 10} Plättchen kommen zu den Zehnern.`] : []), `100 + ${(n - 10) * 10} + 9 = ${c}`]);
      return { inhalt: R(n, '+', 0, `${groesste ? 'Grösste' : 'Kleinste'} dreistellige Zahl mit ${n} Plättchen`, { ergebnis: c, art: groesste ? 'gross' : 'klein', n }), hilfe: hilfe(wege, c) };
    } };
  }

  /** Alle Zahlen, die entstehen können, wenn auf der Tafel n liegt und ein Plättchen dazukommt (richtung +1) oder wegfällt (−1): eine Spalte ändert sich. */
  const moeglich = (n, richtung) => [100, 10, 1].map(w => n + richtung * w);

  /** Die grösste oder kleinste dieser Zahlen. richtung +1: nach dem Dazulegen, −1: vor dem Dazulegen ('vorher', die Zahl auf der Tafel ist dann das Ergebnis). */
  function extremFolge(id, groesste, richtung) {
    return { id, s: 3, form: 'rechnung', mach(rng) {
      const dazu = richtung > 0, d = { h: zw(rng, 2, 8), z: zw(rng, 1, 8), e: zw(rng, 1, 8) }, n = d.h * 100 + d.z * 10 + d.e;       // alle Ziffern 1 bis 8: jede Spalte lässt das Plättchen zu, und die Gegenrichtung bleibt dreistellig
      const alle = moeglich(n, richtung), c = groesste ? Math.max(...alle) : Math.min(...alle), w = Math.abs(c - n), op = dazu ? '+' : MINUS;
      const text = dazu ? `Zu ${n} kommt ein Plättchen: ${groesste ? 'grösste' : 'kleinste'} Zahl nachher` : `Nach einem Plättchen mehr liegt ${n}: ${groesste ? 'grösste' : 'kleinste'} Zahl vorher`;
      const reihe = [...alle.filter(x => x !== c), c];                                                                                  // die gesuchte Zahl steht zuletzt
      return { inhalt: R(n, op, w, text, { art: 'extrem', extrem: groesste ? 'gross' : 'klein', moeglich: alle, gegen: moeglich(n, -richtung) }),
        hilfe: hilfe([dazu ? 'Das Plättchen kann bei den Hundertern, Zehnern oder Einern liegen.' : 'Das Plättchen lag bei den Hundertern, Zehnern oder Einern.', ...reihe.map(x => `${n} ${op} ${Math.abs(x - n)} = ${x}`)], n) };
    } };
  }

  const familien = [
    aendern('pl-dazu-e', 'e', true), aendern('pl-dazu-z', 'z', true), aendern('pl-dazu-h', 'h', true),
    aendern('pl-weg-e', 'e', false), aendern('pl-weg-z', 'z', false), aendern('pl-weg-h', 'h', false),
    anzahl('pl-anzahl', false), anzahl('pl-anzahl-null', true),
    extrem('pl-gross', 2, true, 3, 9), extrem('pl-klein', 2, false, 3, 9), extrem('pl-gross-10', 3, true, 10, 12), extrem('pl-klein-10', 3, false, 10, 12),
    extremFolge('pl-gross-dazu', true, 1), extremFolge('pl-klein-dazu', false, 1), extremFolge('pl-gross-vorher', true, -1), extremFolge('pl-klein-vorher', false, -1)
  ];

  const voraus = { 'pl-dazu-z': ['pl-dazu-e'], 'pl-dazu-h': ['pl-dazu-z'], 'pl-weg-e': ['pl-dazu-e'], 'pl-weg-z': ['pl-weg-e', 'pl-dazu-z'], 'pl-weg-h': ['pl-weg-z', 'pl-dazu-h'],
    'pl-anzahl': ['pl-dazu-e'], 'pl-anzahl-null': ['pl-anzahl'], 'pl-gross': ['pl-anzahl'], 'pl-klein': ['pl-gross'], 'pl-gross-10': ['pl-gross', 'pl-anzahl-null'],
    'pl-klein-10': ['pl-klein', 'pl-gross-10'], 'pl-gross-dazu': ['pl-dazu-h', 'pl-dazu-z'], 'pl-klein-dazu': ['pl-gross-dazu'], 'pl-gross-vorher': ['pl-weg-h', 'pl-gross-dazu'],
    'pl-klein-vorher': ['pl-gross-vorher'] };

  L.generator('mathe-zahlraum-1000/plaettchen', F.bauen('mathe-zahlraum-1000/plaettchen', familien, F.zahlDiag(
    (z, c, i) => (i.art === 'dazu' || i.art === 'weg') && z === (i.op === '+' ? i.a - i.b : i.a + i.b) && 'plaettchen-richtung',
    (z, c, i) => (i.art === 'dazu' || i.art === 'weg') && [1, 10, 100].some(w => w !== i.b && z === (i.op === '+' ? i.a + w : i.a - w)) && 'stelle-verwechselt',
    (z, c, i) => i.art === 'anzahl' && z === i.a && 'plaettchen-zahl-statt-anzahl',
    (z, c, i) => {                                                                      // grösste oder kleinste Zahl mit n Plättchen
      if (i.art !== 'gross' && i.art !== 'klein') return false;
      if (z === (i.art === 'gross' ? klein(i.n) : gross(i.n))) return 'plaettchen-gross-klein-verwechselt';
      if (summe(z) !== i.n) return 'plaettchen-summe-falsch';
      return z < 100 || z > 999 ? 'plaettchen-nicht-dreistellig' : 'plaettchen-nicht-extrem';
    },
    (z, c, i) => {                                                                      // grösste oder kleinste Zahl nach einem Plättchen
      if (i.art !== 'extrem') return false;
      if (i.moeglich.includes(z)) return z === (i.extrem === 'gross' ? Math.min(...i.moeglich) : Math.max(...i.moeglich)) ? 'plaettchen-gross-klein-verwechselt' : 'plaettchen-nicht-extrem';
      return i.gegen.includes(z) && 'plaettchen-richtung';
    }), voraus));
})(globalThis);
