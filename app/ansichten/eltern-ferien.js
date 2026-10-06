/* app/ansichten/eltern-ferien.js: die Karte «Ferien» im Reiter «Prüfung» (AP-13b). Sie zeigt, ob die App heute Ferien kennt, und stellt den Ferienmodus ein:
   automatisch nach dem Schulkalender 2026/27 (ferien.js), von Hand an (bis zu einem Datum oder bis zum Ausschalten) oder aus. Dazu kommen eigene Zeiträume
   (zum Beispiel Familienferien ausserhalb des Kalenders). Gespeichert wird einstellungen.ferien über Zustand.aendere. Der Ferienmodus markiert Tage, an denen kein Lernen
   erwartet wird. Die Karte Prüfung nennt damit, wie viele Ferientage bis zur Prüfung liegen. Lesen kann die Einstellung jede Ansicht über Lernwelt.Ferien.lage(doc, tag). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const MODI = [['auto', 'Nach Kalender'], ['an', 'Ein'], ['aus', 'Aus']];
  const MAX_EIGENE = 10;
  const STIL = `
.fe-liste { display: grid; gap: var(--a2); margin: var(--a2) 0; padding: 0; list-style: none; }
.fe-liste li { padding: var(--a2) var(--a3); border: 1px solid var(--linie); border-radius: var(--radius); background: var(--flaeche); }
.fe-liste li > div { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--a2); }
`;
  const gueltig = t => typeof t === 'string' && L.Tag.gueltig(t);

  function stil(k) {
    const d = k.dok;
    if (L.ElternAnpassung) L.ElternAnpassung.schalterStil(k);
    if (!d || !d.head || (d.getElementById && d.getElementById('eltern-ferien-stil'))) return;
    const s = d.createElement('style');
    s.setAttribute('id', 'eltern-ferien-stil');
    s.textContent = STIL;
    d.head.append(s);
  }

  const statusText = (k, lage) => {
    const d = L.Eltern.datum;
    if (lage.aktiv && lage.grund === 'manuell') return `Der Ferienmodus ist eingeschaltet${lage.bis ? ` bis ${d(lage.bis)}` : ''}.`;
    if (lage.aktiv) return `Heute sind Ferien: ${lage.name}${lage.bis ? ` bis ${d(lage.bis)}` : ''}.`;
    const n = lage.naechste;
    return `Heute sind keine Ferien.${n ? ` Nächster freier Zeitraum: ${n.name} ab ${d(n.von)}.` : ''}`;
  };

  /** Speichert die Einstellung als Ganzes. */
  const speichere = (k, werte) => k.Z.aendere(z => { z.einstellungen.ferien = { ...L.Ferien.einstellung(z), ...werte }; });

  function eigene(k, e, neu) {
    const h = k.h, gesperrt = k.gesperrt(), von = h('input', { type: 'date', 'aria-label': 'Eigener Zeitraum von', disabled: gesperrt }), bis = h('input', { type: 'date', 'aria-label': 'Eigener Zeitraum bis', disabled: gesperrt });
    const name = h('input', { type: 'text', maxlength: 40, autocomplete: 'off', 'aria-label': 'Name des Zeitraums', placeholder: 'zum Beispiel Familienferien', disabled: gesperrt });
    const fuege = () => {
      const v = String(von.value || ''), b = String(bis.value || '');
      if (!gueltig(v) || !gueltig(b) || v > b) { k.meldung('Bitte Beginn und Ende des Zeitraums angeben, das Ende nicht vor dem Beginn.', 'fehler'); return; }
      if (e.eigene.length >= MAX_EIGENE) { k.meldung(`Es sind höchstens ${MAX_EIGENE} eigene Zeiträume möglich.`, 'fehler'); return; }
      speichere(k, { eigene: [...e.eigene, { von: v, bis: b, name: String(name.value || '').trim().slice(0, 40) || 'Ferien' }] });
      k.meldung('Zeitraum gespeichert.', 'ok'); neu();
    };
    const zeile = (x, i) => h('li', h('div', h('span', h('b', x.name), ` ${L.Eltern.datum(x.von)} bis ${L.Eltern.datum(x.bis)}`),
      h('button.knopf.leise', { type: 'button', disabled: gesperrt, 'aria-label': `Zeitraum «${x.name}» entfernen`,
        onclick: () => { speichere(k, { eigene: e.eigene.filter((_, j) => j !== i) }); k.meldung('Zeitraum entfernt.', 'ok'); neu(); } }, 'Entfernen')));
    return [e.eigene.length ? h('ul.fe-liste', e.eigene.map(zeile)) : h('p.klein', 'Keine eigenen Zeiträume.'),
    h('div.eltern-zeile', h('label.eltern-feld', h('span', 'Von'), von), h('label.eltern-feld', h('span', 'Bis'), bis), h('label.eltern-feld', h('span', 'Name'), name),
      h('button.knopf', { type: 'button', disabled: gesperrt, onclick: fuege }, 'Zeitraum hinzufügen'))];
  }

  /** Die Karte «Ferien». */
  function kachel(k) {
    const h = k.h, wurzel = h('div'), gesperrt = k.gesperrt();
    stil(k);
    const zeichne = () => {
      const doc = k.Z.hole(), e = L.Ferien.einstellung(doc), lage = L.Ferien.lage(doc, k.heute());
      const bis = h('input', { type: 'date', 'aria-label': 'Ferienmodus bis', value: e.bis, disabled: gesperrt });
      bis.value = e.bis || '';
      bis.addEventListener('change', () => { speichere(k, { bis: gueltig(String(bis.value)) ? String(bis.value) : null }); k.meldung('Gespeichert.', 'ok'); zeichne(); });
      wurzel.replaceChildren(h('div', h('p', { role: 'status' }, statusText(k, lage)),
        h('div.eltern-zeile', { role: 'group', 'aria-label': 'Ferienmodus' }, MODI.map(([id, titel]) => h('button.knopf.schalter', { type: 'button', 'aria-pressed': e.modus === id ? 'true' : 'false', disabled: gesperrt,
          onclick: () => { speichere(k, { modus: id }); k.meldung('Gespeichert.', 'ok'); zeichne(); } }, titel))),
        e.modus === 'an' ? h('div.eltern-zeile', h('label.eltern-feld', h('span', 'Ferienmodus bis (leer: bis zum Ausschalten)'), bis)) : '',
        h('h4', 'Eigene Zeiträume'), eigene(k, e, zeichne)));
    };
    zeichne();
    return k.kachel('Ferien', h('p.klein', 'Die App kennt die Schulferien 2026/27 der Gemeinde. Der Ferienmodus markiert Tage, an denen kein Lernen erwartet wird.'), wurzel);
  }

  L.ElternFerien = { kachel, statusText };
})(globalThis);
