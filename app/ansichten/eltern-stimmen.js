/* app/ansichten/eltern-stimmen.js: Abschnitt «Stimmen» im Reiter «Einstellungen» (Architektur 5.7): je Sprache die gewählte Stimme samt
   Ausweichstufe, der Hinweis «nicht britisch» und der Knopf «Ton prüfen». Die Wahl einer anderen Stimme steht in einstellungen.stimmen[<Sprachcode>]
   (voiceURI) und gilt als Wunsch für Sprache.sprich. «Ton prüfen» ruft die Sprachausgabe direkt im Klick auf: iOS lässt Ton nur aus einer Berührung zu.
   Das tatsächliche Sprechen prüft die Abnahmeliste auf dem iPad (8.6, Punkt 5). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const SPRACHEN = Object.freeze([
    { code: 'en-GB', name: 'Englisch', test: 'Hello. This is a short test of the voice.' },
    { code: 'de-CH', name: 'Deutsch', test: 'Dies ist ein kurzer Test der Stimme.' }
  ]);
  const ERGEBNIS = Object.freeze({
    tts: 'Die Wiedergabe ist beendet. Falls nichts zu hören war, Lautstärke und Stummschalter prüfen.',
    audio: 'Die Wiedergabe ist beendet.',
    stumm: 'Keine Sprachausgabe möglich: Es gibt keine passende Stimme, oder das Gerät hat die Ausgabe verweigert.',
    gesperrt: 'Das Gerät hat die Wiedergabe gesperrt. Den Knopf noch einmal antippen.',
    abgebrochen: 'Die Wiedergabe wurde abgebrochen.'
  });
  const norm = s => String(s || '').replace(/_/g, '-').toLowerCase();
  const wunschVon = (k, code) => ((k.Z.hole().einstellungen || {}).stimmen || {})[code] || null;

  /** Die Stimmen der Sprachfamilie (en, de) aus der Liste des Geräts, die genaue Sprache zuerst. */
  function stimmenFuer(k, code) {
    let alle = [];
    try { alle = k.syn && typeof k.syn.getVoices === 'function' ? Array.from(k.syn.getVoices()) : []; } catch (e) { alle = []; }
    const fam = norm(code).split('-')[0], genau = v => (norm(v.lang) === norm(code) ? 0 : 1);
    return alle.filter(v => v && norm(v.lang).split('-')[0] === fam).sort((a, b) => genau(a) - genau(b) || norm(a.lang).localeCompare(norm(b.lang)) || String(a.name).localeCompare(String(b.name)));
  }

  /** Beschreibung einer Zeile: { text, hinweise[] } aus Sprache.status. */
  function beschreibe(s, st, wunsch) {
    if (!st.ok) return { text: st.anzahl === 0 ? 'Die Stimmenliste ist noch nicht geladen.' : 'Keine Stimme für diese Sprache gefunden.',
      hinweise: [st.anzahl === 0 ? 'Mit «Stimmen neu laden» noch einmal nachsehen.' : 'Aufgaben mit Sprachausgabe werden durch andere Aufgaben ersetzt.'] };
    const v = st.stimme, gewaehlt = !!wunsch && v.voiceURI === wunsch, hinweise = [];
    if (s.code === 'en-GB' && norm(v.lang) !== 'en-gb') hinweise.push(`Nicht britisch: Es wird mit ${v.lang} gesprochen. Auf dem iPad lässt sich eine erweiterte britische Stimme laden (Einstellungen, Bedienungshilfen, Gesprochene Inhalte, Stimmen, Englisch). Danach hier mit «Stimmen neu laden» prüfen, ob sie erscheint.`);
    else if (!gewaehlt && !st.exakt) hinweise.push(`Es wird mit ${v.lang} gesprochen, weil keine Stimme für ${s.code} vorhanden ist.`);
    return { text: `${gewaehlt ? 'Gewählte Stimme' : 'Stimme'}: ${v.name} (${v.lang})${st.stufe > 0 ? `, Ausweichstufe ${st.stufe}` : ''}`, hinweise };
  }

  function zeile(k, s) {
    const h = k.h, status = h('p', { role: 'status' }), hinweise = h('div.eltern-inhalt'), ergebnis = h('p.klein', { role: 'status', 'aria-live': 'polite' });
    const liste = stimmenFuer(k, s.code);
    const auswahl = h('select', { 'aria-label': `Stimme für ${s.name}` }, h('option', { value: '' }, 'Automatisch (beste Stimme)'),
      liste.map(v => h('option', { value: v.voiceURI }, `${v.name} (${v.lang})${v.localService === false ? ', online' : ''}`)));
    const wunsch0 = wunschVon(k, s.code);
    auswahl.value = wunsch0 && liste.some(v => v.voiceURI === wunsch0) ? wunsch0 : '';
    const zeichne = () => {
      const w = auswahl.value || null, b = beschreibe(s, k.sprache.status(s.code, w), w);
      status.textContent = b.text;
      hinweise.replaceChildren(...b.hinweise.map(t => k.kasten('hilfe', 'Hinweis', t)),
        wunsch0 && !liste.some(v => v.voiceURI === wunsch0) ? k.kasten('hilfe', 'Hinweis', 'Die früher gewählte Stimme ist auf diesem Gerät nicht mehr vorhanden. Es gilt die automatische Wahl.') : '');
    };
    auswahl.addEventListener('change', () => {
      const uri = auswahl.value;
      k.Z.aendere(z => { const m = (z.einstellungen.stimmen = z.einstellungen.stimmen && typeof z.einstellungen.stimmen === 'object' ? z.einstellungen.stimmen : {}); if (uri) m[s.code] = uri; else delete m[s.code]; });
      zeichne();
      k.meldung('Gespeichert.', 'ok');
    });
    const pruefen = () => {                                  // direkt im Klick: iOS verlangt eine frische Berührung
      ergebnis.textContent = 'Die Wiedergabe läuft.';
      Promise.resolve(k.sprache.sprich(s.test, { sprache: s.code, wunsch: auswahl.value || null })).then(r => { if (k.offen) ergebnis.textContent = ERGEBNIS[r] || ERGEBNIS.stumm; }, () => { if (k.offen) ergebnis.textContent = ERGEBNIS.stumm; });
    };
    zeichne();
    return h('div.eltern-inhalt', h('h4', `${s.name} (${s.code})`), status, hinweise,
      h('div.eltern-zeile', [auswahl, h('button.knopf', { type: 'button', onclick: pruefen }, h('span.ico.klein.ico-lautsprecher', { 'aria-hidden': 'true' }), 'Ton prüfen')]), ergebnis);
  }

  /** Eine Zeile je Sprache für den Diagnosetext. */
  function zeilen(k) {
    return SPRACHEN.map(s => {
      const w = wunschVon(k, s.code), st = k.sprache.status(s.code, w);
      return `Stimme ${s.code}: ${st.ok ? `${st.stimme.name} (${st.stimme.lang}), Ausweichstufe ${st.stufe}${w ? ', gewählt' : ''}` : st.anzahl === 0 ? 'Liste nicht geladen' : 'keine'}`;
    });
  }

  function kachel(k) {
    const h = k.h, innen = h('div.eltern-inhalt');
    const zeichne = () => innen.replaceChildren(...SPRACHEN.map(s => zeile(k, s)));
    const lade = () => Promise.resolve(k.sprache.bereit()).then(() => { if (k.offen) zeichne(); });
    zeichne();
    lade();
    return k.kachel('Stimmen', h('p', 'Die Stimmen unterscheiden sich je Gerät. Die App wählt die beste vorhandene Stimme. Hier lässt sich eine andere wählen und der Ton prüfen.'), innen,
      h('div.eltern-zeile', h('button.knopf.leise', { type: 'button', onclick: lade }, 'Stimmen neu laden')));
  }

  L.ElternStimmen = { SPRACHEN, stimmenFuer, beschreibe, zeilen, kachel };
})(globalThis);
