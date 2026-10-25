// Formni B03 — 功能分区与持续关系。依赖 B02 全部脚本。
const b03Menu=document.getElementById('regionMenu');
const b03MenuTitle=document.getElementById('menuTitle');
const b03Split=document.getElementById('splitBtn');
const b03MergeL=document.getElementById('mergeLeftBtn');
const b03MergeR=document.getElementById('mergeRightBtn');
const b03Equal=document.getElementById('equalBtn');
const b03Lock=document.getElementById('lockBtn');
const b03LeftState=document.getElementById('leftState');
const b03RightState=document.getElementById('rightState');
const b03RelationState=document.getElementById('relationState');
const b03SelectionState=document.getElementById('selectionState');
const b03StepRegion=document.getElementById('stepRegion');
const b03StepRelation=document.getElementById('stepRelation');
const b03StepRetest=document.getElementById('stepRetest');

const B03_MIN=240;
let b03Seq=1;
const b03New=(weight=1)=>({id:`B03-${b03Seq++}`,weight,lockedWidth:null});
const b03Default=()=>({left:{regions:[b03New()],equal:false},right:{regions:[b03New()],equal:false}});

function b03Ensure(){
  if(state.tv&&state.tv.anchor&&!state.layout)state.layout=b03Default();
  if(state.hasRegionAction==null)state.hasRegionAction=false;
  if(state.hasRelation==null)state.hasRelation=false;
  if(state.retested==null)state.retested=false;
  if(state.selectedRegion===undefined)state.selectedRegion=null;
  if(state.hoverRegion===undefined)state.hoverRegion=null;
  if(state.hoverDivider===undefined)state.hoverDivider=null;
  if(!state.tv.anchor){state.selectedRegion=null;state.hoverRegion=null;state.hoverDivider=null;}
}
function b03Min(side){b03Ensure();return state.layout[side].regions.reduce((s,r)=>s+(r.lockedWidth!=null?r.lockedWidth:B03_MIN),0);}
function b03Metrics(){
  const c=state.cabinet,t=24,plinth=Math.min(82,Math.max(55,c.h*.06)),x0=c.x-c.w/2,x1=c.x+c.w/2,z0=c.z,z1=c.z+c.h;
  const clear=150;
  const openL=Math.max(x0+t+B03_MIN,state.tv.x-state.tv.w/2-clear);
  const openR=Math.min(x1-t-B03_MIN,state.tv.x+state.tv.w/2+clear);
  const lowTop=Math.max(z0+420,Math.min(state.tv.z-170,z0+Math.max(520,Math.min(720,c.h*.34))));
  const openTop=Math.min(z1-t,Math.max(state.tv.z+state.tv.h+150,lowTop+520));
  return{c,t,plinth,x0,x1,z0,z1,openL,openR,lowTop,openTop};
}
function b03Allocate(sideName,start,end){
  const side=state.layout[sideName],span=Math.max(0,end-start),regs=side.regions;
  let fixed=0,flexWeight=0,flexCount=0;
  regs.forEach(r=>{if(r.lockedWidth!=null)fixed+=r.lockedWidth;else{flexWeight+=Math.max(.01,r.weight||1);flexCount++;}});
  const minFlex=flexCount*B03_MIN,overflow=fixed+minFlex>span;
  const fixedScale=overflow&&fixed>0?Math.max(0,(span-minFlex)/fixed):1;
  const remain=Math.max(0,span-fixed*fixedScale);
  let x=start;
  return regs.map((r,i)=>{
    let w=r.lockedWidth!=null?r.lockedWidth*fixedScale:(flexWeight?remain*Math.max(.01,r.weight||1)/flexWeight:0);
    if(i===regs.length-1)w=end-x;
    const out={side:sideName,index:i,id:r.id,x0:x,x1:x+w,w,locked:r.lockedWidth!=null,overflow};x+=w;return out;
  });
}
function b03Alloc(){
  b03Ensure();
  if(!state.cabinet||!state.tv.anchor)return{left:[],right:[],all:[]};
  const m=b03Metrics(),left=b03Allocate('left',m.x0+m.t,m.openL),right=b03Allocate('right',m.openR,m.x1-m.t);
  return{left,right,all:[...left,...right],metrics:m};
}
function b03Poly(r){
  const m=b03Alloc().metrics,y=m.c.y+m.c.d+24,z0=m.lowTop+4,z1=m.z1-m.t-4;
  return[[r.x0,y,z0],[r.x1,y,z0],[r.x1,y,z1],[r.x0,y,z1]];
}
function b03ScreenRegions(){
  if(!state.tv.anchor)return[];
  return b03Alloc().all.map(r=>{
    const poly=b03Poly(r).map(project).filter(Boolean);
    return{...r,poly,cx:poly.reduce((s,p)=>s+p.x,0)/4,cy:poly.reduce((s,p)=>s+p.y,0)/4};
  }).filter(r=>r.poly.length===4);
}
function b03HitRegion(pt){
  const rs=b03ScreenRegions();for(let i=rs.length-1;i>=0;i--)if(pointInPoly(pt,rs[i].poly))return rs[i];return null;
}
function b03Dividers(){
  if(!state.tv.anchor)return[];
  const a=b03Alloc(),m=a.metrics,out=[];
  ['left','right'].forEach(side=>{
    const rs=a[side];for(let i=0;i<rs.length-1;i++){
      const x=rs[i].x1,world=[x,m.c.y+m.c.d+50,(m.lowTop+m.z1)/2],screen=project(world);
      if(screen)out.push({side,index:i,world,screen,locked:rs[i].locked||rs[i+1].locked});
    }
  });return out;
}
function b03HitDivider(pt){let best=null,d0=16;b03Dividers().forEach(d=>{const dd=dist2(pt,d.screen);if(dd<d0){best=d;d0=dd;}});return best;}

const b02Anchored=anchoredCabinetFaces;
anchoredCabinetFaces=function(c,tv){
  b03Ensure();if(!state.layout)return b02Anchored(c,tv);
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
    const h=z1-m.lowTop-t;
    add(r.x0,y0+12,m.lowTop,t,Math.max(30,c.d-12),Math.max(30,h),{main:palette.board,side:palette.boardSide});
    add(r.x1-t,y0+12,m.lowTop,t,Math.max(30,c.d-12),Math.max(30,h),{main:palette.board,side:palette.boardSide});
    const shelves=Math.max(1,Math.min(3,Math.floor(h/530)));
    for(let s=1;s<shelves;s++)add(r.x0+t,y0+18,m.lowTop+s*h/shelves,r.w-2*t,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
    const selected=state.selectedRegion&&state.selectedRegion.side===r.side&&state.selectedRegion.index===r.index;
    const col=selected?'#c7d8d4':((r.index+(r.side==='right'?1:0))%2?palette.panelAlt:palette.panel);
    add(r.x0+8,y0+c.d+3,m.lowTop+8,r.w-16,18,Math.max(40,h-16),{main:col,side:'#aab5b0',front:col});
  });
  if(m.openTop<z1-t-140){
    add(m.openL,y0+12,m.openTop,m.openR-m.openL,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});
    const h=z1-m.openTop-t,n=Math.max(2,Math.round((m.openR-m.openL)/720)),w=(m.openR-m.openL)/n;
    for(let i=0;i<n;i++)add(m.openL+i*w+8,y0+c.d+3,m.openTop+t+8,w-16,18,Math.max(40,h-t-16),{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
  }
  return faces;
};

function b03Overlay(){
  if(!state.tv.anchor)return;
  b03ScreenRegions().forEach(r=>{
    const sel=state.selectedRegion&&state.selectedRegion.side===r.side&&state.selectedRegion.index===r.index;
    const hov=state.hoverRegion&&state.hoverRegion.side===r.side&&state.hoverRegion.index===r.index;
    if(sel||hov){
      ctx.save();ctx.beginPath();ctx.moveTo(r.poly[0].x,r.poly[0].y);r.poly.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
      ctx.fillStyle=sel?'rgba(50,119,124,.10)':'rgba(214,146,53,.08)';ctx.fill();ctx.strokeStyle=sel?'#32777c':'#d69235';ctx.lineWidth=sel?3:2;ctx.setLineDash(sel?[]:[6,5]);ctx.stroke();ctx.restore();
    }
    const side=state.layout[r.side],label=`${Math.round(r.w/10)*10}${r.locked?' · 锁':side.equal?' · =':''}`;
    ctx.save();ctx.font='700 10px Inter, sans-serif';ctx.textAlign='center';const tw=ctx.measureText(label).width;
    ctx.fillStyle='rgba(250,251,249,.82)';ctx.fillRect(r.cx-tw/2-6,r.cy-10,tw+12,18);ctx.fillStyle='#56615e';ctx.fillText(label,r.cx,r.cy+3);ctx.restore();
  });
  b03Dividers().forEach(d=>{const active=state.hoverDivider&&state.hoverDivider.side===d.side&&state.hoverDivider.index===d.index;
    ctx.save();ctx.beginPath();ctx.arc(d.screen.x,d.screen.y,active?9:7,0,Math.PI*2);ctx.fillStyle=d.locked?'#aab1ae':'#d69235';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();ctx.restore();
  });
}
function b03Relations(){
  if(!state.tv.anchor)return'—';const p=[];
  ['left','right'].forEach(s=>{const d=state.layout[s],n=s==='left'?'左':'右';if(d.equal&&d.regions.length>1)p.push(`${n}侧均分`);const l=d.regions.filter(r=>r.lockedWidth!=null).length;if(l)p.push(`${n}侧锁定 ${l}`);if(d.regions.length>1&&!d.equal)p.push(`${n}侧比例`);});
  return p.length?p.join(' · '):'尚未建立';
}
function b03MenuPosition(){
  if(!state.selectedRegion||!state.tv.anchor){b03Menu.classList.remove('show');return;}
  const r=b03ScreenRegions().find(q=>q.side===state.selectedRegion.side&&q.index===state.selectedRegion.index);
  if(!r){state.selectedRegion=null;b03Menu.classList.remove('show');return;}
  b03Menu.style.left=clamp(r.cx+16,12,W-205)+'px';b03Menu.style.top=clamp(r.cy-60,60,H-190)+'px';b03Menu.classList.add('show');
  const side=state.layout[r.side],reg=side.regions[r.index];
  b03MenuTitle.textContent=`${r.side==='left'?'左':'右'}侧功能区 · ${mm(r.w)}`;
  b03Split.disabled=r.w<B03_MIN*2+40;b03MergeL.disabled=r.index===0;b03MergeR.disabled=r.index===side.regions.length-1;b03Equal.disabled=side.regions.length<2;
  b03Lock.textContent=reg.lockedWidth!=null?'解除锁定':'锁定宽度';
}

const b02Snapshot=snapshot;
snapshot=function(){
  const s=b02Snapshot();b03Ensure();s.layout=clone(state.layout);s.hasRegionAction=!!state.hasRegionAction;s.hasRelation=!!state.hasRelation;s.retested=!!state.retested;return s;
};
const b02Restore=restore;
restore=function(s){
  state.layout=clone(s.layout||b03Default());state.hasRegionAction=!!s.hasRegionAction;state.hasRelation=!!s.hasRelation;state.retested=!!s.retested;
  state.selectedRegion=null;state.hoverRegion=null;state.hoverDivider=null;b02Restore(s);b03Ensure();
};
const b02UpdateUI=updateUI;
updateUI=function(){
  b03Ensure();b02UpdateUI();
  b03LeftState.textContent=state.tv.anchor?`${state.layout.left.regions.length} 区`:'—';
  b03RightState.textContent=state.tv.anchor?`${state.layout.right.regions.length} 区`:'—';
  b03RelationState.textContent=b03Relations();
  b03SelectionState.textContent=state.selectedRegion?`${state.selectedRegion.side==='left'?'左':'右'}侧第 ${state.selectedRegion.index+1} 区`:'—';
  b03StepRegion.classList.toggle('on',!!state.hasRegionAction);b03StepRelation.classList.toggle('on',!!state.hasRelation);b03StepRetest.classList.toggle('on',!!state.retested);
  if(state.hoverDivider)promptEl.textContent=state.hoverDivider.locked?'相邻区域已锁定，先解锁后再拖':'拖动内部边界，明确两个区域的比例';
  else if(state.hoverRegion)promptEl.textContent='点击功能区：分区、合并、均分或锁定';
  else if(state.tv.anchor&&!state.hasRegionAction)promptEl.textContent='下一步：点击左右功能区，建立分区关系';
  else if(state.hasRelation&&!state.retested)promptEl.textContent='再拖电视或外框，检查关系是否继续成立';
  else if(state.retested)promptEl.textContent='关系已保留：可以继续分区、合并或推拉';
};
const b02Draw=draw;
draw=function(){b03Ensure();b02Draw();b03Overlay();b03MenuPosition();};

function b03Selected(){
  if(!state.selectedRegion)return null;const side=state.layout[state.selectedRegion.side],reg=side.regions[state.selectedRegion.index],rect=b03Alloc()[state.selectedRegion.side][state.selectedRegion.index];
  return reg&&rect?{side,reg,rect,sideName:state.selectedRegion.side,index:state.selectedRegion.index}:null;
}
function b03Action(msg,fn){
  const x=b03Selected();if(!x)return;pushHistory(snapshot());fn(x);state.hasRegionAction=true;state.hasRelation=true;state.retested=false;draw();toast(msg);
}
b03Split.onclick=()=>b03Action('已分成两格；可以继续均分或调整比例',({side,reg,index})=>{
  const w=Math.max(.1,reg.weight||1);side.regions.splice(index,1,b03New(w/2),b03New(w/2));side.equal=false;state.selectedRegion={side:state.selectedRegion.side,index};
});
b03MergeL.onclick=()=>b03Action('已向左合并为一个完整功能区',({side,index})=>{
  if(index<=0)return;const a=side.regions[index-1],b=side.regions[index];side.regions.splice(index-1,2,{id:b03New().id,weight:(a.weight||1)+(b.weight||1),lockedWidth:a.lockedWidth!=null&&b.lockedWidth!=null?a.lockedWidth+b.lockedWidth:null});
  side.equal=false;state.selectedRegion={side:state.selectedRegion.side,index:index-1};
});
b03MergeR.onclick=()=>b03Action('已向右合并为一个完整功能区',({side,index})=>{
  if(index>=side.regions.length-1)return;const a=side.regions[index],b=side.regions[index+1];side.regions.splice(index,2,{id:b03New().id,weight:(a.weight||1)+(b.weight||1),lockedWidth:a.lockedWidth!=null&&b.lockedWidth!=null?a.lockedWidth+b.lockedWidth:null});
  side.equal=false;state.selectedRegion={side:state.selectedRegion.side,index};
});
b03Equal.onclick=()=>b03Action('已建立整侧均分；后续拉伸继续保持',({side})=>{side.regions.forEach(r=>{r.weight=1;r.lockedWidth=null;});side.equal=true;});
b03Lock.onclick=()=>b03Action('区域锁定状态已更新',({side,reg,rect})=>{if(reg.lockedWidth!=null){reg.lockedWidth=null;reg.weight=Math.max(1,rect.w);}else{reg.lockedWidth=rect.w;side.equal=false;}});

const b03P={down:false,mode:null,start:[0,0],pre:null,divider:null,widths:null,region:null,moved:false};
function b03Local(ev){const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
canvas.addEventListener('pointermove',ev=>{
  const pt=b03Local(ev);
  if(b03P.down&&b03P.mode==='divider'){
    ev.stopImmediatePropagation();if(Math.hypot(pt[0]-b03P.start[0],pt[1]-b03P.start[1])>3)b03P.moved=true;
    const d=b03P.divider,side=state.layout[d.side],axis=screenAxis(d.world,[1000,0,0]),delta=((pt[0]-b03P.start[0])*axis.x+(pt[1]-b03P.start[1])*axis.y)/(axis.pxPerUnit||.1);
    const total=b03P.widths.a+b03P.widths.b,a=clamp(b03P.widths.a+delta,B03_MIN,total-B03_MIN),b=total-a;
    side.regions.forEach((r,i)=>{if(r.lockedWidth==null)r.weight=Math.max(1,b03P.widths.all[i]||1);});side.regions[d.index].weight=a;side.regions[d.index+1].weight=b;side.equal=false;
    state.hasRegionAction=true;state.hasRelation=true;draw();return;
  }
  if(b03P.down&&b03P.mode==='region'){ev.stopImmediatePropagation();if(Math.hypot(pt[0]-b03P.start[0],pt[1]-b03P.start[1])>3)b03P.moved=true;return;}
  const h=state.cabinet?hitHandle(pt):null,div=!h&&state.tv.anchor?b03HitDivider(pt):null,tvHit=!h&&!div&&overTV(pt),reg=!h&&!div&&!tvHit&&state.tv.anchor?b03HitRegion(pt):null;
  const had=!!state.hoverRegion||!!state.hoverDivider;state.hoverDivider=div;state.hoverRegion=reg?{side:reg.side,index:reg.index}:null;
  if(div||reg){ev.stopImmediatePropagation();canvas.style.cursor=div?(div.locked?'not-allowed':'ew-resize'):'pointer';draw();}
  else if(had){draw();}
},true);
canvas.addEventListener('pointerdown',ev=>{
  const pt=b03Local(ev),h=state.cabinet?hitHandle(pt):null,div=!h&&state.tv.anchor?b03HitDivider(pt):null,tvHit=!h&&!div&&overTV(pt),reg=!h&&!div&&!tvHit&&state.tv.anchor?b03HitRegion(pt):null;
  if(div&&!div.locked){
    ev.stopImmediatePropagation();canvas.setPointerCapture(ev.pointerId);const arr=b03Alloc()[div.side];
    Object.assign(b03P,{down:true,mode:'divider',start:pt,pre:snapshot(),divider:div,widths:{a:arr[div.index].w,b:arr[div.index+1].w,all:arr.map(r=>r.w)},moved:false});state.selectedRegion=null;draw();
  }else if(reg){
    ev.stopImmediatePropagation();canvas.setPointerCapture(ev.pointerId);Object.assign(b03P,{down:true,mode:'region',start:pt,region:{side:reg.side,index:reg.index},moved:false});
  }
},true);
canvas.addEventListener('pointerup',ev=>{
  if(!b03P.down)return;ev.stopImmediatePropagation();
  if(b03P.mode==='divider'&&b03P.moved){pushHistory(b03P.pre);state.hasRegionAction=true;state.hasRelation=true;state.retested=false;toast('已建立新的区域比例关系');}
  if(b03P.mode==='region'&&!b03P.moved)state.selectedRegion=b03P.region;
  Object.assign(b03P,{down:false,mode:null,divider:null,widths:null,region:null});draw();
},true);
canvas.addEventListener('pointercancel',ev=>{
  if(!b03P.down)return;ev.stopImmediatePropagation();if(b03P.pre)restore(b03P.pre);Object.assign(b03P,{down:false,mode:null});draw();
},true);
canvas.addEventListener('pointerup',()=>{setTimeout(()=>{if(state.hasRelation&&(pointer.mode==='tv'||pointer.mode==='resize')&&pointer.moved){state.retested=true;draw();}},0);});

const b02Reset=document.getElementById('resetBtn').onclick;
document.getElementById('resetBtn').onclick=()=>{b02Reset();state.layout=null;state.hasRegionAction=false;state.hasRelation=false;state.retested=false;state.selectedRegion=null;b03Menu.classList.remove('show');};

if(new URLSearchParams(location.search).get('relation')==='1'){
  state.cabinet={x:0,y:0,z:0,w:4800,h:2580,d:500};state.tv={...DEFAULT_TV,anchor:true};state.layout=b03Default();state.layout.left.regions=[b03New(),b03New()];state.layout.left.equal=true;state.hasRegionAction=true;state.hasRelation=true;
}
window.__formniB03={
  get:()=>clone({state,alloc:b03Alloc()}),
  split:(side,index)=>{state.selectedRegion={side,index};b03Split.click();},
  equal:side=>{state.selectedRegion={side,index:0};b03Equal.click();},
  mergeRight:(side,index)=>{state.selectedRegion={side,index};b03MergeR.click();}
};
draw();