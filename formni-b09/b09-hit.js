// B09 书桌独立命中层：避免既有功能区先截获书桌点击与拖动。
const b09HitTarget=document.createElement('div');
Object.assign(b09HitTarget.style,{position:'absolute',display:'none',zIndex:'18',background:'transparent',touchAction:'none',userSelect:'none'});
b09HitTarget.setAttribute('aria-label','书桌功能锚点');
viewport.appendChild(b09HitTarget);
function b09PositionHitTarget(){
  const p=b09DeskPoly();
  if(p.length!==4){b09HitTarget.style.display='none';return;}
  const xs=p.map(q=>q.x),ys=p.map(q=>q.y),pad=8;
  const left=Math.max(0,Math.min(...xs)-pad),top=Math.max(0,Math.min(...ys)-pad);
  const right=Math.min(W,Math.max(...xs)+pad),bottom=Math.min(H,Math.max(...ys)+pad);
  Object.assign(b09HitTarget.style,{display:'block',left:left+'px',top:top+'px',width:Math.max(18,right-left)+'px',height:Math.max(18,bottom-top)+'px',cursor:state.desk.anchor?(state.desk.locked?'pointer':'move'):'pointer'});
}
const b09HitBaseDraw=draw;
draw=function(){b09HitBaseDraw();b09PositionHitTarget();};
function b09HitLocal(ev){const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
function b09FinishHitDrag(){
  const wasAnchor=b09Pointer.startDesk.anchor;
  if(b09Pointer.moved&&!state.desk.locked){
    pushHistory(b09Pointer.pre);state.desk.anchor=true;state.hasMultiAnchorAction=true;state.hasMultiRelation=true;state.multiRetested=wasAnchor;toast(wasAnchor?'书桌位置已更新；剩余区域重新分配':'书桌已成为第二个功能锚点');
  }else if(!wasAnchor){
    if(!state.tv.anchor){state.desk=clone(b09Pointer.startDesk);toast('先点击电视，再加入书桌锚点');}
    else{const side=state.desk.x<state.tv.x?'left':'right';if(b09SetDeskSide(side,false)){pushHistory(b09Pointer.pre);state.desk.anchor=true;state.hasMultiAnchorAction=true;state.hasMultiRelation=true;toast('书桌已成为第二个功能锚点');}}
  }else state.selectedDesk=true;
  Object.assign(b09Pointer,{down:false,startDesk:null,pre:null,moved:false});state.snap=null;draw();
}
b09HitTarget.addEventListener('pointerenter',()=>{state.hoverDesk=true;draw();});
b09HitTarget.addEventListener('pointerleave',()=>{if(!b09Pointer.down){state.hoverDesk=false;draw();}});
b09HitTarget.addEventListener('pointerdown',ev=>{
  ev.preventDefault();ev.stopPropagation();b09HitTarget.setPointerCapture(ev.pointerId);
  const pt=b09HitLocal(ev);Object.assign(b09Pointer,{down:true,hover:true,start:pt,startDesk:clone(state.desk),pre:snapshot(),moved:false});state.selectedDesk=false;state.snap=null;draw();
});
b09HitTarget.addEventListener('pointermove',ev=>{
  if(!b09Pointer.down)return;ev.preventDefault();ev.stopPropagation();const pt=b09HitLocal(ev);
  if(Math.hypot(pt[0]-b09Pointer.start[0],pt[1]-b09Pointer.start[1])>3)b09Pointer.moved=true;
  if(state.desk.locked)return;
  const start=b09Pointer.startDesk,origin=[start.x,b09DeskY()+start.d+60,start.z+start.h*.55],axis=screenAxis(origin,[1000,0,0]);
  const delta=((pt[0]-b09Pointer.start[0])*axis.x+(pt[1]-b09Pointer.start[1])*axis.y)/(axis.pxPerUnit||.1);
  if(b09MoveDesk(start.x+delta)){state.hasMultiAnchorAction=true;state.hasMultiRelation=true;state.multiRetested=false;draw();}
});
b09HitTarget.addEventListener('pointerup',ev=>{if(!b09Pointer.down)return;ev.preventDefault();ev.stopPropagation();b09FinishHitDrag();});
b09HitTarget.addEventListener('pointercancel',ev=>{if(!b09Pointer.down)return;ev.stopPropagation();if(b09Pointer.pre)restore(b09Pointer.pre);Object.assign(b09Pointer,{down:false,startDesk:null,pre:null,moved:false});state.snap=null;draw();});
draw();
