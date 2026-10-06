/* app/lernsteuerung/sitzung.js: Tagesauftrag zusammenstellen (Architektur 6.4): Auswahl, Mischung, Runden und Zeitschätzung. Reine Funktionen.
   Kandidat: { key, thema, box, faellig, neu, letzteFalsch, bereit, braucht: [key] } in Modulreihenfolge. `thema` muss über Module hinweg eindeutig
   sein (L.Modell.themaKey). Optional trägt ein Kandidat `neuProTag` (aufgelöster Parameter seines Themas), dann kommen von diesem Thema
   höchstens so viele neue Aufgaben je Tag dran. Weitere Felder (modul, fach, typ ...) reichen die Funktionen unverändert durch.
   `bereit` gilt nur für neue Aufgaben (freigeschaltet, nicht «aus», schwierig genug). Wer Fälliges eines abgeschalteten Themas nicht
   üben lassen will, nimmt den Kandidaten gar nicht erst in die Liste auf. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  /** Tagesziel in Aufgaben: Zielminuten durch Sekunden je Aufgabe (12 Minuten bei 12 Sekunden sind 60 Aufgaben als Obergrenze). */
  const zielAufgaben = (R = L.lernregeln.sitzung) => Math.round(R.zielMinuten * 60 / R.sekProAufgabe);

  /** Geschätzte Dauer einer Aufgabe in Sekunden: gleitender Wert `ms` plus Rückmeldezeit, begrenzt. Ohne `ms` gilt `sekProAufgabe`. */
  function schaetzeSekunden(z, R = L.lernregeln.sitzung) {
    const S = R.schaetzung ?? L.lernregeln.sitzung.schaetzung;
    if (!z || !(z.ms > 0)) return R.sekProAufgabe;
    return Math.min(S.max, Math.max(S.min, z.ms / 1000 + S.rueckmeldeSek));
  }

  /**
   * Gleiches Thema nie in den letzten `minAbstand - 1` Positionen, solange es Alternativen gibt (Interleaving). `vorher` sind schon gesetzte
   * Aufgaben, vor denen es weitergeht. Wählt zufällig, ausser ein Thema würde sonst nicht mehr unterzubringen sein: dann kommt es jetzt dran.
   * Bei Abstand 2 steht deshalb nie ein Nachbar daneben, sobald das häufigste Thema höchstens die Hälfte (aufgerundet) der Aufgaben stellt.
   */
  function mischen(liste, rng, minAbstand = L.lernregeln.sitzung.minAbstandThema, vorher = []) {
    const rest = liste.slice(), aus = vorher.slice(), k = Math.max(1, minAbstand);
    while (rest.length) {
      const juengste = k > 1 ? aus.slice(-(k - 1)).map(x => x.thema) : [];
      const anzahl = new Map();
      rest.forEach(x => anzahl.set(x.thema, (anzahl.get(x.thema) || 0) + 1));
      let pool = rest.filter(x => !juengste.includes(x.thema));
      if (!pool.length) pool = rest;                                          // keine Alternative: der Abstand lässt sich nicht halten
      const eng = pool.filter(x => (anzahl.get(x.thema) - 1) * k + 1 >= rest.length);
      if (eng.length) { const m = Math.max(...eng.map(x => anzahl.get(x.thema))); pool = eng.filter(x => anzahl.get(x.thema) === m); }
      const x = pool[rng.int(pool.length)];
      aus.push(x);
      rest.splice(rest.indexOf(x), 1);
    }
    return aus.slice(vorher.length);
  }

  /** Ruhiger Einstieg: die `n` sichersten Aufgaben aus verschiedenen Themen, ohne eine, die zuletzt falsch war. */
  function aufwaermen(wiederholen, n) {
    const warm = [];
    for (const k of wiederholen.filter(x => !x.letzteFalsch).sort((a, b) => b.box - a.box)) {
      if (warm.length < n && !warm.some(w => w.thema === k.thema)) warm.push(k);
    }
    return warm;
  }

  /** Stelle im Gemischten, an der der Block neuer Aufgaben nach etwa einem Drittel der Sitzung steht, ohne Nachbarn gleichen Themas an den Nähten. */
  function einfuegestelle(warm, gemischt, block) {
    const gesamt = warm.length + gemischt.length + block.length;
    const wunsch = Math.min(gemischt.length, Math.max(0, Math.round(gesamt / 3) - warm.length));
    const links = i => (i > 0 ? gemischt[i - 1] : warm[warm.length - 1]), rechts = i => gemischt[i];
    const frei = i => (!links(i) || links(i).thema !== block[0].thema) && (!rechts(i) || rechts(i).thema !== block[block.length - 1].thema);
    for (let d = 0; d <= gemischt.length; d++) for (const i of [wunsch - d, wunsch + d]) if (i >= 0 && i <= gemischt.length && frei(i)) return i;
    return wunsch;
  }

  /** Reihenfolge einer Gruppe: Aufwärmen, gemischtes Wiederholen, dazwischen der Erstkontakt als Block je Thema. */
  function reihenfolge(wiederholen, neu, rng, R) {
    const warm = aufwaermen(wiederholen, R.aufwaermen);
    const gemischt = mischen(wiederholen.filter(k => !warm.includes(k)), rng, R.minAbstandThema, warm);
    const block = [...new Set(neu.map(k => k.thema))].flatMap(t => neu.filter(k => k.thema === t));
    if (!block.length) return [...warm, ...gemischt];
    const i = einfuegestelle(warm, gemischt, block);
    return [...warm, ...gemischt.slice(0, i), ...block, ...gemischt.slice(i)];
  }

  /**
   * Tagesauftrag: die Kandidaten in der Reihenfolge, in der sie drankommen, je mit `grund` ('faellig' | 'neu' | 'pruefung').
   * @param ziel     Tagesziel in Aufgaben (Standard: zielAufgaben)
   * @param quote    Trefferquote der letzten fälligen Abrufe (Statistik.quote) oder null. Sie bremst das Neue, solange Fälliges wackelt
   * @param pruefung null oder { themen, tageBis, neuErlaubt? } (Pruefungsplan.fuerHeute): Stoff ausserhalb des Umfangs rückt zurück
   * @param gruppe   optional: Funktion Kandidat → Schlüssel (zum Beispiel das Fach). Ausgewählt wird gemeinsam, gemischt aber je Gruppe, und die
   *                 Gruppen stehen hintereinander. So bleibt jede wählbare Runde der Ansicht «Lernen» in sich gemischt.
   * @param rng      Zufall mit Startwert, sonst einer aus Datum und Schlüsseln, damit «Sitzung neu laden» dieselbe Reihenfolge liefert
   */
  function plane({ kandidaten, heute, rng, ziel, quote = null, pruefung = null, regeln, gruppe = null }) {
    const R = regeln || L.lernregeln.sitzung, P = L.Pruefungsplan, Tag = L.Tag;
    ziel = ziel == null ? zielAufgaben(R) : ziel;
    rng = rng || L.Zufall.aus(['sitzung', heute, ...kandidaten.map(k => k.key)].join('|'));
    const imUmfang = k => !pruefung || P.imUmfang(pruefung.themen, k.thema);
    const basisBox = L.lernregeln.freischaltung.box, boxVon = new Map(kandidaten.map(k => [k.key, k.box]));
    const basisOk = k => (k.braucht || []).every(b => (boxVon.has(b) ? boxVon.get(b) : Infinity) >= basisBox);   // fremde Voraussetzungen sperren nicht

    const prio = k => Math.max(0, Tag.diff(heute, k.faellig)) + (k.letzteFalsch ? 5 : 0) + Math.max(0, 6 - k.box) - (imUmfang(k) ? 0 : 4);
    const faellig = kandidaten.filter(k => !k.neu && k.faellig <= heute).map(k => ({ k, p: prio(k) })).sort((a, b) => b.p - a.p)
      .map(({ k }) => ({ ...k, grund: pruefung && imUmfang(k) ? 'pruefung' : 'faellig' }));

    const rueckstau = faellig.length > R.rueckstauFaktor * ziel;
    const bremse = quote == null || quote >= R.quoteVoll ? 1 : quote >= R.quoteHalb ? 0.5 : 0;
    const neuOk = !pruefung || (pruefung.neuErlaubt !== undefined ? !!pruefung.neuErlaubt : P.neuErlaubt(pruefung.tageBis));
    const neuMax = rueckstau || !neuOk ? 0
      : Math.floor(bremse * Math.min(R.neuProTagMax, Math.max(0, ziel - faellig.length), Math.ceil(ziel * R.mix.neu)));
    const neu = [], proThema = new Map();
    for (const k of kandidaten) {
      if (neu.length >= neuMax) break;
      if (!k.neu || !k.bereit || !basisOk(k) || !imUmfang(k)) continue;
      if (Number.isFinite(k.neuProTag) && (proThema.get(k.thema) || 0) >= k.neuProTag) continue;
      proThema.set(k.thema, (proThema.get(k.thema) || 0) + 1);
      neu.push({ ...k, grund: 'neu' });
    }

    const wiederholen = faellig.slice(0, Math.max(0, ziel - neu.length));
    const gruppeVon = typeof gruppe === 'function' ? gruppe : () => '';
    return [...new Set(kandidaten.map(gruppeVon))].flatMap(s =>
      reihenfolge(wiederholen.filter(k => gruppeVon(k) === s), neu.filter(k => gruppeVon(k) === s), rng, R));
  }

  /**
   * Fasst Aufgaben gleichen Übungstyps zu Runden zusammen: { typ, items }. Bei `gruppierung: 'thema'` kommen auch weiter hinten stehende Aufgaben
   * desselben Themas dazu, sonst nur unmittelbar folgende. `eig(typ)` liefert { rundeMax, gruppierung } des Typs (ohne rundeMax gibt es keine Grenze).
   */
  function runden(items, eig) {
    const aus = [], genommen = new Set();
    items.forEach((k, i) => {
      if (genommen.has(i)) return;
      const e = { rundeMax: Infinity, gruppierung: 'beliebig', ...eig(k.typ) }, r = { typ: k.typ, items: [k] };
      genommen.add(i);
      for (let j = i + 1; j < items.length && r.items.length < e.rundeMax; j++) {
        if (genommen.has(j)) continue;
        const m = items[j];
        if (m.typ === k.typ && (e.gruppierung !== 'thema' || m.thema === k.thema)) { r.items.push(m); genommen.add(j); }
        else if (e.gruppierung !== 'thema') break;
      }
      aus.push(r);
    });
    return aus;
  }

  L.Sitzung = { plane, mischen, runden, schaetzeSekunden, zielAufgaben };
})(globalThis);
