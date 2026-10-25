function tvDepth(){
    if(!state.cabinet)return 28;
    return state.tv.anchor?28:state.cabinet.y+state.cabinet.d+34;
  }
  function tvGeometry(t=state.tv){
    const y=tvDepth();
    return{x0:t.x-t.w/2,x1:t.x+t.w/2,z0:t.z,z1:t.z+t.h,y0:y,y1:y+54};
  }
  function tvFaces(t=state.tv){
    const g=tvGeometry(t);const faces=[];
    faces.push(...boxFaces(g.x0,g.y0,g.z0,t.w,54,t.h,{main:'#242b2a',side:'#111716',front:'#242b2a',top:'#343d3b'}));
    const bezel=34;
    faces.push(...boxFaces(g.x0+bezel,g.y1+2,g.z0+bezel,t.w-bezel*2,8,t.h-bezel*2,{main:'#53625f',side:'#2c3432',front:'#53625f'}));
    const standW=Math.min(360,t.w*.3);const standX=t.x-standW/2;
    faces.push(...boxFaces(standX,g.y0+8,g.z0-70,standW,28,58,{main:'#3c4744',side:'#222a28',front:'#3c4744'}));
    return faces;
  }
  function tvPolygon(){
    const g=tvGeometry();const y=g.y1+12;
    return [[g.x0,y,g.z0],[g.x1,y,g.z0],[g.x1,y,g.z1],[g.x0,y,g.z1]].map(project).filter(Boolean);
  }
  function overTV(pt){const p=tvPolygon();return p.length===4&&pointInPoly(pt,p)}
  function drawTVOutline(){
    const poly=tvPolygon();if(poly.length!==4)return;
    const active=state.tv.anchor,hover=state.hoverTV;
    if(!active&&!hover)return;
    ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);poly.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.strokeStyle=active?'#c8973b':'#32777c';ctx.lineWidth=active?3:2.5;ctx.setLineDash(active?[]:[7,5]);ctx.stroke();ctx.setLineDash([]);
    const cx=(poly[0].x+poly[2].x)/2,top=Math.min(...poly.map(p=>p.y));
    const label=active?'功能锚点 · 拖动电视':'点击电视，围绕它重新设计';ctx.font='700 11px Inter, sans-serif';const m=ctx.measureText(label);ctx.fillStyle=active?'rgba(200,151,59,.95)':'rgba(50,119,124,.94)';ctx.fillRect(cx-m.width/2-8,top-29,m.width+16,21);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,cx,top-14);ctx.restore();
  }
  function anchoredCabinetFaces(c,tv){
    const faces=[];const t=24,plinth=Math.min(82,Math.max(55,c.h*.06));
    const x0=c.x-c.w/2,x1=c.x+c.w/2,y0=c.y,z0=c.z,z1=c.z+c.h;
    const addBox=(x,y,z,w,d,h,colors)=>{if(w>8&&d>8&&h>8)faces.push(...boxFaces(x,y,z,w,d,h,colors));};
    const sideClear=150,topClear=150;
    const openL=Math.max(x0+t+180,tv.x-tv.w/2-sideClear);
    const openR=Math.min(x1-t-180,tv.x+tv.w/2+sideClear);
    const lowTop=Math.min(tv.z-170,z0+Math.max(520,Math.min(720,c.h*.34)));
    const safeLowTop=Math.max(z0+420,lowTop);
    const openTop=Math.min(z1-t,Math.max(tv.z+tv.h+topClear,safeLowTop+520));

    addBox(x0+35,y0+18,z0,c.w-70,Math.max(40,c.d-36),plinth,{main:'#a9b3ae',side:'#899590'});
    addBox(x0,y0,z0+plinth,t,c.d,c.h-plinth,{main:palette.board,side:palette.boardSide});
    addBox(x1-t,y0,z0+plinth,t,c.d,c.h-plinth,{main:palette.board,side:palette.boardSide});
    addBox(x0+t,y0,z0+plinth,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
    addBox(x0+t,y0,z1-t,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
    addBox(x0+t,y0+14,z0+plinth+t,c.w-2*t,14,Math.max(30,safeLowTop-z0-plinth-t),{main:'#d1d5d0',side:'#b9c0bc'});
    addBox(x0+t,y0+12,safeLowTop,c.w-2*t,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});

    const lowN=clamp(Math.round(c.w/720),3,7);const lowW=(c.w-2*t)/lowN;const lowH=safeLowTop-(z0+plinth+t);
    for(let i=1;i<lowN;i++)addBox(x0+t+i*lowW-t/2,y0+12,z0+plinth+t,t,Math.max(30,c.d-12),lowH,{main:palette.board,side:palette.boardSide});
    for(let i=0;i<lowN;i++){
      const px=x0+t+i*lowW+8,frontY=y0+c.d+3,ph=Math.max(60,lowH-16);
      if(i===Math.floor(lowN/2)||i===Math.floor(lowN/2)-1){
        const gap=8,parts=2,h=(ph-gap)/parts;
        for(let r=0;r<parts;r++)addBox(px,frontY,z0+plinth+t+8+r*(h+gap),lowW-16,18,h,{main:r?palette.panelAlt:palette.panel,side:'#aab5b0',front:r?palette.panelAlt:palette.panel});
      }else addBox(px,frontY,z0+plinth+t+8,lowW-16,18,ph,{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
    }

    function tower(rx0,rx1,side){
      const w=rx1-rx0;if(w<190)return;
      addBox(side==='left'?rx1-t:rx0,y0+12,safeLowTop,t,Math.max(30,c.d-12),Math.max(30,z1-safeLowTop-t),{main:palette.board,side:palette.boardSide});
      const shelves=Math.max(1,Math.min(3,Math.floor((z1-safeLowTop)/520)));
      for(let s=1;s<shelves;s++)addBox(rx0,y0+18,safeLowTop+s*(z1-safeLowTop)/shelves,w,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
      const frontY=y0+c.d+3;
      addBox(rx0+8,frontY,safeLowTop+8,w-16,18,Math.max(40,z1-safeLowTop-t-16),{main:side==='left'?palette.panel:palette.panelAlt,side:'#aab5b0',front:side==='left'?palette.panel:palette.panelAlt});
    }
    tower(x0+t,openL,'left');tower(openR,x1-t,'right');

    if(openTop<z1-t-140){
      addBox(openL,y0+12,openTop,openR-openL,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});
      const h=z1-openTop-t;const count=Math.max(2,Math.round((openR-openL)/720));const w=(openR-openL)/count;
      for(let i=0;i<count;i++)addBox(openL+i*w+8,y0+c.d+3,openTop+t+8,w-16,18,Math.max(40,h-t-16),{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
    }
    return faces;
  }

  function cabinetRule(c){
    const n=clamp(Math.round(c.w/760),2,7);
    const topBand=c.h>=2280;
    const openCount=c.d<390?Math.min(2,n):1;
    return{n,topBand,openCount};
  }
  function cabinetFaces(c){
    if(state.tv.anchor)return anchoredCabinetFaces(c,state.tv);
    const faces=[];const t=24,plinth=Math.min(82,Math.max(46,c.h*.08));
    const x0=c.x-c.w/2,y0=c.y,z0=c.z;const rule=cabinetRule(c);const bodyH=Math.max(120,c.h-plinth);
    const addBox=(x,y,z,w,d,h,colors)=>faces.push(...boxFaces(x,y,z,w,d,h,colors));
    addBox(x0+35,y0+18,z0,c.w-70,Math.max(40,c.d-36),plinth,{main:'#a9b3ae',side:'#899590'});
    addBox(x0,y0,z0+plinth,t,c.d,bodyH,{main:palette.board,side:palette.boardSide});
    addBox(x0+c.w-t,y0,z0+plinth,t,c.d,bodyH,{main:palette.board,side:palette.boardSide});
    addBox(x0+t,y0,z0+plinth,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
    addBox(x0+t,y0,z0+c.h-t,c.w-2*t,c.d,t,{main:palette.board,side:palette.boardSide});
    addBox(x0+t,y0,z0+plinth+t,c.w-2*t,15,Math.max(30,bodyH-2*t),{main:'#d1d5d0',side:'#b9c0bc'});
    const moduleW=(c.w-2*t)/rule.n;
    for(let i=1;i<rule.n;i++)addBox(x0+t+i*moduleW-t/2,y0+12,z0+plinth+t,t,Math.max(30,c.d-12),Math.max(30,bodyH-2*t),{main:palette.board,side:palette.boardSide});
    let mainTop=z0+c.h-t;
    if(rule.topBand){
      const bandH=Math.min(470,Math.max(280,c.h*.22));const bandZ=z0+c.h-bandH;
      addBox(x0+t,y0+12,bandZ,c.w-2*t,Math.max(30,c.d-12),t,{main:palette.board,side:palette.boardSide});mainTop=bandZ;
      for(let i=0;i<rule.n;i++){
        const mx=x0+t+i*moduleW+8;
        addBox(mx,y0+c.d+3,bandZ+t+8,moduleW-16,18,Math.max(40,bandH-t-16),{main:i%2?palette.panelAlt:palette.panel,side:'#adb8b3',front:i%2?palette.panelAlt:palette.panel});
      }
    }
    const mainH=Math.max(80,mainTop-(z0+plinth+t));
    const center=Math.floor(rule.n/2);
    for(let i=0;i<rule.n;i++){
      const mx=x0+t+i*moduleW;const innerX=mx+8,innerW=moduleW-16;
      const isOpen=Math.abs(i-center)<rule.openCount;
      if(isOpen){
        const shelfZ=z0+plinth+t+mainH*.48;
        addBox(innerX,y0+18,shelfZ,innerW,Math.max(30,c.d-30),t,{main:'#d5d7d1',side:'#bcc2bd'});
        if(c.d>520){
          addBox(innerX,y0+c.d+3,z0+plinth+t+8,innerW,18,mainH*.34,{main:'#c9d0cc',side:'#aab5b0',front:'#c9d0cc'});
        }
      }else{
        const frontY=y0+c.d+3;
        const drawerMode=c.w>3200&&i===rule.n-1;
        if(drawerMode){
          const gap=8,parts=3,ph=(mainH-gap*(parts+1))/parts;
          for(let r=0;r<parts;r++)addBox(innerX,frontY,z0+plinth+t+gap+r*(ph+gap),innerW,18,ph,{main:r%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:r%2?palette.panelAlt:palette.panel});
        }else{
          addBox(innerX,frontY,z0+plinth+t+8,innerW,18,Math.max(30,mainH-16),{main:i%2?palette.panelAlt:palette.panel,side:'#aab5b0',front:i%2?palette.panelAlt:palette.panel});
          if(innerW>670)drawDoorSeam(faces,innerX+innerW/2,frontY+19,z0+plinth+t+12,Math.max(30,mainH-24));
        }
      }
    }
    return faces;
  }
  function drawDoorSeam(faces,x,y,z,h){
    faces.push(face([[x-3,y,z],[x+3,y,z],[x+3,y,z+h],[x-3,y,z+h]],'#96a39e','#96a39e',1,.6));
  }
