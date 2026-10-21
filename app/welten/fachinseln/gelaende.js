/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Eigenständiges, vollständig prozedurales Inselgelände.
 * THREE wird vom aufrufenden Prototyp bereitgestellt. Keine Animationsschleife.
 */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';

  W3.Gelaende = function (THREE, options = {}) {
    const TAU = Math.PI * 2;
    const GROUND = 1.6;
    const SEGMENTS = 144;
    const SURFACE_RINGS = 160;
    const EXPANSION = { x: -18, z: -7 };
    const ACCESS_CLEARING = { x: -12.5, z: -5, radius: 3.1 };
    const BUILDINGS = [
      { x: -1, z: -1, radius: 3.6 },
      { x: -8, z: 2, radius: 3 },
      { x: 7, z: 1, radius: 3 },
      { x: 1, z: 6, radius: 2.8 },
      { x: -6, z: 8, radius: 2.7 },
      { x: 5, z: -6, radius: 2.8 }
    ];
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const smooth = value => {
      const t = clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    };
    const noise = (x, z, seed = 0) =>
      Math.sin(x * 1.731 + z * 0.917 + seed) * 0.52 +
      Math.sin(x * 3.317 - z * 2.139 + seed * 1.37) * 0.3 +
      Math.cos(x * 0.673 + z * 4.107 + seed * 0.73) * 0.18;
    const coastalArc = (angle, center, width) => {
      const distance = Math.atan2(Math.sin(angle - center), Math.cos(angle - center));
      return Math.exp(-Math.pow(distance / width, 2));
    };
    const color = hex => new THREE.Color(hex);
    const colors = {
      grass: color('#91aa67'),
      grassLight: color('#a9bb7b'),
      grassDry: color('#b2bc84'),
      sand: color('#d9c89f'),
      sandLight: color('#e6d7b6'),
      stone: color('#d2c7ae'),
      stoneLight: color('#e2dac5'),
      stoneSeam: color('#b3a78e'),
      wetStone: color('#a8aaa0')
    };
    Object.entries(options.palette || {}).forEach(([key, value]) => {
      if (colors[key]) colors[key].set(value);
    });
    // Die Höhenfunktion kennt unskalierte, absolute Inselkoordinaten.
    // Auch die Erweiterung verwendet dieses Feld; ihre Gruppe ist nur versetzt.
    const groundHeight = (x, z) => options.height ? options.height(x, z) : GROUND;
    const surfaceTint = new THREE.Color();
    function putSurfaceColor(target, x, z, y, fallback, variation) {
      if (options.surfaceColor) {
        surfaceTint.set(options.surfaceColor(x, z, y));
        target.push(surfaceTint.r, surfaceTint.g, surfaceTint.b);
      } else {
        putColor(target, fallback, colors.grassLight, variation);
      }
    }

    function material() {
      return new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.97,
        metalness: 0
      });
    }

    function meshFrom(vertices, tint, indices, name) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(tint, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, material());
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function putColor(target, base, secondary, amount, shade = 1) {
      const c = base.clone().lerp(secondary, clamp(amount, 0, 1));
      c.multiplyScalar(shade);
      target.push(c.r, c.g, c.b);
    }

    // Mehrere lange Küstenbögen und kleinere Erosionsformen ergeben eine
    // zusammenhängende Kontur; kein Raster und keine gestapelten Grundkörper.
    function mainPoint(index) {
      const a = index / SEGMENTS * TAU;
      const radius = 1 +
        0.039 * Math.sin(3 * a + 0.8) +
        0.026 * Math.sin(5 * a - 1.2) +
        0.012 * Math.cos(11 * a + 0.3) +
        0.006 * Math.sin(23 * a + 1.4);
      return {
        x: 15.1 * Math.cos(a) * radius,
        z: 10.85 * Math.sin(a) * radius
      };
    }

    const mainOutline = Array.from({ length: SEGMENTS }, (_, i) => mainPoint(i));
    const refineOutline = outline => outline.flatMap((point, i) => {
      const next = outline[(i + 1) % outline.length];
      return [point, { x: (point.x + next.x) / 2, z: (point.z + next.z) / 2 }];
    });

    function cubic(a, b, c, d, t) {
      const s = 1 - t;
      return {
        x: s * s * s * a.x + 3 * s * s * t * b.x +
          3 * s * t * t * c.x + t * t * t * d.x,
        z: s * s * s * a.z + 3 * s * s * t * b.z +
          3 * s * t * t * c.z + t * t * t * d.z
      };
    }

    function expansionOutline() {
      // Die letzten Punkte teilen exakt die vorhandene Plateaukontur.
      // Damit gibt es am Anschluss weder eine Wasserlücke noch zwei
      // übereinanderliegende, flimmernde Grasflächen.
      const start = mainOutline[80];
      const end = mainOutline[92];
      const segments = [
        [start, { x: -16.2, z: -2.5 }, { x: -21.9, z: -2.9 }, { x: -23.0, z: -6.0 }],
        [{ x: -23.0, z: -6.0 }, { x: -24.1, z: -8.6 }, { x: -21.6, z: -11.4 }, { x: -18.8, z: -11.15 }],
        [{ x: -18.8, z: -11.15 }, { x: -15.7, z: -11.6 }, { x: -13.2, z: -9.2 }, end]
      ];
      const points = [];
      segments.forEach((segment, part) => {
        for (let i = 0; i < 24; i++) {
          const t = i / 24;
          const p = cubic(...segment, t);
          const wrinkle = Math.sin(t * Math.PI) *
            (0.055 * Math.sin(t * TAU * 3 + part) + 0.025 * Math.sin(t * TAU * 7));
          p.x += wrinkle;
          p.z += wrinkle * 0.65;
          points.push({ x: p.x - EXPANSION.x, z: p.z - EXPANSION.z });
        }
      });
      for (let i = 92; i > 80; i--) {
        points.push({
          x: mainOutline[i].x - EXPANSION.x,
          z: mainOutline[i].z - EXPANSION.z
        });
      }
      return points;
    }

    function terrainStrip(outline, layers, options) {
      outline = refineOutline(outline);
      const vertices = [], tint = [], indices = [];
      const count = outline.length;
      const {
        name, base, second, seed, shore = false, rock = false,
        soil = false, seamStart: originalSeamStart = Infinity, offset = { x: 0, z: 0 }
      } = options;
      const seamStart = originalSeamStart * 2;
      layers.forEach((layer, row) => {
        for (let i = 0; i < count; i++) {
          const p = outline[i];
          const angle = Math.atan2(p.z, p.x);
          const atJoin = i >= seamStart || i === 0;
          const local = noise(p.x, p.z, seed);
          const erosion = layer.erosion || 0;
          const bay = Math.max(
            coastalArc(angle, 1.94 + Math.sin(seed) * 0.08, 0.40),
            coastalArc(angle, 0.32 + Math.cos(seed) * 0.11, 0.28) * 0.72,
            coastalArc(angle, 4.73, 0.22) * 0.35
          );
          const depth = clamp((GROUND - layer.y) / (GROUND + 0.2), 0, 1);
          const face = Math.sin(depth * Math.PI);
          const fold = Math.sin(angle * 7 + seed * 0.37) * 0.015 +
            Math.sin(angle * 13 - seed) * 0.006;
          // Die Felswand hat zusammenhängende Rippen und Auswaschungen,
          // statt auf jeder Höhe eine weitere umlaufende Stufe zu bilden.
          const relief = rock ? face * (fold +
            noise(p.x * 0.33, p.z * 0.33, seed) * 0.012) : 0;
          const radius = shore ?
            1.018 + bay * (layer.scale - 1.018 + local * erosion) :
            layer.scale + local * erosion + relief;
          // Anschlusskanten nicht nach innen über das bestehende Plateau ziehen.
          const scale = atJoin && seamStart !== Infinity ? 1 : radius;
          const x = p.x * scale;
          const z = p.z * scale;
          let y = layer.y + (layer.ripple || 0) *
            (0.62 * Math.sin(angle * 4 + seed) + 0.38 * Math.sin(angle * 9 + 0.3));
          if (rock) {
            y += face * (0.12 * Math.sin(angle * 3 + seed) +
              0.045 * Math.sin(angle * 11 + 0.3));
          }
          // Zwischen den Buchten verschwindet der Sand unter dem Wasser.
          // So entsteht kein gleich breiter heller Ring um die ganze Insel.
          if (shore) y -= (1 - smooth(bay)) * 0.43;
          if (soil) {
            y = GROUND - (GROUND - layer.y) *
              (0.45 + 0.85 * (noise(p.x * 0.4, p.z * 0.4, seed) + 1) / 2);
          }
          if (!shore) {
            const top = groundHeight(x + offset.x, z + offset.z);
            // Die ganze Wand steigt mit dem Gelände an. Unter Wasser bleibt
            // ihr Fuss fest; die obere Kante trifft das Höhenfeld exakt.
            if (soil) y += top - GROUND;
            else y += (top - GROUND) * clamp((layer.y + .2) / (GROUND + .2), 0, 1);
          }
          vertices.push(x, y, z);
          const blend = layer.tint == null ? 0.45 : layer.tint;
          if (rock) {
            const weather = noise(p.x * 0.27, p.z * 0.27, seed + layer.y * 0.32);
            const low = base.clone().lerp(colors.wetStone,
              smooth((0.35 - y) / 0.55) * 0.34);
            putColor(tint, low, second, blend + weather * 0.28,
              0.96 + local * 0.045 + weather * 0.05);
          } else if (soil && row === layers.length - 1) {
            putSurfaceColor(tint, x + offset.x, z + offset.z, y, base, blend);
          } else {
            putColor(tint, base, second,
              blend + local * 0.12 + Math.sin(angle * 17 + row * 0.5) * 0.035,
              0.98 + local * 0.035);
          }
          if (row < layers.length - 1) {
            const next = (i + 1) % count;
            // Kein zusätzlicher Klippenstreifen entlang der Verbindung.
            if (i >= seamStart) continue;
            const a = row * count + i;
            const b = (row + 1) * count + i;
            const c = row * count + next;
            const d = (row + 1) * count + next;
            indices.push(a, b, c, c, b, d);
          }
        }
      });
      return meshFrom(vertices, tint, indices, name);
    }

    function plateau(outline, clearings, seed, offset = { x: 0, z: 0 }) {
      // Eine Zwischenprobe pro Küstensegment verfeinert die Berghänge.
      // Die gemeinsame Küstenlinie an der Erweiterung bleibt dabei exakt.
      outline = refineOutline(outline);
      const centerY = groundHeight(offset.x, offset.z);
      const vertices = [0, centerY, 0];
      const tint = [];
      const indices = [];
      const radii = Array.from({ length: SURFACE_RINGS }, (_, i) => (i + 1) / SURFACE_RINGS);
      const count = outline.length;
      putSurfaceColor(tint, offset.x, offset.z, centerY, colors.grass, .4);
      radii.forEach((radius, row) => {
        for (let i = 0; i < count; i++) {
          const x = outline[i].x * radius;
          const z = outline[i].z * radius;
          let free = 1;
          clearings.forEach(site => {
            const distance = Math.hypot(x - site.x, z - site.z);
            free = Math.min(free, smooth((distance - site.radius) / 1.2));
          });
          // Die Legacy-Variante ohne Profil behält ihren sanften Grasrand.
          // Profile liefern dagegen das ganze zusammenhängende Relief.
          const edge = Math.sin(clamp((radius - 0.72) / 0.28, 0, 1) * Math.PI);
          const hill = Math.pow(edge, 2) * free *
            (0.055 + 0.105 * Math.pow((noise(x * 0.36, z * 0.36, seed) + 1) / 2, 2));
          const y = options.height ? groundHeight(x + offset.x, z + offset.z) : GROUND + hill;
          vertices.push(x, y, z);
          const n = noise(x * 0.33, z * 0.33, seed);
          const rim = smooth((radius - 0.84) / 0.16);
          const grass = colors.grass.clone().lerp(colors.grassDry, rim * 0.55);
          putSurfaceColor(tint, x + offset.x, z + offset.z, y, grass, .32 + n * .2);
          const a = 1 + row * count + i;
          const next = 1 + row * count + (i + 1) % count;
          if (row === 0) {
            indices.push(0, next, a);
          } else {
            const previous = a - count;
            const previousNext = next - count;
            indices.push(previous, previousNext, a, previousNext, next, a);
          }
        }
      });
      const mesh = meshFrom(vertices, tint, indices, 'Zusammenhängendes Höhenfeld mit ebenen Themenplätzen');
      mesh.userData.terrainSurface = true;
      return mesh;
    }

    function addTerrain(group, outline, clearings, seed, seamStart = Infinity, offset = { x: 0, z: 0 }) {
      group.add(terrainStrip(outline, [
        { y: -0.28, scale: 1.18, tint: 0.08, erosion: 0.015 },
        { y: -0.12, scale: 1.155, tint: 0.28, erosion: 0.012 },
        { y: -0.025, scale: 1.115, tint: 0.64, erosion: 0.008 },
        { y: 0.07, scale: 1.06, tint: 0.78, erosion: 0.004 },
        { y: 0.13, scale: 1.025, tint: 0.64 }
      ], {
        name: 'Sanft auslaufender Muschelsandstrand',
        base: colors.sand, second: colors.sandLight, seed, shore: true, seamStart, offset
      }));

      group.add(terrainStrip(outline, [
        { y: -0.2, scale: 1.045, tint: 0.32, erosion: 0.004 },
        { y: 0.12, scale: 1.037, tint: 0.38, erosion: 0.006 },
        { y: 0.47, scale: 1.027, tint: 0.49, erosion: 0.005 },
        { y: 0.82, scale: 1.018, tint: 0.57, erosion: 0.004 },
        { y: 1.12, scale: 1.008, tint: 0.63, erosion: 0.003 },
        { y: 1.42, scale: 1.002, tint: 0.70, erosion: 0.001 },
        { y: GROUND, scale: 1, tint: 0.74 }
      ], {
        name: 'Gewachsene Küstenfelswände mit Rippen und Auswaschungen',
        base: colors.stone, second: colors.stoneLight, seed: seed + 1, rock: true, seamStart, offset
      }));

      // Eine dünne Erd- und Wurzelkante verbindet Kalkfels und Wiese.
      group.add(terrainStrip(outline, [
        { y: 1.545, scale: 1.0004, tint: 0.3 },
        { y: 1.575, scale: 1.0004, tint: 0.5 },
        { y: GROUND, scale: 1, tint: 0.82 }
      ], {
        name: 'Bewachsene Terrassenkante',
        base: colors.stoneSeam, second: colors.grassDry, seed: seed + 2, soil: true, seamStart, offset
      }));
      group.add(plateau(outline, clearings, seed + 3, offset));
    }

    function addShoreRocks(group, outline, seed, stopAt = outline.length) {
      const geometry = new THREE.IcosahedronGeometry(1, 2);
      const positions = geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const uneven = 1 + noise(x * 2, z * 2, y + seed) * 0.11;
        positions.setXYZ(i, x * uneven, y * uneven, z * uneven);
      }
      geometry.computeVertexNormals();
      const stone = new THREE.MeshStandardMaterial({
        color: colors.stone, roughness: 1, metalness: 0
      });
      for (let i = 7; i < stopAt - 5; i += 17) {
        const p = outline[i];
        const n = (noise(p.x, p.z, seed) + 1) / 2;
        const rock = new THREE.Mesh(geometry, stone);
        rock.name = 'Abgerundeter Kalkstein am Wasser';
        rock.position.set(p.x * 1.102, -0.04, p.z * 1.102);
        rock.scale.set(0.25 + n * 0.45, 0.16 + n * 0.19, 0.28 + n * 0.32);
        rock.rotation.set(n * 0.3, i * 1.73, n * 0.18);
        rock.castShadow = true;
        rock.receiveShadow = true;
        group.add(rock);
      }
    }

    function createIsland() {
      const group = new THREE.Group();
      group.name = options.name || 'Gewachsenes Inselgelände';
      group.userData.groundY = GROUND;
      addTerrain(group, mainOutline, [...(options.clearings || BUILDINGS), ACCESS_CLEARING], 5);
      addShoreRocks(group, mainOutline, 7);
      return group;
    }

    function createExpansion() {
      const group = new THREE.Group();
      group.name = 'Zusätzlicher Landabschnitt · neue Themenfläche';
      group.position.set(EXPANSION.x, 0, EXPANSION.z);
      group.userData.groundY = GROUND;
      group.userData.buildingCenter = { x: 0, y: groundHeight(EXPANSION.x, EXPANSION.z), z: 0 };
      const outline = expansionOutline();
      // Die drei Kurven enthalten je 24 Punkte. Der Übergang zum
      // bestehenden Land beginnt beim letzten Punkt dieser Aussenküste.
      const seamStart = 72;
      addTerrain(group, outline, [
        { x: 0, z: 0, radius: 3.2 },
        {
          x: ACCESS_CLEARING.x - EXPANSION.x,
          z: ACCESS_CLEARING.z - EXPANSION.z,
          radius: ACCESS_CLEARING.radius
        }
      ], 13, seamStart, EXPANSION);
      addShoreRocks(group, outline, 17, seamStart);
      return group;
    }

    function fogTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Für den prozeduralen Nebel wird Canvas 2D benötigt.');
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255,255,255,0.97)');
      gradient.addColorStop(0.25, 'rgba(255,255,255,0.88)');
      gradient.addColorStop(0.52, 'rgba(255,255,255,0.58)');
      gradient.addColorStop(0.76, 'rgba(255,255,255,0.20)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    function createFog() {
      const group = new THREE.Group();
      group.name = 'Leiser Küstennebel über dem neuen Land';
      group.position.set(EXPANSION.x, 0, EXPANSION.z);
      const texture = fogTexture();
      const clouds = [];
      for (let layer = 0; layer < 3; layer++) {
        for (let row = 0; row < 3; row++) {
          for (let column = 0; column < 4; column++) {
            const i = layer * 12 + row * 4 + column;
            const wobble = Math.sin(i * 2.399 + 0.8);
            const x = (column - 1.5) * 2.7 + wobble * 0.45;
            const z = (row - 1) * 2.7 + Math.cos(i * 1.73) * 0.45;
            const y = 1.35 + layer * 1.18 + Math.sin(i * 0.71) * 0.27;
            const width = 4.9 + Math.cos(i * 2.17) * 0.65;
            const height = 3.2 + Math.sin(i * 1.37) * 0.5;
            const opacity = 0.44 + layer * 0.025;
            const mat = new THREE.SpriteMaterial({
              map: texture,
              color: layer === 0 ? '#e2e9e5' : '#f5f7ee',
              transparent: true,
              opacity,
              depthWrite: false,
              depthTest: true,
              toneMapped: false
            });
            const sprite = new THREE.Sprite(mat);
            sprite.name = 'Weiche prozedurale Nebelschicht';
            sprite.position.set(x, y, z);
            sprite.scale.set(width, height, 1);
            sprite.renderOrder = 10 + layer;
            group.add(sprite);
            clouds.push({ sprite, x, y, z, width, height, opacity, drift: wobble });
          }
        }
      }
      function setReveal(progress) {
        const p = smooth(Number.isFinite(progress) ? progress : 0);
        group.visible = p < 1;
        clouds.forEach(cloud => {
          const { sprite } = cloud;
          sprite.material.opacity = cloud.opacity * Math.pow(1 - p, 1.35);
          sprite.position.set(
            cloud.x + p * (0.65 + cloud.drift * 0.55),
            cloud.y + p * 1.15,
            cloud.z - p * (0.3 + cloud.drift * 0.2)
          );
          sprite.scale.set(
            cloud.width * (1 + p * 0.13),
            cloud.height * (1 + p * 0.16),
            1
          );
        });
      }
      setReveal(0);
      return { group, setReveal };
    }

    return { createIsland, createExpansion, createFog };
  };
})(globalThis);
