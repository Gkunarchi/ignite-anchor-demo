// Formni B05 — 立面组织。依赖 B02 + B03 + B04。
const b05Align=document.getElementById('facadeAlignBtn');
const b05Focus=document.getElementById('facadeFocusBtn');
const b05Background=document.getElementById('facadeBackgroundBtn');
const b05Auto=document.getElementById('facadeAutoBtn');
const b05Less=document.getElementById('facadeLessBtn');
const b05More=document.getElementById('facadeMoreBtn');
const b05DatumState=document.getElementById('facadeDatumState');
const b05RoleState=document.getElementById('facadeRoleState');
const b05OpenState=document.getElementById('facadeOpenState');
const b05StepFacade=document.getElementById('stepFacade');
const b05StepRetest=document.getElementById('stepFacadeRetest');
const B05_ROLE={auto:'自动主次',focus:'重点',background:'背景'};

function b05Ensure(){
  b04Ensure();
  if(!state.facade)state.facade={aligned:false,openShare:.44};
  if(state.hasFacadeAction==null)state.hasFacadeAction=false;
  if(state.facadeRetested==null)state.facadeRetested=false;
  if(state.layout){
    ['left','right'].forEach(side=>state.layout[side].regions.forEach(r=>{
      if(!r.facadeRole)r.facadeRole='auto';
      if(r.openShare==null)r.openShare=.44;
    }));
  }
}
function b05Selected(){const x=b04Selected();if(!x)return null;b05Ensure();return x;}
function b05Role(reg){return reg&&reg.facadeRole||'auto';}
function b05OpenShare(reg){return state.facade.aligned?state.facade.openShare:clamp(reg.openShare==null?.44:reg.openShare,.24,.72);}
function b05RoleLabel(reg){return B05_ROLE[b05Role(reg)]||B05_ROLE.auto;}

const b05BaseResolve=b04Resolve;
b04Resolve=function(reg,rect){
  const base=b05BaseResolve(reg,rect);
  if((reg.structure||'auto')!=='auto')return base;
  const role=b05Role(reg);
  if(role==='focus')return rect.w<420?'open':'mixed';
  if(role==='background')return'closed';
  return base;
};

function b05PanelColor(role,index){
  if(role==='focus')return index%2?'#b9cdc7':'#c6d7d2';
  if(role==='background')return'#d7dbd8';
  return index%2?palette.panelAlt:palette.panel;
}
function b05DrawerZone(add,r,frontY,zStart,zEnd,countHint,role,offset=0){
  const gap=8,h=Math.max(0,zEnd-zStart),count=clamp(Math.round(h/countHint),1,5),available=h-gap*(count+1),dh=available/count;
  for(let i=0;i<count;i++)add(r.x0+8,frontY,zStart+gap+i*(dh+gap),r.w-16,18,Math.max(24,dh),{main:b05PanelColor(role,i+offset),side:'#aab5b0',front:b05PanelColor(role,i+offset)});
}
function b05Doors(add,r,frontY,zStart,zEnd,role,offset=0){
  const h=Math.max(32,zEnd-zStart),count=r.w>720?2:1,gap=8,dw=(r.w-16-gap*(count-1))/count;
  for(let i=0;i<count;i++)add(r.x0+8+i*(dw+gap),frontY,zStart,dw,18,h,{main:b05PanelColor(role,i+offset),side:'#aab5b0',front:b05PanelColor(role,i+offset)});
}
function b05OpenShelves(add,r,y0,c,m,zStart,zEnd,datum,role){
  const t=m.t,innerX=r.x0+t,innerW=Math.max(20,r.w-2*t),depth=Math.max(30,c.d-30);
  if(innerW>820)add(r.x0+r.w/2-t/2,y0+18,zStart,t,depth,Math.max(30,zEnd-zStart),{main:'#d5d7d1',side:'#bcc2bd'});
  const levels=[];
  if(datum>zStart+70&&datum<zEnd-70)levels.push(datum);
  const lower=datum-zStart,upper=zEnd-datum;
  const lowerN=Math.max(0,Math.round(lower/430)-1),upperN=Math.max(0,Math.round(upper/430)-1);
  for(let i=1;i<=lowerN;i++)levels.push(zStart+lower*i/(lowerN+1));
  for(let i=1;i<=upperN;i++)levels.push(datum+upper*i/(upperN+1));
  [...new Set(levels.map(v=>Math.round(v)))].sort((a,b)=>a-b).forEach(z=>add(innerX,y0+18,z,innerW,depth,t,{main:'#d5d7d1',side:'#bcc2bd'}));
}

const b05B04Anchored=anchoredCabinetFaces;
anchoredCabinetFaces=function(c,tv){
  b05Ensure();
  if(!state.layout)return b05B04Anchored(c,tv);
  const a=b03Alloc(),m=a.metrics,faces=[],y0=c.y,z0=m.z0,z1=m.z1,t=m.t;
  const add=(x,y,z,w,d,h,col)=>{if(w>8&&d>8&&h>8)faces.push(...boxFaces(x,y,z,w,d,h,col));};
  add(m.x0+35,y0+18,z0,c.w-70,Math.max(40,c.d-36),m.plinth,{main:'#a9b3ae',side:'#899590'});
  add(m.x0,y0,z0+m.plinth,t,c.d,c.h-m.plinth,{main:palette.board,side:palette.boardSide});
  add(m.x1-t,y0,z0+m.plinth,t,c.d,c.h-m.plinth,{main:palette.board,side:palette.boardSide});
  add(m.x0+t,y0,z0+m.plinth,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
  add(m.x0+t,y0,z1-t,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
  add(m.x0+t,y0+14,z0+m.plinth+t,c.w-2*t,14,Math.max(30,m.lowTop-z0-m.plinth-t),{main:'#d1d5d0',side:'#b9c0bc'});
  add(m.x0+t,y0+12,m.lowTop,c.w-2*t,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});

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
    const reg=state.layout[r.side].regions[r.index],mode=b04Resolve(reg,r),role=b05Role(reg);
    const h=z1-m.lowTop-t,innerX=r.x0+t,innerW=Math.max(20,r.w-2*t),frontY=y0+c.d+3;
    const openShare=b05OpenShare(reg),datum=clamp(m.lowTop+h*(1-openShare),m.lowTop+150,z1-t-150);
    add(r.x0,y0+12,m.lowTop,t,Math.max(30,c.d-12),Math.max(30,h),{main:palette.board,side:palette.boardSide});
    add(r.x1-t,y0+12,m.lowTop,t,Math.max(30,c.d-12),Math.max(30,h),{main:palette.board,side:palette.boardSide});
    add(innerX,y0+14,m.lowTop+t,innerW,14,Math.max(30,h-t),{main:role==='focus'?'#b6c9c3':'#d1d5d0',side:'#b9c0bc'});

    if(mode==='open'){
      b05OpenShelves(add,r,y0,c,m,m.lowTop+t,z1-t,datum,role);
    }else if(mode==='drawers'){
      if(state.facade.aligned){
        b05DrawerZone(add,r,frontY,m.lowTop+t,datum,300,role,0);
        b05DrawerZone(add,r,frontY,datum,z1-t,300,role,3);
      }else b05DrawerZone(add,r,frontY,m.lowTop+t,z1-t,330,role,0);
    }else if(mode==='mixed'){
      b05Doors(add,r,frontY,m.lowTop+t+8,datum-8,role,0);
      b05OpenShelves(add,r,y0,c,m,datum,z1-t,datum,role);
    }else{
      if(state.facade.aligned){
        b05Doors(add,r,frontY,m.lowTop+8,datum-8,role,0);
        b05Doors(add,r,frontY,datum+8,z1-t-8,role,2);
      }else b05Doors(add,r,frontY,m.lowTop+8,z1-t-8,role,0);
    }
  });

  if(m.openTop<z1-t-140){
    add(m.openL,y0+12,m.openTop,m.openR-m.openL,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});
    const h=z1-m.openTop-t,n=Math.max(2,Math.round((m.openR-m.openL)/720)),w=(m.openR-m.openL)/n;
    for(let i=0;i<n;i++)add(m.openL+i*w+8,y0+c.d+3,m.openTop+t+8,w-16,18,Math.max(40,h-t-16),{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
  }
  return faces;
};

function b05DatumData(){
  b05Ensure();if(!state.tv.anchor||!state.facade.aligned)return null;
  const a=b03Alloc(),m=a.metrics,h=m.z1-m.lowTop-m.t,z=clamp(m.lowTop+h*(1-state.facade.openShare),m.lowTop+150,m.z1-m.t-150);
  const y=m.c.y+m.c.d+64,x0=m.x0+m.t,x1=m.x1-m.t;
  return{z,y,x0,x1,handle:[x1+70,y,z],screen:project([x1+70,y,z]),m};
}
function b05HitDatum(pt){const d=b05DatumData();return d&&d.screen&&dist2(pt,d.screen)<17?d:null;}
function b05DrawDatum(){
  const d=b05DatumData();if(!d)return;
  drawLine3([d.x0,d.y,d.z],[d.x1,d.y,d.z],'#7c62a8',2.4,[8,5]);
  if(!d.screen)return;
  const active=b05Pointer.down&&b05Pointer.mode==='datum';
  ctx.save();ctx.beginPath();ctx.arc(d.screen.x,d.screen.y,active?10:8,0,Math.PI*2);ctx.fillStyle='#7c62a8';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
  const label=`开放 ${Math.round(state.facade.openShare*100)}%`;ctx.font='700 10px Inter, sans-serif';const tw=ctx.measureText(label).width;ctx.fillStyle='rgba(124,98,168,.94)';ctx.fillRect(d.screen.x-tw-17,d.screen.y-28,tw+12,18);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,d.screen.x-tw/2-11,d.screen.y-15);ctx.restore();
}

function b05SetRole(role){
  const x=b05Selected();if(!x)return;
  pushHistory(snapshot());
  if(role==='focus'){
    ['left','right'].forEach(side=>state.layout[side].regions.forEach(r=>{if(r.facadeRole==='focus')r.facadeRole='auto';}));
  }
  x.reg.facadeRole=role;state.hasFacadeAction=true;state.facadeRetested=false;draw();
  toast(role==='auto'?'这一格重新交给系统判断':role==='focus'?'已设为立面重点；自动结构会更开放':'已设为背景；自动结构会更完整');
}
function b05ChangeOpen(delta){
  const x=b05Selected();if(!x)return;
  pushHistory(snapshot());
  if(state.facade.aligned)state.facade.openShare=clamp(state.facade.openShare+delta,.24,.72);
  else x.reg.openShare=clamp((x.reg.openShare==null?.44:x.reg.openShare)+delta,.24,.72);
  state.hasFacadeAction=true;state.facadeRetested=false;draw();toast(delta>0?'开放比例增加':'开放比例减少');
}
b05Align.onclick=()=>{
  const x=b05Selected();if(!x)return;pushHistory(snapshot());
  state.facade.aligned=!state.facade.aligned;
  if(state.facade.aligned)state.facade.openShare=clamp(x.reg.openShare==null?.44:x.reg.openShare,.24,.72);
  state.hasFacadeAction=true;state.facadeRetested=false;draw();toast(state.facade.aligned?'已建立贯通横线；拖紫色控制点调整':'已解除贯通关系；各区域恢复自己的比例');
};
b05Focus.onclick=()=>b05SetRole('focus');
b05Background.onclick=()=>b05SetRole('background');
b05Auto.onclick=()=>b05SetRole('auto');
b05Less.onclick=()=>b05ChangeOpen(-.08);
b05More.onclick=()=>b05ChangeOpen(.08);

const b05BaseSplit=b03Split.onclick;
b03Split.onclick=()=>{
  const x=b05Selected(),role=x&&b05Role(x.reg)||'auto',share=x&&x.reg.openShare!=null?x.reg.openShare:.44;
  b05BaseSplit();
  if(x){const regs=state.layout[x.sideName].regions;[regs[x.index],regs[x.index+1]].forEach(r=>{if(r){r.facadeRole=role;r.openShare=share;}});draw();}
};
function b05MergedRole(a,b){const ra=b05Role(a),rb=b05Role(b);if(ra===rb)return ra;if(ra==='focus'&&rb==='auto'||rb==='focus'&&ra==='auto')return'focus';if(ra==='background'&&rb==='auto'||rb==='background'&&ra==='auto')return'background';return'auto';}
const b05BaseMergeL=b03MergeL.onclick;
b03MergeL.onclick=()=>{
  const x=b05Selected();let role='auto',share=.44;
  if(x&&x.index>0){const a=x.side.regions[x.index-1],b=x.reg;role=b05MergedRole(a,b);share=((a.openShare||.44)+(b.openShare||.44))/2;}
  b05BaseMergeL();const y=b05Selected();if(y){y.reg.facadeRole=role;y.reg.openShare=share;draw();}
};
const b05BaseMergeR=b03MergeR.onclick;
b03MergeR.onclick=()=>{
  const x=b05Selected();let role='auto',share=.44;
  if(x&&x.index<x.side.regions.length-1){const a=x.reg,b=x.side.regions[x.index+1];role=b05MergedRole(a,b);share=((a.openShare||.44)+(b.openShare||.44))/2;}
  b05BaseMergeR();const y=b05Selected();if(y){y.reg.facadeRole=role;y.reg.openShare=share;draw();}
};

const b05BaseMenu=b03MenuPosition;
b03MenuPosition=function(){
  b05Ensure();b05BaseMenu();
  const x=b05Selected();
  [b05Focus,b05Background,b05Auto,b05Align].forEach(b=>b.classList.remove('active','auto-active'));
  if(x){
    const role=b05Role(x.reg),button={auto:b05Auto,focus:b05Focus,background:b05Background}[role];if(button)button.classList.add(role==='auto'?'auto-active':'active');
    if(state.facade.aligned)b05Align.classList.add('active');
    const mode=b04Resolve(x.reg,x.rect);b05Less.disabled=b05More.disabled=!(mode==='open'||mode==='mixed');
    b03MenuTitle.textContent=`${x.sideName==='left'?'左':'右'}侧 · ${mm(x.rect.w)} · ${b04StructureName(x.reg,x.rect)} · ${B05_ROLE[role]}`;
    const top=parseFloat(b03Menu.style.top)||60;b03Menu.style.top=clamp(top,12,Math.max(12,H-b03Menu.offsetHeight-12))+'px';
  }
};

const b05BaseOverlay=b03Overlay;
b03Overlay=function(){
  b05Ensure();b05BaseOverlay();
  if(!state.tv.anchor)return;
  b03ScreenRegions().forEach(r=>{
    const reg=state.layout[r.side].regions[r.index],role=b05Role(reg);if(role==='auto')return;
    const label=role==='focus'?'重点':'背景';ctx.save();ctx.font='700 9px Inter, sans-serif';ctx.textAlign='center';const tw=ctx.measureText(label).width;
    ctx.fillStyle=role==='focus'?'rgba(124,98,168,.94)':'rgba(100,110,107,.88)';ctx.fillRect(r.cx-tw/2-6,r.cy+34,tw+12,17);ctx.fillStyle='#fff';ctx.fillText(label,r.cx,r.cy+46);ctx.restore();
  });
};

const b05BaseSnapshot=snapshot;
snapshot=function(){const s=b05BaseSnapshot();b05Ensure();s.facade=clone(state.facade);s.hasFacadeAction=!!state.hasFacadeAction;s.facadeRetested=!!state.facadeRetested;return s;};
const b05BaseRestore=restore;
restore=function(s){state.facade=clone(s.facade||{aligned:false,openShare:.44});state.hasFacadeAction=!!s.hasFacadeAction;state.facadeRetested=!!s.facadeRetested;b05BaseRestore(s);b05Ensure();};
const b05BaseUpdate=updateUI;
updateUI=function(){
  b05Ensure();b05BaseUpdate();
  const x=b05Selected();
  b05DatumState.textContent=state.facade.aligned?`已贯通 · ${Math.round(state.facade.openShare*100)}%`:'未建立';
  b05RoleState.textContent=x?B05_ROLE[b05Role(x.reg)]:'—';
  b05OpenState.textContent=x?`${Math.round(b05OpenShare(x.reg)*100)}%`:(state.facade.aligned?`${Math.round(state.facade.openShare*100)}%`:'—');
  b05StepFacade.classList.toggle('on',!!state.hasFacadeAction);b05StepRetest.classList.toggle('on',!!state.facadeRetested);
  if(b05Pointer.down&&b05Pointer.mode==='datum')promptEl.textContent='拖动贯通横线：所有参与区域实时改变藏露比例';
  else if(state.hoverRegion)promptEl.textContent='点击功能区：组织结构、横线和主次';
  else if(state.hasFacadeAction&&!state.facadeRetested)promptEl.textContent='继续拉外框或调整区域，检查立面关系是否保持';
  else if(state.facadeRetested)promptEl.textContent='立面关系已保留：主次、横线和藏露继续生效';
};

const b05BaseDraw=draw;
draw=function(){b05Ensure();b05BaseDraw();b05DrawDatum();};

const b05Pointer={down:false,mode:null,start:[0,0],pre:null,startShare:.44,moved:false};
function b05Local(ev){const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
canvas.addEventListener('pointermove',ev=>{
  const pt=b05Local(ev);
  if(b05Pointer.down&&b05Pointer.mode==='datum'){
    ev.stopImmediatePropagation();if(Math.hypot(pt[0]-b05Pointer.start[0],pt[1]-b05Pointer.start[1])>3)b05Pointer.moved=true;
    const d=b05DatumData(),axis=screenAxis(d.handle,[0,0,1000]),delta=((pt[0]-b05Pointer.start[0])*axis.x+(pt[1]-b05Pointer.start[1])*axis.y)/(axis.pxPerUnit||.1);
    const h=d.m.z1-d.m.lowTop-d.m.t,startZ=d.m.lowTop+h*(1-b05Pointer.startShare),z=clamp(startZ+delta,d.m.lowTop+150,d.m.z1-d.m.t-150);
    state.facade.openShare=clamp(1-(z-d.m.lowTop)/h,.24,.72);state.hasFacadeAction=true;draw();return;
  }
  const h=state.cabinet?hitHandle(pt):null,datum=!h?b05HitDatum(pt):null;if(datum){ev.stopImmediatePropagation();canvas.style.cursor='ns-resize';}
},true);
canvas.addEventListener('pointerdown',ev=>{
  const pt=b05Local(ev),h=state.cabinet?hitHandle(pt):null,datum=!h?b05HitDatum(pt):null;
  if(datum){ev.stopImmediatePropagation();canvas.setPointerCapture(ev.pointerId);Object.assign(b05Pointer,{down:true,mode:'datum',start:pt,pre:snapshot(),startShare:state.facade.openShare,moved:false});canvas.style.cursor='ns-resize';}
},true);
canvas.addEventListener('pointerup',ev=>{
  if(!b05Pointer.down)return;ev.stopImmediatePropagation();
  if(b05Pointer.moved){pushHistory(b05Pointer.pre);state.hasFacadeAction=true;state.facadeRetested=false;toast('贯通横线已更新；所有参与区域保持对齐');}
  Object.assign(b05Pointer,{down:false,mode:null,pre:null,moved:false});canvas.style.cursor='grab';draw();
},true);
canvas.addEventListener('pointercancel',ev=>{if(!b05Pointer.down)return;ev.stopImmediatePropagation();if(b05Pointer.pre)restore(b05Pointer.pre);Object.assign(b05Pointer,{down:false,mode:null,pre:null,moved:false});draw();},true);
canvas.addEventListener('pointerup',()=>setTimeout(()=>{
  if(!state.hasFacadeAction)return;
  if((pointer.mode==='tv'||pointer.mode==='resize')&&pointer.moved||typeof b03P!=='undefined'&&b03P.moved){state.facadeRetested=true;draw();}
},0));

const b05BaseReset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{b05BaseReset();state.facade={aligned:false,openShare:.44};state.hasFacadeAction=false;state.facadeRetested=false;draw();};

const b05Qs=new URLSearchParams(location.search);
if(b05Qs.get('facade')==='1'){
  state.cabinet={x:0,y:0,z:0,w:5200,h:2700,d:500};state.tv={...DEFAULT_TV,anchor:true};state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New()];state.layout.right.regions=[b03New(),b03New()];
  state.layout.left.regions[0].structure='open';state.layout.left.regions[0].facadeRole='focus';
  state.layout.left.regions[1].structure='mixed';state.layout.left.regions[1].facadeRole='auto';
  state.layout.right.regions[0].structure='closed';state.layout.right.regions[0].facadeRole='background';
  state.layout.right.regions[1].structure='drawers';state.layout.right.regions[1].facadeRole='auto';
  state.facade={aligned:true,openShare:.43};state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.structureRetested=true;state.hasFacadeAction=true;state.facadeRetested=true;state.hasShaped=true;
}
window.__formniB05={
  get:()=>clone({state,alloc:b03Alloc(),datum:b05DatumData()}),
  align:on=>{state.facade.aligned=!!on;state.hasFacadeAction=true;draw();},
  role:(side,index,role)=>{state.selectedRegion={side,index};b05SetRole(role);},
  openShare:v=>{state.facade.openShare=clamp(v,.24,.72);state.facade.aligned=true;state.hasFacadeAction=true;draw();}
};
draw();