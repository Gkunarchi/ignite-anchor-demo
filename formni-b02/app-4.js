'use strict';
function localPos(ev){const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top]}
  function hitHandle(pt){let best=null,bestD=19;for(const h of handleData()){const d=dist2(pt,h.screen);if(d<bestD){best=h;bestD=d}}return best}
  function overWall(pt){const p=wallPolygon();return p.length===4&&pointInPoly(pt,p)}

  canvas.addEventListener('pointermove',ev=>{
    const pt=localPos(ev);
    if(pointer.down){
      const dx=pt[0]-pointer.last[0],dy=pt[1]-pointer.last[1];if(Math.hypot(pt[0]-pointer.start[0],pt[1]-pointer.start[1])>3)pointer.moved=true;
      if(pointer.mode==='orbit'){
        camera.yaw=pointer.startCamera.yaw-(pt[0]-pointer.start[0])*.0052;
        camera.pitch=clamp(pointer.startCamera.pitch+(pt[1]-pointer.start[1])*.0042,-.12,.58);draw();
      }else if(pointer.mode==='tv'){
        const s=pointer.startTV,c=state.cabinet;const origin=[s.x,tvDepth()+60,s.z+s.h/2];
        const ax=screenAxis(origin,[1000,0,0]),az=screenAxis(origin,[0,0,1000]);
        const sx=pt[0]-pointer.start[0],sy=pt[1]-pointer.start[1];
        let nx=s.x+(sx*ax.x+sy*ax.y)/(ax.pxPerUnit||.1);
        let nz=s.z+(sx*az.x+sy*az.y)/(az.pxPerUnit||.1);
        const x0=c.x-c.w/2,x1=c.x+c.w/2,z0=c.z,z1=c.z+c.h;
        const marginX=180,minBase=420,topMargin=150;
        nx=clamp(nx,x0+s.w/2+marginX,x1-s.w/2-marginX);
        nz=clamp(nz,z0+minBase,z1-s.h-topMargin);
        const centerSnap=Math.abs(nx-c.x)<80;nx=centerSnap?c.x:Math.round(nx/20)*20;nz=Math.round(nz/20)*20;
        state.tv.x=nx;state.tv.z=nz;state.tv.anchor=true;state.hasShaped=true;
        setSnap(centerSnap?{value:c.x,label:'电视对齐柜体中心'}:null,'x',[nx,0,nz+s.h/2]);draw();
      }else if(pointer.mode==='resize'){
        const c=state.cabinet;const s=pointer.startCabinet;const id=pointer.handle;const origin=handleWorld(s,id);
        const dir=id==='left'?[-1000,0,0]:id==='right'?[1000,0,0]:id==='top'?[0,0,1000]:id==='bottom'?[0,0,-1000]:[0,1000,0];
        const axis=screenAxis(origin,dir);
        const deltaPx=(pt[0]-pointer.start[0])*axis.x+(pt[1]-pointer.start[1])*axis.y;const delta=deltaPx/(axis.pxPerUnit||.1);
        state.snap=null;
        if(id==='right'||id==='left'){
          const fixed=id==='right'?s.x-s.w/2:s.x+s.w/2;const direction=id==='right'?1:-1;
          let rawEdge=(id==='right'?s.x+s.w/2:s.x-s.w/2)+direction*delta;
          rawEdge=clamp(rawEdge,id==='right'?fixed+800:room.leftX,id==='right'?room.rightX:fixed-800);
          if(state.tv.anchor){const tvLimit=id==='right'?state.tv.x+state.tv.w/2+220:state.tv.x-state.tv.w/2-220;rawEdge=id==='right'?Math.max(rawEdge,tvLimit):Math.min(rawEdge,tvLimit);}
          const rawW=Math.abs(rawEdge-fixed);const candidates=dimensionCandidates(fixed,direction,'width',rawEdge);
          candidates.push({value:0,label:'墙面中心线'},{value:room.leftX,label:'左墙边'},{value:room.rightX,label:'右墙边'});
          const snap=chooseSnap(rawEdge,candidates,70);const edge=snap?snap.value:Math.round(rawEdge/10)*10;
          const nw=Math.abs(edge-fixed);c.w=nw;c.x=(edge+fixed)/2;setSnap(snap,'x',[edge,c.y+c.d+120,c.z+c.h*.55]);
        }else if(id==='top'||id==='bottom'){
          const fixed=id==='top'?s.z:s.z+s.h;const direction=id==='top'?1:-1;
          let rawEdge=(id==='top'?s.z+s.h:s.z)+direction*delta;
          rawEdge=clamp(rawEdge,id==='top'?fixed+500:0,id==='top'?room.wallH:fixed-500);
          if(state.tv.anchor){const tvLimit=id==='top'?state.tv.z+state.tv.h+170:state.tv.z-420;rawEdge=id==='top'?Math.max(rawEdge,tvLimit):Math.min(rawEdge,tvLimit);}
          const candidates=dimensionCandidates(fixed,direction,'height',rawEdge);
          candidates.push({value:0,label:'地面'},{value:room.wallH,label:'墙顶'});
          for(const z of [300,450,600,750,900,1200,1500,1800,2100,2400,2700])candidates.push({value:z,label:`标高 ${mm(z)}`});
          const snap=chooseSnap(rawEdge,candidates,55);const edge=snap?snap.value:Math.round(rawEdge/10)*10;
          c.z=Math.min(edge,fixed);c.h=Math.abs(edge-fixed);setSnap(snap,'z',[c.x,c.y+c.d+120,edge]);
        }else{
          const fixed=id==='front'?s.y:s.y+s.d;const direction=id==='front'?1:-1;
          let rawEdge=(id==='front'?s.y+s.d:s.y)+delta;
          rawEdge=clamp(rawEdge,id==='front'?fixed+260:0,id==='front'?Math.min(room.roomD-300,fixed+1000):fixed-260);
          const candidates=dimensionCandidates(fixed,direction,'depth',rawEdge);
          candidates.push({value:0,label:'背面贴墙'});
          const snap=chooseSnap(rawEdge,candidates,45);const edge=snap?snap.value:Math.round(rawEdge/10)*10;
          c.y=Math.min(edge,fixed);c.d=Math.abs(edge-fixed);setSnap(snap,'y',[c.x,edge,c.z+c.h*.22]);
        }
        state.hasShaped=true;draw();
      }
      pointer.last=pt;return;
    }
    const h=state.cabinet?hitHandle(pt):null;const tvHit=!h&&overTV(pt);state.activeHandle=h?h.id:null;
    const hw=!state.cabinet&&overWall(pt);const changed=hw!==state.hoverWall||tvHit!==state.hoverTV;state.hoverWall=hw;state.hoverTV=tvHit;if(changed)draw();
    canvas.style.cursor=tvHit?(state.tv.anchor?'move':'pointer'):(h?cursorForHandle(h.id):(!state.cabinet&&hw?'pointer':'grab'));
    updateUI();
  });
  canvas.addEventListener('pointerdown',ev=>{
    if(anim)return;canvas.setPointerCapture(ev.pointerId);const pt=localPos(ev);const h=state.cabinet?hitHandle(pt):null;const tvHit=!h&&overTV(pt);
    pointer={down:true,start:pt,last:pt,mode:null,moved:false,handle:null,startCabinet:null,startTV:null,startCamera:null,clickWall:false,preSnapshot:null,wasAnchor:state.tv.anchor};state.snap=null;
    if(state.cabinet&&tvHit){pointer.mode='tv';pointer.startTV=clone(state.tv);pointer.preSnapshot=snapshot();state.tv.anchor=true;state.hasShaped=true;canvas.style.cursor='move';}
    else if(h){pointer.mode='resize';pointer.handle=h.id;pointer.startCabinet=clone(state.cabinet);pointer.preSnapshot=snapshot();state.activeHandle=h.id;canvas.style.cursor=cursorForHandle(h.id);}
    else if(!state.cabinet&&overWall(pt)){pointer.mode='wall';pointer.clickWall=true;canvas.style.cursor='pointer';}
    else{pointer.mode='orbit';pointer.startCamera=clone(camera);canvas.style.cursor='grabbing';}
    draw();
  });
  canvas.addEventListener('pointerup',ev=>{
    if(!pointer.down)return;const mode=pointer.mode,moved=pointer.moved,pre=pointer.preSnapshot;
    pointer.down=false;state.activeHandle=null;canvas.style.cursor='grab';
    const snapLabel=state.snap&&state.snap.label;state.snap=null;
    if(mode==='wall'&&!moved)generateSeed();
    else if(mode==='tv'){
      const changed=!pointer.wasAnchor||moved;
      if(changed){pushHistory(pre);toast(moved?(pointer.wasAnchor?'电视位置已更新':'电视已成为锚点并调整位置'):'电视已成为功能锚点');}
      state.tv.anchor=true;draw();
    }else if(mode==='resize'){
      if(moved){pushHistory(pre);toast(snapLabel?`已吸附到 ${snapLabel}`:(state.tv.anchor?'已保留电视锚点并重组':'已保留当前造型'));}else state.cabinet=clone(pointer.startCabinet);
      draw();
    }else draw();
  });
  canvas.addEventListener('pointercancel',()=>{if(pointer.mode==='resize'&&pointer.startCabinet)state.cabinet=clone(pointer.startCabinet);if(pointer.mode==='tv'&&pointer.startTV)state.tv=clone(pointer.startTV);pointer.down=false;state.activeHandle=null;state.snap=null;draw();});
  canvas.addEventListener('wheel',ev=>{ev.preventDefault();camera.dist=clamp(camera.dist*(1+Math.sign(ev.deltaY)*.08),4200,12000);draw();},{passive:false});
  canvas.addEventListener('contextmenu',ev=>ev.preventDefault());

  const qs=new URLSearchParams(location.search);
  if(qs.get('seed')==='1')state.cabinet={x:0,y:0,z:0,w:3600,h:2100,d:420};
  if(qs.get('anchor')==='1'){state.cabinet={x:0,y:0,z:0,w:4200,h:2480,d:460};state.tv={...clone(DEFAULT_TV),anchor:true};state.hasShaped=true;}
  if(qs.get('moved')==='1'){state.cabinet={x:260,y:0,z:0,w:4600,h:2600,d:520};state.tv={...clone(DEFAULT_TV),x:-480,z:1160,anchor:true};state.hasShaped=true;}
  if(qs.get('shaped')==='1'){state.cabinet={x:450,y:0,z:0,w:4300,h:2540,d:580};state.hasShaped=true;}
  window.__formniTest={
    getState:()=>clone({state,camera}),
    getHandles:()=>handleData().map(h=>({id:h.id,axis:h.axis,x:h.screen.x,y:h.screen.y})),
    getTVPolygon:()=>tvPolygon().map(p=>({x:p.x,y:p.y})),
    generateSeed:()=>{if(!state.cabinet)generateSeed()},
    anchorTV:()=>{if(state.cabinet){state.tv.anchor=true;state.hasShaped=true;draw()}},
    setTV:t=>{state.tv={...state.tv,...clone(t)};draw()},
    setCabinet:c=>{state.cabinet=clone(c);state.hasShaped=true;anim=null;draw()}
  };
  resize();
