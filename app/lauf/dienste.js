/* app/lauf/dienste.js: baut den Kontext `ctx`, den ein Übungstyp für jedes Paket bekommt (Architektur 5.1), und die Dienste dahinter:
   aktive Zeit, Sprache, Medienpfade, Geschwisteraufgaben, Hilfsmittel und die Fähigkeiten des Geräts. Ein Übungstyp sieht nur ctx.
   Registry, Zustand und Welt bleiben auf dieser Seite. Katalog und Lernstand einer Runde stehen in zugriff.js (gleicher Namensraum). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const D = (L.Dienste = L.Dienste || {});
  const sichtbar = () => !g.document || g.document.visibilityState !== 'hidden';

  /** Uhr des Laufs in Millisekunden. Tests ersetzen sie. */
  D.jetzt = () => Date.now();

  /** Legt einmal ein <style> mit dieser id im Kopf der Seite an. Farben stehen darin nur als var(--…) aus tokens.css. Gibt wahr zurück, wenn es neu war. */
  D.stil = (id, css) => {
    const doc = g.document;
    if (!doc || !doc.head || (doc.getElementById && doc.getElementById(id))) return false;
    const s = doc.createElement('style');
    s.setAttribute('id', id);
    s.textContent = css;
    doc.head.append(s);
    return true;
  };

  /** Dienst «zeit»: starte() gibt stopp() zurück, stopp() die aktive Zeit in ms. Bei verdecktem Tab steht die Uhr. Mehrfaches stopp() ist harmlos. */
  D.neueZeit = () => ({
    starte() {
      let summe = 0, seit = sichtbar() ? D.jetzt() : null, ergebnis = null;
      const wechsel = () => {
        if (sichtbar()) { if (seit === null) seit = D.jetzt(); }
        else if (seit !== null) { summe += D.jetzt() - seit; seit = null; }
      };
      if (g.document && g.document.addEventListener) g.document.addEventListener('visibilitychange', wechsel);
      return function stopp() {
        if (ergebnis === null) {
          if (seit !== null) summe += D.jetzt() - seit;
          if (g.document && g.document.removeEventListener) g.document.removeEventListener('visibilitychange', wechsel);
          ergebnis = summe;
        }
        return ergebnis;
      };
    }
  });

  // ---- Fähigkeiten des Geräts ('sprache', 'audio', 'bild') ---------------------------------------------------
  const stimmeDa = r => !!(r && (r === true || r.ok || r.verfuegbar || r.stimme));
  function sprachverfuegbar(code) {
    const S = L.Sprache;
    if (!S) return false;
    return stimmeDa(typeof S.status === 'function' ? S.status(code) : typeof S.verfuegbar === 'function' ? S.verfuegbar(code) : true);
  }
  /** Die Stimme, die die Eltern für diese Sprache gewählt haben (einstellungen.stimmen[<Sprachcode>] = voiceURI), sonst null. Eine nicht mehr vorhandene
      Stimme fällt in Sprache.waehleStimme auf die automatische Wahl zurück. */
  function stimmenwunsch(code) {
    const e = (D.dokument ? D.dokument() : {}).einstellungen, s = e && e.stimmen;
    return (code && s && typeof s[code] === 'string' && s[code]) || null;
  }
  /** Prüfungen je Fähigkeit. Sie hängen an der Aufgabe, weil die Sprache vom Modul kommt. Tests und Ansichten dürfen sie ersetzen. */
  D.hat = {
    sprache(a) {
      const m = a && L.registry.module.get(a.modul), s = m && m.sprache, code = s && (s.fremd || s.mutter);
      return code ? sprachverfuegbar(code) : !!L.Sprache;
    },
    audio: () => typeof g.Audio === 'function',
    bild: () => true
  };
  /** Wahr, wenn das Gerät alle genannten Fähigkeiten für diese Aufgabe bietet. Eine unbekannte Fähigkeit gilt als nicht vorhanden. */
  D.faehig = (braucht, a) => (braucht || []).every(n => typeof D.hat[n] === 'function' && !!D.hat[n](a));

  // ---- Medien ------------------------------------------------------------------------------------------------
  const MEDIUM = /^(module\/|https?:|data:|blob:)/;

  /** Löst einen Medienpfad auf: «pfad» liegt im Ordner assets/bild oder assets/audio des Moduls der Aufgabe a. Fertige Adressen bleiben wie sie sind. */
  const medienUrl = (pfad, a) => {
    if (typeof pfad !== 'string' || pfad === '' || !a) return '';
    return MEDIUM.test(pfad) ? pfad : `module/${a.modul}/assets/${/\.(mp3|m4a)$/i.test(pfad) ? 'audio' : 'bild'}/${pfad}`;
  };

  /** Lädt die Bilder der Aufgaben im Hintergrund vor (Architektur 5.2 Schritt 2), damit sie beim Zeigen schon beim Gerät liegen. Ohne Bildobjekt
      (Tests, alte Browser) tut es nichts. Gibt die Zahl der angestossenen Bilder zurück, höchstens `grenze`. */
  D.ladeVor = function ladeVor(aufgaben, grenze = 60) {
    if (typeof g.Image !== 'function') return 0;
    const pfade = new Set();
    for (const a of aufgaben || []) {
      const url = medienUrl(a && a.inhalt && a.inhalt.bild, a);
      if (url && pfade.size < grenze) pfade.add(url);
    }
    for (const url of pfade) { try { const bild = new g.Image(); bild.decoding = 'async'; bild.src = url; } catch (fehler) { /* dieses Bild lädt erst beim Zeigen */ } }
    return pfade.size;
  };

  // ---- ctx ---------------------------------------------------------------------------------------------------

  /** Baut ctx für ein Paket. opt: { buehne, signal, modus, katalog, heute, zeit }. Ohne katalog wird einer angelegt. */
  D.baue = function baue(paket, opt = {}) {
    const a0 = paket.aufgaben[0], kat = opt.katalog || D.katalog(opt.heute), modus = opt.modus || 'ueben';
    const def = L.registry.typen.get(paket.typ), schema = (def && def.optionen) || {}, optionen = {};
    for (const [name, beschreibung] of Object.entries(schema)) if (beschreibung && beschreibung.standard !== undefined) optionen[name] = beschreibung.standard;
    try { if (a0) Object.assign(optionen, kat.thema(a0.modul, a0.thema).optionen); } catch (fehler) { /* Modul unbekannt: nur die Standardwerte des Typs */ }

    const url = (pfad, a = a0) => medienUrl(pfad, a);                  // ohne Angabe gilt die Aufgabe, die das Paket anführt
    const sprache = {
      verfuegbar: code => sprachverfuegbar(code),
      /** Aufnahme zuerst, dann Sprachausgabe, sonst 'stumm' (die Kette steckt in Lernwelt.Sprache). Ein Abbruch der Runde stoppt das Sprechen. */
      sprich: async (text, o = {}) => {
        if (!L.Sprache) return 'stumm';
        const wunsch = o.wunsch || stimmenwunsch(o.sprache);                // die Stimme, die die Eltern gewählt haben (V-AP13a-03)
        return L.Sprache.sprich(text, { ...o, ...(wunsch ? { wunsch } : {}), audio: o.audio ? url(o.audio) : null, signal: o.signal || opt.signal });
      }
    };
    const modulSprache = (() => { try { const m = a0 && L.registry.module.get(a0.modul); return m && m.sprache ? m.sprache : null; } catch (fehler) { return null; } })();
    const sprachen = {};                                               // ctx.sprachen: die Sprachcodes des Moduls der ersten Aufgabe, leer ohne Angabe (V-AP17a-02)
    for (const k of ['fremd', 'mutter']) if (modulSprache && typeof modulSprache[k] === 'string' && modulSprache[k]) sprachen[k] = modulSprache[k];
    return {
      buehne: opt.buehne, aufgaben: paket.aufgaben, optionen, modus, signal: opt.signal, sprachen,
      dienste: { zeit: opt.zeit || D.neueZeit(), sprache, bild: { url } },
      pool: { thema: id => (a0 ? kat.aufgabenVon(a0.modul, id) : []) },
      hilfe: {
        verfuegbar: modus !== 'simulation',
        /** Zeichnet das Hilfsmittel { name, daten } in ziel und gibt das Element zurück. Es wirft, wenn das Hilfsmittel nicht erscheinen kann
            (unbekannt, ungültige Daten): Der Typ zählt die Hilfe erst nach einem Aufruf ohne Fehler. In der Probeprüfung zeigt es nichts (null). */
        zeige(h, ziel) {
          if (modus === 'simulation') return null;
          const hm = h && L.registry.hilfsmittel.get(h.name);
          if (!hm) throw new Error(`Hilfsmittel «${h && h.name}» ist nicht registriert`);
          if (!ziel) throw new Error('Hilfsmittel: ziel fehlt');
          return hm.render(ziel, h.daten || {}) || null;
        }
      }
    };
  };
})(globalThis);
