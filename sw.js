/* sw.js: Service Worker der Lernwelt (Architektur 8.5). Läuft nur unter https und auf localhost mit ?sw=1, die Registrierung
   steht in app/start.js. Er hat drei Aufgaben:
   1. Installieren: alle Dateien aus version.js in den Cache «lernwelt-<build>» legen, alles oder nichts. Jede Datei wird am
      HTTP-Cache vorbei geholt (cache: 'reload') und gegen ihren Hash geprüft, weil ein Host Dateien noch einige Minuten
      veraltet ausliefern kann. Passt etwas nicht, bricht die Installation ab, der halbe Cache wird gelöscht und die alte
      Version läuft weiter. version.js selbst hat keinen Hash (h ist null), dort muss die Build-Nummer stimmen.
   2. Aktivieren: alte Caches «lernwelt-*» löschen. Neue Version erst auf die Nachricht «aktivieren» hin (Startbildschirm),
      nie mitten in einer Sitzung.
   3. Antworten: Navigation liefert index.html, alles andere kommt aus dem Cache, sonst aus dem Netz. Safari verlangt für
      Audio Teilantworten (Range), die der Cache sonst nicht liefert.
   Eine geänderte version.js ändert diese Datei nicht, der Browser prüft importierte Skripte aber mit. Darum startet jede
   neue Version die Installation. Pfade sind relativ zu dieser Datei, weil die Seite unter /<repo>/ liegt. */
(function () {
  'use strict';
  importScripts('version.js');                                   // setzt self.Lernwelt.version = { app, build, stand, dateien: [{ p, h }] }

  const V = self.Lernwelt.version;
  const VORSILBE = 'lernwelt-', CACHE = VORSILBE + V.build, STAPEL = 6;
  const absolut = p => new URL(p, self.location.href).href;
  const hash = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');

  /** Holt eine Datei am HTTP-Cache vorbei, prüft sie und gibt eine saubere Antwort für den Cache zurück. */
  async function hole({ p, h }) {
    const antwort = await fetch(new Request(absolut(p), { cache: 'reload' }));
    if (!antwort.ok) throw new Error('Laden fehlgeschlagen: ' + p + ' (' + antwort.status + ')');
    const buf = await antwort.arrayBuffer();
    if (h ? (await hash(buf)) !== h : !new TextDecoder().decode(buf).includes(JSON.stringify(V.build))) throw new Error('Hash passt nicht: ' + p);
    // Neu gebaut statt weitergereicht: ohne Weiterleitungsvermerk und ohne Vary, nur mit dem Typ
    return new Response(buf, { headers: { 'Content-Type': antwort.headers.get('Content-Type') || 'application/octet-stream' } });
  }

  async function installiere() {
    const schonDa = await caches.has(CACHE);
    try {
      const cache = await caches.open(CACHE);
      for (let i = 0; i < V.dateien.length; i += STAPEL) {
        const ergebnis = await Promise.allSettled(V.dateien.slice(i, i + STAPEL).map(async d => cache.put(absolut(d.p), await hole(d))));
        const gescheitert = ergebnis.find(r => r.status === 'rejected');
        if (gescheitert) throw gescheitert.reason;
      }
    } catch (fehler) {
      if (!schonDa) await caches.delete(CACHE);                  // nie einen halben Cache stehen lassen
      throw fehler;
    }
  }

  async function aktiviere() {
    for (const name of await caches.keys()) if (name.startsWith(VORSILBE) && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  }

  /** 'bytes=a-b', 'bytes=a-' oder 'bytes=-n' → [von, bis], 'ungueltig' (nicht erfüllbar) oder null (nicht lesbar: Kopf ignorieren). */
  function bereich(kopf, laenge) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(kopf).trim());
    if (!m) return null;
    const a = m[1] === '' ? null : Number(m[1]), b = m[2] === '' ? null : Number(m[2]);
    if ((a === null && b === null) || (a !== null && b !== null && a > b)) return null;
    if (laenge === 0 || (a === null && b === 0) || (a !== null && a >= laenge)) return 'ungueltig';
    return a === null ? [Math.max(laenge - b, 0), laenge - 1] : [a, b === null ? laenge - 1 : Math.min(b, laenge - 1)];
  }

  async function teilantwort(antwort, kopf) {
    const buf = await antwort.arrayBuffer(), typ = antwort.headers.get('Content-Type') || 'application/octet-stream';
    const r = bereich(kopf, buf.byteLength);
    if (r === 'ungueltig') return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + buf.byteLength } });
    if (!r) return new Response(buf, { headers: { 'Content-Type': typ } });
    return new Response(buf.slice(r[0], r[1] + 1), { status: 206, statusText: 'Partial Content', headers: {
      'Content-Type': typ, 'Content-Range': 'bytes ' + r[0] + '-' + r[1] + '/' + buf.byteLength, 'Content-Length': String(r[1] - r[0] + 1) } });
  }

  async function antworte(anfrage) {
    let treffer = null;
    try {
      const cache = await caches.open(CACHE);
      treffer = await cache.match(anfrage.mode === 'navigate' ? absolut('index.html') : anfrage, { ignoreSearch: true });
    } catch (fehler) { /* Cache nicht lesbar: dann wie ohne Service Worker aus dem Netz */ }
    if (!treffer) return fetch(anfrage);
    const kopf = anfrage.headers.get('range');
    return kopf ? teilantwort(treffer, kopf) : treffer;
  }

  self.addEventListener('install', e => e.waitUntil(installiere()));
  self.addEventListener('activate', e => e.waitUntil(aktiviere()));
  self.addEventListener('fetch', e => {
    const a = e.request;
    if (a.method === 'GET' && new URL(a.url).origin === new URL(self.location.href).origin) e.respondWith(antworte(a));
  });
  self.addEventListener('message', e => { if (e.data === 'aktivieren') self.skipWaiting(); });
})();
