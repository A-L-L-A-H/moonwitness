import { StrictMode, useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Play, Pause, RefreshCw, FileText, Network, BookOpen, Scale, Settings2, Grid } from 'lucide-react';
import { Card, Badge, Progress } from './components/ui';
import { getJSON, runResearch, searchQuran } from './lib/api';
import { corpusStatus, downloadCorpus, verifyCorpus } from './lib/corpus';
import './styles.css';

type Tab = 'overview' | 'autopilot' | 'claims' | 'manuscripts' | 'entities' | 'corpus' | 'graph' | 'matrix' | 'scoring' | 'reports' | 'reader' | 'crosswalk' | 'chat';

export const paradigms: Record<string, { label: string, weights: Record<string, number> }> = {
  secular: { label: 'Universal (Secular)', weights: { torah: 1, psalms: 1, prophets: 1, gospels: 1, epistles: 1, quran: 1, hadith: 1 } },
  islamic: { label: 'Islamic Sunni', weights: { torah: 0.5, psalms: 0.5, prophets: 0.5, gospels: 0.5, epistles: 0, quran: 1, hadith: 1 } },
  christian: { label: 'Christian Orthodox', weights: { torah: 1, psalms: 1, prophets: 1, gospels: 1, epistles: 1, quran: 0, hadith: 0 } },
  judaic: { label: 'Judaic Orthodox', weights: { torah: 1, psalms: 1, prophets: 1, gospels: 0, epistles: 0, quran: 0, hadith: 0 } }
};

function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [paradigm, setParadigm] = useState('secular');
  const [health, setHealth] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [aggregatedScores, setAggregatedScores] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [topic, setTopic] = useState('isa');
  const [log, setLog] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [qResults, setQResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [corpusBusy, setCorpusBusy] = useState(false);
  const [corpusRows, setCorpusRows] = useState<any[]>([]);
  const [corpusLog, setCorpusLog] = useState<string[]>([]);

  const refresh = async () => {
    try {
      setError('');
      const [h, r, a] = await Promise.all([getJSON('/api/health'), getJSON('/api/report'), getJSON('/api/scoring/aggregate').catch(()=>null)]);
      setHealth(h); setReport(r); setAggregatedScores(a);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { void refresh(); void refreshCorpus(); }, []);
  const refreshCorpus = async () => { try { setCorpusRows(await corpusStatus()); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } };
  
  const downloadAll = async () => { 
    setCorpusBusy(true); setError(''); setCorpusLog(['Starting download sequence...']);
    try { 
      const currentRows = await corpusStatus();
      setCorpusRows(currentRows);
      const missing = currentRows.filter((r:any) => r.status === 'MISSING' || r.status === 'LOCAL_PARTIAL_OR_READY');
      if (missing.length === 0) {
        setCorpusLog(l => [...l, 'Everything is already downloaded.']);
      } else {
        for (const m of missing) {
          setCorpusLog(l => [...l, `Downloading ${m.id} (${m.label})...`]);
          await downloadCorpus(m.id);
          setCorpusLog(l => [...l, `✓ ${m.id} completed.`]);
          await refreshCorpus();
        }
        setCorpusLog(l => [...l, 'All downloads completed.']);
      }
    } catch (e) { 
      setCorpusLog(l => [...l, `ERROR: ${e instanceof Error ? e.message : String(e)}`]);
    } finally { 
      setCorpusBusy(false); 
    } 
  };
  const verifyAll = async () => { setCorpusBusy(true); setError(''); try { await verifyCorpus(); await refreshCorpus(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setCorpusBusy(false); } };

  const start = async () => {
    setRunning(true); setTab('autopilot'); setLog([`Starting Autopilot: ${topic}`]);
    try {
      setLog(x => [...x, 'Retrieving local evidence…']);
      const result = await runResearch(topic);
      setLog(x => [...x, 'Evidence graph updated', 'Scoring gate evaluated', 'Research report generated']);
      await refresh();
      setLog(x => [...x, `Completed: ${result?.status ?? 'done'}`]);
    } catch (e) {
      setLog(x => [...x, `ERROR: ${e instanceof Error ? e.message : String(e)}`]);
    } finally { setRunning(false); }
  };
  const runSearch = async () => {
    try { 
      const res = await fetch(`/api/corpus/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setQResults(data);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  const corpus = report?.corpusStatus ?? {};
  const graph = report?.graph ?? { nodes: 0, edges: 0 };
  const scoreStatus = report?.scorecard ?? null;
  const nav = useMemo(() => [
    ['overview', 'Overview', BookOpen], ['autopilot', 'Autopilot', Play], ['claims', 'Claims', FileText],
    ['manuscripts', 'Manuscripts', BookOpen], ['entities', 'Entities', FileText],
    ['corpus', 'Corpus', BookOpen], ['graph', 'Evidence Graph', Network], ['matrix', 'Heatmap', Grid], ['scoring', 'Scoring', Scale], ['reports', 'Reports', FileText],
    ['reader', 'Reader', BookOpen], ['crosswalk', 'Crosswalk', Network], ['chat', 'Assistant', Network]
  ] as const, []);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">DV</div><div><strong>Divine Text</strong><span>Verification</span></div></div>
      <div className="nav">{nav.map(([id, label, Icon]) => <button key={id} className={tab===id?'nav-item active':'nav-item'} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>
      <div className="sidebar-footer"><Badge tone="good">LOCAL</Badge><span>Deterministic core</span></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><h1>{tab === 'autopilot' ? 'Research Autopilot' : 'Research Workbench'}</h1><p>Evidence-first scripture research · local only</p></div>
        <div className="top-actions">
          <select value={paradigm} onChange={e => setParadigm(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold' }}>
            {Object.entries(paradigms).map(([k, v]) => <option key={k} value={k}>🔭 Lens: {v.label}</option>)}
          </select>
          <button className="icon-btn" onClick={()=>void refresh()} title="Refresh"><RefreshCw size={18}/></button>
          <button className="settings"><Settings2 size={16}/> Settings</button>
        </div>
      </header>
      {error && <div className="alert danger">{error}</div>}
      {tab === 'overview' && <Overview health={health} report={report} corpus={corpus} graph={graph} aggregatedScores={aggregatedScores} paradigm={paradigm} />}
      {tab === 'autopilot' && <Autopilot running={running} topic={topic} setTopic={setTopic} start={start} log={log} />}
      {tab === 'claims' && <ClaimsEngine paradigm={paradigm} />}
      {tab === 'manuscripts' && <Manuscripts />}
      {tab === 'entities' && <Entities />}
      {tab === 'corpus' && <Corpus corpus={corpus} rows={corpusRows} busy={corpusBusy} downloadAll={downloadAll} verifyAll={verifyAll} q={q} setQ={setQ} results={qResults} runSearch={runSearch} corpusLog={corpusLog} paradigm={paradigm} />}
      {tab === 'graph' && <EvidenceGraph paradigm={paradigm} />}
      {tab === 'matrix' && <TheologyMatrix paradigm={paradigm} />}
      {tab === 'scoring' && <Scoring report={report} scoreStatus={scoreStatus} />}
      {tab === 'reports' && <Reports report={report} />}
      {tab === 'reader' && <ScriptureReader q={q} setQ={setQ} results={qResults} runSearch={runSearch} />}
      {tab === 'crosswalk' && <Crosswalk />}
      {tab === 'chat' && <ChatAssistant />}
    </main>
  </div>
}

function Overview({ health, report, corpus, graph, aggregatedScores }: any) {
  const total = 5; 
  const local = Object.values(corpus).filter((x:any)=>x==='LOCAL').length; 
  const progress = Math.round(local/total*100);
  
  const scorecard = report?.scorecard?.scores || [];
  const groundedClaims = scorecard.filter((s:any) => s.status === 'EVIDENCE_GROUNDED').length;
  
  let globalScore = 0;
  let sourceCount = 0;
  if (aggregatedScores && aggregatedScores.sources) {
    for (const sData of Object.values(aggregatedScores.sources) as any[]) {
      if (sData.aggregatedScore > 0) {
        globalScore += sData.aggregatedScore;
        sourceCount++;
      }
    }
    if (sourceCount > 0) globalScore = Math.round(globalScore / sourceCount);
  }

  return <div className="grid">
    <div className="span-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '8px' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white', border: 'none' }}>
        <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Global Score</h3>
        <div style={{ fontSize: '42px', fontWeight: 800, marginTop: '8px' }}>{globalScore || '--'}</div>
        <div style={{ opacity: 0.8, fontSize: '12px' }}>Aggregated across all corpora</div>
      </div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none' }}>
        <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Books Annotated</h3>
        <div style={{ fontSize: '42px', fontWeight: 800, marginTop: '8px' }}>{aggregatedScores?.totalBooksScored || 0}</div>
        <div style={{ opacity: 0.8, fontSize: '12px' }}>Total books with scores</div>
      </div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none' }}>
        <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Grounded Claims</h3>
        <div style={{ fontSize: '42px', fontWeight: 800, marginTop: '8px' }}>{groundedClaims}</div>
        <div style={{ opacity: 0.8, fontSize: '12px' }}>Out of {scorecard.length} total claims</div>
      </div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
        <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Evidence Nodes</h3>
        <div style={{ fontSize: '42px', fontWeight: 800, marginTop: '8px' }}>{graph.nodes ?? 0}</div>
        <div style={{ opacity: 0.8, fontSize: '12px' }}>Active knowledge graph entities</div>
      </div>
    </div>

    <Card className="hero" title="AUTOPILOT"><div className="hero-row"><div><h2>Research continuously, without changing source texts.</h2><p>Use the Autopilot tab to run a predefined evidence pipeline and stop automatically when human review is required.</p></div><div className="hero-stat"><span>{report?.claims ?? 0}</span><small>claims</small></div></div></Card>
    
    <Card title="Corpus Data Readiness">
      <div className="metric-line"><span>Local coverage</span><strong>{progress}%</strong></div>
      <Progress value={progress}/>
      <div className="status-grid" style={{ marginTop: '1rem' }}>
        {Object.entries(corpus).map(([k,v])=><div key={k} className="status-item"><span>{k}</span><Badge tone={v==='LOCAL'?'good':'warn'}>{String(v)}</Badge></div>)}
      </div>
    </Card>

    <Card title="Evidentiary Progress & Health">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="status-item"><span>Active Edges</span><Badge tone={graph.edges ? 'good':'warn'}>{graph.edges ? 'ACTIVE':'NO_RELATIONS'}</Badge></div>
        <div className="status-item"><span>Review Gate</span><Badge tone={report?.scorecard?.reviewGate?.gate === 'AUTO_CLEAR' ? 'good' : 'warn'}>{report?.scorecard?.reviewGate?.gate || 'UNKNOWN'}</Badge></div>
        <div className="status-item"><span>API Gateway</span><Badge tone={health?.ok?'good':'danger'}>{health?.ok?'ONLINE':'OFFLINE'}</Badge></div>
        <div className="status-item"><span>Engine Version</span><strong>{health?.version ?? '—'}</strong></div>
      </div>
    </Card>
  </div>
}

function Autopilot({ running, topic, setTopic, start, log }: any) {
  return <div className="grid">
    <Card title="Start Autopilot" className="span-2"><div className="control-row">
      <select value={topic} onChange={e=>setTopic(e.target.value)}>
        <option value="isa">Isa / Jesus (Injil)</option>
        <option value="musa">Musa / Moses (Torah)</option>
        <option value="dawud">Dawud / David (Zabur)</option>
      </select>
      <button className="primary" onClick={start} disabled={running}>{running?<><Pause size={17}/> RUNNING</>:<><Play size={17}/> START AUTOPILOT</>}</button></div><div className="pipeline"><span>Discover</span><span>Retrieve</span><span>Compare</span><span>Score</span><span>Review Gate</span><span>Report</span></div></Card>
    <Card title="Live log" className="span-2"><div className="log">{log.length ? log.map((x:string,i:number)=><div key={i}><span>{String(i+1).padStart(2,'0')}</span>{x}</div>) : <div className="muted">Ready.</div>}</div></Card>
  </div>
}
function Corpus({ corpus, rows, busy, downloadAll, verifyAll, q, setQ, results, runSearch, corpusLog }: any){
  return <div className="grid">
    <Card title="Corpus control">
      <div className="control-row">
        <button className="primary" onClick={downloadAll} disabled={busy}>{busy ? 'WORKING…' : 'DOWNLOAD ALL MISSING'}</button>
        <button className="settings" onClick={verifyAll} disabled={busy}>VERIFY / HASH</button>
      </div>
      <p className="muted">Downloads only sources defined in the local corpus registry. Raw source files are preserved; the engine never edits them.</p>
      
      {corpusLog && corpusLog.length > 0 && (
        <div className="log" style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
          {corpusLog.map((x:string, i:number) => (
            <div key={i}><span>{String(i+1).padStart(2,'0')}</span>{x}</div>
          ))}
        </div>
      )}

      <div className="status-grid">{rows.map((r:any)=><div key={r.id} className="status-item"><span>{r.id}</span><Badge tone={r.status?.startsWith('LOCAL')?'good':'warn'}>{r.status}</Badge></div>)}</div>
    </Card>
    <Card title="Corpus status">
      <table><thead><tr><th>Corpus</th><th>Status</th><th>Raw files</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td>{r.label}</td><td><Badge tone={r.status?.startsWith('LOCAL')?'good':'warn'}>{r.status}</Badge></td><td>{r.raw_files}</td></tr>)}</tbody></table>
    </Card>
  </div>
}
function Evidence({ graph }: any){
  const nodes = graph?.nodeList || [];
  const edges = graph?.edgeList || [];
  return (
    <div className="grid">
      <Card title="Evidence Graph Summary">
        <div className="graph-summary">
          <div className="big-number">{graph.nodes ?? 0}</div><span>nodes</span>
          <div className="big-number">{graph.edges ?? 0}</div><span>edges</span>
        </div>
        <p className="muted">Relations are only displayed when explicitly present in the evidence ledger.</p>
      </Card>
      {nodes.length > 0 && (
        <Card title="Nodes (Claims & Texts)" className="span-2">
          <table>
            <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Claim/Text</th></tr></thead>
            <tbody>
              {nodes.map((n:any)=><tr key={n.id}><td><strong>{n.id}</strong></td><td><Badge tone="neutral">{n.type}</Badge></td><td><Badge tone={n.status?.includes('EXPLICIT')?'good':n.status?.includes('UNRESOLVED')?'danger':'warn'}>{n.status}</Badge></td><td>{n.text}</td></tr>)}
            </tbody>
          </table>
        </Card>
      )}
      {edges.length > 0 && (
        <Card title="Edges (Relations)" className="span-2">
          <table>
            <thead><tr><th>From</th><th>Relation Type</th><th>To</th><th>Evidence Status</th></tr></thead>
            <tbody>
              {edges.map((e:any, i:number)=><tr key={i}><td><strong>{e.from}</strong></td><td><Badge tone="neutral">{e.relation}</Badge></td><td><strong>{e.to}</strong></td><td><Badge tone={e.evidence_status==='explicit'?'good':'warn'}>{e.evidence_status}</Badge></td></tr>)}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Crosswalk() {
  const [selectedVerseA, setSelectedVerseA] = useState<any>(null);
  const [selectedVerseB, setSelectedVerseB] = useState<any>(null);
  const [relationship, setRelationship] = useState('THEMATIC_PARALLEL');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [arbitrating, setArbitrating] = useState<string | null>(null);

  const loadLinks = () => {
    getJSON<any[]>('/api/crosswalk/read').then(setLinks).catch(console.error);
  };

  useEffect(() => { loadLinks(); }, []);

  const handleLink = async () => {
    if (!selectedVerseA || !selectedVerseB) return;
    setSaving(true);
    try {
      const res = await fetch('/api/crosswalk/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sourceA: selectedVerseA.id,
          sourceB: selectedVerseB.id,
          relationship,
          notes
        })
      });
      if(!res.ok) throw new Error(await res.text());
      setSelectedVerseA(null);
      setSelectedVerseB(null);
      setNotes('');
      loadLinks();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleArbitrate = async (l: any) => {
    const linkId = l.sourceA + '_' + l.sourceB;
    setArbitrating(linkId);
    try {
      const res = await fetch('/api/crosswalk/arbitrate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ sourceA: l.sourceA, sourceB: l.sourceB })
      });
      if(!res.ok) throw new Error(await res.text());
      loadLinks();
    } catch(e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setArbitrating(null);
    }
  };

  return (
    <div className="grid">
      <Card title="🔗 Crosswalk Studio: Side-by-Side Verse Linker" className="span-2">
        <p className="muted">Select a verse from Corpus A and Corpus B to establish a permanent evidentiary link.</p>
        
        {links.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Established Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {links.map((l, i) => {
                const isContradiction = l.relationship === 'CONTRADICTION' || l.relationship === 'THEOLOGICAL_CONTRAST';
                const linkId = l.sourceA + '_' + l.sourceB;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, fontSize: '1.1em' }}><strong>{l.sourceA}</strong> <span style={{color: '#94a3b8', padding: '0 0.5rem'}}>↔</span> <strong>{l.sourceB}</strong></div>
                      <Badge tone={l.relationship === 'CONTRADICTION' ? 'danger' : 'neutral'}>{l.relationship.replace('_', ' ')}</Badge>
                    </div>
                    {l.notes && <div className="muted" style={{ fontStyle: 'italic', borderLeft: '3px solid #cbd5e1', paddingLeft: '0.5rem', marginTop: '0.5rem' }}>"{l.notes}"</div>}
                    
                    {isContradiction && !l.arbitration_report && (
                      <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                        <button 
                          style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => handleArbitrate(l)}
                          disabled={arbitrating === linkId}
                        >
                          {arbitrating === linkId ? '⚖️ Arbitrating...' : '⚖️ Summon AI Arbiter'}
                        </button>
                      </div>
                    )}
                    
                    {l.arbitration_report && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚖️ Arbitration Report</h4>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#451a03', fontSize: '0.9em' }}>
                          {l.arbitration_report}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(selectedVerseA || selectedVerseB) && (
          <div style={{ position: 'sticky', top: '10px', zIndex: 100, background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: '2px solid var(--color-primary)', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>Create Link</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1, padding: '0.5rem', background: '#f1f5f9', borderRadius: '4px' }}>
                <strong>Corpus A:</strong> {selectedVerseA ? selectedVerseA.id : <span className="muted">Select a verse below...</span>}
              </div>
              <div style={{ fontSize: '1.5rem', color: '#94a3b8' }}>↔</div>
              <div style={{ flex: 1, padding: '0.5rem', background: '#f1f5f9', borderRadius: '4px' }}>
                <strong>Corpus B:</strong> {selectedVerseB ? selectedVerseB.id : <span className="muted">Select a verse below...</span>}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select value={relationship} onChange={e=>setRelationship(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <option value="THEMATIC_PARALLEL">Thematic Parallel</option>
                <option value="DIRECT_QUOTATION">Direct Quotation</option>
                <option value="THEOLOGICAL_CONTRAST">Theological Contrast</option>
                <option value="CONTRADICTION">Contradiction Candidate</option>
              </select>
              <input type="text" placeholder="Research notes..." value={notes} onChange={e=>setNotes(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              <button className="primary" onClick={handleLink} disabled={saving || !selectedVerseA || !selectedVerseB}>
                {saving ? 'Linking...' : '🔗 Save Link'}
              </button>
              <button className="secondary" onClick={() => { setSelectedVerseA(null); setSelectedVerseB(null); }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: selectedVerseA ? '#f0fdf4' : 'transparent' }}>
            <h3 style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem' }}>Corpus A</h3>
            <ScriptureReader compact={true} onSelectVerse={(id:string, v:any) => setSelectedVerseA({id, ...v})} />
          </div>
          <div style={{ flex: 1, minWidth: 0, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: selectedVerseB ? '#eff6ff' : 'transparent' }}>
            <h3 style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem' }}>Corpus B</h3>
            <ScriptureReader compact={true} onSelectVerse={(id:string, v:any) => setSelectedVerseB({id, ...v})} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function EvidenceGraph({ paradigm }: { paradigm?: string }) {
  const [links, setLinks] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [isChronological, setIsChronological] = useState(false);

  useEffect(() => {
    getJSON<any[]>('/api/crosswalk/read').then(setLinks).catch(console.error);
    getJSON<any[]>('/api/claims/read').then(setClaims).catch(console.error);
  }, []);

  const getGraphHtml = () => {
    const nodes = new Map();
    const edges: any[] = [];
    const EPOCHS: Record<string, number> = { torah: 0, psalms: 1, prophets: 2, gospels: 3, epistles: 4, quran: 5, hadith: 6 };

    // 1. Process Crosswalk Links
    links.forEach(l => {
      if (!nodes.has(l.sourceA)) {
        const sId = l.sourceA.split('_')[0];
        const weight = paradigms[paradigm || 'secular'].weights[sId] ?? 1;
        nodes.set(l.sourceA, { id: l.sourceA, label: l.sourceA.split('_').join('\n'), shape: 'dot', size: weight === 0 ? 5 : 15, color: weight === 0 ? '#e2e8f0' : '#3b82f6', font: { color: weight === 0 ? '#cbd5e1' : '#1e293b' }, level: EPOCHS[sId] ?? 8 });
      }
      if (!nodes.has(l.sourceB)) {
        const sId = l.sourceB.split('_')[0];
        const weight = paradigms[paradigm || 'secular'].weights[sId] ?? 1;
        nodes.set(l.sourceB, { id: l.sourceB, label: l.sourceB.split('_').join('\n'), shape: 'dot', size: weight === 0 ? 5 : 15, color: weight === 0 ? '#e2e8f0' : '#3b82f6', font: { color: weight === 0 ? '#cbd5e1' : '#1e293b' }, level: EPOCHS[sId] ?? 8 });
      }
      
      let color = '#94a3b8'; // Neutral
      let dashes = false;
      
      if (l.type === 'CONTRADICTION') { color = '#ef4444'; dashes = true; }
      else if (l.type === 'THEOLOGICAL_PARALLEL') color = '#10b981';
      else if (l.type === 'PROPHETIC_FULFILLMENT') color = '#8b5cf6';

      const sIdA = l.sourceA.split('_')[0];
      const sIdB = l.sourceB.split('_')[0];
      const wA = paradigms[paradigm || 'secular'].weights[sIdA] ?? 1;
      const wB = paradigms[paradigm || 'secular'].weights[sIdB] ?? 1;
      if (wA === 0 || wB === 0) color = '#e2e8f0';

      edges.push({
        from: l.sourceA,
        to: l.sourceB,
        color: { color },
        dashes,
        title: `${l.relationship.replace('_', ' ')}: ${l.notes || 'No notes'}`
      });
    });

    // 2. Process Claims & Attached Evidence
    claims.forEach(c => {
      // Create Claim Node (Square, prominent)
      nodes.set(c.id, { 
        id: c.id, 
        label: c.title.substring(0, 20) + '...', 
        shape: 'box', 
        size: 30, 
        color: { background: '#f8fafc', border: '#cbd5e1' }, 
        font: { size: 18, color: '#0f172a', bold: true },
        title: c.title + '\n' + c.description,
        level: 9
      });

      // Attach Evidences
      c.evidence?.forEach((e:any) => {
        const verseId = `${e.sourceId}_${e.bookId}_${e.chapterNum}_${e.verseNum}`;
        if (!nodes.has(verseId)) {
          nodes.set(verseId, { id: verseId, label: verseId.split('_').join('\n'), shape: 'dot', size: 15, color: '#3b82f6', level: EPOCHS[e.sourceId] ?? 8 });
        }
        
        edges.push({
          from: verseId,
          to: c.id,
          color: { color: e.type === 'SUPPORT' ? '#10b981' : '#ef4444' },
          arrows: 'to',
          title: `${e.type} evidence`
        });
      });
    });

    const nodesArr = Array.from(nodes.values());

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; width: 100%; font-family: Inter, sans-serif; }
          #mynetwork { width: 100%; height: 100%; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div id="mynetwork"></div>
        <script>
          const nodes = new vis.DataSet(${JSON.stringify(nodesArr)});
          const edges = new vis.DataSet(${JSON.stringify(edges)});
          const container = document.getElementById('mynetwork');
          const data = { nodes: nodes, edges: edges };
          const options = {
            nodes: {
              font: { size: 12, face: 'Inter' },
              borderWidth: 2,
              color: { background: 'white', border: '#4f46e5', highlight: { background: '#e0e7ff', border: '#4f46e5' } }
            },
            edges: { width: 2, smooth: { type: 'continuous' } },
            physics: { barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 150 } },
            interaction: { hover: true, tooltipDelay: 200 },
            layout: { hierarchical: ${isChronological ? "{ enabled: true, direction: 'LR', sortMethod: 'directed', levelSeparation: 250, nodeSpacing: 100 }" : "false"} }
          };
          new vis.Network(container, data, options);
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div className="grid">
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Interactive Evidence Graph</span>
          <button 
            onClick={() => setIsChronological(!isChronological)}
            style={{ background: isChronological ? 'linear-gradient(to right, #ec4899, #8b5cf6)' : '#e2e8f0', color: isChronological ? 'white' : '#475569', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            {isChronological ? '🕰️ Chronological Flow: ON' : '🕰️ Chronological Flow: OFF'}
          </button>
        </div>
      } className="span-2">
        <p className="muted">Visual mapping of all established cross-scripture textual connections. Toggle Chronological Flow to see how ideas evolve through history.</p>
        <div style={{ width: '100%', height: '600px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
          <iframe 
            srcDoc={getGraphHtml()} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Evidence Graph"
          />
        </div>
      </Card>
    </div>
  );
}

function ChatAssistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Halo! Saya adalah Asisten Teologi Lintas Kitab Anda. Ada yang bisa saya bantu hari ini terkait riset korpus Abrahamik Anda?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages([...newMsgs, { role: 'assistant', content: data.text }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : String(e)}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <Card title="Asisten AI Teologi" className="span-2">
        <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#3b82f6' : 'white', color: m.role === 'user' ? 'white' : '#1e293b', padding: '0.75rem', borderRadius: '8px', maxWidth: '80%', border: m.role === 'user' ? 'none' : '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', color: '#94a3b8' }}>Asisten sedang mengetik...</div>}
            <div ref={endRef} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Tanyakan sesuatu tentang sejarah teologi..." 
              style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              disabled={loading}
            />
            <button className="primary" onClick={send} disabled={loading || !input.trim()}>Kirim</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TheologyMatrix({ paradigm }: { paradigm?: string }) {
  const [claims, setClaims] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ claim: any, sourceId: string } | null>(null);

  useEffect(() => {
    getJSON<any[]>('/api/claims/read').then(setClaims).catch(console.error);
    getJSON<any>('/api/corpus/registry').then(reg => {
      setSources(reg.sources || []);
    }).catch(console.error);
  }, []);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'transparent';
    if (count < 3) return '#fca5a5'; // light red
    if (count < 5) return '#ef4444'; // red
    if (count < 10) return '#b91c1c'; // dark red
    return '#7f1d1d'; // darkest red
  };

  return (
    <div className="grid">
      <Card title="Theological Heatmap (Density Matrix)" className="span-2">
        <p className="muted">Visualize the density of evidence across different holy texts for each theological claim.</p>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #cbd5e1' }}>Claim</th>
                {sources.map((s: any) => (
                  <th key={s.id} style={{ padding: '0.5rem', borderBottom: '2px solid #cbd5e1' }}>{s.id.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.title}>
                    <strong>{c.title}</strong>
                  </td>
                  {sources.map((s: any) => {
                    const weight = paradigms[paradigm || 'secular'].weights[s.id] ?? 1;
                    const count = Math.round((c.evidence || []).filter((e:any) => e.sourceId === s.id).length * weight);
                    const isRejected = weight === 0;
                    return (
                      <td 
                        key={s.id} 
                        style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: isRejected ? 'transparent' : getHeatmapColor(count), cursor: count > 0 ? 'pointer' : 'default', color: isRejected ? '#cbd5e1' : (count > 2 ? 'white' : 'inherit') }}
                        onClick={() => { if(count > 0) setSelectedCell({ claim: c, sourceId: s.id }); }}
                      >
                        {isRejected ? '✕' : (count > 0 ? count : '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCell && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Evidence in {selectedCell.sourceId.toUpperCase()} for "{selectedCell.claim.title}"</h3>
              <button onClick={() => setSelectedCell(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖️</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedCell.claim.evidence.filter((e:any) => e.sourceId === selectedCell.sourceId).map((e:any, i:number) => (
                <div key={i} style={{ padding: '0.75rem', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1e40af' }}>{e.sourceId.toUpperCase()} {e.bookId} {e.chapterNum}:{e.verseNum}</div>
                  <Badge tone={e.type === 'SUPPORT' ? 'good' : 'danger'}>{e.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ClaimsEngine({ paradigm }: { paradigm?: string }) {
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [synthesizing, setSynthesizing] = useState<string | null>(null);
  const [miningClaim, setMiningClaim] = useState<string | null>(null);
  const [redTeaming, setRedTeaming] = useState<string | null>(null);
  const [minedEvidence, setMinedEvidence] = useState<Record<string, any[]>>({});

  const stopWords = new Set(['is', 'the', 'was', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'in', 'of', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'it', 'that', 'this', 'are', 'were', 'be', 'as', 'has', 'had']);

  const mineEvidence = async (claim: any) => {
    setMiningClaim(claim.id);
    try {
      const words = claim.title.split(/\s+/).map((w:string) => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()).filter((w:string) => w.length > 2 && !stopWords.has(w));
      const keywords = words.join(' ');
      const res = await fetch(`/api/corpus/search?q=${encodeURIComponent(keywords)}&limit=5`);
      const data = await res.json();
      setMinedEvidence(prev => ({ ...prev, [claim.id]: data || [] }));
    } catch (e) {
      alert(e);
    } finally {
      setMiningClaim(null);
    }
  };

  const attachFromMiner = async (claimId: string, verse: any, type: string) => {
    try {
      const res = await fetch('/api/claims/attach', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          claimId, 
          sourceId: verse.sourceId, 
          bookId: verse.bookId, 
          chapterNum: verse.chapterNum, 
          verseNum: verse.verseNum, 
          type, 
          text: verse.text 
        })
      });
      if(!res.ok) throw new Error(await res.text());
      loadClaims(); // Refresh to show newly attached evidence
    } catch(e) { alert(e); }
  };

  const loadClaims = () => getJSON<any[]>('/api/claims/read').then(setClaimsList).catch(console.error);
  useEffect(() => { loadClaims(); }, []);

  const handleCreate = async () => {
    if (!newTitle) return;
    try {
      await fetch('/api/claims/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, status: 'UNRESOLVED' })
      });
      setNewTitle(''); setNewDesc('');
      loadClaims();
    } catch(e) {
      alert(e);
    }
  };

  const handleSynthesize = async (id: string) => {
    setSynthesizing(id);
    try {
      const res = await fetch('/api/claims/synthesize', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ claimId: id }) });
      if(!res.ok) throw new Error(await res.text());
      loadClaims();
    } catch(e) { alert(e instanceof Error ? e.message : String(e)); } finally { setSynthesizing(null); }
  };

  const handleRedTeam = async (id: string) => {
    setRedTeaming(id);
    try {
      const res = await fetch('/api/claims/redteam', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ claimId: id }) });
      if(!res.ok) throw new Error(await res.text());
      loadClaims();
    } catch(e) { alert(e instanceof Error ? e.message : String(e)); } finally { setRedTeaming(null); }
  };

  const handleExport = () => {
    let md = `# Theological Verification Engine - Academic Report\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;
    claimsList.forEach(c => {
      md += `## ${c.title}\n`;
      md += `**Hypothesis:** ${c.description}\n\n`;
      if (c.synthesis) {
        md += `### AI Academic Synthesis\n${c.synthesis}\n\n`;
      }
      md += `### Primary Evidence\n`;
      if (!c.evidence || c.evidence.length === 0) md += `*No evidence attached.*\n`;
      c.evidence?.forEach((e:any) => {
        md += `- **[${e.type}]** ${e.sourceId.toUpperCase()} ${e.bookId} ${e.chapterNum}:${e.verseNum}  \n  > "${e.text}"\n`;
      });
      md += `\n---\n\n`;
    });
    
    const blob = new Blob([md], {type: 'text/markdown'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Theological_Research_Report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to delete this entire claim and all its attached evidence?')) return;
    try {
      const res = await fetch('/api/claims/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId })
      });
      if(!res.ok) throw new Error(await res.text());
      loadClaims();
    } catch(e) { alert(e); }
  };

  const handleDetachVerse = async (claimId: string, e: any) => {
    if (!confirm('Remove this evidence from the claim?')) return;
    const verseId = `${e.sourceId}_${e.bookId}_${e.chapterNum}_${e.verseNum}`;
    try {
      const res = await fetch('/api/claims/detach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, verseId })
      });
      if(!res.ok) throw new Error(await res.text());
      loadClaims();
    } catch(err) { alert(err); }
  };

  return (
    <div className="grid">
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📌 The Claims Engine (Ideological Mapping)</span>
          <button className="primary" onClick={handleExport} disabled={claimsList.length === 0} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
            📄 Export Academic Paper (.md)
          </button>
        </div>
      } className="span-2">
        <p className="muted">Map verses from different corpora to specific theological claims as supporting or refuting evidence.</p>
        
        <div style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '2rem' }}>
          <h4>Create New Claim</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Claim Title (e.g., Fasting requires total abstinence)" style={{ padding: '0.5rem' }} />
            <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Description or hypothesis..." style={{ padding: '0.5rem', height: '60px' }} />
            <button className="primary" onClick={handleCreate} style={{ alignSelf: 'flex-start' }}>Create Claim</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {claimsList.map(c => (
            <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {c.title}
                  <button 
                    onClick={() => handleDeleteClaim(c.id)} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0' }}
                    title="Delete Claim"
                  >
                    🗑️
                  </button>
                </h3>
                <Badge tone={c.status === 'RESOLVED' ? 'good' : 'warn'}>{c.status}</Badge>
              </div>
              <p className="muted">{c.description}</p>
              
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5 style={{ margin: 0 }}>Attached Evidence ({c.evidence?.length || 0})</h5>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      onClick={() => mineEvidence(c)}
                      disabled={miningClaim === c.id}
                    >
                      {miningClaim === c.id ? '⛏️ Mining...' : '⛏️ Auto-Mine Evidence'}
                    </button>
                    <button 
                      style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={() => handleSynthesize(c.id)}
                      disabled={synthesizing === c.id || !c.evidence || c.evidence.length === 0}
                    >
                      {synthesizing === c.id ? '🤖 Synthesizing...' : '🤖 Synthesize Conclusion'}
                    </button>
                    <button 
                      style={{ background: 'linear-gradient(to right, #ef4444, #991b1b)', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      onClick={() => handleRedTeam(c.id)}
                      disabled={redTeaming === c.id || !c.evidence || c.evidence.length === 0}
                    >
                      {redTeaming === c.id ? '🛡️ Stress Testing...' : '🛡️ Red-Team Claim'}
                    </button>
                  </div>
                </div>

                {minedEvidence[c.id] && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h5 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⛏️ Autonomous Miner Results</h5>
                      <button onClick={() => setMinedEvidence({...minedEvidence, [c.id]: null})} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✖️</button>
                    </div>
                    {minedEvidence[c.id].length === 0 ? <p className="muted" style={{ margin: 0 }}>No highly relevant verses found.</p> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {minedEvidence[c.id].map((v:any, i:number) => {
                          const isAttached = c.evidence?.some((e:any) => e.sourceId === v.sourceId && e.bookId === v.bookId && String(e.chapterNum) === String(v.chapterNum) && String(e.verseNum) === String(v.verseNum));
                          return (
                            <div key={i} style={{ padding: '0.5rem', background: 'white', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '0.85em', opacity: isAttached ? 0.5 : 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong style={{ color: '#92400e' }}>{v.sourceName || v.sourceId} {v.bookName || v.bookId} {v.chapterNum}:{v.verseNum}</strong>
                                {!isAttached && (
                                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                                    <button onClick={() => attachFromMiner(c.id, v, 'SUPPORT')} style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', cursor: 'pointer', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>[+] Support</button>
                                    <button onClick={() => attachFromMiner(c.id, v, 'REFUTE')} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', cursor: 'pointer', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>[-] Refute</button>
                                  </div>
                                )}
                              </div>
                              <div style={{ color: '#451a03', marginTop: '0.25rem' }}>{v.text}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {c.synthesis && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🤖 AI Academic Synthesis</h5>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#4c1d95', fontSize: '0.9em' }}>
                      {c.synthesis}
                    </div>
                  </div>
                )}
                
                {c.redTeamReport && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1e293b', border: '1px solid #ef4444', borderRadius: '6px', color: '#f8fafc' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🛡️ AI Red Team Report</h5>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#cbd5e1', fontSize: '0.9em' }}>
                      {c.redTeamReport}
                    </div>
                  </div>
                )}

                {c.evidence?.map((e:any, i:number) => {
                  const weight = paradigms[paradigm || 'secular'].weights[e.sourceId] ?? 1;
                  const isRejected = weight === 0;
                  return (
                  <div key={i} style={{ padding: '0.5rem', background: isRejected ? '#f1f5f9' : (e.type === 'SUPPORT' ? '#f0fdf4' : '#fef2f2'), border: `1px solid ${isRejected ? '#cbd5e1' : (e.type === 'SUPPORT' ? '#bbf7d0' : '#fecaca')}`, borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.9em', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: isRejected ? 0.5 : 1 }}>
                    <div>
                      {isRejected && <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '0.2rem' }}>[REJECTED BY AXIOMATIC LENS]</div>}
                      <strong style={{ textDecoration: isRejected ? 'line-through' : 'none' }}>{e.type}</strong> - <span style={{ textDecoration: isRejected ? 'line-through' : 'none' }}>{e.sourceId} {e.bookId} {e.chapterNum}:{e.verseNum}</span>
                      <div style={{ color: '#475569', marginTop: '0.25rem', textDecoration: isRejected ? 'line-through' : 'none' }}>{e.text}</div>
                    </div>
                    <button 
                      onClick={() => handleDetachVerse(c.id, e)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0 0 0 0.5rem' }}
                      title="Detach Evidence"
                    >
                      ✖️
                    </button>
                  </div>
                  );
                })}
                {(!c.evidence || c.evidence.length === 0) && <div className="muted" style={{ fontSize: '0.8em' }}>No evidence attached yet. Use the Reader tab to attach verses.</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Scoring({ report, scoreStatus }: any) {
  const [data, setData] = useState<any>(null);
  const scores = scoreStatus?.scores || [];

  useEffect(() => { getJSON<any>('/api/scoring/aggregate').then(setData).catch(console.error); }, []);

  const getTier = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 25) return 2;
    if (score > 0) return 1;
    return 0;
  };

  return (
    <div className="grid">
      <Card title="Current Readiness Overview (Autopilot)">
        <div className="status-grid">
          <div className="status-item"><span>Gate Status</span><Badge tone={scoreStatus?.reviewGate?.gate === 'AUTO_CLEAR' ? 'good' : 'warn'}>{scoreStatus?.reviewGate?.gate || 'UNKNOWN'}</Badge></div>
          <div className="status-item"><span>Pending Review</span><strong>{scoreStatus?.reviewGate?.pending_count || 0}</strong></div>
        </div>
      </Card>

      {scores.length > 0 && scores.map((s:any, i:number) => {
        const scoreVal = s.score?.total || 0;
        return (
          <Card key={i} title={s.text_reference || 'Claim Score'} className="span-2">
            <div className="metric-line">
              <span>{s.claim}</span>
              <strong>{scoreVal} / 100</strong>
            </div>
            <Progress value={scoreVal} />
            <div className="status-grid" style={{ marginTop: '1rem' }}>
              <div className="status-item"><span>Status</span><Badge tone={s.status === 'EVIDENCE_GROUNDED' ? 'good' : 'warn'}>{s.status}</Badge></div>
              {s.score && Object.entries(s.score).map(([k,v]) => {
                if (['total', 'status', 'basis', 'confidence'].includes(k)) return null;
                return <div key={k} className="status-item"><span>{k}</span><strong>{String(v)}</strong></div>
              })}
            </div>
          </Card>
        );
      })}

      <Card title="Differential Heatmap (Evidentiary Reliability)" className="span-2">
        <p className="muted">Visual mapping of Chapter-level reliability based on 5-Dimension CRAYON scores. Deep green indicates extreme historical proximity and low interpretation gap. Red indicates known corruptions or historical gaps.</p>
        {!data && <div className="muted" style={{marginTop:'1rem'}}>Loading heatmap data...</div>}
        
        {data && Object.entries(data.sources).map(([source, sData]: [string, any]) => (
          <div key={source} style={{ marginTop: '1.5rem', marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'white' }}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <span>CORPUS: {source.toUpperCase()}</span>
              <Badge tone="good">Avg Score: {sData.aggregatedScore}/100</Badge>
            </h3>

            {Object.entries(sData.books).map(([book, bData]: [string, any]) => (
              <div key={book} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>
                  <span>{book}</span>
                  <strong>{bData.aggregatedScore}/100</strong>
                </h4>
                
                <div className="heatmap-container">
                  {Object.entries(bData.chapters).sort(([a],[b])=>Number(a)-Number(b)).map(([chap, cData]: [string, any]) => {
                    const score = cData.aggregatedScore || 0;
                    return (
                      <div key={chap} className="heatmap-cell" data-tier={getTier(score)}>
                        {chap}
                        <div className="tooltip">
                          <strong>Chapter {chap}</strong><br/>
                          Score: {score}/100<br/>
                          Verses Annotated: {Object.keys(cData.verses).length}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '12px' }}>
          <strong>Legend:</strong>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="heatmap-cell" data-tier="5" style={{width:'16px',height:'16px'}}></div> Very Strong (90+)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="heatmap-cell" data-tier="4" style={{width:'16px',height:'16px'}}></div> Strong (70+)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="heatmap-cell" data-tier="3" style={{width:'16px',height:'16px'}}></div> Moderate (50+)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="heatmap-cell" data-tier="2" style={{width:'16px',height:'16px'}}></div> Weak (25+)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="heatmap-cell" data-tier="1" style={{width:'16px',height:'16px'}}></div> Very Weak / Pending</span>
        </div>
      </Card>
    </div>
  );
}
function Reports({ report }: any) {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/paper/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ topic: topic || 'Global Corpus Synthesis' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      const blob = new Blob([data.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Research_Paper_${topic.replace(/\s+/g, '_') || 'Synthesis'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  if (!report) return <Card title="Latest Report"><div className="muted">No report generated yet.</div></Card>;
  const { version, generatedAt, pending, claims, manuscripts, autopilot } = report;
  
  return (
    <div className="grid">
      <Card title="System Report Summary" className="span-2">
        <div className="status-grid">
          <div className="status-item"><span>Engine Version</span><strong>{version}</strong></div>
          <div className="status-item"><span>Generated At</span><strong>{new Date(generatedAt).toLocaleString()}</strong></div>
          <div className="status-item"><span>Total Claims</span><strong>{claims}</strong></div>
          <div className="status-item"><span>Manuscripts</span><strong>{manuscripts}</strong></div>
        </div>
      </Card>
      
      {autopilot && (
        <Card title="Last Autopilot Execution" className="span-2">
          <div className="status-grid">
            <div className="status-item"><span>Topic</span><Badge tone="neutral">{autopilot.topic}</Badge></div>
            <div className="status-item"><span>Entities Resolved</span><strong>{autopilot.entities_resolved?.join(', ') || 'None'}</strong></div>
            <div className="status-item"><span>Corpus Status</span><Badge tone={autopilot.corpus_status === 'PARTIAL' ? 'good' : 'warn'}>{autopilot.corpus_status}</Badge></div>
            <div className="status-item"><span>Review Gate</span><Badge tone={autopilot.review?.gate === 'AUTO_CLEAR' ? 'good' : 'warn'}>{autopilot.review?.gate || 'UNKNOWN'}</Badge></div>
          </div>
        </Card>
      )}

      {pending && pending.length > 0 && (
        <Card title="Pending Research Requirements" className="span-2">
          <p className="muted">The following items need to be satisfied to complete a full audit:</p>
          <ul>
            {pending.map((p:string, i:number) => <li key={i}>{p}</li>)}
          </ul>
        </Card>
      )}

      <Card title="🎓 One-Click Research Paper Generator" className="span-2" style={{ background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', border: '1px solid #cbd5e1' }}>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Automatically synthesize all your verse-level CRAYON annotations and 5-Dimension scores into a structured, academic Markdown paper using the configured local AI.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Topic (e.g. 'Konsep Keadilan')" 
            value={topic} 
            onChange={e => setTopic(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
          <button 
            onClick={handleGenerate} 
            disabled={generating}
            style={{ 
              background: 'linear-gradient(to right, #4f46e5, #9333ea)', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1
            }}
          >
            {generating ? '⚙️ Synthesizing...' : '🎓 Generate & Download Paper'}
          </button>
        </div>
      </Card>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);

function Manuscripts() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => { getJSON<any[]>('/api/manuscripts').then(setData).catch(()=>setData([])); }, []);
  return (
    <div className="grid">
      {data.length === 0 && <Card title="Manuscripts"><div className="muted">No manuscripts loaded.</div></Card>}
      {data.map((m:any) => (
        <Card key={m.id} title={m.title} className="span-2">
          <div className="status-grid">
            <div className="status-item"><span>Tradition</span><Badge tone="neutral">{m.tradition}</Badge></div>
            <div className="status-item"><span>Language</span><strong>{m.language}</strong></div>
            <div className="status-item"><span>Material</span><strong>{m.material || 'Unknown'}</strong></div>
            <div className="status-item"><span>Date</span><strong>{m.date}</strong></div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <strong>Coverage:</strong> {m.coverage}
          </div>
          {m.sourceUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <a href={m.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>Source Reference ↗</a>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Entities() {
  const [data, setData] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [terms, setTerms] = useState('');

  const loadEntities = () => getJSON<any[]>('/api/entities/read').then(setData).catch(console.error);
  useEffect(() => { loadEntities(); }, []);

  const handleSave = async () => {
    if (!name || !terms) return;
    try {
      const termList = terms.split(',').map(t => t.trim()).filter(Boolean);
      await fetch('/api/entities/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, terms: termList })
      });
      setName(''); setTerms('');
      loadEntities();
    } catch(e) { alert(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entity?')) return;
    try {
      await fetch('/api/entities/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: id })
      });
      loadEntities();
    } catch(e) { alert(e); }
  };

  return (
    <div className="grid">
      <Card title="🧬 Entity Resolution Engine" className="span-2">
        <p className="muted">Map cross-cultural theological entities. When you search for one term, the system will cognitively expand the search to find all equivalent terms across different corpora.</p>
        
        <div style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '2rem' }}>
          <h4>Create New Entity Mapping</h4>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Entity Name (e.g., The Messenger)" style={{ padding: '0.5rem', flex: 1 }} />
            <input value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Synonyms (comma separated: Abraham, Ibrahim, Abram)" style={{ padding: '0.5rem', flex: 2 }} />
            <button className="primary" onClick={handleSave}>Save Entity</button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Entity</th>
              <th style={{ padding: '0.5rem' }}>Synonyms (Cognitive Expansion)</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem 0.5rem' }}><strong>{d.name}</strong></td>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {d.terms.map((t:string) => <Badge key={t} tone="good">{t}</Badge>)}
                  </div>
                </td>
                <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(d.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function ScriptureReader({ q, setQ, results, runSearch, onSelectVerse, compact = false }: any) {
  const [sources, setSources] = useState<any[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [bookId, setBookId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aggregatedScores, setAggregatedScores] = useState<any>(null);
  const [batchAnnotating, setBatchAnnotating] = useState<string | null>(null);
  const [activeClaims, setActiveClaims] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    getJSON<any[]>('/api/crosswalk/read').then(setLinks).catch(console.error);
  }, []);

  useEffect(() => {
    getJSON<any>('/api/scoring/aggregate').then(setAggregatedScores).catch(console.error);
    getJSON<any[]>('/api/claims/read').then(setActiveClaims).catch(console.error);
  }, [bookId]); 

  useEffect(() => {
    getJSON<any[]>('/api/corpus/registry').then(reg => {
      // @ts-ignore
      setSources(reg.sources || []);
      // @ts-ignore
      if (reg.sources?.[0]) setSourceId(reg.sources[0].id);
    }).catch(()=>setError('Failed to load registry'));
  }, []);

  const activeSource = sources.find(s => s.id === sourceId);
  
  useEffect(() => {
    if (activeSource) {
      if (activeSource.books && activeSource.books.length > 0) setBookId(activeSource.books[0]);
      else setBookId('');
    }
  }, [activeSource]);

  useEffect(() => {
    if (!sourceId || !bookId) { setData(null); return; }
    setLoading(true); setError('');
    getJSON<any>(`/api/corpus/read?source=${sourceId}&book=${bookId}`)
      .then(setData)
      .catch(e => { setError(e instanceof Error ? e.message : String(e)); setData(null); })
      .finally(() => setLoading(false));
  }, [sourceId, bookId]);

  const handleBatchAnnotate = async (chap: any) => {
    if (!confirm(`Are you sure you want to AI Auto-Annotate all ${chap.verses.length} verses in Chapter ${chap.chapter_num}? This may take a few minutes.`)) return;
    setBatchAnnotating(chap.chapter_num);
    try {
      const res = await fetch('/api/annotations/auto-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceId,
          book: bookId,
          chapter: chap.chapter_num,
          verses: chap.verses
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Batch failed');
      alert(`Successfully annotated ${resData.count} verses!`);
      // Optionally trigger a re-render or reload data
      setQ(q + ' '); setTimeout(() => setQ(q), 10);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBatchAnnotating(null);
    }
  };

  const handleAttachClaim = async (verse: any, claimId: string, type: string) => {
    try {
      const res = await fetch('/api/claims/attach', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ claimId, sourceId, bookId, chapterNum: verse.chapter_num, verseNum: verse.verse_num, type, text: verse.text })
      });
      if(!res.ok) throw new Error(await res.text());
      alert('Attached to claim!');
    } catch(e) { alert(e); }
  };

  return (
    <div className="grid">
      <Card title="Corpus Browser" className="span-2">
        <div className="control-row">
          <select value={sourceId} onChange={e => setSourceId(e.target.value)}>
            {sources.map((s:any) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {activeSource?.books && (
            <select value={bookId} onChange={e => setBookId(e.target.value)}>
              {activeSource.books.map((b:string) => <option key={b} value={b}>{activeSource.id === 'quran' ? `Surah ${b}` : b}</option>)}
            </select>
          )}
        </div>
      </Card>

      {!compact && <Card title="Semantic Omnibox (Global Cross-Corpus Search)" className="span-2">
        <div className="search-row">
          <Search size={18}/>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runSearch()} placeholder="Search globally across Torah, Qur'an, Gospels, Psalms..."/>
          <button className="primary" onClick={runSearch}>Search</button>
        </div>
        <div className="results">
          {results.map((r:any,i:number)=>(
            <div className="result" key={i}>
              <strong style={{cursor: 'pointer'}} onClick={() => { setSourceId(r.sourceId); setBookId(r.bookId); }}>
                <Badge tone="neutral" style={{marginRight: '0.5rem'}}>{r.sourceName || r.sourceId}</Badge>
                {r.bookName || r.bookId} {r.chapterNum}:{r.verseNum} ➦
              </strong>
              <div>{r.text}</div>
              {r.translation && <div className="muted" style={{ fontSize: '0.9em' }}>{r.translation}</div>}
            </div>
          ))}
        </div>
      </Card>}

      {error && <div className="alert danger span-2">{error}</div>}
      
      {loading && <Card className="span-2"><div className="muted">Loading scripture text...</div></Card>}

      {data && (
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{data.book}</span>
              {!compact && aggregatedScores?.sources?.[sourceId]?.books?.[bookId.replace(/[^a-zA-Z0-9_-]/g, '')]?.aggregatedScore !== undefined && (
                <Badge tone="good">Book Score: {aggregatedScores.sources[sourceId].books[bookId.replace(/[^a-zA-Z0-9_-]/g, '')].aggregatedScore}/100</Badge>
              )}
            </div>
          } 
          className={compact ? "" : "span-2"}
        >
          {data.chapters.map((chap:any) => {
            const chapScore = aggregatedScores?.sources?.[sourceId]?.books?.[bookId.replace(/[^a-zA-Z0-9_-]/g, '')]?.chapters?.[chap.chapter_num]?.aggregatedScore;
            return (
              <div key={chap.chapter_num} style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>Chapter {chap.chapter_num}</span>
                    {!compact && (
                      <button 
                        className="secondary" 
                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => handleBatchAnnotate(chap)}
                        disabled={batchAnnotating === chap.chapter_num}
                      >
                        {batchAnnotating === chap.chapter_num ? '⚙️ Batching...' : '🪄 Batch Auto-Annotate'}
                      </button>
                    )}
                  </div>
                  {!compact && chapScore !== undefined && <Badge tone="neutral">Chapter Score: {chapScore}/100</Badge>}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chap.verses.map((v:any) => (
                    <VerseRow 
                      key={v.verse_num} 
                      verse={v} 
                      sourceId={sourceId} 
                      bookId={bookId} 
                      chapterNum={chap.chapter_num} 
                      isCrosswalkMode={!!onSelectVerse}
                      activeClaims={activeClaims}
                      handleAttachClaim={handleAttachClaim}
                      compact={compact}
                      links={links}
                      onClick={() => { if(onSelectVerse) onSelectVerse(`${sourceId}_${bookId}_${chap.chapter_num}_${v.verse_num}`, v); }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function VerseRow({ verse, sourceId, bookId, chapterNum, isCrosswalkMode, activeClaims = [], handleAttachClaim, compact, links = [] }: any) {
  const [editing, setEditing] = useState(false);
  const [anno, setAnno] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [autoAnnotating, setAutoAnnotating] = useState(false);
  const [showParallels, setShowParallels] = useState(false);
  const [parallelVerses, setParallelVerses] = useState<any[]>([]);

  const verseId = `${sourceId}_${bookId}_${chapterNum}_${verse.verse_num}`;
  const connectedLinks = links.filter((l:any) => l.sourceA === verseId || l.sourceB === verseId);

  const loadParallels = async () => {
    if (showParallels) { setShowParallels(false); return; }
    setShowParallels(true);
    const verses = [];
    for (const l of connectedLinks) {
      const targetId = l.sourceA === verseId ? l.sourceB : l.sourceA;
      try {
        const res = await fetch(`/api/corpus/verse?id=${encodeURIComponent(targetId)}`);
        const data = await res.json();
        if (data.verse) verses.push({ ...data, relation: l.relationship });
      } catch(e) { console.error(e); }
    }
    setParallelVerses(verses);
  };

  useEffect(() => {
    getJSON<any>(`/api/annotations/read?source=${encodeURIComponent(sourceId)}&book=${encodeURIComponent(bookId)}`)
      .then(data => { if(data[verseId]) setAnno(data[verseId]); })
      .catch(console.error);
  }, [verseId]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/annotations/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ sourceId, bookId, verseId, payload: anno })
      });
      if(!res.ok) throw new Error(await res.text());
      setEditing(false);
    } catch(e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const autoAnnotate = async () => {
    setAutoAnnotating(true);
    try {
      const res = await fetch('/api/annotations/auto', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          text: verse.text_uthmani || verse.text || '', 
          context: `Corpus: ${sourceId}, Book: ${bookId}, Chapter: ${chapterNum}, Verse: ${verse.verse_num}` 
        })
      });
      if(!res.ok) throw new Error(await res.text());
      const aiData = await res.json();
      
      setAnno({
        ...anno,
        status: 'Pending',
        tafsir_R: aiData.tafsir_R || '',
        tafsir_G: aiData.tafsir_G || '',
        tafsir_B: aiData.tafsir_B || '',
        tafsir_L: aiData.tafsir_L || '',
        salah_tafsir: aiData.salah_tafsir || '',
        score: aiData.score || {}
      });
    } catch(e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setAutoAnnotating(false);
    }
  };

  const hasAnno = Object.keys(anno).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: hasAnno ? 'rgba(var(--color-primary-rgb), 0.05)' : 'transparent', borderRadius: '4px', cursor: isCrosswalkMode ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <strong 
          style={{ color: isCrosswalkMode ? 'var(--color-text)' : 'var(--color-primary-light)', minWidth: '2.5rem', cursor: isCrosswalkMode ? 'pointer' : 'pointer' }} 
          onClick={() => { if(!isCrosswalkMode) setEditing(!editing); }}
        >
          {verse.verse_num} {!isCrosswalkMode && '✎'}
        </strong>
        <div style={{ lineHeight: '1.6', flex: 1 }}>
          {verse.text}
          {isCrosswalkMode && (
            <button className="primary" onClick={(e) => { e.stopPropagation(); }} style={{ marginLeft: '1rem', padding: '0.2rem 0.5rem' }}>Select</button>
          )}
        </div>
      </div>
      
      {verse.translation && <div className="translation" style={{ marginTop: '0.5rem', color: 'var(--color-muted)' }}>{verse.translation}</div>}
      
      {connectedLinks.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <button 
            onClick={loadParallels}
            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.25rem 0.75rem', fontSize: '0.85em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}
          >
            🔗 {connectedLinks.length} Parallel(s) 
          </button>
          
          {showParallels && parallelVerses.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '3px solid #3b82f6', paddingLeft: '1rem' }}>
              {parallelVerses.map((pv, i) => (
                <div key={i} style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85em', color: '#1e3a8a' }}>
                    <strong>{pv.sourceId.toUpperCase()} {pv.bookId} {pv.chapterNum}:{pv.verseNum}</strong>
                    <Badge tone={pv.relation === 'CONTRADICTION' ? 'danger' : 'good'}>{pv.relation.replace('_', ' ')}</Badge>
                  </div>
                  <div style={{ color: '#172554' }}>{pv.verse.text_uthmani || pv.verse.text}</div>
                  {pv.verse.translation && <div style={{ color: '#3b82f6', fontSize: '0.9em', marginTop: '0.25rem' }}>{pv.verse.translation}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {!editing && hasAnno && (
        <div style={{ marginLeft: '3.5rem', fontSize: '0.9em', borderLeft: '2px solid var(--color-primary)', paddingLeft: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '0.5rem' }}>
            {anno.status && <Badge tone={anno.status === 'Verified' ? 'good' : 'warn'}>{anno.status}</Badge>}
            {anno.score && (
              <strong style={{ color: 'var(--color-primary)' }}>
                Score: {
                  (anno.score.sourceQuality || 0) + 
                  (anno.score.transmission || 0) + 
                  (anno.score.proximity || 0) + 
                  (anno.score.corroboration || 0) + 
                  (anno.score.interpretationGap || 0)
                }/100
              </strong>
            )}
          </div>
          {anno.comment && <div style={{ marginTop: '0.25rem' }}><strong>Catatan:</strong> {anno.comment}</div>}
          {anno.salah_tafsir && <div style={{ marginTop: '0.25rem', color: 'var(--color-danger)' }}><strong>Salah Tafsir:</strong> {anno.salah_tafsir}</div>}
          {anno.tafsir_R && <div style={{ marginTop: '0.25rem' }}><strong>R (Information / Fakta):</strong> {anno.tafsir_R}</div>}
          {anno.tafsir_G && <div style={{ marginTop: '0.25rem' }}><strong>G (Knowledge / Konteks):</strong> {anno.tafsir_G}</div>}
          {anno.tafsir_B && <div style={{ marginTop: '0.25rem' }}><strong>B (Understanding / Makna):</strong> {anno.tafsir_B}</div>}
          {anno.tafsir_L && <div style={{ marginTop: '0.25rem' }}><strong>L (Wisdom / Hikmah):</strong> {anno.tafsir_L}</div>}
        </div>
      )}

      {/* Floating Attach to Claim Dropdown */}
      {!isCrosswalkMode && !compact && !editing && activeClaims.length > 0 && (
        <div style={{ marginLeft: '3.5rem', marginTop: '0.5rem' }}>
          <select 
            style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#f8fafc' }}
            onChange={(e) => {
              if(e.target.value) {
                const [claimId, type] = e.target.value.split('|');
                handleAttachClaim(verse, claimId, type);
                e.target.value = ''; // reset
              }
            }}
          >
            <option value="">📌 Attach to Claim...</option>
            {activeClaims.map((c: any) => (
              <optgroup key={c.id} label={c.title.substring(0, 30) + (c.title.length > 30 ? '...' : '')}>
                <option value={`${c.id}|SUPPORT`}>As Supporting Evidence</option>
                <option value={`${c.id}|REFUTE`}>As Refuting Evidence</option>
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {editing && (
        <div style={{ marginLeft: '3.5rem', marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: '4px' }}>
          <div className="grid">
            <div style={{ display: 'flex', gap: '1rem', gridColumn: 'span 2' }}>
              <label>Status: <select value={anno.status || ''} onChange={e=>setAnno({...anno, status: e.target.value})}><option value="">-</option><option value="Verified">Verified</option><option value="Pending">Pending</option><option value="Corrupted">Corrupted</option></select></label>
            </div>
            <div style={{ gridColumn: 'span 2', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <strong style={{ width: '100%', fontSize: '12px', color: '#64748b' }}>Evidentiary Score (Max 100)</strong>
              <label style={{ fontSize: '12px' }}>Source (20): <input type="number" max="20" style={{width: '50px'}} value={anno.score?.sourceQuality || ''} onChange={e=>setAnno({...anno, score: {...(anno.score||{}), sourceQuality: Number(e.target.value)}})} /></label>
              <label style={{ fontSize: '12px' }}>Transm (25): <input type="number" max="25" style={{width: '50px'}} value={anno.score?.transmission || ''} onChange={e=>setAnno({...anno, score: {...(anno.score||{}), transmission: Number(e.target.value)}})} /></label>
              <label style={{ fontSize: '12px' }}>Proxim (20): <input type="number" max="20" style={{width: '50px'}} value={anno.score?.proximity || ''} onChange={e=>setAnno({...anno, score: {...(anno.score||{}), proximity: Number(e.target.value)}})} /></label>
              <label style={{ fontSize: '12px' }}>Corrob (20): <input type="number" max="20" style={{width: '50px'}} value={anno.score?.corroboration || ''} onChange={e=>setAnno({...anno, score: {...(anno.score||{}), corroboration: Number(e.target.value)}})} /></label>
              <label style={{ fontSize: '12px' }}>Intr.Gap (15): <input type="number" max="15" style={{width: '50px'}} value={anno.score?.interpretationGap || ''} onChange={e=>setAnno({...anno, score: {...(anno.score||{}), interpretationGap: Number(e.target.value)}})} /></label>
            </div>
            
            <label style={{ display: 'block', gridColumn: 'span 2' }}>Catatan Umum:<br/><textarea style={{width: '100%', height: '40px'}} value={anno.comment || ''} onChange={e=>setAnno({...anno, comment: e.target.value})} /></label>
            <label style={{ display: 'block', color: 'var(--color-danger)', gridColumn: 'span 2' }}>Konteks Keliru (Caution / Guardrail):<br/><textarea style={{width: '100%', height: '40px'}} value={anno.salah_tafsir || ''} onChange={e=>setAnno({...anno, salah_tafsir: e.target.value})} /></label>
            <label style={{ display: 'block' }}>R1 (Information) - Apa faktanya?<br/><textarea style={{width: '100%', height: '40px'}} value={anno.tafsir_R || ''} onChange={e=>setAnno({...anno, tafsir_R: e.target.value})} /></label>
            <label style={{ display: 'block' }}>G2 (Knowledge) - Bagaimana keterkaitannya?<br/><textarea style={{width: '100%', height: '40px'}} value={anno.tafsir_G || ''} onChange={e=>setAnno({...anno, tafsir_G: e.target.value})} /></label>
            <label style={{ display: 'block' }}>B3 (Meaning) - Apa maknanya?<br/><textarea style={{width: '100%', height: '40px'}} value={anno.tafsir_B || ''} onChange={e=>setAnno({...anno, tafsir_B: e.target.value})} /></label>
            <label style={{ display: 'block' }}>L4 (Wisdom) - Apa hikmahnya?<br/><textarea style={{width: '100%', height: '40px'}} value={anno.tafsir_L || ''} onChange={e=>setAnno({...anno, tafsir_L: e.target.value})} /></label>
            
            <div style={{ marginTop: '0.5rem', gridColumn: 'span 2', display: 'flex', gap: '0.5rem' }}>
              <button className="primary" onClick={save} disabled={saving || autoAnnotating}>{saving ? 'Saving...' : 'Save Annotation'}</button>
              <button style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', color: 'white', border: 'none' }} onClick={autoAnnotate} disabled={autoAnnotating}>
                {autoAnnotating ? '🪄 Analyzing...' : '🪄 Auto-Annotate (AI)'}
              </button>
              <button className="secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
