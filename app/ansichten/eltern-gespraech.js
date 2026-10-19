/* app/ansichten/eltern-gespraech.js: Reiter «Gespräch» des Elternbereichs (AP-13b, Architektur 7.8). Die Siedlung des Kindes, nur zum Lesen: Die Karte zeigt, was gebaut
   und erforscht ist, und tippt man einen Platz an, nennt eine Zeile, was dort steht. Es gibt keine Aktion: nichts bauen, nichts erforschen, nichts verschieben. Darunter stehen
   drei Gesprächsanlässe, aus dem Stand der Welt gebildet (zuletzt erforscht, gebaut, das nächste Ziel). Sie sind sachlich gehalten und lassen das Kind erzählen, ohne zu prüfen.
   Gelesen wird über WeltDaten, gezeichnet mit Render.karte ohne Rückruf auf Aktionen. Das Welt-Thema ist L.Start.welt, im Test über opt.weltThema austauschbar.
   Der Reiter meldet sich über Lernwelt.ElternGespraech.anmelden() an (app/start.js beim Start, V-AP22-03). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /* Gestaltung: app/stil/eltern.css (gesp-*). */
  let karteAlt = null;                                                 // die zuletzt gezeichnete Karte, wird beim nächsten Zeichnen und beim Schliessen freigegeben

  /** Genau drei Gesprächsanlässe aus dem Stand der Welt (kx aus WeltDaten.kontext). Fehlt ein Stand, springt eine allgemeine Frage ein. */
  function anlaesse(kx) {
    const D = L.WeltDaten, erforscht = Array.isArray(kx.stand.erforscht) ? kx.stand.erforscht : [], gebaut = Object.entries(kx.stand.gebaut || {}).filter(([, s]) => s >= 1).sort((a, b) => b[1] - a[1]);
    const knoten = erforscht.length ? D.knoten(kx, erforscht[erforscht.length - 1]) : null, z = D.ziel(kx);
    return [
      knoten ? `Du hast «${knoten.name}» erforscht. Was hast du dafür gelernt, und was kann die Siedlung jetzt?` : 'Was möchtest du als Erstes erforschen? Warum gerade das?',
      gebaut.length ? `Zeig mir, was du gebaut hast. Warum steht «${D.name(kx, gebaut[0][0])}» schon da?` : 'Was möchtest du als Erstes bauen? Was braucht es dafür?',
      z ? `Dein nächstes Ziel ist «${z.name}». Warum zuerst dieses?` : 'Was war diese Woche beim Üben leicht, und was war schwer?'
    ];
  }

  /** Eine Zeile zum angetippten Platz. */
  function platzText(kx, w) {
    if (w.art === 'gebaut') return `${L.WeltDaten.name(kx, w.bauteil)}, Stufe ${w.stufe}.`;
    return w.art === 'frei' ? 'Ein freier Bauplatz.' : 'Dieser Platz ist noch gesperrt.';
  }

  function stand(k, kx) {
    const D = L.WeltDaten, e = D.epocheStand(kx), pl = D.plaetzeStand(kx), n = Array.isArray(kx.stand.erforscht) ? kx.stand.erforscht.length : 0, anzahl = (kx.thema.forschung || []).length;
    return k.werte([['Erforscht', `${n} von ${anzahl} Knoten`], ...(e ? [['Epoche', `${e.nr}: ${e.name}`]] : []), ['Bauplätze', `${pl.belegt} von ${pl.gesamt} belegt`]]);
  }

  function bau(k) {
    const h = k.h, wurzel = h('div.eltern-inhalt'), kx = L.WeltDaten.kontext(k.Z.hole(), k.opt.weltThema);
    if (karteAlt) { try { karteAlt.zerstoere(); } catch (e) { /* schon weg */ } karteAlt = null; }
    if (!kx) { wurzel.append(k.kasten('hilfe', 'Keine Siedlung', 'Es ist keine Welt geladen. Sobald das Kind eine Siedlung hat, erscheint sie hier zum Lesen.')); return wurzel; }
    const box = h('div.gesp-karte', { role: 'img', 'aria-label': 'Die Siedlung des Kindes, nur zum Lesen' }), wahl = h('p.gesp-wahl.klein', { role: 'status', 'aria-live': 'polite' }, 'Tippen Sie einen Platz an, um zu sehen, was dort steht.');
    try {
      karteAlt = L.Render.karte(box, kx.thema, kx.stand, { ausbau: [], onWahl: w => { wahl.textContent = platzText(kx, w); } });
      k.beiEnde(() => { if (karteAlt) { karteAlt.zerstoere(); karteAlt = null; } });
    } catch (e) { k.log.melde(e, { art: 'fehler', datei: 'eltern-gespraech.js' }); box.replaceChildren(h('p.klein', 'Die Karte lässt sich nicht zeichnen.')); }
    wurzel.append(k.kachel('Siedlung', h('p.klein', 'Nur zum Lesen: Hier lässt sich nichts bauen und nichts ändern.'), box, wahl, stand(k, kx)),
      k.kachel('Drei Anlässe für ein Gespräch', h('p.klein', 'Das Kind erzählt, Sie hören zu. Die Fragen prüfen nichts.'), h('ul.gesp-liste', anlaesse(kx).map(t => h('li', t)))));
    return wurzel;
  }

  const abschnitt = { id: 'gespraech', titel: 'Gespräch', rang: 50, bau };
  /** Meldet den Reiter im Elternbereich an (ersetzt einen früheren Eintrag). app/start.js ruft das beim Start auf. */
  function anmelden() {
    const E = (L.Eltern = L.Eltern || {}), liste = (E.abschnitte = E.abschnitte || []), alt = liste.findIndex(a => a.id === abschnitt.id);
    if (alt >= 0) liste.splice(alt, 1);
    liste.push(abschnitt);
  }

  L.ElternGespraech = { abschnitt, anmelden, bau, anlaesse, platzText, karte: () => karteAlt };
})(globalThis);
