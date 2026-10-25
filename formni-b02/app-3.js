function drawGrid(){
    for(let x=-3000;x<=3000;x+=500)drawLine3([x,0,0],[x,room.roomD,0],palette.grid,.65);
    for(let y=0;y<=room.roomD;y+=500)drawLine3([room.leftX,y,0],[room.rightX,y,0],palette.grid,.65);
  }
  function drawDimensions(c){
    if(!c)return;const x0=c.x-c.w/2,x1=c.x+c.w/2,y=c.y+c.d+110,z=c.z;
    dimLine([x0,y,z+40],[x1,y,z+40],mm(c.w),'#5d6865');
    dimLine([x1+110,c.y+c.d,z],[x1+110,c.y+c.d,z+c.h],mm(c.h),'#5d6865');
    dimLine([x1+180,c.y,z+120],[x1+180,c.y+c.d,z+120],mm(c.d),'#5d6865');
  }
  function dimLine(a,b,label,color){
    const p=project(a),q=project(b);if(!p||!q)return;ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);const ang=Math.atan2(q.y-p.y,q.x-p.x);const tx=(p.x+q.x)/2,ty=(p.y+q.y)/2;ctx.translate(tx,ty);ctx.rotate(ang);ctx.font='600 11px Inter, sans-serif';const m=ctx.measureText(label);ctx.fillStyle='rgba(250,251,249,.9)';ctx.fillRect(-m.width/2-6,-17,m.width+12,18);ctx.fillStyle=color;ctx.fillText(label,-m.width/2,-4);ctx.restore();
  }

  function handleWorld(c,id){
    const x0=c.x-c.w/2,x1=c.x+c.w/2,y0=c.y,y1=c.y+c.d,z0=c.z,z1=c.z+c.h;
    if(id==='left')return[x0,y1+72,z0+c.h*.52];
    if(id==='right')return[x1,y1+72,z0+c.h*.52];
    if(id==='top')return[c.x,y1+72,z1];
    if(id==='bottom')return[c.x,y1+72,z0];
    if(id==='front')return[c.x,y1+92,z0+c.h*.20];
    return[c.x,y0-92,z0+c.h*.20];
  }
  function handleData(){
    if(!state.cabinet)return[];
    const map=[
      ['left','width','#c8564d','宽'],['right','width','#c8564d','宽'],
      ['top','height','#4b78bb','高'],['bottom','height','#4b78bb','高'],
      ['front','depth','#4f916e','深'],['back','depth','#4f916e','深']
    ];
    return map.map(([id,axis,color,label])=>({id,axis,color,label,world:handleWorld(state.cabinet,id),screen:project(handleWorld(state.cabinet,id))})).filter(h=>h.screen);
  }
  function cursorForHandle(id){
    if(id==='left'||id==='right')return'ew-resize';
    if(id==='top'||id==='bottom')return'ns-resize';
    return'nesw-resize';
  }
  function drawHandles(){
    if(!state.cabinet||anim)return;
    for(const h of handleData()){
      const r=state.activeHandle===h.id?10:8;ctx.save();ctx.beginPath();ctx.arc(h.screen.x,h.screen.y,r+5,0,Math.PI*2);ctx.fillStyle='rgba(250,251,249,.9)';ctx.fill();ctx.beginPath();ctx.arc(h.screen.x,h.screen.y,r,0,Math.PI*2);ctx.fillStyle=h.color;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();ctx.font='700 9px Inter, sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(h.label,h.screen.x,h.screen.y+.5);ctx.restore();
    }
  }

  const SNAP_DIMENSIONS={
    width:[800,900,1000,1200,1500,1800,2000,2200,2400,2700,3000,3200,3400,3600,4000,4200,4500,4800,5000,5400,5600,6000],
    height:[500,600,750,900,1050,1200,1500,1800,2100,2250,2400,2550,2700,2850,3000],
    depth:[260,300,350,400,420,450,500,550,600,650,700,760]
  };
  function chooseSnap(raw,candidates,threshold){
    let best=null;
    for(const c of candidates){const d=Math.abs(raw-c.value);if(d<=threshold&&(!best||d<best.distance))best={...c,distance:d};}
    return best;
  }
  function dimensionCandidates(fixed,direction,kind,rawEdge){
    const list=[];const grid=kind==='width'?100:50;
    const add=(value,label)=>{if(Number.isFinite(value))list.push({value,label});};
    const rawDim=Math.abs(rawEdge-fixed);const gridDim=Math.max(grid,Math.round(rawDim/grid)*grid);
    add(fixed+direction*gridDim,`${kind==='width'?'宽':kind==='height'?'高':'深'} ${mm(gridDim)}`);
    for(const dim of SNAP_DIMENSIONS[kind])add(fixed+direction*dim,`${kind==='width'?'宽':kind==='height'?'高':'深'} ${mm(dim)}`);
    return list;
  }
  function setSnap(snap,axis,point){state.snap=snap?{...snap,axis,point}:null;}
  function drawSnapGuide(){
    const s=state.snap;if(!s)return;
    const color='#32777c';
    if(s.axis==='x')drawLine3([s.value,0,0],[s.value,0,room.wallH],color,2,[8,6]);
    else if(s.axis==='z')drawLine3([room.leftX,0,s.value],[room.rightX,0,s.value],color,2,[8,6]);
    else drawLine3([room.leftX,s.value,0],[room.rightX,s.value,0],color,2,[8,6]);
    const p=project(s.point);if(!p)return;
    ctx.save();ctx.font='700 11px Inter, sans-serif';const m=ctx.measureText(s.label);ctx.fillStyle='rgba(50,119,124,.94)';ctx.fillRect(p.x-m.width/2-8,p.y-29,m.width+16,21);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(s.label,p.x,p.y-14);ctx.restore();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#f4f7f5';ctx.fillRect(0,0,W,H);
    const faces=[...makeRoomFaces()];if(state.cabinet)faces.push(...cabinetFaces(state.cabinet));faces.push(...tvFaces(state.tv));
    faces.sort((a,b)=>polyDepth(b.vertices)-polyDepth(a.vertices));faces.forEach(drawFace);drawGrid();
    drawLine3([room.leftX,0,0],[room.rightX,0,0],palette.dark,1.3);drawSnapGuide();
    if(state.hoverWall&&!state.cabinet){
      const poly=wallPolygon();if(poly.length===4){ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);poly.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.strokeStyle='#32777c';ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.stroke();ctx.restore();}
    }
    drawTVOutline();
    if(state.cabinet){drawDimensions(state.cabinet);drawHandles();}
    updateUI();
  }
  function updateUI(){
    const c=state.cabinet;
    wallState.textContent=c?'已选择 6000 × 3000':'等待选择';
    widthState.textContent=c?mm(c.w):'—';heightState.textContent=c?mm(c.h):'—';depthState.textContent=c?mm(c.d):'—';
    bottomState.textContent=c?mm(c.z):'—';backState.textContent=c?(Math.abs(c.y)<1?'贴墙':`离墙 ${mm(c.y)}`):'—';
    tvState.textContent=state.tv.anchor?'已确认 · 高优先级':'等待点击';
    tvPositionState.textContent=`X ${mm(state.tv.x)} · 底标高 ${mm(state.tv.z)}`;
    if(c){const r=cabinetRule(c);structureState.textContent=state.tv.anchor?'电视墙重组 · 锚点保留':`${r.n} 格${r.topBand?' · 顶部储物带':''}`;}else structureState.textContent='尚未生成';
    stepWall.classList.toggle('on',state.hoverWall||!!c);stepSeed.classList.toggle('on',!!c);stepAnchor.classList.toggle('on',state.tv.anchor);stepShape.classList.toggle('on',state.hasShaped);
    if(!c)promptEl.textContent=state.hoverWall?'点击这面墙，生成第一稿':'移动到墙面，点击生成第一稿';
    else if(state.snap)promptEl.textContent=`已吸附：${state.snap.label}`;
    else if(pointer.down&&pointer.mode==='tv')promptEl.textContent='正在移动电视：周围柜体实时重新组织';
    else if(state.hoverTV&&!state.tv.anchor)promptEl.textContent='点击电视，让整组围绕它重新设计';
    else if(state.hoverTV&&state.tv.anchor)promptEl.textContent='拖动电视：锚点位置变化，周围结构实时适配';
    else if(state.activeHandle==='left'||state.activeHandle==='right')promptEl.textContent=state.tv.anchor?'正在推拉宽度：电视保持，剩余空间重新分配':'正在推拉左右边界：柜格实时重新组织';
    else if(state.activeHandle==='top'||state.activeHandle==='bottom')promptEl.textContent=state.tv.anchor?'正在推拉高度：电视净空持续保护':'正在推拉上下边界：高度结构实时变化';
    else if(state.activeHandle==='front'||state.activeHandle==='back')promptEl.textContent=state.tv.anchor?'正在推拉进深：电视仍保持墙面关系':'正在推拉前后边界：进深变化，板厚保持';
    else promptEl.textContent=state.tv.anchor?'电视已成为锚点 · 拖动电视或六向推拉继续设计':'下一步：点击电视，把它变成功能锚点';
    undoBtn.disabled=!history.length;redoBtn.disabled=!future.length;
  }
  function toast(msg){clearTimeout(toastTimer);toastEl.textContent=msg;toastEl.classList.add('show');toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1500)}
  function snapshot(){return clone({cabinet:state.cabinet,tv:state.tv,hasShaped:state.hasShaped,camera});}
  function restore(s){state.cabinet=clone(s.cabinet);state.tv=clone(s.tv||DEFAULT_TV);state.hasShaped=!!s.hasShaped;camera=clone(s.camera);state.activeHandle=null;state.hoverTV=false;state.snap=null;anim=null;draw();}
  function pushHistory(s){history.push(clone(s));if(history.length>50)history.shift();future=[];}
  undoBtn.onclick=()=>{if(!history.length)return;future.push(snapshot());restore(history.pop());};
  redoBtn.onclick=()=>{if(!future.length)return;history.push(snapshot());restore(future.pop());};
  document.getElementById('viewBtn').onclick=()=>{camera={...cameraDefault,target:[...cameraDefault.target]};draw();};
  document.getElementById('resetBtn').onclick=()=>{pushHistory(snapshot());state={cabinet:null,hoverWall:false,hoverTV:false,activeHandle:null,hasShaped:false,snap:null,tv:clone(DEFAULT_TV)};anim=null;draw();toast('已回到选择墙面');};

  function generateSeed(){
    pushHistory(snapshot());
    const target={x:0,y:0,z:0,w:3600,h:2100,d:420};const start={x:0,y:0,z:0,w:500,h:420,d:120};state.cabinet=clone(start);state.tv=clone(DEFAULT_TV);state.hoverWall=false;state.hoverTV=false;
    anim={start:performance.now(),duration:460,from:start,to:target};toast('已根据墙面生成第一稿');requestAnimationFrame(animateSeed);
  }
  function animateSeed(now){
    if(!anim)return;const t=clamp((now-anim.start)/anim.duration,0,1);const e=1-Math.pow(1-t,3);
    for(const k of ['x','w','h','d'])state.cabinet[k]=lerp(anim.from[k],anim.to[k],e);draw();
    if(t<1)requestAnimationFrame(animateSeed);else{state.cabinet=clone(anim.to);anim=null;draw();}
  }
