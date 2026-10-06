/* app/lernsteuerung/einstufung.js: was schon sitzt, ist kein neuer Stoff (Architektur 6.4, AP-23). Reine Funktionen, kein Speicher, kein DOM.
   Eine Aufgabe, die beim ersten Auftritt als Vortest richtig gelöst wird, war schon bekannt: Sie zählt weder gegen neuProTagMax noch gegen neuProTag.
   Dafür rückt im Lauf einer Runde eine neue Aufgabe nach (nachrueckend), und beim ersten Kontakt mit einem Modul gibt es eine Einstufungsrunde mit
   bis zu 20 Vortest-Aufgaben quer über die Themen (waehle). Die Box-Regeln bleiben, Box 4 gibt es weiter nur an drei verschiedenen Tagen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** Bekannt: erster Auftritt, kein Nachfassen, als Vortest gefragt und selbständig richtig. Genau dann setzt Wiederholung.verbuche die Box 1 durch den Vortest. */
  const istBekannt = ({ neu, nachfassen, urteil, einfuehrung }) => !!neu && !nachfassen && urteil === 'richtig' && einfuehrung === 'vortest';

  /** Schlüssel der neuen Aufgaben von heute, die zählen (meta.neuHeute = { tag, keys }). Ein anderer Tag beginnt leer. */
  const gezaehlt = (meta, heute) => (meta && meta.neuHeute && meta.neuHeute.tag === heute && Array.isArray(meta.neuHeute.keys) ? meta.neuHeute.keys : []);

  /** Der neue Stand von meta.neuHeute, wenn die Aufgabe `key` als neuer Stoff zählt. Gibt ein neues Objekt zurück, `meta` bleibt unverändert. */
  const zaehle = (meta, heute, key) => { const keys = gezaehlt(meta, heute); return { tag: heute, keys: keys.includes(key) ? keys.slice() : [...keys, key] }; };

  /**
   * Die Aufgaben der Einstufungsrunde: höchstens `anzahl`, reihum über die Themen (jedes Thema zuerst mit einer Aufgabe), innerhalb eines Themas
   * gemischt. liste: [{ key, thema }] noch nicht gesehener Vortest-Aufgaben, rng: Zufall mit Startwert (Zufall.aus). Gibt [{ key, grund: 'neu' }] zurück.
   */
  function waehle(liste, rng, anzahl = L.lernregeln.einstufung.anzahl) {
    const themen = new Map();
    for (const a of liste) { if (!themen.has(a.thema)) themen.set(a.thema, []); themen.get(a.thema).push(a); }
    const spuren = [...themen.values()].map(s => rng.mische(s));
    const aus = [];
    for (let i = 0; aus.length < anzahl && spuren.some(s => i < s.length); i++) for (const s of spuren) if (i < s.length && aus.length < anzahl) aus.push({ key: s[i].key, grund: 'neu' });
    return aus;
  }

  /**
   * Die nächste neue Aufgabe, die für eine schon bekannte nachrückt, oder null. Der Plan des Tages hat `soll` neue Aufgaben vorgesehen. Solange
   * die gezählten (schon erledigte, die zählen) und die noch offenen (in der Warteschlange) weniger sind, rückt die nächste nach.
   * kandidaten: wie bei Sitzung.plane (aus dem aktuellen Zustand), gezaehlt/offen: Schlüssel, nachgerueckt: Zahl der in dieser Runde schon Nachgerückten,
   * imUmfang(k): optional, Aufgaben ausserhalb des Prüfungsumfangs rücken nicht nach.
   */
  function nachrueckend({ kandidaten, soll, gezaehlt: schon = [], offen = [], nachgerueckt = 0, imUmfang = null, regeln = null }) {
    const E = (regeln || L.lernregeln).einstufung, basisBox = (regeln || L.lernregeln).freischaltung.box;
    if (nachgerueckt >= E.nachschubMax || schon.length + offen.length >= soll) return null;
    const boxVon = new Map(kandidaten.map(k => [k.key, k.box])), themaVon = new Map(kandidaten.map(k => [k.key, k.thema])), proThema = new Map();
    for (const key of [...schon, ...offen]) proThema.set(themaVon.get(key), (proThema.get(themaVon.get(key)) || 0) + 1);
    const basisOk = k => (k.braucht || []).every(b => (boxVon.has(b) ? boxVon.get(b) : Infinity) >= basisBox);
    const k = kandidaten.find(x => x.neu && x.bereit && basisOk(x) && !offen.includes(x.key) && !schon.includes(x.key) && (!imUmfang || imUmfang(x))
      && !(Number.isFinite(x.neuProTag) && (proThema.get(x.thema) || 0) >= x.neuProTag));
    return k ? { key: k.key, grund: 'neu' } : null;
  }

  L.Einstufung = { istBekannt, gezaehlt, zaehle, waehle, nachrueckend };
})(globalThis);
