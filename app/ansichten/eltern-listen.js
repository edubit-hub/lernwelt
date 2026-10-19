/* app/ansichten/eltern-listen.js: Reiter «Wortlisten» des Elternbereichs (AP-22, V-AP22-01). Hier tippen die Eltern die Wörter eines Wörtertests ein
   (Deutsch-Lernwörter, Englisch-Vocabulary): ein Wort pro Zeile oder «Wort = Bedeutung», dazu Titel, Fach, Prüfungsdatum und «gültig bis». Die Vorschau zeigt, was
   die App daraus macht, und nennt Probleme zeilenweise (Zeichen, die die Tastatur der App nicht bietet, fehlende Bedeutung, zu lange Angaben). Gespeichert wird nur
   über Zustand.aendere in zustand.listen, nie im Repository und bei keiner KI. Aus jeder Liste baut module/_gemeinsam/wortliste.js ein Modul, das Lernwelt.Start.meldeListen
   sofort anmeldet: Die Liste ist ohne Neustart im Tagesauftrag. Der Reiter meldet sich nicht beim Laden der Datei an, sondern über Lernwelt.ElternListen.anmelden()
   (app/start.js beim Start): So bleiben die Reiter der übrigen Elternbereich-Tests unverändert. Löschen fragt nach und entfernt auch den Lernstand der Liste. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const BAUSTEIN = '_gemeinsam/wortliste';
  const FAECHER = { deutsch: 'Deutsch (Lernwörter)', englisch: 'Englisch (Vocabulary)' };
  const BEISPIEL = { deutsch: 'Hund\nStrasse = Die Strasse ist nass.\nFahrrad', englisch: 'pencil = der Bleistift\nruler = das Lineal = Use a ruler.\nbag = die Schultasche' };
  const FORMAT = {
    deutsch: 'Ein Wort pro Zeile. «Wort = Beispielsatz» ergibt zusätzlich eine Lückenaufgabe. Steht das Wort im Satz in einer anderen Form, diese Form in geschweifte Klammern setzen: Der Hund {rennt} schnell.',
    englisch: 'Ein Wort pro Zeile: «Wort = Bedeutung». Ein Beispielsatz folgt nach einem zweiten Gleichheitszeichen: «Wort = Bedeutung = Beispielsatz» und ergibt eine Lückenaufgabe.'
  };
  /* Gestaltung: app/stil/eltern.css (wl-*). */

  const baustein = () => L.registry.bausteine.get(BAUSTEIN);
  const bereit = () => (L.registry.bausteine.has(BAUSTEIN) ? Promise.resolve(true) : L.Start && typeof L.Start.ladeListen === 'function' ? Promise.resolve(L.Start.ladeListen()).catch(() => false) : Promise.resolve(false));
  const zeilen = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
  const gekuerzt = s => String(s || '').replace(/\s+/g, ' ').trim();

  /** Nach jeder Änderung: die Module der Listen neu anmelden (Lernwelt.Start.meldeListen), damit die Liste ohne Neustart im Tagesauftrag steht. */
  function meldeListen(k) {
    try { if (L.Start && typeof L.Start.meldeListen === 'function') L.Start.meldeListen({ zustand: k.Z }); } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'eltern-listen.js' }); }
  }

  /** Text und Felder → { z (zerlegt), liste, probleme }. Probleme verhindern das Speichern: Zeilenfehler der Zerlegung, dann die Prüfung der Übungstypen. */
  function auswerte(W, w) {
    const z = W.zerlege(w.text, w.fach), liste = { id: w.id, titel: gekuerzt(w.titel), fach: w.fach, pruefung: w.pruefung || null, bis: w.bis || null, eintraege: z.eintraege };
    const probleme = [...z.probleme.map(p => ({ text: `Zeile ${p.zeile}: ${p.text}` })), ...W.pruefe(liste).map(p => ({ text: p.wort ? `«${p.wort}»: ${p.text}` : p.text }))];
    return { z, liste, probleme };
  }

  function eintrag(k, W, e) {
    const h = k.h, luecke = e.satz ? W.markiere(e.wort, e.satz) : null;
    return h('li', h('div', h('b', e.wort), e.bedeutung ? ` = ${e.bedeutung}` : ''),
      luecke ? h('div.wl-satz', `Lücke: ${luecke.replace(/\{[^{}]*\}/, '____')}`) : e.satz ? h('div.wl-satz', `Satz ohne Lücke: ${e.satz}`) : '');
  }

  function vorschau(k, W, a, leer) {
    const h = k.h;
    if (leer) return [h('p.klein', 'Die Vorschau erscheint, sobald Wörter eingetragen sind.')];
    const n = a.z.eintraege.length, mit = a.z.eintraege.filter(e => e.satz && W.markiere(e.wort, e.satz)).length;
    return [h('p', { role: 'status' }, `${zeilen(n, 'Wort', 'Wörter')}${mit ? `, davon ${mit} mit Lückenaufgabe` : ''}.`),
      a.probleme.length ? k.kasten('fehler', 'Die Liste lässt sich noch nicht speichern', h('ul.wl-probleme', a.probleme.map(p => h('li', p.text)))) : '',
      a.z.hinweise.length ? k.kasten('hilfe', 'Hinweise', h('ul.wl-probleme', a.z.hinweise.map(p => h('li', `Zeile ${p.zeile}: ${p.text}`)))) : '',
      h('ul.wl-liste', a.z.eintraege.map(e => eintrag(k, W, e)))];
  }

  /** Das Formular für eine neue Liste (liste = null) oder zum Bearbeiten. zurueck() kehrt zur Übersicht zurück. */
  function formular(k, liste, zurueck) {
    const h = k.h, W = baustein(), neu = !liste, gesperrt = k.gesperrt(), doc = k.Z.hole();
    const id = neu ? W.neueId([...(Array.isArray(doc.listen) ? doc.listen.map(l => l.id) : []), ...L.registry.module.keys()], new Date(), k.zufall) : liste.id;
    const titel = h('input', { type: 'text', maxlength: W.GRENZEN.titel, autocomplete: 'off', autocorrect: 'off', 'aria-label': 'Titel der Liste', placeholder: 'zum Beispiel Wörtertest 12', disabled: gesperrt });
    const fach = h('select', { 'aria-label': 'Fach', disabled: gesperrt || !neu }, Object.entries(FAECHER).map(([v, t]) => h('option', { value: v }, t)));
    const pruefung = h('input', { type: 'date', 'aria-label': 'Prüfungsdatum (optional)', disabled: gesperrt });
    const bis = h('input', { type: 'date', 'aria-label': 'Gültig bis (optional)', disabled: gesperrt });
    const text = h('textarea.wl-text', { rows: 10, 'aria-label': 'Wörter', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off', disabled: gesperrt });
    titel.value = liste ? liste.titel : ''; fach.value = liste ? liste.fach : 'deutsch'; pruefung.value = (liste && liste.pruefung) || ''; bis.value = (liste && liste.bis) || '';
    text.value = liste ? W.alsText(liste) : '';
    const format = h('p.hinweis'), ort = h('div.eltern-inhalt', { 'aria-live': 'polite' });
    const speichern = h('button.knopf.primaer', { type: 'button', onclick: () => sichere() }, 'Speichern');

    function aktualisiere() {
      const w = { id, titel: titel.value, fach: fach.value, pruefung: pruefung.value, bis: bis.value, text: text.value }, leer = !String(w.text).trim();
      const a = auswerte(W, w);
      format.textContent = FORMAT[w.fach];
      text.setAttribute('placeholder', BEISPIEL[w.fach]);
      ort.replaceChildren(...vorschau(k, W, a, leer));
      speichern.disabled = gesperrt || leer || a.probleme.length > 0;
      return a;
    }
    function sichere() {
      const a = aktualisiere();
      if (gesperrt || a.probleme.length || !a.z.eintraege.length) return;
      const heute = k.heute(), fertig = { ...a.liste, erstellt: (liste && liste.erstellt) || heute, geaendert: heute };
      k.Z.aendere(z => { const l = (z.listen = Array.isArray(z.listen) ? z.listen : []), i = l.findIndex(x => x.id === id); if (i >= 0) l[i] = fertig; else l.push(fertig); });
      meldeListen(k);
      k.meldung(neu ? 'Die Liste wurde angelegt und steht im Tagesauftrag.' : 'Die Liste wurde gespeichert.', 'ok');
      zurueck();
    }
    [titel, pruefung, bis, text].forEach(f => { f.addEventListener('input', aktualisiere); f.addEventListener('change', aktualisiere); });
    fach.addEventListener('change', aktualisiere);
    aktualisiere();
    return k.kachel(neu ? 'Neue Liste' : 'Liste bearbeiten',
      h('div.wl-felder', [h('label.eltern-feld', h('span', 'Titel'), titel), h('label.eltern-feld', h('span', 'Fach'), fach),
        h('label.eltern-feld', h('span', 'Prüfungsdatum (optional)'), pruefung), h('label.eltern-feld', h('span', 'Gültig bis (optional)'), bis)]),
      h('p.hinweis', 'Das Prüfungsdatum plant das Üben bis zum Test. Ohne Datum kommt neuer Stoff dieser Liste erst dran, wenn keine andere Prüfung ansteht. '
        + 'Nach dem Tag «gültig bis» blendet die App die Liste aus, der Fortschritt bleibt erhalten.'
        + (neu ? '' : ' Das Fach lässt sich nach dem Anlegen nicht mehr ändern.')),
      h('label.eltern-feld.wl-breit', h('span', 'Wörter'), text), format,
      h('div.eltern-zeile.wl-aktionen', speichern, h('button.knopf.leise', { type: 'button', onclick: zurueck }, 'Abbrechen')),
      h('h4.wl-vorschau', 'Vorschau'), ort);
  }

  async function loesche(k, l, danach) {
    const n = Array.isArray(l.eintraege) ? l.eintraege.length : 0;
    const ja = await k.dialog.frage({ titel: 'Liste löschen?', ja: 'Löschen', nein: 'Abbrechen', gefahr: true,
      text: [`Die Liste «${l.titel}» mit ${zeilen(n, 'Wort', 'Wörtern')} wird gelöscht.`, 'Auch der Lernstand zu dieser Liste geht verloren. Das lässt sich nicht rückgängig machen.'] });
    if (!ja) return;
    k.Z.aendere(z => { z.listen = (Array.isArray(z.listen) ? z.listen : []).filter(x => x.id !== l.id); if (z.module) delete z.module[l.id]; });
    meldeListen(k);
    if (k.offen) { k.meldung('Die Liste wurde gelöscht.', 'ok'); danach(); }
  }

  function uebersicht(k, aktion) {
    const h = k.h, W = baustein(), doc = k.Z.hole(), heute = k.heute(), gesperrt = k.gesperrt();
    const listen = (Array.isArray(doc.listen) ? doc.listen : []).filter(l => l && typeof l.id === 'string');
    const sortiert = [...listen.filter(l => !W.abgelaufen(l, heute)), ...listen.filter(l => W.abgelaufen(l, heute))];
    const karte = l => {
      const aus = W.abgelaufen(l, heute), n = Array.isArray(l.eintraege) ? l.eintraege.length : 0;
      return k.kachel(l.titel || 'Ohne Titel', k.werte([['Fach', FAECHER[l.fach] || 'unbekannt'], ['Wörter', n], ['Prüfung', l.pruefung ? k.datum(l.pruefung) : 'keine Angabe'], ['Gültig bis', l.bis ? k.datum(l.bis) : 'ohne Ende']]),
        h('p', aus ? `Ausgeblendet seit dem ${k.datum(L.Tag.plus(l.bis, 1))}. Der Fortschritt bleibt erhalten.` : 'Die Liste steht im Tagesauftrag.'),
        h('div.eltern-zeile', [h('button.knopf', { type: 'button', disabled: gesperrt, 'aria-label': `${l.titel} bearbeiten`, onclick: () => aktion.bearbeite(l) }, 'Bearbeiten'),
          h('button.knopf.gefahr', { type: 'button', disabled: gesperrt, 'aria-label': `${l.titel} löschen`, onclick: () => loesche(k, l, aktion.geloescht) }, 'Löschen')]));
    };
    return h('div.eltern-inhalt', k.kachel('Wortlisten für Wörtertests',
      h('p', 'Die Wörter der Woche eintippen: Die App übt sie im Tagesauftrag. Deutsche Wörter werden diktiert, englische mit Karteikarten, Hören, Zuordnen und Schreiben geübt.'),
      h('p.hinweis', 'Die Listen bleiben auf diesem Gerät und stehen in der Sicherungsdatei, sie werden nicht hochgeladen und nicht an KI-Werkzeuge gesendet. Vor einem Test lohnt sich eine Sicherung im Reiter «Daten».'),
      gesperrt ? h('p.hinweis', 'Der Lernstand ist nur lesbar. Änderungen werden nicht gespeichert.') : '',
      h('div.eltern-zeile', h('button.knopf.primaer', { type: 'button', disabled: gesperrt || listen.length >= W.GRENZEN.listen, onclick: aktion.neu }, 'Neue Liste'))),
      sortiert.length ? sortiert.map(karte) : h('p.klein', 'Es gibt noch keine Liste.'));
  }

  function bau(k) {
    const h = k.h, wurzel = h('div.eltern-inhalt');
    const zeigeUebersicht = () => wurzel.replaceChildren(uebersicht(k, { neu: () => zeigeFormular(null), bearbeite: l => zeigeFormular(l), geloescht: zeigeUebersicht }));
    const zeigeFormular = liste => wurzel.replaceChildren(formular(k, liste, zeigeUebersicht));
    wurzel.replaceChildren(h('p.klein', 'Wortlisten werden geladen.'));
    bereit().then(ok => {
      if (!k.offen) return;
      if (ok) zeigeUebersicht(); else wurzel.replaceChildren(k.kasten('fehler', 'Wortlisten nicht verfügbar', 'Der Baustein für Wortlisten lässt sich nicht laden. Bitte die App neu öffnen.'));
    });
    return wurzel;
  }

  const abschnitt = { id: 'wortlisten', titel: 'Wortlisten', rang: 25, bau };
  /** Meldet den Reiter im Elternbereich an (ersetzt einen früheren Eintrag). app/start.js ruft das beim Start auf. */
  function anmelden() {
    const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === abschnitt.id);
    if (alt >= 0) liste.splice(alt, 1);
    liste.push(abschnitt);
  }

  L.ElternListen = { abschnitt, anmelden, auswerte, bau, formular, uebersicht };
})(globalThis);
