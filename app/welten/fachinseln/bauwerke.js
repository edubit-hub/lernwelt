/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Isolierter Grafikprototyp: handmodellierte Bauwerke, ohne Renderer oder DOM. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';

  W3.Bauten = function (THREE) {
    const geometryCache = new Map();
    const materials = {};
    const colours = {
      stone: '#f1e4ca', light: '#fff1d7', plinth: '#d6c6a8',
      sandstone: '#bdab8c', copper: '#4a9095', copperLight: '#76aaa5',
      copperDark: '#346a71', terracotta: '#b96e4b', tileLight: '#cf8962',
      wood: '#98714c', woodLight: '#b99566', woodDark: '#624b37',
      brass: '#b69a59', glass: '#355d65', glassLight: '#79aaac',
      earth: '#795c41', water: '#6eb9bb', green: '#648859',
      greenLight: '#89a46c', greenDark: '#466e58', leaf: '#a5b780',
      flower: '#d4a060', ink: '#344953', sail: '#f9edcf'
    };
    Object.keys(colours).forEach(function (key) {
      materials[key] = new THREE.MeshStandardMaterial({
        color: colours[key],
        roughness: key === 'glass' || key === 'water' ? 0.38 : 0.8,
        metalness: key === 'brass' ? 0.46 : key.indexOf('copper') === 0 ? 0.2 : 0,
        flatShading: true,
        side: key === 'sail' ? THREE.DoubleSide : THREE.FrontSide
      });
    });

    function geometry(key, make) {
      if (!geometryCache.has(key)) geometryCache.set(key, make());
      return geometryCache.get(key);
    }
    function group(name) {
      const result = new THREE.Group();
      result.name = name;
      return result;
    }
    function mesh(parent, shape, material, x, y, z, sx, sy, sz) {
      const result = new THREE.Mesh(shape, materials[material] || material);
      result.position.set(x || 0, y || 0, z || 0);
      result.scale.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
      result.castShadow = true;
      result.receiveShadow = true;
      parent.add(result);
      return result;
    }

    // Die Bauwerke sind statisch. Gleiche Geometrie und gleiches Material
    // teilen einen Drawcall; die Instanzen bleiben im lokalen Gebäudekoordinatensystem.
    function bundle(root) {
      root.updateMatrixWorld(true);
      const inverseRoot = root.matrixWorld.clone().invert();
      const batches = new Map();
      root.traverse(function (part) {
        if (!part.isMesh || part.isInstancedMesh || part.isSkinnedMesh ||
            Array.isArray(part.material) || part.material.transparent ||
            part.material.opacity < 1 || part.customDepthMaterial ||
            part.customDistanceMaterial || part.morphTargetInfluences ||
            part.children.length || !part.geometry.isBufferGeometry) return;
        let ancestor = part;
        while (ancestor && ancestor !== root) {
          if (!ancestor.visible) return;
          ancestor = ancestor.parent;
        }
        const local = new THREE.Matrix4().multiplyMatrices(inverseRoot, part.matrixWorld);
        const e = local.elements;
        const x = new THREE.Vector3(e[0], e[1], e[2]);
        const y = new THREE.Vector3(e[4], e[5], e[6]);
        const z = new THREE.Vector3(e[8], e[9], e[10]);
        // Gespiegelte oder gescherte Transformationen bleiben normale Meshes.
        if (local.determinant() <= 0 ||
            Math.abs(x.dot(y)) > 1e-7 * x.length() * y.length() ||
            Math.abs(x.dot(z)) > 1e-7 * x.length() * z.length() ||
            Math.abs(y.dot(z)) > 1e-7 * y.length() * z.length()) return;
        const key = [
          part.geometry.id, part.material.id, part.castShadow, part.receiveShadow,
          part.layers.mask, part.renderOrder, part.frustumCulled
        ].join(':');
        if (!batches.has(key)) batches.set(key, []);
        batches.get(key).push({ part: part, matrix: local });
      });
      batches.forEach(function (entries) {
        if (entries.length < 2) return;
        const first = entries[0].part;
        const instances = new THREE.InstancedMesh(first.geometry, first.material, entries.length);
        instances.name = root.name + ' · ' + first.geometry.type + ' · ' + first.material.color.getHexString();
        instances.castShadow = first.castShadow;
        instances.receiveShadow = first.receiveShadow;
        instances.layers.mask = first.layers.mask;
        instances.renderOrder = first.renderOrder;
        instances.frustumCulled = first.frustumCulled;
        instances.matrixAutoUpdate = false;
        instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        entries.forEach(function (entry, index) {
          instances.setMatrixAt(index, entry.matrix);
        });
        instances.instanceMatrix.needsUpdate = true;
        instances.computeBoundingBox();
        instances.computeBoundingSphere();
        root.add(instances);
        entries.forEach(function (entry) {
          let parent = entry.part.parent;
          parent.remove(entry.part);
          while (parent !== root && parent.children.length === 0) {
            const next = parent.parent;
            next.remove(parent);
            parent = next;
          }
        });
      });
      root.updateMatrixWorld(true);
      return root;
    }

    function staticModel(build) {
      return function () {
        return bundle(build.apply(null, arguments));
      };
    }

    const cube = geometry('cube', () => new THREE.BoxGeometry(1, 1, 1));
    function box(parent, material, x, y, z, w, h, d) {
      return mesh(parent, cube, material, x, y, z, w, h, d);
    }
    function cylinder(parent, material, x, y, z, radius, height, sides, topRatio) {
      sides = sides || 16;
      topRatio = topRatio === undefined ? 1 : topRatio;
      const shape = geometry('cylinder:' + sides + ':' + topRatio,
        () => new THREE.CylinderGeometry(topRatio, 1, 1, sides));
      return mesh(parent, shape, material, x, y, z, radius, height, radius);
    }
    function sphere(parent, material, x, y, z, radius, sx, sy, sz) {
      const shape = geometry('ico:1', () => new THREE.IcosahedronGeometry(1, 1));
      return mesh(parent, shape, material, x, y, z,
        radius * (sx || 1), radius * (sy || 1), radius * (sz || 1));
    }
    function torus(parent, material, x, y, z, radius, tube) {
      const key = 'torus:' + radius + ':' + tube;
      return mesh(parent, geometry(key, () => new THREE.TorusGeometry(radius, tube, 6, 32)),
        material, x, y, z);
    }
    function beam(parent, material, from, to, width, depth) {
      const a = new THREE.Vector3(from[0], from[1], from[2]);
      const b = new THREE.Vector3(to[0], to[1], to[2]);
      const middle = a.clone().add(b).multiplyScalar(0.5);
      const result = box(parent, material, middle.x, middle.y, middle.z,
        width, a.distanceTo(b), depth || width);
      result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
      return result;
    }
    function steps(parent, width, z, count, rise, tread, startY) {
      startY = startY || 0;
      for (let i = 0; i < count; i++) {
        const h = (i + 1) * rise;
        box(parent, i % 2 ? 'light' : 'plinth', 0, startY + h / 2,
          z - i * tread, width, h, tread + 0.025);
      }
    }
    function base(parent, width, depth) {
      box(parent, 'sandstone', 0, 0.09, 0, width, 0.18, depth);
      box(parent, 'plinth', 0, 0.24, 0, width - 0.13, 0.14, depth - 0.13);
      box(parent, 'light', 0, 0.35, 0, width - 0.28, 0.08, depth - 0.28);
    }
    function column(parent, x, z, bottom, height, radius) {
      radius = radius || 0.12;
      cylinder(parent, 'plinth', x, bottom + 0.07, z, radius * 1.55, 0.14, 12);
      cylinder(parent, 'stone', x, bottom + height / 2, z, radius, height - 0.18, 12, 0.88);
      box(parent, 'light', x, bottom + height - 0.06, z, radius * 3, 0.12, radius * 3);
    }
    function windowFrame(parent, x, y, z, width, height, angle, divided) {
      const frame = group('Fenster mit Werksteinfassung');
      frame.position.set(x, y, z);
      frame.rotation.y = angle || 0;
      parent.add(frame);
      box(frame, 'sandstone', 0, 0, 0, width + 0.15, height + 0.16, 0.13);
      box(frame, 'glass', 0, 0, 0.076, width, height, 0.035);
      box(frame, 'light', 0, height / 2 + 0.1, 0.035, width + 0.26, 0.1, 0.22);
      box(frame, 'light', 0, -height / 2 - 0.09, 0.08, width + 0.27, 0.12, 0.3);
      box(frame, 'woodLight', 0, 0, 0.105, 0.045, height, 0.035);
      if (divided !== false) box(frame, 'woodLight', 0, -0.02, 0.106, width, 0.045, 0.035);
      return frame;
    }
    function door(parent, x, y, z, width, height, angle) {
      const entry = group('Eingang');
      entry.position.set(x, y, z);
      entry.rotation.y = angle || 0;
      parent.add(entry);
      box(entry, 'sandstone', 0, height / 2, 0, width + 0.24, height + 0.12, 0.19);
      box(entry, 'woodDark', 0, height / 2, 0.11, width, height, 0.065);
      for (let i = -1; i <= 1; i++) {
        box(entry, 'wood', i * width * 0.28, height / 2, 0.15, 0.022, height - 0.12, 0.02);
      }
      box(entry, 'light', 0, height + 0.11, 0.04, width + 0.4, 0.16, 0.3);
      sphere(entry, 'brass', width * 0.26, height * 0.48, 0.2, 0.04);
    }
    function rail(parent, x1, z1, x2, z2, y, height, count) {
      count = count || 4;
      beam(parent, 'woodLight', [x1, y + height, z1], [x2, y + height, z2], 0.075);
      beam(parent, 'wood', [x1, y + 0.16, z1], [x2, y + 0.16, z2], 0.045);
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        box(parent, 'woodLight', x1 + (x2 - x1) * t, y + height / 2,
          z1 + (z2 - z1) * t, 0.065, height, 0.065);
      }
    }
    function hipRoof(parent, x, y, z, width, depth, height, material) {
      const shape = geometry('hip', () => {
        const value = new THREE.ConeGeometry(1, 1, 4);
        value.rotateY(Math.PI / 4);
        return value;
      });
      box(parent, 'copperDark', x, y - 0.04, z, width, 0.1, depth);
      return mesh(parent, shape, material || 'copper', x, y + height / 2, z,
        width / Math.SQRT2, height, depth / Math.SQRT2);
    }
    function gableRoof(parent, x, y, z, width, depth, height, material) {
      const half = width / 2;
      const angle = Math.atan2(height, half);
      const length = Math.hypot(half, height);
      [-1, 1].forEach(function (side) {
        const roof = box(parent, material, x + side * half / 2, y + height / 2, z,
          length + 0.12, 0.14, depth);
        roof.rotation.z = -side * angle;
        for (let i = 1; i < 5; i++) {
          const rib = box(parent, material === 'terracotta' ? 'tileLight' : 'copperLight',
            x + side * half / 2, y + height / 2 + 0.085, z - depth / 2 + depth * i / 5,
            length + 0.1, 0.022, 0.035);
          rib.rotation.z = -side * angle;
        }
      });
      const triangle = geometry('gable:' + width + ':' + height, () => {
        const shape = new THREE.Shape();
        shape.moveTo(-half + 0.1, 0);
        shape.lineTo(0, height - 0.08);
        shape.lineTo(half - 0.1, 0);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false });
      });
      mesh(parent, triangle, 'stone', x, y - 0.03, z - depth / 2 + 0.14);
      mesh(parent, triangle, 'stone', x, y - 0.03, z + depth / 2 - 0.21);
      box(parent, material === 'terracotta' ? 'tileLight' : 'copperLight',
        x, y + height + 0.04, z, 0.16, 0.12, depth + 0.04);
    }

    function observatory() {
      const result = group('Sternwarte');
      base(result, 5.1, 4.8);
      cylinder(result, 'sandstone', 0, 0.5, -0.25, 2.16, 0.24, 16);
      cylinder(result, 'light', 0, 0.67, -0.25, 2.22, 0.12, 16);
      cylinder(result, 'stone', 0, 1.95, -0.25, 1.7, 2.5, 16);
      cylinder(result, 'plinth', 0, 0.87, -0.25, 1.8, 0.19, 16);
      cylinder(result, 'plinth', 0, 3.12, -0.25, 1.84, 0.19, 16);
      cylinder(result, 'light', 0, 3.3, -0.25, 1.96, 0.16, 32);
      cylinder(result, 'copperDark', 0, 3.44, -0.25, 1.91, 0.15, 32);
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const x = Math.sin(angle) * 1.72;
        const z = Math.cos(angle) * 1.72 - 0.25;
        if (i !== 0) windowFrame(result, x, 2.0, z, 0.43, 1.0, angle);
      }
      door(result, 0, 0.7, 1.48, 0.73, 1.65);
      column(result, -0.69, 1.57, 0.7, 2.28, 0.11);
      column(result, 0.69, 1.57, 0.7, 2.28, 0.11);
      box(result, 'light', 0, 3.05, 1.56, 1.72, 0.15, 0.42);
      const domeShape = geometry('dome', () => new THREE.SphereGeometry(1, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2));
      mesh(result, domeShape, 'copper', 0, 3.52, -0.25, 1.88, 1.48, 1.88);
      const hoopShape = geometry('domeRib', () => new THREE.TorusGeometry(1, 0.014, 5, 32, Math.PI));
      for (let i = 0; i < 5; i++) {
        const rib = mesh(result, hoopShape, 'copperLight', 0, 3.53, -0.25, 1.9, 1.5, 1.9);
        rib.rotation.y = i * Math.PI / 5;
      }
      cylinder(result, 'brass', 0, 5.04, -0.25, 0.12, 0.15, 12);
      sphere(result, 'brass', 0, 5.17, -0.25, 0.13);
      const telescope = cylinder(result, 'brass', 0.2, 4.37, 1.05, 0.17, 1.45, 16);
      telescope.rotation.x = Math.PI * 0.29;
      const lens = cylinder(result, 'glass', 0.2, 4.81, 1.62, 0.145, 0.06, 16);
      lens.rotation.x = Math.PI * 0.29;
      steps(result, 1.55, 2.57, 4, 0.175, 0.24);
      rail(result, -2.2, -1.6, -2.2, 1.55, 0.4, 0.5, 4);
      rail(result, 2.2, -1.6, 2.2, 1.55, 0.4, 0.5, 4);
      return result;
    }

    function workshop() {
      const result = group('Rechenwerkstatt');
      base(result, 5.05, 3.65);
      box(result, 'stone', -0.25, 1.23, -0.24, 4.1, 1.68, 2.5);
      box(result, 'plinth', -0.25, 0.58, -0.24, 4.22, 0.22, 2.62);
      box(result, 'light', -0.25, 2.08, -0.24, 4.32, 0.16, 2.7);
      gableRoof(result, -0.25, 2.17, -0.24, 4.57, 2.98, 0.85, 'terracotta');
      door(result, -0.45, 0.39, 1.05, 0.77, 1.36);
      windowFrame(result, -1.63, 1.32, 1.06, 0.65, 0.67);
      windowFrame(result, 0.88, 1.32, 1.06, 0.65, 0.67);
      windowFrame(result, 1.82, 1.32, -0.34, 0.7, 0.7, Math.PI / 2);
      box(result, 'sandstone', 1.13, 2.64, -0.84, 0.48, 1.0, 0.49);
      box(result, 'light', 1.13, 3.14, -0.84, 0.64, 0.13, 0.65);
      box(result, 'woodDark', 1.13, 3.22, -0.84, 0.35, 0.04, 0.35);
      for (let i = 0; i < 3; i++) {
        box(result, 'plinth', 1.13, 2.6 + i * 0.2, -0.58, 0.49, 0.035, 0.025);
      }
      [-1.1, 0.23].forEach(x => box(result, 'wood', x, 1.11, 1.65, 0.11, 1.43, 0.11));
      const awning = box(result, 'copper', -0.44, 1.91, 1.37, 1.68, 0.12, 1.0);
      awning.rotation.x = 0.16;
      box(result, 'woodLight', -0.44, 1.8, 1.84, 1.76, 0.12, 0.1);
      steps(result, 1.44, 1.95, 2, 0.195, 0.23);
      box(result, 'wood', 2.13, 0.8, 0.57, 0.55, 0.14, 1.42);
      [0.04, 1.08].forEach(z => box(result, 'woodDark', 2.13, 0.56, z, 0.12, 0.43, 0.12));
      cylinder(result, 'brass', 2.15, 0.98, 0.27, 0.14, 0.2, 12);
      box(result, 'woodLight', 2.14, 0.94, 0.76, 0.36, 0.12, 0.3);
      const wheel = torus(result, 'woodDark', -2.38, 1.04, -0.15, 0.51, 0.07);
      wheel.rotation.y = Math.PI / 2;
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        beam(result, 'woodLight', [-2.38, 1.04, -0.15],
          [-2.38, 1.04 + Math.sin(a) * 0.49, -0.15 + Math.cos(a) * 0.49], 0.055);
      }
      return result;
    }

    function measure() {
      const result = group('Halle der Masse');
      base(result, 4.5, 3.55);
      box(result, 'stone', 0, 1.37, -1.05, 3.72, 1.95, 0.35);
      box(result, 'stone', -1.7, 1.37, -0.15, 0.28, 1.95, 1.7);
      box(result, 'stone', 1.7, 1.37, -0.15, 0.28, 1.95, 1.7);
      [-1.55, -0.52, 0.52, 1.55].forEach(x => column(result, x, 0.91, 0.4, 1.95, 0.12));
      box(result, 'plinth', 0, 2.37, -0.07, 4.03, 0.2, 2.74);
      box(result, 'light', 0, 2.49, -0.07, 4.16, 0.08, 2.88);
      hipRoof(result, 0, 2.59, -0.07, 4.36, 3.05, 0.66, 'copper');
      steps(result, 2.1, 1.76, 2, 0.195, 0.22);
      windowFrame(result, 0, 1.5, -0.84, 1.1, 0.8);
      box(result, 'wood', -0.99, 1.1, -0.35, 0.17, 1.37, 0.16);
      for (let i = 0; i < 7; i++) {
        box(result, 'brass', -0.95, 0.52 + i * 0.18, -0.25, i % 2 ? 0.12 : 0.2, 0.027, 0.025);
      }
      box(result, 'light', 0.66, 0.74, -0.12, 1.04, 0.12, 0.7);
      [-0.33, 0.33].forEach(x => column(result, 0.66 + x, -0.12, 0.4, 0.3, 0.085));
      beam(result, 'brass', [0.32, 0.82, -0.08], [0.68, 1.5, -0.08], 0.06);
      beam(result, 'brass', [1.02, 0.82, -0.08], [0.68, 1.5, -0.08], 0.06);
      sphere(result, 'brass', 0.68, 1.5, -0.08, 0.075);
      return result;
    }

    function garden() {
      const result = group('Mustergarten');
      base(result, 5.2, 4.2);
      box(result, 'sandstone', 0, 0.42, 0, 4.82, 0.08, 3.82);
      box(result, 'light', 0, 0.47, 0, 0.7, 0.06, 3.72);
      box(result, 'light', 0, 0.47, 0, 4.72, 0.06, 0.55);
      [-1.3, 1.3].forEach(function (x) {
        [-0.98, 0.98].forEach(function (z) {
          box(result, 'stone', x, 0.58, z, 1.57, 0.26, 1.19);
          box(result, 'earth', x, 0.72, z, 1.37, 0.035, 0.99);
          for (let i = 0; i < 3; i++) {
            const px = x - 0.43 + i * 0.43;
            sphere(result, i % 2 ? 'green' : 'greenLight', px, 0.9, z - 0.21, 0.22, 0.85, 1.1, 1);
            sphere(result, 'leaf', px, 0.93, z + 0.22, 0.21, 0.8, 1.25, 1);
            if (z > 0) sphere(result, 'flower', px, 1.15, z + 0.22, 0.08);
          }
        });
      });
      cylinder(result, 'plinth', 0, 0.57, 0, 0.51, 0.2, 20);
      cylinder(result, 'light', 0, 0.69, 0, 0.58, 0.1, 20);
      cylinder(result, 'water', 0, 0.746, 0, 0.48, 0.018, 24);
      cylinder(result, 'stone', 0, 0.92, 0, 0.12, 0.34, 12);
      cylinder(result, 'water', 0, 1.12, 0, 0.27, 0.05, 16);
      [-2.1, 2.1].forEach(x => [-1.65, -0.48].forEach(z =>
        box(result, 'wood', x, 1.23, z, 0.11, 1.55, 0.11)));
      [-1.65, -0.48].forEach(z => box(result, 'woodLight', 0, 2.02, z, 4.55, 0.12, 0.12));
      for (let i = 0; i < 8; i++) {
        box(result, 'wood', -2.13 + i * 0.61, 2.12, -1.06, 0.09, 0.12, 1.65);
      }
      [-1.7, -0.85, 0.85, 1.7].forEach(x =>
        sphere(result, 'green', x, 2.15, -1.08, 0.49, 1.15, 0.25, 1.1));
      box(result, 'light', 0, 0.65, 1.64, 1.28, 0.13, 0.36);
      [-0.43, 0.43].forEach(x => box(result, 'plinth', x, 0.51, 1.64, 0.16, 0.27, 0.28));
      return result;
    }

    function harbour() {
      const result = group('Handelshafen');
      [-2.25, -0.75, 0.75, 2.25].forEach(x => [-1.1, 1.1].forEach(function (z) {
        cylinder(result, 'woodDark', x, 0.35, z, 0.12, 0.7, 10);
        cylinder(result, 'woodLight', x, 0.75, z, 0.15, 0.15, 10);
      }));
      box(result, 'woodDark', 0, 0.47, 0, 5.0, 0.18, 2.7);
      for (let i = 0; i < 15; i++) {
        box(result, i % 3 ? 'woodLight' : 'wood', -2.34 + i * 0.335, 0.59, 0, 0.31, 0.1, 2.72);
      }
      box(result, 'plinth', -1.1, 0.77, -0.42, 2.1, 0.23, 1.63);
      box(result, 'stone', -1.1, 1.39, -0.42, 1.82, 1.1, 1.36);
      hipRoof(result, -1.1, 2.04, -0.42, 2.23, 1.78, 0.58, 'copper');
      door(result, -1.36, 0.87, 0.29, 0.57, 0.88);
      windowFrame(result, -0.57, 1.43, 0.29, 0.37, 0.47, 0, false);
      windowFrame(result, -0.16, 1.43, -0.45, 0.52, 0.47, Math.PI / 2, false);
      box(result, 'woodDark', 1.35, 1.56, -0.52, 0.19, 1.85, 0.19);
      box(result, 'wood', 1.35, 2.48, 0.1, 0.19, 0.19, 1.7);
      beam(result, 'woodLight', [1.35, 1.6, -0.52], [1.35, 2.45, 0.66], 0.105);
      cylinder(result, 'woodDark', 1.35, 1.86, 0.87, 0.022, 1.1, 8);
      const hook = torus(result, 'brass', 1.35, 1.28, 0.87, 0.105, 0.027);
      hook.rotation.y = Math.PI / 2;
      [0.45, 0.98].forEach(function (x, i) {
        box(result, 'wood', x, 0.84 + i * 0.03, -0.92, 0.43, 0.39 + i * 0.06, 0.43);
        box(result, 'woodDark', x, 0.84 + i * 0.03, -0.69, 0.035, 0.39 + i * 0.06, 0.025);
        box(result, 'woodLight', x, 1.05 + i * 0.06, -0.92, 0.44, 0.035, 0.44);
      });
      rail(result, -2.35, -1.25, 2.35, -1.25, 0.65, 0.55, 6);
      [-1.95, 1.95].forEach(function (x) {
        cylinder(result, 'copperDark', x, 0.79, 1.08, 0.1, 0.32, 12);
        cylinder(result, 'brass', x, 0.97, 1.08, 0.15, 0.07, 12);
        const coil = torus(result, 'woodLight', x, 0.67, 0.82, 0.19, 0.035);
        coil.rotation.x = Math.PI / 2;
      });
      return result;
    }

    function clocktower() {
      const result = group('Uhrenturm');
      base(result, 2.45, 2.45);
      box(result, 'stone', 0, 2.32, 0, 1.9, 3.86, 1.9);
      [0.58, 2.55, 4.27].forEach(y => box(result, 'plinth', 0, y, 0, 2.04, 0.14, 2.04));
      box(result, 'light', 0, 4.4, 0, 2.28, 0.13, 2.28);
      door(result, 0, 0.39, 0.97, 0.67, 1.22);
      [Math.PI / 2, Math.PI, -Math.PI / 2].forEach(a =>
        windowFrame(result, Math.sin(a) * 0.97, 1.56, Math.cos(a) * 0.97, 0.46, 0.92, a));
      for (let f = 0; f < 4; f++) {
        const angle = f * Math.PI / 2;
        const dial = group('Uhrblatt');
        dial.position.set(Math.sin(angle) * 0.98, 3.43, Math.cos(angle) * 0.98);
        dial.rotation.y = angle;
        result.add(dial);
        const face = cylinder(dial, 'light', 0, 0, 0.04, 0.62, 0.07, 32);
        face.rotation.x = Math.PI / 2;
        torus(dial, 'brass', 0, 0, 0.1, 0.63, 0.045);
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          const tick = box(dial, 'ink', Math.sin(a) * 0.48, Math.cos(a) * 0.48, 0.088,
            i % 2 ? 0.027 : 0.045, i % 2 ? 0.065 : 0.13, 0.025);
          tick.rotation.z = -a;
        }
        beam(dial, 'ink', [0, 0, 0.12], [0.3, 0.25, 0.12], 0.045, 0.025);
        beam(dial, 'ink', [0, 0, 0.13], [-0.18, 0.12, 0.13], 0.065, 0.025);
        sphere(dial, 'brass', 0, 0, 0.14, 0.065, 1, 1, 0.5);
      }
      [-0.7, 0.7].forEach(x => [-0.7, 0.7].forEach(z => column(result, x, z, 4.47, 0.7, 0.1)));
      cylinder(result, 'brass', 0, 4.85, 0, 0.26, 0.38, 16, 0.45);
      hipRoof(result, 0, 5.2, 0, 2.3, 2.3, 0.7, 'copper');
      cylinder(result, 'brass', 0, 5.94, 0, 0.045, 0.22, 10);
      sphere(result, 'brass', 0, 6.08, 0, 0.09);
      return result;
    }

    // Bruch-Bauwerk, Baum und Segelboot stehen in bauwerke-zusatz.js (Grenze von 500 Zeilen), mit denselben Werkzeugen.
    const zusatz = W3.BautenZusatz({ THREE, materials, colours, geometry, group, mesh, box, cylinder, sphere, torus, beam, steps, base, column, windowFrame, door, rail, hipRoof, gableRoof });
    const fraction = zusatz.fraction, tree = zusatz.tree, boat = zusatz.boat;

    return {
      observatory: staticModel(observatory),
      workshop: staticModel(workshop),
      measure: staticModel(measure),
      garden: staticModel(garden),
      harbour: staticModel(harbour),
      clocktower: staticModel(clocktower),
      fraction: staticModel(fraction),
      tree: staticModel(tree),
      boat: staticModel(boat)
    };
  };
})(globalThis);
