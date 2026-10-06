/* app/kern/migration.js: Zustandsformat versionieren (Architektur 8.2). Jede Änderung am Format ist genau ein Eintrag in MIGRATIONEN,
   eine neue eingefrorene Fixture in tests/fixtures und ein Test. Die Schritte laufen einzeln und auf einer Kopie, die Eingabe bleibt unberührt.
   Die Reihenfolge bei der Anwendung ist migriere (Version), ergaenze (fehlende Felder), pruefe (Behälter): aufStand fasst sie zusammen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const AKTUELL = 1;                                         // Schema 1 bei der ersten Auslieferung
  const MIGRATIONEN = {};                                    // Schlüssel = Version, aus der migriert wird. Die Funktion liefert das Format der nächsten Version

  const istObjekt = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const hat = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const fehler = (text, code) => Object.assign(new Error(text), { code });

  /** Das leere Dokument. Jeder Aufruf liefert frische Objekte. Dient als Vorlage für neu() und ergaenze(). */
  function leer() {
    return {
      schema: AKTUELL,
      geraet: { id: null, erstellt: null },
      profil: { vorname: '', klasse: 3 },                    // der Vorname ist die einzige Personenangabe und bleibt im Gerät
      einstellungen: { stimmen: {}, welt: 'archipel', elternPin: null },
      module: {}, tage: {}, bestwerte: {},
      ledger: {                                              // Verdienstbuch nach Architektur 7.3, wächst nur
        ertrag: {}, wissen: {}, vergeben: {}, errungen: {}, pflegeRest: 0,
        heute: { tag: null, pflege: 0, korrektur: 0 }, expeditionen: {}, sammlung: []
      },
      welt: {},
      meta: { zuletztExport: null, zuletztGespeichert: null, letzterTag: null, abrufe: '' }   // abrufe: Fenster der letzten fälligen Abrufe als «0» und «1» (V-AP02-03)
    };
  }

  /** Leerer Modulzustand (Architektur 6.1). */
  const neuesModul = () => ({
    aktiv: false, version: null, anpassung: {},
    pruefung: { datum: null, themen: ['*'], ergebnis: null, simulationen: [] },
    aufgaben: {}, fehler: {}
  });

  /** Neues Dokument für ein Gerät ohne Lernstand. zufall ist austauschbar für Tests. */
  function neu(jetzt = new Date(), zufall = Math.random) {
    const z = leer();
    z.geraet = { id: 'g-' + L.Zufall.hash(jetzt.toISOString() + zufall()).toString(36), erstellt: L.Tag.heute(jetzt) };
    return z;
  }

  /** Bringt ein Dokument Schritt für Schritt auf Version ziel. Wirft bei ungültigen Daten und lehnt neuere Daten ab, statt sie zu beschädigen. */
  function migriere(zustand, ziel = AKTUELL, tabelle = MIGRATIONEN) {
    if (!istObjekt(zustand)) throw fehler('Kein Lernstand (Objekt erwartet)', 'ungueltig');
    if (!Number.isInteger(zustand.schema) || zustand.schema < 1) throw fehler('Lernstand ohne gültige Versionsnummer (schema)', 'ungueltig');
    let s = structuredClone(zustand);
    if (s.schema > ziel) throw fehler(`Daten aus neuerer Version (${s.schema}). Bitte die App aktualisieren.`, 'neuere-version');
    while (s.schema < ziel) {
      const von = s.schema, f = tabelle[von];
      if (!f) throw fehler(`Keine Migration von Version ${von}`, 'keine-migration');
      s = f(s);
      if (!istObjekt(s) || !(s.schema > von)) throw fehler(`Die Migration von Version ${von} hat die Version nicht erhöht`, 'keine-migration');
    }
    return s;
  }

  function fuelle(ziel, vorlage) {
    for (const k of Object.keys(vorlage)) {
      if (ziel[k] === undefined) ziel[k] = vorlage[k];
      else if (istObjekt(vorlage[k]) && istObjekt(ziel[k])) fuelle(ziel[k], vorlage[k]);
    }
  }

  /** Ergänzt fehlende Felder aus der Vorlage (auch in den Modulzuständen). Ändert das Dokument und gibt es zurück. */
  function ergaenze(zustand) {
    fuelle(zustand, leer());
    if (istObjekt(zustand.module)) Object.values(zustand.module).forEach(m => { if (istObjekt(m)) fuelle(m, neuesModul()); });
    return zustand;
  }

  const BEHAELTER = ['geraet', 'profil', 'einstellungen', 'module', 'tage', 'bestwerte', 'ledger', 'welt', 'meta',
    'ledger.ertrag', 'ledger.wissen', 'ledger.vergeben', 'ledger.errungen', 'ledger.heute', 'ledger.expeditionen'];

  /** Prüft, ob die Behälter die richtige Art haben. Gibt die Probleme als Texte zurück, eine leere Liste heisst in Ordnung. */
  function pruefe(zustand) {
    const probleme = [];
    const wert = pfad => pfad.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), zustand);
    BEHAELTER.forEach(p => { if (!istObjekt(wert(p))) probleme.push(`«${p}» ist kein Objekt`); });
    if (!Array.isArray(wert('ledger.sammlung'))) probleme.push('«ledger.sammlung» ist keine Liste');
    if (istObjekt(zustand.module)) {
      for (const [id, m] of Object.entries(zustand.module)) {
        if (!istObjekt(m)) { probleme.push(`Modul «${id}» ist kein Objekt`); continue; }
        ['aufgaben', 'fehler', 'anpassung'].forEach(k => { if (!istObjekt(m[k])) probleme.push(`Modul «${id}»: «${k}» ist kein Objekt`); });
      }
    }
    return probleme;
  }

  /** Migrieren, ergänzen, prüfen. Gibt das Dokument im aktuellen Format zurück oder wirft einen Fehler mit code
      (ungueltig, neuere-version, keine-migration, beschaedigt). opt: { ziel, tabelle } für Tests. */
  function aufStand(zustand, opt = {}) {
    const s = ergaenze(migriere(zustand, opt.ziel, opt.tabelle));
    const probleme = pruefe(s);
    if (probleme.length) throw fehler(`Der Lernstand ist beschädigt: ${probleme.slice(0, 3).join(', ')}`, 'beschaedigt');
    return s;
  }

  /** -1, 0 oder 1. Verglichen werden bis zu drei Zahlen («1.2.0»), ein ungültiger Text zählt wie «0.0.0». */
  function vergleicheVersion(a, b) {
    const teile = v => { const m = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(String(v)); return m ? [m[1], m[2] || 0, m[3] || 0].map(Number) : [0, 0, 0]; };
    const x = teile(a), y = teile(b);
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
  }

  /** Zieht umbenannte Aufgaben-IDs (modul.migration = [{ ab, umbenenne: { alt: neu } }]) im Modulzustand und im Verdienstbuch nach
      und setzt die Modulversion hoch. Ändert das Dokument und gibt es zurück. Ein zweiter Aufruf ändert nichts mehr. */
  function modulMigration(zustand, modul) {
    const m = istObjekt(zustand && zustand.module) ? zustand.module[modul.id] : null;
    if (!istObjekt(m)) return zustand;
    const stand = m.version || '0.0.0';
    const vergeben = istObjekt(zustand.ledger && zustand.ledger.vergeben) ? zustand.ledger.vergeben[modul.id] : null;
    const benenne = (tabelle, alt, neuId) => {
      if (istObjekt(tabelle) && hat(tabelle, alt) && !hat(tabelle, neuId)) { tabelle[neuId] = tabelle[alt]; delete tabelle[alt]; }
    };
    (modul.migration || []).filter(s => vergleicheVersion(s.ab, stand) > 0).sort((a, b) => vergleicheVersion(a.ab, b.ab)).forEach(schritt => {
      Object.entries(schritt.umbenenne || {}).forEach(([alt, neuId]) => { benenne(m.aufgaben, alt, neuId); benenne(vergeben, alt, neuId); });
    });
    if (vergleicheVersion(modul.version, stand) > 0) m.version = modul.version;      // die Version steigt nur, sie sinkt nie
    return zustand;
  }

  L.Migration = { AKTUELL, MIGRATIONEN, neu, neuesModul, migriere, ergaenze, pruefe, aufStand, vergleicheVersion, modulMigration };
})(globalThis);
