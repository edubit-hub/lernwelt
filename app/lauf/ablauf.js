/* app/lauf/ablauf.js: die Warteschlange der Pakete und die Paketbildung (Architektur 5.2 und 5.4).
   Ein Paket ist { typ, aufgaben: [Aufgabe], art } mit art = 'runde', 'nachfassen' oder 'basis'. Der Übungstyp weiss davon nichts. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** Warteschlange. Falsche und nur gezeigte Aufgaben kommen nach `abstand` anderen Paketen noch einmal, höchstens einmal je Sitzung.
      einreihen() stellt eine Voraussetzung auf dieselbe Art ein (Fehlerfolge «braucht»), ebenfalls höchstens einmal. */
  function neuerAblauf(pakete, abstand = L.lernregeln.sitzung.nachfassenAbstand) {
    const q = [...pakete], einmal = new Set();
    const vorgemerkt = key => q.some(p => p.aufgaben.some(a => a.key === key));
    function reihe(art, aufgabe, typ, an) {
      const id = typeof typ === 'object' && typ ? typ.typ : typ, marke = `${art}:${aufgabe.key}`;
      if (!id || einmal.has(marke) || (art === 'basis' && vorgemerkt(aufgabe.key))) return false;
      einmal.add(marke);
      q.splice(Math.min(an, q.length), 0, { typ: id, aufgaben: [aufgabe], art });
      return true;
    }
    return {
      naechstes: () => q.shift() ?? null,
      rest: () => q.length,
      vorgemerkt,
      /** Schlüssel der Aufgaben in noch wartenden Paketen der Runde (ohne Nachfassen und Voraussetzungen). */
      offen: () => q.filter(p => p.art === 'runde').flatMap(p => p.aufgaben.map(a => a.key)),
      /** Stellt ein Paket hinten an (eine nachrückende neue Aufgabe). */
      anhaengen: paket => { q.push(paket); },
      nachfassen: (aufgabe, typ) => reihe('nachfassen', aufgabe, typ, abstand),
      einreihen: (aufgabe, typ) => reihe('basis', aufgabe, typ, abstand)
    };
  }

  // ---- Wahl des Übungstyps ----------------------------------------------------------------------------------
  /** Passt der Typ zur Aufgabe? art: Art des Laufs. einzel: nur Typen, die eine einzelne Aufgabe zeigen können. */
  function passt(def, a, { art, einzel }) {
    const e = def.eigenschaften || {};
    if (e.freiwillig && art !== 'herausforderung') return false;          // freiwillige Typen nie im Tagesauftrag
    if (!(e.akzeptiert || []).includes(a.form)) return false;
    if (einzel && ((e.gruppe && e.gruppe.min) || 1) > 1) return false;
    return L.Dienste.faehig(e.braucht, a);
  }

  /** Nimmt den gewünschten Typ, sonst den Ersatz des Leiter-Eintrags, danach die Ersatzkette der Typen. Gibt die Typ-ID oder null zurück. */
  function waehleTyp(id, ersatz, a, opt) {
    const probiert = [];
    let aktuell = id, naechster = ersatz || null;
    while (aktuell && !probiert.includes(aktuell) && probiert.length < 4) {
      probiert.push(aktuell);
      const def = L.registry.typen.get(aktuell);
      if (def && passt(def, a, opt)) return aktuell;
      aktuell = naechster || (def && def.eigenschaften && def.eigenschaften.ersatz) || null;
      naechster = null;
    }
    return null;
  }

  /** Typ für eine einzelne Aufgabe, zum Beispiel beim Nachfassen: der Leiter-Eintrag zur Box, bei Gruppentypen deren Ersatz. */
  function typFuer(a, box, k) {
    try {
      const s = L.Modell.typFuer(k.katalog.thema(a.modul, a.thema), box);
      return waehleTyp(s.typ, s.ersatz, a, { art: k.art, einzel: true });
    } catch (fehler) { return null; }
  }

  // ---- Pakete bilden ------------------------------------------------------------------------------------------
  /** Nur als Rückfall, falls die Lernsteuerung keine Runden bildet: gleiche Typen hintereinander zusammenfassen. */
  function gruppiere(items, eig) {
    const aus = [];
    for (const i of items) {
      const r = aus[aus.length - 1], e = eig(i.typ);
      if (r && r.typ === i.typ && r.items.length < e.rundeMax && (e.gruppierung !== 'thema' || r.items[0].thema === i.thema)) r.items.push(i);
      else aus.push({ typ: i.typ, items: [i] });
    }
    return aus;
  }

  /** Teilt eine Runde in Gruppen von min bis max Aufgaben, möglichst gleich gross (7 bei max 6 ergibt 4 und 3). */
  function teile(liste, { min, max }) {
    const n = liste.length, k = Math.ceil(n / max), basis = Math.floor(n / k);
    const groessen = Array.from({ length: k }, (_, i) => basis >= min ? basis + (i < n % k ? 1 : 0) : (i < k - 1 ? max : n - max * (k - 1)));
    let von = 0;
    return groessen.map(s => liste.slice(von, (von += s)));
  }

  const nachThema = liste => [...liste.reduce((m, i) => m.set(i.thema, [...(m.get(i.thema) || []), i]), new Map()).values()];

  /** Macht aus den geplanten Einträgen { key, grund?, typ?, ... } die Pakete. k: { art, katalog, box(aufgabe) → Box }.
      Gibt { pakete, uebersprungen: [{ key, grund }], eintragVon: Map key → Eintrag } zurück. Ein Eintrag mit `typ` erzwingt diesen Typ. */
  function bilde(eintraege, k) {
    const ueber = [], gesehen = new Set(), items = [];
    for (const e of eintraege) {
      const key = e && e.key;
      if (gesehen.has(key)) { ueber.push({ key, grund: 'steht doppelt im Plan' }); continue; }
      gesehen.add(key);
      const r = k.katalog.suche(key);
      if (!r.aufgabe) { ueber.push({ key, grund: r.grund }); continue; }
      const a = r.aufgabe;
      let stufe;
      try { stufe = e.typ ? { typ: e.typ, ersatz: null } : L.Modell.typFuer(k.katalog.thema(a.modul, a.thema), k.box(a)); }
      catch (fehler) { ueber.push({ key, grund: fehler.message }); continue; }
      const typ = waehleTyp(stufe.typ, stufe.ersatz, a, { art: k.art });
      if (!typ) { ueber.push({ key, grund: `Kein Übungstyp verfügbar (${stufe.typ}${stufe.ersatz ? ', Ersatz ' + stufe.ersatz : ''})` }); continue; }
      items.push({ key, thema: `${a.modul}/${a.thema}`, typ, ersatz: stufe.ersatz, aufgabe: a, eintrag: e });
    }
    const eig = id => { const x = L.registry.typen.get(id).eigenschaften; return { rundeMax: Math.max(1, x.gruppe.max), gruppierung: x.gruppierung }; };
    const runden = L.Sitzung && typeof L.Sitzung.runden === 'function' ? L.Sitzung.runden(items, eig) : gruppiere(items, eig);
    const pakete = [], paket = (typ, liste) => ({ typ, aufgaben: liste.map(i => i.aufgabe), art: 'runde' });
    for (const r of runden) {
      const e = L.registry.typen.get(r.typ).eigenschaften;
      if (e.gruppe.max <= 1) { r.items.forEach(i => pakete.push(paket(r.typ, [i]))); continue; }
      for (const gruppe of (e.gruppierung === 'thema' ? nachThema(r.items) : [r.items]).flatMap(l => teile(l, e.gruppe))) {
        if (gruppe.length >= e.gruppe.min) { pakete.push(paket(r.typ, gruppe)); continue; }
        for (const i of gruppe) {                                     // Gruppe zu klein: jede Aufgabe einzeln mit dem Ersatztyp
          const typ = waehleTyp(i.ersatz || e.ersatz, null, i.aufgabe, { art: k.art, einzel: true });
          if (typ) pakete.push(paket(typ, [i])); else ueber.push({ key: i.key, grund: `Gruppe für «${r.typ}» zu klein und kein Ersatz` });
        }
      }
    }
    return { pakete, uebersprungen: ueber, eintragVon: new Map(items.map(i => [i.key, i.eintrag])) };
  }

  L.Ablauf = { neuerAblauf, waehleTyp, typFuer, bilde, teile };
})(globalThis);
