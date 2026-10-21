/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Vier verwandte Landschaften. Koordinaten liegen vor der gemeinsamen
   Geländeskalierung; dieselbe Abbildung gilt für Küste, Wege und Orte. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const expansion={brueche:[-18,-7],neuland:[-11.2,-4]};
  const withExpansion=places=>({...places,...expansion});
  const profiles={
    math:{
      name:'Kalksteinhügel und Sonnenterrassen',
      description:'Helle Kalkrücken steigen über goldgrüne Wiesen. Die Themenplätze liegen auf sanft verbundenen Sonnenterrassen.',
      seed:237,
      palette:{
        grass:'#a3ad65',grassLight:'#c2c884',grassDry:'#c8b67d',
        sand:'#d9bc86',sandLight:'#f0dfb3',stone:'#d4c5a6',
        stoneLight:'#eee2c5',stoneSeam:'#b49b72',wetStone:'#9da694'
      },
      locations:withExpansion({
        zahlen:[-1,-1],rechnen:[-8,2],messen:[7,1],
        garten:[1,6],hafen:[-6,8],turm:[5,-6]
      }),
      roads:[
        [[-1,-1],[-4,0],[-8,2]],[[-1,-1],[4,-.3],[7,1]],
        [[-1,-1],[0,3],[1,6]],[[-8,2],[-8,5],[-6,8]],
        [[-1,-1],[1,-4],[5,-6]],[[1,6],[4,4],[7,1]],
        [[-8,2],[-9,-1],[-8,-4]]
      ],
      map(x,z){
        const angle=Math.atan2(z/10.85,x/15.1);
        const radial=Math.min(1.3,(x*x)/(15.1*15.1)+(z*z)/(10.85*10.85));
        const cape=1+.045*Math.cos(angle*4+.3)*radial;
        return[x*.98*cape,z*1.02*cape];
      }
    },
    de:{
      name:'Rote Felsen und Obsthaine',
      description:'Terrakottarote Erde, geschichtete Sandsteinrücken und grüne Obsthaine umgeben die erhöhten Dorfplätze.',
      seed:541,
      palette:{
        grass:'#aa7752',grassLight:'#c9986b',grassDry:'#bd855b',
        sand:'#c99b6e',sandLight:'#e5c198',stone:'#a85e46',
        stoneLight:'#ce8a62',stoneSeam:'#824b3c',wetStone:'#77564c'
      },
      locations:withExpansion({
        zahlen:[-2,-2.6],rechnen:[5.7,-5.3],messen:[8.8,.5],
        garten:[3,5.7],hafen:[-5.5,6.6],turm:[-8.9,-1]
      }),
      roads:[
        [[-2,-2.6],[1.9,-4.8],[5.7,-5.3]],
        [[5.7,-5.3],[8.3,-2.6],[8.8,.5]],
        [[8.8,.5],[6.5,4.2],[3,5.7]],
        [[3,5.7],[-1.2,6.8],[-5.5,6.6]],
        [[-5.5,6.6],[-8.2,3.6],[-8.9,-1]],
        [[-8.9,-1],[-5.5,-2.4],[-2,-2.6]],
        [[-2,-2.6],[-.7,.6],[3,5.7]],
        [[-8.9,-1],[-8.7,-2.8],[-8,-4]]
      ],
      map(x,z){
        const breadth=.89+.13*Math.tanh(z/5);
        return[x*breadth+.6*Math.sin(z*.2),z*1.06+x*.065];
      }
    },
    en:{
      name:'Vulkanküste und grüne Buchten',
      description:'Ein ruhender Vulkan mit sichtbarem Krater erhebt sich aus dunklen Basalthängen und sattgrünen Küstenwiesen.',
      seed:823,
      palette:{
        grass:'#547f64',grassLight:'#799770',grassDry:'#858972',
        sand:'#a5ada2',sandLight:'#ccd1bf',stone:'#555e60',
        stoneLight:'#84908d',stoneSeam:'#3c4549',wetStone:'#374a50'
      },
      locations:withExpansion({
        zahlen:[-6.8,-3.3],rechnen:[.2,-5.5],messen:[7.3,-3.6],
        garten:[8.5,4.5],hafen:[.2,6],turm:[-8,4]
      }),
      roads:[
        [[-6.8,-3.3],[-3.4,-5],[.2,-5.5]],
        [[.2,-5.5],[4,-5.1],[7.3,-3.6]],
        [[7.3,-3.6],[9.2,.4],[8.5,4.5]],
        [[8.5,4.5],[4.8,6.1],[.2,6]],
        [[.2,6],[-4.1,6.2],[-8,4]],
        [[-8,4],[-9,.5],[-6.8,-3.3]],
        [[-6.8,-3.3],[-7.5,-3.6],[-8,-4]]
      ],
      map(x,z){
        const bay=5.8*(1-Math.exp(-Math.pow(x/10,2)))-2;
        return[x*1.16+z*.035,z*.79+bay];
      }
    },
    nmg:{
      name:'Waldgebirge und Berglichtungen',
      description:'Ein felsiger Bergrücken mit hellem Gipfel überragt tiefgrüne Waldhänge, moosige Täler und erhöhte Lichtungen.',
      seed:1193,
      palette:{
        grass:'#416f49',grassLight:'#73965b',grassDry:'#889366',
        sand:'#a2ac82',sandLight:'#c7c9a0',stone:'#778777',
        stoneLight:'#b6beb0',stoneSeam:'#526351',wetStone:'#455e56'
      },
      locations:withExpansion({
        zahlen:[-2.2,-3.8],rechnen:[5,-5.5],messen:[8,1.9],
        garten:[1.2,6],hafen:[-7,6],turm:[-9,-.7]
      }),
      roads:[
        [[-9,-.7],[-6,-2.9],[-2.2,-3.8]],
        [[-2.2,-3.8],[1.2,-5.1],[5,-5.5]],
        [[5,-5.5],[7,-2.6],[8,1.9]],
        [[8,1.9],[5.1,4.6],[1.2,6]],
        [[1.2,6],[-2.8,5.1],[-7,6]],
        [[-7,6],[-8.6,3],[-9,-.7]],
        [[-2.2,-3.8],[-1.1,-.1],[1.2,6]],
        [[-9,-.7],[-8.6,-2.6],[-8,-4]]
      ],
      map(x,z){
        const radius=Math.hypot(x/15.1,z/10.85);
        const edge=clamp((radius-.35)/.75,0,1);
        const smooth=edge*edge*(3-2*edge);
        const lobes=1+.055*smooth*(Math.sin(x*.3+z*.2)+.5*Math.cos(z*.44-x*.18));
        return[(x*.97+.9*Math.sin(z*.42))*lobes,
          (z*1.02+.85*Math.sin(x*.34)+x*.055)*lobes];
      }
    }
  };
  const smooth=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  const hump=(x,z,cx,cz,rx,rz)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
  const ripple=(x,z)=>Math.sin(x*.71+z*.37)*.55+Math.cos(z*.81-x*.29)*.30+Math.sin(x*1.61-z*.92)*.15;
  // Gerichtete Felsgrate mit versetzten Gipfeln und breiten Flanken.
  const crag=(x,z,cx,cz,rx,rz,angle=0)=>{
    const dx=x-cx,dz=z-cz,u=(dx*Math.cos(angle)+dz*Math.sin(angle))/rx,v=(-dx*Math.sin(angle)+dz*Math.cos(angle))/rz;
    return Math.pow(Math.max(0,1-Math.pow(Math.abs(u),1.12)-Math.pow(Math.abs(v),1.35)),1.22);
  };
  const strata=(height,step,strength)=>{
    const q=height/step,t=q-Math.floor(q);
    return height+(smooth(t)-t)*step*strength;
  };
  const relief={
    math:{
      levels:{zahlen:2.8,rechnen:1.85,messen:2.75,garten:2.0,hafen:1.6,turm:4.1,brueche:2.1,neuland:1.8},
      features:[{kind:'limestone',x:-4,z:-7.2,radius:3.2},{kind:'ridge',x:10.1,z:-3.3,radius:2.3}],
      raw(x,z){
        const ridge=6.0*hump(x,z,-4.3,-7.1,3.3,2.1)+6.3*crag(x,z,-4.8,-7.2,2.9,1.8,-.2)
          +3.8*crag(x,z,-2.3,-7.5,2.1,1.4,.4)+2.5*crag(x,z,-6.3,-6.6,1.4,1.1,-.5);
        const east=3.2*hump(x,z,10,-3.3,2.8,2.5)+3.8*crag(x,z,10.2,-3.5,2.6,2,.2);
        return 1.8+2*hump(x,z,0,0,12,8)+strata(ridge+east,2.8,.70)+.5*ripple(x*.6,z*.6);
      },
      colours:['#a2af64','#c5bd7d','#dfd2af','#eee3cb']
    },
    de:{
      levels:{zahlen:3.3,rechnen:3.5,messen:3.1,garten:2.3,hafen:1.6,turm:2.7,brueche:2.1,neuland:1.9},
      features:[{kind:'sandstone',x:10.0,z:-4.7,radius:3.0},{kind:'mesa',x:-5.4,z:-7.2,radius:2.4}],
      raw(x,z){
        const a=9.6*hump(x,z,10,-4.7,2.7,2.5)+7.6*crag(x,z,9.7,-4.8,2.1,2.2,.2);
        const b=6.2*hump(x,z,-5.4,-7.2,2.6,2)+5.2*crag(x,z,-5.8,-7.1,2,1.7,-.4);
        return 2.2+1.9*hump(x,z,0,0,12,8)+strata(a+b,2.5,.95)+.4*ripple(x*.7,z*.7);
      },
      colours:['#b77c53','#cf9b69','#a65e43','#ddb087']
    },
    en:{
      levels:{zahlen:3.5,rechnen:4.3,messen:3.5,garten:2.2,hafen:1.6,turm:2.6,brueche:2.0,neuland:1.8},
      features:[{kind:'volcano',x:.5,z:0,radius:3.5,craterRadius:.82}],
      raw(x,z){
        const dx=x-.5,dz=z,r=Math.hypot(dx,dz),a=Math.atan2(dz,dx);
        const cone=23.4*Math.exp(-((r/3.3)**2));
        const crater=8.8*Math.exp(-((r/.82)**4));
        const flutes=.70*Math.sin(a*9+r*.6)*Math.sin(Math.min(1,r/1.5)*Math.PI*.5)*Math.exp(-((r/3.5)**2));
        return 1.6+cone-crater+flutes+1.0*hump(x,z,-8,1,4,6);
      },
      colours:['#507d58','#77956d','#505b5a','#8a8377']
    },
    nmg:{
      levels:{zahlen:2.7,rechnen:3.4,messen:3.0,garten:2.4,hafen:1.6,turm:2.0,brueche:2.0,neuland:1.8},
      features:[{kind:'mountain',x:-3.8,z:-7.8,radius:3.0},{kind:'ridge',x:1.5,z:-8.0,radius:2.2}],
      raw(x,z){
        const main=10.4*hump(x,z,-3.9,-7.7,2.8,1.9)+17.6*crag(x,z,-4.1,-7.9,2.7,1.8,-.18);
        const ridge=7.8*hump(x,z,1.3,-7.9,2.8,1.65)+8.1*crag(x,z,1.1,-8.15,2.3,1.6,.12)
          +4.8*crag(x,z,-1.2,-8.2,1.5,1.15,.35)+3.5*crag(x,z,-6,-7.2,1.7,1.35,-.4);
        return 1.8+main+ridge+3.4*hump(x,z,4,1,8,7)+.3*ripple(x*.7,z*.7);
      },
      colours:['#3f704b','#729358','#6d7d73','#e0e3d9']
    }
  };
  function colourMix(a,b,t){
    const parse=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
    const aa=parse(a),bb=parse(b),f=clamp(t,0,1);
    return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*f).toString(16).padStart(2,'0')).join('');
  }
  function distanceToSegment(x,z,a,b){
    const dx=b[0]-a[0],dz=b[1]-a[1],length2=dx*dx+dz*dz;
    const t=length2?clamp(((x-a[0])*dx+(z-a[1])*dz)/length2,0,1):0;
    return{distance:Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t),t};
  }
  // Die Wegkorridore erhalten sanfte Rampen zwischen den ebenen Themenplätzen.
  // Die kleinen Samples dienen nur dem Höhenfeld, nicht als eigener sichtbarer Weg.
  function roadPoints(points){
    const result=[];
    for(let i=0;i<points.length-1;i++){
      const b=points[i],c=points[i+1],a=i?points[i-1]:b.map((v,k)=>2*v-c[k]),d=i+2<points.length?points[i+2]:c.map((v,k)=>2*v-b[k]);
      let dt0=Math.sqrt(Math.hypot(a[0]-b[0],a[1]-b[1])),dt1=Math.sqrt(Math.hypot(b[0]-c[0],b[1]-c[1])),dt2=Math.sqrt(Math.hypot(c[0]-d[0],c[1]-d[1]));
      if(dt1<1e-4)dt1=1;if(dt0<1e-4)dt0=dt1;if(dt2<1e-4)dt2=dt1;
      const polynomials=[0,1].map(k=>{
        const t1=((b[k]-a[k])/dt0-(c[k]-a[k])/(dt0+dt1)+(c[k]-b[k])/dt1)*dt1;
        const t2=((c[k]-b[k])/dt1-(d[k]-b[k])/(dt1+dt2)+(d[k]-c[k])/dt2)*dt1;
        return[b[k],t1,-3*b[k]+3*c[k]-2*t1-t2,2*b[k]-2*c[k]+t1+t2];
      });
      for(let j=0;j<32;j++){
        const t=j/32,t2=t*t,t3=t2*t;
        result.push(polynomials.map(p=>p[0]+p[1]*t+p[2]*t2+p[3]*t3));
      }
    }
    result.push(points.at(-1));return result;
  }
  // Vorplätze (21.10.2026): Jedes Areal blickt nach +z auf seinen Vorplatz. Die Wege enden dort statt in der Platzmitte,
  // damit kein Weg durch Gebäude oder Stationen läuft. Führt ein Weg nach hinten weiter, geht er seitlich um das Areal herum
  // (Stationen und Häuser reichen bis rund 1,9 Einheiten zur Seite und 0,8 nach vorn, Plateau 3,0).
  const VORPLATZ=1.25,SEITE=2.35;
  function vorplatzWege(profile){
    const orte=Object.entries(profile.locations).filter(([key])=>key!=='neuland').map(([,p])=>p);
    const ort=p=>orte.find(o=>Math.hypot(p[0]-o[0],p[1]-o[1])<.05);
    const versperrt=(o,f,q)=>{for(let i=1;i<10;i++){const x=f[0]+(q[0]-f[0])*i/10,z=f[1]+(q[1]-f[1])*i/10;if(Math.abs(x-o[0])<SEITE-.3&&z<o[1]+VORPLATZ-.35&&z>o[1]-2.2)return true;}return false;};
    const umweg=(o,f,q)=>{
      if(!versperrt(o,f,q))return[];
      const s=Math.sign(q[0]-o[0])||1,w=[[o[0]+s*SEITE,o[1]+VORPLATZ*.7]];
      if(q[1]<o[1]-.6)w.push([o[0]+s*SEITE,o[1]-1]);
      return w;
    };
    return profile.roads.map(points=>{
      const a=ort(points[0]),b=ort(points.at(-1)),schub=VORPLATZ*((a?1:0)+(b?1:0))/2;
      const p=points.map((q,i)=>{const o=ort(q);return o?[o[0],o[1]+VORPLATZ]:i&&i<points.length-1?[q[0],q[1]+schub]:q;});
      const anfang=a?umweg(a,p[0],p[1]):[],ende=b?umweg(b,p.at(-1),p.at(-2)).reverse():[];
      return[p[0],...anfang,...p.slice(1,-1),...ende,p.at(-1)];
    });
  }
  Object.entries(profiles).forEach(([id,profile])=>{
    profile.vorplatz=VORPLATZ;profile.roads=vorplatzWege(profile);
    profile.expansionRoad=vorplatzWege({locations:profile.locations,roads:[[[-8,-4],[-11,-4],[-14,-6],[-18,-7]]]})[0];
    const spec=relief[id],sites=Object.entries(profile.locations).filter(([key])=>key!=='neuland').map(([key,p])=>({key,x:p[0],z:p[1],height:spec.levels[key],radius:id==='en'&&key==='turm'?3.2:3.0}));
    profile.features=spec.features;
    profile.plateaus=sites;
    const unfettered=(x,z)=>{
      const radius=Math.hypot(x/15.1,z/10.85);
      const coast=smooth((1.12-radius)/.27);
      const extension=Math.exp(-(((x+18)/5.8)**2+((z+7)/4.0)**2));
      return 1.6+Math.max(0,spec.raw(x,z)-1.6)*Math.max(coast,extension*.18);
    };
    const nearestLevel=p=>{
      const exact=sites.find(site=>Math.hypot(p[0]-site.x,p[1]-site.z)<site.radius-.3);   // Vorplatz liegt auf dem Plateau
      return exact?exact.height:Math.min(3.2,unfettered(...p));
    };
    const roadSegments=[];
    [...profile.roads,profile.expansionRoad].forEach(points=>{
      const samples=roadPoints(points),lengths=[0];
      for(let i=1;i<samples.length;i++)lengths.push(lengths[i-1]+Math.hypot(samples[i][0]-samples[i-1][0],samples[i][1]-samples[i-1][1]));
      const total=lengths.at(-1),start=nearestLevel(points[0]),end=nearestLevel(points.at(-1));
      for(let i=1;i<samples.length;i++)roadSegments.push({a:samples[i-1],b:samples[i],along:lengths[i-1],length:lengths[i]-lengths[i-1],total,start,end});
    });
    // Pro Höhenprobe nur die unmittelbar benachbarten Wegstücke prüfen.
    // Der Index verändert weder die Reihenfolge noch die berechnete Höhe.
    const roadCells=new Map(),cellSize=2;
    roadSegments.forEach(road=>{
      const x0=Math.floor((Math.min(road.a[0],road.b[0])-.95)/cellSize),x1=Math.floor((Math.max(road.a[0],road.b[0])+.95)/cellSize);
      const z0=Math.floor((Math.min(road.a[1],road.b[1])-.95)/cellSize),z1=Math.floor((Math.max(road.a[1],road.b[1])+.95)/cellSize);
      for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
        const key=x+','+z;if(!roadCells.has(key))roadCells.set(key,[]);roadCells.get(key).push(road);
      }
    });
    profile.height=(x,z)=>{
      let height=unfettered(x,z),nearest=null;
      const nearby=roadCells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))||[];
      for(const road of nearby){
        const candidate=distanceToSegment(x,z,road.a,road.b);
        if(candidate.distance<.95&&(!nearest||candidate.distance<nearest.distance))nearest={...candidate,road};
      }
      if(nearest){
        const road=nearest.road,along=road.along+road.length*nearest.t;
        const grade=smooth(along/road.total);
        const level=road.start+(road.end-road.start)*grade;
        const influence=1-smooth((nearest.distance-.27)/.68);
        height+=(level-height)*influence;
      }
      // Unabhängige, wirklich ebene Terrassen; sämtliche Gebäude und Schilder
      // eines Themas finden innerhalb dieses Kreises sicheren Boden.
      let sum=0,weightedHeight=0,remaining=1;
      for(const site of sites){
        const d=Math.hypot(x-site.x,z-site.z);
        if(d<=site.radius)return site.height;
        if(d>=site.radius+1.45)continue;
        const amount=1-smooth((d-site.radius)/1.45),weight=amount/Math.max(.000001,1-amount);
        sum+=weight;weightedHeight+=site.height*weight;remaining*=1-amount;
      }
      if(sum)height+=(weightedHeight/sum-height)*(1-remaining);
      return Math.max(1.6,height);
    };
    profile.unmap=(mappedX,mappedZ)=>{
      let x=mappedX,z=mappedZ;
      for(let i=0;i<8;i++){
        const p=profile.map(x,z),dx=mappedX-p[0],dz=mappedZ-p[1];
        if(Math.abs(dx)+Math.abs(dz)<1e-8)break;
        const epsilon=.001,px=profile.map(x+epsilon,z),pz=profile.map(x,z+epsilon);
        const a=(px[0]-p[0])/epsilon,b=(pz[0]-p[0])/epsilon,c=(px[1]-p[1])/epsilon,d=(pz[1]-p[1])/epsilon,det=a*d-b*c;
        if(Math.abs(det)<1e-9)break;
        x+=(dx*d-b*dz)/det;z+=(a*dz-dx*c)/det;
      }
      return[x,z];
    };
    profile.heightWorld=(worldX,worldZ)=>profile.height(...profile.unmap(worldX/3.4,worldZ/3.4));
    profile.surfaceColor=(x,z,height=profile.height(x,z))=>{
      const [base,light,rock,cap]=spec.colours,n=.5+.5*ripple(x*.85,z*.85);
      let colour=colourMix(base,light,.18+n*.36);
      if(id==='de'){
        const green=smooth((Math.sin(x*.45+z*.26)+Math.cos(z*.53-x*.16)-.7)/1.0)*(1-smooth((height-5)/6))*.72;
        colour=colourMix(colour,'#789455',green);
        const exposed=smooth((height-4.8)/9);
        colour=colourMix(colour,colourMix(rock,cap,.45+.22*Math.sin(height*1.7)),exposed*.95);
      }else if(id==='en'){
        const craterDistance=Math.hypot(x-.5,z),exposed=smooth((height-4.5)/8.0);
        colour=colourMix(colour,colourMix(rock,'#756758',n*.28),exposed);
        if(craterDistance<1.0)colour=colourMix(colour,'#514b46',1-smooth((craterDistance-.65)/.35));
        else if(craterDistance<1.65)colour=colourMix(colour,'#97826b',(1-Math.abs(craterDistance-1.1)/.6)*.36);
      }else if(id==='nmg'){
        colour=colourMix(colour,rock,smooth((height-8)/9));
        colour=colourMix(colour,cap,smooth((height-20.5)/7)*.92);
      }else{
        colour=colourMix(colour,rock,smooth((height-6)/6)*.94);
        colour=colourMix(colour,cap,smooth((height-11)/5)*.70);
      }
      return colour;
    };
  });
  W3.Landschaften={
    profiles,
    getProfile(id){return profiles[id]||profiles.math;}
  };
})(globalThis);
