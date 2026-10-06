/* app/ansichten/eltern-pin.js: PIN-Hürde des Elternbereichs (Architektur 11.2, 13.5 Punkt 6).
   Die PIN ist eine Hürde für das Kind und kein Sicherheitsmerkmal: vier Ziffern, im Dokument nur als kurzer Prüfwert unter
   einstellungen.elternPin, ohne Sperrzeit. Zustände: null = noch nie gefragt, 'aus' = bewusst ohne PIN, sonst acht Hexzeichen.
   Wer die PIN vergisst, löst eine Rechenaufgabe für Erwachsene. Die Eingabe läuft über ui.tastenfeld (mit führenden Nullen), nie über ein natives Feld.
   Geschrieben wird nur über Zustand.aendere. Keine Datei setzt beim Laden eine andere voraus. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const STELLEN = 4;

  const salz = z => String((z && z.geraet && z.geraet.id) || '');
  const erzeuge = (z, pin) => L.Zufall.hash(`lernwelt-pin|${salz(z)}|${pin}`).toString(16).padStart(8, '0');

  /** 'offen' (noch nie gefragt, auch bei einem ungültigen Eintrag), 'aus' (bewusst ohne PIN) oder 'gesetzt'. */
  function status(z) {
    const p = z && z.einstellungen && z.einstellungen.elternPin;
    return p === 'aus' ? 'aus' : typeof p === 'string' && /^[0-9a-f]{8}$/.test(p) ? 'gesetzt' : 'offen';
  }
  const stimmt = (z, pin) => status(z) === 'gesetzt' && z.einstellungen.elternPin === erzeuge(z, pin);
  const schreibe = (k, wert) => k.Z.aendere(z => { z.einstellungen.elternPin = typeof wert === 'function' ? wert(z) : wert; });
  const setze = (k, pin) => schreibe(k, z => erzeuge(z, pin));

  /** Zahlenfeld mit Punkten (oder Anzeige) und Fehlerzeile. o: { titel, text, knoepfe, onFertig(wert, api), auto, stellen }.
      Mit auto (Standard) meldet das Feld, sobald alle Stellen getippt sind, sonst erst die OK-Taste. → { el, fehler(text), leere() }. */
  function pinFeld(k, o) {
    const h = k.h, auto = o.auto !== false, stellen = o.stellen || STELLEN;
    const punkte = h('div.eltern-punkte', { role: 'img', 'aria-label': `0 von ${stellen} Ziffern` }, Array.from({ length: stellen }, () => h('i')));
    const fehler = h('p.eltern-fehler', { role: 'alert' });
    let feld = null;
    const api = { fehler: text => { fehler.textContent = text; }, leere: () => feld.leere() };
    const zeichne = wert => {
      Array.from(punkte.children).forEach((p, i) => p.setAttribute('class', i < wert.length ? 'an' : ''));
      punkte.setAttribute('aria-label', `${wert.length} von ${stellen} Ziffern`);
    };
    feld = L.ui.tastenfeld({                                       // nullen: eine PIN darf mit 0 beginnen (V-AP13a-02)
      stellen, nullen: true,
      onAenderung: wert => {
        if (wert !== '') fehler.textContent = '';
        if (!auto) return;
        zeichne(wert);
        if (wert.length === stellen) o.onFertig(wert, api);
      },
      onOk: wert => { if (auto) api.fehler(`Bitte ${stellen} Ziffern eingeben.`); else o.onFertig(wert, api); }
    });
    api.el = h('section.kachel.eltern-pin', h('h3', o.titel), o.text ? h('p', o.text) : '', auto ? punkte : feld.anzeige, fehler,
      h('div.eingabe', feld.el), h('div.kachel-fuss', o.knoepfe || []));
    return api;
  }

  /** Neue PIN festlegen, zweimal eingeben. Zeichnet in ziel. Gibt wahr zurück, wenn die PIN gespeichert ist, falsch bei Abbruch (dann ruft es abbruch()). */
  function festlegen(k, ziel, abbruch) {
    const h = k.h;
    return new Promise(fertig => {
      const knopf = () => h('button.knopf.leise', { type: 'button', onclick: () => { fertig(false); abbruch(); } }, 'Abbrechen');
      const erste = fehlerText => {
        const f = pinFeld(k, { titel: 'Neue PIN', text: 'Vier Ziffern wählen.', knoepfe: [knopf()], onFertig: pin => zweite(pin) });
        ziel.replaceChildren(f.el);
        if (fehlerText) f.fehler(fehlerText);
      };
      const zweite = pin1 => {
        const f = pinFeld(k, {
          titel: 'PIN wiederholen', text: 'Dieselben vier Ziffern noch einmal eingeben.', knoepfe: [knopf()],
          onFertig: pin2 => {
            if (pin1 !== pin2) return erste('Die beiden Eingaben stimmen nicht überein. Bitte noch einmal beginnen.');
            setze(k, pin1);
            fertig(true);
          }
        });
        ziel.replaceChildren(f.el);
      };
      erste('');
    });
  }

  /** Die Hürde beim Öffnen. Gibt ein Promise zurück: wahr, sobald der Elternbereich offen ist, falsch bei «Zurück». */
  function tor(k, huelle) {
    if (k.opt.entsperrt) return Promise.resolve(true);
    return new Promise(fertig => {
      const h = k.h, flaeche = h('div.eltern');
      huelle.replaceChildren(flaeche);
      const zeige = n => flaeche.replaceChildren(n);
      const weiter = () => fertig(true);
      const zurueck = () => { fertig(false); k.zurueck(); };
      const knopfZurueck = () => (k.opt.onZurueck ? h('button.knopf.leise', { type: 'button', onclick: zurueck }, 'Zurück') : '');

      function erstmals() {
        zeige(h('section.kachel.eltern-pin', h('h3', 'Eltern-PIN festlegen?'),
          h('p', 'Eine vierstellige PIN hält das Kind aus dem Elternbereich fern. Sie ist eine Hürde und kein Sicherheitsmerkmal. Später lässt sie sich unter «Einstellungen» ändern oder entfernen.'),
          h('div.kachel-fuss', [
            h('button.knopf.primaer', { type: 'button', onclick: () => festlegen(k, flaeche, erstmals).then(ok => { if (ok) weiter(); }) }, 'PIN festlegen'),
            h('button.knopf', { type: 'button', onclick: () => { schreibe(k, 'aus'); weiter(); } }, 'Ohne PIN fortfahren'),
            knopfZurueck()])));
      }
      function vergessen() {
        const a = 13 + Math.floor(k.zufall() * 17), b = 12 + Math.floor(k.zufall() * 8);
        const f = pinFeld(k, {
          titel: 'PIN zurücksetzen', text: `Zum Zurücksetzen der PIN bitte rechnen: ${a} × ${b}. Danach lässt sich eine neue PIN festlegen.`, auto: false,
          knoepfe: [h('button.knopf.leise', { type: 'button', onclick: eingabe }, 'Abbrechen')],
          onFertig: (wert, api) => {
            if (Number(wert) === a * b) { schreibe(k, null); erstmals(); } else { api.leere(); api.fehler('Das Ergebnis stimmt nicht.'); }
          }
        });
        zeige(f.el);
      }
      function eingabe() {
        const f = pinFeld(k, {
          titel: 'Elternbereich', text: 'Bitte die PIN eingeben.',
          knoepfe: [h('button.knopf.leise', { type: 'button', onclick: vergessen }, 'PIN vergessen'), knopfZurueck()],
          onFertig: (pin, api) => { if (stimmt(k.Z.hole(), pin)) weiter(); else { api.leere(); api.fehler('Die PIN stimmt nicht.'); } }
        });
        zeige(f.el);
      }

      const st = status(k.Z.hole());
      if (st === 'aus') weiter(); else if (st === 'gesetzt') eingabe(); else erstmals();
    });
  }

  /** Abschnitt «Zugang» im Reiter «Einstellungen»: PIN festlegen, ändern oder entfernen. */
  function kachel(k) {
    const h = k.h, inhalt = h('div.eltern-inhalt');
    const zeichne = () => {
      const st = status(k.Z.hole()), gesetzt = st === 'gesetzt';
      const neu = () => festlegen(k, inhalt, zeichne).then(ok => { zeichne(); if (ok) k.meldung('Die PIN wurde gespeichert.', 'ok'); });
      const entfernen = () => k.dialog.frage({ titel: 'PIN entfernen?', text: 'Danach öffnet sich der Elternbereich ohne PIN.', ja: 'Entfernen', nein: 'Abbrechen', gefahr: true })
        .then(ja => { if (ja) { schreibe(k, 'aus'); zeichne(); k.meldung('Die PIN wurde entfernt.', 'ok'); } });
      inhalt.replaceChildren(
        h('p', gesetzt ? 'Eine PIN ist gesetzt. Der Elternbereich fragt bei jedem Öffnen danach.' : 'Es ist keine PIN gesetzt.'),
        h('div.eltern-zeile', [h('button.knopf', { type: 'button', onclick: neu }, gesetzt ? 'PIN ändern' : 'PIN festlegen'),
          gesetzt ? h('button.knopf.gefahr', { type: 'button', onclick: entfernen }, 'PIN entfernen') : '']),
        h('p.hinweis', 'Die PIN ist eine Hürde für das Kind und kein Sicherheitsmerkmal.'));
    };
    zeichne();
    return k.kachel('Zugang', inhalt);
  }

  L.ElternPin = { STELLEN, status, stimmt, erzeuge, tor, festlegen, kachel };
})(globalThis);
