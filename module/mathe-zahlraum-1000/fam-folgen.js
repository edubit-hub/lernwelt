/* module/mathe-zahlraum-1000/fam-folgen.js: Aufgabenfamilien des Themas «zahlenfolgen» (Zählen in Schritten, Zahlenfolge ergänzen, Form satz).
   Eine Folge hat sechs Zahlen, die ersten zwei stehen immer da, zwei weitere sind Lücken: «570, 580, {590}, {600}, 610, 620».
   Das Feld positionen nennt die Lücken (Index in werte), nicht luecken: dieses Feld liest der Typ «lueckentext» für Ablenker.
   Familien mit «ue» laufen über eine volle Hundertermarke und lassen die erste Zahl im anderen Hunderter als Lücke offen. Zufall nur über den rng. */
(function (g) {
  'use strict';
  const L = g.Lernwelt, Z = L.registry.bausteine.get('_gemeinsam/zahlen'), F = L.registry.bausteine.get('_gemeinsam/familien');
  if (!Z || !F) throw new Error('mathe-zahlraum-1000: die Bausteine «_gemeinsam/zahlen» und «_gemeinsam/familien» fehlen (modul.js, braucht).');

  const zw = Z.zwischen, MINUS = '−', LAENGE = 6;
  const ohneEins = (rng, liste, nicht) => rng.waehle(liste.filter(p => p !== nicht));

  /** Eine Folge. schritt: Zahl mit Vorzeichen. start(rng) liefert den Anfang, mit uebergang eine Zahl j (2 bis 4) und die Hundertermarke: werte[j] = marke. */
  function folge(id, s, schritt, start, uebergang = false) {
    return { id, s, form: 'satz', mach(rng) {
      let werte, positionen;
      if (uebergang) {
        const j = zw(rng, 2, 4), marke = start(rng);                      // start liefert hier die Marke, ein Vielfaches von 100
        werte = Array.from({ length: LAENGE }, (_, k) => marke + (k - j) * schritt);
        const kreuz = schritt > 0 ? j : j + 1;                            // die erste Zahl in einem anderen Hunderter bleibt Lücke
        positionen = [kreuz, ohneEins(rng, [2, 3, 4, 5], kreuz)].sort((a, b) => a - b);
      } else {
        const a = start(rng);
        werte = Array.from({ length: LAENGE }, (_, k) => a + k * schritt);
        positionen = rng.mische([2, 3, 4, 5]).slice(0, 2).sort((x, y) => x - y);
      }
      const text = werte.map((w, k) => (positionen.includes(k) ? `{${w}}` : String(w))).join(', ');
      const d = Math.abs(schritt), op = schritt > 0 ? '+' : MINUS, sichtbar = werte.filter((w, k) => !positionen.includes(k));
      const von = Math.floor(Math.min(...sichtbar) / 100) * 100, bis = Math.max(Math.ceil(Math.max(...sichtbar) / 100) * 100, von + 100);
      const schritte = [schritt > 0 ? `${werte[1]} − ${werte[0]} = ${d}` : `${werte[0]} − ${werte[1]} = ${d}`,
        ...positionen.map(p => `${werte[p - 1]} ${op} ${d} = ${werte[p]}`)];
      return { inhalt: { text, art: 'folge', werte, positionen, schritt },
        hilfe: { weg: 'folgen', schritte, hilfsmittel: { name: 'zahlenstrahl', daten: { von, bis, marken: sichtbar.slice(0, 8) } } } };
    } };
  }

  /** Ab 0.2.0. Genau drei Sprünge: vier Zahlen, nur die erste steht da. Der Text nennt die Schrittweite («Drei Sprünge, je 10 weiter: …»).
      schritt: Zahl mit Vorzeichen, start(rng) liefert die erste Zahl. Hilfe: der Rechenstrich mit den drei Sprüngen. */
  function sprung(id, s, schritt, start) {
    return { id, s, form: 'satz', mach(rng) {
      const a = start(rng), werte = [0, 1, 2, 3].map(k => a + k * schritt), d = Math.abs(schritt), op = schritt > 0 ? '+' : MINUS;
      const text = `Drei Sprünge, je ${d} ${schritt > 0 ? 'weiter' : 'zurück'}: ${werte.map((w, k) => (k ? `{${w}}` : String(w))).join(', ')}`;
      return { inhalt: { text, art: 'folge-3', werte, positionen: [1, 2, 3], schritt },
        hilfe: { weg: 'folgen', schritte: werte.slice(1).map((w, k) => `${werte[k]} ${op} ${d} = ${w}`), hilfsmittel: { name: 'rechenstrich', daten: { start: a, spruenge: [schritt, schritt, schritt] } } } };
    } };
  }

  /** Ab 0.2.0. Verdoppeln oder Halbieren immer weiter. luecken: 3 (vier Zahlen, nur die erste steht da) oder 5 (sieben Zahlen, die ersten zwei stehen da).
      Beim Verdoppeln liefert start(rng) die erste Zahl, beim Halbieren die letzte (Zahl nach dem letzten Halbieren), die Kette läuft rückwärts hoch. */
  function kette(id, s, doppelt, luecken, start) {
    return { id, s, form: 'satz', mach(rng) {
      const laenge = luecken === 3 ? 4 : 7, x = start(rng);                                   // 3 Lücken: 4 Zahlen, 5 Lücken: 7 Zahlen
      const aufwaerts = Array.from({ length: laenge }, (_, k) => x * 2 ** k), werte = doppelt ? aufwaerts : aufwaerts.reverse();
      const positionen = Array.from({ length: luecken }, (_, k) => laenge - luecken + k);
      const text = `Immer ${doppelt ? 'das Doppelte' : 'die Hälfte'}: ${werte.map((w, k) => (positionen.includes(k) ? `{${w}}` : String(w))).join(', ')}`;
      const sprungweiten = werte.slice(1).map((w, k) => w - werte[k]);
      return { inhalt: { text, art: doppelt ? 'verdoppeln' : 'halbieren', werte, positionen, schritt: null },
        hilfe: { weg: 'verdoppeln', schritte: positionen.map(p => (doppelt ? `${werte[p - 1]} · 2 = ${werte[p]}` : `${werte[p - 1]} : 2 = ${werte[p]}`)),
          hilfsmittel: { name: 'rechenstrich', daten: { start: werte[0], spruenge: sprungweiten } } } };
    } };
  }

  const familien = [
    folge('zf-10-vor', 1, 10, rng => zw(rng, 100, 940)),
    folge('zf-10-rueck', 1, -10, rng => zw(rng, 160, 999)),
    folge('zf-100-vor', 1, 100, rng => zw(rng, 50, 450)),
    folge('zf-100-rueck', 1, -100, rng => zw(rng, 550, 990)),
    folge('zf-2-vor', 2, 2, rng => zw(rng, 50, 495) * 2),
    folge('zf-2-rueck', 2, -2, rng => zw(rng, 50, 495) * 2),
    folge('zf-1-vor-ue', 2, 1, rng => zw(rng, 2, 9) * 100, true),
    folge('zf-1-rueck-ue', 3, -1, rng => zw(rng, 1, 8) * 100, true),
    folge('zf-10-ue', 3, 10, rng => zw(rng, 2, 9) * 100, true),
    /* ab 0.2.0: genau drei Sprünge, auch über den Hunderter und unter 100 */
    sprung('zf-3-100-vor', 1, 100, rng => zw(rng, 50, 690)),
    sprung('zf-3-100-rueck', 1, -100, rng => zw(rng, 410, 999)),
    sprung('zf-3-10-ue', 2, 10, rng => zw(rng, 2, 9) * 100 + zw(rng, 0, 9) - 10 * zw(rng, 1, 3)),         // genau ein Sprung läuft über einen vollen Hunderter
    sprung('zf-3-10-rueck-ue', 3, -10, rng => zw(rng, 1, 8) * 100 + zw(rng, 0, 9) + 10 * zw(rng, 0, 2)),
    sprung('zf-3-100-rueck-unter', 3, -100, rng => 300 + zw(rng, 1, 99)),                                  // der letzte Sprung endet unter 100
    /* ab 0.2.0: Verdoppeln und Halbieren immer weiter */
    kette('zf-verdoppeln-3', 2, true, 3, rng => zw(rng, 3, 125)),
    kette('zf-verdoppeln-lang', 3, true, 5, rng => zw(rng, 3, 15)),
    kette('zf-halbieren-3', 2, false, 3, rng => zw(rng, 3, 125)),
    kette('zf-halbieren-lang', 3, false, 5, rng => zw(rng, 3, 15))
  ];

  const hunderter = x => Math.floor(x / 100);

  L.generator('mathe-zahlraum-1000/zahlenfolgen', F.bauen('mathe-zahlraum-1000/zahlenfolgen', familien, (auf, antwort) => {
    const i = auf.inhalt, roh = antwort && antwort.luecken;
    if (!Array.isArray(roh) || roh.length !== i.positionen.length) return 'sonstige';
    const antworten = roh.map(w => (/^\d{1,5}$/.test(String(w)) ? Number(w) : NaN));
    const falsch = i.positionen.findIndex((p, k) => antworten[k] !== i.werte[p]);
    if (falsch < 0) return null;
    const p = i.positionen[falsch], soll = i.werte[p], vor = i.werte[p - 1], y = antworten[falsch];
    if (!Number.isInteger(y)) return 'sonstige';
    const kettenfolge = i.art === 'verdoppeln' || i.art === 'halbieren';
    if (kettenfolge && Math.abs(y - soll) === 100) return 'hunderter-daneben';                       // 480 verdoppelt ergibt 960, nicht 860
    if (kettenfolge && Math.abs(y - soll) === 10) return 'zehner-daneben';
    if (hunderter(soll) !== hunderter(vor) && y % 100 === soll % 100 && hunderter(y) !== hunderter(soll)) return 'hunderter-uebergang';
    if (i.art === 'folge-3' && y % 100 === 0 && Math.abs(y - vor) < Math.abs(soll - vor)) return 'auf-hunderter-gerundet';
    if (i.art === 'folge-3' && y === 0 && soll > 0 && soll < 100) return 'null-statt-rest';
    if (kettenfolge) return p >= 2 && y === vor + (vor - i.werte[p - 2]) ? 'abstand-statt-doppelt' : 'sonstige';
    return [1, 2, 10, 100].includes(Math.abs(y - vor)) && Math.abs(y - vor) !== Math.abs(i.schritt) ? 'schritt-falsch' : 'sonstige';
  }, { 'zf-10-rueck': ['zf-10-vor'], 'zf-100-rueck': ['zf-100-vor'], 'zf-2-vor': ['zf-10-vor'], 'zf-2-rueck': ['zf-2-vor'], 'zf-1-vor-ue': ['zf-10-vor'],
    'zf-1-rueck-ue': ['zf-1-vor-ue', 'zf-10-rueck'], 'zf-10-ue': ['zf-10-vor', 'zf-1-vor-ue'],
    'zf-3-100-vor': ['zf-100-vor'], 'zf-3-100-rueck': ['zf-100-rueck'], 'zf-3-10-ue': ['zf-10-vor', 'zf-3-100-vor'], 'zf-3-10-rueck-ue': ['zf-3-10-ue', 'zf-10-rueck'],
    'zf-3-100-rueck-unter': ['zf-3-100-rueck'], 'zf-verdoppeln-3': ['zf-10-vor'], 'zf-verdoppeln-lang': ['zf-verdoppeln-3'], 'zf-halbieren-3': ['zf-verdoppeln-3'],
    'zf-halbieren-lang': ['zf-halbieren-3', 'zf-verdoppeln-lang'] }));
})(globalThis);
