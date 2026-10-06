/* app/ui/dialog.js: Meldungen und Rückfragen als eigene Fläche statt alert() und confirm(), die im Vollbild der installierten Web-App
   hässlich aussehen und das Layout verschieben können.
   dialog.meldung(text | { titel, text, knopf }) → Promise<void>      eine Meldung mit einem Knopf (Standard «OK»)
   dialog.frage(text | { titel, text, ja, nein, gefahr }) → Promise<boolean>   Rückfrage, true nur bei «ja». Standard «Ja» und «Nein».
   text ist ein Text (Leerzeile = neuer Absatz) oder eine Liste von Absätzen. Mit gefahr: true liegt der Fokus auf «nein» und «ja» ist
   zurückhaltend rot gerahmt, gedacht für Löschen und Zurücksetzen. Escape und ein Tipp neben den Kasten gelten bei frage als «nein».
   Es ist immer höchstens ein Dialog sichtbar, weitere warten der Reihe nach. offen() sagt, ob einer angezeigt wird, schliesseAlle() beendet
   alle mit der Abbruchantwort (false bei frage). Der Fokus bleibt im Dialog (Tab wandert im Kreis) und kehrt danach zurück. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const ui = (L.ui = L.ui || {});

  const warteschlange = [];
  let aktiv = null, zaehler = 0;

  const absaetze = text => (Array.isArray(text) ? text : String(text ?? '').split(/\n{2,}/)).map(a => String(a).trim()).filter(Boolean);
  const normal = (a, vorgabe) => (a !== null && typeof a === 'object' && !Array.isArray(a) ? { ...vorgabe, ...a } : { ...vorgabe, text: a });

  /** Baut den Dialog, hängt ihn an body und liefert { schliesse(antwort) }. fertig(antwort) kommt genau einmal. */
  function zeige(art, o, fertig) {
    const h = ui.h, id = `dialog-${++zaehler}`, frage = art === 'frage', vorher = g.document.activeElement;
    let offen = true;
    const schliesse = antwort => {
      if (!offen) return;
      offen = false;
      huelle.remove();
      if (vorher && vorher.isConnected && vorher.focus) vorher.focus();
      fertig(antwort);
    };
    const abbruch = frage ? false : undefined;
    const knopf = (text, antwort, klasse) => h(`button.knopf${klasse}`, { type: 'button', onclick: () => schliesse(antwort) }, text);
    const ja = frage ? knopf(o.ja, true, o.gefahr ? '.gefahr' : '.primaer') : knopf(o.knopf, undefined, '.primaer');
    const nein = frage ? knopf(o.nein, false, '') : null;
    const knoepfe = nein ? [nein, ja] : [ja];

    const kasten = h('div.dialog', {
      role: 'alertdialog', 'aria-modal': 'true', tabindex: '-1',
      'aria-labelledby': o.titel ? `${id}-titel` : null, 'aria-label': o.titel ? null : (frage ? 'Rückfrage' : 'Meldung'), 'aria-describedby': `${id}-text`
    },
      o.titel ? h('h2.dialog-titel', { id: `${id}-titel` }, o.titel) : '',
      h('div.dialog-text', { id: `${id}-text` }, absaetze(o.text).map(a => h('p', a))),
      h('div.dialog-knoepfe', knoepfe));

    function taste(e) {
      if (e.stopPropagation) e.stopPropagation();                      // Tasten im Dialog erreichen nie eine Tastatur dahinter
      if (e.key === 'Escape') { if (e.preventDefault) e.preventDefault(); schliesse(abbruch); }
      else if (e.key === 'Tab') {
        const i = knoepfe.indexOf(g.document.activeElement), n = knoepfe.length;
        const ziel = knoepfe[i < 0 ? (e.shiftKey ? n - 1 : 0) : (i + (e.shiftKey ? n - 1 : 1)) % n];
        if (e.preventDefault) e.preventDefault();
        ziel.focus();
      }
    }
    const huelle = h('div.dialog-huelle', { onkeydown: taste, onclick: e => { if (e.target === huelle) schliesse(abbruch); } }, kasten);
    g.document.body.appendChild(huelle);
    (frage && o.gefahr ? nein : ja).focus();
    return { schliesse: () => schliesse(abbruch) };
  }

  function naechster() {
    const n = warteschlange.shift();
    if (!n) { aktiv = null; return; }
    aktiv = zeige(n.art, n.o, antwort => { aktiv = null; n.fertig(antwort); naechster(); });
  }
  function oeffne(art, o) {
    return new Promise(fertig => { warteschlange.push({ art, o, fertig }); if (!aktiv) naechster(); });
  }

  ui.dialog = {
    meldung: (a, opt) => oeffne('meldung', { knopf: 'OK', ...normal(a, opt) }),
    frage: (a, opt) => oeffne('frage', { ja: 'Ja', nein: 'Nein', gefahr: false, ...normal(a, opt) }),
    offen: () => aktiv !== null,
    schliesseAlle() {
      for (const n of warteschlange.splice(0)) n.fertig(n.art === 'frage' ? false : undefined);
      if (aktiv) aktiv.schliesse();
    }
  };
})(globalThis);
