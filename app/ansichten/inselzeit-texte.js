/* app/ansichten/inselzeit-texte.js: die Texte der Inselzeit (E-2110-01): Einstieg, Zeitleiste, Knöpfe, Hinweise und Ende.
   Der Ton ist sachlich und auf Augenhöhe: keine Ausrufezeichen, kein Lob, kein Druck. Die Inselzeit ist eine feste Zeit am Tag und keine Belohnung
   (docs/gestaltung.md G16). tests/inselzeit.test.mjs prüft jeden Text mit Pruefung.pruefeTexte. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {});

  const mz = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;

  L.Texte = L.Texte || {};
  L.Texte.inselzeit = {
    titel: 'Inselzeit',

    // Einstieg in der Startansicht (Sprechblase von May) und im Abschluss
    einstieg: 'Auf die Insel', einstiegKlein: 'Zwei Minuten mit May',
    einstiegLabel: 'Auf die Insel: zwei Minuten mit May und dem Vater',

    // Oben: Zeitleiste und der Weg zurück
    zeit: min => `Inselzeit, noch etwa ${mz(Math.max(1, min), 'Minute', 'Minuten')}`,
    zurInsel: 'Zur Insel',

    // Unten: Knöpfe je nach Lage
    knoepfe: 'Was du tun kannst',
    rufen: 'May rufen', streicheln: 'Streicheln', aufsteigen: 'Aufsteigen', absteigen: 'Absteigen',
    boot: 'Mit dem Boot', inselKnopf: name => `Zur Insel ${name}`, hierbleiben: 'Hierbleiben',

    // Hinweis über den Knöpfen
    gehen: 'Tippe auf die Insel. Dort gehst du hin.',
    reiten: 'Tippe auf die Insel. May trägt dich hin.',
    steg: 'Der Vater wartet am Boot.',
    wohin: 'Zu welcher Insel fahrt ihr?',
    ueberfahrt: name => (name ? `Überfahrt zur Insel ${name}.` : 'Überfahrt.'),

    // Ende
    endeTitel: 'Die Inselzeit ist vorbei.',
    endeText: 'Beim nächsten Mal geht es hier weiter.'
  };
})(globalThis);
