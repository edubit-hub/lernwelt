/* app/ansichten/eltern-module.js: Reiter «Module» des Elternbereichs (AP-13b, Architektur 4.5 und 13.3). Hier schalten die Eltern Module ein und aus, schalten
   einzelne Themen (auch die ausgeschalteten, nur in einem Lehrmittelprofil geltenden, R44) und ändern die Einstellungen, die `modul.anpassbar` freigibt
   (eltern-anpassung.js). Das Lehrmittel der Klasse und die Vorschläge stehen in eltern-lehrmittel.js am Kopf des Reiters.
   Entwürfe (status «entwurf») lassen sich bewusst aktivieren: nach einer Rückfrage und mit dem bleibenden Hinweis «Entwurf: Lösungswege noch nicht mit dem Lehrmittel
   abgeglichen». Aktivieren setzt zustand.module[id].aktiv und lädt die Dateien über Lernwelt.Start.ladeModule, ohne Neustart. Gelingt das Laden nicht, steht der Hinweis auf
   den Neustart da. Der Reiter meldet sich nicht beim Laden der Datei an, sondern über Lernwelt.ElternModule.anmelden() (app/start.js beim Start, V-AP22-03). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /* Gestaltung: app/stil/eltern.css (mod-*, anp*). */
  const FACH_REIHE = ['mathe', 'deutsch', 'englisch', 'nmg'];
  const ENTWURF = 'Entwurf: Lösungswege noch nicht mit dem Lehrmittel abgeglichen.';

  const eintraege = () => (L.katalog || []).slice().sort((a, b) => (FACH_REIHE.indexOf(a.fach) - FACH_REIHE.indexOf(b.fach)) || String(a.titel).localeCompare(String(b.titel)));
  const imManifest = id => !!(L.manifest && L.manifest.module && L.manifest.module[id]);

  /** Lädt die Dateien aktiver Module nach. Wahr, wenn das Modul danach in der Registry steht. Wirft nie. */
  async function lade(k, id) {
    try {
      if (L.Start && typeof L.Start.ladeModule === 'function') await L.Start.ladeModule();
      if (L.Huelle && typeof L.Huelle.aktualisiere === 'function') L.Huelle.aktualisiere();
    } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'eltern-module.js' }); }
    return L.registry.module.has(id);
  }

  async function aktiviere(k, e, z, zeichne) {
    if (k.gesperrt()) return;
    if (e.status !== 'freigegeben') {
      const ja = await k.dialog.frage({ titel: 'Entwurf aktivieren', ja: 'Entwurf aktivieren', nein: 'Abbrechen',
        text: [`${ENTWURF} Erklärungen und Sprechweisen können von dem abweichen, was die Klasse braucht.`, 'Themen, die nur in einem Lehrmittel zum Kern gehören, bleiben ausgeschaltet, bis Sie sie in der Themenliste einschalten.'] });
      if (!ja || !k.offen) return;
    }
    k.Z.aendere(() => { const m = k.Z.modul(e.id); m.aktiv = true; if (!m.version) m.version = e.version; });
    const geladen = await lade(k, e.id);
    if (!k.offen) return;
    if (geladen) z.neustart.delete(e.id); else z.neustart.add(e.id);
    k.meldung(geladen ? `«${e.titel}» ist aktiv und steht im Tagesauftrag.` : `«${e.titel}» ist gespeichert. Die App muss neu geladen werden.`, geladen ? 'ok' : '');
    zeichne();
  }

  async function schalteAus(k, e, z, zeichne) {
    if (k.gesperrt()) return;
    const ja = await k.dialog.frage({ titel: 'Modul ausschalten', ja: 'Ausschalten', nein: 'Abbrechen', text: [`«${e.titel}» verschwindet aus dem Tagesauftrag.`, 'Der Lernstand bleibt erhalten. Beim Einschalten geht es dort weiter.'] });
    if (!ja || !k.offen) return;
    k.Z.aendere(() => { k.Z.modul(e.id).aktiv = false; });
    z.neustart.delete(e.id);
    try { if (L.Huelle && L.Huelle.aktualisiere) L.Huelle.aktualisiere(); } catch (err) { k.log.melde(err, { art: 'fehler', datei: 'eltern-module.js' }); }
    k.meldung(`«${e.titel}» ist ausgeschaltet.`, 'ok');
    zeichne();
  }

  /** Die Themen eines geladenen Moduls mit Schalter und, wo es sie gibt, dem Hinweis zur Geltung (V-AP20-02). */
  function themenListe(k, modul, md, z, zeichne) {
    const h = k.h, gesperrt = k.gesperrt();
    const zeilen = modul.themen.map(t => {
      const an = L.Modell.thema(modul, t, md.anpassung).aktiv !== false, darf = L.ElternAnpassung.darfThema(modul, t.id);
      return h('li', h('div', h('span', h('b', t.titel), ' ', h('span.etikett' + (an ? '' : '.grau'), an ? 'An' : 'Aus'), t.aktiv === false ? [' ', h('span.etikett.grau', 'Nur in einem Lehrmittel')] : ''),
        darf ? h('button.knopf', { type: 'button', 'aria-pressed': an ? 'true' : 'false', 'aria-label': `Thema «${t.titel}» ${an ? 'ausschalten' : 'einschalten'}`, disabled: gesperrt,
          onclick: () => {
            if (L.ElternAnpassung.schalteThema(k, modul, t.id, !an)) { k.meldung(`«${t.titel}» ist ${an ? 'aus' : 'an'}. Die Änderung gilt ab dem nächsten Tagesauftrag.`, 'ok'); zeichne(); }
          } }, an ? 'Ausschalten' : 'Einschalten') : h('span.klein', 'Nicht einstellbar')),
      t.geltung ? h('p.klein', t.geltung) : '');
    });
    const aus = modul.themen.filter(t => L.Modell.thema(modul, t, md.anpassung).aktiv === false).length;
    return h('details.mod-details', { open: z.offen.has(modul.id), ontoggle: ev => { if (ev.target && ev.target.open) z.offen.add(modul.id); else z.offen.delete(modul.id); } },
      h('summary', `Themen (${modul.themen.length}${aus ? `, ${aus} aus` : ''})`), h('ul.mod-themen', zeilen));
  }

  function karte(k, e, z, zeichne) {
    const h = k.h, doc = k.Z.hole(), md = doc.module[e.id] || null, aktiv = !!md && md.aktiv === true, gesperrt = k.gesperrt();
    const modul = aktiv ? L.registry.module.get(e.id) || null : null, klasse = (doc.profil || {}).klasse, passt = !e.stufen || e.stufen.includes(klasse);
    const knopf = aktiv ? h('button.knopf.leise', { type: 'button', disabled: gesperrt, 'aria-label': `Modul «${e.titel}» ausschalten`, onclick: () => schalteAus(k, e, z, zeichne) }, 'Ausschalten')
      : h('button.knopf.primaer', { type: 'button', disabled: gesperrt || !imManifest(e.id), 'aria-label': `Modul «${e.titel}» aktivieren`, onclick: () => aktiviere(k, e, z, zeichne) }, 'Aktivieren');
    return h('article.kachel.eltern-kachel', { 'data-modul': e.id },
      h('div.mod-kopf', h('h3', e.titel), h('span.etikett.grau', L.Lernplan.fachName(e.fach)), e.status !== 'freigegeben' ? h('span.etikett', 'Entwurf') : '', aktiv ? h('span.etikett', 'Aktiv') : ''),
      h('p.klein', `${e.aufgaben} Aufgaben, Version ${e.version}${passt ? '' : `. Vorgesehen für die ${e.stufen.join('. und ')}. Klasse`}.`),
      aktiv && e.status !== 'freigegeben' ? h('p.hinweis', ENTWURF) : '',
      z.neustart.has(e.id) ? k.kasten('hilfe', 'Neustart nötig', h('p', 'Das Modul wird beim nächsten Start der App geladen.'),
        h('button.knopf', { type: 'button', onclick: () => k.neuLaden() }, 'Jetzt neu laden')) : '',
      h('div.eltern-zeile', knopf, imManifest(e.id) ? '' : h('span.klein', 'Dieses Modul gehört nicht zur ausgelieferten App.')),
      modul && md ? [themenListe(k, modul, md, z, zeichne), L.ElternAnpassung.felder(k, modul, zeichne)] : aktiv ? h('p.klein', 'Das Modul ist noch nicht geladen. Nach einem Neustart erscheinen die Themen.') : '');
  }

  function bau(k) {
    const h = k.h, wurzel = h('div.eltern-inhalt'), liste = h('div.mod-liste'), z = { offen: new Set(), neustart: new Set() };
    const zeichne = () => liste.replaceChildren(...eintraege().map(e => karte(k, e, z, zeichne)));
    wurzel.append(h('p.klein', 'Module sind die Themenpakete im Tagesauftrag. Entwürfe lassen sich bewusst einschalten, sie sind als Entwurf gekennzeichnet.'),
      L.ElternLehrmittel ? L.ElternLehrmittel.kachel(k, zeichne) : '', liste);
    zeichne();
    return wurzel;
  }

  const abschnitt = { id: 'module', titel: 'Module', rang: 20, bau };
  /** Meldet den Reiter im Elternbereich an (ersetzt einen früheren Eintrag). app/start.js ruft das beim Start auf. */
  function anmelden() {
    const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === abschnitt.id);
    if (alt >= 0) liste.splice(alt, 1);
    liste.push(abschnitt);
  }

  L.ElternModule = { abschnitt, anmelden, bau, aktiviere, ENTWURF };
})(globalThis);
