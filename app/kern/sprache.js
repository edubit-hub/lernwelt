/* app/kern/sprache.js: Sprachausgabe (Architektur 5.7). Kette je Äusserung: Aufnahmedatei, dann Web Speech mit der besten Stimme, dann stumm.
   sprich() liefert 'audio', 'tts', 'stumm', 'abgebrochen' oder 'gesperrt'. Nur 'stumm' heisst für den Lauf: Ersatztyp der Leiter.
   'gesperrt' (iOS spielt Ton nur aus einer Berührung) und 'abgebrochen' führen nie zum Ersatztyp, der Abspielknopf bleibt.
   Die Entscheidungslogik ist mit Attrappen geprüft. Das Sprechen selbst und die Freischaltung prüft die Abnahmeliste auf dem iPad (8.6, Punkt 5). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const norm = s => String(s || '').replace(/_/g, '-').toLowerCase();                  // Android «en_GB», iOS «en-GB»
  const KETTEN = { 'de-ch': ['de-ch', 'de-de', 'de-at', 'de'], 'en-gb': ['en-gb', 'en-ie', 'en-au', 'en'] };
  // WAV mit 100 Stillewerten (16 Bit, mono, 8 kHz): schaltet das eine Audio-Element frei, iOS gibt Ton je Element frei.
  const STILLER_TON = 'data:audio/wav;base64,UklGRuwAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

  /** → { stimme, stufe } oder null. stufe > 0: Ausweichstimme (Index in der Kette). Eine Wunschstimme gilt nur innerhalb der Sprachfamilie. */
  function waehleStimme(stimmen, sprache, wunschURI = null) {
    const ziel = norm(sprache);
    const liste = Array.from(stimmen || []).filter(v => v && norm(v.lang));
    if (!ziel || !liste.length) return null;
    const reihe = [...new Set(KETTEN[ziel] || [ziel, ziel.split('-')[0]])];
    const passt = (v, k) => (k.length === 2 ? norm(v.lang).split('-')[0] === k : norm(v.lang) === k);
    if (wunschURI) {
      const w = liste.find(v => v.voiceURI === wunschURI);
      if (w && reihe.some(k => passt(w, k))) return { stimme: w, stufe: 0 };               // Wahl im Elternbereich
    }
    const punkte = v => (v.localService ? 2 : 0) + (/premium|enhanced|erweitert|verbessert/i.test(`${v.name} ${v.voiceURI || ''}`) ? 3 : 0) + (v.default ? 1 : 0);
    for (let i = 0; i < reihe.length; i++) {
      const t = liste.filter(v => passt(v, reihe[i]));
      if (t.length) return { stimme: t.sort((a, b) => punkte(b) - punkte(a))[0], stufe: i };
    }
    return null;
  }

  /** 'interrupted' und 'canceled' sind kein Ausfall der Stimme. 'not-allowed' heisst: nicht aus einer Berührung gestartet. */
  const endeVon = fehler => (fehler === 'interrupted' || fehler === 'canceled' ? 'abgebrochen' : fehler === 'not-allowed' ? 'gesperrt' : 'stumm');

  /** Dienst über Attrappen oder die echten Schnittstellen. Ohne syn, Utterance oder Audio fehlt die jeweilige Fähigkeit, nichts wirft. */
  function neu({ syn = null, Utterance = null, Audio = null, wartezeit = ms => new Promise(ok => setTimeout(ok, ms)) } = {}) {
    let element = null, nummer = 0;
    const tts = { fertig: null }, ton = { fertig: null };                                // laufende Äusserung und laufende Aufnahme

    /** Wartet auf das Ende einer Äusserung: start(fertig, frist) richtet Hörer ein, fertig(ergebnis) gilt genau einmal, frist() setzt die Sicherung. */
    function warteAuf(slot, start) {
      return new Promise(ok => {
        let timer = null, aus = false;
        const fertig = ergebnis => { if (aus) return; aus = true; clearTimeout(timer); if (slot.fertig === fertig) slot.fertig = null; ok(ergebnis); };
        slot.fertig = fertig;
        start(fertig, (ms, ergebnis) => { clearTimeout(timer); timer = setTimeout(() => fertig(ergebnis), ms); });
      });
    }
    const stimmen = () => { try { return syn ? Array.from(syn.getVoices()) : []; } catch { return []; } };
    const holeElement = () => element || (element = new Audio());                        // genau ein Element für alle Aufnahmen

    /** iOS lädt die Stimmenliste verzögert: bis zu `frist` ms auf «voiceschanged» warten, Safari feuert es nicht zuverlässig (darum auch Nachsehen im Takt). */
    function bereit(frist = 1500) {
      if (!syn) return Promise.resolve(false);
      if (stimmen().length) return Promise.resolve(true);
      return new Promise(ok => {
        let takt = null, ende = null, aus = false;
        const schluss = wert => {
          if (aus) return;
          aus = true; clearTimeout(ende); clearInterval(takt);
          try { if (syn.removeEventListener) syn.removeEventListener('voiceschanged', pruefe); } catch { /* ohne Belang */ }
          ok(wert);
        };
        const pruefe = () => { if (stimmen().length) schluss(true); };
        ende = setTimeout(() => schluss(stimmen().length > 0), frist);
        takt = setInterval(pruefe, 100);
        try { if (syn.addEventListener) syn.addEventListener('voiceschanged', pruefe); else syn.onvoiceschanged = pruefe; } catch { /* der Takt genügt */ }
      });
    }

    /** Für Elternbereich und Fähigkeitsprüfung: gewählte Stimme samt Ausweichstufe. anzahl 0 heisst: Liste noch nicht geladen (bereit() abwarten). */
    function status(sprache, wunsch = null) {
      const alle = stimmen(), w = waehleStimme(alle, sprache, wunsch);
      return { ok: !!w, stimme: w ? w.stimme : null, stufe: w ? w.stufe : null, exakt: !!w && norm(w.stimme.lang) === norm(sprache), anzahl: alle.length };
    }

    /** In derselben Berührung aufrufen wie «Start»: iOS lässt die erste Äusserung nur direkt aus einer Berührung zu. */
    function entsperre() {
      try { const u = new Utterance(' '); u.volume = 0; syn.speak(u); return true; } catch { return false; }
    }

    /** Wie entsperre(), für Aufnahmen: ein einziges Audio-Element spielt einen stillen Ton und bleibt erhalten. */
    function entsperreAudio() {
      try {
        const el = holeElement();
        if (ton.fertig) return true;                                                     // läuft gerade eine Aufnahme, ist das Element frei
        el.src = STILLER_TON;
        Promise.resolve(el.play()).catch(() => { /* gesperrt: spieleAudio meldet es beim Abspielen */ });
        return true;
      } catch { return false; }
    }

    /** → 'audio' | 'abgebrochen' | 'gesperrt' | 'stumm' (Datei fehlt oder nicht abspielbar). Eine Aufnahme zur Zeit, die neue löst die alte ab. */
    async function spieleAudio(url) {
      if (!Audio || !url) return 'stumm';
      if (ton.fertig) ton.fertig('abgebrochen');
      let el;
      try { el = holeElement(); } catch { return 'stumm'; }
      return warteAuf(ton, (fertig, frist) => {
        el.onended = () => fertig('audio');
        el.onerror = () => fertig('stumm');
        try {
          el.src = url;
          Promise.resolve(el.play()).then(
            () => { if (ton.fertig === fertig) frist(el.duration > 0 && Number.isFinite(el.duration) ? el.duration * 1000 + 3000 : 30000, 'audio'); },
            e => fertig(e && e.name === 'NotAllowedError' ? 'gesperrt' : e && e.name === 'AbortError' ? 'abgebrochen' : 'stumm'));
        } catch { fertig('stumm'); }
      });
    }

    async function sprichTts(text, sprache, wunsch, tempo) {
      if (!syn || !Utterance || !text.trim()) return 'stumm';
      const w = waehleStimme(stimmen(), sprache, wunsch);
      if (!w) return 'stumm';
      const mein = ++nummer;
      if (tts.fertig) tts.fertig('abgebrochen');
      if (syn.speaking || syn.pending) {                                                 // nur wenn nötig: cancel() direkt vor speak() verschluckt auf iOS manchmal die Äusserung
        try { syn.cancel(); } catch { /* weiter */ }
        await wartezeit(60);
        if (mein !== nummer) return 'abgebrochen';                                       // inzwischen sprach oder stoppte jemand anders
      }
      return warteAuf(tts, (fertig, frist) => {
        try {
          const u = new Utterance(text);
          u.lang = w.stimme.lang; u.voice = w.stimme; u.rate = tempo;
          u.onend = () => fertig('tts');
          u.onerror = e => fertig(endeVon(e && e.error));
          frist(4000 + text.length * 120, 'tts');                                        // onend kommt auf iOS nicht immer
          syn.speak(u);
        } catch { fertig('stumm'); }
      });
    }

    /** opt: sprache (Pflicht), wunsch (voiceURI), tempo, audio (URL der Aufnahme, hat Vorrang), signal (AbortSignal: stoppt beim Abbruch). */
    async function sprich(text, opt) {
      const { sprache, wunsch = null, tempo = 0.9, audio = null, signal = null } = opt || {};
      if (signal && signal.aborted) return 'abgebrochen';
      const abbruch = () => stopp();
      if (signal) signal.addEventListener('abort', abbruch, { once: true });
      try {
        let davor = 'stumm';
        if (audio) {
          davor = await spieleAudio(audio);
          if (davor === 'audio' || davor === 'abgebrochen') return davor;
        }
        const r = await sprichTts(String(text ?? ''), sprache, wunsch, tempo);
        return r === 'stumm' && davor === 'gesperrt' ? 'gesperrt' : r;                   // gesperrt ist kein Ausfall: kein Ersatztyp
      } finally {
        if (signal) signal.removeEventListener('abort', abbruch);
      }
    }

    /** Bricht alles ab (Wechsel in den Hintergrund, Runde verlassen). Leert die Warteschlange der Sprachausgabe immer. */
    function stopp() {
      nummer++;
      if (tts.fertig) tts.fertig('abgebrochen');
      if (ton.fertig) ton.fertig('abgebrochen');
      try { if (syn) syn.cancel(); } catch { /* ohne Belang */ }
      try { if (element) element.pause(); } catch { /* ohne Belang */ }
    }

    return { waehleStimme, endeVon, bereit, status, entsperre, entsperreAudio, spieleAudio, sprich, stopp };
  }

  // Der gemeinsame Dienst entsteht beim ersten Aufruf und liest die Schnittstellen des Browsers erst dann.
  const holt = name => { try { return g[name] || null; } catch { return null; } };
  let standard = null;
  const dienst = () => standard || (standard = neu({ syn: holt('speechSynthesis'), Utterance: holt('SpeechSynthesisUtterance'), Audio: holt('Audio') }));

  L.Sprache = { waehleStimme, endeVon, neu };
  ['bereit', 'status', 'entsperre', 'entsperreAudio', 'spieleAudio', 'sprich', 'stopp'].forEach(m => { L.Sprache[m] = (...a) => dienst()[m](...a); });
})(globalThis);
