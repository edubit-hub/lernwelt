/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Schifffahrt als ruhige Dekoration zwischen den Fachinseln.
   Der Ausbau bestimmt nur die Häufigkeit; es entstehen keine Lernvoraussetzungen,
   Transporte, Belohnungen oder wirtschaftlichen Abhängigkeiten. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  // modelle (optional, W3.ModellFabrik): Segelschiff aus dem fertigen Modell
  W3.Schiffe = function (THREE, modelle) {
    const routes = [
      {id:'textaufgaben',from:'math',to:'de',label:'Textaufgaben verstehen',
        description:'Mathematik und Deutsch: Eine Geschichte verstehen und darin die passende Rechnung finden.'},
      {id:'naturmessen',from:'math',to:'nmg',label:'Messen und beobachten',
        description:'Mathematik und NMG: Längen, Mengen und Gewichte helfen beim Erkunden der Natur.'},
      {id:'geschichten',from:'de',to:'en',label:'Geschichten verbinden',
        description:'Deutsch und Englisch: Geschichten und vertraute Wörter reisen von einer Sprache zur anderen.'},
      {id:'wetterwoerter',from:'en',to:'nmg',label:'Wetter in zwei Welten',
        description:'Englisch und NMG: Wetter beobachten und die passenden englischen Wörter entdecken.'}
    ];
    const colours={math:'#4b9296',de:'#a3444b',en:'#3869a4',nmg:'#4d8051'};
    const mats={};
    const material=(name,color,extra={})=>mats[name]||(mats[name]=new THREE.MeshStandardMaterial({
      color,roughness:.85,flatShading:true,...extra
    }));
    material('wood','#a4794b');material('dark','#5d4837');material('deck','#d1b486');
    material('cloth','#f6eed5',{side:THREE.DoubleSide});
    material('brass','#caaa66',{metalness:.3,roughness:.55});
    material('skin','#d9b88e');material('glass','#38585b');
    Object.entries(colours).forEach(([id,color])=>material(id,color,{side:THREE.DoubleSide}));
    const cube=new THREE.BoxGeometry(1,1,1);
    const cylinder=new THREE.CylinderGeometry(.5,.5,1,10);
    const sphere=new THREE.SphereGeometry(.5,10,6);
    const prototypes=new Map(),entries=[];
    let root=null,lastTime=0,highlighted=null;
    let levels={math:0,de:0,en:0,nmg:0};
    const clamp=value=>Math.max(0,Math.min(1,Number(value)||0));
    function part(parent,geometry,mat,x,y,z,sx=1,sy=1,sz=1) {
      const mesh=new THREE.Mesh(geometry,mats[mat]);
      mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
      mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    function beam(parent,a,b,width,mat) {
      const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.sub(start);
      const middle=start.addScaledVector(delta,.5);
      const mesh=part(parent,cube,mat,middle.x,middle.y,middle.z,width,delta.length(),width);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
    }
    // Statische Schiffsteile werden einmal je Material zusammengeführt.
    // Die fertigen Modelle teilen ihre Geometrie auch bei mehreren Schiffen.
    function mergeStatic(group) {
      group.updateMatrixWorld(true);
      const batches=new Map();
      group.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const key=mesh.material.uuid;
        if(!batches.has(key))batches.set(key,{material:mesh.material,positions:[],normals:[]});
        const batch=batches.get(key),geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;
        const positions=geometry.attributes.position,normals=geometry.attributes.normal;
        const normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
        const p=new THREE.Vector3(),n=new THREE.Vector3();
        for(let i=0;i<positions.count;i++){
          p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
          n.fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix);
          batch.positions.push(p.x,p.y,p.z);batch.normals.push(n.x,n.y,n.z);
        }
        if(geometry!==mesh.geometry)geometry.dispose();
      });
      group.clear();
      batches.forEach(batch=>{
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(batch.positions,3));
        geometry.setAttribute('normal',new THREE.Float32BufferAttribute(batch.normals,3));
        geometry.computeBoundingSphere();
        const mesh=new THREE.Mesh(geometry,batch.material);mesh.castShadow=true;mesh.receiveShadow=true;
        group.add(mesh);
      });
      return group;
    }
    const hullGeometry=(()=>{
      const outline=[[0,3.7],[1.2,2.3],[1.45,-1.8],[.9,-3],[-.9,-3],[-1.45,-1.8],[-1.2,2.3]];
      const positions=[];
      const at=(i,top)=>{const p=outline[i%outline.length];return[p[0]*(top?1:.6),top?.85:.1,p[1]*(top?1:.88)];};
      for(let i=0;i<outline.length;i++){
        const a=at(i,true),b=at(i+1,true),c=at(i+1,false),d=at(i,false);
        positions.push(...a,...c,...b,...a,...d,...c,0,.1,0,...c,...d);
        positions.push(0,.81,0,...b,...a);
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.computeVertexNormals();return geometry;
    })();
    const sailGeometry=(()=>{
      const positions=[],segments=8;
      // The curved quadrilateral gives the sail volume without a cloth simulation.
      for(let i=0;i<segments;i++){
        const u=i/segments,v=(i+1)/segments;
        const point=(x,top)=>[.12+x*(top?2.7:3.2),top?6.7-x*.8:1.8+x*.2,.15+Math.sin(x*Math.PI)*.65];
        const a=point(u,false),b=point(v,false),c=point(v,true),d=point(u,true);
        positions.push(...a,...b,...c,...a,...c,...d);
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.computeVertexNormals();return geometry;
    })();
    const smallSail=new THREE.BufferGeometry();
    smallSail.setAttribute('position',new THREE.Float32BufferAttribute([
      -.1,1.65,.05,-.1,5.7,.05,-1.85,1.95,.2
    ],3));smallSail.computeVertexNormals();
    const flagGeometry=new THREE.BufferGeometry();
    flagGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
      0,0,0,1.1,-.18,.05,0,-.5,0
    ],3));flagGeometry.computeVertexNormals();
    // Fertiges Segelschiff (W3.ModellFabrik): Bug von −x nach +z gedreht, Rumpf etwas im Wasser, türkise Teile in der Fachfarbe
    function shipModel(subject){
      const g=new THREE.Group();g.name='Segelschiff';
      const tinted=(r,gr,b)=>gr>r+.08&&b>r+.08;
      const m=modelle.statisch('segelschiff',{name:'Segelschiffmodell',breite:6.7,ersetze:[tinted,colours[subject]]});
      m.rotation.y=Math.PI/2;m.position.y=-.5;g.add(m);return g;
    }
    function ship(subject) {
      if(!prototypes.has(subject)&&modelle&&modelle.hat('segelschiff'))prototypes.set(subject,shipModel(subject));
      if(!prototypes.has(subject)){
        const g=new THREE.Group();g.name='Segelschiff';
        part(g,hullGeometry,'dark',0,0,0);
        part(g,hullGeometry,subject,0,.18,0,.98,.5,.98);
        for(let i=0;i<9;i++){
          const z=-2.6+i*.66,w=Math.min(2.5,2.8-Math.max(0,z-1.7)*.9);
          part(g,cube,'deck',0,.89,z,w,.10,.61);
        }
        beam(g,[-1.3,1.05,-1.9],[-1.1,1.05,2.2],.11,'wood');
        beam(g,[1.3,1.05,-1.9],[1.1,1.05,2.2],.11,'wood');
        beam(g,[-1.1,1.05,2.2],[0,1.05,3.7],.1,'wood');
        beam(g,[1.1,1.05,2.2],[0,1.05,3.7],.1,'wood');
        part(g,cylinder,'dark',0,4,-.1,.16,6.8,.16);
        beam(g,[-1.9,1.65,.08],[3.4,1.65,.08],.10,'wood');
        part(g,sailGeometry,'cloth',0,0,0);
        part(g,smallSail,subject,0,0,0);
        part(g,flagGeometry,subject,0,7.45,-.1);
        beam(g,[0,6.9,-.12],[0,1.05,3.1],.035,'deck');
        part(g,cube,'wood',0,1.18,-1.8,1.45,.6,1.25);
        part(g,cube,'deck',0,1.52,-1.8,1.55,.10,1.34);
        part(g,cube,'brass',0,1.19,-1.15,.12,.57,.035);
        part(g,cube,'glass',0,1.22,-2.44,.6,.28,.035);
        part(g,cylinder,subject,-.72,1.28,.7,.42,.6,.36);
        part(g,sphere,'skin',-.72,1.8,.7,.35,.35,.35);
        part(g,cylinder,'cloth',-.72,1.98,.7,.48,.11,.48);
        prototypes.set(subject,mergeStatic(g));
      }
      return prototypes.get(subject).clone(true);
    }
    function ribbon(points,width){
      const positions=[];
      for(let i=0;i<points.length-1;i++){
        const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
        const x=-dz/len*width/2,z=dx/len*width/2;
        positions.push(a.x+x,a.y,a.z+z,a.x-x,a.y,a.z-z,b.x-x,b.y,b.z-z,
          a.x+x,a.y,a.z+z,b.x-x,b.y,b.z-z,b.x+x,b.y,b.z+z);
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.computeVertexNormals();return geometry;
    }
    const wakeMaterial=new THREE.MeshBasicMaterial({color:'#e4f3df',transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
    const wakeGeometry=(()=>{
      const points=[];
      for(const side of[-1,1]){
        points.push(...[.9*side,.02,-1.8,1.8*side,.02,-6.8,2.15*side,.02,-7.5,
          .9*side,.02,-1.8,2.15*side,.02,-7.5,1.08*side,.02,-2.1]);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();return g;
    })();
    function routeCurve(data,centres,index){
      const a=new THREE.Vector3(...centres[data.from]),b=new THREE.Vector3(...centres[data.to]);
      // All traffic uses inward-facing coasts, clear of each island's western extension.
      const topA=index<3&&data.from!=='en';
      const start=a.clone().add(new THREE.Vector3(0,0,topA?48:-48));
      const topB=data.to==='de';
      const end=b.clone().add(new THREE.Vector3(0,0,topB?48:-48));
      start.y=end.y=.015;
      const centre=start.clone().lerp(end,.5);
      const bend=index===0?12:index===3?-12:index===1?7:-7;
      const p1=start.clone().lerp(end,.28),p2=start.clone().lerp(end,.72);
      if(index===0||index===3){p1.z+=bend;p2.z+=bend;}
      else{p1.x+=bend;p2.x-=bend;}
      return new THREE.CatmullRomCurve3([start,p1,centre,p2,end],false,'centripetal');
    }
    function dashedRoute(curve,mat) {
      const all=[],length=curve.getLength(),step=4.6;
      for(let distance=4;distance<length-4;distance+=step){
        const dash=[];
        for(let i=0;i<4;i++)dash.push(curve.getPointAt(Math.min(1,(distance+i*.65)/length)));
        const geo=ribbon(dash,.22),pos=geo.attributes.position;
        for(let i=0;i<pos.count;i++)all.push(pos.getX(i),pos.getY(i),pos.getZ(i));
        geo.dispose();
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(all,3));geo.computeVertexNormals();
      const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=1;return mesh;
    }
    function mooring(parent,p,subject){
      const g=new THREE.Group();g.position.copy(p);g.position.y=.35;parent.add(g);
      // A small buoy marks the approach, rather than placing a dock on unknown coastline.
      part(g,cylinder,'dark',-2.8,.12,0,.5,.5,.5);
      part(g,cylinder,subject,-2.8,.44,0,.7,.25,.7);
      part(g,cylinder,'brass',-2.8,.77,0,.2,.4,.2);
      return g;
    }
    function createTraffic(centres) {
      if(root)throw new Error('Schiffsverkehr wird je Archipel nur einmal angelegt.');
      if(routes.some(route=>!Array.isArray(centres[route.from])||!Array.isArray(centres[route.to])))
        throw new TypeError('Vier Inselmittelpunkte mit x, y und z werden benötigt.');
      root=new THREE.Group();root.name='Schiffsverbindungen zwischen den Fachinseln';
      routes.forEach((data,index)=>{
        const curve=routeCurve(data,centres,index),lineMaterial=new THREE.MeshBasicMaterial({
          color:'#eee0b0',transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide
        });
        const line=dashedRoute(curve,lineMaterial);line.name=data.label;line.userData.route=data.id;root.add(line);
        const moorings=new THREE.Group();root.add(moorings);
        mooring(moorings,curve.getPoint(0),data.from);mooring(moorings,curve.getPoint(1),data.to);
        const ships=[0,1].map(i=>{
          const mover=new THREE.Group();mover.name=data.label+' · Schiff '+(i+1);
          mover.userData.route=data.id;mover.add(ship(i?data.to:data.from));
          const wake=new THREE.Mesh(wakeGeometry,wakeMaterial);wake.renderOrder=2;mover.add(wake);root.add(mover);
          return mover;
        });
        entries.push({data,index,curve,line,lineMaterial,ships,moorings,activity:0,sailing:0});
      });
      setProgress(levels);return root;
    }
    function applyHighlight(){
      entries.forEach(entry=>{
        const chosen=!highlighted||entry.data.id===highlighted;
        entry.lineMaterial.opacity=entry.activity===0?0:
          (highlighted?(chosen?.67:.075):.13+entry.activity*.14);
        entry.lineMaterial.color.set(highlighted&&chosen?'#ffe3a4':'#eee0b0');
      });
    }
    function setHighlighted(id){
      highlighted=routes.some(r=>r.id===id)?id:null;applyHighlight();
    }
    function setProgress(progress){
      Object.keys(levels).forEach(id=>levels[id]=clamp(progress?.[id]));
      entries.forEach(entry=>{
        entry.activity=Math.sqrt(levels[entry.data.from]*levels[entry.data.to]);
        entry.line.visible=entry.activity>.045;
        entry.moorings.visible=entry.activity>.045;
      });
      applyHighlight();positionShips(lastTime);
    }
    function positionShips(time){
      entries.forEach(entry=>{
        const activity=entry.activity;
        const count=activity<.06?0:activity>.82?2:1;
        const duration=74+entry.curve.getLength()*.28;
        // Frühe Verbindungen bleiben lange ruhig. Die Wartezeit sinkt
        // durchgehend mit dem Ausbau, ohne einen Sprung an einer Zwischenstufe.
        const dwell=9+900*Math.pow(1-activity,3);
        const half=duration+dwell,period=half*2;
        entry.sailing=0;
        entry.ships.forEach((mover,index)=>{
          // Über den ganzen Fahrplan verteilen, damit bei wenig Ausbau nicht
          // mehrere erste Schiffe gemeinsam losfahren. Rückfahrten sind versetzt.
          const offset=entry.index*half/routes.length+duration*.32+index*(half+duration*.35);
          const phase=((time+offset)/period)%1*period;
          const reverse=phase>=half,leg=phase%half;
          const underway=leg<duration;
          mover.visible=index<count&&underway;
          if(!mover.visible)return;
          entry.sailing++;
          const fraction=leg/duration,u=reverse?1-fraction:fraction;
          const p=entry.curve.getPointAt(u),t=entry.curve.getTangentAt(u);
          if(reverse)t.negate();
          // Outward and return lanes are slightly separated within the sea passage.
          const side=new THREE.Vector3(-t.z,0,t.x).normalize().multiplyScalar(.9);
          mover.position.copy(p).add(side);mover.position.y=.11+Math.sin(time*.8+entry.index)*.035;
          mover.rotation.set(Math.sin(time*.65+index)*.015,Math.atan2(t.x,t.z),Math.sin(time*.9+entry.index)*.018);
        });
      });
    }
    function update(time){
      if(!root||!Number.isFinite(time))return;
      for(let item=root;item;item=item.parent)if(!item.visible)return;
      lastTime=Math.max(0,time);positionShips(lastTime);
    }
    function getStatus(){
      return {
        activeRoutes:entries.filter(entry=>entry.activity>.045).length,
        ships:entries.reduce((sum,entry)=>sum+entry.sailing,0),
        levels:{...levels},
        routes:entries.map(entry=>({id:entry.data.id,activity:entry.activity,ships:entry.sailing}))
      };
    }
    return {createTraffic,update,routes,setProgress,setHighlighted,getStatus};
  };
})(globalThis);
