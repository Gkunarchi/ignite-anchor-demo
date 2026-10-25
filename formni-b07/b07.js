// Formni B07 — 约束冲突与局部回退。依赖 B02–B06。
const b07Panel=document.getElementById('conflictPanel');
const b07Title=document.getElementById('conflictTitle');
const b07Text=document.getElementById('conflictText');
const b07Adapt=document.getElementById('adaptConflictBtn');
const b07Release=document.getElementById('releaseConflictBtn');
const b07Keep=document.getElementById('keepConflictBtn');
const b07TargetState=document.getElementById('targetWidthState');
const b07MinState=document.getElementById('minWidthState');
const b07ReasonState=document.getElementById('conflictReasonState');
const b07StepConflict=document.getElementById('stepConflict');
const b07StepResolve=document.getElementById('stepResolve');
const b07StepRetest=document.getElementById('stepConflictRetest');

const B07_CLEAR=150;
const B07_STRUCTURE_MIN={closed:380,open:300,drawers:480,mixed:520,auto:B03_MIN};

function b07Region(reg){
  b06Region(reg);
  if(!reg.origin)reg.origin='auto';
  return reg;
}
function b07Ensure(){
  b06Ensure();
  if(state.hasConflictAction==null)state.hasConflictAction=false;
  if(state.hasConflictResolution==null)state.hasConflictResolution=false;
  if(state.conflictRetested==null)state.conflictRetested=false;
  if(state.layout){
    ['left','right'].forEach(side=>{
      if(state.layout[side].userTopology==null)state.layout[side].userTopology=false;
      state.layout[side].regions.forEach(b07Region);
    });
  }
  if(state.conflict===undefined)state.conflict=null;
}
function b07Protected(reg){
  b07Region(reg);
  return reg.lockedWidth!=null||reg.confirmed||(reg.structure||'auto')!=='auto'||reg.origin==='user';
}
function b07RegMin(reg){
  b07Region(reg);
  if(reg.lockedWidth!=null)return Math.max(B03_MIN,reg.lockedWidth);
  const mode=reg.confirmed&&reg.confirmedStructure?reg.confirmedStructure:(reg.structure||'auto');
  return B07_STRUCTURE_MIN[mode]||B03_MIN;
}
function b07SideReq(sideName){
  b07Ensure();
  const side=state.layout&&state.layout[sideName];
  if(!side)return{soft:0,hard:0,mergeable:0,protected:0,flex:0};
  let soft=0,hard=0,protected=0,flex=0,mergeable=0,autoRun=0;
  side.regions.forEach(reg=>{
    const min=b07RegMin(reg);soft+=min;
    if(b07Protected(reg)){hard+=min;protected++;autoRun=0;}
    else{
      flex++;
      if(autoRun===0)hard+=B03_MIN;
      else mergeable++;
      autoRun++;
    }
  });
  return{soft,hard,mergeable,protected,flex};
}
function b07Requirements(handle=null,fixed=null){
  b07Ensure();
  if(!state.cabinet||!state.tv.anchor||!state.layout)return null;
  const t=24,left=b07SideReq('left'),right=b07SideReq('right');
  const softLeft=state.tv.x-state.tv.w/2-B07_CLEAR-left.soft-t;
  const softRight=state.tv.x+state.tv.w/2+B07_CLEAR+right.soft+t;
  const hardLeft=state.tv.x-state.tv.w/2-B07_CLEAR-left.hard-t;
  const hardRight=state.tv.x+state.tv.w/2+B07_CLEAR+right.hard+t;
  let softWidth=softRight-softLeft,hardWidth=hardRight-hardLeft;
  if(handle==='right'&&Number.isFinite(fixed)){softWidth=softRight-fixed;hardWidth=hardRight-fixed;}
  if(handle==='left'&&Number.isFinite(fixed)){softWidth=fixed-softLeft;hardWidth=fixed-hardLeft;}
  return{
    left,right,softLeft,softRight,hardLeft,hardRight,
    softWidth:Math.max(800,softWidth),hardWidth:Math.max(800,hardWidth),
    mergeable:left.mergeable+right.mergeable
  };
}
function b07FixedEdge(handle,start){
  if(handle==='right')return start.x-start.w/2;
  if(handle==='left')return start.x+start.w/2;
  return null;
}
function b07ApplyWidth(width,handle,fixed){
  const c=state.cabinet;
  c.w=width;
  c.x=handle==='left'?fixed-width/2:fixed+width/2;
}
function b07Reason(conflict,req){
  const protectedCount=req.left.protected+req.right.protected;
  if(conflict.requestedW<req.hardWidth-1){
    if(protectedCount)return`电视净空与 ${protectedCount} 个明确／锁定区域共同需要至少 ${mm(req.hardWidth)}`;
    return`电视锚点及必要净空至少需要 ${mm(req.hardWidth)}`;
  }
  if(req.mergeable>0)return`当前有 ${req.mergeable} 个可合并的未确认区域；可只调整这些区域`;
  return`当前分区关系已由用户明确，不能自动删除或压缩`;
}
function b07SetConflict(requestedW,handle,fixed,req){
  state.conflict={
    active:true,requestedW,legalW:req.softWidth,hardW:req.hardWidth,
    handle,fixed,mergeable:req.mergeable,reason:''
  };
  state.conflict.reason=b07Reason(state.conflict,req);
  state.hasConflictAction=true;
  state.conflictRetested=false;
}
function b07ClearConflict(){
  state.conflict=null;
  b07Panel.classList.remove('show');
}
function b07Releasable(){
  return b06AllRegions().filter(x=>{
    b07Region(x.reg);
    return x.reg.confirmed&&x.reg.lockedWidth==null&&(x.reg.structure||'auto')==='auto'&&x.reg.origin!=='user';
  });
}
function b07MergeAutoPair(){
  b07Ensure();
  const candidates=[];
  ['left','right'].forEach(sideName=>{
    const side=state.layout[sideName];
    for(let i=0;i<side.regions.length-1;i++){
      const a=b07Region(side.regions[i]),b=b07Region(side.regions[i+1]);
      if(!b07Protected(a)&&!b07Protected(b)&&a.origin==='auto'&&b.origin==='auto'){
        candidates.push({sideName,index:i,score:(a.weight||1)+(b.weight||1)});
      }
    }
  });
  if(!candidates.length)return false;
  candidates.sort((a,b)=>a.score-b.score);
  const pick=candidates[0],side=state.layout[pick.sideName];
  const a=side.regions[pick.index],b=side.regions[pick.index+1];
  const next=b03New((a.weight||1)+(b.weight||1));
  Object.assign(next,{origin:'auto',structure:'auto',facadeRole:'auto',openShare:((a.openShare||.44)+(b.openShare||.44))/2,variant:0,confirmed:false});
  b06Region(next);
  side.regions.splice(pick.index,2,next);
  side.equal=false;
  return true;
}
function b07TryResolve(releaseOne=false){
  b07Ensure();
  const conflict=state.conflict;
  if(!conflict)return;
  const before=snapshot();
  if(releaseOne){
    const list=b07Releasable();
    if(!list.length){toast('没有可以自动放开的确认；锁定或明确结构必须由你亲自修改');return;}
    b06Release(list[list.length-1].reg);
  }
  let req=b07Requirements(conflict.handle,conflict.fixed);
  if(conflict.requestedW<req.hardWidth-1){
    if(releaseOne){restore(before);toast('放开一个确认后仍不足；还存在更高优先级约束');}
    else toast('目标小于明确条件的硬下限；不能只靠未确认区域解决');
    return;
  }
  let guard=20;
  while(req.softWidth>conflict.requestedW+1&&guard--){
    if(!b07MergeAutoPair())break;
    req=b07Requirements(conflict.handle,conflict.fixed);
  }
  if(req.softWidth>conflict.requestedW+1){
    restore(before);
    toast('未确认区域已经无法再合并；需要你明确解除一条关系');
    return;
  }
  pushHistory(before);
  b07ApplyWidth(conflict.requestedW,conflict.handle,conflict.fixed);
  state.solutionGeneration=(state.solutionGeneration||1)+1;
  state.hasAlternativeAction=true;
  state.hasConflictResolution=true;
  state.conflictRetested=true;
  b07ClearConflict();
  draw();
  toast(releaseOne?'已按你的指令放开一个确认并重新求解':'只重组未确认区域，已达到目标尺寸');
}
b07Adapt.onclick=()=>b07TryResolve(false);
b07Release.onclick=()=>b07TryResolve(true);
b07Keep.onclick=()=>{b07ClearConflict();draw();toast('保留当前合法尺寸；所有明确决定不变');};

// 用户主动分区属于明确拓扑，后续不能被“系统适应”自动删除。
const b07BaseSplit=b03Split.onclick;
b03Split.onclick=()=>{
  const x=b06Selected();
  b07BaseSplit();
  if(x){
    const regs=state.layout[x.sideName].regions;
    [regs[x.index],regs[x.index+1]].forEach(reg=>{if(reg)reg.origin='user';});
    state.layout[x.sideName].userTopology=true;
    draw();
  }
};

// 拖动外框后，在原处理结果之上执行约束检查。
canvas.addEventListener('pointermove',()=>{
  b07Ensure();
  if(!pointer.down||pointer.mode!=='resize'||!state.cabinet||!state.tv.anchor)return;
  const handle=pointer.handle;
  if(handle!=='left'&&handle!=='right')return;
  const fixed=b07FixedEdge(handle,pointer.startCabinet);
  const requested=state.cabinet.w;
  const req=b07Requirements(handle,fixed);
  if(requested<req.softWidth-1){
    b07SetConflict(requested,handle,fixed,req);
    b07ApplyWidth(req.softWidth,handle,fixed);
    state.snap=null;
    draw();
  }else if(state.conflict&&state.conflict.active){
    b07ClearConflict();
    draw();
  }
});

// 目标虚线、受保护区域与冲突说明。
function b07DrawConflict(){
  b07Ensure();
  const c=state.conflict;
  if(!c||!c.active||!state.cabinet)return;
  const edge=c.handle==='left'?c.fixed-c.requestedW:c.fixed+c.requestedW;
  const cab=state.cabinet,y=cab.y+cab.d+135;
  drawLine3([edge,y,cab.z],[edge,y,cab.z+cab.h],'#bd5147',2.5,[8,6]);
  const p=project([edge,y,cab.z+cab.h*.54]);
  if(p){
    const label=`目标 ${mm(c.requestedW)}`;
    ctx.save();ctx.font='700 11px Inter, sans-serif';const tw=ctx.measureText(label).width;
    ctx.fillStyle='rgba(189,81,71,.95)';ctx.fillRect(p.x-tw/2-8,p.y-29,tw+16,21);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-14);ctx.restore();
  }
  b03ScreenRegions().forEach(r=>{
    const reg=b07Region(state.layout[r.side].regions[r.index]);
    if(!b07Protected(reg))return;
    ctx.save();ctx.beginPath();ctx.moveTo(r.poly[0].x,r.poly[0].y);r.poly.slice(1).forEach(q=>ctx.lineTo(q.x,q.y));ctx.closePath();
    ctx.strokeStyle='rgba(189,81,71,.72)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.restore();
  });
}
const b07BaseDraw=draw;
draw=function(){b07Ensure();b07BaseDraw();b07DrawConflict();};

const b07BaseUpdate=updateUI;
updateUI=function(){
  b07Ensure();
  b07BaseUpdate();
  const req=b07Requirements();
  const c=state.conflict;
  b07TargetState.textContent=c?mm(c.requestedW):'—';
  b07MinState.textContent=req?mm(c?c.legalW:req.softWidth):'—';
  b07ReasonState.textContent=c?c.reason:'无';
  b07Panel.classList.toggle('show',!!c);
  if(c){
    b07Title.textContent=c.requestedW<c.hardW?'目标越过硬约束':'目标需要重新组织未确认区域';
    b07Text.textContent=`你要 ${mm(c.requestedW)}，当前决定至少需要 ${mm(c.legalW)}。${c.reason}。`;
    const live=b07Requirements(c.handle,c.fixed);
    b07Adapt.disabled=!(c.requestedW>=live.hardWidth-1&&live.mergeable>0);
    b07Release.disabled=!b07Releasable().length;
  }
  b07StepConflict.classList.toggle('on',!!state.hasConflictAction);
  b07StepResolve.classList.toggle('on',!!c||!!state.hasConflictResolution);
  b07StepRetest.classList.toggle('on',!!state.conflictRetested);
  if(c)promptEl.textContent='尺寸冲突：模型停在合法边界，红色虚线是你的目标';
  else if(state.conflictRetested)promptEl.textContent='冲突已显式解决：继续推拉，检查高优先级条件是否仍保持';
};

const b07BaseSnapshot=snapshot;
snapshot=function(){
  const s=b07BaseSnapshot();
  b07Ensure();
  s.hasConflictAction=!!state.hasConflictAction;
  s.hasConflictResolution=!!state.hasConflictResolution;
  s.conflictRetested=!!state.conflictRetested;
  return s;
};
const b07BaseRestore=restore;
restore=function(s){
  state.hasConflictAction=!!s.hasConflictAction;
  state.hasConflictResolution=!!s.hasConflictResolution;
  state.conflictRetested=!!s.conflictRetested;
  state.conflict=null;
  b07BaseRestore(s);
  b07Ensure();
};

const b07BaseReset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{
  b07BaseReset();
  state.hasConflictAction=false;
  state.hasConflictResolution=false;
  state.conflictRetested=false;
  state.conflict=null;
  b07Panel.classList.remove('show');
  draw();
};

const b07Qs=new URLSearchParams(location.search);
if(b07Qs.get('conflict')==='1'){
  state.cabinet={x:0,y:0,z:0,w:5200,h:2750,d:520};
  state.tv={...DEFAULT_TV,anchor:true};
  state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New(),b03New()];
  state.layout.right.regions=[b03New(),b03New()];
  state.layout.left.regions.forEach(r=>{r.origin='auto';r.structure='auto';});
  state.layout.right.regions.forEach(r=>{r.origin='auto';r.structure='auto';});
  state.layout.right.regions[0].structure='closed';
  state.layout.right.regions[0].facadeRole='background';
  state.layout.right.regions[1].lockedWidth=620;
  state.facade={aligned:true,openShare:.43};
  b07Ensure();
  const alloc=b03Alloc();
  b06Capture(state.layout.left.regions[0],alloc.left[0]);
  state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.hasFacadeAction=true;
  state.hasConvergenceAction=true;state.hasAlternativeAction=true;state.hasShaped=true;
  const fixed=state.cabinet.x-state.cabinet.w/2;
  const req=b07Requirements('right',fixed);
  const requested=Math.max(req.hardWidth+80,req.softWidth-420);
  b07ApplyWidth(req.softWidth,'right',fixed);
  b07SetConflict(requested,'right',fixed,req);
}
window.__formniB07={
  get:()=>clone({state,requirements:b07Requirements()}),
  conflict:(target,handle='right')=>{
    const fixed=b07FixedEdge(handle,state.cabinet);
    const req=b07Requirements(handle,fixed);
    b07SetConflict(target,handle,fixed,req);
    b07ApplyWidth(req.softWidth,handle,fixed);
    draw();
  },
  adapt:()=>b07TryResolve(false),
  release:()=>b07TryResolve(true)
};
draw();
