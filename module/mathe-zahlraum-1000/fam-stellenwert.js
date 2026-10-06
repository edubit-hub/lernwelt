/* module/mathe-zahlraum-1000/fam-stellenwert.js: Aufgabenfamilien des Themas «stellenwert» (Hunderter, Zehner, Einer, Bündeln).
   Jede Familie hat eine stabile ID und bekommt bei jedem Auftritt neue Zahlen (_gemeinsam/familien). Reine Berechnung, Zufall nur über den rng.
   Schreibweise: H, Z, E für Hunderter, Zehner, Einer. Ob das Lehrmittel der Klasse dieselbe Schreibweise nutzt, ist offen (README, TODO).
   Bei Fragen nach Ziffer, Wert oder Anzahl ist a die Zahl im Text, b eine 0 und das Ergebnis die Antwort. art und stelle benennen die Frage. */
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
    }, diag: D((z, c, i) => z === i.a * 100 && 'wert-statt-anzahl', (z, c, i) => z === i.a && 'ziffer-statt-wert') }
  ];

  const zuerst = { 'sw-null': ['sw-hze'], 'sw-viele-zehner': ['sw-hze'], 'sw-viele-einer': ['sw-hze'], 'sw-wert': ['sw-ziffer-z'], 'sw-anzahl-z': ['sw-hze'], 'sw-entbuendeln': ['sw-anzahl-z'] };
  L.generator('mathe-zahlraum-1000/stellenwert', F.bauen('mathe-zahlraum-1000/stellenwert', familien, D(), zuerst));
})(globalThis);
