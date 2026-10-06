/* app/ui/h.js: winziger DOM-Helfer, ersetzt ein Framework.
   h('button.taste#ok', { type: 'button', onclick: f }, 'Text', andereKnoten, [liste]) → Element.
   Attribute stehen im zweiten Argument, wenn es ein einfaches Objekt ist. Ein Knoten, ein Text, eine Zahl oder eine Liste an dieser
   Stelle gilt als erstes Kind. Leere Werte (null, undefined, false, true, '') werden übersprungen, Listen flach aufgenommen. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});
  const ui = (L.ui = L.ui || {});
  const SELEKTOR = /^([a-z][a-z0-9]*)?((?:[.#][A-Za-z0-9_-]+)*)$/;

  const sindAttribute = a => a !== null && typeof a === 'object' && !a.nodeType && !Array.isArray(a);
  const leer = k => k === null || k === undefined || k === false || k === true || k === '';

  function sammle(kinder, aus = []) {
    for (const k of kinder) {
      if (Array.isArray(k)) sammle(k, aus);
      else if (!leer(k)) aus.push(typeof k === 'object' && k.nodeType ? k : String(k));
    }
    return aus;
  }

  function h(selektor, attrs, ...kinder) {
    const teile = SELEKTOR.exec(selektor);
    if (!teile) throw new Error(`h: ungültiger Selektor «${selektor}»`);
    const el = document.createElement(teile[1] || 'div'), klassen = [];
    for (const t of teile[2].match(/[.#][^.#]+/g) || []) {
      if (t[0] === '.') klassen.push(t.slice(1)); else el.setAttribute('id', t.slice(1));
    }
    if (sindAttribute(attrs)) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k.startsWith('on')) {
          if (typeof v !== 'function') throw new Error(`h: «${k}» braucht eine Funktion`);   // nie Text als Hörer setzen
          el.addEventListener(k.slice(2), v);
        } else if (k === 'class') klassen.push(String(v));
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    } else kinder.unshift(attrs);
    if (klassen.length) el.setAttribute('class', klassen.join(' '));
    el.append(...sammle(kinder));
    return el;
  }

  ui.h = h;
})(globalThis);
