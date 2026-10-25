// Formni B08 — 场地硬条件：门洞与安全边界。依赖 B02–B07。
const b08DoorState=document.getElementById('doorState');
const b08DoorWidthState=document.getElementById('doorWidthState');
const b08DoorClearState=document.getElementById('doorClearState');
const b08UsableState=document.getElementById('usableState');
const b08FitState=document.getElementById('siteFitState');
const b08StepSite=document.getElementById('stepSite');
const b08StepFit=document.getElementById('stepFit');
const b08StepChange=document.getElementById('stepSiteChange');
const b08StepRetest=document.getElementById('stepSiteRetest');
const B08_DEFAULT_DOOR={x:2380,w:900,h:2200,margin:180};

function b08Ensure(){
  b07Ensure();
  if(!state.site)state.site={door:clone(B08_DEFAULT_DOOR),hasMoved:false,retested:false,fitCount:0};
  if(!state.site.door)state.site.door=clone(B08_DEFAULT_DOOR);
  if(state.site.hasMoved==null)state.site.hasMoved=false;
  if(state.site.retested==null)state.site.retested=false;
  if(state.site.fitCount==null)state.site.fitCount=0;
}
function b08Door(){b08Ensure();return state.site.door;}
function b08Safe(){const d=b08Door();return{x0:d.x-d.w/2-d.margin,x1:d.x+d.w/2+d.margin};}
function b08Interval(){const s=b08Safe();return{x0:room.leftX+160,x1:s.x0};}
function b08UsableWidth(){const i=b08Interval();return Math.max(0,i.x1-i.x0);}
function b08FitCabinet(){
  b08Ensure();if(!state.cabinet)return;
  const i=b08Interval(),minW=state.tv.anchor&&state.layout?Math.max(2200,(b07Requirements('right',i.x0)||{}).hardWidth||2200):2200;
  const x1=Math.max(i.x0+minW,i.x1),x0=i.x0;
  state.cabinet.x=(x0+x1)/2;state.cabinet.w=x1-x0;state.site.fitCount++;
}

function b08DoorFaces(){
  const d=b08Door(),x0=d.x-d.w/2,faces=[];
  faces.push(...boxFaces(x0,8,0,d.w,52,d.h,{main:'#8e8b82',side:'#6f716c',front:'#8e8b82',top:'#a6a49c'}));
  faces.push(...boxFaces(x0+55,64,65,d.w-110,18,d.h-110,{main:'#d9d6ce',side:'#aca9a1',front:'#d9d6ce'}));
  faces.push(...boxFaces(x0+115,85,150,d.w-230,14,d.h-310,{main:'#bfc2bd',side:'#969a95',front:'#bfc2bd'}));
  faces.push(...boxFaces(d.x+d.w*.24,104,d.h*.48,34,18,34,{main:'#565d5a',side:'#343a38',front:'#565d5a'}));
  return faces;
}
function b08DoorPoly(){
  const d=b08Door(),x0=d.x-d.w/2,x1=d.x+d.w/2,y=115;
  return[[x0,y,0],[x1,y,0],[x1,y,d.h],[x0,y,d.h]].map(project).filter(Boolean);
}
function b08OverDoor(pt){const p=b08DoorPoly();return p.length===4&&pointInPoly(pt,p);}
function b08DrawSite(){
  b08Ensure();const d=b08Door(),s=b08Safe(),poly=b08DoorPoly();
  drawLine3([s.x0,5,0],[s.x0,5,room.wallH],'#b56c3f',2.3,[8,6]);
  drawLine3([s.x1,5,0],[s.x1,5,room.wallH],'rgba(181,108,63,.48)',1.5,[7,6]);
  if(poly.length===4){
    ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);poly.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
    ctx.strokeStyle=b08Pointer.hover||b08Pointer.down?'#b56c3f':'rgba(181,108,63,.72)';ctx.lineWidth=b08Pointer.down?3:2;ctx.stroke();
    const cx=(poly[0].x+poly[2].x)/2,top=Math.min(...poly.map(p=>p.y));
    const label=b08Pointer.down?'拖动门洞 · 柜体实时适配':'拖动门洞，模拟现场变化';ctx.font='700 10px Inter, sans-serif';const tw=ctx.measureText(label).width;
    ctx.fillStyle='rgba(181,108,63,.94)';ctx.fillRect(cx-tw/2-7,top-28,tw+14,19);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,cx,top-14);ctx.restore();
  }
  const p=project([s.x0,20,room.wallH*.58]);
  if(p){const label='柜体安全边界';ctx.save();ctx.font='700 10px Inter, sans-serif';const tw=ctx.measureText(label).width;ctx.fillStyle='rgba(181,108,63,.94)';ctx.fillRect(p.x-tw/2-7,p.y-25,tw+14,19);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-11);ctx.restore();}
}

const b08BaseRoomFaces=makeRoomFaces;
makeRoomFaces=function(){b08Ensure();return[...b08BaseRoomFaces(),...b08DoorFaces()];};

const b08BaseGenerateSeed=generateSeed;
generateSeed=function(){
  b08Ensure();pushHistory(snapshot());
  const i=b08Interval(),target={x:(i.x0+i.x1)/2,y:0,z:0,w:i.x1-i.x0,h:2100,d:420};
  const start={x:target.x,y:0,z:0,w:500,h:420,d:120};
  state.cabinet=clone(start);state.tv=clone(DEFAULT_TV);state.hoverWall=false;state.hoverTV=false;state.site.fitCount++;
  anim={start:performance.now(),duration:460,from:start,to:target};toast('已识别门洞，第一稿生成在合法墙段内');requestAnimationFrame(animateSeed);
};

const b08BaseDraw=draw;
draw=function(){b08Ensure();b08BaseDraw();b08DrawSite();};

const b08BaseSnapshot=snapshot;
snapshot=function(){const s=b08BaseSnapshot();b08Ensure();s.site=clone(state.site);return s;};
const b08BaseRestore=restore;
restore=function(s){state.site=clone(s.site||{door:clone(B08_DEFAULT_DOOR),hasMoved:false,retested:false,fitCount:0});b08BaseRestore(s);b08Ensure();};

const b08BaseUpdate=updateUI;
updateUI=function(){
  b08Ensure();b08BaseUpdate();const d=b08Door(),s=b08Safe(),i=b08Interval();
  b08DoorState.textContent=`X ${mm(d.x)}`;b08DoorWidthState.textContent=mm(d.w);b08DoorClearState.textContent=`左边界 ${mm(s.x0)} · 余量 ${mm(d.margin)}`;
  b08UsableState.textContent=`${mm(i.x0)} → ${mm(i.x1)} · ${mm(b08UsableWidth())}`;
  b08FitState.textContent=state.cabinet?'已贴合可用墙段':'等待生成';
  b08StepSite.classList.toggle('on',true);b08StepFit.classList.toggle('on',!!state.cabinet);b08StepChange.classList.toggle('on',!!state.site.hasMoved);b08StepRetest.classList.toggle('on',!!state.site.retested);
  if(b08Pointer.down)promptEl.textContent='正在移动门洞：柜体外框和未确认区域实时重新分配';
  else if(b08Pointer.hover)promptEl.textContent='拖动门洞，模拟现场条件变化';
  else if(state.site.retested)promptEl.textContent='场地变化已适配：电视、确认区域和关系继续保留';
};

const b08Pointer={down:false,hover:false,start:[0,0],startDoor:null,pre:null,moved:false};
function b08Local(ev){const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
function b08DoorMinX(){
  const d=b08Door(),left=room.leftX+160;
  let minSpan=2400;
  if(state.tv.anchor&&state.layout){const req=b07Requirements('right',left);if(req)minSpan=Math.max(minSpan,req.hardWidth);}
  return left+minSpan+d.margin+d.w/2;
}
canvas.addEventListener('pointermove',ev=>{
  const pt=b08Local(ev);
  if(b08Pointer.down){
    ev.stopImmediatePropagation();
    if(Math.hypot(pt[0]-b08Pointer.start[0],pt[1]-b08Pointer.start[1])>3)b08Pointer.moved=true;
    const origin=[b08Pointer.startDoor.x,90,b08Pointer.startDoor.h*.55],axis=screenAxis(origin,[1000,0,0]);
    const delta=((pt[0]-b08Pointer.start[0])*axis.x+(pt[1]-b08Pointer.start[1])*axis.y)/(axis.pxPerUnit||.1);
    let x=Math.round((b08Pointer.startDoor.x+delta)/50)*50;
    x=clamp(x,b08DoorMinX(),room.rightX-b08Pointer.startDoor.w/2-80);
    state.site.door.x=x;state.site.hasMoved=true;state.site.retested=false;b08FitCabinet();draw();return;
  }
  const hit=b08OverDoor(pt);if(hit!==b08Pointer.hover){b08Pointer.hover=hit;draw();}
  if(hit){ev.stopImmediatePropagation();canvas.style.cursor='ew-resize';}
},true);
canvas.addEventListener('pointerdown',ev=>{
  const pt=b08Local(ev);if(!b08OverDoor(pt))return;
  ev.stopImmediatePropagation();canvas.setPointerCapture(ev.pointerId);
  Object.assign(b08Pointer,{down:true,hover:true,start:pt,startDoor:clone(b08Door()),pre:snapshot(),moved:false});canvas.style.cursor='ew-resize';draw();
},true);
canvas.addEventListener('pointerup',ev=>{
  if(!b08Pointer.down)return;ev.stopImmediatePropagation();
  if(b08Pointer.moved){pushHistory(b08Pointer.pre);state.site.hasMoved=true;state.site.retested=true;toast('门洞位置已更新；方案已按新的可用墙段重新适配');}
  Object.assign(b08Pointer,{down:false,startDoor:null,pre:null,moved:false});canvas.style.cursor='grab';draw();
},true);
canvas.addEventListener('pointercancel',ev=>{
  if(!b08Pointer.down)return;ev.stopImmediatePropagation();if(b08Pointer.pre)restore(b08Pointer.pre);Object.assign(b08Pointer,{down:false,startDoor:null,pre:null,moved:false});draw();
},true);

canvas.addEventListener('pointermove',()=>{
  b08Ensure();if(!pointer.down||pointer.mode!=='resize'||!state.cabinet)return;
  if(pointer.handle!=='right')return;
  const safe=b08Safe(),x0=state.cabinet.x-state.cabinet.w/2,x1=state.cabinet.x+state.cabinet.w/2;
  if(x1>safe.x0){state.cabinet.w=Math.max(800,safe.x0-x0);state.cabinet.x=x0+state.cabinet.w/2;state.snap={value:safe.x0,label:'门洞安全边界',axis:'x',point:[safe.x0,state.cabinet.y+state.cabinet.d+120,state.cabinet.z+state.cabinet.h*.55]};draw();}
});

const b08BaseReset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{b08BaseReset();state.site={door:clone(B08_DEFAULT_DOOR),hasMoved:false,retested:false,fitCount:0};draw();};

const b08Qs=new URLSearchParams(location.search);
if(b08Qs.get('site')==='1'){
  state.site={door:clone(B08_DEFAULT_DOOR),hasMoved:true,retested:true,fitCount:1};
  const i=b08Interval();state.cabinet={x:(i.x0+i.x1)/2,y:0,z:0,w:i.x1-i.x0,h:2700,d:520};state.tv={...DEFAULT_TV,anchor:true};state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New()];state.layout.right.regions=[b03New(),b03New()];
  state.layout.left.regions[0].structure='open';state.layout.left.regions[0].facadeRole='focus';
  state.layout.left.regions[1].structure='auto';state.layout.right.regions[0].structure='closed';state.layout.right.regions[0].facadeRole='background';state.layout.right.regions[1].structure='auto';
  state.facade={aligned:true,openShare:.43};const alloc=b03Alloc();b06Capture(state.layout.left.regions[0],alloc.left[0]);b06Capture(state.layout.right.regions[0],alloc.right[0]);
  state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.hasFacadeAction=true;state.hasConvergenceAction=true;state.hasShaped=true;
}
window.__formniB08={get:()=>clone({state,interval:b08Interval(),safe:b08Safe()}),setDoorX:x=>{b08Door().x=x;b08FitCabinet();draw();}};
draw();
