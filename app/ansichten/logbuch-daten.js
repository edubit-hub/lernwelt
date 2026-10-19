/* app/ansichten/logbuch-daten.js: die Zahlen des Logbuchs (Architektur 6.1, 6.3, 7.8 und 7.4, Mockup docs/mockup/siedlung.html, AP-16). Kein DOM, nichts wird verändert.
   Alles wird aus dem Zustandsdokument gelesen: Tageslog (zustand.tage), Aufgabenzustände der Module (Stand.themenStand), Verdienstbuch (ledger) und Bestwerte.
   Verglichen wird nur mit sich selbst: die letzten sieben Tage gegen die sieben davor. Nichts davon zählt als Leistung gegen andere.
   Nicht im Tageslog stehen «neu sichere Aufgaben» und «längste fehlerfreie Runde»: die Kachel zeigt stattdessen die neuen Aufgaben des Tages (V-AP16-08). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const MIN_AUFGABEN = 10;                                     // ein Tag zählt für die beste Trefferquote erst ab so vielen Aufgaben (sonst gewinnt ein Tag mit einer Aufgabe)
  const objekt = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const zahl = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const liste = x => (Array.isArray(x) ? x : []);

  const tagLog = (doc, d) => (objekt(doc.tage) && objekt(doc.tage[d]) ? doc.tage[d] : {});

  /** Sieben Tage bis `ende` (einschliesslich): je Tag { datum, kurz, aufgaben, zeit (Minuten), neu, richtig, beurteilt, treffer (Prozent oder null) }. */
  function reihe(doc, ende) {
    return Array.from({ length: 7 }, (_, i) => {
      const datum = L.Tag.plus(ende, i - 6), log = tagLog(doc, datum), richtig = zahl(log.richtig), beurteilt = richtig + zahl(log.hilfe) + zahl(log.falsch);
      return { datum, kurz: L.Texte.welt.tagKurz[L.Tag.wochentag(datum)], aufgaben: zahl(log.aufgaben), zeit: Math.round(zahl(log.min)), neu: Math.max(0, zahl(log.neu) - zahl(log.bekannt)),
        richtig, beurteilt, treffer: beurteilt ? Math.round(100 * richtig / beurteilt) : null };
    });
  }

  /** Summen einer Reihe. treffer: Prozent aller beurteilten Aufgaben, null ohne Aufgaben. */
  function summe(r) {
    const s = r.reduce((a, x) => ({ aufgaben: a.aufgaben + x.aufgaben, zeit: a.zeit + x.zeit, neu: a.neu + x.neu, richtig: a.richtig + x.richtig, beurteilt: a.beurteilt + x.beurteilt }),
      { aufgaben: 0, zeit: 0, neu: 0, richtig: 0, beurteilt: 0 });
    return { ...s, treffer: s.beurteilt ? Math.round(100 * s.richtig / s.beurteilt) : null };
  }

  /** Die letzten sieben Tage bis heute und die sieben davor: { tage, vorTage, jetzt, davor (Summen), hatTage }. */
  function wochen(doc, heute) {
    const tage = reihe(doc, heute), vorTage = reihe(doc, L.Tag.plus(heute, -7));
    return { tage, vorTage, jetzt: summe(tage), davor: summe(vorTage), hatTage: tage.some(x => x.aufgaben > 0) || vorTage.some(x => x.aufgaben > 0) };
  }

  /**
   * Wissensstand je Bereich: aus den Aufgabenzuständen der aktiven Module, nie gespeichert. Eine Gruppe je Bereich { bereich, punkte (Wissen im Verdienstbuch), module, themen },
   * ein Thema { id, titel, modul, fach, stand, stufe (1 bis 5), sicher, aufgaben }.
   */
  function wissen(doc) {
    const gruppen = new Map(), punkte = objekt(doc.ledger) && objekt(doc.ledger.wissen) ? doc.ledger.wissen : {};
    for (const id of L.Lernplan.aktive(doc)) {
      const modul = L.registry.module.get(id), md = objekt(doc.module && doc.module[id]) ? doc.module[id] : {}, zs = objekt(md.aufgaben) ? md.aufgaben : {};
      if (!modul) continue;
      const themen = [];
      for (const t of liste(modul.themen)) {
        try {
          const th = L.Modell.thema(modul, t, md.anpassung);
          if (th.aktiv === false) continue;
          const st = L.Modell.aufgaben(modul, t.id).map(a => zs[a.id]), stand = L.Stand.themenStand(st, th.mastery), z = L.Stand.zaehle(st, th.mastery);
          themen.push({ id: `${id}/${t.id}`, titel: t.titel || t.id, modul: modul.titel || id, fach: modul.fach, stand, stufe: L.Stand.STUFEN.indexOf(stand) + 1, sicher: z.sicher, aufgaben: z.aufgaben });
        } catch (fehler) { /* ein Thema, das sich nicht lesen lässt, fehlt in der Anzeige */ }
      }
      const key = modul.bereich || modul.fach || id;
      if (!gruppen.has(key)) gruppen.set(key, { bereich: key, punkte: zahl(punkte[key]), module: [], themen: [] });
      const gr = gruppen.get(key);
      gr.module.push(modul.titel || id);
      gr.themen.push(...themen);
    }
    return [...gruppen.values()];
  }

  /** Bestwerte gegen sich selbst: [{ id, label, wert (Text), einheit, tag, neu }]. Aus dem Tageslog (meiste Aufgaben, beste Trefferquote ab MIN_AUFGABEN, längste Übungszeit) und aus zustand.bestwerte. */
  function bestwerte(doc, heute) {
    const t = L.Texte.welt, tage = Object.entries(objekt(doc.tage) ? doc.tage : {}).filter(([d, l]) => L.Tag.gueltig(d) && objekt(l)).sort(([a], [b]) => (a < b ? -1 : 1));
    const bester = (f, ab) => tage.reduce((b, [d, l]) => { const w = f(l); return w >= ab && (!b || w > b.wert) ? { wert: w, tag: d } : b; }, null);
    const eintrag = (id, label, b, einheit) => (b ? { id, label, wert: String(b.wert), einheit, tag: b.tag, neu: b.tag === heute } : null);
    const aus = [eintrag('aufgaben', t.bestAufgaben, bester(l => zahl(l.aufgaben), 1), t.einheitAufgaben),
      eintrag('treffer', t.bestTreffer, bester(l => { const n = zahl(l.richtig) + zahl(l.hilfe) + zahl(l.falsch); return n >= MIN_AUFGABEN ? Math.round(100 * zahl(l.richtig) / n) : 0; }, 1), '%'),
      eintrag('zeit', t.bestZeit, bester(l => Math.round(zahl(l.min)), 1), t.einheitMinuten)];
    for (const [name, b] of Object.entries(objekt(doc.bestwerte) ? doc.bestwerte : {})) {
      if (!objekt(b) || !Number.isFinite(b.wert)) continue;
      const blitz = name.startsWith('blitz:');                 // Bestzeit einer Blitzrunde (V-AP17c-01): ganze Millisekunden, angezeigt in Sekunden
      aus.push({ id: `b:${name}`, label: blitz ? t.bestBlitz(themaTitel(name.slice(6))) : t.bestName[name] || name, wert: blitz ? sekunden(b.wert) : String(b.wert),
        einheit: blitz ? t.einheitSekunden : t.bestEinheit[name] || '', tag: b.tag, neu: b.tag === heute });
    }
    return aus.filter(Boolean);
  }

  const sekunden = ms => String(Math.round(ms / 100) / 10).replace('.', ',');
  /** Titel des Themas zu «<modulId>/<themaId>», sonst der Schlüssel selbst. */
  function themaTitel(key) {
    const i = key.indexOf('/'), modul = L.registry.module.get(key.slice(0, i)), th = modul && liste(modul.themen).find(x => x.id === key.slice(i + 1));
    return th ? th.titel || th.id : key;
  }

  /** Plaketten: je Thema mit Stufe «sicher» oder höher der «Ich kann»-Satz des Lernziels mit dem Datum. [{ id, titel, satz, stufe, tag }], nach Datum. */
  function plaketten(doc) {
    const er = objekt(doc.ledger) && objekt(doc.ledger.errungen) ? doc.ledger.errungen : {};
    return Object.entries(er).filter(([, e]) => objekt(e) && e.sicher).map(([key, e]) => {
      const i = key.indexOf('/'), modul = L.registry.module.get(key.slice(0, i)), th = modul && liste(modul.themen).find(x => x.id === key.slice(i + 1));
      if (!th) return null;
      const ziel = liste(modul.lernziele).find(z => z.id === liste(th.ziele)[0]);
      return { id: key, titel: th.titel || th.id, satz: ziel ? ziel.text : th.titel || th.id, stufe: e.gefestigt ? 'gefestigt' : 'sicher', tag: e.gefestigt || e.sicher };
    }).filter(Boolean).sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  }

  /** Fundstücke des Welt-Themas: alle Stücke des Themas, die erreichten mit Datum und Quelle (Expedition), die übrigen mit dem Weg dorthin.
      [{ id, name, da, tag, quelle, bild }], bild ist die Formenliste aus dem Thema oder null (dann zeigt die Vitrine ein Platzhalter-Objekt). */
  function fundstuecke(thema, ledger) {
    const buch = liste(ledger && ledger.sammlung).filter(s => objekt(s)), exped = liste(thema && thema.expeditionen);
    return liste(thema && thema.sammlung).filter(objekt).map(s => {
      const da = buch.find(x => x.id === s.id), quelle = exped.find(e => e.id === (da && da.quelle)) || exped.find(e => e.belohnung && e.belohnung.sammlung === s.id);
      return { id: s.id, name: s.name || s.id, da: !!da, tag: da ? da.tag : null, quelle: quelle ? quelle.name : null, bild: Array.isArray(s.bild) && s.bild.length ? s.bild : null };
    });
  }

  L.LogbuchDaten = { MIN_AUFGABEN, reihe, summe, wochen, wissen, bestwerte, plaketten, fundstuecke };
})(globalThis);
