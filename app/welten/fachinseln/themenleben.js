/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Thematische Arbeitsplätze und ruhige Tätigkeiten; ohne DOM und eigene Schleife. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  // modelle (optional, W3.ModellFabrik): Bewohner mit Skelett statt der Figur aus Grundformen
  W3.Themenleben = function (THREE, modelle) {
    const palette = {
      stone:'#f1e4ca', edge:'#d6c6a8', wood:'#b99566', timber:'#75573e',
      teal:'#4a9095', coral:'#c17d58', gold:'#c4a25b', ink:'#344953',
      chalk:'#fff1d7', green:'#8fa977'
    };
    const materials = {};
    Object.entries(palette).forEach(([key,color]) => materials[key] =
      new THREE.MeshStandardMaterial({color,roughness:key==='gold'?.48:.86,
        metalness:key==='gold'?.35:0,flatShading:true}));
    const shapes = {
      box:new THREE.BoxGeometry(1,1,1),
      cylinder:new THREE.CylinderGeometry(.5,.5,1,16),
      sphere:new THREE.SphereGeometry(.5,12,8),
      cone:new THREE.ConeGeometry(.5,1,12),
      roof:new THREE.ConeGeometry(.5,1,4),
      ring:new THREE.TorusGeometry(.5,.035,6,36)
    };
    const entries=[];
    function group(name){const g=new THREE.Group();g.name=name;return g;}
    function part(parent,shape,material,x,y,z,sx=1,sy=1,sz=1){
      const m=new THREE.Mesh(typeof shape==='string'?shapes[shape]:shape,materials[material]);
      m.position.set(x,y,z);m.scale.set(sx,sy,sz);
      m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    }
    function bar(parent,a,b,thickness,mat='timber'){
      const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
      const delta=end.sub(start),mid=start.addScaledVector(delta,.5);
      const m=part(parent,'box',mat,mid.x,mid.y,mid.z,thickness,delta.length(),thickness);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
    }
    // Statische Teile werden materialweise zusammengefasst. Bewegliche Gruppen
    // bleiben separat; so kosten auch viele kleine Lernobjekte wenige Drawcalls.
    function compact(root){
      root.updateMatrixWorld(true);
      const inverse=root.matrixWorld.clone().invert(),batches=new Map(),remove=[];
      root.traverse(o=>{
        if(!o.isMesh)return;
        if(!batches.has(o.material))batches.set(o.material,{p:[],n:[]});
        const batch=batches.get(o.material),g=o.geometry;
        const matrix=inverse.clone().multiply(o.matrixWorld);
        const normal=new THREE.Matrix3().getNormalMatrix(matrix);
        const p=g.attributes.position,n=g.attributes.normal,index=g.index;
        const count=index?index.count:p.count,point=new THREE.Vector3(),norm=new THREE.Vector3();
        for(let i=0;i<count;i++){
          const k=index?index.getX(i):i;
          point.fromBufferAttribute(p,k).applyMatrix4(matrix);
          norm.fromBufferAttribute(n,k).applyMatrix3(normal).normalize();
          batch.p.push(point.x,point.y,point.z);batch.n.push(norm.x,norm.y,norm.z);
        }
        remove.push(o);
      });
      remove.forEach(o=>o.removeFromParent());
      batches.forEach((batch,material)=>{
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position',new THREE.Float32BufferAttribute(batch.p,3));
        geo.setAttribute('normal',new THREE.Float32BufferAttribute(batch.n,3));
        geo.computeBoundingBox();geo.computeBoundingSphere();
        const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;
        root.add(mesh);
      });
      return root;
    }
    function platform(g,x,z,w=3.7,d=3.8){
      part(g,'box','edge',x,.075,z,w,.15,d);
      part(g,'box','stone',x,.17,z,w-.1,.06,d-.1);
      // Fugen, Ränder und Stufen geben dem Arbeitsplatz einen gebauten Sockel.
      for(let i=1;i<4;i++)part(g,'box','edge',x-w/2+w*i/4,.205,z,.022,.012,d-.12);
      for(let i=1;i<4;i++)part(g,'box','edge',x,.205,z-d/2+d*i/4,w-.12,.012,.022);
      part(g,'box','edge',x,.065,z+d/2+.18,1.5,.13,.36);
    }
    function bench(g,x,z,w=2.5,d=1.3,height=1.02){
      [-1,1].forEach(a=>[-1,1].forEach(b=>
        part(g,'box','timber',x+a*(w/2-.16),height/2,z+b*(d/2-.13),.13,height,.13)));
      part(g,'box','wood',x,height,z,w,.15,d);
      part(g,'box','timber',x,height-.19,z+d/2-.06,w,.16,.11);
      part(g,'box','wood',x,.34,z,w-.22,.07,d-.17);
      for(let i=1;i<5;i++)part(g,'box','timber',x-w/2+w*i/5,height+.079,z,.018,.012,d);
    }
    function smallHouse(g,x,z,open=false){
      platform(g,x,z,2.85,2.75);
      const base=.22;
      [-1,1].forEach(a=>[-1,1].forEach(b=>{
        part(g,'box','edge',x+a*1.12,base+.1,z+b*1.05,.4,.2,.4);
        part(g,'box','stone',x+a*1.12,base+1.04,z+b*1.05,.21,1.95,.21);
        part(g,'box','chalk',x+a*1.12,base+1.98,z+b*1.05,.36,.12,.36);
      }));
      if(!open){
        part(g,'box','stone',x,base+.71,z-1.05,2.22,1.42,.17);
        part(g,'box','stone',x-1.12,base+.55,z,.17,1.1,2.1);
        part(g,'box','ink',x+.46,base+1.02,z-.948,.7,.68,.025);
        part(g,'box','wood',x+.46,base+1.02,z-.925,.04,.72,.035);
        part(g,'box','wood',x+.46,base+1.02,z-.925,.75,.04,.035);
        part(g,'box','wood',x-.54,base+.8,z-.86,.74,.07,.32);
        part(g,'box','wood',x-.54,base+1.3,z-.86,.74,.07,.32);
      }else{
        part(g,'box','wood',x,base+.61,z-1.05,2.15,.1,.12);
        [-.7,0,.7].forEach(dx=>part(g,'box','stone',x+dx,base+.4,z-1.05,.07,.6,.09));
      }
      part(g,'box','timber',x,base+2.04,z,2.55,.16,2.4);
      const roof=part(g,'roof','teal',x,base+2.51,z,3.95,.85,3.8);roof.rotation.y=Math.PI/4;
      part(g,'sphere','gold',x,base+2.99,z,.14,.16,.14);
    }
    function shelter(g,x,z){
      [-1,1].forEach(a=>{
        part(g,'box','timber',x+a*1.45,1.35,z,.14,2.7,.14);
        part(g,'box','edge',x+a*1.45,.12,z,.3,.24,.3);
      });
      part(g,'box','wood',x,2.68,z,3.1,.14,.17);
      // Eine schmale Überdachung hinter dem Tisch lässt den Lerngegenstand frei.
      for(let i=0;i<5;i++){
        const panel=part(g,'box',i%2?'chalk':'teal',x-1.24+i*.62,2.72,z+.33,.62,.08,1.25);
        panel.rotation.x=-.13;
        part(g,'box',i%2?'chalk':'teal',x-1.24+i*.62,2.59,z+.95,.62,.23,.08);
      }
    }
    function tray(g,x,y,z,w=1,d=.7){
      part(g,'box','wood',x,y,z,w,.065,d);
      [-1,1].forEach(a=>{
        part(g,'box','timber',x+a*w/2,y+.055,z,.045,.12,d+.06);
        part(g,'box','timber',x,y+.055,z+a*d/2,w,.12,.045);
      });
    }
    function crate(g,x,y,z,size=.5){
      part(g,'box','wood',x,y+size/2,z,size,size,size);
      [-1,1].forEach(a=>{
        part(g,'box','timber',x+a*(size/2-.045),y+size/2,z+size/2+.01,.055,size,.035);
        part(g,'box','timber',x,y+(a+1)*size/2,z+size/2+.01,size,.055,.035);
      });
    }
    function digit(g,value,x,y,z,s=.17,mat='chalk'){
      const segments={0:'ab cdef'.replace(/ /g,''),1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
      const points={a:[0,.5,1,0],b:[.31,.25,0,1],c:[.31,-.25,0,1],
        d:[0,-.5,1,0],e:[-.31,-.25,0,1],f:[-.31,.25,0,1],g:[0,0,1,0]};
      for(const code of segments[value]||''){
        const p=points[code];part(g,'box',mat,x+p[0]*s,y+p[1]*s,z,p[2]?s*.57:s*.1,p[3]?s*.43:s*.1,.018);
      }
    }
    function numberTile(g,value,x,y,z,mat='teal'){
      part(g,'box',mat,x,y,z,.43,.5,.12);digit(g,value,x,y,z+.07,.31);
    }
    function coin(g,x,y,z,r=.12,denomination=1){
      part(g,'cylinder','gold',x,y,z,r*2,.04,r*2);
      const edge=part(g,'ring','gold',x,y+.022,z,r*1.67,r*1.67,r*1.67);edge.rotation.x=-Math.PI/2;
      // Der Nennwert sitzt als Prägung auf der Münze, nicht als schwebendes Icon.
      const stamp=group('Prägung');digit(stamp,denomination,0,0,0,r*.9,'stone');
      stamp.rotation.x=-Math.PI/2;stamp.position.set(x,y+.026,z);g.add(stamp);
    }
    function baseTen(g,x,y,z,full){
      for(let a=0;a<10;a++)for(let b=0;b<10;b++)
        part(g,'box','teal',x+a*.105,y,z+b*.105,.096,.095,.096);
      const rods=full?3:1;
      for(let a=0;a<rods;a++)for(let b=0;b<10;b++)
        part(g,'box','coral',x+1.2+a*.16,y,z+b*.105,.1,.095,.096);
      for(let i=0;i<(full?7:3);i++)
        part(g,'box','gold',x+1.25+(i%3)*.16,y,z+1.18+Math.floor(i/3)*.16,.1,.1,.1);
    }
    function abacus(g,x,y,z){
      [-1,1].forEach(a=>part(g,'box','timber',x+a*1.15,y+.7,z,.12,1.5,.15));
      [0,1.4].forEach(h=>part(g,'box','wood',x,y+h,z,2.45,.13,.2));
      for(let row=0;row<3;row++){
        const rail=part(g,'cylinder','gold',x,y+.3+row*.4,z,.035,2.24,.035);rail.rotation.z=Math.PI/2;
        for(let bead=0;bead<10;bead++)part(g,'sphere',row===0?'teal':row===1?'coral':'gold',
          x-1.01+bead*.2,y+.3+row*.4,z,.14,.22,.14);
      }
    }
    function worker(root,animations,x,z,colour,phase=0,n=0){
      const figure=modelle&&modelle.bewohner(n,{phase});
      if(figure){figure.root.position.set(x,.22,z);figure.root.rotation.y=Math.PI+(x<0?-.6:.6);root.add(figure.root);animations.push(figure.takt);return figure.root;}
      const actor=group('Bewohner bei der Arbeit'),body=group('Arbeitskleidung');
      actor.position.set(x,.22,z);actor.rotation.y=Math.PI;root.add(actor);actor.add(body);
      [-1,1].forEach(a=>{
        part(body,'box','ink',a*.13,.21,0,.16,.36,.18);
        part(body,'box','ink',a*.13,.055,.055,.19,.11,.29);
      });
      part(body,'cylinder',colour,0,.65,0,.54,.59,.4);
      part(body,'box','wood',0,.49,.205,.31,.25,.035);
      part(body,'sphere','stone',0,1.12,0,.35,.39,.33);
      part(body,'cylinder',colour,0,1.29,0,.44,.055,.4);
      part(body,'sphere',colour,0,1.32,-.02,.34,.15,.33);
      bar(body,[-.25,.87,0],[-.34,.64,.14],.15,colour);
      part(body,'sphere','stone',-.34,.59,.15,.14,.15,.14);
      compact(body);
      const arm=group('Arbeitshand');arm.position.set(.25,.9,0);actor.add(arm);
      bar(arm,[0,0,0],[.08,-.18,.19],.15,colour);
      part(arm,'sphere','stone',.08,-.23,.24,.14,.14,.14);
      compact(arm);
      animations.push(t=>{
        arm.rotation.x=-.16+Math.sin(t*.8+phase)*.32;
        arm.rotation.z=.08+Math.cos(t*.8+phase)*.06;
        actor.position.y=.22+Math.sin(t*.8+phase)*.012;
      });
      return actor;
    }
    function balance(root,staticParts,animations,x,z){
      bench(staticParts,x,z,2.95,1.35);
      part(staticParts,'box','edge',x,1.17,z,.66,.18,.6);
      part(staticParts,'cylinder','gold',x,1.88,z,.15,1.42,.15);
      part(staticParts,'sphere','gold',x,2.61,z,.25,.25,.25);
      const beam=group('Waagebalken');beam.position.set(x,2.48,z);root.add(beam);
      part(beam,'box','gold',0,0,0,2.5,.085,.12);
      const pans=[];
      [-1,1].forEach(a=>{
        const pan=group('Waagschale');pan.position.x=a*1.08;beam.add(pan);pans.push(pan);
        [-.22,.22].forEach(dx=>bar(pan,[0,0,0],[dx,-.58,0],.023,'gold'));
        part(pan,'cylinder','gold',0,-.61,0,.72,.055,.65);
        part(pan,'cylinder',a<0?'teal':'coral',0,-.47,0,.32,.26,.32);
        compact(pan);
      });
      animations.push(t=>{const tilt=Math.sin(t*.65)*.065;beam.rotation.z=tilt;pans.forEach(p=>p.rotation.z=-tilt);});
      for(let i=0;i<3;i++)part(staticParts,'cylinder','ink',x-.8+i*.24,1.21,z+.45,.15,.22+i*.07,.15);
    }
    function ruler(g,x,y,z,length=2.4){
      part(g,'box','wood',x,y,z,length,.09,.3);
      for(let i=0;i<=24;i++)part(g,'box','ink',x-length/2+i*length/24,y+.048,z-.08,
        .016,.01,i%5===0?.2:.11);
    }
    function sundial(g,x,z){
      part(g,'cylinder','edge',x,.45,z,1.32,.49,1.32);
      part(g,'cylinder','chalk',x,.73,z,1.5,.1,1.5);
      const needle=part(g,'roof','gold',x,.99,z,.58,.47,.12);needle.rotation.y=Math.PI/4;
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        const mark=part(g,'box','ink',x+Math.sin(a)*.57,.788,z+Math.cos(a)*.57,.025,.012,.12);
        mark.rotation.y=a;
      }
    }
    function fractionTable(g,x,z,pieces,withMissing=false){
      part(g,'cylinder','timber',x,.58,z,.25,1.15,.25);
      part(g,'cylinder','edge',x,.1,z,.95,.2,.95);
      part(g,'cylinder','wood',x,1.14,z,1.95,.12,1.95);
      for(let i=0;i<pieces-(withMissing?1:0);i++){
        const wedge=new THREE.CylinderGeometry(.86,.86,.09,20,1,false,
          i*Math.PI*2/pieces+.025,Math.PI*2/pieces-.05);
        part(g,wedge,i%2?'chalk':'teal',x,1.25,z);
      }
    }
    function create(id,stage){
      if(!['zahlen','rechnen','messen','garten','hafen','turm','brueche'].includes(id))
        throw new RangeError('Unbekanntes Thema: '+id);
      stage=Math.max(0,Math.min(3,Math.floor(Number(stage)||0)));
      const root=group('Themenleben '+id+' · Stufe '+stage);
      root.userData.topic=id;root.userData.stage=stage;
      if(stage===0)return root;
      const statics=group('Arbeitsplätze und Nebenbauten'),animations=[];
      root.add(statics);
      const x=-4.8,z=1.65,sx=4.65,sz=-3.85;
      platform(statics,x,z,3.8,4.3);
      if(stage>=2)smallHouse(statics,sx,sz,id==='garten'||id==='turm'||id==='messen');
      if(stage===3)shelter(statics,x,z-1.38);

      if(id==='zahlen'){
        bench(statics,x,z,2.9,2);
        tray(statics,x,1.12,z,2.72,1.84);
        baseTen(statics,x-1.2,1.22,z-.75,stage>=2);
        if(stage>=2)abacus(statics,x,1.11,z-.96);
        if(stage>=2){crate(statics,sx-.58,.23,sz+.3,.62);crate(statics,sx+.32,.23,sz-.3,.52);}
        if(stage===3){
          bench(statics,sx,sz+.44,1.65,.72,.94);
          for(let i=0;i<5;i++)numberTile(statics,i+1,sx-.66+i*.33,1.28,sz+.7,i%2?'coral':'teal');
        }
        if(stage>=2){
          const block=group('Einerwürfel wird verschoben');root.add(block);
          part(block,'box','gold',0,0,0,.2,.2,.2);compact(block);
          animations.push(t=>block.position.set(x+.9+Math.sin(t*.8)*.22,1.28,z+.72));
        }
      }else if(id==='rechnen'){
        bench(statics,x,z,2.8,1.6);
        for(let i=0;i<3;i++)numberTile(statics,[3,2,5][i],x-.94+i*.91,1.46,z-.2);
        part(statics,'box','gold',x-.49,1.44,z-.13,.18,.04,.035);
        part(statics,'box','gold',x-.49,1.44,z-.13,.04,.18,.035);
        [-.04,.04].forEach(dy=>part(statics,'box','gold',x+.41,1.44+dy,z-.13,.18,.025,.035));
        for(let i=0;i<5;i++)part(statics,'box',i<3?'teal':'coral',x-.9+i*.42,1.19,z+.4,.26,.2,.26);
        if(stage>=2){
          bench(statics,sx,sz+.25,1.65,.9,.87);
          const wheel=group('Rechenrad');wheel.position.set(sx,.99,sz+.25);root.add(wheel);
          part(wheel,'cylinder','wood',0,0,0,1.1,.13,1.1);
          for(let i=0;i<10;i++){
            const a=i*Math.PI/5;
            part(wheel,'box',i%2?'teal':'coral',Math.sin(a)*.49,.12,Math.cos(a)*.49,.12,.12,.12);
          }
          compact(wheel);animations.push(t=>wheel.rotation.y=t*.12);
        }
        if(stage===3){
          // Eine kleine begehbare Verknüpfung führt zur zweiten Rechenstation.
          for(let i=0;i<7;i++)part(statics,'box','wood',sx,.18+Math.sin(i/6*Math.PI)*.22,sz+1.55+i*.2,1.32,.1,.18);
          [-1,1].forEach(a=>bar(statics,[sx+a*.69,.75,sz+1.5],[sx+a*.69,.75,sz+2.85],.065));
        }
      }else if(id==='messen'){
        if(stage===1){bench(statics,x,z,2.8,1.4);ruler(statics,x,1.13,z);crate(statics,x-.8,.2,z+1.2,.45);}
        else balance(root,statics,animations,x,z);
        if(stage>=2){
          bench(statics,sx,sz+.35,1.9,.75,.86);ruler(statics,sx,.99,sz+.35,1.7);
          part(statics,'box','wood',sx-.87,1.4,sz-.64,.14,2.36,.16);
          for(let i=0;i<12;i++)part(statics,'box','ink',sx-.85,.32+i*.18,sz-.546,i%3===0?.16:.09,.02,.018);
        }
        if(stage===3)for(let i=0;i<3;i++)part(statics,'box',['teal','coral','gold'][i],sx-.44+i*.4,.33,sz+1.5,.22,.2,1.1+i*.42);
      }else if(id==='garten'){
        const circle=part(statics,'ring','gold',x,.22,z,3.1,3.1,3.1);circle.rotation.x=-Math.PI/2;
        const shapesToShow=stage===1?1:3;
        for(let i=0;i<shapesToShow;i++){
          const px=x-.93+i*.93;
          part(statics,'cylinder','edge',px,.48,z,.64,.5,.64);
          const shape=part(statics,['box','sphere','roof'][i],['teal','coral','gold'][i],px,1.03,z,
            i===0?.56:.68,i===2?.72:.68,i===0?.56:.68);
          if(i===2)shape.rotation.y=Math.PI/4;
        }
        if(stage>=2){
          bench(statics,sx,sz+.33,1.8,.86,.84);
          const compass=group('Zirkel wird geführt');compass.position.set(sx,.99,sz+.33);root.add(compass);
          bar(compass,[0,0,0],[.58,.13,0],.045,'gold');
          bar(compass,[0,0,0],[.3,.13,.48],.045,'gold');compact(compass);
          animations.push(t=>compass.rotation.y=Math.sin(t*.3)*.7);
          const ring=part(statics,'ring','ink',sx,.922,sz+.33,1.16,1.16,1.16);ring.rotation.x=-Math.PI/2;
        }
        if(stage===3){
          part(statics,'box','teal',sx-.5,.34,sz+1.65,.48,.25,.48);
          part(statics,'sphere','coral',sx+.1,.5,sz+1.65,.55,.55,.55);
          const pyramid=part(statics,'roof','gold',sx+.73,.48,sz+1.65,.63,.52,.63);pyramid.rotation.y=Math.PI/4;
        }
      }else if(id==='hafen'){
        bench(statics,x,z,2.8,1.55);
        for(let k=0;k<(stage===1?1:3);k++){
          tray(statics,x-.82+k*.82,1.13,z,.65,.85);
          for(let i=0;i<4;i++)coin(statics,x-1.01+k*.82+(i%2)*.25,1.2,z-.2+Math.floor(i/2)*.34,.1,k===1?2:k===2?5:1);
        }
        if(stage>=2){
          bench(statics,sx,sz+.38,1.65,.85,.92);
          crate(statics,sx-.68,.23,sz-.5,.42);
          for(let i=0;i<5;i++)coin(statics,sx+.38,1.04+i*.042,sz+.33,.13,5);
          const moving=group('Münze wird sortiert');root.add(moving);coin(moving,0,0,0,.115,2);compact(moving);
          animations.push(t=>moving.position.set(x+.2+Math.sin(t*.8)*.34,1.24,z+.55));
        }
        if(stage===3){
          crate(statics,x-1.15,.23,z+1.3,.56);
          for(let i=0;i<4;i++)part(statics,'sphere',i%2?'green':'coral',x-1.3+(i%2)*.23,.85,z+1.15+Math.floor(i/2)*.22,.21,.22,.21);
        }
      }else if(id==='turm'){
        bench(statics,x,z,2.8,1.4);
        const face=part(statics,'cylinder','chalk',x,1.99,z-.15,1.66,.12,1.66);face.rotation.x=Math.PI/2;
        part(statics,'ring','gold',x,1.99,z-.071,1.72,1.72,1.72);
        for(let i=0;i<12;i++){
          const a=i*Math.PI/6;
          const tick=part(statics,'box','ink',x+Math.sin(a)*.65,1.99+Math.cos(a)*.65,z-.06,.045,i%3===0?.16:.09,.025);
          tick.rotation.z=-a;
        }
        const hand=group('Uhrzeiger werden eingestellt');hand.position.set(x,1.99,z-.025);root.add(hand);
        part(hand,'box','teal',0,.23,0,.055,.53,.035);part(hand,'sphere','gold',0,0,.025,.1,.1,.08);compact(hand);
        const hour=part(statics,'box','ink',x+.16,2.12,z-.015,.41,.065,.03);hour.rotation.z=.65;
        if(stage>=2)animations.push(t=>hand.rotation.z=-t*.1);
        if(stage>=2)sundial(statics,sx,sz+.25);
        if(stage===3){
          part(statics,'cone','gold',x-1.06,1.53,z+.3,.24,.22,.24);
          const sand=part(statics,'cone','gold',x-1.06,1.29,z+.3,.24,.22,.24);sand.rotation.z=Math.PI;
          [1.13,1.7].forEach(y=>part(statics,'box','wood',x-1.06,y,z+.3,.45,.07,.45));
          [-1,1].forEach(a=>[-1,1].forEach(b=>part(statics,'box','timber',x-1.06+a*.18,1.42,z+.3+b*.18,.035,.55,.035)));
          // Der offene Rahmen hält Sand und Form des Stundenglases gut lesbar.
        }
      }else if(id==='brueche'){
        fractionTable(statics,x,z,stage===1?2:4,stage>=2);
        if(stage>=2){
          fractionTable(statics,sx,sz+.3,3);
          const piece=group('Viertel wird ergänzt');root.add(piece);
          const wedge=new THREE.CylinderGeometry(.86,.86,.09,20,1,false,Math.PI*1.5+.025,Math.PI/2-.05);
          part(piece,wedge,'chalk',0,0,0);compact(piece);
          animations.push(t=>piece.position.set(x+.18+.16*Math.sin(t*.65),1.29,z+.08+.12*Math.sin(t*.65)));
        }
        if(stage===3){
          bench(statics,x,z+1.3,2.4,.6,.7);
          for(let i=0;i<6;i++)part(statics,'box',i%2?'chalk':'teal',x-1+i*.39,.82,z+1.3,.36,.12,.45);
        }
      }
      compact(statics);
      const n=['zahlen','rechnen','messen','garten','hafen','turm','brueche'].indexOf(id)*2+1;
      if(stage>=2)worker(root,animations,x+.25,z+1.55,'teal',0,n);
      if(stage===3)worker(root,animations,sx+.26,sz+1.6,'coral',1.1,n+1);
      root.userData.stationCount=stage===1?1:stage===2?2:3;
      entries.push({root,animations});
      // Synchroner Startzustand: keine schwebenden Requisiten bis zum ersten update().
      animations.forEach(fn=>fn(0));
      return root;
    }
    function update(timeSeconds){
      const t=Number.isFinite(timeSeconds)?timeSeconds:0;
      entries.forEach(({root,animations})=>{
        let parent=root;
        while(parent){if(!parent.visible)return;parent=parent.parent;}
        animations.forEach(fn=>fn(t));
      });
    }
    return {create,update};
  };
})(globalThis);
