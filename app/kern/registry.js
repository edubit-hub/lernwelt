/* app/kern/registry.js: der einzige globale Name «Lernwelt» und die Registry aller Erweiterungen.
   Klassisches Skript (läuft per file:// und https). Jede Erweiterung meldet sich mit einem Aufruf an,
   eine doppelte Anmeldung wird abgelehnt. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const API = 1;                                     // Vertragsversion zwischen Kern und Erweiterungen

  const KURZ = /^[a-z0-9][a-z0-9-]{0,39}$/;          // Typen, Hilfsmittel, Formen
  const MODUL = /^[a-z0-9][a-z0-9._-]{0,63}$/;       // Module und Welt-Themen
  const TEIL = '[a-z0-9][a-z0-9._-]{0,63}';
  const ART = {                                      // Registry-Art: Muster der ID und Name für Fehlermeldungen
    typen:       { muster: KURZ, name: 'Übungstyp' },
    module:      { muster: MODUL, name: 'Modul' },
    generatoren: { muster: new RegExp(`^(_gemeinsam|${TEIL})/${TEIL}$`), name: 'Generator' },
    bausteine:   { muster: new RegExp(`^_gemeinsam/${TEIL}$`), name: 'Baustein' },
    hilfsmittel: { muster: KURZ, name: 'Hilfsmittel' },
    formen:      { muster: KURZ, name: 'Aufgabenform' },
    welten:      { muster: MODUL, name: 'Welt-Thema' }
  };
  const reg = {};
  Object.keys(ART).forEach(k => { reg[k] = new Map(); });

  function melde(art, id, def) {
    const { muster, name } = ART[art];
    if (typeof id !== 'string' || !muster.test(id)) throw new Error(`${name}: ungültige ID «${id}»`);
    if (def === null || typeof def !== 'object') throw new Error(`${name} «${id}»: Definition fehlt`);
    if (reg[art].has(id)) throw new Error(`${name} «${id}» ist doppelt registriert`);
    reg[art].set(id, def);
    return def;
  }

  /** Friert ein Objekt samt allem darunter ein (Arrays eingeschlossen). Für die Regeldateien. */
  function einfrieren(wert) {
    if (wert !== null && typeof wert === 'object' && !Object.isFrozen(wert)) {
      Object.freeze(wert);
      Object.values(wert).forEach(einfrieren);
    }
    return wert;
  }

  L.API = API;
  L.registry = reg;
  L.einfrieren = einfrieren;
  L.uebungstyp  = (id, def) => melde('typen', id, { api: API, id, ...def });
  L.modul       = def => melde('module', def && def.id, def);
  L.generator   = (id, def) => melde('generatoren', id, def);
  L.baustein    = (id, def) => melde('bausteine', id, def);
  L.hilfsmittel = (id, def) => melde('hilfsmittel', id, def);
  L.form        = (id, def) => melde('formen', id, def);
  L.welt        = def => melde('welten', def && def.id, def);
})(globalThis);
