/* app/ui/musik.js: Musik der Lernwelt über Web Audio (docs/gestaltung.md G18, docs/klaenge/herkunft.md). Die Daten liegen als Base64 in
   Lernwelt.Musik und Lernwelt.MusikFenster (app/klang/musik.js, erzeugt von lw klaenge). Der Dienst hat keinen eigenen AudioContext:
   app/ui/klang.js verbindet ihn beim Entsperren (verbinde) und bleibt die Schnittstelle nach aussen (Klang.musik, Klang.musikAn).
   Ablauf: In einer Weltansicht spielt nach dem Entsperren einmal je Sitzung «titel», etwa 3 s vor seinem Ende blendet «insel» als Schleife
   ein (nur im Fenster: loopStart = von, loopEnd = bis, Start bei von). Führt der erste Tipp direkt in eine Aufgabe, entfällt der Titel.
   Ausserhalb der Welt (Aufgabe, Abschluss, Elternbereich), mit Klang aus oder Musik aus blendet die Musik in 0,8 s aus und pausiert;
   zurück in der Welt blendet «insel» in 1,5 s an der gemerkten Stelle wieder ein. Bei verstecktem Tab blendet klang.js den gemeinsamen
   Ausgang aus und hält danach den AudioContext an (die Musik steht mit ihm still), zurück blendet er wieder ein. Der Puffer des Titels wird nach dem Abspielen freigegeben (Speicher auf dem iPad).

   Lernwelt.KlangMusik = { verbinde(leitung), wunsch('welt' | 'aufgabe' | 'eltern' | null), an(wert?) → bool, pruefe(), zustand(), LAUT, ZEITEN }
     leitung = { kontext, ausgang, zuPuffer(text) → ArrayBuffer, an() → bool (Hauptschalter des HUD) } */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** Deutlich unter den Klängen (herkunft.md, Lautstärken): die Dateien stehen auf −18 LUFS integriert, Kurzzeit-Maximum −15,9 (titel)
      und −16,4 LUFS (insel). Mit 0,12 und 0,11 liegt das Kurzzeit-Maximum bei −34,3 und −35,6 LUFS, mindestens 3 dB unter dem
      leisesten Klang der Weltansichten (tafel und wechsel, etwa −30,5 LUFS); integriert sind es etwa −36 und −37 LUFS. */
  const LAUT = { titel: 0.12, insel: 0.11 };
  const ZEITEN = { kreuz: 3, aus: 0.8, ein: 1.5 };            // Sekunden: Übergang Titel → Insel, Ausblenden, Wiedereinblenden

  let leitung = null, wunsch = null, musikAn = true;
  let titel = 'offen';                                         // offen, laedt, laeuft, vorbei (einmal je Sitzung)
  const puffer = {};                                           // Name → Promise auf AudioBuffer oder null
  const spur = { titel: null, insel: null };                   // laufende Quellen { quelle, stufe, start, ab, f }
  let stelle = null;                                           // gemerkte Stelle der Schleife in der Datei (Sekunden)
  let zug = 0, geplant = false;                                // zug: jeder Halt macht ältere Startaufträge ungültig

  const daten = name => { const M = L.Musik, d = M && M[name]; return typeof d === 'string' && d.includes('base64,') ? d : null; };
  const dauer = b => (b && typeof b.duration === 'number' && isFinite(b.duration) ? b.duration : null);
  const soll = () => !!leitung && leitung.an() === true && musikAn && wunsch === 'welt';

  /** Fenster der Schleife aus Lernwelt.MusikFenster oder null (dann bleibt sie still, nie über die ganze Datei). */
  function fenster(b) {
    const F = L.MusikFenster, f = F && F.insel;
    if (!f || typeof f.von !== 'number' || typeof f.bis !== 'number' || !(f.von >= 0) || !(f.bis - f.von >= 1)) return null;
    return dauer(b) !== null && f.bis > dauer(b) + 0.02 ? null : f;
  }

  function lade(name) {
    if (puffer[name]) return puffer[name];
    const d = daten(name), k = leitung && leitung.kontext;
    if (!d || !k) return Promise.resolve(null);
    puffer[name] = new Promise(fertig => {
      try {
        const r = k.decodeAudioData(leitung.zuPuffer(d), fertig, () => fertig(null));   // Safari kennt nur die Rückruf-Form
        if (r && typeof r.then === 'function') r.then(fertig, () => fertig(null));
      } catch (e) { fertig(null); }
    });
    return puffer[name];
  }

  function quelle(b) {
    const k = leitung.kontext, q = k.createBufferSource(), stufe = k.createGain();
    q.buffer = b;
    q.connect(stufe); stufe.connect(leitung.ausgang);
    return { q, stufe };
  }
  const setze = (gain, wert, t) => { if (gain.setValueAtTime) gain.setValueAtTime(wert, t); else gain.value = wert; };

  /** Stelle der Schleife zur Kontextzeit t: vor dem Start die Startstelle, danach im Fenster umlaufend. */
  function stelleBei(s, t) {
    const p = s.f.bis - s.f.von, lauf = Math.max(0, t - s.start);
    return s.f.von + ((s.ab - s.f.von + lauf) % p);
  }

  /** Blendet eine Spur in `sek` Sekunden aus und stoppt sie danach. */
  function blende(s, t, sek) {
    try {
      const gain = s.stufe.gain;
      if (gain.cancelScheduledValues) gain.cancelScheduledValues(t);
      setze(gain, gain.value, t);
      gain.linearRampToValueAtTime(0, t + sek);
      s.quelle.stop(t + sek + 0.05);
    } catch (e) { /* schon gestoppt */ }
  }

  /** Pause: alles ausblenden, die Stelle der Schleife merken. Ein unterbrochener Titel gilt als gespielt. */
  function halte() {
    zug += 1;
    const k = leitung && leitung.kontext;
    if (!k) return;
    const t = k.currentTime || 0;
    if (spur.insel) { stelle = stelleBei(spur.insel, t + ZEITEN.aus); blende(spur.insel, t, ZEITEN.aus); spur.insel = null; }
    if (spur.titel) { blende(spur.titel, t, ZEITEN.aus); spur.titel = null; titel = 'vorbei'; }
  }

  /** Startet die Schleife «insel» ab Kontextzeit `ab` (oder sofort) mit Einblenden über `ein` Sekunden. */
  function starteInsel(ein, ab) {
    const meiner = zug;
    lade('insel').then(b => {
      const f = fenster(b);
      if (!b || !f || meiner !== zug || spur.insel || !soll()) return;
      try {
        const k = leitung.kontext, t = Math.max(k.currentTime || 0, ab || 0), von = stelle !== null && stelle >= f.von && stelle < f.bis ? stelle : f.von;
        const { q, stufe } = quelle(b);
        q.loop = true; q.loopStart = f.von; q.loopEnd = f.bis;
        setze(stufe.gain, 0, t);
        stufe.gain.linearRampToValueAtTime(LAUT.insel, t + ein);
        q.start(t, von);
        spur.insel = { quelle: q, stufe, start: t, ab: von, f };
      } catch (e) { spur.insel = null; }
    });
  }

  function gibFrei() { delete puffer.titel; }

  /** Titel einmal je Sitzung. Entschieden wird, wenn er dekodiert ist: steht dann eine Aufgabe offen, entfällt er (erster Tipp in eine Aufgabe). */
  function starteTitel() {
    titel = 'laedt';
    lade('insel');                                              // parallel, damit der Übergang bereitliegt
    lade('titel').then(b => {
      if (titel !== 'laedt') return;
      if (!b || wunsch === 'aufgabe') { titel = 'vorbei'; gibFrei(); plane(); return; }
      if (!soll()) { titel = 'offen'; return; }                // Elternbereich oder aus: der Titel wartet auf die Welt
      try {
        const k = leitung.kontext, t = k.currentTime || 0, ende = t + (dauer(b) || 0), kreuz = Math.max(t, ende - ZEITEN.kreuz);
        const { q, stufe } = quelle(b);
        setze(stufe.gain, LAUT.titel, t);
        setze(stufe.gain, LAUT.titel, kreuz);
        stufe.gain.linearRampToValueAtTime(0, ende);
        q.onended = () => { if (spur.titel && spur.titel.quelle === q) spur.titel = null; titel = 'vorbei'; gibFrei(); };
        q.start(t);
        spur.titel = { quelle: q, stufe };
        titel = 'laeuft';
        starteInsel(Math.max(0.1, ende - kreuz), kreuz);        // Kreuzblende: die Insel kommt, während der Titel ausklingt
      } catch (e) { titel = 'vorbei'; gibFrei(); }
    });
  }

  function wende() {
    if (!leitung) return;
    if (!soll()) { if (titel === 'offen' && wunsch === 'aufgabe') titel = 'vorbei'; halte(); return; }   // erster Schritt nach dem Entsperren in eine Aufgabe: kein Titel
    if (spur.titel || spur.insel || titel === 'laedt') return;
    if (titel === 'offen' && daten('titel')) starteTitel(); else starteInsel(ZEITEN.ein, 0);
  }
  /** Mehrere Wechsel im selben Augenblick (Welt, dann gleich Aufgabe) ergeben nur einen Schritt. */
  function plane() {
    if (geplant) return;
    geplant = true;
    Promise.resolve().then(() => { geplant = false; try { wende(); } catch (e) { /* Musik ist Beiwerk */ } });
  }

  const verbinde = l => { leitung = l && l.kontext ? l : null; plane(); };
  const setzeWunsch = w => { wunsch = typeof w === 'string' ? w : null; plane(); };
  const an = wert => { if (wert !== undefined) { musikAn = !!wert; plane(); } return musikAn; };
  const zustand = () => ({ titel, wunsch, an: musikAn, laeuft: { titel: !!spur.titel, insel: !!spur.insel }, stelle, puffer: Object.keys(puffer) });

  L.KlangMusik = { verbinde, wunsch: setzeWunsch, an, pruefe: plane, zustand, LAUT: Object.freeze({ ...LAUT }), ZEITEN: Object.freeze({ ...ZEITEN }) };
})(globalThis);
