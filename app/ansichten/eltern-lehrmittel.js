/* app/ansichten/eltern-lehrmittel.js: die Karte «Lehrmittel der Klasse» im Reiter «Module» (AP-13b, R44). Je Fach wählen die Eltern das Lehrmittel der Klasse
   (einstellungen.lehrmittel, Standard «noch nicht bekannt»). Danach zeigt «Vorschläge ansehen», welche ausgeschalteten Themen dazu passen, mit Schulwoche und Grund.
   Es schaltet nie etwas von selbst ein: Erst «Ausgewählte einschalten» mit Bestätigung schreibt `themen.<id>.aktiv` (über ElternAnpassung). Themen, deren Zeit laut
   Jahresplan noch nicht gekommen ist, sind nicht vorgewählt. Die Zuordnung stammt aus der Recherche und ist nicht mit der Lehrperson abgeglichen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /* Gestaltung: app/stil/eltern.css (lm-*). */

  const wochenText = v => (v.ab ? `ab Schulwoche ${v.ab}${v.abDatum ? ` (${L.Eltern.datum(v.abDatum)})` : ''}` : 'ohne bekannte Woche');

  /** Die Vorschläge für die gewählten Lehrmittel aus dem Lernstand und den geladenen Modulen. */
  function suche(k) {
    const doc = k.Z.hole();
    return L.Lehrmittel.vorschlaege({ lehrmittel: L.Lehrmittel.stand(doc), heute: k.heute(), modulVon: id => L.registry.module.get(id) || null,
      themaAn: (id, t) => { const m = L.registry.module.get(id); return !!m && L.Modell.thema(m, t, (doc.module[id] || {}).anpassung).aktiv !== false; } });
  }

  function vorschlagListe(k, vorschlaege, ausgewaehlt, neu) {
    const h = k.h, gesperrt = k.gesperrt();
    if (!vorschlaege.length) return h('p.klein', 'Für dieses Lehrmittel gibt es bei den aktiven Modulen zurzeit keine Vorschläge.');
    const zeile = v => {
      const key = `${v.modul}/${v.thema}`, an = ausgewaehlt.has(key);
      return h('li', { 'data-vorschlag': key }, h('div', h('span', h('b', v.titel), ` (${v.modulTitel}, ${v.profilTitel})`),
        v.bereitsAn ? h('span.etikett.grau', 'Bereits eingeschaltet') : h('button.knopf.schalter', { type: 'button', 'aria-pressed': an ? 'true' : 'false', disabled: gesperrt,
          'aria-label': `Thema «${v.titel}» einschalten`, onclick: () => { if (an) ausgewaehlt.delete(key); else ausgewaehlt.add(key); neu(); } }, an ? 'Wird eingeschaltet' : 'Bleibt aus')),
      h('p.klein', `${wochenText(v)}. ${v.grund}`));
    };
    return h('ul.lm-liste', vorschlaege.map(zeile));
  }

  /** Schaltet die gewählten Themen nach Bestätigung ein. */
  async function einschalten(k, vorschlaege, ausgewaehlt, fertig) {
    const gewaehlt = vorschlaege.filter(v => ausgewaehlt.has(`${v.modul}/${v.thema}`) && !v.bereitsAn);
    if (!gewaehlt.length || k.gesperrt()) return;
    const ja = await k.dialog.frage({ titel: 'Themen einschalten', ja: 'Einschalten', nein: 'Abbrechen',
      text: [`Diese Themen kommen ab dem nächsten Tagesauftrag dazu: ${gewaehlt.map(v => v.titel).join(', ')}.`, 'Die Zuordnung zum Lehrmittel stammt aus der Recherche und ist nicht mit der Lehrperson abgeglichen. Ausschalten geht jederzeit in der Themenliste des Moduls.'] });
    if (!ja || !k.offen) return;
    const n = gewaehlt.filter(v => { const m = L.registry.module.get(v.modul); return !!m && L.ElternAnpassung.schalteThema(k, m, v.thema, true); }).length;
    ausgewaehlt.clear();
    k.meldung(`${n} ${n === 1 ? 'Thema' : 'Themen'} eingeschaltet. ${n === 1 ? 'Es erscheint' : 'Sie erscheinen'} ab dem nächsten Tagesauftrag.`, 'ok');
    fertig();
  }

  /** Die Karte. aenderung() zeichnet danach die Modulliste neu (die Themenschalter ändern sich). */
  function kachel(k, aenderung) {
    const h = k.h, gesperrt = k.gesperrt(), wurzel = h('div'), ausgewaehlt = new Set();
    let offen = false, erstmals = true;
    const zeichne = () => {
      const wahl = L.Lehrmittel.stand(k.Z.hole()), bekannt = Object.values(wahl).some(w => w !== L.Lehrmittel.UNBEKANNT);
      const felder = Object.entries(L.Lehrmittel.FAECHER).map(([fach, name]) => {
        const sel = h('select', { 'aria-label': `Lehrmittel ${name}`, disabled: gesperrt }, L.Lehrmittel.waehlbar(fach).map(p => h('option', { value: p.id, selected: p.id === wahl[fach] }, p.titel)));
        sel.value = wahl[fach];
        sel.addEventListener('change', () => {
          k.Z.aendere(z => { z.einstellungen.lehrmittel = { ...L.Lehrmittel.stand(z), [fach]: sel.value }; });
          ausgewaehlt.clear(); erstmals = true; k.meldung('Gespeichert.', 'ok'); zeichne();
        });
        return h('label.eltern-feld', h('span', name), sel);
      });
      const vor = bekannt && offen ? suche(k) : [];
      if (erstmals && vor.length) { vor.filter(v => v.vorgewaehlt).forEach(v => ausgewaehlt.add(`${v.modul}/${v.thema}`)); erstmals = false; }
      wurzel.replaceChildren(h('div', h('div.lm-faecher', felder),
        bekannt ? h('div.eltern-zeile', h('button.knopf', { type: 'button', 'aria-expanded': offen ? 'true' : 'false', onclick: () => { offen = !offen; ausgewaehlt.clear(); erstmals = true; zeichne(); } },
          offen ? 'Vorschläge verbergen' : 'Vorschläge ansehen')) : h('p.klein', 'Ist das Lehrmittel nicht bekannt, bleiben alle Themen aus, die nur in einem Lehrmittel zum Kern gehören.'),
        bekannt && offen ? [h('p.klein', 'Die App schaltet nichts von selbst ein. Die Auswahl gilt erst nach «Ausgewählte einschalten».'), vorschlagListe(k, vor, ausgewaehlt, zeichne),
          vor.some(v => !v.bereitsAn) ? h('div.eltern-zeile', h('button.knopf.primaer', { type: 'button', disabled: gesperrt || !ausgewaehlt.size,
            onclick: () => einschalten(k, vor, ausgewaehlt, () => { zeichne(); aenderung(); }) }, `Ausgewählte einschalten (${ausgewaehlt.size})`)) : ''] : ''));
    };
    zeichne();
    return k.kachel('Lehrmittel der Klasse', h('p.klein', 'Welches Lehrmittel nutzt die Klasse? Damit lassen sich Themen finden, die dazu passen und noch ausgeschaltet sind.'), wurzel);
  }

  L.ElternLehrmittel = { kachel, suche };
})(globalThis);
