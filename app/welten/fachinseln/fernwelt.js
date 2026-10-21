/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Gemeinsamer Archipel: aktuelle Inselgeometrie, für die Ferne zusammengefasst. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  W3.Fernwelt = function (THREE, water, traffic) {
    const centres={
      math:[-88,0,-70],de:[88,0,-70],en:[-88,0,70],nmg:[88,0,70]
    };
    const scene=new THREE.Scene();
    scene.background=new THREE.Color('#3c8496');
    const camera=new THREE.OrthographicCamera(-250,250,160,-160,.1,1400);
    camera.position.set(0,370,400);camera.lookAt(0,0,0);
    scene.add(new THREE.HemisphereLight('#e5f5ff','#9c8e62',1.75));
    const sun=new THREE.DirectionalLight('#fff0cb',2.7);
    sun.position.set(-160,350,190);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-230,right:230,top:230,bottom:-230,near:1,far:850});
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias=.08;sun.shadow.bias=-.00015;
    scene.add(sun,sun.target);
    const sea=water.clone();sea.scale.setScalar(3);scene.add(sea);
    const trafficRoot=traffic.createTraffic(centres);scene.add(trafficRoot);
    const islands=new Map(),signatures=new Map();
    let height=720,width=1280;

    // Statische Ferne: Materialweise zusammenfassen statt jede Kleinigkeit
    // einzeln zeichnen. Vertexfarben, UVs und Normalen bleiben dabei erhalten.
    function snapshot(source,excluded) {
      source.updateMatrixWorld(true);
      const batches=new Map();
      function collect(node) {
        if(!node.visible||excluded.has(node)||node.isSkinnedMesh)return;   // Figuren mit Skelett sind aus der Ferne zu klein und stünden in Ruhepose
        if(node.isMesh) {
          const geo=node.geometry,pos=geo.attributes.position;
          if(pos) {
            const materials=Array.isArray(node.material)?node.material:[node.material];
            const ranges=geo.groups.length&&Array.isArray(node.material)?geo.groups:
              [{start:0,count:geo.index?geo.index.count:pos.count,materialIndex:0}];
            const count=node.isInstancedMesh?node.count:1;
            for(let n=0;n<count;n++){
              const matrix=node.matrixWorld.clone();
              if(node.isInstancedMesh){const instance=new THREE.Matrix4();node.getMatrixAt(n,instance);matrix.multiply(instance);}
              for(const range of ranges){
                const material=materials[range.materialIndex];
                if(!material)continue;
                if(!batches.has(material))batches.set(material,[]);
                batches.get(material).push({geo,matrix,range});
              }
            }
          }
        }
        node.children.forEach(collect);
      }
      source.children.forEach(collect);
      const root=new THREE.Group(),v=new THREE.Vector3();
      for(const [material,entries] of batches){
        const count=entries.reduce((sum,e)=>sum+e.range.count,0);
        const positions=new Float32Array(count*3),normals=new Float32Array(count*3);
        const uvs=new Float32Array(count*2),colours=new Float32Array(count*3);
        let offset=0;
        for(const {geo,matrix,range} of entries){
          const attrs=geo.attributes,normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
          for(let i=range.start;i<range.start+range.count;i++,offset++){
            const index=geo.index?geo.index.getX(i):i;
            v.fromBufferAttribute(attrs.position,index).applyMatrix4(matrix).toArray(positions,offset*3);
            if(attrs.normal)v.fromBufferAttribute(attrs.normal,index).applyNormalMatrix(normalMatrix);
            else v.set(0,1,0);
            v.toArray(normals,offset*3);
            if(attrs.uv){uvs[offset*2]=attrs.uv.getX(index);uvs[offset*2+1]=attrs.uv.getY(index);}
            if(attrs.color){colours[offset*3]=attrs.color.getX(index);colours[offset*3+1]=attrs.color.getY(index);colours[offset*3+2]=attrs.color.getZ(index);}
            else colours.fill(1,offset*3,offset*3+3);
          }
        }
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
        geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
        geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
        if(material.vertexColors)geometry.setAttribute('color',new THREE.BufferAttribute(colours,3));
        geometry.computeBoundingSphere();
        const mesh=new THREE.Mesh(geometry,material);
        mesh.castShadow=!material.transparent;mesh.receiveShadow=true;root.add(mesh);
      }
      return root;
    }
    function setIsland(id,source,excluded,signature){
      if(signatures.get(id)===signature)return false;
      const old=islands.get(id);
      if(old){scene.remove(old);old.traverse(n=>{if(n.isMesh)n.geometry.dispose();});}
      const root=snapshot(source,excluded);
      root.position.set(...centres[id]);
      root.traverse(n=>n.userData.island=id);
      islands.set(id,root);signatures.set(id,signature);scene.add(root);
      return true;
    }
    function resize(w,h){
      width=w;height=h;
      const aspect=w/h;
      // Vier vollständige Inseln und breite Meerpassagen. UI bleibt ausserhalb
      // der Inselmitten; bei Hochformat wird die gesamte Welt weiter gefasst.
      const vertical=Math.max(310,385/aspect);
      camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;
      camera.top=vertical/2;camera.bottom=-vertical/2;
      camera.updateProjectionMatrix();
    }
    function project(id){
      const p=centres[id],point=new THREE.Vector3(p[0],0,p[2]+40).project(camera);
      return {x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height};
    }
    function hit(raycaster,pointer){
      raycaster.layers.enableAll();raycaster.setFromCamera(pointer,camera);
      return raycaster.intersectObjects([...islands.values()],true)[0]?.object.userData.island;
    }
    function update(seconds){traffic.update(seconds);}
    return {scene,camera,centres,setIsland,resize,project,hit,update,traffic};
  };
})(globalThis);
