type D=any;
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const esc=(s:unknown)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]??c));

async function main(){
  const names=[
    'prophet-identity-graph.v2.0.json','profile-data-scores.v2.0.json','leaderboards.v2.0.json','provenance-index.v2.0.json',
    'events.v2.0.json','genealogy.v2.0.json','uncertainty.v2.0.json','corpus-registry.v2.0.json','conflicts.v2.0.json','documentation-registry.v2.3.json','source-editions.v2.0.json'
  ];
  const [D0,PS,L,PV,EV,GN,UN,CR,CF,DR,SE]=await Promise.all(names.map(n=>fetch('./public/'+n).then(r=>{if(!r.ok)throw new Error(`${n}: HTTP ${r.status}`);return r.json()}))) as D[];
  const sm=Object.fromEntries(PS.map((x:D)=>[x.prophet_id,x]));
  const cm=Object.fromEntries(PV.claims.map((x:D)=>[x.id,x]));
  let key=D0.prophet_order[0];
  const sel=el<HTMLSelectElement>('p');
  for(const id of D0.prophet_order){const p=D0.prophets[id],o=document.createElement('option');o.value=id;o.textContent=`${p.display_name} · ${p.quranic_name}`;sel.appendChild(o)}

  const list=(id:string,rows:D[],field='score')=>{
    el(id).innerHTML=rows.map(r=>`<div class="item leader"><span>#${r.rank}</span><div><b>${esc(r.prophet_name)}</b><div class="muted">${esc(r.band??r.metric??'')}</div></div><strong>${Number(r[field]??0).toFixed(2)}</strong></div>`).join('');
  };

  const renderArchitecture=()=>{
    const stages=[
      ['01','REVEALED SOURCE','Qur’an · Taurat · Zabur · Injil'],['02','TEXTUAL WITNESS','Versioned passage/reference layer'],['03','PROVENANCE','Claim · source · passage · evidence'],
      ['04','LEXICAL','Token · lemma · root'],['05','IDENTITY / RID','Positive root identity model'],['06','ASMA GRAPH','Relation, never identity'],['07','MISSION / EVENT','8-slot lifecycle + event nodes'],
      ['08','CONTEXT','Religion · people/region · language'],['09','UNCERTAINTY','Conflict · alternatives · confidence'],['10','SCORING','Separate evidence/research indices'],
      ['11','PERSISTENCE','PostgreSQL + versioned JSON'],['12','API / UI','Same contracts, read-only presentation']
    ];
    el('arch').innerHTML=stages.map(x=>`<div class="node"><div class="n">${x[0]}</div><b>${x[1]}</b><div class="muted">${x[2]}</div></div>`).join('');
    el('docsstatus').textContent=`v${DR.version} · ${DR.status} · ${DR.documents.length} registered documents · TODO: ${DR.governance?.todo_path??'not registered'}`;
    el('docs').innerHTML=DR.documents.map((d:D)=>`<div class="card doc"><span class="tag">${esc(d.category)}</span><b style="display:block;margin-top:7px">${esc(d.title)}</b><div class="muted">${esc(d.path)}</div><div class="status-complete">${esc(d.category==='todo'?'TRACKED · OPEN ITEMS':d.status)}</div></div>`).join('');
  };

  function render(){
    const p=D0.prophets[key],c=p.context,cs=L.context_evidence.find((x:D)=>x.prophet_id===key);
    el('name').textContent=`${p.display_name} · ${p.quranic_name}`;
    el('signature').textContent=p.signature;
    el('root').textContent=p.name_root.root;
    el('rootmeta').textContent=`${p.name_root.name_root_source_language} · ${p.name_root.confidence}`;
    el('rid').textContent=`${p.rid.root}`;
    el('ridmeta').textContent=`${p.rid.meaning} · ${p.rid.language}`;
    el('status').textContent=p.quranic_status.classification;
    el('statusrefs').textContent=`${p.quranic_status.evidence} · ${p.quranic_status.refs.map((x:string)=>'QS '+x).join(' · ')}`;
    el('datascore').textContent=`Data confidence ${Number(sm[key]?.data_confidence_score??0).toFixed(2)}/100`;
    el('contextscore').textContent=`${Number(cs?.context_score??0).toFixed(2)}/100 context`;
    el('context').innerHTML=c?`<div class="item"><span class="tag">RELIGION</span><div>${esc(c.religion.summary)}</div><div class="muted">${esc(c.religion.evidence)} · ${c.religion.refs.map((x:string)=>'QS '+x).join(' · ')}</div></div><div class="item"><span class="tag">PEOPLE / REGION</span><div>${esc(c.people_region.people)} · ${esc(c.people_region.historical_region)}</div><div class="muted">Modern crosswalk: ${esc(c.people_region.modern_geography_crosswalk)} · ${esc(c.people_region.modern_crosswalk_confidence)}</div></div><div class="item"><span class="tag">LANGUAGE</span><div>${esc(c.language.summary)}</div><div class="muted">Scripture: ${esc(c.language.scripture_language_context)}</div></div>`:'—';
    el('asma').innerHTML=D0.edges.filter((e:D)=>e.from===`prophet:${key}`&&e.type==='asma_relation').map((e:D)=>`<div class="item"><span class="tag">${esc(e.evidence)}</span> <span class="tag">${esc(e.relation_mode??'RELATION')}</span> <b>${esc(D0.divine_attributes[e.canonical_divine_root]?.forms?.[0]?.name??e.canonical_divine_root)}</b><div class="muted">${esc(e.note??'')}</div></div>`).join('')||'<span class="muted">—</span>';
    el('supp').innerHTML=p.supplemental_witnesses.map((x:D)=>`<div class="item"><span class="tag">${esc(x.source_book)}</span> <span class="tag">${esc(x.evidence)}</span> <b>${esc(x.ref)}</b><div>${esc(x.claim)}</div><div class="muted">${esc(x.relation_to_quran)} · binding ${esc(x.binding_confidence)}</div></div>`).join('')||'<span class="muted">No supplementary witness required for this profile.</span>';

    const ids=PV.by_prophet[key]??[];el('claimcount').textContent=`${ids.length} claims`;
    el('claims').innerHTML=ids.map((id:string)=>{const x=cm[id];return`<div class="item"><span class="tag">${esc(x.category)}</span> <b>${esc(x.statement)}</b><div class="muted">confidence ${(100*Number(x.confidence??0)).toFixed(1)}% · ${x.refs.map((r:D)=>`${esc(r.source_id)} ${esc(r.ref)} ${esc(r.evidence)}`).join(' · ')}</div></div>`}).join('');
    const u=UN.find((x:D)=>x.prophet_id===key);el('uncertainty').innerHTML=u?`<div class="item"><b>Mean uncertainty ${(100*u.mean_uncertainty).toFixed(1)}%</b><div class="muted">review ${u.review_claims}/${u.claim_count} claims</div></div>`:'—';
    const relatedConflicts=CF.cases.filter((x:D)=>String(x.subject).toLowerCase().includes(key)||JSON.stringify(x).toLowerCase().includes(`prophet:${key}`));
    el('conflicts').innerHTML=relatedConflicts.map((x:D)=>`<div class="item"><span class="tag">${esc(x.type)}</span><b>${esc(x.subject)}</b><div class="muted">${esc(x.scope)} · ${esc(x.rule)}</div></div>`).join('')||'<span class="muted">No claim-specific conflict mapped to this profile.</span>';
    el('events').innerHTML=EV.filter((x:D)=>x.prophet_id===key).map((x:D)=>`<div class="item"><span class="tag">${esc(x.slot)}</span> <b>${esc(x.summary)}</b><div class="muted">${esc(x.era)} · ${esc(x.evidence)} · ${x.refs.map((r:string)=>'QS '+r).join(' · ')}</div></div>`).join('');
    el('relations').innerHTML=GN.relations.filter((r:D)=>r.from===`prophet:${key}`||r.to===`prophet:${key}`).map((r:D)=>`<div class="item"><span class="tag">${esc(r.kind)}</span> <b>${esc(r.from.replace('prophet:',''))} ↔ ${esc(r.to.replace('prophet:',''))}</b><div class="muted">${esc(r.confidence)} · ${r.refs.join(' · ')}</div></div>`).join('')||'<span class="muted">No conservative genealogy relation stored.</span>';
  }

  el('corpus').innerHTML=CR.sources.map((x:D)=>{const ed=SE.editions.find((e:D)=>e.source_id===x.id);return `<div class="item"><span class="tag">#${x.priority}</span> <b>${esc(x.book)}</b><div>${esc(x.role)}</div><div class="muted">${esc(x.working_witness??'Primary Qur’anic corpus')} · ${esc(x.reference_scheme)}</div><div class="muted">Edition status: ${esc(ed?.status??'UNKNOWN')} · raw ingested ${String(ed?.raw_text_ingested??false)}</div><div class="muted">${esc(x.claim_guardrail)}</div></div>`}).join('');
  list('traitleader',L.trait_evidence);list('dataleader',L.data_confidence);list('worldleader',L.world_trait_salience);list('contextleader',L.context_evidence,'context_score');
  el('traittop').textContent=L.trait_evidence.filter((x:D)=>x.rank===1).map((x:D)=>x.prophet_name).join(' · ');
  el('datatop').textContent=`${L.data_confidence[0]?.prophet_name??'—'} · ${Number(L.data_confidence[0]?.score??0).toFixed(2)}`;
  el('contexttop').textContent=`${L.context_evidence[0]?.prophet_name??'—'} · ${Number(L.context_evidence[0]?.context_score??0).toFixed(2)}`;
  el('prefstatus').textContent=L.human_preference.status;
  renderArchitecture();

  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(x=>x.classList.remove('active'));
    el(b.dataset.tab??'profile').classList.remove('hidden');b.classList.add('active');
  });
  sel.onchange=()=>{key=sel.value;render()};
  render();
}

main().catch(e=>el('app-error').textContent=String(e));
