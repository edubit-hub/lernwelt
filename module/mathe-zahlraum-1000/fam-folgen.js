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

  const familien = [
    folge('zf-10-vor', 1, 10, rng => zw(rng, 100, 940)),
    folge('zf-10-rueck', 1, -10, rng => zw(rng, 160, 999)),
    folge('zf-100-vor', 1, 100, rng => zw(rng, 50, 450)),
    folge('zf-100-rueck', 1, -100, rng => zw(rng, 550, 990)),
    folge('zf-2-vor', 2, 2, rng => zw(rng, 50, 495) * 2),
    folge('zf-2-rueck', 2, -2, rng => zw(rng, 50, 495) * 2),
    folge('zf-1-vor-ue', 2, 1, rng => zw(rng, 2, 9) * 100, true),
    folge('zf-1-rueck-ue', 3, -1, rng => zw(rng, 1, 8) * 100, true),
    folge('zf-10-ue', 3, 10, rng => zw(rng, 2, 9) * 100, true)
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
    if (hunderter(soll) !== hunderter(vor) && y % 100 === soll % 100 && hunderter(y) !== hunderter(soll)) return 'hunderter-uebergang';
    return [1, 2, 10, 100].includes(Math.abs(y - vor)) && Math.abs(y - vor) !== Math.abs(i.schritt) ? 'schritt-falsch' : 'sonstige';
  }, { 'zf-10-rueck': ['zf-10-vor'], 'zf-100-rueck': ['zf-100-vor'], 'zf-2-vor': ['zf-10-vor'], 'zf-2-rueck': ['zf-2-vor'], 'zf-1-vor-ue': ['zf-10-vor'],
    'zf-1-rueck-ue': ['zf-1-vor-ue', 'zf-10-rueck'], 'zf-10-ue': ['zf-10-vor', 'zf-1-vor-ue'] }));
})(globalThis);
