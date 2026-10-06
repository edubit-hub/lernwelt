/* module/_gemeinsam/rechtschreibung.js: gemeinsamer Baustein für Rechtschreibmodule (Architektur 4.1 und 4.3, AP-18c).
   Stellt die Antwort des Kindes den Lücken {wort} eines Satzes gegenüber und erkennt, was an einer Stelle falsch ist. Die Antwort kommt aus
   lueckentext (antwort.luecken, eine Eingabe je Lücke) oder aus diktat (antwort.teile, die Abschnitte des Diktats). Eine Lücke darf ein ganzes Wort
   oder ein Teilwort sein (Sp{ie}l): Beim Diktat wird die Lücke aus dem geschriebenen Wort herausgeschnitten, indem der Anfang vor der Lücke und
   das Ende nach der Lücke wegfallen. Reine Funktionen auf Texten: kein Zustand, keine Oberfläche, kein Zufall, keine Uhr.
   Gebrauch: das Modul nennt den Baustein in modul.js unter braucht: ['_gemeinsam/rechtschreibung'], sein Generator liest ihn in diagnose() mit
   Lernwelt.registry.bausteine.get('_gemeinsam/rechtschreibung') und ruft kodiere(satz, antwort, klassiere) auf. klassiere(stelle) kennt die Regel
   des Themas und gibt einen Fehlercode oder null zurück, null heisst: allgemeine Unterscheidung (fehlt, zu viel, vertauscht, gross-klein). */
(function (g) {
  'use strict';
  const L = g.Lernwelt;
  const RAND = /^[.,;:!?'«»-]+|[.,;:!?'«»-]+$/g;                 // Satzzeichen am Rand gehören nicht zum Wort
  const LUECKE = /\{([^{}]*)\}/;
  const text = v => typeof v === 'string';
  const norm = s => String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const ohneKlammern = s => s.replace(/[{}]/g, '');

  /** Die Wörter eines Satzes (das Zeichen | gilt als Leerzeichen): { nr, wort } und bei einer Lücke zusätzlich { luecke: true, vor, soll, nach }. */
  function woerter(satz) {
    return norm(String(satz).replace(/\|/g, ' ')).split(' ').map((roh, nr) => {
      const w = roh.replace(RAND, ''), m = LUECKE.exec(w);
      return m ? { nr, wort: ohneKlammern(w), luecke: true, vor: ohneKlammern(w.slice(0, m.index)), soll: m[1], nach: ohneKlammern(w.slice(m.index + m[0].length)) }
               : { nr, wort: ohneKlammern(w), luecke: false };
    });
  }

  /** Alle Stellen, an denen die Antwort vom Satz abweicht: [{ soll, ist, wort, vor, nach, luecke }]. ist ist null, wenn nichts eingegeben wurde. */
  function paare(satz, antwort) {
    const a = antwort !== null && typeof antwort === 'object' ? antwort : {}, ws = woerter(satz);
    if (Array.isArray(a.luecken)) {                                  // lueckentext: Lücke für Lücke
      return ws.filter(w => w.luecke).map((w, i) => ({ soll: w.soll, ist: text(a.luecken[i]) ? norm(a.luecken[i]) : null, wort: w.wort, vor: w.vor, nach: w.nach, luecke: true }))
        .filter(p => p.ist !== p.soll);
    }
    const geschrieben = Array.isArray(a.teile) ? a.teile.join(' ') : text(a.text) ? a.text : '';
    const ist = norm(geschrieben).split(' ').filter(Boolean).map(w => w.replace(RAND, '')), gleichLang = ist.length === ws.length, aus = [];
    ws.forEach((w, i) => {                                           // diktat: Wort für Wort, bei anderer Wortzahl nur die Lückenwörter
      if (ist.includes(w.wort)) return;
      const c = gleichLang ? ist[i] : w.luecke ? ist.find(x => x.startsWith(w.vor) && x.endsWith(w.nach) && Math.abs(x.length - w.wort.length) <= 3 && !ws.some(o => o !== w && o.wort === x)) : null;
      if (c === undefined || c === null || c === w.wort) return;
      if (w.luecke && c.length >= w.vor.length + w.nach.length && c.startsWith(w.vor) && c.endsWith(w.nach)) {
        aus.push({ soll: w.soll, ist: c.slice(w.vor.length, c.length - w.nach.length), wort: w.wort, vor: w.vor, nach: w.nach, luecke: true });
      } else aus.push({ soll: w.wort, ist: c, wort: w.wort, vor: '', nach: '', luecke: false });
    });
    return aus;
  }

  const ohne = (lang, kurz) => lang.some((_, k) => lang.filter((__, j) => j !== k).join('') === kurz.join(''));

  /** Was unterscheidet ist von soll? null (gleich) oder { art }: gross-klein, fehlt, zuviel, vertauscht, ersetzt, anders. */
  function unterschied(soll, ist) {
    if (!text(soll) || !text(ist) || soll === ist) return null;
    if (soll.toLowerCase() === ist.toLowerCase()) return { art: 'gross-klein' };
    const s = [...soll], i = [...ist];
    if (i.length === s.length - 1 && ohne(s, i)) return { art: 'fehlt' };
    if (i.length === s.length + 1 && ohne(i, s)) return { art: 'zuviel' };
    if (i.length === s.length) {
      const d = s.map((_, k) => k).filter(k => s[k] !== i[k]);
      if (d.length === 2 && d[1] === d[0] + 1 && s[d[0]] === i[d[1]] && s[d[1]] === i[d[0]]) return { art: 'vertauscht' };
      if (d.length === 1) return { art: 'ersetzt' };
    }
    return { art: 'anders' };
  }

  const CODES = { 'gross-klein': 'gross-klein', fehlt: 'buchstabe-fehlt', zuviel: 'buchstabe-zuviel', vertauscht: 'buchstaben-vertauscht' };
  /** Fehlercode ohne Regel des Themas: ein Buchstabe fehlt oder ist zu viel, zwei sind vertauscht, nur die Gross- und Kleinschreibung weicht ab. */
  function allgemein(soll, ist) { const u = unterschied(soll, ist); return u ? CODES[u.art] || null : null; }

  /** Fehlercode der ersten auffälligen Stelle: zuerst die Regel des Themas (klassiere), sonst allgemein. null, wenn keine Stelle gefunden wird. */
  function kodiere(satz, antwort, klassiere) {
    for (const p of paare(satz, antwort)) {
      const c = (p.luecke && p.ist !== null && klassiere ? klassiere(p) : null) || allgemein(p.soll, p.ist === null ? '' : p.ist);
      if (c) return c;
    }
    return null;
  }

  L.baustein('_gemeinsam/rechtschreibung', L.einfrieren({ woerter, paare, unterschied, allgemein, kodiere }));
})(globalThis);
