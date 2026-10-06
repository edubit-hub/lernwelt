/* app/manifest.js: Ladelisten. ERZEUGT von `lw manifest` (tools/lw/manifest.mjs), nicht von Hand ändern.
   Aufbau (Festlegung F-02 in docs/vertragsaenderungen.md):
     kern         Stylesheets und Skripte aus app/stil, kern, ui, lernsteuerung, pruefung, welt, lauf, ansichten und module/katalog.js
     typen        app/uebungstypen/<id>/typ.css und typ.js
     hilfsmittel  app/hilfsmittel/<id>.js
     welten       Tabelle { <welt-id>: [Dateien] }, geladen wird nur das gewählte Thema
     module       Tabelle { <modul-id>: [Bausteine, Code des Moduls, modul.js] }, geladen werden nur die aktiven Module
   registry.js, lader.js und start.js stehen fest in index.html und fehlen deshalb hier. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  L.manifest = {
    version: 1,
    kern: [
      'app/stil/basis.css',
      'app/stil/bauteile.css',
      'app/stil/dialog.css',
      'app/stil/icons.css',
      'app/stil/start-lernen.css',
      'app/stil/tastenfeld.css',
      'app/stil/tokens.css',
      'app/kern/ereignisse.js',
      'app/kern/fehlerlog.js',
      'app/kern/formen.js',
      'app/kern/migration.js',
      'app/kern/modell.js',
      'app/kern/sicherung.js',
      'app/kern/speicher.js',
      'app/kern/sprache.js',
      'app/kern/startcheck.js',
      'app/kern/zeit.js',
      'app/kern/zufall.js',
      'app/kern/zustand.js',
      'app/ui/dialog.js',
      'app/ui/h.js',
      'app/ui/tastatur.js',
      'app/ui/tastenfeld.js',
      'app/lernsteuerung/fehler.js',
      'app/lernsteuerung/lernregeln.js',
      'app/lernsteuerung/pruefungsplan.js',
      'app/lernsteuerung/sitzung.js',
      'app/lernsteuerung/stand.js',
      'app/lernsteuerung/statistik.js',
      'app/lernsteuerung/wiederholung.js',
      'app/pruefung/inhalt-aufgaben.js',
      'app/pruefung/inhalt-leiter.js',
      'app/pruefung/inhalt-welt.js',
      'app/pruefung/inhalt.js',
      'app/pruefung/ton.js',
      'app/welt/engine.js',
      'app/welt/expedition.js',
      'app/welt/ledger.js',
      'app/welt/verbindung.js',
      'app/welt/weltregeln.js',
      'app/lauf/ablauf.js',
      'app/lauf/bericht.js',
      'app/lauf/dienste.js',
      'app/lauf/lauf.js',
      'app/lauf/rueckmeldung.js',
      'app/lauf/schleife.js',
      'app/lauf/verbuchen.js',
      'app/lauf/zugriff.js',
      'app/ansichten/abschluss.js',
      'app/ansichten/eltern-daten.js',
      'app/ansichten/eltern-diagnose.js',
      'app/ansichten/eltern-pin.js',
      'app/ansichten/eltern-stimmen.js',
      'app/ansichten/eltern.js',
      'app/ansichten/huelle.js',
      'app/ansichten/lernen.js',
      'app/ansichten/lernplan.js',
      'app/ansichten/start.js',
      'app/ansichten/texte.js',
      'module/katalog.js'
    ],
    typen: [
      'app/uebungstypen/eingabe/typ.css',
      'app/uebungstypen/eingabe/typ.js',
      'app/uebungstypen/multiple-choice/typ.css',
      'app/uebungstypen/multiple-choice/typ.js'
    ],
    hilfsmittel: [
      'app/hilfsmittel/punktefeld.js'
    ],
    welten: {
      'test': [
        'app/welten/test/welt.js'
      ]
    },
    module: {
      'mathe-einmaleins': [
        'module/_gemeinsam/rechnen.js',
        'module/mathe-einmaleins/generator.js',
        'module/mathe-einmaleins/modul.js'
      ]
    }
  };
})(globalThis);
