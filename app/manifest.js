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
      'app/stil/welt-ansichten.css',
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
      'app/lernsteuerung/einstufung.js',
      'app/lernsteuerung/fehler.js',
      'app/lernsteuerung/lernregeln.js',
      'app/lernsteuerung/neuverteilung.js',
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
      'app/welt/iso-formen.js',
      'app/welt/iso.js',
      'app/welt/ledger.js',
      'app/welt/render-land.js',
      'app/welt/render.js',
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
      'app/ansichten/auftraege-plan.js',
      'app/ansichten/auftraege.js',
      'app/ansichten/einstieg.js',
      'app/ansichten/eltern-anpassung.js',
      'app/ansichten/eltern-daten.js',
      'app/ansichten/eltern-diagnose.js',
      'app/ansichten/eltern-ergebnis.js',
      'app/ansichten/eltern-ferien.js',
      'app/ansichten/eltern-gespraech.js',
      'app/ansichten/eltern-lehrmittel.js',
      'app/ansichten/eltern-listen.js',
      'app/ansichten/eltern-module.js',
      'app/ansichten/eltern-pin.js',
      'app/ansichten/eltern-plan.js',
      'app/ansichten/eltern-probe.js',
      'app/ansichten/eltern-pruefung.js',
      'app/ansichten/eltern-schwaechen.js',
      'app/ansichten/eltern-stimmen.js',
      'app/ansichten/eltern.js',
      'app/ansichten/ferien.js',
      'app/ansichten/forschung-graph.js',
      'app/ansichten/forschung.js',
      'app/ansichten/huelle.js',
      'app/ansichten/lehrmittel.js',
      'app/ansichten/lernen.js',
      'app/ansichten/lernplan.js',
      'app/ansichten/logbuch-daten.js',
      'app/ansichten/logbuch-grafik.js',
      'app/ansichten/logbuch-kacheln.js',
      'app/ansichten/logbuch.js',
      'app/ansichten/pruefung-lage.js',
      'app/ansichten/siedlung-info.js',
      'app/ansichten/siedlung.js',
      'app/ansichten/start.js',
      'app/ansichten/texte.js',
      'app/ansichten/welt-bausteine.js',
      'app/ansichten/welt-bedingungen.js',
      'app/ansichten/welt-daten.js',
      'app/ansichten/welt-rahmen.js',
      'app/ansichten/welt-texte.js',
      'module/katalog.js'
    ],
    typen: [
      'app/uebungstypen/beschriften/typ.css',
      'app/uebungstypen/beschriften/typ.js',
      'app/uebungstypen/blitzrechnen/typ.css',
      'app/uebungstypen/blitzrechnen/typ.js',
      'app/uebungstypen/diktat/typ.css',
      'app/uebungstypen/diktat/typ.js',
      'app/uebungstypen/eingabe/typ.css',
      'app/uebungstypen/eingabe/typ.js',
      'app/uebungstypen/freitext/typ.css',
      'app/uebungstypen/freitext/typ.js',
      'app/uebungstypen/geld/typ.css',
      'app/uebungstypen/geld/typ.js',
      'app/uebungstypen/hoeren/typ.css',
      'app/uebungstypen/hoeren/typ.js',
      'app/uebungstypen/karteikarten/typ.css',
      'app/uebungstypen/karteikarten/typ.js',
      'app/uebungstypen/lueckentext/typ.css',
      'app/uebungstypen/lueckentext/typ.js',
      'app/uebungstypen/multiple-choice/typ.css',
      'app/uebungstypen/multiple-choice/typ.js',
      'app/uebungstypen/reihenfolge/typ.css',
      'app/uebungstypen/reihenfolge/typ.js',
      'app/uebungstypen/uhr/typ.css',
      'app/uebungstypen/uhr/typ.js',
      'app/uebungstypen/zahlenstrahl/typ.css',
      'app/uebungstypen/zahlenstrahl/typ.js',
      'app/uebungstypen/zuordnen/typ.css',
      'app/uebungstypen/zuordnen/typ.js'
    ],
    hilfsmittel: [
      'app/hilfsmittel/hunderterfeld.js',
      'app/hilfsmittel/punktefeld.js',
      'app/hilfsmittel/rechenstrich.js',
      'app/hilfsmittel/stellenwerttafel.js',
      'app/hilfsmittel/zahlenstrahl.js'
    ],
    welten: {
      'archipel': [
        'app/welten/archipel/archipel.css',
        'app/welten/archipel/welt.js'
      ],
      'test': [
        'app/welten/test/welt.js'
      ]
    },
    module: {
      'deutsch-rechtschreibung': [
        'module/_gemeinsam/rechtschreibung.js',
        'module/deutsch-rechtschreibung/nomen.js',
        'module/deutsch-rechtschreibung/silben.js',
        'module/deutsch-rechtschreibung/wortstamm.js',
        'module/deutsch-rechtschreibung/ie-regel.js',
        'module/deutsch-rechtschreibung/umlaut.js',
        'module/deutsch-rechtschreibung/doppelkonsonant.js',
        'module/deutsch-rechtschreibung/modul.js'
      ],
      'deutsch-wortarten': [
        'module/_gemeinsam/schreibantwort.js',
        'module/deutsch-wortarten/gen-wortarten.js',
        'module/deutsch-wortarten/gen-satzteile.js',
        'module/deutsch-wortarten/gen-nomen.js',
        'module/deutsch-wortarten/gen-verben.js',
        'module/deutsch-wortarten/gen-satz.js',
        'module/deutsch-wortarten/gen-abc.js',
        'module/deutsch-wortarten/modul.js'
      ],
      'englisch-grundlagen': [
        'module/englisch-grundlagen/modul.js'
      ],
      'englisch-themen': [
        'module/englisch-themen/modul.js'
      ],
      'mathe-einmaleins': [
        'module/_gemeinsam/rechnen.js',
        'module/_gemeinsam/luecken.js',
        'module/mathe-einmaleins/generator.js',
        'module/mathe-einmaleins/generator-verstehen.js',
        'module/mathe-einmaleins/generator-ableiten.js',
        'module/mathe-einmaleins/generator-teilen.js',
        'module/mathe-einmaleins/generator-zehner.js',
        'module/mathe-einmaleins/modul.js'
      ],
      'mathe-groessen': [
        'module/_gemeinsam/rechnen.js',
        'module/mathe-groessen/generator-geld.js',
        'module/mathe-groessen/generator-rechnen.js',
        'module/mathe-groessen/generator-umwandeln.js',
        'module/mathe-groessen/generator-zeit.js',
        'module/mathe-groessen/modul.js'
      ],
      'mathe-plus-minus-1000': [
        'module/_gemeinsam/rechnen.js',
        'module/_gemeinsam/familien.js',
        'module/_gemeinsam/rechenweg.js',
        'module/mathe-plus-minus-1000/fam-hundert.js',
        'module/mathe-plus-minus-1000/fam-addition.js',
        'module/mathe-plus-minus-1000/fam-subtraktion.js',
        'module/mathe-plus-minus-1000/fam-schriftlich.js',
        'module/mathe-plus-minus-1000/modul.js'
      ],
      'mathe-zahlraum-1000': [
        'module/_gemeinsam/zahlen.js',
        'module/_gemeinsam/familien.js',
        'module/mathe-zahlraum-1000/fam-stellenwert.js',
        'module/mathe-zahlraum-1000/fam-zahlwoerter.js',
        'module/mathe-zahlraum-1000/fam-lage.js',
        'module/mathe-zahlraum-1000/fam-ordnen.js',
        'module/mathe-zahlraum-1000/fam-folgen.js',
        'module/mathe-zahlraum-1000/fam-rechnen.js',
        'module/mathe-zahlraum-1000/fam-erweitert.js',
        'module/mathe-zahlraum-1000/modul.js'
      ],
      'nmg-stoffe': [
        'module/nmg-stoffe/modul.js'
      ],
      'nmg-zeit': [
        'module/nmg-zeit/modul.js'
      ]
    }
  };
})(globalThis);
