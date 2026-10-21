/* app/pruefung/inhalt-inseln.js: Prüfung eines Welt-Themas der Art «inseln» (Fachinseln, Plan 0.2). pruefeWelt ruft sie für art: 'inseln' auf.
   Geprüft: ID und Titel, je Fach eine Insel (math, de, en, nmg) mit Name und Kultur, Areale auf den sechs festen Plätzen ohne Doppel, jedes Areal mit
   Name, Schild (eine oder zwei Zeilen), Text und Inhalt in der Form «modul», «modul/thema» oder «modul/anfang*», die Erweiterung auf ihrem eigenen Platz.
   Nennt ein Inhalt ein registriertes Modul, muss es zum Fach passen und das genannte Thema haben. Dazu die Texte (Eszett, Stoppwörter).
   Lernwelt.Pruefung.pruefeInseln(welt, ctx) → [{ stufe: 'fehler', ort, text, regel }]. Die Datei hängt beim Laden von keiner anderen ab. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const P = (L.Pruefung = L.Pruefung || {});

  const INSELN = { mathe: 'math', deutsch: 'de', englisch: 'en', nmg: 'nmg' };
  const PLAETZE = ['zahlen', 'rechnen', 'messen', 'garten', 'hafen', 'turm'], ERWEITERUNG = 'brueche';
  const INHALT = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*\*?)?$/;
  const FARBE = /^#[0-9a-f]{6}$/i;
  const text = v => typeof v === 'string' && v.trim() !== '';
  const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const schild = v => Array.isArray(v) && v.length >= 1 && v.length <= 2 && v.every(z => text(z) && z.length <= 18);

  function pruefeInseln(welt, ctx = {}) {
    const R = [], f = (ort, t, regel = 'welt') => R.push({ stufe: 'fehler', ort, text: t, regel });
    if (!text(welt.id) || (P.ID && !P.ID.test(welt.id))) f('id', `«${welt.id}» passt nicht zum Muster ${P.ID}`);
    if (!text(welt.titel)) f('titel', 'Text fehlt');
    const module = L.registry ? L.registry.module : new Map();
    const faecher = Array.isArray(welt.faecher) ? welt.faecher : [];
    if (!faecher.length) f('faecher', 'Liste mit mindestens einem Fach erwartet');
    const gesehen = new Set();
    faecher.forEach((fa, i) => {
      const ort = `faecher[${i}]`;
      if (!objekt(fa)) { f(ort, 'Objekt erwartet'); return; }
      if (!Object.hasOwn(INSELN, fa.fach)) { f(`${ort}.fach`, `erwartet eines von ${Object.keys(INSELN).join(', ')}`); return; }
      if (gesehen.has(fa.fach)) f(`${ort}.fach`, `Fach «${fa.fach}» doppelt`);
      gesehen.add(fa.fach);
      if (fa.insel !== INSELN[fa.fach]) f(`${ort}.insel`, `für ${fa.fach} erwartet «${INSELN[fa.fach]}» (Landschaftsprofil)`);
      for (const k of ['name', 'kultur']) if (!text(fa[k])) f(`${ort}.${k}`, 'Text fehlt');
      if (fa.farbe !== undefined && !(objekt(fa.farbe) && FARBE.test(fa.farbe.kante) && FARBE.test(fa.farbe.tinte))) f(`${ort}.farbe`, 'erwartet { kante, tinte } als #rrggbb');
      const plaetze = new Set();
      (Array.isArray(fa.areale) ? fa.areale : []).forEach((a, j) => {
        const o = `${ort}.areale[${j}]`;
        if (!objekt(a)) { f(o, 'Objekt erwartet'); return; }
        if (!PLAETZE.includes(a.platz)) f(`${o}.platz`, `erwartet einen der Plätze ${PLAETZE.join(', ')}`);
        else if (plaetze.has(a.platz)) f(`${o}.platz`, `Platz «${a.platz}» doppelt`);
        plaetze.add(a.platz);
        for (const k of ['name', 'text']) if (!text(a[k])) f(`${o}.${k}`, 'Text fehlt');
        if (!schild(a.schild)) f(`${o}.schild`, 'eine oder zwei Zeilen mit höchstens 18 Zeichen erwartet');
        if (!Array.isArray(a.inhalt) || !a.inhalt.length) { f(`${o}.inhalt`, 'mindestens ein Eintrag erwartet'); return; }
        a.inhalt.forEach((e, k) => {
          if (typeof e !== 'string' || !INHALT.test(e)) { f(`${o}.inhalt[${k}]`, `«${e}» passt nicht zu «modul», «modul/thema» oder «modul/anfang*»`); return; }
          const [mid, rest] = e.split('/'), m = module.get(mid);
          if (!m) return;                                                  // ein Modul, das hier nicht geladen ist, prüft der volle Lauf
          if (m.fach !== fa.fach) f(`${o}.inhalt[${k}]`, `Modul «${mid}» gehört zum Fach ${m.fach}`);
          const themen = (m.themen || []).map(t => t.id);
          if (rest && !rest.endsWith('*') && !themen.includes(rest)) f(`${o}.inhalt[${k}]`, `Modul «${mid}» hat kein Thema «${rest}»`);
          if (rest && rest.endsWith('*') && !themen.some(t => t.startsWith(rest.slice(0, -1)))) f(`${o}.inhalt[${k}]`, `kein Thema von «${mid}» beginnt mit «${rest.slice(0, -1)}»`);
        });
      });
    });
    const E = welt.erweiterung;
    if (E !== undefined) {
      if (!objekt(E)) f('erweiterung', 'Objekt erwartet');
      else {
        if (E.platz !== ERWEITERUNG) f('erweiterung.platz', `erwartet «${ERWEITERUNG}»`);
        for (const k of ['name', 'text']) if (!text(E[k])) f(`erweiterung.${k}`, 'Text fehlt');
        if (!schild(E.schild)) f('erweiterung.schild', 'eine oder zwei Zeilen mit höchstens 18 Zeichen erwartet');
      }
    }
    if (typeof P.pruefeTexte === 'function' && typeof P.texteIn === 'function') for (const r of P.pruefeTexte(P.texteIn(welt, 'welt'), { ton: false })) f(r.ort, r.text, r.regel);
    return R;
  }

  P.pruefeInseln = pruefeInseln;
})(globalThis);
