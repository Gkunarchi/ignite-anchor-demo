// Formni B11 — 物品需求与容量分配。依赖 B02–B10。
(function(){
'use strict';
const doc=document;
const brand=doc.querySelector('.brand'),title=doc.querySelector('header .title'),topNote=doc.querySelector('.top-note');
if(brand)brand.textContent='FORMNI / B11';
if(title)title.textContent='物品需求与容量 · 先知道要收什么、收多少，再决定柜子如何生长';
if(topNote)topNote.innerHTML='<b>B11 · 物品需求与容量分配</b><span>点击书籍与文件箱；系统把数量、频率和现有决定一起换算成收纳结构</span>';

const style=doc.createElement('style');
style.textContent=`
.storage-dot{width:8px;height:8px;border-radius:50%;background:#b57a37}.capacity-dot{width:8px;height:8px;border-radius:50%;background:#477f73}
.storage-card{border-color:rgba(181,122,55,.26);background:rgba(255,252,247,.97)}
.storage-menu{position:absolute;display:none;width:238px;padding:10px;border-radius:14px;background:rgba(250,251,249,.98);border:1px solid rgba(30,41,40,.12);box-shadow:0 18px 48px rgba(28,42,39,.2);z-index:42}.storage-menu.show{display:block}.storage-menu .menu-title{font-size:11px;font-weight:760;padding:2px 4px 8px}.storage-menu .menu-label{padding:8px 4px 6px;font-size:10px;color:#74807d;border-top:1px solid rgba(30,41,40,.08);margin-top:8px}.storage-menu .menu-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.storage-menu button{height:32px;padding:0 7px;font-size:11px;border-radius:9px}.storage-menu button.active{background:#b57a37;color:#fff;border-color:#b57a37}.storage-menu button.auto-active{background:#f3e8d8;color:#765124;border-color:rgba(181,122,55,.35)}.storage-menu button.danger{color:#99463e}
.storage-panel{position:absolute;left:50%;top:72px;transform:translate(-50%,-12px);width:min(520px,calc(100% - 36px));padding:14px 15px;border-radius:15px;background:rgba(255,249,247,.98);border:1px solid rgba(189,81,71,.35);box-shadow:0 18px 50px rgba(95,35,31,.18);z-index:44;opacity:0;pointer-events:none;transition:.18s}.storage-panel.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}.storage-head{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:780;color:#8d332c}.storage-text{font-size:11px;line-height:1.55;color:#6f4b47;margin:7px 0 10px}.storage-panel .conflict-actions{display:flex;gap:7px;flex-wrap:wrap}.storage-panel .conflict-actions button{height:31px;font-size:11px}.storage-panel .primary{background:#477f73;color:#fff;border-color:#477f73}.storage-panel .soft{background:#fff2ef;color:#8d332c;border-color:rgba(189,81,71,.25)}
.capacity-meter{height:7px;background:#ece7de;border-radius:999px;overflow:hidden;margin-top:8px}.capacity-meter span{display:block;height:100%;background:#477f73;transition:.18s}.storage-label{position:absolute;pointer-events:none;padding:5px 7px;border-radius:8px;background:rgba(181,122,55,.94);color:#fff;font-size:10px;font-weight:720;z-index:20;transform:translate(-50%,-100%);white-space:nowrap}
`;
doc.head.appendChild(style);
const legend=doc.querySelector('.axis-legend');
if(legend){const a=doc.createElement('div');a.className='axis-chip';a.innerHTML='<i class="storage-dot"></i>物品需求';legend.appendChild(a);const c=doc.createElement('div');c.className='axis-chip';c.innerHTML='<i class="capacity-dot"></i>容量分配';legend.appendChild(c);}

const viewport=doc.getElementById('viewport');
const storageMenu=doc.createElement('div');storageMenu.id='storageMenu';storageMenu.className='storage-menu';storageMenu.innerHTML=`
<div class="menu-title">书籍与文件需求</div>
<div class="menu-label">数量规模</div><div class="menu-actions"><button id="storageSmallBtn">少量 80</button><button id="storageMediumBtn">中等 180</button><button id="storageLargeBtn">大量 320</button></div>
<div class="menu-label">使用频率</div><div class="menu-actions"><button id="storageFrequentBtn">常用为主</button><button id="storageBalancedBtn">均衡</button><button id="storageArchiveBtn">低频归档</button></div>
<div class="menu-label">需求状态</div><div class="menu-actions"><button id="storageLockBtn">锁定需求</button><button id="storageReleaseBtn" class="danger">取消需求</button></div>`;
viewport.appendChild(storageMenu);
const storagePanel=doc.createElement('div');storagePanel.id='storagePanel';storagePanel.className='storage-panel';storagePanel.innerHTML=`<div class="storage-head"><i class="constraint-dot"></i><span>当前柜体容量不足</span></div><div class="storage-text" id="storageConflictText">系统不会偷偷减少物品数量。</div><div class="conflict-actions"><button id="storageReleaseConfirmedBtn" class="primary">放开一个已确认区域</button><button id="storageGrowBtn" class="soft">增加可用高度</button><button id="storageKeepBtn">保留缺口</button></div>`;
viewport.appendChild(storagePanel);
const storageLabel=doc.createElement('div');storageLabel.className='storage-label';storageLabel.textContent='点击书籍与文件箱，加入收纳需求';viewport.appendChild(storageLabel);

const side=doc.querySelector('.side'),firstCard=side&&side.querySelector('.card');
if(firstCard)firstCard.innerHTML='<h3>本轮行为链</h3><div class="steps">\
<div class="step" id="stepStorageAnchor"><div class="n">1</div><div><b>加入物品需求</b><span>书籍与文件不是装饰物，而是需要被容纳的容量任务</span></div></div>\
<div class="step" id="stepStorageAllocate"><div class="n">2</div><div><b>分配到合适区域</b><span>常用靠近书桌，低频进入更高或更封闭的位置</span></div></div>\
<div class="step" id="stepStorageResolve"><div class="n">3</div><div><b>处理容量缺口</b><span>不减少需求；只在用户允许后释放决定或扩大空间</span></div></div>\
<div class="step" id="stepStorageRetest"><div class="n">4</div><div><b>继续推拉复验</b><span>外框、门洞和锚点变化后，需求仍然被完整记住</span></div></div></div>';
if(side){const card=doc.createElement('div');card.className='card storage-card';card.innerHTML='<h3>物品与容量状态</h3><div class="state">\
<div class="row"><span>需求规模</span><strong id="storageDemandState">等待加入</strong></div>\
<div class="row"><span>使用频率</span><strong id="storageFrequencyState">—</strong></div>\
<div class="row"><span>已分配</span><strong id="storageAssignedState">0</strong></div>\
<div class="row"><span>当前容量</span><strong id="storageCapacityState">0</strong></div>\
<div class="row"><span>容量缺口</span><strong id="storageShortageState">0</strong></div>\
<div class="row"><span>使用区域</span><strong id="storageRegionsState">0</strong></div>\
</div><div class="capacity-meter"><span id="storageMeter" style="width:0"></span></div>';
if(firstCard&&firstCard.nextSibling)side.insertBefore(card,firstCard.nextSibling);else side.appendChild(card);
const rules=[...side.querySelectorAll('.card')].find(c=>c.querySelector('h3')&&c.querySelector('h3').textContent==='本轮规则');
if(rules)rules.innerHTML='<h3>本轮规则</h3><div class="rule"><b>先算需求：</b>数量和使用频率先变成容量任务，再决定哪些区域需要层板、开放架或封闭储物。<br><b>明确优先：</b>已确认区域、明确结构、锁定关系不会被后台偷偷改掉。<br><b>频率影响位置：</b>常用物品优先靠近书桌和可及高度，低频物品优先进入较高或封闭区域。<br><b>缺口可见：</b>容量不足时显示缺多少，不自动删除需求。</div>';
const footer=side.querySelector('.footer');if(footer)footer.textContent='本轮只验证“物品需求怎样转化为收纳容量”。不增加材质、五金、品牌或生产数据。';}

const Q={small:{label:'少量',count:80},medium:{label:'中等',count:180},large:{label:'大量',count:320}};
const F={frequent:{label:'常用为主',share:.72},balanced:{label:'均衡',share:.45},archive:{label:'低频归档',share:.18}};
const AVG_SPINE=30,FILL=.72;
function b11Ensure(){
  b09Ensure();
  if(!state.storageDemand)state.storageDemand={anchor:false,quantity:'medium',frequency:'balanced',locked:false,selected:false,acknowledged:false,hasAction:false,retested:false,assignments:[],capacity:0,assigned:0,shortage:0};
  const s=state.storageDemand;if(!Q[s.quantity])s.quantity='medium';if(!F[s.frequency])s.frequency='balanced';if(s.locked==null)s.locked=false;if(s.selected==null)s.selected=false;if(s.acknowledged==null)s.acknowledged=false;if(s.hasAction==null)s.hasAction=false;if(s.retested==null)s.retested=false;if(!Array.isArray(s.assignments))s.assignments=[];
}
function b11Demand(){b11Ensure();const s=state.storageDemand,q=Q[s.quantity],f=F[s.frequency];return{count:q.count,label:q.label,frequency:f.label,highShare:f.share};}
function b11DemandPos(){return{x:0,y:2200,z:0,w:620,d:420,h:360};}
function b11DemandFaces(){
  b11Ensure();const p=b11DemandPos(),faces=[];faces.push(...boxFaces(p.x-p.w/2,p.y,p.z,p.w,p.d,150,{main:'#a77a49',side:'#835f3d',front:'#a77a49',top:'#c99b64'}));
  const n=7,bw=48,gap=18,start=p.x-(n*bw+(n-1)*gap)/2;for(let i=0;i<n;i++){const h=160+(i%3)*45;faces.push(...boxFaces(start+i*(bw+gap),p.y+70,150,bw,220,h,{main:i%2?'#7e8f89':'#b06a38',side:'#5e6c67',front:i%2?'#7e8f89':'#b06a38'}));}
  return faces;
}
function b11DemandPoly(){const p=b11DemandPos(),y=p.y+p.d+22;return[[p.x-p.w/2,y,0],[p.x+p.w/2,y,0],[p.x+p.w/2,y,p.h+260],[p.x-p.w/2,y,p.h+260]].map(project).filter(Boolean);}
function b11CanModify(reg){return !reg.confirmed&&(reg.structure||'auto')==='auto'&&reg.lockedWidth==null;}
function b11Capacity(mode,rect,height){
  let levels=0;if(mode==='open')levels=clamp(Math.floor(height/360),2,6);else if(mode==='mixed')levels=clamp(Math.floor(height/470),1,4);else if(mode==='closed')levels=clamp(Math.floor(height/520),1,4);else return 0;
  return Math.max(0,Math.floor(Math.max(0,rect.w-70)*levels*FILL/AVG_SPINE));
}
const b11BaseResolve=b04Resolve;
b04Resolve=function(reg,rect){
  b11Ensure();const base=b11BaseResolve(reg,rect);if(!state.storageDemand.anchor)return base;
  if(reg.demandRole&&b11CanModify(reg))return reg.demandRole;return base;
};
function b11Recompute(){
  b11Ensure();const s=state.storageDemand;s.assignments=[];s.capacity=0;s.assigned=0;s.shortage=0;
  if(state.layout)['left','right'].forEach(side=>state.layout[side].regions.forEach(reg=>{reg.demandRole=null;reg.demandAssigned=0;reg.demandCapacity=0;}));
  if(!s.anchor||!state.layout||!state.tv.anchor||!state.cabinet)return;
  const d=b11Demand(),alloc=b03Alloc(),m=alloc.metrics,height=m?m.z1-m.lowTop-m.t:0,candidates=[];
  ['left','right'].forEach(side=>state.layout[side].regions.forEach((reg,index)=>{const rect=alloc[side][index];if(!rect)return;let base=b11BaseResolve(reg,rect),mode=base;
    if(b11CanModify(reg)){if(s.frequency==='frequent')mode='open';else if(s.frequency==='archive')mode='closed';else mode=Math.abs((rect.x0+rect.x1)/2-(state.desk&&state.desk.anchor?state.desk.x:state.tv.x))<900?'open':'mixed';}
    const cap=b11Capacity(mode,rect,height),center=(rect.x0+rect.x1)/2,near=Math.abs(center-(state.desk&&state.desk.anchor?state.desk.x:state.tv.x));
    let score=near+(mode==='open'?-500:mode==='mixed'?-220:mode==='closed'?120:1200);if(s.frequency==='archive')score=(mode==='closed'?-500:mode==='mixed'?-100:200)+near*.15;
    candidates.push({side,index,reg,rect,mode,cap,score,modifiable:b11CanModify(reg)});
  }));
  candidates.sort((a,b)=>a.score-b.score);let remain=d.count,frequentLeft=Math.round(d.count*d.highShare);
  candidates.forEach(c=>{if(remain<=0||c.cap<=0)return;const use=Math.min(remain,c.cap);c.reg.demandRole=c.modifiable?c.mode:null;c.reg.demandAssigned=use;c.reg.demandCapacity=c.cap;const high=Math.min(use,frequentLeft);frequentLeft-=high;remain-=use;s.assigned+=use;s.capacity+=c.cap;s.assignments.push({side:c.side,index:c.index,assigned:use,capacity:c.cap,mode:c.mode,high});});
  candidates.filter(c=>!s.assignments.some(a=>a.side===c.side&&a.index===c.index)).forEach(c=>{if(c.cap>0)s.capacity+=c.cap;});
  s.shortage=Math.max(0,d.count-s.assigned);
}

const b11BaseRoomFaces=makeRoomFaces;
makeRoomFaces=function(){b11Ensure();return[...b11BaseRoomFaces(),...b11DemandFaces()];};
function b11DrawAssignments(){
  b11Ensure();if(!state.storageDemand.anchor)return;b11Recompute();const regions=b03ScreenRegions();state.storageDemand.assignments.forEach(a=>{const r=regions.find(x=>x.side===a.side&&x.index===a.index);if(!r)return;const label=`书 ${a.assigned}/${a.capacity}${a.high?` · 常用 ${a.high}`:''}`;ctx.save();ctx.font='700 9px Inter, sans-serif';ctx.textAlign='center';const tw=ctx.measureText(label).width;ctx.fillStyle='rgba(71,127,115,.95)';ctx.fillRect(r.cx-tw/2-6,r.cy+74,tw+12,17);ctx.fillStyle='#fff';ctx.fillText(label,r.cx,r.cy+86);const ratio=Math.min(1,a.assigned/Math.max(1,a.capacity)),x=r.cx-34,y=r.cy+94;ctx.fillStyle='rgba(71,127,115,.18)';ctx.fillRect(x,y,68,4);ctx.fillStyle='#477f73';ctx.fillRect(x,y,68*ratio,4);ctx.restore();});
}
function b11DrawDemand(){const p=b11DemandPoly();if(p.length!==4)return;const s=state.storageDemand;ctx.save();ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);p.slice(1).forEach(q=>ctx.lineTo(q.x,q.y));ctx.closePath();ctx.strokeStyle=s.anchor?'#b57a37':'#32777c';ctx.lineWidth=s.anchor?3:2.2;ctx.setLineDash(s.anchor?[]:[7,5]);ctx.stroke();ctx.restore();const cx=(p[0].x+p[2].x)/2,top=Math.min(...p.map(q=>q.y));storageLabel.style.left=cx+'px';storageLabel.style.top=(top-5)+'px';storageLabel.textContent=s.anchor?`${b11Demand().label} · ${b11Demand().count} 件 · ${b11Demand().frequency}`:'点击书籍与文件箱，加入收纳需求';}
const b11BaseDraw=draw;
draw=function(){b11Ensure();b11Recompute();b11BaseDraw();b11DrawAssignments();b11DrawDemand();b11PositionHit();b11MenuPosition();};

const hit=doc.createElement('div');Object.assign(hit.style,{position:'absolute',display:'none',zIndex:'41',background:'transparent',touchAction:'none',userSelect:'none',cursor:'pointer'});hit.setAttribute('aria-label','书籍与文件需求');viewport.appendChild(hit);
function b11PositionHit(){const p=b11DemandPoly();if(p.length!==4){hit.style.display='none';return;}const xs=p.map(q=>q.x),ys=p.map(q=>q.y),pad=8,left=Math.max(0,Math.min(...xs)-pad),top=Math.max(0,Math.min(...ys)-pad),right=Math.min(W,Math.max(...xs)+pad),bottom=Math.min(H,Math.max(...ys)+pad);Object.assign(hit.style,{display:'block',left:left+'px',top:top+'px',width:Math.max(18,right-left)+'px',height:Math.max(18,bottom-top)+'px'});}
hit.addEventListener('click',ev=>{ev.stopPropagation();b11Ensure();if(!state.cabinet||!state.tv.anchor){toast('先建立墙面与电视锚点，再加入收纳需求');return;}if(!state.storageDemand.anchor){pushHistory(snapshot());state.storageDemand.anchor=true;state.storageDemand.selected=true;state.storageDemand.hasAction=true;state.storageDemand.acknowledged=false;toast('书籍与文件已成为容量需求；系统开始分配收纳区域');}else state.storageDemand.selected=!state.storageDemand.selected;draw();});

function b11MenuPosition(){b11Ensure();const s=state.storageDemand;if(!s.anchor||!s.selected){storageMenu.classList.remove('show');return;}const p=b11DemandPoly();if(p.length!==4)return;const cx=(p[0].x+p[2].x)/2,cy=(p[0].y+p[2].y)/2;storageMenu.style.left=clamp(cx+24,12,W-252)+'px';storageMenu.style.top=clamp(cy-105,58,H-storageMenu.offsetHeight-12)+'px';storageMenu.classList.add('show');
  const ids=['storageSmallBtn','storageMediumBtn','storageLargeBtn','storageFrequentBtn','storageBalancedBtn','storageArchiveBtn','storageLockBtn'];ids.forEach(id=>doc.getElementById(id).classList.remove('active','auto-active'));
  doc.getElementById({small:'storageSmallBtn',medium:'storageMediumBtn',large:'storageLargeBtn'}[s.quantity]).classList.add('active');
  doc.getElementById({frequent:'storageFrequentBtn',balanced:'storageBalancedBtn',archive:'storageArchiveBtn'}[s.frequency]).classList.add('active');
  if(s.locked)doc.getElementById('storageLockBtn').classList.add('active');doc.getElementById('storageLockBtn').textContent=s.locked?'解除需求锁定':'锁定需求';
}
function b11Set(field,value,msg){b11Ensure();pushHistory(snapshot());state.storageDemand[field]=value;state.storageDemand.anchor=true;state.storageDemand.hasAction=true;state.storageDemand.retested=false;state.storageDemand.acknowledged=false;draw();toast(msg);}
doc.getElementById('storageSmallBtn').onclick=()=>b11Set('quantity','small','需求调整为少量 80 件');
doc.getElementById('storageMediumBtn').onclick=()=>b11Set('quantity','medium','需求调整为中等 180 件');
doc.getElementById('storageLargeBtn').onclick=()=>b11Set('quantity','large','需求调整为大量 320 件');
doc.getElementById('storageFrequentBtn').onclick=()=>b11Set('frequency','frequent','已明确常用为主；优先靠近书桌和开放区域');
doc.getElementById('storageBalancedBtn').onclick=()=>b11Set('frequency','balanced','已明确均衡使用；开放与封闭共同承担');
doc.getElementById('storageArchiveBtn').onclick=()=>b11Set('frequency','archive','已明确低频归档；优先高位和封闭区域');
doc.getElementById('storageLockBtn').onclick=()=>{b11Ensure();pushHistory(snapshot());state.storageDemand.locked=!state.storageDemand.locked;draw();toast(state.storageDemand.locked?'需求数量与频率已锁定':'需求已解锁，可继续修改');};
doc.getElementById('storageReleaseBtn').onclick=()=>{b11Ensure();pushHistory(snapshot());state.storageDemand.anchor=false;state.storageDemand.selected=false;state.storageDemand.assignments=[];draw();toast('已取消物品需求；柜体重新交给当前设计规则');};

function b11Releasable(){if(!state.layout)return[];return['left','right'].flatMap(side=>state.layout[side].regions.map((reg,index)=>({side,index,reg}))).filter(x=>x.reg.confirmed&&(x.reg.structure||'auto')==='auto'&&x.reg.lockedWidth==null);}
doc.getElementById('storageReleaseConfirmedBtn').onclick=()=>{const list=b11Releasable();if(!list.length){toast('没有可自动放开的确认区域；明确结构需要你亲自修改');return;}pushHistory(snapshot());b06Release(list[list.length-1].reg);state.storageDemand.acknowledged=false;state.storageDemand.retested=true;draw();toast('已放开一个较弱的确认区域，并重新分配容量');};
doc.getElementById('storageGrowBtn').onclick=()=>{b11Ensure();if(!state.cabinet)return;const before=snapshot(),maxH=room.wallH-state.cabinet.z-40;if(state.cabinet.h>=maxH-5){toast('已经接近墙顶，无法再通过增高获得更多容量');return;}pushHistory(before);state.cabinet.h=Math.min(maxH,state.cabinet.h+360);state.storageDemand.acknowledged=false;state.storageDemand.retested=true;draw();toast('已增加一层可用高度，并重新计算容量');};
doc.getElementById('storageKeepBtn').onclick=()=>{state.storageDemand.acknowledged=true;draw();toast('已保留当前缺口；需求不会被自动减少');};

const demandState=doc.getElementById('storageDemandState'),frequencyState=doc.getElementById('storageFrequencyState'),assignedState=doc.getElementById('storageAssignedState'),capacityState=doc.getElementById('storageCapacityState'),shortageState=doc.getElementById('storageShortageState'),regionsState=doc.getElementById('storageRegionsState'),meter=doc.getElementById('storageMeter');
const stepAnchor=doc.getElementById('stepStorageAnchor'),stepAllocate=doc.getElementById('stepStorageAllocate'),stepResolve=doc.getElementById('stepStorageResolve'),stepRetest=doc.getElementById('stepStorageRetest'),conflictText=doc.getElementById('storageConflictText');
const b11BaseUpdate=updateUI;
updateUI=function(){b11Ensure();b11Recompute();b11BaseUpdate();const s=state.storageDemand,d=b11Demand();demandState.textContent=s.anchor?`${d.label} · ${d.count} 件${s.locked?' · 已锁定':''}`:'等待加入';frequencyState.textContent=s.anchor?d.frequency:'—';assignedState.textContent=String(s.assigned);capacityState.textContent=String(s.capacity);shortageState.textContent=s.shortage?`缺 ${s.shortage}`:'0';regionsState.textContent=String(s.assignments.length);meter.style.width=`${s.anchor?Math.min(100,s.assigned/d.count*100):0}%`;stepAnchor.classList.toggle('on',s.anchor);stepAllocate.classList.toggle('on',s.anchor&&s.assignments.length>0);stepResolve.classList.toggle('on',s.shortage>0||s.retested);stepRetest.classList.toggle('on',s.retested&&!s.shortage);storagePanel.classList.toggle('show',s.anchor&&s.shortage>0&&!s.acknowledged);if(s.shortage>0)conflictText.textContent=`需要容纳 ${d.count} 件，目前只分配 ${s.assigned} 件，还缺 ${s.shortage} 件。系统不会减少需求，也不会擅自改掉已确认或明确结构。`;
  if(s.anchor&&s.shortage>0)promptEl.textContent='容量不足：需求完整保留，请决定释放局部、增加高度或接受缺口';else if(s.anchor&&!s.hasAction)promptEl.textContent='点击书籍与文件箱，明确数量和使用频率';else if(s.anchor&&s.retested)promptEl.textContent='容量需求已复验：推拉、移动门洞或锚点后仍会重新分配';
};

const b11BaseSnapshot=snapshot;
snapshot=function(){const s=b11BaseSnapshot();b11Ensure();s.storageDemand=clone(state.storageDemand);return s;};
const b11BaseRestore=restore;
restore=function(s){state.storageDemand=clone(s.storageDemand||{anchor:false,quantity:'medium',frequency:'balanced',locked:false,selected:false,acknowledged:false,hasAction:false,retested:false,assignments:[],capacity:0,assigned:0,shortage:0});b11BaseRestore(s);b11Ensure();};

function b11MarkRetest(){b11Ensure();if(!state.storageDemand.anchor)return;state.storageDemand.retested=true;state.storageDemand.acknowledged=false;draw();}
canvas.addEventListener('pointerup',()=>setTimeout(()=>{if(state.storageDemand&&state.storageDemand.anchor)b11MarkRetest();},0));
if(typeof b09HitTarget!=='undefined')b09HitTarget.addEventListener('pointerup',()=>setTimeout(b11MarkRetest,0));
const b11BaseReset=doc.getElementById('resetBtn').onclick;
doc.getElementById('resetBtn').onclick=()=>{b11BaseReset();state.storageDemand={anchor:false,quantity:'medium',frequency:'balanced',locked:false,selected:false,acknowledged:false,hasAction:false,retested:false,assignments:[],capacity:0,assigned:0,shortage:0};storageMenu.classList.remove('show');storagePanel.classList.remove('show');draw();};

const qs=new URLSearchParams(location.search);
if(qs.get('storage')==='1'||qs.get('storageConflict')==='1'){
  b11Ensure();state.storageDemand.anchor=true;state.storageDemand.quantity=qs.get('storageConflict')==='1'?'large':'medium';state.storageDemand.frequency=qs.get('storageConflict')==='1'?'frequent':'balanced';state.storageDemand.locked=qs.get('storageConflict')==='1';state.storageDemand.hasAction=true;state.storageDemand.retested=true;state.storageDemand.selected=false;state.storageDemand.acknowledged=false;
  if(qs.get('storageConflict')==='1'&&state.layout){['left','right'].forEach(side=>state.layout[side].regions.forEach((reg,i)=>{if(i===0){reg.confirmed=true;reg.confirmedStructure=b04Resolve(reg,b03Alloc()[side][i]);}}));}
}
window.__formniB11={get:()=>{b11Recompute();return clone({state,demand:b11Demand()});},quantity:q=>b11Set('quantity',q,'已更新需求规模'),frequency:f=>b11Set('frequency',f,'已更新使用频率'),recompute:b11Recompute};
draw();
})();
