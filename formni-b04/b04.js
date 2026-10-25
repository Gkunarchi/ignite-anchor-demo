// Formni B04 — 功能区到柜体结构。依赖 B02 + B03。
const b04Auto=document.getElementById('autoStructureBtn');
const b04Closed=document.getElementById('closedStructureBtn');
const b04Open=document.getElementById('openStructureBtn');
const b04Drawers=document.getElementById('drawerStructureBtn');
const b04Mixed=document.getElementById('mixedStructureBtn');
const b04ChoiceState=document.getElementById('structureChoiceState');
const b04StepStructure=document.getElementById('stepStructure');
const b04StepRetest=document.getElementById('stepStructureRetest');
const B04_LABEL={auto:'系统判断',closed:'门柜',open:'开放架',drawers:'抽屉组',mixed:'门＋开放'};

function b04Ensure(){
  b03Ensure();
  if(state.hasStructureAction==null)state.hasStructureAction=false;
  if(state.structureRetested==null)state.structureRetested=false;
  if(state.layout){
    ['left','right'].forEach(side=>state.layout[side].regions.forEach(r=>{
      if(!r.structure)r.structure='auto';
    }));
  }
}
function b04Resolve(reg,rect){
  const mode=reg.structure||'auto';
  if(mode!=='auto')return mode;
  if(rect.w<420)return'open';
  if(rect.w<720)return'closed';
  if(rect.w<1040)return'mixed';
  return'closed';
}
function b04StructureName(reg,rect){
  const resolved=b04Resolve(reg,rect);
  return reg.structure==='auto'?`自动→${B04_LABEL[resolved]}`:`${B04_LABEL[resolved]} · 明确`;
}
function b04Selected(){
  const x=b03Selected();
  if(!x)return null;
  b04Ensure();
  return{...x,resolved:b04Resolve(x.reg,x.rect)};
}

// 结构化渲染：保持 B03 的空间关系，仅替换每个高柜区域的内部实现。
const b04B03Anchored=anchoredCabinetFaces;
anchoredCabinetFaces=function(c,tv){
  b04Ensure();
  if(!state.layout)return b04B03Anchored(c,tv);
  const a=b03Alloc(),m=a.metrics,faces=[],y0=c.y,z0=m.z0,z1=m.z1,t=m.t;
  const add=(x,y,z,w,d,h,col)=>{if(w>8&&d>8&&h>8)faces.push(...boxFaces(x,y,z,w,d,h,col));};
  add(m.x0+35,y0+18,z0,c.w-70,Math.max(40,c.d-36),m.plinth,{main:'#a9b3ae',side:'#899590'});
  add(m.x0,y0,z0+m.plinth,t,c.d,c.h-m.plinth,{main:palette.board,side:palette.boardSide});
  add(m.x1-t,y0,z0+m.plinth,t,c.d,c.h-m.plinth,{main:palette.board,side:palette.boardSide});
  add(m.x0+t,y0,z0+m.plinth,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
  add(m.x0+t,y0,z1-t,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
  add(m.x0+t,y0+14,z0+m.plinth+t,c.w-2*t,14,Math.max(30,m.lowTop-z0-m.plinth-t),{main:'#d1d5d0',side:'#b9c0bc'});
  add(m.x0+t,y0+12,m.lowTop,c.w-2*t,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});

  // 电视下方低柜继续由尺寸自动组织。
  const bounds=[m.x0+t,...a.left.map(r=>r.x1),m.openL,m.openR,...a.right.map(r=>r.x1),m.x1-t].filter((v,i,ar)=>i===0||Math.abs(v-ar[i-1])>2);
  const lowH=m.lowTop-(z0+m.plinth+t);
  for(let i=0;i<bounds.length-1;i++){
    const bx=bounds[i],bw=bounds[i+1]-bx;if(bw<40)continue;
    const tvZone=bx>=m.openL-1&&bounds[i+1]<=m.openR+1;
    if(tvZone){
      const gap=8,ph=(lowH-gap*3)/2;
      for(let q=0;q<2;q++)add(bx+8,y0+c.d+3,z0+m.plinth+t+gap+q*(ph+gap),bw-16,18,Math.max(30,ph),{main:q?palette.panelAlt:palette.panel,side:'#aab5b0',front:q?palette.panelAlt:palette.panel});
    }else add(bx+8,y0+c.d+3,z0+m.plinth+t+8,bw-16,18,Math.max(30,lowH-16),{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
  }

  a.all.forEach(r=>{
    const reg=state.layout[r.side].regions[r.index];
    const mode=b04Resolve(reg,r),h=z1-m.lowTop-t,innerX=r.x0+t,innerW=Math.max(20,r.w-2*t),frontY=y0+c.d+3;
    add(r.x0,y0+12,m.lowTop,t,Math.max(30,c.d-12),Math.max(30,h),{main:palette.board,side:palette.boardSide});
    add(r.x1-t,y0+12,m.lowTop,t,Math.max(30,c.d-12),Math.max(30,h),{main:palette.board,side:palette.boardSide});
    add(innerX,y0+14,m.lowTop+t,innerW,14,Math.max(30,h-t),{main:'#d1d5d0',side:'#b9c0bc'});

    if(mode==='open'){
      const shelfCount=clamp(Math.round(h/430),2,5);
      if(innerW>820)add(r.x0+r.w/2-t/2,y0+18,m.lowTop+t,t,Math.max(30,c.d-30),Math.max(30,h-t),{main:'#d5d7d1',side:'#bcc2bd'});
      for(let s=1;s<shelfCount;s++)add(innerX,y0+18,m.lowTop+s*h/shelfCount,innerW,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
    }else if(mode==='drawers'){
      const count=clamp(Math.round(h/330),3,6),gap=8,available=h-t-gap*(count+1),dh=available/count;
      for(let q=0;q<count;q++)add(r.x0+8,frontY,m.lowTop+t+gap+q*(dh+gap),r.w-16,18,Math.max(28,dh),{main:q%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:q%2?palette.panelAlt:palette.panel});
    }else if(mode==='mixed'){
      const split=m.lowTop+h*.44;
      add(innerX,y0+18,split,innerW,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
      const lowerH=split-m.lowTop-t;
      const doorCount=r.w>760?2:1,dw=(r.w-16-(doorCount-1)*8)/doorCount;
      for(let q=0;q<doorCount;q++)add(r.x0+8+q*(dw+8),frontY,m.lowTop+t+8,dw,18,Math.max(36,lowerH-16),{main:q%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:q%2?palette.panelAlt:palette.panel});
      const upperH=z1-t-split,shelves=clamp(Math.round(upperH/420),1,3);
      for(let s=1;s<shelves;s++)add(innerX,y0+18,split+s*upperH/shelves,innerW,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
    }else{
      const doorCount=r.w>720?2:1,gap=8,dw=(r.w-16-gap*(doorCount-1))/doorCount;
      const shelfCount=clamp(Math.floor(h/620),1,3);
      for(let s=1;s<shelfCount;s++)add(innerX,y0+18,m.lowTop+s*h/shelfCount,innerW,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
      for(let q=0;q<doorCount;q++)add(r.x0+8+q*(dw+gap),frontY,m.lowTop+8,dw,18,Math.max(40,h-16),{main:q%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:q%2?palette.panelAlt:palette.panel});
    }
  });

  if(m.openTop<z1-t-140){
    add(m.openL,y0+12,m.openTop,m.openR-m.openL,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});
    const h=z1-m.openTop-t,n=Math.max(2,Math.round((m.openR-m.openL)/720)),w=(m.openR-m.openL)/n;
    for(let i=0;i<n;i++)add(m.openL+i*w+8,y0+c.d+3,m.openTop+t+8,w-16,18,Math.max(40,h-t-16),{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
  }
  return faces;
};

// B03 关系操作之后，维护结构语义。
const b04BaseSplit=b03Split.onclick;
b03Split.onclick=()=>{
  const x=b04Selected(),inherit=x&&x.reg.structure||'auto';
  b04BaseSplit();
  if(x){const regs=state.layout[x.sideName].regions;[regs[x.index],regs[x.index+1]].forEach(r=>{if(r)r.structure=inherit;});draw();}
};
const b04BaseMergeL=b03MergeL.onclick;
b03MergeL.onclick=()=>{
  const x=b04Selected();let next='auto';
  if(x&&x.index>0){const a=x.side.regions[x.index-1].structure||'auto',b=x.reg.structure||'auto';if(a===b)next=a;}
  b04BaseMergeL();const y=b04Selected();if(y){y.reg.structure=next;draw();}
};
const b04BaseMergeR=b03MergeR.onclick;
b03MergeR.onclick=()=>{
  const x=b04Selected();let next='auto';
  if(x&&x.index<x.side.regions.length-1){const a=x.reg.structure||'auto',b=x.side.regions[x.index+1].structure||'auto';if(a===b)next=a;}
  b04BaseMergeR();const y=b04Selected();if(y){y.reg.structure=next;draw();}
};

function b04Set(mode){
  const x=b04Selected();if(!x)return;
  pushHistory(snapshot());x.reg.structure=mode;state.hasStructureAction=true;state.structureRetested=false;draw();
  toast(mode==='auto'?'已交回系统判断；尺寸变化时可以重新选择结构':`已明确为${B04_LABEL[mode]}；后续推拉只调整内部数量`);
}
b04Auto.onclick=()=>b04Set('auto');
b04Closed.onclick=()=>b04Set('closed');
b04Open.onclick=()=>b04Set('open');
b04Drawers.onclick=()=>b04Set('drawers');
b04Mixed.onclick=()=>b04Set('mixed');

const b04B03MenuPosition=b03MenuPosition;
b03MenuPosition=function(){
  b04Ensure();b04B03MenuPosition();
  const x=b04Selected();
  [b04Auto,b04Closed,b04Open,b04Drawers,b04Mixed].forEach(b=>b.classList.remove('active','auto-active'));
  if(x){
    const button={auto:b04Auto,closed:b04Closed,open:b04Open,drawers:b04Drawers,mixed:b04Mixed}[x.reg.structure||'auto'];
    if(button)button.classList.add((x.reg.structure||'auto')==='auto'?'auto-active':'active');
    b03MenuTitle.textContent=`${x.sideName==='left'?'左':'右'}侧功能区 · ${mm(x.rect.w)} · ${b04StructureName(x.reg,x.rect)}`;
    const top=parseFloat(b03Menu.style.top)||60,maxTop=Math.max(12,H-b03Menu.offsetHeight-12);b03Menu.style.top=clamp(top,12,maxTop)+'px';
  }
};

const b04B03Overlay=b03Overlay;
b03Overlay=function(){
  b04Ensure();b04B03Overlay();
  if(!state.tv.anchor)return;
  b03ScreenRegions().forEach(r=>{
    const reg=state.layout[r.side].regions[r.index],label=b04StructureName(reg,r);
    ctx.save();ctx.font='700 9px Inter, sans-serif';ctx.textAlign='center';const tw=ctx.measureText(label).width;
    ctx.fillStyle=reg.structure==='auto'?'rgba(95,129,123,.88)':'rgba(50,119,124,.94)';ctx.fillRect(r.cx-tw/2-6,r.cy+14,tw+12,17);
    ctx.fillStyle='#fff';ctx.fillText(label,r.cx,r.cy+26);ctx.restore();
  });
};

const b04B03Snapshot=snapshot;
snapshot=function(){const s=b04B03Snapshot();b04Ensure();s.hasStructureAction=!!state.hasStructureAction;s.structureRetested=!!state.structureRetested;return s;};
const b04B03Restore=restore;
restore=function(s){state.hasStructureAction=!!s.hasStructureAction;state.structureRetested=!!s.structureRetested;b04B03Restore(s);b04Ensure();};
const b04B03UpdateUI=updateUI;
updateUI=function(){
  b04Ensure();b04B03UpdateUI();
  const x=b04Selected();b04ChoiceState.textContent=x?b04StructureName(x.reg,x.rect):'—';
  b04StepStructure.classList.toggle('on',!!state.hasStructureAction);b04StepRetest.classList.toggle('on',!!state.structureRetested);
  if(state.hoverRegion)promptEl.textContent='点击功能区：建立区域关系，或明确它怎样成为柜体';
  else if(state.hasStructureAction&&!state.structureRetested)promptEl.textContent='继续拉伸外框或移动区域边界，检查结构身份是否保持';
  else if(state.structureRetested)promptEl.textContent='结构身份已保留；门数、层板数和抽屉数会随尺寸继续适配';
};

canvas.addEventListener('pointerup',()=>setTimeout(()=>{
  if(state.hasStructureAction&&(pointer.mode==='tv'||pointer.mode==='resize')&&pointer.moved){state.structureRetested=true;draw();}
  if(state.hasStructureAction&&typeof b03P!=='undefined'&&b03P.moved){state.structureRetested=true;draw();}
},0));

const b04B03Reset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{b04B03Reset();state.hasStructureAction=false;state.structureRetested=false;draw();};

const b04Qs=new URLSearchParams(location.search);
if(b04Qs.get('structure')==='1'){
  state.cabinet={x:0,y:0,z:0,w:5000,h:2600,d:500};state.tv={...DEFAULT_TV,anchor:true};state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New()];state.layout.right.regions=[b03New()];
  state.layout.left.regions[0].structure='open';state.layout.left.regions[1].structure='mixed';state.layout.right.regions[0].structure='closed';
  state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.structureRetested=true;state.hasShaped=true;
}
window.__formniB04={get:()=>clone({state,alloc:b03Alloc()}),set:(side,index,mode)=>{state.selectedRegion={side,index};b04Set(mode);},resolve:(side,index)=>{const a=b03Alloc()[side][index],r=state.layout[side].regions[index];return b04Resolve(r,a);}};
draw();
