/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Drei erfundene Bautraditionen. Alle Formen, Requisiten und Bewohner sind
   Geometrie; keine Bildkulisse, keine externen Ressourcen und keine eigene Uhr. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  // modelle (optional, W3.ModellFabrik): fertige Häuser je Fach und Bewohner mit Skelett statt der Geometrie aus Grundformen
  W3.Fachbauten = function (THREE, modelle, baustufen) {
    const HAUS = { de: 'buchhueter-haus', en: 'kuestenbund-haus', nmg: 'waldhueter-pavillon' };
    // Baustellen-Set vor dem Haupthaus je Stufe (W3.Baustufen): [Modell, Breite, x, z (Raum des Hauses, Mitte bei 0, -1), Drehung]
    const SET = [[['steinpalette', 1.5, -1.4, 2.5, .3], ['schubkarre', 1.6, .4, 2.7, -.7]],
      [['steinpalette', 1.5, -1.4, 2.5, .3], ['bretterstapel', 2.3, 2, 2.4, 0], ['schubkarre', 1.6, .4, 2.7, -.7]],
      [['bretterstapel', 2.3, 2, 2.4, 0], ['schubkarre', 1.6, -1, 2.7, .5]]];
    const rohbau = (subject, level) => baustufen && baustufen.hat(HAUS[subject]) ? baustufen.stufe(HAUS[subject], level, { breite: 4.6, tiefe: 3.9, hoehe: 4.8, requisiten: SET[level] }) : null;
    const colours = {
      de:{wall:'#f0dec0',trim:'#c5a878',wood:'#694634',roof:'#a34339',roofEdge:'#75352e',
        ink:'#34414b',gold:'#c49b53',paper:'#fff0d2',accent:'#bc6650',leaf:'#879968',skin:'#d8b08a'},
      en:{wall:'#eff1db',trim:'#c4c5b3',wood:'#9d7350',roof:'#335f98',roofEdge:'#26476e',
        ink:'#293d52',gold:'#d2a752',paper:'#fff3dc',accent:'#708fbb',leaf:'#7d9f86',skin:'#d8b08a'},
      nmg:{wall:'#d9c8a4',trim:'#9f9c7a',wood:'#79583d',roof:'#4e8057',roofEdge:'#315d45',
        ink:'#354a40',gold:'#c6a55d',paper:'#eef0d5',accent:'#90b8aa',leaf:'#6c9852',skin:'#d8b08a'}
    };
    const materials = {};
    Object.entries(colours).forEach(([subject,palette])=>{
      materials[subject]={};
      Object.entries(palette).forEach(([name,color])=>{
        materials[subject][name]=new THREE.MeshStandardMaterial({
          color,roughness:name==='gold'?.48:.84,metalness:name==='gold'?.25:0,flatShading:true
        });
      });
    });
    const shapes={
      box:new THREE.BoxGeometry(1,1,1),
      cylinder:new THREE.CylinderGeometry(.5,.5,1,16),
      sphere:new THREE.SphereGeometry(.5,12,8),
      cone:new THREE.ConeGeometry(.5,1,12),
      hex:new THREE.CylinderGeometry(.5,.5,1,6),
      hexRoof:new THREE.ConeGeometry(.5,1,6),
      hip:new THREE.ConeGeometry(.5,1,4),
      ring:new THREE.TorusGeometry(.5,.035,6,32)
    };
    const roofGeometry=new THREE.BufferGeometry();
    roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
      -.5,0,-.5, 0,1,-.5, .5,0,-.5,
      .5,0,.5, 0,1,.5, -.5,0,.5,
      -.5,0,-.5, -.5,0,.5, 0,1,.5,
      -.5,0,-.5, 0,1,.5, 0,1,-.5,
      0,1,-.5, 0,1,.5, .5,0,.5,
      0,1,-.5, .5,0,.5, .5,0,-.5
    ],3));roofGeometry.computeVertexNormals();shapes.gable=roofGeometry;
    const entries=[];
    const ids=['zahlen','rechnen','messen','garten','hafen','turm','brueche'];
    function group(name){const g=new THREE.Group();g.name=name;return g;}
    function part(g,s,mat,x,y,z,w=1,h=1,d=1){
      const mesh=new THREE.Mesh(shapes[s],g.userData.palette[mat]);
      mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
      mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
    }
    function branch(parent,name){const g=group(name);g.userData.palette=parent.userData.palette;parent.add(g);return g;}
    function bar(g,a,b,width,mat='wood'){
      const start=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(start);
      const m=part(g,'box',mat,start.x+delta.x/2,start.y+delta.y/2,start.z+delta.z/2,width,delta.length(),width);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
    }
    // Zusammenführen je Material bewahrt Details bei wenigen Zeichenaufrufen.
    function compact(root){
      root.updateMatrixWorld(true);
      const inverse=root.matrixWorld.clone().invert(),batches=new Map(),remove=[];
      root.traverse(o=>{
        if(!o.isMesh)return;
        if(!batches.has(o.material))batches.set(o.material,{p:[],n:[]});
        const batch=batches.get(o.material),geo=o.geometry;
        const matrix=inverse.clone().multiply(o.matrixWorld);
        const normals=new THREE.Matrix3().getNormalMatrix(matrix),pos=geo.attributes.position,norm=geo.attributes.normal;
        const count=geo.index?geo.index.count:pos.count,p=new THREE.Vector3(),n=new THREE.Vector3();
        for(let i=0;i<count;i++){
          const j=geo.index?geo.index.getX(i):i;
          p.fromBufferAttribute(pos,j).applyMatrix4(matrix);
          n.fromBufferAttribute(norm,j).applyMatrix3(normals).normalize();
          batch.p.push(p.x,p.y,p.z);batch.n.push(n.x,n.y,n.z);
        }
        remove.push(o);
      });
      remove.forEach(o=>o.removeFromParent());
      batches.forEach((b,material)=>{
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
        geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));
        geo.computeBoundingBox();geo.computeBoundingSphere();
        const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
      });
    }
    function base(g,x,z,w,d){
      part(g,'box','trim',x,.09,z,w,.18,d);
      part(g,'box','wall',x,.21,z,w-.12,.08,d-.12);
      for(let i=1;i<4;i++)part(g,'box','trim',x-w/2+w*i/4,.256,z,.018,.014,d-.15);
      part(g,'box','trim',x,.07,z+d/2+.16,w*.58,.14,.32);
    }
    function windowFrame(g,x,y,z,w=.65,h=.8){
      part(g,'box','ink',x,y,z,w,h,.04);
      [-1,1].forEach(s=>{
        part(g,'box','paper',x+s*(w/2+.035),y,z+.025,.065,h+.15,.065);
        part(g,'box','paper',x,y+s*(h/2+.035),z+.025,w+.13,.065,.065);
      });
      part(g,'box','wood',x,y,z+.05,.04,h,.04);
      part(g,'box','wood',x,y,z+.05,w,.04,.04);
    }
    function door(g,x,z,height=1.45){
      part(g,'box','wood',x,.27+height/2,z,.77,height,.07);
      [-.29,-.14,0,.14,.29].forEach(a=>part(g,'box','roofEdge',x+a,.27+height/2,z+.041,.018,height,.014));
      part(g,'sphere','gold',x+.23,.98,z+.09,.075,.075,.075);
      part(g,'box','trim',x,height+.3,z,.95,.13,.14);
    }
    function timber(g,x,z,w,d,level,roof){
      base(g,x,z,w+.45,d+.4);
      if(level<2){
        if(level===1){
          part(g,'box','wall',x,.45,z-d/2,w,.4,.18);
          [-1,1].forEach(a=>part(g,'box','wood',x+a*w/2,.75,z-d/2,.15,1.2,.15));
        }return;
      }
      const h=level===2?1.55:2.65;
      part(g,'box','wall',x,.25+h/2,z,w,h,d);
      [-1,1].forEach(a=>[-1,1].forEach(b=>part(g,'box','wood',x+a*(w/2+.015),.25+h/2,z+b*d/2,.14,h+.08,.14)));
      [.35,1.5,h+.25].forEach(y=>part(g,'box','wood',x,y,z+d/2+.025,w+.2,.12,.13));
      [-1,1].forEach(a=>{
        part(g,'box','wood',x+a*w*.26,.25+h/2,z+d/2+.04,.1,h,.13);
        bar(g,[x+a*w*.28,.41,z+d/2+.1],[x+a*w*.47,1.43,z+d/2+.1],.08);
      });
      door(g,x,z+d/2+.075,1.18);
      if(level===3){
        windowFrame(g,x-w*.31,2.1,z+d/2+.08,.58,.62);
        windowFrame(g,x+w*.31,2.1,z+d/2+.08,.58,.62);
        part(g,'gable','roof',x,h+.27,z,w+.6,roof?1.55:1.05,d+.55);
        part(g,'box','roofEdge',x,h+(roof?1.85:1.35),z,.16,.12,d+.65);
        [-1,1].forEach(a=>part(g,'box','roofEdge',x+a*(w/2+.3),h+.27,z,.11,.16,d+.65));
        part(g,'box','wall',x+w*.27,h+1.1,z-.55,.43,1.5,.42);
        part(g,'box','trim',x+w*.27,h+1.88,z-.55,.57,.13,.55);
      }else{
        [-1,1].forEach(a=>bar(g,[x+a*w/2,h+.3,z-d/2],[x,h+1.45,z-d/2],.13));
        part(g,'box','wood',x,h+1.45,z,.13,.13,d+.2);
      }
    }
    function coastHouse(g,x,z,w,d,level,main=false){
      base(g,x,z,w+.55,d+.55);
      if(level<2){
        if(level===1)part(g,'box','wall',x,.43,z-d/2,w,.36,.18);return;
      }
      const h=level===2?1.3:2.4;
      part(g,'box','wall',x,.25+h/2,z,w,h,d);
      part(g,'box','trim',x,.42,z,w+.12,.25,d+.12);
      [-1,1].forEach(a=>part(g,'box','paper',x+a*w/2,.25+h/2,z+d/2+.04,.19,h,.15));
      door(g,x,z+d/2+.05,1.5);
      if(level===3){
        [-1,1].forEach(a=>{
          windowFrame(g,x+a*w*.31,1.65,z+d/2+.06,.55,.9);
          [-1,1].forEach(b=>part(g,'box','roof',x+a*w*.31+b*.38,1.65,z+d/2+.13,.17,.95,.06));
        });
        const r=part(g,'hip','roof',x,h+.85,z,(w+.8)*1.42,1.22,(d+.8)*1.42);r.rotation.y=Math.PI/4;
        part(g,'box','roofEdge',x,h+.25,z,w+.65,.16,d+.65);
        part(g,'sphere','gold',x,h+1.49,z,.16,.19,.16);
        if(main){
          const tx=x-w*.32,tz=z-.5;
          part(g,'cylinder','wall',tx,3.13,tz,.84,1.36,.84);
          part(g,'cylinder','roofEdge',tx,3.86,tz,.95,.12,.95);
          part(g,'cone','roof',tx,4.22,tz,1.2,.68,1.2);
          part(g,'cylinder','gold',tx,4.78,tz,.035,.48,.035);
          const flag=part(g,'box','gold',tx+.2,4.9,tz,.4,.19,.025);flag.rotation.y=.25;
        }
      }else{
        for(let i=0;i<4;i++)part(g,'box','wood',x-w/2+i*w/3,h+.35,z,.1,.1,d+.3);
      }
    }
    function natureHouse(g,x,z,w,d,level,main=false){
      const r=w/2;
      part(g,'hex','trim',x,.12,z,w+.5,.24,d+.5);
      part(g,'hex','wood',x,.3,z,w+.25,.15,d+.25);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3,px=x+Math.sin(a)*r*.83,pz=z+Math.cos(a)*d*.415;
        part(g,'cylinder','wood',px,level<2?.55:1.5,pz,.19,level<2?.5:2.4,.19);
        part(g,'cylinder','trim',px,.19,pz,.4,.3,.4);
      }
      if(level<2)return;
      if(level===2){
        part(g,'hex','wood',x,2.75,z,w+.3,.14,d+.3);
        [-1,1].forEach(a=>bar(g,[x+a*r,2.77,z],[x,3.65,z],.1));return;
      }
      part(g,'hex','wood',x,2.75,z,w+.4,.15,d+.4);
      const roof=part(g,'hexRoof','roof',x,3.45,z,w+1.15,1.35,d+1.15);roof.rotation.y=Math.PI/6;
      const rim=part(g,'hexRoof','roofEdge',x,2.9,z,w+1.17,.25,d+1.17);rim.rotation.y=Math.PI/6;
      if(main){
        const cap=part(g,'hexRoof','roof',x,4.03,z,w*.5,.85,d*.5);cap.rotation.y=Math.PI/6;
        part(g,'sphere','gold',x,4.47,z,.14,.2,.14);
      }
      // Offene Sicht auf den Arbeitstisch statt geschlossener Wand.
      part(g,'box','wall',x,1.06,z-d*.33,w*.65,1.38,.19);
      part(g,'box','accent',x,1.48,z-d*.33+.12,w*.45,.58,.045);
      for(let i=-1;i<=1;i++)part(g,'box','wood',x+i*w*.15,1.48,z-d*.33+.155,.035,.65,.04);
      [-1,1].forEach(a=>{
        part(g,'box','wood',x+a*w*.39,.95,z,.11,.12,d*.4);
        for(let i=0;i<4;i++)part(g,'box','wood',x+a*w*.39,.62,z-d*.2+i*d*.13,.055,.65,.06);
      });
      part(g,'box','wood',x,.18,z+d*.45,w*.53,.16,.48);
      part(g,'box','wood',x,.08,z+d*.45+.38,w*.53,.16,.29);
    }
    function bench(g,x,z,w=2.8,d=1.45){
      [-1,1].forEach(a=>[-1,1].forEach(b=>part(g,'box','wood',x+a*(w/2-.13),.57,z+b*(d/2-.13),.13,1.14,.13)));
      part(g,'box','wood',x,1.13,z,w,.16,d);
      part(g,'box','trim',x,.35,z,w-.2,.08,d-.2);
    }
    function book(g,x,y,z,w=.55,d=.72,open=false){
      if(open){
        [-1,1].forEach(a=>{
          const cover=part(g,'box','roof',x+a*w*.29,y,z,w*.6,.045,d);cover.rotation.z=-a*.13;
          const page=part(g,'box','paper',x+a*w*.29,y+.065,z,w*.54,.065,d-.08);page.rotation.z=-a*.13;
          for(let i=0;i<4;i++)part(g,'box','trim',x+a*w*.29,y+.107,z-d*.28+i*d*.18,w*.34,.008,.017);
        });
        part(g,'box','gold',x,y+.11,z,.025,.025,d*.86);
      }else{
        part(g,'box','roof',x,y,z,w,.16,d);
        part(g,'box','paper',x+.022,y+.012,z,w-.045,.11,d-.05);
        part(g,'box','roof',x,y+.095,z,w,.03,d);
      }
    }
    function shelf(g,x,z){
      part(g,'box','wood',x,1.18,z,2.1,2.05,.28);
      for(let row=0;row<3;row++){
        part(g,'box','trim',x,.35+row*.61,z+.28,2.15,.09,.7);
        for(let i=0;i<7;i++){
          const colour=i%3===0?'roof':i%3===1?'gold':'accent';
          part(g,'box',colour,x-.83+i*.27,.63+row*.61,z+.31,.18,.43+(i%2)*.08,.43);
          part(g,'box','paper',x-.83+i*.27,.61+row*.61,z+.535,.12,.022,.013);
        }
      }
    }
    function letter(g,char,x,y,z,s=.5){
      const line=(a,b)=>bar(g,[x+a[0]*s,y+a[1]*s,z],[x+b[0]*s,y+b[1]*s,z],s*.105,'paper');
      if(char==='A'){line([-.35,-.5],[0,.5]);line([0,.5],[.35,-.5]);line([-.22,-.1],[.22,-.1]);}
      if(char==='B'){line([-.3,-.5],[-.3,.5]);line([-.3,.5],[.25,.38]);line([.25,.38],[.22,.05]);line([.22,.05],[-.3,0]);line([-.3,0],[.25,-.1]);line([.25,-.1],[.25,-.4]);line([.25,-.4],[-.3,-.5]);}
      if(char==='C'){line([.3,.4],[-.15,.5]);line([-.15,.5],[-.32,.15]);line([-.32,.15],[-.32,-.25]);line([-.32,-.25],[-.12,-.5]);line([-.12,-.5],[.3,-.4]);}
    }
    function alphabet(g,x,y,z){
      for(let i=0;i<3;i++){
        part(g,'box',i===1?'accent':'roof',x-.7+i*.7,y,z,.59,.83,.11);
        letter(g,'ABC'[i],x-.7+i*.7,y,z+.072,.54);
      }
    }
    function scroll(g,x,y,z,w=1.5,d=.75){
      part(g,'box','paper',x,y,z,w,.035,d);
      [-1,1].forEach(a=>{const roll=part(g,'cylinder','paper',x+a*w/2,y+.055,z,.14,d+.08,.14);roll.rotation.x=Math.PI/2;});
      for(let i=0;i<4;i++)part(g,'box','trim',x,y+.021,z-d*.3+i*d*.2,w*.65,.008,.02);
    }
    function globe(g,x,y,z){
      part(g,'cylinder','wood',x,y+.2,z,.12,.4,.12);
      part(g,'cylinder','trim',x,y+.02,z,.5,.05,.5);
      part(g,'sphere','accent',x,y+.67,z,.9,.9,.9);
      const ring=part(g,'ring','gold',x,y+.67,z,1.1,1.1,1.1);ring.rotation.z=-.27;
      const equator=part(g,'ring','paper',x,y+.67,z,.92,.92,.92);equator.rotation.x=Math.PI/2;
      for(let i=0;i<5;i++)part(g,'sphere','leaf',x+Math.sin(i*1.3)*.32,y+.6+Math.cos(i*1.4)*.25,z+.28,.25,.18,.13);
    }
    function plant(g,x,y,z,size=1){
      part(g,'cylinder','roofEdge',x,y+.18*size,z,.42*size,.36*size,.42*size);
      part(g,'cylinder','wood',x,y+.65*size,z,.04*size,.7*size,.04*size);
      for(let i=0;i<5;i++){
        const a=i*2.4,leaf=part(g,'sphere','leaf',x+Math.cos(a)*.16*size,y+.48*size+i*.13*size,z+Math.sin(a)*.16*size,.36*size,.1*size,.18*size);
        leaf.rotation.z=.2*Math.sin(a);leaf.rotation.y=-a;
      }
    }
    function horn(g,x,y,z){
      part(g,'cylinder','gold',x,y+.15,z,.1,.3,.1);
      const cone=part(g,'cone','gold',x,y+.55,z+.13,.8,.9,.8);cone.rotation.x=.85;
      const mouth=part(g,'cylinder','roofEdge',x,y+.88,z+.45,.67,.025,.67);mouth.rotation.x=.85;
      part(g,'box','wood',x,y+.02,z,1,.2,.7);
    }
    function subjectProps(g,subject,id,x,z,full,root,animations){
      bench(g,x,z);
      if(subject==='de'){
        if(id==='zahlen'||id==='turm'){
          book(g,x,1.3,z,1.25,.9,true);
          if(full)shelf(g,x,z-.8);
        }else if(id==='rechnen'){
          scroll(g,x-.25,1.24,z,1.45,.9);
          part(g,'cylinder','ink',x+1,1.34,z-.28,.24,.25,.24);
          bar(g,[x+.95,1.43,z-.28],[x+1.15,2.02,z-.35],.035,'gold');
          const feather=part(g,'sphere','paper',x+1.16,1.94,z-.35,.18,.55,.035);feather.rotation.z=-.33;
        }else if(id==='messen'||id==='garten'||id==='brueche'){
          alphabet(g,x,1.7,z-.32);
          for(let i=0;i<4;i++)book(g,x-.85+i*.55,1.25,z+.37,.4,.44);
          if(full&&id==='garten'){
            [-1,1].forEach(a=>part(g,'box','wood',x+a*1.23,1.7,z-.55,.08,1.2,.08));
            part(g,'box','gold',x,2.19,z-.55,2.5,.035,.035);
          }
        }else{
          horn(g,x-.6,1.23,z-.15);
          book(g,x+.7,1.3,z+.15,.7,.8,true);
          if(full)part(g,'box','roof',x,1.8,z-.75,2.7,.3,.1);
        }
      }else if(subject==='en'){
        if(id==='zahlen'){
          alphabet(g,x,1.7,z-.3);globe(g,x+.8,1.23,z+.15);
        }else if(id==='rechnen'||id==='messen'){
          horn(g,x-.65,1.23,z-.1);scroll(g,x+.6,1.24,z+.15,.8,.55);
          if(full){
            const mast=part(g,'cylinder','gold',x+1.1,1.9,z-.6,.04,1.7,.04);
            part(g,'box','roof',mast.position.x+.2,2.57,z-.6,.45,.31,.03);
          }
        }else if(id==='garten'||id==='brueche'){
          book(g,x,1.3,z,1.3,.95,true);if(full)shelf(g,x,z-.8);
        }else if(id==='hafen'){
          scroll(g,x-.4,1.25,z,1.2,.85);
          part(g,'box','roof',x+.9,1.42,z-.2,.55,.45,.36);
          part(g,'box','paper',x+.9,1.65,z-.2,.48,.03,.27);
          bar(g,[x+.76,1.7,z-.24],[x+.9,2.1,z-.29],.04,'gold');
        }else{
          globe(g,x-.55,1.24,z-.1);
          for(let i=0;i<3;i++)part(g,'cylinder',i===1?'gold':'roof',x+.4+i*.25,1.3,z+.3,.2,.12,.2);
          if(full)scroll(g,x+.65,1.24,z-.4,1.05,.5);
        }
      }else if(id==='zahlen'){
        for(let i=0;i<3;i++)plant(g,x-.85+i*.83,1.24,z,.8+i*.1);
        if(full){
          for(let i=0;i<3;i++){
            part(g,'box','wood',x-.9+i*.9,.2,z+1.25,.78,.35,.65);
            part(g,'box','ink',x-.9+i*.9,.39,z+1.25,.65,.035,.53);
            plant(g,x-.9+i*.9,.4,z+1.25,.6);
          }
        }
      }else if(id==='rechnen'){
        for(let i=0;i<4;i++){
          part(g,'box','trim',x-.9+i*.6,1.3,z,.5,.15,.6);
          part(g,i%2?'cylinder':'sphere',i%2?'gold':'accent',x-.9+i*.6,1.55,z,.3,.34,.3);
        }
        if(full)plant(g,x+1,1.26,z-.4,.65);
      }else if(id==='messen'){
        part(g,'cylinder','accent',x-.65,1.55,z,.42,.61,.42);
        part(g,'cylinder','paper',x+.05,1.57,z,.4,.68,.4);
        for(let i=0;i<5;i++)part(g,'box','ink',x+.05,1.32+i*.11,z+.205,.15,.016,.01);
        part(g,'cylinder','wood',x+.9,1.9,z-.4,.07,1.5,.07);
        const rotor=branch(root,'Windmessrad');rotor.position.set(x+.9,2.62,z-.4);
        for(let i=0;i<4;i++){
          const a=i*Math.PI/2;
          bar(rotor,[0,0,0],[Math.cos(a)*.45,Math.sin(a)*.45,0],.035,'gold');
          part(rotor,'sphere','roof',Math.cos(a)*.45,Math.sin(a)*.45,0,.25,.25,.15);
        }
        compact(rotor);animations.push(t=>rotor.rotation.z=-t*.32);
      }else if(id==='garten'){
        part(g,'cylinder','wall',x,1.77,z,.5,.65,.35);
        part(g,'sphere','wall',x,2.28,z,.36,.42,.34);
        [-1,1].forEach(a=>{
          bar(g,[x+a*.2,1.91,z],[x+a*.48,1.6,z],.1,'wood');
          part(g,'box','wood',x+a*.14,1.36,z,.12,.29,.12);
        });
        if(full){plant(g,x-1,1.23,z,.8);scroll(g,x+.8,1.25,z+.2,.6,.55);}
      }else if(id==='hafen'){
        scroll(g,x,1.25,z,2,.95);
        const compass=part(g,'ring','gold',x,1.29,z,.65,.65,.65);compass.rotation.x=-Math.PI/2;
        const needle=part(g,'box','roof',x,1.31,z,.05,.03,.5);needle.rotation.y=.6;
        if(full)globe(g,x+.8,1.24,z-.35);
      }else if(id==='turm'){
        for(let i=0;i<3;i++){
          part(g,i===0?'cone':i===1?'box':'cylinder',i===0?'wood':i===1?'wall':'accent',x-.85+i*.85,1.54,z,.65,.55,.55);
          if(i===1){const roof=part(g,'hip','roof',x,1.95,z,.98,.35,.85);roof.rotation.y=Math.PI/4;}
        }
        if(full)scroll(g,x,1.25,z+.55,2.1,.24);
      }else{
        part(g,'box','wood',x,1.29,z,1.9,.13,.85);
        const wheel=branch(root,'Antriebsrad');wheel.position.set(x,1.9,z);
        part(wheel,'ring','gold',0,0,0,1.05,1.05,1.05);
        for(let i=0;i<6;i++){
          const a=i*Math.PI/3;
          bar(wheel,[0,0,0],[Math.cos(a)*.48,Math.sin(a)*.48,0],.045,'wood');
          const tooth=part(wheel,'box','roof',Math.cos(a)*.55,Math.sin(a)*.55,0,.19,.15,.16);tooth.rotation.z=a;
        }
        compact(wheel);animations.push(t=>wheel.rotation.z=t*.24);
        if(full){part(g,'cylinder','gold',x+.9,1.45,z+.25,.2,.32,.2);scroll(g,x-.8,1.26,z+.3,.65,.5);}
      }
    }
    function resident(root,animations,x,z,subject,phase,n){
      const figure=modelle&&modelle.bewohner(n,{phase});
      if(figure){figure.root.position.set(x,.25,z);figure.root.rotation.y=Math.PI+(x<0?-.6:.6);root.add(figure.root);animations.push(figure.takt);return;}
      const actor=branch(root,'Bewohner bei der Themenarbeit');actor.position.set(x,.25,z);actor.rotation.y=Math.PI;
      const body=branch(actor,'Arbeitskleidung');
      [-1,1].forEach(a=>{
        part(body,'box','ink',a*.12,.22,0,.17,.36,.18);
        part(body,'box','wood',a*.12,.06,.07,.2,.11,.29);
      });
      part(body,'cylinder',phase?'accent':'roof',0,.66,0,.54,.6,.42);
      part(body,'box','paper',0,.57,.22,.29,.38,.035);
      part(body,'sphere','skin',0,1.13,0,.35,.4,.34);
      if(subject==='de'){
        part(body,'sphere','roof',0,1.32,-.02,.45,.17,.41);
        part(body,'cylinder','roofEdge',0,1.28,0,.5,.045,.45);
      }else if(subject==='en'){
        part(body,'cylinder','paper',0,1.32,0,.42,.17,.38);
        part(body,'box','roof',0,1.27,.12,.4,.04,.24);
      }else{
        part(body,'cone','gold',0,1.4,0,.6,.23,.6);
        part(body,'cylinder','gold',0,1.29,0,.72,.035,.72);
      }
      bar(body,[-.23,.89,0],[-.34,.66,.18],.14,phase?'accent':'roof');
      part(body,'sphere','skin',-.34,.62,.2,.14,.15,.14);compact(body);
      const hand=branch(actor,'Werkzeughand');hand.position.set(.25,.9,0);
      bar(hand,[0,0,0],[.08,-.17,.2],.14,phase?'accent':'roof');
      part(hand,'sphere','skin',.08,-.21,.24,.15,.14,.14);
      bar(hand,[.08,-.18,.24],[.08,.05,.32],.035,'wood');compact(hand);
      animations.push(t=>{hand.rotation.x=-.1+Math.sin(t*.75+phase)*.3;actor.position.y=.25+Math.sin(t*.75+phase)*.012;});
    }
    function create(subject,id,stage){
      if(!materials[subject]||!ids.includes(id))throw new RangeError('Unbekanntes Fachareal: '+subject+'/'+id);
      stage=Math.max(0,Math.min(3,Math.floor(Number(stage)||0)));
      const root=group('Fachareal '+subject+'/'+id+' · Stufe '+stage);
      root.userData={subject,topic:id,stage,palette:materials[subject]};
      const statics=branch(root,'Bauten und Lerngegenstände'),animations=[];
      if(stage===0){
        [-1,1].forEach(a=>[-1,1].forEach(b=>{
          part(statics,'box','wood',a*2.7,.3,-.8+b*2,.09,.6,.09);
          part(statics,'sphere','gold',a*2.7,.62,-.8+b*2,.12,.12,.12);
        }));
        [-1,1].forEach(a=>{
          part(statics,'box','trim',0,.025,-.8+a*2,5.4,.05,.07);
          part(statics,'box','trim',a*2.7,.025,-.8,.07,.05,4);
        });
        compact(statics);root.traverse(o=>delete o.userData.palette);
        const sockel=rohbau(subject,0);if(sockel){sockel.position.set(0,0,-1);root.add(sockel);}
        return root;
      }
      const procedural=subject==='de'?timber:subject==='en'?coastHouse:natureHouse,houses=[];
      // Fertige Häuser kommen aus dem Modell, Bauphasen als Schnitt durch dasselbe Modell (W3.Baustufen), ohne Modell aus Grundformen.
      // Modelle bleiben ausserhalb von compact(), das die Farben je Dreieck nicht kennt. Das kleine Haus entsteht in Stufe 2 und wächst dort vom Boden auf.
      const build=(g,x,z,w,d,level,main)=>{
        const roh=level<3&&main?rohbau(subject,level):null;
        if(roh){roh.position.set(x,0,z);houses.push(roh);return;}
        if(level<3||!modelle||!modelle.hat(HAUS[subject]))return procedural(g,x,z,w,d,level,main);
        const house=modelle.statisch(HAUS[subject],{name:'Haus '+subject,breite:w+.6,tiefe:d+.6,hoehe:main?4.8:3.6});
        if(!main)house.userData.wachsAb=stage===2?0:1;
        house.position.set(x,0,z);houses.push(house);
      };
      build(statics,0,-1,4,3.3,stage,true);
      base(statics,-4.55,.35,3.5,3.5);
      subjectProps(statics,subject,id,-4.55,.3,stage===3,root,animations);
      if(stage>=2){
        build(statics,4.65,-2,2.65,2.55,3,false);
        bench(statics,4.65,.3,2.1,.95);
        if(subject==='nmg'){
          if(id==='zahlen'||id==='garten')plant(statics,4.65,1.23,.3,.9);
          else if(id==='hafen')globe(statics,4.65,1.23,.3);
          else scroll(statics,4.65,1.24,.3,1.55,.65);
        }else book(statics,4.65,1.3,.3,1.15,.68,true);
      }
      if(stage===3){
        // Einheitliche Zunftfarben, aber für jedes Thema andere Arbeitsplätze.
        [-1,1].forEach(a=>{
          part(statics,'cylinder','gold',a*1.83,2.1,1.05,.04,.9,.04);
          part(statics,'box','roof',a*1.83,1.92,1.07,.34,.53,.035);
          part(statics,'box','gold',a*1.83,1.87,1.095,.18,.025,.014);
        });
        plant(statics,2.5,.12,.85,.9);
        if(subject==='de'){
          part(statics,'box','wood',-1.2,.57,1.45,1.65,.1,.45);
          [-1,1].forEach(a=>part(statics,'box','wood',-1.2+a*.62,.28,1.45,.13,.56,.35));
          book(statics,-1.2,.7,1.45,.55,.36);
        }else if(subject==='en'){
          const ring=part(statics,'ring','gold',2.2,.36,-1.1,.45,.45,.45);ring.rotation.x=Math.PI/2;
          part(statics,'cylinder','wood',2.2,.21,-1.1,.22,.4,.22);
          for(let i=0;i<4;i++)part(statics,'box','wood',2.85+i*.26,.09,-.1,.23,.15,1.2);
        }else{
          for(let i=0;i<4;i++)part(statics,'hex','trim',2.5+i*.39,.06,-.75+i*.14,.5,.1,.5);
          plant(statics,-2.35,.1,-2.9,.8);
        }
      }
      compact(statics);houses.forEach(h=>root.add(h));
      const n=ids.indexOf(id)*2+{de:0,en:5,nmg:3}[subject];
      if(stage>=2)resident(root,animations,-4.35,1.85,subject,0,n);
      if(stage===3)resident(root,animations,4.8,1.45,subject,1.3,n+1);
      root.userData.stationCount=stage===1?1:stage===2?2:3;
      entries.push({root,animations});animations.forEach(fn=>fn(0));
      root.traverse(o=>delete o.userData.palette);
      return root;
    }
    function update(seconds){
      const t=Number.isFinite(seconds)?seconds:0;
      entries.forEach(({root,animations})=>{
        for(let node=root;node;node=node.parent)if(!node.visible)return;
        animations.forEach(fn=>fn(t));
      });
    }
    return {create,update};
  };
})(globalThis);
