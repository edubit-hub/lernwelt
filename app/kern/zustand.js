/* app/kern/zustand.js: das Zustandsdokument im Arbeitsspeicher (Architektur 8.1). Ein einziges Dokument, ein einziger Schlüssel,
   deshalb ist jedes Speichern atomar. Änderungen laufen über aendere(fn) und werden nach 400 ms gebündelt geschrieben, sofort bei
   visibilitychange (hidden) und pagehide. Schlägt das Schreiben fehl, bleibt der Stand im Arbeitsspeicher und status() sagt warum.
   Lernwelt.Zustand ist die Instanz der App, Lernwelt.neuerZustand() liefert unabhängige Instanzen für Tests. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** Stellschrauben des Speichers (Architektur 8.1): Bündelung, Verdichten, Warnschwelle für den Elternbereich.
      annahmeGrenze ist der Wert, den die Planung für localStorage in Safari annimmt (Zeichen), Bezugsgrösse für «Anteil». */
  const GRENZEN = Object.freeze({ verzoegerungMs: 400, verdichtenAb: 500000, warnungAb: 600000, verdichtenTage: 90, verdichtenBox: 5, annahmeGrenze: 2500000 });
  const TEXTE = Object.freeze({                              // Meldungen je Grund, mit denen die Ansicht den Speicherstatus zeigt
    platz: 'Speichern nicht möglich, bitte Sicherung erstellen',
    konflikt: 'Die App ist in einem anderen Fenster geöffnet',
    'neuere-version': 'Die Daten stammen aus einer neueren Version der App. Bitte die App aktualisieren. Es wird nichts gespeichert.',
    lesefehler: 'Der Speicher des Browsers lässt sich nicht lesen. Es wird nichts gespeichert, damit ein vorhandener Lernstand nicht überschrieben wird.',
    'nur-lesen': 'Der Lernstand wird nur gelesen, es wird nichts gespeichert.',
    fehler: 'Der Lernstand konnte nicht gespeichert werden.'
  });
  const HINWEISE = Object.freeze({                           // einmalige Hinweise nach dem Start
    kopie: 'Der Lernstand wurde aus der Kopie vom Vortag wiederhergestellt.',
    defekt: 'Der gespeicherte Lernstand war beschädigt. Es wurde neu begonnen. Die beschädigte Fassung bleibt im Gerät erhalten.'
  });
  const istObjekt = x => x !== null && typeof x === 'object' && !Array.isArray(x);

  function neuerZustand() {
    let sp = null, doc = null, profil = null, log = null, jetzt = () => new Date(), timer = null, planId = null;
    let dirty = false, grund = null, hinweis = null, letzteZeichen = 0, formatOpt = {};
    let abmelden = [];
    const hoererAenderung = [], hoererStatus = [];

    const tag = () => L.Tag.heute(jetzt());
    function hole() { if (doc === null) throw new Error('Der Zustand ist noch nicht gestartet'); return doc; }
    const zeichen = () => JSON.stringify(hole()).length;
    const spieltag = () => L.Tag.spieltag(tag(), hole().meta && hole().meta.letzterTag);
    const rufe = (liste, wert) => liste.slice().forEach(f => { try { f(wert); } catch (e) { log.melde(e, { art: 'fehler' }); } });
    const melde = (liste, fn) => { liste.push(fn); return () => { const i = liste.indexOf(fn); if (i >= 0) liste.splice(i, 1); }; };

    function status() {
      return {
        ok: grund === null, grund, text: grund ? (TEXTE[grund] || TEXTE.fehler) : null, nurLesen: !!sp && sp.gesperrt,
        ungespeichert: dirty, hinweis, hinweisText: hinweis ? HINWEISE[hinweis] : null, zeichen: letzteZeichen, profil
      };
    }
    function setzeStatus(r) {
      const neu = r.ok ? null : (sp.gesperrt ? sp.sperrgrund : r.grund);
      if (neu === grund) return;
      grund = neu;
      if (neu) log.melde(`Speichern: ${TEXTE[neu] || neu}`, { art: 'speicher' });
      rufe(hoererStatus, status());
    }

    /** Entfernt Verlauf, Zeit und Fehlercode von Aufgaben, die lange sicher sind (ab Box 5, über 90 Tage nicht geübt). box und faellig bleiben. */
    function verdichteDok(opt = {}) {
      const grenze = L.Tag.plus(spieltag(), -(opt.tage ?? GRENZEN.verdichtenTage)), boxAb = opt.box ?? GRENZEN.verdichtenBox;
      const treffer = [];
      Object.values(hole().module).forEach(m => Object.values((m && m.aufgaben) || {}).forEach(z => {
        if (z && z.box >= boxAb && z.zuletzt && z.zuletzt < grenze && ('verlauf' in z || 'ms' in z || 'fehler' in z)) treffer.push(z);
      }));
      if (!treffer.length) return { aufgaben: 0, gespart: 0 };
      const vorher = zeichen();
      treffer.forEach(z => { delete z.verlauf; delete z.ms; delete z.fehler; });
      dirty = true;
      return { aufgaben: treffer.length, gespart: vorher - zeichen() };
    }

    /** Schreibt das Dokument. nurWennNoetig: nichts tun, wenn es keine ungespeicherten Änderungen gibt (pagehide, visibilitychange). */
    function schreibe(nurWennNoetig) {
      if (timer !== null && planId !== null) { timer.clear(planId); planId = null; }
      if (doc === null) return { ok: false, grund: 'nicht-gestartet' };
      if (nurWennNoetig && !dirty) return { ok: true, nichts: true };
      if (sp.gesperrt) { const r = { ok: false, grund: 'nur-lesen' }; setzeStatus(r); return r; }
      if (doc.meta) doc.meta.zuletztGespeichert = jetzt().toISOString();
      let r = sp.speichere(doc, tag());
      if (!r.ok && r.grund === 'platz') {                       // Platzmangel: erst verdichten und den aufgehobenen defekten Text freigeben, dann ein zweiter Versuch
        const verdichtet = verdichteDok().aufgaben > 0, hatDefekt = sp.holeText('defekt') !== null;
        if (hatDefekt) sp.entferneText('defekt');
        if (verdichtet || hatDefekt) r = sp.speichere(doc, tag());
      }
      setzeStatus(r);
      if (r.ok) {
        dirty = false; letzteZeichen = r.zeichen;
        if (r.zeichen >= GRENZEN.verdichtenAb && verdichteDok().aufgaben > 0) speichereSpaeter();   // auch in einer langen Sitzung, nicht nur beim Start
      }
      return r;
    }

    function speichereSpaeter() {
      dirty = true;
      if (planId === null && timer !== null) planId = timer.set(() => { planId = null; schreibe(true); }, GRENZEN.verzoegerungMs);
    }

    /** Ändert das Dokument in fn(zustand), merkt den letzten gespielten Tag, meldet die Änderung und plant das Speichern. Gibt den Rückgabewert von fn zurück. */
    function aendere(fn) {
      const z = hole();
      let ergebnis;
      try { ergebnis = fn(z); } finally {
        if (istObjekt(z.meta) && !sp.gesperrt) { const heute = tag(); if (!z.meta.letzterTag || heute > z.meta.letzterTag) z.meta.letzterTag = heute; }
        speichereSpaeter();
      }
      rufe(hoererAenderung, z);
      return ergebnis;
    }

    /** Der Zustand eines Moduls. Fehlt er, wird er angelegt (Architektur 6.1). */
    function modul(id) {
      const m = hole().module, e = (m[id] = istObjekt(m[id]) ? m[id] : L.Migration.neuesModul()), vorlage = L.Migration.neuesModul();
      Object.keys(vorlage).forEach(k => { if (e[k] === undefined) e[k] = vorlage[k]; });
      return e;
    }

    /** Lädt Haupttext oder Kopie, migriert und prüft. → { z, quelle, vorSchema } oder { neuere } oder { z: null, quelle }
        oder { lesefehler } (der Speicher liess sich nicht lesen: ein vorhandener Lernstand darf nie überschrieben werden). */
    function ladeDokument() {
      const r = sp.lade();
      if (r.fehler) return { lesefehler: r.fehler, quelle: 'defekt' };
      const versuche = [[r.zustand, r.quelle === 'kopie' ? 'kopie' : 'haupt']];
      if (r.quelle === 'haupt') versuche.push([sp.ladeKopie(), 'kopie']);
      for (const [roh, quelle] of versuche) {
        if (!roh) continue;
        try { return { z: L.Migration.aufStand(roh, formatOpt), quelle, vorSchema: roh.schema }; } catch (e) {
          if (e.code === 'neuere-version') return { neuere: roh };
          log.melde(`Lernstand aus «${quelle}» nicht verwendbar: ${e.message}`, { art: 'speicher' });
        }
      }
      return { z: null, quelle: r.quelle === 'leer' ? 'leer' : 'defekt' };
    }

    /** Startet den Zustand: lädt, migriert, legt bei Bedarf ein neues Dokument an und hängt pagehide, visibilitychange und lern:sitzung ein.
        opt (alles für Tests austauschbar): speicher, profil, g, suche, jetzt, timer, fenster, dokument, bus, fehlerlog, zufall, ziel, tabelle.
        → { quelle: 'leer' | 'haupt' | 'kopie' | 'defekt', neu, migriert, nurLesen, fehler: null | 'neuere-version' | 'lesefehler', profil }.
        Bei fehler ist der Speicher gesperrt: es wird nie etwas geschrieben, die Ansicht zeigt nur status().text. */
    function starte(opt = {}) {
      stoppe();
      const geraet = opt.speicher ? { speicher: opt.speicher, profil: opt.profil || null } : L.Speicher.fuerGeraet({ g: opt.g, suche: opt.suche });
      if (!geraet) throw new Error('Kein Speicher verfügbar (localStorage)');
      sp = geraet.speicher; profil = geraet.profil;
      log = opt.fehlerlog || L.Fehlerlog; jetzt = opt.jetzt || (() => new Date());
      timer = opt.timer || { set: (f, ms) => g.setTimeout(f, ms), clear: id => g.clearTimeout(id) };
      formatOpt = { ziel: opt.ziel, tabelle: opt.tabelle };
      grund = null; hinweis = null; dirty = false;

      const res = ladeDokument();
      let migriert = false, neu = false, fehler = null;
      const sperrfall = res.neuere ? 'neuere-version' : res.lesefehler ? 'lesefehler' : null;
      if (sperrfall) {                                           // nur lesend: das fremde Dokument bleibt unangetastet, bei einem Lesefehler gibt es nur ein leeres
        doc = res.neuere || L.Migration.neu(jetzt(), opt.zufall); neu = !res.neuere;
        sp.sperre(sperrfall); grund = fehler = sperrfall;
        log.melde(res.lesefehler ? `${TEXTE[sperrfall]} (${res.lesefehler})` : TEXTE[sperrfall], { art: 'speicher' });
      } else {
        const roh = sp.holeText('zustand');
        if (res.z) {
          doc = res.z; hinweis = res.quelle === 'kopie' ? 'kopie' : null;
          migriert = res.vorSchema < (formatOpt.ziel ?? L.Migration.AKTUELL);
          if (migriert) sp.legeVorherAn(res.quelle);                                    // Vor jeder Migration entsteht «vorher»
        } else {
          doc = L.Migration.neu(jetzt(), opt.zufall); neu = true; hinweis = res.quelle === 'defekt' ? 'defekt' : null;
        }
        if ((hinweis === 'kopie' || hinweis === 'defekt') && roh !== null) sp.setzeText('defekt', roh);   // der beschädigte Text geht nicht verloren
        letzteZeichen = zeichen();
        if (letzteZeichen >= GRENZEN.verdichtenAb) verdichteDok();
        if (neu || migriert || hinweis === 'kopie') dirty = true;
        if (dirty) schreibe(false);
      }

      const dok = opt.dokument || g.document, fenster = opt.fenster || g, bus = opt.bus || L.bus;
      const beiSichtbarkeit = () => { if (dok.visibilityState === 'hidden') schreibe(true); };
      const beiPagehide = () => schreibe(true);
      if (dok && dok.addEventListener) { dok.addEventListener('visibilitychange', beiSichtbarkeit); abmelden.push(() => dok.removeEventListener('visibilitychange', beiSichtbarkeit)); }
      if (fenster && fenster.addEventListener) { fenster.addEventListener('pagehide', beiPagehide); abmelden.push(() => fenster.removeEventListener('pagehide', beiPagehide)); }
      abmelden.push(bus.on('lern:sitzung', () => { if (sp.holeText('vorher') !== null && schreibe(true).ok) sp.loescheVorher(); }));   // «vorher» gilt bis zur nächsten erfolgreichen Sitzung
      return { quelle: res.quelle || 'haupt', neu, migriert, nurLesen: sp.gesperrt, fehler, profil };
    }

    /** Ersetzt das Dokument durch eine geprüfte Sicherung (Import). Legt «vorher» an, schreibt sofort und ersetzt auch den Stand im Arbeitsspeicher,
        damit pagehide den alten Stand nicht zurückschreibt. Danach lädt die Ansicht neu. */
    function ersetze(daten) {
      let z;
      try { z = L.Migration.aufStand(daten, formatOpt); } catch (e) { return { ok: false, grund: e.code || 'ungueltig', fehler: e.message }; }
      if (sp.gesperrt) return { ok: false, grund: sp.sperrgrund, fehler: TEXTE[sp.sperrgrund] || TEXTE['nur-lesen'] };
      const vorher = sp.legeVorherAn();
      const r = sp.speichere(z, tag());
      setzeStatus(r);
      if (!r.ok) return { ok: false, grund: r.grund, fehler: TEXTE[r.grund] || TEXTE.fehler };
      doc = z; dirty = false; letzteZeichen = r.zeichen; hinweis = null;
      rufe(hoererAenderung, doc);
      return { ok: true, zeichen: r.zeichen, vorher };
    }

    /** Hängt alles ab und vergisst das Dokument, ohne zu schreiben. */
    function stoppe() {
      if (timer !== null && planId !== null) timer.clear(planId);
      planId = null; abmelden.forEach(f => f()); abmelden = [];
      doc = null; dirty = false; grund = null; hinweis = null;
    }

    return {
      GRENZEN, TEXTE, HINWEISE, starte, stoppe, hole, modul, aendere, ersetze, status, spieltag, zeichen,
      speichereSpaeter, speichereJetzt: () => schreibe(false),
      verdichte: opt => { const r = verdichteDok(opt); if (r.aufgaben) speichereSpaeter(); return r; },
      beiAenderung: fn => melde(hoererAenderung, fn), beiStatus: fn => melde(hoererStatus, fn),
      speicher: () => sp, profil: () => profil
    };
  }

  L.neuerZustand = neuerZustand;
  L.Zustand = neuerZustand();
})(globalThis);
