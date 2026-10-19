/* module/mathe-zahlraum-1000/fam-plaettchen-moeglich.js: Aufgabenfamilien des Themas «plaettchen-moeglich» (ab 0.2.0): Plättchen in der Stellentafel,
   Fragen mit mehreren möglichen Zahlen («Welche Zahl kann entstehen?», «Welche Zahl kann nicht entstehen?»), Fragen nach der Zahl mit einer bestimmten Zahl
   Plättchen und nach der Zahl mit den meisten oder wenigsten Plättchen. Form «auswahl», Typ «multiple-choice»: eine richtige Zahl, dazu falsche Zahlen mit je einem Fehlercode.
   Auf der Tafel liegt eine dreistellige Zahl, die Ziffer ist die Zahl der Plättchen in der Spalte. Ein Plättchen kommt dazu oder fällt weg, dann ändert sich genau
   eine Spalte um 1: aus n wird n + 100, n + 10 oder n + 1 (dazu) oder n − 100, n − 10 oder n − 1 (weg). Damit es keine Streitfälle mit dem Bündeln gibt, hat bei allen
   Zahlen jede Spalte Platz für das Plättchen: dazu nur Ziffern bis 8, weg nur Ziffern ab 1 (Hunderter ab 2). Bei «kann nicht» sind die falschen Antworten die möglichen Zahlen,
   bei «kann» sind sie unmögliche Zahlen. Die Rechenfragen zu den Plättchen stehen im Thema «plaettchen» (Form rechnung). Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const zw = Z.zwischen, MINUS = '−', SP = ['h', 'z', 'e'];
  const WERT = { h: 100, z: 10, e: 1 };
  const ziff = n => ({ h: Math.floor(n / 100), z: Math.floor(n / 10) % 10, e: n % 10 });
  const summe = n => { const d = ziff(n); return d.h + d.z + d.e; };
  const drin = x => x >= 100 && x <= 999;
  const tafel = n => ({ name: 'stellenwerttafel', daten: { ...ziff(n), zeige: 'plaettchen' } });
  const rechnung = (a, op, b) => `${a} ${op} ${b} = ${op === '+' ? a + b : a - b}`;
  const gleichung = n => { const d = ziff(n); return `${d.h} + ${d.z} + ${d.e} = ${summe(n)}`; };
  /** Eine dreistellige Zahl mit s Plättchen, die nicht in aus steht. Sucht mit dem rng weiter. */
  const zahlMit = (rng, s, aus) => { let x; do { x = rng.int(900) + 100; } while (summe(x) !== s || aus.includes(x)); return x; };

  /** Eine Frage zur Tafel mit der Zahl n. richtung: 'dazu', 'weg' oder 'vorher' (Nach einem Plättchen mehr liegt n da, was lag vorher?).
      nicht: Welche Zahl kann NICHT entstehen? */
  function tafelFrage(id, s, richtung, nicht) {
    const dazu = richtung === 'dazu', vz = dazu ? 1 : -1, op = dazu ? '+' : MINUS;
    return { id, s, form: 'auswahl', mach(rng) {
      const d = { h: dazu ? zw(rng, 1, 8) : zw(rng, 2, 9), z: dazu ? zw(rng, 0, 8) : zw(rng, 1, 9), e: dazu ? zw(rng, 0, 8) : zw(rng, 1, 9) };
      const n = d.h * 100 + d.z * 10 + d.e;
      const moeglich = SP.map(sp => n + vz * WERT[sp]);                                       // eine Spalte ändert sich um 1
      const gegen = SP.map(sp => n - vz * WERT[sp]).filter(drin);                              // Plättchen in die andere Richtung
      const zwei = [2, 20, 200, 11, 101, 110].map(w => n + vz * w).filter(drin);               // zwei Plättchen statt einem
      let richtig, falsch;
      if (nicht) {
        richtig = rng.waehle([...gegen, ...zwei]);
        falsch = moeglich.map(x => ({ text: String(x), code: 'frage-nicht-verwechselt' }));
      } else {
        richtig = rng.waehle(moeglich);
        falsch = [...(gegen.length ? [{ text: String(rng.waehle(gegen)), code: 'plaettchen-richtung' }] : []),
          ...rng.mische(zwei).slice(0, 3).map(x => ({ text: String(x), code: 'plaettchen-zwei-aenderungen' }))].slice(0, 3);
      }
      const kopf = dazu ? `Zu ${n} kommt ein Plättchen.` : richtung === 'weg' ? `Von ${n} fällt ein Plättchen weg.` : `Nach einem Plättchen mehr liegt ${n} auf der Tafel.`;
      const satz = richtung === 'vorher'
        ? (nicht ? 'Welche Zahl kann vorher nicht auf der Tafel gelegen haben?' : 'Welche Zahl kann vorher auf der Tafel gelegen haben?')
        : (nicht ? 'Welche Zahl kann nicht entstehen?' : 'Welche Zahl kann entstehen?');
      const wo = dazu ? 'dazukommen' : richtung === 'weg' ? 'wegfallen' : 'gelegen haben';
      const schritte = [`Das Plättchen kann bei den Hundertern, Zehnern oder Einern ${wo}.`, ...SP.map(sp => rechnung(n, op, WERT[sp]))];
      return { inhalt: { frage: `${kopf} ${satz}`, richtig: String(richtig), falsch, art: 'moeglich', n, richtung, nicht, moeglich },
        hilfe: { weg: 'plaettchen', schritte, hilfsmittel: tafel(n) } };
    } };
  }

  /** Welche Zahl braucht genau t Plättchen (t von 10 bis 19)? Eine Falle: Die Zahl t · 10 sieht nach t aus, braucht aber weniger Plättchen. */
  function genau(id, s) {
    return { id, s, form: 'auswahl', mach(rng) {
      const t = zw(rng, 10, 19), richtig = zahlMit(rng, t, []), falle = t * 10;
      const a = zahlMit(rng, t + (rng.int(2) ? 1 : -1), [richtig]), b = zahlMit(rng, t + (rng.int(2) ? 2 : -2), [richtig, a]);
      const falsch = [{ text: String(falle), code: 'plaettchen-zahl-statt-anzahl' }, { text: String(a), code: 'plaettchen-summe-falsch' }, { text: String(b), code: 'plaettchen-summe-falsch' }];
      const schritte = [`${t} Plättchen: Die Ziffern der Zahl ergeben zusammen ${t}.`, ...[richtig, falle, a, b].sort((x, y) => x - y).flatMap(x => [`Plättchen für ${x}:`, gleichung(x)]), `Genau ${t} Plättchen braucht ${richtig}.`];
      return { inhalt: { frage: `Welche Zahl braucht genau ${t} Plättchen?`, richtig: String(richtig), falsch, art: 'genau', t }, hilfe: { weg: 'plaettchen', schritte } };
    } };
  }

  /** Welche Zahl braucht gleich viele Plättchen wie n? Die richtige Zahl entsteht, wenn ein Plättchen in eine andere Spalte wandert. Die falschen liegen neben n. */
  function gleichViele(id, s) {
    return { id, s, form: 'auswahl', mach(rng) {
      const d = { h: zw(rng, 2, 8), z: zw(rng, 1, 8), e: zw(rng, 1, 8) }, n = d.h * 100 + d.z * 10 + d.e;
      const [von, nach] = rng.mische(SP).slice(0, 2), richtig = n - WERT[von] + WERT[nach];
      const falsch = rng.mische([n + 1, n - 1, n + 10, n - 10, n + 100, n - 100]).slice(0, 3).map(x => ({ text: String(x), code: 'plaettchen-summe-falsch' }));
      const schritte = [`Plättchen für ${n}:`, gleichung(n), 'Wandert ein Plättchen in eine andere Spalte, bleibt die Zahl der Plättchen gleich.', `Plättchen für ${richtig}:`, gleichung(richtig)];
      return { inhalt: { frage: `Welche Zahl braucht gleich viele Plättchen wie ${n}?`, richtig: String(richtig), falsch, art: 'gleich-viele', n }, hilfe: { weg: 'plaettchen', schritte, hilfsmittel: tafel(n) } };
    } };
  }

  /** Welche von vier Zahlen braucht die meisten (oder wenigsten) Plättchen? Eine Falle: Die grösste (kleinste) Zahl hat nicht die meisten (wenigsten). */
  function summen(id, s, meiste) {
    return { id, s, form: 'auswahl', mach(rng) {
      let liste, soll, extremZahl;
      do {
        liste = [];
        while (liste.length < 4) { const x = rng.int(900) + 100; if (!liste.includes(x)) liste.push(x); }
        const sm = liste.map(summe);
        soll = sm.indexOf(meiste ? Math.max(...sm) : Math.min(...sm));
        extremZahl = meiste ? Math.max(...liste) : Math.min(...liste);
      } while (new Set(liste.map(summe)).size < 4 || liste[soll] === extremZahl);
      const falsch = liste.filter((x, k) => k !== soll).map(x => (x === extremZahl ? { text: String(x), code: 'plaettchen-zahl-statt-anzahl' } : { text: String(x) }));
      const schritte = [...[...liste].sort((a, b) => a - b).flatMap(x => [`Plättchen für ${x}:`, gleichung(x)]), `Die ${meiste ? 'meisten' : 'wenigsten'} Plättchen braucht ${liste[soll]}.`];
      return { inhalt: { frage: `Welche Zahl braucht die ${meiste ? 'meisten' : 'wenigsten'} Plättchen?`, richtig: String(liste[soll]), falsch, art: meiste ? 'meiste' : 'wenigste', zahlen: liste },
        hilfe: { weg: 'plaettchen', schritte } };
    } };
  }

  const familien = [
    tafelFrage('pm-kann-dazu', 1, 'dazu', false), tafelFrage('pm-kann-weg', 1, 'weg', false),
    tafelFrage('pm-nicht-dazu', 2, 'dazu', true), tafelFrage('pm-nicht-weg', 2, 'weg', true),
    tafelFrage('pm-kann-vorher', 2, 'vorher', false), tafelFrage('pm-nicht-vorher', 3, 'vorher', true),
    genau('pm-genau', 2), summen('pm-meiste', 2, true), summen('pm-wenigste', 3, false), gleichViele('pm-gleich-viele', 3)
  ];

  const voraus = { 'pm-kann-weg': ['pm-kann-dazu'], 'pm-nicht-dazu': ['pm-kann-dazu'], 'pm-nicht-weg': ['pm-nicht-dazu', 'pm-kann-weg'],
    'pm-kann-vorher': ['pm-kann-weg'], 'pm-nicht-vorher': ['pm-nicht-weg', 'pm-kann-vorher'],
    'pm-wenigste': ['pm-meiste'], 'pm-gleich-viele': ['pm-genau', 'pm-meiste'] };

  L.generator('mathe-zahlraum-1000/plaettchen-moeglich', F.bauen('mathe-zahlraum-1000/plaettchen-moeglich', familien, undefined, voraus));
})(globalThis);
