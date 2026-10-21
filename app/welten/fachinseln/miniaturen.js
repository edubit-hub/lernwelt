/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Miniaturen aus derselben Spielszene und denselben Modellen, ohne zweiten Renderer. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';

  W3.Miniaturen = function (THREE, renderer) {
    if (!THREE || !renderer || !renderer.isWebGLRenderer) {
      throw new TypeError('Für die Miniaturen werden THREE und der vorhandene WebGLRenderer benötigt.');
    }

    let disposed = false;
    let busy = false;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Die Miniaturen benötigen eine 2D-Zeichenfläche.');

    const outputGeometry = new THREE.BufferGeometry();
    outputGeometry.setAttribute('position', new THREE.Float32BufferAttribute(
      [-1, 3, 0, -1, -1, 0, 3, -1, 0], 3
    ));
    outputGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(
      [0, 2, 0, 0, 2, 0], 2
    ));
    const outputMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        tDiffuse: {value: null},
        toneMappingExposure: {value: 1},
        straightAlpha: {value: false}
      },
      vertexShader: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform bool straightAlpha;
        varying vec2 vUv;
        #include <tonemapping_pars_fragment>
        #include <colorspace_pars_fragment>
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
          // PNG speichert gerade Alpha-Werte; der transparente Szenenpuffer
          // enthält nach dem Blending vormultiplizierte Farbwerte.
          if (straightAlpha && gl_FragColor.a > 0.00001) {
            gl_FragColor.rgb /= gl_FragColor.a;
          }
          #ifdef LINEAR_TONE_MAPPING
            gl_FragColor.rgb = LinearToneMapping(gl_FragColor.rgb);
          #elif defined(REINHARD_TONE_MAPPING)
            gl_FragColor.rgb = ReinhardToneMapping(gl_FragColor.rgb);
          #elif defined(CINEON_TONE_MAPPING)
            gl_FragColor.rgb = CineonToneMapping(gl_FragColor.rgb);
          #elif defined(ACES_FILMIC_TONE_MAPPING)
            gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);
          #elif defined(AGX_TONE_MAPPING)
            gl_FragColor.rgb = AgXToneMapping(gl_FragColor.rgb);
          #elif defined(NEUTRAL_TONE_MAPPING)
            gl_FragColor.rgb = NeutralToneMapping(gl_FragColor.rgb);
          #elif defined(CUSTOM_TONE_MAPPING)
            gl_FragColor.rgb = CustomToneMapping(gl_FragColor.rgb);
          #endif
          gl_FragColor = sRGBTransferOETF(gl_FragColor);
          if (gl_FragColor.a < 0.00001) gl_FragColor.rgb = vec3(0.0);
        }`,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
      toneMapped: false
    });
    const outputMesh = new THREE.Mesh(outputGeometry, outputMaterial);
    outputMesh.frustumCulled = false;
    const outputCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const toneMappingDefines = new Map([
      [THREE.LinearToneMapping, 'LINEAR_TONE_MAPPING'],
      [THREE.ReinhardToneMapping, 'REINHARD_TONE_MAPPING'],
      [THREE.CineonToneMapping, 'CINEON_TONE_MAPPING'],
      [THREE.ACESFilmicToneMapping, 'ACES_FILMIC_TONE_MAPPING'],
      [THREE.AgXToneMapping, 'AGX_TONE_MAPPING'],
      [THREE.NeutralToneMapping, 'NEUTRAL_TONE_MAPPING'],
      [THREE.CustomToneMapping, 'CUSTOM_TONE_MAPPING']
    ]);
    let lastToneMapping = null;

    function size(value, name) {
      const maximum = Math.min(renderer.capabilities.maxTextureSize, 4096);
      if (!Number.isFinite(value) || value < 1 || value > maximum) {
        throw new RangeError(name + ' muss zwischen 1 und ' + maximum + ' Pixeln liegen.');
      }
      return Math.round(value);
    }

    function saveState() {
      const gl = renderer.getContext();
      return {
        target: renderer.getRenderTarget(),
        face: renderer.getActiveCubeFace(),
        mip: renderer.getActiveMipmapLevel(),
        viewport: renderer.getViewport(new THREE.Vector4()),
        currentViewport: renderer.getCurrentViewport(new THREE.Vector4()),
        scissor: renderer.getScissor(new THREE.Vector4()),
        scissorTest: renderer.getScissorTest(),
        currentScissor: new THREE.Vector4().fromArray(gl.getParameter(gl.SCISSOR_BOX)),
        currentScissorTest: gl.isEnabled(gl.SCISSOR_TEST),
        clearColor: renderer.getClearColor(new THREE.Color()),
        clearAlpha: renderer.getClearAlpha(),
        autoClear: renderer.autoClear,
        autoClearColor: renderer.autoClearColor,
        autoClearDepth: renderer.autoClearDepth,
        autoClearStencil: renderer.autoClearStencil,
        toneMapping: renderer.toneMapping,
        exposure: renderer.toneMappingExposure,
        colorSpace: renderer.outputColorSpace,
        shadowEnabled: renderer.shadowMap.enabled,
        shadowAuto: renderer.shadowMap.autoUpdate,
        shadowNeeds: renderer.shadowMap.needsUpdate,
        xrEnabled: renderer.xr.enabled,
        infoAutoReset: renderer.info.autoReset,
        renderInfo: {...renderer.info.render}
      };
    }

    function restoreState(state) {
      renderer.autoClear = state.autoClear;
      renderer.autoClearColor = state.autoClearColor;
      renderer.autoClearDepth = state.autoClearDepth;
      renderer.autoClearStencil = state.autoClearStencil;
      renderer.toneMapping = state.toneMapping;
      renderer.toneMappingExposure = state.exposure;
      renderer.outputColorSpace = state.colorSpace;
      renderer.shadowMap.enabled = state.shadowEnabled;
      renderer.shadowMap.autoUpdate = state.shadowAuto;
      renderer.shadowMap.needsUpdate = state.shadowNeeds;
      renderer.xr.enabled = state.xrEnabled;
      renderer.setClearColor(state.clearColor, state.clearAlpha);
      renderer.setViewport(state.viewport);
      renderer.setScissor(state.scissor);
      renderer.setScissorTest(state.scissorTest);
      if (state.target) {
        // Ein Renderziel kann einen vom Bildschirm abweichenden Ausschnitt
        // haben. setRenderTarget aktualisiert zugleich den internen GL-Cache.
        const viewport = state.target.viewport.clone();
        const scissor = state.target.scissor.clone();
        const scissorTest = state.target.scissorTest;
        try {
          state.target.viewport.copy(state.currentViewport);
          state.target.scissor.copy(state.currentScissor);
          state.target.scissorTest = state.currentScissorTest;
          renderer.setRenderTarget(state.target, state.face, state.mip);
        } finally {
          state.target.viewport.copy(viewport);
          state.target.scissor.copy(scissor);
          state.target.scissorTest = scissorTest;
        }
      } else {
        renderer.setRenderTarget(null, state.face, state.mip);
      }
      renderer.info.autoReset = state.infoAutoReset;
      Object.assign(renderer.info.render, state.renderInfo);
    }

    function fittedCamera(camera, width, height) {
      camera.updateWorldMatrix(true, false);
      const copy = camera.clone();
      camera.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
      copy.matrix.copy(camera.matrixWorld);
      copy.updateMatrixWorld(true);
      const aspect = width / height;
      if (copy.isOrthographicCamera) {
        const halfHeight = (copy.top - copy.bottom) / 2;
        const center = (copy.left + copy.right) / 2;
        copy.left = center - halfHeight * aspect;
        copy.right = center + halfHeight * aspect;
      } else if (copy.isPerspectiveCamera) {
        copy.aspect = aspect;
      }
      copy.updateProjectionMatrix();
      return copy;
    }

    function take(scene, camera, width, height, transparent, assetMode) {
      if (disposed) throw new Error('Die Miniaturen wurden bereits freigegeben.');
      if (busy) throw new Error('Eine Miniatur wird bereits gerendert.');
      if (!scene || !scene.isScene || !camera || !camera.isCamera) {
        throw new TypeError('Eine THREE.Scene und eine THREE.Camera werden benötigt.');
      }
      width = size(width, 'Breite');
      height = size(height, 'Höhe');
      if (renderer.getContext().isContextLost()) {
        throw new Error('Die Grafikverbindung ist momentan nicht verfügbar.');
      }
      const state = saveState();
      let linearTarget, imageTarget;
      busy = true;
      try {
        // r186 wendet die Ausgabe-Konvertierung nur für die Bildschirmansicht
        // automatisch an. Der zweite Durchlauf unten entspricht diesem Schritt.
        linearTarget = new THREE.WebGLRenderTarget(width, height, {
          type: THREE.HalfFloatType,
          format: THREE.RGBAFormat,
          colorSpace: THREE.LinearSRGBColorSpace,
          depthBuffer: true,
          stencilBuffer: false,
          samples: Math.min(4, renderer.capabilities.maxSamples || 0),
          resolveDepthBuffer: false,
          resolveStencilBuffer: false
        });
        imageTarget = new THREE.WebGLRenderTarget(width, height, {
          type: THREE.UnsignedByteType,
          format: THREE.RGBAFormat,
          colorSpace: THREE.NoColorSpace,
          depthBuffer: false,
          stencilBuffer: false
        });
        renderer.xr.enabled = false;
        renderer.autoClear = true;
        renderer.autoClearColor = true;
        renderer.autoClearDepth = true;
        renderer.autoClearStencil = true;
        renderer.info.autoReset = false;
        renderer.toneMapping = THREE.NoToneMapping;
        if (assetMode) renderer.shadowMap.enabled = false;
        if (transparent) renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(linearTarget);
        renderer.render(scene, fittedCamera(camera, width, height));

        if (lastToneMapping !== state.toneMapping) {
          const define = toneMappingDefines.get(state.toneMapping);
          outputMaterial.defines = define ? {[define]: ''} : {};
          outputMaterial.needsUpdate = true;
          lastToneMapping = state.toneMapping;
        }
        outputMaterial.uniforms.tDiffuse.value = linearTarget.texture;
        outputMaterial.uniforms.toneMappingExposure.value = state.exposure;
        outputMaterial.uniforms.straightAlpha.value = transparent;
        renderer.setRenderTarget(imageTarget);
        renderer.render(outputMesh, outputCamera);

        const pixels = new Uint8Array(width * height * 4);
        renderer.readRenderTargetPixels(imageTarget, 0, 0, width, height, pixels);
        const flipped = new Uint8ClampedArray(pixels.length);
        const rowSize = width * 4;
        for (let y = 0; y < height; y++) {
          const source = (height - 1 - y) * rowSize;
          flipped.set(pixels.subarray(source, source + rowSize), y * rowSize);
        }
        canvas.width = width;
        canvas.height = height;
        context.putImageData(new ImageData(flipped, width, height), 0, 0);
        return canvas.toDataURL('image/png');
      } finally {
        try {
          restoreState(state);
        } finally {
          outputMaterial.uniforms.tDiffuse.value = null;
          if (linearTarget) linearTarget.dispose();
          if (imageTarget) imageTarget.dispose();
          busy = false;
        }
      }
    }

    function capture(scene, camera, width = 640, height = 360) {
      return take(scene, camera, width, height, false, false);
    }

    function asset(object, width = 128, height = 128, options = {}) {
      if (!object || !object.isObject3D) {
        throw new TypeError('Für eine Modellminiatur wird ein THREE.Object3D benötigt.');
      }
      width = size(width, 'Breite');
      height = size(height, 'Höhe');
      const scene = new THREE.Scene();
      const pivot = new THREE.Group();
      // clone() teilt Geometrien und Materialien, verändert aber keinen Knoten
      // der Spielszene. Diese geteilten Ressourcen werden hier nie freigegeben.
      const clone = object.clone(true);
      pivot.add(clone);
      scene.add(pivot);
      pivot.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(pivot);
      if (box.isEmpty()) throw new Error('Das Modell besitzt keine sichtbare Geometrie.');
      const center = box.getCenter(new THREE.Vector3());
      const extent = box.getSize(new THREE.Vector3());
      pivot.position.copy(center).negate();
      pivot.updateMatrixWorld(true);
      scene.add(new THREE.HemisphereLight('#e5f5ff', '#9c8e62', 1.75));
      const sun = new THREE.DirectionalLight('#fff0cb', 2.7);
      sun.position.set(-22, 42, 25);
      scene.add(sun);
      const fill = new THREE.DirectionalLight('#b6e2f4', .5);
      fill.position.set(25, 20, -15);
      scene.add(fill);

      const radius = Math.max(extent.length() / 2, .1);
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, radius * 12 + 20);
      if(options.front)camera.position.set(.12,.18,1.1);
      else camera.position.set(.9,.75,1.1);
      camera.position.normalize().multiplyScalar(radius * 4 + 5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld(true);
      const inverseRotation = camera.quaternion.clone().invert();
      let horizontal = .01, vertical = .01;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            const point = new THREE.Vector3(x, y, z).sub(center).applyQuaternion(inverseRotation);
            horizontal = Math.max(horizontal, Math.abs(point.x));
            vertical = Math.max(vertical, Math.abs(point.y));
          }
        }
      }
      const aspect = width / height;
      const halfHeight = Math.max(vertical, horizontal / aspect) * 1.14;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      try {
        return take(scene, camera, width, height, true, true);
      } finally {
        // Clones own their instance buffers, but share geometry and materials.
        clone.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
      }
    }

    function dispose() {
      if (busy) throw new Error('Die laufende Aufnahme muss zuerst abgeschlossen werden.');
      if (disposed) return;
      disposed = true;
      outputGeometry.dispose();
      outputMaterial.dispose();
      canvas.width = canvas.height = 1;
    }

    return {capture, asset, dispose};
  };
})(globalThis);
