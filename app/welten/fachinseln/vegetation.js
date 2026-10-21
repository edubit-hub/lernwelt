/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Gemeinsame botanische Bildsprache mit eigenen Pflanzengesellschaften.
 * Modelle ruhen bei y=0; Geometrien und Materialien werden gemeinsam genutzt. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  W3.Vegetation = function (THREE) {
    const geo = {
      crown: new THREE.IcosahedronGeometry(1, 1),
      small: new THREE.IcosahedronGeometry(1, 0),
      trunk: new THREE.CylinderGeometry(.78, 1, 1, 7),
      cone: new THREE.ConeGeometry(1, 1, 9),
      cap: new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      leaf: new THREE.BufferGeometry()
    };
    geo.leaf.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0, -.1, .5, .06, 0, 1, 0, 0, 0, 0, 0, 1, 0, .1, .5, .06
    ], 3));
    geo.leaf.computeVertexNormals();
    const tones = {
      bark: '#77664d', barkLight: '#978267', birch: '#d5d1b3', scar: '#6d6b55',
      olive: '#83997b', oliveLight: '#a5b593', oliveDark: '#657c66',
      cypress: '#436d53', cypressLight: '#618763',
      oak: '#6f904e', oakLight: '#94ac68', oakDark: '#56793f',
      apple: '#6b924e', appleLight: '#92b365', fruit: '#be6244',
      coast: '#557e70', coastLight: '#81a18a', coastDark: '#456b60',
      fir: '#356955', firLight: '#568b66', firDark: '#2c594a',
      fern: '#6d9b65', fernLight: '#9eb875', grass: '#a5b277',
      straw: '#c1b58a', lavender: '#a593b3', heather: '#ad8e9c',
      blossom: '#e2d8c1', flower: '#d3b568', mushroom: '#b58d67'
    };
    const materials = {};
    for (const [name, color] of Object.entries(tones)) materials[name] = new THREE.MeshStandardMaterial({
      color, roughness: 1, flatShading: true, side: THREE.DoubleSide
    });
    const cache = new Map();
    function group(name) { const g = new THREE.Group(); g.name = name; return g; }
    function part(parent, shape, tone, x, y, z, sx, sy = sx, sz = sx) {
      const mesh = new THREE.Mesh(geo[shape], materials[tone]);
      mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    function branch(parent, start, end, radius, tone = 'bark') {
      const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
      const delta = b.clone().sub(a), middle = a.clone().add(b).multiplyScalar(.5);
      const mesh = part(parent, 'trunk', tone, middle.x, middle.y, middle.z, radius, delta.length(), radius);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      return mesh;
    }
    function roots(g, tone = 'bark') {
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3 + .2;
        branch(g, [Math.cos(a) * .27, .04, Math.sin(a) * .27], [0, .37, 0], .07, tone);
      }
    }
    function olive() {
      const g = group('Silbergrüner Olivenbaum');
      roots(g); branch(g, [0, .04, 0], [.12, 1.25, .04], .15);
      [[-.5, 1.7, .1], [.55, 1.85, .15], [.05, 2.15, -.35]].forEach((p, i) => {
        branch(g, [.08, .85, .03], p, .08, 'barkLight');
        part(g, 'crown', i === 1 ? 'oliveLight' : 'olive', ...p, .79, .51, .69);
      });
      part(g, 'crown', 'oliveDark', -.07, 1.7, .55, .6, .4, .54);
      return g;
    }
    function umbrella() {
      const g = group('Schirmförmige Pinie');
      roots(g); branch(g, [0, .02, 0], [.12, 2.05, .06], .14);
      [[-.52, 2.12, .12], [.54, 2.27, .1], [.06, 2.41, -.35]].forEach((p, i) => {
        branch(g, [.08, 1.45, 0], p, .075);
        part(g, 'crown', i === 2 ? 'oliveLight' : 'oliveDark', ...p, .89, .43, .78);
      });
      return g;
    }
    function cypress() {
      const g = group('Schlanke Zypresse');
      branch(g, [0, 0, 0], [0, 1.3, 0], .1);
      part(g, 'crown', 'cypress', 0, 1.72, 0, .44, 1.17, .43);
      part(g, 'crown', 'cypressLight', .03, 2.51, .01, .29, .8, .3);
      return g;
    }
    function broadleaf(fruit = false) {
      const g = group(fruit ? 'Apfelbaum' : 'Breite Eiche');
      roots(g); branch(g, [0, .02, 0], [.08, 1.5, -.04], fruit ? .13 : .2);
      const palette = fruit ? ['apple', 'appleLight', 'apple'] : ['oakDark', 'oakLight', 'oak'];
      const positions = [[-.59, 1.8, .16], [.64, 1.94, .06], [-.05, 2.4, -.24], [.03, 1.86, .6]];
      positions.forEach((p, i) => {
        branch(g, [.03, .94, 0], p, .075);
        part(g, 'crown', palette[i % 3], ...p, .79, .7, .73);
      });
      if (fruit) for (let i = 0; i < 8; i++) {
        const a = i * 2.4;
        part(g, 'small', 'fruit', Math.cos(a) * .85, 1.73 + (i % 3) * .27,
          Math.sin(a) * .72, .07, .075, .07);
      }
      return g;
    }
    function birch(woodland = false) {
      const g = group('Helle Birke');
      branch(g, [0, 0, 0], [.17, 2.8, -.07], .09, 'birch');
      branch(g, [0, .05, 0], [-.4, 2.25, .12], .055, 'birch');
      for (let i = 0; i < 4; i++)
        part(g, 'trunk', 'scar', .025 + i * .033, .52 + i * .48, .005 - i * .012, .093, .047, .08);
      [[-.45, 2.18, .16], [.42, 2.48, -.09], [.05, 2.95, -.08]].forEach((p, i) => {
        branch(g, [.08, 1.55, 0], p, .038, 'birch');
        part(g, 'crown', woodland ? (i === 2 ? 'fernLight' : 'firLight') :
          (i === 2 ? 'oakLight' : 'oliveLight'), ...p, .55, .63, .48);
      });
      return g;
    }
    function coastalPine(short = false) {
      const g = group('Windgeformte Küstenkiefer');
      roots(g);
      branch(g, [0, .02, 0], [-.13, .85, 0], .14);
      branch(g, [-.13, .85, 0], [.51, 1.77, .03], .115);
      [[.06, 1.76, .24], [.81, 2.14, .08], [.45, 2.5, -.28]].forEach((p, i) => {
        branch(g, [.11, 1.25, 0], p, .075);
        part(g, 'crown', i === 2 ? 'coastLight' : 'coast', ...p, .82, .43, .61);
      });
      if (short) g.scale.set(.9, .76, .9);
      return g;
    }
    function fir(slim = false) {
      const g = group(slim ? 'Schmale Fichte' : 'Kräftige Waldtanne');
      roots(g); branch(g, [0, .02, 0], [0, 2.9, 0], .13);
      for (let i = 0; i < 4; i++) {
        const radius = (slim ? .8 : 1.0) - i * .18;
        const mesh = part(g, 'cone', ['firDark', 'fir', 'fir', 'firLight'][i],
          i % 2 * .025, .99 + i * .61, 0, radius, 1.25 - i * .09, radius);
        mesh.rotation.y = i * .37;
      }
      return g;
    }
    function tree(subject, variant = 0) {
      const id = ['math', 'de', 'en', 'nmg'].includes(subject) ? subject : 'math';
      const v = Math.abs(Math.floor(variant)) % 4, key = 'tree:' + id + ':' + v;
      if (!cache.has(key)) {
        const build = {
          math: [olive, umbrella, cypress, olive],
          de: [broadleaf, () => broadleaf(true), () => birch(false), broadleaf],
          en: [coastalPine, () => coastalPine(true), umbrella, () => coastalPine(true)],
          nmg: [fir, () => fir(true), () => birch(true), fir]
        }[id][v];
        const model = build(); model.rotation.y = v * .37;
        cache.set(key, model);
      }
      return cache.get(key).clone(true);
    }
    function grassTuft(g, x, z, tone, height = .3) {
      for (let i = 0; i < 5; i++) {
        const blade = part(g, 'leaf', tone, x + Math.sin(i * 2.4) * .025, .01, z,
          .7, height * (.75 + (i % 3) * .1), .7);
        blade.rotation.z = (i - 2) * .16; blade.rotation.y = i * 2.4;
      }
    }
    function fern(g, x = 0, z = 0) {
      for (let i = 0; i < 5; i++) {
        const frond = group('Farnwedel'); frond.position.set(x, .02, z); frond.rotation.y = i * 1.256;
        g.add(frond);
        for (let j = 0; j < 3; j++) {
          const leaf = part(frond, 'small', j === 2 ? 'fernLight' : 'fern',
            0, .11 + j * .07, .08 + j * .09, .16 - j * .035, .025, .075);
          leaf.rotation.x = -.35;
        }
      }
    }
    function groundCover(subject, variant = 0) {
      const id = ['math', 'de', 'en', 'nmg'].includes(subject) ? subject : 'math';
      const v = Math.abs(Math.floor(variant)) % 3, key = 'cover:' + id + ':' + v;
      if (!cache.has(key)) {
        const g = group({math:'Duftkräuter und trockene Gräser', de:'Wiesenblumen', en:'Küstenheide und Strandgras', nmg:'Farne und Waldboden'}[id]);
        if (id === 'nmg') {
          fern(g); if (v !== 1) fern(g, .33, -.2);
          if (v === 1) {
            part(g, 'trunk', 'birch', .25, .1, .1, .025, .2, .025);
            part(g, 'cap', 'mushroom', .25, .19, .1, .11, .06, .11);
          }
        } else {
          [[-.22, .05], [.1, -.12], [.28, .15]].forEach(([x,z],i) => {
            grassTuft(g,x,z,id === 'en' ? 'straw' : id === 'math' ? 'olive' : 'grass', .27 + i * .035);
            if (v !== 2) {
              const tone = id === 'math' ? 'lavender' : id === 'en' ? 'heather' : (i % 2 ? 'flower' : 'blossom');
              if (id === 'de') {
                part(g, 'trunk', 'grass', x, .14, z, .012, .28, .012);
                part(g, 'small', tone, x, .3, z, .065, .035, .065);
              } else part(g, 'small', tone, x, .3, z, .055, .09, .055);
            }
          });
        }
        cache.set(key,g);
      }
      return cache.get(key).clone(true);
    }
    return {tree, groundCover};
  };
})(globalThis);
