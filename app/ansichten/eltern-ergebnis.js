/* app/ansichten/eltern-ergebnis.js: das echte Ergebnis einer Prüfung eintragen (AP-13b, Architektur 6.6 und 13.3). Die Eltern tragen Punkte und Höchstpunktzahl ein, die Note
   (Schweizer Skala 6 bis 1, in Viertelschritten) ist freiwillig. Gespeichert wird module[id].pruefung.ergebnis = { punkte, max, note, datum } über Zustand.aendere,
   danach meldet Lauf.meldePruefung das Ereignis (art «echt»). Das Ergebnis geht nur an den Elternbereich: Die App zeigt es dem Kind nicht. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const zahl = text => { const s = String(text == null ? '' : text).trim().replace(',', '.'); return s && /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN; };
  const anzeige = n => String(Math.round(n * 100) / 100).replace(',', '.');

  /** Prüft die Eingaben. → { ok: true, ergebnis: { punkte, max, note } } oder { ok: false, text }. Die Note darf fehlen. */
  function pruefe({ punkte, max, note }) {
    const p = zahl(punkte), m = zahl(max), leer = String(note == null ? '' : note).trim() === '', n = leer ? null : zahl(note);
    if (!Number.isFinite(m) || m <= 0) return { ok: false, text: 'Bitte die erreichbare Punktzahl angeben (grösser als null).' };
    if (!Number.isFinite(p) || p > m) return { ok: false, text: 'Bitte die erreichten Punkte angeben, nicht mehr als die erreichbare Punktzahl.' };
    if (n !== null && (!Number.isFinite(n) || n < 1 || n > 6 || Math.abs(n * 4 - Math.round(n * 4)) > 1e-9)) return { ok: false, text: 'Die Note liegt zwischen 1 und 6, in Viertelschritten (zum Beispiel 5.25).' };
    return { ok: true, ergebnis: { punkte: p, max: m, note: n } };
  }

  /** Trägt das Ergebnis ein. Wahr, wenn gespeichert wurde. */
  function trage(k, id, ergebnis) {
    if (k.gesperrt()) return false;
    k.Z.aendere(() => { k.Z.modul(id).pruefung.ergebnis = { ...ergebnis, datum: k.heute() }; });
    try { if (L.Lauf && typeof L.Lauf.meldePruefung === 'function') L.Lauf.meldePruefung({ modul: id, art: 'echt', punkte: ergebnis.punkte, max: ergebnis.max }); } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'eltern-ergebnis.js' }); }
    return true;
  }

  const text = e => `Eingetragen am ${L.Eltern.datum(e.datum)}: ${anzeige(e.punkte)} von ${anzeige(e.max)} Punkten${e.note !== null && e.note !== undefined ? `, Note ${anzeige(e.note)}` : ''}.`;

  /** Die Eingabe für ein Modul: das vorhandene Ergebnis oder das Formular. neu() zeichnet den Reiter neu. */
  function formular(k, id, neu) {
    const h = k.h, gesperrt = k.gesperrt(), md = k.Z.hole().module[id] || {}, vorhanden = md.pruefung && md.pruefung.ergebnis;
    if (vorhanden) {
      return h('div', h('p', { role: 'status' }, text(vorhanden)), h('button.knopf.leise', { type: 'button', disabled: gesperrt, onclick: async () => {
        const ja = await k.dialog.frage({ titel: 'Ergebnis entfernen', text: 'Das eingetragene Ergebnis wird gelöscht. Danach lässt sich ein neues eintragen.', ja: 'Entfernen', nein: 'Abbrechen', gefahr: true });
        if (!ja || !k.offen) return;
        k.Z.aendere(() => { k.Z.modul(id).pruefung.ergebnis = null; });
        k.meldung('Ergebnis entfernt.', 'ok'); neu();
      } }, 'Ergebnis entfernen'));
    }
    const feld = (name, hinweis) => h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': name, placeholder: hinweis, disabled: gesperrt });
    const punkte = feld('Erreichte Punkte', 'zum Beispiel 17'), max = feld('Erreichbare Punkte', 'zum Beispiel 20'), note = feld('Note (freiwillig)', 'zum Beispiel 5.5');
    const speichere = () => {
      const r = pruefe({ punkte: punkte.value, max: max.value, note: note.value });
      if (!r.ok) { k.meldung(r.text, 'fehler'); return; }
      if (trage(k, id, r.ergebnis)) { k.meldung('Ergebnis eingetragen.', 'ok'); neu(); }
    };
    return h('div.eltern-zeile', h('label.eltern-feld', h('span', 'Erreichte Punkte'), punkte), h('label.eltern-feld', h('span', 'Erreichbare Punkte'), max),
      h('label.eltern-feld', h('span', 'Note (freiwillig, 6 bis 1)'), note), h('button.knopf', { type: 'button', disabled: gesperrt, onclick: speichere }, 'Ergebnis eintragen'));
  }

  L.ElternErgebnis = { pruefe, trage, text, formular };
})(globalThis);
