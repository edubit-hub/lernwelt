/* app/ui/effekte.js: Ereigniseffekte (Umbauplan 3.4, E-18), generisch, ohne Wissen über Welt, Zustand oder Lauf. Alles über die Web
   Animations API (nur transform und opacity), damit sich jeder Moment über document.getAnimations() einfrieren lässt. Jede Funktion
   endet nach höchstens 1200 ms, nichts blockiert die Eingabe (Flugebene mit pointer-events: none), höchstens 60 Partikel zugleich
   (die Funktion kürzt), will-change nur während der Animation. Ohne el.animate gilt sofort der Endzustand, bei prefers-reduced-motion
   wird jeder Effekt ein kurzes Einblenden in --dauer. Aussehen der erzeugten Teile: app/stil/effekte.css. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const GRENZE = 1200, PARTIKEL = 60, HAKEN_LAENGE = 15;     // Länge des Hakenstrichs im viewBox 24 (stroke-dasharray)
  const KURVE = 'cubic-bezier(.45,.05,.35,1)', RAUS = 'cubic-bezier(.2,.8,.2,1)', SVG = 'http://www.w3.org/2000/svg';
  let ebene = null, lebend = 0;
  const fertig = () => Promise.resolve();
  const f = n => (Math.round(n * 10) / 10).toString();
  const doc = () => g.document || null;
  const kann = el => !!el && typeof el.animate === 'function';
  const zahl = (x, standard) => (typeof x === 'number' && isFinite(x) ? x : standard);
  const begrenze = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const attr = (el, a) => { Object.entries(a).forEach(([k, v]) => el.setAttribute(k, v)); return el; };

  /** true bei prefers-reduced-motion. */
  const wenig = () => { try { return !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  /** --dauer aus den Tokens in ms (Rückfall 180). */
  function kurz() {
    try {
      const d = doc(), m = /([\d.]+)\s*(ms|s)?/.exec(d && g.getComputedStyle ? g.getComputedStyle(d.documentElement).getPropertyValue('--dauer') : '');
      if (m) return begrenze(m[2] === 's' ? +m[1] * 1000 : +m[1], 0, GRENZE);
    } catch (e) { /* Rückfall */ }
    return 180;
  }

  /** Startet eine Animation innerhalb der Grenze. Das Promise lehnt nie ab, auch nicht bei cancel(). */
  function spiel(el, bilder, opt) {
    if (!kann(el)) return fertig();
    const o = Object.assign({ fill: 'backwards', easing: KURVE }, opt);
    o.delay = begrenze(zahl(o.delay, 0), 0, GRENZE);
    o.duration = begrenze(zahl(o.duration, 0), 0, GRENZE - o.delay);
    const st = el.style, vorher = st ? st.willChange : '';
    let a;
    try { if (st) st.willChange = 'transform, opacity'; a = el.animate(bilder, o); } catch (e) { if (st) st.willChange = vorher || ''; return fertig(); }
    const ende = () => { if (st) st.willChange = vorher || ''; };
    return Promise.resolve(a && a.finished).then(ende, ende);
  }
  const einblenden = (el, von = 0) => spiel(el, [{ opacity: von }, { opacity: 1 }], { duration: kurz(), easing: 'ease-out' });
  // ---- Ebene und Partikel -----------------------------------------------------------------------------------------
  /** Die Hülle meldet ihre div.flug-ebene. Sie fängt nie eine Berührung. */
  function setzeEbene(el) {
    ebene = el || null;
    if (ebene && ebene.setAttribute) { ebene.setAttribute('aria-hidden', 'true'); ebene.style.pointerEvents = 'none'; }
    return ebene;
  }
  const frei = n => Math.max(0, Math.min(n, PARTIKEL - lebend));
  /** Erzeugt ein Teil in wurzel (Standard: die Flugebene) und zählt es; weg() entfernt es wieder. */
  function teil(klasse, wurzel = ebene) {
    const d = doc();
    if (!d || !wurzel) return null;
    const el = attr(d.createElement('div'), { class: klasse, 'aria-hidden': 'true' });
    wurzel.appendChild(el); lebend += 1;
    return el;
  }
  function weg(el) { if (el && !el.effektWeg) { el.effektWeg = true; lebend = Math.max(0, lebend - 1); if (el.parentNode) el.parentNode.removeChild(el); } }

  // ---- Lage auf dem Bildschirm ------------------------------------------------------------------------------------
  function versatz() { return ebene && typeof ebene.getBoundingClientRect === 'function' ? ebene.getBoundingClientRect() : { left: 0, top: 0 }; }
  function rechteck(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return null;
    const r = el.getBoundingClientRect(), o = versatz();
    return { x: r.left - o.left, y: r.top - o.top, b: r.width, h: r.height };
  }
  /** Element oder { x, y } (Bildschirm) → Punkt in der Flugebene. */
  function punkt(x) {
    if (x && !x.nodeType && typeof x.x === 'number' && typeof x.y === 'number') { const o = versatz(); return { x: x.x - o.left, y: x.y - o.top }; }
    const r = rechteck(x);
    return r ? { x: r.x + r.b / 2, y: r.y + r.h / 2 } : null;
  }
  /** Lage (und auf Wunsch Grösse) eines erzeugten Teils in px. */
  const setzeLage = (el, x, y, b, h = b) => Object.assign(el.style, { left: f(x) + 'px', top: f(y) + 'px' }, b === undefined ? {} : { width: f(b) + 'px', height: f(h) + 'px' });

  // ---- Flug: app/ui/effekte-flug.js (nutzt die Werkzeuge unten über Effekte.werkzeug) ------------------------------------

  // ---- Zahlen und Plaketten ---------------------------------------------------------------------------------------
  /** Zahl zählt weich. Der Verlauf hängt an einer Animation, damit eingefrorene Aufnahmen die passende Zahl zeigen. */
  function zaehle(el, von, bis, opt = {}) {
    if (!el) return fertig();
    const format = typeof opt.format === 'function' ? opt.format : String, dauer = begrenze(zahl(opt.dauer, 600), 0, GRENZE);
    const setze = w => { el.textContent = format(Math.round(w)); };
    if (wenig() || !kann(el) || !dauer) { setze(bis); return fertig(); }
    let a;
    try { a = el.animate([{}, {}], { duration: dauer }); } catch (e) { setze(bis); return fertig(); }
    const naechstes = g.requestAnimationFrame ? fn => g.requestAnimationFrame(fn) : fn => setTimeout(fn, 16);
    const schritt = () => {                                 // läuft, solange die Animation läuft oder angehalten ist
      if (a.playState === 'idle' || a.playState === 'finished' || el.isConnected === false) return;
      const p = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().progress : null;
      setze(von + (bis - von) * (1 - Math.pow(1 - (p || 0), 3)));
      naechstes(schritt);
    };
    setze(von); schritt();
    return Promise.resolve(a.finished).then(() => setze(bis), () => setze(bis));
  }
  /** Teil über einem Element: in der Flugebene an dessen Lage (r), ohne Ebene im Element selbst (Klasse <basis>-innen, r null). */
  function ueber(el, klassen, basis) {
    const r = rechteck(el), imEl = !(kann(ebene) && r);
    if (!el || !kann(imEl ? el : ebene) || !frei(1)) return null;
    const s = teil(klassen + (imEl ? ` ${basis}-innen` : ''), imEl ? el : ebene);
    return s ? { s, r: imEl ? null : r } : null;
  }
  /** Kleine Marke «−10» oder «+8» an einem Element (Pille). minus fällt ab, plus steigt auf. Am Ende ist sie weg. */
  function plakette(el, text, opt = {}) {
    const art = opt && opt.art === 'minus' ? 'minus' : 'plus', u = ueber(el, `fx-plakette fx-plakette-${art}`, 'fx-plakette');
    if (!u) return fertig();
    const { s: p, r } = u;
    p.textContent = String(text);
    if (r) setzeLage(p, r.x + r.b - 8, art === 'minus' ? r.y + r.h : r.y + 4);
    const y = v => `${r ? 'translate(-50%, -50%) ' : ''}translateY(${v}px)`;
    const [an, halt, ab] = art === 'minus' ? [-6, 4, 28] : [8, -2, -12];      // plus steigt nur wenig, die Pille steht am oberen Rand
    const bilder = wenig() ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
      : [{ opacity: 0, transform: y(an) + ' scale(.6)' }, { opacity: 1, transform: y(0) + ' scale(1.08)', offset: 0.18 }, { opacity: 1, transform: y(halt) + ' scale(1)', offset: 0.6 }, { opacity: 0, transform: y(ab) + ' scale(.95)' }];
    return spiel(p, bilder, { duration: wenig() ? GRENZE : 1100, fill: 'both', easing: 'ease-out' }).then(() => weg(p));
  }

  /** Ein kurzer Satz an einem Ort der Bühne (Bildschirmpunkt { x, y }), etwa «Turm gebaut.» über dem Bauplatz (Nachbesserung 2). Steigt wenig, steht, verblasst. */
  function ortText(p, text, opt = {}) {
    const q = punkt(p);                                                      // null: nicht gezeigt (keine Ebene), der Aufrufer meldet den Satz dann selbst
    if (!q || !kann(ebene) || !frei(1)) return null;
    const s = teil('fx-plakette fx-ortstext' + (opt && opt.warm ? ' warm' : ''));
    if (!s) return null;
    s.textContent = String(text); setzeLage(s, q.x, q.y);
    const y = v => `translate(-50%, -100%) translateY(${v}px)`;
    const bilder = wenig() ? [{ opacity: 0, transform: y(0) }, { opacity: 1, transform: y(0), offset: 0.1 }, { opacity: 1, transform: y(0), offset: 0.85 }, { opacity: 0, transform: y(0) }]
      : [{ opacity: 0, transform: y(10) }, { opacity: 1, transform: y(0), offset: 0.12 }, { opacity: 1, transform: y(-4), offset: 0.85 }, { opacity: 0, transform: y(-10) }];
    return spiel(s, bilder, { duration: 2200, fill: 'both', easing: 'ease-out' }).then(() => weg(s));   // Lesetext, kein Ereigniseffekt: er muss lesbar stehen bleiben
  }

  // ---- Kleine Effekte an Elementen (fill: none, damit eigene Transformationen und :active danach wieder gelten) ------------
  const kurzBewegt = (bilder, dauer, easing, ruhig) => el => (wenig() ? einblenden(el, ruhig) : spiel(el, bilder.map(t => ({ transform: t })), { duration: dauer, easing, fill: 'none' }));
  /** Kurzer Stoss (Ankunft an der Pille). */
  const stoss = kurzBewegt(['scale(1)', 'scale(1.08)', 'scale(1)'], 320, RAUS, 0.5);
  /** Sanftes Wackeln bei einem Fehler: drei Ausschläge in 0,4 s, kein Rot. */
  const wackle = kurzBewegt(['translateX(0)', 'translateX(-8px)', 'translateX(6px)', 'translateX(-3px)', 'translateX(0)'], 400, 'ease-out', 0.6);
  /** 3D-Druck auf Befehl (sonst macht das CSS :active). */
  const druecke = kurzBewegt(['translateY(0)', 'translateY(3px)', 'translateY(0)'], 220, RAUS, 0.7);

  /** Kurzes Aufleuchten über einem Element. opt.art: ok (Standard), akzent oder warm. */
  function leuchte(el, opt = {}) {
    const art = ['akzent', 'warm'].includes(opt && opt.art) ? opt.art : 'ok', u = ueber(el, `leuchten leuchten-${art}`, 'leuchten');
    if (!u) return fertig();
    const { s, r } = u;
    if (r) setzeLage(s, r.x, r.y, r.b, r.h);
    return spiel(s, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: wenig() ? 2 * kurz() : 650, easing: 'ease-out', fill: 'both' }).then(() => weg(s));
  }

  /** Lichtpuls: ein weicher Ring wächst aus der Mitte des Elements und verblasst (Freischaltung). opt.warm für «neu möglich». */
  function puls(el, opt = {}) {
    const p = el && !el.nodeType ? punkt(el) : null, r = p ? { x: p.x - 36, y: p.y - 36, b: 72, h: 72 } : rechteck(el);   // auch an einem Punkt { x, y } (Bauplatz auf der Bühne)
    if (!el || !r || !kann(ebene) || !frei(1)) return wenig() && el && el.nodeType ? einblenden(el, 0.5) : fertig();
    const ring = teil('puls-ring' + (opt && opt.warm ? ' warm' : ''));
    const gr = begrenze(Math.max(r.b, r.h) + 24, 48, 240);
    setzeLage(ring, r.x + r.b / 2 - gr / 2, r.y + r.h / 2 - gr / 2, gr);
    const bilder = wenig() ? [{ opacity: 0 }, { opacity: 0.8, offset: 0.4 }, { opacity: 0 }]
      : [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 0.9, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.7)' }];
    return spiel(ring, bilder, { duration: wenig() ? 2 * kurz() : 720, easing: 'ease-out', fill: 'both' }).then(() => weg(ring));
  }

  /** Häkchen zeichnet sich im Element (bleibt stehen). opt.ecke setzt es an die Ecke oben rechts. */
  function haken(el, opt = {}) {
    const d = doc();
    if (!el || !d || typeof d.createElementNS !== 'function') return fertig();
    (el.children ? [...el.children] : []).filter(k => /\bhaken-zeichen\b/.test(k.getAttribute && k.getAttribute('class') || '')).forEach(k => el.removeChild(k));
    const svg = attr(d.createElementNS(SVG, 'svg'), { class: 'haken-zeichen' + (opt && opt.ecke ? ' haken-ecke' : ''), viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    const strich = attr(d.createElementNS(SVG, 'path'), { class: 'haken-strich', d: 'M7 12.4l3.3 3.3L17.2 8.8' });
    svg.appendChild(attr(d.createElementNS(SVG, 'circle'), { class: 'haken-grund', cx: '12', cy: '12', r: '11' }));
    svg.appendChild(strich);
    el.appendChild(svg);
    if (wenig()) return einblenden(svg);
    return Promise.all([
      spiel(svg, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.06)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, easing: RAUS }),
      spiel(strich, [{ strokeDashoffset: HAKEN_LAENGE }, { strokeDashoffset: 0 }], { duration: 400, delay: 140, easing: 'cubic-bezier(.4,0,.2,1)' })
    ]).then(() => undefined);
  }

  /** Ein Siegel liegt kurz über dem Element und bricht in zwei Hälften auf, ein Ring läuft aus, das Element tritt hervor. */
  function siegel(el) {
    const r = rechteck(el);
    if (!el) return fertig();
    if (wenig()) return einblenden(el, 0.4);
    const hervor = () => spiel(el, [{ transform: 'scale(.9)', opacity: 0.5 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: 300, easing: RAUS });
    if (!r || !kann(ebene) || frei(4) < 4) return hervor();
    const gr = begrenze(Math.min(r.b, r.h) || 56, 40, 120), huelle = teil('siegel-effekt');
    setzeLage(huelle, r.x + r.b / 2 - gr / 2, r.y + r.h / 2 - gr / 2, gr);
    const teile = ['siegel-haelfte links', 'siegel-haelfte rechts', 'siegel-ring'].map(k => teil(k, huelle));
    const auf = s => [{ opacity: 0, transform: 'scale(.9)', easing: RAUS }, { opacity: 1, transform: 'none', offset: 0.25 }, { opacity: 1, transform: 'none', offset: 0.4, easing: RAUS },
      { opacity: 0, transform: `translate(${s * 45}%, 10%) rotate(${s * 38}deg)` }];        // erst liegt das Siegel, dann bricht es auf
    return Promise.all([
      spiel(teile[0], auf(-1), { duration: 760, easing: 'linear', fill: 'both' }),
      spiel(teile[1], auf(1), { duration: 760, easing: 'linear', fill: 'both' }),
      spiel(teile[2], [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 0.9, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: 'scale(1.9)' }], { duration: 600, delay: 340, easing: 'ease-out', fill: 'both' }),
      hervor()
    ]).then(() => { teile.forEach(weg); weg(huelle); });
  }

  /** Eckige Splitter um (x, y) in der Ebene wurzel (Staub beim Bauen, Funken beim Freischalten). Keine bei wenig Bewegung. */
  function splitter(wurzel, x, y, opt = {}) {
    if (!kann(wurzel) || wenig()) return fertig();
    const art = opt && opt.art === 'funken' ? 'funken' : 'staub', n = frei(begrenze(Math.floor(zahl(opt && opt.anzahl, 8)), 0, PARTIKEL));
    const weit = zahl(opt && opt.weit, 70), laeufe = [];
    for (let i = 0; i < n; i++) {
      const s = teil(`partikel partikel-${art}` + (i % 2 ? ' dunkel' : ''), wurzel);
      if (!s) break;
      const w = (i / n) * Math.PI * 2 + 0.35, gr = 6 + (i % 3) * 3, r = weit * (0.7 + (i % 3) * 0.2), rot = (i % 2 ? 1 : -1) * (90 + i * 25);
      const dx = Math.cos(w) * r, dy = art === 'funken' ? Math.sin(w) * r * 0.8 - 20 : Math.sin(w) * r * 0.45;
      setzeLage(s, x - gr / 2, y - gr / 2, gr);
      laeufe.push(spiel(s, [{ transform: 'translate(0, 0) rotate(0deg) scale(.6)', opacity: 0 },
        { transform: `translate(${f(dx * 0.5)}px, ${f(dy * 0.5 - 18)}px) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${f(dx)}px, ${f(dy - 4)}px) rotate(${rot}deg) scale(.7)`, opacity: 0 }],
      { duration: 560, delay: (i % 3) * 30, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).then(() => weg(s)));
    }
    return Promise.all(laeufe).then(() => undefined);
  }

  /** Beendet laufende Effekte einer Art in der Flugebene sofort, etwa das Aufleuchten, wenn die Runde zum Abschluss weitergeht. */
  function beende(art) { for (const s of [...((ebene && ebene.children) || [])].filter(n => n.classList && n.classList.contains(art))) { try { s.getAnimations().forEach(a => a.cancel()); } catch (e) { /* ohne Animation */ } weg(s); } }

  // Object.assign: der Flug (effekte-flug.js) hängt sich unabhängig von der Ladereihenfolge an dasselbe Objekt
  const werkzeug = { spiel, teil, weg, punkt, versatz, frei, einblenden, wenig, kann, begrenze, zahl, f, ebene: () => ebene, GRENZE };
  L.Effekte = Object.assign(L.Effekte || {}, { wenig, setzeEbene, zaehle, plakette, ortText, stoss, wackle, leuchte, puls, haken, siegel, splitter, druecke, beende, partikel: () => lebend, GRENZE, PARTIKEL, werkzeug });
})(globalThis);
