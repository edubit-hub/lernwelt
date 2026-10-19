/* app/ansichten/eltern-anpassung.js: die Einstellungen eines Moduls im Elternbereich (AP-13b, Architektur 4.5). Gezeigt wird nur, was `modul.anpassbar` erlaubt,
   geschrieben wird nur nach `zustand.module[id].anpassung[pfad]` über Zustand.aendere, und nur Werte, die Modell.anpassungen gelten lässt (Zahlen werden dort auf min und max
   gesetzt). Die Schalter der einzelnen Themen (`themen.<id>.aktiv`) stehen nicht hier, sondern in der Themenliste von eltern-module.js (schalteThema).
   Arten: bool (Schalter), zahl (Zahlenfeld), themen (Auswahl von Themen, zum Beispiel der Tempo-Runde) und wahl (Auswahl aus werte, V-AP06-01). Eine Einstellung, die
   Modell.anpassungen nicht annimmt, erscheint nicht: Sie hätte keine Wirkung. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const NAMEN = {
    'standard.neuProTag': 'Neue Aufgaben pro Tag (höchstens)', 'standard.maxSchwierigkeit': 'Höchste Schwierigkeit (1 bis 3)',
    'tempo.themen': 'Themen der Tempo-Runde', 'optionen.schreiben': 'Wörter auch schreiben lassen (Diktat in der höchsten Stufe)'
  };
  /* Gedrückte Schalter (aria-pressed) setzt app/stil/eltern.css sichtbar ab (.eltern .knopf.schalter[aria-pressed="true"]), für die Reiter Module, Prüfung und Ferien. */
  const THEMA_AKTIV = /^themen\.[^.]+\.aktiv$/;
  const etikett = (pfad, b) => (b && b.titel) || NAMEN[pfad] || (pfad.startsWith('optionen.') ? `Option «${pfad.slice(9)}»` : pfad);

  /** Nimmt Modell.anpassungen den Wert für diesen Pfad an? Dann steht er in der Antwort, bei Zahlen schon auf min und max gesetzt. */
  const angenommen = (modul, pfad, wert) => { const a = L.Modell.anpassungen(modul, { [pfad]: wert }); return Object.hasOwn(a, pfad) ? { wert: a[pfad] } : null; };

  /** Darf der Elternbereich dieses Thema ein- und ausschalten? Nur mit `themen.*.aktiv` oder `themen.<id>.aktiv` in anpassbar. */
  const darfThema = (modul, themaId) => !!angenommen(modul, `themen.${themaId}.aktiv`, true);

  /** Schreibt einen Wert (undefined = Standard wiederherstellen) in den Lernstand. Gibt wahr zurück, wenn gespeichert wurde. */
  function schreibe(k, modul, pfad, wert) {
    const ok = wert === undefined ? { wert } : angenommen(modul, pfad, wert);
    if (!ok || k.gesperrt()) return false;
    k.Z.aendere(() => {
      const m = k.Z.modul(modul.id), a = { ...m.anpassung };
      if (ok.wert === undefined) delete a[pfad]; else a[pfad] = ok.wert;
      m.anpassung = a;
    });
    return true;
  }

  /** Das Thema ein- oder ausschalten (themen.<id>.aktiv). Gibt wahr zurück, wenn gespeichert wurde. */
  const schalteThema = (k, modul, themaId, an) => schreibe(k, modul, `themen.${themaId}.aktiv`, !!an);

  function zeile(k, modul, pfad, b, gesetzt, neu) {
    const h = k.h, name = etikett(pfad, b), gesperrt = k.gesperrt(), feld = pfad.split('.').pop(), S = modul.standard || {};
    const standard = b.typ === 'zahl' ? (S[feld] ?? (feld === 'neuProTag' ? L.lernregeln.sitzung.neuProTagMax : feld === 'maxSchwierigkeit' ? 3 : b.min))
      : b.typ === 'bool' ? (pfad.startsWith('optionen.') ? !!(S.optionen || modul.optionen || {})[pfad.slice(9)] : false)
        : b.typ === 'themen' ? ((modul.tempo && modul.tempo.themen) || []) : (b.standard ?? (b.werte || [])[0]);
    const wert = Object.hasOwn(gesetzt, pfad) ? gesetzt[pfad] : standard, speichere = w => { if (schreibe(k, modul, pfad, w)) { k.meldung('Gespeichert.', 'ok'); neu(); } };
    const zuruecksetzen = Object.hasOwn(gesetzt, pfad) ? h('button.knopf.leise', { type: 'button', disabled: gesperrt, onclick: () => speichere(undefined) }, 'Standard') : '';
    let steuer;
    if (b.typ === 'bool') {
      steuer = h('button.knopf.schalter', { type: 'button', 'aria-pressed': wert ? 'true' : 'false', 'aria-label': name, disabled: gesperrt, onclick: () => speichere(!wert) }, wert ? 'An' : 'Aus');
    } else if (b.typ === 'zahl') {
      const eingabe = h('input', { type: 'number', inputmode: 'numeric', min: b.min, max: b.max, step: 1, value: wert, 'aria-label': name, disabled: gesperrt });
      eingabe.value = String(wert);
      eingabe.addEventListener('change', () => {
        const n = Number(String(eingabe.value).replace(',', '.'));
        if (!String(eingabe.value).trim() || !Number.isFinite(n)) { k.meldung('Bitte eine Zahl eingeben.', 'fehler'); eingabe.value = String(wert); return; }
        speichere(Math.round(n));
      });
      steuer = eingabe;
    } else if (b.typ === 'themen') {
      const gewaehlt = new Set(Array.isArray(wert) ? wert : []);
      steuer = h('div.eltern-zeile', { role: 'group', 'aria-label': name }, modul.themen.map(t => h('button.knopf.schalter', { type: 'button', 'aria-pressed': gewaehlt.has(t.id) ? 'true' : 'false', disabled: gesperrt,
        onclick: () => {
          const neuSet = new Set(gewaehlt);
          if (neuSet.has(t.id)) neuSet.delete(t.id); else neuSet.add(t.id);
          if (!neuSet.size) { k.meldung('Mindestens ein Thema bleibt gewählt.', 'fehler'); return; }
          speichere(modul.themen.map(x => x.id).filter(x => neuSet.has(x)));
        } }, t.titel)));
    } else {
      steuer = h('select', { 'aria-label': name, disabled: gesperrt, onchange: e => speichere(e.target.value) }, (b.werte || []).map(w => h('option', { value: w, selected: w === wert }, w)));
    }
    return h('div.eltern-feld.anp-zeile', h('span', name), h('div.eltern-zeile', steuer, zuruecksetzen));
  }

  /**
   * Die Einstellungen eines geladenen Moduls als Element, leer ('') ohne Einstellungen. neu() zeichnet nach einer Änderung neu.
   * Pfade mit `themen.<id>.aktiv` fehlen hier, sie gehören zur Themenliste.
   */
  function felder(k, modul, neu) {
    const md = k.Z.hole().module[modul.id] || {}, gesetzt = L.Modell.anpassungen(modul, md.anpassung);
    const zeilen = Object.entries(modul.anpassbar || {}).filter(([pfad, b]) => !THEMA_AKTIV.test(pfad) && !pfad.includes('*') && b
      && (b.typ === 'bool' || b.typ === 'zahl' || b.typ === 'themen' || (b.typ === 'wahl' && Array.isArray(b.werte) && angenommen(modul, pfad, b.werte[0])))
      && !(b.typ === 'wahl' && !b.werte.length)).map(([pfad, b]) => zeile(k, modul, pfad, b, gesetzt, neu));
    return zeilen.length ? k.h('div.anp', k.h('h4', 'Einstellungen'), zeilen) : '';
  }

  L.ElternAnpassung = { NAMEN, etikett, angenommen, darfThema, schreibe, schalteThema, felder };
})(globalThis);
