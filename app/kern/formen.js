/* app/kern/formen.js: Aufgabenformen = Datenschemas, die mehrere Übungstypen gemeinsam verstehen (Architektur 4.2).
   Jede Form hat beschreibung und pruefe(inhalt) → Fehlertexte (leer heisst in Ordnung). Neue Formen meldet ein Typ
   in seiner eigenen Datei mit Lernwelt.form(...) an. Aufgabentext und Lösung bleiben Sache des Moduls. */
(function (g) {
  'use strict';
  const L = g.Lernwelt;

  const text = v => typeof v === 'string' && v.trim() !== '';
  const ganz = Number.isInteger;
  const zahl = v => typeof v === 'number' && Number.isFinite(v);
  const fehlt = v => v === undefined || v === null || v === '';
  const liste = (v, min) => Array.isArray(v) && v.length >= min;
  const OPS = ['·', ':', '+', '−'];              // Malpunkt, Doppelpunkt, Plus, Minuszeichen U+2212
  const BILD = /\.(svg|png|webp)$/, AUDIO = /\.(mp3|m4a)$/;
  const relativ = p => !/^\/|:|(^|\/)\.\.(\/|$)/.test(p);   // kein absoluter Pfad, kein «..», kein Laufwerk oder Protokoll

  /** Prüft Pflichtfelder nach Schema { feld: [prüfer, 'was nicht stimmt'] }. */
  const pflicht = (i, schema) => Object.entries(schema).flatMap(([f, [ok, was]]) =>
    fehlt(i[f]) ? [`inhalt.${f} fehlt`] : ok(i[f]) ? [] : [`inhalt.${f} ${was}`]);
  /** Optionale Mediendatei: nur erlaubte Endung, relativer Pfad. */
  const medium = (i, f, endung, was) => fehlt(i[f]) || (text(i[f]) && endung.test(i[f]) && relativ(i[f])) ? [] : [`inhalt.${f}: ${was}`];

  function form(id, beschreibung, pruefe) {
    L.form(id, { beschreibung, pruefe: i => i !== null && typeof i === 'object' && !Array.isArray(i) ? pruefe(i) : ['inhalt fehlt oder ist kein Objekt'] });
  }

  form('rechnung', 'Rechenaufgabe mit ganzzahligem Ergebnis, zum Beispiel 8 · 7 = 56', i => [
    ...pflicht(i, { a: [ganz, 'ist keine ganze Zahl'], b: [ganz, 'ist keine ganze Zahl'], ergebnis: [ganz, 'ist keine ganze Zahl'],
                    op: [v => OPS.includes(v), 'ist unbekannt, erlaubt sind · : + −'], text: [text, 'ist kein Text'] }),
    ...(ganz(i.ergebnis) && String(Math.abs(i.ergebnis)).length > 5 ? ['inhalt.ergebnis hat mehr als 5 Stellen, das Zahlenfeld nimmt höchstens 5'] : [])
  ]);

  form('wortkarte', 'Fremdwort mit Muttersprache, optional Bild und Audio', i => [
    ...pflicht(i, { fremd: [text, 'ist kein Text'], mutter: [text, 'ist kein Text'] }),
    ...medium(i, 'bild', BILD, 'nur svg, png oder webp, relativer Pfad ohne «..»'),
    ...medium(i, 'audio', AUDIO, 'nur mp3 oder m4a, relativer Pfad ohne «..»')
  ]);

  form('paar', 'Element und Kategorie oder Partner, gleiche rechte Werte bilden eine Kategorie', i => [
    ...pflicht(i, { links: [text, 'ist kein Text'], rechts: [text, 'ist kein Text'] }),
    ...(fehlt(i.gruppe) || text(i.gruppe) ? [] : ['inhalt.gruppe ist kein Text'])
  ]);

  form('satz', 'Satz oder Wort, Lücken als {wort}, im Diktat trennt | die Abschnitte', i => {
    const f = [...pflicht(i, { text: [text, 'ist kein Text'] }), ...medium(i, 'audio', AUDIO, 'nur mp3 oder m4a, relativer Pfad ohne «..»')];
    if (text(i.text)) {
      if (/[{}]/.test(i.text.replace(/\{[^{}]+\}/g, ''))) f.push('inhalt.text: eine Lücke {wort} ist leer oder nicht geschlossen');
      if (i.text.includes('|') && i.text.split('|').some(s => s.trim() === '')) f.push('inhalt.text enthält einen leeren Abschnitt zwischen |');
    }
    return f;
  });

  form('auswahl', 'Frage mit einer richtigen und mindestens einer falschen Antwort, je falscher Antwort optional ein Fehlercode', i => {
    const f = pflicht(i, { frage: [text, 'ist kein Text'], richtig: [text, 'ist kein Text'] });
    if (!liste(i.falsch, 1)) return [...f, 'inhalt.falsch braucht mindestens eine Antwort'];
    const alle = [i.richtig];
    i.falsch.forEach((w, n) => {
      const t = w !== null && typeof w === 'object' ? w.text : w;
      if (!text(t)) f.push(`inhalt.falsch[${n}] ohne Text`);
      else alle.push(t);
      if (w !== null && typeof w === 'object' && !fehlt(w.code) && !/^[a-z0-9-]+$/.test(w.code)) f.push(`inhalt.falsch[${n}].code ist kein gültiger Fehlercode`);
    });
    return alle.length !== new Set(alle).size ? [...f, 'inhalt: eine Antwort kommt doppelt vor'] : f;
  });

  form('abfolge', 'Schritte in der richtigen Reihenfolge, der Typ mischt sie', i => {
    if (!liste(i.schritte, 2)) return ['inhalt.schritte braucht mindestens zwei Elemente'];
    const f = i.schritte.every(text) ? [] : ['inhalt.schritte: jedes Element braucht einen Text'];
    return new Set(i.schritte).size !== i.schritte.length ? [...f, 'inhalt.schritte: ein Schritt kommt doppelt vor'] : f;
  });

  form('beschriftung', 'Bild mit Punkten, die das Kind beschriftet, x und y in Prozent', i => {
    const f = [...pflicht(i, { bild: [text, 'ist kein Text'] }), ...medium(i, 'bild', BILD, 'nur svg, png oder webp, relativer Pfad ohne «..»')];
    if (!liste(i.punkte, 1)) return [...f, 'inhalt.punkte braucht mindestens einen Punkt'];
    i.punkte.forEach((p, n) => {
      if (p === null || typeof p !== 'object') return f.push(`inhalt.punkte[${n}] ist kein Objekt`);
      if (!text(p.text)) f.push(`inhalt.punkte[${n}].text fehlt`);
      ['x', 'y'].forEach(k => { if (!zahl(p[k]) || p[k] < 0 || p[k] > 100) f.push(`inhalt.punkte[${n}].${k} liegt nicht zwischen 0 und 100`); });
    });
    return f;
  });

  form('position', 'Zahl auf dem Zahlenstrahl von bis, mit Toleranz', i => {
    const f = pflicht(i, { zahl: [zahl, 'ist keine Zahl'], von: [zahl, 'ist keine Zahl'], bis: [zahl, 'ist keine Zahl'], toleranz: [v => zahl(v) && v >= 0, 'ist keine Zahl ab 0'] });
    if (f.length) return f;
    return [...(i.von >= i.bis ? ['inhalt.von muss kleiner sein als inhalt.bis'] : []),
            ...(i.zahl < i.von || i.zahl > i.bis ? ['inhalt.zahl liegt ausserhalb von von und bis'] : [])];
  });

  form('uhrzeit', 'Uhrzeit mit Stunde 0 bis 23 und Minute 0 bis 59', i => pflicht(i, {
    h: [v => ganz(v) && v >= 0 && v <= 23, 'liegt nicht zwischen 0 und 23'], min: [v => ganz(v) && v >= 0 && v <= 59, 'liegt nicht zwischen 0 und 59'] }));

  form('betrag', 'Geldbetrag in Rappen', i => pflicht(i, { rappen: [v => ganz(v) && v >= 0, 'ist keine ganze Zahl ab 0'] }));

  form('frei', 'Frage, die das Kind in eigenen Worten beantwortet und mit Kriterien selbst prüft', i => [
    ...pflicht(i, { frage: [text, 'ist kein Text'], muster: [text, 'ist kein Text'] }),
    ...(liste(i.kriterien, 1) && i.kriterien.every(text) ? [] : ['inhalt.kriterien braucht mindestens ein Kriterium als Text'])
  ]);
})(globalThis);
