// Formni B09 — 多锚点与功能关系。依赖 B02–B08。
const b09DeskMenu=document.getElementById('deskMenu');
const b09Auto=document.getElementById('deskAutoBtn');
const b09Left=document.getElementById('deskLeftBtn');
const b09Right=document.getElementById('deskRightBtn');
const b09Lock=document.getElementById('deskLockBtn');
const b09Release=document.getElementById('deskReleaseBtn');
const b09TvState=document.getElementById('multiTvState');
const b09DeskState=document.getElementById('multiDeskState');
const b09RelationState=document.getElementById('multiRelationState');
const b09FreeState=document.getElementById('multiFreeState');
const b09GapState=document.getElementById('multiGapState');
const b09RelationBar=document.getElementById('multiRelationBar');
const b09StepTV=document.getElementById('stepMultiTV');
const b09StepDesk=document.getElementById('stepMultiDesk');
const b09StepRelation=document.getElementById('stepMultiRelation');
const b09StepRetest=document.getElementById('stepMultiRetest');

const B09_DEFAULT_DESK={x:-1760,z:0,w:1180,h:740,d:560,anchor:false,locked:false,relation:'auto',side:'left'};
const B09_TV_CLEAR=150;
const B09_DESK_CLEAR=120;
const B09_OUTER_MARGIN=180;

function b09Ensure(){
  b08Ensure();
  if(!state.desk)state.desk=clone(B09_DEFAULT_DESK);
  if(state.desk.anchor==null)state.desk.anchor=false;
  if(state.desk.locked==null)state.desk.locked=false;
  if(!state.desk.relation)state.desk.relation='auto';
  if(!state.desk.side)state.desk.side=state.desk.x<state.tv.x?'left':'right';
  if(state.hoverDesk==null)state.hoverDesk=false;
  if(state.selectedDesk==null)state.selectedDesk=false;
  if(state.hasMultiAnchorAction==null)state.hasMultiAnchorAction=false;
  if(state.hasMultiRelation==null)state.hasMultiRelation=false;
  if(state.multiRetested==null)state.multiRetested=false;
}
function b09CabinetBounds(){
  const c=state.cabinet;
  return c?{x0:c.x-c.w/2+54,x1:c.x+c.w/2-54}:b08Interval();
}
function b09TvBounds(){
  return{x0:state.tv.x-state.tv.w/2-B09_TV_CLEAR,x1:state.tv.x+state.tv.w/2+B09_TV_CLEAR};
}
function b09DeskBounds(d=state.desk){
  return{x0:d.x-d.w/2-B09_DESK_CLEAR,x1:d.x+d.w/2+B09_DESK_CLEAR};
}
function b09DeskRange(side){
  b09Ensure();
  if(!state.cabinet)return{min:0,max:-1,valid:false};
  const c=b09CabinetBounds(),tv=b09TvBounds(),d=state.desk;
  let min,max;
  if(side==='left'){
    min=c.x0+d.w/2+B09_DESK_CLEAR;
    max=tv.x0-d.w/2-B09_DESK_CLEAR;
  }else{
    min=tv.x1+d.w/2+B09_DESK_CLEAR;
    max=c.x1-d.w/2-B09_DESK_CLEAR;
  }
  return{min,max,valid:max>=min};
}
function b09RecommendedX(side){
  const range=b09DeskRange(side);
  if(!range.valid)return null;
  return side==='left'?range.max:range.min;
}
function b09SetDeskSide(side,explicit=false){
  b09Ensure();const range=b09DeskRange(side);
  if(!range.valid){toast(`${side==='left'?'左':'右'}侧空间不足，不能放入书桌锚点`);return false;}
  state.desk.side=side;
  if(explicit)state.desk.relation=side;
  const target=b09RecommendedX(side);
  state.desk.x=clamp(Number.isFinite(target)?target:state.desk.x,range.min,range.max);
  return true;
}
function b09DeskY(){
  if(!state.cabinet)return 760;
  return state.desk.anchor?state.cabinet.y+6:Math.max(760,state.cabinet.y+state.cabinet.d+420);
}
function b09DeskFaces(){
  b09Ensure();const d=state.desk,y=b09DeskY(),faces=[];
  const col=d.anchor?'#c6b59f':'#d3c5b4',side=d.anchor?'#a99a88':'#b8aa98';
  faces.push(...boxFaces(d.x-d.w/2,y,d.z+d.h,d.w,d.d,38,{main:col,side,front:col,top:'#d8c9b6'}));
  const leg=48,legH=Math.max(80,d.h-10);
  faces.push(...boxFaces(d.x-d.w/2+36,y+30,d.z,leg,d.d-60,legH,{main:side,side:'#8e8375',front:side}));
  faces.push(...boxFaces(d.x+d.w/2-36-leg,y+30,d.z,leg,d.d-60,legH,{main:side,side:'#8e8375',front:side}));
  if(d.anchor){
    const shelfZ=d.z+d.h+420;
    faces.push(...boxFaces(d.x-d.w/2,y+16,shelfZ,d.w,Math.max(80,d.d-80),24,{main:'#d9d7cf',side:'#b9b9b2',front:'#d9d7cf'}));
  }
  return faces;
}
function b09DeskPoly(){
  b09Ensure();const d=state.desk,y=b09DeskY()+d.d+28;
  return[[d.x-d.w/2,y,d.z],[d.x+d.w/2,y,d.z],[d.x+d.w/2,y,d.z+d.h+470],[d.x-d.w/2,y,d.z+d.h+470]].map(project).filter(Boolean);
}
function b09OverDesk(pt){const p=b09DeskPoly();return p.length===4&&pointInPoly(pt,p);}
function b09AnchorGap(){
  if(!state.desk.anchor||!state.tv.anchor)return null;
  const tv=b09TvBounds(),desk=b09DeskBounds();
  return state.desk.side==='left'?tv.x0-desk.x1:desk.x0-tv.x1;
}
function b09Openings(){
  if(!state.cabinet)return[];
  const c=b09CabinetBounds(),list=[];
  if(state.tv.anchor)list.push({...b09TvBounds(),kind:'tv'});
  if(state.desk.anchor)list.push({...b09DeskBounds(),kind:'desk'});
  list.sort((a,b)=>a.x0-b.x0);
  const merged=[];
  list.forEach(o=>{
    const clip={x0:Math.max(c.x0,o.x0),x1:Math.min(c.x1,o.x1),kind:o.kind};
    if(clip.x1<=clip.x0)return;
    const last=merged[merged.length-1];
    if(last&&clip.x0<=last.x1){last.x1=Math.max(last.x1,clip.x1);last.kind+='+'+clip.kind;}else merged.push(clip);
  });
  return merged;
}
function b09FreeSegments(){
  if(!state.cabinet)return[];
  const c=b09CabinetBounds(),open=b09Openings(),out=[];let x=c.x0;
  open.forEach(o=>{if(o.x0-x>60)out.push({x0:x,x1:o.x0,w:o.x0-x});x=Math.max(x,o.x1);});
  if(c.x1-x>60)out.push({x0:x,x1:c.x1,w:c.x1-x});
  return out;
}

const b09BaseRoomFaces=makeRoomFaces;
makeRoomFaces=function(){b09Ensure();return[...b09BaseRoomFaces(),...b09DeskFaces()];};

const b09BaseAnchored=anchoredCabinetFaces;
anchoredCabinetFaces=function(c,tv){
  const faces=b09BaseAnchored(c,tv);b09Ensure();
  if(!state.desk.anchor)return faces;
  const d=state.desk,zone=b09DeskBounds(),x0=Math.max(c.x-c.w/2+24,zone.x0),x1=Math.min(c.x+c.w/2-24,zone.x1);
  const frontY=c.y+c.d+31,z0=c.z+70,z1=Math.min(c.z+c.h-80,d.z+d.h+660);
  if(x1-x0>80&&z1-z0>80){
    faces.push(face([[x0,frontY,z0],[x1,frontY,z0],[x1,frontY,z1],[x0,frontY,z1]],'#f4f5f2','#8d9894',1,1.2));
    faces.push(...boxFaces(x0-24,c.y+10,z0,24,Math.max(40,c.d-20),z1-z0,{main:palette.board,side:palette.boardSide}));
    faces.push(...boxFaces(x1,c.y+10,z0,24,Math.max(40,c.d-20),z1-z0,{main:palette.board,side:palette.boardSide}));
    if(z1<c.z+c.h-100)faces.push(...boxFaces(x0,c.y+12,z1,x1-x0,Math.max(40,c.d-24),24,{main:palette.board,side:palette.boardSide}));
  }
  return faces;
};

const b09BaseRequirements=b07Requirements;
b07Requirements=function(handle=null,fixed=null){
  const base=b09BaseRequirements(handle,fixed);b09Ensure();
  if(!base||!state.desk.anchor||!state.tv.anchor||!state.cabinet)return base;
  const tv=b09TvBounds(),desk=b09DeskBounds();
  const minX=Math.min(tv.x0,desk.x0)-B09_OUTER_MARGIN;
  const maxX=Math.max(tv.x1,desk.x1)+B09_OUTER_MARGIN;
  let hard=maxX-minX;
  if(handle==='right'&&Number.isFinite(fixed))hard=maxX-fixed;
  if(handle==='left'&&Number.isFinite(fixed))hard=fixed-minX;
  hard=Math.max(800,hard);
  base.hardWidth=Math.max(base.hardWidth,hard);
  base.softWidth=Math.max(base.softWidth,hard+B03_MIN);
  base.multiAnchor=true;
  return base;
};

function b09DrawDeskOverlay(){
  b09Ensure();const poly=b09DeskPoly();if(poly.length!==4)return;
  const active=state.desk.anchor,hover=state.hoverDesk||state.selectedDesk;
  if(active||hover){
    ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);poly.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
    ctx.strokeStyle=active?'#b06a38':'#32777c';ctx.lineWidth=active?3:2.3;ctx.setLineDash(active?[]:[7,5]);ctx.stroke();ctx.setLineDash([]);
    const cx=(poly[0].x+poly[2].x)/2,top=Math.min(...poly.map(p=>p.y));
    const label=active?(state.desk.locked?'书桌锚点 · 已锁定':'书桌锚点 · 可拖动'):'点击书桌，加入第二个锚点';
    ctx.font='700 10px Inter, sans-serif';const tw=ctx.measureText(label).width;ctx.fillStyle=active?'rgba(176,106,56,.95)':'rgba(50,119,124,.94)';ctx.fillRect(cx-tw/2-8,top-28,tw+16,20);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,cx,top-14);ctx.restore();
  }
  if(state.desk.anchor&&state.tv.anchor){
    const tv=[state.tv.x,tvDepth()+85,state.tv.z+state.tv.h/2],desk=[state.desk.x,b09DeskY()+state.desk.d+70,state.desk.z+state.desk.h+210];
    drawLine3(desk,tv,state.desk.relation==='auto'?'rgba(176,106,56,.72)':'#b06a38',2,state.desk.relation==='auto'?[7,6]:[]);
    const p=project([(desk[0]+tv[0])/2,(desk[1]+tv[1])/2,(desk[2]+tv[2])/2]);
    if(p){const label=`${state.desk.side==='left'?'书桌在电视左侧':'书桌在电视右侧'}${state.desk.relation==='auto'?' · 自动':' · 明确'}`;ctx.save();ctx.font='700 10px Inter, sans-serif';const tw=ctx.measureText(label).width;ctx.fillStyle='rgba(176,106,56,.93)';ctx.fillRect(p.x-tw/2-7,p.y-24,tw+14,19);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-10);ctx.restore();}
  }
}
function b09DeskMenuPosition(){
  b09Ensure();
  if(!state.selectedDesk||!state.desk.anchor){b09DeskMenu.classList.remove('show');return;}
  const p=b09DeskPoly();if(p.length!==4){b09DeskMenu.classList.remove('show');return;}
  const cx=(p[0].x+p[2].x)/2,cy=(p[0].y+p[2].y)/2;
  b09DeskMenu.style.left=clamp(cx+22,12,W-212)+'px';b09DeskMenu.style.top=clamp(cy-76,58,H-210)+'px';b09DeskMenu.classList.add('show');
  [b09Auto,b09Left,b09Right,b09Lock].forEach(b=>b.classList.remove('active'));
  ({auto:b09Auto,left:b09Left,right:b09Right}[state.desk.relation]||b09Auto).classList.add('active');
  if(state.desk.locked)b09Lock.classList.add('active');
  b09Lock.textContent=state.desk.locked?'解除位置锁定':'锁定当前位置';
}

const b09BaseDraw=draw;
draw=function(){b09Ensure();b09BaseDraw();b09DrawDeskOverlay();b09DeskMenuPosition();};

const b09BaseSnapshot=snapshot;
snapshot=function(){const s=b09BaseSnapshot();b09Ensure();s.desk=clone(state.desk);s.hasMultiAnchorAction=!!state.hasMultiAnchorAction;s.hasMultiRelation=!!state.hasMultiRelation;s.multiRetested=!!state.multiRetested;return s;};
const b09BaseRestore=restore;
restore=function(s){state.desk=clone(s.desk||B09_DEFAULT_DESK);state.hasMultiAnchorAction=!!s.hasMultiAnchorAction;state.hasMultiRelation=!!s.hasMultiRelation;state.multiRetested=!!s.multiRetested;state.hoverDesk=false;state.selectedDesk=false;b09BaseRestore(s);b09Ensure();};

const b09BaseUpdate=updateUI;
updateUI=function(){
  b09Ensure();b09BaseUpdate();
  const gap=b09AnchorGap(),free=b09FreeSegments(),freeW=free.reduce((s,r)=>s+r.w,0);
  b09TvState.textContent=state.tv.anchor?'已确认':'等待点击';
  b09DeskState.textContent=state.desk.anchor?(state.desk.locked?'已确认 · 位置锁定':'已确认 · 可移动'):'等待点击';
  b09RelationState.textContent=state.desk.anchor?`${state.desk.side==='left'?'电视左侧':'电视右侧'} · ${state.desk.relation==='auto'?'系统保持':'明确关系'}`:'尚未建立';
  b09FreeState.textContent=state.desk.anchor?`${free.length} 段 · ${mm(freeW)}`:'—';
  b09GapState.textContent=gap==null?'—':mm(Math.max(0,gap));
  b09RelationBar.style.width=`${state.tv.anchor?(state.desk.anchor?100:50):0}%`;
  b09StepTV.classList.toggle('on',!!state.tv.anchor);b09StepDesk.classList.toggle('on',!!state.desk.anchor);b09StepRelation.classList.toggle('on',!!state.hasMultiRelation);b09StepRetest.classList.toggle('on',!!state.multiRetested);
  if(b09Pointer.down)promptEl.textContent='正在移动书桌：电视、门洞和剩余柜体实时重新组织';
  else if(state.hoverDesk&&!state.desk.anchor)promptEl.textContent=state.tv.anchor?'点击书桌，把它变成第二个功能锚点':'先点击电视，再加入书桌锚点';
  else if(state.hoverDesk&&state.desk.anchor)promptEl.textContent=state.desk.locked?'书桌位置已锁定；点击后可以解除':'拖动书桌，或点击设置与电视的明确关系';
  else if(state.desk.anchor&&state.multiRetested)promptEl.textContent='双锚点关系已保留：继续推拉，剩余区域仍会重新分配';
  else if(state.tv.anchor&&!state.desk.anchor)promptEl.textContent='下一步：点击场景中的书桌，加入第二个功能锚点';
};

function b09ApplyRelation(mode){
  b09Ensure();if(!state.desk.anchor)return;
  const pre=snapshot();
  if(mode==='auto')state.desk.relation='auto';
  else if(!b09SetDeskSide(mode,true))return;
  pushHistory(pre);state.hasMultiRelation=true;state.multiRetested=false;state.selectedDesk=true;draw();toast(mode==='auto'?'书桌交回系统判断；当前相对顺序保持稳定':`已明确书桌在电视${mode==='left'?'左':'右'}侧`);
}
b09Auto.onclick=()=>b09ApplyRelation('auto');
b09Left.onclick=()=>b09ApplyRelation('left');
b09Right.onclick=()=>b09ApplyRelation('right');
b09Lock.onclick=()=>{b09Ensure();if(!state.desk.anchor)return;pushHistory(snapshot());state.desk.locked=!state.desk.locked;state.hasMultiRelation=true;draw();toast(state.desk.locked?'书桌位置已锁定':'书桌位置已解锁');};
b09Release.onclick=()=>{b09Ensure();if(!state.desk.anchor)return;pushHistory(snapshot());state.desk.anchor=false;state.desk.locked=false;state.selectedDesk=false;state.hasMultiRelation=false;state.multiRetested=false;draw();toast('已取消书桌锚点；剩余柜体重新交给系统');};

const b09Pointer={down:false,hover:false,start:[0,0],startDesk:null,pre:null,moved:false};
function b09Local(ev){const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
function b09MoveDesk(rawX){
  const d=state.desk;
  let side=d.relation==='left'||d.relation==='right'?d.relation:(rawX<state.tv.x?'left':'right');
  let range=b09DeskRange(side);
  if(!range.valid&&d.relation==='auto'){
    const other=side==='left'?'right':'left',alt=b09DeskRange(other);if(alt.valid){side=other;range=alt;}
  }
  if(!range.valid)return false;
  let x=clamp(rawX,range.min,range.max),snap=null;
  const recommended=b09RecommendedX(side);
  if(recommended!=null&&Math.abs(x-recommended)<85){x=recommended;snap={value:x,label:`书桌靠电视${side==='left'?'左':'右'}侧`};}
  else x=Math.round(x/50)*50;
  d.x=x;d.side=side;d.anchor=true;
  state.snap=snap?{...snap,axis:'x',point:[x,b09DeskY()+d.d+90,d.h*.58]}:null;
  return true;
}
canvas.addEventListener('pointermove',ev=>{
  const pt=b09Local(ev);
  if(b09Pointer.down){
    ev.stopImmediatePropagation();
    if(Math.hypot(pt[0]-b09Pointer.start[0],pt[1]-b09Pointer.start[1])>3)b09Pointer.moved=true;
    if(state.desk.locked){canvas.style.cursor='not-allowed';return;}
    const start=b09Pointer.startDesk,origin=[start.x,b09DeskY()+start.d+60,start.z+start.h*.55],axis=screenAxis(origin,[1000,0,0]);
    const delta=((pt[0]-b09Pointer.start[0])*axis.x+(pt[1]-b09Pointer.start[1])*axis.y)/(axis.pxPerUnit||.1);
    if(b09MoveDesk(start.x+delta)){state.hasMultiAnchorAction=true;state.hasMultiRelation=true;state.multiRetested=false;draw();}
    return;
  }
  const h=state.cabinet?hitHandle(pt):null,door=b08OverDoor(pt),tv=!h&&!door&&overTV(pt),desk=!h&&!door&&!tv&&b09OverDesk(pt);
  if(desk){ev.stopImmediatePropagation();state.hoverDesk=true;canvas.style.cursor=state.desk.anchor?(state.desk.locked?'pointer':'move'):'pointer';draw();}
  else if(state.hoverDesk){state.hoverDesk=false;draw();}
},true);
canvas.addEventListener('pointerdown',ev=>{
  const pt=b09Local(ev),h=state.cabinet?hitHandle(pt):null,door=b08OverDoor(pt),tv=!h&&!door&&overTV(pt),desk=!h&&!door&&!tv&&b09OverDesk(pt);
  if(!desk)return;
  ev.stopImmediatePropagation();canvas.setPointerCapture(ev.pointerId);
  Object.assign(b09Pointer,{down:true,hover:true,start:pt,startDesk:clone(state.desk),pre:snapshot(),moved:false});state.selectedDesk=false;state.snap=null;canvas.style.cursor=state.desk.locked?'pointer':'move';draw();
},true);
canvas.addEventListener('pointerup',ev=>{
  if(!b09Pointer.down)return;ev.stopImmediatePropagation();
  const wasAnchor=b09Pointer.startDesk.anchor;
  if(b09Pointer.moved&&!state.desk.locked){
    pushHistory(b09Pointer.pre);state.desk.anchor=true;state.hasMultiAnchorAction=true;state.hasMultiRelation=true;state.multiRetested=wasAnchor;toast(wasAnchor?'书桌位置已更新；剩余区域重新分配':'书桌已成为第二个功能锚点');
  }else if(!wasAnchor){
    if(!state.tv.anchor){state.desk=clone(b09Pointer.startDesk);toast('先点击电视，再加入书桌锚点');}
    else{const side=state.desk.x<state.tv.x?'left':'right';if(b09SetDeskSide(side,false)){pushHistory(b09Pointer.pre);state.desk.anchor=true;state.hasMultiAnchorAction=true;state.hasMultiRelation=true;toast('书桌已成为第二个功能锚点');}}
  }else state.selectedDesk=true;
  Object.assign(b09Pointer,{down:false,startDesk:null,pre:null,moved:false});state.snap=null;canvas.style.cursor='grab';draw();
},true);
canvas.addEventListener('pointercancel',ev=>{if(!b09Pointer.down)return;ev.stopImmediatePropagation();if(b09Pointer.pre)restore(b09Pointer.pre);Object.assign(b09Pointer,{down:false,startDesk:null,pre:null,moved:false});state.snap=null;draw();},true);

canvas.addEventListener('pointermove',()=>{
  b09Ensure();if(!pointer.down||pointer.mode!=='tv'||!state.desk.anchor||!state.cabinet)return;
  const d=state.desk,tv=state.tv,desk=b09DeskBounds(d);
  if(d.side==='left'){
    const minTvX=desk.x1+B09_TV_CLEAR+tv.w/2;
    if(tv.x<minTvX)tv.x=minTvX;
  }else{
    const maxTvX=desk.x0-B09_TV_CLEAR-tv.w/2;
    if(tv.x>maxTvX)tv.x=maxTvX;
  }
  state.hasMultiRelation=true;state.multiRetested=false;draw();
});
canvas.addEventListener('pointerup',()=>setTimeout(()=>{
  b09Ensure();
  if(!state.desk.anchor)return;
  if(((pointer.mode==='tv'||pointer.mode==='resize')&&pointer.moved)||b08Pointer.moved){state.multiRetested=true;draw();}
},0));

const b09BaseReset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{b09BaseReset();state.desk=clone(B09_DEFAULT_DESK);state.hoverDesk=false;state.selectedDesk=false;state.hasMultiAnchorAction=false;state.hasMultiRelation=false;state.multiRetested=false;b09DeskMenu.classList.remove('show');draw();};

const b09Qs=new URLSearchParams(location.search);
if(b09Qs.get('multi')==='1'){
  state.site={door:clone(B08_DEFAULT_DOOR),hasMoved:true,retested:true,fitCount:1};
  const i=b08Interval();state.cabinet={x:(i.x0+i.x1)/2,y:0,z:0,w:i.x1-i.x0,h:2700,d:520};
  state.tv={...DEFAULT_TV,x:-120,z:1080,anchor:true};state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New()];state.layout.right.regions=[b03New()];
  state.layout.left.regions[0].structure='open';state.layout.left.regions[0].facadeRole='focus';state.layout.left.regions[1].structure='auto';state.layout.right.regions[0].structure='closed';state.layout.right.regions[0].facadeRole='background';
  state.facade={aligned:true,openShare:.43};state.desk={...clone(B09_DEFAULT_DESK),x:-1900,anchor:true,relation:'auto',side:'left'};
  b09SetDeskSide('left',false);
  state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.hasFacadeAction=true;state.hasConvergenceAction=true;state.hasShaped=true;state.hasMultiAnchorAction=true;state.hasMultiRelation=true;state.multiRetested=true;
}
window.__formniB09={
  get:()=>clone({state,deskRangeLeft:b09DeskRange('left'),deskRangeRight:b09DeskRange('right'),free:b09FreeSegments(),gap:b09AnchorGap()}),
  anchorDesk:()=>{if(state.tv.anchor){state.desk.anchor=true;b09SetDeskSide(state.desk.x<state.tv.x?'left':'right',false);state.hasMultiAnchorAction=true;state.hasMultiRelation=true;draw();}},
  relation:mode=>{if(mode==='auto')b09Auto.click();else if(mode==='left')b09Left.click();else b09Right.click();},
  setDeskX:x=>{b09MoveDesk(x);draw();}
};
draw();
