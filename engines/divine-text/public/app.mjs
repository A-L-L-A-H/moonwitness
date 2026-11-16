const $=(s)=>document.querySelector(s); const $$=(s)=>[...document.querySelectorAll(s)];
async function get(path){const r=await fetch(path); if(!r.ok) throw new Error(await r.text()); return r.json();}
function metric(label,value,sub){return `<div class="metric"><div class="k">${label}</div><div class="v">${value}</div><div class="s">${sub}</div></div>`}
async function load(){
  const [health,report,claims,manuscripts,graph,identity]=await Promise.all([
    get('/api/health'),get('/api/report'),get('/api/claims'),get('/api/manuscripts'),get('/api/graph'),get('/api/identity')
  ]);
  $('#health').textContent=`API ${health.version} · ${health.ok?'online':'offline'}`;
  $('#metric-cards').innerHTML=[
    metric('Qur’an witness',report.corpus.find(x=>x.name==='quran')?.records??'—','normalized local witness'),
    metric('Claims',claims.length,'source-critical records'),
    metric('Manuscripts',manuscripts.length,'registered witnesses'),
    metric('Graph edges',graph.edge_count,'explicit relationships')
  ].join('');
  const pipe=[['Qur’an','ok'],['Hadith','pending'],['Torah','pending'],['Psalms','pending'],['Gospels','pending'],['Manuscripts','ok'],['Cross-scripture','ok'],['UI','ok']];
  $('#pipeline').innerHTML=pipe.map(([n,c])=>`<div class="pipeline-step"><span class="dot ${c}"></span><strong>${n}</strong><span class="muted">${c==='ok'?'ready':'pending corpus'}</span></div>`).join('');
  renderClaims(claims); renderManuscripts(manuscripts); renderIdentity(identity); renderGraph(graph);
}
function renderClaims(list){$('#claims').innerHTML=list.map(c=>`<div class="claim" data-status="${c.status}"><div class="claim-top"><strong>${c.id||c.claim_id}</strong><span class="badge ${c.status==='UNRESOLVED'?'warn':''}">${c.status}</span></div><div>${c.claim}</div><div class="muted">${c.sourceType||c.source_type||'UNKNOWN'} · ${c.reference||'no reference'} · ${c.level||'L0'}</div></div>`).join('');}
function renderManuscripts(list){$('#manuscripts').innerHTML=list.map(m=>`<div class="manuscript"><strong>${m.title}</strong><div class="muted">${m.tradition||''} · ${m.language||''} · ${m.date||''}</div><div>${m.coverage||''}</div>${m.sourceUrl?`<a href="${m.sourceUrl}" target="_blank" rel="noreferrer">source</a>`:''}</div>`).join('');}
function renderIdentity(list){$('#identity-gaps').innerHTML=list.map(x=>`<div class="gap"><strong>${x.subject}</strong><div>${x.claim}</div><div class="muted">Status: ${x.status}</div></div>`).join('');}
function renderGraph(g){$('#graph-summary').innerHTML=`<div class="metric"><div class="k">Nodes</div><div class="v">${g.node_count}</div><div class="s">claim nodes</div></div>`; $('#graph-edges').innerHTML=g.edges.length?g.edges.map(e=>`<div class="edge"><strong>${e.from}</strong> → <em>${e.type}</em> → <strong>${e.to}</strong></div>`).join(''):'<div class="muted">No explicit edges yet.</div>';}
$$('[data-view]').forEach(b=>b.onclick=()=>{$$('.view').forEach(v=>v.classList.remove('active')); $(`#view-${b.dataset.view}`).classList.add('active');});
$('#claim-filter').oninput=()=>{const q=$('#claim-filter').value.toLowerCase(); $$('#claims .claim').forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?'block':'none');};
$('#claim-status').onchange=()=>{const s=$('#claim-status').value; $$('#claims .claim').forEach(el=>el.style.display=!s||el.dataset.status===s?'block':'none');};
$('#quran-search').onclick=async()=>{const q=$('#quran-query').value.trim(); if(!q)return; const rows=await get(`/api/quran/search?q=${encodeURIComponent(q)}&limit=25`); $('#quran-results').innerHTML=rows.map(x=>`<div class="result"><div class="ref">${x.surah_name} ${x.surah}:${x.ayah}</div><div class="arabic">${x.text_uthmani}</div><div class="muted">${x.text_normalized||''}</div></div>`).join('')||'<div class="muted">No results.</div>';};
load().catch(e=>{$('#health').textContent='error'; console.error(e);});


async function loadCorpus(){
  const [status, registry]=await Promise.all([get('/api/corpus/status'), get('/api/corpus/registry')]);
  $('#corpus-status').innerHTML=status.map(x=>`<div class="pipeline-step"><strong>${x.id}</strong><span class="muted">${x.status}</span><span class="muted">${x.raw_files} raw files</span></div>`).join('');
  $('#corpus-registry').innerHTML=registry.sources.map(x=>`<div class="gap"><strong>${x.label}</strong><div class="muted">${x.kind}</div></div>`).join('');
}
async function doCorpusAction(kind){
  const el=$('#corpus-status'); el.textContent='Working…';
  try{ const r=await get(kind==='download'?'/api/corpus/download?target=all':'/api/corpus/verify'); el.textContent=JSON.stringify(r,null,2); await loadCorpus(); }catch(e){ el.textContent=String(e); }
}
loadCorpus().catch(()=>{});
const dl=$('#download-all'); if(dl) dl.onclick=()=>doCorpusAction('download');
const vf=$('#verify-all'); if(vf) vf.onclick=()=>doCorpusAction('verify');

const autopilotBtn = $('#start-autopilot');
if (autopilotBtn) { autopilotBtn.onclick = async () => { const topic=$('#autopilot-topic').value; $('#autopilot-status').textContent='Running…'; $('#autopilot-log').textContent='Collecting evidence → graph → scoring → report'; try { const r=await get('/api/research/run?topic='+encodeURIComponent(topic)); $('#autopilot-status').textContent='Completed: '+(r.status||'done'); $('#autopilot-log').textContent=JSON.stringify(r,null,2); } catch(e) { $('#autopilot-status').textContent='Error'; $('#autopilot-log').textContent=String(e); } }; }
(async()=>{ try { const s=await get('/api/scoring'); const el=$('#scoring-result'); if(el) el.innerHTML='<pre>'+JSON.stringify(s,null,2)+'</pre>'; } catch(e) {} })();
