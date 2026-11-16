import http from 'node:http';
import {URL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadQuran,verifyQuran,searchQuran} from './quran.mjs';
import {claims} from './claims.mjs';
import {manuscripts} from './manuscripts.mjs';
import {buildGraph} from './evidence-graph-v5.mjs';
import {buildResearchPlan,runResearch,askGeneralAI,providerStatus} from './research-agent.mjs';
import {scoreEvidenceV5} from './score-v5.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'public');
const q=await loadQuran(root); const port=Number(process.env.PORT||8787);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const send=(res,status,type,body)=>{res.statusCode=status;res.setHeader('content-type',type);res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');res.end(body)};
const readBody=req=>new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>2_000_000) reject(new Error('payload too large'));});req.on('end',()=>resolve(s));req.on('error',reject)});
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(req.method==='GET'&&u.pathname==='/api/health') return send(res,200,mime['.json'],JSON.stringify({ok:true,version:'5.1.0',ui:true,ai:providerStatus()}));
 if(req.method==='GET'&&u.pathname==='/api/report') return send(res,200,mime['.json'],JSON.stringify({version:'5.0.0',quran:verifyQuran(q),claims:claims.length,manuscripts:manuscripts.length,graph:buildGraph(`${root}/data/claims/claims.json`,`${root}/data/graph/edges.json`),corpusStatus:{quran:'LOCAL',hadith:'PENDING',torah:'PENDING',psalms:'PENDING',gospels:'PENDING'}}));
 if(req.method==='GET'&&u.pathname==='/api/claims') return send(res,200,mime['.json'],JSON.stringify(claims));
 if(req.method==='GET'&&u.pathname==='/api/manuscripts') return send(res,200,mime['.json'],JSON.stringify(manuscripts));
 if(req.method==='GET'&&u.pathname==='/api/graph') return send(res,200,mime['.json'],JSON.stringify(buildGraph(`${root}/data/claims/claims.json`,`${root}/data/graph/edges.json`)));
 if(req.method==='GET'&&u.pathname==='/api/quran/verify') return send(res,200,mime['.json'],JSON.stringify(verifyQuran(q)));
 if(req.method==='GET'&&u.pathname==='/api/quran/search') {const raw=u.searchParams.get('q')||''; const lim=Number(u.searchParams.get('limit')||25); if(!raw||!Number.isInteger(lim)||lim<1||lim>100) return send(res,400,mime['.json'],JSON.stringify({error:'q required and limit must be integer 1..100'})); return send(res,200,mime['.json'],JSON.stringify(searchQuran(q,raw,lim)));}
 if(req.method==='GET'&&u.pathname==='/api/research/plan') return send(res,200,mime['.json'],JSON.stringify(buildResearchPlan(u.searchParams.get('topic')||'isa')));
 if(req.method==='GET'&&u.pathname==='/api/research/run') return send(res,200,mime['.json'],JSON.stringify(await runResearch(root,u.searchParams.get('topic')||'isa')));
 if(req.method==='GET'&&u.pathname==='/api/ai/status') return send(res,200,mime['.json'],JSON.stringify(providerStatus()));
 if(req.method==='POST'&&u.pathname==='/api/ai/ask'){const body=JSON.parse(await readBody(req)||'{}'); if(typeof body.prompt!=='string'||!body.prompt.trim()) return send(res,400,mime['.json'],JSON.stringify({error:'prompt required'})); return send(res,200,mime['.json'],JSON.stringify(await askGeneralAI(body.prompt,body.options||{})));}
 if(req.method==='POST'&&u.pathname==='/api/scoring'){const body=JSON.parse(await readBody(req)||'{}'); return send(res,200,mime['.json'],JSON.stringify(scoreEvidenceV5(body)));}
 const file=u.pathname==='/'?'/v5.html':u.pathname; const rel=path.normalize(decodeURIComponent(file)).replace(/^[/\\]+/,''); const target=path.resolve(publicDir,rel); if(!target.startsWith(publicDir+path.sep)) return send(res,403,mime['.json'],JSON.stringify({error:'forbidden'})); const data=await fs.readFile(target); return send(res,200,mime[path.extname(target)]||'application/octet-stream',data);
}catch(e){const status=/ENOENT/.test(e.code)?404:400; send(res,status,mime['.json'],JSON.stringify({error:e.message,status}));}});
server.listen(port,()=>console.log(`Divine Text Verification v5.0: http://localhost:${port}`));
