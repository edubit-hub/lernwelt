/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* May als stilisierte Spielfigur nach der Hauskatze (Fotos vom 20.10.2026): Norwegische Waldkatze, blaugrau mit warmem Braunstich und Tigerung
 * (M auf der Stirn, Streifen über Rücken und Wangen, geringelter Schwanz), cremefarbener lockiger Latz und Bauch, grüngelbe Augen mit Schlitzpupille
 * unter leicht gesenkten Lidern (ihr ruhiger, etwas strenger Blick), rosabraune Nase, Ohrpinsel, grosse buschige Pfoten und Schwanz.
 * Wenige matte Farbflächen und modellierte Fellpartien, passend zur Inselgrafik.
 * Liegt W3.MayNetz vor (aus Blender, tools/blender/may.py), baut buildNetz May daraus. Die Grundformen darunter bleiben als Rückfall.
 * Boden y=0, Blick +z. true = gehen, 'play' = ruhige Tätigkeit, false = still. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  W3.MayModell = function (THREE) {
    const shape={sphere:new THREE.SphereGeometry(1,16,12),head:new THREE.SphereGeometry(1,28,18),whisker:new THREE.CylinderGeometry(.45,1,1,5),cone:new THREE.ConeGeometry(1,1,6)};
    const tones={silver:'#a29d96',grey:'#7f7a74',light:'#ddd3c3',ruff:'#e6ddcd',under:'#e9e1d2',dark:'#5a534d',streifen:'#6b645e',inner:'#c39a8f',nose:'#b97f74',line:'#3b3632',
      iris:'#c8cd92',pupil:'#1f211b',white:'#f4f1e6',lid:'#8a837c',tuft:'#cfc6b8',pfote:'#b9b1a6'};
    const mats={};
    for(const [key,color] of Object.entries(tones))mats[key]=new THREE.MeshStandardMaterial({color,roughness:.94,metalness:0,flatShading:!['iris','pupil','white'].includes(key)});
    mats.fur=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:true});
    const rigs=new WeakMap(),templates=new Map(),up=new THREE.Vector3(0,1,0);let zaehler=0;
    const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
    const gauss=(x,s)=>Math.exp(-(x*x)/(s*s));
    const col=hex=>new THREE.Color(hex);
    const furColours={base:col('#857e77'),dark:col('#5c554f'),silver:col('#a49f98'),warm:col('#9a8676'),light:col('#d9cfbf'),chin:col('#eee7d9')};
    // Tigerung: weiche dunkle Bänder, t läuft entlang des Körpers, staerke 0..1
    const band=(t,frequenz,staerke)=>staerke*clamp((Math.sin(t*frequenz)-.35)/.65);
    function group(name){const g=new THREE.Group();g.name=name;return g;}
    function part(parent,kind,tone,x,y,z,sx,sy=sx,sz=sx){const m=new THREE.Mesh(shape[kind],mats[tone]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    function beam(parent,a,b,radius,tone='white'){
      const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),mid=start.clone().add(end).multiplyScalar(.5);
      const mesh=part(parent,'whisker',tone,mid.x,mid.y,mid.z,radius,delta.length(),radius);
      mesh.quaternion.setFromUnitVectors(up,delta.normalize());mesh.castShadow=false;return mesh;
    }
    function texturedMesh(parent,geometry,colourAt,material=mats.fur){
      const p=geometry.attributes.position,colors=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++){
        const c=colourAt(p.getX(i),p.getY(i),p.getZ(i));c.toArray(colors,i*3);
      }
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
      const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    function furSurface(parent,transform,colourAt,source=shape.sphere){
      const geometry=source.clone(),p=geometry.attributes.position;
      for(let i=0;i<p.count;i++){const mapped=transform(p.getX(i),p.getY(i),p.getZ(i));p.setXYZ(i,...mapped);}
      return texturedMesh(parent,geometry,colourAt);
    }
    // Eine breite, abgerundete Fellpartie. Die Silhouette liest sich auch klein.
    function lock(parent,x,y,z,width,length,depth,tone,lean=0){
      const geometry=shape.sphere.clone(),p=geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),taper=.64+.36*(py+1)/2;
        p.setXYZ(i,px*width*taper+lean*(1-py)*.5,py*length,pz*depth*taper);
      }
      geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,mats[tone]);mesh.position.set(x,y,z);
      mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    function marking(parent,points,width){
      const positions=[],indices=[];
      for(let i=0;i<points.length;i++){
        const p=points[i],before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
        const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
        const taper=.45+.55*Math.sin(Math.PI*(i+.5)/points.length);
        for(const side of [-1,1]){
          const x=p[0]-dy/length*width*side*taper,y=p[1]+dx/length*width*side*taper;
          positions.push(x,y,faceDepth(x,y)+.012);
        }
        if(i<points.length-1){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.setIndex(indices);geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,mats.streifen);parent.add(mesh);
    }
    function merge(parent){
      parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert(),batches=new Map();
      parent.children.filter(n=>n.isMesh).forEach(mesh=>{
        const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
        if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(g);parent.remove(mesh);
      });
      for(const [material,parts] of batches){
        const count=parts.reduce((sum,g)=>sum+g.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),colors=material.vertexColors?new Float32Array(count*3):null;
        let offset=0,uvOffset=0;
        for(const g of parts){positions.set(g.attributes.position.array,offset);normals.set(g.attributes.normal.array,offset);if(g.attributes.uv)uv.set(g.attributes.uv.array,uvOffset);if(colors){if(g.attributes.color)colors.set(g.attributes.color.array,offset);else colors.fill(1,offset,offset+g.attributes.position.array.length);}offset+=g.attributes.position.array.length;uvOffset+=g.attributes.position.count*2;g.dispose();}
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(colors)geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeBoundingSphere();
        const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
      }
    }
    function ear(parent,side){
      // Der Ansatz liegt in der Kopfwölbung (nicht daneben), leicht nach aussen geneigt
      const g=group(side<0?'may-ear-left':'may-ear-right');g.position.set(side*.27,.235,-.05);g.rotation.z=-side*.22;parent.add(g);
      // Gerundete natürliche Kontur. Keine aufgesetzten Ohrpinsel.
      const outline=new THREE.Shape();outline.moveTo(-.18,0);outline.lineTo(-.045,.285);outline.quadraticCurveTo(-.016,.333,.018,.302);outline.lineTo(.18,0);outline.quadraticCurveTo(0,-.045,-.18,0);
      const outer=new THREE.ExtrudeGeometry(outline,{depth:.075,bevelEnabled:true,bevelSize:.028,bevelThickness:.025,bevelSegments:1,steps:1,curveSegments:5});
      const shell=new THREE.Mesh(outer,mats.grey);shell.castShadow=true;shell.receiveShadow=true;g.add(shell);
      const inner=new THREE.Shape();inner.moveTo(-.125,.045);inner.lineTo(-.025,.238);inner.quadraticCurveTo(-.007,.263,.013,.239);inner.lineTo(.125,.045);inner.quadraticCurveTo(0,.015,-.125,.045);
      const inset=new THREE.Mesh(new THREE.ShapeGeometry(inner,10),mats.inner);inset.position.z=.104;g.add(inset);
      // Waldkatze: heller Fellbusch im Ohr und ein feiner Pinsel an der Spitze
      for(const [dx,h] of [[-.05,.09],[0,.12],[.05,.08]]){const f=new THREE.Mesh(shape.cone,mats.tuft);f.position.set(dx,.06+h/2,.10);f.scale.set(.026,h,.012);f.rotation.z=-dx*2.2;g.add(f);}
      const pinsel=new THREE.Mesh(shape.cone,mats.tuft);pinsel.position.set(.004,.34,.04);pinsel.scale.set(.016,.075,.016);pinsel.rotation.z=-side*.12;g.add(pinsel);
      merge(g);return g;
    }
    function faceDepth(x,y){
      const sy=y/.44,w=(.43+.12*gauss(sy+.15,.60))*(1-.18*clamp(-sy));
      const sz=Math.sqrt(Math.max(0,1-(x/w)**2-sy*sy));
      const nose=.14*gauss(x,.135)*gauss(y+.09,.20);
      const muzzle=.095*(gauss(x-.11,.14)+gauss(x+.11,.14))*gauss(y+.27,.10);
      return .325*sz+sz**4*nose+sz*muzzle;
    }
    function eye(parent,side){
      const x0=side*.205,y0=.075;
      // Die Lider folgen der Kopfkrümmung; es gibt keinen aufgesetzten Augapfel.
      function lens(rx,ry,lift,material,colourAt){
        const vertices=[x0,y0,faceDepth(x0,y0)+lift+.010],indices=[],rings=3,sectors=28;
        for(let r=1;r<=rings;r++)for(let i=0;i<sectors;i++){
          const a=i/sectors*Math.PI*2,f=r/rings,s=Math.sin(a);
          const x=x0+Math.cos(a)*rx*f,y=y0+s*Math.pow(Math.abs(s),.23)*ry*f+side*(Math.cos(a)*rx*f)*.065;
          vertices.push(x,y,faceDepth(x,y)+lift+(1-f*f)*.010);
        }
        for(let i=0;i<sectors;i++)indices.push(0,1+i,1+(i+1)%sectors);
        for(let r=0;r<rings-1;r++)for(let i=0;i<sectors;i++){
          const a=1+r*sectors+i,b=1+r*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;indices.push(a,c,b,b,c,d);
        }
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
        if(colourAt)texturedMesh(parent,geometry,colourAt,material);
        else{geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);parent.add(mesh);}
      }
      // kleine Mandelaugen wie auf den Fotos (rund zwei Drittel der früheren Grösse)
      lens(.104,.070,.005,mats.line);
      lens(.095,.062,.009,mats.iris);
      lens(.010,.050,.022,mats.pupil);
      part(parent,'sphere','white',x0-.02,y0+.01,faceDepth(x0-.02,y0+.01)+.028,.008,.010,.003);
      // Ihr ruhiger, etwas strenger Blick: das obere Lid deckt ein Viertel des Auges, innen tiefer als aussen
      const lid=part(parent,'sphere','lid',x0+side*.003,y0+.062,faceDepth(x0,y0+.062)+.014,.11,.03,.02);lid.rotation.z=side*.08;
    }
    function head(parent,sitting){
      const g=group('may-head');g.position.set(0,sitting?1.47:1.18,sitting?.28:.73);parent.add(g);
      furSurface(g,(x,y,z)=>{
        const cheek=.12*gauss(y+.15,.60),taper=1-.18*clamp(-y),xx=x*(.43+cheek)*taper,yy=y*.44;
        const front=Math.pow(Math.max(0,z),4);
        const nose=.14*gauss(xx,.135)*gauss(yy+.09,.20);
        const muzzle=.095*(gauss(xx-.11,.14)+gauss(xx+.11,.14))*gauss(yy+.27,.10);
        return[xx,yy,.325*z+front*nose+Math.max(0,z)*muzzle];
      },(x,y,z)=>{
        const front=clamp((z-.04)/.30),side=clamp((Math.abs(x)-.22)/.25);
        // Stirn dunkler, Wangen warm braungrau, Augenränder hell, Schnauze und Kinn creme
        const c=furColours.base.clone().lerp(furColours.dark,clamp((y+.02)*1.1)*front*.5).lerp(furColours.warm,side*.55);
        c.lerp(furColours.light,gauss(Math.abs(x)-.23,.09)*gauss(y-.02,.05)*front*.6);
        const muzzle=gauss(x,.28)*gauss(y+.255,.17)*front;
        c.lerp(furColours.chin,muzzle*.98);
        return c;
      },shape.head);
      for(const side of [-1,1]){
        // volle Wangen und Backenbart der Waldkatze
        lock(g,side*.40,-.12,-.02,.21,.21,.19,'grey',side*.065);
        lock(g,side*.385,-.255,.0,.16,.16,.15,'silver',side*.05);
        // M auf der Stirn: drei Striche je Seite, dazu Wangenstreifen
        marking(g,[[side*.035,.355],[side*.055,.29],[side*.08,.215],[side*.11,.26],[side*.14,.32]],.014);
        marking(g,[[side*.17,.36],[side*.18,.31],[side*.19,.26]],.011);
        marking(g,[[side*.27,-.06],[side*.33,-.09],[side*.40,-.13]],.012);
        marking(g,[[side*.29,-.165],[side*.34,-.19],[side*.375,-.215]],.010);
      }
      marking(g,[[0,.40],[0,.34],[0,.29]],.011);
      eye(g,-1);eye(g,1);
      const noseShape=new THREE.Shape();noseShape.moveTo(-.075,-.142);noseShape.quadraticCurveTo(-.045,-.13,0,-.14);noseShape.quadraticCurveTo(.045,-.13,.075,-.142);noseShape.quadraticCurveTo(.05,-.18,.022,-.19);noseShape.quadraticCurveTo(0,-.222,-.022,-.19);noseShape.quadraticCurveTo(-.05,-.18,-.075,-.142);
      const noseZ=faceDepth(0,-.205)+.003,nose=new THREE.Mesh(new THREE.ExtrudeGeometry(noseShape,{depth:.018,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:2,curveSegments:8}),mats.nose);nose.position.set(0,-.04,noseZ);g.add(nose);
      part(g,'sphere','line',-.047,-.204,noseZ+.028,.012,.008,.005);part(g,'sphere','line',.047,-.204,noseZ+.028,.012,.008,.005);
      beam(g,[0,-.242,noseZ+.021],[0,-.30,faceDepth(0,-.30)+.008],.0025,'grey');
      for(const side of [-1,1]){
        for(let i=0;i<3;i++){
          const y=-.275+i*.024,a=[side*.11,y,faceDepth(.11,y)+.015],b=[side*.34,-.29+i*.057,.38],c=[side*(.65+i*.035),-.39+i*.112,.32-i*.02];
          beam(g,a,b,.0036);beam(g,b,c,.0026);
        }
      }
      // Fell am Ohransatz verbindet Ohr und Kopf
      for(const side of [-1,1])lock(g,side*.25,.27,-.06,.15,.07,.12,'grey',side*.02);
      ear(g,-1);ear(g,1);merge(g);return g;
    }
    function tail(parent,sitting){
      const g=group('may-tail');g.position.set(sitting?-.37:0,sitting?.26:.9,sitting?-.44:-.72);parent.add(g);
      const points=sitting?[[0,0,0],[-.20,.20,-.14],[-.33,.60,-.16],[-.31,1.03,-.03],[-.24,1.33,.07]]:[[0,0,0],[.04,.27,-.12],[.10,.70,-.13],[.19,1.12,-.01],[.27,1.32,.07]];
      const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),frames=curve.computeFrenetFrames(22,false),vertices=[],uv=[],indices=[];
      for(let i=0;i<=22;i++){
        const t=i/22,p=curve.getPointAt(t),width=.08+.30*Math.pow(Math.sin(Math.PI*(.15+.75*t)),.5);   // buschig bis fast zur Spitze
        for(let j=0;j<16;j++){
          const a=j/16*Math.PI*2,r=width;
          const v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.91);vertices.push(v.x,v.y,v.z);uv.push(j/16,t);
          if(i<22){const n=i*16+j,k=i*16+(j+1)%16;indices.push(n,k,n+16,k,k+16,n+16);}
        }
      }
      const start=curve.getPointAt(0),end=curve.getPointAt(1),cap=vertices.length/3;
      vertices.push(start.x,start.y,start.z,end.x,end.y,end.z);uv.push(0,0,0,1);
      for(let j=0;j<16;j++){const k=(j+1)%16;indices.push(cap,k,j,cap+1,22*16+j,22*16+k);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
      // geringelt wie bei May: dunkle Bänder auf blaugrauem, nach aussen hellerem Fell
      texturedMesh(g,geometry,(x,y,z)=>furColours.base.clone().lerp(furColours.silver,clamp(y/1.5)*.4).lerp(furColours.dark,band(y,11,.7)));
      merge(g);return g;
    }
    function leg(parent,name,x,y,z,front,sitting){
      const g=group(name);g.position.set(x,y,z);parent.add(g);const length=front?(sitting?.50:.51):.49;
      part(g,'sphere',front?'silver':'grey',0,-length*.43,0,front?.17:.18,length*.62,.18);
      part(g,'sphere','streifen',0,-length*.40,.02,front?.172:.182,.022,.17);        // feine Streifen an den Beinen
      part(g,'sphere','streifen',0,-length*.60,.02,front?.166:.176,.02,.166);
      part(g,'sphere','pfote',0,-length+.09,.075,.20,.13,.25);                     // grosse, buschige Pfoten
      if(!front)part(g,'sphere','silver',0,-.05,-.015,.225,.265,.245);
      if(front)lock(g,0,-length*.24,.045,.18,.22,.16,'silver');
      merge(g);return g;
    }
    function body(parent,sitting){
      const g=group('may-body');parent.add(g);
      if(sitting){
        const vertices=[],uv=[],indices=[],rows=14,columns=20;
        for(let i=0;i<=rows;i++){
          const t=i/rows,y=.06+t*1.39;
          const radius=.30+.26*Math.sin(Math.PI*t)-.11*t+.11*gauss(t-.77,.13);
          const centre=-.13+.32*t;
          for(let j=0;j<columns;j++){
            const a=j/columns*Math.PI*2,front=Math.max(0,Math.cos(a)),ruff=.015*Math.cos(a*6)*gauss(t-.76,.18);
            vertices.push(Math.sin(a)*(radius+ruff),y,centre+Math.cos(a)*(radius*.81+front*.055));uv.push(j/columns,t);
            if(i<rows){const n=i*columns+j,k=i*columns+(j+1)%columns;indices.push(n,k,n+columns,k,k+columns,n+columns);}
          }
        }
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
        texturedMesh(g,geometry,(x,y,z)=>{
          // creme Latz und Bauch vorn, Tigerstreifen an Flanken und Rücken
          const front=clamp((z+.05)/.45),bib=(gauss(y-1.04,.37)+.8*gauss(y-.45,.30))*front,flanke=clamp(1-front*1.4);
          const c=furColours.dark.clone().lerp(furColours.base,.62).lerp(furColours.warm,.18).lerp(furColours.dark,band(y*1.3+Math.atan2(x,-z)*.25,9,.55)*flanke);
          return c.lerp(furColours.light,clamp(bib)*.9);
        });
      }else{
        // Rücken blaugrau mit Querstreifen, Flanken heller, Bauch creme und lockig
        furSurface(g,(x,y,z)=>[x*.43,.86+y*.40,-.1+z*.78],(x,y,z)=>{
          const ruecken=clamp((y-.82)/.35),bauch=clamp((.78-y)/.3);
          return furColours.base.clone().lerp(furColours.silver,clamp(1-ruecken)*.35).lerp(furColours.dark,band(z+Math.abs(x)*.4,10,.65)*ruecken).lerp(furColours.light,bauch*.85);
        });
        furSurface(g,(x,y,z)=>[x*.45,1.0+y*.46,.51+z*.36],(x,y,z)=>furColours.silver.clone().lerp(furColours.light,clamp(z-.3)*1.3).lerp(furColours.dark,band(y*2+z,8,.3)*clamp((y-1.1)/.3)));
        for(const side of [-1,1])lock(g,side*.38,.74,-.05,.12,.16,.40,'under',side*.03);      // lockige helle Bauchfransen
      }
      // Zusammenhängende Halskrause mit wenigen breiten, weichen Fellspitzen.
      const positions=[],indices=[],rows=9,columns=24;
      for(let row=0;row<=rows;row++){
        const t=row/rows,width=.48+.16*Math.sin(Math.PI*t)-.13*t;                     // volle Halskrause
        for(let column=0;column<=columns;column++){
          const u=column/columns*2-1,angle=u*1.30;
          const scallop=.045*Math.cos(u*Math.PI*4)*Math.pow(t,3);                     // lange, weiche Fellspitzen
          const x=Math.sin(angle)*width;
          const y=1.31-t*(.66-.16*Math.abs(u))+scallop-(sitting?0:.25);
          const z=.25+Math.cos(angle)*(.30+.12*Math.sin(Math.PI*t))+(sitting?0:.37);
          positions.push(x,y,z);
          if(row<rows&&column<columns){const n=row*(columns+1)+column;indices.push(n,n+columns+1,n+1,n+1,n+columns+1,n+columns+2);}
        }
      }
      const ruff=new THREE.BufferGeometry();ruff.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));ruff.setIndex(indices);
      texturedMesh(g,ruff,(x,y,z)=>furColours.light.clone().lerp(furColours.chin,clamp(1-Math.abs(x)*1.5)*.5));
      merge(g);return g;
    }
    // Netze aus Blender (tools/blender/may.py → may-netz.js): eine verschmolzene Haut je Körperteil, Farbe je Dreieck.
    const netze=new Map();
    function netz(name){
      if(netze.has(name))return netze.get(name);
      const d=W3.MayNetz.teile[name],bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
      const p=new Int16Array(bytes(d.p).buffer),ix=new Uint16Array(bytes(d.i).buffer),f=bytes(d.f),k=d.s/32767,c=new THREE.Color();
      const positions=new Float32Array(ix.length*3),colors=new Float32Array(ix.length*3);
      for(let n=0;n<ix.length;n++){
        const v=ix[n]*3,t=(n/3|0)*3;positions[n*3]=p[v]*k;positions[n*3+1]=p[v+1]*k;positions[n*3+2]=p[v+2]*k;
        c.setRGB(f[t]/255,f[t+1]/255,f[t+2]/255,THREE.SRGBColorSpace).toArray(colors,n*3);
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      geometry.computeVertexNormals();geometry.computeBoundingSphere();netze.set(name,geometry);return geometry;
    }
    function gelenk(parent,name,teil,x=0,y=0,z=0){
      const g=group(name);g.position.set(x,y,z);parent.add(g);
      if(teil){const m=new THREE.Mesh(netz(teil),mats.fur);m.castShadow=true;m.receiveShadow=true;g.add(m);}
      return g;
    }
    function buildNetz(pose){
      // Fehlt das Netz einer Haltung (Meshy-Modell bisher nur stehend), steht May in der vorhandenen Haltung. Beine je Seite (-l, -r) oder gemeinsam.
      const T=W3.MayNetz.teile,wahl=(...namen)=>namen.find(n=>T[n]),sitting=pose==='sit'&&!!T['koerper-sitz'];
      const lage=W3.MayNetz.posen[sitting?'sit':'walk'],root=group('May · graue norwegische Waldkatze');root.userData.may=true;root.userData.pose=pose;
      gelenk(root,'may-body',sitting?'koerper-sitz':'koerper-geh');
      const kopf=gelenk(root,'may-head','kopf',...lage.kopf);gelenk(kopf,'may-ear-left');gelenk(kopf,'may-ear-right');   // Ohren sind Teil der Kopfhaut
      gelenk(kopf,'may-lid','lid').visible=false;                                                                          // geschlossene Augen fürs Blinzeln
      gelenk(root,'may-tail',sitting?'schwanz-sitz':'schwanz-geh',...lage.schwanz);
      lage.vorn.forEach((o,i)=>gelenk(root,i?'may-front-right':'may-front-left',wahl(i?'bein-vorn-r':'bein-vorn-l','bein-vorn'),...o));
      for(let i=0;i<2;i++)gelenk(root,i?'may-rear-right':'may-rear-left',lage.hinten?wahl(i?'bein-hinten-r':'bein-hinten-l','bein-hinten'):null,...(lage.hinten?lage.hinten[i]:[0,.5,-.3]));   // sitzend gehören sie zum Körper
      root.traverse(n=>n.userData.may=true);return root;
    }
    // May mit Skelett (tools/blender/may_skin.py → may-skin.js): eine Haut, Gehen als Animation aus Meshy, Kopf, Schwanz und Lid zusätzlich im Code.
    const bytesVon=s=>W3.ModellBytes(s);   // Base64 ohne Vokale, Decoder in modelle.js
    let skinGeo=null,skinLid=null,skinClip=null;
    function flach(d,extra){   // indizierte Daten → flache Dreiecke mit Farbe je Dreieck, optional Knochen und Gewichte je Ecke
      const p=new Int16Array(bytesVon(d.p).buffer),ix=new Uint16Array(bytesVon(d.i).buffer),f=bytesVon(d.f),k=d.s/32767,c=new THREE.Color();
      const positions=new Float32Array(ix.length*3),colors=new Float32Array(ix.length*3),j=extra&&bytesVon(d.j),w=extra&&bytesVon(d.w);
      const joints=extra&&new Uint16Array(ix.length*4),weights=extra&&new Float32Array(ix.length*4);
      for(let n=0;n<ix.length;n++){
        const v=ix[n],t=(n/3|0)*3;positions[n*3]=p[v*3]*k;positions[n*3+1]=p[v*3+1]*k;positions[n*3+2]=p[v*3+2]*k;
        c.setRGB(f[t]/255,f[t+1]/255,f[t+2]/255,THREE.SRGBColorSpace).toArray(colors,n*3);
        if(extra)for(let q=0;q<4;q++){joints[n*4+q]=j[v*4+q];weights[n*4+q]=w[v*4+q]/255;}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      if(extra){geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));}
      geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
    }
    function gehClip(S){
      const g=S.gehen,d=new Float32Array(bytesVon(g.d).buffer),n=S.knochen.length,times=Float32Array.from({length:g.frames},(_,i)=>i/g.fps),tracks=[];
      S.knochen.forEach((kn,b)=>{
        const pos=new Float32Array(g.frames*3),rot=new Float32Array(g.frames*4);
        for(let f=0;f<g.frames;f++){const o=(f*n+b)*7;pos.set(d.subarray(o,o+3),f*3);rot.set(d.subarray(o+3,o+7),f*4);}
        tracks.push(new THREE.VectorKeyframeTrack(kn.n+'.position',times,pos),new THREE.QuaternionKeyframeTrack(kn.n+'.quaternion',times,rot));
      });
      return new THREE.AnimationClip('gehen',(g.frames-1)/g.fps,tracks);
    }
    function buildSkin(pose){
      const S=W3.MaySkin,root=group('May · graue norwegische Waldkatze');root.userData.may=true;root.userData.pose=pose;
      const wurzel=group('may-skin');wurzel.position.fromArray(S.wurzel.p);wurzel.quaternion.fromArray(S.wurzel.q);wurzel.scale.setScalar(S.wurzel.s);root.add(wurzel);
      skinGeo=skinGeo||flach(S.netz,true);skinLid=skinLid||flach(S.lid,false);
      const bones=S.knochen.map(k=>{const b=new THREE.Bone();b.name=k.n;b.position.fromArray(k.p);b.quaternion.fromArray(k.q);return b;});
      S.knochen.forEach((k,i)=>(k.e<0?wurzel:bones[k.e]).add(bones[i]));
      const lid=new THREE.Mesh(skinLid,mats.fur);lid.name='may-lid';lid.visible=false;bones[S.lid.k].add(lid);
      // Das Porträt klont das Modell (miniaturen.js); ein geklontes SkinnedMesh hinge an den Knochen des Originals. Für 'sit' daher die Ruhelage als festes Netz.
      const skin=pose==='walk',mesh=skin?new THREE.SkinnedMesh(skinGeo,mats.fur):new THREE.Mesh(skinGeo,mats.fur);
      mesh.name='may-fell';mesh.castShadow=true;mesh.receiveShadow=true;wurzel.add(mesh);root.updateMatrixWorld(true);
      if(skin){mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;}
      root.traverse(n=>n.userData.may=true);
      if(!skin)return {root};
      skinClip=skinClip||(S.gehen&&gehClip(S));
      const mixer=new THREE.AnimationMixer(wurzel),action=skinClip&&mixer.clipAction(skinClip);if(action)action.play();
      // Drehachse «oben» je Knochen im eigenen Raum, für Kopfdrehen und Schwanzwedeln zusätzlich zur Animation
      const achse=b=>new THREE.Vector3(0,1,0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).premultiply(root.quaternion.clone().invert()).invert()).normalize();
      const named=n=>bones.find(b=>b.name===n),kopf=named('head'),schwanz=named('tailstart')||named('tail');
      return {root,rig:{skin:true,pose,mixer,action,wurzel,s:S.wurzel.s,lid,takt:(zaehler++*1.73)%4.6,kopf,schwanz,achseKopf:achse(kopf),achseSchwanz:schwanz&&achse(schwanz),
        ruhe:bones.map(b=>[b,b.position.clone(),b.quaternion.clone()]),dauer:skinClip?skinClip.duration:1,
        // Tempo: may-insel.js führt May rund 4,4 Einheiten in 14 s bei Massstab .78, also gut 0,4 Modelleinheiten je Sekunde; ein Zyklus legt «schritt» zurück
        tempo:S.gehen&&S.gehen.schritt>0?Math.min(1.5,.4/S.gehen.schritt):1}};
    }
    function build(pose){
      if(W3.MayNetz)return buildNetz(pose);
      const sitting=pose==='sit',root=group('May · graue norwegische Waldkatze');root.userData.may=true;root.userData.pose=pose;
      body(root,sitting);head(root,sitting);tail(root,sitting);
      leg(root,'may-front-left',-.235,sitting?.54:.55,sitting?.46:.56,true,sitting);leg(root,'may-front-right',.235,sitting?.54:.55,sitting?.46:.56,true,sitting);
      leg(root,'may-rear-left',-.28,.53,sitting?-.27:-.61,false,sitting);leg(root,'may-rear-right',.28,.53,sitting?-.27:-.61,false,sitting);
      root.traverse(n=>n.userData.may=true);return root;
    }
    const dreh=new THREE.Quaternion();
    function create(pose='walk'){
      pose=pose==='sit'?'sit':'walk';
      if(W3.MaySkin){const {root,rig}=buildSkin(pose);if(rig){rigs.set(root,rig);update(root,0,false);}return root;}
      if(!templates.has(pose))templates.set(pose,build(pose));const model=templates.get(pose).clone(true),named=name=>model.getObjectByName(name);
      rigs.set(model,{pose,lid:named('may-lid'),takt:(zaehler++*1.73)%4.6,head:named('may-head'),tail:named('may-tail'),body:named('may-body'),ears:[named('may-ear-left'),named('may-ear-right')],legs:['may-front-left','may-front-right','may-rear-left','may-rear-right'].map(named)});update(model,0,false);return model;
    }
    function update(model,seconds,moving=true){
      const rig=rigs.get(model);if(!rig||!Number.isFinite(seconds))return;const t=Math.max(0,seconds),walk=moving===true&&rig.pose==='walk';
      if(rig.skin){
        if(walk&&rig.action)rig.mixer.setTime((t*rig.tempo)%rig.dauer);else rig.ruhe.forEach(([b,p,q])=>{b.position.copy(p);b.quaternion.copy(q);});
        if(moving)rig.kopf.quaternion.multiply(dreh.setFromAxisAngle(rig.achseKopf,Math.sin(t*.67)*.10));
        if(moving&&!walk&&rig.schwanz)rig.schwanz.quaternion.multiply(dreh.setFromAxisAngle(rig.achseSchwanz,Math.sin(t*1.3)*.12));
        rig.wurzel.scale.set(rig.s,rig.s*(1+(moving&&!walk?Math.sin(t*1.7)*.012:0)),rig.s);
        rig.lid.visible=moving!==false&&(t+rig.takt)%4.6<.14;
        return;
      }
      rig.body.position.y=walk?Math.sin(t*6.4)*.018:0;rig.head.rotation.y=moving?Math.sin(t*.67)*.10:0;rig.head.rotation.z=moving?Math.sin(t*.43)*.025:0;rig.head.rotation.x=walk?Math.sin(t*3.2)*.03:0;
      rig.tail.rotation.z=moving?Math.sin(t*1.3)*.10:0;rig.tail.rotation.y=moving?Math.sin(t*.81)*.13:0;
      rig.legs.forEach((leg,index)=>{const phase=t*6.4+[0,Math.PI,Math.PI,0][index];leg.rotation.x=walk?Math.sin(phase)*.29:0;if(!walk&&moving&&index===1)leg.rotation.x=-Math.max(0,Math.sin(t*.45)-.84)/.16*.35;});
      rig.ears[0].rotation.z=.22+(moving?Math.sin(t*.39)*.02:0);rig.ears[1].rotation.z=-.22+(moving?Math.sin(t*.47+1)*.02:0);
      // Blinzeln alle 4,6 s, Atmen und im Sitzen ein Schwanz, der am Boden wischt (Netz aus Blender)
      if(rig.lid)rig.lid.visible=moving!==false&&(t+rig.takt)%4.6<.14;
      if(rig.lid&&rig.pose==='sit'){rig.body.scale.y=1+(moving?Math.sin(t*1.7)*.012:0);rig.tail.rotation.z=0;}
    }
    return {create,update};
  };
})(globalThis);
