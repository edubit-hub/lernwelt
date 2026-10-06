/* app/lauf/schleife.js: die Schleife über alle Pakete einer Runde (Architektur 5.2 und 5.4): Paket zeigen lassen, Ergebnisse verbuchen, Raten
   erkennen, Rückmeldung zeigen oder bis zum Ende sammeln, Bühne leeren. Dazu der Abschluss einer Probeprüfung. k ist der Zustand der Runde (lauf.js). */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const GNADE_MS = 150;                                  // so lange darf ein Übungstyp nach einem Abbruch noch antworten
  const RATEN_FOLGE = 3;                                 // so viele schnelle Fehler in Folge lösen den Hinweis «Lass dir Zeit» aus (5.4)

  /** Wartet auf den Typ. Kommt nach einem Abbruch innerhalb von GNADE_MS keine Antwort, gilt das Paket als nicht gemeldet. */
  function gegenAbbruch(signal, p) {
    if (signal.aborted) return Promise.resolve(null);
    let zeitgeber = null, ab;
    const wache = new Promise(ok => { ab = () => { zeitgeber = g.setTimeout(() => ok(null), GNADE_MS); }; signal.addEventListener('abort', ab, { once: true }); });
    return Promise.race([p, wache]).finally(() => { signal.removeEventListener('abort', ab); if (zeitgeber !== null) g.clearTimeout(zeitgeber); });
  }

  async function zeigePaket(k, paket) {
    const def = L.registry.typen.get(paket.typ);
    const ctx = L.Dienste.baue(paket, { buehne: k.buehne, signal: k.signal, modus: k.modus.modus, katalog: k.katalog, heute: k.heute, zeit: k.zeit });
    const erg = await gegenAbbruch(k.signal, Promise.resolve().then(() => def.zeige(ctx)));
    return Array.isArray(erg) ? erg : [];
  }

  const leere = k => { k.buehne.removeAttribute('inert'); k.buehne.replaceChildren(); };

  /** Arbeitet die Warteschlange ab, bis sie leer ist, die Runde abgebrochen wird oder der Zeitdeckel erreicht ist (dann bleibt der Rest fällig). */
  async function fuehreAus(k) {
    const { b, ablauf } = k, T = L.Rueckmeldung.texte;
    let schnell = 0;                                     // schnelle Fehler in Folge
    for (let paket = ablauf.naechstes(); paket && !k.signal.aborted; paket = ablauf.naechstes()) {
      if (k.maxMs && L.Dienste.jetzt() - k.t0 >= k.maxMs) { b.zeitdeckel = true; break; }
      k.fortschritt.textContent = T.fortschritt(paket.art, Math.min(k.gesehen.size + 1, k.gesamt), k.gesamt);
      k.zeitbuchen();
      L.Verbuchen.merkeStand(k, paket);
      let ergebnisse;
      try { ergebnisse = await zeigePaket(k, paket); } catch (fehler) {
        b.fehler.push({ typ: paket.typ, grund: String((fehler && fehler.message) || fehler) });
        if (L.Fehlerlog) L.Fehlerlog.melde(fehler, { art: 'fehler' });
        leere(k);
        continue;
      }
      if (ergebnisse.length || !k.signal.aborted) b.pakete += 1;      // ein abgebrochenes Paket ohne Ergebnis zählt nicht
      for (const e of ergebnisse) { const v = L.Verbuchen.ergebnis(k, paket, e); if (v) schnell = v.raten ? schnell + 1 : 0; }
      L.Verbuchen.meldeThemen(k, paket);
      if (k.signal.aborted) { leere(k); break; }
      const hinweis = schnell >= RATEN_FOLGE;
      if (hinweis) schnell = 0;                          // der Hinweis kommt erst nach drei weiteren schnellen Fehlern wieder
      if (k.modus.sammelt || L.registry.typen.get(paket.typ).eigenschaften.rueckmeldung === 'am-ende') {
        k.sammlung.ergebnisse.push(...ergebnisse); k.sammlung.aufgaben.push(...paket.aufgaben); Object.assign(k.sammlung.info, k.info);
      } else {
        k.buehne.setAttribute('inert', '');              // Markierungen des Typs bleiben sichtbar, antippen geht nicht mehr
        await L.Rueckmeldung.zeige(k.rueck, paket, ergebnisse, { hinweisZeitNehmen: hinweis, info: k.info, signal: k.signal });
      }
      leere(k);                                          // 5.2 Schritt 7: danach leert der Lauf die Bühne
    }
  }

  /** Fasst die Probeprüfung zusammen, trägt sie im Modulzustand ein und sendet lern:pruefung. */
  function schliessePruefung(k) {
    const p = k.plan.pruefung;
    const titel = t => { try { return k.katalog.thema(p.modul, t).titel; } catch (fehler) { return t; } };
    const r = k.b.pruefung = L.Bericht.wertePruefung(k, titel);
    k.z.trageSimulationEin(p.modul, { tag: k.heute, art: r.art, punkte: r.punkte, max: r.max, proTeil: r.proTeil, proThema: r.proThema, fehler: r.fehler });
    L.bus.emit('lern:pruefung', { modul: p.modul, art: r.art, punkte: r.punkte, max: r.max, proTeil: r.proTeil });
  }

  L.Schleife = { fuehreAus, schliessePruefung, GNADE_MS, RATEN_FOLGE };
})(globalThis);
