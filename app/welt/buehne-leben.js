/* app/welt/buehne-leben.js: was sich auf der Bühne dauernd und ruhig bewegt (Umbauplan 3.3, Vorbild docs/mockup/richtung-a/a-leben.js): Lichtreflexe und
   Funkeln im Wasser, Schaumsaum, wiegende Bäume am Ufer, Boote (höchstens 3) und eines am Steg, Rauch an Produktionsgebäuden, Nebel um die ferne Insel,
   Wolken mit Schatten (höchstens 5), Vögel als Silhouetten ohne Gesicht (höchstens 4). Jedes bewegte Element trägt die Klasse amb, bewegt wird es nur
   über transform und opacity (Keyframes in app/stil/buehne.css). Zusammen bleiben es unter 60. ruhig und prefers-reduced-motion halten alles an (CSS).
     BuehneLeben.lebe(ebenen, modell, leben, doc) → Anzahl bewegter Elemente      BuehneLeben.rauch(ebene, modell, doc)      BuehneLeben.GRENZE */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const LB = (L.BuehneLeben = L.BuehneLeben || {});
  const GRENZE = { boote: 3, wolken: 5, voegel: 4, kamine: 3 }, STANDARD = { boote: 2, wolken: 3, voegel: 3 };
  const I = () => L.Iso;

  /** Anzahl je Art aus thema.leben, begrenzt auf GRENZE. */
  function anzahl(leben) {
    const aus = {};
    for (const n of Object.keys(STANDARD)) { const v = leben && Number.isInteger(leben[n]) ? leben[n] : STANDARD[n]; aus[n] = Math.max(0, Math.min(GRENZE[n], v)); }
    return aus;
  }
  const kind = (doc, eltern, klasse, css, html = '') => { const e = doc.createElement('i'); e.className = klasse; e.style.cssText = css; if (html) e.innerHTML = html; eltern.appendChild(e); return e; };
  const leere = e => { if (typeof e.replaceChildren === 'function') e.replaceChildren(); else e.innerHTML = ''; };
  const dauer = (token, k) => `animation-duration:calc(var(--${token}) * ${k})`;

  function lebe(eb, M, leben, doc) {
    const n = anzahl(leben), f = I().f, R = L.Land.rausch, P = I().punkt, k = M.umriss, b = M.box, zd = p => [p[0] - b.x0, p[1] - b.y0], mi = M.mitte;
    for (const e of [eb.reflexe, eb.schaum, eb.wiege, eb.boote, eb.nebel, eb.wolkenschatten, eb.wolken, eb.voegel]) leere(e);
    const nahLand = (x, y, r) => { const i = Math.floor((x / 64 + y / 32) / 2), j = Math.floor((y / 32 - x / 64) / 2); for (let a = -r; a <= r; a++) for (let c = -r; c <= r; c++) if (M.istLand(i + a, j + c)) return true; return false; };
    const ws = (k.x1 - k.x0) * .75, hs = (k.y1 - k.y0) * .75;

    // Lichtreflexe: lange, flache Striche in Isometrie-Richtung; Funkeln nahe der Küste
    const punkte = [];
    for (let q = 0; q < 4000 && punkte.length < 12; q++) {
      const x = mi[0] + (R(q, 7) - .5) * ws * 2.2, y = mi[1] + (R(q, 13) - .5) * hs * 2.2;
      if (!nahLand(x, y, 2) && !punkte.some(p => Math.abs(p[0] - x) < 220 && Math.abs(p[1] - y) < 110)) punkte.push([x, y, R(q, 3)]);
    }
    punkte.forEach(([x, y, r], i) => { const d = zd([x, y]); kind(doc, eb.reflexe, 'reflex amb', `left:${f(d[0])}px;top:${f(d[1])}px;width:${f(70 + r * 110)}px;animation-delay:-${(r * 9).toFixed(2)}s;${dauer('dauer-welle', (1.1 + (i % 5) * .15).toFixed(2))}`); });
    for (let q = 0, z = 0; q < 3000 && z < 5; q++) {
      const x = mi[0] + (R(q, 29) - .5) * ws * 1.4, y = mi[1] + (R(q, 31) - .5) * hs * 1.4;
      if (nahLand(x, y, 1) || !nahLand(x, y, 4)) continue;
      const d = zd([x, y]); kind(doc, eb.reflexe, 'funke amb', `left:${f(d[0])}px;top:${f(d[1])}px;animation-delay:-${(R(q, 37) * 9).toFixed(2)}s;${dauer('dauer-welle', (.85 + (z % 4) * .15).toFixed(2))}`); z++;
    }

    // Schaumsaum entlang der Wasserlinie, atmet leicht
    const rx0 = k.x0 - 40, ry0 = k.y0 - 40, rw = k.x1 - k.x0 + 80, rh = k.y1 - k.y0 + 120, BL = L.BuehneLand;
    const d = M.zuege.map(p => BL.pfad(p, M.DICKE)).join('') + M.zuege.map(p => BL.pfad(p)).join('');
    kind(doc, eb.schaum, 'schaum-saum amb', `left:${f(rx0 - b.x0)}px;top:${f(ry0 - b.y0)}px`,
      `<svg viewBox="${f(rx0)} ${f(ry0)} ${f(rw)} ${f(rh)}" width="${f(rw)}" height="${f(rh)}" aria-hidden="true"><path d="${d}" fill="none" stroke="${M.pal.weiss}" stroke-width="9" stroke-dasharray="34 22 12 26" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 4)"/></svg>`);

    // Wiegende Bäume am Ufer
    M.wiege.forEach((o, i) => {
      const q = P(o.x, o.y, 0), e = BL.stueck(doc, `<use href="#${M.pre}${o.art}" x="${f(q[0])}" y="${f(q[1])}"/>`, [q[0] - 44, q[1] - 124, q[0] + 44, q[1] + 18], b, 'baum-wiege amb');
      e.style.animationDelay = `-${(i * 1.7).toFixed(1)}s`; e.style.animationDuration = `calc(var(--dauer-wiege) * ${(1.1 + (i % 3) * .2).toFixed(1)})`;
      eb.wiege.appendChild(e);
    });

    // Boote: unterwegs zwischen zwei Wasserpunkten, eines am Steg
    const p = M.pal, boot = `<svg viewBox="-60 -70 120 100" width="120" height="100" aria-hidden="true">` + I().poly([[-34, 0], [0, 0], [0, 14], [-24, 14]], p.hole('papier')) +
      I().poly([[0, 0], [34, 0], [24, 14], [0, 14]], p.mix('papier', 'tinte', .14)) + `<path d="M0 0V-56" stroke="${p.hole('tinte-leise')}" stroke-width="2.6" stroke-linecap="round"/>` +
      I().poly([[0, -54], [-28, -6], [0, -6]], p.hole('flaeche')) + I().poly([[0, -46], [22, -6], [0, -6]], p.mix('papier', 'tinte', .1)) + I().poly([[0, -56], [12, -52], [0, -48]], p.hole('akzent')) + '</svg>';
    const kiel = `<svg class="kiel" viewBox="0 0 140 40" width="140" height="40" aria-hidden="true"><path d="M10 10q30 6 60 10M10 30q30 -6 60 -10" stroke="${p.weiss}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/></svg>`;
    const wege = [[[mi[0] + 520, k.y1 + 110], [mi[0] + 1180, k.y1 - 120]], [[k.x0 + 120, mi[1] - 330], [k.x0 - 420, mi[1] - 40]], [[k.x1 - 80, k.y0 - 40], [k.x1 + 420, mi[1] - 60]], [[mi[0] - 300, k.y1 + 260], [mi[0] - 900, k.y1 + 120]]];
    wege.filter(([a, z]) => !nahLand(a[0], a[1], 1) && !nahLand(z[0], z[1], 1)).slice(0, n.boote).forEach(([von, nach], i) => {
      const a = zd(von), z = zd(nach), zeit = `${dauer('dauer-boot', (2 + i * .2).toFixed(1))};animation-delay:-${20 + i * 11}s`;
      kind(doc, eb.boote, 'boot amb', `left:${f(a[0])}px;top:${f(a[1])}px;--dx:${f(z[0] - a[0])}px;--dy:${f(z[1] - a[1])}px;${zeit}`, `<div class="boot-rumpf amb${z[0] > a[0] ? '' : ' links'}" style="${zeit}">${kiel}${boot}</div>`);
    });
    if (M.orte.hafen && M.orte.hafen.boot) { const st = zd(P(...M.orte.hafen.boot, 0)); kind(doc, eb.boote, 'boot-fest', `left:${f(st[0])}px;top:${f(st[1])}px`, `<div class="schaukeln amb">${boot}</div>`); }

    // Nebel um die ferne Insel
    const nd = zd(M.fern);
    [[0, 0, 360, 1], [-120, -60, 240, .9], [130, 30, 260, .85]].forEach(([dx, dy, w, o]) => kind(doc, eb.nebel, 'nebel', `left:${f(nd[0] + dx - w / 2)}px;top:${f(nd[1] + dy - w * .22)}px;width:${w}px;height:${f(w * .44)}px;opacity:${o}`));

    // Wolken und ihre Schatten ziehen über die ganze Box
    [[-560, 1], [300, .8], [-80, .65], [620, .9], [-900, .75]].slice(0, n.wolken).forEach(([dy, gr], i) => {
      const d0 = zd([b.x0 - 600, mi[1] + dy]), zeit = `${dauer('dauer-wolke', (1.9 + i * .45).toFixed(2))};animation-delay:-${[60, 128, 20, 95, 150][i]}s`;
      kind(doc, eb.wolkenschatten, 'schatten amb', `left:${f(d0[0] + 170)}px;top:${f(d0[1] + 330)}px;--weg:${b.W + 1200}px;--gr:${gr};${zeit}`);
      kind(doc, eb.wolken, 'wolke amb', `left:${f(d0[0])}px;top:${f(d0[1])}px;--weg:${b.W + 1200}px;--gr:${gr};${zeit}`);
    });

    // Vögel: ein kleiner Schwarm als Silhouetten, quer über den Bildschirm
    if (n.voegel) {
      const schwarm = kind(doc, eb.voegel, 'schwarm amb', '');
      for (let i = 0; i < n.voegel; i++) kind(doc, schwarm, 'vogel', `left:${[0, 34, 14, 52][i]}px;top:${[0, 16, 34, 30][i]}px;transform:scale(${[1, .85, .75, .7][i]})`,
        `<b class="amb" style="animation-delay:-${(i * .22).toFixed(2)}s"><svg viewBox="0 0 26 12" width="26" height="12" aria-hidden="true"><path d="M1 9q6-8 12-1q6-7 12 1" fill="none" style="stroke:var(--vogel)" stroke-width="2.2" stroke-linecap="round"/></svg></b>`);
    }
    rauch(eb.rauch, M, doc);
    return zaehle(eb);
  }

  /** Rauch: drei Wölkchen je Kamin, höchstens drei Kamine (nur gebaute Gebäude mit Rolle produktion). */
  function rauch(ebene, M, doc) {
    leere(ebene);
    const kamine = [...M.plaetze.values()].map(({ e }) => e.kamin).filter(Boolean).slice(0, GRENZE.kamine);
    for (const [i, p] of kamine.entries()) for (let q = 0; q < 3; q++) kind(doc, ebene, 'puff amb', `left:${I().f(p[0] - M.box.x0)}px;top:${I().f(p[1] - M.box.y0)}px;animation-delay:${(-q * 1.6 - i * .7).toFixed(1)}s`);
    return kamine.length;
  }
  /** Bewegte Elemente in allen Ebenen (Klasse amb). */
  function zaehle(eb) {
    let n = 0;
    const lauf = e => {
      if (!e || e.nodeType !== 1) return;
      if (/\bamb\b/.test((e.getAttribute && e.getAttribute('class')) || '')) n++;
      const kinder = [...(e.children || [])];
      if (kinder.length) kinder.forEach(lauf);
      else if (typeof e.innerHTML === 'string') n += (e.innerHTML.match(/class="[^"]*\bamb\b/g) || []).length;   // ohne Browser bleibt innerHTML Text
    };
    for (const e of Object.values(eb)) lauf(e);
    return n;
  }

  Object.assign(LB, { lebe, rauch, anzahl, zaehle, GRENZE, STANDARD });
})(globalThis);
