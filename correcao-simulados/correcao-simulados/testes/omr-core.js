// Cópia do núcleo OMR de src/index.html, para testes em Node.
/* OMR-CORE-START */
/* Leitura óptica da folha padronizada, sem IA. Coordenadas da folha em mm (A4). */
const FOLHA={W:210,H:297,M:12,r:2.7,perPage:100,
  marks:[[10.5,10.5],[199.5,10.5],[199.5,286.5],[10.5,286.5]], // centros dos quadrados: TL, TR, BR, BL
  bar:{x:16,y:9,w:10,h:3},                                   // barra de orientação (só no canto superior esquerdo)
  slots:[190,186,182,178],slotY:9,slotW:1.5,slotH:3,           // marcas de número da página (pág. n = n marcas)
  code:{x0:18,dx:3,y:285,w:2,h:3}};                             // código de 24 bits no rodapé: identifica o simulado
/* questões que vão para a folha de bolinhas: todas menos as dissertativas */
function objetivas(sim){const d=sim.disc||[];return Array.from({length:sim.nq},(_,i)=>i).filter(i=>!d.includes(i))}
/* bits: 1 de início, 8 do nº de questões objetivas, 1 do nº de alternativas (0 = A–D, 1 = A–E),
   14 de um resumo do id do simulado (e das dissertativas, se houver) */
function folhaCode(sim){let x=0;const d=sim.disc||[];for(const c of String(sim.id||'')+(d.length?':'+d.slice().sort((a,b)=>a-b).join(','):''))x=(x*31+c.charCodeAt(0))>>>0;x&=0x3fff;
  const nObj=objetivas(sim).length;
  const b=[1];for(let i=7;i>=0;i--)b.push((nObj>>i)&1);b.push(sim.na===5?1:0);for(let i=13;i>=0;i--)b.push((x>>i)&1);return b}
function layoutFolha(sim){
  const {W,H,M,r,perPage}=FOLHA,obj=objetivas(sim),pages=Math.ceil(obj.length/perPage),out=[];
  for(let pg=0;pg<pages;pg++){
    const start=pg*perPage,count=Math.min(perPage,obj.length-start),cols=Math.ceil(count/25),rows=Math.ceil(count/cols);
    const top=M+49,rowH=Math.min(9,(H-M-14-top)/rows),gap=cols>=4?6.8:7.4;
    const colW=10+(sim.na-1)*gap+2*r+2,cg=cols>1?Math.min(16,(W-2*M-8-cols*colW)/(cols-1)):0,x0=(W-(cols*colW+(cols-1)*cg))/2;
    const qs=[];
    for(let c=0;c<cols;c++){const cx=x0+c*(colW+cg);
      for(let k=0;k<rows;k++){const pos=start+c*rows+k;if(pos>=start+count)break;const q=obj[pos];
        qs.push({q,k,cx,y:top+k*rowH+rowH/2,bx:Array.from({length:sim.na},(_,j)=>cx+10+j*gap+r)})}}
    out.push({pg,start,count,cols,rows,rowH,colW,gap,qs});
  }
  return out;
}
function omrH(src,dst){
  const A=[],b=[];
  for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=dst[i];
    A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}
  for(let i=0;i<8;i++){let p=i;for(let k=i+1;k<8;k++)if(Math.abs(A[k][i])>Math.abs(A[p][i]))p=k;
    [A[i],A[p]]=[A[p],A[i]];[b[i],b[p]]=[b[p],b[i]];const d=A[i][i];if(Math.abs(d)<1e-12)return null;
    for(let k=0;k<8;k++){if(k===i)continue;const f=A[k][i]/d;if(!f)continue;for(let j=i;j<8;j++)A[k][j]-=f*A[i][j];b[k]-=f*b[i]}}
  return b.map((v,i)=>v/A[i][i]);
}
function omrMap(h,x,y){const w=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w]}
function omrPx(img,h,x,y){const [u,v]=omrMap(h,x,y),i=Math.round(u),j=Math.round(v);return (i<0||j<0||i>=img.w||j>=img.h)?255:img.g[j*img.w+i]}
function omrDisk(img,h,cx,cy,rad,step){let s=0,n=0;for(let y=-rad;y<=rad;y+=step)for(let x=-rad;x<=rad;x+=step){if(x*x+y*y>rad*rad)continue;s+=omrPx(img,h,cx+x,cy+y);n++}return s/n}
function omrRing(img,h,cx,cy,rad,n){const v=[];for(let k=0;k<n;k++){const t=k/n*2*Math.PI;v.push(omrPx(img,h,cx+rad*Math.cos(t),cy+rad*Math.sin(t)))}return v}
function omrMean(v){return v.reduce((a,b)=>a+b,0)/v.length}
function omrPct(v,p){const s=v.slice().sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(p*s.length))]}
function omrRect(img,h,x,y,w,ht){let s=0,n=0;for(let yy=y+0.3;yy<y+ht-0.2;yy+=0.5)for(let xx=x+0.3;xx<x+w-0.2;xx+=0.5){s+=omrPx(img,h,xx,yy);n++}return s/n}

/* blocos escuros (candidatos a quadrado de canto) com limiar adaptativo */
function omrBlobs(img){
  const {g,w,h}=img,n=w*h,W1=w+1,I=new Float64Array(W1*(h+1));
  for(let y=0;y<h;y++){let s=0;for(let x=0;x<w;x++){s+=g[y*w+x];I[(y+1)*W1+x+1]=I[y*W1+x+1]+s}}
  const R=Math.max(8,Math.round(Math.max(w,h)/24)),bin=new Uint8Array(n);
  for(let y=0;y<h;y++){const y0=Math.max(0,y-R),y1=Math.min(h,y+R+1);
    for(let x=0;x<w;x++){const x0=Math.max(0,x-R),x1=Math.min(w,x+R+1);
      const m=(I[y1*W1+x1]-I[y0*W1+x1]-I[y1*W1+x0]+I[y0*W1+x0])/((x1-x0)*(y1-y0)),v=g[y*w+x];
      bin[y*w+x]=(v<m*0.72&&v<m-18)?1:0}}
  const lab=new Uint8Array(n),st=new Int32Array(n),blobs=[];
  for(let i=0;i<n;i++){if(!bin[i]||lab[i])continue;let sp=0;st[sp++]=i;lab[i]=1;let a=0,sx=0,sy=0,x0=w,x1=0,y0=h,y1=0;
    while(sp){const p=st[--sp],x=p%w,y=(p-x)/w;a++;sx+=x;sy+=y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      if(x>0&&bin[p-1]&&!lab[p-1]){lab[p-1]=1;st[sp++]=p-1}
      if(x<w-1&&bin[p+1]&&!lab[p+1]){lab[p+1]=1;st[sp++]=p+1}
      if(y>0&&bin[p-w]&&!lab[p-w]){lab[p-w]=1;st[sp++]=p-w}
      if(y<h-1&&bin[p+w]&&!lab[p+w]){lab[p+w]=1;st[sp++]=p+w}}
    const bw=x1-x0+1,bh=y1-y0+1;
    if(a>=Math.max(16,n*0.000012)&&a<=n*0.01&&bw/bh>0.5&&bw/bh<2&&a/(bw*bh)>0.5)blobs.push({a,x:sx/a,y:sy/a})}
  return blobs;
}
function omrContrast(dark,light){return light>1?(light-dark)/light:0}
function omrMarkScore(img,h){let s=0;for(const [x,y] of FOLHA.marks){const inner=omrDisk(img,h,x,y,1.5,0.5),ring=omrPct(omrRing(img,h,x,y,3.8,24),0.7);s+=omrContrast(inner,ring)}return s/4}
function omrBarScore(img,h){const b=FOLHA.bar;const d=omrRect(img,h,b.x+0.5,b.y+0.5,b.w-1,b.h-1);const l=(omrRect(img,h,b.x,b.y-4,b.w,2.5)+omrRect(img,h,b.x+b.w+2,b.y,4,b.h))/2;return omrContrast(d,l)}
function omrPage(img,h){let n=0;for(const x of FOLHA.slots){const d=omrRect(img,h,x-0.5,FOLHA.slotY+0.6,1,FOLHA.slotH-1.2),l=omrRect(img,h,x-0.5,FOLHA.slotY-3.5,1,2);if(omrContrast(d,l)>0.35)n++;else break}return n?n-1:null}
function omrCode(img,h){const c=FOLHA.code;return Array.from({length:24},(_,k)=>{const x=c.x0+k*c.dx;
  const d=omrRect(img,h,x+0.4,c.y+0.6,c.w-0.8,c.h-1.2),l=omrRect(img,h,x,c.y+c.h+1.2,c.w,2);return omrContrast(d,l)>0.35?1:0})}
/* contorno impresso das bolinhas: confirma que a folha é deste simulado e acerta pequenos desvios */
function omrOutline(img,h,bx,y,dx,dy){const r=FOLHA.r;let s=0,c=0;
  for(let k=0;k<12;k++){const t=k/12*2*Math.PI,co=Math.cos(t),si=Math.sin(t);let m=255;
    for(const rr of [r-0.25,r,r+0.25])m=Math.min(m,omrPx(img,h,bx+dx+rr*co,y+dy+rr*si));
    const out=omrPx(img,h,bx+dx+(r+0.9)*co,y+dy+(r+0.9)*si);s+=omrContrast(m,out);c++}
  return s/c}
function omrGrid(img,h,page){const qs=page.qs,step=Math.max(1,Math.floor(qs.length/30));let s=0,n=0;
  for(let i=0;i<qs.length;i+=step)for(const bx of qs[i].bx){s+=omrOutline(img,h,bx,qs[i].y,0,0);n++}return n?s/n:0}

function omrDetect(img,sim,pgHint){
  const blobs=omrBlobs(img);if(blobs.length<4)return {ok:false,motivo:'cantos'};
  const K=5,pick=f=>blobs.slice().sort((a,b)=>f(a)-f(b)).slice(0,K);
  const C=[pick(c=>c.x+c.y),pick(c=>c.y-c.x),pick(c=>-(c.x+c.y)),pick(c=>c.x-c.y)]; // TL, TR, BR, BL na imagem
  const area=q=>{let s=0;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4];s+=a.x*b.y-b.x*a.y}return s/2};
  const combos=[];
  for(const a of C[0])for(const b of C[1])for(const c of C[2])for(const d of C[3]){
    const q=[a,b,c,d];if(new Set(q).size<4)continue;
    const A=area(q);if(A<img.w*img.h*0.12)continue;
    const as=q.map(o=>o.a);if(Math.max(...as)/Math.min(...as)>3.5)continue;
    const h=omrH(FOLHA.marks,q.map(o=>[o.x,o.y]));if(!h)continue;
    combos.push({q,mk:omrMarkScore(img,h)})}
  if(!combos.length)return {ok:false,motivo:'cantos'};
  combos.sort((x,y)=>y.mk-x.mk);
  const pages=layoutFolha(sim);if(!pages.length)return {ok:false,motivo:'folha'};let best=null;
  for(const cb of combos.slice(0,3)){if(cb.mk<0.3)continue;
    for(let r=0;r<4;r++){const dst=[0,1,2,3].map(i=>{const o=cb.q[(i+r)%4];return [o.x,o.y]});
      const h=omrH(FOLHA.marks,dst);if(!h)continue;
      const bar=omrBarScore(img,h);let pg=omrPage(img,h);const pgLido=pg!==null&&pg<pages.length;
      if(!pgLido)pg=(pgHint!=null&&pgHint<pages.length)?pgHint:0;
      const grid=omrGrid(img,h,pages[pg]),score=cb.mk+Math.max(0,bar)*0.75+grid*3;
      if(!best||score>best.score)best={h,pg,pgLido,bar,grid,mk:cb.mk,score}}}
  if(!best)return {ok:false,motivo:'cantos'};
  if(best.grid<0.12)return {ok:false,motivo:'folha'};
  const code=omrCode(img,best.h),esperado=folhaCode(sim);
  if(code[0]===1){
    if(code.join('')!==esperado.join('')){const nq=parseInt(code.slice(1,9).join(''),2),na=code[9]?5:4;
      return {ok:false,motivo:'outro',nq,na}}
    return Object.assign({ok:true,codigo:true},best)}
  /* folha antiga, sem código: confere o número de alternativas: cada coluna de letra tem contorno, e não há uma bolinha a mais depois da última */
  const pq=pages[best.pg].qs,st=Math.max(1,Math.floor(pq.length/30)),perJ=Array(sim.na).fill(0);let extra=0,antes=0,n=0;
  for(let i=0;i<pq.length;i+=st){const q=pq[i];q.bx.forEach((bx,j)=>perJ[j]+=omrOutline(img,best.h,bx,q.y,0,0));
    extra+=omrOutline(img,best.h,q.bx[sim.na-1]+pages[best.pg].gap,q.y,0,0);antes+=omrOutline(img,best.h,q.bx[0]-pages[best.pg].gap,q.y,0,0);n++}
  return Object.assign({ok:true},best);
}

function omrRead(img,sim,pgHint){
  const det=omrDetect(img,sim,pgHint);if(!det.ok)return det;
  const {h}=det,page=layoutFolha(sim)[det.pg],L='ABCDE',r=FOLHA.r,rows=[],all=[];
  for(const q of page.qs){
    let bo={dx:0,dy:0,s:-1};
    for(let dy=-1.2;dy<=1.21;dy+=0.4)for(let dx=-1.2;dx<=1.21;dx+=0.4){let s=0;for(const bx of q.bx)s+=omrOutline(img,h,bx,q.y,dx,dy);if(s>bo.s)bo={dx,dy,s}}
    const d=q.bx.map(bx=>{const cx=bx+bo.dx,cy=q.y+bo.dy;const inner=omrDisk(img,h,cx,cy,r*0.55,0.3),paper=omrPct(omrRing(img,h,cx,cy,r*1.4,24),0.9);return Math.max(0,omrContrast(inner,paper))});
    rows.push({q:q.q,d,dx:bo.dx,dy:bo.dy});all.push(...d);
  }
  const base=omrPct(all,0.5),resp={},duv=[],marks=[];
  for(const row of rows){
    const o=row.d.map((v,j)=>({j,v:v-base})).sort((a,b)=>b.v-a.v),t1=o[0],t2=o[1]||{v:0};
    let ans='',doubt=false;
    if(t1.v<0.15){ans=''}
    else if(t1.v>=0.3&&t2.v>=0.3){ans='';doubt=true}
    else if(t1.v>=0.3){ans=L[t1.j];doubt=t2.v>=0.15}
    else{ans=(t1.v-t2.v>0.08)?L[t1.j]:'';doubt=true}
    resp[row.q]=ans;if(doubt)duv.push(row.q);
    row.d.forEach((v,j)=>{if(v-base>=0.15)marks.push({q:row.q,j,x:page.qs.find(x=>x.q===row.q).bx[j]+row.dx,y:page.qs.find(x=>x.q===row.q).y+row.dy,doubt})})
  }
  return {ok:true,pg:det.pg,pgLido:det.pgLido,h,resp,duv,marks,page,qualidade:det.grid};
}

module.exports={folhaCode,FOLHA,layoutFolha,omrRead};
