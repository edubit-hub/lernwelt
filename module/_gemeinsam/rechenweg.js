/* module/_gemeinsam/rechenweg.js: gemeinsamer Baustein für halbschriftliche Rechenwege im Zahlenraum bis 1000 (Architektur 4.1 und 4.3).
   Reine Funktionen auf ganzen Zahlen: kein Zustand, keine Oberfläche, keine Uhr, Zufall nur über einen übergebenen rng (Lernwelt.Zufall.aus).
   Fünf Gruppen:
   1. Wege. Jeder Weg gibt { schritte, strich | tafel, verdecke, ende, ... } zurück: die Schritte als Rechnungen «347 + 200 = 547»
      (Minuszeichen U+2212), die Daten des Hilfsmittels «rechenstrich» (oder «stellenwerttafel») und das Ende des Weges.
      kette, schrittweise, abziehen, plusUeber, minusUeber, ueberEinheit, ueberEinheitMinus, ergaenzen, rundenPlus, rundenMinus,
      vereinfachen, gleichMinus, stellenweise, doppel, spaltenAdd.
   2. Bauteile für Aufgaben: rechnung, luecke, kettenText, kettenMitFehler, hilfe, strich, tafel, ziehe, zwischen, voraus.
   3. Fehlerarten bei Rechnungen a + b und a − b mit ganzen Zahlen von 0 bis 999: uebertragVergessen, stellenVermischt, teilsummeVergessen,
      kleinereVonGroesserer, entbuendelnVergessen, plusMinusVertauscht, sprungVergessen, ausgleich, einerDaneben. Die Texte für Kind und Eltern
      stehen im Katalog _gemeinsam/fehlercodes-rechenweg.
   4. Diagnosen aus diesen Regeln: zahlDiag (Antwort ist eine Zahl), lueckenDiag (Zahlen in den Lücken eines Satzes), kettenRegel.
   Gebrauch: das Modul nennt den Baustein in modul.js unter braucht, sein Generator liest ihn mit
   Lernwelt.registry.bausteine.get('_gemeinsam/rechenweg'). Nicht-Zahlen in den Fehlerarten ergeben false. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const ganz = Number.isInteger;
  const MINUS = '−';                                                    // Minuszeichen wie im Feld op der Form «rechnung»
  const MAX_SPRUENGE = 6;                                               // so viele Sprünge nimmt das Hilfsmittel «rechenstrich»

  // ---- Zerlegen ---------------------------------------------------------------------------------------------
  const bereich = (n, von, bis, was) => { if (!ganz(n) || n < von || n > bis) throw new RangeError(`${was}: «${n}» ist keine ganze Zahl von ${von} bis ${bis}`); return n; };
  /** Die Ziffern einer Zahl von 0 bis 999 als [Einer, Zehner, Hunderter]. */
  const spalten = n => { bereich(n, 0, 999, 'spalten'); return [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)]; };
  const ausSpalten = s => s[0] + 10 * s[1] + 100 * s[2];
  /** Die Werte der Stellen ohne Nullen, grosse zuerst: 347 gibt [300, 40, 7], 350 gibt [300, 50]. */
  const teile = n => { const [e, z, h] = spalten(n); return [h * 100, z * 10, e].filter(x => x > 0); };
  const neg = liste => liste.map(x => -x);

  // ---- Wege -------------------------------------------------------------------------------------------------
  /** Sprünge ab start. folge: [[von, sprung, nach]], schritte: «p + s = q», strich: Daten des Rechenstrichs, ende: die letzte Zahl. */
  function kette(start, spruenge) {
    if (!ganz(start) || !Array.isArray(spruenge) || !spruenge.length || !spruenge.every(s => ganz(s) && s !== 0)) throw new RangeError('kette: ganze Zahlen und mindestens ein Sprung ungleich 0 erwartet');
    let p = start;
    const folge = spruenge.map(s => { const von = p; p += s; return [von, s, p]; });
    return { schritte: folge.map(([v, s, n]) => `${v} ${s < 0 ? MINUS : '+'} ${Math.abs(s)} = ${n}`), folge, strich: { start, spruenge: spruenge.slice() }, verdecke: 'ende', ende: p };
  }

  const schrittweise = (a, b) => kette(a, teile(b));                    // a + b: Hunderter, Zehner, Einer von b nacheinander
  const abziehen = (a, b) => kette(a, neg(teile(b)));                   // a − b: Hunderter, Zehner, Einer von b nacheinander

  /** a + b: zuerst die Zehner und Hunderter von b, dann die Einer in zwei Sprüngen über den vollen Zehner (47 + 8 = 47 + 3 + 5). */
  function plusUeber(a, b) {
    const e = b % 10, vor = b - e, p = a + vor, bis = 10 - p % 10, s = vor ? teile(vor) : [];
    if (e) { if (p % 10 && e > bis) s.push(bis, e - bis); else s.push(e); }
    return kette(a, s);
  }

  /** a − b: zuerst die Zehner und Hunderter von b, dann die Einer in zwei Sprüngen über den vollen Zehner (42 − 7 = 42 − 2 − 5). */
  function minusUeber(a, b) {
    const e = b % 10, vor = b - e, rest = (a - vor) % 10, s = vor ? neg(teile(vor)) : [];
    if (e) { if (rest && e > rest) s.push(-rest, -(e - rest)); else s.push(-e); }
    return kette(a, s);
  }

  /** a + b mit einem Halt am nächsten vollen Vielfachen von einheit (10 oder 100): 470 + 60 = 470 + 30 + 30. */
  function ueberEinheit(a, b, einheit) {
    const bis = einheit - a % einheit;
    if (a % einheit === 0 || b <= bis) throw new RangeError(`ueberEinheit: ${a} + ${b} kommt nicht über ein Vielfaches von ${einheit}`);
    return kette(a, [bis, b - bis]);
  }

  /** a − b mit einem Halt am vollen Vielfachen von einheit: 530 − 70 = 530 − 30 − 40. */
  function ueberEinheitMinus(a, b, einheit) {
    const rest = a % einheit;
    if (rest === 0 || b <= rest) throw new RangeError(`ueberEinheitMinus: ${a} − ${b} kommt nicht unter ein Vielfaches von ${einheit}`);
    return kette(a, [-rest, -(b - rest)]);
  }

  /** Sprünge von von bis bis: bis zum Zehner, bis zum Hunderter, dann Hunderter, Zehner und Einer (647 bis 1000: 3, 50, 300). */
  function ergaenzSpruenge(von, bis) {
    if (!ganz(von) || !ganz(bis) || von < 0 || bis <= von) throw new RangeError(`ergaenzSpruenge: ${von} bis ${bis} geht nicht`);
    const s = [];
    let p = von;
    for (const u of [10, 100]) { const n = Math.ceil(p / u) * u; if (n !== p && n <= bis) { s.push(n - p); p = n; } }
    for (const u of [100, 10, 1]) { const k = Math.floor((bis - p) / u) * u; if (k > 0) { s.push(k); p += k; } }
    return s;
  }

  /** Ergänzen von von bis bis: die Sprünge am Rechenstrich, der Unterschied ist ihre Summe. Der Strich zeigt beide Enden (diff = bis − von). */
  function ergaenzen(von, bis) {
    const s = ergaenzSpruenge(von, bis), k = kette(von, s);
    return { ...k, schritte: s.length > 1 ? [...k.schritte, `${s.join(' + ')} = ${bis - von}`] : k.schritte, verdecke: 'keines', diff: bis - von };
  }

  /** Hilfsaufgabe bei a + b: a liegt knapp (1 bis 9) unter der runden Zahl r, gerechnet wird mit r und der Unterschied ausgeglichen. */
  function rundenPlus(a, b, r) {
    const d = r - a;
    if (d < 1 || d > 9) throw new RangeError(`rundenPlus: ${a} liegt nicht 1 bis 9 unter ${r}`);
    return { schritte: [`${a} + ${b} = ${r} + ${b} ${MINUS} ${d}`, `${r} + ${b} = ${r + b}`, `${r + b} ${MINUS} ${d} = ${a + b}`],
      strich: { start: b, spruenge: [r, -d] }, verdecke: 'ende', ende: a + b, d, r };
  }

  /** Hilfsaufgabe bei a − b: b liegt knapp (1 bis 9) unter der runden Zahl r, es wird zu viel abgezogen und der Unterschied wieder dazugezählt. */
  function rundenMinus(a, b, r) {
    const d = r - b;
    if (d < 1 || d > 9) throw new RangeError(`rundenMinus: ${b} liegt nicht 1 bis 9 unter ${r}`);
    return { schritte: [`${a} ${MINUS} ${b} = ${a} ${MINUS} ${r} + ${d}`, `${a} ${MINUS} ${r} = ${a - r}`, `${a - r} + ${d} = ${a - b}`],
      strich: { start: a, spruenge: [-r, d] }, verdecke: 'ende', ende: a - b, d, r };
  }

  /** Vereinfachen bei a + b: mit jedem d von ds wird a um d grösser und b um d kleiner, die Summe bleibt (347 + 256 = 350 + 253 = 400 + 203). */
  function vereinfachen(a, b, ds) {
    let x = a, y = b;
    const s = [];
    for (const d of ds) { s.push(`${x} + ${y} = ${x + d} + ${y - d}`); x += d; y -= d; }
    s.push(`${x} + ${y} = ${a + b}`);
    return { schritte: s, strich: { start: x, spruenge: teile(y) }, verdecke: 'ende', ende: a + b, a2: x, b2: y };
  }

  /** Gleichsinnig verändern bei a − b: beide Zahlen um d grösser, der Unterschied bleibt (753 − 298 = 755 − 300). */
  function gleichMinus(a, b, d) {
    return { schritte: [`${a} ${MINUS} ${b} = ${a + d} ${MINUS} ${b + d}`, `${a + d} ${MINUS} ${b + d} = ${a - b}`],
      strich: { start: a + d, spruenge: neg(teile(b + d)) }, verdecke: 'ende', ende: a - b, a2: a + d, b2: b + d };
  }

  /** Stellenweise bei a + b: Hunderter, Zehner und Einer einzeln, dann die Teilsummen. Alle Stellen beider Zahlen brauchen eine Ziffer ab 1. */
  function stellenweise(a, b) {
    const [ae, az, ah] = spalten(a), [be, bz, bh] = spalten(b);
    if (![ae, az, ah, be, bz, bh].every(x => x > 0)) throw new RangeError('stellenweise: jede Stelle beider Zahlen braucht eine Ziffer ab 1');
    const H = (ah + bh) * 100, Z = (az + bz) * 10, E = ae + be;
    return { schritte: [`${ah * 100} + ${bh * 100} = ${H}`, `${az * 10} + ${bz * 10} = ${Z}`, `${ae} + ${be} = ${E}`, `${H} + ${Z} + ${E} = ${a + b}`],
      tafel: { h: ah + bh, z: az + bz, e: E }, teile: [H, Z, E], ende: a + b };
  }

  /** Verdoppeln bei n + (n + k): erst das Doppelte, dann k dazu (25 + 28 = 25 + 25 + 3). */
  function doppel(n, k) {
    return { schritte: [`${n} + ${n} = ${2 * n}`, `${2 * n} + ${k} = ${2 * n + k}`], strich: { start: n, spruenge: [n, k] }, verdecke: 'ende', ende: 2 * n + k };
  }

  /** Spaltenweises Addieren von a + b (Zahlen bis 999, Summe bis 999), ohne ein Verfahren vorzugeben: nur die Rechnung je Stelle. */
  function spaltenAdd(a, b) {
    const [ae, az, ah] = spalten(a), [be, bz, bh] = spalten(b);
    const es = ae + be, ue = es >= 10 ? 1 : 0, zs = az + bz + ue, uz = zs >= 10 ? 1 : 0, hs = ah + bh + uz;
    return { schritte: [
      `Einer: ${ae} + ${be} = ${es}${ue ? `, das sind 1 Zehner und ${es - 10} Einer` : ''}`,
      `Zehner: ${az} + ${bz}${ue ? ' + 1' : ''} = ${zs}${uz ? `, das sind 1 Hunderter und ${zs - 10} Zehner` : ''}`,
      `Hunderter: ${ah} + ${bh}${uz ? ' + 1' : ''} = ${hs}`, `${a} + ${b} = ${a + b}`],
    tafel: { h: ah + bh, z: az + bz, e: es }, ende: a + b, uebergaenge: [ue, uz] };
  }

  // ---- Bauteile für Aufgaben ---------------------------------------------------------------------------------
  /** Inhalt der Form «rechnung» für + und − mit berechnetem Ergebnis. plus: weitere Felder (Zusatzfelder sind erlaubt). */
  function rechnung(a, op, b, text, plus = {}) {
    if (op !== '+' && op !== MINUS) throw new RangeError(`rechnung: «${op}» ist weder + noch −`);
    return { a, b, op, ergebnis: op === '+' ? a + b : a - b, text, ...plus };
  }

  /** Lücke in einem Satz der Form «satz»: luecke(547) gibt «{547}». */
  const luecke = n => `{${n}}`;

  /** Die Schritte einer Kette als Satzteil mit Lücken: was 'nach' lässt die Ergebnisse fehlen, 'sprung' die Sprünge («347 + {200} = 547, ...»). */
  const kettenText = (k, was) => k.folge.map(([v, s, n]) => `${v} ${s < 0 ? MINUS : '+'} ${was === 'sprung' ? luecke(Math.abs(s)) : Math.abs(s)} = ${was === 'sprung' ? n : luecke(n)}`).join(', ');

  /** Die Kette eines Kindes mit genau einem falschen Schritt: im Schritt nr ist das Ergebnis um delta verschoben, der nächste Schritt rechnet davon weiter. */
  function kettenMitFehler(start, folge, nr, delta) {
    let p = start;
    return folge.map(([, s], i) => { const q = p + s + (i === nr ? delta : 0), z = `${p} ${s < 0 ? MINUS : '+'} ${Math.abs(s)} = ${q}`; p = q; return z; });
  }

  /** Daten des Hilfsmittels «rechenstrich». verdecke: 'keines', 'ende' oder 'start'. Mehr als 6 Sprünge oder ein Stand unter 0 wirft einen Fehler. */
  function strich(daten, verdecke = 'keines') {
    const stand = daten.spruenge.reduce((a, s) => (a.push(a[a.length - 1] + s), a), [daten.start]);
    if (daten.spruenge.length > MAX_SPRUENGE || stand.some(z => z < 0)) throw new RangeError(`strich: ${daten.start} mit ${daten.spruenge.join(', ')} passt nicht auf den Rechenstrich`);
    return { name: 'rechenstrich', daten: { start: daten.start, spruenge: daten.spruenge.slice(), verdecke } };
  }

  /** Daten des Hilfsmittels «stellenwerttafel» (Plättchen, die Zahl bleibt verdeckt, solange zeige nichts anderes sagt). */
  const tafel = (h, z, e, zeige = 'plaettchen') => ({ name: 'stellenwerttafel', daten: { h, z, e, zeige } });

  /** hilfe-Objekt einer Aufgabe: weg ist der Schlüssel in wege, w ein Weg dieses Bausteins (schritte, strich oder tafel).
      mit: true nimmt das Hilfsmittel des Wegs, false lässt es weg, 'keines' oder 'ende' zeichnet den Strich mit dieser Verdeckung. */
  function hilfe(weg, w, mit = true) {
    const hm = !mit ? null : w.strich ? strich(w.strich, typeof mit === 'string' ? mit : w.verdecke) : w.tafel ? tafel(w.tafel.h, w.tafel.z, w.tafel.e) : null;
    return { weg, schritte: w.schritte.slice(), ...(hm ? { hilfsmittel: hm } : {}) };
  }

  /** Zufallszahlen ziehen, bis ok(...zahlen) gilt. bereiche: Liste von [von, bis] oder [von, bis, schritt]. Zufall nur über rng. */
  function ziehe(rng, bereiche, ok = () => true) {
    for (let i = 0; i < 2000; i++) {
      const x = bereiche.map(([von, bis, schritt = 1]) => von + schritt * rng.int(Math.floor((bis - von) / schritt) + 1));
      if (ok(...x)) return x;
    }
    throw new Error(`ziehe: keine passenden Zahlen in ${JSON.stringify(bereiche)}`);
  }
  const zwischen = (rng, von, bis) => von + rng.int(bis - von + 1);

  /** Die Voraussetzungen der Familien (Feld braucht) als Angabe für familien.bauen: { id: [IDs anderer Familien] }, nur für Familien mit braucht. */
  const voraus = familien => Object.fromEntries(familien.filter(f => f.braucht && f.braucht.length).map(f => [f.id, f.braucht]));

  // ---- Fehlerarten --------------------------------------------------------------------------------------------
  const imRaum = (z, a, b) => ganz(z) && ganz(a) && ganz(b) && a >= 0 && b >= 0 && a <= 999 && b <= 999 && z >= 0;
  const ziffernSumme = n => [...String(Math.abs(n))].reduce((s, d) => s + Number(d), 0);
  const ohneUebertrag = (a, b) => { const x = spalten(a), y = spalten(b); return ausSpalten(x.map((v, i) => (v + y[i]) % 10)); };
  const ziffernDifferenz = (a, b) => { const x = spalten(a), y = spalten(b); return ausSpalten(x.map((v, i) => Math.abs(v - y[i]))); };
  /** Muss bei a − b ein Zehner (Einer) und ein Hunderter (Zehner) getauscht werden? [Einer von den Zehnern, Zehner von den Hundertern] */
  const borgen = (a, b) => { const x = spalten(a), y = spalten(b), e = x[0] < y[0]; return [e, x[1] < y[1] + (e ? 1 : 0)]; };

  /** Der Übergang beim Addieren fehlt: Stelle für Stelle ohne Rest gerechnet (358 + 47 = 395 statt 405). */
  const uebertragVergessen = (z, a, b) => imRaum(z, a, b) && z !== a + b && z === ohneUebertrag(a, b);
  /** Die Ziffern der zweiten Zahl alle als Einer addiert (358 + 47 = 369 statt 405). */
  const stellenVermischt = (z, a, b) => imRaum(z, a, b) && b >= 10 && z !== a + b && z === a + ziffernSumme(b);
  /** Beim stellenweisen Addieren fehlt eine Teilsumme (Hunderter, Zehner oder Einer von a + b). */
  const teilsummeVergessen = (z, a, b) => {
    if (!imRaum(z, a, b)) return false;
    const [ae, az, ah] = spalten(a), [be, bz, bh] = spalten(b);
    return [(ah + bh) * 100, (az + bz) * 10, ae + be].some(t => t > 0 && z === a + b - t);
  };
  /** Stelle für Stelle die kleinere von der grösseren Ziffer abgezogen (724 − 389 = 465 statt 335). */
  const kleinereVonGroesserer = (z, a, b) => imRaum(z, a, b) && a >= b && z !== a - b && z === ziffernDifferenz(a, b);
  /** Beim Tauschen (Entbündeln) wurde die Stelle davor nicht um 1 verkleinert (83 − 46 = 47 statt 37). */
  const entbuendelnVergessen = (z, a, b) => {
    if (!imRaum(z, a, b) || a < b) return false;
    const [e, t] = borgen(a, b), d = z - (a - b);
    return (e && d === 10) || (t && d === 100) || (e && t && d === 110);
  };
  /** Plus und minus verwechselt: bei op '+' wurde subtrahiert (Unterschied), bei op '−' wurde addiert. */
  const plusMinusVertauscht = (z, a, b, op) => ganz(z) && ganz(a) && ganz(b) && (op === '+' ? z === Math.abs(a - b) && z !== a + b : z === a + b && z !== a - b);
  /** Beim Ergänzen von b bis a (a − b, a bis 1000) fehlt ein Sprung in der Summe. Nur bei mindestens zwei Sprüngen. */
  const sprungVergessen = (z, a, b) => {
    if (!ganz(z) || !ganz(a) || !ganz(b) || b < 0 || a > 1000 || a <= b) return false;
    const s = ergaenzSpruenge(b, a);
    return s.length > 1 && s.some(j => z === a - b - j);
  };
  /** Ausgleich bei der Hilfsaufgabe mit Unterschied d: v = +1 bei a + b, −1 bei a − b. Gibt den Fehlercode oder null zurück:
      vergessen = ohne Ausgleich gerechnet (c + v·d), falsch = in die falsche Richtung ausgeglichen (c + 2·v·d). */
  const ausgleich = (z, c, d, v) => (!ganz(z) || !ganz(c) || !ganz(d) ? null : z === c + v * d ? 'ausgleich-vergessen' : z === c + 2 * v * d ? 'ausgleich-falsch' : null);
  /** Kleiner Rechenfehler: 1 oder 2 neben dem Ergebnis. */
  const einerDaneben = (z, c) => ganz(z) && ganz(c) && [1, 2].includes(Math.abs(z - c));

  // ---- Diagnosen ----------------------------------------------------------------------------------------------
  const norm = s => String(s).normalize('NFC').trim().replace(/\s+/g, ' ');
  const holeBausteine = was => {
    const B = L.registry.bausteine.get('_gemeinsam/rechnen'), F = L.registry.bausteine.get('_gemeinsam/familien');
    if (!B || !F) throw new Error(`${was}: die Bausteine «_gemeinsam/rechnen» und «_gemeinsam/familien» fehlen (modul.js, braucht)`);
    return { B, F };
  };

  /** Diagnose für eine Antwort { zahl } bei a op b (op '+' oder '−', Felder a und b im inhalt). extra: weitere Regeln (z, c, inhalt) → Code oder falsch,
      sie gelten zuerst. Danach: Übergang, Stellen, Rechenzeichen, vertauschte Ziffern, Zehner daneben, Einer daneben. */
  function zahlDiag(op, ...extra) {
    const { B, F } = holeBausteine('zahlDiag'), plus = op === '+';
    return F.zahlDiag(...extra,
      plus ? (z, c, i) => uebertragVergessen(z, i.a, i.b) && 'uebergang-vergessen' : (z, c, i) => kleinereVonGroesserer(z, i.a, i.b) && 'kleinere-von-groesserer',
      plus ? (z, c, i) => stellenVermischt(z, i.a, i.b) && 'stellen-vermischt' : (z, c, i) => entbuendelnVergessen(z, i.a, i.b) && 'entbuendeln-vergessen',
      (z, c, i) => plusMinusVertauscht(z, i.a, i.b, op) && 'rechenzeichen-verwechselt',
      (z, c) => B.ziffernVertauscht(z, c) && 'ziffern-vertauscht',
      (z, c) => B.zehnerDaneben(z, c) && 'zehner-daneben',
      (z, c) => einerDaneben(z, c) && 'einer-daneben');
  }

  /** Die Lösungen der Lücken {…} eines Satzes. */
  const loesungen = text => [...String(text).matchAll(/\{([^{}]*)\}/g)].map(m => norm(m[1]));

  /** Diagnose für Sätze mit Zahlen in den Lücken (Antwort { luecken }). Die erste falsche Lücke zählt. Regeln (z, c, inhalt, nr) → Code oder falsch,
      z ist die Eingabe, c die Lösung dieser Lücke und nr ihre Nummer. Danach: vertauschte Ziffern, Zehner daneben, Einer daneben. */
  function lueckenDiag(...regeln) {
    const { B } = holeBausteine('lueckenDiag');
    return (aufgabe, antwort) => {
      const soll = loesungen(aufgabe.inhalt.text), ist = antwort && antwort.luecken;
      if (!Array.isArray(ist) || ist.length !== soll.length) return 'sonstige';
      const nr = soll.findIndex((s, n) => norm(ist[n]) !== s);
      if (nr < 0) return null;
      const roh = norm(ist[nr]), z = /^\d{1,5}$/.test(roh) ? Number(roh) : NaN, c = Number(soll[nr]);
      if (!ganz(z) || !ganz(c)) return 'sonstige';
      for (const regel of [...regeln, (x, y) => B.ziffernVertauscht(x, y) && 'ziffern-vertauscht', (x, y) => B.zehnerDaneben(x, y) && 'zehner-daneben', (x, y) => einerDaneben(x, y) && 'einer-daneben']) {
        const code = regel(z, c, aufgabe.inhalt, nr);
        if (code) return code;
      }
      return 'sonstige';
    };
  }

  /** Regel für Sätze, deren Lücken die Ergebnisse einer Kette von Schritten sind (inhalt.art 'kette', inhalt.folge [[von, sprung, nach]], eine Lücke je Schritt). */
  const kettenRegel = (z, c, i, nr) => {
    if (i.art !== 'kette' || !Array.isArray(i.folge) || !i.folge[nr]) return null;
    const [von, s] = i.folge[nr], b = Math.abs(s);
    if (s > 0) return (uebertragVergessen(z, von, b) && 'uebergang-vergessen') || (stellenVermischt(z, von, b) && 'stellen-vermischt') || null;
    return (kleinereVonGroesserer(z, von, b) && 'kleinere-von-groesserer') || (entbuendelnVergessen(z, von, b) && 'entbuendeln-vergessen') || null;
  };

  L.baustein('_gemeinsam/rechenweg', L.einfrieren({
    spalten, teile, kette, schrittweise, abziehen, plusUeber, minusUeber, ueberEinheit, ueberEinheitMinus, ergaenzSpruenge, ergaenzen,
    rundenPlus, rundenMinus, vereinfachen, gleichMinus, stellenweise, doppel, spaltenAdd,
    rechnung, luecke, kettenText, kettenMitFehler, strich, tafel, hilfe, ziehe, zwischen, voraus,
    ohneUebertrag, ziffernDifferenz, ziffernSumme, borgen, uebertragVergessen, stellenVermischt, teilsummeVergessen, kleinereVonGroesserer,
    entbuendelnVergessen, plusMinusVertauscht, sprungVergessen, ausgleich, einerDaneben,
    zahlDiag, lueckenDiag, kettenRegel, loesungen
  }));
})(globalThis);
