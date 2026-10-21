/* Übernommen aus docs/mockup/fachinsel-2026-10-20 (Codex, 20.10.2026), Namensraum Lernwelt.W3 (E-2010-02, S2). */
/* Eine May begleitet die aktuelle Insel. Wege bleiben die sichere Laufzone. */
(function (g) {
  const L = (g.Lernwelt = g.Lernwelt || {}), W3 = (L.W3 = L.W3 || {});
  'use strict';
  W3.MayInsel = function(THREE,modelFactory) {
    const root=new THREE.Group();root.name='May · graue norwegische Waldkatze';
    const model=modelFactory.create('walk');model.scale.setScalar(.78);root.add(model);
    root.traverse(node=>node.userData.may=true);
    let route=null,from=.35,to=.65,contextKey='',lastTime=0;
    function setContext(subject,topic,locations,profile) {
      const id=locations[topic]?topic:'zahlen',key=subject+':'+id;
      if(key===contextKey)return;
      contextKey=key;
      const destination=new THREE.Vector3(...locations[id]);
      const centres=Object.entries(locations).filter(([k])=>k!=='neuland')
        .map(([,position])=>new THREE.Vector3(...position));
      // Wie bei inselnatur.js: zuerst den lokalen Weg interpolieren, danach
      // auf die Küstenform abbilden. Verformte Kontrollpunkte wären ein anderer Weg.
      class MappedRoad extends THREE.Curve {
        constructor(points){
          super();
          this.base=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],0,p[1])));
          this.arcLengthDivisions=600;
        }
        getPoint(t,target=new THREE.Vector3()){
          const p=this.base.getPoint(t),mapped=profile.map(p.x,p.z);
          return target.set(mapped[0]*3.4,profile.height(p.x,p.z)+.06,mapped[1]*3.4);
        }
      }
      const roads=[...profile.roads];
      if(id==='brueche')roads.push(profile.expansionRoad);
      // Die kleine Reserve berücksichtigt die Strecke zwischen zwei Prüfpunkten.
      const distanceXZ=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
      const safe=point=>distanceXZ(point,destination)<=11&&
        centres.every(centre=>distanceXZ(point,centre)>=6.95);
      let best=null;
      roads.forEach(points=>{
        const curve=new MappedRoad(points),length=curve.getLength();
        const count=Math.max(100,Math.ceil(length/.12));
        let runStart=null;
        function finishRun(end){
          if(runStart===null)return;
          // Enden nach innen versetzen, damit auch die ganze Pendelstrecke
          // Abstand hält und nicht nur ein einzelner Auswahlpunkt.
          const low=(runStart+1)/count,high=(end-1)/count;
          if((high-low)*length<.5){runStart=null;return;}
          for(let n=runStart+1;n<=end-1;n++){
            const u=n/count,p=curve.getPointAt(u),distance=distanceXZ(p,destination);
            const facing=p.x-destination.x+p.z-destination.z;
            const score=Math.abs(distance-8.8)+Math.max(0,-facing)*.75;
            if(!best||score<best.score){
              const span=Math.min(2.2/length,(high-low)/2);
              const middle=Math.max(low+span,Math.min(high-span,u));
              best={curve,from:middle-span,to:middle+span,score};
            }
          }
          runStart=null;
        }
        for(let n=2;n<=count-2;n++){
          const point=curve.getPointAt(n/count);
          if(safe(point)){if(runStart===null)runStart=n;}
          else finishRun(n-1);
        }
        finishRun(count-2);
      });
      if(best){
        route=best.curve;
        from=best.from;to=best.to;
        root.userData.routeReady=true;
      }else{
        // Bei späteren unbekannten Themen keine ungeprüfte Strecke über Meer
        // oder Bauplätze erfinden. Der feste Menüknopf bleibt erreichbar.
        route=null;
        root.userData.routeReady=false;
        root.visible=false;
        return;
      }
      update(lastTime,false);
    }
    function update(seconds,moving=true){
      if(!route)return;
      lastTime=seconds;
      const phase=seconds%40;
      const walking=phase<14||phase>=20&&phase<34;
      const reverse=phase>=20;
      const fraction=phase<14?phase/14:phase<20?1:phase<34?1-(phase-20)/14:0;
      const u=from+(to-from)*fraction,point=route.getPointAt(u),tangent=route.getTangentAt(u);
      root.position.copy(point);
      root.rotation.set(-Math.atan2(tangent.y,Math.hypot(tangent.x,tangent.z))*(reverse?-1:1),
        Math.atan2(tangent.x,tangent.z)+(reverse?Math.PI:0),0,'YXZ');
      modelFactory.update(model,moving?seconds:0,moving?(walking?true:'play'):false);
    }
    function getPoint(){return root.position.clone().add(new THREE.Vector3(0,.8,0));}
    return {root,setContext,update,getPoint};
  };
})(globalThis);
