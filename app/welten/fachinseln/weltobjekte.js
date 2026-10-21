/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Gemeinsame Weltobjekte: Schild, Baustein und sichtbare Bauabschnitte.
   Die Schildschrift entsteht als Canvas-Textur aus Text, ohne Bildvorlage. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';

  const SCHILD = 2.6;   // Breite des Wegweisers in Welteinheiten (ein Gebäude ist 5,4 breit)

  // modelle (optional, W3.ModellFabrik): Schild aus dem fertigen Modell statt aus Grundformen
  W3.Objekte = function (THREE, modelle) {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const plane = new THREE.PlaneGeometry(1, 1);
    const round = new THREE.CylinderGeometry(1, 1, 1, 8);
    const palettes = {
      cream: '#f5ecd7', edge: '#427b7c', wood: '#9b7851',
      endgrain: '#bea078', darkWood: '#765a3e', brass: '#ad9259',
      stone: '#aabcb8', paleStone: '#ded3bb', mortar: '#b3aa95',
      lightStone: '#eee2c9', earth: '#c4ba91', soil: '#aa9c74'
    };
    const mats = {};
    Object.keys(palettes).forEach(function (key) {
      mats[key] = new THREE.MeshStandardMaterial({
        color: palettes[key], roughness: key === 'brass' ? 0.55 : 0.94,
        metalness: key === 'brass' ? 0.3 : 0, flatShading: true
      });
    });
    const rockGeometry = new THREE.DodecahedronGeometry(0.62, 0);
    const rockPosition = rockGeometry.attributes.position;
    for (let i = 0; i < rockPosition.count; i++) {
      const x = rockPosition.getX(i), y = rockPosition.getY(i), z = rockPosition.getZ(i);
      // Gleiche Eckpunkte werden gleich versetzt: keine offenen Dreieckskanten.
      const wobble = 1 + Math.sin(x * 14 + y * 9 + z * 17) * 0.075;
      rockPosition.setXYZ(i, x * wobble, y * wobble * 0.77, z * wobble * 0.86);
    }
    rockGeometry.computeBoundingBox();
    rockGeometry.translate(0, -rockGeometry.boundingBox.min.y, 0);
    rockGeometry.computeVertexNormals();

    function part(parent, geometry, material, x, y, z, sx, sy, sz) {
      const item = new THREE.Mesh(geometry, mats[material] || material);
      item.position.set(x || 0, y || 0, z || 0);
      item.scale.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
      item.castShadow = true;
      item.receiveShadow = true;
      parent.add(item);
      return item;
    }

    function beam(parent, a, b, thickness, material) {
      const begin = new THREE.Vector3(a[0], a[1], a[2]);
      const finish = new THREE.Vector3(b[0], b[1], b[2]);
      const direction = finish.clone().sub(begin);
      const middle = begin.clone().add(finish).multiplyScalar(0.5);
      const item = part(parent, box, material, middle.x, middle.y, middle.z,
        thickness, direction.length(), thickness);
      item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      return item;
    }

    // Statische Teile mit gleicher Geometrie und gleichem Material teilen Instanzen.
    function compact(root) {
      root.updateMatrixWorld(true);
      const batches = new Map();
      const parts = root.children.filter(function (item) { return item.isMesh; });
      parts.forEach(function (item) {
        if (item.material.transparent) return;
        const key = item.geometry.uuid + ':' + item.material.uuid + ':' +
          item.castShadow + ':' + item.receiveShadow;
        if (!batches.has(key)) batches.set(key, []);
        batches.get(key).push(item);
      });
      batches.forEach(function (items) {
        if (items.length < 2) return;
        const instanced = new THREE.InstancedMesh(items[0].geometry, items[0].material, items.length);
        items.forEach(function (item, i) {
          instanced.setMatrixAt(i, item.matrix);
          root.remove(item);
        });
        instanced.instanceMatrix.needsUpdate = true;
        instanced.castShadow = items[0].castShadow;
        instanced.receiveShadow = items[0].receiveShadow;
        root.add(instanced);
      });
      return root;
    }

    // Schrift als Canvas-Textur (1024 breit, height hoch), Zeilen in der Mitte
    function lettering(words, style, height) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f5ecd7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = style.ink || '#173d43';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let fontSize = words.length === 1 ? 150 : 112;
      const font = function () { return '700 ' + fontSize + 'px "Segoe UI", Arial, sans-serif'; };
      ctx.font = font();
      while (words.some(function (word) { return ctx.measureText(word).width > 934; }) && fontSize > 40) {
        fontSize -= 2;
        ctx.font = font();
      }
      words.forEach(function (word, i) {
        const y = height / 2 + (words.length === 1 ? 0 : (i === 0 ? -47 : 48));
        ctx.fillText(word, 512, y);
      });
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.FrontSide });
    }

    // Schild aus dem Meshy-Modell: Tafel in Modellmetern x ±0,892, y 0,589 bis 1,148, Vorderseite z 0,056, Rückseite z −0,039
    // (vermessen am 20.10.2026 aus modell-themenschild.js). Der türkise Rahmen nimmt die Inselfarbe an.
    // Seit 21.10.2026 ein Wegweiser in Weltgrösse (2,6 breit statt 5,3); die Orientierung übernimmt die Ortsmarke über dem Dach (szene-marken.js).
    function signModel(root, words, style) {
      const edgeTest = function (r, g, b) { return g > r + .08 && b > r + .08; };
      const model = modelle.statisch('themenschild', { name: 'Schildmodell', breite: SCHILD, ersetze: style.edge ? [edgeTest, style.edge] : null });
      root.add(model);
      const k = model.scale.x, w = 1.784 * k - .06, h = .559 * k - .06, y = .869 * k;
      root.userData.height = 1.2 * k;
      root.userData.boardCenter = { x: 0, y: y, z: .056 * k };
      const letterMaterial = lettering(words, style, Math.round(1024 * h / w));
      const front = part(root, plane, letterMaterial, 0, y, .056 * k + .012, w, h, 1);
      const back = part(root, plane, letterMaterial, 0, y, -.039 * k - .012, w, h, 1);
      back.rotation.y = Math.PI;
      [front, back].forEach(function (p) { p.castShadow = false; p.receiveShadow = false; });
      return root;
    }

    function sign(lines, style = {}) {
      const root = new THREE.Group();
      root.name = 'Wegweiser';
      const words = (Array.isArray(lines) ? lines : String(lines).split('\n'))
        .map(function (line) { return String(line).trim(); }).filter(Boolean).slice(0, 2);
      if (!words.length) words.push('Thema');
      root.userData.label = words.join(' ');
      root.userData.width = SCHILD;
      root.userData.height = 2.4;
      root.userData.boardCenter = { x: 0, y: 1.75, z: 0.08 };
      const edging = style.edge ? new THREE.MeshStandardMaterial({
        color: style.edge, roughness: .84, flatShading: true
      }) : mats.edge;
      if (modelle && modelle.hat('themenschild')) return signModel(root, words, style);

      // Pfosten stehen wirklich auf der Insel. Die Schilder sind keine Sprites.
      [-1.88, 1.88].forEach(function (x) {
        part(root, box, 'stone', x, 0.1, 0, 0.48, 0.2, 0.43);
        part(root, box, 'wood', x, 0.92, -0.04, 0.2, 1.84, 0.22);
        part(root, box, 'endgrain', x, 1.86, -0.04, 0.23, 0.07, 0.25);
        part(root, box, 'darkWood', x, 0.29, -0.04, 0.25, 0.16, 0.27);
      });
      const board = new THREE.Group();
      board.name = 'Geneigte Schildfläche';
      board.position.set(0, 1.75, 0.08);
      board.rotation.x = -0.66;
      root.add(board);
      part(board, box, 'cream', 0, 0, 0, 5.16, 1.4, 0.16);
      part(board, box, edging, 0, 0.7, 0, 5.3, 0.07, 0.2);
      part(board, box, edging, 0, -0.7, 0, 5.3, 0.07, 0.2);
      [-2.6, 2.6].forEach(function (x) {
        part(board, box, edging, x, 0, 0, 0.07, 1.4, 0.2);
      });
      const letterMaterial = lettering(words, style, 270);
      const front = part(board, plane, letterMaterial, 0, 0, 0.084, 5.08, 1.34, 1);
      front.castShadow = false;
      front.receiveShadow = false;
      const back = part(board, plane, letterMaterial, 0, 0, -0.084, 5.08, 1.34, 1);
      back.rotation.y = Math.PI;
      back.castShadow = false;
      back.receiveShadow = false;
      [-2.43, 2.43].forEach(function (x) {
        [-0.55, 0.55].forEach(function (y) {
          const bolt = part(board, round, 'brass', x, y, 0.096, 0.027, 0.018, 0.027);
          bolt.rotation.x = Math.PI / 2;
        });
      });
      compact(board);
      root.scale.setScalar(SCHILD / 5.3);   // die Grundformen sind für 5,3 gebaut
      return compact(root);
    }

    function stone() {
      const root = new THREE.Group();
      root.name = 'Baustein';
      part(root, rockGeometry, 'stone', 0, 0, 0);
      return root;
    }

    function construction(width, depth, stage) {
      const w = Math.max(1.5, Number(width) || 5);
      const d = Math.max(1.5, Number(depth) || 4.5);
      const step = Math.max(0, Math.min(2, Math.floor(Number(stage) || 0)));
      const root = new THREE.Group();
      root.name = ['Bauplatz', 'Fundament', 'Rohbau'][step];
      root.userData.stage = step;
      root.userData.width = w;
      root.userData.depth = d;

      // Vor der ersten Übung bleibt nur ein begehbarer, markierter Platz.
      part(root, box, 'earth', 0, 0.015, 0, w + 0.18, 0.03, d + 0.18);
      [-1, 1].forEach(function (xSide) {
        [-1, 1].forEach(function (zSide) {
          const x = xSide * (w / 2 + 0.23), z = zSide * (d / 2 + 0.23);
          part(root, box, 'wood', x, 0.17, z, 0.12, 0.34, 0.12);
          part(root, box, 'endgrain', x, 0.31, z, 0.15, 0.07, 0.15);
        });
      });
      if (step === 0) return compact(root);

      part(root, box, 'mortar', 0, 0.16, 0, w, 0.3, d);
      part(root, box, 'paleStone', 0, 0.34, 0, w + 0.1, 0.14, d + 0.1);
      const bricksX = Math.max(3, Math.round(w / 0.8));
      const bricksZ = Math.max(3, Math.round(d / 0.8));
      const bx = w / bricksX, bz = d / bricksZ;
      [-1, 1].forEach(function (side) {
        for (let i = 0; i < bricksX; i++) {
          part(root, box, i % 3 === 0 ? 'lightStone' : 'paleStone',
            -w / 2 + bx * (i + 0.5), 0.19, side * (d / 2 + 0.012),
            bx - 0.025, 0.25, 0.12);
        }
        for (let i = 0; i < bricksZ; i++) {
          part(root, box, i % 3 === 0 ? 'lightStone' : 'paleStone',
            side * (w / 2 + 0.012), 0.19, -d / 2 + bz * (i + 0.5),
            0.12, 0.25, bz - 0.025);
        }
      });
      if (step === 1) return compact(root);

      // Unvollständige Wände und eine offene Tür machen den Rohbau erkennbar.
      const rear = -d / 2 + 0.16;
      part(root, box, 'lightStone', 0, 1.18, rear, w - 0.2, 1.55, 0.28);
      part(root, box, 'paleStone', -w / 2 + 0.16, 1.08, 0, 0.28, 1.35, d - 0.2);
      part(root, box, 'lightStone', w / 2 - 0.16, 0.89, 0, 0.28, 0.98, d - 0.2);
      const door = Math.min(1.15, w * 0.28), frontWing = (w - door) / 2;
      [-1, 1].forEach(function (side) {
        part(root, box, 'lightStone', side * (door / 2 + frontWing / 2), 0.84,
          d / 2 - 0.16, frontWing - 0.12, 0.88, 0.28);
      });
      for (let i = 0; i < bricksX - 1; i++) {
        part(root, box, i % 2 ? 'paleStone' : 'lightStone',
          -w / 2 + bx * (i + 0.5), 2.02, rear, bx - 0.025, 0.16, 0.29);
      }

      // Ein Baugerüst auf zwei Seiten, mit tragenden Diagonalen und Arbeitsbrett.
      const scaffoldX = -w / 2 - 0.42;
      const scaffoldZ = rear - 0.46;
      [-d / 2, 0, d / 2].forEach(function (z) {
        part(root, box, 'wood', scaffoldX, 1.13, z, 0.11, 2.26, 0.11);
      });
      [-w / 2, 0, w / 2].forEach(function (x) {
        part(root, box, 'wood', x, 1.13, scaffoldZ, 0.11, 2.26, 0.11);
      });
      [0.65, 1.75, 2.15].forEach(function (y) {
        part(root, box, 'wood', scaffoldX, y, 0, 0.1, 0.1, d + 0.2);
        part(root, box, 'wood', 0, y, scaffoldZ, w + 0.2, 0.1, 0.1);
      });
      part(root, box, 'endgrain', scaffoldX + 0.1, 1.72, 0, 0.58, 0.08, d + 0.2);
      part(root, box, 'endgrain', 0, 1.72, scaffoldZ + 0.1, w + 0.2, 0.08, 0.58);
      beam(root, [scaffoldX, 0.12, -d / 2], [scaffoldX, 2.13, 0], 0.08, 'darkWood');
      beam(root, [scaffoldX, 0.12, d / 2], [scaffoldX, 2.13, 0], 0.08, 'darkWood');
      beam(root, [-w / 2, 0.12, scaffoldZ], [w / 2, 2.13, scaffoldZ], 0.08, 'darkWood');
      return compact(root);
    }

    return { sign: sign, stone: stone, construction: construction };
  };
})(globalThis);
