/* app/lernsteuerung/statistik.js: Tages- und Wochenwerte, Bestwerte und die Trefferquote fälliger Abrufe (Architektur 6.1, 6.4, 6.8).
   Reine Funktionen auf den Daten des Zustands. Wer sie aufruft, schreibt das Ergebnis selbst zurück. Die Quote steuert die Bremse
   in Sitzung.plane und ist der Wert, an dem die Schwellen nach drei Wochen echter Nutzung kalibriert werden. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const FELDER = ['min', 'aufgaben', 'richtig', 'hilfe', 'falsch', 'neu', 'weltMin'];
  const URTEILE = ['richtig', 'hilfe', 'falsch'];
  const rund = x => Math.round(x * 10) / 10;
  const leerTag = () => Object.fromEntries(FELDER.map(f => [f, 0]));

  /** Treffer im ersten Versuch eines Tages- oder Wochenwerts: richtig durch alle bewerteten Aufgaben, null ohne Aufgaben. */
  function treffer(log) {
    const n = (log.richtig || 0) + (log.hilfe || 0) + (log.falsch || 0);
    return n ? log.richtig / n : null;
  }

  /**
   * Führt ein Ereignis in den Tageslog `zustand.tage[tag]` ein: { min, aufgaben, richtig, hilfe, falsch, neu, weltMin }. Gibt den neuen Log zurück.
   * ev ist ein Ereignis `lern:aufgabe` (zählt, ausser beim Nachfassen), ein Ereignis `lern:sitzung` (nur `minuten` zählt, die Aufgaben
   * sind schon einzeln gezählt) oder { weltMin } für die Zeit in der Welt. `neu` zählt jeden ersten Auftritt einer Aufgabe.
   */
  function tag(log0, ev) {
    const t = { ...leerTag(), ...log0 };
    if (ev.minuten > 0) t.min = rund(t.min + ev.minuten);
    if (ev.weltMin > 0) t.weltMin = rund(t.weltMin + ev.weltMin);
    if (ev.urteil && !ev.nachfassen) {
      t.aufgaben += 1;
      if (URTEILE.includes(ev.urteil)) t[ev.urteil] += 1;
      if (!(ev.boxVor > 0)) t.neu += 1;
    }
    return t;
  }

  /** Die Woche (Montag bis Sonntag), in der `heute` liegt: Summen, aktive Tage, Treffer und die sieben Tage einzeln für Minidiagramme. */
  function woche(tage, heute) {
    const von = L.Tag.plus(heute, -L.Tag.wochentag(heute)), summe = leerTag(), proTag = [];
    let aktiv = 0;
    for (let i = 0; i < 7; i++) {
      const datum = L.Tag.plus(von, i), t = { ...leerTag(), ...(tage && tage[datum]) };
      proTag.push({ datum, ...t });
      FELDER.forEach(f => { summe[f] += t[f]; });
      if (t.aufgaben > 0) aktiv += 1;
    }
    summe.min = rund(summe.min);
    summe.weltMin = rund(summe.weltMin);
    return { von, bis: L.Tag.plus(von, 6), aktiveTage: aktiv, ...summe, treffer: treffer(summe), proTag };
  }

  /**
   * Persönlicher Bestwert gegen sich selbst. `bestwerte` hat die Form { name: { wert, tag } }. Mit { kleiner: true } ist ein kleinerer Wert besser
   * (Bestzeit). Gibt { bestwerte, rekord, vorher } zurück: `rekord` ist wahr beim ersten Wert und bei jeder Verbesserung, `vorher` der alte Wert.
   */
  function bestwert(bestwerte, name, wert, heute, { kleiner = false } = {}) {
    const b = bestwerte || {}, alt = Object.hasOwn(b, name) ? b[name] : null;
    const besser = Number.isFinite(wert) && (!alt || (kleiner ? wert < alt.wert : wert > alt.wert));
    return besser ? { bestwerte: { ...b, [name]: { wert, tag: heute } }, rekord: true, vorher: alt ? alt.wert : null }
                  : { bestwerte: b, rekord: false, vorher: alt ? alt.wert : null };
  }

  const alsText = fenster => (Array.isArray(fenster) ? fenster.join('') : String(fenster || ''));

  /**
   * Fügt ein Ereignis `lern:aufgabe` dem Fenster der letzten fälligen Abrufe an und gibt das neue Fenster zurück. Das Fenster ist ein Text
   * aus «1» (selbständig richtig) und «0» (falsch oder nur mit Hilfe), neueste Abrufe hinten, höchstens `quoteFenster` Zeichen. Gezählt wird nur
   * ein fälliger Abruf einer schon gesehenen Aufgabe. Nachfassen, `gezeigt`, der erste Auftritt und nicht fällige Aufgaben zählen nicht.
   */
  function abruf(fenster, ev, R = L.lernregeln.sitzung) {
    const alt = alsText(fenster);
    if (!ev || ev.nachfassen || !ev.faellig || !(ev.boxVor > 0) || !URTEILE.includes(ev.urteil)) return alt;
    return (alt + (ev.urteil === 'richtig' ? '1' : '0')).slice(-R.quoteFenster);
  }

  /** Trefferquote der letzten fälligen Abrufe (0 bis 1). null, solange es weniger als `quoteMindest` Abrufe gibt: dann bremst nichts. */
  function quote(fenster, R = L.lernregeln.sitzung) {
    const s = alsText(fenster).slice(-R.quoteFenster);
    if (s.length < (R.quoteMindest ?? L.lernregeln.sitzung.quoteMindest)) return null;
    return [...s].filter(c => c === '1').length / s.length;
  }

  L.Statistik = { tag, woche, bestwert, quote, abruf, treffer };
})(globalThis);
