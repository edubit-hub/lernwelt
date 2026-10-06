/* app/ansichten/eltern-schwaechen.js: Reiter «Schwächen» des Elternbereichs (AP-13b, Architektur 6.5 Punkt 6). Je aktivem Modul: die Fehlerarten der letzten 14 Tage mit dem
   `eltern`-Text aus modul.fehlerCodes, die Aufgaben mit mehreren Fehlern in Folge (Verlauf endet auf «00», Fehler.mehrfach) und die Hinweise zur Begleitung (modul.begleitung).
   module[id].fehler[code] = { n, zuletzt } zählt seit dem Beginn. Die Liste zeigt darum nur Codes, die in den letzten 14 Tagen vorkamen (zuletzt), mit ihrer Gesamtzahl.
   Nichts wird geschrieben. Der Reiter meldet sich über Lernwelt.ElternSchwaechen.anmelden() an (app/start.js beim Start, V-AP22-03). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const TAGE = 14, MAX_CODES = 6, MAX_AUFGABEN = 8;
  const STIL = `
.sw-liste { display: grid; gap: var(--a2); margin: var(--a2) 0 0; padding: 0; list-style: none; }
.sw-liste li { display: grid; gap: 2px; padding: var(--a2) var(--a3); border: 1px solid var(--linie); border-radius: var(--radius); background: var(--flaeche); overflow-wrap: anywhere; }
.sw-teil { display: grid; gap: var(--a2); margin-top: var(--a4); }
.sw-teil h4 { font-size: var(--t-text); }
.sw-begleitung { margin: 0; padding-left: var(--a5); display: grid; gap: var(--a2); }
`;

  function stil(k) {
    const d = k.dok;
    if (!d || !d.head || (d.getElementById && d.getElementById('eltern-schwaechen-stil'))) return;
    const s = d.createElement('style');
    s.setAttribute('id', 'eltern-schwaechen-stil');
    s.textContent = STIL;
    d.head.append(s);
  }

  const name = code => { const t = String(code).replace(/-/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

  const gross = t => t.charAt(0).toUpperCase() + t.slice(1);

  /** Titel und Text einer Fehlerart für die Eltern. Der Titel ist der erste Satzteil des Elterntexts («Ein Nomen wurde klein geschrieben»), nicht die Kennung des Codes;
      der Text ist der Rest. Ohne brauchbaren Satzteil (leer oder über 80 Zeichen) steht die lesbar gemachte Kennung da und der ganze Text darunter. */
  function beschriftung(code, eltern) {
    const t = String(eltern || '').trim(), m = /^((?:[^,.:;()]|\([^)]*\))+?)[,.:;](?:\s+|$)/.exec(t);   // Satzzeichen in Klammern trennen nicht
    if (!m || m[1].length > 80) return { titel: name(code), text: t };
    return { titel: gross(m[1]), text: gross(t.slice(m[0].length).trim()) };
  }

  /** Die Fehlerarten, die in den letzten 14 Tagen vorkamen: [{ code, n, zuletzt, eltern, folge }], die häufigsten zuerst. */
  function fehlerarten(modul, md, heute) {
    const ab = L.Tag.plus(heute, -TAGE);
    return Object.entries((md && md.fehler) || {}).filter(([, f]) => f && L.Tag.gueltig(f.zuletzt) && f.zuletzt >= ab && f.zuletzt <= heute)
      .map(([code, f]) => { const x = L.Fehler.folge(modul, code, null); return { code, n: f.n || 0, zuletzt: f.zuletzt, eltern: x.eltern, folge: x.folge }; })
      .sort((a, b) => b.n - a.n || (a.zuletzt < b.zuletzt ? 1 : -1) || a.code.localeCompare(b.code));
  }

  /** Aufgaben mit mehreren Fehlern in Folge: [{ id, thema, verlauf, zuletzt }]. thema ist der Titel des Themas oder die Kennung. */
  function mehrfach(modul, md) {
    const ids = L.Fehler.mehrfach(md && md.aufgaben).slice(0, MAX_AUFGABEN), thema = new Map();
    for (const t of modul.themen) { if (thema.size >= ids.length) break; try { L.Modell.aufgaben(modul, t.id).forEach(a => { if (ids.includes(a.id) && !thema.has(a.id)) thema.set(a.id, t.titel); }); } catch (e) { /* ein Thema ohne Aufgaben zählt nicht */ } }
    return ids.map(id => ({ id, thema: thema.get(id) || 'unbekanntes Thema', verlauf: md.aufgaben[id].verlauf, zuletzt: md.aufgaben[id].zuletzt }));
  }

  function karte(k, id) {
    const h = k.h, doc = k.Z.hole(), modul = L.registry.module.get(id), md = doc.module[id], d = L.Eltern.datum;
    const arten = fehlerarten(modul, md, k.heute()), viele = mehrfach(modul, md), begleitung = Array.isArray(modul.begleitung) ? modul.begleitung : [];
    return h('article.kachel.eltern-kachel', { 'data-modul': id }, h('h3', modul.titel),
      h('div.sw-teil', h('h4', 'Fehlerarten der letzten 14 Tage'),
        arten.length ? h('ul.sw-liste', arten.slice(0, MAX_CODES).map(a => { const b = beschriftung(a.code, a.eltern);
          return h('li', h('div', h('b', b.titel), ` (insgesamt ${a.n} Mal, zuletzt am ${d(a.zuletzt)})`),
            h('p', b.text || (a.eltern ? '' : 'Dazu gibt es noch keinen Hinweis.')), a.folge === 'braucht' ? h('p.klein', 'Die App prüft danach zuerst die Voraussetzungen der Aufgabe.') : ''); }))
          : h('p.klein', 'In den letzten 14 Tagen wurde keine Fehlerart erfasst.')),
      viele.length ? h('div.sw-teil', h('h4', 'Mehrere Fehler in Folge'),                 // ohne solche Aufgaben bleibt der Abschnitt weg, eine leere Rubrik sagt nichts
        h('ul.sw-liste', viele.map(v => h('li', h('div', h('b', `Aufgabe ${v.id}`), ` im Thema «${v.thema}»`), h('p.klein', `Zuletzt am ${d(v.zuletzt)}, Verlauf ${v.verlauf}.`))))) : '',
      begleitung.length ? h('details.sw-teil', { open: true }, h('summary', 'Begleiten'), h('ul.sw-begleitung', begleitung.map(b => h('li', b)))) : '');
  }

  function bau(k) {
    const h = k.h, doc = k.Z.hole();
    stil(k);
    const ids = [...L.registry.module.keys()].filter(id => doc.module[id] && doc.module[id].aktiv === true && (L.katalog || []).some(e => e.id === id));
    return h('div.eltern-inhalt', h('p.klein', 'Hier steht, wobei das Kind im Moment Mühe hat und wie Sie es begleiten können. Die Zahlen zählen seit Beginn, die Liste zeigt nur Fehlerarten der letzten 14 Tage.'),
      ids.length ? ids.map(id => karte(k, id)) : k.kasten('hilfe', 'Kein Modul aktiv', 'Schalten Sie im Reiter «Module» ein Modul ein. Danach erscheinen hier die Fehlerarten.'));
  }

  const abschnitt = { id: 'schwaechen', titel: 'Schwächen', rang: 40, bau };
  /** Meldet den Reiter im Elternbereich an (ersetzt einen früheren Eintrag). app/start.js ruft das beim Start auf. */
  function anmelden() {
    const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === abschnitt.id);
    if (alt >= 0) liste.splice(alt, 1);
    liste.push(abschnitt);
  }

  L.ElternSchwaechen = { abschnitt, anmelden, bau, fehlerarten, mehrfach, name, beschriftung };
})(globalThis);
