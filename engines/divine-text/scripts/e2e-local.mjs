import { spawn } from 'node:child_process';
const port=8897;
const child=spawn(process.execPath,['src/server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
const base=`http://localhost:${port}`;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
try{
  await sleep(800);
  const cases=[
    ['/api/health',200],
    ['/api/quran/search?q=%D8%A7%D9%84%D9%84%D9%87&limit=3',200],
    ['/api/research/run?topic=isa',200],
    ['/api/scoring',200],
    ['/api/identity',200],
    ['/api/graph',200],
    ['/',200],
    ['/definitely-missing-file',404]
  ];
  for(const [path,expected] of cases){
    const r=await fetch(base+path);
    if(r.status!==expected) throw new Error(`${path}: expected ${expected}, got ${r.status}`);
    await r.text();
  }
  console.log('E2E PASS: 8/8');
}catch(e){console.error('E2E FAIL',e); process.exitCode=1;}finally{child.kill('SIGTERM');}
