/* app/ui/tastatur.js: eigene Buchstabentastatur statt eines nativen Eingabefelds (Architektur 5.8). Die Bildschirmtastatur des iPad
   verschiebt das Layout, zoomt beim Fokussieren und ihre Vorschlagsleiste könnte Antworten vorsagen (Diktat, Lückentext, Wortschatz).
   tastatur({ layout, zahlen, satzzeichen, leerzeichen, maxLaenge, hardware, onOk, onZeichen, onAenderung }) → { anzeige, el, wert, setze, leere, schliesse }
     layout       'de-ch' (QWERTZ mit Ä Ö Ü, ohne Eszett). Ein unbekanntes Layout wirft einen Fehler.
     zahlen       Ziffernreihe oben (Standard false).   satzzeichen   Zeichen für eine Reihe neben dem Leerzeichen, zum Beispiel '.,?' (Standard keine).
     leerzeichen  Leertaste (Standard true).            maxLaenge     höchstens so viele Zeichen (Standard 80).
     hardware     nimmt am PC zusätzlich die Tastatur an (Standard true). Nur Zeichen, die es auch auf dem Bildschirm gibt.
     onZeichen(zeichen, wert) nach jedem getippten Zeichen, onAenderung(wert) nach jeder Änderung, onOk(wert) nur bei nicht leerer Eingabe.
   Umschalttaste: erstes Tippen gilt für den nächsten Buchstaben, zweites Tippen hält die Grossschreibung fest, drittes löst sie.
   anzeige ist das Element mit dem getippten Text, el die Tasten, wert (lesend) der Text. schliesse() meldet den Hörer der Hardware-Tastatur ab;
   er räumt sich auch selbst auf, sobald el aus der Seite entfernt wurde. Klassen für das Stylesheet: siehe app/stil/tastenfeld.css. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const ui = (L.ui = L.ui || {});

  const LAYOUTS = {
    'de-ch': { zahlen: '1234567890', zeilen: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'] }
  };
  const istBuchstabe = z => z.toLowerCase() !== z.toUpperCase();
  const FELDER = /^(input|textarea|select)$/i;

  function tastatur({ layout = 'de-ch', zahlen = false, satzzeichen = '', leerzeichen = true, maxLaenge = 80, hardware = true, onOk, onZeichen, onAenderung } = {}) {
    const def = LAYOUTS[layout];
    if (!def) throw new Error(`tastatur: unbekanntes Layout «${layout}»`);
    const h = ui.h;
    let wert = '', umschalt = 0;                                      // umschalt: 0 aus, 1 nächster Buchstabe, 2 festgehalten
    const buchstaben = [], erlaubt = new Set(leerzeichen ? [' '] : []);
    const anzeige = h('div.tastatur-anzeige.leer', { role: 'status', 'aria-live': 'polite' });
    const ok = h('button.taste.taste-ok', { type: 'button', 'aria-label': 'Bestätigen', onclick: () => bestaetige() }, 'OK');
    const shift = h('button.taste.taste-umschalt', { type: 'button', 'aria-label': 'Umschalttaste', 'aria-pressed': 'false', onclick: () => { umschalt = (umschalt + 1) % 3; beschrifte(); } }, '⇧');

    function zeige() {
      anzeige.textContent = wert;
      anzeige.setAttribute('class', wert === '' ? 'tastatur-anzeige leer' : 'tastatur-anzeige');
      if (wert.trim() !== '') ok.removeAttribute('disabled'); else ok.setAttribute('disabled', '');
    }
    function beschrifte() {
      for (const b of buchstaben) b.el.textContent = umschalt ? b.z.toUpperCase() : b.z;
      shift.setAttribute('aria-pressed', umschalt ? 'true' : 'false');
      shift.setAttribute('class', 'taste taste-umschalt' + (umschalt === 2 ? ' fest' : ''));
    }
    function aendere(neu) {
      wert = neu; zeige();
      if (onAenderung) onAenderung(wert);
    }
    function tippe(z) {
      if (wert.length >= maxLaenge) return;
      if (istBuchstabe(z) && umschalt === 1) { umschalt = 0; beschrifte(); }
      aendere(wert + z);
      if (onZeichen) onZeichen(z, wert);
    }
    function loesche() { if (wert !== '') aendere(wert.slice(0, -1)); }
    function bestaetige() { if (wert.trim() !== '' && onOk) onOk(wert); }
    function setze(neu) {
      neu = String(neu);
      if (neu.length > maxLaenge || [...neu].some(z => !erlaubt.has(z))) return;
      aendere(neu);
    }

    function zeichenTaste(z) {
      erlaubt.add(z); erlaubt.add(z.toUpperCase());
      const b = { z, el: h('button.taste', { type: 'button', onclick: () => tippe(umschalt && istBuchstabe(z) ? z.toUpperCase() : z) }, z) };
      if (istBuchstabe(z)) buchstaben.push(b);
      return b.el;
    }
    const zeile = (...kinder) => h('div.tastatur-zeile', kinder);
    const weg = h('button.taste.taste-weg', { type: 'button', 'aria-label': 'Löschen', onclick: loesche }, '⌫');
    const leer = leerzeichen ? h('button.taste.taste-leer', { type: 'button', 'aria-label': 'Leerzeichen', onclick: () => tippe(' ') }, 'Leerzeichen') : '';

    const el = h('div.tastatur', {
      role: 'group', 'aria-label': 'Buchstabentastatur',
      onmousedown: e => { if (e.preventDefault) e.preventDefault(); }       // ein angeklickter Knopf behält den Fokus nicht (sonst löst die Leertaste ihn nochmals aus)
    },
      zahlen ? zeile([...def.zahlen].map(zeichenTaste)) : '',
      zeile([...def.zeilen[0]].map(zeichenTaste)),
      zeile([...def.zeilen[1]].map(zeichenTaste)),
      zeile(shift, [...def.zeilen[2]].map(zeichenTaste), weg),
      zeile([...satzzeichen].map(zeichenTaste), leer, ok));

    // Hardware-Tastatur am PC
    let gesehen = false;
    function beiTaste(e) {
      if (!el.isConnected) { if (gesehen) schliesse(); return; }
      gesehen = true;
      const fokus = g.document.activeElement;
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || (fokus && FELDER.test(fokus.tagName || ''))) return;
      if (e.key === 'Backspace') loesche();
      else if (e.key === 'Enter') bestaetige();
      else if (typeof e.key === 'string' && e.key.length === 1 && erlaubt.has(e.key)) tippe(e.key);
      else return;
      if (e.preventDefault) e.preventDefault();
    }
    function schliesse() { g.document.removeEventListener('keydown', beiTaste); }
    if (hardware) g.document.addEventListener('keydown', beiTaste);

    zeige(); beschrifte();
    return { anzeige, el, get wert() { return wert; }, setze, leere: () => setze(''), schliesse };
  }

  ui.tastatur = tastatur;
})(globalThis);
