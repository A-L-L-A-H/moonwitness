import type { Dataset, DivineAttributeFamily, Evidence, MatchCandidate, ProphetProfile } from "../types.js";

const STOP=new Set(["the","and","with","from","into","through","among","being","his","her","their","allah","divine","root","identity","quranic","arabic","prophet","messenger","role","state","core","positive"]);

const GROUPS:Record<string,string[]>= {
  knowledge:["knowledge","knowing","teach","teaching","learn","learning","understanding","wisdom"],
  truth:["truth","true","truthful","truthfulness","sincere","sincerity","faithful","faithfulness"],
  gratitude:["gratitude","grateful","thankful","thankfulness","appreciation","appreciative","praise"],
  trust:["trust","trustworthy","trustworthiness","faith","faithful","security","safe"],
  goodness:["good","goodness","righteous","righteousness","excellence","excellent","beneficence","kindness","reform"],
  patience:["patience","patient","steadfast","steadfastness","forbearance","forbearing","restraint","gentle","gentleness"],
  mercy:["mercy","merciful","compassion","compassionate","care","kindness","salvation","deliverance","rescue"],
  guidance:["guidance","guide","guided","leading","path","salvation","deliverance"],
  speech:["speech","speaking","word","communication","eloquence","eloquent","clarity","clear"],
  gift:["gift","give","giving","bestow","bestowing","grant","granted","generosity","generous"],
  purity:["pure","purity","purified","chosen","sincere","holiness","holy","reverence","devotion"],
  return:["return","returning","repentance","repent","turning","turn","forgiveness"],
  worship:["worship","devotion","glorification","glorify","tasbih","praise","prayer"],
  judgment:["judgment","judgement","decisive","justice","governance","rule","authority","wisdom"],
  honor:["honor","honoured","honored","nobility","noble","dignity"]
};

function fold(value:string):string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[ʿʾ]/g,"").replace(/š/g,"sh").replace(/Š/g,"sh")
    .replace(/ḫ/g,"kh").replace(/Ḫ/g,"kh").replace(/ġ/g,"gh").replace(/Ġ/g,"gh")
    .toLowerCase();
}
export function normalizeRoot(root:string):string { return fold(root).replace(/[^a-z]+/g,""); }
function tokens(text:string):Set<string> {
  const out=new Set<string>();
  for(const x of fold(text).replace(/[^a-z0-9]+/g," ").split(/\s+/)) if(x.length>2&&!STOP.has(x)) out.add(x);
  return out;
}
function conceptIds(text:string):Set<string> {
  const f=` ${fold(text)} `; const out=new Set<string>();
  for(const [id,terms] of Object.entries(GROUPS)) if(terms.some(t=>f.includes(` ${fold(t)} `)||f.includes(fold(t)))) out.add(id);
  return out;
}
function explicitLayerText(p:ProphetProfile):string {
  const parts:string[]=[p.signature];
  for(const raw of Object.values(p.identity_layers)){
    if(raw&&typeof raw==="object"){
      const x=raw as Record<string,unknown>;
      if(typeof x.value==="string")parts.push(x.value);
    }
  }
  return parts.join(" ");
}
function identitySemanticText(p:ProphetProfile):string {
  const parts:string[]=[p.signature];
  for(const raw of Object.values(p.identity_layers)){
    if(raw&&typeof raw==="object"){
      const x=raw as Record<string,unknown>;
      if(typeof x.value==="string")parts.push(x.value);
      if(typeof x.note==="string")parts.push(x.note);
    }
  }
  return parts.join(" ");
}
function missionText(p:ProphetProfile):string { return Object.values(p.mission).map(x=>x.summary).join(" "); }
function looseLexemeMatch(profileText:string,f:DivineAttributeFamily):boolean {
  const hay=[...tokens(profileText)];
  for(const raw of f.lexemes){
    const lex=fold(raw).replace(/[^a-z]+/g,"");
    if(lex.length<4)continue;
    if(hay.some(token=>token===lex||token.startsWith(lex)))return true;
  }
  return false;
}
function overlap(a:Set<string>,b:Set<string>):string[]{ return [...a].filter(x=>b.has(x)); }
function primaryName(f:DivineAttributeFamily):string { return f.forms[0]?.name ?? f.root; }
function evidenceFor(rootMatch:boolean,lexemeMatch:boolean,conceptCount:number):Evidence {
  if(lexemeMatch)return "Q4";
  if(rootMatch)return "Q3";
  if(conceptCount>0)return "Q2";
  return "Q1";
}

export function matchAsmaForProphet(data:Dataset,p:ProphetProfile,max=data.matcher_config?.max_candidates ?? 3):MatchCandidate[]{
  const explicit=explicitLayerText(p);
  const identity=identitySemanticText(p);
  const mission=missionText(p);
  const ridConcepts=conceptIds(p.rid.meaning);
  const ridTokens=tokens(p.rid.meaning);
  const identityConcepts=conceptIds(identity);
  const missionConcepts=conceptIds(mission);
  const identityTokens=tokens(identity);
  const ridRoot=normalizeRoot(p.rid.root);
  const candidates:MatchCandidate[]=[];

  for(const family of Object.values(data.divine_attributes)){
    const rootMatch=ridRoot!==""&&ridRoot===normalizeRoot(family.root);
    const lexemeMatch=looseLexemeMatch(explicit,family);
    const familyConcepts=new Set<string>(family.concepts.flatMap(c=>[...conceptIds(c)]));
    for(const c of family.concepts) if(GROUPS[c]) familyConcepts.add(c);

    const ridOverlap=overlap(ridConcepts,familyConcepts);
    const identityOverlap=overlap(identityConcepts,familyConcepts);
    const missionOverlap=overlap(missionConcepts,familyConcepts);
    const combinedOverlap=[...new Set([...ridOverlap,...identityOverlap,...missionOverlap])];
    const familyTokens=tokens(`${family.concepts.join(" ")} ${family.forms.map(x=>x.name).join(" ")}`);
    const ridRawOverlap=overlap(ridTokens,familyTokens);
    const rawOverlap=overlap(identityTokens,familyTokens);

    let score=0; const reasons:string[]=[];
    if(rootMatch){score+=0.62;reasons.push(`RID root ${p.rid.root} = divine root ${family.root}`);}
    if(lexemeMatch){score+=0.24;reasons.push("explicit identity-layer lexeme overlaps divine form");}
    if(ridOverlap.length){const add=Math.min(0.36,0.23+0.07*ridOverlap.length);score+=add;reasons.push(`RID concepts: ${ridOverlap.join(", ")}`);}
    if(ridRawOverlap.length){const add=Math.min(0.14,0.05*ridRawOverlap.length);score+=add;reasons.push(`RID lexical semantics: ${ridRawOverlap.slice(0,4).join(", ")}`);}
    const identityOnly=identityOverlap.filter(x=>!ridOverlap.includes(x));
    if(identityOnly.length){const add=Math.min(0.16,0.08+0.04*identityOnly.length);score+=add;reasons.push(`identity concepts: ${identityOnly.join(", ")}`);}
    const missionOnly=missionOverlap.filter(x=>!ridOverlap.includes(x)&&!identityOverlap.includes(x));
    if(missionOnly.length){const add=Math.min(0.08,0.04+0.02*missionOnly.length);score+=add;reasons.push(`mission concepts: ${missionOnly.join(", ")}`);}
    if(rawOverlap.length){const add=Math.min(0.06,0.02*rawOverlap.length);score+=add;reasons.push(`lexical context: ${rawOverlap.slice(0,4).join(", ")}`);}

    score=Math.min(1,score);
    const min=data.matcher_config?.minimum_score ?? 0.20;
    if(score<min)continue;
    candidates.push({
      prophet_id:p.id,prophet_name:p.display_name,divine_root:family.root,divine_name:primaryName(family),divine_kind:family.kind,
      score:Number(score.toFixed(3)),evidence:evidenceFor(rootMatch,lexemeMatch,combinedOverlap.length),reasons,
      root_match:rootMatch,lexeme_match:lexemeMatch,concept_overlap:combinedOverlap,method:"automatic_candidate"
    });
  }
  const rank:Record<Evidence,number>={Q5:5,Q4:4,Q3:3,Q2:2,Q1:1,S3:0,S2:0,S1:0,T1:0,E0:0};
  return candidates.sort((a,b)=>rank[b.evidence]-rank[a.evidence]||b.score-a.score||a.divine_name.localeCompare(b.divine_name)).slice(0,max);
}

export function matchAllProphets(data:Dataset):Record<string,MatchCandidate[]> {
  return Object.fromEntries(data.prophet_order.map(id=>{ const p=data.prophets[id]; return [id,p?matchAsmaForProphet(data,p):[]]; }));
}
