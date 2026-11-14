import sys, json, random, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
S=8 # px/mm
W,H,M,r=210,297,12,2.7
def layout(nq,na,pg):
    obj=[i for i in range(nq) if i not in cfg.get('disc',[])]
    start=pg*100;count=min(100,len(obj)-start);cols=-(-count//25);rows=-(-count//cols)
    top=M+49;rowH=min(9,(H-M-14-top)/rows);gap=6.8 if cols>=4 else 7.4
    colW=10+(na-1)*gap+2*r+2;cg=min(16,(W-2*M-8-cols*colW)/(cols-1)) if cols>1 else 0;x0=(W-(cols*colW+(cols-1)*cg))/2
    qs=[]
    for c in range(cols):
        cx=x0+c*(colW+cg)
        for k in range(rows):
            pos=start+c*rows+k
            if pos>=start+count:break
            q=obj[pos]
            qs.append((q,k,cx,top+k*rowH+rowH/2,[cx+10+j*gap+r for j in range(na)],rowH,colW))
    return qs
def sheet(nq,na,pg,answers,newmarks=True):
    im=Image.new('L',(W*S,H*S),255);d=ImageDraw.Draw(im)
    R=lambda x,y,w,h,f:d.rectangle([x*S,y*S,(x+w)*S,(y+h)*S],fill=f)
    for x,y in [(8,8),(197,8),(8,284),(197,284)]:R(x,y,5,5,0)
    if newmarks:
        R(16,9,10,3,0)
        for k in range(pg+1):R([190,186,182,178][k]-0.75,9,1.5,3,0)
        for k,b in enumerate(cfg['code']):
            if b:R(18+k*3,285,2,3,0)
    f=ImageFont.load_default()
    d.text((16*S,14*S),"Folha de respostas",fill=0,font=ImageFont.load_default(size=40))
    d.text((16*S,34*S),"Nome:  Maria da Silva",fill=0,font=ImageFont.load_default(size=30))
    for (q,k,cx,y,bx,rowH,colW) in layout(nq,na,pg):
        if k%2==0:R(cx-1,y-rowH/2,colW+1,rowH,238)
        d.text(((cx+3)*S,(y-1.5)*S),str(q+1),fill=0,font=ImageFont.load_default(size=24))
        for j,b in enumerate(bx):
            d.ellipse([(b-r)*S,(y-r)*S,(b+r)*S,(y+r)*S],fill=255,outline=0,width=int(0.3*S))
            d.text(((b-0.6)*S,(y-1)*S),"ABCDE"[j],fill=150,font=ImageFont.load_default(size=14))
            a=answers.get(q)
            if a and "ABCDE"[j] in a[0]:
                g=a[1];rr=r*random.uniform(0.75,0.95)
                d.ellipse([(b-rr+random.uniform(-.3,.3))*S,(y-rr)*S,(b+rr)*S,(y+rr+random.uniform(-.3,.3))*S],fill=g)
    return im
def coeffs(src,dst):
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A.append([x,y,1,0,0,0,-u*x,-u*y]);B.append(u);A.append([0,0,0,x,y,1,-v*x,-v*y]);B.append(v)
    return np.linalg.solve(np.array(A,float),np.array(B,float)).tolist()
def photo(im,quad,size=(3000,4000),rot=0):
    w,h=im.size
    out=im.transform(size,Image.PERSPECTIVE,coeffs([(0,0),(w,0),(w,h),(0,h)],quad),Image.BICUBIC,fillcolor=None)
    mask=Image.new('L',im.size,255).transform(size,Image.PERSPECTIVE,coeffs([(0,0),(w,0),(w,h),(0,h)],quad),Image.BICUBIC)
    bg=Image.new('L',size,95)
    bg.paste(out,(0,0),mask)
    a=np.array(bg,float)
    yy,xx=np.mgrid[0:size[1],0:size[0]]
    a*=0.65+0.35*(xx/size[0])*(1-0.3*yy/size[1])   # luz desigual
    a+=np.random.normal(0,6,a.shape)
    img=Image.fromarray(np.clip(a,0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.6))
    if rot:img=img.rotate(rot,expand=True)
    s=1600/max(img.size);img=img.resize((round(img.size[0]*s),round(img.size[1]*s)),Image.BILINEAR)
    return img
random.seed(int(sys.argv[1]));np.random.seed(int(sys.argv[1]))
cfg=json.loads(sys.argv[2])
nq,na,pg=cfg['nq'],cfg['na'],cfg.get('pg',0)
truth={};answers={}
for q in [i for i in range(nq) if i not in cfg.get('disc',[])][pg*100:pg*100+100]:
    t=random.random()
    if t<0.07: truth[q]='';
    elif t<0.10: L=random.sample("ABCDE"[:na],2);answers[q]=(''.join(L),40);truth[q]='?'
    elif t<0.13: L=random.choice("ABCDE"[:na]);answers[q]=(L,random.choice([25,60]));truth[q]=L
    else: L=random.choice("ABCDE"[:na]);answers[q]=(L,random.randint(cfg.get("gmin",20),cfg.get("gmax",70)));truth[q]=L
im=sheet(nq,na,pg,answers,cfg.get('new',True))
quad=cfg.get('quad',[(420,380),(2600,520),(2700,3700),(300,3600)])
p=photo(im,quad,rot=cfg.get('rot',0))
p.save('t.png');open('t.raw','wb').write(p.tobytes())
json.dump({'w':p.size[0],'h':p.size[1],'truth':truth},open('t.json','w'))
