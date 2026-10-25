// Formni B06 — 方案收敛。依赖 B02 + B03 + B04 + B05。
const b06Confirm=document.getElementById('confirmRegionBtn');
const b06Explore=document.getElementById('exploreRegionBtn');
const b06NextLocal=document.getElementById('nextLocalBtn');
const b06NextScheme=document.getElementById('nextSchemeBtn');
const b06ConfirmAll=document.getElementById('confirmAllBtn');
const b06ConfirmedState=document.getElementById('confirmedState');
const b06ExploringState=document.getElementById('exploringState');
const b06GenerationState=document.getElementById('generationState');
const b06DecisionState=document.getElementById('decisionState');
const b06ConvergenceBar=document.getElementById('convergenceBar');
const b06StepConvergence=document.getElementById('stepConvergence');
const b06StepAlternative=document.getElementById('stepAlternative');
const b06StepRetest=document.getElementById('stepConvergenceRetest');

function b06Region(reg){
  if(reg.confirmed==null)reg.confirmed=false;
  if(reg.variant==null)reg.variant=0;
  if(reg.confirmedStructure===undefined)reg.confirmedStructure=null;
  if(reg.confirmedRole===undefined)reg.confirmedRole=null;
  if(reg.confirmedOpenShare===undefined)reg.confirmedOpenShare=null;
  return reg;
}
function b06Ensure(){
  b05Ensure();
  if(state.hasConvergenceAction==null)state.hasConvergenceAction=false;
  if(state.hasAlternativeAction==null)state.hasAlternativeAction=false;
  if(state.convergenceRetested==null)state.convergenceRetested=false;
  if(state.solutionGeneration==null)state.solutionGeneration=1;
  if(state.layout)['left','right'].forEach(side=>state.layout[side].regions.forEach(b06Region));
}
function b06Selected(){const x=b05Selected();if(!x)return null;b06Ensure();b06Region(x.reg);return x;}
function b06AllRegions(){b06Ensure();if(!state.layout)return[];return['left','right'].flatMap(side=>state.layout[side].regions.map((reg,index)=>({side,index,reg})));}
function b06Counts(){const all=b06AllRegions(),confirmed=all.filter(x=>x.reg.confirmed).length;return{total:all.length,confirmed,exploring:all.length-confirmed};}

const b06BaseResolve=b04Resolve;
function b06CandidateList(reg,rect){
  const base=b06BaseResolve(reg,rect);
  const pool=rect.w<420?['open','closed']:
    rect.w<720?['closed','open','mixed']:
    rect.w<1040?['mixed','closed','open','drawers']:
    ['closed','mixed','drawers','open'];
  return[base,...pool.filter(x=>x!==base)];
}
b04Resolve=function(reg,rect){
  b06Region(reg);
  if(reg.confirmed&&reg.confirmedStructure)return reg.confirmedStructure;
  if((reg.structure||'auto')!=='auto')return b06BaseResolve(reg,rect);
  const list=b06CandidateList(reg,rect);return list[Math.abs(reg.variant||0)%list.length];
};
const b06BaseRole=b05Role;
b05Role=function(reg){b06Region(reg);return reg.confirmed&&reg.confirmedRole?reg.confirmedRole:b06BaseRole(reg);};
const b06BaseOpen=b05OpenShare;
b05OpenShare=function(reg){
  b06Region(reg);
  if(reg.confirmed&&reg.confirmedOpenShare!=null)return reg.confirmedOpenShare;
  let value=b06BaseOpen(reg);
  if(!state.facade.aligned&&(reg.structure||'auto')==='auto'&&(reg.variant||0)>0){
    const offset=[0,.10,-.08,.16][Math.abs(reg.variant)%4];value=clamp(value+offset,.24,.72);
  }
  return value;
};

function b06Capture(reg,rect){
  b06Region(reg);reg.confirmed=true;reg.confirmedStructure=b04Resolve(reg,rect);reg.confirmedRole=b05Role(reg);reg.confirmedOpenShare=b05OpenShare(reg);
}
function b06Release(reg){b06Region(reg);reg.confirmed=false;reg.confirmedStructure=null;reg.confirmedRole=null;reg.confirmedOpenShare=null;}
function b06CurrentLabel(reg,rect){
  b06Region(reg);const list=b06CandidateList(reg,rect),i=Math.abs(reg.variant||0)%list.length;
  return reg.confirmed?'已确认':`探索 ${i+1}/${list.length}`;
}
function b06Action(message,fn){
  const x=b06Selected();if(!x)return;pushHistory(snapshot());fn(x);state.hasConvergenceAction=true;state.convergenceRetested=false;draw();toast(message);
}
b06Confirm.onclick=()=>b06Action('已确认这一格；后续只调整尺寸，不改设计身份',({reg,rect})=>b06Capture(reg,rect));
b06Explore.onclick=()=>b06Action('这一格重新开放探索；已有明确意图仍然保留',({reg})=>b06Release(reg));
b06NextLocal.onclick=()=>b06Action('只为这一格换了一个仍然成立的可能',({reg,rect})=>{
  if(reg.confirmed)return;const list=b06CandidateList(reg,rect);reg.variant=(Math.abs(reg.variant||0)+1)%list.length;state.hasAlternativeAction=true;state.solutionGeneration++;
});

function b06NextUnconfirmed(){
  if(!state.tv.anchor||!state.layout)return;
  const alloc=b03Alloc(),candidates=[];
  ['left','right'].forEach(side=>state.layout[side].regions.forEach((reg,index)=>{
    b06Region(reg);if(reg.confirmed||(reg.structure||'auto')!=='auto')return;
    const rect=alloc[side][index];if(rect)candidates.push({reg,rect});
  }));
  if(!candidates.length){toast('没有可重新探索的区域；先放开一个已确认区域');return;}
  pushHistory(snapshot());
  candidates.forEach(({reg,rect})=>{const list=b06CandidateList(reg,rect);reg.variant=(Math.abs(reg.variant||0)+1)%list.length;});
  state.solutionGeneration++;state.hasAlternativeAction=true;state.hasConvergenceAction=true;state.convergenceRetested=false;draw();toast(`已重算 ${candidates.length} 个未确认区域；确认部分保持不变`);
}
b06NextScheme.onclick=b06NextUnconfirmed;

b06ConfirmAll.onclick=()=>{
  if(!state.tv.anchor||!state.layout)return;
  const counts=b06Counts();pushHistory(snapshot());const alloc=b03Alloc();
  if(counts.total&&counts.confirmed===counts.total){
    b06AllRegions().forEach(x=>b06Release(x.reg));state.hasAlternativeAction=true;toast('已放开全部区域，继续由系统探索');
  }else{
    ['left','right'].forEach(side=>state.layout[side].regions.forEach((reg,index)=>{const rect=alloc[side][index];if(rect)b06Capture(reg,rect);}));toast('当前方案的所有区域都已确认');
  }
  state.hasConvergenceAction=true;state.convergenceRetested=false;draw();
};

// 新的明确结构或立面动作，高于旧的确认：先重新打开当前区域。
function b06ReleaseSelectedForNewIntent(){const x=b06Selected();if(x&&x.reg.confirmed)b06Release(x.reg);}
[
  b04Auto,b04Closed,b04Open,b04Drawers,b04Mixed,
  b05Focus,b05Background,b05Auto,b05Less,b05More
].forEach(button=>{
  const base=button.onclick;button.onclick=()=>{b06ReleaseSelectedForNewIntent();base();state.hasConvergenceAction=true;state.convergenceRetested=false;draw();};
});

// 分割表示新的拓扑意图：继承结构与立面，但新区域重新进入探索。
const b06BaseSplit=b03Split.onclick;
b03Split.onclick=()=>{
  const x=b06Selected(),variant=x?x.reg.variant||0:0;b06BaseSplit();
  if(x){const regs=state.layout[x.sideName].regions;[regs[x.index],regs[x.index+1]].forEach(reg=>{if(reg){b06Region(reg);b06Release(reg);reg.variant=variant;}});state.hasConvergenceAction=true;state.convergenceRetested=false;draw();}
};
function b06SameConfirmation(a,b){
  return !!(a&&b&&a.confirmed&&b.confirmed&&a.confirmedStructure===b.confirmedStructure&&a.confirmedRole===b.confirmedRole&&Math.abs((a.confirmedOpenShare||0)-(b.confirmedOpenShare||0))<.01);
}
const b06BaseMergeL=b03MergeL.onclick;
b03MergeL.onclick=()=>{
  const x=b06Selected();let keep=null;if(x&&x.index>0){const a=x.side.regions[x.index-1],b=x.reg;if(b06SameConfirmation(a,b))keep=clone(a);}
  b06BaseMergeL();const y=b06Selected();if(y){b06Region(y.reg);if(keep){y.reg.confirmed=true;y.reg.confirmedStructure=keep.confirmedStructure;y.reg.confirmedRole=keep.confirmedRole;y.reg.confirmedOpenShare=keep.confirmedOpenShare;}else b06Release(y.reg);state.hasConvergenceAction=true;state.convergenceRetested=false;draw();}
};
const b06BaseMergeR=b03MergeR.onclick;
b03MergeR.onclick=()=>{
  const x=b06Selected();let keep=null;if(x&&x.index<x.side.regions.length-1){const a=x.reg,b=x.side.regions[x.index+1];if(b06SameConfirmation(a,b))keep=clone(a);}
  b06BaseMergeR();const y=b06Selected();if(y){b06Region(y.reg);if(keep){y.reg.confirmed=true;y.reg.confirmedStructure=keep.confirmedStructure;y.reg.confirmedRole=keep.confirmedRole;y.reg.confirmedOpenShare=keep.confirmedOpenShare;}else b06Release(y.reg);state.hasConvergenceAction=true;state.convergenceRetested=false;draw();}
};

const b06BaseMenu=b03MenuPosition;
b03MenuPosition=function(){
  b06Ensure();b06BaseMenu();const x=b06Selected();
  [b06Confirm,b06Explore,b06NextLocal].forEach(b=>b.classList.remove('active','confirmed','explore'));
  if(x){
    b06Confirm.disabled=x.reg.confirmed;b06Explore.disabled=!x.reg.confirmed;b06NextLocal.disabled=x.reg.confirmed;
    if(x.reg.confirmed){b06Confirm.classList.add('confirmed');b06Explore.classList.add('explore');}else b06Confirm.classList.add('active');
    const status=b06CurrentLabel(x.reg,x.rect);b03MenuTitle.textContent+=` · ${status}`;
    const top=parseFloat(b03Menu.style.top)||60;b03Menu.style.top=clamp(top,12,Math.max(12,H-b03Menu.offsetHeight-12))+'px';
  }
};

const b06BaseOverlay=b03Overlay;
b03Overlay=function(){
  b06Ensure();b06BaseOverlay();if(!state.tv.anchor)return;
  b03ScreenRegions().forEach(r=>{
    const reg=state.layout[r.side].regions[r.index];b06Region(reg);const label=b06CurrentLabel(reg,r);
    ctx.save();ctx.font='700 9px Inter, sans-serif';ctx.textAlign='center';const tw=ctx.measureText(label).width;
    ctx.fillStyle=reg.confirmed?'rgba(82,118,111,.96)':'rgba(95,111,107,.78)';ctx.fillRect(r.cx-tw/2-6,r.cy+54,tw+12,17);ctx.fillStyle='#fff';ctx.fillText(label,r.cx,r.cy+66);ctx.restore();
  });
};

const b06BaseSnapshot=snapshot;
snapshot=function(){const s=b06BaseSnapshot();b06Ensure();s.hasConvergenceAction=!!state.hasConvergenceAction;s.hasAlternativeAction=!!state.hasAlternativeAction;s.convergenceRetested=!!state.convergenceRetested;s.solutionGeneration=state.solutionGeneration||1;return s;};
const b06BaseRestore=restore;
restore=function(s){state.hasConvergenceAction=!!s.hasConvergenceAction;state.hasAlternativeAction=!!s.hasAlternativeAction;state.convergenceRetested=!!s.convergenceRetested;state.solutionGeneration=s.solutionGeneration||1;b06BaseRestore(s);b06Ensure();};
const b06BaseUpdate=updateUI;
updateUI=function(){
  b06Ensure();b06BaseUpdate();const counts=b06Counts(),x=b06Selected();
  b06ConfirmedState.textContent=`${counts.confirmed} / ${counts.total}`;b06ExploringState.textContent=String(counts.exploring);b06GenerationState.textContent=`第 ${state.solutionGeneration||1} 版`;
  b06DecisionState.textContent=x?b06CurrentLabel(x.reg,x.rect):'—';b06ConvergenceBar.style.width=`${counts.total?counts.confirmed/counts.total*100:0}%`;
  b06ConfirmAll.textContent=counts.total&&counts.confirmed===counts.total?'放开全部':'确认当前方案';
  b06StepConvergence.classList.toggle('on',!!state.hasConvergenceAction);b06StepAlternative.classList.toggle('on',!!state.hasAlternativeAction);b06StepRetest.classList.toggle('on',!!state.convergenceRetested);
  if(state.hoverRegion)promptEl.textContent='点击区域：确认当前结果、继续探索，或换一个可能';
  else if(state.hasConvergenceAction&&!state.hasAlternativeAction)promptEl.textContent='确认一部分后，点“换一版未确认”，观察其他区域变化';
  else if(state.hasAlternativeAction&&!state.convergenceRetested)promptEl.textContent='继续拉外框或区域边界，检查确认部分是否保持';
  else if(state.convergenceRetested)promptEl.textContent='收敛关系已保留：确认部分稳定，未确认部分继续适配';
};

canvas.addEventListener('pointerup',()=>setTimeout(()=>{
  if(!state.hasConvergenceAction)return;
  if((pointer.mode==='tv'||pointer.mode==='resize')&&pointer.moved||typeof b03P!=='undefined'&&b03P.moved){state.convergenceRetested=true;draw();}
},0));

const b06BaseReset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{b06BaseReset();state.hasConvergenceAction=false;state.hasAlternativeAction=false;state.convergenceRetested=false;state.solutionGeneration=1;draw();};

const b06Qs=new URLSearchParams(location.search);
if(b06Qs.get('converge')==='1'){
  state.cabinet={x:0,y:0,z:0,w:5400,h:2750,d:520};state.tv={...DEFAULT_TV,anchor:true};state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New()];state.layout.right.regions=[b03New(),b03New()];
  state.layout.left.regions[0].structure='open';state.layout.left.regions[0].facadeRole='focus';
  state.layout.left.regions[1].structure='auto';state.layout.left.regions[1].variant=1;
  state.layout.right.regions[0].structure='closed';state.layout.right.regions[0].facadeRole='background';
  state.layout.right.regions[1].structure='auto';state.layout.right.regions[1].variant=2;
  state.facade={aligned:true,openShare:.43};
  const alloc=b03Alloc();b06Capture(state.layout.left.regions[0],alloc.left[0]);b06Capture(state.layout.right.regions[0],alloc.right[0]);
  state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.structureRetested=true;state.hasFacadeAction=true;state.facadeRetested=true;
  state.hasConvergenceAction=true;state.hasAlternativeAction=true;state.convergenceRetested=true;state.solutionGeneration=3;state.hasShaped=true;
}
window.__formniB06={
  get:()=>clone({state,alloc:b03Alloc(),counts:b06Counts()}),
  confirm:(side,index)=>{state.selectedRegion={side,index};b06Confirm.click();},
  explore:(side,index)=>{state.selectedRegion={side,index};b06Explore.click();},
  next:(side,index)=>{state.selectedRegion={side,index};b06NextLocal.click();},
  nextScheme:b06NextUnconfirmed
};
draw();
