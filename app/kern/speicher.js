/* app/kern/speicher.js: localStorage hinter einer kleinen, synchronen Schnittstelle (Architektur 8.1).
   Synchron, weil iOS die App beim Wegwischen ohne Vorwarnung beendet und asynchrone Schreibvorgänge in pagehide nicht
   zuverlässig fertig werden. Ein späterer Wechsel des Speichers bleibt auf diese Datei beschränkt.
   Schlüssel im Namensraum: zustand (das Dokument), kopie und kopie-tag (Vortageskopie), rev (Zähler gegen ein zweites Fenster),
   vorher (Kopie vor Migration oder Import) und defekt (beschädigter Text, der nicht verloren gehen soll). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const NAMENSRAUM = 'lernwelt-v1';                  // Konstante, hängt nicht von der Adresse ab (Architektur 8.9)
  const OBERGRENZE = 20000000;                       // Messung bricht hier ab, damit eine Attrappe ohne Grenze nicht endlos läuft

  /** Profil aus der Adresse: «?profil=test» gibt «test». Ein ungültiger Wert gibt ebenfalls «test», nie den echten Namensraum. */
  function profilAus(suche) {
    const m = /[?&]profil=([^&#]*)/.exec(String(suche || ''));
    if (!m || m[1] === '') return null;
    let wert = '';
    try { wert = decodeURIComponent(m[1]).trim().toLowerCase(); } catch (e) { wert = ''; }
    return /^[a-z0-9]{1,16}$/.test(wert) ? wert : 'test';
  }
  const namensraumFuer = profil => (profil ? `${NAMENSRAUM}-${profil}` : NAMENSRAUM);

  /** JSON-Text als Objekt (kein Array) oder null. */
  function leseObjekt(text) {
    try { const x = JSON.parse(text); return x !== null && typeof x === 'object' && !Array.isArray(x) ? x : null; } catch (e) { return null; }
  }

  function neuerSpeicher(ls, ns = NAMENSRAUM) {
    const K = { z: `${ns}:zustand`, kopie: `${ns}:kopie`, rev: `${ns}:rev`, tag: `${ns}:kopie-tag`, vorher: `${ns}:vorher`, defekt: `${ns}:defekt`, messung: `${ns}:messung-` };
    let rev = 0, sperrgrund = null;
    const lies = k => { try { return ls.getItem(k); } catch (e) { return null; } };
    const schluessel = () => { const a = []; try { for (let i = 0; i < ls.length; i++) a.push(ls.key(i)); } catch (e) { /* ohne Aufzählung bleibt die Liste leer */ } return a; };
    const raeumeMessung = () => schluessel().filter(k => k.startsWith(K.messung)).forEach(k => ls.removeItem(k));
    const groesse = k => k.length + String(lies(k) ?? '').length;     // der Browser zählt Schlüssel und Wert in Zeichen
    /** Belegung ohne zu schreiben: je Schlüssel dieses Namensraums («zustand», «kopie», «vorher» ...), eigen (alle davon) und belegt (alle Schlüssel dieser Herkunft). */
    function belegung() {
      const alle = schluessel(), je = {};
      alle.filter(k => k.startsWith(`${ns}:`)).forEach(k => { je[k.slice(ns.length + 1)] = groesse(k); });
      return { je, eigen: Object.values(je).reduce((a, b) => a + b, 0), belegt: alle.reduce((n, k) => n + groesse(k), 0) };
    }

    return {
      art: 'localstorage', namensraum: ns, schluessel: K,
      get gesperrt() { return sperrgrund !== null; },
      get sperrgrund() { return sperrgrund; },
      /** Sperrt das Schreiben dauerhaft (zum Beispiel bei Daten aus einer neueren Version). speichere meldet dann «nur-lesen». */
      sperre(grund) { sperrgrund = sperrgrund || grund; },

      /** → { zustand, quelle: 'leer' | 'haupt' | 'kopie' | 'defekt', roh? }. roh ist der beschädigte Haupttext, falls es einen gab. */
      lade() {
        try { raeumeMessung(); } catch (e) { /* ein Rest der Platzmessung wäre nur Ballast */ }
        let roh;
        try { roh = ls.getItem(K.z); rev = Number(ls.getItem(K.rev)) || 0; } catch (e) { return { zustand: null, quelle: 'defekt', fehler: String(e && e.message) }; }
        const haupt = roh === null ? null : leseObjekt(roh);
        if (haupt) return { zustand: haupt, quelle: 'haupt' };
        const kopie = leseObjekt(lies(K.kopie));
        if (kopie) return { zustand: kopie, quelle: 'kopie', roh };
        return roh === null ? { zustand: null, quelle: 'leer' } : { zustand: null, quelle: 'defekt', roh };
      },
      ladeKopie: () => leseObjekt(lies(K.kopie)),

      /** Synchron und atomar je Schlüssel. Meldet ein zweites Fenster und Platzmangel, wirft nie.
          → { ok: true, zeichen } oder { ok: false, grund: 'nur-lesen' | 'konflikt' | 'platz' | 'fehler' }. */
      speichere(zustand, heute) {
        if (sperrgrund) return { ok: false, grund: 'nur-lesen' };
        if ((Number(lies(K.rev)) || 0) !== rev) { sperrgrund = 'konflikt'; return { ok: false, grund: 'konflikt' }; }
        let text;
        try { text = JSON.stringify(zustand); } catch (e) { return { ok: false, grund: 'fehler' }; }
        try {
          if (lies(K.tag) !== heute) {                                 // einmal je Tag die Vortageskopie ablegen
            const alt = lies(K.z);
            try {
              if (alt !== null && leseObjekt(alt)) ls.setItem(K.kopie, alt);   // eine beschädigte Fassung überschreibt nie eine gute Kopie
              ls.setItem(K.tag, heute);
            } catch (e) { /* die Kopie ist ein Zusatz: ohne Platz wird trotzdem das Dokument geschrieben, die Kopie kommt später */ }
          }
          ls.setItem(K.rev, String(rev + 1)); rev += 1;                // zuerst der Zähler: er ist klein, und bleibt er stehen, stimmt er mit rev überein
          ls.setItem(K.z, text);
          return { ok: true, zeichen: text.length };
        } catch (e) { return { ok: false, grund: 'platz', zeichen: text.length }; }
      },

      /** Kleine Zusatztexte im Namensraum («vorher», «defekt»). Wirft nie. */
      holeText: name => lies(`${ns}:${name}`),
      setzeText(name, text) { try { ls.setItem(`${ns}:${name}`, text); return true; } catch (e) { return false; } },
      entferneText(name) { try { ls.removeItem(`${ns}:${name}`); } catch (e) { /* nichts zu entfernen */ } },
      /** Legt «vorher» an: den Text des Dokuments (oder der Kopie) vor Migration oder Import. Wird nach der nächsten erfolgreichen Sitzung gelöscht. */
      legeVorherAn(quelle = 'haupt') {
        const text = lies(quelle === 'kopie' ? K.kopie : K.z);
        return text !== null && this.setzeText('vorher', text);
      },
      holeVorher: () => leseObjekt(lies(K.vorher)),
      loescheVorher() { this.entferneText('vorher'); },
      zeichen() { const t = lies(K.z); return t === null ? 0 : t.length; },
      belegung,

      /** Misst den freien Platz: schreibt Testblöcke bis zum Fehler und räumt auf (Architektur 8.1, «Speicherplatz messen»).
          → { frei, belegt (alle Schlüssel dieser Herkunft), eigen (dieser Namensraum), gesamt, grenzeGefunden } in Zeichen. */
      messePlatz() {
        const { belegt, eigen } = belegung();
        let frei = 0, i = 0;
        try {
          for (const schritt of [100000, 10000, 1000, 100]) {
            while (frei < OBERGRENZE) {
              try { ls.setItem(K.messung + i, 'x'.repeat(schritt)); } catch (e) { break; }
              i += 1; frei += schritt;
            }
          }
        } finally { for (let k = 0; k < i; k++) { try { ls.removeItem(K.messung + k); } catch (e) { /* wird beim nächsten Laden aufgeräumt */ } } }
        return { frei, belegt, eigen, gesamt: belegt + frei, grenzeGefunden: frei < OBERGRENZE };
      }
    };
  }

  /** Speicher dieses Geräts: localStorage mit dem Profil aus der Adresse. null, wenn der Browser keinen Speicher herausgibt. */
  function fuerGeraet(opt = {}) {
    const w = opt.g || g;
    let ls = null;
    try { ls = w.localStorage || null; } catch (e) { ls = null; }
    if (!ls) return null;
    const profil = profilAus(opt.suche !== undefined ? opt.suche : (w.location && w.location.search));
    return { speicher: neuerSpeicher(ls, namensraumFuer(profil)), profil, namensraum: namensraumFuer(profil) };
  }

  /** Fragt dauerhaften Speicher an (Architektur 8.4). Die App verlässt sich nie darauf, das Ergebnis zeigt der Elternbereich.
      Wirft nie. → Promise<{ unterstuetzt, persistent (null, solange unbekannt), angefragt, fehler? }>. anfragen = false liest nur den Stand. */
  async function persistenz(nav = g.navigator, anfragen = true) {
    const s = nav && nav.storage, r = { unterstuetzt: false, persistent: null, angefragt: false };
    if (!s || typeof s.persist !== 'function') return r;
    r.unterstuetzt = true;
    try {
      if (typeof s.persisted === 'function') r.persistent = !!(await s.persisted());
      if (!r.persistent && anfragen) { r.angefragt = true; r.persistent = !!(await s.persist()); }
    } catch (e) { r.fehler = String((e && e.message) || e); }
    return r;
  }

  L.Speicher = { NAMENSRAUM, neuer: neuerSpeicher, fuerGeraet, profilAus, namensraumFuer, persistenz };
})(globalThis);
