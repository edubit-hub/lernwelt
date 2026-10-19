/* app/ui/klang.js: Klänge der Lernwelt über Web Audio (Umbauplan 3.5, E-19). Die Daten liegen als Base64 in Lernwelt.Klaenge
   (app/klang/klaenge.js), dieser Dienst dekodiert sie selbst (atob in einen ArrayBuffer, dann decodeAudioData, einmal je Name)
   und spielt sie dezent ab. Fehlt eine Datei, bleibt es still: es gibt keinen Ersatzklang. Beim Laden entsteht weder ein
   AudioContext noch ein Zugriff auf das Dokument; beides kommt erst mit entsperre() im ersten Tipp (iOS verlangt eine Berührung).
   Der Dienst kennt weder Zustand noch Welt: die Hülle setzt an(...) aus den Einstellungen und schaltet die Schleife je Modus.
   Schleifen laufen nur im Fenster aus Lernwelt.KlangFenster (loopStart = von, loopEnd = bis, Start bei von), siehe fenster().
   Die Musik (Titel und Inselschleife) spielt app/ui/musik.js (Lernwelt.KlangMusik) über denselben AudioContext; dieser Dienst verbindet
   ihn beim Entsperren und reicht musik(wunsch) und musikAn(wert) weiter. Der Hauptschalter an(false) macht auch die Musik still.

   Lernwelt.Klang = { spiele(name, { lautstaerke }), schleife(name | null), an(wert?) → bool, musik('welt' | 'aufgabe' | 'eltern' | null),
                      musikAn(wert?) → bool, entsperre(), bereit() → bool, RANG, FENSTER, RUHE } */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** Dezente Lautstärken je Klang (0 bis 1), abgestimmt auf die gelieferten Dateien (docs/klaenge/herkunft.md, Abschnitt Lautstärken):
      Ereignisse (richtig, bauen, freischalten, forschung, tor) wirken gleich laut, Rückmeldungen (hinweis, gebaut, stempel, muenze,
      sammeln) etwas leiser, Bedienung (taste, tafel, wechsel) deutlich leiser, die Schleife «meer» sehr leise darunter. Die Musik
      (app/ui/musik.js) liegt mit ihrem Kurzzeit-Maximum mindestens 3 dB unter dem leisesten dieser Klänge (Schlussprüfung, G18). */
  const LAUT = {
    taste: 0.33, richtig: 0.3, hinweis: 0.17, muenze: 0.6, sammeln: 0.7, bauen: 0.3, gebaut: 0.4,
    freischalten: 0.35, forschung: 0.14, stempel: 0.5, tafel: 0.1, wechsel: 0.2, tor: 0.25, meer: 0.06
  };
  const NAMEN = Object.keys(LAUT);
  const SCHLEIFEN = ['meer'];                  // nur in Weltansichten, nie während einer Aufgabe (das schaltet die Hülle)
  const HOECHSTENS = 0.7;                      // Obergrenze, auch für eine eigene Lautstärke
  const EINBLENDEN = 1.2, AUSBLENDEN = 0.4;    // Sekunden für die Schleife
  const RUHE = { weg: 0.05, ein: 0.8 };        // Sekunden: Ausgang aus- und einblenden, wenn die App verdeckt wird und zurückkommt
  // Eine Handlung, ein Klang. Kommen mehrere Klänge im selben Ereignisdurchlauf (derselbe Tipp, auch auf einem langsamen Gerät) oder
  // innerhalb von FENSTER ms, gilt der mit dem höheren Rang; ein späterer höherer löst den früheren ab und blendet ihn in WEICH s aus.
  // Das Urteil einer Antwort (richtig, hinweis) steht über muenze und sammeln: ein spät landender Ertragsflug verdrängt es nie.
  const FENSTER = 150, WEICH = 0.02;
  const RANG = { taste: 1, tafel: 1, wechsel: 1, muenze: 3, sammeln: 3, hinweis: 4, richtig: 4, stempel: 4, bauen: 5, gebaut: 5, forschung: 5, freischalten: 6, tor: 7 };
  const jetzt = () => (L.Dienste && typeof L.Dienste.jetzt === 'function' ? L.Dienste.jetzt() : Date.now());   // Millisekunden, in Tests steuerbar
  let letzter = null;                          // { zeit, rang, offen (derselbe Durchlauf), quelle und stufe (sobald sie läuft), aus (verdrängt) }
  const nachDurchlauf = f => { if (typeof g.setTimeout === 'function') g.setTimeout(f, 0); else Promise.resolve().then(f); };

  let istAn = true;
  let kontext = null, ausgang = null;
  const puffer = {};                           // Name → Promise auf AudioBuffer oder null
  let gewuenscht = null;                       // Schleife, die laufen soll, sobald es geht
  let schleifeLaeuft = null;                   // { name, quelle, stufe }

  const daten = name => { const k = L.Klaenge; const d = k && NAMEN.includes(name) ? k[name] : null; return typeof d === 'string' && d.includes('base64,') ? d : null; };

  /** data:audio/...;base64,... → ArrayBuffer, ohne Netz. */
  function zuPuffer(text) {
    const roh = g.atob(text.slice(text.indexOf('base64,') + 7).replace(/\s+/g, ''));
    const bytes = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
    return bytes.buffer;
  }

  /** Dekodiert einen Klang einmal und merkt sich das Ergebnis. Liefert ein Promise auf den Puffer oder null. */
  function lade(name) {
    if (puffer[name]) return puffer[name];
    const d = daten(name);
    if (!d || !kontext) return Promise.resolve(null);
    puffer[name] = new Promise(fertig => {
      try {
        const r = kontext.decodeAudioData(zuPuffer(d), fertig, () => fertig(null));   // Safari kennt nur die Rückruf-Form
        if (r && typeof r.then === 'function') r.then(fertig, () => fertig(null));
      } catch (e) { fertig(null); }
    });
    return puffer[name];
  }

  function weckeKontext() {
    if (kontext && kontext.state !== 'running' && kontext.state !== 'closed' && typeof kontext.resume === 'function') {
      try { const r = kontext.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* bleibt still */ }
    }
  }

  function lautstaerke(name, wert) {
    const v = typeof wert === 'number' && isFinite(wert) ? wert : LAUT[name];
    return Math.max(0, Math.min(HOECHSTENS, v));
  }

  /** Spielt einen Klang einmal. Still, wenn aus, nicht entsperrt oder die Datei fehlt. */
  function spiele(name, opt = {}) {
    if (!istAn || !kontext || !daten(name) || SCHLEIFEN.includes(name)) return;
    const t = jetzt(), rang = RANG[name] || 1;
    if (letzter && (letzter.offen || t - letzter.zeit < FENSTER)) {
      if (rang <= letzter.rang) return;                                       // derselbe Moment hat schon einen gleich wichtigen Klang
      verdraenge(letzter);
    }
    const eintrag = { zeit: t, rang, offen: true, quelle: null, stufe: null, aus: false };
    letzter = eintrag;
    nachDurchlauf(() => { eintrag.offen = false; });
    weckeKontext();
    lade(name).then(b => {
      if (!b || !istAn || !kontext || eintrag.aus) return;
      try {
        const q = kontext.createBufferSource(), stufe = kontext.createGain();
        q.buffer = b;
        stufe.gain.value = lautstaerke(name, opt.lautstaerke);
        q.connect(stufe); stufe.connect(ausgang);
        q.start(0);
        eintrag.quelle = q; eintrag.stufe = stufe;
      } catch (e) { /* Ton ist Beiwerk, ein Fehler stört die Bedienung nie */ }
    });
  }

  /** Ein verdrängter Klang endet ohne Knack: in WEICH s auf 0, danach stoppen. Noch nicht gestartet: er startet nicht mehr. */
  function verdraenge(e) {
    e.aus = true;
    if (!e.quelle) return;
    try {
      const t = kontext.currentTime || 0, gain = e.stufe.gain;
      if (gain.cancelScheduledValues) gain.cancelScheduledValues(t);
      if (gain.setValueAtTime) gain.setValueAtTime(gain.value, t);
      gain.linearRampToValueAtTime(0, t + WEICH);
      e.quelle.stop(t + WEICH + 0.005);
    } catch (err) { /* schon zu Ende */ }
  }

  function stoppeSchleife() {
    const s = schleifeLaeuft;
    if (!s) return;
    schleifeLaeuft = null;
    try {
      const t = kontext.currentTime || 0, gain = s.stufe.gain;
      if (gain.cancelScheduledValues) gain.cancelScheduledValues(t);
      if (gain.setValueAtTime) gain.setValueAtTime(gain.value, t);
      gain.linearRampToValueAtTime(0, t + AUSBLENDEN);
      s.quelle.stop(t + AUSBLENDEN + 0.05);
    } catch (e) { /* schon gestoppt */ }
  }

  /** Fenster der Schleife aus Lernwelt.KlangFenster ({ von, bis } in Sekunden) oder null. Die Datei trägt ein Umlauf-Polster:
      wiederholt wird nur [von, bis], nie die ganze Datei (sonst knackt die Naht). Ohne gültiges Fenster bleibt die Schleife still. */
  function fenster(name, b) {
    const F = L.KlangFenster, f = F && F[name];
    if (!f || typeof f.von !== 'number' || typeof f.bis !== 'number' || !(f.von >= 0) || !(f.bis - f.von >= 1)) return null;
    if (b && typeof b.duration === 'number' && f.bis > b.duration + 0.02) return null;
    return f;
  }

  function starteSchleife() {
    const name = gewuenscht;
    if (!name || !istAn || !kontext || schleifeLaeuft || !daten(name) || !fenster(name)) return;
    weckeKontext();
    lade(name).then(b => {
      const f = fenster(name, b);
      if (!b || !f || gewuenscht !== name || !istAn || schleifeLaeuft) return;
      try {
        const q = kontext.createBufferSource(), stufe = kontext.createGain(), t = kontext.currentTime || 0;
        q.buffer = b; q.loop = true; q.loopStart = f.von; q.loopEnd = Math.min(f.bis, typeof b.duration === 'number' ? b.duration : f.bis);
        if (stufe.gain.setValueAtTime) stufe.gain.setValueAtTime(0, t); else stufe.gain.value = 0;
        stufe.gain.linearRampToValueAtTime(lautstaerke(name), t + EINBLENDEN);
        q.connect(stufe); stufe.connect(ausgang);
        q.start(0, f.von);
        schleifeLaeuft = { name, quelle: q, stufe };
      } catch (e) { schleifeLaeuft = null; }
    });
  }

  /** Umgebungsschleife: nur «meer». null stoppt mit kurzem Ausblenden. Andere Namen werden nicht als Schleife gespielt. */
  function schleife(name) {
    if (name !== null && name !== undefined && !SCHLEIFEN.includes(name)) return;
    const neu = name || null;
    if (schleifeLaeuft && schleifeLaeuft.name !== neu) stoppeSchleife();
    gewuenscht = neu;
    starteSchleife();
  }

  /** Ohne Wert: Abfrage. Mit Wert: an- oder abschalten. Aus stoppt die Schleife, an setzt die gewünschte fort. */
  function an(wert) {
    if (wert === undefined) return istAn;
    istAn = !!wert;
    if (istAn) starteSchleife(); else stoppeSchleife();
    musikDienst('pruefe');
    return istAn;
  }

  /** Musik (app/ui/musik.js): wird erst zur Laufzeit gesucht, die Datei lädt nach dieser. Ohne Musikdienst bleibt es still. */
  function musikDienst(name, ...a) { const M = L.KlangMusik; try { return M && typeof M[name] === 'function' ? M[name](...a) : undefined; } catch (e) { return undefined; } }
  const musik = wunsch => { musikDienst('wunsch', wunsch === undefined ? null : wunsch); };
  const musikAn = wert => { const r = musikDienst('an', wert); return typeof r === 'boolean' ? r : wert === undefined ? true : !!wert; };

  /** Verdeckt: der gemeinsame Ausgang (Klänge und Musik) blendet in RUHE.weg s aus, erst danach hält der AudioContext an.
      Zurück: fortsetzen und den Ausgang in RUHE.ein s wieder einblenden. Kein harter Schnitt mitten in Titel, Insel oder Meer. */
  let ruhen = null;
  function blendeAusgang(ziel, sek) {
    const gain = ausgang.gain, t = kontext.currentTime || 0;
    if (gain.cancelScheduledValues) gain.cancelScheduledValues(t);
    if (gain.setValueAtTime) gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(ziel, t + sek);
  }
  function sichtbar(ja) {
    if (!kontext) return;
    try {
      if (ruhen !== null && typeof g.clearTimeout === 'function') g.clearTimeout(ruhen);
      ruhen = null;
      if (ja) { weckeKontext(); blendeAusgang(1, RUHE.ein); return; }
      blendeAusgang(0, RUHE.weg);
      const halte = () => { ruhen = null; const r = kontext.suspend && kontext.suspend(); if (r && r.catch) r.catch(() => {}); };
      if (typeof g.setTimeout === 'function') ruhen = g.setTimeout(halte, RUHE.weg * 1000 + 20); else halte();
    } catch (e) { /* still */ }
  }

  /** Im ersten Tipp: AudioContext erzeugen oder fortsetzen. Mehrfach aufrufbar. */
  function entsperre() {
    if (!kontext) {
      const AC = g.AudioContext || g.webkitAudioContext;
      if (typeof AC !== 'function') return false;
      try {
        kontext = new AC();
        ausgang = kontext.createGain();
        ausgang.connect(kontext.destination);
      } catch (e) { kontext = null; ausgang = null; return false; }
      const d = g.document;
      if (d && typeof d.addEventListener === 'function') d.addEventListener('visibilitychange', () => sichtbar(d.visibilityState !== 'hidden'));
      // Nach und nach dekodieren (Nachbesserung 2): zuerst das Meer, die übrigen je einen Schritt später, damit der erste Tipp nicht stockt
      const folge = ['meer', ...NAMEN.filter(n => n !== 'meer')].filter(n => daten(n));
      folge.forEach((n, i) => { if (typeof g.setTimeout === 'function' && i) g.setTimeout(() => lade(n), 30 * i); else lade(n); });
      musikDienst('verbinde', { kontext, ausgang, zuPuffer, an: () => istAn });
    }
    weckeKontext();
    starteSchleife();
    return true;
  }

  const bereit = () => !!kontext && kontext.state === 'running';

  L.Klang = { spiele, schleife, an, musik, musikAn, entsperre, bereit, NAMEN: NAMEN.slice(), LAUTSTAERKE: Object.freeze({ ...LAUT }), RANG: Object.freeze({ ...RANG }), FENSTER, RUHE: Object.freeze({ ...RUHE }) };
})(globalThis);
