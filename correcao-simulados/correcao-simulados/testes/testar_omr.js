const fs=require('fs'),o=require('./omr-core.js');
const meta=JSON.parse(fs.readFileSync('t.json')),g=new Uint8Array(fs.readFileSync('t.raw'));
const cfg=JSON.parse(process.argv[2]);const t0=Date.now();
const res=o.omrRead({g,w:meta.w,h:meta.h},{nq:cfg.nq,na:cfg.na,id:cfg.id,disc:cfg.disc},cfg.hint);
if(!res.ok){console.log('FAIL',res.motivo);process.exit(0)}
let ok=0,bad=[],dd=0,missedDouble=0;
for(const [q,t] of Object.entries(meta.truth)){const got=res.resp[q],doubt=res.duv.includes(+q);
  if(t==='?'){if(doubt)ok++;else missedDouble++;continue}
  if(got===t&&!doubt)ok++;else if(doubt)dd++;else bad.push(`${+q+1}:${t||'-'}→${got||'-'}`)}
console.log(`pg=${res.pg}(${res.pgLido?'lido':'suposto'}) ok=${ok}/${Object.keys(meta.truth).length} duvida=${dd} errosSilenciosos=${bad.length} ${bad.join(' ')} duplaNaoVista=${missedDouble} q=${res.qualidade.toFixed(2)} ${Date.now()-t0}ms`);
