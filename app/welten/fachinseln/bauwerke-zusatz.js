/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2).
   Teil von bauwerke.js: Bruch-Bauwerk, Baum und Segelboot. K sind die Werkzeuge aus W3.Bauten. */
(function (g) {
  'use strict';
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});

  W3.BautenZusatz = function (K) {
    const { THREE, materials, colours, geometry, group, mesh, box, cylinder, sphere, torus, beam, steps, base, column, windowFrame, door, rail, hipRoof, gableRoof } = K;

    function fraction() {
      const result = group('Pavillon der Teile');
      cylinder(result, 'sandstone', 0, 0.1, 0, 2.14, 0.2, 8);
      cylinder(result, 'plinth', 0, 0.26, 0, 2.03, 0.13, 8);
      cylinder(result, 'light', 0, 0.37, 0, 1.95, 0.09, 8);
      const walls = cylinder(result, 'stone', 0, 1.52, 0, 1.7, 2.2, 8);
      walls.rotation.y = Math.PI / 8;
      const band = cylinder(result, 'plinth', 0, 2.63, 0, 1.8, 0.16, 8);
      band.rotation.y = Math.PI / 8;
      const cornice = cylinder(result, 'light', 0, 2.76, 0, 1.94, 0.1, 8);
      cornice.rotation.y = Math.PI / 8;
      const roof = cylinder(result, 'copper', 0, 3.23, 0, 2.08, 0.84, 8, 0.12);
      roof.rotation.y = Math.PI / 8;
      cylinder(result, 'copperLight', 0, 3.7, 0, 0.3, 0.14, 12);
      sphere(result, 'brass', 0, 3.9, 0, 0.16);
      [Math.PI / 2, Math.PI, -Math.PI / 2].forEach(a =>
        windowFrame(result, Math.sin(a) * 1.58, 1.65, Math.cos(a) * 1.58, 0.8, 1.17, a));
      door(result, 0, 0.42, 1.59, 0.85, 1.42);
      [-0.72, 0.72].forEach(x => column(result, x, 1.55, 0.42, 2.12, 0.11));
      box(result, 'light', 0, 2.6, 1.55, 1.9, 0.14, 0.38);
      const mosaic = group('Vierteiliges Steinmedaillon');
      mosaic.position.set(0, 2.19, 1.72);
      result.add(mosaic);
      for (let i = 0; i < 4; i++) {
        const sector = geometry('quarter-disc', () => new THREE.CircleGeometry(0.24, 10, 0.03, Math.PI / 2 - 0.06));
        const part = mesh(mosaic, sector, i % 2 ? 'brass' : 'copper');
        part.rotation.z = i * Math.PI / 2;
      }
      torus(mosaic, 'sandstone', 0, 0, -0.005, 0.27, 0.035);
      steps(result, 1.42, 2.08, 2, 0.21, 0.25);
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 8 + i * Math.PI / 4;
        beam(result, 'copperLight', [Math.sin(a) * 2.08, 2.83, Math.cos(a) * 2.08],
          [Math.sin(a) * 0.26, 3.65, Math.cos(a) * 0.26], 0.035);
      }
      return result;
    }

    function tree(kind) {
      kind = kind || 'pine';
      const result = group(kind === 'pine' ? 'Kiefer' : 'Laubbaum');
      cylinder(result, 'woodDark', 0, 0.62, 0, 0.13, 1.24, 7, 0.7);
      if (kind === 'pine') {
        cylinder(result, 'greenDark', 0, 1.18, 0, 0.84, 1.27, 9, 0);
        cylinder(result, 'green', 0.04, 1.76, 0, 0.66, 1.12, 9, 0);
        cylinder(result, 'greenLight', 0.02, 2.27, 0.01, 0.43, 0.98, 8, 0);
      } else if (kind === 'cypress') {
        sphere(result, 'greenDark', 0, 1.59, 0, 0.65, 0.6, 1.65, 0.6);
        sphere(result, 'green', 0.02, 2.15, 0, 0.4, 0.65, 1.2, 0.65);
      } else {
        beam(result, 'wood', [0, 0.8, 0], [-0.42, 1.75, 0.1], 0.11);
        beam(result, 'wood', [0, 0.9, 0], [0.4, 1.6, -0.1], 0.1);
        sphere(result, 'green', -0.45, 1.7, 0, 0.72, 1, 0.9, 0.9);
        sphere(result, 'greenLight', 0.38, 1.85, 0.12, 0.79, 0.9, 0.9, 1);
        sphere(result, 'leaf', 0, 2.25, -0.12, 0.7, 1.0, 0.8, 0.92);
        sphere(result, 'green', -0.08, 1.87, -0.45, 0.64);
      }
      return result;
    }

    function boat() {
      const result = group('Segelboot');
      const outline = [[0, 1.42], [0.46, 0.8], [0.54, -0.65], [0.34, -1.12],
        [-0.34, -1.12], [-0.54, -0.65], [-0.46, 0.8]];
      const hullShape = geometry('boat-hull', function () {
        const positions = [];
        function point(index, upper) {
          const p = outline[index % outline.length];
          return [p[0] * (upper ? 1 : 0.48), upper ? 0.52 : 0, p[1] * (upper ? 1 : 0.78)];
        }
        for (let i = 0; i < outline.length; i++) {
          const a = point(i, true), b = point(i + 1, true);
          const c = point(i + 1, false), d = point(i, false);
          positions.push(...a, ...c, ...b, ...a, ...d, ...c);
          positions.push(0, 0, 0, ...c, ...d);
        }
        const value = new THREE.BufferGeometry();
        value.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        value.computeVertexNormals();
        return value;
      });
      mesh(result, hullShape, 'copperDark');
      const deckShape = geometry('boat-deck', function () {
        const shape = new THREE.Shape();
        outline.forEach((p, i) => i ? shape.lineTo(p[0] * 0.9, -p[1] * 0.95) : shape.moveTo(p[0] * 0.9, -p[1] * 0.95));
        shape.closePath();
        const value = new THREE.ShapeGeometry(shape);
        value.rotateX(-Math.PI / 2);
        return value;
      });
      mesh(result, deckShape, 'woodLight', 0, 0.49, 0);
      for (let i = 0; i < outline.length; i++) {
        const a = outline[i], b = outline[(i + 1) % outline.length];
        beam(result, 'wood', [a[0], 0.55, a[1]], [b[0], 0.55, b[1]], 0.055);
      }
      [-0.64, 0.57].forEach(z => box(result, 'wood', 0, 0.59, z, 0.83, 0.08, 0.2));
      cylinder(result, 'woodDark', 0, 1.25, -0.03, 0.043, 1.5, 8);
      const sailShape = geometry('boat-sail', function () {
        const value = new THREE.BufferGeometry();
        value.setAttribute('position', new THREE.Float32BufferAttribute([
          0.05, 0.78, 0.02, 0.05, 1.99, 0.02, 0.85, 0.87, 0.06
        ], 3));
        value.computeVertexNormals();
        return value;
      });
      mesh(result, sailShape, 'sail');
      beam(result, 'wood', [0, 0.8, 0], [0.88, 0.86, 0.04], 0.035);
      beam(result, 'woodLight', [0, 1.94, 0], [0, 0.56, 1.2], 0.014);
      box(result, 'terracotta', 0.14, 1.92, -0.03, 0.3, 0.14, 0.035);
      return result;
    }

    return { fraction, tree, boat };
  };
})(globalThis);
