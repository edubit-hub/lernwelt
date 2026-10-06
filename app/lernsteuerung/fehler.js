/* app/lernsteuerung/fehler.js: Fehleranalyse (Architektur 6.5). Der Lauf fragt `generator.diagnose` und bekommt einen Fehlercode. Hier
   steht, was danach mit dem Code geschieht: zählen, die Folge aus `modul.fehlerCodes` bestimmen, Voraussetzungen vorziehen.
   Alle Funktionen sind rein: sie geben neue Daten zurück und ändern die übergebenen nie. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const hat = (objekt, schluessel) => !!objekt && typeof objekt === 'object' && Object.hasOwn(objekt, schluessel);

  /** Zählt einen Fehlercode im Modulzustand: `fehler[code] = { n, zuletzt }`. Gibt den neuen Modulzustand zurück. */
  function zaehle(modulZustand, code, heute) {
    const m = modulZustand || {}, alt = hat(m.fehler, code) ? m.fehler[code] : null;
    return { ...m, fehler: { ...m.fehler, [code]: { n: ((alt && alt.n) || 0) + 1, zuletzt: heute } } };
  }

  /**
   * Folge eines Fehlercodes für eine Aufgabe. `modul` ist die Moduldatei (mit `fehlerCodes`), `aufgabe` die falsch gelöste Aufgabe.
   * Gibt immer ein Objekt zurück: `bekannt` ist falsch bei `sonstige` und bei Codes ohne Eintrag (dann ohne Texte und ohne Folge).
   * Bei `folge: 'braucht'` nennt `braucht` die IDs der Voraussetzungen der Aufgabe (wie `aufgabe.braucht`) und `keys` dieselben
   * als Schlüssel `<modul>/<id>`. Diese Aufgaben sollen heute noch einmal geprüft werden, bevor das Abgeleitete geübt wird.
   */
  function folge(modul, code, aufgabe) {
    const eintrag = modul && hat(modul.fehlerCodes, code) ? modul.fehlerCodes[code] : null;
    const art = (eintrag && eintrag.folge) || null;
    const braucht = art === 'braucht' && aufgabe && Array.isArray(aufgabe.braucht) ? aufgabe.braucht.slice() : [];
    return { code, bekannt: !!eintrag, kind: eintrag ? eintrag.kind : null, eltern: eintrag ? eintrag.eltern : null,
             folge: art, braucht, keys: braucht.map(id => `${modul.id}/${id}`) };
  }

  /** Setzt die genannten Aufgaben (IDs) auf «heute fällig», wenn sie schon gesehen wurden und später fällig wären. Neue bleiben neu. */
  function vorziehen(modulZustand, aufgabenIds, heute) {
    const m = modulZustand || {}, aufgaben = { ...m.aufgaben };
    for (const id of aufgabenIds || []) {
      const z = aufgaben[id];
      if (z && z.versuche > 0 && z.faellig > heute) aufgaben[id] = { ...z, faellig: heute };
    }
    return { ...m, aufgaben };
  }

  /** IDs der Aufgaben, die zuletzt mindestens zweimal hintereinander falsch waren (Verlauf endet auf «00»). Für den Elternbereich. */
  function mehrfach(aufgabenZustaende) {
    return Object.entries(aufgabenZustaende || {}).filter(([, z]) => z && /00$/.test(z.verlauf || '')).map(([id]) => id);
  }

  L.Fehler = { zaehle, folge, vorziehen, mehrfach };
})(globalThis);
