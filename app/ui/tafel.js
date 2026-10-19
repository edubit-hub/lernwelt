/* app/ui/tafel.js: die Tafel, eine Fläche aus hellem Glas über der Bühne (docs/gestaltung-umbau.md 2.1 und 3.2, Vorbild docs/mockup/richtung-a/a-tafeln.css).
     Lernwelt.Tafel.oeffne(wurzel, { art: 'seite'|'halb'|'schmal'|'blatt'|'buch'|'karte', kicker?, titel?, schliessen?: fn, klasse?, schliessenText? })
       → { el, kopf, rumpf, fuss, setzeTitel(kicker, titel), schliesse() → Promise }
     Lernwelt.Tafel.hoch() → true im Hochformat: dort wird jede Art zum Blatt von unten (tafel.css).
     Lernwelt.Tafel.melder(fn) meldet nach jedem Öffnen und Schliessen die belegte Fläche { rechts, unten } in Pixeln (oder null), damit die Kamera
     der Bühne den Ort in den freien Teil rückt. Gemessen wird die Lage im Layout, also schon während des Hereingleitens die Endlage. Tafel.melde()
     meldet von aussen neu (eine Welt-Tafel klappt ein oder kommt zurück). Die Hülle setzt den Melder, die Tafel kennt weder Bühne noch Zustand (Kern-Schicht).
   Rein und raus gleitet sie über eine Klasse (.an) und die Übergänge in tafel.css (--dauer-tafel, bei weniger Bewegung nur Einblenden).
   Ohne requestAnimationFrame (Node-Tests) steht sie sofort und verschwindet sofort. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const ARTEN = ['seite', 'halb', 'schmal', 'blatt', 'buch', 'karte'];
  const offen = new Set();
  let melder = null;
  const H = (...a) => L.ui.h(...a);

  /** Hochformat nach Seitenverhältnis des Fensters, sonst über die Medienabfrage. */
  function hoch() {
    const w = g.innerWidth, h = g.innerHeight;
    if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) return h > w;
    try { return !!(g.matchMedia && g.matchMedia('(orientation: portrait)').matches); } catch (e) { return false; }
  }

  /** Lage im Layout (ohne das Gleiten über transform): offsetLeft/offsetTop über die Kette der offsetParent, sonst getBoundingClientRect. */
  function lage(el) {
    if (typeof el.offsetLeft === 'number' && el.offsetWidth) {
      let x = 0, y = 0;
      for (let n = el; n; n = n.offsetParent) { x += n.offsetLeft || 0; y += n.offsetTop || 0; }
      return { left: x, top: y, width: el.offsetWidth };
    }
    return typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
  }

  /** Offene Tafeln ohne die eingeklappten. */
  const sichtbar = () => [...offen].filter(el => !(el.classList && el.classList.contains('eingeklappt')));

  /** Belegte Fläche aller offenen Tafeln: rechts (quer) oder unten (hoch), gemessen am Fenster in der Lage nach dem Hereingleiten.
      Eine eingeklappte Tafel belegt nichts. Ohne Layout (Node) null. */
  function flaeche() {
    const da = sichtbar();
    if (!da.length) return { rechts: 0, unten: 0 };
    const breite = g.innerWidth, hoehe = g.innerHeight;
    let rechts = 0, unten = 0, gemessen = false;
    for (const el of da) {
      if (!breite) continue;
      const r = lage(el);
      if (!r || !r.width) continue;
      gemessen = true;
      if (hoch()) unten = Math.max(unten, hoehe - r.top); else rechts = Math.max(rechts, breite - r.left);
    }
    return gemessen ? { rechts: Math.round(rechts), unten: Math.round(unten) } : null;
  }

  function melde() {
    if (typeof melder !== 'function') return;
    try { melder(flaeche(), offen.size); } catch (e) { /* die Kamera ist Zugabe */ }
  }

  /** Zwei Bilder später, damit der Übergang vom Ausgangszustand startet. Ohne requestAnimationFrame sofort. */
  const spaeter = fn => (typeof g.requestAnimationFrame === 'function' ? g.requestAnimationFrame(() => g.requestAnimationFrame(fn)) : fn());

  function oeffne(wurzel, opt = {}) {
    const art = ARTEN.includes(opt.art) ? opt.art : 'seite';
    const kickerEl = H('p.kicker'), titelEl = H('h2.tafel-titel');
    const schliessen = typeof opt.schliessen === 'function'
      ? H('button.tafel-schliessen', { type: 'button', 'aria-label': opt.schliessenText || 'Schliessen', onclick: () => opt.schliessen() }, H('span.ico.ico-schliessen', { 'aria-hidden': 'true' })) : '';
    const kopf = H('header.tafel-kopf', H('div.tafel-kopftext', kickerEl, titelEl), schliessen);
    const rumpf = H('div.tafel-rumpf'), fuss = H('div.tafel-fuss');
    const el = H(`aside.tafel.tafel-${art}${opt.klasse ? `.${String(opt.klasse).trim().split(/\s+/).join('.')}` : ''}`, H('div.tafel-griff', { 'aria-hidden': 'true' }), kopf, rumpf, fuss);
    let zu = false;

    function setzeTitel(kicker, titel) {
      kickerEl.textContent = kicker || ''; titelEl.textContent = titel || '';
      kickerEl.hidden = !kicker; titelEl.hidden = !titel;
      if (titel || kicker) el.setAttribute('aria-label', titel || kicker); else el.removeAttribute('aria-label');
    }
    setzeTitel(opt.kicker, opt.titel);

    wurzel.append(el);
    offen.add(el);
    if (L.Klang && typeof L.Klang.spiele === 'function') { try { L.Klang.spiele('tafel'); } catch (e) { /* still */ } }
    spaeter(() => { if (!zu) { el.classList.add('an'); melde(); } });
    if (typeof g.requestAnimationFrame === 'function') melde();

    /** Gleitet hinaus und entfernt die Tafel. Mehrfaches Schliessen ist harmlos. */
    function schliesse() {
      if (zu) return Promise.resolve();
      zu = true;
      offen.delete(el);
      el.classList.remove('an');
      melde();
      if (typeof g.requestAnimationFrame !== 'function' || typeof g.setTimeout !== 'function') { el.remove(); return Promise.resolve(); }
      return new Promise(fertig => {
        let weg = false;
        const ende = () => { if (weg) return; weg = true; el.remove(); fertig(); };
        el.addEventListener('transitionend', e => { if (!e || e.target === el) ende(); });
        g.setTimeout(ende, 700);                              // Sicherung, falls kein Übergang läuft (weniger Bewegung, verborgenes Fenster)
      });
    }

    return { el, kopf, rumpf, fuss, setzeTitel, schliesse };
  }

  L.Tafel = { oeffne, hoch, flaeche, melde, offen: () => sichtbar().length, melder: fn => { melder = typeof fn === 'function' ? fn : null; } };
})(globalThis);
