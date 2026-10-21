/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Landschaften aus derselben Geometriesprache, mit eigenen Küsten und Hainen. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  W3.Inselnatur = function (THREE, B, O, V) {
    const SCALE=3.4;
    function batch(group) {
      group.updateMatrixWorld(true);
      const inverse=group.matrixWorld.clone().invert(),batches=new Map();
      group.traverse(o=>{
        if(!o.isMesh)return;
        const key=o.geometry.uuid+o.material.uuid;
        if(!batches.has(key))batches.set(key,{geometry:o.geometry,material:o.material,matrices:[]});
        const base=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
        if(o.isInstancedMesh){
          for(let i=0;i<o.count;i++){
            const m=new THREE.Matrix4();o.getMatrixAt(i,m);
            batches.get(key).matrices.push(base.clone().multiply(m));
          }
        }else batches.get(key).matrices.push(base);
      });
      group.clear();
      batches.forEach(({geometry,material,matrices})=>{
        const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
        matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
        mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
      });
    }
    function deform(root,profile){
      root.updateMatrixWorld(true);
      const point=new THREE.Vector3();
      root.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const inverse=mesh.matrixWorld.clone().invert();
        const geometry=mesh.geometry.clone(),position=geometry.attributes.position;
        for(let i=0;i<position.count;i++){
          point.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
          const mapped=profile.map(point.x,point.z);
          point.x=mapped[0];point.z=mapped[1];point.applyMatrix4(inverse);
          position.setXYZ(i,point.x,point.y,point.z);
        }
        geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.geometry=geometry;
      });
    }
    function create(id,profile,locations,signOffsets){
      let seed=profile.seed;
      const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      const world=(x,z)=>profile.map(x,z).map(value=>value*SCALE);
      const root=new THREE.Group();root.name=profile.name;
      const G=W3.Gelaende(THREE,{
        name:profile.name,palette:profile.palette,
        height:profile.height,surfaceColor:profile.surfaceColor,
        clearings:Object.entries(profile.locations).filter(([key])=>!['brueche','neuland'].includes(key))
          .map(([,p])=>({x:p[0],z:p[1],radius:3.2}))
      });
      const land=G.createIsland(),extension=G.createExpansion();
      deform(land,profile);deform(extension,profile);
      const terrain=new THREE.Group();terrain.scale.set(SCALE,1,SCALE);
      terrain.add(land,extension);root.add(terrain);
      const mist=G.createFog(),originalReveal=mist.setReveal;
      mist.setReveal=progress=>{
        originalReveal(progress);
        mist.group.children.forEach(sprite=>{
          const x=sprite.position.x+mist.group.position.x,z=sprite.position.z+mist.group.position.z;
          const p=profile.map(x,z);
          sprite.position.y+=profile.height(x,z)-1.6;
          sprite.position.x=p[0]-mist.group.position.x;
          sprite.position.z=p[1]-mist.group.position.z;
        });
      };
      mist.setReveal(0);terrain.add(mist.group);
      const roadSamples=[];
      const roadMaterial=new THREE.MeshStandardMaterial({color:profile.palette.sand,roughness:1,side:THREE.DoubleSide});
      function path(points,record=true){
        const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],0,p[1])));
        const samples=curve.getPoints(80).map(p=>{
          const mapped=world(p.x,p.z);return new THREE.Vector3(mapped[0],profile.height(p.x,p.z)+.045,mapped[1]);
        });
        const vs=[],indices=[];
        samples.forEach((p,i)=>{
          const tangent=samples[Math.min(i+1,80)].clone().sub(samples[Math.max(i-1,0)]);
          tangent.y=0;tangent.normalize();
          const side=new THREE.Vector3(-tangent.z,0,tangent.x).multiplyScalar(.6);
          const left=profile.heightWorld(p.x+side.x,p.z+side.z)+.045;
          const right=profile.heightWorld(p.x-side.x,p.z-side.z)+.045;
          vs.push(p.x+side.x,left,p.z+side.z,p.x-side.x,right,p.z-side.z);
          if(i<80){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
        });
        if(record)roadSamples.push(...samples);
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));
        geo.setIndex(indices);geo.computeVertexNormals();
        const mesh=new THREE.Mesh(geo,roadMaterial);mesh.receiveShadow=true;root.add(mesh);return mesh;
      }
      profile.roads.forEach(points=>path(points));
      const expansionRoad=path(profile.expansionRoad);
      const natural=new THREE.Group();root.add(natural);
      const groveCentres=Array.from({length:9},()=>[(rnd()-.5)*25,(rnd()-.5)*17]);
      const target={math:95,de:140,en:100,nmg:200}[id];
      let planted=0;
      for(let i=0;i<3000&&planted<target;i++){
        const x=(rnd()-.5)*28,z=(rnd()-.5)*20;
        if(x*x/(14.1*14.1)+z*z/(9.8*9.8)>.89)continue;
        const p=world(x,z);
        const ground=profile.height(x,z);
        // Höhere Felsrücken und steile Flanken bleiben als Landschaft lesbar.
        const slope=Math.hypot(profile.height(x+.12,z)-profile.height(x-.12,z),
          profile.height(x,z+.12)-profile.height(x,z-.12))/(.24*SCALE);
        if(slope>.7||ground>({math:12,de:14,en:8,nmg:17}[id]))continue;
        if(Object.values(locations).some(c=>Math.hypot(p[0]-c[0],p[1]-c[2])<9.2))continue;
        if(Object.entries(locations).some(([key,c])=>{
          const off=signOffsets[key];return off&&Math.hypot(p[0]-c[0]-off[0],p[1]-c[2]-off[1])<3.8;
        }))continue;
        if(roadSamples.some(c=>Math.hypot(p[0]-c.x,p[1]-c.z)<2.2))continue;
        const nearGrove=Math.min(...groveCentres.map(c=>Math.hypot(x-c[0],z-c[1])));
        if(nearGrove>({math:3.2,de:3.7,en:3.0,nmg:4.8}[id]))continue;
        const tree=V.tree(id,planted%6),size=.78+rnd()*.45;
        tree.position.set(p[0],ground,p[1]);tree.scale.setScalar(size);tree.rotation.y=rnd()*6.28;
        natural.add(tree);planted++;
        if(planted%2===0){
          const cover=V.groundCover(id,planted%5);
          cover.position.set(p[0]+1.3,profile.heightWorld(p[0]+1.3,p[1]-.6)+.03,p[1]-.6);cover.rotation.y=rnd()*6.28;natural.add(cover);
        }
      }
      // Kleine Pflanzeninseln entlang der Wege machen auch die Nahansicht eigenständig.
      const districtLandscape=new Map();
      Object.entries(locations).filter(([key])=>key!=='neuland').forEach(([key,p],index)=>{
        const area=new THREE.Group();area.position.set(...p);
        // Vorplatz in der Wegfarbe zwischen Gebäudefront und Wegende (landschaften.js, VORPLATZ): die Häuser stehen an einem Platz
        const platz=new THREE.Mesh(new THREE.CircleGeometry(1,32),roadMaterial);platz.rotation.x=-Math.PI/2;platz.scale.set(5.4,1.45,1);
        platz.position.set(.4,.04,3.6);platz.receiveShadow=true;area.add(platz);
        [[-8,-5.7],[7.8,-5.9],[-7.9,5.6]].forEach(([x,z],i)=>{
          if(id==='math'&&key==='hafen'&&i===2){x=-6;z=4;}
          if(roadSamples.some(c=>Math.hypot(p[0]+x-c.x,p[2]+z-c.z)<2.2))return;   // die Wege laufen seit den Vorplätzen auch am Arealrand
          const tree=V.tree(id,(index+i)%6);tree.position.set(x,profile.heightWorld(p[0]+x,p[2]+z)-p[1],z);tree.scale.setScalar(i===2?.7:1);
          area.add(tree);
          const cover=V.groundCover(id,index+i);cover.position.set(x+1.4,profile.heightWorld(p[0]+x+1.4,p[2]+z+.3)-p[1]+.03,z+.3);area.add(cover);
          const stone=O.stone();stone.position.set(x+.6,profile.heightWorld(p[0]+x+.6,p[2]+z-1.1)-p[1],z-1.1);stone.scale.setScalar(.35);area.add(stone);
        });
        batch(area);root.add(area);districtLandscape.set(key,area);
      });
      // Wenige zusammenhängende Felsplatten geben den Höhenzügen sichtbare
      // Bruchkanten. Jeder untere Eckpunkt steckt in der örtlichen Oberfläche.
      const rockColours=[profile.palette.stone,profile.palette.stoneLight,profile.palette.stoneSeam];
      const rockMaterials=rockColours.map(color=>new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
      (profile.features||[]).forEach((feature,featureIndex)=>{
        const count=feature.kind==='volcano'?8:10;
        for(let i=0;i<count;i++){
          const a=i*2.399+featureIndex*.7;
          const radius=feature.kind==='volcano'?1.25+(i%3)*.33:.45+Math.sqrt(i)*.48;
          const x=feature.x+Math.cos(a)*radius,z=feature.z+Math.sin(a)*radius*.73;
          const p=world(x,z),ground=profile.height(x,z);
          if(ground<6||Object.values(locations).some(c=>Math.hypot(p[0]-c[0],p[1]-c[2])<10.3))continue;
          if(roadSamples.some(c=>Math.hypot(p[0]-c.x,p[1]-c.z)<2.6))continue;
          const width=.8+(i%3)*.32,depth=.65+(i%4)*.18,lift=.55+(i%4)*.34;
          const vertices=[],indices=[];
          for(let level=0;level<2;level++)for(let side=0;side<6;side++){
            const angle=side*Math.PI/3+a,stretch=1+.13*Math.sin(side*2.1+i);
            const px=p[0]+Math.cos(angle)*width*stretch,pz=p[1]+Math.sin(angle)*depth*stretch;
            const y=profile.heightWorld(px,pz)+(level?lift*(.72+.28*Math.cos(angle+.4)):-.09);
            vertices.push(px,y,pz);
          }
          for(let side=0;side<6;side++){
            const next=(side+1)%6;
            indices.push(side,side+6,next,next,side+6,next+6);
          }
          for(let side=1;side<5;side++)indices.push(6,7+side,6+side);
          const geometry=new THREE.BufferGeometry();
          geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
          geometry.setIndex(indices);geometry.computeVertexNormals();
          const rock=new THREE.Mesh(geometry,rockMaterials[(i+featureIndex)%3]);
          natural.add(rock);
        }
      });
      batch(natural);
      const extensionDecor=new THREE.Group();root.add(extensionDecor);
      [[-21,-6],[-20,-10],[-16,-10],[-21,-8],[-17,-4]].forEach(([x,z],i)=>{
        const p=world(x,z),tree=V.tree(id,i);tree.position.set(p[0],profile.height(x,z),p[1]);
        tree.scale.setScalar(.85);extensionDecor.add(tree);
      });
      batch(extensionDecor);
      // Einzelne Randsteine folgen derselben Kontur wie die Insel.
      for(let i=0;i<24;i++){
        const a=rnd()*Math.PI*2,r=15.7+rnd()*.7;
        const p=world(Math.cos(a)*r,Math.sin(a)*r*.72);
        const rock=O.stone();rock.position.set(p[0],-.07,p[1]);
        rock.scale.setScalar(.6+rnd()*.7);rock.rotation.y=rnd()*6.28;root.add(rock);
      }
      const foamPoints=[];
      for(let i=0;i<=144;i++){
        const a=i/144*Math.PI*2;
        const r=1+.039*Math.sin(3*a+.8)+.026*Math.sin(5*a-1.2)+.012*Math.cos(11*a+.3)+.006*Math.sin(23*a+1.4);
        const p=world(15.1*Math.cos(a)*r*1.06,10.85*Math.sin(a)*r*1.06);
        foamPoints.push(new THREE.Vector3(p[0],-.13,p[1]));
      }
      const foam=new THREE.Line(new THREE.BufferGeometry().setFromPoints(foamPoints),
        new THREE.LineBasicMaterial({color:profile.palette.sandLight,transparent:true,opacity:.2}));
      root.add(foam);
      extension.visible=false;extensionDecor.visible=false;expansionRoad.visible=false;
      return {root,extension,mist,extensionDecor,expansionRoad,districtLandscape};
    }
    return {create};
  };
})(globalThis);
