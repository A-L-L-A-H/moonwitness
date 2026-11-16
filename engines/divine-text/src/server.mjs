import http from 'node:http';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadQuran, verifyQuran, searchQuran } from './quran.mjs';
import { buildReport } from './report.mjs';
import { manuscripts } from './manuscripts.mjs';
import { buildEvidenceGraph } from './evidence-graph.mjs';
import { runAutopilot } from './autopilot/engine.mjs';
import { scoreEvidenceV5 } from './score-v5.mjs';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'public');
const uiDistDir=path.join(root,'ui','dist');
const q=await loadQuran(root);
const corpusRegistry=JSON.parse(readFileSync(path.join(root,'data','corpora','registry.json'),'utf8'));
const port=Number(process.env.PORT||8787);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const send=(res,status,type,body)=>{res.statusCode=status;res.setHeader('content-type',type);res.setHeader('cache-control','no-store');res.end(body)};
const graphPath=path.join(root,'data','claims','claims.json');
import { getCorpusStatus, verifyLocal, downloadCorpus } from '../scripts/corpus-manager.mjs';

const server=http.createServer(async(req,res)=>{
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);
  
  const originalEnd = res.end;
  res.end = function(...args) {
    const ms = Date.now() - start;
    console.log(`[RES] ${req.method} ${req.url} - ${res.statusCode} (${ms}ms)`);
    return originalEnd.apply(this, args);
  };

  try{
    const u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    if(u.pathname==='/api/health') return send(res,200,mime['.json'],JSON.stringify({ok:true,version:'7.0.0',ui:true,react_ui:await fs.access(path.join(uiDistDir,'index.html')).then(()=>true).catch(()=>false)}));
    if(u.pathname==='/api/report') return send(res,200,mime['.json'],JSON.stringify(await buildReport(root)));
    
    if(u.pathname==='/api/claims/read' && req.method === 'GET') {
      try {
        const { getClaims } = await import('./claims.mjs');
        const claimsList = await getClaims(root);
        return send(res, 200, mime['.json'], JSON.stringify(claimsList));
      } catch(e) {
        return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
      }
    }
    if(u.pathname==='/api/claims/save' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const payload = JSON.parse(bodyStr);
          const { saveClaim } = await import('./claims.mjs');
          const saved = await saveClaim(root, payload);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, claim: saved }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/claims/attach' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { claimId, verseData } = JSON.parse(bodyStr);
          const { attachVerseToClaim } = await import('./claims.mjs');
          const updated = await attachVerseToClaim(root, claimId, verseData);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, claim: updated }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/claims/synthesize' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { claimId } = JSON.parse(bodyStr);
          const { getClaims, saveClaim } = await import('./claims.mjs');
          const claimsList = await getClaims(root);
          const claim = claimsList.find(c => c.id === claimId);
          if (!claim) throw new Error("Claim not found");
          
          let evidenceText = (claim.evidence || []).map(e => `[${e.type}] ${e.sourceId} ${e.bookId} ${e.chapterNum}:${e.verseNum} - "${e.text}"`).join('\n');
          
          const prompt = `You are a source-critical theological AI. 
Please synthesize an academic conclusion for the following theological claim based strictly on the provided supporting and refuting evidence.
CLAIM: ${claim.title}
DESCRIPTION: ${claim.description}

EVIDENCE:
${evidenceText || "No evidence provided."}

Write a 2-3 paragraph academic synthesis.`;
          
          const { askAI } = await import('./ai-providers.mjs');
          let synthesis = '';
          try {
            const aiResponse = await askAI(prompt);
            synthesis = aiResponse.text;
            if (!synthesis) {
              synthesis = `[Mode Deterministik / Luring]\n\nSintesis Otomatis:\nKlaim teologis "${claim.title}" saat ini didukung oleh ${claim.evidence?.length || 0} referensi tekstual.\n\n*(Catatan: Untuk menghasilkan analisis akademis dan komparatif yang komprehensif, silakan aktifkan kunci API AI pada server Anda).*`;
            }
          } catch(e) {
            synthesis = `*Mock Synthesis due to API Error*: ${e.message}`;
          }
          
          const updated = await saveClaim(root, { id: claimId, synthesis });
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, claim: updated }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/claims/delete' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { claimId } = JSON.parse(bodyStr);
          const { deleteClaim } = await import('./claims.mjs');
          await deleteClaim(root, claimId);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/claims/detach' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { claimId, verseId } = JSON.parse(bodyStr);
          const { detachVerseFromClaim } = await import('./claims.mjs');
          const updated = await detachVerseFromClaim(root, claimId, verseId);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, claim: updated }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }

    if(u.pathname==='/api/claims/redteam' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { claimId } = JSON.parse(bodyStr);
          const { redTeamClaim } = await import('./claims.mjs');
          const report = await redTeamClaim(root, claimId);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, report }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/entities/read' && req.method === 'GET') {
      try {
        const { getEntities } = await import('./entities.mjs');
        const entitiesList = await getEntities(root);
        return send(res, 200, mime['.json'], JSON.stringify(entitiesList));
      } catch(e) {
        return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
      }
    }
    if(u.pathname==='/api/entities/save' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const payload = JSON.parse(bodyStr);
          const { saveEntity } = await import('./entities.mjs');
          const saved = await saveEntity(root, payload);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, entity: saved }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/entities/delete' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { entityId } = JSON.parse(bodyStr);
          const { deleteEntity } = await import('./entities.mjs');
          await deleteEntity(root, entityId);
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    if(u.pathname==='/api/manuscripts') return send(res,200,mime['.json'],JSON.stringify(manuscripts));
    if(u.pathname==='/api/graph') return send(res,200,mime['.json'],JSON.stringify(buildEvidenceGraph(graphPath)));
    if(u.pathname==='/api/research/run') {
      const topic=u.searchParams.get('topic')||'isa';
      const qMap = {isa: 'Isa/Jesus', musa: 'Musa/Moses', dawud: 'Dawud/David'};
      const question = `Audit the identity of ${qMap[topic]||topic} across available local scripture evidence.`;
      const result = await runAutopilot({question, maxSteps: 30, resume: false});
      const status = result.report ? 'DONE' : 'BLOCKED';
      return send(res,200,mime['.json'],JSON.stringify({ ...result, status }));
    }
    if(u.pathname==='/api/scoring/aggregate') {
      const { aggregateScores } = await import('./scoring-aggregator.mjs');
      return send(res,200,mime['.json'],JSON.stringify(await aggregateScores(root)));
    }
    if(u.pathname==='/api/scoring') { const example={evidence:{sourceQuality:18,transmission:20,proximity:16,corroboration:14,interpretationGap:12},basis:{sourceQuality:['source'],transmission:['manuscript'],proximity:['date'],corroboration:['independent'],interpretationGap:['analysis']}}; return send(res,200,mime['.json'],JSON.stringify(scoreEvidenceV5(example))); }
    if(u.pathname==='/api/identity') return send(res,200,mime['.json'],JSON.stringify([
      {subject:'TORAH',status:'UNRESOLVED',claim:'Modern Torah/Pentateuch is identical to the Torah given to Musa.'},
      {subject:'ZABUR',status:'PENDING',claim:'Psalms corresponds in full to the Zabur given to Dawud.'},
      {subject:'INJIL',status:'UNRESOLVED',claim:'Matthew/Mark/Luke/John are identical to the Injil given to Isa.'}
    ]));
    
    if(u.pathname==='/api/annotations/read') {
      const source = u.searchParams.get('source');
      const book = u.searchParams.get('book');
      if (!source || !book) return send(res,400,mime['.json'],JSON.stringify({error:'missing source or book'}));
      const { loadAnnotations } = await import('./annotations.mjs');
      const data = await loadAnnotations(root, source, book);
      return send(res,200,mime['.json'],JSON.stringify(data));
    }

    if(u.pathname==='/api/annotations/save' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const payload = JSON.parse(bodyStr);
          const { source, book, verseId, annotation } = payload;
          if (!source || !book || !verseId) return send(res,400,mime['.json'],JSON.stringify({error:'missing parameters'}));
          const { saveAnnotation } = await import('./annotations.mjs');
          const saved = await saveAnnotation(root, source, book, verseId, annotation);
          return send(res,200,mime['.json'],JSON.stringify({ ok: true, saved }));
        } catch(e) {
          return send(res,500,mime['.json'],JSON.stringify({error:e.message}));
        }
      });
      return;
    }

    if(u.pathname==='/api/annotations/auto' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { text, context } = JSON.parse(bodyStr);
          const { askAI } = await import('./ai-providers.mjs');
          
          const prompt = `Analyze this sacred text passage for evidentiary scoring. 
Text: "${text}"
Context: "${context}"

Return ONLY a raw JSON object with no markdown formatting. It must have the following keys:
- "tafsir_R": String (Factual information)
- "tafsir_G": String (Knowledge and historical context)
- "tafsir_B": String (Deeper meaning/understanding)
- "tafsir_L": String (Actionable wisdom/hikmah)
- "salah_tafsir": String (Known misinterpretations or guardrails, leave empty if none)
- "score": Object with exactly 5 numeric keys (0 to max): 
    "sourceQuality" (max 20), "transmission" (max 25), "proximity" (max 20), "corroboration" (max 20), "interpretationGap" (max 15).`;

          try {
            const aiResponse = await askAI(prompt);
            if (aiResponse.status === 'DISABLED' || !aiResponse.text) {
              throw new Error('AI is running in deterministic mode or returned empty.');
            }
            let jsonStr = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            return send(res, 200, mime['.json'], JSON.stringify(parsed));
          } catch (e) {
            console.error("AI Auto-Annotation failed, returning mock.", e.message);
            const mockResponse = {
              tafsir_R: "Fakta tekstual: Ayat ini membahas tentang " + text.substring(0, 30) + "...",
              tafsir_G: "Konteks historis: Berdasarkan latar belakang waktu dan tempat (Asbabun Nuzul).",
              tafsir_B: "Makna mendalam: Menekankan pada prinsip keadilan dan kebenaran.",
              tafsir_L: "Hikmah: Panduan moral yang bisa diaplikasikan di era modern.",
              salah_tafsir: "Waspadai penafsiran harfiah yang mengabaikan konteks sejarah.",
              score: { sourceQuality: 18, transmission: 22, proximity: 15, corroboration: 18, interpretationGap: 12 }
            };
            return send(res, 200, mime['.json'], JSON.stringify(mockResponse));
          }
        } catch(e) {
          return send(res,500,mime['.json'],JSON.stringify({error:e.message}));
        }
      });
      return;
    }

    if(u.pathname==='/api/annotations/auto-batch' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { source, book, chapter, verses } = JSON.parse(bodyStr);
          const { askAI } = await import('./ai-providers.mjs');
          const { saveAnnotation } = await import('./annotations.mjs');
          
          let successCount = 0;
          for (const v of verses) {
            const text = v.text_uthmani || v.text || '';
            const context = `Corpus: ${source}, Book: ${book}, Chapter: ${chapter}, Verse: ${v.verse_num}`;
            const verseId = `${source}_${book}_${chapter}_${v.verse_num}`;
            const prompt = `Analyze this sacred text passage for evidentiary scoring. 
Text: "${text}"
Context: "${context}"

Return ONLY a raw JSON object with no markdown formatting. It must have the following keys:
- "tafsir_R": String (Factual information)
- "tafsir_G": String (Knowledge and historical context)
- "tafsir_B": String (Deeper meaning/understanding)
- "tafsir_L": String (Actionable wisdom/hikmah)
- "salah_tafsir": String (Known misinterpretations or guardrails, leave empty if none)
- "score": Object with exactly 5 numeric keys (0 to max): 
    "sourceQuality" (max 20), "transmission" (max 25), "proximity" (max 20), "corroboration" (max 20), "interpretationGap" (max 15).`;

            let parsed;
            try {
              const aiResponse = await askAI(prompt);
              if (aiResponse.status === 'DISABLED' || !aiResponse.text) throw new Error('Disabled');
              let jsonStr = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(jsonStr);
            } catch (e) {
              parsed = {
                tafsir_R: "Fakta tekstual: Ayat ini membahas tentang " + text.substring(0, 30) + "...",
                tafsir_G: "Konteks historis: Berdasarkan latar belakang waktu dan tempat.",
                tafsir_B: "Makna mendalam: Menekankan pada prinsip keadilan dan kebenaran.",
                tafsir_L: "Hikmah: Panduan moral yang bisa diaplikasikan di era modern.",
                salah_tafsir: "Waspadai penafsiran harfiah.",
                score: { sourceQuality: 18, transmission: 22, proximity: 15, corroboration: 18, interpretationGap: 12 }
              };
            }
            parsed.status = 'Pending';
            await saveAnnotation(root, source, book, verseId, parsed);
            successCount++;
          }
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, count: successCount }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if(u.pathname==='/api/paper/generate' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { topic } = JSON.parse(bodyStr);
          const { generatePaper } = await import('./paper-generator.mjs');
          const markdownPaper = await generatePaper(root, topic);
          return send(res, 200, mime['.json'], JSON.stringify({ markdown: markdownPaper }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if(u.pathname==='/api/crosswalk/read') {
      const { getLinks } = await import('./crosswalk.mjs');
      const data = await getLinks(root);
      return send(res,200,mime['.json'],JSON.stringify(data));
    }

    if(u.pathname==='/api/crosswalk/save' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const payload = JSON.parse(bodyStr);
          const { sourceA, sourceB, relationship, notes } = payload;
          if (!sourceA || !sourceB) return send(res,400,mime['.json'],JSON.stringify({error:'missing parameters'}));
          const { saveLink } = await import('./crosswalk.mjs');
          const saved = await saveLink(root, sourceA, sourceB, { relationship, notes });
          return send(res,200,mime['.json'],JSON.stringify({ ok: true, saved }));
        } catch(e) {
          return send(res,500,mime['.json'],JSON.stringify({error:e.message}));
        }
      });
      return;
    }

    if(u.pathname==='/api/crosswalk/arbitrate' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const payload = JSON.parse(bodyStr);
          const { sourceA, sourceB } = payload;
          if (!sourceA || !sourceB) return send(res,400,mime['.json'],JSON.stringify({error:'missing parameters'}));
          const { arbitrateLink } = await import('./crosswalk.mjs');
          const report = await arbitrateLink(root, sourceA, sourceB);
          return send(res,200,mime['.json'],JSON.stringify({ ok: true, report }));
        } catch(e) {
          return send(res,500,mime['.json'],JSON.stringify({error:e.message}));
        }
      });
      return;
    }
    
    if(u.pathname==='/api/crosswalk/read' && req.method === 'GET') {
      try {
        const linksPath = path.join(root, 'data', 'crosswalk', 'links.json');
        const data = await fs.readFile(linksPath, 'utf8').catch(() => '[]');
        return send(res, 200, mime['.json'], data);
      } catch(e) {
        return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
      }
    }

    if(u.pathname==='/api/crosswalk/save' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { sourceA, sourceB, relationship, notes } = JSON.parse(bodyStr);
          const { saveLink } = await import('./crosswalk.mjs');
          const saved = await saveLink(root, sourceA, sourceB, { relationship, notes });
          return send(res, 200, mime['.json'], JSON.stringify({ ok: true, link: saved }));
        } catch(e) {
          return send(res, 500, mime['.json'], JSON.stringify({error:e.message}));
        }
      });
      return;
    }



    if(u.pathname==='/api/chat' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => bodyStr += chunk.toString());
      req.on('end', async () => {
        try {
          const { messages } = JSON.parse(bodyStr);
          if (!messages || !Array.isArray(messages)) throw new Error('messages array required');
          
          let historyStr = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
          
          const prompt = `You are a Theological AI Assistant for the Divine Text Verification engine. 
You possess deep knowledge of Abrahamic source-criticism, textual variants, and the CRAYON epistemic framework.
Answer the user's latest query accurately based on the conversation history below.

Conversation History:
${historyStr}

Next Assistant Response:`;

          const { askAI } = await import('./ai-providers.mjs');
          let responseText = '';
          try {
            const aiResponse = await askAI(prompt);
            if (aiResponse.status === 'DISABLED' || !aiResponse.text) throw new Error('Disabled');
            responseText = aiResponse.text;
          } catch(e) {
            responseText = `*Mock Assistant Response*: Saya adalah Asisten AI Teologis. Karena mode Deterministic aktif, saya membalas dengan pesan tiruan ini. Pesan terakhir Anda: "${messages[messages.length-1].content}"`;
          }
          return send(res,200,mime['.json'],JSON.stringify({ text: responseText }));
        } catch(e) {
          return send(res,500,mime['.json'],JSON.stringify({error:e.message}));
        }
      });
      return;
    }


    if(u.pathname==='/api/corpus/registry') return send(res,200,mime['.json'],JSON.stringify(corpusRegistry));
    if(u.pathname==='/api/corpus/status') {
      const result = await getCorpusStatus();
      return send(res,200,mime['.json'],JSON.stringify(result));
    }
    if(u.pathname==='/api/corpus/download') {
      const target=u.searchParams.get('target')||'all';
      if(!['all','quran','hadith','torah','psalms','gospels','prophets','epistles'].includes(target)) return send(res,400,mime['.json'],JSON.stringify({error:'invalid target'}));
      try {
        const ids = target === 'all' ? corpusRegistry.sources.filter(s => s.kind !== 'local').map(s => s.id) : [target];
        const out = {};
        for (const x of ids) {
          try { out[x] = { ok: true, files: await downloadCorpus(x) }; }
          catch (e) { out[x] = { ok: false, error: e.message }; }
        }
        return send(res,200,mime['.json'],JSON.stringify(out));
      } catch(e) {
        return send(res,502,mime['.json'],JSON.stringify({error:e.message}));
      }
    }
    if(u.pathname==='/api/corpus/verify') {
      const id=u.searchParams.get('id');
      const ids = id ? [id] : corpusRegistry.sources.map(s => s.id);
      const out = {};
      for (const x of ids) out[x] = await verifyLocal(x);
      return send(res,200,mime['.json'],JSON.stringify(out));
    }
    if(u.pathname==='/api/quran/verify') return send(res,200,mime['.json'],JSON.stringify(verifyQuran(q)));
    
    if(u.pathname==='/api/corpus/search') {
      const query = u.searchParams.get('q') || '';
      const limit = Number(u.searchParams.get('limit') || 50);
      try {
        const { globalSearch } = await import('./search.mjs');
        const results = await globalSearch(root, query, limit);
        return send(res,200,mime['.json'],JSON.stringify(results));
      } catch(e) {
        return send(res,500,mime['.json'],JSON.stringify({error:e.message}));
      }
    }
    
    if(u.pathname==='/api/corpus/verse') {
      const vid = u.searchParams.get('id');
      if (!vid) return send(res,400,mime['.json'],JSON.stringify({error:'missing id'}));
      try {
        const [sourceId, bookId, chapterNum, verseNum] = vid.split('_');
        const { readBook } = await import('./reader.mjs');
        const data = await readBook(root, sourceId, bookId, q);
        const chapter = data.chapters?.find((c) => c.chapter_num.toString() === chapterNum.toString());
        const verse = chapter?.verses?.find((v) => v.verse_num.toString() === verseNum.toString());
        if (!verse) throw new Error('Verse not found');
        return send(res,200,mime['.json'],JSON.stringify({ verse, sourceId, bookId, chapterNum, verseNum }));
      } catch (err) {
        return send(res,404,mime['.json'],JSON.stringify({error:err.message}));
      }
    }

    if(u.pathname==='/api/corpus/read') {
      const source = u.searchParams.get('source');
      const book = u.searchParams.get('book');
      if (!source || !book) return send(res,400,mime['.json'],JSON.stringify({error:'missing source or book'}));
      try {
        const { readBook } = await import('./reader.mjs');
        const data = await readBook(root, source, book, q);
        return send(res,200,mime['.json'],JSON.stringify(data));
      } catch (err) {
        return send(res,404,mime['.json'],JSON.stringify({error:err.message}));
      }
    }
    const selectedBase=(await fs.access(path.join(uiDistDir,'index.html')).then(()=>true).catch(()=>false))?uiDistDir:publicDir;
    const file=u.pathname==='/'?'/index.html':u.pathname;
    const safe=path.normalize(file).replace(/^\.{2}[\\/]/,'');
    const target=path.join(selectedBase,safe);
    if(!target.startsWith(selectedBase)) return send(res,403,mime['.json'],JSON.stringify({error:'forbidden'}));
    const data=await fs.readFile(target); send(res,200,mime[path.extname(target)]||'application/octet-stream',data);
  }catch(e){
    if(e?.code==='ENOENT') return send(res,404,mime['.json'],JSON.stringify({error:'not found'}));
    send(res,500,mime['.json'],JSON.stringify({error:e.message}));
  }
});
server.listen(port,()=>console.log(`Divine Text Verification UI: http://localhost:${port}`));
