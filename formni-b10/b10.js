// Formni B10 — 使用行为与动线。依赖 B02–B09 与 b09-hit.js。
(function(){
'use strict';

// ---------- 动态界面 ----------
const doc=document;
const brand=doc.querySelector('.brand');
const title=doc.querySelector('header .title');
const topNote=doc.querySelector('.top-note');
if(brand)brand.textContent='FORMNI / B10';
if(title)title.textContent='使用行为与动线 · 不只放下物件，还要保证人能使用、能通行';
if(topNote)topNote.innerHTML='<b>B10 · 使用行为与操作净空</b><span>书桌产生使用区，门洞产生通行带；移动场地与锚点时持续避让</span>';

const style=doc.createElement('style');
style.textContent=`
.activity-dot{width:8px;height:8px;border-radius:50%;background:#2f8f82}.passage-dot{width:8px;height:8px;border-radius:50%;background:#5d76b6}
.activity-card{border-color:rgba(47,143,130,.25);background:rgba(247,253,251,.97)}
.activity-menu-label{padding:8px 4px 6px;font-size:10px;color:#74807d;border-top:1px solid rgba(30,41,40,.08);margin-top:8px}
.activity-actions button.active{background:#2f8f82;color:#fff;border-color:#2f8f82}.activity-actions button.auto-active{background:#dff1ed;color:#245e57;border-color:rgba(47,143,130,.35)}
.activity-panel{position:absolute;left:50%;top:72px;transform:translate(-50%,-12px);width:min(520px,calc(100% - 36px));padding:14px 15px;border-radius:15px;background:rgba(255,249,247,.98);border:1px solid rgba(189,81,71,.35);box-shadow:0 18px 50px rgba(95,35,31,.18);z-index:36;opacity:0;pointer-events:none;transition:.18s}
.activity-panel.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}.activity-head{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:780;color:#8d332c}.activity-text{font-size:11px;line-height:1.55;color:#6f4b47;margin:7px 0 10px}.activity-panel .conflict-actions{display:flex;gap:7px;flex-wrap:wrap}.activity-panel .conflict-actions button{height:31px;font-size:11px}.activity-panel .primary{background:#2f8f82;color:#fff;border-color:#2f8f82}.activity-panel .soft{background:#fff2ef;color:#8d332c;border-color:rgba(189,81,71,.25)}
.activity-meter{height:7px;background:#e4eeeb;border-radius:999px;overflow:hidden;margin-top:8px}.activity-meter span{display:block;height:100%;background:#2f8f82;transition:.18s}
`;
doc.head.appendChild(style);

const legend=doc.querySelector('.axis-legend');
if(legend){
  const a=doc.createElement('div');a.className='axis-chip';a.innerHTML='<i class="activity-dot"></i>使用区';legend.appendChild(a);
  const p=doc.createElement('div');p.className='axis-chip';p.innerHTML='<i class="passage-dot"></i>通行带';legend.appendChild(p);
}

const deskMenu=doc.getElementById('deskMenu');
if(deskMenu){
  deskMenu.style.width='232px';
  const label=doc.createElement('div');label.className='activity-menu-label';label.textContent='书桌前的人体使用净空';deskMenu.appendChild(label);
  const actions=doc.createElement('div');actions.className='menu-actions activity-actions';
  actions.innerHTML='<button id="activityAutoBtn">系统判断</button><button id="activityCompactBtn">紧凑</button><button id="activityComfortBtn">舒适</button><button id="activityGenerousBtn">宽松</button><button id="activityAvoidBtn">自动避让</button>';
  deskMenu.appendChild(actions);
}

const viewportEl=doc.getElementById('viewport');
const activityPanel=doc.createElement('div');
activityPanel.id='activityPanel';activityPanel.className='activity-panel';
activityPanel.innerHTML='<div class="activity-head"><i class="constraint-dot"></i><span>使用区与通行带发生冲突</span></div><div class="activity-text" id="activityConflictText">当前关系无法同时满足。</div><div class="conflict-actions"><button id="activityMoveBtn" class="primary">让书桌自动避让</button><button id="activityCompactResolveBtn" class="soft">改为紧凑净空</button><button id="activityRestoreBtn">恢复上个合法状态</button></div>';
viewportEl.appendChild(activityPanel);

const side=doc.querySelector('.side');
const firstCard=side&&side.querySelector('.card');
if(firstCard){
  firstCard.innerHTML='<h3>本轮行为链</h3><div class="steps">\
  <div class="step" id="stepActivityZone"><div class="n">1</div><div><b>生成使用区</b><span>书桌不只是物件，它前方需要人的工作空间</span></div></div>\
  <div class="step" id="stepPassage"><div class="n">2</div><div><b>识别通行带</b><span>门洞进入房间的路径不能被家具和使用区侵占</span></div></div>\
  <div class="step" id="stepActivityResolve"><div class="n">3</div><div><b>自动避让或解释冲突</b><span>弱假设可调整，明确意图必须先征得用户同意</span></div></div>\
  <div class="step" id="stepActivityRetest"><div class="n">4</div><div><b>继续推拉复验</b><span>移动书桌、门洞或外框，行为净空持续成立</span></div></div></div>';
}

if(side){
  const card=doc.createElement('div');card.className='card activity-card';
  card.innerHTML='<h3>使用行为状态</h3><div class="state">\
    <div class="row"><span>书桌使用区</span><strong id="activityProfileState">—</strong></div>\
    <div class="row"><span>前方净深</span><strong id="activityDepthState">—</strong></div>\
    <div class="row"><span>门洞通行带</span><strong id="activityPassageState">—</strong></div>\
    <div class="row"><span>自动避让</span><strong id="activityAvoidState">开启</strong></div>\
    <div class="row"><span>当前结果</span><strong id="activityResultState">等待锚点</strong></div>\
  </div><div class="activity-meter"><span id="activityMeter" style="width:0"></span></div>';
  if(firstCard&&firstCard.nextSibling)side.insertBefore(card,firstCard.nextSibling);else side.appendChild(card);
  const ruleCards=[...side.querySelectorAll('.card')].filter(c=>c.querySelector('h3')&&c.querySelector('h3').textContent==='本轮规则');
  if(ruleCards[0])ruleCards[0].innerHTML='<h3>本轮规则</h3><div class="rule"><b>物件不等于功能：</b>书桌进入方案后，必须同时保留坐姿、起身和椅子移动所需空间。<br><b>通行优先：</b>门洞进入房间的连续通路属于场地硬条件。<br><b>自动避让：</b>系统假设可换侧、移动或从舒适降为紧凑；明确净空、明确左右关系和锁定位置不能被偷偷改掉。<br><b>实时反馈：</b>拖动过程中显示使用区、通行带与冲突，不等松手才发现。</div>';
  const footer=side.querySelector('.footer');if(footer)footer.textContent='本轮只验证“人怎么使用空间”，不增加新的柜型、材质、五金或生产数据。';
}

const activityAuto=doc.getElementById('activityAutoBtn');
const activityCompact=doc.getElementById('activityCompactBtn');
const activityComfort=doc.getElementById('activityComfortBtn');
const activityGenerous=doc.getElementById('activityGenerousBtn');
const activityAvoid=doc.getElementById('activityAvoidBtn');
const activityMove=doc.getElementById('activityMoveBtn');
const activityCompactResolve=doc.getElementById('activityCompactResolveBtn');
const activityRestore=doc.getElementById('activityRestoreBtn');
const activityConflictText=doc.getElementById('activityConflictText');
const activityProfileState=doc.getElementById('activityProfileState');
const activityDepthState=doc.getElementById('activityDepthState');
const activityPassageState=doc.getElementById('activityPassageState');
const activityAvoidState=doc.getElementById('activityAvoidState');
const activityResultState=doc.getElementById('activityResultState');
const activityMeter=doc.getElementById('activityMeter');
const stepActivityZone=doc.getElementById('stepActivityZone');
const stepPassage=doc.getElementById('stepPassage');
const stepActivityResolve=doc.getElementById('stepActivityResolve');
const stepActivityRetest=doc.getElementById('stepActivityRetest');

const B10_PROFILES={
  compact:{label:'紧凑',depth:700,side:80},
  comfort:{label:'舒适',depth:900,side:160},
  generous:{label:'宽松',depth:1100,side:240}
};
const B10_PASSAGE=900;

function b10Ensure(){
  b09Ensure();
  if(!state.activity)state.activity={profile:'comfort',profileExplicit:false,autoAvoid:true,conflict:null,lastValid:null,hasAction:false,retested:false,autoMoved:false};
  const a=state.activity;
  if(!B10_PROFILES[a.profile])a.profile='comfort';
  if(a.profileExplicit==null)a.profileExplicit=false;
  if(a.autoAvoid==null)a.autoAvoid=true;
  if(a.hasAction==null)a.hasAction=false;
  if(a.retested==null)a.retested=false;
  if(a.autoMoved==null)a.autoMoved=false;
}
function b10Profile(){b10Ensure();return B10_PROFILES[state.activity.profile];}
function b10Passage(){
  b10Ensure();const d=b08Door();
  return{x0:d.x-B10_PASSAGE/2,x1:d.x+B10_PASSAGE/2,y0:0,y1:room.roomD-260,w:B10_PASSAGE};
}
function b10WorkZone(){
  b10Ensure();const d=state.desk,p=b10Profile(),y0=b09DeskY()+d.d;
  return{x0:d.x-d.w/2-p.side,x1:d.x+d.w/2+p.side,y0,y1:y0+p.depth,depth:p.depth,side:p.side};
}
function b10Overlap(){
  b10Ensure();if(!state.desk.anchor)return null;
  const w=b10WorkZone(),p=b10Passage();
  const ox=Math.min(w.x1,p.x1)-Math.max(w.x0,p.x0),oy=Math.min(w.y1,p.y1)-Math.max(w.y0,p.y0);
  return ox>0&&oy>0?{x:ox,y:oy,area:ox*oy,work:w,passage:p}:null;
}
function b10RememberValid(){
  b10Ensure();if(!state.desk.anchor||b10Overlap())return;
  state.activity.lastValid={doorX:b08Door().x,desk:clone(state.desk),profile:state.activity.profile,profileExplicit:state.activity.profileExplicit};
}
function b10Conflict(reason){
  b10Ensure();const overlap=b10Overlap();
  state.activity.conflict=overlap?{reason,overlapX:overlap.x,overlapY:overlap.y}:null;
  return state.activity.conflict;
}

const b10BaseDeskRange=b09DeskRange;
b09DeskRange=function(side){
  b10Ensure();const range=b10BaseDeskRange(side);
  if(!range.valid||!state.site)return range;
  const p=b10Passage(),half=state.desk.w/2+b10Profile().side;
  if(side==='left')range.max=Math.min(range.max,p.x0-half);
  else range.min=Math.max(range.min,p.x1+half);
  range.valid=range.max>=range.min;
  return range;
};

const b10BaseRequirements=b07Requirements;
b07Requirements=function(handle=null,fixed=null){
  const base=b10BaseRequirements(handle,fixed);b10Ensure();
  if(!base||!state.desk.anchor||!state.cabinet)return base;
  const tv=b09TvBounds(),work=b10WorkZone();
  const minX=Math.min(tv.x0,work.x0)-B09_OUTER_MARGIN,maxX=Math.max(tv.x1,work.x1)+B09_OUTER_MARGIN;
  let hard=maxX-minX;
  if(handle==='right'&&Number.isFinite(fixed))hard=maxX-fixed;
  if(handle==='left'&&Number.isFinite(fixed))hard=fixed-minX;
  base.hardWidth=Math.max(base.hardWidth,Math.max(800,hard));
  base.softWidth=Math.max(base.softWidth,base.hardWidth+B03_MIN);
  base.activityZone=true;
  return base;
};

function b10TryPlace(side){
  const range=b09DeskRange(side);if(!range.valid)return false;
  state.desk.side=side;
  state.desk.x=clamp(state.desk.x,range.min,range.max);
  if(side==='left')state.desk.x=Math.min(state.desk.x,range.max);else state.desk.x=Math.max(state.desk.x,range.min);
  return !b10Overlap();
}
function b10ResolveActivity(options={}){
  b10Ensure();const a=state.activity;
  if(!state.desk.anchor){a.conflict=null;return true;}
  if(!b10Overlap()){a.conflict=null;b10RememberValid();return true;}
  const canMove=a.autoAvoid&&!state.desk.locked&&state.desk.relation==='auto';
  if(canMove){
    const current=state.desk.side,other=current==='left'?'right':'left',before=state.desk.x;
    if(b10TryPlace(current)||b10TryPlace(other)){
      a.autoMoved=a.autoMoved||Math.abs(before-state.desk.x)>1||state.desk.side!==current;
      a.conflict=null;b10RememberValid();return true;
    }
  }
  if(!a.profileExplicit&&a.profile!=='compact'){
    const old=a.profile;a.profile='compact';
    const current=state.desk.side,other=current==='left'?'right':'left';
    if(!b10Overlap()||canMove&&(b10TryPlace(current)||b10TryPlace(other))){
      a.autoMoved=true;a.conflict=null;b10RememberValid();return true;
    }
    a.profile=old;
  }
  b10Conflict(options.reason||'书桌使用区与门洞通行带重叠');
  return false;
}

function b10ZoneFace(z,fill,stroke,alpha){return face(z,fill,stroke,alpha,1.2);}
const b10BaseRoomFaces=makeRoomFaces;
makeRoomFaces=function(){
  b10Ensure();const faces=b10BaseRoomFaces();
  const p=b10Passage();faces.push(b10ZoneFace([[p.x0,p.y0,4],[p.x1,p.y0,4],[p.x1,p.y1,4],[p.x0,p.y1,4]],'#7890c8','#5d76b6',.18));
  if(state.desk.anchor){const w=b10WorkZone(),conf=!!b10Overlap();faces.push(b10ZoneFace([[w.x0,w.y0,7],[w.x1,w.y0,7],[w.x1,w.y1,7],[w.x0,w.y1,7]],conf?'#d96b61':'#52a99b',conf?'#bd5147':'#2f8f82',conf?.28:.22));}
  return faces;
};
function b10Label(rect,label,color,z=9){
  const p=project([(rect.x0+rect.x1)/2,(rect.y0+rect.y1)/2,z]);if(!p)return;
  ctx.save();ctx.font='700 10px Inter, sans-serif';const tw=ctx.measureText(label).width;ctx.fillStyle=color;ctx.fillRect(p.x-tw/2-7,p.y-23,tw+14,19);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-9);ctx.restore();
}
function b10DrawZones(){
  b10Ensure();const p=b10Passage();
  [[p.x0,p.y0,8],[p.x1,p.y0,8],[p.x1,p.y1,8],[p.x0,p.y1,8],[p.x0,p.y0,8]].forEach((q,i,a)=>{if(i<a.length-1)drawLine3(q,a[i+1],'rgba(93,118,182,.85)',1.7,[7,5]);});
  b10Label(p,'门洞通行带 900 mm','rgba(93,118,182,.92)');
  if(state.desk.anchor){const w=b10WorkZone(),conf=!!b10Overlap(),col=conf?'rgba(189,81,71,.95)':'rgba(47,143,130,.94)';
    [[w.x0,w.y0,11],[w.x1,w.y0,11],[w.x1,w.y1,11],[w.x0,w.y1,11],[w.x0,w.y0,11]].forEach((q,i,a)=>{if(i<a.length-1)drawLine3(q,a[i+1],col,2,conf?[5,4]:[]);});
    b10Label(w,`${b10Profile().label}使用区 · ${mm(w.depth)}`,col,12);
  }
}

const b10BaseDraw=draw;
draw=function(){b10Ensure();b10BaseDraw();b10DrawZones();};

const b10BaseSnapshot=snapshot;
snapshot=function(){const s=b10BaseSnapshot();b10Ensure();s.activity=clone(state.activity);return s;};
const b10BaseRestore=restore;
restore=function(s){state.activity=clone(s.activity||{profile:'comfort',profileExplicit:false,autoAvoid:true,conflict:null,lastValid:null,hasAction:false,retested:false,autoMoved:false});b10BaseRestore(s);b10Ensure();};

function b10SetProfile(profile,explicit=true){
  b10Ensure();if(!B10_PROFILES[profile])return;const pre=snapshot();
  state.activity.profile=profile;state.activity.profileExplicit=explicit;state.activity.hasAction=true;state.activity.retested=false;
  b10ResolveActivity({reason:'明确的使用净空与当前通行带冲突'});pushHistory(pre);draw();
  toast(explicit?`已明确为${B10_PROFILES[profile].label}使用区`:'使用净空交回系统判断');
}
activityAuto.onclick=()=>{b10Ensure();const pre=snapshot();state.activity.profileExplicit=false;state.activity.autoAvoid=true;state.activity.hasAction=true;state.activity.retested=false;b10ResolveActivity();pushHistory(pre);draw();toast('使用净空交回系统判断；必要时可移动或压缩系统假设');};
activityCompact.onclick=()=>b10SetProfile('compact',true);
activityComfort.onclick=()=>b10SetProfile('comfort',true);
activityGenerous.onclick=()=>b10SetProfile('generous',true);
activityAvoid.onclick=()=>{b10Ensure();pushHistory(snapshot());state.activity.autoAvoid=!state.activity.autoAvoid;state.activity.hasAction=true;state.activity.retested=false;b10ResolveActivity();draw();toast(state.activity.autoAvoid?'已开启自动避让':'已关闭自动避让；冲突将等待你的决定');};

activityMove.onclick=()=>{
  b10Ensure();const pre=snapshot();state.desk.locked=false;state.desk.relation='auto';state.activity.autoAvoid=true;
  if(b10ResolveActivity({reason:'自动换侧后仍无法满足使用区'})){pushHistory(pre);state.activity.hasAction=true;state.activity.retested=true;draw();toast('书桌已自动避让通行带');}else{restore(pre);toast('两侧都没有足够空间；需要缩小净空或改变场地');}
};
activityCompactResolve.onclick=()=>{b10Ensure();const pre=snapshot();state.activity.profile='compact';state.activity.profileExplicit=true;state.activity.autoAvoid=true;if(b10ResolveActivity({reason:'紧凑净空仍与通行带冲突'})){pushHistory(pre);state.activity.hasAction=true;state.activity.retested=true;draw();toast('已按明确指令改为紧凑使用区');}else{restore(pre);toast('改为紧凑后仍不足；请恢复场地或放开位置关系');}};
activityRestore.onclick=()=>{b10Ensure();const v=state.activity.lastValid;if(!v){toast('还没有可恢复的合法状态');return;}pushHistory(snapshot());b08Door().x=v.doorX;state.desk=clone(v.desk);state.activity.profile=v.profile;state.activity.profileExplicit=v.profileExplicit;state.activity.conflict=null;state.activity.retested=true;b08FitCabinet();draw();toast('已恢复到上一个合法的场地与使用关系');};

const b10BaseDeskMenuPosition=b09DeskMenuPosition;
b09DeskMenuPosition=function(){b10Ensure();b10BaseDeskMenuPosition();[activityAuto,activityCompact,activityComfort,activityGenerous,activityAvoid].forEach(b=>b.classList.remove('active','auto-active'));if(state.selectedDesk&&state.desk.anchor){(state.activity.profileExplicit?{compact:activityCompact,comfort:activityComfort,generous:activityGenerous}[state.activity.profile]:activityAuto).classList.add(state.activity.profileExplicit?'active':'auto-active');if(state.activity.autoAvoid)activityAvoid.classList.add('active');const top=parseFloat(b09DeskMenu.style.top)||60;b09DeskMenu.style.top=clamp(top,12,Math.max(12,H-b09DeskMenu.offsetHeight-12))+'px';}};

const b10BaseUpdate=updateUI;
updateUI=function(){
  b10Ensure();b10BaseUpdate();const a=state.activity,p=b10Profile(),conf=b10Overlap();
  activityProfileState.textContent=`${p.label}${a.profileExplicit?' · 明确':' · 系统假设'}`;
  activityDepthState.textContent=mm(p.depth);activityPassageState.textContent=mm(B10_PASSAGE);activityAvoidState.textContent=a.autoAvoid?'开启':'关闭';
  activityResultState.textContent=!state.desk.anchor?'等待书桌锚点':conf?'冲突，等待处理':a.autoMoved?'已自动避让':'条件成立';
  activityMeter.style.width=`${!state.desk.anchor?0:conf?35:a.profile==='compact'?60:a.profile==='comfort'?80:100}%`;
  stepActivityZone.classList.toggle('on',!!state.desk.anchor);stepPassage.classList.toggle('on',!!state.site);stepActivityResolve.classList.toggle('on',!!a.hasAction||!!a.autoMoved||!!conf);stepActivityRetest.classList.toggle('on',!!a.retested);
  activityPanel.classList.toggle('show',!!conf);if(conf)activityConflictText.textContent=`${p.label}使用区与 900 mm 通行带重叠约 ${mm(conf.x)}。${a.profileExplicit?'该净空由你明确，系统不会偷偷缩小。':'当前净空仍是系统假设，可自动移动或降为紧凑。'}`;
  [activityAuto,activityCompact,activityComfort,activityGenerous,activityAvoid].forEach(b=>b&&b.classList.remove('active','auto-active'));
  if(state.selectedDesk&&state.desk.anchor){const active=a.profileExplicit?{compact:activityCompact,comfort:activityComfort,generous:activityGenerous}[a.profile]:activityAuto;if(active)active.classList.add(a.profileExplicit?'active':'auto-active');if(a.autoAvoid)activityAvoid.classList.add('active');}
  if(conf)promptEl.textContent='使用行为冲突：书桌、门洞和净空不能同时成立，请选择处理方式';
  else if(state.desk.anchor&&!a.hasAction)promptEl.textContent='书桌已产生人体使用区；点击书桌可以明确紧凑、舒适或宽松';
  else if(a.retested)promptEl.textContent='行为净空已复验：移动锚点、门洞或外框后仍保持';
};

// 场地、锚点与外框变化后实时复算。
function b10AfterGeometryChange(reason){
  b10Ensure();if(!state.desk.anchor)return;
  const before=!!state.activity.conflict;b10ResolveActivity({reason});const after=!!state.activity.conflict;
  if(!after)state.activity.retested=state.activity.hasAction||state.activity.autoMoved;
  if(before!==after||state.activity.autoMoved)draw();
}
canvas.addEventListener('pointermove',()=>{
  if(b08Pointer&&b08Pointer.down)b10AfterGeometryChange('门洞移动后，通行带与使用区冲突');
  else if(pointer&&pointer.down&&(pointer.mode==='resize'||pointer.mode==='tv'))b10AfterGeometryChange('外框或电视变化后，使用区无法继续成立');
},true);
canvas.addEventListener('pointerup',()=>setTimeout(()=>{if(state.desk&&state.desk.anchor){b10AfterGeometryChange('操作完成后发现行为净空冲突');state.activity.retested=!state.activity.conflict&&!!state.activity.hasAction;draw();}},0));
if(typeof b09HitTarget!=='undefined')b09HitTarget.addEventListener('pointerup',()=>setTimeout(()=>{b10AfterGeometryChange('书桌移动后，使用区与通行带冲突');state.activity.retested=!state.activity.conflict;draw();},0));

const b10BaseReset=doc.getElementById('resetBtn').onclick;
doc.getElementById('resetBtn').onclick=()=>{b10BaseReset();state.activity={profile:'comfort',profileExplicit:false,autoAvoid:true,conflict:null,lastValid:null,hasAction:false,retested:false,autoMoved:false};activityPanel.classList.remove('show');draw();};

const qs=new URLSearchParams(location.search);
if(qs.get('activity')==='1'||qs.get('activityConflict')==='1'){
  state.site={door:clone(B08_DEFAULT_DOOR),hasMoved:true,retested:true,fitCount:1};
  const i=b08Interval();state.cabinet={x:(i.x0+i.x1)/2,y:0,z:0,w:i.x1-i.x0,h:2700,d:520};
  state.tv={...DEFAULT_TV,x:-160,z:1080,anchor:true};state.layout=b03Default();
  state.layout.left.regions=[b03New(),b03New()];state.layout.right.regions=[b03New()];
  state.layout.left.regions[0].structure='open';state.layout.left.regions[0].facadeRole='focus';state.layout.left.regions[1].structure='auto';state.layout.right.regions[0].structure='closed';state.layout.right.regions[0].facadeRole='background';
  state.facade={aligned:true,openShare:.43};state.desk={...clone(B09_DEFAULT_DESK),anchor:true,relation:'auto',side:'left'};b09SetDeskSide('left',false);
  state.hasRegionAction=true;state.hasRelation=true;state.hasStructureAction=true;state.hasFacadeAction=true;state.hasConvergenceAction=true;state.hasShaped=true;state.hasMultiAnchorAction=true;state.hasMultiRelation=true;state.multiRetested=true;
  state.activity={profile:qs.get('activityConflict')==='1'?'generous':'comfort',profileExplicit:qs.get('activityConflict')==='1',autoAvoid:qs.get('activityConflict')!=='1',conflict:null,lastValid:null,hasAction:true,retested:true,autoMoved:false};
  if(qs.get('activityConflict')==='1'){
    state.desk.relation='right';state.desk.side='right';state.desk.x=1450;state.site.door.x=2100;b08FitCabinet();b10Conflict('明确的宽松使用区与门洞通行带冲突');
  }else{b10ResolveActivity();b10RememberValid();}
}

window.__formniB10={get:()=>clone({state,work:b10WorkZone(),passage:b10Passage(),overlap:b10Overlap()}),profile:p=>b10SetProfile(p,true),resolve:()=>b10ResolveActivity()};
draw();
})();