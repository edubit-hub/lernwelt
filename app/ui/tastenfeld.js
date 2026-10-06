/* app/ui/tastenfeld.js: eigenes Zahlenfeld statt eines nativen Eingabefelds (Architektur 5.8). Die Bildschirmtastatur des iPad
   verschiebt sonst das Layout, und ihre Vorschlagsleiste kann Antworten vorsagen.
   tastenfeld({ stellen, minus, nullen, onOk, onAenderung }) → { anzeige, el, wert, setze, leere }
   anzeige ist das Element mit der getippten Zahl, el das Feld mit den Tasten, wert (lesend) der Text der Eingabe, zum Beispiel '56' oder '-3'.
   onOk(wert) kommt nur bei nicht leerer Eingabe. nullen: true erlaubt führende Nullen (eine PIN wie 0815, V-AP13a-02), sonst entfallen sie. Klassen für das Stylesheet: tastenfeld, tastenfeld-anzeige, taste, taste-ok, taste-weg. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const ui = (L.ui = L.ui || {});

  function tastenfeld({ stellen = 5, minus = false, nullen = false, onOk, onAenderung } = {}) {
    const h = ui.h;
    let wert = '';
    const anzeige = h('div.tastenfeld-anzeige', { role: 'status', 'aria-live': 'polite' });
    const ok = h('button.taste.taste-ok', { type: 'button', 'aria-label': 'Bestätigen', onclick: () => { if (/\d/.test(wert) && onOk) onOk(wert); } }, 'OK');

    function zeige() {
      anzeige.textContent = wert;
      anzeige.setAttribute('class', wert === '' ? 'tastenfeld-anzeige leer' : 'tastenfeld-anzeige');
      if (/\d/.test(wert)) ok.removeAttribute('disabled'); else ok.setAttribute('disabled', '');
    }
    function setze(neu) {
      neu = String(neu);
      if (!(minus ? /^-?\d*$/ : /^\d*$/).test(neu) || neu.replace('-', '').length > stellen) return;
      wert = neu;
      zeige();
      if (onAenderung) onAenderung(wert);
    }
    function ziffer(z) {
      const vorzeichen = wert.startsWith('-') ? '-' : '', ziffern = wert.slice(vorzeichen.length);
      if (ziffern.length < stellen) setze(vorzeichen + (ziffern === '0' && !nullen ? z : ziffern + z));     // keine führende Null, ausser mit nullen
    }
    const taste = (text, tun, klasse = 'taste', beschriftung) => h(`button.${klasse}`, { type: 'button', 'aria-label': beschriftung, onclick: tun }, text);
    const zeile = (...zeichen) => zeichen.map(z => taste(z, () => ziffer(z)));

    const el = h('div.tastenfeld', { role: 'group', 'aria-label': 'Zahlenfeld' },
      zeile('7', '8', '9'), zeile('4', '5', '6'), zeile('1', '2', '3'),
      taste('⌫', () => setze(wert.slice(0, -1)), 'taste.taste-weg', 'Löschen'),
      taste('0', () => ziffer('0')),
      ok,
      minus ? taste('−', () => setze(wert.startsWith('-') ? wert.slice(1) : '-' + wert), 'taste', 'Vorzeichen wechseln') : '');
    zeige();
    return { anzeige, el, get wert() { return wert; }, setze, leere: () => setze('') };
  }

  ui.tastenfeld = tastenfeld;
})(globalThis);
