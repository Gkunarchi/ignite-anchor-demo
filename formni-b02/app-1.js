'use strict';
  const canvas=document.getElementById('canvas');
  const viewport=document.getElementById('viewport');
  const ctx=canvas.getContext('2d');
  const promptEl=document.getElementById('prompt');
  const toastEl=document.getElementById('toast');
  const wallState=document.getElementById('wallState');
  const widthState=document.getElementById('widthState');
  const heightState=document.getElementById('heightState');
  const depthState=document.getElementById('depthState');
  const bottomState=document.getElementById('bottomState');
  const backState=document.getElementById('backState');
  const structureState=document.getElementById('structureState');
  const stepWall=document.getElementById('stepWall');
  const stepSeed=document.getElementById('stepSeed');
  const stepAnchor=document.getElementById('stepAnchor');
  const stepShape=document.getElementById('stepShape');
  const tvState=document.getElementById('tvState');
  const tvPositionState=document.getElementById('tvPositionState');
  const undoBtn=document.getElementById('undoBtn');
  const redoBtn=document.getElementById('redoBtn');

  const DPR=()=>Math.min(window.devicePixelRatio||1,2);
  let W=1,H=1;
  const room={wallW:6000,wallH:3000,roomD:4800,leftX:-3000,rightX:3000};
  const cameraDefault={yaw:-.34,pitch:.20,dist:7800,target:[0,750,1250]};
  let camera={...cameraDefault,target:[...cameraDefault.target]};
  const DEFAULT_TV={x:0,z:1080,w:1240,h:700,anchor:false,locked:false};
  let state={cabinet:null,hoverWall:false,hoverTV:false,activeHandle:null,hasShaped:false,snap:null,tv:{...DEFAULT_TV}};
  let history=[],future=[];
  let pointer={down:false,start:[0,0],last:[0,0],mode:null,moved:false,handle:null,startCabinet:null,startTV:null,startCamera:null,clickWall:false,wasAnchor:false};
  let anim=null;
  let toastTimer=null;

  const V={
    add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
    sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
    mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
    dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
    cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
    len:a=>Math.hypot(a[0],a[1],a[2]),
    norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const mm=v=>`${Math.round(v/10)*10} mm`;

  function resize(){
    const r=viewport.getBoundingClientRect(); W=Math.max(1,Math.floor(r.width));H=Math.max(1,Math.floor(r.height));
    const d=DPR(); canvas.width=Math.floor(W*d);canvas.height=Math.floor(H*d);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(d,0,0,d,0,0);draw();
  }
  window.addEventListener('resize',resize);

  function camBasis(){
    const horiz=Math.cos(camera.pitch)*camera.dist;
    const pos=[camera.target[0]+Math.sin(camera.yaw)*horiz,camera.target[1]+Math.cos(camera.yaw)*horiz,camera.target[2]+Math.sin(camera.pitch)*camera.dist];
    const forward=V.norm(V.sub(camera.target,pos));
    const right=V.norm(V.cross(forward,[0,0,1]));
    const up=V.cross(right,forward);
    return{pos,forward,right,up};
  }
  function project(p){
    const b=camBasis();const rel=V.sub(p,b.pos);const z=V.dot(rel,b.forward);if(z<20)return null;
    const vx=V.dot(rel,b.right),vy=V.dot(rel,b.up);const focal=Math.min(W,H)*1.03;const s=focal/z;
    return{x:W/2+vx*s,y:H/2-vy*s,z,scale:s};
  }
  function screenAxis(origin,delta){
    const a=project(origin),b=project(V.add(origin,delta));if(!a||!b)return{x:1,y:0,pxPerUnit:.1};
    const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;return{x:dx/l,y:dy/l,pxPerUnit:l/V.len(delta)};
  }
  function pointInPoly(pt,poly){
    let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];if(((a.y>pt[1])!==(b.y>pt[1]))&&(pt[0]<(b.x-a.x)*(pt[1]-a.y)/(b.y-a.y+1e-9)+a.x))c=!c;
    }return c;
  }
  function dist2(a,b){return Math.hypot(a[0]-b.x,a[1]-b.y)}

  const palette={
    wall:'#edf1ee',wallSide:'#dfe6e2',wallEdge:'#9aa8a3',floor:'#e6ebe8',grid:'#cad3cf',
    board:'#e5e3dc',boardSide:'#c9c8c1',panel:'#d3d7d2',panelAlt:'#bcc8c3',open:'#f5f6f3',edge:'#78837f',dark:'#44504d'
  };

  function face(vertices,fill,stroke=palette.edge,alpha=1,line=1){return{vertices,fill,stroke,alpha,line}}
  function boxFaces(x,y,z,w,d,h,colors={}){
    const x0=x,y0=y,z0=z,x1=x+w,y1=y+d,z1=z+h;
    const p={a:[x0,y0,z0],b:[x1,y0,z0],c:[x1,y1,z0],d:[x0,y1,z0],e:[x0,y0,z1],f:[x1,y0,z1],g:[x1,y1,z1],h:[x0,y1,z1]};
    return[
      face([p.a,p.b,p.f,p.e],colors.back||colors.side||palette.boardSide),
      face([p.b,p.c,p.g,p.f],colors.right||colors.side||palette.boardSide),
      face([p.c,p.d,p.h,p.g],colors.front||colors.main||palette.board),
      face([p.d,p.a,p.e,p.h],colors.left||colors.side||palette.boardSide),
      face([p.e,p.f,p.g,p.h],colors.top||colors.main||palette.board),
      face([p.a,p.d,p.c,p.b],colors.bottom||colors.side||palette.boardSide)
    ];
  }
  function polyDepth(vertices){const b=camBasis();return vertices.reduce((s,p)=>s+V.dot(V.sub(p,b.pos),b.forward),0)/vertices.length}
  function drawFace(f){
    const pts=f.vertices.map(project);if(pts.some(p=>!p))return;
    ctx.save();ctx.globalAlpha=f.alpha;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=f.fill;ctx.fill();ctx.strokeStyle=f.stroke;ctx.lineWidth=f.line;ctx.stroke();ctx.restore();
  }
  function drawLine3(a,b,color,width=1,dash=[]){const p=project(a),q=project(b);if(!p||!q)return;ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.restore()}

  function wallPolygon(){return [[room.leftX,0,0],[room.rightX,0,0],[room.rightX,0,room.wallH],[room.leftX,0,room.wallH]].map(project).filter(Boolean)}
  function makeRoomFaces(){
    const faces=[];
    faces.push(face([[room.leftX,0,0],[room.rightX,0,0],[room.rightX,0,room.wallH],[room.leftX,0,room.wallH]],state.hoverWall&&!state.cabinet?'#d8e7e4':palette.wall,palette.wallEdge,1,1.1));
    faces.push(face([[room.leftX,0,0],[room.leftX,room.roomD,0],[room.leftX,room.roomD,room.wallH],[room.leftX,0,room.wallH]],palette.wallSide,palette.wallEdge,1,1));
    faces.push(face([[room.rightX,0,0],[room.rightX,0,room.wallH],[room.rightX,room.roomD,room.wallH],[room.rightX,room.roomD,0]],'#e7ece9',palette.wallEdge,1,1));
    faces.push(face([[room.leftX,0,0],[room.leftX,room.roomD,0],[room.rightX,room.roomD,0],[room.rightX,0,0]],palette.floor,palette.wallEdge,1,1));
    return faces;
  }
